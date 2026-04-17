import React, { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { blogPostAPI } from "../../services/api";

interface FormData {
  title: string;
  description: string;
  content: string;
}

interface BlogPostModalProps {
  isEditing: boolean;
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  settlementId?: string;
  postId?: string;
  ensurePostId?: () => Promise<string>;
}

const BlogPostModal: React.FC<BlogPostModalProps> = ({
  isEditing,
  formData,
  onFormDataChange,
  onSubmit,
  onClose,
  settlementId,
  postId,
  ensurePostId,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePickImage = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleImageSelected: React.ChangeEventHandler<
    HTMLInputElement
  > = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;
    if (!settlementId) {
      setUploadError("Lipsește settlementId; nu pot încărca imaginea.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const effectivePostId =
        postId || (ensurePostId ? await ensurePostId() : undefined);

      if (!effectivePostId) {
        setUploadError(
          "Nu am putut obține postId pentru upload (salvează postarea mai întâi).",
        );
        return;
      }

      const { url } = await blogPostAPI.uploadImage(file, {
        settlementId,
        postId: effectivePostId,
      });

      const md = `\n\n![](${url})\n`;
      onFormDataChange({
        ...formData,
        content: (formData.content || "") + md,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload eșuat";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? "Editează Postare" : "Postare Nouă"}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit}>
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
                onFormDataChange({ ...formData, title: e.target.value })
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
                onFormDataChange({ ...formData, description: e.target.value })
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
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handlePickImage}
                disabled={isUploading}
              >
                {isUploading ? "Se încarcă..." : "📷 Încarcă imagine"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={handleImageSelected}
              />
            </div>
            {uploadError && (
              <small style={{ color: "#ef4444", display: "block" }}>
                {uploadError}
              </small>
            )}
            <textarea
              id="content"
              rows={10}
              value={formData.content}
              onChange={(e) =>
                onFormDataChange({ ...formData, content: e.target.value })
              }
              required
              placeholder="Scrie conținutul postării (Markdown suportat)..."
            />
          </div>

          <div className="form-group">
            <label>Preview (Markdown)</label>
            <div
              style={{
                border: "2px solid #e5e7eb",
                borderRadius: 8,
                padding: 12,
                background: "#fff",
                maxHeight: 240,
                overflow: "auto",
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                  ul: (props) => (
                    <ul
                      {...props}
                      style={{
                        listStyleType: "disc",
                        paddingLeft: 20,
                        margin: "8px 0",
                      }}
                    />
                  ),
                  ol: (props) => (
                    <ol
                      {...props}
                      style={{
                        listStyleType: "decimal",
                        paddingLeft: 20,
                        margin: "8px 0",
                      }}
                    />
                  ),
                  li: (props) => <li {...props} style={{ margin: "4px 0" }} />,
                  img: (props) => (
                    <img
                      {...props}
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  ),
                }}
              >
                {formData.content || ""}
              </ReactMarkdown>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Anulează
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? "Salvează" : "Publică"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogPostModal;
