import React from "react";
import SettlementCard from "./SettlementCard";

interface Settlement {
  _id: string;
  name: string;
  judet: string;
  active: boolean;
}

interface SettlementsGridProps {
  settlements: Settlement[];
}

const SettlementsGrid: React.FC<SettlementsGridProps> = ({ settlements }) => {
  return (
    <div className="settlements-grid">
      {settlements.map((settlement) => (
        <SettlementCard key={settlement._id} settlement={settlement} />
      ))}
    </div>
  );
};

export default SettlementsGrid;
