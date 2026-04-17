import express from "express";
import multer from "multer";
import {
  getAllBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadBlogImage,
  cleanupUnusedSettlementBlogImages,
} from "./../controllers/blogPostController.js";
import { protect, restrictTo } from "./../controllers/authController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
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

const uploadSingleImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        status: "fail",
        message: err.message,
      });
    }
    next();
  });
};

router.post("/images", protect, uploadSingleImage, uploadBlogImage);
router.post(
  "/images/cleanup-unused",
  protect,
  restrictTo("admin"),
  cleanupUnusedSettlementBlogImages,
);

router.route("/").get(getAllBlogPosts).post(protect, createBlogPost);

router
  .route("/:id")
  .get(getBlogPost)
  .patch(protect, updateBlogPost)
  .delete(protect, deleteBlogPost);

export default router;
