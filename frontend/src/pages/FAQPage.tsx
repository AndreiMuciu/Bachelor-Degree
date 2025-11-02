import React, { useState } from "react";
import "../styles/FAQ.css";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const FAQPage: React.FC = () => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: "Ce este Portal Localități?",
      answer:
        "Portal Localități este o platformă dedicată pentru crearea și gestionarea website-urilor oficiale ale localităților din România. Oferim instrumente simple și intuitive pentru digitalizarea administrației locale.",
      category: "general",
    },
    {
      id: 2,
      question: "Cum pot obține un cont?",
      answer:
        "Conturile sunt create de administratori. Contactează primăria localității tale sau echipa Portal Localități la contact@portallocalitati.ro pentru a solicita acces.",
      category: "account",
    },
    {
      id: 3,
      question: "Este gratuită platforma?",
      answer:
        "Portal Localități oferă diferite planuri de abonament în funcție de nevoile localității. Contactează-ne pentru detalii despre prețuri și pachete disponibile.",
      category: "general",
    },
    {
      id: 4,
      question: "Pot gestiona mai multe localități?",
      answer:
        "Da, un utilizator poate fi asignat pentru mai multe localități. Toate localitățile tale vor apărea în dashboard-ul principal.",
      category: "account",
    },
    {
      id: 5,
      question: "Cum adaug o postare nouă pe blog?",
      answer:
        "Accesează pagina localității tale, navighează la secțiunea Blog, apoi click pe 'Postare Nouă'. Completează titlul și conținutul, adaugă imagini dacă dorești, și publică.",
      category: "content",
    },
    {
      id: 6,
      question: "Ce format de imagini pot încărca?",
      answer:
        "Platforma acceptă imagini în format JPG, PNG și WebP. Dimensiunea maximă per imagine este de 5MB. Imaginile sunt optimizate automat pentru web.",
      category: "content",
    },
    {
      id: 7,
      question: "Cum pot personaliza aspectul website-ului?",
      answer:
        "Accesează secțiunea Setări din panoul localității tale. Aici poți modifica logo-ul, culorile, favicon-ul și alte elemente de design.",
      category: "design",
    },
    {
      id: 8,
      question: "Website-ul este responsive?",
      answer:
        "Da, toate website-urile create prin Portal Localități sunt complet responsive și optimizate pentru telefoane mobile, tablete și desktop.",
      category: "design",
    },
    {
      id: 9,
      question: "Cum activez/dezactivez website-ul?",
      answer:
        "În panoul localității, vei găsi un buton pentru a activa sau dezactiva website-ul. Când este dezactivat, website-ul nu va fi accesibil publicului.",
      category: "settings",
    },
    {
      id: 10,
      question: "Pot schimba parola contului meu?",
      answer:
        "Da, accesează Setări Profil din meniul utilizator (click pe avatar în dreapta sus) și selectează opțiunea 'Schimbă Parola'.",
      category: "account",
    },
    {
      id: 11,
      question: "Ce se întâmplă dacă uit parola?",
      answer:
        "Pe pagina de login, click pe 'Am uitat parola'. Introdu adresa de email și vei primi instrucțiuni pentru resetarea parolei.",
      category: "account",
    },
    {
      id: 12,
      question: "Datele sunt securizate?",
      answer:
        "Da, folosim cele mai bune practici de securitate: encriptare SSL, autentificare sigură, backup-uri regulate și protecție împotriva atacurilor.",
      category: "security",
    },
    {
      id: 13,
      question: "Pot șterge o postare după ce a fost publicată?",
      answer:
        "Da, poți edita sau șterge orice postare din secțiunea Blog. Click pe postarea dorită și selectează opțiunea 'Șterge' sau 'Editează'.",
      category: "content",
    },
    {
      id: 14,
      question: "Cât timp durează până modificările apar pe site?",
      answer:
        "Modificările sunt vizibile imediat pe website. În unele cazuri, poate fi nevoie să reîmprospătezi pagina (Ctrl + F5) pentru a vedea schimbările.",
      category: "settings",
    },
    {
      id: 15,
      question: "Pot adăuga și alți utilizatori pentru localitatea mea?",
      answer:
        "Această funcție este disponibilă pentru administratori. Contactează administratorul platformei pentru a adăuga utilizatori noi.",
      category: "account",
    },
    {
      id: 16,
      question: "Există un limit de postări pe blog?",
      answer:
        "Nu există un limit fix pentru numărul de postări. Totuși, recomandăm să menții conținutul relevant și să arhivezi postările vechi.",
      category: "content",
    },
    {
      id: 17,
      question: "Cum pot contacta suportul tehnic?",
      answer:
        "Poți contacta echipa de suport la support@portallocalitati.ro sau prin telefon la +40 XXX XXX XXX, de luni până vineri, între orele 9:00-17:00.",
      category: "general",
    },
    {
      id: 18,
      question: "Website-ul este optimizat pentru motoarele de căutare (SEO)?",
      answer:
        "Da, toate website-urile sunt optimizate SEO automat: meta tags, URL-uri prietenoase, sitemap, imagini optimizate și structură corectă HTML.",
      category: "design",
    },
    {
      id: 19,
      question: "Pot integra social media pe website?",
      answer:
        "Da, în secțiunea Setări poți adăuga link-urile către paginile de Facebook, Instagram, Twitter și alte platforme sociale.",
      category: "settings",
    },
    {
      id: 20,
      question: "Există statistici de vizitare a website-ului?",
      answer:
        "Da, planurile premium includ statistici detaliate: număr de vizitatori, pagini vizitate, surse de trafic și alte metrici importante.",
      category: "general",
    },
  ];

  const categories = [
    { id: "all", name: "Toate", icon: "📋" },
    { id: "general", name: "General", icon: "ℹ️" },
    { id: "account", name: "Cont", icon: "👤" },
    { id: "content", name: "Conținut", icon: "✏️" },
    { id: "design", name: "Design", icon: "🎨" },
    { id: "settings", name: "Setări", icon: "⚙️" },
    { id: "security", name: "Securitate", icon: "🔒" },
  ];

  const filteredFAQs =
    activeCategory === "all"
      ? faqs
      : faqs.filter((faq) => faq.category === activeCategory);

  const toggleFAQ = (id: number) => {
    setActiveId(activeId === id ? null : id);
  };

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1>Întrebări Frecvente</h1>
        <p>Găsește răspunsuri rapide la întrebările tale</p>
      </div>

      <div className="faq-categories">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${
              activeCategory === category.id ? "active" : ""
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      <div className="faq-list">
        {filteredFAQs.map((faq) => (
          <div
            key={faq.id}
            className={`faq-item ${activeId === faq.id ? "active" : ""}`}
          >
            <button className="faq-question" onClick={() => toggleFAQ(faq.id)}>
              <span className="question-text">{faq.question}</span>
              <span className="toggle-icon">
                {activeId === faq.id ? "−" : "+"}
              </span>
            </button>
            {activeId === faq.id && (
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="faq-footer">
        <div className="contact-box">
          <h3>Nu ai găsit răspunsul?</h3>
          <p>Echipa noastră este aici să te ajute!</p>
          <div className="contact-options">
            <a
              href="mailto:support@portallocalitati.ro"
              className="contact-btn"
            >
              📧 Trimite Email
            </a>
            <a href="/help" className="contact-btn secondary">
              📚 Vizitează Ghidul
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
