import React from "react";

interface SearchBoxProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  resultsCount?: number;
  totalCount?: number;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = "Caută...",
  resultsCount,
}) => {
  return (
    <div className="search-container">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button
            className="clear-search"
            onClick={() => onSearchChange("")}
            title="Șterge căutarea"
          >
            ✕
          </button>
        )}
      </div>
      {searchQuery && resultsCount !== undefined && (
        <p className="search-results-info">
          {resultsCount === 0
            ? "Nicio localitate găsită"
            : `${resultsCount} ${
                resultsCount === 1 ? "localitate găsită" : "localități găsite"
              }`}
        </p>
      )}
    </div>
  );
};

export default SearchBox;
