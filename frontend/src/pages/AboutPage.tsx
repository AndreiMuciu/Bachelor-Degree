import React from "react";
import AboutHero from "../components/about/AboutHero";
import Section from "../components/about/Section";
import FeaturesGrid from "../components/about/FeaturesGrid";
import StatsGrid from "../components/about/StatsGrid";
import "../styles/About.css";

const AboutPage: React.FC = () => {
  return (
    <div className="about-container">
      <div className="about-content">
        <AboutHero />

        <Section icon="🎯" title="Misiunea Noastră">
          <p>
            Portal Localități își propune să faciliteze transformarea digitală a
            comunităților locale din România, oferind o platformă intuitivă și
            accesibilă pentru crearea și gestionarea website-urilor oficiale ale
            localităților.
          </p>
        </Section>

        <Section icon="💡" title="Ce Oferim">
          <FeaturesGrid />
        </Section>

        <Section icon="�" title="Viziunea Noastră">
          <p>
            Credem într-o Românie digitalizată, unde fiecare localitate,
            indiferent de mărime, are acces la instrumente moderne de comunicare
            cu cetățenii. Vrem să reducem barierele tehnologice și să facem
            digitalizarea accesibilă tuturor comunităților.
          </p>
        </Section>

        <Section icon="👥" title="Echipa">
          <p>
            Portal Localități este dezvoltat de o echipă dedicată de
            profesioniști în tehnologie și administrație publică, cu experiență
            în dezvoltarea de soluții digitale pentru sectorul public.
          </p>
        </Section>

        <section className="about-section stats-section">
          <h2>Statistici</h2>
          <StatsGrid />
        </section>

        <Section icon="📧" title="Contact">
          <p>
            Pentru mai multe informații sau colaborări, ne puteți contacta la:
          </p>
          <div className="contact-info">
            <p>📧 Email: contact@portal-localitati.ro</p>
            <p>🏢 Adresă: Timișoara, România</p>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default AboutPage;
