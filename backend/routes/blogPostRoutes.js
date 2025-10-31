import express from "express";
import {
  getAllBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "./../controllers/blogPostController.js";

const router = express.Router();

router.route("/").get(getAllBlogPosts).post(createBlogPost);

router
  .route("/:id")
  .get(getBlogPost)
  .patch(updateBlogPost)
  .delete(deleteBlogPost);

export default router;
