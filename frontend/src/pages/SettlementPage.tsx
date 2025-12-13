import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { settlementAPI, blogPostAPI, n8nAPI } from "../services/api";
import type { Settlement, WebsiteComponent, BlogPost } from "../types";
import "../styles/Settlement.css";

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
  { type: "map", label: "Hartă", icon: "🗺️" },
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
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"html" | "css" | "js">(
    "html"
  );
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogFormData, setBlogFormData] = useState({
    title: "",
    description: "",
    content: "",
  });
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [customCSS, setCustomCSS] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "success" });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cache keys for sessionStorage
  const getCacheKey = (settlementId: string) => `preview_cache_${settlementId}`;

  // Load cached preview data
  const loadFromCache = (settlementId: string) => {
    try {
      const cached = sessionStorage.getItem(getCacheKey(settlementId));
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
    cssData: string
  ) => {
    try {
      const data = {
        components: componentsData,
        customCSS: cssData,
        lastModified: new Date().toISOString(),
      };
      sessionStorage.setItem(getCacheKey(settlementId), JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  };

  // Clear cache for settlement
  const clearCache = (settlementId: string) => {
    try {
      sessionStorage.removeItem(getCacheKey(settlementId));
      showNotification("🗑️ Cache-ul a fost șters!", "success");
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  };

  // Show notification function
  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "success"
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
          setHasUnsavedChanges(true);
          showNotification(
            "📦 Progresul anterior a fost restaurat din cache!",
            "info"
          );
        }

        // Fetch blog posts for this settlement
        await fetchBlogPosts();
      } catch (error) {
        console.error("Error fetching settlement:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettlement();
  }, [id]);

  // Auto-save to cache when components or customCSS change
  useEffect(() => {
    if (id && components.length > 0) {
      saveToCache(id, components, customCSS);
      setHasUnsavedChanges(true);
    }
  }, [components, customCSS, id]);

  // Ensure header and footer are always present
  useEffect(() => {
    const hasHeader = components.some((c) => c.type === "header");
    const hasFooter = components.some((c) => c.type === "footer");

    if (!hasHeader || !hasFooter) {
      const newComponents = [...components];

      if (!hasHeader) {
        newComponents.unshift({
          id: `header-${Date.now()}`,
          type: "header",
          content: {
            title: `Primăria ${settlement?.name || ""}`,
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
  }, [components, settlement]);

  const fetchBlogPosts = async () => {
    if (!id) return;
    try {
      const posts = await blogPostAPI.getBySettlement(id);
      // Sort posts by date (newest first)
      const sortedPosts = posts.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setBlogPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    }
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

  const handleDeleteBlogPost = async (postId: string) => {
    if (!confirm("Ești sigur că vrei să ștergi această postare?")) return;

    try {
      await blogPostAPI.delete(postId);
      await fetchBlogPosts();
      showNotification("🗑️ Postarea a fost ștearsă!", "success");
    } catch (error) {
      console.error("Error deleting blog post:", error);
      showNotification("❌ Eroare la ștergerea postării!", "error");
    }
  };

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

    // Prevent adding duplicate header or footer
    if (
      selectedComponentType === "header" &&
      components.some((c) => c.type === "header")
    ) {
      showNotification(
        "⚠️ Există deja un header! Nu poți adăuga mai mult de un header.",
        "error"
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
        "error"
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
        "error"
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
        "error"
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
    alignment: "left" | "center" | "right"
  ) => {
    setComponents(
      components.map((c) => (c.id === id ? { ...c, alignment } : c))
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
        c.id === editingComponent ? { ...c, content: { ...editFormData } } : c
      )
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
        "error"
      );
      return;
    }

    setIsSaving(true);
    showNotification("Se salvează site-ul...", "info");

    try {
      // Check if there's a blog component
      const hasBlog = components.some((c) => c.type === "blog");

      // Generate code files
      const files = {
        html: generateHTML(),
        css: generateCSS(),
        js: generateJS(),
        // ALWAYS generate blog pages if there's a blog component, even with 0 posts
        ...(hasBlog
          ? {
              blogHtml: generateBlogPage(),
              postHtml: generatePostPage(),
            }
          : {}),
      };

      // Check if site is already active
      if (settlement.active) {
        // Update existing site
        const response = await n8nAPI.updateSite(id, files);
        showNotification("🎉 Site actualizat cu succes!", "success");
        console.log("Site updated:", response);
        setHasUnsavedChanges(false);
      } else {
        // Create new site
        const response = await n8nAPI.createSite(id, files);
        showNotification("🎉 Site creat cu succes!", "success");
        console.log("Site created:", response);
        setHasUnsavedChanges(false);

        // Update local settlement state to reflect active status
        setSettlement({ ...settlement, active: true });
      }
    } catch (error: any) {
      console.error("Error saving site:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Eroare necunoscută";
      showNotification(
        `❌ Eroare la salvarea site-ului: ${errorMessage}`,
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Generate HTML code
  const generateHTML = () => {
    // Determine which sections exist for navigation
    const hasAbout = components.some((c) => c.type === "about");
    const hasContact = components.some((c) => c.type === "contact");
    const hasBlog = components.some((c) => c.type === "blog");

    const htmlContent = components
      .map((comp) => {
        switch (comp.type) {
          case "header":
            // Default header title with settlement name
            const headerTitle =
              comp.content.title || `Primăria ${settlement?.name || ""}`;
            const headerSubtitle = "Pagina Oficială";

            // Build navigation links dynamically based on available sections
            const navItems: string[] = [];
            if (hasAbout) navItems.push('<a href="#despre">Despre</a>');
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
                : `la ${settlement?.name || ""}`;
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
        <p>© 2025 ${settlement?.name}. Toate drepturile rezervate.</p>
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
    <title>${settlement?.name || "Website"}</title>
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
  const generateBlogPage = () => {
    return `<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - ${settlement?.name || "Website"}</title>
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
        <h1>Blog - ${settlement?.name || "Website"}</h1>
        <nav>
          <a href="index.html">Acasă</a>
        </nav>
      </div>
    </header>

    <section class="blog-page">
      <div class="layout-container">
        <div class="blog-search-container">
          <input type="text" id="blog-search" class="blog-search" placeholder="Caută în postări...">
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
        <p>© 2025 ${settlement?.name}. Toate drepturile rezervate.</p>
      </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
  };

  // Generate Individual Post Page HTML
  const generatePostPage = () => {
    return `<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Postare - ${settlement?.name || "Website"}</title>
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
          
          document.title = (post.title || 'Post') + ' - ${
            settlement?.name || "Website"
          }';
          
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
        <h1>${settlement?.name || "Website"}</h1>
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
        <p>© 2025 ${settlement?.name}. Toate drepturile rezervate.</p>
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
.hero, .about, .services, .contact, .blog, .map {
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

/* About, Services, Contact, Blog, Map Sections */
.about, .services, .contact, .blog, .map {
  padding: 60px 0;
}

.about h2, .services h2, .contact h2, .blog h2, .map h2 {
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

/* Map Section */
.map {
  padding: 40px 0;
}

.map h2 {
  font-size: 32px;
  margin-bottom: 24px;
  color: #10b981;
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
    
  .about h2, .services h2, .contact h2, .blog h2, .map h2 {
        font-size: 24px;
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
}`;

    // Append custom CSS if exists
    return customCSS
      ? `${baseCSS}\n\n/* Custom Styles */\n${customCSS}`
      : baseCSS;
  };

  // Generate JavaScript code
  const generateJS = () => {
    const hasBlog = components.some((c) => c.type === "blog");
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
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
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
    }`
        : ""
    }
    ${
      hasMap
        ? `
    // Initialize map
    initMap();`
        : ""
    }
    
    console.log('Website loaded successfully!');
});
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

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
            <div class="blog-post">
                <div class="blog-post-date">\${new Date(post.date).toLocaleDateString('ro-RO', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</div>
                <h3>\${escapedTitle}</h3>
                <p class="blog-post-description">\${escapedDescription}</p>
                <div class="blog-post-content">\${truncatedContent}</div>
            </div>
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
        
        L.marker([LOCATION.lat, LOCATION.lng])
            .addTo(mapInstance)
            .bindPopup('<b>${settlement?.name || "Localitatea"}</b>')
            .openPopup();
            
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

    switch (component.type) {
      case "header":
        // Match the generated HTML logic
        const previewHeaderTitle =
          component.content.title || `Primăria ${settlement?.name || ""}`;
        const previewHeaderSubtitle = "Pagina Oficială";

        // Build dynamic navigation based on existing sections
        const navLabels: string[] = [];
        if (hasAbout) navLabels.push("Despre");
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
                          new Date(a.date).getTime()
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
              <div
                id="map"
                style={{
                  width: "100%",
                  height: "400px",
                  marginTop: "20px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "2px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                {settlement ? (
                  <MapContainer
                    center={[settlement.lat, settlement.lng]}
                    zoom={11}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[settlement.lat, settlement.lng]}>
                      <Popup>
                        <strong>{settlement.name}</strong>
                        <br />
                        {settlement.judet}
                      </Popup>
                    </Marker>
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
              <p>© 2025 {settlement?.name}. Toate drepturile rezervate.</p>
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
            <Link to={`/settlement/${id}/blog`} className="btn-blog">
              📰 Gestionează Blog
            </Link>
            {components.length > 0 && (
              <>
                {hasUnsavedChanges && (
                  <span
                    className="cache-indicator"
                    title="Există modificări în cache"
                  >
                    📦 Cache activ
                  </span>
                )}
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (
                      id &&
                      confirm(
                        "Ești sigur că vrei să ștergi cache-ul? Progresul nesalvat va fi pierdut."
                      )
                    ) {
                      clearCache(id);
                      setComponents([]);
                      setCustomCSS("");
                    }
                  }}
                  title="Șterge cache-ul și începe de la zero"
                >
                  🗑️ Resetează
                </button>
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
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Se salvează..."
                    : settlement?.active
                    ? "💾 Actualizează Site"
                    : "💾 Salvează Site"}
                </button>
              </>
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
                          new Date(a.date).getTime()
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
            {customCSS && <style>{customCSS}</style>}
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
                    {activeCodeTab === "html" && generateHTML()}
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
                        ? generateHTML()
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
                      "success"
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
