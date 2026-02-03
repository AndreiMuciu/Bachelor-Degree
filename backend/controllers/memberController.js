import Member from "../models/memberModel.js";
import { getOne, getAll, createOne } from "./handleFactory.js";

import {
  r2DeleteObject,
  r2GetObject,
  r2GetSignedReadUrl,
  r2PutObject,
} from "../utils/r2.js";

export const getAllMembers = getAll(Member);
export const getMember = getOne(Member);
export const createMember = createOne(Member);

const MEMBER_PROFILE_KEY = (memberId) => `members/${memberId}/profile`;

export const updateMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        status: "fail",
        message: "No document found with that ID",
      });
    }

    if (req.body?.photoPath) delete req.body.photoPath;

    if (req.file) {
      const key = MEMBER_PROFILE_KEY(member._id);

      await r2PutObject({
        key,
        body: req.file.buffer,
        contentType: req.file.mimetype,
      });

      req.body.photoPath = key;
    }

    const updated = await Member.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        data: updated,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        status: "fail",
        message: "No document found with that ID",
      });
    }

    // Delete the stored photo (if any)
    if (member.photoPath) {
      await r2DeleteObject(member.photoPath);
    }

    await Member.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

export const getMemberPhoto = async (req, res) => {
  try {
    // Allow embedding this resource cross-origin (e.g. frontend :5173 -> backend :5000)
    // Helmet sets Cross-Origin-Resource-Policy: same-origin by default, which blocks <img>.
    res.set("Cross-Origin-Resource-Policy", "cross-origin");

    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        status: "fail",
        message: "No document found with that ID",
      });
    }

    if (!member.photoPath) {
      return res.status(404).json({
        status: "fail",
        message: "Member has no photo",
      });
    }

    const redirect =
      req.query.redirect === undefined ||
      req.query.redirect === "1" ||
      req.query.redirect === "true";

    if (redirect) {
      const { url } = await r2GetSignedReadUrl({
        key: member.photoPath,
        expiresInSeconds: 300,
      });
      return res.redirect(url);
    }

    // Stream the object through the backend (avoids client-side R2 access / signed URL caching issues)
    const obj = await r2GetObject({ key: member.photoPath });
    if (!obj || !obj.Body) {
      return res.status(404).json({
        status: "fail",
        message: "Photo not found",
      });
    }

    // Allow caching at the edge; change if you want stricter behavior.
    res.set("Cache-Control", "public, max-age=3600");

    if (obj.ContentType) res.set("Content-Type", obj.ContentType);
    if (obj.ETag) res.set("ETag", obj.ETag);
    if (typeof obj.ContentLength === "number") {
      res.set("Content-Length", String(obj.ContentLength));
    }

    // Node: obj.Body is a Readable stream
    if (typeof obj.Body.pipe === "function") {
      obj.Body.on("error", (e) => {
        console.error("R2 stream error:", e);
        if (!res.headersSent) res.status(500);
        res.end();
      });
      return obj.Body.pipe(res);
    }

    // Fallback for runtimes where Body isn't a Node stream
    if (typeof obj.Body.transformToByteArray === "function") {
      const bytes = await obj.Body.transformToByteArray();
      return res.send(Buffer.from(bytes));
    }

    return res.send(obj.Body);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
