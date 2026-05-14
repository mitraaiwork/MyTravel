import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import type {
  User,
  Trip,
  Itinerary,
  Activity,
  AuthResponse,
  CreateTripData,
  UserProfile,
  PackingList,
  TripFeedback,
  LocalServicesResponse,
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

  getPackingList: async (publicId: string): Promise<PackingList> => {
    const { data } = await api.get<PackingList>(`/itinerary/${publicId}/packing-list`);
    return data;
  },

  getLocalServices: async (publicId: string): Promise<LocalServicesResponse> => {
    const { data } = await api.get<LocalServicesResponse>(`/itinerary/${publicId}/local-services`);
    return data;
  },
};

// ─── Profile API ──────────────────────────────────────────────────────────────

export const profileApi = {
  get: async (): Promise<UserProfile> => {
    const { data } = await api.get<UserProfile>("/users/profile");
    return data;
  },

  update: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    const { data } = await api.put<UserProfile>("/users/profile", profile);
    return data;
  },
};

// ─── Suggest API ─────────────────────────────────────────────────────────────

export interface SuggestionResult {
  destination: string;
  distance: string;
  tagline: string;
  highlights: string[];
  emoji: string;
}

export const suggestApi = {
  destinations: async (params: {
    from_location: string;
    radius_miles: number | null;
    terrain: string[];
    activities: string[];
  }): Promise<SuggestionResult[]> => {
    const { data } = await api.post<SuggestionResult[]>("/suggest/destinations", params);
    return data;
  },
};

// ─── Feedback API ─────────────────────────────────────────────────────────────

export const feedbackApi = {
  get: async (publicId: string): Promise<TripFeedback> => {
    const { data } = await api.get<TripFeedback>(`/trips/${publicId}/feedback`);
    return data;
  },

  save: async (publicId: string, feedback: Partial<TripFeedback>): Promise<TripFeedback> => {
    const { data } = await api.put<TripFeedback>(`/trips/${publicId}/feedback`, feedback);
    return data;
  },
};

export default api;
