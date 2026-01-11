import React from "react";

interface MemberHeaderProps {
  membersCount: number;
  onCreateNew: () => void;
}

const MemberHeader: React.FC<MemberHeaderProps> = ({
  membersCount,
  onCreateNew,
}) => {
  return (
    <div className="member-header-container">
      <div className="member-header-content">
        <h1>👥 Membrii Echipei</h1>
        <p className="member-header-subtitle">
          Gestionează membrii echipei tale
          {membersCount > 0 &&
            ` · ${membersCount} ${membersCount === 1 ? "membru" : "membri"}`}
        </p>
      </div>
      <button className="btn-create-member" onClick={onCreateNew}>
        <span>➕</span> Adaugă Membru
      </button>
    </div>
  );
};

export default MemberHeader;
