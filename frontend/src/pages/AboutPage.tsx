import React from "react";
import "../styles/About.css";

const AboutPage: React.FC = () => {
  return (
    <div className="about-container">
      <div className="about-content">
        <div className="about-hero">
          <h1>Despre Portal Localități</h1>
          <p className="about-subtitle">
            Platforma modernă pentru digitalizarea localităților din România
          </p>
        </div>

        <section className="about-section">
          <div className="section-icon">🎯</div>
          <h2>Misiunea Noastră</h2>
          <p>
            Portal Localități își propune să faciliteze transformarea digitală a
            comunităților locale din România, oferind o platformă intuitivă și
            accesibilă pentru crearea și gestionarea website-urilor oficiale ale
            localităților.
          </p>
        </section>

        <section className="about-section">
          <div className="section-icon">💡</div>
          <h2>Ce Oferim</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🏛️ Platformă Dedicată</h3>
              <p>Sistem specialized pentru nevoile administrațiilor locale</p>
            </div>
            <div className="feature-card">
              <h3>📱 Design Responsive</h3>
              <p>Website-uri optimizate pentru orice dispozitiv</p>
            </div>
            <div className="feature-card">
              <h3>✏️ Editare Ușoară</h3>
              <p>Interfață simplă pentru gestionarea conținutului</p>
            </div>
            <div className="feature-card">
              <h3>🔒 Securitate</h3>
              <p>Protecție avansată a datelor și autentificare sigură</p>
            </div>
            <div className="feature-card">
              <h3>📊 Analiză Date</h3>
              <p>Statistici și rapoarte pentru website-ul tău</p>
            </div>
            <div className="feature-card">
              <h3>⚡ Performanță</h3>
              <p>Website-uri rapide și optimizate</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="section-icon">🚀</div>
          <h2>Viziunea Noastră</h2>
          <p>
            Credem într-o Românie digitalizată, unde fiecare localitate,
            indiferent de mărime, are acces la instrumente moderne de comunicare
            cu cetățenii. Vrem să reducem barierele tehnologice și să facem
            digitalizarea accesibilă tuturor comunităților.
          </p>
        </section>

        <section className="about-section">
          <div className="section-icon">👥</div>
          <h2>Echipa</h2>
          <p>
            Portal Localități este dezvoltat de o echipă dedicată de
            profesioniști în tehnologie și administrație publică, cu experiență
            în dezvoltarea de soluții digitale pentru sectorul public.
          </p>
        </section>

        <section className="about-section stats-section">
          <h2>Statistici</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">100+</div>
              <div className="stat-label">Localități Active</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">Utilizatori Înregistrați</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Suport Tehnic</div>
            </div>
          </div>
        </section>

        <section className="about-section contact-section">
          <div className="section-icon">📧</div>
          <h2>Contact</h2>
          <p>
            Pentru mai multe informații sau colaborări, ne puteți contacta la:
          </p>
          <div className="contact-info">
            <p>📧 Email: contact@portal-localitati.ro</p>
            <p>🏢 Adresă: Timișoara, România</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
