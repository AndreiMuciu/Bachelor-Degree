import React from "react";

interface BlogHeaderProps {
  postsCount: number;
  onCreateNew: () => void;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ postsCount, onCreateNew }) => {
  return (
    <div className="blog-header">
      <div className="blog-header-content">
        <h1>📝 Gestionare Blog</h1>
        <p className="blog-subtitle">
          {postsCount === 0
            ? "Începe să creezi conținut captivant pentru vizitatori"
            : `${postsCount} ${
                postsCount === 1 ? "postare publicată" : "postări publicate"
              }`}
        </p>
      </div>
      <button className="btn-primary" onClick={onCreateNew}>
        <span className="btn-icon">➕</span>
        <span>Postare Nouă</span>
      </button>
    </div>
  );
};

export default BlogHeader;
