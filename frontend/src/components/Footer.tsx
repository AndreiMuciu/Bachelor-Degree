import React from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Footer.css";

const Footer: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null; // Nu afișa footer-ul dacă nu ești autentificat
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">Portal Localități</h3>
          <p className="footer-description">
            Platformă modernă pentru gestionarea și crearea de website-uri
            pentru localități.
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Link-uri Rapide</h4>
          <ul className="footer-links">
            <li>
              <a href="/">Acasă</a>
            </li>
            <li>
              <a href="/about">Despre</a>
            </li>
            <li>
              <a href="/help">Ajutor</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Suport</h4>
          <ul className="footer-links">
            <li>
              <a href="/faq">Întrebări Frecvente</a>
            </li>
            <li>
              <a href="/terms">Termeni și Condiții</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Contact</h4>
          <ul className="footer-contact">
            <li>📧 contact@portal-localitati.ro</li>
            <li>📞 +40 123 456 789</li>
            <li>📍 Timișoara, România</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {currentYear} Portal Localități. Toate drepturile rezervate.
        </p>
        <div className="footer-social">
          <a href="#" className="social-link" aria-label="Facebook">
            📘
          </a>
          <a href="#" className="social-link" aria-label="Twitter">
            🐦
          </a>
          <a href="#" className="social-link" aria-label="LinkedIn">
            💼
          </a>
          <a href="#" className="social-link" aria-label="Instagram">
            📷
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
