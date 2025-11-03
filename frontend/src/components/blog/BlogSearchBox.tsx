import React from "react";

interface BlogSearchBoxProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  resultsCount: number;
}

const BlogSearchBox: React.FC<BlogSearchBoxProps> = ({
  searchQuery,
  onSearchChange,
  resultsCount,
}) => {
  return (
    <div className="search-container">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Caută în postări (titlu, descriere, conținut)..."
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
      {searchQuery && (
        <p className="search-results-info">
          {resultsCount === 0
            ? "Nicio postare găsită"
            : `${resultsCount} ${
                resultsCount === 1 ? "postare găsită" : "postări găsite"
              }`}
        </p>
      )}
    </div>
  );
};

export default BlogSearchBox;
