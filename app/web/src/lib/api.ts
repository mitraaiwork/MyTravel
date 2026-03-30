import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import type {
  User,
  Trip,
  Itinerary,
  Activity,
  AuthResponse,
  CreateTripData,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Bearer token from localStorage
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers ?? {};
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: on 401, clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ───────────────────────────────────────────────────────────────

export const authApi = {
  register: async (
    email: string,
    password: string,
    full_name: string
  ): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/register", {
      email,
      password,
      full_name,
    });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    // FastAPI OAuth2 expects form data for /auth/token
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    const { data } = await api.post<AuthResponse>("/auth/token", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/auth/forgot-password", { email });
  },
};

// ─── Trips API ───────────────────────────────────────────────────────────────

export const tripsApi = {
  list: async (): Promise<Trip[]> => {
    const { data } = await api.get<Trip[]>("/trips");
    return data;
  },

  create: async (tripData: CreateTripData): Promise<Trip> => {
    const { data } = await api.post<Trip>("/trips", tripData);
    return data;
  },

  get: async (publicId: string): Promise<Trip> => {
    const { data } = await api.get<Trip>(`/trips/${publicId}`);
    return data;
  },

  delete: async (publicId: string): Promise<void> => {
    await api.delete(`/trips/${publicId}`);
  },

  enableShare: async (publicId: string): Promise<Trip> => {
    const { data } = await api.post<Trip>(`/trips/${publicId}/share`);
    return data;
  },

  disableShare: async (publicId: string): Promise<Trip> => {
    const { data } = await api.post<Trip>(`/trips/${publicId}/unshare`);
    return data;
  },
};

// ─── Itinerary API ────────────────────────────────────────────────────────────

export const itineraryApi = {
  get: async (publicId: string): Promise<Itinerary> => {
    const { data } = await api.get<Itinerary>(`/itinerary/${publicId}`);
    return data;
  },

  deleteActivity: async (
    publicId: string,
    day: number,
    index: number
  ): Promise<Itinerary> => {
    const { data } = await api.delete<Itinerary>(
      `/itinerary/${publicId}/days/${day}/activities/${index}`
    );
    return data;
  },

  addActivity: async (
    publicId: string,
    day: number,
    activity: Partial<Activity>,
    position?: number
  ): Promise<Itinerary> => {
    const { data } = await api.post<Itinerary>(
      `/itinerary/${publicId}/days/${day}/activities`,
      { activity, position }
    );
    return data;
  },

  reorderActivities: async (
    publicId: string,
    day: number,
    newOrder: number[]
  ): Promise<Itinerary> => {
    const { data } = await api.put<Itinerary>(
      `/itinerary/${publicId}/days/${day}/activities/reorder`,
      { new_order: newOrder }
    );
    return data;
  },
};

export default api;
