import axios from "axios";
import type {
  LoginCredentials,
  AuthResponse,
  User,
  Settlement,
} from "../types";

const API_BASE_URL = "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor pentru a adăuga token-ul la fiecare request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  signup: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/signup", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.get("/auth/logout");
    localStorage.removeItem("token");
  },

  getMicrosoftLoginUrl: (): string => {
    return `${API_BASE_URL}/auth/entra/login`;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<{ data: { user: User } }>("/users/me");
    return response.data.data.user;
  },
};

// Settlement endpoints
export const settlementAPI = {
  getAll: async (): Promise<Settlement[]> => {
    const response = await api.get<{ data: { data: Settlement[] } }>(
      "/settlements"
    );
    return response.data.data.data;
  },

  getById: async (id: string): Promise<Settlement> => {
    console.log("API - Fetching settlement:", id);
    const response = await api.get<{ data: { data: Settlement } }>(
      `/settlements/${id}`
    );
    console.log("API - Full response:", response);
    console.log("API - Response data:", response.data);
    return response.data.data.data;
  },

  update: async (
    id: string,
    data: Partial<Settlement>
  ): Promise<Settlement> => {
    const response = await api.patch<{ data: { data: Settlement } }>(
      `/settlements/${id}`,
      data
    );
    return response.data.data.data;
  },
};

export default api;
