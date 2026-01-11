import React from "react";

interface MemberSearchBoxProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount: number;
}

const MemberSearchBox: React.FC<MemberSearchBoxProps> = ({
  searchQuery,
  onSearchChange,
  resultsCount,
}) => {
  return (
    <div className="member-search-container">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Caută după nume, poziție sau descriere..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            className="clear-search"
            onClick={() => onSearchChange("")}
            aria-label="Șterge căutarea"
          >
            ✕
          </button>
        )}
      </div>
      {searchQuery && (
        <p className="search-results-text">
          {resultsCount}{" "}
          {resultsCount === 1 ? "rezultat găsit" : "rezultate găsite"}
        </p>
      )}
    </div>
  );
};

export default MemberSearchBox;
