import React from "react";

interface PreviewModeControlsProps {
  previewMode: "desktop" | "tablet" | "mobile";
  onPreviewModeChange: (mode: "desktop" | "tablet" | "mobile") => void;
}

const PreviewModeControls: React.FC<PreviewModeControlsProps> = ({
  previewMode,
  onPreviewModeChange,
}) => {
  return (
    <div className="preview-controls">
      <button
        className={`preview-btn ${previewMode === "desktop" ? "active" : ""}`}
        onClick={() => onPreviewModeChange("desktop")}
        title="Desktop"
      >
        🖥️
      </button>
      <button
        className={`preview-btn ${previewMode === "tablet" ? "active" : ""}`}
        onClick={() => onPreviewModeChange("tablet")}
        title="Tablet"
      >
        📱
      </button>
      <button
        className={`preview-btn ${previewMode === "mobile" ? "active" : ""}`}
        onClick={() => onPreviewModeChange("mobile")}
        title="Mobile"
      >
        📱
      </button>
    </div>
  );
};

export default PreviewModeControls;
