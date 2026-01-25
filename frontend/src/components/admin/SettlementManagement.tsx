import React, { useState, useEffect } from "react";
import { adminAPI, settlementAPI } from "../../services/api";
import type { Settlement } from "../../types";

interface SettlementManagementProps {
  onSettlementCreated?: () => void;
}

const SettlementManagement: React.FC<SettlementManagementProps> = ({
  onSettlementCreated,
}) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    judet: "",
    lat: 0,
    lng: 0,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const data = await settlementAPI.getAll();
      setSettlements(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Eroare la încărcarea settlementurilor",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.judet || !formData.lat || !formData.lng) {
      setError("Toate câmpurile sunt obligatorii");
      return;
    }

    try {
      setLoading(true);
      if (editingSettlement) {
        await adminAPI.updateSettlement(editingSettlement._id, formData);
        setSuccess("Settlement actualizat cu succes!");
      } else {
        await adminAPI.createSettlement(formData);
        setSuccess("Settlement creat cu succes!");
      }
      setFormData({ name: "", judet: "", lat: 0, lng: 0 });
      setShowCreateForm(false);
      setEditingSettlement(null);
      await loadSettlements();
      if (onSettlementCreated) onSettlementCreated();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Eroare la salvarea settlementului",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (settlement: Settlement) => {
    setEditingSettlement(settlement);
    setFormData({
      name: settlement.name,
      judet: settlement.judet,
      lat: settlement.lat,
      lng: settlement.lng,
    });
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setEditingSettlement(null);
    setShowCreateForm(false);
    setFormData({ name: "", judet: "", lat: 0, lng: 0 });
  };

  const handleDeleteSettlement = async (settlementId: string) => {
    if (!window.confirm("Sigur doriți să ștergeți acest settlement?")) {
      return;
    }

    try {
      setLoading(true);
      await adminAPI.deleteSettlement(settlementId);
      setSuccess("Settlement șters cu succes!");
      await loadSettlements();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Eroare la ștergerea settlementului",
      );
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSettlements = settlements.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(settlements.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Gestionare Settlementuri</h2>
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Anulează" : "+ Adaugă Settlement"}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showCreateForm && (
        <div className="create-form">
          <h3>
            {editingSettlement ? "Editare Settlement" : "Creare Settlement Nou"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nume Localitate:</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="ex: București"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="judet">Județ:</label>
                <input
                  type="text"
                  id="judet"
                  value={formData.judet}
                  onChange={(e) =>
                    setFormData({ ...formData, judet: e.target.value })
                  }
                  placeholder="ex: Ilfov"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lat">Latitudine:</label>
                <input
                  type="number"
                  id="lat"
                  step="any"
                  value={formData.lat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lat: parseFloat(e.target.value),
                    })
                  }
                  placeholder="ex: 44.4268"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lng">Longitudine:</label>
                <input
                  type="number"
                  id="lng"
                  step="any"
                  value={formData.lng}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lng: parseFloat(e.target.value),
                    })
                  }
                  placeholder="ex: 26.1025"
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
              >
                Anulează
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading
                  ? "Se salvează..."
                  : editingSettlement
                    ? "Actualizează Settlement"
                    : "Creează Settlement"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="settlements-list">
        <h3>Settlementuri Existente ({settlements.length})</h3>
        {loading && <div className="loading">Se încarcă...</div>}
        {!loading && settlements.length === 0 && (
          <div className="empty-state">Nu există settlementuri</div>
        )}
        {!loading && settlements.length > 0 && (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nume</th>
                    <th>Județ</th>
                    <th>Latitudine</th>
                    <th>Longitudine</th>
                    <th>Status</th>
                    <th>Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSettlements.map((settlement) => (
                    <tr key={settlement._id}>
                      <td>{settlement.name}</td>
                      <td>{settlement.judet}</td>
                      <td>{settlement.lat.toFixed(4)}</td>
                      <td>{settlement.lng.toFixed(4)}</td>
                      <td>
                        <span
                          className={`badge badge-${
                            settlement.active ? "active" : "inactive"
                          }`}
                        >
                          {settlement.active ? "Activ" : "Inactiv"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-secondary btn-small"
                            onClick={() => handleEdit(settlement)}
                            disabled={loading}
                          >
                            Editează
                          </button>
                          <button
                            className="btn-danger btn-small"
                            onClick={() =>
                              handleDeleteSettlement(settlement._id)
                            }
                            disabled={loading}
                          >
                            Șterge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  « Anterior
                </button>
                <div className="pagination-info">
                  Pagina {currentPage} din {totalPages}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Următorul »
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SettlementManagement;
