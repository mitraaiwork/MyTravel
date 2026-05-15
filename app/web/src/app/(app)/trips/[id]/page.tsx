"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
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
  Download,
  Backpack,
  X,
} from "lucide-react";
import { tripsApi, itineraryApi } from "@/lib/api";
import { useItineraryStream } from "@/hooks/useItineraryStream";
import { formatDateRange, getCategoryIcon, getDayCount, getTripPhase } from "@/lib/utils";
import type { Trip, Itinerary, PackingList, LocalServicesResponse, LocalServiceCategory } from "@/types";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PackingListTab } from "@/components/itinerary/PackingListTab";
import { LocalServicesTab } from "@/components/itinerary/LocalServicesTab";
import { FeedbackTab } from "@/components/trips/FeedbackTab";
import { TodayTab } from "@/components/itinerary/TodayTab";
import { useInTripMode } from "@/hooks/useInTripMode";
import dynamic from "next/dynamic";
import DayCard from "@/components/itinerary/DayCard";
import AccommodationSection from "@/components/itinerary/AccommodationSection";
import RouteStopsPanel from "@/components/itinerary/RouteStopsPanel";
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
  const [chatOpen, setChatOpen] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"today" | "itinerary" | "stay" | "food" | "gems" | "map" | "packing" | "services" | "feedback">("itinerary");
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [packingLoading, setPackingLoading] = useState(false);
  const [packingError, setPackingError] = useState<string | null>(null);
  const [localServices, setLocalServices] = useState<LocalServicesResponse | null>(null);
  const [localServicesLoading, setLocalServicesLoading] = useState(false);
  const [localServicesError, setLocalServicesError] = useState(false);

  const { dayStreams, isComplete, error: streamError, status, startStream, reset } =
    useItineraryStream(tripId);
  const startedRef = useRef(false);

  const [practicalOpen, setPracticalOpen] = useState(true);
  const [destPhotoUrl, setDestPhotoUrl] = useState<string | null>(null);

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
        if (it) {
          setPackingLoading(true);
          itineraryApi.getPackingList(tripId)
            .then(setPackingList)
            .catch(() => setPackingError("Failed to load packing list."))
            .finally(() => setPackingLoading(false));
          setLocalServicesLoading(true);
          itineraryApi.getLocalServices(tripId)
            .then(setLocalServices)
            .catch(() => setLocalServicesError(true))
            .finally(() => setLocalServicesLoading(false));
        }
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
      setPackingLoading(true);
      itineraryApi.getPackingList(tripId)
        .then(setPackingList)
        .catch(() => setPackingError("Failed to load packing list."))
        .finally(() => setPackingLoading(false));
      setLocalServicesLoading(true);
      itineraryApi.getLocalServices(tripId)
        .then(setLocalServices)
        .catch(() => setLocalServicesError(true))
        .finally(() => setLocalServicesLoading(false));
    }).catch(() => null);
  }, [isComplete, tripId]);

  useEffect(() => {
    if (!trip?.destination) return;
    const query = trip.destination.split(",")[0].trim();
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        const url = data?.originalimage?.source || data?.thumbnail?.source;
        if (url) setDestPhotoUrl(url);
      })
      .catch(() => {});
  }, [trip?.destination]);

  const handleItineraryChange = useCallback((updated: Itinerary) => {
    setItinerary(updated);
  }, []);

  const { isInTrip, currentDay, nextActivity } = useInTripMode(trip, itinerary);

  useEffect(() => {
    if (isInTrip) setActiveTab("today");
  }, [isInTrip]);

  function handleOpenChat(message?: string) {
    setInitialChatMessage(message);
    setChatOpen(true);
  }

  function handleRetryStream() {
    reset();
    startedRef.current = false;
    setPackingList(null);
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
      {/* Destination photo banner */}
      {destPhotoUrl && (
        <div className="relative w-full rounded-2xl overflow-hidden mb-5 print:hidden" style={{ height: 200 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={destPhotoUrl}
            alt={trip.destination}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }}
          />
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <div className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">
              {getDayCount(trip.start_date, trip.end_date)}-Day Itinerary
            </div>
            <h1 className="text-white font-black text-2xl md:text-3xl leading-tight drop-shadow" style={{ letterSpacing: "-0.5px" }}>
              {trip.destination}
            </h1>
            <div className="text-white/75 text-sm mt-1">{formatDateRange(trip.start_date, trip.end_date)}</div>
          </div>
        </div>
      )}

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

    const totalDays = dayStreams.length;
    const doneDays = dayStreams.filter((d) => d.done && !d.hasError).length;
    const pct = isComplete ? 100 : totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0;
    const showProgress = totalDays > 0;

    const statusLabel = isComplete
      ? "Finalising your itinerary…"
      : showProgress
      ? `Generating Day ${Math.min(doneDays + 1, totalDays)} of ${totalDays}…`
      : "Fetching weather · Checking routes · Optimising activities";

    return (
      <div className="max-w-5xl">{header}
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          style={{ background: "#0f1e14", borderRadius: 16, border: "1px solid rgba(82,183,136,0.15)" }}
        >
          <div
            className="demo-orb"
            style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg,rgba(45,106,79,0.3),rgba(72,202,228,0.25))",
              border: "1px solid rgba(82,183,136,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, marginBottom: 16,
            }}
          >
            🌿
          </div>
          <div style={{ fontWeight: 600, color: "#d4e8d4", fontSize: 15, marginBottom: 8 }}>
            MyTravel AI Planner is crafting your trip…
          </div>
          <div style={{ fontSize: 13, color: "#7dc99a", marginBottom: 20 }}>
            {statusLabel}
          </div>
          {showProgress ? (
            <>
              <div style={{ width: 240, background: "rgba(82,183,136,0.2)", borderRadius: 99, height: 4, overflow: "hidden", marginBottom: 10 }}>
                <div
                  className="transition-all duration-700"
                  style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#52b788,#48cae4)", borderRadius: 99 }}
                />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#95d5b2" }}>{pct}%</span>
            </>
          ) : (
            <div className="demo-dots" style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#52b788", display: "inline-block" }} />
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#52b788", display: "inline-block" }} />
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#52b788", display: "inline-block" }} />
            </div>
          )}
        </div>
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

  const allRestaurants: { day: number; date: string; city?: string; items: Restaurant[] }[] =
    (itinerary.days ?? [])
      .filter((d) => d.restaurants && d.restaurants.length > 0)
      .map((d) => ({ day: d.day, date: d.date, city: d.city, items: d.restaurants! }));

  const allGems: { day: number; date: string; items: OffbeatSpot[] }[] =
    (itinerary.days ?? [])
      .filter((d) => d.offbeat_spots && d.offbeat_spots.length > 0)
      .map((d) => ({ day: d.day, date: d.date, items: d.offbeat_spots! }));

  function dedupByName<T extends { name: string }>(arr: T[]): T[] {
    const seen = new Set<string>();
    return arr.filter((item) => {
      const key = item.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const phase = getTripPhase(trip);

  const TABS = [
    ...(isInTrip ? [{ id: "today" as const, label: "Today", emoji: "📍" }] : []),
    { id: "itinerary" as const, label: "Itinerary",    emoji: "📅" },
    { id: "stay"      as const, label: "Stay",         emoji: "🏕"  },
    { id: "food"      as const, label: "Food",         emoji: "🍽️"  },
    { id: "gems"      as const, label: "Hidden Gems",  emoji: "🧭"  },
    { id: "map"       as const, label: "Map",          emoji: "🗺️"  },
    { id: "packing"   as const, label: "Packing",      emoji: "🎒"  },
    { id: "services"  as const, label: "Services",     emoji: "🏥"  },
    { id: "feedback"  as const, label: "Feedback",     emoji: "⭐"  },
  ];

  async function handleGeneratePacking() {
    setPackingLoading(true);
    setPackingError(null);
    try {
      const list = await itineraryApi.getPackingList(tripId);
      setPackingList(list);
    } catch {
      setPackingError("Failed to generate packing list. Please try again.");
    } finally {
      setPackingLoading(false);
    }
  }

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

      {/* Floating AI Chat button */}
      {!chatOpen && itinerary && (
        <button
          onClick={() => handleOpenChat()}
          className="ask-ai-btn fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-white text-sm font-medium shadow-lg print:hidden"
          style={{ background: "linear-gradient(135deg, #0d9488, #2d6a4f)" }}
        >
          <span>✈️</span> Ask AI
        </button>
      )}

      {/* Chat panel */}
      {chatOpen && (
        <ChatPanel
          tripId={tripId}
          phase={isInTrip ? "in-trip" : phase}
          onClose={() => { setChatOpen(false); setInitialChatMessage(undefined); }}
          initialMessage={initialChatMessage}
        />
      )}

      <div className="max-w-5xl">
        {header}

        {/* Phase banner */}
        {itinerary && phase !== "planning" && (
          <div
            className="mb-4 flex items-center justify-between px-4 py-3 rounded-xl text-sm print:hidden"
            style={
              phase === "in-trip"
                ? { background: "linear-gradient(135deg,rgba(16,185,129,0.08),rgba(52,211,153,0.05))", border: "1px solid rgba(16,185,129,0.25)", color: "#065f46" }
                : phase === "post-trip"
                ? { background: "linear-gradient(135deg,rgba(245,158,11,0.08),rgba(252,211,77,0.05))", border: "1px solid rgba(245,158,11,0.25)", color: "#92400e" }
                : { background: "linear-gradient(135deg,rgba(13,148,136,0.08),rgba(45,106,79,0.05))", border: "1px solid rgba(13,148,136,0.25)", color: "#134e4a" }
            }
          >
            <div className="flex items-center gap-2">
              {phase === "in-trip" && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              <span>
                {phase === "pre-trip" && `Departure in ${Math.max(0, Math.ceil((new Date(trip.start_date).getTime() - Date.now()) / 86400000))} days — start packing!`}
                {phase === "in-trip" && "You're on this trip right now — ask the AI concierge for real-time help"}
                {phase === "post-trip" && "Trip completed — share your feedback to improve future itineraries"}
              </span>
            </div>
            {phase === "post-trip" && (
              <button onClick={() => setActiveTab("feedback")} className="text-amber-700 underline text-xs ml-2 shrink-0">
                Leave feedback
              </button>
            )}
          </div>
        )}

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

        {/* ── Tab: Today ── */}
        {activeTab === "today" && currentDay && (
          <div className="print:hidden">
            <TodayTab
              trip={trip}
              currentDay={currentDay}
              nextActivity={nextActivity}
              totalDays={itinerary.days.length}
              onOpenChat={handleOpenChat}
            />
          </div>
        )}

        {/* ── Tab: Itinerary ── */}
        {activeTab === "itinerary" && (
          <div className="print:hidden">
            {/* Trip Essentials + Packing */}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {(hasEssentials || itinerary.weather) && (
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
                      {/* Weather */}
                      {itinerary.weather && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Expected weather</p>
                          <div className="flex flex-wrap gap-2 mb-1.5">
                            <span className="bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-3 py-1 text-xs font-medium">
                              🌤 {itinerary.weather.dominant_condition}
                            </span>
                            <span className="bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-3 py-1 text-xs font-medium">
                              🌡 {itinerary.weather.avg_high_c}° / {itinerary.weather.avg_low_c}°C
                            </span>
                            {itinerary.weather.rain_days > 0 && (
                              <span className="bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-3 py-1 text-xs font-medium">
                                🌧 {itinerary.weather.rain_days} rainy day{itinerary.weather.rain_days > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          {!itinerary.weather.is_forecast && (
                            <p className="text-xs text-gray-400 italic">Based on historical averages for this time of year</p>
                          )}
                        </div>
                      )}
                      {/* Country facts */}
                      {(pi.currency || pi.language || pi.timezone) && (
                        <div className="flex flex-wrap gap-2">
                          {pi.currency && <span className="bg-[#f0faf4] text-[#1b4332] border border-[#c7e8d0] rounded-full px-3 py-1 text-xs font-medium">💵 {pi.currency}</span>}
                          {pi.language && <span className="bg-[#f0faf4] text-[#1b4332] border border-[#c7e8d0] rounded-full px-3 py-1 text-xs font-medium">🗣️ {pi.language}</span>}
                          {pi.timezone && <span className="bg-[#f0faf4] text-[#1b4332] border border-[#c7e8d0] rounded-full px-3 py-1 text-xs font-medium">🕐 {pi.timezone}</span>}
                        </div>
                      )}
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
              {/* Multi-city route overview */}
              {(itinerary.route_overview?.length ?? 0) > 1 && (
                <div
                  className="mb-4 rounded-2xl px-5 py-4"
                  style={{
                    background: "linear-gradient(135deg, #1e3a5f 0%, #1a3352 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60" style={{ color: "#93c5fd" }}>
                    Your Route
                  </div>
                  <div className="flex items-start gap-2 flex-wrap">
                    {(itinerary.route_overview ?? []).map((stop, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {i > 0 && (
                          <span style={{ color: "#60a5fa", fontSize: 16 }}>→</span>
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm" style={{ color: "#e0f2fe" }}>
                            {stop.city}
                          </span>
                          <span className="text-xs" style={{ color: "#7dd3fc" }}>
                            {stop.nights} night{stop.nights !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outbound route stops — shown before Day 1 */}
              {itinerary.route_stops && trip?.origin && (itinerary.route_stops.outbound?.length ?? 0) > 0 && (
                <RouteStopsPanel
                  origin={trip.origin}
                  destination={itinerary.destination}
                  journey={{ outbound: itinerary.route_stops.outbound }}
                />
              )}
              {(itinerary.days ?? []).length === 0 ? (
                <div className="card border-amber-100 bg-amber-50 text-center py-10">
                  <p className="text-amber-700 text-sm mb-4">This itinerary appears empty and needs to be regenerated.</p>
                  <button onClick={handleRetryStream} className="btn-primary text-sm">Regenerate itinerary</button>
                </div>
              ) : (
                <>
                {(itinerary.days ?? []).map((day, i) => {
                  const dt = day.day_type;
                  if (dt === "travel_outbound" || dt === "travel_return") {
                    const label = dt === "travel_outbound" ? "Outbound Travel Day" : "Return Travel Day";
                    const hint = dt === "travel_outbound"
                      ? "En-route stops for this day are shown above."
                      : "En-route stops for this day are shown below.";
                    return (
                      <div
                        key={day.day}
                        className="rounded-2xl mb-4 px-5 py-4 flex items-center gap-4"
                        style={{ border: "1px solid var(--border-mid)", background: "var(--bg-cream)" }}
                      >
                        <div className="text-3xl">🚗</div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--forest)" }}>
                            Day {day.day} · {label}
                          </div>
                          <div className="text-sm font-semibold" style={{ color: "var(--text-dark)" }}>
                            {day.date}
                          </div>
                          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            {hint}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={day.day}>
                      {day.city_transition && (
                        <div
                          className="rounded-xl px-4 py-3 mb-2 mt-1 flex items-center gap-3 text-sm font-semibold"
                          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.35)", color: "#4338ca" }}
                        >
                          🚗 <span>~{Math.round(day.city_transition.drive_hours)}h drive</span>
                          <span className="font-normal text-xs" style={{ color: "#6366f1" }}>{day.city_transition.from_city} → {day.city_transition.to_city}</span>
                        </div>
                      )}
                      {(dt === "partial_arrival" && day.arrival_time) && (
                        <div className="rounded-xl px-4 py-2.5 mb-2 flex items-center gap-2 text-xs font-medium" style={{ background: "rgba(45,106,79,0.07)", border: "1px solid var(--border-mid)", color: "var(--forest)" }}>
                          🏁 You arrive at {day.arrival_time} — afternoon plan from {day.arrival_time} onwards
                        </div>
                      )}
                      {(dt === "partial_departure" && day.departure_time) && (
                        <div className="rounded-xl px-4 py-2.5 mb-2 flex items-center gap-2 text-xs font-medium" style={{ background: "rgba(45,106,79,0.07)", border: "1px solid var(--border-mid)", color: "var(--forest)" }}>
                          🛣 You leave at {day.departure_time} — morning plan until {day.departure_time}
                        </div>
                      )}
                      <DayCard
                        day={day}
                        tripId={tripId}
                        onItineraryChange={handleItineraryChange}
                        defaultOpen={i === 0}
                        hideRestaurants
                        hideOffbeat
                      />
                    </div>
                  );
                })}
                {/* Return route stops — shown after the last day */}
                {itinerary.route_stops && trip?.origin && (itinerary.route_stops.return?.length ?? 0) > 0 && (
                  <RouteStopsPanel
                    origin={trip.origin}
                    destination={itinerary.destination}
                    journey={{ outbound: [], return: itinerary.route_stops.return }}
                  />
                )}
                </>
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
        {activeTab === "food" && (() => {
          const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];
          const sortByMeal = (arr: Restaurant[]) =>
            [...arr].sort((a, b) => {
              const ai = MEAL_ORDER.indexOf((a.meal ?? "").toLowerCase());
              const bi = MEAL_ORDER.indexOf((b.meal ?? "").toLowerCase());
              return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            });

          const flat = sortByMeal(dedupByName(allRestaurants.flatMap(({ items }) => items)));

          const orderedCities = (() => {
            const seen = new Set<string>();
            const result: string[] = [];
            for (const { city } of allRestaurants) {
              const key = city ?? "";
              if (!seen.has(key)) { seen.add(key); result.push(key); }
            }
            return result;
          })();
          const isMultiCity = orderedCities.filter(Boolean).length > 1;

          const renderRestaurantCard = (r: Restaurant, i: number) => (
            <div key={i} className="rounded-xl px-4 py-3" style={{ background: "linear-gradient(135deg, #fff8f0, #fff3e6)", border: "1px solid rgba(212,160,23,0.18)" }}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>{r.name}</span>
                  {r.cuisine && <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {r.cuisine}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.meal && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(212,160,23,0.12)", color: "#92400e", border: "1px solid rgba(212,160,23,0.2)" }}>
                      {r.meal}
                    </span>
                  )}
                  {r.rating !== undefined && (
                    <span className="text-xs font-bold" style={{ color: "#b45309" }}>★ {r.rating.toFixed(1)}</span>
                  )}
                  {r.price_range && <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{r.price_range}</span>}
                </div>
              </div>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#92400e" }}>✦ {r.famous_for}</p>
              {r.insider_tip && <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>💡 {r.insider_tip}</p>}
              {r.location && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>📍 {r.location}</p>}
              {r.website && (
                <a
                  href={r.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs mt-2 font-medium"
                  style={{ color: "#92400e", textDecoration: "underline", textUnderlineOffset: 2 }}
                >
                  🔗 Visit website
                </a>
              )}
            </div>
          );

          const renderList = (restaurants: Restaurant[]) => (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {restaurants.map(renderRestaurantCard)}
            </div>
          );

          return (
            <div className="print:hidden">
              {flat.length === 0 ? (
                <div className="card text-center py-12">
                  <div className="text-4xl mb-3">🍽️</div>
                  <p className="text-sm font-semibold text-[#1a2e1a] mb-1">No restaurant suggestions yet</p>
                  <p className="text-xs text-gray-400">Regenerate your itinerary to get local dining recommendations.</p>
                </div>
              ) : isMultiCity ? (
                orderedCities.map((cityKey) => {
                  const cityRestaurants = sortByMeal(dedupByName(allRestaurants
                    .filter(({ city }) => (city ?? "") === cityKey)
                    .flatMap(({ items }) => items)));
                  if (!cityRestaurants.length) return null;
                  return (
                    <div key={cityKey || "_"} className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: "rgba(45,106,79,0.1)", color: "#1b4332", border: "1px solid rgba(45,106,79,0.2)" }}>
                          📍 {cityKey || itinerary.destination}
                        </span>
                        <div className="flex-1 h-px" style={{ background: "rgba(45,106,79,0.15)" }} />
                      </div>
                      {renderList(cityRestaurants)}
                    </div>
                  );
                })
              ) : (
                renderList(flat)
              )}
            </div>
          );
        })()}

        {/* ── Tab: Hidden Gems ── */}
        {activeTab === "gems" && (
          <div className="print:hidden">
            {allGems.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">🧭</div>
                <p className="text-sm font-semibold text-[#1a2e1a] mb-1">No hidden gems yet</p>
                <p className="text-xs text-gray-400">Regenerate your itinerary to discover offbeat spots most tourists miss.</p>
              </div>
            ) : (() => {
              const seenGems = new Set<string>();
              return allGems.map(({ day, date, items }) => {
                const uniqueItems = items.filter((s) => {
                  const key = s.name.toLowerCase().trim();
                  if (seenGems.has(key)) return false;
                  seenGems.add(key);
                  return true;
                });
                if (!uniqueItems.length) return null;
                return (
                  <div key={day} className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: "rgba(14,165,233,0.08)", color: "#0369a1", border: "1px solid rgba(14,165,233,0.18)" }}>
                        Day {day} · {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div className="flex-1 h-px" style={{ background: "rgba(14,165,233,0.15)" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {uniqueItems.map((s, i) => (
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
                );
              });
            })()
            }
          </div>
        )}

        {/* ── Tab: Map ── */}
        {activeTab === "map" && (
          <div className="print:hidden rounded-2xl overflow-hidden" style={{ height: 560, border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
            <ItineraryMap itinerary={itinerary} />
          </div>
        )}

        {/* ── Tab: Packing ── */}
        {activeTab === "packing" && (
          <div className="print:hidden">
            <PackingListTab
              tripId={tripId}
              packingList={packingList}
              isLoading={packingLoading}
              onGenerate={handleGeneratePacking}
              error={packingError}
            />
          </div>
        )}

        {/* ── Tab: Services ── */}
        {activeTab === "services" && (
          <div className="print:hidden">
            <LocalServicesTab
              destination={trip.destination}
              data={localServices}
              loading={localServicesLoading}
              error={localServicesError}
            />
          </div>
        )}

        {/* ── Tab: Feedback ── */}
        {activeTab === "feedback" && (
          <div className="print:hidden">
            <FeedbackTab tripId={tripId} phase={phase} />
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

          {/* ── Multi-city Route Overview ── */}
          {(itinerary.route_overview?.length ?? 0) > 1 && (
            <div style={{ marginBottom: 20, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 12, padding: "10px 16px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Your Route</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flexWrap: "wrap" }}>
                {(itinerary.route_overview ?? []).map((stop, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {i > 0 && <span style={{ color: "#6366f1", fontSize: 14, fontWeight: 700 }}>→</span>}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#1e1b4b" }}>{stop.city}</div>
                      <div style={{ fontSize: 10, color: "#6366f1" }}>{stop.nights} night{stop.nights !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── En Route: Outbound ── */}
          {itinerary.route_stops && trip?.origin && (itinerary.route_stops.outbound?.length ?? 0) > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 10px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e1a", textTransform: "uppercase", letterSpacing: "1px" }}>🚗 En Route: {trip.origin.split(",")[0]} → {itinerary.destination.split(",")[0]}</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #b7e4c7, transparent)" }} />
              </div>
              <p style={{ fontSize: 9, color: "#999", margin: "0 0 10px", fontStyle: "italic" }}>Suggested stops on the drive — skip if flying</p>
              {itinerary.route_stops.outbound.map((stop, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 10px", marginBottom: 6, background: "#f8fdf9", border: "1px solid #d1e8d4", borderRadius: 8 }}>
                  <div style={{ fontSize: 16, flexShrink: 0, width: 28, textAlign: "center" }}>{getCategoryIcon(stop.category)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 11, color: "#1a2e1a" }}>{stop.name}</span>
                      {stop.duration && <span style={{ fontSize: 9, color: "#666", background: "white", border: "1px solid #d1e8d4", borderRadius: 10, padding: "1px 6px" }}>⏱ {stop.duration}</span>}
                    </div>
                    {stop.location && <div style={{ fontSize: 9, color: "#666", marginTop: 1 }}>📍 {stop.location}</div>}
                    <div style={{ fontSize: 9, color: "#1b4332", marginTop: 3, fontStyle: "italic" }}>✦ {stop.why_stop}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Day by Day ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 14px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e1a", textTransform: "uppercase", letterSpacing: "1px" }}>Day by Day</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #b7e4c7, transparent)" }} />
            <span style={{ fontSize: 10, color: "#999" }}>{itinerary.days?.length ?? 0} days</span>
          </div>

          {(itinerary.days ?? []).map((day) => (
            <Fragment key={day.day}>
            {day.city_transition && (
              <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 8, padding: "6px 12px", marginBottom: 6, marginTop: 4, display: "flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 600, color: "#4338ca" }}>
                <span>🚗</span>
                <span>~{Math.round(day.city_transition.drive_hours)}h drive</span>
                <span style={{ fontWeight: 400, color: "#6366f1" }}>{day.city_transition.from_city} → {day.city_transition.to_city}</span>
              </div>
            )}
            <div style={{ marginBottom: 16, border: "1px solid #d1e8d4", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg, #d8f3dc, #f0faf4)", padding: "10px 16px", borderBottom: "1px solid #d1e8d4" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#52b788", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Day {day.day} · {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2e1a", marginTop: 2 }}>{day.theme}</div>
                {day.area && <div style={{ fontSize: 10, color: "#666", marginTop: 1 }}>📍 {day.area}</div>}
                {(day.sunrise || day.sunset) && (
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    {day.sunrise && <span style={{ fontSize: 10, color: "#555" }}>🌅 Sunrise {day.sunrise}</span>}
                    {day.sunset  && <span style={{ fontSize: 10, color: "#555" }}>🌇 Sunset {day.sunset}</span>}
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 16px" }}>
                {day.day_type === "partial_arrival" && day.arrival_time && (
                  <div style={{ background: "rgba(45,106,79,0.07)", border: "1px solid #b7e4c7", borderRadius: 6, padding: "5px 10px", marginBottom: 8, fontSize: 10, color: "#1b4332" }}>
                    🏁 Arrive at {day.arrival_time} — afternoon plan from {day.arrival_time} onwards
                  </div>
                )}
                {day.day_type === "partial_departure" && day.departure_time && (
                  <div style={{ background: "rgba(45,106,79,0.07)", border: "1px solid #b7e4c7", borderRadius: 6, padding: "5px 10px", marginBottom: 8, fontSize: 10, color: "#1b4332" }}>
                    🛣 Depart at {day.departure_time} — morning plan until {day.departure_time}
                  </div>
                )}
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
                {day.travel_tip && (
                  <div style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 8, padding: "7px 10px", marginTop: 8, display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>💡</span>
                    <span style={{ fontSize: 10, color: "#92400e", lineHeight: 1.5 }}>{day.travel_tip}</span>
                  </div>
                )}
              </div>
            </div>
            </Fragment>
          ))}

          {/* ── En Route: Return ── */}
          {itinerary.route_stops && trip?.origin && (itinerary.route_stops.return?.length ?? 0) > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 10px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e1a", textTransform: "uppercase", letterSpacing: "1px" }}>🚗 Return Route: {itinerary.destination.split(",")[0]} → {trip.origin.split(",")[0]}</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #b7e4c7, transparent)" }} />
              </div>
              <p style={{ fontSize: 9, color: "#999", margin: "0 0 10px", fontStyle: "italic" }}>Suggested stops on the drive back — skip if flying</p>
              {itinerary.route_stops.return!.map((stop, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 10px", marginBottom: 6, background: "#f8fdf9", border: "1px solid #d1e8d4", borderRadius: 8 }}>
                  <div style={{ fontSize: 16, flexShrink: 0, width: 28, textAlign: "center" }}>{getCategoryIcon(stop.category)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 11, color: "#1a2e1a" }}>{stop.name}</span>
                      {stop.duration && <span style={{ fontSize: 9, color: "#666", background: "white", border: "1px solid #d1e8d4", borderRadius: 10, padding: "1px 6px" }}>⏱ {stop.duration}</span>}
                    </div>
                    {stop.location && <div style={{ fontSize: 9, color: "#666", marginTop: 1 }}>📍 {stop.location}</div>}
                    <div style={{ fontSize: 9, color: "#1b4332", marginTop: 3, fontStyle: "italic" }}>✦ {stop.why_stop}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Dining Guide ── */}
          {allRestaurants.length > 0 && (() => {
            const MEAL_ORDER_P = ["breakfast", "lunch", "dinner", "snack"];
            const sortByMealP = (arr: Restaurant[]) =>
              [...arr].sort((a, b) => {
                const ai = MEAL_ORDER_P.indexOf((a.meal ?? "").toLowerCase());
                const bi = MEAL_ORDER_P.indexOf((b.meal ?? "").toLowerCase());
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
              });

            const orderedCities = (() => {
              const seen = new Set<string>();
              const result: string[] = [];
              for (const { city } of allRestaurants) {
                const key = city ?? "";
                if (!seen.has(key)) { seen.add(key); result.push(key); }
              }
              return result;
            })();
            const isMultiCity = orderedCities.filter(Boolean).length > 1;

            const renderPrintRestaurant = (r: Restaurant, i: number) => (
              <div key={i} style={{ background: "linear-gradient(135deg, #fff8f0, #fff3e6)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 11, color: "#1a2e1a" }}>{r.name}</span>
                  {r.cuisine && <span style={{ fontSize: 10, color: "#999" }}>· {r.cuisine}</span>}
                  {r.meal && <span style={{ fontSize: 9, fontWeight: 700, color: "#92400e", background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 10, padding: "1px 6px", textTransform: "capitalize" }}>{r.meal}</span>}
                  {r.rating !== undefined && <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309" }}>★ {r.rating.toFixed(1)}</span>}
                  {r.price_range && <span style={{ fontSize: 10, color: "#999", marginLeft: "auto" }}>{r.price_range}</span>}
                </div>
                <div style={{ fontSize: 10, color: "#92400e", marginTop: 3 }}>✦ {r.famous_for}</div>
                {r.insider_tip && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>💡 {r.insider_tip}</div>}
                {r.location && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>📍 {r.location}</div>}
                {r.website && <div style={{ fontSize: 10, color: "#92400e", marginTop: 2 }}>🔗 {r.website}</div>}
              </div>
            );

            return (
              <div style={{ marginTop: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 14px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e1a", textTransform: "uppercase", letterSpacing: "1px" }}>🍽️ Dining Guide</span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(212,160,23,0.4), transparent)" }} />
                </div>
                {isMultiCity ? (
                  orderedCities.map((cityKey) => {
                    const cityRestaurants = sortByMealP(dedupByName(allRestaurants
                      .filter(({ city }) => (city ?? "") === cityKey)
                      .flatMap(({ items }) => items)));
                    if (!cityRestaurants.length) return null;
                    return (
                      <div key={cityKey || "_"} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#1b4332", background: "rgba(45,106,79,0.08)", border: "1px solid rgba(45,106,79,0.2)", borderRadius: 6, padding: "3px 10px", display: "inline-block", marginBottom: 8 }}>
                          📍 {cityKey || itinerary.destination}
                        </div>
                        {cityRestaurants.map(renderPrintRestaurant)}
                      </div>
                    );
                  })
                ) : (
                  sortByMealP(dedupByName(allRestaurants.flatMap(({ items }) => items))).map(renderPrintRestaurant)
                )}
              </div>
            );
          })()}

          {/* ── Hidden Gems ── */}
          {allGems.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 14px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e1a", textTransform: "uppercase", letterSpacing: "1px" }}>🧭 Hidden Gems</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(14,165,233,0.4), transparent)" }} />
              </div>
              {(() => {
                const seenPrintGems = new Set<string>();
                return allGems.map(({ day, date, items }) => {
                  const uniqueItems = items.filter((s) => {
                    const key = s.name.toLowerCase().trim();
                    if (seenPrintGems.has(key)) return false;
                    seenPrintGems.add(key);
                    return true;
                  });
                  if (!uniqueItems.length) return null;
                  return (
                <div key={day} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, paddingBottom: 4, borderBottom: "1px solid rgba(14,165,233,0.15)" }}>
                    Day {day} · {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                  {uniqueItems.map((s, i) => (
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
                  );
                });
              })()}
            </div>
          )}

          {/* ── Where to Stay ── */}
          {itinerary.accommodations && itinerary.accommodations.length > 0 && (
            <div style={{ marginTop: 28 }}>
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

          {/* ── Packing List ── */}
          {packingList ? (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 10px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e1a", textTransform: "uppercase", letterSpacing: "1px" }}>🎒 Packing List</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #b7e4c7, transparent)" }} />
              </div>
              {packingList.weather_note && (
                <div style={{ fontSize: 10, color: "#0369a1", background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 6, padding: "4px 8px", marginBottom: 8 }}>
                  🌤 {packingList.weather_note}
                </div>
              )}
              {packingList.categories.map((cat) => (
                <div key={cat.name} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                    {cat.icon} {cat.name}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 16px" }}>
                    {cat.items.map((item, i) => (
                      <div key={i} style={{ fontSize: 10, color: "#555", display: "flex", gap: 4, alignItems: "flex-start" }}>
                        <span style={{ color: item.essential ? "#d97706" : "#2d6a4f", flexShrink: 0 }}>{item.essential ? "★" : "·"}</span>
                        <span>{item.label}{item.note && <span style={{ color: "#999", fontSize: 9 }}> ({item.note})</span>}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : packingItems.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 10px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e1a", textTransform: "uppercase", letterSpacing: "1px" }}>🎒 Packing Suggestions</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #b7e4c7, transparent)" }} />
              </div>
              <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
                {packingItems.map((item, i) => (
                  <li key={i} style={{ fontSize: 11, color: "#555", display: "flex", gap: 5 }}>
                    <span style={{ color: "#2d6a4f" }}>✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Local Services & Emergency Support ── */}
          {localServices && !localServices.not_applicable && (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 14px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e1a", textTransform: "uppercase", letterSpacing: "1px" }}>🏥 Local Services &amp; Emergency Support</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(239,68,68,0.35), transparent)" }} />
              </div>
              {(() => {
                const PRINT_STYLE: Record<string, { bg: string; border: string; accent: string }> = {
                  emergency: { bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.2)",  accent: "#dc2626" },
                  hospital:  { bg: "rgba(14,165,233,0.06)", border: "rgba(14,165,233,0.2)", accent: "#0369a1" },
                  pharmacy:  { bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)", accent: "#065f46" },
                  grocery:   { bg: "rgba(45,106,79,0.06)",  border: "rgba(45,106,79,0.2)",  accent: "#1b4332" },
                  atm:       { bg: "rgba(212,160,23,0.06)", border: "rgba(212,160,23,0.2)", accent: "#92400e" },
                  embassy:   { bg: "rgba(139,92,246,0.06)", border: "rgba(139,92,246,0.2)", accent: "#5b21b6" },
                };
                const renderCat = (cat: LocalServiceCategory) => {
                  const s = PRINT_STYLE[cat.id] ?? { bg: "rgba(100,100,100,0.06)", border: "rgba(100,100,100,0.2)", accent: "#444" };
                  return (
                    <div key={cat.id} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5, paddingBottom: 3, borderBottom: `1px solid ${s.border}` }}>
                        {cat.emoji} {cat.label}
                      </div>
                      {cat.items.length === 0 && cat.not_found_note && (
                        <div style={{ fontSize: 10, color: "#999", fontStyle: "italic" }}>{cat.not_found_note}</div>
                      )}
                      {cat.items.map((item, i) => (
                        <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: "5px 8px", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 11, color: "#1a2e1a" }}>{item.name}</span>
                            {item.hours && <span style={{ fontSize: 9, color: s.accent, flexShrink: 0 }}>🕐 {item.hours}</span>}
                          </div>
                          {item.note    && <div style={{ fontSize: 10, color: s.accent, marginTop: 2 }}>{item.note}</div>}
                          {item.address && <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>📍 {item.address}</div>}
                          {item.phone   && <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>📞 {item.phone}</div>}
                          {item.website && <div style={{ fontSize: 10, color: s.accent, marginTop: 2 }}>🌐 {item.website}</div>}
                        </div>
                      ))}
                    </div>
                  );
                };
                if (localServices.multi_city && localServices.cities?.length) {
                  return localServices.cities.map((cityData) => (
                    <div key={cityData.city_name} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#0369a1", background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.18)", borderRadius: 6, padding: "3px 10px", display: "inline-block", marginBottom: 8 }}>
                        📍 {cityData.city_name}
                      </div>
                      {cityData.categories.map(renderCat)}
                    </div>
                  ));
                }
                if (localServices.categories?.length) {
                  return (
                    <>
                      {localServices.reference_city && (
                        <div style={{ fontSize: 10, color: "#666", marginBottom: 10 }}>📍 Services near {localServices.reference_city}</div>
                      )}
                      {localServices.categories.map(renderCat)}
                    </>
                  );
                }
                return null;
              })()}
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
