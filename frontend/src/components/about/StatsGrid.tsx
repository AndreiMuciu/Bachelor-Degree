import React from "react";
import StatCard from "./StatCard";

const StatsGrid: React.FC = () => {
  const stats = [
    { number: "100+", label: "Localități Active" },
    { number: "500+", label: "Utilizatori Înregistrați" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Suport Tehnic" },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsGrid;
