import React from "react";
import HelpCard from "../HelpCard";
import HelpTip from "../HelpTip";

const GettingStartedSection: React.FC = () => {
  return (
    <div className="help-section">
      <h1>🚀 Începe</h1>
      <p className="section-intro">
        Bun venit în Portal Localități! Acest ghid te va ajuta să înțelegi cum
        să folosești platforma.
      </p>

      <HelpCard title="Pasul 1: Autentificare">
        <ol>
          <li>Accesează pagina de login</li>
          <li>Introdu adresa de email și parola</li>
          <li>Apasă butonul "Autentificare"</li>
        </ol>
        <HelpTip>
          💡 <strong>Sfat:</strong> Dacă nu ai cont, contactează administratorul
          pentru a primi acces.
        </HelpTip>
      </HelpCard>

      <HelpCard title="Pasul 2: Explorează Dashboard-ul">
        <p>
          După autentificare, vei fi redirecționat către dashboard-ul principal
          unde poți vedea toate localitățile tale.
        </p>
      </HelpCard>

      <HelpCard title="Pasul 3: Selectează o Localitate">
        <p>
          Click pe oricare dintre cardurile de localități pentru a accesa panoul
          de administrare specific acelei localități.
        </p>
      </HelpCard>
    </div>
  );
};

export default GettingStartedSection;
