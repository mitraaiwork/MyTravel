"use client";

import { useState, useEffect } from "react";
import type { TripFeedback, TripPhase } from "@/types";
import { feedbackApi } from "@/lib/api";

interface FeedbackTabProps {
  tripId: string;
  phase: TripPhase;
}

const DIMENSIONS: { key: keyof TripFeedback; label: string }[] = [
  { key: "itinerary_rating", label: "Itinerary quality" },
  { key: "restaurant_rating", label: "Food recommendations" },
  { key: "flow_rating", label: "Day flow & pacing" },
  { key: "pace_rating", label: "Overall pace" },
];

export function FeedbackTab({ tripId, phase }: FeedbackTabProps) {
  const [feedback, setFeedback] = useState<Partial<TripFeedback>>({});
  const [keepInput, setKeepInput] = useState("");
  const [skipInput, setSkipInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    feedbackApi.get(tripId).then((fb) => {
      setFeedback(fb);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [tripId]);

  function setRating(key: keyof TripFeedback, value: number) {
    setFeedback((prev) => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
    setSaved(false);
  }

  function addItem(type: "keep" | "skip") {
    const val = type === "keep" ? keepInput.trim() : skipInput.trim();
    if (!val) return;
    setFeedback((prev) => ({
      ...prev,
      [type === "keep" ? "keep_list" : "skip_list"]: [
        ...(prev[type === "keep" ? "keep_list" : "skip_list"] ?? []),
        val,
      ],
    }));
    type === "keep" ? setKeepInput("") : setSkipInput("");
    setSaved(false);
  }

  function removeItem(type: "keep" | "skip", idx: number) {
    const listKey = type === "keep" ? "keep_list" : "skip_list";
    setFeedback((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] ?? []).filter((_, i) => i !== idx),
    }));
    setSaved(false);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const result = await feedbackApi.save(tripId, feedback);
      setFeedback(result);
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPostTrip = phase === "post-trip";

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      {!isPostTrip && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          Feedback is available after your trip ends. Come back once you're home!
        </div>
      )}

      {/* Overall rating */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-700">Overall trip rating</h3>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating("overall_rating", n)}
              className={`text-2xl transition-transform hover:scale-110 ${
                (feedback.overall_rating ?? 0) >= n ? "opacity-100" : "opacity-25"
              }`}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      {/* Dimension ratings */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700">Rate each dimension</h3>
        {DIMENSIONS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-4">
            <span className="text-sm text-gray-600 w-40 shrink-0">{label}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(key, n)}
                  className={`w-7 h-7 rounded-full border text-xs font-medium transition-colors ${
                    (feedback[key] as number | undefined ?? 0) >= n
                      ? "bg-teal-500 border-teal-500 text-white"
                      : "border-gray-300 text-gray-400 hover:border-teal-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Keep list */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-700">What to keep next time</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={keepInput}
            onChange={(e) => setKeepInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem("keep")}
            placeholder="Add a highlight..."
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400"
          />
          <button
            onClick={() => addItem("keep")}
            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
          >
            + Add
          </button>
        </div>
        {(feedback.keep_list ?? []).length > 0 && (
          <ul className="space-y-1">
            {(feedback.keep_list ?? []).map((item, i) => (
              <li key={i} className="flex items-center justify-between px-3 py-1.5 bg-green-50 rounded-lg text-sm text-green-800">
                <span>✅ {item}</span>
                <button onClick={() => removeItem("keep", i)} className="text-green-400 hover:text-green-600 ml-2">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Skip list */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-700">What to skip next time</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={skipInput}
            onChange={(e) => setSkipInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem("skip")}
            placeholder="Add something to avoid..."
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-red-300"
          />
          <button
            onClick={() => addItem("skip")}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"
          >
            + Add
          </button>
        </div>
        {(feedback.skip_list ?? []).length > 0 && (
          <ul className="space-y-1">
            {(feedback.skip_list ?? []).map((item, i) => (
              <li key={i} className="flex items-center justify-between px-3 py-1.5 bg-red-50 rounded-lg text-sm text-red-700">
                <span>❌ {item}</span>
                <button onClick={() => removeItem("skip", i)} className="text-red-300 hover:text-red-500 ml-2">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-700">Notes & memories</h3>
        <textarea
          value={feedback.notes ?? ""}
          onChange={(e) => {
            setFeedback((prev) => ({ ...prev, notes: e.target.value }));
            setSaved(false);
          }}
          placeholder="What will you remember most about this trip?"
          rows={4}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 resize-none"
        />
      </div>

      {/* AI memory preview */}
      {feedback.overall_rating && (
        <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl text-sm text-teal-800 space-y-1">
          <div className="font-medium">🤖 AI will remember for future trips:</div>
          <ul className="list-disc list-inside text-xs text-teal-700 space-y-0.5">
            {feedback.keep_list?.slice(0, 2).map((k) => <li key={k}>Loved: {k}</li>)}
            {feedback.skip_list?.slice(0, 1).map((s) => <li key={s}>Avoid: {s}</li>)}
            <li>Preferred pace: {feedback.pace_rating && feedback.pace_rating >= 4 ? "fast-paced" : feedback.pace_rating && feedback.pace_rating <= 2 ? "relaxed" : "moderate"}</li>
          </ul>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        {isSaving ? "Saving…" : saved ? "✓ Saved" : "Save Feedback"}
      </button>
    </div>
  );
}
