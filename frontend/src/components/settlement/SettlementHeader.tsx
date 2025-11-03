import React from "react";

interface SettlementHeaderProps {
  settlementName: string;
  isActive: boolean;
  onToggleActive: () => void;
  onManageBlog: () => void;
  onAddComponent: () => void;
  onViewCode: () => void;
  onCustomizeStyles: () => void;
}

const SettlementHeader: React.FC<SettlementHeaderProps> = ({
  settlementName,
  isActive,
  onToggleActive,
  onManageBlog,
  onAddComponent,
  onViewCode,
  onCustomizeStyles,
}) => {
  return (
    <div className="settlement-header">
      <div className="settlement-info">
        <h1>{settlementName}</h1>
        <div className="settlement-actions">
          <button
            className={`btn-toggle ${isActive ? "active" : "inactive"}`}
            onClick={onToggleActive}
          >
            {isActive ? "✓ Website Activ" : "○ Website Inactiv"}
          </button>
          <button className="btn-secondary" onClick={onManageBlog}>
            📝 Gestionează Blog
          </button>
          <button className="btn-primary" onClick={onAddComponent}>
            ➕ Adaugă Componentă
          </button>
          <button className="btn-secondary" onClick={onViewCode}>
            💻 Vezi Cod
          </button>
          <button className="btn-secondary" onClick={onCustomizeStyles}>
            🎨 Personalizează Stiluri
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettlementHeader;
