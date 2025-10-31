import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "A blog post must have a title"],
    maxLength: [
      30,
      "A blog post title must have less or equal than 30 characters",
    ],
  },
  description: {
    type: String,
    required: [true, "A blog post must have a description"],
    maxLength: [
      100,
      "A blog post description must have less or equal than 100 characters",
    ],
  },
  content: {
    type: String,
    required: [true, "A blog post must have content"],
  },
  settlement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Settlement",
    required: [true, "A blog post must be associated with a settlement"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

export default BlogPost;
