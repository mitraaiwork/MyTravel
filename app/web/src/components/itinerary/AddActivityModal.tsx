"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { itineraryApi } from "@/lib/api";
import type { Itinerary } from "@/types";

interface AddActivityModalProps {
  tripId: string;
  dayNumber: number;
  onClose: () => void;
  onItineraryChange: (updated: Itinerary) => void;
}

const CATEGORIES = [
  "food",
  "culture",
  "nature",
  "adventure",
  "shopping",
  "nightlife",
  "transport",
  "wellness",
  "accommodation",
  "other",
];

export default function AddActivityModal({
  tripId,
  dayNumber,
  onClose,
  onItineraryChange,
}: AddActivityModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("culture");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [whyChosen, setWhyChosen] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Activity name is required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await itineraryApi.addActivity(tripId, dayNumber, {
        name: name.trim(),
        category,
        time: time || undefined,
        duration: duration || undefined,
        location: location || undefined,
        why_chosen: whyChosen || undefined,
      });
      onItineraryChange(updated);
    } catch {
      setError("Failed to add activity. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1a2e1a]">Add activity</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Activity name *</label>
            <input
              className="input"
              placeholder="e.g. Visit Senso-ji Temple"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Time (optional)</label>
              <input
                className="input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Duration (optional)</label>
              <input
                className="input"
                placeholder="e.g. 2 hours"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Location (optional)</label>
            <input
              className="input"
              placeholder="e.g. Asakusa, Tokyo"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Why add this? (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Why are you adding this activity…"
              value={whyChosen}
              onChange={(e) => setWhyChosen(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding…" : "Add activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
