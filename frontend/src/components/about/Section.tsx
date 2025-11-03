import React from "react";

interface SectionProps {
  icon: string;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon, title, children }) => {
  return (
    <section className="about-section">
      <div className="section-icon">{icon}</div>
      <h2>{title}</h2>
      {children}
    </section>
  );
};

export default Section;
