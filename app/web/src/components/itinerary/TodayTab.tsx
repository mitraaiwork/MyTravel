"use client";

import { Navigation, MessageSquare } from "lucide-react";
import type { Trip, Day, Activity } from "@/types";

interface TodayTabProps {
  trip: Trip;
  currentDay: Day;
  nextActivity: Activity | null;
  totalDays: number;
  onOpenChat: (message?: string) => void;
}

function getMapsUrl(activity: Activity): string {
  const query = activity.location
    ? `${activity.name}, ${activity.location}`
    : activity.name;
  const dest = encodeURIComponent(query);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS
    ? `maps://maps.apple.com/?daddr=${dest}`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

function weatherIcon(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("rain") || c.includes("shower") || c.includes("drizzle")) return "🌧️";
  if (c.includes("fog") || c.includes("mist")) return "🌫️";
  if (c.includes("partly") || c.includes("mostly cloudy")) return "⛅";
  if (c.includes("cloud") || c.includes("overcast")) return "☁️";
  if (c.includes("sun") || c.includes("clear")) return "☀️";
  return "🌤️";
}

type ActivityState = "past" | "next" | "upcoming" | "untimed";

function getActivityState(activity: Activity, nextActivity: Activity | null, now: string): ActivityState {
  if (!activity.time) return "untimed";
  if (activity === nextActivity) return "next";
  if (activity.time <= now) return "past";
  return "upcoming";
}

function DirectionsLink({ activity, compact }: { activity: Activity; compact?: boolean }) {
  return (
    <a
      href={getMapsUrl(activity)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-[#2d6a4f] hover:text-[#1b4332] transition-colors"
      style={{ fontSize: compact ? 12 : 13, fontWeight: 600 }}
    >
      <Navigation size={compact ? 12 : 14} />
      {!compact && "Directions"}
    </a>
  );
}

export function TodayTab({ trip, currentDay, nextActivity, totalDays, onOpenChat }: TodayTabProps) {
  const now = new Date().toTimeString().slice(0, 5);
  const dateLabel = new Date(currentDay.date + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const cityLabel = currentDay.city ?? currentDay.area ?? trip.destination;

  const allPast =
    currentDay.activities.length > 0 &&
    currentDay.activities.every((a) => !a.time || a.time <= now) &&
    nextActivity === null;

  return (
    <div className="space-y-4">
      {/* Day header */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 60%, #40916c 100%)",
          color: "white",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>
              Day {currentDay.day} of {totalDays}
            </p>
            <h2 className="text-xl font-extrabold leading-tight" style={{ letterSpacing: "-0.3px" }}>
              {cityLabel}
            </h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>{dateLabel}</p>
            {currentDay.theme && (
              <p className="text-xs mt-2 italic" style={{ color: "rgba(255,255,255,0.60)" }}>{currentDay.theme}</p>
            )}
          </div>
          <span className="text-3xl flex-shrink-0 mt-0.5">📍</span>
        </div>

        {/* City transition banner */}
        {currentDay.city_transition && (
          <div
            className="mt-4 flex items-center gap-2 text-sm px-3 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.90)" }}
          >
            <span>🚗</span>
            <span>
              Travel day: {currentDay.city_transition.from_city} → {currentDay.city_transition.to_city}
              {currentDay.city_transition.drive_hours > 0 && ` (${currentDay.city_transition.drive_hours}h drive)`}
            </span>
          </div>
        )}
      </div>

      {/* Weather strip */}
      {currentDay.weather && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.20)" }}
        >
          <span className="text-2xl">{weatherIcon(currentDay.weather.condition)}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-sky-800">{currentDay.weather.condition}</p>
            <p className="text-xs text-sky-600">
              {currentDay.weather.high_c}° / {currentDay.weather.low_c}°C
              {currentDay.sunrise && currentDay.sunset && ` · ${currentDay.sunrise} – ${currentDay.sunset}`}
            </p>
          </div>
        </div>
      )}

      {/* Next Up card */}
      {nextActivity ? (
        <div
          className="rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, #f0faf4 0%, #e8f5ec 100%)",
            border: "2px solid #52b788",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#2d6a4f] mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Next Up
          </p>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1a2e1a] text-base leading-tight">{nextActivity.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {nextActivity.time && (
                  <span className="text-xs text-[#2d6a4f] font-semibold">{nextActivity.time}</span>
                )}
                <span className="text-xs text-gray-400">{nextActivity.category}</span>
              </div>
              {nextActivity.location && (
                <p className="text-xs text-gray-500 mt-1 truncate">{nextActivity.location}</p>
              )}
            </div>
            <div className="flex-shrink-0">
              <a
                href={getMapsUrl(nextActivity)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold"
                style={{ background: "linear-gradient(135deg, #2d6a4f, #40916c)" }}
              >
                <Navigation size={13} />
                Directions
              </a>
            </div>
          </div>
        </div>
      ) : allPast ? (
        <div
          className="text-center py-6 rounded-2xl"
          style={{ background: "var(--bg-mint)", border: "1px solid var(--border-light)" }}
        >
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-semibold text-[#1a2e1a] text-sm">You&apos;ve completed today&apos;s activities!</p>
          <p className="text-xs text-gray-400 mt-1">Time to relax or explore on your own.</p>
        </div>
      ) : null}

      {/* Day schedule */}
      {currentDay.activities.length > 0 && (
        <div className="card">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Today&apos;s schedule</p>
          <div className="space-y-1">
            {currentDay.activities.map((activity, idx) => {
              const state = getActivityState(activity, nextActivity, now);
              const isPast = state === "past";
              const isNext = state === "next";

              return (
                <div
                  key={activity.id ?? idx}
                  className="flex items-start gap-3 py-2.5 px-3 rounded-xl transition-all"
                  style={{
                    background: isNext ? "rgba(82,183,136,0.10)" : isPast ? "transparent" : "transparent",
                    opacity: isPast ? 0.45 : 1,
                    border: isNext ? "1px solid rgba(82,183,136,0.25)" : "1px solid transparent",
                  }}
                >
                  {/* Time column */}
                  <div
                    className="w-12 flex-shrink-0 text-right"
                    style={{ paddingTop: 1 }}
                  >
                    {activity.time ? (
                      <span
                        className="text-xs font-semibold"
                        style={{ color: isNext ? "#2d6a4f" : isPast ? "#aaa" : "#555" }}
                      >
                        {activity.time}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* Dot connector */}
                  <div className="flex flex-col items-center flex-shrink-0 mt-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: isNext ? "#52b788" : isPast ? "#ccc" : "#b7e4c7",
                      }}
                    />
                    {idx < currentDay.activities.length - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: "#e9f5ee", minHeight: 16 }} />
                    )}
                  </div>

                  {/* Activity info */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className="text-sm font-semibold leading-tight"
                          style={{ color: isPast ? "#999" : "#1a2e1a" }}
                        >
                          {isPast && "✓ "}{activity.name}
                        </p>
                        {activity.location && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{activity.location}</p>
                        )}
                      </div>
                      {!isPast && (
                        <DirectionsLink activity={activity} compact />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No schedule fallback */}
      {currentDay.activities.length === 0 && (
        <div
          className="text-center py-8 rounded-2xl"
          style={{ background: "var(--bg-mint)", border: "1px solid var(--border-light)" }}
        >
          <p className="text-gray-400 text-sm">No activities scheduled for today.</p>
        </div>
      )}

      {/* Chat shortcut */}
      <button
        onClick={() => onOpenChat(nextActivity ? `I'm running late for ${nextActivity.name}. What should I do?` : undefined)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
        style={{
          background: "var(--bg-mint)",
          border: "1px solid var(--border-light)",
          color: "var(--forest)",
        }}
      >
        <MessageSquare size={15} />
        {nextActivity ? `Running late for ${nextActivity.name}?` : "Ask the AI concierge"}
      </button>
    </div>
  );
}
