import React from "react";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionButton,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionButton && (
        <button
          className="btn-secondary btn-large"
          onClick={actionButton.onClick}
        >
          {actionButton.text}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
