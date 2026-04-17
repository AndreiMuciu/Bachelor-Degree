import React from "react";
import type { BlogPost } from "../../types";

interface BlogPostCardProps {
  post: BlogPost;
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({
  post,
  onEdit,
  onDelete,
}) => {
  const contentPreview = (post.content || "")
    // remove fenced code blocks
    .replace(/```[\s\S]*?```/g, " ")
    // images
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    // links -> keep text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // inline code
    .replace(/`([^`]+)`/g, "$1")
    // basic markdown punctuation
    .replace(/[>#*_~-]+/g, " ")
    // HTML tags (if any)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <div className="blog-post-card">
      <div className="post-header">
        <div className="post-date">
          📅{" "}
          {new Date(post.date).toLocaleDateString("ro-RO", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
        <div className="post-badge">Publicat</div>
      </div>
      <h3>{post.title}</h3>
      <p className="post-description">{post.description}</p>
      <div className="post-content-preview">
        {contentPreview.substring(0, 150)}
        {contentPreview.length > 150 && "..."}
      </div>
      <div className="post-actions">
        <button className="btn-edit" onClick={() => onEdit(post)}>
          <span>✏️</span> Editează
        </button>
        <button className="btn-delete" onClick={() => onDelete(post._id)}>
          <span>🗑️</span> Șterge
        </button>
      </div>
    </div>
  );
};

export default BlogPostCard;
