"use client";

import { useState } from "react";
import {
  Clock,
  MapPin,
  ExternalLink,
  Cloud,
  CalendarCheck,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";
import { itineraryApi } from "@/lib/api";
import { getCategoryColor, getCategoryIcon, truncate } from "@/lib/utils";
import type { Activity, Itinerary } from "@/types";

interface ActivityCardProps {
  activity: Activity;
  index: number;
  dayNumber: number;
  tripId: string;
  onItineraryChange: (updated: Itinerary) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
  readOnly?: boolean;
}

// Category badge colours matching the demo
function getCatBadgeStyle(category: string): React.CSSProperties {
  const map: Record<string, [string, string, string]> = {
    food:          ["rgba(212,160,23,0.12)",  "#d4a017", "rgba(212,160,23,0.25)"],
    culture:       ["rgba(124,58,237,0.10)",  "#7c3aed", "rgba(124,58,237,0.20)"],
    nature:        ["rgba(64,145,108,0.12)",  "#40916c", "rgba(64,145,108,0.25)"],
    adventure:     ["rgba(220,38,38,0.10)",   "#dc2626", "rgba(220,38,38,0.22)"],
    shopping:      ["rgba(199,123,85,0.12)",  "#c77b55", "rgba(199,123,85,0.25)"],
    nightlife:     ["rgba(79,70,229,0.10)",   "#4f46e5", "rgba(79,70,229,0.22)"],
    transport:     ["rgba(72,202,228,0.12)",  "#0ea5e9", "rgba(72,202,228,0.25)"],
    wellness:      ["rgba(13,148,136,0.10)",  "#0d9488", "rgba(13,148,136,0.22)"],
    accommodation: ["rgba(245,158,11,0.12)",  "#d97706", "rgba(245,158,11,0.25)"],
  };
  const [bg, color, border] = map[category] ?? ["rgba(120,140,130,0.10)", "#6e9678", "rgba(120,140,130,0.18)"];
  return {
    background: bg,
    color,
    border: `1px solid ${border}`,
    borderRadius: "var(--r-full)",
    padding: "2px 9px",
    fontSize: "11px",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    whiteSpace: "nowrap" as const,
  };
}

export default function ActivityCard({
  activity,
  index,
  dayNumber,
  tripId,
  onItineraryChange,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  readOnly,
}: ActivityCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [imgError, setImgError] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${activity.name}"?`)) return;
    setIsDeleting(true);
    try {
      onItineraryChange(await itineraryApi.deleteActivity(tripId, dayNumber, index));
    } catch {
      setIsDeleting(false);
    }
  }

  const hasExtras =
    activity.duration ||
    activity.location ||
    activity.booking_tip ||
    activity.weather_note ||
    activity.website;

  return (
    <div
      className="activity-item"
      style={{
        display: "grid",
        gridTemplateColumns: "52px 1fr auto",
        gap: "12px",
        alignItems: "start",
        padding: "14px 0",
        borderBottom: isLast ? "none" : "1px solid var(--border-light)",
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Time column */}
      <div
        className="text-xs font-bold pt-0.5"
        style={{ color: "var(--text-muted)", letterSpacing: "0.3px" }}
      >
        {activity.time ?? "—"}
      </div>

      {/* Content column */}
      <div className="flex gap-3 min-w-0">
        <div className="flex-1 min-w-0">
        {/* Name */}
        <div className="font-semibold text-sm mb-1" style={{ color: "var(--text-dark)" }}>
          {activity.name}
        </div>

        {/* Why chosen — core AI insight, always visible */}
        {activity.why_chosen && (
          <div
            className="text-xs italic leading-relaxed mb-2"
            style={{ color: "var(--text-mid)" }}
          >
            <span className="not-italic font-bold" style={{ color: "var(--forest)" }}>✦ </span>
            {activity.why_chosen}
          </div>
        )}

        {/* 3 bullet point highlights */}
        {activity.highlights && activity.highlights.length > 0 && (
          <ul className="mb-2" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {activity.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: "var(--text-mid)" }}>
                <span className="flex-shrink-0 mt-0.5" style={{ color: "var(--leaf)" }}>•</span>
                {h}
              </li>
            ))}
          </ul>
        )}

        {/* Badges row */}
        <div className="flex gap-1.5 flex-wrap items-center">
          {/* Category badge */}
          <span style={getCatBadgeStyle(activity.category)}>
            {getCategoryIcon(activity.category)} {activity.category}
          </span>

          {/* Duration */}
          {activity.duration && (
            <span
              className="text-xs font-medium"
              style={{
                background: "var(--bg-cream)",
                border: "1px solid var(--border-mid)",
                borderRadius: "var(--r-full)",
                padding: "2px 8px",
                color: "var(--text-muted)",
              }}
            >
              ⏱ {activity.duration}
            </span>
          )}

          {/* Price */}
          {activity.price_range && (
            <span
              className="text-xs font-medium"
              style={{
                background: "var(--bg-cream)",
                border: "1px solid var(--border-mid)",
                borderRadius: "var(--r-full)",
                padding: "2px 8px",
                color: "var(--text-muted)",
              }}
            >
              {activity.price_range}
            </span>
          )}

          {/* Location */}
          {activity.location && (
            <span
              className="text-xs font-medium"
              style={{
                background: "var(--bg-cream)",
                border: "1px solid var(--border-mid)",
                borderRadius: "var(--r-full)",
                padding: "2px 8px",
                color: "var(--text-muted)",
              }}
            >
              📍 {activity.location}
            </span>
          )}
        </div>

        {/* Extra details */}
        {hasExtras && (
          <div className="mt-2 space-y-1">
            {activity.booking_tip && (
              <div className="flex items-start gap-1.5 text-xs" style={{ color: "var(--text-mid)" }}>
                <CalendarCheck size={12} style={{ color: "var(--forest)", flexShrink: 0, marginTop: 1 }} />
                {activity.booking_tip}
              </div>
            )}
            {activity.weather_note && (
              <div className="flex items-start gap-1.5 text-xs" style={{ color: "var(--text-mid)" }}>
                <Cloud size={12} style={{ color: "#0ea5e9", flexShrink: 0, marginTop: 1 }} />
                {activity.weather_note}
              </div>
            )}
            {activity.website && (
              <a
                href={activity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--forest)" }}
              >
                <ExternalLink size={11} />
                {truncate(activity.website.replace(/^https?:\/\//, ""), 45)}
              </a>
            )}
          </div>
        )}
        </div>{/* end flex-1 */}

        {/* Activity photo */}
        {activity.image_url && !imgError && (
          <div
            className="flex-shrink-0 rounded-lg overflow-hidden print:hidden"
            style={{ width: 108, height: 76, alignSelf: "flex-start" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activity.image_url}
              alt={activity.name}
              onError={() => setImgError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        )}
      </div>{/* end flex gap-3 */}

      {/* Actions column — fade in on hover */}
      {!readOnly && (
        <div
          className="flex flex-col gap-1 pt-0.5 transition-all"
          style={{ opacity: hovering ? 1 : 0 }}
        >
          <button
            onClick={() => onMoveUp?.(index)}
            disabled={isFirst}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
            style={{
              background: "none",
              border: "1px solid var(--border-light)",
              color: "var(--text-muted)",
              cursor: isFirst ? "not-allowed" : "pointer",
              opacity: isFirst ? 0.3 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isFirst) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-mint)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--forest)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-light)";
            }}
            title="Move up"
          >
            <ArrowUp size={12} />
          </button>
          <button
            onClick={() => onMoveDown?.(index)}
            disabled={isLast}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
            style={{
              background: "none",
              border: "1px solid var(--border-light)",
              color: "var(--text-muted)",
              cursor: isLast ? "not-allowed" : "pointer",
              opacity: isLast ? 0.3 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLast) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-mint)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--forest)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-light)";
            }}
            title="Move down"
          >
            <ArrowDown size={12} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
            style={{
              background: "none",
              border: "1px solid var(--border-light)",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
              (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#fecaca";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-light)";
            }}
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
