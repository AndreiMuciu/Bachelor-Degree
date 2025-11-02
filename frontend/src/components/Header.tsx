import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Header.css";

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  if (!isAuthenticated) {
    return null; // Nu afișa header-ul dacă nu ești autentificat
  }

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <span className="logo-icon">🏛️</span>
          <span className="logo-text">Portal Localități</span>
        </Link>

        <nav className="header-nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
          >
            <span className="nav-icon">🏠</span>
            Acasă
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={`nav-link ${
                location.pathname === "/admin" ? "active" : ""
              }`}
            >
              <span className="nav-icon">⚙️</span>
              Administrare
            </Link>
          )}
        </nav>

        <div className="header-user">
          <div className="user-info">
            <span className="user-avatar">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </span>
            <div className="user-details">
              <span className="user-email">{user?.email}</span>
              <span className="user-role">
                {user?.role === "admin" ? "Administrator" : "Utilizator"}
              </span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Deconectare
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
