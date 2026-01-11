import React from "react";
import type { Member } from "../../types";
import MemberCard from "./MemberCard";

interface MembersGridProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
}

const MembersGrid: React.FC<MembersGridProps> = ({
  members,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="members-grid">
      {members.map((member) => (
        <MemberCard
          key={member._id}
          member={member}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default MembersGrid;
