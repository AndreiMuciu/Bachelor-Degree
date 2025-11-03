import React from "react";

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
}

const BlogPostModal: React.FC<BlogPostModalProps> = ({
  isEditing,
  formData,
  onFormDataChange,
  onSubmit,
  onClose,
}) => {
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
            <textarea
              id="content"
              rows={10}
              value={formData.content}
              onChange={(e) =>
                onFormDataChange({ ...formData, content: e.target.value })
              }
              required
              placeholder="Scrie conținutul postării..."
            />
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
