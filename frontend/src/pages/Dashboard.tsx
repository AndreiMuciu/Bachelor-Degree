import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Dashboard.css";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const hasSettlements = user.settlements && user.settlements.length > 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Localitățile Tale</h1>
          <p>Gestionează și creează website-uri pentru localitățile tale</p>
        </div>

        {hasSettlements ? (
          <div className="settlements-grid">
            {user.settlements.map((settlement) => (
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
                  {settlement.active ? "✓ Website Activ" : "○ Website Inactiv"}
                </span>
              </Link>
            ))}
          </div>
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
