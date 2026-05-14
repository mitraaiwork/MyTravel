"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Share2, Zap } from "lucide-react";
import { tripsApi } from "@/lib/api";
import { useAuth } from "@/context/auth";
import {
  formatDateRange,
  getDayCount,
  getTravelStyleColor,
  getCountryFlag,
  getTripPhase,
} from "@/lib/utils";
import type { Trip, TripPhase } from "@/types";

const TRIP_BANNER_COLORS: string[] = [
  "linear-gradient(135deg,#b7e4c7,#74c69d,#52b788)",
  "linear-gradient(135deg,#ddd6fe,#c4b5fd,#a78bfa)",
  "linear-gradient(135deg,#fed7aa,#fdba74,#fb923c)",
  "linear-gradient(135deg,#bfdbfe,#93c5fd,#60a5fa)",
  "linear-gradient(135deg,#fde68a,#fcd34d,#f59e0b)",
  "linear-gradient(135deg,#fbcfe8,#f9a8d4,#f472b6)",
];

const DESTINATION_EMOJIS: Record<string, string> = {
  japan: "🗼", tokyo: "🗼", paris: "🗼", france: "🗼",
  bali: "🌴", indonesia: "🌴", rome: "🏛", italy: "🏛",
  london: "🎡", uk: "🎡", "new york": "🗽", usa: "🗽",
  spain: "🌞", thailand: "🌴", greece: "⛵", maldives: "🏝",
  switzerland: "⛰", nepal: "🏔", india: "🕌", china: "🏯",
};

// Unsplash photo IDs for popular destinations (no API key needed for CDN)
const DESTINATION_PHOTOS: Record<string, string> = {
  tokyo:      "photo-1540959733332-eab4deabeeaf",
  japan:      "photo-1540959733332-eab4deabeeaf",
  paris:      "photo-1502602898657-3e91760cbb34",
  france:     "photo-1502602898657-3e91760cbb34",
  bali:       "photo-1537996194471-e657df975ab4",
  indonesia:  "photo-1537996194471-e657df975ab4",
  rome:       "photo-1552832230-c0197dd311b5",
  italy:      "photo-1552832230-c0197dd311b5",
  london:     "photo-1513635269975-59663e0ac1ad",
  uk:         "photo-1513635269975-59663e0ac1ad",
  "new york": "photo-1538970272646-f61fabb3a8a2",
  usa:        "photo-1538970272646-f61fabb3a8a2",
  barcelona:  "photo-1539037116277-4db20889f2d4",
  spain:      "photo-1543785734-4b6e564642f8",
  thailand:   "photo-1506665531195-3566af2b4dfa",
  greece:     "photo-1555993539-1732b0258235",
  santorini:  "photo-1555993539-1732b0258235",
  maldives:   "photo-1573843981267-be1999ff37cd",
  switzerland:"photo-1549294787-a9c8f28ccd98",
  amsterdam:  "photo-1512470876302-972faa2aa2a4",
  dubai:      "photo-1512453979798-5ea43f634b7e",
  singapore:  "photo-1525625293386-3f8f99389ebb",
  kyoto:      "photo-1493976040374-85c8e12f0c0e",
  iceland:    "photo-1504280390367-361c6d9f38f4",
  morocco:    "photo-1539020140153-e5e4f7d4b9d5",
  mexico:     "photo-1585464231875-d466b9935413",
  australia:  "photo-1506905925346-21bda4d32df4",
  hawaii:     "photo-1508009603885-50cf7c579365",
  prague:     "photo-1541849546-216549ae216d",
  budapest:   "photo-1549893072-4bc678117f45",
  lisbon:     "photo-1585208798174-6cedd4b7ba6f",
  portugal:   "photo-1585208798174-6cedd4b7ba6f",
  india:      "photo-1524492412937-b28074a5d7da",
  nepal:      "photo-1544735716-392fe2489ffa",
};

function getDestinationPhoto(destination: string): string | null {
  const lower = destination.toLowerCase();
  for (const [key, photoId] of Object.entries(DESTINATION_PHOTOS)) {
    if (lower.includes(key)) {
      return `https://images.unsplash.com/${photoId}?w=600&h=240&fit=crop&auto=format&q=80`;
    }
  }
  return null;
}

function getDestinationEmoji(destination: string): string {
  const lower = destination.toLowerCase();
  for (const [key, emoji] of Object.entries(DESTINATION_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "✈";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    tripsApi
      .list()
      .then(setTrips)
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, []);

  async function handleDelete(publicId: string) {
    setDeletingId(publicId);
    try {
      await tripsApi.delete(publicId);
      setTrips((prev) => prev.filter((t) => t.public_id !== publicId));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  const genCount = user?.gen_count ?? 0;
  const genLimit = user?.gen_limit ?? 5;
  const atCap = !user?.is_premium && genCount >= genLimit;
  const firstName = user?.full_name?.split(" ")[0] ?? "Traveller";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const PREMIUM_FEATURES = [
    {
      icon: "💬",
      title: "AI Concierge Chat",
      desc: "Ask anything about your trip — restaurants, transport, local tips.",
      grad: "var(--grad-violet)",
      badgeText: "Unlimited",
    },
    {
      icon: "🎒",
      title: "Smart Packing Lists",
      desc: "AI-generated packing lists tailored to destination, weather & activities.",
      grad: "var(--grad-teal)",
      badgeText: "Weather-aware",
    },
    {
      icon: "🔄",
      title: "Day Regeneration",
      desc: "Not loving a day? Regenerate just that day with fresh ideas.",
      grad: "var(--grad-forest)",
      badgeText: "In itinerary view",
    },
    {
      icon: "∞",
      title: "Unlimited Generations",
      desc: "No cap — plan as many trips as you want without limits.",
      grad: "var(--grad-amber)",
      badgeText: `Free: ${genLimit} total`,
    },
  ];

  return (
    <div
      className="page-enter"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 248px",
        gap: "20px",
        alignItems: "start",
      }}
    >
      {/* ── LEFT COLUMN ── */}
      <div>

        {/* Welcome banner */}
        <div
          className="rounded-2xl p-7 mb-7 flex items-center justify-between gap-6 overflow-hidden relative"
          style={{
            background: "var(--grad-nature)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              right: "130px",
              top: "-16px",
              fontSize: "100px",
              opacity: 0.1,
              transform: "rotate(-12deg)",
              lineHeight: 1,
            }}
          >
            🌏
          </div>
          <div
            className="absolute rounded-full pointer-events-none"
            style={{ left: -40, bottom: -40, width: 180, height: 180, background: "rgba(255,255,255,0.06)" }}
          />
          <div className="relative z-10">
            <h2 className="text-xl font-extrabold text-white mb-1.5 tracking-tight">
              {greeting}, {firstName}! Ready for your next adventure?
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              {user?.is_premium
                ? "Premium — unlimited itinerary generations."
                : atCap
                ? `You've used all ${genLimit} free generations. Upgrade to Premium for unlimited itineraries.`
                : `You have ${genLimit - genCount} free generation${genLimit - genCount !== 1 ? "s" : ""} remaining.`}
            </p>
          </div>
          <Link
            href="/trips/new"
            className="relative z-10 flex-shrink-0 flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-xl transition-all"
            style={{
              background: "white",
              color: "var(--forest)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-mint)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "white";
              (e.currentTarget as HTMLAnchorElement).style.transform = "none";
            }}
          >
            <Zap size={15} />
            Plan a New Trip
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            {
              icon: "✈",
              value: isLoading ? "…" : String(trips.length),
              label: "Trips planned",
              style: { background: "linear-gradient(135deg, #1b4332, #2d6a4f)" },
            },
            {
              icon: "🔗",
              value: isLoading ? "…" : String(trips.filter((t) => t.share_enabled).length),
              label: "Trips shared",
              style: { background: "linear-gradient(135deg, #0077b6, #48cae4)" },
            },
            {
              icon: "✦",
              value: user?.is_premium ? "∞" : `${genLimit - genCount}`,
              label: user?.is_premium ? "Unlimited" : "Generations left",
              style: { background: "linear-gradient(135deg, #92400e, #d4a017)" },
            },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl px-5 py-5 flex items-center gap-4 relative overflow-hidden text-white"
              style={{ ...s.style, boxShadow: "var(--shadow-md)" }}
            >
              <div
                className="absolute rounded-full pointer-events-none"
                style={{ right: -18, top: -18, width: 80, height: 80, background: "rgba(255,255,255,0.10)" }}
              />
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.22)" }}
              >
                {s.icon}
              </div>
              <div>
                <div className="text-2xl font-extrabold leading-none">{s.value}</div>
                <div className="text-xs mt-1 font-medium" style={{ opacity: 0.85 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-dark)" }}>
            🗺 My Trips
          </h3>
          <Link href="/trips/new" className="btn-primary text-sm py-1.5 px-4">
            + New Trip
          </Link>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton rounded-2xl" style={{ height: 200 }} />
            ))}
          </div>
        )}

        {/* Trip grid */}
        {!isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {trips.map((trip, idx) => {
              const isConfirming = confirmDeleteId === trip.public_id;
              const isDeleting = deletingId === trip.public_id;
              const isRoadTrip = trip.trip_type === "roadtrip";
              const dayCount = getDayCount(trip.start_date, trip.end_date);
              const banner = isRoadTrip
                ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)"
                : TRIP_BANNER_COLORS[idx % TRIP_BANNER_COLORS.length];
              const emoji = getDestinationEmoji(trip.destination);
              const photoUrl = getDestinationPhoto(trip.destination);

              return (
                <div
                  key={trip.public_id}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: "white",
                    border: isRoadTrip ? "1.5px solid rgba(245,158,11,0.35)" : "1px solid var(--border-light)",
                    boxShadow: "var(--shadow-sm)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = isRoadTrip ? "rgba(245,158,11,0.65)" : "var(--border-mid)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "none";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = isRoadTrip ? "rgba(245,158,11,0.35)" : "var(--border-light)";
                  }}
                >
                  {/* Banner */}
                  <div
                    className="h-36 relative overflow-hidden"
                    style={{ background: banner }}
                  >
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt={trip.destination}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : isRoadTrip ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <span style={{ fontSize: 44, lineHeight: 1 }}>🛣️</span>
                        {trip.origin && (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.92)", fontWeight: 700, letterSpacing: "0.3px", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                            {trip.origin} → {trip.destination}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-6xl">{emoji}</div>
                    )}
                    {/* Gradient overlay for readability */}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 100%)" }}
                    />
                    {/* Trip type badge */}
                    <div className="absolute top-2.5 left-2.5">
                      {isRoadTrip ? (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: "rgba(180,83,9,0.88)", color: "white", backdropFilter: "blur(4px)" }}
                        >
                          🚗 Road Trip
                        </span>
                      ) : (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: "rgba(5,150,105,0.82)", color: "white", backdropFilter: "blur(4px)" }}
                        >
                          ✈ Stay
                        </span>
                      )}
                    </div>
                    {/* Destination label */}
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-white text-xs font-bold drop-shadow">
                      <span>{getCountryFlag(trip.country_code)}</span>
                      <span>{trip.destination}</span>
                    </div>
                    {trip.itinerary_generated && (
                      <span
                        className="absolute bottom-2.5 right-2.5 text-white text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(5,150,105,0.85)", backdropFilter: "blur(4px)" }}
                      >
                        ✓ Ready
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 pb-4">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-sm" style={{ color: "var(--text-dark)" }}>
                        <span>{getCountryFlag(trip.country_code)}</span>
                        <span className="truncate max-w-40">{trip.destination}</span>
                        {trip.itinerary_generated ? (
                          <>
                            <span className="badge badge-green ml-1">✓ Ready</span>
                            {(() => {
                              const ph = getTripPhase(trip);
                              const phaseMap: Record<TripPhase, { label: string; style: React.CSSProperties }> = {
                                "pre-trip":  { label: "Pre-Trip",  style: { background: "rgba(13,148,136,0.12)", color: "#0f766e", border: "1px solid rgba(13,148,136,0.3)" } },
                                "in-trip":   { label: "Active",    style: { background: "rgba(16,185,129,0.12)", color: "#065f46", border: "1px solid rgba(16,185,129,0.3)" } },
                                "post-trip": { label: "Completed", style: { background: "rgba(107,114,128,0.12)", color: "#374151", border: "1px solid rgba(107,114,128,0.25)" } },
                                "planning":  { label: "",          style: {} },
                              };
                              const entry = phaseMap[ph];
                              if (!entry.label) return null;
                              return (
                                <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={entry.style}>
                                  {entry.label}
                                </span>
                              );
                            })()}
                          </>
                        ) : (
                          <span className="badge badge-amber ml-1">Draft</span>
                        )}
                      </div>
                      {trip.share_enabled && (
                        <Share2 size={13} style={{ color: "var(--forest)" }} className="flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <div className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                      {formatDateRange(trip.start_date, trip.end_date)} · {dayCount} {dayCount === 1 ? "day" : "days"}
                    </div>
                    {isRoadTrip && trip.origin && (
                      <div className="text-xs mb-2.5 flex items-center gap-1" style={{ color: "#92400e" }}>
                        <span>📍</span>
                        <span style={{ fontWeight: 600 }}>{trip.origin}</span>
                        <span style={{ color: "var(--text-muted)" }}>→</span>
                        <span style={{ fontWeight: 600, color: "var(--forest)" }}>{trip.destination}</span>
                      </div>
                    )}

                    {/* Style badges */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {trip.travel_style.split(",").slice(0, 3).map((style) => (
                        <span
                          key={style}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTravelStyleColor(style.trim())}`}
                        >
                          {style.trim()}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    {isConfirming ? (
                      <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--border-light)" }}>
                        <span className="text-xs flex-1" style={{ color: "var(--text-muted)" }}>Delete this trip?</span>
                        <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary text-xs py-1 px-3">
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(trip.public_id)}
                          disabled={isDeleting}
                          className="text-xs py-1 px-3 font-semibold rounded-lg text-white"
                          style={{ background: "#dc2626" }}
                        >
                          {isDeleting ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--border-light)" }}>
                        <Link
                          href={`/trips/${trip.public_id}`}
                          className="btn-primary text-xs py-1.5 flex-1 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {trip.itinerary_generated ? "View Itinerary →" : "Generate →"}
                        </Link>
                        <button
                          onClick={() => setConfirmDeleteId(trip.public_id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: "#d1d5db" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#d1d5db"; }}
                          title="Delete trip"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* New trip card */}
            <Link
              href="/trips/new"
              className="rounded-2xl flex flex-col items-center justify-center gap-3 p-6 text-center transition-all no-underline"
              style={{ background: "white", border: "2px dashed var(--border-mid)", minHeight: 200 }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-mint)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--leaf)";
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "white";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-mid)";
                (e.currentTarget as HTMLAnchorElement).style.transform = "none";
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: "var(--bg-mint)" }}>
                ✈
              </div>
              <h4 className="font-bold text-sm" style={{ color: "var(--text-dark)" }}>Plan a New Trip</h4>
              <p className="text-xs max-w-44 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Tell us where you want to go. Get a full itinerary in 30 seconds.
              </p>
              <span className="btn-primary text-sm py-1.5 px-4 mt-1">+ Start Planning</span>
            </Link>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL — Premium Features ── */}
      {!user?.is_premium && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            position: "sticky",
            top: "28px",
            background: "linear-gradient(160deg, #fffbeb 0%, #fef9ee 100%)",
            border: "1px solid rgba(212,160,23,0.28)",
            boxShadow: "0 4px 24px rgba(212,160,23,0.12)",
          }}
        >
          {/* Panel header */}
          <div
            className="px-5 py-4"
            style={{
              background: "linear-gradient(135deg, #92400e, #b45309, #d4a017)",
              borderBottom: "1px solid rgba(212,160,23,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-sm font-extrabold text-white tracking-tight">✦ Premium Features</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.20)", color: "white", fontSize: "10px" }}
              >
                PRO
              </span>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>
              Upgrade to unlock all tools
            </p>
          </div>

          {/* Feature list */}
          <div className="p-3 flex flex-col gap-2">
            {PREMIUM_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(212,160,23,0.15)", background: "white" }}
              >
                <div className="flex items-center gap-3 p-3.5" style={{ background: f.grad }}>
                  <span className="text-2xl flex-shrink-0">{f.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white leading-tight">{f.title}</div>
                    <div className="text-xs text-white/70 leading-snug mt-0.5">{f.desc}</div>
                  </div>
                </div>
                <div
                  className="flex items-center justify-between px-3.5 py-2"
                  style={{ borderTop: "1px solid rgba(212,160,23,0.12)" }}
                >
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{f.badgeText}</span>
                  <span className="badge badge-premium" style={{ fontSize: "10px" }}>✦ PRO</span>
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade CTA */}
          <div className="px-4 pb-4">
            <button
              className="w-full font-bold text-sm py-3 rounded-xl text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #92400e, var(--wheat), var(--amber))",
                boxShadow: "0 4px 16px rgba(212,160,23,0.35)",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}
              onClick={() => alert("Premium coming soon!")}
            >
              Upgrade — $9.99/mo →
            </button>
            <p className="text-center text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              Cancel anytime · No commitment
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
