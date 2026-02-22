import express from "express";
import {
  getAllBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "./../controllers/blogPostController.js";
import { protect } from "./../controllers/authController.js";

const router = express.Router();

router.route("/").get(getAllBlogPosts).post(protect, createBlogPost);

router
  .route("/:id")
  .get(getBlogPost)
  .patch(protect, updateBlogPost)
  .delete(protect, deleteBlogPost);

export default router;
