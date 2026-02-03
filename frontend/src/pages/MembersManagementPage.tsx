import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { memberAPI } from "../services/api";
import type { Member } from "../types";
import MemberHeader from "../components/members/MemberHeader";
import MemberSearchBox from "../components/members/MemberSearchBox";
import MembersGrid from "../components/members/MembersGrid";
import MemberModal from "../components/members/MemberModal";
import EmptyState from "../components/dashboard/EmptyState";
import "../styles/MembersManagement.css";

const MembersManagementPage: React.FC = () => {
  const { settlementId } = useParams<{ settlementId: string }>();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage] = useState(10);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    description: "",
    gender: "nespecificat",
    position: "",
  });

  useEffect(() => {
    fetchMembers();
  }, [settlementId]);

  const fetchMembers = async () => {
    if (!settlementId) return;
    try {
      const data = await memberAPI.getBySettlement(settlementId);
      // Sort members alphabetically by last name
      const sortedMembers = data.sort((a, b) =>
        a.lastName.localeCompare(b.lastName),
      );
      setMembers(sortedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementId) return;

    try {
      const dataToSubmit = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: new Date(formData.dateOfBirth),
        description: formData.description,
        gender: formData.gender,
        position: formData.position,
        settlement: settlementId,
      };

      if (editingMember) {
        await memberAPI.update(editingMember._id, {
          ...dataToSubmit,
          photo: photoFile,
        });
      } else {
        await memberAPI.create(dataToSubmit);
      }
      await fetchMembers();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving member:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ești sigur că vrei să ștergi acest membru?")) return;

    try {
      await memberAPI.delete(id);
      await fetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setPhotoFile(null);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: new Date(member.dateOfBirth).toISOString().split("T")[0],
      description: member.description || "",
      gender: member.gender || "nespecificat",
      position: member.position || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setPhotoFile(null);
    setFormData({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      description: "",
      gender: "nespecificat",
      position: "",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Filter members based on search query
  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      (member.firstName && member.firstName.toLowerCase().includes(query)) ||
      (member.lastName && member.lastName.toLowerCase().includes(query)) ||
      (member.position && member.position.toLowerCase().includes(query)) ||
      (member.description && member.description.toLowerCase().includes(query))
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const indexOfLastMember = currentPage * membersPerPage;
  const indexOfFirstMember = indexOfLastMember - membersPerPage;
  const currentMembers = filteredMembers.slice(
    indexOfFirstMember,
    indexOfLastMember,
  );

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

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

      <div className="members-management-container">
        <MemberHeader
          membersCount={members.length}
          onCreateNew={() => setShowModal(true)}
        />

        {members.length > 0 && (
          <MemberSearchBox
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            resultsCount={filteredMembers.length}
          />
        )}

        {members.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Echipa ta așteaptă"
            description="Adaugă primul membru și începe să construiești echipa!"
            actionButton={{
              text: "Adaugă Primul Membru",
              onClick: () => setShowModal(true),
            }}
          />
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Niciun membru găsit"
            description="Încearcă alt termen de căutare"
            actionButton={{
              text: "Resetează căutarea",
              onClick: () => setSearchQuery(""),
            }}
          />
        ) : (
          <>
            <MembersGrid
              members={currentMembers}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Anterior
                </button>

                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        className={`pagination-page ${
                          currentPage === page ? "active" : ""
                        }`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Următor →
                </button>
              </div>
            )}
          </>
        )}

        {showModal && (
          <MemberModal
            isEditing={!!editingMember}
            formData={formData}
            onFormDataChange={(data) => setFormData(data)}
            onSubmit={handleSubmit}
            onClose={handleCloseModal}
            photoFile={photoFile}
            onPhotoChange={setPhotoFile}
          />
        )}
      </div>
    </>
  );
};

export default MembersManagementPage;
