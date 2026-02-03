import axios from "axios";
import type {
  LoginCredentials,
  AuthResponse,
  User,
  Settlement,
  BlogPost,
  Member,
  Coordinate,
} from "../types";

const API_BASE_URL = "https://api.bachelordegree.tech/api/v1";

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
      "/settlements",
    );
    return response.data.data.data;
  },

  getById: async (id: string): Promise<Settlement> => {
    console.log("API - Fetching settlement:", id);
    const response = await api.get<{ data: { data: Settlement } }>(
      `/settlements/${id}`,
    );
    console.log("API - Full response:", response);
    console.log("API - Response data:", response.data);
    return response.data.data.data;
  },

  update: async (
    id: string,
    data: Partial<Settlement>,
  ): Promise<Settlement> => {
    const response = await api.patch<{ data: { data: Settlement } }>(
      `/settlements/${id}`,
      data,
    );
    return response.data.data.data;
  },
};

// Blog Post endpoints
export const blogPostAPI = {
  getAll: async (): Promise<BlogPost[]> => {
    const response = await api.get<{ data: { data: BlogPost[] } }>(
      "/blog-posts",
    );
    return response.data.data.data;
  },

  getBySettlement: async (settlementId: string): Promise<BlogPost[]> => {
    const response = await api.get<{ data: { data: BlogPost[] } }>(
      `/blog-posts?settlement=${settlementId}`,
    );
    return response.data.data.data;
  },

  getById: async (id: string): Promise<BlogPost> => {
    const response = await api.get<{ data: { data: BlogPost } }>(
      `/blog-posts/${id}`,
    );
    return response.data.data.data;
  },

  create: async (data: Partial<BlogPost>): Promise<BlogPost> => {
    const response = await api.post<{ data: { data: BlogPost } }>(
      "/blog-posts",
      data,
    );
    return response.data.data.data;
  },

  update: async (id: string, data: Partial<BlogPost>): Promise<BlogPost> => {
    const response = await api.patch<{ data: { data: BlogPost } }>(
      `/blog-posts/${id}`,
      data,
    );
    return response.data.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/blog-posts/${id}`);
  },
};

// Member endpoints
export const memberAPI = {
  getAll: async (): Promise<Member[]> => {
    const response = await api.get<{ data: { data: Member[] } }>("/members");
    return response.data.data.data;
  },

  getBySettlement: async (settlementId: string): Promise<Member[]> => {
    const response = await api.get<{ data: { data: Member[] } }>(
      `/members?settlement=${settlementId}`,
    );
    return response.data.data.data;
  },

  getById: async (id: string): Promise<Member> => {
    const response = await api.get<{ data: { data: Member } }>(
      `/members/${id}`,
    );
    return response.data.data.data;
  },

  create: async (data: Partial<Member>): Promise<Member> => {
    const response = await api.post<{ data: { data: Member } }>(
      "/members",
      data,
    );
    return response.data.data.data;
  },

  update: async (
    id: string,
    data: Partial<Member> & { photo?: File | null },
  ): Promise<Member> => {
    if (data.photo) {
      const formData = new FormData();

      for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null) continue;
        if (key === "photo") continue;

        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else {
          formData.append(key, String(value));
        }
      }

      formData.append("photo", data.photo);

      const response = await api.patch<{ data: { data: Member } }>(
        `/members/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data.data.data;
    }

    const { photo, ...jsonData } = data;
    const response = await api.patch<{ data: { data: Member } }>(
      `/members/${id}`,
      jsonData,
    );
    return response.data.data.data;
  },

  getPhotoUrl: (id: string): string => {
    // Endpoint redirects to a short-lived signed URL in R2
    return `${API_BASE_URL}/members/${id}/photo`;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/members/${id}`);
  },
};

// Coordinates endpoints
export const coordinatesAPI = {
  getAll: async (): Promise<Coordinate[]> => {
    const response = await api.get<{ data: { data: Coordinate[] } }>(
      "/coordinates",
    );
    return response.data.data.data;
  },

  getBySettlement: async (settlementId: string): Promise<Coordinate[]> => {
    const response = await api.get<{ data: { data: Coordinate[] } }>(
      `/coordinates?settlement=${settlementId}`,
    );
    return response.data.data.data;
  },

  getById: async (id: string): Promise<Coordinate> => {
    const response = await api.get<{ data: { data: Coordinate } }>(
      `/coordinates/${id}`,
    );
    return response.data.data.data;
  },

  create: async (data: Partial<Coordinate>): Promise<Coordinate> => {
    const response = await api.post<{ data: { data: Coordinate } }>(
      "/coordinates",
      data,
    );
    return response.data.data.data;
  },

  update: async (
    id: string,
    data: Partial<Coordinate>,
  ): Promise<Coordinate> => {
    const response = await api.patch<{ data: { data: Coordinate } }>(
      `/coordinates/${id}`,
      data,
    );
    return response.data.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/coordinates/${id}`);
  },
};

// N8N endpoints
export const n8nAPI = {
  createSite: async (
    settlementId: string,
    files: {
      html: string;
      css: string;
      js: string;
      blogHtml?: string;
      postHtml?: string;
      membersHtml?: string;
    },
  ): Promise<{ status: string; message: string; data: any }> => {
    const response = await api.post("/n8n/create-site", {
      settlementId,
      files,
    });
    return response.data;
  },

  updateSite: async (
    settlementId: string,
    files: {
      html: string;
      css: string;
      js: string;
      blogHtml?: string;
      postHtml?: string;
      membersHtml?: string;
    },
  ): Promise<{ status: string; message: string; data: any }> => {
    const response = await api.post("/n8n/update-site", {
      settlementId,
      files,
    });
    return response.data;
  },
};

// Admin endpoints
export const adminAPI = {
  // User management
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<{ data: { data: User[] } }>("/users");
    return response.data.data.data;
  },

  createUser: async (userData: {
    email: string;
    password: string;
    role?: string;
  }): Promise<User> => {
    const response = await api.post<{ data: { data: User } }>("/users", {
      ...userData,
      role: "user", // Force role to be 'user' only
    });
    return response.data.data.data;
  },

  updateUser: async (
    userId: string,
    userData: { settlements?: string[] },
  ): Promise<User> => {
    const response = await api.patch<{ data: { data: User } }>(
      `/users/${userId}`,
      userData,
    );
    return response.data.data.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },

  // Settlement management
  createSettlement: async (settlementData: {
    name: string;
    judet: string;
    lat: number;
    lng: number;
  }): Promise<Settlement> => {
    const response = await api.post<{ data: { data: Settlement } }>(
      "/settlements",
      settlementData,
    );
    return response.data.data.data;
  },

  updateSettlement: async (
    settlementId: string,
    settlementData: Partial<Settlement>,
  ): Promise<Settlement> => {
    const response = await api.patch<{ data: { data: Settlement } }>(
      `/settlements/${settlementId}`,
      settlementData,
    );
    return response.data.data.data;
  },

  deleteSettlement: async (settlementId: string): Promise<void> => {
    await api.delete(`/settlements/${settlementId}`);
  },
};

export default api;
