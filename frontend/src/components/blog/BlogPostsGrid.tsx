import React from "react";
import BlogPostCard from "./BlogPostCard";
import type { BlogPost } from "../../types";

interface BlogPostsGridProps {
  posts: BlogPost[];
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
}

const BlogPostsGrid: React.FC<BlogPostsGridProps> = ({
  posts,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="blog-posts-grid">
      {posts.map((post) => (
        <BlogPostCard
          key={post._id}
          post={post}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default BlogPostsGrid;
