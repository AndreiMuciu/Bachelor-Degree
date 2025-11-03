import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { blogPostAPI } from "../services/api";
import type { BlogPost } from "../types";
import BlogHeader from "../components/blog/BlogHeader";
import BlogSearchBox from "../components/blog/BlogSearchBox";
import BlogPostsGrid from "../components/blog/BlogPostsGrid";
import BlogPostModal from "../components/blog/BlogPostModal";
import EmptyState from "../components/dashboard/EmptyState";
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
      <BlogHeader
        postsCount={posts.length}
        onCreateNew={() => setShowModal(true)}
      />

      {posts.length > 0 && (
        <BlogSearchBox
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultsCount={filteredPosts.length}
        />
      )}

      {posts.length === 0 ? (
        <EmptyState
          icon="✨"
          title="Blogul tău așteaptă"
          description="Creează prima postare și începe să împărtășești povești!"
          actionButton={{
            text: "Creează Prima Postare",
            onClick: () => setShowModal(true),
          }}
        />
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Nicio postare găsită"
          description="Încearcă alt termen de căutare"
          actionButton={{
            text: "Resetează căutarea",
            onClick: () => setSearchQuery(""),
          }}
        />
      ) : (
        <BlogPostsGrid
          posts={filteredPosts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {showModal && (
        <BlogPostModal
          isEditing={editingPost !== null}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default BlogManagementPage;
