import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { memberAPI } from "../services/api";
import type { Member } from "../types";
import "../styles/MembersPage.css";

const MembersPage: React.FC = () => {
  const { settlementId } = useParams<{ settlementId: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMembers();
  }, [settlementId]);

  const fetchMembers = async () => {
    if (!settlementId) return;
    try {
      const data = await memberAPI.getBySettlement(settlementId);

      // Define position hierarchy
      const positionOrder: { [key: string]: number } = {
        președinte: 1,
        presedinte: 1,
        "vice-președinte": 2,
        "vice-presedinte": 2,
        vicepreședinte: 2,
        vicepresedinte: 2,
        consilier: 3,
        membru: 4,
      };

      // Sort members by position hierarchy, then alphabetically
      const sortedMembers = data
        .sort((a, b) => {
          const posA = (a.position?.toLowerCase() || "").trim();
          const posB = (b.position?.toLowerCase() || "").trim();

          const orderA = positionOrder[posA] || 999;
          const orderB = positionOrder[posB] || 999;

          // If same order level, sort alphabetically by last name
          if (orderA === orderB) {
            return a.lastName.localeCompare(b.lastName);
          }

          return orderA - orderB;
        })
        .slice(0, 5);
      setMembers(sortedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
  };

  const handleCloseModal = () => {
    setSelectedMember(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="members-page-container">
        <div className="members-page-empty">
          <h2>👥 Echipa Noastră</h2>
          <p>Momentan nu există membri adăugați.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="members-page-container">
      <div className="members-page-header">
        <h1>👥 Echipa Noastră</h1>
        <p className="members-page-subtitle">
          Cunoaște echipa care lucrează pentru comunitate
        </p>
      </div>

      <div className="members-preview-grid">
        {members.map((member) => {
          const fullName = `${member.firstName} ${member.lastName}`;
          const showPhoto =
            Boolean(member.photoPath) && !imageErrors[member._id];
          return (
            <div
              key={member._id}
              className="member-preview-card"
              onClick={() => handleMemberClick(member)}
            >
              {showPhoto ? (
                <div className="member-preview-avatar">
                  <img
                    src={memberAPI.getPhotoUrl(member._id)}
                    alt={fullName}
                    onError={() =>
                      setImageErrors((prev) => ({
                        ...prev,
                        [member._id]: true,
                      }))
                    }
                  />
                </div>
              ) : (
                <div className="member-preview-avatar-placeholder">
                  <span>👤</span>
                </div>
              )}
              <h3>{fullName}</h3>
              {member.position && (
                <p className="member-preview-position">{member.position}</p>
              )}
              <button className="member-preview-btn">Vezi detalii →</button>
            </div>
          );
        })}
      </div>

      {selectedMember && (
        <div className="member-modal-overlay" onClick={handleCloseModal}>
          <div
            className="member-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="member-modal-close" onClick={handleCloseModal}>
              ✕
            </button>
            <div className="member-modal-header">
              {Boolean(selectedMember.photoPath) &&
              !imageErrors[selectedMember._id] ? (
                <div className="member-modal-avatar">
                  <img
                    src={memberAPI.getPhotoUrl(selectedMember._id)}
                    alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                    onError={() =>
                      setImageErrors((prev) => ({
                        ...prev,
                        [selectedMember._id]: true,
                      }))
                    }
                  />
                </div>
              ) : (
                <div className="member-modal-avatar-placeholder">
                  <span>👤</span>
                </div>
              )}
              <div className="member-modal-title">
                <h2>{`${selectedMember.firstName} ${selectedMember.lastName}`}</h2>
                {selectedMember.position && (
                  <p className="member-modal-position">
                    {selectedMember.position}
                  </p>
                )}
              </div>
            </div>
            <div className="member-modal-body">
              <div className="member-modal-info">
                <div className="info-item">
                  <span className="info-icon">📅</span>
                  <span>
                    Născut:{" "}
                    {new Date(selectedMember.dateOfBirth).toLocaleDateString(
                      "ro-RO",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
                {selectedMember.gender &&
                  selectedMember.gender !== "nespecificat" && (
                    <div className="info-item">
                      <span className="info-icon">⚧</span>
                      <span>{selectedMember.gender}</span>
                    </div>
                  )}
              </div>
              {selectedMember.description && (
                <>
                  <h3>Despre</h3>
                  <p className="member-modal-description">
                    {selectedMember.description}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
