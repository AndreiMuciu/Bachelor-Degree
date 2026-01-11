import React from "react";

interface MemberFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  description: string;
  gender: string;
  position: string;
}

interface MemberModalProps {
  isEditing: boolean;
  formData: MemberFormData;
  onFormDataChange: (data: MemberFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const MemberModal: React.FC<MemberModalProps> = ({
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
          <h2>{isEditing ? "Editează Membru" : "Membru Nou"}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="firstName">
              Prenume <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              maxLength={50}
              value={formData.firstName}
              onChange={(e) =>
                onFormDataChange({ ...formData, firstName: e.target.value })
              }
              required
              placeholder="Ex: Ion"
            />
            <small>{(formData.firstName || "").length}/50 caractere</small>
          </div>

          <div className="form-group">
            <label htmlFor="lastName">
              Nume <span className="required">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              maxLength={50}
              value={formData.lastName}
              onChange={(e) =>
                onFormDataChange({ ...formData, lastName: e.target.value })
              }
              required
              placeholder="Ex: Popescu"
            />
            <small>{(formData.lastName || "").length}/50 caractere</small>
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">
              Data Nașterii <span className="required">*</span>
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={(e) =>
                onFormDataChange({ ...formData, dateOfBirth: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="position">Poziție</label>
            <input
              type="text"
              id="position"
              maxLength={50}
              value={formData.position}
              onChange={(e) =>
                onFormDataChange({ ...formData, position: e.target.value })
              }
              placeholder="Ex: Primar, Viceprimar, Secretar"
            />
            <small>{(formData.position || "").length}/50 caractere</small>
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gen</label>
            <input
              type="text"
              id="gender"
              maxLength={30}
              value={formData.gender}
              onChange={(e) =>
                onFormDataChange({ ...formData, gender: e.target.value })
              }
              placeholder="Ex: Masculin, Feminin, Nespecificat"
            />
            <small>{(formData.gender || "").length}/30 caractere</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descriere</label>
            <textarea
              id="description"
              rows={5}
              value={formData.description}
              onChange={(e) =>
                onFormDataChange({ ...formData, description: e.target.value })
              }
              placeholder="Scrie o scurtă descriere despre membru..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Anulează
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? "Salvează" : "Adaugă"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberModal;
