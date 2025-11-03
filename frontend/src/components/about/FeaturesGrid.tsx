import React from "react";
import FeatureCard from "./FeatureCard";

const FeaturesGrid: React.FC = () => {
  const features = [
    {
      icon: "🏛️",
      title: "Platformă Dedicată",
      description: "Sistem specialized pentru nevoile administrațiilor locale",
    },
    {
      icon: "📱",
      title: "Design Responsive",
      description: "Website-uri optimizate pentru orice dispozitiv",
    },
    {
      icon: "✏️",
      title: "Editare Ușoară",
      description: "Interfață simplă pentru gestionarea conținutului",
    },
    {
      icon: "🔒",
      title: "Securitate",
      description: "Protecție avansată a datelor și autentificare sigură",
    },
    {
      icon: "📊",
      title: "Analiză Date",
      description: "Statistici și rapoarte pentru website-ul tău",
    },
    {
      icon: "⚡",
      title: "Performanță",
      description: "Website-uri rapide și optimizate",
    },
  ];

  return (
    <div className="features-grid">
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} />
      ))}
    </div>
  );
};

export default FeaturesGrid;
