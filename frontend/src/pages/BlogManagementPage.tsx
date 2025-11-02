import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { blogPostAPI } from "../services/api";
import type { BlogPost } from "../types";
import "../styles/BlogManagement.css";

const BlogManagementPage: React.FC = () => {
  const { settlementId } = useParams<{ settlementId: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
  });

  useEffect(() => {
    fetchPosts();
  }, [settlementId]);

  const fetchPosts = async () => {
    if (!settlementId) return;
    try {
      const data = await blogPostAPI.getBySettlement(settlementId);
      setPosts(data);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementId) return;

    try {
      if (editingPost) {
        await blogPostAPI.update(editingPost._id, formData);
      } else {
        await blogPostAPI.create({ ...formData, settlement: settlementId });
      }
      await fetchPosts();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving blog post:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ești sigur că vrei să ștergi această postare?")) return;

    try {
      await blogPostAPI.delete(id);
      await fetchPosts();
    } catch (error) {
      console.error("Error deleting blog post:", error);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      description: post.description,
      content: post.content,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPost(null);
    setFormData({ title: "", description: "", content: "" });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Filter posts based on search query
  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.description.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query)
    );
  });

  return (
    <div className="blog-management-container">
      <div className="blog-header">
        <div className="blog-header-content">
          <h1>📝 Gestionare Blog</h1>
          <p className="blog-subtitle">
            {posts.length === 0
              ? "Începe să creezi conținut captivant pentru vizitatori"
              : `${posts.length} ${
                  posts.length === 1 ? "postare publicată" : "postări publicate"
                }`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <span className="btn-icon">➕</span>
          <span>Postare Nouă</span>
        </button>
      </div>

      {posts.length > 0 && (
        <div className="search-container">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Caută în postări (titlu, descriere, conținut)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery("")}
                title="Șterge căutarea"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="search-results-info">
              {filteredPosts.length === 0
                ? "Nicio postare găsită"
                : `${filteredPosts.length} ${
                    filteredPosts.length === 1
                      ? "postare găsită"
                      : "postări găsite"
                  }`}
            </p>
          )}
        </div>
      )}

      <div className="blog-posts-grid">
        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✨</div>
            <h2>Blogul tău așteaptă</h2>
            <p>Creează prima postare și începe să împărtășești povești!</p>
            <button
              className="btn-primary btn-large"
              onClick={() => setShowModal(true)}
            >
              <span className="btn-icon">➕</span>
              Creează Prima Postare
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>Nicio postare găsită</h2>
            <p>Încearcă alt termen de căutare</p>
            <button
              className="btn-secondary btn-large"
              onClick={() => setSearchQuery("")}
            >
              Resetează căutarea
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post._id} className="blog-post-card">
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
                {post.content.substring(0, 150)}
                {post.content.length > 150 && "..."}
              </div>
              <div className="post-actions">
                <button className="btn-edit" onClick={() => handleEdit(post)}>
                  <span>✏️</span> Editează
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(post._id)}
                >
                  <span>🗑️</span> Șterge
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPost ? "Editează Postare" : "Postare Nouă"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">
                  Titlu <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  maxLength={30}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="Max 30 caractere"
                />
                <small>{formData.title.length}/30 caractere</small>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  Descriere scurtă <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="description"
                  maxLength={100}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  placeholder="Max 100 caractere"
                />
                <small>{formData.description.length}/100 caractere</small>
              </div>

              <div className="form-group">
                <label htmlFor="content">
                  Conținut <span className="required">*</span>
                </label>
                <textarea
                  id="content"
                  rows={10}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  required
                  placeholder="Scrie conținutul postării..."
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                >
                  Anulează
                </button>
                <button type="submit" className="btn-primary">
                  {editingPost ? "Salvează" : "Publică"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManagementPage;
