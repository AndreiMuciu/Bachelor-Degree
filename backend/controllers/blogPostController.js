import BlogPost from "../models/blogPostModel.js";
import {
  updateOne,
  getOne,
  getAll,
  deleteOne,
  createOne,
} from "./handleFactory.js";

export const getAllBlogPosts = getAll(BlogPost);
export const getBlogPost = getOne(BlogPost);
export const createBlogPost = createOne(BlogPost);
export const updateBlogPost = updateOne(BlogPost);
export const deleteBlogPost = deleteOne(BlogPost);
