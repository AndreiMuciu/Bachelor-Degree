import React from "react";

interface MicrosoftLoginButtonProps {
  onClick: () => void;
}

const MicrosoftLoginButton: React.FC<MicrosoftLoginButtonProps> = ({
  onClick,
}) => {
  return (
    <button type="button" className="btn-microsoft" onClick={onClick}>
      <svg className="microsoft-icon" viewBox="0 0 21 21">
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
      Continuă cu Microsoft
    </button>
  );
};

export default MicrosoftLoginButton;
