import React from "react";
import FAQItem from "./FAQItem";

export interface FAQItemData {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface FAQListProps {
  faqs: FAQItemData[];
  activeId: number | null;
  onToggle: (id: number) => void;
}

const FAQList: React.FC<FAQListProps> = ({ faqs, activeId, onToggle }) => {
  return (
    <div className="faq-list">
      {faqs.map((faq) => (
        <FAQItem
          key={faq.id}
          question={faq.question}
          answer={faq.answer}
          isActive={activeId === faq.id}
          onToggle={() => onToggle(faq.id)}
        />
      ))}
    </div>
  );
};

export default FAQList;
