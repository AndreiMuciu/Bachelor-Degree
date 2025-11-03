import React, { useState } from "react";
import HelpSidebar from "../components/help/HelpSidebar";
import HelpCard from "../components/help/HelpCard";
import HelpTip from "../components/help/HelpTip";
import "../styles/Help.css";

const HelpPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("getting-started");

  const sections = [
    { id: "getting-started", title: "Începe", icon: "🚀" },
    { id: "dashboard", title: "Dashboard", icon: "📊" },
    { id: "settlements", title: "Gestionare Localități", icon: "🏛️" },
    { id: "content", title: "Editare Conținut", icon: "✏️" },
    { id: "settings", title: "Setări", icon: "⚙️" },
    { id: "troubleshooting", title: "Depanare", icon: "🔧" },
  ];

  return (
    <div className="help-container">
      <HelpSidebar
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <div className="help-content">
        {activeSection === "getting-started" && (
          <div className="help-section">
            <h1>🚀 Începe</h1>
            <p className="section-intro">
              Bun venit în Portal Localități! Acest ghid te va ajuta să înțelegi
              cum să folosești platforma.
            </p>

            <HelpCard title="Pasul 1: Autentificare">
              <ol>
                <li>Accesează pagina de login</li>
                <li>Introdu adresa de email și parola</li>
                <li>Apasă butonul "Autentificare"</li>
              </ol>
              <HelpTip>
                💡 <strong>Sfat:</strong> Dacă nu ai cont, contactează
                administratorul pentru a primi acces.
              </HelpTip>
            </HelpCard>

            <HelpCard title="Pasul 2: Explorează Dashboard-ul">
              <p>
                După autentificare, vei fi redirecționat către dashboard-ul
                principal unde poți vedea toate localitățile tale.
              </p>
            </HelpCard>

            <HelpCard title="Pasul 3: Selectează o Localitate">
              <p>
                Click pe oricare dintre cardurile de localități pentru a accesa
                panoul de administrare specific acelei localități.
              </p>
            </HelpCard>
          </div>
        )}

        {activeSection === "dashboard" && (
          <div className="help-section">
            <h1>📊 Dashboard</h1>
            <p className="section-intro">
              Dashboard-ul este pagina principală unde poți vizualiza și accesa
              toate localitățile tale.
            </p>

            <HelpCard title="Componentele Dashboard-ului">
              <ul>
                <li>
                  <strong>Header:</strong> Conține navigarea principală și
                  opțiuni de profil
                </li>
                <li>
                  <strong>Carduri Localități:</strong> Fiecare localitate apare
                  ca un card individual
                </li>
                <li>
                  <strong>Status Website:</strong> Vezi dacă website-ul este
                  activ sau inactiv
                </li>
                <li>
                  <strong>Informații Rapid:</strong> Județul și numele
                  localității
                </li>
              </ul>
            </HelpCard>

            <HelpCard title="Navigare Rapidă">
              <p>
                Folosește linkurile din header pentru a accesa rapid diferitele
                secțiuni:
              </p>
              <ul>
                <li>🏠 Acasă - Înapoi la dashboard</li>
                <li>❓ Ajutor - Această pagină</li>
                <li>ℹ️ Despre - Informații despre platformă</li>
                <li>❔ FAQ - Întrebări frecvente</li>
              </ul>
            </HelpCard>
          </div>
        )}

        {activeSection === "settlements" && (
          <div className="help-section">
            <h1>🏛️ Gestionare Localități</h1>
            <p className="section-intro">
              Învață cum să gestionezi informațiile despre localitățile tale.
            </p>

            <div className="help-card">
              <h3>Vizualizare Detalii Localitate</h3>
              <p>Click pe o localitate pentru a vedea:</p>
              <ul>
                <li>Informații generale (nume, județ, populație)</li>
                <li>Postări blog și știri</li>
                <li>Imagini și galerie foto</li>
                <li>Setări website</li>
              </ul>
            </div>

            <div className="help-card">
              <h3>Editare Informații</h3>
              <ol>
                <li>Accesează pagina localității</li>
                <li>Click pe butonul "Editează"</li>
                <li>Modifică informațiile dorite</li>
                <li>Salvează modificările</li>
              </ol>
              <div className="help-warning">
                ⚠️ <strong>Atenție:</strong> Modificările sunt vizibile imediat
                pe website-ul public.
              </div>
            </div>

            <div className="help-card">
              <h3>Status Website</h3>
              <p>Poți activa sau dezactiva website-ul localității:</p>
              <ul>
                <li>✓ Activ - Website-ul este disponibil public</li>
                <li>○ Inactiv - Website-ul nu este accesibil</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === "content" && (
          <div className="help-section">
            <h1>✏️ Editare Conținut</h1>
            <p className="section-intro">
              Ghid pentru crearea și editarea conținutului website-ului.
            </p>

            <div className="help-card">
              <h3>Adăugare Postări Blog</h3>
              <ol>
                <li>Accesează secțiunea "Blog" din panoul localității</li>
                <li>Click pe "Postare Nouă"</li>
                <li>Completează titlul și conținutul</li>
                <li>Adaugă imagini (opțional)</li>
                <li>Click "Publică"</li>
              </ol>
            </div>

            <div className="help-card">
              <h3>Formatare Text</h3>
              <p>Editor-ul suportă formatare Markdown:</p>
              <ul>
                <li>**bold** pentru text îngroșat</li>
                <li>*italic* pentru text cursiv</li>
                <li># Titlu pentru titluri</li>
                <li>[link](url) pentru linkuri</li>
              </ul>
            </div>

            <div className="help-card">
              <h3>Gestionare Imagini</h3>
              <ul>
                <li>Format acceptat: JPG, PNG, WebP</li>
                <li>Dimensiune maximă: 5MB per imagine</li>
                <li>Imaginile sunt optimizate automat</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === "settings" && (
          <div className="help-section">
            <h1>⚙️ Setări</h1>
            <p className="section-intro">
              Personalizează-ți profilul și preferințele.
            </p>

            <div className="help-card">
              <h3>Setări Profil</h3>
              <ul>
                <li>Schimbă parola</li>
                <li>Actualizează adresa de email</li>
                <li>Gestionează notificările</li>
              </ul>
            </div>

            <div className="help-card">
              <h3>Setări Website Localitate</h3>
              <ul>
                <li>Logo și favicon</li>
                <li>Culori și design</li>
                <li>Informații de contact</li>
                <li>Social media links</li>
              </ul>
            </div>

            <div className="help-card">
              <h3>Securitate</h3>
              <div className="help-tip">
                💡 <strong>Recomandare:</strong> Folosește o parolă puternică cu
                minim 8 caractere, incluzând litere mari, mici, cifre și
                caractere speciale.
              </div>
            </div>
          </div>
        )}

        {activeSection === "troubleshooting" && (
          <div className="help-section">
            <h1>🔧 Depanare</h1>
            <p className="section-intro">
              Soluții pentru problemele comune întâlnite.
            </p>

            <div className="help-card">
              <h3>Nu mă pot autentifica</h3>
              <p>Soluții posibile:</p>
              <ul>
                <li>Verifică dacă email-ul și parola sunt corecte</li>
                <li>Asigură-te că CAPS LOCK este dezactivat</li>
                <li>Încearcă să resetezi parola</li>
                <li>Șterge cache-ul browser-ului</li>
              </ul>
            </div>

            <div className="help-card">
              <h3>Modificările nu apar pe website</h3>
              <p>Pași de verificare:</p>
              <ul>
                <li>Asigură-te că ai salvat modificările</li>
                <li>Verifică dacă website-ul este activ</li>
                <li>Reîmprospătează pagina (Ctrl + F5)</li>
                <li>Așteaptă câteva minute pentru propagare</li>
              </ul>
            </div>

            <div className="help-card">
              <h3>Eroare la încărcarea imaginilor</h3>
              <p>Verifică:</p>
              <ul>
                <li>Dimensiunea imaginii (max 5MB)</li>
                <li>Formatul imaginii (JPG, PNG, WebP)</li>
                <li>Conexiunea la internet</li>
              </ul>
            </div>

            <div className="help-card">
              <h3>Contact Suport</h3>
              <p>Dacă problemele persistă, contactează echipa de suport:</p>
              <div className="contact-info">
                <p>📧 support@portallocalitati.ro</p>
                <p>📞 +40 XXX XXX XXX</p>
                <p>⏰ Program: L-V, 9:00-17:00</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpPage;
