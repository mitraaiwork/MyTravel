export interface User {
  id: number;
  email: string;
  full_name: string;
  gen_count: number;
  gen_limit: number;
  is_premium: boolean;
  created_at: string;
}

export type TravelStyle =
  | "adventure"
  | "cultural"
  | "relaxation"
  | "foodie"
  | "nature"
  | "luxury"
  | "budget"
  | "family";

export type TripStatus = "planning" | "active" | "completed";

export interface Trip {
  id: number;
  public_id: string;
  user_id: number;
  title: string | null;
  destination: string;
  destination_lat: number | null;
  destination_lng: number | null;
  start_date: string;
  end_date: string;
  travel_style: string;   // comma-separated, e.g. "adventure,cultural"
  mobility_level: string;
  budget_amount: number | null;
  budget_currency: string;
  group_size: number;
  group_type: string;
  pace: string;
  interests: string | null;  // comma-separated
  accommodation_type: string | null;  // comma-separated, e.g. "cabin,glamping"
  share_token: string | null;
  share_enabled: boolean;
  itinerary_generated: boolean;
  country_code?: string;
  created_at: string;
}

export interface Activity {
  id?: string;
  name: string;
  category: string;
  time?: string;
  duration?: string;
  location?: string;
  lat?: number;
  lng?: number;
  why_chosen?: string;
  highlights?: string[];
  price_range?: string;
  booking_tip?: string;
  weather_note?: string;
  address?: string;
  website?: string;
  image_url?: string;
}

export interface Restaurant {
  name: string;
  meal?: string;
  cuisine?: string;
  famous_for: string;
  price_range?: string;
  location?: string;
  insider_tip?: string;
}

export interface OffbeatSpot {
  name: string;
  why_special: string;
  location?: string;
  best_time?: string;
}

export interface Day {
  day: number;
  date: string;
  theme: string;
  area?: string;
  image_url?: string;
  activities: Activity[];
  restaurants?: Restaurant[];
  offbeat_spots?: OffbeatSpot[];
  weather?: {
    condition: string;
    high_c: number;
    low_c: number;
    icon?: string;
  };
  travel_tip?: string;
}

export interface AccommodationOption {
  name: string;
  type: string;
  description: string;
  price_range?: string;
  location?: string;
  booking_tip?: string;
  search_query?: string;
}

export interface AccommodationZone {
  zone: string;
  nights: string;
  location: string;
  options: AccommodationOption[];
}

export interface Itinerary {
  trip_id: number;
  destination: string;
  country: string;
  summary: string;
  days: Day[];
  practical_info?: {
    currency?: string;
    language?: string;
    timezone?: string;
    transport_tips?: string[];
    packing_suggestions?: string[];
  };
  accommodations?: AccommodationZone[];
  generated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface CreateTripData {
  destination: string;
  start_date: string;
  end_date: string;
  travel_style: string;       // comma-separated
  interests?: string;         // comma-separated
  accommodation_type?: string; // comma-separated
}

export interface UpdateActivityData {
  name?: string;
  category?: string;
  time?: string;
  duration?: string;
  location?: string;
  why_chosen?: string;
  price_range?: string;
  booking_tip?: string;
}

export interface StreamEvent {
  type: "started" | "complete" | "error" | "cap_reached" | "text";
  content?: string;
  message?: string;
  trip_id?: number;
}
