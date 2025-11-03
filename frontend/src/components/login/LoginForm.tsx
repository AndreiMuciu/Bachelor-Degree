import React from "react";

interface LoginFormProps {
  email: string;
  password: string;
  error: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) => {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email">
          <span className="label-icon">📧</span>
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="exemplu@email.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">
          <span className="label-icon">🔒</span>
          Parolă
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Minim 6 caractere"
          required
          minLength={6}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner-small"></span>
            Se procesează...
          </>
        ) : (
          <>
            <span className="btn-icon">🚀</span>
            Autentifică-te
          </>
        )}
      </button>
    </form>
  );
};

export default LoginForm;
