import React from "react";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="feature-card">
      <h3>
        {icon} {title}
      </h3>
      <p>{description}</p>
    </div>
  );
};

export default FeatureCard;
