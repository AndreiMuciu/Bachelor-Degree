import React, { useState, useEffect } from "react";
import { adminAPI, settlementAPI } from "../../services/api";
import type { User, Settlement } from "../../types";

const UserSettlementAssignment: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSettlements, setSelectedSettlements] = useState<string[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [settlementPage, setSettlementPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, settlementsData] = await Promise.all([
        adminAPI.getAllUsers(),
        settlementAPI.getAll(),
      ]);
      setUsers(usersData.filter((u) => u.role !== "admin"));
      setSettlements(settlementsData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Eroare la încărcarea datelor");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    // Extract settlement IDs from user's settlements
    const settlementIds =
      user.settlements?.map((s) => (typeof s === "string" ? s : s._id)) || [];
    setSelectedSettlements(settlementIds);
    setSettlementPage(1);
    setError("");
    setSuccess("");
  };

  const handleSettlementToggle = (settlementId: string) => {
    setSelectedSettlements((prev) => {
      if (prev.includes(settlementId)) {
        return prev.filter((id) => id !== settlementId);
      } else {
        return [...prev, settlementId];
      }
    });
  };

  const handleSaveAssignment = async () => {
    if (!selectedUser) {
      setError("Selectați un utilizator");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const updatedUser = await adminAPI.updateUser(selectedUser._id, {
        settlements: selectedSettlements,
      });

      // Actualizăm lista de utilizatori în memorie cu user-ul întors de API
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u._id === updatedUser._id ? updatedUser : u)),
      );

      // Actualizăm utilizatorul selectat și settlement-urile lui
      setSelectedUser(updatedUser);
      const settlementIds =
        updatedUser.settlements?.map((s) =>
          typeof s === "string" ? s : s._id,
        ) || [];
      setSelectedSettlements(settlementIds);

      setSuccess("Settlementuri asignate cu succes!");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Eroare la asignarea settlementurilor",
      );
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const indexOfLastUser = userPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalUserPages = Math.ceil(users.length / itemsPerPage) || 1;

  const indexOfLastSettlement = settlementPage * itemsPerPage;
  const indexOfFirstSettlement = indexOfLastSettlement - itemsPerPage;
  const currentSettlements = settlements.slice(
    indexOfFirstSettlement,
    indexOfLastSettlement,
  );
  const totalSettlementPages =
    Math.ceil(settlements.length / itemsPerPage) || 1;

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Asignare Settlementuri la Utilizatori</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="assignment-container">
        <div className="assignment-panel">
          <h3>Selectează Utilizator</h3>
          <div className="users-select-list">
            {loading && <div className="loading">Se încarcă...</div>}
            {!loading && users.length === 0 && (
              <div className="empty-state">
                Nu există utilizatori disponibili
              </div>
            )}
            {!loading &&
              currentUsers.map((user) => (
                <div
                  key={user._id}
                  className={`user-select-item ${
                    selectedUser?._id === user._id ? "selected" : ""
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="user-select-info">
                    <div className="user-select-email">{user.email}</div>
                    <div className="user-select-settlements">
                      {user.settlements?.length || 0} settlementuri asignate
                    </div>
                  </div>
                  {selectedUser?._id === user._id && (
                    <span className="selected-indicator">✓</span>
                  )}
                </div>
              ))}
          </div>
          {!loading && users.length > itemsPerPage && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setUserPage((prev) => Math.max(prev - 1, 1))}
                disabled={userPage === 1}
              >
                « Anterior
              </button>
              <div className="pagination-info">
                Pagina {userPage} din {totalUserPages}
              </div>
              <button
                className="pagination-btn"
                onClick={() =>
                  setUserPage((prev) => Math.min(prev + 1, totalUserPages))
                }
                disabled={userPage === totalUserPages}
              >
                Următorul »
              </button>
            </div>
          )}
        </div>

        <div className="assignment-panel">
          <h3>
            Settlementuri Disponibile
            {selectedUser && ` pentru ${selectedUser.email}`}
          </h3>
          {!selectedUser && (
            <div className="empty-state">
              Selectați un utilizator pentru a vedea settlementurile disponibile
            </div>
          )}
          {selectedUser && (
            <>
              <div className="settlements-checkbox-list">
                {settlements.length === 0 && (
                  <div className="empty-state">
                    Nu există settlementuri disponibile
                  </div>
                )}
                {currentSettlements.map((settlement) => (
                  <label
                    key={settlement._id}
                    className="settlement-checkbox-item"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSettlements.includes(settlement._id)}
                      onChange={() => handleSettlementToggle(settlement._id)}
                    />
                    <div className="settlement-checkbox-info">
                      <div className="settlement-name">{settlement.name}</div>
                      <div className="settlement-judet">{settlement.judet}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="assignment-actions">
                <div className="assignment-summary">
                  Selectate: {selectedSettlements.length} din{" "}
                  {settlements.length}
                </div>
                {settlements.length > itemsPerPage && (
                  <div className="pagination small">
                    <button
                      className="pagination-btn"
                      onClick={() =>
                        setSettlementPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={settlementPage === 1}
                    >
                      « Anterior
                    </button>
                    <div className="pagination-info">
                      Pagina {settlementPage} din {totalSettlementPages}
                    </div>
                    <button
                      className="pagination-btn"
                      onClick={() =>
                        setSettlementPage((prev) =>
                          Math.min(prev + 1, totalSettlementPages),
                        )
                      }
                      disabled={settlementPage === totalSettlementPages}
                    >
                      Următorul »
                    </button>
                  </div>
                )}
                <button
                  className="btn-primary"
                  onClick={handleSaveAssignment}
                  disabled={loading}
                >
                  {loading ? "Se salvează..." : "Salvează Asignarea"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettlementAssignment;
