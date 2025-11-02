import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";
import "../styles/Login.css";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const { login } = useAuth();
  const navigate = useNavigate();

  // Verifică dacă există parametri de la Microsoft login
  useEffect(() => {
    console.log("LoginPage - Current URL:", window.location.href);
    console.log("LoginPage - Search params string:", window.location.search);

    const loginSuccess = searchParams.get("login");
    const loginError = searchParams.get("error");
    const token = searchParams.get("token");

    console.log("LoginPage - URL params:", { loginSuccess, loginError, token });
    console.log("LoginPage - Token length:", token ? token.length : 0);

    if (loginSuccess === "success" && token) {
      console.log(
        "Microsoft login success! Saving token and reloading page..."
      );
      // Salvează token-ul în localStorage
      localStorage.setItem("token", token);
      console.log("Token saved to localStorage!");
      // Forțează o reîncărcare completă a paginii pentru a reîncărca AuthContext
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    } else if (loginError) {
      console.log("Login error:", loginError);
      if (loginError === "user_not_found") {
        setError(
          "User-ul nu există în baza de date. Contactează administratorul."
        );
      } else if (loginError === "auth_failed") {
        setError(
          "Autentificarea cu Microsoft a eșuat. Te rugăm să încerci din nou."
        );
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "A apărut o eroare. Te rugăm să încerci din nou."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    window.location.href = authAPI.getMicrosoftLoginUrl();
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">🏛️</div>
          </div>
          <h1>Bine ai revenit!</h1>
          <p>Autentifică-te pentru a accesa dashboard-ul</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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

        <div className="divider">
          <span>sau</span>
        </div>

        <button
          type="button"
          className="btn-microsoft"
          onClick={handleMicrosoftLogin}
        >
          <svg className="microsoft-icon" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          Continuă cu Microsoft
        </button>

        <div className="login-footer">
          <p>
            Conturile sunt gestionate de administrator. Dacă ai nevoie de acces,
            contactează echipa de suport.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
