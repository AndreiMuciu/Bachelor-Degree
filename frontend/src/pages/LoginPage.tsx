import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";
import "../styles/Login.css";

const LoginPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const { login, signup } = useAuth();
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
      if (isLoginMode) {
        await login({ email, password });
      } else {
        await signup({ email, password });
      }
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
          <h1>{isLoginMode ? "Autentificare" : "Înregistrare"}</h1>
          <p>
            {isLoginMode
              ? "Bine ai revenit! Te rugăm să te autentifici."
              : "Creează un cont nou pentru a începe."}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
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
            <label htmlFor="password">Parolă</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? "Se procesează..."
              : isLoginMode
              ? "Autentifică-te"
              : "Înregistrează-te"}
          </button>
        </form>

        <div className="divider">sau</div>

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

        <div className="toggle-mode">
          {isLoginMode ? (
            <>
              Nu ai cont?{" "}
              <button type="button" onClick={() => setIsLoginMode(false)}>
                Înregistrează-te
              </button>
            </>
          ) : (
            <>
              Ai deja cont?{" "}
              <button type="button" onClick={() => setIsLoginMode(true)}>
                Autentifică-te
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
