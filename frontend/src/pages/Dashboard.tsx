import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Dashboard.css";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const hasSettlements = user.settlements && user.settlements.length > 0;

  // Filter settlements based on search query
  const filteredSettlements = hasSettlements
    ? user.settlements.filter((settlement) => {
        const query = searchQuery.toLowerCase();
        return (
          settlement.name.toLowerCase().includes(query) ||
          settlement.judet.toLowerCase().includes(query)
        );
      })
    : [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Localitățile Tale</h1>
          <p>Gestionează și creează website-uri pentru localitățile tale</p>
        </div>

        {hasSettlements && (
          <div className="search-container">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Caută localități (nume sau județ)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery("")}
                  title="Șterge căutarea"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="search-results-info">
                {filteredSettlements.length === 0
                  ? "Nicio localitate găsită"
                  : `${filteredSettlements.length} ${
                      filteredSettlements.length === 1
                        ? "localitate găsită"
                        : "localități găsite"
                    }`}
              </p>
            )}
          </div>
        )}

        {hasSettlements ? (
          filteredSettlements.length === 0 && searchQuery ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h2>Nicio localitate găsită</h2>
              <p>Încearcă alt termen de căutare</p>
              <button
                className="btn-secondary btn-large"
                onClick={() => setSearchQuery("")}
              >
                Resetează căutarea
              </button>
            </div>
          ) : (
            <div className="settlements-grid">
              {filteredSettlements.map((settlement) => (
                <Link
                  key={settlement._id}
                  to={`/settlement/${settlement._id}`}
                  className="settlement-card"
                >
                  <h3 className="settlement-name">{settlement.name}</h3>
                  <p className="settlement-location">📍 {settlement.judet}</p>
                  <span
                    className={`settlement-status ${
                      settlement.active ? "status-active" : "status-inactive"
                    }`}
                  >
                    {settlement.active
                      ? "✓ Website Activ"
                      : "○ Website Inactiv"}
                  </span>
                </Link>
              ))}
            </div>
          )
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📍</div>
            <h2>Nu ești asignat pentru nicio localitate</h2>
            <p>
              Contactează administratorul pentru a fi asignat unei localități.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
