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
  origin?: string | null;
  trip_type?: string;
  arrive_destination_date?: string | null;
  arrive_destination_time?: string | null;
  leave_destination_date?: string | null;
  leave_destination_time?: string | null;
  include_return_stops?: boolean;
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
  distance_miles?: number;
}

export interface Restaurant {
  name: string;
  meal?: string;
  cuisine?: string;
  famous_for: string;
  rating?: number;
  price_range?: string;
  location?: string;
  insider_tip?: string;
  website?: string;
  image_url?: string;
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
  city?: string;
  city_transition?: {
    from_city: string;
    to_city: string;
    drive_hours: number;
  };
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
  sunrise?: string;
  sunset?: string;
  travel_tip?: string;
  day_type?: "destination" | "travel_outbound" | "travel_return" | "partial_arrival" | "partial_departure";
  arrival_time?: string;
  departure_time?: string;
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

export interface TripWeather {
  is_forecast: boolean;
  avg_high_c: number;
  avg_low_c: number;
  dominant_condition: string;
  rain_days: number;
  total_days: number;
}

export interface RouteStop {
  name: string;
  category: string;
  location: string;
  why_stop: string;
  duration?: string;
  lat?: number;
  lng?: number;
}

export interface RouteJourney {
  outbound: RouteStop[];
  return?: RouteStop[];
  note?: string;
}

export interface RouteOverviewCity {
  city: string;
  nights: number;
}

export interface Itinerary {
  trip_id: number;
  destination: string;
  country: string;
  summary: string;
  days: Day[];
  weather?: TripWeather;
  practical_info?: {
    currency?: string;
    language?: string;
    timezone?: string;
    transport_tips?: string[];
    packing_suggestions?: string[];
  };
  accommodations?: AccommodationZone[];
  route_stops?: RouteJourney;
  route_overview?: RouteOverviewCity[];
  generated_at: string;
}

export type TripPhase = "planning" | "pre-trip" | "in-trip" | "post-trip";

export interface UserProfile {
  home_city?: string | null;
  passport_nationality?: string | null;
  food_preference?: string | null;
  seat_preference?: string | null;
  preferred_pace?: string | null;
  preferred_styles?: string | null;
}

export interface PackingItem {
  label: string;
  essential: boolean;
  note?: string;
}

export interface PackingCategory {
  name: string;
  icon: string;
  items: PackingItem[];
}

export interface PackingList {
  weather_note?: string;
  categories: PackingCategory[];
}

export interface LocalServiceItem {
  name: string;
  address?: string;
  hours?: string;
  phone?: string;
  website?: string;
  note?: string;
}

export interface LocalServiceCategory {
  id: string;
  label: string;
  emoji: string;
  items: LocalServiceItem[];
  not_found_note?: string;
}

export interface LocalServicesResponse {
  categories?: LocalServiceCategory[];
  not_applicable?: boolean;
  message?: string;
  reference_city?: string;
  multi_city?: boolean;
  cities?: { city_name: string; categories: LocalServiceCategory[] }[];
}

export interface TripFeedback {
  id?: number;
  trip_id?: number;
  overall_rating?: number;
  itinerary_rating?: number;
  restaurant_rating?: number;
  flow_rating?: number;
  pace_rating?: number;
  keep_list?: string[];
  skip_list?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
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
  origin?: string;
  start_date: string;
  end_date: string;
  travel_style: string;       // comma-separated
  interests?: string;         // comma-separated
  accommodation_type?: string; // comma-separated
  include_route_stops?: boolean;
  trip_type?: string;
  arrive_destination_date?: string;
  arrive_destination_time?: string;
  leave_destination_date?: string;
  leave_destination_time?: string;
  include_return_stops?: boolean;
  group_size?: number;
  group_type?: string;
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
