import axios from "axios";
import type {
  LoginCredentials,
  AuthResponse,
  User,
  Settlement,
  BlogPost,
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

// Blog Post endpoints
export const blogPostAPI = {
  getAll: async (): Promise<BlogPost[]> => {
    const response = await api.get<{ data: { data: BlogPost[] } }>(
      "/blog-posts"
    );
    return response.data.data.data;
  },

  getBySettlement: async (settlementId: string): Promise<BlogPost[]> => {
    const response = await api.get<{ data: { data: BlogPost[] } }>(
      `/blog-posts?settlement=${settlementId}`
    );
    return response.data.data.data;
  },

  getById: async (id: string): Promise<BlogPost> => {
    const response = await api.get<{ data: { data: BlogPost } }>(
      `/blog-posts/${id}`
    );
    return response.data.data.data;
  },

  create: async (data: Partial<BlogPost>): Promise<BlogPost> => {
    const response = await api.post<{ data: { data: BlogPost } }>(
      "/blog-posts",
      data
    );
    return response.data.data.data;
  },

  update: async (id: string, data: Partial<BlogPost>): Promise<BlogPost> => {
    const response = await api.patch<{ data: { data: BlogPost } }>(
      `/blog-posts/${id}`,
      data
    );
    return response.data.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/blog-posts/${id}`);
  },
};

// N8N endpoints
export const n8nAPI = {
  createSite: async (
    settlementId: string,
    files: { html: string; css: string; js: string }
  ): Promise<{ status: string; message: string; data: any }> => {
    const response = await api.post("/n8n/create-site", {
      settlementId,
      files,
    });
    return response.data;
  },

  updateSite: async (
    settlementId: string,
    files: { html: string; css: string; js: string }
  ): Promise<{ status: string; message: string; data: any }> => {
    const response = await api.post("/n8n/update-site", {
      settlementId,
      files,
    });
    return response.data;
  },
};

export default api;
