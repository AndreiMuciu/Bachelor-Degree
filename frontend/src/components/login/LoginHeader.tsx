import React from "react";

const LoginHeader: React.FC = () => {
  return (
    <div className="login-header">
      <div className="logo-container">
        <div className="logo-icon">🏛️</div>
      </div>
      <h1>Bine ai revenit!</h1>
      <p>Autentifică-te pentru a accesa dashboard-ul</p>
    </div>
  );
};

export default LoginHeader;
