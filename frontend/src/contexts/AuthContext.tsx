import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, LoginCredentials } from "../types";
import { authAPI } from "../services/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifică dacă există un token și încearcă să obții user-ul
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      console.log("AuthContext - Init with token:", token ? "exists" : "none");
      if (token) {
        try {
          console.log("AuthContext - Fetching current user...");
          const currentUser = await authAPI.getCurrentUser();
          console.log("AuthContext - User fetched:", currentUser);
          setUser(currentUser);
        } catch (error) {
          console.error("Error fetching user:", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authAPI.login(credentials);
      setUser(response.data.user);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (credentials: LoginCredentials) => {
    try {
      const response = await authAPI.signup(credentials);
      setUser(response.data.user);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    console.log(
      "AuthContext - Refresh user with token:",
      token ? "exists" : "none"
    );
    if (token) {
      try {
        console.log("AuthContext - Fetching user for refresh...");
        const currentUser = await authAPI.getCurrentUser();
        console.log("AuthContext - User refreshed:", currentUser);
        setUser(currentUser);
      } catch (error) {
        console.error("Error refreshing user:", error);
        localStorage.removeItem("token");
        setUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
