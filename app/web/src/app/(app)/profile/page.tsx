"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { profileApi } from "@/lib/api";
import type { UserProfile } from "@/types";

const FOOD_OPTIONS = ["No preference", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Allergies (see notes)"];
const SEAT_OPTIONS = ["No preference", "Window", "Aisle", "Bulkhead", "Exit row"];
const PACE_OPTIONS = ["Relaxed", "Moderate", "Fast-paced"];
const STYLE_OPTIONS = ["Adventure", "Cultural", "Relaxation", "Foodie", "Nature", "Luxury", "Budget", "Family"];
const NATIONALITY_OPTIONS = [
  "Australian", "Brazilian", "Canadian", "Chinese", "Dutch",
  "French", "German", "Indian", "Italian", "Japanese",
  "Mexican", "New Zealander", "Singaporean", "South Korean", "Spanish",
  "Swedish", "Swiss", "Emirati", "British", "American",
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [styles, setStyles] = useState<string[]>([]);

  useEffect(() => {
    profileApi.get().then((p) => {
      setProfile(p);
      setStyles(p.preferred_styles ? p.preferred_styles.split(",").map((s) => s.trim()).filter(Boolean) : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function toggleStyle(style: string) {
    setStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await profileApi.update({
        ...profile,
        preferred_styles: styles.join(",") || null,
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24" style={{ color: "var(--leaf)" }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="page-enter pb-24" style={{ maxWidth: 680 }}>

      {/* Hero banner */}
      <div
        className="rounded-2xl p-7 mb-7 flex items-center gap-5 overflow-hidden relative"
        style={{
          background: "var(--grad-nature)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ right: 100, top: -20, fontSize: 110, opacity: 0.07, transform: "rotate(-8deg)", lineHeight: 1 }}
        >
          👤
        </div>
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ left: -40, bottom: -40, width: 180, height: 180, background: "rgba(255,255,255,0.05)" }}
        />
        {/* Avatar */}
        <div
          className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.18)",
            border: "2px solid rgba(255,255,255,0.30)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          }}
        >
          {initials}
        </div>
        <div className="relative z-10 min-w-0">
          <h1 className="text-xl font-extrabold text-white tracking-tight mb-0.5 truncate">
            {user?.full_name}
          </h1>
          <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.65)" }}>
            {user?.email}
          </p>
          <p className="text-xs mt-1.5 font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
            Your preferences personalise every MyTravel AI-generated itinerary
          </p>
        </div>
        {user?.is_premium && (
          <span
            className="relative z-10 flex-shrink-0 ml-auto text-xs font-bold px-3 py-1.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(212,160,23,0.85), rgba(244,162,97,0.75))",
              color: "white",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            ✦ Premium
          </span>
        )}
      </div>

      {/* Identity & Location */}
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{
          background: "white",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="px-5 py-3.5 flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--border-light)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "var(--bg-mint)" }}
          >
            🏠
          </div>
          <h2 className="font-bold text-sm" style={{ color: "var(--text-dark)" }}>
            Identity &amp; Location
          </h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <label className="block">
            <span className="label">Home city</span>
            <input
              type="text"
              value={profile.home_city ?? ""}
              onChange={(e) => { setProfile((p) => ({ ...p, home_city: e.target.value || null })); setSaved(false); }}
              placeholder="e.g. Toronto, Canada"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Passport nationality</span>
            <select
              value={profile.passport_nationality ?? ""}
              onChange={(e) => { setProfile((p) => ({ ...p, passport_nationality: e.target.value || null })); setSaved(false); }}
              className="input"
              style={{ cursor: "pointer" }}
            >
              <option value="">Select nationality…</option>
              {NATIONALITY_OPTIONS.sort().map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Travel Style */}
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{
          background: "white",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="px-5 py-3.5 flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--border-light)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "var(--bg-mint)" }}
          >
            🧭
          </div>
          <h2 className="font-bold text-sm" style={{ color: "var(--text-dark)" }}>
            Travel Style
          </h2>
        </div>
        <div className="px-5 py-4 space-y-5">
          <div>
            <span className="label mb-2 block">Preferred pace</span>
            <div className="flex flex-wrap gap-2">
              {PACE_OPTIONS.map((opt) => {
                const isSelected = profile.preferred_pace === opt.toLowerCase();
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      setProfile((p) => ({ ...p, preferred_pace: p.preferred_pace === opt.toLowerCase() ? null : opt.toLowerCase() }));
                      setSaved(false);
                    }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={
                      isSelected
                        ? {
                            background: "var(--grad-forest)",
                            color: "white",
                            border: "1px solid transparent",
                            boxShadow: "0 2px 8px rgba(45,106,79,0.30)",
                          }
                        : {
                            background: "white",
                            color: "var(--text-mid)",
                            border: "1px solid var(--border-mid)",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--leaf)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)";
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span className="label mb-2 block">Travel styles <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(select all that apply)</span></span>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((opt) => {
                const isSelected = styles.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleStyle(opt)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={
                      isSelected
                        ? {
                            background: "var(--grad-forest)",
                            color: "white",
                            border: "1px solid transparent",
                            boxShadow: "0 2px 8px rgba(45,106,79,0.30)",
                          }
                        : {
                            background: "white",
                            color: "var(--text-mid)",
                            border: "1px solid var(--border-mid)",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--leaf)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)";
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Food & Comfort */}
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{
          background: "white",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="px-5 py-3.5 flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--border-light)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "var(--bg-mint)" }}
          >
            🍽
          </div>
          <h2 className="font-bold text-sm" style={{ color: "var(--text-dark)" }}>
            Food &amp; Comfort
          </h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <label className="block">
            <span className="label">Dietary preference</span>
            <select
              value={profile.food_preference ?? ""}
              onChange={(e) => { setProfile((p) => ({ ...p, food_preference: e.target.value || null })); setSaved(false); }}
              className="input"
              style={{ cursor: "pointer" }}
            >
              {FOOD_OPTIONS.map((o) => (
                <option key={o} value={o === "No preference" ? "" : o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Seat preference</span>
            <select
              value={profile.seat_preference ?? ""}
              onChange={(e) => { setProfile((p) => ({ ...p, seat_preference: e.target.value || null })); setSaved(false); }}
              className="input"
              style={{ cursor: "pointer" }}
            >
              {SEAT_OPTIONS.map((o) => (
                <option key={o} value={o === "No preference" ? "" : o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Sticky save bar */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-end items-center gap-3 px-8 py-3 print:hidden"
        style={{
          background: "rgba(246,243,236,0.92)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--border-light)",
          boxShadow: "0 -4px 20px rgba(27,67,50,0.07)",
          zIndex: 20,
        }}
      >
        {saved && (
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--emerald)" }}>
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
              style={{ background: "var(--emerald)" }}
            >
              ✓
            </span>
            Preferences saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm py-2 px-6"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </div>

    </div>
  );
}
