import React from "react";

interface ComponentType {
  type: string;
  label: string;
  icon: string;
}

interface ComponentSelectorProps {
  componentTypes: ComponentType[];
  selectedType: string;
  onSelectType: (type: string) => void;
  onAddComponent: () => void;
  onCancel: () => void;
}

const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  componentTypes,
  selectedType,
  onSelectType,
  onAddComponent,
  onCancel,
}) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Adaugă Componentă</h2>
          <button className="modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div className="component-types">
          {componentTypes.map((type) => (
            <button
              key={type.type}
              className={`component-type-btn ${
                selectedType === type.type ? "selected" : ""
              }`}
              onClick={() => onSelectType(type.type)}
            >
              <span className="component-icon">{type.icon}</span>
              <span className="component-label">{type.label}</span>
            </button>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Anulează
          </button>
          <button
            className="btn-primary"
            onClick={onAddComponent}
            disabled={!selectedType}
          >
            Adaugă
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentSelector;
