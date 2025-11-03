import React from "react";

interface HelpCardProps {
  title: string;
  children: React.ReactNode;
}

const HelpCard: React.FC<HelpCardProps> = ({ title, children }) => {
  return (
    <div className="help-card">
      <h3>{title}</h3>
      {children}
    </div>
  );
};

export default HelpCard;
