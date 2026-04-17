import BlogPost from "../models/blogPostModel.js";
import { getOne, getAll, createOne } from "./handleFactory.js";

import crypto from "crypto";
import { r2DeleteByPrefix, r2PutObject } from "../utils/r2.js";

export const getAllBlogPosts = getAll(BlogPost);
export const getBlogPost = getOne(BlogPost);
export const createBlogPost = createOne(BlogPost);

const R2_PUBLIC_HOST = "r2.bachelordegree.tech";

const extractR2KeysFromText = (text) => {
  const input = String(text || "");
  const keys = new Set();

  // Grab any URL pointing to our R2 public host.
  // Works for Markdown images, plain URLs, and HTML <img src="...">.
  const urlRegex = new RegExp(
    `https?:\\/\\/${R2_PUBLIC_HOST}\\/([^\\s"')>]+)`,
    "gi",
  );

  let match;
  while ((match = urlRegex.exec(input)) !== null) {
    const key = match[1];
    if (key) keys.add(key);
  }

  return Array.from(keys);
};

const cleanupUnusedPostImages = async ({ settlementId, postId, content }) => {
  if (!settlementId || !postId) return;

  const safeSettlementId = String(settlementId).trim();
  const safePostId = String(postId).trim();
  const prefix = `settlements/${safeSettlementId}/blog/posts/${safePostId}/images/`;

  const referencedKeys = extractR2KeysFromText(content)
    .map((k) => k.replace(/^\/+/, ""))
    .filter((k) => k.startsWith(prefix));

  await r2DeleteByPrefix(prefix, { keepKeys: referencedKeys });
};

export const updateBlogPost = async (req, res) => {
  try {
    const existing = await BlogPost.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        status: "fail",
        message: "No document found with that ID",
      });
    }

    const doc = await BlogPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return res.status(404).json({
        status: "fail",
        message: "No document found with that ID",
      });
    }

    // Best-effort cleanup of unused images for this post.
    await cleanupUnusedPostImages({
      settlementId: doc.settlement || existing.settlement,
      postId: doc._id,
      content: doc.content,
    });

    return res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

export const deleteBlogPost = async (req, res) => {
  try {
    const doc = await BlogPost.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        status: "fail",
        message: "No document found with that ID",
      });
    }

    // Delete all images under this post's prefix in R2 before deleting the post.
    await cleanupUnusedPostImages({
      settlementId: doc.settlement,
      postId: doc._id,
      content: "", // keep none -> delete all under prefix
    });

    await BlogPost.findByIdAndDelete(req.params.id);

    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

export const cleanupUnusedSettlementBlogImages = async (req, res) => {
  try {
    const settlementId =
      req.body?.settlementId || req.query?.settlementId || req.body?.settlement;

    if (!settlementId) {
      return res.status(400).json({
        status: "fail",
        message: "settlementId is required",
      });
    }

    const safeSettlementId = String(settlementId).trim();
    const legacyPrefix = `settlements/${safeSettlementId}/blog/images/`;

    const posts = await BlogPost.find({ settlement: settlementId }).select(
      "content",
    );

    const referenced = new Set();
    for (const post of posts) {
      for (const key of extractR2KeysFromText(post.content)) {
        const normalized = String(key).replace(/^\/+/, "");
        if (normalized.startsWith(legacyPrefix)) referenced.add(normalized);
      }
    }

    const result = await r2DeleteByPrefix(legacyPrefix, {
      keepKeys: Array.from(referenced),
    });

    return res.status(200).json({
      status: "success",
      data: {
        prefix: legacyPrefix,
        ...result,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

const extFromMime = (mime) => {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
};

const blogImageKey = ({ settlementId, postId, ext }) => {
  const safeSettlementId = settlementId ? String(settlementId).trim() : null;
  const safePostId = postId ? String(postId).trim() : null;
  const id = crypto.randomUUID();

  const prefix = safeSettlementId
    ? `settlements/${safeSettlementId}/blog`
    : "blog";

  if (safePostId) {
    return `${prefix}/posts/${safePostId}/images/${id}${ext}`;
  }
  return `${prefix}/images/${id}${ext}`;
};

export const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "Missing image file",
      });
    }

    const settlementId = req.body?.settlementId || req.body?.settlement;
    const postId = req.body?.postId;

    if (!settlementId || !postId) {
      return res.status(400).json({
        status: "fail",
        message: "settlementId and postId are required",
      });
    }

    const ext = extFromMime(req.file.mimetype);
    const key = blogImageKey({ settlementId, postId, ext });

    await r2PutObject({
      key,
      body: req.file.buffer,
      contentType: req.file.mimetype,
      cacheControl: "public, max-age=31536000, immutable",
    });

    const url = `https://r2.bachelordegree.tech/${key}`;

    return res.status(201).json({
      status: "success",
      data: { url, key },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
