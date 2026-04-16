import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { eventAPI } from "../services/api";
import type { Event, EventStatus } from "../types";
import "../styles/EventsManagement.css";

const DEFAULT_TIMEZONES = [
  "Europe/Bucharest",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
];

type EventFormState = {
  title: string;
  description: string;
  localDate: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  location: string;
  linkUrl: string;
  status: EventStatus;
};

const emptyForm: EventFormState = {
  title: "",
  description: "",
  localDate: "",
  startTime: "09:00",
  endTime: "10:00",
  timeZone: "Europe/Bucharest",
  location: "",
  linkUrl: "",
  status: "draft",
};

const EventsManagementPage: React.FC = () => {
  const { settlementId } = useParams<{ settlementId: string }>();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormState>(emptyForm);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settlementId]);

  const fetchEvents = async () => {
    if (!settlementId) return;

    try {
      const data = await eventAPI.getBySettlement(settlementId);
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;

    return events.filter((ev) => {
      return (
        ev.title.toLowerCase().includes(q) ||
        (ev.description || "").toLowerCase().includes(q) ||
        (ev.location || "").toLowerCase().includes(q) ||
        ev.localDate.includes(q)
      );
    });
  }, [events, searchQuery]);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (ev: Event) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title || "",
      description: ev.description || "",
      localDate: ev.localDate || "",
      startTime: ev.startTime || "09:00",
      endTime: ev.endTime || "10:00",
      timeZone: ev.timeZone || "Europe/Bucharest",
      location: ev.location || "",
      linkUrl: ev.linkUrl || "",
      status: ev.status || "draft",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData(emptyForm);
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return "Titlul este obligatoriu";
    if (!formData.localDate) return "Data este obligatorie";
    if (!formData.startTime) return "Ora de început este obligatorie";
    if (!formData.endTime) return "Ora de sfârșit este obligatorie";
    if (formData.endTime <= formData.startTime)
      return "Ora de sfârșit trebuie să fie după ora de început";
    if (!formData.timeZone.trim()) return "Fusul orar este obligatoriu";
    if (formData.linkUrl && !/^https?:\/\//i.test(formData.linkUrl)) {
      return "Link-ul trebuie să înceapă cu http:// sau https://";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementId) return;

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    const payload: Partial<Event> = {
      title: formData.title.trim(),
      description: formData.description,
      localDate: formData.localDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      timeZone: formData.timeZone.trim(),
      location: formData.location,
      linkUrl: formData.linkUrl,
      status: formData.status,
      settlement: settlementId,
    };

    try {
      if (editingEvent) {
        await eventAPI.update(editingEvent._id, payload);
      } else {
        await eventAPI.create(payload);
      }

      await fetchEvents();
      closeModal();
    } catch (error: any) {
      console.error("Error saving event:", error);
      alert(
        error?.response?.data?.message ||
          "Eroare la salvarea evenimentului. Verifică datele și încearcă din nou.",
      );
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Ești sigur că vrei să ștergi acest eveniment?")) return;

    try {
      await eventAPI.delete(eventId);
      await fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Eroare la ștergerea evenimentului");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <div className="back-button-wrapper">
        <button
          className="back-button"
          onClick={() => navigate(`/settlement/${settlementId}`)}
        >
          ← Înapoi la Settlement
        </button>
      </div>

      <div className="events-management-container">
        <div className="events-header">
          <div>
            <h1>📅 Evenimente</h1>
            <p>
              {events.length} {events.length === 1 ? "eveniment" : "evenimente"}
            </p>
          </div>
          <button className="events-create-btn" onClick={openCreateModal}>
            + Adaugă Eveniment
          </button>
        </div>

        <div className="events-toolbar">
          <input
            className="events-search"
            type="text"
            placeholder="Caută după titlu, descriere, locație sau dată..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredEvents.length === 0 ? (
          <div className="events-empty">
            <div className="events-empty-icon">✨</div>
            <h3>Niciun eveniment</h3>
            <p>
              {events.length === 0
                ? "Creează primul eveniment pentru această localitate."
                : "Nu există rezultate pentru căutarea curentă."}
            </p>
            <button className="events-create-btn" onClick={openCreateModal}>
              Creează Eveniment
            </button>
          </div>
        ) : (
          <div className="events-table-wrapper">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Interval</th>
                  <th>Titlu</th>
                  <th>Status</th>
                  <th>Locație</th>
                  <th style={{ width: 160 }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev) => (
                  <tr key={ev._id}>
                    <td>{ev.localDate}</td>
                    <td>
                      {ev.startTime} - {ev.endTime}
                      <div className="events-tz">{ev.timeZone}</div>
                    </td>
                    <td>
                      <div className="events-title">{ev.title}</div>
                      {ev.linkUrl && (
                        <a
                          className="events-link"
                          href={ev.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          link
                        </a>
                      )}
                    </td>
                    <td>
                      <span
                        className={`events-status ${
                          ev.status === "published" ? "published" : "draft"
                        }`}
                      >
                        {ev.status === "published" ? "Publicat" : "Draft"}
                      </span>
                    </td>
                    <td>{ev.location || "-"}</td>
                    <td>
                      <div className="events-actions">
                        <button
                          className="events-btn"
                          onClick={() => openEditModal(ev)}
                        >
                          Editează
                        </button>
                        <button
                          className="events-btn danger"
                          onClick={() => handleDelete(ev._id)}
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
        )}

        {showModal && (
          <div className="events-modal-overlay" onClick={closeModal}>
            <div
              className="events-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="events-modal-header">
                <h2>{editingEvent ? "Editează Eveniment" : "Eveniment Nou"}</h2>
                <button className="events-modal-close" onClick={closeModal}>
                  ✕
                </button>
              </div>

              <form className="events-form" onSubmit={handleSubmit}>
                <label>
                  Titlu
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, title: e.target.value }))
                    }
                    maxLength={120}
                    required
                  />
                </label>

                <div className="events-form-row">
                  <label>
                    Data
                    <input
                      type="date"
                      value={formData.localDate}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          localDate: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Fus orar
                    <input
                      list="timezones"
                      value={formData.timeZone}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, timeZone: e.target.value }))
                      }
                      required
                    />
                    <datalist id="timezones">
                      {DEFAULT_TIMEZONES.map((tz) => (
                        <option key={tz} value={tz} />
                      ))}
                    </datalist>
                  </label>
                </div>

                <div className="events-form-row">
                  <label>
                    Ora început
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          startTime: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Ora sfârșit
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, endTime: e.target.value }))
                      }
                      required
                    />
                  </label>
                </div>

                <div className="events-form-row">
                  <label>
                    Status
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          status: e.target.value as EventStatus,
                        }))
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Publicat</option>
                    </select>
                  </label>
                  <label>
                    Locație
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, location: e.target.value }))
                      }
                      maxLength={200}
                    />
                  </label>
                </div>

                <label>
                  Link (opțional)
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.linkUrl}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, linkUrl: e.target.value }))
                    }
                    maxLength={500}
                  />
                </label>

                <label>
                  Descriere (opțional)
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    rows={6}
                    maxLength={4000}
                  />
                </label>

                <div className="events-form-actions">
                  <button
                    type="button"
                    className="events-btn"
                    onClick={closeModal}
                  >
                    Anulează
                  </button>
                  <button type="submit" className="events-btn primary">
                    {editingEvent ? "Salvează" : "Creează"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EventsManagementPage;
