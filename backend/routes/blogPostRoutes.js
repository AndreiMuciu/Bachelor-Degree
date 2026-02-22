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

// All blog post routes require authentication
router.use(protect);

router.route("/").get(getAllBlogPosts).post(createBlogPost);

router
  .route(":id")
  .get(getBlogPost)
  .patch(updateBlogPost)
  .delete(deleteBlogPost);

export default router;
