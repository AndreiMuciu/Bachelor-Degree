import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import SearchBox from "../components/dashboard/SearchBox";
import EmptyState from "../components/dashboard/EmptyState";
import SettlementsGrid from "../components/dashboard/SettlementsGrid";
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
          <SearchBox
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Caută localități (nume sau județ)..."
            resultsCount={filteredSettlements.length}
          />
        )}

        {hasSettlements ? (
          filteredSettlements.length === 0 && searchQuery ? (
            <EmptyState
              icon="🔍"
              title="Nicio localitate găsită"
              description="Încearcă alt termen de căutare"
              actionButton={{
                text: "Resetează căutarea",
                onClick: () => setSearchQuery(""),
              }}
            />
          ) : (
            <SettlementsGrid settlements={filteredSettlements} />
          )
        ) : (
          <EmptyState
            icon="📍"
            title="Nu ești asignat pentru nicio localitate"
            description="Contactează administratorul pentru a fi asignat unei localități."
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
