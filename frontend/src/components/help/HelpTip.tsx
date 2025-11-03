import React from "react";

interface HelpTipProps {
  children: React.ReactNode;
}

const HelpTip: React.FC<HelpTipProps> = ({ children }) => {
  return <div className="help-tip">{children}</div>;
};

export default HelpTip;
