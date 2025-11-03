import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";
import LoginHeader from "../components/login/LoginHeader";
import LoginForm from "../components/login/LoginForm";
import MicrosoftLoginButton from "../components/login/MicrosoftLoginButton";
import LoginFooter from "../components/login/LoginFooter";
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
        <LoginHeader />

        <LoginForm
          email={email}
          password={password}
          error={error}
          loading={loading}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />

        <div className="divider">
          <span>sau</span>
        </div>

        <MicrosoftLoginButton onClick={handleMicrosoftLogin} />

        <LoginFooter />
      </div>
    </div>
  );
};

export default LoginPage;
