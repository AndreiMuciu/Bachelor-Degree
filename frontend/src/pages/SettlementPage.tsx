import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { settlementAPI } from "../services/api";
import type { Settlement, WebsiteComponent } from "../types";
import "../styles/Settlement.css";

const defaultComponents: WebsiteComponent[] = [
  {
    id: "1",
    type: "header",
    content: {
      title: `Primăria `,
      links: [
        { text: "Acasă", url: "#" },
        { text: "Despre", url: "#" },
        { text: "Servicii", url: "#" },
        { text: "Contact", url: "#" },
      ],
    },
    position: 0,
    alignment: "center",
  },
  {
    id: "2",
    type: "hero",
    content: {
      title: "Bine ați venit",
      subtitle: "Portal oficial",
    },
    position: 1,
    alignment: "center",
  },
];

const componentTypes = [
  { type: "header", label: "Header", icon: "📋" },
  { type: "hero", label: "Hero Section", icon: "🎯" },
  { type: "about", label: "Despre", icon: "📝" },
  { type: "services", label: "Servicii", icon: "⚙️" },
  { type: "contact", label: "Contact", icon: "📞" },
  { type: "footer", label: "Footer", icon: "📄" },
];

const SettlementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState<WebsiteComponent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedComponentType, setSelectedComponentType] =
    useState<string>("");
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");

  useEffect(() => {
    const fetchSettlement = async () => {
      if (!id) {
        console.log("SettlementPage - No ID provided");
        return;
      }
      console.log("SettlementPage - Fetching settlement with ID:", id);
      try {
        const data = await settlementAPI.getById(id);
        console.log("SettlementPage - Settlement fetched:", data);
        setSettlement(data);
      } catch (error) {
        console.error("Error fetching settlement:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettlement();
  }, [id]);

  const handleCreateWebsite = () => {
    const customizedComponents = defaultComponents.map((comp) => {
      if (comp.type === "header") {
        return {
          ...comp,
          content: {
            ...comp.content,
            title: `Primăria ${settlement?.name || ""}`,
          },
        };
      }
      return comp;
    });
    setComponents(customizedComponents);
  };

  const handleAddComponent = () => {
    setShowModal(true);
  };

  const handleConfirmAddComponent = () => {
    if (!selectedComponentType) return;

    const newComponent: WebsiteComponent = {
      id: Date.now().toString(),
      type: selectedComponentType as any,
      content: {
        title: `Titlu ${selectedComponentType}`,
        description: "Descriere...",
      },
      position: components.length,
      alignment: "center",
    };

    setComponents([...components, newComponent]);
    setShowModal(false);
    setSelectedComponentType("");
  };

  const handleDeleteComponent = (id: string) => {
    setComponents(components.filter((c) => c.id !== id));
  };

  const handleMoveComponent = (id: string, direction: "up" | "down") => {
    const index = components.findIndex((c) => c.id === id);
    if (index === -1) return;

    const newComponents = [...components];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newComponents.length) return;

    [newComponents[index], newComponents[targetIndex]] = [
      newComponents[targetIndex],
      newComponents[index],
    ];

    setComponents(newComponents.map((c, i) => ({ ...c, position: i })));
  };

  const handleChangeAlignment = (
    id: string,
    alignment: "left" | "center" | "right"
  ) => {
    setComponents(
      components.map((c) => (c.id === id ? { ...c, alignment } : c))
    );
  };

  const renderComponentPreview = (component: WebsiteComponent) => {
    const alignmentClass = `align-${component.alignment}`;

    switch (component.type) {
      case "header":
        return (
          <div
            className={`preview-component component-header-preview ${alignmentClass}`}
          >
            <h3>{component.content.title || "Header"}</h3>
            {component.content.links && (
              <div style={{ marginTop: "10px" }}>
                {component.content.links.map((link, i) => (
                  <span key={i} style={{ margin: "0 10px", color: "white" }}>
                    {link.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case "hero":
        return (
          <div className={`preview-component component-hero ${alignmentClass}`}>
            <h1>{component.content.title || "Titlu Hero"}</h1>
            <p>{component.content.subtitle || "Subtitle"}</p>
          </div>
        );

      case "about":
        return (
          <div
            className={`preview-component component-about ${alignmentClass}`}
          >
            <h2>{component.content.title || "Despre Noi"}</h2>
            <p>
              {component.content.description ||
                "Descriere despre localitate..."}
            </p>
          </div>
        );

      case "services":
        return (
          <div
            className={`preview-component component-services ${alignmentClass}`}
          >
            <h2>{component.content.title || "Servicii"}</h2>
            <p>
              {component.content.description ||
                "Lista serviciilor disponibile..."}
            </p>
          </div>
        );

      case "contact":
        return (
          <div
            className={`preview-component component-contact ${alignmentClass}`}
          >
            <h2>{component.content.title || "Contact"}</h2>
            <p>{component.content.description || "Informații de contact..."}</p>
          </div>
        );

      case "footer":
        return (
          <div
            className={`preview-component component-footer ${alignmentClass}`}
          >
            <p>© 2025 {settlement?.name}. Toate drepturile rezervate.</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!settlement) {
    return <div>Settlement not found</div>;
  }

  const previewWidth =
    previewMode === "desktop"
      ? "100%"
      : previewMode === "tablet"
      ? "768px"
      : "375px";

  return (
    <div className="settlement-page">
      <div className="settlement-header">
        <div className="settlement-header-content">
          <div className="settlement-info">
            <h1>{settlement.name}</h1>
            <p>
              {settlement.judet} • Lat: {settlement.lat}, Lng: {settlement.lng}
            </p>
          </div>
          <div className="header-actions">
            <Link to="/" className="btn-back">
              ← Înapoi
            </Link>
            {components.length > 0 && (
              <button className="btn-save">Salvează</button>
            )}
          </div>
        </div>
      </div>

      <div className="settlement-content">
        <div className="builder-panel">
          <h2>Constructor Website</h2>

          {!settlement.active && components.length === 0 ? (
            <div className="create-website-section">
              <div className="create-icon">🌐</div>
              <h3>Creează Website</h3>
              <p>Website-ul nu este încă activ. Începe să construiești!</p>
              <button className="btn-create" onClick={handleCreateWebsite}>
                Creează Website
              </button>
            </div>
          ) : (
            <>
              <div className="components-list">
                {components.map((component, index) => (
                  <div key={component.id} className="component-item">
                    <div className="component-header">
                      <span className="component-type">
                        {
                          componentTypes.find((t) => t.type === component.type)
                            ?.icon
                        }{" "}
                        {
                          componentTypes.find((t) => t.type === component.type)
                            ?.label
                        }
                      </span>
                      <div className="component-controls">
                        {index > 0 && (
                          <button
                            className="btn-icon"
                            onClick={() =>
                              handleMoveComponent(component.id, "up")
                            }
                            title="Mută în sus"
                          >
                            ↑
                          </button>
                        )}
                        {index < components.length - 1 && (
                          <button
                            className="btn-icon"
                            onClick={() =>
                              handleMoveComponent(component.id, "down")
                            }
                            title="Mută în jos"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteComponent(component.id)}
                          title="Șterge"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="component-alignment">
                      <button
                        className={`btn-alignment ${
                          component.alignment === "left" ? "active" : ""
                        }`}
                        onClick={() =>
                          handleChangeAlignment(component.id, "left")
                        }
                      >
                        ← Stânga
                      </button>
                      <button
                        className={`btn-alignment ${
                          component.alignment === "center" ? "active" : ""
                        }`}
                        onClick={() =>
                          handleChangeAlignment(component.id, "center")
                        }
                      >
                        ⬌ Centru
                      </button>
                      <button
                        className={`btn-alignment ${
                          component.alignment === "right" ? "active" : ""
                        }`}
                        onClick={() =>
                          handleChangeAlignment(component.id, "right")
                        }
                      >
                        Dreapta →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="add-component">
                <button
                  className="btn-add-component"
                  onClick={handleAddComponent}
                >
                  + Adaugă Componentă
                </button>
              </div>
            </>
          )}
        </div>

        <div className="preview-panel">
          <div className="preview-header">
            <h2>Preview</h2>
            <div className="preview-modes">
              <button
                className={`btn-mode ${
                  previewMode === "desktop" ? "active" : ""
                }`}
                onClick={() => setPreviewMode("desktop")}
              >
                🖥️ Desktop
              </button>
              <button
                className={`btn-mode ${
                  previewMode === "tablet" ? "active" : ""
                }`}
                onClick={() => setPreviewMode("tablet")}
              >
                📱 Tablet
              </button>
              <button
                className={`btn-mode ${
                  previewMode === "mobile" ? "active" : ""
                }`}
                onClick={() => setPreviewMode("mobile")}
              >
                📱 Mobile
              </button>
            </div>
          </div>
          <div
            className="preview-content"
            style={{ maxWidth: previewWidth, margin: "0 auto" }}
          >
            {components.length > 0 ? (
              components.map((component) => (
                <div key={component.id}>
                  {renderComponentPreview(component)}
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#999",
                }}
              >
                <p>Preview-ul va apărea aici după ce adaugi componente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Selectează Tipul de Componentă</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="component-type-selector">
                {componentTypes.map((type) => (
                  <div
                    key={type.type}
                    className={`component-type-option ${
                      selectedComponentType === type.type ? "selected" : ""
                    }`}
                    onClick={() => setSelectedComponentType(type.type)}
                  >
                    <span>{type.icon}</span>
                    <p>{type.label}</p>
                  </div>
                ))}
              </div>
              <button
                className="btn-primary"
                onClick={handleConfirmAddComponent}
                disabled={!selectedComponentType}
                style={{ marginTop: "16px", width: "100%" }}
              >
                Adaugă Componentă
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementPage;
