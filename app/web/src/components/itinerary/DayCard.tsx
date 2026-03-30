"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { itineraryApi } from "@/lib/api";
import { formatDateShort } from "@/lib/utils";
import type { Day, Itinerary, Restaurant, OffbeatSpot } from "@/types";
import ActivityCard from "./ActivityCard";
import AddActivityModal from "./AddActivityModal";

interface DayCardProps {
  day: Day;
  tripId: string;
  onItineraryChange: (updated: Itinerary) => void;
  defaultOpen?: boolean;
  readOnly?: boolean;
  hideRestaurants?: boolean;
  hideOffbeat?: boolean;
}

export default function DayCard({
  day,
  tripId,
  onItineraryChange,
  defaultOpen = false,
  readOnly = false,
  hideRestaurants = false,
  hideOffbeat = false,
}: DayCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showAddModal, setShowAddModal] = useState(false);

  async function handleMoveUp(index: number) {
    if (index === 0) return;
    const newOrder = day.activities.map((_, i) => i);
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    try {
      onItineraryChange(await itineraryApi.reorderActivities(tripId, day.day, newOrder));
    } catch {}
  }

  async function handleMoveDown(index: number) {
    if (index >= day.activities.length - 1) return;
    const newOrder = day.activities.map((_, i) => i);
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    try {
      onItineraryChange(await itineraryApi.reorderActivities(tripId, day.day, newOrder));
    } catch {}
  }

  return (
    <div
      className="mb-4 overflow-hidden animate-fade-in-up"
      style={{
        background: "white",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <button
        className="w-full text-left focus:outline-none transition-all"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, var(--bg-mint), white)"
            : "linear-gradient(135deg, white, var(--bg-mint))",
          borderBottom: isOpen ? "1px solid var(--border-light)" : "none",
          display: "flex",
          alignItems: "stretch",
          cursor: "pointer",
          overflow: "hidden",
        }}
        onClick={() => setIsOpen((v) => !v)}
      >
        {/* Text area */}
        <div style={{ flex: 1, padding: "16px 20px", minWidth: 0 }}>
          <div
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)", letterSpacing: "1px" }}
          >
            Day {day.day} · {formatDateShort(day.date)}
          </div>
          <div className="font-bold text-sm mt-0.5" style={{ color: "var(--text-dark)" }}>
            {day.theme || "—"}
          </div>
          {day.area && (
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              📍 {day.area}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {day.weather && (
              <div
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--bg-cream)",
                  border: "1px solid var(--border-light)",
                  color: "var(--text-muted)",
                }}
              >
                🌤 {day.weather.high_c}°/{day.weather.low_c}° · {day.weather.condition}
              </div>
            )}
            <span
              className="ml-auto text-sm transition-transform"
              style={{
                color: "var(--text-muted)",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                display: "inline-block",
                lineHeight: 1,
              }}
            >
              ▾
            </span>
          </div>
        </div>

      </button>

      {/* ── Body ─── print:!block keeps all days visible for PDF export */}
      <div className={`${isOpen ? "" : "hidden print:!block"}`}>

        {/* Activities */}
        {day.activities.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--text-faint)" }}>
            No activities yet.
          </p>
        ) : (
          <div style={{ padding: "0 18px" }}>
            {day.activities.map((activity, i) => (
              <ActivityCard
                key={i}
                activity={activity}
                index={i}
                dayNumber={day.day}
                tripId={tripId}
                onItineraryChange={onItineraryChange}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={i === 0}
                isLast={i === day.activities.length - 1}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}

        {/* Restaurants */}
        {!hideRestaurants && day.restaurants && day.restaurants.length > 0 && (
          <div className="mx-4 mb-4">
            <div
              className="flex items-center gap-2 px-1 mb-2"
            >
              <span className="text-base">🍽️</span>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--text-muted)", letterSpacing: "1px" }}
              >
                Where to Eat
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {day.restaurants.map((r: Restaurant, i: number) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: "linear-gradient(135deg, #fff8f0, #fff3e6)",
                    border: "1px solid rgba(212,160,23,0.18)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
                        {r.name}
                      </span>
                      {r.meal && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: "rgba(212,160,23,0.12)",
                            color: "#92400e",
                            border: "1px solid rgba(212,160,23,0.25)",
                          }}
                        >
                          {r.meal}
                        </span>
                      )}
                      {r.cuisine && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          · {r.cuisine}
                        </span>
                      )}
                    </div>
                    {r.price_range && (
                      <span className="text-xs font-medium flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        {r.price_range}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#92400e" }}>
                    ✦ {r.famous_for}
                  </p>
                  {r.insider_tip && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      💡 {r.insider_tip}
                    </p>
                  )}
                  {r.location && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      📍 {r.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offbeat spots */}
        {!hideOffbeat && day.offbeat_spots && day.offbeat_spots.length > 0 && (
          <div className="mx-4 mb-4">
            <div className="flex items-center gap-2 px-1 mb-2">
              <span className="text-base">🧭</span>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--text-muted)", letterSpacing: "1px" }}
              >
                Hidden Gems
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {day.offbeat_spots.map((s: OffbeatSpot, i: number) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: "linear-gradient(135deg, rgba(14,165,233,0.06), rgba(56,189,248,0.04))",
                    border: "1px solid rgba(14,165,233,0.15)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
                      {s.name}
                    </span>
                    {s.best_time && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: "rgba(14,165,233,0.10)",
                          color: "#0369a1",
                          border: "1px solid rgba(14,165,233,0.20)",
                        }}
                      >
                        {s.best_time}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#0369a1" }}>
                    ✦ {s.why_special}
                  </p>
                  {s.location && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      📍 {s.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Travel tip */}
        {day.travel_tip && (
          <div
            className="mx-4 mb-4 flex items-start gap-2 rounded-xl px-4 py-3"
            style={{
              background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
              border: "1px solid rgba(212,160,23,0.25)",
            }}
          >
            <span className="text-sm flex-shrink-0">💡</span>
            <span className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
              {day.travel_tip}
            </span>
          </div>
        )}

        {/* Premium: regenerate day bar */}
        {!readOnly && (
          <div
            className="mx-4 mb-3 flex items-center justify-between rounded-xl px-3.5 py-2.5"
            style={{
              background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
              border: "1px solid rgba(212,160,23,0.25)",
            }}
          >
            <div className="flex items-center gap-2 text-xs" style={{ color: "#92400e" }}>
              🔄 Regenerate just this day
              <span className="text-xs ml-1" style={{ color: "#9a6700" }}>
                — change the focus, adjust the pace, or replace everything
              </span>
            </div>
            <button
              className="text-xs font-bold px-2.5 py-1 rounded-lg"
              style={{
                background: "rgba(212,160,23,0.15)",
                color: "#92400e",
                border: "1px solid rgba(212,160,23,0.3)",
                cursor: "default",
              }}
              title="Upgrade to Premium"
            >
              ✦ Premium
            </button>
          </div>
        )}

        {/* Add activity */}
        {!readOnly && (
          <div style={{ borderTop: "1px solid var(--border-light)", padding: "0 18px 10px" }}>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-medium py-2.5 rounded-xl my-2 transition-all"
              style={{
                border: "1.5px dashed var(--border-light)",
                color: "var(--text-faint)",
                background: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--forest)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--forest)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(45,106,79,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-light)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-faint)";
                (e.currentTarget as HTMLButtonElement).style.background = "none";
              }}
            >
              <Plus size={14} />
              Add activity to Day {day.day}
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddActivityModal
          tripId={tripId}
          dayNumber={day.day}
          onClose={() => setShowAddModal(false)}
          onItineraryChange={(updated) => {
            onItineraryChange(updated);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
