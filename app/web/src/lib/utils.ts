import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d");
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const s = typeof start === "string" ? parseISO(start) : start;
  const e = typeof end === "string" ? parseISO(end) : end;

  const startMonth = format(s, "MMM");
  const endMonth = format(e, "MMM");
  const endYear = format(e, "yyyy");

  if (startMonth === endMonth) {
    return `${format(s, "MMM d")} – ${format(e, "d, yyyy")}`;
  }
  return `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
}

export function getDayCount(start: string | Date, end: string | Date): number {
  const s = typeof start === "string" ? parseISO(start) : start;
  const e = typeof end === "string" ? parseISO(end) : end;
  return differenceInDays(e, s) + 1;
}

export function getCategoryColor(category: string): string {
  const cat = category?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    food: "bg-amber-100 text-amber-800",
    restaurant: "bg-amber-100 text-amber-800",
    dining: "bg-amber-100 text-amber-800",
    cafe: "bg-amber-100 text-amber-800",
    nature: "bg-green-100 text-green-800",
    park: "bg-green-100 text-green-800",
    garden: "bg-green-100 text-green-800",
    hiking: "bg-green-100 text-green-800",
    culture: "bg-sky-100 text-sky-800",
    museum: "bg-sky-100 text-sky-800",
    art: "bg-sky-100 text-sky-800",
    history: "bg-sky-100 text-sky-800",
    temple: "bg-sky-100 text-sky-800",
    adventure: "bg-orange-100 text-orange-800",
    sport: "bg-orange-100 text-orange-800",
    activity: "bg-orange-100 text-orange-800",
    shopping: "bg-purple-100 text-purple-800",
    market: "bg-purple-100 text-purple-800",
    nightlife: "bg-indigo-100 text-indigo-800",
    bar: "bg-indigo-100 text-indigo-800",
    transport: "bg-gray-100 text-gray-700",
    accommodation: "bg-rose-100 text-rose-800",
    hotel: "bg-rose-100 text-rose-800",
    wellness: "bg-teal-100 text-teal-800",
    spa: "bg-teal-100 text-teal-800",
  };

  for (const key of Object.keys(map)) {
    if (cat.includes(key)) return map[key];
  }
  return "bg-gray-100 text-gray-700";
}

export function getCategoryIcon(category: string): string {
  const cat = category?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    food: "🍜",
    restaurant: "🍽️",
    dining: "🍽️",
    cafe: "☕",
    nature: "🌿",
    park: "🌳",
    garden: "🌸",
    hiking: "🥾",
    culture: "🏛️",
    museum: "🖼️",
    art: "🎨",
    history: "📜",
    temple: "⛩️",
    adventure: "🧗",
    sport: "⚡",
    activity: "🎯",
    shopping: "🛍️",
    market: "🏪",
    nightlife: "🌙",
    bar: "🍸",
    transport: "🚇",
    accommodation: "🏨",
    hotel: "🏨",
    wellness: "🧘",
    spa: "💆",
    beach: "🏖️",
    viewpoint: "🔭",
    landmark: "🗼",
  };

  for (const key of Object.keys(map)) {
    if (cat.includes(key)) return map[key];
  }
  return "📍";
}

export function getTravelStyleColor(style: string): string {
  const map: Record<string, string> = {
    adventure: "bg-orange-100 text-orange-700",
    cultural: "bg-sky-100 text-sky-700",
    relaxation: "bg-teal-100 text-teal-700",
    foodie: "bg-amber-100 text-amber-700",
    nature: "bg-green-100 text-green-700",
    luxury: "bg-purple-100 text-purple-700",
    budget: "bg-gray-100 text-gray-700",
    family: "bg-rose-100 text-rose-700",
  };
  return map[style] ?? "bg-gray-100 text-gray-700";
}

export function getCountryFlag(countryCode?: string): string {
  if (!countryCode) return "🌍";
  const code = countryCode.toUpperCase();
  // Convert country code to flag emoji using regional indicator symbols
  const chars = [...code].map((char) =>
    String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65)
  );
  return chars.join("");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}
