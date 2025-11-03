import React from "react";

interface Category {
  id: string;
  label: string;
  icon: string;
}

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="faq-categories">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`category-btn ${
            activeCategory === category.id ? "active" : ""
          }`}
          onClick={() => onCategoryChange(category.id)}
        >
          <span className="category-icon">{category.icon}</span>
          {category.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
