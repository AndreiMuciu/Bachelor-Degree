import React from "react";
import { Link } from "react-router-dom";

interface Settlement {
  _id: string;
  name: string;
  judet: string;
  active: boolean;
}

interface SettlementCardProps {
  settlement: Settlement;
}

const SettlementCard: React.FC<SettlementCardProps> = ({ settlement }) => {
  return (
    <Link to={`/settlement/${settlement._id}`} className="settlement-card">
      <h3 className="settlement-name">{settlement.name}</h3>
      <p className="settlement-location">📍 {settlement.judet}</p>
      <span
        className={`settlement-status ${
          settlement.active ? "status-active" : "status-inactive"
        }`}
      >
        {settlement.active ? "✓ Website Activ" : "○ Website Inactiv"}
      </span>
    </Link>
  );
};

export default SettlementCard;
