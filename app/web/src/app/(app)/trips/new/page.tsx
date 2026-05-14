"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { tripsApi, suggestApi, profileApi, type SuggestionResult } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { getDayCount } from "@/lib/utils";
import type { TravelStyle } from "@/types";

const TRAVEL_STYLES: { value: TravelStyle; label: string; emoji: string }[] = [
  { value: "nature",      label: "Nature",            emoji: "🌿" },
  { value: "foodie",      label: "Food & Dining",     emoji: "🍜" },
  { value: "cultural",    label: "Culture & History", emoji: "🏛️" },
  { value: "adventure",   label: "Adventure",         emoji: "🧗" },
  { value: "relaxation",  label: "Relaxation",        emoji: "😌" },
  { value: "luxury",      label: "Luxury",            emoji: "✨" },
  { value: "budget",      label: "Budget",            emoji: "💰" },
  { value: "family",      label: "Family",            emoji: "👨‍👩‍👧" },
];

const ACCOMMODATION_TYPES = [
  { value: "hotel",           label: "Hotel",            emoji: "🏨" },
  { value: "cabin",           label: "Cabin / Cottage",  emoji: "🏕" },
  { value: "hostel",          label: "Hostel",           emoji: "🛖" },
  { value: "glamping",        label: "Glamping",         emoji: "⛺" },
  { value: "resort",          label: "Luxury Resort",    emoji: "✨" },
  { value: "vacation_rental", label: "Vacation Rental",  emoji: "🏡" },
  { value: "camping",         label: "Camping",          emoji: "🔥" },
  { value: "any",             label: "Surprise me",      emoji: "🎲" },
];

const INTERESTS = [
  "beaches", "mountains", "temples", "museums", "street food",
  "fine dining", "nightlife", "markets", "hiking", "cycling",
  "photography", "architecture", "wildlife", "wellness",
];


const TERRAIN_OPTIONS = [
  { value: "mountains", label: "Mountains / Hills", emoji: "🏔" },
  { value: "beach",     label: "Beach / Coast",     emoji: "🏖" },
  { value: "forest",    label: "Forest / National Park", emoji: "🌲" },
  { value: "city",      label: "City Break",        emoji: "🏙" },
  { value: "desert",    label: "Desert",            emoji: "🏜" },
  { value: "countryside", label: "Countryside",     emoji: "🌾" },
];

const ACTIVITY_OPTIONS = [
  { value: "skiing",    label: "Skiing",            emoji: "⛷" },
  { value: "hiking",    label: "Hiking",            emoji: "🥾" },
  { value: "surfing",   label: "Surfing",           emoji: "🏄" },
  { value: "food",      label: "Wine & Food",       emoji: "🍷" },
  { value: "culture",   label: "Arts & Culture",    emoji: "🎭" },
  { value: "wellness",  label: "Wellness / Spa",    emoji: "🧘" },
  { value: "cycling",   label: "Cycling",           emoji: "🚴" },
  { value: "wildlife",  label: "Wildlife",          emoji: "🐾" },
];

const GROUP_TYPES = [
  { value: "solo",    label: "Solo",    emoji: "🧍" },
  { value: "couple",  label: "Couple",  emoji: "👫" },
  { value: "family",  label: "Family",  emoji: "👨‍👩‍👧" },
  { value: "friends", label: "Friends", emoji: "👥" },
];

const RADIUS_OPTIONS = [
  { value: "50",   label: "Within 50 miles" },
  { value: "100",  label: "Within 100 miles" },
  { value: "200",  label: "Within 200 miles" },
  { value: "300",  label: "Within 300 miles" },
  { value: "500",  label: "Within 500 miles" },
  { value: "any",  label: "Any distance" },
];


export default function NewTripPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [tripType, setTripType] = useState<"destination" | "roadtrip">("destination");
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [arriveDestDate, setArriveDestDate] = useState("");
  const [arriveDestTime, setArriveDestTime] = useState("");
  const [leaveDestDate, setLeaveDestDate] = useState("");
  const [leaveDestTime, setLeaveDestTime] = useState("");
  const [groupSize, setGroupSize] = useState(1);
  const [groupType, setGroupType] = useState("solo");
  const [travelStyles, setTravelStyles] = useState<TravelStyle[]>([]);
  const [accommodationTypes, setAccommodationTypes] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [includeRouteStops, setIncludeRouteStops] = useState(false);
  const [includeReturnStops, setIncludeReturnStops] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Destination suggestor state
  const [showSuggestor, setShowSuggestor] = useState(false);
  const [suggestFrom, setSuggestFrom] = useState("");
  const [suggestRadius, setSuggestRadius] = useState("200");
  const [suggestTerrain, setSuggestTerrain] = useState<string[]>([]);
  const [suggestActivities, setSuggestActivities] = useState<string[]>([]);
  const [suggestResults, setSuggestResults] = useState<SuggestionResult[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Pre-fill origin from user profile home city
  useEffect(() => {
    profileApi.get().then((p) => {
      if (p.home_city) {
        setOrigin(p.home_city);
        setSuggestFrom(p.home_city);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayCount = startDate && endDate ? getDayCount(startDate, endDate) : null;
  const atCap = user != null && !user.is_premium && user.gen_count >= user.gen_limit;

  function toggleStyle(style: TravelStyle) {
    setTravelStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  }

  function toggleAccommodation(v: string) {
    if (v === "any") {
      setAccommodationTypes((prev) => prev.includes("any") ? [] : ["any"]);
      return;
    }
    setAccommodationTypes((prev) => {
      const without = prev.filter((x) => x !== "any");
      return without.includes(v) ? without.filter((x) => x !== v) : [...without, v];
    });
  }

  function toggleInterest(i: string) {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  }

  function toggleSuggestTerrain(v: string) {
    setSuggestTerrain((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
    setSuggestResults([]);
  }

  function toggleSuggestActivity(v: string) {
    setSuggestActivities((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
    setSuggestResults([]);
  }

  async function handleSuggest() {
    setIsSuggesting(true);
    setSuggestResults([]);
    try {
      const results = await suggestApi.destinations({
        from_location: suggestFrom,
        radius_miles: suggestRadius !== "any" ? parseInt(suggestRadius) : null,
        terrain: suggestTerrain,
        activities: suggestActivities,
      });
      setSuggestResults(results.slice(0, 5));
    } catch {
      // silently fall back to empty — user can retry
    } finally {
      setIsSuggesting(false);
    }
  }

  function pickSuggestion(dest: string) {
    setDestination(dest);
    setShowSuggestor(false);
    setSuggestResults([]);
  }

  function validateStep(n: number): string | null {
    if (n === 1) {
      if (!destination.trim()) return "Please enter a destination.";
      if (!startDate || !endDate) return "Please select both start and end dates.";
      if (endDate < startDate) return "End date must be on or after the start date.";
      if (tripType === "roadtrip") {
        if (!origin.trim()) return "Road trips require a starting city (Departing from).";
        if (arriveDestDate && arriveDestDate < startDate) return "Arrival at destination cannot be before your trip start date.";
        if (arriveDestDate && arriveDestDate > endDate) return "Arrival at destination cannot be after your trip end date.";
        if (leaveDestDate && arriveDestDate && leaveDestDate < arriveDestDate) return "Departure from destination cannot be before arrival.";
        if (leaveDestDate && leaveDestDate > endDate) return "Departure from destination cannot be after your trip end date.";
      }
    }
    if (n === 2 && travelStyles.length === 0) {
      return "Please select at least one travel style.";
    }
    return null;
  }

  const accomLabel = accommodationTypes.length === 0 || accommodationTypes.includes("any")
    ? "Any (AI decides)"
    : accommodationTypes.map((v) => ACCOMMODATION_TYPES.find((a) => a.value === v)?.label ?? v).join(", ");

  function goNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  }

  function goBack() {
    setError(null);
    setStep((s) => s - 1);
    window.scrollTo(0, 0);
  }

  async function handleGenerate() {
    setError(null);
    setIsSubmitting(true);
    try {
      const trip = await tripsApi.create({
        destination: destination.trim(),
        origin: tripType === "roadtrip" ? origin.trim() || undefined : undefined,
        start_date: startDate,
        end_date: endDate,
        travel_style: travelStyles.join(","),
        interests: (() => {
          const parts = [...interests];
          if (notes.trim()) parts.push(notes.trim());
          return parts.length > 0 ? parts.join(", ") : undefined;
        })(),
        accommodation_type: accommodationTypes.length > 0 ? accommodationTypes.join(",") : undefined,
        trip_type: tripType,
        include_route_stops: tripType === "roadtrip" ? (includeRouteStops && !!origin.trim()) : false,
        include_return_stops: tripType === "roadtrip" ? includeReturnStops : false,
        arrive_destination_date: tripType === "roadtrip" && arriveDestDate ? arriveDestDate : undefined,
        arrive_destination_time: tripType === "roadtrip" && arriveDestTime ? arriveDestTime : undefined,
        leave_destination_date: tripType === "roadtrip" && leaveDestDate ? leaveDestDate : undefined,
        leave_destination_time: tripType === "roadtrip" && leaveDestTime ? leaveDestTime : undefined,
        group_size: groupSize,
        group_type: groupType,
      });
      router.push(`/trips/${trip.public_id}`);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ? String(detail) : "Failed to create trip. Please try again.");
      setIsSubmitting(false);
    }
  }

  const STEPS = [
    { n: 1, label: "Where & When" },
    { n: 2, label: "Travel Style" },
    { n: 3, label: "Stay Type" },
    { n: 4, label: "Interests" },
    { n: 5, label: "Review & Go" },
  ];

  return (
    <div className="page-enter" style={{ maxWidth: 680, margin: "0 auto", paddingBottom: 60 }}>
      {/* Breadcrumb */}
      <div className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
        <span
          className="cursor-pointer hover:underline"
          style={{ color: "var(--forest)" }}
          onClick={() => router.push("/dashboard")}
        >
          My Trips
        </span>
        {" / "}Plan New Trip
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-10">
        {STEPS.map(({ n, label }, i) => {
          const done = n < step;
          const active = n === step;
          return (
            <div key={n} className="flex-1 flex flex-col items-center gap-1.5 relative">
              {i < STEPS.length - 1 && (
                <div
                  className="absolute top-4 left-1/2 w-full h-0.5"
                  style={{ background: done ? "var(--forest)" : "var(--border-mid)", zIndex: 0 }}
                />
              )}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all"
                style={{
                  border: `2px solid ${active || done ? "var(--forest)" : "var(--border-mid)"}`,
                  background: active || done ? "var(--forest)" : "white",
                  color: active || done ? "white" : "var(--text-muted)",
                }}
              >
                {done ? "✓" : n}
              </div>
              <div
                className="text-xs font-medium text-center whitespace-nowrap"
                style={{ color: active ? "var(--forest)" : done ? "var(--forest-light)" : "var(--text-muted)" }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Generation cap warning */}
      {atCap && (
        <div
          className="rounded-xl p-4 mb-6 flex items-start gap-3"
          style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.3)" }}
        >
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#92400e" }}>Generation limit reached</p>
            <p className="text-xs mt-0.5" style={{ color: "#9a6700" }}>
              You&apos;ve used all {user?.gen_limit} free generations. Upgrade to Premium for unlimited itineraries.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl p-3.5 mb-5 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
          {error}
        </div>
      )}

      {/* ── Step 1: Where & When ──────────────────────────────────── */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-extrabold mb-1.5" style={{ color: "var(--text-dark)" }}>
            Where do you want to go?
          </h2>
          <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
            Tell us your destination and when you&apos;re travelling.
          </p>

          {/* Trip type selector */}
          <div className="mb-6">
            <label className="label mb-3">How are you planning this trip?</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: "destination" as const,
                  title: "Destination Stay",
                  icon: "🏨",
                  desc: "Just the days you spend at your destination — perfect if you're flying or don't need a driving plan.",
                  note: "No travel days · No driving stops",
                },
                {
                  value: "roadtrip" as const,
                  title: "Road Trip",
                  icon: "🚗",
                  desc: "Covers your full journey including driving days, with stops along the route each way.",
                  note: "Origin required · Includes en-route stops",
                },
              ].map((opt) => {
                const active = tripType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTripType(opt.value)}
                    className="rounded-xl p-4 text-left transition-all"
                    style={{
                      border: `2px solid ${active ? "var(--forest)" : "var(--border-mid)"}`,
                      background: active ? "rgba(45,106,79,0.07)" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <div className="text-2xl mb-2">{opt.icon}</div>
                    <div className="text-sm font-bold mb-1" style={{ color: active ? "var(--forest)" : "var(--text-dark)" }}>
                      {opt.title}
                    </div>
                    <div className="text-xs mb-2 leading-relaxed" style={{ color: "var(--text-mid)" }}>
                      {opt.desc}
                    </div>
                    <div
                      className="text-xs font-medium px-2 py-0.5 rounded-full inline-block"
                      style={{ background: active ? "var(--forest)" : "var(--bg-cream)", color: active ? "white" : "var(--text-muted)", border: "1px solid var(--border-light)" }}
                    >
                      {opt.note}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5">
            <label className="label">Destination</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">📍</span>
              <input
                className="input"
                style={{ paddingLeft: "2rem" }}
                placeholder="City, country or region"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            {/* Not sure where to go — right-aligned toggle */}
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => { setShowSuggestor((v) => !v); setSuggestResults([]); }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                style={showSuggestor
                  ? { background: "var(--bg-mint)", color: "var(--forest)", border: "1.5px solid var(--border-strong)", cursor: "pointer" }
                  : { background: "linear-gradient(135deg, var(--bg-mint), #e0f2e9)", color: "var(--forest)", border: "1.5px solid var(--border-mid)", cursor: "pointer", boxShadow: "0 1px 4px rgba(45,106,79,0.12)" }
                }
              >
                <span>{showSuggestor ? "✕" : "✦"}</span>
                {showSuggestor ? "Close suggester" : "Not sure where to go? Get suggestions"}
              </button>
            </div>
          </div>

          {/* Departing from — road trips only */}
          {tripType === "roadtrip" && (
            <div className="mb-5">
              <label className="label">
                Departing from <span className="font-normal text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">🛫</span>
                <input
                  className="input"
                  style={{ paddingLeft: "2rem" }}
                  placeholder="Your starting city (e.g. Edison, NJ)"
                  value={origin}
                  onChange={(e) => {
                    setOrigin(e.target.value);
                    setSuggestFrom(e.target.value);
                  }}
                />
              </div>
              <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>
                Used for en-route stop suggestions and destination suggestions
              </p>
            </div>
          )}

          {/* Destination stay window — road trips only */}
          {tripType === "roadtrip" && (
            <div className="mb-5 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-mid)", background: "var(--bg-cream)" }}>
              <div
                className="px-4 py-3 text-xs font-bold flex items-center gap-2"
                style={{ background: "rgba(45,106,79,0.06)", borderBottom: "1px solid var(--border-light)", color: "var(--forest)" }}
              >
                🏁 Your stay at {destination.split(",")[0] || "your destination"}
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="label mb-0">Arrive at destination</label>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-mint)", color: "var(--forest)", border: "1px solid var(--border-light)" }}>optional</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input text-sm"
                      type="date"
                      value={arriveDestDate}
                      onChange={(e) => setArriveDestDate(e.target.value)}
                      min={startDate || undefined}
                      max={endDate || undefined}
                    />
                    <input
                      className="input text-sm"
                      type="time"
                      value={arriveDestTime}
                      onChange={(e) => setArriveDestTime(e.target.value)}
                      disabled={!arriveDestDate}
                    />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>
                    If you arrive mid-day, add the time — the AI will plan activities from your arrival time onwards.
                    Days before this date become driving days with en-route stop suggestions.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="label mb-0">Leave destination</label>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-mint)", color: "var(--forest)", border: "1px solid var(--border-light)" }}>optional</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input text-sm"
                      type="date"
                      value={leaveDestDate}
                      onChange={(e) => setLeaveDestDate(e.target.value)}
                      min={arriveDestDate || startDate || undefined}
                      max={endDate || undefined}
                    />
                    <input
                      className="input text-sm"
                      type="time"
                      value={leaveDestTime}
                      onChange={(e) => setLeaveDestTime(e.target.value)}
                      disabled={!leaveDestDate}
                    />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>
                    If you leave mid-day, add the time — the AI will plan morning-only activities up until you depart.
                    Days after this date become return driving days.
                  </p>
                </div>

                {/* En-route stop checkboxes */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-mid)" }}>
                    En-route stops (driving only — skip if flying)
                  </div>
                  {[
                    {
                      checked: includeRouteStops,
                      onChange: setIncludeRouteStops,
                      label: "Suggest stops on the way there",
                      desc: `Interesting places to stop driving from ${origin.split(",")[0] || "your origin"} to ${destination.split(",")[0] || "your destination"}`,
                    },
                    {
                      checked: includeReturnStops,
                      onChange: setIncludeReturnStops,
                      label: "Suggest stops on the way back",
                      desc: `Places to stop on the return drive to ${origin.split(",")[0] || "your origin"}`,
                    },
                  ].map((cb) => (
                    <label
                      key={cb.label}
                      className="flex items-start gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 transition-all"
                      style={{
                        background: cb.checked ? "rgba(45,106,79,0.07)" : "white",
                        border: `1.5px solid ${cb.checked ? "var(--border-strong)" : "var(--border-light)"}`,
                      }}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 flex-shrink-0 accent-[var(--forest)]"
                        checked={cb.checked}
                        onChange={(e) => cb.onChange(e.target.checked)}
                      />
                      <div>
                        <div className="text-xs font-semibold" style={{ color: "var(--text-dark)" }}>
                          {cb.label}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {cb.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Destination Suggestor Panel ── */}
          {showSuggestor && (
            <div
              className="rounded-2xl overflow-hidden mb-6"
              style={{
                border: "1px solid var(--border-mid)",
                boxShadow: "var(--shadow-md)",
                background: "white",
              }}
            >
              {/* Panel header */}
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{ background: "var(--grad-nature)", borderBottom: "1px solid rgba(255,255,255,0.12)" }}
              >
                <span className="text-xl">✦</span>
                <div>
                  <div className="font-bold text-sm text-white">Destination Finder</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                    Tell us what you&apos;re looking for and we&apos;ll suggest the perfect place
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Starting location + radius */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Starting from</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. New Jersey, USA"
                      value={suggestFrom}
                      onChange={(e) => { setSuggestFrom(e.target.value); setSuggestResults([]); }}
                    />
                  </div>
                  <div>
                    <label className="label">Distance</label>
                    <select
                      className="input"
                      style={{ cursor: "pointer" }}
                      value={suggestRadius}
                      onChange={(e) => { setSuggestRadius(e.target.value); setSuggestResults([]); }}
                    >
                      {RADIUS_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Terrain */}
                <div>
                  <label className="label mb-2 block">Type of place</label>
                  <div className="flex flex-wrap gap-2">
                    {TERRAIN_OPTIONS.map((t) => {
                      const active = suggestTerrain.includes(t.value);
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => toggleSuggestTerrain(t.value)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                          style={
                            active
                              ? { background: "var(--grad-forest)", color: "white", border: "1px solid transparent", boxShadow: "0 2px 8px rgba(45,106,79,0.25)" }
                              : { background: "white", color: "var(--text-mid)", border: "1px solid var(--border-mid)" }
                          }
                        >
                          <span>{t.emoji}</span> {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <label className="label mb-2 block">Activities</label>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITY_OPTIONS.map((a) => {
                      const active = suggestActivities.includes(a.value);
                      return (
                        <button
                          key={a.value}
                          type="button"
                          onClick={() => toggleSuggestActivity(a.value)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                          style={
                            active
                              ? { background: "var(--grad-forest)", color: "white", border: "1px solid transparent", boxShadow: "0 2px 8px rgba(45,106,79,0.25)" }
                              : { background: "white", color: "var(--text-mid)", border: "1px solid var(--border-mid)" }
                          }
                        >
                          <span>{a.emoji}</span> {a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Suggest button */}
                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={isSuggesting}
                  className="btn-primary w-full justify-center text-sm py-3"
                >
                  {isSuggesting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Finding destinations…
                    </>
                  ) : (
                    "✦ Suggest destinations →"
                  )}
                </button>

                {/* Results */}
                {suggestResults.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <div
                      className="text-xs font-semibold pb-2"
                      style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}
                    >
                      {suggestResults.length} suggestions based on your preferences — click one to select
                    </div>
                    {suggestResults.map((r) => (
                      <button
                        key={r.destination}
                        type="button"
                        onClick={() => pickSuggestion(r.destination)}
                        className="w-full text-left rounded-xl overflow-hidden transition-all"
                        style={{
                          border: "1.5px solid var(--border-light)",
                          background: "white",
                          cursor: "pointer",
                          boxShadow: "var(--shadow-sm)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--forest)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--shadow-md)";
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-light)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--shadow-sm)";
                          (e.currentTarget as HTMLButtonElement).style.transform = "none";
                        }}
                      >
                        <div className="flex items-start gap-3 p-4">
                          <span
                            className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "var(--bg-mint)" }}
                          >
                            {r.emoji}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-sm font-bold" style={{ color: "var(--text-dark)" }}>
                                {r.destination}
                              </span>
                              <span
                                className="text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded-full"
                                style={{ background: "var(--bg-mint)", color: "var(--forest)", border: "1px solid var(--border-mid)" }}
                              >
                                {r.distance}
                              </span>
                            </div>
                            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{r.tagline}</p>
                            <div className="flex flex-wrap gap-1">
                              {r.highlights.map((h) => (
                                <span
                                  key={h}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: "rgba(45,106,79,0.07)", color: "var(--text-mid)", border: "1px solid var(--border-light)" }}
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div
                          className="px-4 py-2 flex items-center justify-end gap-1 text-xs font-semibold"
                          style={{ background: "var(--bg-mint)", borderTop: "1px solid var(--border-light)", color: "var(--forest)" }}
                        >
                          Select this destination →
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tripType === "destination" ? (
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="label">From</label>
                <input
                  className="input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div>
                <label className="label">To</label>
                <input
                  className="input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="label">Leave {origin.split(",")[0] || "origin"} on</label>
                <input
                  className="input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div>
                <label className="label">Return home on</label>
                <input
                  className="input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>
          )}

          {dayCount !== null && dayCount > 0 && (
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2"
              style={{ background: "var(--bg-mint)", border: "1px solid var(--border-mid)", color: "var(--forest)" }}
            >
              {dayCount} {dayCount === 1 ? "day" : "days"} · {Math.max(0, dayCount - 1)} {dayCount > 1 ? "nights" : "night"}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button type="button" className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={goNext}>
              Next: Travel Style →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Travel Style ──────────────────────────────────── */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-extrabold mb-1.5" style={{ color: "var(--text-dark)" }}>
            What kind of traveller are you?
          </h2>
          <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
            Select everything that interests you — the more you pick, the better the plan.
          </p>

          <div className="grid grid-cols-3 gap-2.5 mb-8">
            {TRAVEL_STYLES.map(({ value, label, emoji }) => {
              const active = travelStyles.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleStyle(value)}
                  className="rounded-xl py-4 px-3 text-center transition-all"
                  style={{
                    border: `1.5px solid ${active ? "var(--forest)" : "var(--border-mid)"}`,
                    background: active ? "rgba(45,106,79,0.08)" : "white",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--forest)";
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-mint)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)";
                      (e.currentTarget as HTMLButtonElement).style.background = "white";
                    }
                  }}
                >
                  <span className="text-3xl block mb-1.5">{emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-dark)" }}>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Group */}
          <div className="mb-6">
            <label className="label mb-3">Who&apos;s travelling?</label>
            <div className="grid grid-cols-4 gap-2.5 mb-3">
              {GROUP_TYPES.map(({ value, label, emoji }) => {
                const active = groupType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setGroupType(value);
                      if (value === "solo") setGroupSize(1);
                      else if (value === "couple") setGroupSize(2);
                      else if (groupSize < 2) setGroupSize(3);
                    }}
                    className="rounded-xl py-3 px-2 text-center transition-all"
                    style={{
                      border: `1.5px solid ${active ? "var(--forest)" : "var(--border-mid)"}`,
                      background: active ? "rgba(45,106,79,0.08)" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <span className="text-2xl block mb-1">{emoji}</span>
                    <span className="text-xs font-semibold" style={{ color: "var(--text-dark)" }}>{label}</span>
                  </button>
                );
              })}
            </div>
            {groupType !== "solo" && groupType !== "couple" && (
              <div className="flex items-center gap-3 mt-2">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Number of travellers:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGroupSize((n) => Math.max(2, n - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ border: "1.5px solid var(--border-mid)", background: "white", color: "var(--text-dark)", cursor: "pointer" }}
                  >−</button>
                  <span className="text-sm font-semibold w-6 text-center" style={{ color: "var(--text-dark)" }}>{groupSize}</span>
                  <button
                    type="button"
                    onClick={() => setGroupSize((n) => Math.min(20, n + 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ border: "1.5px solid var(--border-mid)", background: "white", color: "var(--text-dark)", cursor: "pointer" }}
                  >+</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" className="btn-secondary" onClick={goBack}>← Back</button>
            <button type="button" className="btn-primary flex-1 justify-center" onClick={goNext}>
              Next: Stay Type →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Accommodation Type ────────────────────────────── */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-extrabold mb-1.5" style={{ color: "var(--text-dark)" }}>
            Where would you like to stay?
          </h2>
          <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
            Select one or more — the AI will suggest matching properties for each zone of your trip.
          </p>

          <div className="grid grid-cols-4 gap-2.5 mb-8">
            {ACCOMMODATION_TYPES.map(({ value, label, emoji }) => {
              const active = accommodationTypes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleAccommodation(value)}
                  className="rounded-xl py-4 px-2 text-center transition-all"
                  style={{
                    border: `1.5px solid ${active ? "var(--forest)" : "var(--border-mid)"}`,
                    background: active ? "rgba(45,106,79,0.08)" : "white",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--forest)";
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-mint)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)";
                      (e.currentTarget as HTMLButtonElement).style.background = "white";
                    }
                  }}
                >
                  <span className="text-2xl block mb-1.5">{emoji}</span>
                  <span className="text-xs font-semibold leading-tight block" style={{ color: "var(--text-dark)" }}>{label}</span>
                </button>
              );
            })}
          </div>

          {accommodationTypes.length === 0 && (
            <p className="text-xs mb-6" style={{ color: "var(--text-faint)" }}>
              Nothing selected — the AI will pick the best fit based on your travel style and destination.
            </p>
          )}

          <div className="flex gap-3 mt-2">
            <button type="button" className="btn-secondary" onClick={goBack}>← Back</button>
            <button type="button" className="btn-primary flex-1 justify-center" onClick={goNext}>
              Next: Interests →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Interests & Notes ─────────────────────────────── */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-extrabold mb-1.5" style={{ color: "var(--text-dark)" }}>
            What do you love most?
          </h2>
          <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
            Optional — helps personalise your itinerary even further.
          </p>

          <div className="mb-6">
            <label className="label mb-3">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const active = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className="px-3.5 py-2 rounded-full text-sm transition-all"
                    style={{
                      border: `1.5px solid ${active ? "var(--forest)" : "var(--border-mid)"}`,
                      background: active ? "rgba(45,106,79,0.10)" : "white",
                      color: active ? "var(--forest)" : "var(--text-mid)",
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="label">
              Anything specific?{" "}
              <span className="font-normal" style={{ color: "var(--text-faint)" }}>(optional)</span>
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="e.g. We love street food, hidden neighbourhoods, prefer to avoid touristy spots…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={goBack}>← Back</button>
            <button type="button" className="btn-primary flex-1 justify-center" onClick={goNext}>
              Review My Trip →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Review & Generate ─────────────────────────────── */}
      {step === 5 && (
        <div>
          <h2 className="text-xl font-extrabold mb-1.5" style={{ color: "var(--text-dark)" }}>
            Ready to generate your itinerary?
          </h2>
          <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
            Here&apos;s everything MyTravel AI will work with.
          </p>

          {/* Review card */}
          <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
            <div
              className="px-6 py-5"
              style={{ background: "linear-gradient(135deg, var(--bg-mint), white)", borderBottom: "1px solid var(--border-light)" }}
            >
              <div className="text-2xl mb-1">
                {tripType === "roadtrip" ? "🚗" : "✈"} {destination}
              </div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                {tripType === "roadtrip" && origin && <span>🛫 {origin} → </span>}
                {startDate} → {endDate}
                {dayCount !== null && ` · ${dayCount} days`}
              </div>
            </div>
            <div className="px-6 py-2">
              {tripType === "roadtrip" && (
                <div className="py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Trip type</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--forest)", color: "white" }}>Road Trip</span>
                  </div>
                  {arriveDestDate && (
                    <div className="text-xs mb-1" style={{ color: "var(--text-mid)" }}>
                      🏁 Arrive at {destination.split(",")[0]}: {arriveDestDate}{arriveDestTime ? ` at ${arriveDestTime}` : ""}
                    </div>
                  )}
                  {leaveDestDate && (
                    <div className="text-xs mb-1" style={{ color: "var(--text-mid)" }}>
                      🛣 Leave {destination.split(",")[0]}: {leaveDestDate}{leaveDestTime ? ` at ${leaveDestTime}` : ""}
                    </div>
                  )}
                  {(includeRouteStops || includeReturnStops) && (
                    <div className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                      En-route stops: {[includeRouteStops && "outbound", includeReturnStops && "return"].filter(Boolean).join(" + ")}
                    </div>
                  )}
                </div>
              )}
              {[
                {
                  label: "Travel Styles",
                  value: (
                    <div className="flex gap-1.5 flex-wrap">
                      {travelStyles.map((s) => (
                        <span key={s} className="badge badge-green">{s}</span>
                      ))}
                    </div>
                  ),
                },
                {
                  label: "Stay Type",
                  value: accomLabel,
                },
                {
                  label: "Travellers",
                  value: `${GROUP_TYPES.find((g) => g.value === groupType)?.emoji ?? ""} ${groupType === "solo" ? "Solo" : groupType === "couple" ? "Couple (2)" : `${GROUP_TYPES.find((g) => g.value === groupType)?.label ?? groupType} · ${groupSize} people`}`,
                },
                {
                  label: "Interests",
                  value: (() => {
                    const parts = [...interests];
                    if (notes.trim()) parts.push(notes.trim());
                    return parts.length > 0 ? parts.join(", ") : <span style={{ color: "var(--text-faint)" }}>None selected</span>;
                  })(),
                },
                {
                  label: "Notes",
                  value: notes || <span style={{ color: "var(--text-faint)" }}>None</span>,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: "1px solid var(--border-light)" }}
                >
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="text-sm font-semibold text-right max-w-64" style={{ color: "var(--text-dark)" }}>
                    {value}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Weather</span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-dark)" }}>
                  🌤 Live forecast will be fetched
                </span>
              </div>
            </div>
          </div>

          {/* AI info box */}
          <div
            className="rounded-xl p-5 mb-6"
            style={{ background: "var(--bg-mint)", border: "1px solid var(--border-mid)" }}
          >
            <h4 className="text-sm font-bold mb-3" style={{ color: "var(--forest)" }}>
              ✦ What MyTravel AI will do with this:
            </h4>
            <ul className="space-y-2">
              {[
                "Fetch the live weather forecast for your travel dates",
                "Analyse hundreds of activities, restaurants and landmarks",
                "Sequence each day geographically to minimise backtracking",
                "Explain why each activity was chosen for your preferences",
                "Your complete itinerary — ready in about 30–60 seconds",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-mid)" }}>
                  <span className="font-bold" style={{ color: "var(--forest)" }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isSubmitting || atCap}
            className="btn-primary w-full justify-center text-base py-4 mb-2"
            style={{ fontSize: "15px", letterSpacing: "-0.2px" }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating trip…
              </>
            ) : (
              `✦ Generate My ${destination.split(",")[0]} Itinerary`
            )}
          </button>

          <div className="text-center text-xs mb-4" style={{ color: "var(--text-faint)" }}>
            {user?.is_premium
              ? "Premium — unlimited generations"
              : `Uses 1 of your ${(user?.gen_limit ?? 5) - (user?.gen_count ?? 0)} remaining free generations`}
          </div>

          <div className="flex gap-3">
            <button type="button" className="btn-ghost text-sm w-full justify-center" onClick={goBack}>
              ← Edit details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
