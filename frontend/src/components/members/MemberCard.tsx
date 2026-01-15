import React from "react";
import type { Member } from "../../types";

interface MemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onEdit,
  onDelete,
}) => {
  const fullName = `${member.firstName} ${member.lastName}`;
  const birthDate = new Date(member.dateOfBirth).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="member-card">
      <div className="member-header">
        <div className="member-avatar-placeholder">
          <span>👤</span>
        </div>
      </div>
      <h3>{fullName}</h3>
      {member.position && <p className="member-position">{member.position}</p>}
      <div className="member-info">
        <span>📅 Născut: {birthDate}</span>
        {member.gender && <span>⚧ {member.gender}</span>}
      </div>
      {member.description && (
        <div className="member-description-preview">
          {member.description.substring(0, 100)}
          {member.description.length > 100 && "..."}
        </div>
      )}
      <div className="member-actions">
        <button className="btn-edit" onClick={() => onEdit(member)}>
          <span>✏️</span> Editează
        </button>
        <button className="btn-delete" onClick={() => onDelete(member._id)}>
          <span>🗑️</span> Șterge
        </button>
      </div>
    </div>
  );
};

export default MemberCard;
