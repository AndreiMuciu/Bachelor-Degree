import React, { useState } from "react";
import {
  UserManagement,
  SettlementManagement,
  UserSettlementAssignment,
} from "../components/admin";
import "../styles/Admin.css";

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "users" | "settlements" | "assignments"
  >("users");

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Panou de Administrare</h1>
        <p>Gestionează utilizatorii, settlementurile și asignările</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <span className="tab-icon">👥</span>
          Utilizatori
        </button>
        <button
          className={`admin-tab ${activeTab === "settlements" ? "active" : ""}`}
          onClick={() => setActiveTab("settlements")}
        >
          <span className="tab-icon">🏘️</span>
          Settlementuri
        </button>
        <button
          className={`admin-tab ${activeTab === "assignments" ? "active" : ""}`}
          onClick={() => setActiveTab("assignments")}
        >
          <span className="tab-icon">🔗</span>
          Asignări
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "users" && <UserManagement />}
        {activeTab === "settlements" && <SettlementManagement />}
        {activeTab === "assignments" && <UserSettlementAssignment />}
      </div>
    </div>
  );
};

export default AdminPage;
