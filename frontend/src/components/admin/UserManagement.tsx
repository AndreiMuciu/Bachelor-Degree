import React, { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import type { User } from "../../types";

interface UserManagementProps {
  onUserCreated?: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onUserCreated }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Eroare la încărcarea utilizatorilor",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email || !formData.password) {
      setError("Toate câmpurile sunt obligatorii");
      return;
    }

    try {
      setLoading(true);
      await adminAPI.createUser(formData);
      setSuccess("Utilizator creat cu succes!");
      setFormData({ email: "", password: "" });
      setShowCreateForm(false);
      await loadUsers();
      if (onUserCreated) onUserCreated();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Eroare la crearea utilizatorului",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Sigur doriți să ștergeți acest utilizator?")) {
      return;
    }

    try {
      setLoading(true);
      await adminAPI.deleteUser(userId);
      setSuccess("Utilizator șters cu succes!");
      await loadUsers();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Eroare la ștergerea utilizatorului",
      );
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Gestionare Utilizatori</h2>
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Anulează" : "+ Adaugă Utilizator"}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showCreateForm && (
        <div className="create-form">
          <h3>Creare Utilizator Nou</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@exemplu.ro"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Parolă:</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Minimum 8 caractere"
                minLength={8}
                required
              />
            </div>
            <div className="form-note">
              Nota: Utilizatorul va fi creat cu rol de "user"
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ email: "", password: "" });
                }}
              >
                Anulează
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Se creează..." : "Creează Utilizator"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-list">
        <h3>Utilizatori Existenți ({users.length})</h3>
        {loading && <div className="loading">Se încarcă...</div>}
        {!loading && users.length === 0 && (
          <div className="empty-state">Nu există utilizatori</div>
        )}
        {!loading && users.length > 0 && (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Settlementuri Asignate</th>
                    <th>Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge badge-${user.role}`}>
                          {user.role === "admin"
                            ? "Administrator"
                            : "Utilizator"}
                        </span>
                      </td>
                      <td>{user.settlements?.length || 0}</td>
                      <td>
                        {user.role !== "admin" && (
                          <button
                            className="btn-danger btn-small"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={loading}
                          >
                            Șterge
                          </button>
                        )}
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

export default UserManagement;
