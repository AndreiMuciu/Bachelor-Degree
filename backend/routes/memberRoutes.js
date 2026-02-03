import express from "express";
import multer from "multer";
import {
  getAllMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  getMemberPhoto,
} from "./../controllers/memberController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ]);

    if (!allowed.has(file.mimetype)) {
      return cb(new Error("Invalid file type. Only jpeg, png, webp allowed."));
    }

    cb(null, true);
  },
});

const uploadSinglePhoto = (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        status: "fail",
        message: err.message,
      });
    }
    next();
  });
};

router.route("/").get(getAllMembers).post(createMember);

router.get("/:id/photo", getMemberPhoto);

router
  .route("/:id")
  .get(getMember)
  .patch(uploadSinglePhoto, updateMember)
  .delete(deleteMember);

export default router;
