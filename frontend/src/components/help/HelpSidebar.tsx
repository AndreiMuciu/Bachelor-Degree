import React from "react";

interface Section {
  id: string;
  title: string;
  icon: string;
}

interface HelpSidebarProps {
  sections: Section[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

const HelpSidebar: React.FC<HelpSidebarProps> = ({
  sections,
  activeSection,
  onSectionChange,
}) => {
  return (
    <div className="help-sidebar">
      <h2>Ghid Utilizare</h2>
      <nav className="help-nav">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`help-nav-item ${
              activeSection === section.id ? "active" : ""
            }`}
            onClick={() => onSectionChange(section.id)}
          >
            <span className="nav-item-icon">{section.icon}</span>
            {section.title}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default HelpSidebar;
