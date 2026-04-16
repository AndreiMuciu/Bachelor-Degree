import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  settlementAPI,
  blogPostAPI,
  memberAPI,
  eventAPI,
  n8nAPI,
  coordinatesAPI,
  adminAPI,
} from "../services/api";
import type {
  Settlement,
  WebsiteComponent,
  BlogPost,
  Member,
  Coordinate,
  Event,
} from "../types";
import "../styles/Settlement.css";
import { useAuth } from "../contexts/AuthContext";

// Fix pentru iconițele Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Creare iconiță personalizată frumoasă pentru coordonate
const createCustomIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 16px;
          color: white;
        ">📍</span>
      </div>
    `,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component for handling map clicks
function MapClickHandler({
  onClick,
  enabled,
}: {
  onClick: (lat: number, lng: number) => void;
  enabled: boolean;
}) {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

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
  { type: "blog", label: "Blog", icon: "📰" },
  { type: "members", label: "Membri", icon: "👥" },
  { type: "events", label: "Evenimente", icon: "📅" },
  { type: "map", label: "Hartă", icon: "🗺️" },
  { type: "contact", label: "Contact", icon: "📞" },
  { type: "footer", label: "Footer", icon: "📄" },
];

const SettlementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState<WebsiteComponent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedComponentType, setSelectedComponentType] =
    useState<string>("");
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [previewView, setPreviewView] = useState<"builder" | "generated">(
    "generated",
  );
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"html" | "css" | "js">(
    "html",
  );
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberImageErrors, setMemberImageErrors] = useState<
    Record<string, boolean>
  >({});
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [isAddingCoordinate, setIsAddingCoordinate] = useState(false);
  const [tempCoordinate, setTempCoordinate] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showCoordinateForm, setShowCoordinateForm] = useState(false);
  const [coordinateFormData, setCoordinateFormData] = useState({
    name: "",
    latitude: 0,
    longitude: 0,
  });
  const [blogFormData, setBlogFormData] = useState({
    title: "",
    description: "",
    content: "",
  });
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [customCSS, setCustomCSS] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "success" });

  const extractSettlementFromN8nResponse = (response: unknown) => {
    const maybe = response as { data?: { settlement?: Settlement } };
    return maybe?.data?.settlement ?? null;
  };

  const confirmActionRef = useRef<null | (() => Promise<void> | void)>(null);
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmVariant: "danger" | "primary";
  }>({
    open: false,
    title: "Confirmare",
    message: "",
    confirmLabel: "Confirmă",
    cancelLabel: "Anulează",
    confirmVariant: "primary",
  });

  const closeConfirmModal = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, open: false }));
    confirmActionRef.current = null;
    setIsConfirmSubmitting(false);
  }, []);

  const openConfirmModal = useCallback(
    (
      config: {
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        confirmVariant?: "danger" | "primary";
      },
      action: () => Promise<void> | void,
    ) => {
      confirmActionRef.current = action;
      setConfirmModal({
        open: true,
        title: config.title,
        message: config.message,
        confirmLabel: config.confirmLabel ?? "Confirmă",
        cancelLabel: config.cancelLabel ?? "Anulează",
        confirmVariant: config.confirmVariant ?? "primary",
      });
    },
    [],
  );

  const handleConfirmProceed = useCallback(async () => {
    if (!confirmActionRef.current || isConfirmSubmitting) return;
    try {
      setIsConfirmSubmitting(true);
      await confirmActionRef.current();
      closeConfirmModal();
    } catch (error) {
      console.error("Error executing confirm action:", error);
      closeConfirmModal();
    }
  }, [closeConfirmModal, isConfirmSubmitting]);

  useEffect(() => {
    if (!confirmModal.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirmModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmModal.open, closeConfirmModal]);

  // Cache keys for localStorage
  const getCacheKey = (settlementId: string) => `preview_cache_${settlementId}`;

  // Load cached preview data
  const loadFromCache = (settlementId: string) => {
    try {
      const cached = localStorage.getItem(getCacheKey(settlementId));
      if (cached) {
        const data = JSON.parse(cached);
        return {
          components: data.components || [],
          customCSS: data.customCSS || "",
        };
      }
    } catch (error) {
      console.error("Error loading from cache:", error);
    }
    return null;
  };

  // Save preview data to cache
  const saveToCache = (
    settlementId: string,
    componentsData: WebsiteComponent[],
    cssData: string,
  ) => {
    try {
      const data = {
        components: componentsData,
        customCSS: cssData,
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(getCacheKey(settlementId), JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  };

  // Clear cache for settlement
  const clearCache = (settlementId: string) => {
    try {
      localStorage.removeItem(getCacheKey(settlementId));
      showNotification("🗑️ Cache-ul a fost șters!", "success");
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  };

  // Show notification function
  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 4000);
  };

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

        // Load cached preview data if available
        const cached = loadFromCache(id);
        if (cached && cached.components.length > 0) {
          console.log("SettlementPage - Loading from cache:", cached);
          setComponents(cached.components);
          setCustomCSS(cached.customCSS);
          showNotification(
            "📦 Progresul anterior a fost restaurat din cache!",
            "info",
          );
        }

        // Mark as initialized after loading
        setIsInitialized(true);

        // Fetch blog posts for this settlement
        await fetchBlogPosts();
        await fetchEvents();
        await fetchMembers();
        await fetchCoordinates();
      } catch (error) {
        console.error("Error fetching settlement:", error);
        setIsInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSettlement();
  }, [id]);

  // Auto-save to cache when components or customCSS change (only after initialization)
  useEffect(() => {
    if (id && components.length > 0 && isInitialized) {
      saveToCache(id, components, customCSS);
    }
  }, [components, customCSS, id, isInitialized]);

  // Ensure header and footer are always present (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    const hasHeader = components.some((c) => c.type === "header");
    const hasFooter = components.some((c) => c.type === "footer");

    if (!hasHeader || !hasFooter) {
      const newComponents = [...components];

      if (!hasHeader) {
        newComponents.unshift({
          id: `header-${Date.now()}`,
          type: "header",
          content: {
            title: `Primăria ${
              (settlement?.name ?? "").trim() ||
              (settlement?.judet ?? "").trim() ||
              ""
            }`,
            links: [
              { text: "Acasă", url: "#" },
              { text: "Despre", url: "#" },
              { text: "Servicii", url: "#" },
              { text: "Contact", url: "#" },
            ],
          },
          position: 0,
          alignment: "center",
        });
      }

      if (!hasFooter) {
        newComponents.push({
          id: `footer-${Date.now()}`,
          type: "footer",
          content: {},
          position: newComponents.length,
          alignment: "center",
        });
      }

      setComponents(newComponents.map((c, i) => ({ ...c, position: i })));
    }
  }, [components, settlement, isInitialized]);

  const fetchBlogPosts = async () => {
    if (!id) return;
    try {
      const posts = await blogPostAPI.getBySettlement(id);
      // Sort posts by date (newest first)
      const sortedPosts = posts.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setBlogPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    }
  };

  const fetchMembers = async () => {
    if (!id) return;
    try {
      const membersData = await memberAPI.getBySettlement(id);

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
      const sortedMembers = membersData.sort((a, b) => {
        const posA = (a.position?.toLowerCase() || "").trim();
        const posB = (b.position?.toLowerCase() || "").trim();

        const orderA = positionOrder[posA] || 999;
        const orderB = positionOrder[posB] || 999;

        // If same order level, sort alphabetically by last name
        if (orderA === orderB) {
          return a.lastName.localeCompare(b.lastName);
        }

        return orderA - orderB;
      });
      setMembers(sortedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchEvents = async () => {
    if (!id) return;
    try {
      const eventsData = await eventAPI.getBySettlement(id);
      const sortedEvents = [...eventsData].sort((a, b) => {
        const dateCmp = (a.localDate || "").localeCompare(b.localDate || "");
        if (dateCmp !== 0) return dateCmp;
        return (a.startTime || "").localeCompare(b.startTime || "");
      });
      setEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchCoordinates = async () => {
    if (!id) return;
    try {
      const coordinatesData = await coordinatesAPI.getBySettlement(id);
      setCoordinates(coordinatesData);
    } catch (error) {
      console.error("Error fetching coordinates:", error);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!isAddingCoordinate) return;

    setTempCoordinate({ lat, lng });
    setCoordinateFormData({
      name: "",
      latitude: lat,
      longitude: lng,
    });
    setShowCoordinateForm(true);
  };

  const handleCreateCoordinate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await coordinatesAPI.create({
        ...coordinateFormData,
        settlement: id,
      });
      await fetchCoordinates();
      setShowCoordinateForm(false);
      setCoordinateFormData({ name: "", latitude: 0, longitude: 0 });
      setTempCoordinate(null);
      setIsAddingCoordinate(false);
      showNotification("✅ Punct adăugat cu succes!", "success");
    } catch (error) {
      console.error("Error creating coordinate:", error);
      showNotification("❌ Eroare la adăugarea punctului!", "error");
    }
  };

  const handleDeleteCoordinate = (coordId: string) => {
    openConfirmModal(
      {
        title: "Șterge punct",
        message: "Ești sigur că vrei să ștergi acest punct?",
        confirmLabel: "Șterge",
        confirmVariant: "danger",
      },
      async () => {
        try {
          await coordinatesAPI.delete(coordId);
          await fetchCoordinates();
          showNotification("🗑️ Punct șters cu succes!", "success");
        } catch (error) {
          console.error("Error deleting coordinate:", error);
          showNotification("❌ Eroare la ștergerea punctului!", "error");
        }
      },
    );
  };

  const handleCreateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await blogPostAPI.create({ ...blogFormData, settlement: id });
      await fetchBlogPosts();
      setShowBlogModal(false);
      setBlogFormData({ title: "", description: "", content: "" });
      showNotification("✅ Postarea a fost creată cu succes!", "success");
    } catch (error) {
      console.error("Error creating blog post:", error);
      showNotification("❌ Eroare la crearea postării!", "error");
    }
  };

  const handleDeleteBlogPost = (postId: string) => {
    openConfirmModal(
      {
        title: "Șterge postare",
        message: "Ești sigur că vrei să ștergi această postare?",
        confirmLabel: "Șterge",
        confirmVariant: "danger",
      },
      async () => {
        try {
          await blogPostAPI.delete(postId);
          await fetchBlogPosts();
          showNotification("🗑️ Postarea a fost ștearsă!", "success");
        } catch (error) {
          console.error("Error deleting blog post:", error);
          showNotification("❌ Eroare la ștergerea postării!", "error");
        }
      },
    );
  };

  const handleCreateWebsite = () => {
    const customizedComponents = defaultComponents.map((comp) => {
      if (comp.type === "header") {
        return {
          ...comp,
          content: {
            ...comp.content,
            title: `Primăria ${
              (settlement?.name ?? "").trim() ||
              (settlement?.judet ?? "").trim() ||
              ""
            }`,
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

    // Prevent adding duplicate header or footer
    if (
      selectedComponentType === "header" &&
      components.some((c) => c.type === "header")
    ) {
      showNotification(
        "⚠️ Există deja un header! Nu poți adăuga mai mult de un header.",
        "error",
      );
      setShowModal(false);
      setSelectedComponentType("");
      return;
    }

    const multiAllowedTypes: string[] = ["hero", "services"];

    if (
      !multiAllowedTypes.includes(selectedComponentType) &&
      components.some((c) => c.type === selectedComponentType)
    ) {
      const componentLabel =
        componentTypes.find((c) => c.type === selectedComponentType)?.label ||
        "Această secțiune";

      showNotification(
        `⚠️ ${componentLabel} poate fi adăugată o singură dată pe pagină.`,
        "error",
      );
      setShowModal(false);
      setSelectedComponentType("");
      return;
    }

    if (
      selectedComponentType === "footer" &&
      components.some((c) => c.type === "footer")
    ) {
      showNotification(
        "⚠️ Există deja un footer! Nu poți adăuga mai mult de un footer.",
        "error",
      );
      setShowModal(false);
      setSelectedComponentType("");
      return;
    }

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
    const component = components.find((c) => c.id === id);

    // Prevent deletion of header and footer
    if (
      component &&
      (component.type === "header" || component.type === "footer")
    ) {
      showNotification(
        `⚠️ Nu poți șterge ${
          component.type === "header" ? "header-ul" : "footer-ul"
        }! Acesta este obligatoriu pentru toate paginile.`,
        "error",
      );
      return;
    }

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
    alignment: "left" | "center" | "right",
  ) => {
    setComponents(
      components.map((c) => (c.id === id ? { ...c, alignment } : c)),
    );
  };

  const handleEditComponent = (id: string) => {
    const component = components.find((c) => c.id === id);
    if (component) {
      setEditingComponent(id);
      setEditFormData({ ...component.content });
    }
  };

  const handleSaveEdit = () => {
    if (!editingComponent) return;

    setComponents(
      components.map((c) =>
        c.id === editingComponent ? { ...c, content: { ...editFormData } } : c,
      ),
    );
    setEditingComponent(null);
    setEditFormData({});
  };

  const handleCancelEdit = () => {
    setEditingComponent(null);
    setEditFormData({});
  };

  // Save site to n8n
  const handleSaveSite = async () => {
    if (!settlement || !id) {
      showNotification("Settlement-ul nu este încărcat!", "error");
      return;
    }

    if (components.length === 0) {
      showNotification(
        "Adaugă cel puțin o componentă înainte de a salva!",
        "error",
      );
      return;
    }

    const isUpdate = Boolean(settlement.active);
    openConfirmModal(
      {
        title: isUpdate ? "Actualizează site" : "Creează site",
        message: isUpdate
          ? "Ești sigur că vrei să actualizezi site-ul?"
          : "Ești sigur că vrei să creezi site-ul?",
        confirmLabel: isUpdate ? "Actualizează" : "Creează",
        confirmVariant: "primary",
      },
      async () => {
        setIsSaving(true);
        showNotification("Se salvează site-ul...", "info");

        try {
          const readBlobAsDataUrl = (blob: Blob): Promise<string> =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(new Error("Failed to read file"));
              reader.readAsDataURL(blob);
            });

          const dataUrlToImage = (dataUrl: string): Promise<HTMLImageElement> =>
            new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error("Failed to load image"));
              img.src = dataUrl;
            });

          const resizePngDataUrl = async (
            dataUrl: string,
            size: number,
          ): Promise<string> => {
            const img = await dataUrlToImage(dataUrl);
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (!ctx) return dataUrl;

            ctx.clearRect(0, 0, size, size);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, size, size);

            return canvas.toDataURL("image/png");
          };

          const getSiteGenFaviconHref = async (): Promise<string | null> => {
            try {
              const logoPath = `${import.meta.env.BASE_URL}logo.png`;
              const response = await fetch(logoPath, { cache: "no-store" });
              if (!response.ok) return null;
              const blob = await response.blob();
              const dataUrl = await readBlobAsDataUrl(blob);
              return await resizePngDataUrl(dataUrl, 32);
            } catch {
              return null;
            }
          };

          const faviconHref = await getSiteGenFaviconHref();

          // Check if there's a blog component
          const hasBlog = components.some((c) => c.type === "blog");
          const hasMembers = components.some((c) => c.type === "members");
          const hasEvents = components.some((c) => c.type === "events");

          // Generate code files
          const files = {
            html: generateHTML(faviconHref),
            css: generateCSS(),
            js: generateJS(),
            // ALWAYS generate blog pages if there's a blog component, even with 0 posts
            ...(hasBlog
              ? {
                  blogHtml: generateBlogPage(faviconHref),
                  postHtml: generatePostPage(faviconHref),
                }
              : {}),
            // ALWAYS generate members page if there's a members component
            ...(hasMembers
              ? {
                  membersHtml: generateMembersPage(faviconHref),
                }
              : {}),
            ...(hasEvents
              ? {
                  eventsHtml: generateEventsPage(faviconHref),
                }
              : {}),
          };

          console.log("Files being sent:", Object.keys(files));
          console.log("Has members component:", hasMembers);
          console.log("Members HTML length:", files.membersHtml?.length || 0);

          // Check if site is already active
          if (settlement.active) {
            // Update existing site
            const response = await n8nAPI.updateSite(id, files);
            showNotification("🎉 Site actualizat cu succes!", "success");
            console.log("Site updated:", response);

            const updatedSettlement =
              extractSettlementFromN8nResponse(response);
            if (updatedSettlement) setSettlement(updatedSettlement);
          } else {
            // Create new site
            const response = await n8nAPI.createSite(id, files);
            showNotification("🎉 Site creat cu succes!", "success");
            console.log("Site created:", response);

            const updatedSettlement =
              extractSettlementFromN8nResponse(response);
            if (updatedSettlement) {
              setSettlement(updatedSettlement);
            } else {
              setSettlement((prev) =>
                prev ? { ...prev, active: true } : prev,
              );
            }
          }
        } catch (error: any) {
          console.error("Error saving site:", error);
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Eroare necunoscută";
          showNotification(
            `❌ Eroare la salvarea site-ului: ${errorMessage}`,
            "error",
          );
        } finally {
          setIsSaving(false);
        }
      },
    );
  };

  // Generate HTML code
  const generateHTML = (faviconHref: string | null) => {
    const settlementDisplayName =
      (settlement?.name ?? "").trim() ||
      (settlement?.judet ?? "").trim() ||
      "Website";

    // Determine which sections exist for navigation
    const hasAbout = components.some((c) => c.type === "about");
    const hasContact = components.some((c) => c.type === "contact");
    const hasBlog = components.some((c) => c.type === "blog");
    const hasMembers = components.some((c) => c.type === "members");
    const hasEvents = components.some((c) => c.type === "events");

    const htmlContent = components
      .map((comp) => {
        switch (comp.type) {
          case "header":
            // Default header title with settlement name
            const headerTitle =
              comp.content.title || `Primăria ${settlementDisplayName}`;
            const headerSubtitle = "Pagina Oficială";

            // Build navigation links dynamically based on available sections
            const navItems: string[] = [];
            if (hasAbout) navItems.push('<a href="#despre">Despre</a>');
            if (hasMembers) navItems.push('<a href="#membri">Membrii</a>');
            if (hasEvents)
              navItems.push('<a href="#evenimente">Evenimente</a>');
            if (hasBlog) navItems.push('<a href="#noutati">Noutăți</a>');
            if (hasContact) navItems.push('<a href="#contact">Contact</a>');

            const navMarkup =
              navItems.length > 0
                ? `<nav>
          ${navItems.join("\n          ")}
        </nav>`
                : "";

            return `    <header class="header ${comp.alignment}">
      <div class="layout-container">
        <h1>${headerTitle}</h1>
        <p class="header-subtitle">${headerSubtitle}</p>
        ${navMarkup}
      </div>
    </header>`;
          case "hero":
            const heroTitle =
              comp.content.title !== undefined
                ? comp.content.title
                : "Bine ați venit";
            const heroSubtitle =
              comp.content.subtitle !== undefined
                ? comp.content.subtitle
                : `la ${settlementDisplayName}`;
            return `    <section class="hero ${comp.alignment}">
      <div class="layout-container">
        ${heroTitle ? `<h1>${heroTitle}</h1>` : ""}
        ${heroSubtitle ? `<p>${heroSubtitle}</p>` : ""}
      </div>
    </section>`;
          case "about":
            const aboutTitle =
              comp.content.title !== undefined ? comp.content.title : "Despre";
            return `    <section class="about ${comp.alignment}" id="despre">
      <div class="layout-container">
        ${aboutTitle ? `<h2>${aboutTitle}</h2>` : ""}
        <p>${comp.content.description || "Descriere..."}</p>
      </div>
    </section>`;
          case "services":
            const servicesTitle =
              comp.content.title !== undefined
                ? comp.content.title
                : "Servicii";
            return `    <section class="services ${comp.alignment}">
      <div class="layout-container">
        ${servicesTitle ? `<h2>${servicesTitle}</h2>` : ""}
        <p>${comp.content.description || "Lista serviciilor..."}</p>
      </div>
    </section>`;
          case "events":
            const eventsTitle =
              comp.content.title !== undefined
                ? comp.content.title
                : "Evenimente";

            return `    <section class="events ${comp.alignment}" id="evenimente">
      <div class="layout-container">
        ${eventsTitle ? `<h2>${eventsTitle}</h2>` : ""}
        <div class="events-calendar" aria-label="Calendar evenimente">
          <div class="events-calendar-header">
            <button class="events-nav-btn" id="events-prev-month" type="button" aria-label="Luna anterioară">←</button>
            <div class="events-month-label" id="events-month-label"></div>
            <button class="events-nav-btn" id="events-next-month" type="button" aria-label="Luna următoare">→</button>
          </div>
          <div class="events-weekdays">
            <div>L</div><div>M</div><div>Mi</div><div>J</div><div>V</div><div>S</div><div>D</div>
          </div>
          <div class="events-days" id="events-days"></div>
        </div>

        <div class="events-panel">
          <div class="loading-message" id="events-loading">Se încarcă evenimentele...</div>
          <div class="events-selected-date" id="events-selected-date" style="display: none;"></div>
          <div class="events-items" id="events-list" style="display: none;"></div>
          <a class="btn-view-all" id="events-view-all" href="events.html" style="display: none;">Vezi toate evenimentele</a>
        </div>
      </div>
    </section>`;
          case "members":
            const membersTitle =
              comp.content.title !== undefined
                ? comp.content.title
                : "Echipa Noastră";

            return `    <section class="members ${comp.alignment}" id="membri">
      <div class="layout-container">
        ${membersTitle ? `<h2>${membersTitle}</h2>` : ""}
        <div class="loading-message" id="home-members-loading">Se încarcă membrii...</div>
        <div class="members-grid" id="members-container" style="display: none;">
          <!-- Members will be loaded dynamically via API -->
        </div>
      </div>
    </section>`;
          case "blog":
            const blogTitle =
              comp.content.title !== undefined
                ? comp.content.title
                : "Ultimele Noutăți";

            return `    <section class="blog ${comp.alignment}" id="noutati">
      <div class="layout-container">
        ${blogTitle ? `<h2>${blogTitle}</h2>` : ""}
        <div class="loading-message" id="home-blog-loading">Se încarcă postările...</div>
        <div class="blog-posts" id="blog-posts-container" style="display: none;">
          <!-- Posts will be loaded dynamically via API -->
        </div>
      </div>
    </section>`;
          case "map":
            const mapTitle =
              comp.content.title !== undefined
                ? comp.content.title
                : "Localizare";
            return `    <section class="map ${comp.alignment}" id="localizare">
      <div class="layout-container">
        ${mapTitle ? `<h2>${mapTitle}</h2>` : ""}
        <div id="map"></div>
      </div>
    </section>`;
          case "contact":
            const contactTitle =
              comp.content.title !== undefined ? comp.content.title : "Contact";
            return `    <section class="contact ${comp.alignment}" id="contact">
      <div class="layout-container">
        ${contactTitle ? `<h2>${contactTitle}</h2>` : ""}
        <p>${comp.content.description || "Informații contact..."}</p>
      </div>
    </section>`;
          case "footer":
            return `    <footer class="footer ${comp.alignment}">
      <div class="layout-container">
        <p>© 2025 ${settlementDisplayName}. Toate drepturile rezervate.</p>
      </div>
    </footer>`;
          default:
            return "";
        }
      })
      .join("\n\n");

    return `<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${settlementDisplayName}</title>
    ${faviconHref ? `<link rel="icon" type="image/png" href="${faviconHref}">` : ""}
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="styles.css">
</head>
<body>
${htmlContent}
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="script.js"></script>
</body>
</html>`;
  };

  // Generate Blog Page HTML
  const generateMembersPage = (faviconHref: string | null) => {
    const settlementDisplayName =
      (settlement?.name ?? "").trim() ||
      (settlement?.judet ?? "").trim() ||
      "Website";

    return `<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Membrii - ${settlementDisplayName}</title>
    ${faviconHref ? `<link rel="icon" type="image/png" href="${faviconHref}">` : ""}
    <link rel="stylesheet" href="styles.css">
    <style>
      /* Additional members page specific styles */
      body {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      
      .members-page {
        flex: 1 0 auto;
        padding: 60px 0;
      }

      .loading-message {
        text-align: center;
        padding: 60px 20px;
        color: #6b7280;
        font-size: 18px;
      }

      .error-message {
        text-align: center;
        padding: 60px 20px;
        color: #ef4444;
        font-size: 18px;
      }
      
      .members-search-container {
        margin-bottom: 30px;
        text-align: center;
      }
      
      .members-search {
        width: 100%;
        max-width: 500px;
        padding: 12px 20px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.3s;
      }
      
      .members-search:focus {
        outline: none;
        border-color: #6366f1;
      }
      
      #all-members {
        gap: 24px;
      }
    </style>
</head>
<body>
    <header class="header center">
      <div class="layout-container">
        <h1>Membrii - ${settlementDisplayName}</h1>
        <nav>
          <a href="index.html">Acasă</a>
        </nav>
      </div>
    </header>

    <section class="members-page">
      <div class="layout-container">
        <div class="members-search-container">
          <input type="text" id="members-search" class="members-search" placeholder="Caută membri...">
        </div>
        
        <div class="loading-message" id="members-loading-message">
          Se încarcă membrii...
        </div>

        <div class="members-grid" id="all-members" style="display: none;">
          <!-- Members will be loaded dynamically via API -->
        </div>

        <div class="pagination-container" id="members-pagination-controls" style="display: none;">
          <button class="pagination-btn" id="members-prev-btn" onclick="changeMembersPage(-1)">← Anterior</button>
          <div class="pagination-pages" id="members-pagination-pages"></div>
          <button class="pagination-btn" id="members-next-btn" onclick="changeMembersPage(1)">Următor →</button>
        </div>
      </div>
    </section>

    <footer class="footer center">
      <div class="layout-container">
        <p>&copy; ${new Date().getFullYear()} ${settlementDisplayName}. Toate drepturile rezervate.</p>
      </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
  };

  const generateEventsPage = (faviconHref: string | null) => {
    const settlementDisplayName =
      (settlement?.name ?? "").trim() ||
      (settlement?.judet ?? "").trim() ||
      "Website";

    return `<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evenimente - ${settlementDisplayName}</title>
    ${faviconHref ? `<link rel="icon" type="image/png" href="${faviconHref}">` : ""}
    <link rel="stylesheet" href="styles.css">
    <style>
      body {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .events-page {
        flex: 1 0 auto;
        padding: 60px 0;
      }

      .loading-message {
        text-align: center;
        padding: 40px 20px;
        color: #6b7280;
        font-size: 18px;
      }
    </style>
</head>
<body>
    <header class="header center">
      <div class="layout-container">
        <h1>Evenimente - ${settlementDisplayName}</h1>
        <nav>
          <a href="index.html">Acasă</a>
        </nav>
      </div>
    </header>

    <section class="events-page">
      <div class="layout-container">
        <div class="events-calendar" aria-label="Calendar evenimente">
          <div class="events-calendar-header">
            <button class="events-nav-btn" id="events-prev-month" type="button" aria-label="Luna anterioară">←</button>
            <div class="events-month-label" id="events-month-label"></div>
            <button class="events-nav-btn" id="events-next-month" type="button" aria-label="Luna următoare">→</button>
          </div>
          <div class="events-weekdays">
            <div>L</div><div>M</div><div>Mi</div><div>J</div><div>V</div><div>S</div><div>D</div>
          </div>
          <div class="events-days" id="events-days"></div>
        </div>

        <div class="events-panel">
          <div class="loading-message" id="events-loading">Se încarcă evenimentele...</div>
          <div class="events-selected-date" id="events-selected-date" style="display: none;"></div>
          <div class="events-items" id="events-list" style="display: none;"></div>
        </div>
      </div>
    </section>

    <footer class="footer center">
      <div class="layout-container">
        <p>&copy; ${new Date().getFullYear()} ${settlementDisplayName}. Toate drepturile rezervate.</p>
      </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
  };

  const generateBlogPage = (faviconHref: string | null) => {
    const settlementDisplayName =
      (settlement?.name ?? "").trim() ||
      (settlement?.judet ?? "").trim() ||
      "Website";

    return `<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - ${settlementDisplayName}</title>
    ${faviconHref ? `<link rel="icon" type="image/png" href="${faviconHref}">` : ""}
    <link rel="stylesheet" href="styles.css">
    <style>
      /* Additional blog page specific styles */
      body {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      
      .blog-page {
        flex: 1 0 auto;
      }
      
      .blog-posts .blog-post {
        height: auto;
      }
      
      .blog-posts .blog-post .blog-post-content {
        -webkit-line-clamp: unset !important;
        display: block !important;
        max-height: none !important;
      }

      .loading-message {
        text-align: center;
        padding: 60px 20px;
        color: #6b7280;
        font-size: 18px;
      }

      .error-message {
        text-align: center;
        padding: 60px 20px;
        color: #ef4444;
        font-size: 18px;
      }
    </style>
</head>
<body>
    <header class="header center">
      <div class="layout-container">
        <h1>Blog - ${settlementDisplayName}</h1>
        <nav>
          <a href="index.html">Acasă</a>
        </nav>
      </div>
    </header>

    <section class="blog-page">
      <div class="layout-container">
        <div class="blog-search-container" style="margin-bottom: 30px; text-align: center;">
          <input type="text" id="blog-search" class="blog-search" placeholder="Caută în postări..." style="width: 100%; max-width: 500px; padding: 12px 20px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px;">
        </div>
        
        <div class="loading-message" id="loading-message">
          Se încarcă postările...
        </div>

        <div class="blog-posts" id="all-blog-posts" style="display: none;">
          <!-- Posts will be loaded dynamically via API -->
        </div>

        <div class="pagination-container" id="pagination-controls" style="display: none;">
          <button class="pagination-btn" id="prev-btn" onclick="changePage(-1)">← Anterior</button>
          <div class="pagination-pages" id="pagination-pages"></div>
          <button class="pagination-btn" id="next-btn" onclick="changePage(1)">Următor →</button>
        </div>
      </div>
    </section>

    <footer class="footer center">
      <div class="layout-container">
        <p>© 2025 ${settlementDisplayName}. Toate drepturile rezervate.</p>
      </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
  };

  // Generate Individual Post Page HTML
  const generatePostPage = (faviconHref: string | null) => {
    const settlementDisplayName =
      (settlement?.name ?? "").trim() ||
      (settlement?.judet ?? "").trim() ||
      "Website";

    return `<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Postare - ${settlementDisplayName}</title>
    ${faviconHref ? `<link rel="icon" type="image/png" href="${faviconHref}">` : ""}
    <link rel="stylesheet" href="styles.css">
    <style>
      .post-page {
        padding: 40px 0;
        flex: 1 0 auto;
      }

      .post-page .layout-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 20px;
      }

      .post-content {
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      }
      
      .post-title {
        font-size: 36px;
        color: #1f2937;
        margin-bottom: 16px;
      }
      
      .post-meta {
        display: flex;
        gap: 20px;
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 24px;
        padding-bottom: 24px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .post-description {
        font-size: 18px;
        color: #4b5563;
        font-style: italic;
        margin-bottom: 32px;
        padding: 20px;
        background: #f9fafb;
        border-left: 4px solid #10b981;
        border-radius: 4px;
      }
      
      .post-body {
        font-size: 16px;
        line-height: 1.8;
        color: #374151;
      }
      
      .post-body img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 20px 0;
      }
      
      .back-link {
        display: inline-block;
        margin-bottom: 24px;
        padding: 10px 20px;
        background: #f3f4f6;
        color: #10b981;
        text-decoration: none;
        border-radius: 6px;
        transition: background 0.3s;
      }
      
      .back-link:hover {
        background: #e5e7eb;
      }
      
      .loading {
        text-align: center;
        padding: 100px 20px;
        font-size: 18px;
        color: #6b7280;
      }
    </style>
    <script>
      const API_URL = 'https://api.bachelordegree.tech/api/v1';
      
      async function loadPost() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        
        if (!postId) {
          document.getElementById('post-container').innerHTML = '<p class="loading">Post invalid</p>';
          return;
        }
        
        try {
          const response = await fetch(\`\${API_URL}/blog-posts/\${postId}\`);
          if (!response.ok) throw new Error('Post not found');
          
          const data = await response.json();
          console.log('API Response:', data);
          console.log('Post data:', data.data);
          
          const post = data.data?.data || data.data;
          console.log('Final post object:', post);
          
          if (!post) {
            throw new Error('No post data found');
          }
          
          document.title = (post.title || 'Post') + ' - ${settlementDisplayName}';
          
          document.getElementById('post-container').innerHTML = \`
            <div class="post-content">
              <a href="blog.html" class="back-link">← Înapoi la blog</a>
              <h1 class="post-title">\${escapeHtml(post.title || 'Fără titlu')}</h1>
              <div class="post-meta">
                <span>📅 \${post.date ? new Date(post.date).toLocaleDateString('ro-RO', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Dată necunoscută'}</span>
              </div>
              \${post.description ? \`<div class="post-description">\${escapeHtml(post.description)}</div>\` : ''}
              <div class="post-body">\${post.content || 'Conținut lipsă'}</div>
            </div>
          \`;
        } catch (error) {
          console.error('Error loading post:', error);
          document.getElementById('post-container').innerHTML = '<p class="loading">Eroare la încărcarea postării</p>';
        }
      }
      
      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
      
      document.addEventListener('DOMContentLoaded', loadPost);
    </script>
</head>
<body>
    <header class="header center">
      <div class="layout-container">
        <h1>${settlementDisplayName}</h1>
        <nav>
          <a href="index.html">Acasă</a>
          <a href="blog.html">Blog</a>
        </nav>
      </div>
    </header>

    <section class="post-page">
      <div class="layout-container">
        <div id="post-container">
          <p class="loading">Se încarcă postarea...</p>
        </div>
      </div>
    </section>

    <footer class="footer center">
      <div class="layout-container">
        <p>© 2025 ${settlementDisplayName}. Toate drepturile rezervate.</p>
      </div>
    </footer>
</body>
</html>`;
  };

  // Generate CSS code
  const generateCSS = () => {
    const baseCSS = `/* Reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    height: 100%;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Layout container */
:root {
  --layout-max-width: 1200px;
  --layout-padding: 24px;
}

.layout-container {
  width: min(100%, var(--layout-max-width));
  margin: 0 auto;
  padding: 0 var(--layout-padding);
}

.left .layout-container {
  text-align: left;
}

.center .layout-container {
  text-align: center;
}

.right .layout-container {
  text-align: right;
}

/* Main content wrapper */
.hero, .about, .services, .contact, .blog, .map, .members, .events {
    flex: 1 0 auto;
}

/* Alignment classes */
.left {
    text-align: left;
}

.center {
    text-align: center;
}

.right {
    text-align: right;
}

/* Header */
.header {
    background: #10b981;
    color: white;
  padding: 20px 0;
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}

.header h1 {
    margin-bottom: 5px;
    font-size: 28px;
}

.header-subtitle {
    margin: 0 0 10px 0;
    font-size: 14px;
    opacity: 0.9;
    font-style: italic;
}

.header nav {
    margin-top: 15px;
}

.header nav a {
    color: white;
    text-decoration: none;
    margin: 0 10px;
    padding: 5px 10px;
    border-radius: 4px;
    transition: background 0.3s;
}

.header nav a:hover {
    background: #059669;
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, #10b981 0%, #047857 100%);
    color: white;
  padding: 60px 0;
}

.hero h1 {
    font-size: 48px;
    margin-bottom: 16px;
}

.hero p {
    font-size: 20px;
    opacity: 0.9;
}

/* About, Services, Contact, Blog, Members, Map Sections */
.about, .services, .contact, .blog, .members, .map {
  padding: 60px 0;
}

.about h2, .services h2, .contact h2, .blog h2, .members h2, .map h2 {
    font-size: 32px;
    margin-bottom: 16px;
    color: #10b981;
}

.about p, .services p, .contact p {
    font-size: 16px;
    line-height: 1.8;
    color: #666;
}

/* Blog Section */
.blog-posts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    margin-top: 32px;
}

.blog-post {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    overflow: hidden !important;
    word-wrap: break-word;
    max-width: 100%;
}

.blog-post:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.blog-post-date {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 8px;
}

.blog-post h3 {
    font-size: 20px;
    margin-bottom: 8px;
    color: #1f2937;
    overflow: hidden !important;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    word-break: break-word;
    line-height: 1.4;
    max-width: 100%;
}

.blog-post-description {
    font-size: 14px;
    color: #4b5563;
    margin-bottom: 12px;
    overflow: hidden !important;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
    line-height: 1.5;
    max-width: 100%;
}

.blog-post-content {
    font-size: 15px;
    line-height: 1.6;
    color: #374151;
    overflow: hidden !important;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    word-break: break-word;
    max-width: 100%;
}

.blog-more {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-radius: 12px;
    padding: 32px 24px;
    text-align: center;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
}

.blog-more p {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.members-more {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border-radius: 12px;
    padding: 32px 24px;
    text-align: center;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
}

.members-more p {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.btn-view-all {
    display: inline-block;
    padding: 12px 32px;
    background: white;
    color: #10b981;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.members-more .btn-view-all {
    color: #6366f1;
}

.btn-view-all:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Blog Page Styles */
.blog-page {
  padding: 40px 0;
    flex: 1 0 auto;
    min-height: calc(100vh - 200px);
}

.blog-search-container {
    margin-bottom: 32px;
}

.blog-search {
    width: 100%;
    max-width: 600px;
    padding: 16px 24px;
    font-size: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    transition: border-color 0.3s ease;
}

.blog-search:focus {
    outline: none;
    border-color: #10b981;
}

/* Members Section */
.members-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-top: 32px;
}

.member-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    text-align: center;
    cursor: pointer;
}

.member-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.member-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    font-size: 32px;
}

.member-avatar.has-photo {
  background: transparent;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.member-card h3 {
    font-size: 18px;
    margin-bottom: 4px;
    color: #1f2937;
}

.member-position {
    font-size: 14px;
    color: #6366f1;
    font-weight: 600;
    margin-bottom: 8px;
}

.member-info {
    font-size: 12px;
    color: #9ca3af;
}

/* Member Modal */
.member-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 2000;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.member-modal.active {
    display: flex;
}

.member-modal-content {
    background: white;
    border-radius: 20px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    position: relative;
}

.member-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: #f3f4f6;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    z-index: 10;
}

.member-modal-header {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    padding: 40px;
    text-align: center;
}

.member-modal-avatar-large {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 48px;
}

.member-modal-avatar-large.has-photo {
  background: transparent;
}

.member-modal-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.member-modal-header h2 {
    font-size: 28px;
    margin-bottom: 8px;
}

.member-modal-header .member-position {
    color: white;
    opacity: 0.95;
    font-size: 16px;
}

.member-modal-body {
    padding: 32px;
}

.member-modal-body h3 {
    font-size: 18px;
    color: #1f2937;
    margin-bottom: 12px;
}

.member-modal-body p {
    color: #6b7280;
    line-height: 1.8;
}

.member-modal-info-grid {
    display: grid;
    gap: 12px;
    margin-bottom: 24px;
}

.member-info-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
}

.member-info-item span:first-child {
    font-size: 20px;
}

/* Map Section */
.map {
  padding: 40px 0;
}

.map h2 {
  font-size: 32px;
  margin-bottom: 24px;
  color: #10b981;
}

/* Custom marker hover effect */
.custom-marker:hover > div {
  transform: rotate(-45deg) scale(1.15) !important;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6) !important;
}

.custom-marker {
  cursor: pointer;
  transition: all 0.3s ease;
}

#map {
    width: 100% !important;
    height: 500px !important;
  margin: 24px 0 0 0;
    border: 2px solid #e5e7eb;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    background: #f9fafb;
    position: relative;
    z-index: 1;
    display: block;
}

/* Ensure Leaflet container takes full size */
.leaflet-container {
    width: 100% !important;
    height: 100% !important;
    border-radius: 12px;
}

/* Footer */
.footer {
    background: #1a1a2e;
    color: white;
  padding: 20px 0;
    margin-top: auto;
    flex-shrink: 0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.footer p {
    opacity: 0.8;
    margin: 0;
}

/* Responsive */
@media (min-width: 769px) and (max-width: 1024px) {
    .members-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
  :root {
    --layout-padding: 16px;
  }

  .hero {
    padding: 40px 0;
  }

    .hero h1 {
        font-size: 32px;
    }
    
  .about, .services, .contact, .blog, .map {
    padding: 40px 0;
    }
    
.about h2, .services h2, .contact h2, .blog h2, .members h2, .map h2 {
        font-size: 24px;
    }
    
    .members-grid {
        grid-template-columns: 1fr;
    }
    
    #map {
        width: 100% !important;
        height: 350px !important;
    }
    
    .header nav {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .header nav a {
        display: block;
        padding: 8px 12px;
    }
}

/* Pagination Styles */
.pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 3rem;
    padding: 2rem 0;
}

.pagination-btn {
    padding: 0.75rem 1.5rem;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
    background: #10b981;
    color: white;
    border-color: #10b981;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.pagination-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.pagination-pages {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
}

.pagination-page {
    width: 40px;
    height: 40px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: all 0.3s ease;
}

.pagination-page:hover {
    background: #f3f4f6;
    border-color: #10b981;
}

.pagination-page.active {
    background: #10b981;
    color: white;
    border-color: #10b981;
}

@media (max-width: 768px) {
    .pagination-container {
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .pagination-btn {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }

    .pagination-page {
        width: 36px;
        height: 36px;
        font-size: 0.85rem;
    }
}

/* Events Section */
.events {
  padding: 40px 0;
}

.events h2 {
  font-size: 32px;
  margin-bottom: 24px;
  color: #10b981;
}

.events-calendar {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.events-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.events-nav-btn {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
}

.events-nav-btn:hover {
  background: #f3f4f6;
}

.events-month-label {
  font-weight: 800;
  color: #111827;
  letter-spacing: 0.02em;
}

.events-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 700;
}

.events-weekdays > div {
  text-align: center;
  padding: 6px 0;
}

.events-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.events-day {
  position: relative;
  min-height: 44px;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  padding: 8px 8px 10px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.events-day:hover {
  border-color: rgba(16, 185, 129, 0.55);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.12);
  transform: translateY(-1px);
}

.events-day.is-outside {
  opacity: 0.45;
  cursor: default;
}

.events-day.is-today {
  border-color: rgba(99, 102, 241, 0.55);
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.10);
}

.events-day.is-selected {
  border-color: #10b981;
  box-shadow: 0 10px 26px rgba(16, 185, 129, 0.18);
}

.events-day-number {
  font-weight: 800;
  color: #111827;
  font-size: 13px;
}

.events-day-dot {
  position: absolute;
  left: 10px;
  bottom: 8px;
  height: 8px;
  width: 8px;
  border-radius: 999px;
  background: #10b981;
}

.events-day-count {
  position: absolute;
  right: 10px;
  bottom: 6px;
  font-size: 11px;
  font-weight: 800;
  color: #065f46;
  background: rgba(16, 185, 129, 0.14);
  padding: 2px 8px;
  border-radius: 999px;
}

.events-panel {
  margin-top: 18px;
}

.events-selected-date {
  font-weight: 800;
  color: #111827;
  margin-bottom: 10px;
}

.events-items {
  display: grid;
  gap: 10px;
}

.events-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.events-item-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: baseline;
}

.events-item-time {
  font-weight: 800;
  color: #111827;
}

.events-item-title {
  font-weight: 800;
  color: #111827;
  margin-top: 6px;
}

.events-item-meta {
  color: #6b7280;
  margin-top: 6px;
  font-size: 13px;
}

.events-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 12px;
}

.events-badge.now {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.events-badge.future {
  background: rgba(99, 102, 241, 0.12);
  color: #3730a3;
}

.btn-view-all {
  display: inline-block;
  margin-top: 14px;
  padding: 10px 16px;
  border-radius: 10px;
  background: #10b981;
  color: white;
  text-decoration: none;
  font-weight: 800;
}

.btn-view-all:hover {
  filter: brightness(0.95);
}

@media (max-width: 768px) {
  .events h2 {
    font-size: 24px;
  }

  .events-calendar {
    padding: 12px;
  }

  .events-day {
    min-height: 40px;
  }
}
`;

    // Append custom CSS if exists
    return customCSS
      ? `${baseCSS}\n\n/* Custom Styles */\n${customCSS}`
      : baseCSS;
  };

  // Generate JavaScript code
  const generateJS = () => {
    const hasBlog = components.some((c) => c.type === "blog");
    const hasMembers = components.some((c) => c.type === "members");
    const hasEvents = components.some((c) => c.type === "events");
    const hasMap = components.some((c) => c.type === "map");
    const settlementId = settlement?._id || "";
    const lat = settlement?.lat || 45.7489;
    const lng = settlement?.lng || 21.2087;

    return `// Configuration
// Use production API URL
const API_URL = 'https://api.bachelordegree.tech/api/v1';
const SETTLEMENT_ID = '${settlementId}';
const LOCATION = { lat: ${lat}, lng: ${lng} };

// Smooth scroll for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add animation on scroll
    const sections = document.querySelectorAll('section');

    function revealSection(section) {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
    }

    function hideSection(section) {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    }

    function revealAboveFold() {
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                revealSection(section);
            }
        });
    }

    if (typeof IntersectionObserver === 'function') {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    revealSection(entry.target);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            hideSection(section);
            observer.observe(section);
        });

        // Fallback for environments where IntersectionObserver callbacks don't fire reliably.
        setTimeout(revealAboveFold, 50);
        setTimeout(revealAboveFold, 500);
    } else {
        // No IntersectionObserver support -> don't hide content.
        sections.forEach(section => {
            section.style.transition = 'none';
            revealSection(section);
        });
    }
    ${
      hasBlog
        ? `
    // Load blog posts on BOTH index.html and blog.html
    const blogContainer = document.getElementById('all-blog-posts');
    const homeBlogContainer = document.getElementById('blog-posts-container');
    
    if (blogContainer) {
        // This is blog.html - load ALL posts with pagination
        loadBlogPosts();
    } else if (homeBlogContainer) {
        // This is index.html - load only first 5 posts
        loadHomeBlogPosts();
    }
    `
        : ""
    }
    ${
      hasMembers
        ? `
    // Load members on BOTH index.html and members.html
    const allMembersContainer = document.getElementById('all-members');
    const homeMembersContainer = document.getElementById('members-container');
    
    if (allMembersContainer) {
        // This is members.html - load ALL members with pagination
        loadAllMembers();
    } else if (homeMembersContainer) {
        // This is index.html - load only first 5 members
        loadHomeMembers();
    }
    `
        : ""
    }
    ${
      hasEvents
        ? `
    // Initialize events calendar on BOTH index.html and events.html
    const eventsDays = document.getElementById('events-days');
    const eventsList = document.getElementById('events-list');
    const eventsMonthLabel = document.getElementById('events-month-label');

    if (eventsDays && eventsList && eventsMonthLabel) {
        initEventsCalendar();
    }
    `
        : ""
    }
    ${
      hasMap
        ? `
    // Initialize map
    initMap();
    `
        : ""
    }
    
    console.log('Website loaded successfully!');
});

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

${
  hasEvents
    ? `
// Events calendar (public events)
let eventsCurrentYear = null;
let eventsCurrentMonthIndex = null;
let eventsByDate = {};
let eventsSelectedDateStr = null;

function pad2(num) {
    return String(num).padStart(2, '0');
}

function getLocalTodayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
}

function monthLabelRo(year, monthIndex) {
    const dt = new Date(year, monthIndex, 1);
    return dt.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long' });
}

function formatDateInTimeZone(date, timeZone) {
    try {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    } catch {
        return getLocalTodayStr();
    }
}

function formatTimeInTimeZone(date, timeZone) {
    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    } catch {
        const d = new Date();
        return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    }
}

async function fetchEventsForRange(fromDate, toDate) {
    const url = API_URL + '/events/public?settlement=' + encodeURIComponent(SETTLEMENT_ID)
        + (fromDate ? ('&from=' + encodeURIComponent(fromDate)) : '')
        + (toDate ? ('&to=' + encodeURIComponent(toDate)) : '')
        + '&limit=500';

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch events');
    const data = await response.json();
    const events = (data && data.data && data.data.data) ? data.data.data : [];
    return Array.isArray(events) ? events : [];
}

function groupEventsByDate(events) {
    const grouped = {};
    events.forEach(ev => {
        const dateKey = String(ev.localDate || '');
        if (!dateKey) return;
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(ev);
    });

    Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));
    });

    return grouped;
}

function setEventsSelectedDate(dateStr) {
    eventsSelectedDateStr = dateStr;

    const selectedDateEl = document.getElementById('events-selected-date');
    if (selectedDateEl) {
        selectedDateEl.textContent = 'Evenimente: ' + dateStr;
        selectedDateEl.style.display = 'block';
    }

    renderEventsList(dateStr);

    // Update calendar selected state
    const daysEl = document.getElementById('events-days');
    if (daysEl) {
        const btns = daysEl.querySelectorAll('.events-day');
        btns.forEach(btn => {
            if (btn.getAttribute('data-date') === dateStr) {
                btn.classList.add('is-selected');
            } else {
                btn.classList.remove('is-selected');
            }
        });
    }
}

function eventBadgeHtml(ev) {
    const tz = String(ev.timeZone || 'Europe/Bucharest');
    const now = new Date();
    const todayTz = formatDateInTimeZone(now, tz);
    const nowTime = formatTimeInTimeZone(now, tz);

    const evDate = String(ev.localDate || '');
    const start = String(ev.startTime || '');
    const end = String(ev.endTime || '');

    if (evDate === todayTz) {
        if (start && end && nowTime >= start && nowTime <= end) {
            return '<span class="events-badge now">● Acum</span>';
        }
        if (start && nowTime < start) {
            return '<span class="events-badge future">→ Urmează</span>';
        }
    }

    if (evDate && evDate > todayTz) {
        return '<span class="events-badge future">→ Viitor</span>';
    }

    return '';
}

function renderEventsList(dateStr) {
    const listEl = document.getElementById('events-list');
    const loadingEl = document.getElementById('events-loading');

    if (loadingEl) loadingEl.style.display = 'none';

    if (!listEl) return;

    const events = eventsByDate[dateStr] || [];

    if (!events || events.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; color:#6b7280; padding: 16px 0;">Nu există evenimente în această zi.</div>';
        listEl.style.display = 'block';
        return;
    }

    listEl.innerHTML = events.map(ev => {
        const title = escapeHtml(ev.title || '');
        const desc = escapeHtml(ev.description || '');
        const loc = escapeHtml(ev.location || '');
        const linkUrl = String(ev.linkUrl || '');
        const time = escapeHtml(String(ev.startTime || '') + ' - ' + String(ev.endTime || ''));
        const tz = escapeHtml(String(ev.timeZone || ''));

        const badge = eventBadgeHtml(ev);
        const linkHtml = linkUrl
            ? '<a href="' + escapeHtml(linkUrl) + '" target="_blank" rel="noreferrer" style="color:#2563eb; text-decoration:none; font-weight:700;">Detalii</a>'
            : '';

        const metaBits = [];
        if (loc) metaBits.push('📍 ' + loc);
        if (tz) metaBits.push('🕒 ' + tz);

        return (
            '<div class="events-item">'
                + '<div class="events-item-top">'
                    + '<div class="events-item-time">' + time + '</div>'
                    + (badge ? badge : '')
                + '</div>'
                + '<div class="events-item-title">' + title + '</div>'
                + (metaBits.length ? ('<div class="events-item-meta">' + metaBits.join(' • ') + '</div>') : '')
                + (desc ? ('<div class="events-item-meta">' + desc + '</div>') : '')
                + (linkHtml ? ('<div class="events-item-meta">' + linkHtml + '</div>') : '')
            + '</div>'
        );
    }).join('');

    listEl.style.display = 'block';
}

function renderEventsCalendar(year, monthIndex) {
    const monthLabelEl = document.getElementById('events-month-label');
    const daysEl = document.getElementById('events-days');
    if (!daysEl) return;

    if (monthLabelEl) {
        monthLabelEl.textContent = monthLabelRo(year, monthIndex);
    }

    const todayStr = getLocalTodayStr();

    // Monday-first index
    const firstOfMonth = new Date(year, monthIndex, 1);
    const jsDay = firstOfMonth.getDay(); // 0 Sunday
    const mondayIndex = (jsDay + 6) % 7; // 0 Monday

    const totalDays = daysInMonth(year, monthIndex);
    const prevMonthDays = daysInMonth(year, monthIndex - 1);

    const cells = [];
    for (let i = 0; i < 42; i++) {
        const dayOffset = i - mondayIndex;
        const cellDate = new Date(year, monthIndex, 1 + dayOffset);
        const cellY = cellDate.getFullYear();
        const cellM = cellDate.getMonth() + 1;
        const cellD = cellDate.getDate();
        const dateStr = cellY + '-' + pad2(cellM) + '-' + pad2(cellD);

        const inCurrentMonth = cellDate.getMonth() === monthIndex;
        const isOutside = !inCurrentMonth;

        const eventsForDay = eventsByDate[dateStr] || [];
        const count = eventsForDay.length;

        const classes = ['events-day'];
        if (isOutside) classes.push('is-outside');
        if (dateStr === todayStr) classes.push('is-today');
        if (eventsSelectedDateStr && dateStr === eventsSelectedDateStr) classes.push('is-selected');

        let dotHtml = '';
        let countHtml = '';
        if (count > 0) {
            dotHtml = '<span class="events-day-dot" aria-hidden="true"></span>';
            countHtml = '<span class="events-day-count" aria-label="' + count + ' evenimente">' + count + '</span>';
        }

        cells.push(
            '<button type="button" class="' + classes.join(' ') + '" data-date="' + dateStr + '" ' + (isOutside ? 'disabled' : '') + '>'
                + '<div class="events-day-number">' + cellD + '</div>'
                + dotHtml
                + countHtml
            + '</button>'
        );
    }

    daysEl.innerHTML = cells.join('');

    // Bind click handlers
    const btns = daysEl.querySelectorAll('.events-day');
    btns.forEach(btn => {
        btn.addEventListener('click', function() {
            const dateStr = btn.getAttribute('data-date');
            if (!dateStr) return;
            setEventsSelectedDate(dateStr);
        });
    });
}

async function loadAndRenderEventsMonth(year, monthIndex) {
    eventsCurrentYear = year;
    eventsCurrentMonthIndex = monthIndex;

    const loadingEl = document.getElementById('events-loading');
    const listEl = document.getElementById('events-list');
    const selectedDateEl = document.getElementById('events-selected-date');

    if (loadingEl) loadingEl.style.display = 'block';
    if (listEl) listEl.style.display = 'none';
    if (selectedDateEl) selectedDateEl.style.display = 'none';

    const from = year + '-' + pad2(monthIndex + 1) + '-01';
    const to = year + '-' + pad2(monthIndex + 1) + '-' + pad2(daysInMonth(year, monthIndex));

    try {
        const events = await fetchEventsForRange(from, to);
        eventsByDate = groupEventsByDate(events);

        // Default selected date: today if inside month; otherwise first day
        const today = getLocalTodayStr();
        const defaultSelected = (today.substring(0, 7) === (year + '-' + pad2(monthIndex + 1))) ? today : from;

        if (!eventsSelectedDateStr || eventsSelectedDateStr.substring(0, 7) !== (year + '-' + pad2(monthIndex + 1))) {
            eventsSelectedDateStr = defaultSelected;
        }

        renderEventsCalendar(year, monthIndex);
        setEventsSelectedDate(eventsSelectedDateStr);

        const viewAllLink = document.getElementById('events-view-all');
        if (viewAllLink) {
            viewAllLink.style.display = 'inline-block';
        }

    } catch (error) {
        console.error('Error loading events:', error);
        if (loadingEl) {
            loadingEl.textContent = 'Eroare la încărcarea evenimentelor.';
        }
    }
}

function initEventsCalendar() {
    const prevBtn = document.getElementById('events-prev-month');
    const nextBtn = document.getElementById('events-next-month');

    const now = new Date();
    const startYear = now.getFullYear();
    const startMonth = now.getMonth();

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (eventsCurrentYear === null || eventsCurrentMonthIndex === null) return;
            let y = eventsCurrentYear;
            let m = eventsCurrentMonthIndex - 1;
            if (m < 0) { m = 11; y -= 1; }
            loadAndRenderEventsMonth(y, m);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (eventsCurrentYear === null || eventsCurrentMonthIndex === null) return;
            let y = eventsCurrentYear;
            let m = eventsCurrentMonthIndex + 1;
            if (m > 11) { m = 0; y += 1; }
            loadAndRenderEventsMonth(y, m);
        });
    }

    loadAndRenderEventsMonth(startYear, startMonth);
}
`
    : ""
}

${
  hasBlog
    ? `
// Fetch and display blog posts with pagination
let currentPage = 1;
const postsPerPage = 9;
let allPosts = [];
let filteredPosts = [];

async function loadBlogPosts() {
    const container = document.getElementById('all-blog-posts');
    const loadingMessage = document.getElementById('loading-message');
    
    try {
        const response = await fetch(\`\${API_URL}/blog-posts?settlement=\${SETTLEMENT_ID}\`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch blog posts');
        }
        
        const data = await response.json();
        const posts = data.data.data;
        
        // Hide loading message
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 60px 20px; font-size: 18px;">Nu există postări încă.</p>';
            container.style.display = 'block';
            return;
        }
        
        // Sort posts by date (newest first)
        const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Render posts with truncated content and link to individual post
        container.innerHTML = sortedPosts.map(post => {
            const escapedTitle = escapeHtml(post.title);
            const escapedDescription = escapeHtml(post.description || '');
            
            // Strip HTML tags and truncate content
            const strippedContent = (post.content || '').replace(/<[^>]*>/g, '');
            const truncatedContent = strippedContent.length > 200 
                ? escapeHtml(strippedContent.substring(0, 200)) + '...' 
                : escapeHtml(strippedContent);
            
            return \`
            <article class="blog-post" data-date="\${post.date}">
                <div class="blog-post-date">\${new Date(post.date).toLocaleDateString('ro-RO', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</div>
                <h3><a href="post.html?id=\${post._id}" style="color: inherit; text-decoration: none;">\${escapedTitle}</a></h3>
                <p class="blog-post-description">\${escapedDescription}</p>
                <div class="blog-post-content">\${truncatedContent}</div>
                <a href="post.html?id=\${post._id}" class="btn-read-more" style="display: inline-block; margin-top: 12px; padding: 8px 16px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; transition: background 0.3s;">Citește mai mult →</a>
            </article>
            \`;
        }).join('');
        
        container.style.display = 'grid';
        
        // Initialize posts arrays
        allPosts = Array.from(container.querySelectorAll('.blog-post'));
        filteredPosts = [...allPosts];
        
        // Initialize pagination
    const paginationControls = document.getElementById('pagination-controls');
    if (paginationControls && allPosts.length > postsPerPage) {
      paginationControls.style.display = 'flex';
      renderPagination();
      showPage(1);
    } else {
      if (paginationControls) {
        paginationControls.style.display = 'none';
      }
      // If posts <= 9, show all
      allPosts.forEach(post => post.style.display = 'block');
    }
        
        // Initialize search
        initializeSearch();
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        container.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 60px 20px; font-size: 18px;">Eroare la încărcarea postărilor. Vă rugăm să reîncărcați pagina.</p>';
        container.style.display = 'block';
    }
}

// Initialize search functionality
function initializeSearch() {
    const blogSearch = document.getElementById('blog-search');
    
    if (blogSearch) {
        blogSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            filteredPosts = allPosts.filter(post => {
                const title = post.querySelector('h3').textContent.toLowerCase();
                const description = post.querySelector('.blog-post-description').textContent.toLowerCase();
                const content = post.querySelector('.blog-post-content').textContent.toLowerCase();
                
                return title.includes(searchTerm) || description.includes(searchTerm) || content.includes(searchTerm);
            });
            
            currentPage = 1;
            
            // Show/hide pagination based on filtered results
      const paginationControls = document.getElementById('pagination-controls');
      if (paginationControls) {
        if (filteredPosts.length > postsPerPage) {
          paginationControls.style.display = 'flex';
          renderPagination();
        } else {
          paginationControls.style.display = 'none';
        }
      }
            
            showPage(1);
        });
    }
}

function showPage(page) {
    currentPage = page;
    const startIndex = (page - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    
    // Hide all posts first
    allPosts.forEach(post => post.style.display = 'none');
    
    // Show only posts for current page from filtered results
    filteredPosts.forEach((post, index) => {
        if (index >= startIndex && index < endIndex) {
            post.style.display = 'block';
        }
    });
    
    // Update pagination buttons
    updatePaginationButtons();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const pagesContainer = document.getElementById('pagination-pages');
    pagesContainer.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-page';
        pageBtn.textContent = i;
        pageBtn.onclick = () => showPage(i);
        pagesContainer.appendChild(pageBtn);
    }
    
    updatePaginationButtons();
}

function updatePaginationButtons() {
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageButtons = document.querySelectorAll('.pagination-page');
    
    // Update prev/next buttons
  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
  }
  if (nextBtn) {
    nextBtn.disabled = currentPage === totalPages;
  }
    
    // Update page number buttons
    pageButtons.forEach((btn, index) => {
        if (index + 1 === currentPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        showPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}`
    : ""
}

// Load blog posts for home page (index.html) - only first 5
${
  hasBlog
    ? `async function loadHomeBlogPosts() {
    const container = document.getElementById('blog-posts-container');
    const loadingMessage = document.getElementById('home-blog-loading');
    
    try {
        const response = await fetch(\`\${API_URL}/blog-posts?settlement=\${SETTLEMENT_ID}\`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch blog posts');
        }
        
        const data = await response.json();
        const posts = data.data.data;
        
        // Hide loading message
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280;">Nu există postări încă.</p>';
            container.style.display = 'grid';
            return;
        }
        
        // Sort posts by date (newest first) and take only first 5
        const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        const displayedPosts = sortedPosts.slice(0, 5);
        const remainingCount = sortedPosts.length - 5;
        
        // Render posts with truncated content
        let postsHTML = displayedPosts.map(post => {
            const escapedTitle = escapeHtml(post.title);
            const escapedDescription = escapeHtml(post.description || '');
            
            // Strip HTML tags and truncate content
            const strippedContent = (post.content || '').replace(/<[^>]*>/g, '');
            const truncatedContent = strippedContent.length > 150 
                ? escapeHtml(strippedContent.substring(0, 150)) + '...' 
                : escapeHtml(strippedContent);
            
            return \`
            <a href="blog.html" class="blog-post" style="text-decoration: none; color: inherit; display: block;">
                <div class="blog-post-date">\${new Date(post.date).toLocaleDateString('ro-RO', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</div>
                <h3>\${escapedTitle}</h3>
                <p class="blog-post-description">\${escapedDescription}</p>
                <div class="blog-post-content">\${truncatedContent}</div>
            </a>
            \`;
        }).join('');
        
        // Add "view all" link if there are more posts
        if (remainingCount > 0) {
            postsHTML += \`
            <div class="blog-more">
                <p>... și încă \${remainingCount} \${remainingCount === 1 ? 'postare' : 'postări'}</p>
                <a href="blog.html" class="btn-view-all">Vezi toate postările</a>
            </div>
            \`;
        }
        
        container.innerHTML = postsHTML;
        container.style.display = 'grid';
        
    } catch (error) {
        console.error('Error loading home blog posts:', error);
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">Eroare la încărcarea postărilor.</p>';
        container.style.display = 'grid';
    }
}
`
    : ""
}
${
  hasMembers
    ? `
// Members page specific JavaScript (for members.html)
let currentMembersPage = 1;
const membersPerPage = 12;
let allMemberElements = [];
let filteredMemberElements = [];

function memberPhotoUrl(memberId) {
  return API_URL + '/members/' + memberId + '/photo';
}

function renderMemberAvatar(member) {
  if (member && member.photoPath) {
    const fullName = (member.firstName || '') + ' ' + (member.lastName || '');
    return '<div class="member-avatar has-photo"><img src="' + memberPhotoUrl(member._id) + '" alt="' + escapeHtml(fullName) + '" loading="lazy" onerror="this.onerror=null; var p=this.parentElement; if(p){p.classList.remove(\\\'has-photo\\\'); p.textContent=\\\'👤\\\';}" /></div>';
  }
  return '<div class="member-avatar">👤</div>';
}

function renderMemberAvatarLarge(member) {
  if (member && member.photoPath) {
    const fullName = (member.firstName || '') + ' ' + (member.lastName || '');
    return '<div class="member-modal-avatar-large has-photo"><img src="' + memberPhotoUrl(member._id) + '" alt="' + escapeHtml(fullName) + '" loading="lazy" onerror="this.onerror=null; var p=this.parentElement; if(p){p.classList.remove(\\\'has-photo\\\'); p.textContent=\\\'👤\\\';}" /></div>';
  }
  return '<div class="member-modal-avatar-large">👤</div>';
}

async function loadAllMembers() {
    const container = document.getElementById('all-members');
    const loadingMessage = document.getElementById('members-loading-message');
    
    try {
        const response = await fetch(\`\${API_URL}/members?settlement=\${SETTLEMENT_ID}\`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch members');
        }
        
        const data = await response.json();
        const members = data.data.data;
        
        // Hide loading message
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        
        if (members.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 60px 20px; font-size: 18px;">Nu există membri încă.</p>';
            container.style.display = 'block';
            return;
        }
        
        // Define position hierarchy
        const positionOrder = {
            'președinte': 1,
            'presedinte': 1,
            'vice-președinte': 2,
            'vice-presedinte': 2,
            'vicepreședinte': 2,
            'vicepresedinte': 2,
            'consilier': 3,
            'membru': 4
        };
        
        // Sort members by position hierarchy, then alphabetically
        const sortedMembers = members.sort((a, b) => {
            const posA = (a.position?.toLowerCase() || '').trim();
            const posB = (b.position?.toLowerCase() || '').trim();
            
            const orderA = positionOrder[posA] || 999;
            const orderB = positionOrder[posB] || 999;
            
            // If same order level, sort alphabetically by last name
            if (orderA === orderB) {
                return a.lastName.localeCompare(b.lastName);
            }
            
            return orderA - orderB;
        });
        
        // Render all members
        container.innerHTML = sortedMembers.map(member => {
            const fullName = \`\${member.firstName} \${member.lastName}\`;
            const birthYear = new Date(member.dateOfBirth).getFullYear();
            const position = member.position ? \`<div class="member-position">\${escapeHtml(member.position)}</div>\` : '';
            
            return \`
            <div class="member-card" data-member-id="\${member._id}" data-name="\${escapeHtml(fullName.toLowerCase())}" onclick="openMemberModal('\${member._id}')">
            \${renderMemberAvatar(member)}
                <h3>\${escapeHtml(fullName)}</h3>
                \${position}
                <div class="member-info">📅 Născut \${birthYear}</div>
            </div>
            \`;
        }).join('');
        
        container.style.display = 'grid';
        
        // Initialize members arrays
        allMemberElements = Array.from(container.querySelectorAll('.member-card'));
        filteredMemberElements = [...allMemberElements];
        
        // Initialize pagination
        const paginationControls = document.getElementById('members-pagination-controls');
        if (paginationControls && allMemberElements.length > membersPerPage) {
            paginationControls.style.display = 'flex';
            renderMembersPagination();
            showMembersPage(1);
        } else {
            if (paginationControls) {
                paginationControls.style.display = 'none';
            }
            // If members <= 12, show all
            allMemberElements.forEach(member => member.style.display = 'block');
        }
        
        // Initialize search
        initializeMembersSearch();
        
    } catch (error) {
        console.error('Error loading members:', error);
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        container.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 60px 20px; font-size: 18px;">Eroare la încărcarea membrilor. Vă rugăm să reîncărcați pagina.</p>';
        container.style.display = 'block';
    }
}

// Initialize members search functionality
function initializeMembersSearch() {
    const membersSearch = document.getElementById('members-search');
    
    if (membersSearch) {
        membersSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            filteredMemberElements = allMemberElements.filter(memberCard => {
                const name = memberCard.getAttribute('data-name');
                const position = memberCard.querySelector('.member-position')?.textContent.toLowerCase() || '';
                
                return name.includes(searchTerm) || position.includes(searchTerm);
            });
            
            currentMembersPage = 1;
            
            // Show/hide pagination based on filtered results
            const paginationControls = document.getElementById('members-pagination-controls');
            if (paginationControls) {
                if (filteredMemberElements.length > membersPerPage) {
                    paginationControls.style.display = 'flex';
                    renderMembersPagination();
                } else {
                    paginationControls.style.display = 'none';
                }
            }
            
            showMembersPage(1);
        });
    }
}

function showMembersPage(page) {
    currentMembersPage = page;
    const startIndex = (page - 1) * membersPerPage;
    const endIndex = startIndex + membersPerPage;
    
    // Hide all members first
    allMemberElements.forEach(member => member.style.display = 'none');
    
    // Show only members for current page from filtered results
    filteredMemberElements.forEach((member, index) => {
        if (index >= startIndex && index < endIndex) {
            member.style.display = 'block';
        }
    });
    
    // Update pagination buttons
    updateMembersPaginationButtons();
}

function renderMembersPagination() {
    const totalPages = Math.ceil(filteredMemberElements.length / membersPerPage);
    const pagesContainer = document.getElementById('members-pagination-pages');
    pagesContainer.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-page';
        pageBtn.textContent = i;
        pageBtn.onclick = () => showMembersPage(i);
        
        if (i === currentMembersPage) {
            pageBtn.classList.add('active');
        }
        
        pagesContainer.appendChild(pageBtn);
    }
}

function updateMembersPaginationButtons() {
    const totalPages = Math.ceil(filteredMemberElements.length / membersPerPage);
    const prevBtn = document.getElementById('members-prev-btn');
    const nextBtn = document.getElementById('members-next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = currentMembersPage === 1;
    }
    if (nextBtn) {
        nextBtn.disabled = currentMembersPage === totalPages;
    }
    
    // Update active page button
    const pageButtons = document.querySelectorAll('#members-pagination-pages .pagination-page');
    pageButtons.forEach((btn, index) => {
        if (index + 1 === currentMembersPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function changeMembersPage(direction) {
    const totalPages = Math.ceil(filteredMemberElements.length / membersPerPage);
    const newPage = currentMembersPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        showMembersPage(newPage);
    }
}

// Load members for home page
async function loadHomeMembers() {
    const container = document.getElementById('members-container');
    const loadingMessage = document.getElementById('home-members-loading');
    
    try {
        const response = await fetch(\`\${API_URL}/members?settlement=\${SETTLEMENT_ID}\`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch members');
        }
        
        const data = await response.json();
        const members = data.data.data;
        
        // Hide loading message
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        
        if (members.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280;">Nu există membri încă.</p>';
            container.style.display = 'grid';
            return;
        }
        
        // Define position hierarchy
        const positionOrder = {
            'președinte': 1,
            'presedinte': 1,
            'vice-președinte': 2,
            'vice-presedinte': 2,
            'vicepreședinte': 2,
            'vicepresedinte': 2,
            'consilier': 3,
            'membru': 4
        };
        
        // Sort members by position hierarchy, then alphabetically and take only first 5
        const sortedMembers = members.sort((a, b) => {
            const posA = (a.position?.toLowerCase() || '').trim();
            const posB = (b.position?.toLowerCase() || '').trim();
            
            const orderA = positionOrder[posA] || 999;
            const orderB = positionOrder[posB] || 999;
            
            // If same order level, sort alphabetically by last name
            if (orderA === orderB) {
                return a.lastName.localeCompare(b.lastName);
            }
            
            return orderA - orderB;
        });
        const displayedMembers = sortedMembers.slice(0, 5);
        const remainingCount = members.length - 5;
        
        // Render members
        let membersHTML = displayedMembers.map(member => {
            const fullName = \`\${member.firstName} \${member.lastName}\`;
            const birthYear = new Date(member.dateOfBirth).getFullYear();
            const position = member.position ? \`<div class="member-position">\${escapeHtml(member.position)}</div>\` : '';
            
            return \`
            <a href="members.html" class="member-card" data-member-id="\${member._id}" style="text-decoration: none; color: inherit;">
            \${renderMemberAvatar(member)}
                <h3>\${escapeHtml(fullName)}</h3>
                \${position}
                <div class="member-info">📅 Născut \${birthYear}</div>
            </a>
            \`;
        }).join('');
        
        // Add "view all" link if there are more members
        if (remainingCount > 0) {
            membersHTML += \`
            <div class="members-more">
                <p>... și încă \${remainingCount} \${remainingCount === 1 ? 'membru' : 'membri'}</p>
                <a href="members.html" class="btn-view-all">Vezi toți membrii</a>
            </div>
            \`;
        }
        
        container.innerHTML = membersHTML;
        container.style.display = 'grid';
        
    } catch (error) {
        console.error('Error loading members:', error);
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">Eroare la încărcarea membrilor.</p>';
        container.style.display = 'grid';
    }
}

// Open member modal
async function openMemberModal(memberId) {
    try {
        const response = await fetch(\`\${API_URL}/members/\${memberId}\`);
        if (!response.ok) throw new Error('Failed to fetch member');
        
        const data = await response.json();
        const member = data.data.data;
        
        const fullName = \`\${member.firstName} \${member.lastName}\`;
        const birthDate = new Date(member.dateOfBirth).toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const position = member.position ? \`<div class="member-position">\${escapeHtml(member.position)}</div>\` : '';
        const gender = member.gender && member.gender !== 'nespecificat' ? \`<div class="member-info-item"><span>⚧</span><span>\${escapeHtml(member.gender)}</span></div>\` : '';
        const description = member.description ? \`
            <h3>Despre</h3>
            <p>\${escapeHtml(member.description)}</p>
        \` : '';

        const avatarLarge = renderMemberAvatarLarge(member);
        
        const modalHTML = \`
        <div class="member-modal active" id="member-modal" onclick="closeMemberModal(event)">
            <div class="member-modal-content" onclick="event.stopPropagation()">
                <button class="member-modal-close" onclick="closeMemberModal()">✕</button>
                <div class="member-modal-header">
              \${avatarLarge}
                    <h2>\${escapeHtml(fullName)}</h2>
                    \${position}
                </div>
                <div class="member-modal-body">
                    <div class="member-modal-info-grid">
                        <div class="member-info-item">
                            <span>📅</span>
                            <span>Născut: \${birthDate}</span>
                        </div>
                        \${gender}
                    </div>
                    \${description}
                </div>
            </div>
        </div>
        \`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        console.error('Error loading member details:', error);
        alert('Eroare la încărcarea detaliilor membrului.');
    }
}

// Close member modal
function closeMemberModal(event) {
    if (event && event.target.id !== 'member-modal') return;
    const modal = document.getElementById('member-modal');
    if (modal) {
        modal.remove();
    }
}
`
    : ""
}
${
  hasMap
    ? `
// Initialize Leaflet map
let mapInstance = null; // Track map instance globally

function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        // Map element doesn't exist on this page, silently return
        return;
    }
    
    // Check if map is already initialized
    if (mapInstance !== null || mapElement._leaflet_id) {
        console.log('Map already initialized');
        return;
    }
    
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded');
        mapElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ef4444;"><p>Eroare: Biblioteca hărților nu s-a încărcat.</p></div>';
        return;
    }
    
    try {
        console.log('Initializing map at coordinates:', LOCATION);
        console.log('Map element dimensions:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);
        
        mapInstance = L.map('map', {
            scrollWheelZoom: true,
            dragging: true,
            zoomControl: true
        }).setView([LOCATION.lat, LOCATION.lng], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(mapInstance);
        
        // Custom icon for coordinates
        const customIcon = L.divIcon({
            html: \`
                <div style="
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: 3px solid white;
                    border-radius: 50% 50% 50% 0;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                    transform: rotate(-45deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                ">
                    <span style="
                        transform: rotate(45deg);
                        font-size: 16px;
                    ">📍</span>
                </div>
            \`,
            className: 'custom-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
        
        // Fetch and display coordinates instead of settlement marker
        console.log('Fetching coordinates from:', \`\${API_URL}/coordinates?settlement=\${SETTLEMENT_ID}\`);
        
        fetch(\`\${API_URL}/coordinates?settlement=\${SETTLEMENT_ID}\`)
            .then(response => {
                console.log('Coordinates API response status:', response.status);
                if (!response.ok) {
                    throw new Error(\`HTTP error! status: \${response.status}\`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Coordinates API response data:', data);
                const coordinates = data.data.data;
                console.log('Loaded coordinates count:', coordinates.length);
                
                if (coordinates.length === 0) {
                    console.warn('No coordinates found for this settlement');
                    return;
                }
                
                // Add marker for each coordinate with custom icon
                coordinates.forEach(coord => {
                    console.log('Adding marker for:', coord.name, 'at', coord.latitude, coord.longitude);
                    L.marker([coord.latitude, coord.longitude], { icon: customIcon })
                        .addTo(mapInstance)
                        .bindPopup(\`
                            <div style="padding: 8px 4px; font-family: system-ui, -apple-system, sans-serif;">
                                <strong style="font-size: 15px; color: #667eea; display: block; margin-bottom: 4px;">\${coord.name}</strong>
                                <span style="font-size: 12px; color: #6b7280;">📍 Punct de interes</span>
                            </div>
                        \`);
                });
                
                console.log('All coordinate markers added successfully');
            })
            .catch(error => {
                console.error('Error loading coordinates:', error);
                console.error('Error details:', error.message);
            });
            
        console.log('Map initialized successfully');
        
        // Force map to resize multiple times to ensure proper rendering
        setTimeout(() => {
            if (mapInstance) {
                mapInstance.invalidateSize();
                console.log('Map resized (100ms)');
            }
        }, 100);
        
        setTimeout(() => {
            if (mapInstance) {
                mapInstance.invalidateSize();
                console.log('Map resized (500ms)');
            }
        }, 500);
        
        // Final resize after page fully loaded
        window.addEventListener('load', () => {
            if (mapInstance) {
                mapInstance.invalidateSize();
                console.log('Map resized (window loaded)');
            }
        });
    } catch (error) {
        console.error('Error initializing map:', error);
        mapElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ef4444;"><p>Eroare la inițializarea hărții.</p></div>';
    }
}`
    : ""
}`;
  };

  const handleViewCode = () => {
    setShowCodeModal(true);
  };

  const renderComponentPreview = (component: WebsiteComponent) => {
    const alignmentClass = `align-${component.alignment}`;

    // Determine which sections exist for navigation (same logic as generateHTML)
    const hasAbout = components.some((c) => c.type === "about");
    const hasContact = components.some((c) => c.type === "contact");
    const hasBlog = components.some((c) => c.type === "blog");
    const hasMembers = components.some((c) => c.type === "members");
    const hasEvents = components.some((c) => c.type === "events");

    switch (component.type) {
      case "header":
        // Match the generated HTML logic
        const previewHeaderTitle =
          component.content.title || `Primăria ${settlement?.name || ""}`;
        const previewHeaderSubtitle = "Pagina Oficială";

        // Build dynamic navigation based on existing sections
        const navLabels: string[] = [];
        if (hasAbout) navLabels.push("Despre");
        if (hasMembers) navLabels.push("Membrii");
        if (hasEvents) navLabels.push("Evenimente");
        if (hasBlog) navLabels.push("Noutăți");
        if (hasContact) navLabels.push("Contact");

        return (
          <header className={`preview-component header ${alignmentClass}`}>
            <div className="layout-container">
              <h1>{previewHeaderTitle}</h1>
              <p
                className="header-subtitle"
                style={{
                  fontSize: "14px",
                  opacity: 0.9,
                  fontStyle: "italic",
                  margin: "5px 0 10px 0",
                }}
              >
                {previewHeaderSubtitle}
              </p>
              {navLabels.length > 0 && (
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    gap: "10px",
                    justifyContent:
                      alignmentClass === "align-center"
                        ? "center"
                        : alignmentClass === "align-right"
                          ? "flex-end"
                          : "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  {navLabels.map((label, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.2)",
                        color: "white",
                        fontSize: "14px",
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>
        );

      case "hero":
        // Match the generated HTML logic
        const previewHeroTitle =
          component.content.title !== undefined
            ? component.content.title
            : "Bine ați venit";
        const previewHeroSubtitle =
          component.content.subtitle !== undefined
            ? component.content.subtitle
            : `la ${settlement?.name || ""}`;

        return (
          <section className={`preview-component hero ${alignmentClass}`}>
            <div className="layout-container">
              {previewHeroTitle && <h1>{previewHeroTitle}</h1>}
              {previewHeroSubtitle && <p>{previewHeroSubtitle}</p>}
            </div>
          </section>
        );

      case "about":
        // Match the generated HTML logic
        const previewAboutTitle =
          component.content.title !== undefined
            ? component.content.title
            : "Despre";

        return (
          <section
            className={`preview-component about ${alignmentClass}`}
            id="despre"
          >
            <div className="layout-container">
              {previewAboutTitle && <h2>{previewAboutTitle}</h2>}
              <p>
                {component.content.description ||
                  "Descriere despre localitate..."}
              </p>
            </div>
          </section>
        );

      case "services":
        // Match the generated HTML logic
        const previewServicesTitle =
          component.content.title !== undefined
            ? component.content.title
            : "Servicii";

        return (
          <section className={`preview-component services ${alignmentClass}`}>
            <div className="layout-container">
              {previewServicesTitle && <h2>{previewServicesTitle}</h2>}
              <p>
                {component.content.description ||
                  "Lista serviciilor disponibile..."}
              </p>
            </div>
          </section>
        );

      case "events":
        const previewEventsTitle =
          component.content.title !== undefined
            ? component.content.title
            : "Evenimente";

        return (
          <section
            className={`preview-component events ${alignmentClass}`}
            id="evenimente"
          >
            <div className="layout-container">
              {previewEventsTitle && <h2>{previewEventsTitle}</h2>}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "16px",
                  marginTop: "24px",
                }}
              >
                {events.length === 0 ? (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      background: "#f9fafb",
                      padding: "40px 20px",
                      borderRadius: "12px",
                      textAlign: "center",
                      border: "2px dashed #d1d5db",
                    }}
                  >
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                      📅
                    </div>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Niciun eveniment încă
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#9ca3af",
                        marginTop: "8px",
                      }}
                    >
                      Creează evenimente din pagina de administrare.
                    </p>
                  </div>
                ) : (
                  events.slice(0, 5).map((ev) => (
                    <div
                      key={ev._id}
                      style={{
                        background: "white",
                        padding: "18px",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "10px",
                          flexWrap: "wrap",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#10b981",
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {ev.localDate}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            fontWeight: "700",
                          }}
                        >
                          {ev.startTime} - {ev.endTime}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: "800",
                            color: "#111827",
                          }}
                        >
                          {ev.title}
                        </h4>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "800",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            background:
                              ev.status === "published"
                                ? "rgba(16,185,129,0.12)"
                                : "rgba(107,114,128,0.12)",
                            color:
                              ev.status === "published" ? "#047857" : "#374151",
                          }}
                        >
                          {ev.status === "published" ? "Publicat" : "Draft"}
                        </span>
                      </div>
                      {(ev.location || ev.timeZone) && (
                        <div
                          style={{
                            marginTop: "10px",
                            color: "#6b7280",
                            fontSize: "13px",
                          }}
                        >
                          {ev.location ? `📍 ${ev.location}` : ""}
                          {ev.location && ev.timeZone ? " • " : ""}
                          {ev.timeZone ? `🕒 ${ev.timeZone}` : ""}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        );

      case "blog":
        // Match the generated HTML logic
        const previewBlogTitle =
          component.content.title !== undefined
            ? component.content.title
            : "Ultimele Noutăți";

        return (
          <section
            className={`preview-component blog ${alignmentClass}`}
            id="noutati"
          >
            <div className="layout-container">
              {previewBlogTitle && <h2>{previewBlogTitle}</h2>}
              <div
                className="blog-posts"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "20px",
                  marginTop: "24px",
                }}
              >
                {blogPosts.length === 0 ? (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      background: "#f9fafb",
                      padding: "40px 20px",
                      borderRadius: "12px",
                      textAlign: "center",
                      border: "2px dashed #d1d5db",
                    }}
                  >
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                      📝
                    </div>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Nicio postare încă
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#9ca3af",
                        marginTop: "8px",
                      }}
                    >
                      Adaugă prima postare pentru a o vedea aici!
                    </p>
                  </div>
                ) : (
                  <>
                    {[...blogPosts]
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .slice(0, 5)
                      .map((post) => (
                        <div
                          key={post._id}
                          style={{
                            background: "white",
                            padding: "20px",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            transition: "all 0.3s ease",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#10b981",
                              fontWeight: "600",
                              marginBottom: "10px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {new Date(post.date).toLocaleDateString("ro-RO", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <h4
                            style={{
                              marginBottom: "12px",
                              fontSize: "18px",
                              color: "#1f2937",
                              fontWeight: "700",
                              lineHeight: "1.4",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {post.title}
                          </h4>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#6b7280",
                              lineHeight: "1.6",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {post.description}
                          </p>
                        </div>
                      ))}
                    {blogPosts.length > 5 && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "#6b7280",
                          fontSize: "16px",
                          fontStyle: "italic",
                        }}
                      >
                        ... și încă {blogPosts.length - 5} postări
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        );

      case "members":
        const previewMembersTitle =
          component.content.title !== undefined
            ? component.content.title
            : "Echipa Noastră";

        return (
          <section
            className={`preview-component members ${alignmentClass}`}
            id="membri"
          >
            <div className="layout-container">
              {previewMembersTitle && <h2>{previewMembersTitle}</h2>}
              <div
                className="members-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "24px",
                  marginTop: "24px",
                }}
              >
                {members.length === 0 ? (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      background: "#f9fafb",
                      padding: "40px 20px",
                      borderRadius: "12px",
                      textAlign: "center",
                      border: "2px dashed #d1d5db",
                    }}
                  >
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                      👥
                    </div>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      Niciun membru încă
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#9ca3af",
                        marginTop: "8px",
                      }}
                    >
                      Adaugă primul membru pentru a-l vedea aici!
                    </p>
                  </div>
                ) : (
                  <>
                    {members.slice(0, 5).map((member) =>
                      (() => {
                        const showPhoto =
                          Boolean(member.photoPath) &&
                          !memberImageErrors[member._id];

                        return (
                          <div
                            key={member._id}
                            style={{
                              background: "white",
                              padding: "24px",
                              borderRadius: "12px",
                              border: "1px solid #e5e7eb",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                              textAlign: "center",
                              transition: "all 0.3s ease",
                            }}
                          >
                            <div
                              style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                background: showPhoto
                                  ? "transparent"
                                  : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px",
                                fontSize: showPhoto ? 0 : "32px",
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              {showPhoto && (
                                <img
                                  src={memberAPI.getPhotoUrl(member._id)}
                                  alt={`${member.firstName} ${member.lastName}`}
                                  loading="lazy"
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "50%",
                                    display: "block",
                                  }}
                                  onError={() =>
                                    setMemberImageErrors((prev) => ({
                                      ...prev,
                                      [member._id]: true,
                                    }))
                                  }
                                />
                              )}
                              {!showPhoto && <span aria-hidden="true">👤</span>}
                            </div>
                            <h4
                              style={{
                                marginBottom: "4px",
                                fontSize: "18px",
                                color: "#1f2937",
                                fontWeight: "700",
                              }}
                            >
                              {member.firstName} {member.lastName}
                            </h4>
                            {member.position && (
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#6366f1",
                                  fontWeight: "600",
                                  marginBottom: "8px",
                                }}
                              >
                                {member.position}
                              </p>
                            )}
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#9ca3af",
                              }}
                            >
                              📅{" "}
                              {new Date(member.dateOfBirth).toLocaleDateString(
                                "ro-RO",
                                {
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        );
                      })(),
                    )}
                    {members.length > 5 && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "#6b7280",
                          fontSize: "16px",
                          fontStyle: "italic",
                        }}
                      >
                        ... și încă {members.length - 5} membri
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        );

      case "map":
        // Match the generated HTML logic
        const previewMapTitle =
          component.content.title !== undefined
            ? component.content.title
            : "Localizare";

        return (
          <section
            className={`preview-component map ${alignmentClass}`}
            id="localizare"
          >
            <div className="layout-container">
              {previewMapTitle && <h2>{previewMapTitle}</h2>}

              {/* Control buttons pentru coordonate */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "15px",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => {
                    setIsAddingCoordinate(!isAddingCoordinate);
                    if (isAddingCoordinate) {
                      setShowCoordinateForm(false);
                      setTempCoordinate(null);
                    }
                  }}
                  style={{
                    padding: "10px 20px",
                    background: isAddingCoordinate ? "#ef4444" : "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {isAddingCoordinate ? "❌ Anulează" : "➕ Adaugă Punct"}
                </button>
                {isAddingCoordinate && (
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      fontStyle: "italic",
                    }}
                  >
                    💡 Click pe hartă pentru a adăuga un punct
                  </span>
                )}
              </div>

              <div
                id="map"
                style={{
                  width: "100%",
                  height: "400px",
                  marginTop: "10px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: isAddingCoordinate
                    ? "2px solid #10b981"
                    : "2px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  cursor: isAddingCoordinate ? "crosshair" : "default",
                }}
              >
                {settlement ? (
                  <MapContainer
                    center={[settlement.lat, settlement.lng]}
                    zoom={11}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler
                      onClick={handleMapClick}
                      enabled={isAddingCoordinate}
                    />

                    {coordinates.map((coord) => (
                      <Marker
                        key={coord._id}
                        position={[coord.latitude, coord.longitude]}
                        icon={createCustomIcon()}
                      >
                        <Popup>
                          <div
                            style={{
                              padding: "8px 4px",
                              fontFamily:
                                "system-ui, -apple-system, sans-serif",
                            }}
                          >
                            <strong
                              style={{
                                fontSize: "15px",
                                color: "#667eea",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              {coord.name}
                            </strong>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                display: "block",
                                marginBottom: "8px",
                              }}
                            >
                              📍 Punct de interes
                            </span>
                            <button
                              onClick={() => handleDeleteCoordinate(coord._id)}
                              style={{
                                padding: "6px 12px",
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                                width: "100%",
                              }}
                            >
                              🗑️ Șterge
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {tempCoordinate && (
                      <Marker
                        position={[tempCoordinate.lat, tempCoordinate.lng]}
                        icon={createCustomIcon()}
                      >
                        <Popup>
                          <strong>Punct nou</strong>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <p style={{ color: "#6b7280" }}>Se încarcă harta...</p>
                  </div>
                )}
              </div>

              {/* Form pentru adăugare coordonată */}
              {showCoordinateForm && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "20px",
                    background: "#f9fafb",
                    border: "2px solid #10b981",
                    borderRadius: "12px",
                  }}
                >
                  <h3 style={{ marginBottom: "15px", color: "#1f2937" }}>
                    Adaugă Punct Nou
                  </h3>
                  <form onSubmit={handleCreateCoordinate}>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "600",
                          color: "#374151",
                        }}
                      >
                        Nume Punct:
                      </label>
                      <input
                        type="text"
                        value={coordinateFormData.name}
                        onChange={(e) =>
                          setCoordinateFormData({
                            ...coordinateFormData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Ex: Primăria, Școala, Parc"
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                        required
                        autoFocus
                      />
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "15px",
                        marginBottom: "15px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Latitudine:
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={coordinateFormData.latitude}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            background: "#f3f4f6",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Longitudine:
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={coordinateFormData.longitude}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            background: "#f3f4f6",
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="submit"
                        style={{
                          padding: "12px 24px",
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        ✅ Salvează Punct
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCoordinateForm(false);
                          setTempCoordinate(null);
                          setIsAddingCoordinate(false);
                        }}
                        style={{
                          padding: "12px 24px",
                          background: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        Anulează
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </section>
        );

      case "contact":
        // Match the generated HTML logic
        const previewContactTitle =
          component.content.title !== undefined
            ? component.content.title
            : "Contact";

        return (
          <section
            className={`preview-component contact ${alignmentClass}`}
            id="contact"
          >
            <div className="layout-container">
              {previewContactTitle && <h2>{previewContactTitle}</h2>}
              <p>
                {component.content.description || "Informații de contact..."}
              </p>
            </div>
          </section>
        );

      case "footer":
        return (
          <footer className={`preview-component footer ${alignmentClass}`}>
            <div className="layout-container">
              <p>
                © 2025 {(settlement?.name ?? "").trim() || settlement?.judet}.
                Toate drepturile rezervate.
              </p>
            </div>
          </footer>
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
    return (
      <div className="error-container">
        <h2>Acces Interzis sau Localitate Inexistentă</h2>
        <p>
          Nu aveți permisiunea de a accesa această localitate sau aceasta nu
          există.
        </p>
        <Link to="/" className="btn-primary">
          Înapoi la Dashboard
        </Link>
      </div>
    );
  }

  const previewWidth =
    previewMode === "desktop"
      ? "100%"
      : previewMode === "tablet"
        ? "768px"
        : "375px";

  const buildGeneratedPreviewSrcDoc = () => {
    const css = generateCSS().replace(/<\/style>/gi, "<\\/style>");
    const js = generateJS().replace(/<\/script>/gi, "<\\/script>");

    const safeJson = (value: unknown) =>
      JSON.stringify(value ?? null).replace(/</g, "\\u003c");

    const publishedEvents = events.filter((ev) => ev.status === "published");

    const stubScript = String.raw`
(function () {
  const BLOG_POSTS = ${safeJson(blogPosts)};
  const MEMBERS = ${safeJson(members)};
  const COORDINATES = ${safeJson(coordinates)};
  const EVENTS = ${safeJson(publishedEvents)};

  const realFetch = window.fetch ? window.fetch.bind(window) : null;

  function jsonResponse(payload, status) {
    return new Response(JSON.stringify(payload), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  function okList(list) {
    const arr = Array.isArray(list) ? list : [];
    return { status: 'success', results: arr.length, data: { data: arr } };
  }

  function okSingle(doc) {
    return { status: 'success', data: { data: doc } };
  }

  window.fetch = function (input, init) {
    try {
      const urlStr = typeof input === 'string' ? input : (input && input.url) ? input.url : '';

      if (urlStr.indexOf('/events/public') !== -1) {
        return Promise.resolve(jsonResponse(okList(EVENTS)));
      }

      if (urlStr.indexOf('/blog-posts?') !== -1) {
        return Promise.resolve(jsonResponse(okList(BLOG_POSTS)));
      }
      const blogMatch = urlStr.match(/\/blog-posts\/([a-f0-9]{24})(\b|\?|#|\/)/i);
      if (blogMatch) {
        const id = blogMatch[1];
        const doc = Array.isArray(BLOG_POSTS) ? BLOG_POSTS.find(function (p) { return p && p._id === id; }) : null;
        if (!doc) return Promise.resolve(jsonResponse({ status: 'fail', message: 'Not found' }, 404));
        return Promise.resolve(jsonResponse(okSingle(doc)));
      }

      if (urlStr.indexOf('/members?') !== -1) {
        return Promise.resolve(jsonResponse(okList(MEMBERS)));
      }
      const memberMatch = urlStr.match(/\/members\/([a-f0-9]{24})(\b|\?|#|\/)/i);
      if (memberMatch && urlStr.indexOf('/photo') === -1) {
        const id = memberMatch[1];
        const doc = Array.isArray(MEMBERS) ? MEMBERS.find(function (m) { return m && m._id === id; }) : null;
        if (!doc) return Promise.resolve(jsonResponse({ status: 'fail', message: 'Not found' }, 404));
        return Promise.resolve(jsonResponse(okSingle(doc)));
      }

      if (urlStr.indexOf('/coordinates?') !== -1) {
        return Promise.resolve(jsonResponse(okList(COORDINATES)));
      }
    } catch {
      // fall through
    }

    return realFetch
      ? realFetch(input, init)
      : Promise.reject(new Error('fetch unavailable'));
  };

  // Keep preview stable: don't navigate to other html pages in this iframe.
  document.addEventListener('click', function (e) {
    const t = e.target;
    const el = t && t.nodeType === 1 ? t : (t && t.parentElement) ? t.parentElement : null;
    const a = el && el.closest ? el.closest('a') : null;
    if (!a) return;
    const href = String(a.getAttribute('href') || '').trim();
    if (!href) return;
    if (href.indexOf('#') === 0) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);
})();
    `.trim();

    let html = generateHTML(null);
    html = html.replace(
      '    <link rel="stylesheet" href="styles.css">',
      `    <style>${css}</style>`,
    );

    html = html.replace(
      '    <script src="script.js"></script>',
      `    <script>${stubScript}</script>\n    <script>${js}</script>`,
    );

    return html;
  };

  const slugify = (value: string) => {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const getSettlementSiteUrl = () => {
    const baseDomain = "bachelordegree.tech";
    const name = (settlement.name ?? "").trim();
    const judet = (settlement.judet ?? "").trim();
    const subdomain = name
      ? `${slugify(name)}-${slugify(judet)}`
      : `${slugify(judet)}`;
    return `https://${subdomain}.${baseDomain}`;
  };

  const handleDeleteSettlement = async () => {
    if (!settlement?._id) return;

    openConfirmModal(
      {
        title: "Șterge settlement",
        message: "Sigur doriți să ștergeți acest settlement?",
        confirmLabel: "Șterge",
        confirmVariant: "danger",
      },
      async () => {
        try {
          setIsSaving(true);
          await adminAPI.deleteSettlement(settlement._id);
          navigate("/");
        } catch (err: any) {
          showNotification(
            err.response?.data?.message || "Eroare la ștergerea settlementului",
            "error",
          );
        } finally {
          setIsSaving(false);
        }
      },
    );
  };

  const handleDeactivateSite = async () => {
    if (!settlement?._id) return;
    if (!settlement.active) {
      showNotification("Website-ul este deja inactiv", "info");
      return;
    }

    openConfirmModal(
      {
        title: "Dezactivează site",
        message:
          "Sigur doriți să dezactivați site-ul? Va fi scos de pe internet, dar datele settlement-ului rămân.",
        confirmLabel: "Dezactivează",
        confirmVariant: "danger",
      },
      async () => {
        try {
          setIsDeactivating(true);
          showNotification("Se dezactivează site-ul...", "info");

          const response = await settlementAPI.deactivateSite(settlement._id);
          setSettlement(response.settlement);
          showNotification("✅ Site dezactivat cu succes!", "success");
        } catch (err: unknown) {
          const axiosLikeError = err as {
            response?: { data?: { message?: string } };
          };
          showNotification(
            axiosLikeError.response?.data?.message ||
              "Eroare la dezactivarea site-ului",
            "error",
          );
        } finally {
          setIsDeactivating(false);
        }
      },
    );
  };

  return (
    <div className="settlement-page">
      <div className="settlement-header">
        <div className="settlement-header-content">
          <div className="settlement-info">
            <h1>{(settlement.name ?? "").trim() || settlement.judet}</h1>
            <p>
              {settlement.judet} • Lat: {settlement.lat}, Lng: {settlement.lng}
            </p>
          </div>
          <div className="header-actions">
            <div className="header-actions-row">
              <Link to="/" className="btn-back">
                ← Înapoi
              </Link>
              <Link to={`/settlement/${id}/members`} className="btn-members">
                👥 Gestionează Membrii
              </Link>
              <Link to={`/settlement/${id}/blog`} className="btn-blog">
                📰 Gestionează Blog
              </Link>
              <Link to={`/settlement/${id}/events`} className="btn-blog">
                📅 Gestionează Evenimente
              </Link>
              {components.length > 0 && (
                <button
                  className="btn-reset"
                  onClick={() => {
                    if (!id) return;
                    openConfirmModal(
                      {
                        title: "Resetează progresul",
                        message:
                          "Ești sigur că vrei să ștergi cache-ul? Progresul nesalvat va fi pierdut.",
                        confirmLabel: "Resetează",
                        confirmVariant: "danger",
                      },
                      () => {
                        clearCache(id);
                        setComponents([]);
                        setCustomCSS("");
                      },
                    );
                  }}
                  title="Șterge cache-ul și începe de la zero"
                >
                  🗑️ Resetează
                </button>
              )}
            </div>

            <div className="header-actions-row header-actions-row--secondary">
              {components.length > 0 && (
                <>
                  <button
                    className="btn-save"
                    onClick={() => setShowStyleEditor(true)}
                  >
                    🎨 Editează CSS
                  </button>
                  <button className="btn-save" onClick={handleViewCode}>
                    👁️ Vezi Cod
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleSaveSite}
                    disabled={isSaving || isDeactivating}
                  >
                    {isSaving
                      ? "Se salvează..."
                      : settlement?.active
                        ? "💾 Actualizează Site"
                        : "💾 Salvează Site"}
                  </button>

                  {settlement.active ? (
                    <a
                      className="btn-open-site active"
                      href={getSettlementSiteUrl()}
                      target="_blank"
                      rel="noreferrer"
                      title={getSettlementSiteUrl()}
                    >
                      🔗 Deschide Site
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="btn-open-site inactive"
                      disabled
                      title="Website-ul nu este activ"
                    >
                      🔗 Deschide Site
                    </button>
                  )}
                </>
              )}

              <button
                className="btn-reset"
                onClick={handleDeactivateSite}
                disabled={!settlement.active || isSaving || isDeactivating}
                title={
                  settlement.active
                    ? "Dezactivează site-ul (îl scoate de pe internet)"
                    : "Website-ul este deja inactiv"
                }
              >
                {isDeactivating
                  ? "Se dezactivează..."
                  : settlement.active
                    ? "⏹️ Dezactivează Site"
                    : "⏹️ Site Dezactivat"}
              </button>

              {user?.role === "admin" && (
                <button
                  className="btn-danger"
                  onClick={handleDeleteSettlement}
                  disabled={isSaving || isDeactivating}
                >
                  🗑️ Șterge Settlement
                </button>
              )}
            </div>
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
              {/* Blog Posts Section */}
              <div className="blog-quick-section">
                <div className="section-header">
                  <h3>📰 Postări Blog ({blogPosts.length})</h3>
                  <button
                    className="btn-add-small"
                    onClick={() => setShowBlogModal(true)}
                  >
                    + Adaugă
                  </button>
                </div>
                <div className="blog-posts-mini">
                  {blogPosts.length === 0 ? (
                    <p className="empty-text">Nicio postare încă</p>
                  ) : (
                    [...blogPosts]
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .slice(0, 3)
                      .map((post) => (
                        <div key={post._id} className="blog-post-mini">
                          <div className="post-mini-content">
                            <strong>{post.title}</strong>
                            <small>
                              {new Date(post.date).toLocaleDateString("ro-RO")}
                            </small>
                          </div>
                          <button
                            className="btn-delete-mini"
                            onClick={() => handleDeleteBlogPost(post._id)}
                            title="Șterge"
                          >
                            🗑️
                          </button>
                        </div>
                      ))
                  )}
                  {blogPosts.length > 3 && (
                    <Link
                      to={`/settlement/${id}/blog`}
                      className="view-all-link"
                    >
                      Vezi toate ({blogPosts.length})
                    </Link>
                  )}
                </div>
              </div>

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
                        {(component.type === "header" ||
                          component.type === "footer") && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "10px",
                              background: "#10b981",
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontWeight: "600",
                            }}
                          >
                            OBLIGATORIU
                          </span>
                        )}
                      </span>
                      <div className="component-controls">
                        <button
                          className="btn-icon"
                          onClick={() => handleEditComponent(component.id)}
                          title="Editează"
                        >
                          ✏️
                        </button>
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
                        {component.type !== "header" &&
                          component.type !== "footer" && (
                            <button
                              className="btn-icon btn-delete"
                              onClick={() =>
                                handleDeleteComponent(component.id)
                              }
                              title="Șterge"
                            >
                              🗑️
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Edit Form */}
                    {editingComponent === component.id && (
                      <div className="component-edit-form">
                        <div className="form-group">
                          <label>Titlu:</label>
                          <input
                            type="text"
                            value={editFormData.title || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                title: e.target.value,
                              })
                            }
                            placeholder="Lasă gol pentru titlu implicit"
                          />
                        </div>

                        {component.type === "hero" && (
                          <div className="form-group">
                            <label>Subtitle:</label>
                            <input
                              type="text"
                              value={editFormData.subtitle || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  subtitle: e.target.value,
                                })
                              }
                              placeholder="Subtitle"
                            />
                          </div>
                        )}

                        {(component.type === "about" ||
                          component.type === "services" ||
                          component.type === "contact") && (
                          <div className="form-group">
                            <label>Descriere:</label>
                            <textarea
                              value={editFormData.description || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Descriere"
                              rows={4}
                            />
                          </div>
                        )}

                        <div className="edit-form-buttons">
                          <button className="btn-save" onClick={handleSaveEdit}>
                            💾 Salvează
                          </button>
                          <button
                            className="btn-cancel"
                            onClick={handleCancelEdit}
                          >
                            ✖️ Anulează
                          </button>
                        </div>
                      </div>
                    )}

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
                className={`btn-mode ${previewView === "builder" ? "active" : ""}`}
                onClick={() => setPreviewView("builder")}
              >
                🧱 Builder
              </button>
              <button
                className={`btn-mode ${
                  previewView === "generated" ? "active" : ""
                }`}
                onClick={() => setPreviewView("generated")}
                disabled={components.length === 0}
                title={
                  components.length === 0
                    ? "Adaugă componente ca să vezi site-ul generat"
                    : "Preview identic cu site-ul generat"
                }
              >
                🌐 Site
              </button>

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
              previewView === "generated" ? (
                <iframe
                  title="Preview site generat"
                  sandbox="allow-scripts"
                  srcDoc={buildGeneratedPreviewSrcDoc()}
                  style={{
                    width: "100%",
                    height: "900px",
                    border: 0,
                    borderRadius: "12px",
                    background: "white",
                  }}
                />
              ) : (
                <>
                  {customCSS && <style>{customCSS}</style>}
                  {components.map((component) => (
                    <div key={component.id}>
                      {renderComponentPreview(component)}
                    </div>
                  ))}
                </>
              )
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

      {confirmModal.open && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div
            className="modal-content confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <div className="modal-header">
              <h3 id="confirm-modal-title">{confirmModal.title}</h3>
              <button className="btn-close" onClick={closeConfirmModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{confirmModal.message}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={closeConfirmModal}
                disabled={isConfirmSubmitting}
              >
                {confirmModal.cancelLabel}
              </button>
              <button
                type="button"
                className={
                  confirmModal.confirmVariant === "danger"
                    ? "btn-danger"
                    : "btn-save"
                }
                onClick={handleConfirmProceed}
                disabled={isConfirmSubmitting}
              >
                {isConfirmSubmitting
                  ? "Se procesează..."
                  : confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {showCodeModal && (
        <div className="modal-overlay" onClick={() => setShowCodeModal(false)}>
          <div
            className="modal-content code-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>📄 Fișiere Generate</h3>
              <button
                className="btn-close"
                onClick={() => setShowCodeModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="code-tabs">
                <button
                  className={`code-tab ${
                    activeCodeTab === "html" ? "active" : ""
                  }`}
                  onClick={() => setActiveCodeTab("html")}
                >
                  📝 index.html
                </button>
                <button
                  className={`code-tab ${
                    activeCodeTab === "css" ? "active" : ""
                  }`}
                  onClick={() => setActiveCodeTab("css")}
                >
                  🎨 styles.css
                </button>
                <button
                  className={`code-tab ${
                    activeCodeTab === "js" ? "active" : ""
                  }`}
                  onClick={() => setActiveCodeTab("js")}
                >
                  ⚡ script.js
                </button>
              </div>
              <div className="code-content">
                <pre>
                  <code>
                    {activeCodeTab === "html" && generateHTML(null)}
                    {activeCodeTab === "css" && generateCSS()}
                    {activeCodeTab === "js" && generateJS()}
                  </code>
                </pre>
              </div>
              <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const code =
                      activeCodeTab === "html"
                        ? generateHTML(null)
                        : activeCodeTab === "css"
                          ? generateCSS()
                          : generateJS();
                    navigator.clipboard.writeText(code);
                    showNotification("📋 Cod copiat în clipboard!", "success");
                  }}
                  style={{ flex: 1 }}
                >
                  📋 Copiază Cod
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStyleEditor && (
        <div
          className="modal-overlay"
          onClick={() => setShowStyleEditor(false)}
        >
          <div
            className="modal-content code-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>🎨 Editor CSS Personalizat</h3>
              <button
                className="btn-close"
                onClick={() => setShowStyleEditor(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p
                style={{
                  color: "#666",
                  marginBottom: "12px",
                  fontSize: "14px",
                }}
              >
                Adaugă stiluri CSS personalizate pentru website-ul tău. Exemple:
                schimbă culori, fonturi, mărimi, etc.
              </p>
              <div
                className="css-examples"
                style={{
                  background: "#f0fdf4",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#047857",
                }}
              >
                <strong>💡 Exemple rapide:</strong>
                <div style={{ marginTop: "8px", fontFamily: "monospace" }}>
                  • .header &#123; background: #ff6b6b; &#125;
                  <br />
                  • .hero h1 &#123; font-size: 60px; color: #fff; &#125;
                  <br />• .about &#123; background: #f8f9fa; padding: 80px;
                  &#125;
                </div>
              </div>
              <textarea
                value={customCSS}
                onChange={(e) => setCustomCSS(e.target.value)}
                placeholder="/* Scrie CSS personalizat aici */
.header {
    background: #10b981;
    padding: 30px;
}

.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}"
                style={{
                  width: "100%",
                  minHeight: "400px",
                  padding: "16px",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "14px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  resize: "vertical",
                  background: "#1e1e1e",
                  color: "#d4d4d4",
                }}
              />
              <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowStyleEditor(false);
                    showNotification(
                      "✅ Stiluri CSS salvate! Vezi rezultatul în preview.",
                      "success",
                    );
                  }}
                  style={{ flex: 1 }}
                >
                  ✅ Aplică Stiluri
                </button>
                <button
                  className="btn-back"
                  onClick={() => {
                    setCustomCSS("");
                    showNotification("🔄 Stiluri CSS resetate!", "info");
                  }}
                  style={{ flex: 1 }}
                >
                  🔄 Resetează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog Post Creation Modal */}
      {showBlogModal && (
        <div className="modal-overlay" onClick={() => setShowBlogModal(false)}>
          <div
            className="modal-content blog-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>📰 Postare Nouă Blog</h2>
              <button
                className="modal-close"
                onClick={() => setShowBlogModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateBlogPost}>
              <div className="form-group">
                <label htmlFor="blog-title">
                  Titlu <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="blog-title"
                  maxLength={30}
                  value={blogFormData.title}
                  onChange={(e) =>
                    setBlogFormData({ ...blogFormData, title: e.target.value })
                  }
                  required
                  placeholder="Max 30 caractere"
                />
                <small>{blogFormData.title.length}/30 caractere</small>
              </div>

              <div className="form-group">
                <label htmlFor="blog-description">
                  Descriere scurtă <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="blog-description"
                  maxLength={100}
                  value={blogFormData.description}
                  onChange={(e) =>
                    setBlogFormData({
                      ...blogFormData,
                      description: e.target.value,
                    })
                  }
                  required
                  placeholder="Max 100 caractere"
                />
                <small>{blogFormData.description.length}/100 caractere</small>
              </div>

              <div className="form-group">
                <label htmlFor="blog-content">
                  Conținut <span className="required">*</span>
                </label>
                <textarea
                  id="blog-content"
                  rows={8}
                  value={blogFormData.content}
                  onChange={(e) =>
                    setBlogFormData({
                      ...blogFormData,
                      content: e.target.value,
                    })
                  }
                  required
                  placeholder="Scrie conținutul postării..."
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowBlogModal(false)}
                >
                  Anulează
                </button>
                <button type="submit" className="btn-primary">
                  Publică
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className={`notification-toast notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementPage;
