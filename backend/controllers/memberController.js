import Member from "../models/memberModel.js";
import { getOne, getAll, createOne } from "./handleFactory.js";

import { r2DeleteObject, r2PutObject } from "../utils/r2.js";

export const getAllMembers = getAll(Member);
export const getMember = getOne(Member);
export const createMember = createOne(Member);

const MEMBER_PROFILE_KEY = (memberId) => `${memberId}/profile`;

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
        cacheControl: "no-cache, no-store, must-revalidate",
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

    // Redirect to public R2 custom domain
    const publicUrl = `https://r2.bachelordegree.tech/${member.photoPath}`;
    return res.redirect(publicUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
