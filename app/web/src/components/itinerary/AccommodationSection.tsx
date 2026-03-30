"use client";

import { useState } from "react";
import type { AccommodationZone, AccommodationOption, Trip } from "@/types";

const TYPE_META: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  cabin:           { emoji: "🏕",  label: "Cabin",           color: "#1b4332", bg: "rgba(45,106,79,0.08)",   border: "rgba(45,106,79,0.2)"   },
  hotel:           { emoji: "🏨",  label: "Hotel",           color: "#0369a1", bg: "rgba(14,165,233,0.08)",  border: "rgba(14,165,233,0.2)"  },
  hostel:          { emoji: "🛖",  label: "Hostel",          color: "#92400e", bg: "rgba(212,160,23,0.08)",  border: "rgba(212,160,23,0.2)"  },
  glamping:        { emoji: "⛺",  label: "Glamping",        color: "#065f46", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)"  },
  resort:          { emoji: "✨",  label: "Resort",          color: "#6b21a8", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
  vacation_rental: { emoji: "🏡",  label: "Vacation Rental", color: "#9a3412", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.2)"  },
  camping:         { emoji: "🔥",  label: "Camping",         color: "#78350f", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
  boutique:        { emoji: "🏩",  label: "Boutique",        color: "#9d174d", bg: "rgba(236,72,153,0.08)",  border: "rgba(236,72,153,0.2)"  },
};

const DEFAULT_TYPE = { emoji: "🏠", label: "Stay", color: "#374151", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" };

function buildAirbnbUrl(searchQuery: string, trip: Trip): string {
  const params = new URLSearchParams({
    checkin: trip.start_date,
    checkout: trip.end_date,
    adults: String(trip.group_size),
  });
  return `https://www.airbnb.com/s/${encodeURIComponent(searchQuery)}/homes?${params}`;
}

function buildBookingUrl(searchQuery: string, trip: Trip): string {
  const params = new URLSearchParams({
    ss: searchQuery,
    checkin: trip.start_date,
    checkout: trip.end_date,
    group_adults: String(trip.group_size),
  });
  return `https://www.booking.com/searchresults.html?${params}`;
}

function OptionCard({ option, trip }: { option: AccommodationOption; trip: Trip }) {
  const meta = TYPE_META[option.type] ?? DEFAULT_TYPE;

  return (
    <div
      className="rounded-xl px-4 py-3.5"
      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
            {option.name}
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
          >
            {meta.emoji} {meta.label}
          </span>
        </div>
        {option.price_range && (
          <span className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--text-muted)" }}>
            {option.price_range}
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed mb-1.5" style={{ color: meta.color }}>
        {option.description}
      </p>

      {option.location && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>📍 {option.location}</p>
      )}

      {option.booking_tip && (
        <p className="text-xs mt-1.5 font-medium" style={{ color: "#92400e" }}>
          ⚠ {option.booking_tip}
        </p>
      )}

      {option.search_query && (
        <div className="flex gap-2 mt-2.5 flex-wrap">
          <a
            href={buildAirbnbUrl(option.search_query, trip)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "rgba(255,90,95,0.08)",
              color: "#c0392b",
              border: "1px solid rgba(255,90,95,0.2)",
              textDecoration: "none",
            }}
          >
            Search Airbnb →
          </a>
          <a
            href={buildBookingUrl(option.search_query, trip)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "rgba(0,98,168,0.08)",
              color: "#0062a8",
              border: "1px solid rgba(0,98,168,0.18)",
              textDecoration: "none",
            }}
          >
            Search Booking.com →
          </a>
        </div>
      )}
    </div>
  );
}

function ZoneCard({ zone, trip }: { zone: AccommodationZone; trip: Trip }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Zone header */}
      <button
        className="w-full text-left focus:outline-none"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, rgba(14,165,233,0.07), rgba(45,106,79,0.05))"
            : "white",
          borderBottom: isOpen ? "1px solid var(--border-light)" : "none",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setIsOpen((v) => !v)}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold" style={{ color: "var(--text-dark)" }}>
              📍 {zone.zone}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(14,165,233,0.1)", color: "#0369a1", border: "1px solid rgba(14,165,233,0.2)" }}
            >
              {zone.nights}
            </span>
          </div>
          {zone.location && (
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{zone.location}</div>
          )}
        </div>
        <span
          className="text-sm transition-transform"
          style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block", lineHeight: 1 }}
        >
          ▾
        </span>
      </button>

      {/* Options */}
      {isOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px 14px" }}>
          {zone.options.map((opt, i) => (
            <OptionCard key={i} option={opt} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  accommodations: AccommodationZone[];
  trip: Trip;
}

export default function AccommodationSection({ accommodations, trip }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const totalNights = accommodations.reduce((sum, z) => {
    const match = z.nights.match(/(\d+)/g);
    if (!match) return sum;
    if (match.length === 1) return sum + 1;
    return sum + (parseInt(match[1]) - parseInt(match[0]) + 1);
  }, 0);

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Section header */}
      <button
        className="w-full text-left focus:outline-none"
        style={{
          background: "linear-gradient(135deg, var(--bg-mint), white)",
          borderBottom: isOpen ? "1px solid var(--border-light)" : "none",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">🏕</span>
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--text-dark)" }}>
              Where to Stay
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {accommodations.length} {accommodations.length === 1 ? "zone" : "zones"} · {totalNights} nights
            </div>
          </div>
        </div>
        <span
          className="text-sm transition-transform"
          style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block", lineHeight: 1 }}
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 14px 16px" }}>
          {accommodations.map((zone, i) => (
            <ZoneCard key={i} zone={zone} trip={trip} />
          ))}
          <p className="text-xs text-center pt-1" style={{ color: "var(--text-faint)" }}>
            Booking links open pre-filtered searches with your dates and group size.
          </p>
        </div>
      )}
    </div>
  );
}
