"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tripsApi } from "@/lib/api";
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

const SUGGESTIONS = [
  { label: "🇯🇵 Tokyo", value: "Tokyo, Japan" },
  { label: "🇫🇷 Paris", value: "Paris, France" },
  { label: "🇮🇩 Bali", value: "Bali, Indonesia" },
  { label: "🇮🇹 Rome", value: "Rome, Italy" },
  { label: "🇺🇸 New York", value: "New York, USA" },
  { label: "🇬🇧 London", value: "London, UK" },
];

export default function NewTripPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelStyles, setTravelStyles] = useState<TravelStyle[]>([]);
  const [accommodationTypes, setAccommodationTypes] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function validateStep(n: number): string | null {
    if (n === 1) {
      if (!destination.trim()) return "Please enter a destination.";
      if (!startDate || !endDate) return "Please select both start and end dates.";
      if (endDate < startDate) return "End date must be on or after the start date.";
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
        start_date: startDate,
        end_date: endDate,
        travel_style: travelStyles.join(","),
        interests: interests.length > 0 ? interests.join(",") : undefined,
        accommodation_type: accommodationTypes.length > 0 ? accommodationTypes.join(",") : undefined,
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
            <div className="flex gap-2 flex-wrap mt-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setDestination(s.value)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: destination === s.value ? "rgba(45,106,79,0.10)" : "white",
                    border: `1.5px solid ${destination === s.value ? "var(--forest)" : "var(--border-mid)"}`,
                    color: destination === s.value ? "var(--forest)" : "var(--text-mid)",
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

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
            Here&apos;s everything MyTravel-AI will work with.
          </p>

          {/* Review card */}
          <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
            <div
              className="px-6 py-5"
              style={{ background: "linear-gradient(135deg, var(--bg-mint), white)", borderBottom: "1px solid var(--border-light)" }}
            >
              <div className="text-2xl mb-1">✈ {destination}</div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                {startDate} → {endDate}
                {dayCount !== null && ` · ${dayCount} days`}
              </div>
            </div>
            <div className="px-6 py-2">
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
                  label: "Interests",
                  value: interests.length > 0 ? interests.join(", ") : <span style={{ color: "var(--text-faint)" }}>None selected</span>,
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
              <div
                className="flex items-center justify-between py-3"
              >
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
              ✦ What MyTravel-AI will do with this:
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
