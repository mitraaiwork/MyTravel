"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  EyeOff,
  Lock,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Globe,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Download,
  Backpack,
  X,
} from "lucide-react";
import { tripsApi, itineraryApi } from "@/lib/api";
import { useItineraryStream, type DayStream } from "@/hooks/useItineraryStream";
import { formatDateRange, getCategoryColor, getCategoryIcon, getDayCount } from "@/lib/utils";
import type { Trip, Itinerary, Activity } from "@/types";
import dynamic from "next/dynamic";
import DayCard from "@/components/itinerary/DayCard";
import AccommodationSection from "@/components/itinerary/AccommodationSection";
import type { Restaurant, OffbeatSpot } from "@/types";

const ItineraryMap = dynamic(() => import("@/components/map/ItineraryMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center" style={{ height: 480 }}>
      <svg className="animate-spin h-6 w-6 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  ),
});

// ── Per-day writing phrases (rotate by day number) ───────────────────────────

const WRITING_PHRASES = [
  "Scouting the best spots…",
  "Discovering hidden gems…",
  "Mapping out the day…",
  "Curating local experiences…",
  "Finding the perfect route…",
  "Handpicking activities…",
  "Exploring the neighbourhood…",
  "Consulting local insiders…",
  "Seeking out must-sees…",
  "Plotting the adventure…",
  "Uncovering local favourites…",
  "Crafting a perfect day…",
];

function writingPhrase(dayNum: number) {
  return WRITING_PHRASES[(dayNum - 1) % WRITING_PHRASES.length];
}

// ── Per-day partial JSON parser ───────────────────────────────────────────────

interface PartialDay {
  day?: number;
  date?: string;
  theme?: string;
  area?: string;
  activities?: Partial<Activity>[];
}

function parseDayStream(text: string): PartialDay {
  if (!text) return {};
  let t = text.trim();
  const start = t.indexOf("{");
  if (start > 0) t = t.slice(start);
  for (const closer of ["", "}", "]}", "]}}"] as const) {
    try {
      const r = JSON.parse(t + closer);
      if (r?.day) return r as PartialDay;
    } catch {}
  }
  const dayNum = t.match(/"day"\s*:\s*(\d+)/)?.[1];
  if (!dayNum) return {};
  const date = t.match(/"date"\s*:\s*"([^"]+)"/)?.[1];
  const theme = t.match(/"theme"\s*:\s*"([^"]+)"/)?.[1];
  const area = t.match(/"area"\s*:\s*"([^"]+)"/)?.[1];
  let activities: Partial<Activity>[] = [];
  const actMatch = t.match(/"activities"\s*:\s*(\[[\s\S]*)/);
  if (actMatch) {
    for (const closer of ["", "]", "]}", "]}}"]) {
      try {
        const parsed = JSON.parse(actMatch[1] + closer);
        if (Array.isArray(parsed) && parsed.length > 0) { activities = parsed; break; }
      } catch {}
    }
  }
  return { day: Number(dayNum), date, theme, area, activities };
}

function getCategoryDotClass(category?: string): string {
  const map: Record<string, string> = {
    food: "bg-orange-100", culture: "bg-purple-100", nature: "bg-emerald-100",
    adventure: "bg-red-100", shopping: "bg-pink-100", nightlife: "bg-indigo-100",
    transport: "bg-sky-100", wellness: "bg-teal-100", accommodation: "bg-yellow-100",
  };
  return map[category ?? ""] ?? "bg-gray-100";
}

// ── Streaming day card ────────────────────────────────────────────────────────

function GeneratingDayCard({ stream }: { stream: DayStream }) {
  const partial = useMemo(() => parseDayStream(stream.text), [stream.text]);
  const dayNum = partial.day ?? stream.day;
  const activities = partial.activities ?? [];
  const isWriting = !stream.done && !stream.hasError;

  return (
    <div className="mb-4 rounded-2xl overflow-hidden shadow-md border border-gray-200/50 animate-fade-in-up">
      <div
        className="px-5 py-4 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 70%, #3a7d5f 100%)" }}
      >
        <div className="w-12 h-12 rounded-full border border-white/25 bg-white/10 flex flex-col items-center justify-center shrink-0 backdrop-blur-sm">
          <span className="text-white/60 text-[9px] font-bold uppercase tracking-widest leading-none">DAY</span>
          <span className="text-white text-xl font-bold leading-tight">{dayNum}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-white/55 text-xs">{partial.date ?? stream.date}</span>
            {partial.area && <><span className="text-white/30 text-xs">·</span><span className="text-white/55 text-xs truncate">{partial.area}</span></>}
          </div>
          {partial.theme
            ? <p className="text-white font-semibold text-sm leading-snug">{partial.theme}</p>
            : <div className="h-4 bg-white/20 rounded animate-pulse w-40" />}
        </div>
        <div className="shrink-0">
          {stream.hasError ? (
            <span className="text-xs text-red-300">Failed</span>
          ) : isWriting ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/60 animate-ping" />
              <span className="text-white/60 text-xs hidden sm:block">{writingPhrase(dayNum)}</span>
            </div>
          ) : (
            <CheckCircle size={16} className="text-white/60" />
          )}
        </div>
      </div>

      <div className="bg-white px-5 pt-5 pb-3">
        {activities.length === 0 && isWriting ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 pt-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-48" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {activities.map((act, i) => (
              <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                {i < activities.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-px bg-gradient-to-b from-gray-200 to-transparent" />
                )}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm ${getCategoryDotClass(act.category)}`}>
                  <span className="text-lg leading-none">{getCategoryIcon(act.category ?? "")}</span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#1a2e1a] text-sm">{act.name}</span>
                    {act.time && <span className="text-xs text-gray-400">{act.time}</span>}
                    {act.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(act.category)}`}>{act.category}</span>
                    )}
                  </div>
                  {act.why_chosen && (
                    <p className="mt-2 text-xs text-[#1b4332] bg-[#f0faf4] border border-[#c7e8d0] rounded-lg px-3 py-2 italic">✦ {act.why_chosen}</p>
                  )}
                </div>
              </div>
            ))}
            {isWriting && (
              <div className="relative flex gap-3 mt-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 pt-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-44" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Share modal ───────────────────────────────────────────────────────────────

function ShareModal({
  trip,
  tripId,
  onClose,
  onTripChange,
}: {
  trip: Trip;
  tripId: string;
  onClose: () => void;
  onTripChange: (t: Trip) => void;
}) {
  const [isToggling, setIsToggling] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const shareUrl = trip.share_token
    ? `${window.location.origin}/share/${trip.share_token}`
    : "";

  async function handleEnable() {
    setIsToggling(true);
    try {
      const updated = await tripsApi.enableShare(tripId);
      onTripChange(updated);
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDisable() {
    setIsToggling(true);
    try {
      const updated = await tripsApi.disableShare(tripId);
      onTripChange(updated);
    } finally {
      setIsToggling(false);
    }
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-[#2d6a4f]" />
            <h2 className="font-semibold text-[#1a2e1a]">Share itinerary</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!trip.share_enabled ? (
            <>
              <p className="text-sm text-gray-500 leading-relaxed">
                Create a public link so friends and family can view your itinerary. They won't be able to edit it.
              </p>
              <button
                onClick={handleEnable}
                disabled={isToggling}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Share2 size={14} />
                {isToggling ? "Enabling…" : "Enable sharing & copy link"}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-1">Share link</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="input text-xs text-gray-600 flex-1 bg-gray-50 py-2"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border-2 border-[#2d6a4f] text-[#2d6a4f] hover:bg-[#d8f3dc] transition-colors"
                >
                  {justCopied ? <><Check size={12} className="text-green-600" /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">Anyone with this link can view your itinerary</p>
                <button
                  onClick={handleDisable}
                  disabled={isToggling}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  <EyeOff size={11} />
                  {isToggling ? "Disabling…" : "Disable"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PDF export ────────────────────────────────────────────────────────────────

function ExportPdfButton({ label = "Export PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#2d6a4f] border border-gray-200 hover:border-[#2d6a4f] rounded-xl px-3 py-2 transition-colors bg-white"
    >
      <Download size={14} />
      {label}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TripPage() {
  const params = useParams();
  const tripId = params.id as string;  // this IS the public_id

  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"itinerary" | "stay" | "food" | "gems" | "map">("itinerary");

  const { dayStreams, isComplete, error: streamError, status, startStream, reset } =
    useItineraryStream(tripId);
  const startedRef = useRef(false);

  const [practicalOpen, setPracticalOpen] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const t = await tripsApi.get(tripId);
        setTrip(t);
        if (!t.itinerary_generated) {
          setIsLoading(false);
          setIsGenerating(true);
          return;
        }
        const it = await itineraryApi.get(tripId).catch(() => null);
        setItinerary(it);
      } catch {
        setLoadError("Failed to load trip. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [tripId]);

  useEffect(() => {
    if (!isGenerating || startedRef.current) return;
    startedRef.current = true;
    const token = localStorage.getItem("token");
    if (token) startStream(token);
  }, [isGenerating, startStream]);

  useEffect(() => {
    if (!isComplete) return;
    itineraryApi.get(tripId).then((it) => {
      setItinerary(it);
      setIsGenerating(false);
      tripsApi.get(tripId).then(setTrip).catch(() => null);
    }).catch(() => null);
  }, [isComplete, tripId]);

  const handleItineraryChange = useCallback((updated: Itinerary) => {
    setItinerary(updated);
  }, []);

  function handleRetryStream() {
    reset();
    startedRef.current = false;
    setIsGenerating(true);
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-4">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (loadError || !trip) {
    return (
      <div className="max-w-5xl card border-red-100 bg-red-50 text-center py-12">
        <p className="text-red-600 mb-4">{loadError ?? "Trip not found."}</p>
        <Link href="/dashboard" className="btn-secondary inline-flex">Back to dashboard</Link>
      </div>
    );
  }

  // ── Trip topbar ───────────────────────────────────────────────────────────────
  const header = (
    <div className="mb-6 print:mb-4">
      {/* Breadcrumb + Title + Actions row */}
      <div className="flex items-start gap-4 py-2 pb-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            <Link
              href="/dashboard"
              className="no-underline hover:underline"
              style={{ color: "var(--forest)" }}
            >
              My Trips
            </Link>
            {" / "}{trip.destination}
          </div>
          <h1
            className="font-extrabold leading-tight"
            style={{ fontSize: "22px", letterSpacing: "-0.5px", color: "var(--text-dark)" }}
          >
            {trip.destination} — {getDayCount(trip.start_date, trip.end_date)}-Day Itinerary
          </h1>
        </div>

        {/* Action buttons — hidden while generating */}
        {!isGenerating && (
          <div className="flex items-center gap-2 shrink-0 print:hidden flex-wrap">
            <button
              onClick={() => setShareModalOpen(true)}
              className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
            >
              <Share2 size={13} /> Share
            </button>
            <ExportPdfButton label="PDF" />
          </div>
        )}
      </div>

      {/* Meta strip */}
      <div
        className="flex items-center gap-4 flex-wrap px-4 py-3 rounded-xl text-sm mb-1"
        style={{
          background: "white",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <span className="font-semibold" style={{ color: "var(--text-dark)" }}>
          ✈ {trip.destination}
        </span>
        <span style={{ color: "var(--text-mid)" }}>
          📅 {formatDateRange(trip.start_date, trip.end_date)}
        </span>
        <div className="flex flex-wrap gap-1.5 ml-auto">
          {trip.travel_style.split(",").map((s) => (
            <span key={s} className="badge badge-forest text-xs">
              {s.trim()}
            </span>
          ))}
        </div>
        {trip.itinerary_generated && (
          <span className="badge badge-green ml-1">✓ Generated</span>
        )}
      </div>
    </div>
  );

  // ── Generating view ───────────────────────────────────────────────────────────
  if (isGenerating) {
    if (status === "error") {
      return (
        <div className="max-w-5xl">{header}
          <div className="card border-red-100 bg-red-50 text-center py-12">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-700 mb-2">Generation failed</h2>
            <p className="text-red-600 text-sm mb-6 max-w-sm mx-auto">{streamError}</p>
            <button onClick={handleRetryStream} className="btn-primary flex items-center gap-2 mx-auto">
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        </div>
      );
    }

    if (status === "cap_reached") {
      return (
        <div className="max-w-5xl">{header}
          <div className="card border-amber-100 bg-amber-50 text-center py-12">
            <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-amber-800 mb-2">Monthly limit reached</h2>
            <p className="text-amber-700 text-sm mb-6 max-w-sm mx-auto">{streamError}</p>
            <button className="btn-primary opacity-50 cursor-not-allowed" disabled>Upgrade to Premium</button>
          </div>
        </div>
      );
    }

    if (status === "idle" || status === "connecting") {
      return (
        <div className="max-w-5xl">{header}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">✨</div>
            <div className="w-8 h-8 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#1a2e1a] font-semibold">Your AI travel planner is warming up…</p>
          </div>
        </div>
      );
    }

    const totalDays = dayStreams.length;
    const doneDays = dayStreams.filter((d) => d.done && !d.hasError).length;
    const pct = isComplete ? 100 : totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0;

    return (
      <div className="max-w-5xl">{header}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-[#2d6a4f] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-400 shrink-0 tabular-nums">
              {isComplete ? `${totalDays} days ready` : totalDays > 0 ? `${doneDays} / ${totalDays} days` : "Starting…"}
            </span>
          </div>
          <p className="text-xs text-gray-400 text-center mt-1">Your AI travel planner is crafting each day · Usually 15–25 seconds</p>
        </div>

        <div>
          {dayStreams.map((stream) => (
            <GeneratingDayCard key={stream.day} stream={stream} />
          ))}
        </div>

        {isComplete && (
          <div className="card border-green-100 bg-green-50 flex items-center gap-3 mb-4 animate-fade-in">
            <CheckCircle size={20} className="text-[#2d6a4f] shrink-0" />
            <p className="text-sm font-semibold text-[#1b4332]">Finalising your itinerary…</p>
          </div>
        )}
      </div>
    );
  }

  // ── Normal itinerary view ─────────────────────────────────────────────────────
  if (!itinerary) {
    return (
      <div className="max-w-5xl">{header}
        <div className="card border-red-100 bg-red-50 text-center py-12">
          <p className="text-red-600 mb-4">Could not load itinerary.</p>
          <Link href="/dashboard" className="btn-secondary inline-flex">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const pi = itinerary.practical_info ?? {};
  const packingItems = pi.packing_suggestions ?? [];
  const transportTips = pi.transport_tips ?? [];
  const hasEssentials = pi.currency || pi.language || pi.timezone || transportTips.length > 0;

  const allRestaurants: { day: number; date: string; items: Restaurant[] }[] =
    (itinerary.days ?? [])
      .filter((d) => d.restaurants && d.restaurants.length > 0)
      .map((d) => ({ day: d.day, date: d.date, items: d.restaurants! }));

  const allGems: { day: number; date: string; items: OffbeatSpot[] }[] =
    (itinerary.days ?? [])
      .filter((d) => d.offbeat_spots && d.offbeat_spots.length > 0)
      .map((d) => ({ day: d.day, date: d.date, items: d.offbeat_spots! }));

  const TABS = [
    { id: "itinerary" as const, label: "Itinerary",    emoji: "📅" },
    { id: "stay"      as const, label: "Stay",         emoji: "🏕"  },
    { id: "food"      as const, label: "Food",         emoji: "🍽️"  },
    { id: "gems"      as const, label: "Hidden Gems",  emoji: "🧭"  },
    { id: "map"       as const, label: "Map",          emoji: "🗺️"  },
  ];

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: A4; }
          body { font-size: 10pt; color: #1a2e1a; }
          .print\\:hidden { display: none !important; }
          .print\\:!block { display: block !important; }
          .print-section { display: block !important; }
        }
        .print-section { display: none; }
      `}</style>

      <div className="max-w-5xl">
        {header}

        {/* Summary — always visible above tabs */}
        {itinerary.summary && (
          <div
            className="print:hidden relative rounded-2xl overflow-hidden mb-4 p-5 border border-[#b7e4c7]"
            style={{ background: "linear-gradient(135deg, #f0faf4 0%, #e8f5ec 100%)" }}
          >
            <div className="absolute top-3 left-4 text-4xl leading-none opacity-20 select-none">"</div>
            <p className="text-[#1b4332] text-sm leading-relaxed pl-4 italic">{itinerary.summary}</p>
            <div className="absolute bottom-3 right-4 text-4xl leading-none opacity-20 select-none rotate-180">"</div>
          </div>
        )}

        {/* ── Tab bar ── */}
        <div
          className="flex gap-1 mb-5 p-1 rounded-2xl overflow-x-auto print:hidden"
          style={{ background: "var(--bg-mint)", border: "1px solid var(--border-light)" }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: active ? "white" : "transparent",
                  color: active ? "var(--forest)" : "var(--text-muted)",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                  border: active ? "1px solid var(--border-light)" : "1px solid transparent",
                }}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab: Itinerary ── */}
        {activeTab === "itinerary" && (
          <div className="print:hidden">
            {/* Trip Essentials + Packing */}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {hasEssentials && (
                <div className="card">
                  <button className="w-full flex items-center justify-between text-left" onClick={() => setPracticalOpen((v) => !v)}>
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#d8f3dc] flex items-center justify-center text-sm">🗺️</span>
                      <span className="font-semibold text-[#1a2e1a] text-sm">Trip essentials</span>
                    </div>
                    {practicalOpen ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                  </button>
                  {practicalOpen && (
                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {pi.currency && <span className="bg-[#f0faf4] text-[#1b4332] border border-[#c7e8d0] rounded-full px-3 py-1 text-xs font-medium">💵 {pi.currency}</span>}
                        {pi.language && <span className="bg-[#f0faf4] text-[#1b4332] border border-[#c7e8d0] rounded-full px-3 py-1 text-xs font-medium">🗣️ {pi.language}</span>}
                        {pi.timezone && <span className="bg-[#f0faf4] text-[#1b4332] border border-[#c7e8d0] rounded-full px-3 py-1 text-xs font-medium">🕐 {pi.timezone}</span>}
                      </div>
                      {transportTips.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Getting around</p>
                          <ul className="space-y-1">
                            {transportTips.map((tip, i) => (
                              <li key={i} className="flex gap-2 text-xs text-gray-600">
                                <span className="text-[#52b788] shrink-0 mt-0.5">›</span>{tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {packingItems.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
                      <Backpack size={14} className="text-sky-600" />
                    </span>
                    <span className="font-semibold text-[#1a2e1a] text-sm">Suggested packing</span>
                  </div>
                  <ul className="space-y-2">
                    {packingItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="w-4 h-4 rounded border border-gray-200 flex-shrink-0 mt-0.5 flex items-center justify-center bg-gray-50 text-gray-300">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Premium locked features */}
            <div className="card mb-4 bg-gradient-to-br from-amber-50/60 to-orange-50/60 border-amber-100 print:hidden">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-sm">⭐</span>
                <p className="text-sm font-semibold text-amber-800">Premium features</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 opacity-60 cursor-not-allowed select-none">
                  <button disabled className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-white/80 cursor-not-allowed">
                    <RefreshCw size={12} /> Regenerate day
                  </button>
                  <Lock size={11} className="text-amber-400" />
                </div>
                <div className="flex items-center gap-2 opacity-60 cursor-not-allowed select-none">
                  <button disabled className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-white/80 cursor-not-allowed">
                    <MessageSquare size={12} /> AI Concierge
                  </button>
                  <Lock size={11} className="text-amber-400" />
                </div>
              </div>
            </div>

            {/* Day cards — activities only */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-bold text-[#1a2e1a] uppercase tracking-wider">Day by Day</span>
              <div className="flex-1 h-px bg-gradient-to-r from-[#b7e4c7] to-transparent" />
              <span className="text-xs text-gray-400">{itinerary.days?.length ?? 0} days</span>
            </div>
            <div>
              {(itinerary.days ?? []).length === 0 ? (
                <div className="card border-amber-100 bg-amber-50 text-center py-10">
                  <p className="text-amber-700 text-sm mb-4">This itinerary appears empty and needs to be regenerated.</p>
                  <button onClick={handleRetryStream} className="btn-primary text-sm">Regenerate itinerary</button>
                </div>
              ) : (
                (itinerary.days ?? []).map((day, i) => (
                  <DayCard
                    key={day.day}
                    day={day}
                    tripId={tripId}
                    onItineraryChange={handleItineraryChange}
                    defaultOpen={i === 0}
                    hideRestaurants
                    hideOffbeat
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Stay ── */}
        {activeTab === "stay" && (
          <div className="print:hidden">
            {itinerary.accommodations && itinerary.accommodations.length > 0 && trip ? (
              <AccommodationSection accommodations={itinerary.accommodations} trip={trip} />
            ) : (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">🏕</div>
                <p className="text-sm font-semibold text-[#1a2e1a] mb-1">No accommodation suggestions yet</p>
                <p className="text-xs text-gray-400">Regenerate your itinerary to get AI-suggested stays with booking links.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Food ── */}
        {activeTab === "food" && (
          <div className="print:hidden">
            {allRestaurants.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">🍽️</div>
                <p className="text-sm font-semibold text-[#1a2e1a] mb-1">No restaurant suggestions yet</p>
                <p className="text-xs text-gray-400">Regenerate your itinerary to get local dining recommendations.</p>
              </div>
            ) : (
              allRestaurants.map(({ day, date, items }) => (
                <div key={day} className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: "rgba(212,160,23,0.1)", color: "#92400e", border: "1px solid rgba(212,160,23,0.2)" }}>
                      Day {day} · {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(212,160,23,0.15)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((r, i) => (
                      <div key={i} className="rounded-xl px-4 py-3" style={{ background: "linear-gradient(135deg, #fff8f0, #fff3e6)", border: "1px solid rgba(212,160,23,0.18)" }}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>{r.name}</span>
                            {r.meal && <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(212,160,23,0.12)", color: "#92400e", border: "1px solid rgba(212,160,23,0.25)" }}>{r.meal}</span>}
                            {r.cuisine && <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {r.cuisine}</span>}
                          </div>
                          {r.price_range && <span className="text-xs font-medium flex-shrink-0" style={{ color: "var(--text-muted)" }}>{r.price_range}</span>}
                        </div>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#92400e" }}>✦ {r.famous_for}</p>
                        {r.insider_tip && <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>💡 {r.insider_tip}</p>}
                        {r.location && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>📍 {r.location}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Tab: Hidden Gems ── */}
        {activeTab === "gems" && (
          <div className="print:hidden">
            {allGems.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">🧭</div>
                <p className="text-sm font-semibold text-[#1a2e1a] mb-1">No hidden gems yet</p>
                <p className="text-xs text-gray-400">Regenerate your itinerary to discover offbeat spots most tourists miss.</p>
              </div>
            ) : (
              allGems.map(({ day, date, items }) => (
                <div key={day} className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: "rgba(14,165,233,0.08)", color: "#0369a1", border: "1px solid rgba(14,165,233,0.18)" }}>
                      Day {day} · {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(14,165,233,0.15)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((s, i) => (
                      <div key={i} className="rounded-xl px-4 py-3" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.06), rgba(56,189,248,0.04))", border: "1px solid rgba(14,165,233,0.15)" }}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>{s.name}</span>
                          {s.best_time && <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(14,165,233,0.10)", color: "#0369a1", border: "1px solid rgba(14,165,233,0.20)" }}>{s.best_time}</span>}
                        </div>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#0369a1" }}>✦ {s.why_special}</p>
                        {s.location && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>📍 {s.location}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Tab: Map ── */}
        {activeTab === "map" && (
          <div className="print:hidden rounded-2xl overflow-hidden" style={{ height: 560, border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
            <ItineraryMap itinerary={itinerary} />
          </div>
        )}

        {/* ── Print-only flat view (hidden on screen, visible when printing) ── */}
        <div className="print-section">
          {/* Logo + branding header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: "2px solid #b7e4c7" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #1b4332 0%, #0d9488 50%, #48cae4 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16, flexShrink: 0 }}>
              ✈
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#1a2e1a", letterSpacing: "-0.5px" }}>MyTravel</span>
            <span style={{ marginLeft: "auto", color: "#999", fontSize: 10 }}>Generated by MyTravel AI</span>
          </div>

          {/* Trip title + dates */}
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2e1a", margin: "0 0 4px", letterSpacing: "-0.5px" }}>
            {trip.destination} — {getDayCount(trip.start_date, trip.end_date)}-Day Itinerary
          </h1>
          <p style={{ color: "#666", fontSize: 12, margin: "0 0 20px" }}>{formatDateRange(trip.start_date, trip.end_date)}</p>

          {/* Summary */}
          {itinerary.summary && (
            <div style={{ background: "linear-gradient(135deg, #f0faf4, #e8f5ec)", border: "1px solid #b7e4c7", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <p style={{ color: "#1b4332", fontSize: 12, lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>{itinerary.summary}</p>
            </div>
          )}

          {/* Practical info */}
          {hasEssentials && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px" }}>Trip Essentials</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {pi.currency && <span style={{ background: "#f0faf4", color: "#1b4332", border: "1px solid #c7e8d0", borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>💵 {pi.currency}</span>}
                {pi.language && <span style={{ background: "#f0faf4", color: "#1b4332", border: "1px solid #c7e8d0", borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>🗣️ {pi.language}</span>}
                {pi.timezone && <span style={{ background: "#f0faf4", color: "#1b4332", border: "1px solid #c7e8d0", borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>🕐 {pi.timezone}</span>}
              </div>
              {transportTips.length > 0 && (
                <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                  {transportTips.map((tip, i) => (
                    <li key={i} style={{ fontSize: 11, color: "#555", padding: "2px 0", display: "flex", gap: 6 }}>
                      <span style={{ color: "#52b788" }}>›</span>{tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Packing */}
          {packingItems.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px" }}>Packing Suggestions</h3>
              <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
                {packingItems.map((item, i) => (
                  <li key={i} style={{ fontSize: 11, color: "#555", display: "flex", gap: 5 }}>
                    <span style={{ color: "#2d6a4f" }}>✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Day by Day ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 14px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e1a", textTransform: "uppercase", letterSpacing: "1px" }}>Day by Day</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #b7e4c7, transparent)" }} />
            <span style={{ fontSize: 10, color: "#999" }}>{itinerary.days?.length ?? 0} days</span>
          </div>

          {(itinerary.days ?? []).map((day) => (
            <div key={day.day} style={{ marginBottom: 16, border: "1px solid #d1e8d4", borderRadius: 12, overflow: "hidden" }}>
              {/* Day header */}
              <div style={{ background: "linear-gradient(135deg, #d8f3dc, #f0faf4)", padding: "10px 16px", borderBottom: "1px solid #d1e8d4" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#52b788", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Day {day.day} · {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2e1a", marginTop: 2 }}>{day.theme}</div>
                {day.area && <div style={{ fontSize: 10, color: "#666", marginTop: 1 }}>📍 {day.area}</div>}
              </div>

              <div style={{ padding: "10px 16px" }}>
                {/* Activities */}
                {day.activities.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    {day.activities.map((act, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 8, marginBottom: 8, borderBottom: i < day.activities.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                          {getCategoryIcon(act.category)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, fontSize: 12, color: "#1a2e1a" }}>{act.name}</span>
                            {act.time && <span style={{ fontSize: 10, color: "#999" }}>{act.time}</span>}
                            {act.duration && <span style={{ fontSize: 10, color: "#999" }}>· {act.duration}</span>}
                          </div>
                          {act.location && <div style={{ fontSize: 10, color: "#666", marginTop: 1 }}>📍 {act.location}</div>}
                          {act.why_chosen && <div style={{ fontSize: 10, color: "#1b4332", background: "#f0faf4", borderRadius: 6, padding: "3px 8px", marginTop: 4, fontStyle: "italic" }}>✦ {act.why_chosen}</div>}
                          {act.booking_tip && <div style={{ fontSize: 10, color: "#92400e", marginTop: 3 }}>📅 {act.booking_tip}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Restaurants */}
                {day.restaurants && day.restaurants.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>🍽️ Where to Eat</div>
                    {day.restaurants.map((r, i) => (
                      <div key={i} style={{ background: "linear-gradient(135deg, #fff8f0, #fff3e6)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: 11, color: "#1a2e1a" }}>{r.name}</span>
                          {r.meal && <span style={{ fontSize: 9, color: "#92400e", background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 10, padding: "1px 6px", textTransform: "capitalize" }}>{r.meal}</span>}
                          {r.cuisine && <span style={{ fontSize: 10, color: "#999" }}>· {r.cuisine}</span>}
                          {r.price_range && <span style={{ fontSize: 10, color: "#999", marginLeft: "auto" }}>{r.price_range}</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "#92400e", marginTop: 3 }}>✦ {r.famous_for}</div>
                        {r.insider_tip && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>💡 {r.insider_tip}</div>}
                        {r.location && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>📍 {r.location}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Hidden gems */}
                {day.offbeat_spots && day.offbeat_spots.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>🧭 Hidden Gems</div>
                    {day.offbeat_spots.map((s, i) => (
                      <div key={i} style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 11, color: "#1a2e1a" }}>{s.name}</span>
                          {s.best_time && <span style={{ fontSize: 9, color: "#0369a1", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 10, padding: "1px 6px", flexShrink: 0 }}>{s.best_time}</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "#0369a1", marginTop: 3 }}>✦ {s.why_special}</div>
                        {s.location && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>📍 {s.location}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Travel tip */}
                {day.travel_tip && (
                  <div style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 8, padding: "7px 10px", marginTop: 8, display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>💡</span>
                    <span style={{ fontSize: 10, color: "#92400e", lineHeight: 1.5 }}>{day.travel_tip}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* ── Where to Stay ── */}
          {itinerary.accommodations && itinerary.accommodations.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 14px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e1a", textTransform: "uppercase", letterSpacing: "1px" }}>🏕 Where to Stay</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #b7e4c7, transparent)" }} />
              </div>
              {itinerary.accommodations.map((zone, zi) => (
                <div key={zi} style={{ marginBottom: 12, border: "1px solid #d1e8d4", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.07), rgba(45,106,79,0.05))", padding: "10px 16px", borderBottom: "1px solid #d1e8d4" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: "#1a2e1a" }}>📍 {zone.zone}</span>
                      <span style={{ fontSize: 9, color: "#0369a1", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 10, padding: "1px 8px" }}>{zone.nights}</span>
                    </div>
                    {zone.location && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{zone.location}</div>}
                  </div>
                  <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {zone.options.map((opt, oi) => (
                      <div key={oi} style={{ background: "rgba(45,106,79,0.05)", border: "1px solid rgba(45,106,79,0.15)", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 12, color: "#1a2e1a" }}>{opt.name}</span>
                          <span style={{ fontSize: 9, color: "#1b4332", background: "rgba(45,106,79,0.1)", border: "1px solid rgba(45,106,79,0.2)", borderRadius: 10, padding: "1px 6px" }}>{opt.type}</span>
                          {opt.price_range && <span style={{ fontSize: 10, color: "#666", marginLeft: "auto" }}>{opt.price_range}</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "#333", lineHeight: 1.5 }}>{opt.description}</div>
                        {opt.location && <div style={{ fontSize: 10, color: "#666", marginTop: 3 }}>📍 {opt.location}</div>}
                        {opt.booking_tip && <div style={{ fontSize: 10, color: "#92400e", marginTop: 3 }}>⚠ {opt.booking_tip}</div>}
                        {opt.search_query && <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>🔍 Search: {opt.search_query}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Print footer */}
          <div style={{ marginTop: 32, paddingTop: 14, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#aaa" }}>✈ MyTravel — AI-powered travel planning</span>
            <span style={{ fontSize: 10, color: "#aaa" }}>{trip.destination} · {formatDateRange(trip.start_date, trip.end_date)}</span>
          </div>
        </div>
      </div>

      {/* Share modal */}
      {shareModalOpen && trip && (
        <ShareModal
          trip={trip}
          tripId={tripId}
          onClose={() => setShareModalOpen(false)}
          onTripChange={(updated) => {
            setTrip(updated);
          }}
        />
      )}
    </>
  );
}
