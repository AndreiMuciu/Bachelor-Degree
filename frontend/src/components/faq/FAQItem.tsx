import React from "react";

interface FAQItemProps {
  question: string;
  answer: string;
  isActive: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({
  question,
  answer,
  isActive,
  onToggle,
}) => {
  return (
    <div className={`faq-item ${isActive ? "active" : ""}`}>
      <button className="faq-question" onClick={onToggle}>
        <span className="question-text">{question}</span>
        <span className="toggle-icon">{isActive ? "−" : "+"}</span>
      </button>
      {isActive && (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

export default FAQItem;
