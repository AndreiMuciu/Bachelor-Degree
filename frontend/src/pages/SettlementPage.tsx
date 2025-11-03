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

  const fetchBlogPosts = async () => {
    if (!id) return;
    try {
      const posts = await blogPostAPI.getBySettlement(id);
      setBlogPosts(posts);
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
      alert("Postarea a fost creată cu succes!");
    } catch (error) {
      console.error("Error creating blog post:", error);
      alert("Eroare la crearea postării!");
    }
  };

  const handleDeleteBlogPost = async (postId: string) => {
    if (!confirm("Ești sigur că vrei să ștergi această postare?")) return;

    try {
      await blogPostAPI.delete(postId);
      await fetchBlogPosts();
      alert("Postarea a fost ștearsă!");
    } catch (error) {
      console.error("Error deleting blog post:", error);
      alert("Eroare la ștergerea postării!");
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
      alert("Settlement not loaded!");
      return;
    }

    if (components.length === 0) {
      alert("Adaugă cel puțin o componentă înainte de a salva!");
      return;
    }

    setIsSaving(true);

    try {
      // Check if there's a blog component
      const hasBlog = components.some((c) => c.type === "blog");

      // Generate code files
      const files = {
        html: generateHTML(),
        css: generateCSS(),
        js: generateJS(),
        ...(hasBlog && blogPosts.length > 0
          ? { blogHtml: generateBlogPage() }
          : {}),
      };

      // Check if site is already active
      if (settlement.active) {
        // Update existing site
        const response = await n8nAPI.updateSite(id, files);
        alert("Site actualizat cu succes! ✅");
        console.log("Site updated:", response);
      } else {
        // Create new site
        const response = await n8nAPI.createSite(id, files);
        alert("Site creat cu succes! ✅");
        console.log("Site created:", response);

        // Update local settlement state to reflect active status
        setSettlement({ ...settlement, active: true });
      }
    } catch (error: any) {
      console.error("Error saving site:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Eroare necunoscută";
      alert(`Eroare la salvarea site-ului: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate HTML code
  const generateHTML = () => {
    const htmlContent = components
      .map((comp) => {
        switch (comp.type) {
          case "header":
            // Default header title with settlement name
            const headerTitle =
              comp.content.title || `Primăria ${settlement?.name || ""}`;
            const headerSubtitle = "Pagina Oficială";

            return `    <header class="header ${comp.alignment}">
      <h1>${headerTitle}</h1>
      <p class="header-subtitle">${headerSubtitle}</p>
      ${
        comp.content.links
          ? `<nav>
        ${comp.content.links
          .map((link) => `<a href="${link.url}">${link.text}</a>`)
          .join("\n        ")}
      </nav>`
          : ""
      }
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
      ${heroTitle ? `<h1>${heroTitle}</h1>` : ""}
      ${heroSubtitle ? `<p>${heroSubtitle}</p>` : ""}
    </section>`;
          case "about":
            const aboutTitle =
              comp.content.title !== undefined ? comp.content.title : "Despre";
            return `    <section class="about ${comp.alignment}">
      ${aboutTitle ? `<h2>${aboutTitle}</h2>` : ""}
      <p>${comp.content.description || "Descriere..."}</p>
    </section>`;
          case "services":
            const servicesTitle =
              comp.content.title !== undefined
                ? comp.content.title
                : "Servicii";
            return `    <section class="services ${comp.alignment}">
      ${servicesTitle ? `<h2>${servicesTitle}</h2>` : ""}
      <p>${comp.content.description || "Lista serviciilor..."}</p>
    </section>`;
          case "blog":
            const displayedPosts = blogPosts.slice(0, 5);
            const remainingCount = blogPosts.length - 5;

            // Helper to escape HTML and truncate text
            const escapeHtml = (text: string): string => {
              const div = document.createElement("div");
              div.textContent = text;
              return div.innerHTML;
            };

            const truncateText = (text: string, maxLength: number): string => {
              const stripped = text.replace(/<[^>]*>/g, ""); // Remove HTML tags
              return stripped.length > maxLength
                ? escapeHtml(stripped.substring(0, maxLength)) + "..."
                : escapeHtml(stripped);
            };

            const blogHTML =
              blogPosts.length > 0
                ? `
${displayedPosts
  .map(
    (post) => `        <div class="blog-post">
          <div class="blog-post-date">${new Date(post.date).toLocaleDateString(
            "ro-RO",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          )}</div>
          <h3>${escapeHtml(post.title)}</h3>
          <p class="blog-post-description">${escapeHtml(post.description)}</p>
          <div class="blog-post-content">${truncateText(
            post.content,
            150
          )}</div>
        </div>`
  )
  .join("\n")}
${
  remainingCount > 0
    ? `        <div class="blog-more">
          <p>... și încă ${remainingCount} ${
        remainingCount === 1 ? "postare" : "postări"
      }</p>
          <a href="blog.html" class="btn-view-all">Vezi toate postările</a>
        </div>`
    : ""
}`
                : '<p style="text-align: center; color: #6b7280;">Nu există postări încă.</p>';

            const blogTitle =
              comp.content.title !== undefined
                ? comp.content.title
                : "Ultimele Noutăți";

            return `    <section class="blog ${
              comp.alignment
            }" id="blog-section">
      ${blogTitle ? `<h2>${blogTitle}</h2>` : ""}
      <div class="blog-posts" id="blog-posts-container">
${blogHTML}
      </div>
    </section>`;
          case "map":
            const mapTitle =
              comp.content.title !== undefined
                ? comp.content.title
                : "Localizare";
            return `    <section class="map ${comp.alignment}">
      ${mapTitle ? `<h2>${mapTitle}</h2>` : ""}
      <div id="map" style="width: 100%; height: 400px; border-radius: 8px;"></div>
    </section>`;
          case "contact":
            const contactTitle =
              comp.content.title !== undefined ? comp.content.title : "Contact";
            return `    <section class="contact ${comp.alignment}">
      ${contactTitle ? `<h2>${contactTitle}</h2>` : ""}
      <p>${comp.content.description || "Informații contact..."}</p>
    </section>`;
          case "footer":
            return `    <footer class="footer ${comp.alignment}">
      <p>© 2025 ${settlement?.name}. Toate drepturile rezervate.</p>
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
    // Helper to escape HTML
    const escapeHtml = (text: string): string => {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    };

    const allBlogPosts = blogPosts
      .map(
        (post) => `        <div class="blog-post">
          <div class="blog-post-date">${new Date(post.date).toLocaleDateString(
            "ro-RO",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          )}</div>
          <h3>${escapeHtml(post.title)}</h3>
          <p class="blog-post-description">${escapeHtml(post.description)}</p>
          <div class="blog-post-content">${post.content}</div>
        </div>`
      )
      .join("\n");

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
    </style>
</head>
<body>
    <header class="header center">
      <h1>Blog - ${settlement?.name || "Website"}</h1>
      <nav>
        <a href="index.html">Acasă</a>
      </nav>
    </header>

    <section class="blog-page">
      <div class="blog-search-container">
        <input type="text" id="blog-search" class="blog-search" placeholder="Caută în postări...">
      </div>
      
      <div class="blog-posts" id="all-blog-posts">
${
  allBlogPosts ||
  '<p style="text-align: center; color: #6b7280;">Nu există postări încă.</p>'
}
      </div>
    </section>

    <footer class="footer center">
      <p>© 2025 ${settlement?.name}. Toate drepturile rezervate.</p>
    </footer>

    <script src="script.js"></script>
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
    padding: 20px;
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
    padding: 60px 20px;
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
    padding: 60px 20px;
    max-width: 1200px;
    margin: 0 auto;
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
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
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
#map {
    width: 100%;
    height: 400px;
    border: 2px solid #e5e7eb;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    background: #f9fafb;
    position: relative;
    z-index: 1;
}

.map {
    min-height: 500px;
}

/* Footer */
.footer {
    background: #1a1a2e;
    color: white;
    padding: 20px;
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
    .hero h1 {
        font-size: 32px;
    }
    
    .about, .services, .contact {
        padding: 40px 20px;
    }
    
    .about h2, .services h2, .contact h2 {
        font-size: 24px;
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
const API_URL = 'http://localhost:5000/api/v1';
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
    // Load blog posts (only if not already in HTML)
    const blogContainer = document.getElementById('blog-posts-container');
    if (blogContainer && blogContainer.querySelector('.loading')) {
        loadBlogPosts();
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
// Fetch and display blog posts
async function loadBlogPosts() {
    const container = document.getElementById('blog-posts-container');
    
    try {
        const response = await fetch(\`\${API_URL}/blog-posts?settlement=\${SETTLEMENT_ID}\`);
        const data = await response.json();
        const posts = data.data.data;
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280;">Nu există postări încă.</p>';
            return;
        }
        
        container.innerHTML = posts.map(post => \`
            <div class="blog-post">
                <div class="blog-post-date">\${new Date(post.date).toLocaleDateString('ro-RO', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</div>
                <h3>\${post.title}</h3>
                <p class="blog-post-description">\${post.description}</p>
                <div class="blog-post-content">\${post.content}</div>
            </div>
        \`).join('');
    } catch (error) {
        console.error('Error loading blog posts:', error);
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">Eroare la încărcarea postărilor.</p>';
    }
}

// Blog search functionality
const blogSearch = document.getElementById('blog-search');
if (blogSearch) {
    blogSearch.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const blogPosts = document.querySelectorAll('#all-blog-posts .blog-post');
        
        blogPosts.forEach(post => {
            const title = post.querySelector('h3').textContent.toLowerCase();
            const description = post.querySelector('.blog-post-description').textContent.toLowerCase();
            const content = post.querySelector('.blog-post-content').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm) || content.includes(searchTerm)) {
                post.style.display = 'block';
            } else {
                post.style.display = 'none';
            }
        });
    });
}`
    : ""
}
${
  hasMap
    ? `
// Initialize Leaflet map
let mapInitAttempts = 0;
const MAX_MAP_ATTEMPTS = 50; // 5 seconds max

function initMap() {
    mapInitAttempts++;
    
    // Wait for Leaflet to load
    if (typeof L === 'undefined') {
        if (mapInitAttempts < MAX_MAP_ATTEMPTS) {
            console.log('Leaflet not loaded yet, waiting... (attempt ' + mapInitAttempts + ')');
            setTimeout(initMap, 100);
        } else {
            console.error('Failed to load Leaflet library after ' + MAX_MAP_ATTEMPTS + ' attempts');
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;"><p>Harta nu poate fi încărcată momentan.</p></div>';
            }
        }
        return;
    }
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found');
        return;
    }
    
    try {
        const map = L.map('map').setView([LOCATION.lat, LOCATION.lng], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        L.marker([LOCATION.lat, LOCATION.lng])
            .addTo(map)
            .bindPopup('<b>${settlement?.name || "Localitatea"}</b>')
            .openPopup();
            
        console.log('Map initialized successfully');
        
        // Force map to resize after a short delay
        setTimeout(() => {
            map.invalidateSize();
        }, 250);
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

      case "blog":
        return (
          <div className={`preview-component component-blog ${alignmentClass}`}>
            <h2>{component.content.title || "Ultimele Noutăți"}</h2>
            <div
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
                  {blogPosts.slice(0, 5).map((post) => (
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
        );

      case "map":
        return (
          <div className={`preview-component component-map ${alignmentClass}`}>
            <h2>{component.content.title || "Localizare"}</h2>
            <div
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
            <Link to={`/settlement/${id}/blog`} className="btn-blog">
              📰 Gestionează Blog
            </Link>
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
                    blogPosts.slice(0, 3).map((post) => (
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
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteComponent(component.id)}
                          title="Șterge"
                        >
                          🗑️
                        </button>
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
                    alert("Cod copiat în clipboard!");
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
                    alert("Stiluri CSS salvate! Vezi rezultatul în preview.");
                  }}
                  style={{ flex: 1 }}
                >
                  ✅ Aplică Stiluri
                </button>
                <button
                  className="btn-back"
                  onClick={() => {
                    setCustomCSS("");
                    alert("Stiluri CSS resetate!");
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
    </div>
  );
};

export default SettlementPage;
