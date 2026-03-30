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
} from "@/lib/utils";
import type { Trip } from "@/types";

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

  return (
    <div className="page-enter">

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
            content: "",
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
          style={{
            left: -40, bottom: -40,
            width: 180, height: 180,
            background: "rgba(255,255,255,0.06)",
          }}
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
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-2xl" style={{ height: 200 }} />
          ))}
        </div>
      )}

      {/* Trip grid */}
      {!isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {trips.map((trip, idx) => {
            const isConfirming = confirmDeleteId === trip.public_id;
            const isDeleting = deletingId === trip.public_id;
            const dayCount = getDayCount(trip.start_date, trip.end_date);
            const banner = TRIP_BANNER_COLORS[idx % TRIP_BANNER_COLORS.length];
            const emoji = getDestinationEmoji(trip.destination);

            return (
              <div
                key={trip.public_id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: "white",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-sm)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-mid)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "none";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-light)";
                }}
              >
                {/* Banner */}
                <div
                  className="h-28 flex items-center justify-center text-6xl relative overflow-hidden"
                  style={{ background: banner }}
                >
                  {emoji}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.10) 100%)" }}
                  />
                  {trip.itinerary_generated && (
                    <span
                      className="absolute bottom-2.5 right-2.5 text-white text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(5,150,105,0.85)",
                        backdropFilter: "blur(4px)",
                      }}
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
                        <span className="badge badge-green ml-1">✓ Ready</span>
                      ) : (
                        <span className="badge badge-amber ml-1">Draft</span>
                      )}
                    </div>
                    {trip.share_enabled && (
                      <Share2 size={13} style={{ color: "var(--forest)" }} className="flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                  <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                    {formatDateRange(trip.start_date, trip.end_date)} · {dayCount} {dayCount === 1 ? "day" : "days"}
                  </div>

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
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="btn-secondary text-xs py-1 px-3"
                      >
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
            style={{
              background: "white",
              border: "2px dashed var(--border-mid)",
              minHeight: 200,
            }}
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
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ background: "var(--bg-mint)" }}
            >
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

      {/* Premium features */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-dark)" }}>
          ✦ Premium Features
          <span className="badge badge-premium">PRO</span>
        </h3>
        <button
          className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-all"
          style={{
            background: "linear-gradient(135deg, #92400e, var(--wheat), var(--amber))",
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(212,160,23,0.30)",
          }}
          onClick={() => alert("Premium coming soon!")}
        >
          Upgrade — $9.99/mo
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-7">
        {[
          {
            icon: "💬",
            title: "AI Concierge Chat",
            desc: "Ask anything about your trip — restaurants, transport, local tips, and more.",
            grad: "var(--grad-violet)",
            badge: "badge-violet",
            badgeText: "Unlimited",
          },
          {
            icon: "🎒",
            title: "Smart Packing Lists",
            desc: "AI-generated packing lists based on your destination, weather, and activities.",
            grad: "var(--grad-teal)",
            badge: "badge-teal",
            badgeText: "Weather-aware",
          },
          {
            icon: "🔄",
            title: "Day Regeneration",
            desc: "Not loving a day? Regenerate just that day with new ideas.",
            grad: "var(--grad-forest)",
            badge: "badge-forest",
            badgeText: "In itinerary view",
          },
          {
            icon: "∞",
            title: "Unlimited Generations",
            desc: "No generation cap — plan as many trips as you want without limits.",
            grad: "var(--grad-amber)",
            badge: "badge-amber",
            badgeText: `Free: ${genLimit} total`,
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl overflow-hidden transition-all"
            style={{
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-sm)",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "none";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
            }}
          >
            <div
              className="p-5 pb-4 relative overflow-hidden"
              style={{ background: f.grad }}
            >
              <div
                className="absolute rounded-full pointer-events-none"
                style={{ right: -20, bottom: -20, width: 90, height: 90, background: "rgba(255,255,255,0.12)" }}
              />
              <div className="text-3xl mb-2.5">{f.icon}</div>
              <div className="font-bold text-sm text-white mb-1">{f.title}</div>
              <div className="text-xs text-white/75 leading-relaxed">{f.desc}</div>
            </div>
            <div
              className="px-5 py-3 bg-white flex items-center justify-between"
              style={{ borderTop: "1px solid var(--border-light)" }}
            >
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{f.badgeText}</span>
              <span className="badge badge-premium">✦ PRO</span>
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade banner */}
      <div
        className="rounded-2xl p-6 flex items-center justify-between gap-5 flex-wrap"
        style={{
          background: "linear-gradient(135deg, #fffbeb, #fef3c7, #fdf6d8)",
          border: "1px solid rgba(212,160,23,0.3)",
          boxShadow: "0 4px 20px rgba(212,160,23,0.12)",
        }}
      >
        <div>
          <div className="font-extrabold text-sm mb-1" style={{ color: "var(--text-dark)" }}>
            ✦ Unlock MyTravel Premium
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Get unlimited generations and all powerful travel tools for just $9.99/month
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          {["🔄 Day Regeneration", "💬 AI Concierge", "🎒 Smart Packing", "∞ Unlimited Gen"].map((f) => (
            <div key={f} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-mid)" }}>
              {f}
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(212,160,23,0.18)",
                  color: "#92400e",
                  border: "1px solid rgba(212,160,23,0.3)",
                  fontSize: "9px",
                }}
              >
                PRO
              </span>
            </div>
          ))}
        </div>
        <button
          className="flex-shrink-0 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all"
          style={{
            background: "linear-gradient(135deg, #92400e, var(--wheat), var(--amber))",
            boxShadow: "0 4px 16px rgba(212,160,23,0.30)",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => alert("Premium coming soon!")}
        >
          Start Free Trial →
        </button>
      </div>

    </div>
  );
}
