"use client";

import { useState } from "react";
import type { PackingList, PackingItem } from "@/types";

interface PackingListTabProps {
  tripId: string;
  packingList: PackingList | null;
  isLoading: boolean;
  onGenerate: () => void;
  error?: string | null;
}

export function PackingListTab({ tripId, packingList, isLoading, onGenerate, error }: PackingListTabProps) {
  // Persist checked state per trip in localStorage
  const storageKey = `packing-checked-${tripId}`;
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleCheck(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  }

  function toggleCollapse(name: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function handleEmail() {
    if (!packingList) return;
    const lines = packingList.categories.flatMap((cat) => [
      `\n${cat.icon} ${cat.name}`,
      ...cat.items.map((item) => `  ${item.essential ? "★" : "•"} ${item.label}${item.note ? ` (${item.note})` : ""}`),
    ]);
    const body = encodeURIComponent(`My packing list:\n${lines.join("\n")}`);
    window.location.href = `mailto:?subject=Packing List&body=${body}`;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Generating your personalised packing list…</p>
      </div>
    );
  }

  if (!packingList) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="text-5xl">🎒</div>
        <h3 className="font-semibold text-gray-700">Smart Packing List</h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Generate a personalised packing list based on your itinerary activities and weather forecast.
        </p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 max-w-xs">
            {error}
          </p>
        )}
        <button
          onClick={onGenerate}
          className="px-5 py-2.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
        >
          {error ? "Try Again" : "Generate Packing List"}
        </button>
      </div>
    );
  }

  const totalItems = packingList.categories.reduce((acc, c) => acc + c.items.length, 0);
  const checkedCount = checked.size;

  return (
    <div className="space-y-4 pb-8">
      {/* Weather note */}
      {packingList.weather_note && (
        <div className="px-4 py-3 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-700">
          🌤 {packingList.weather_note}
        </div>
      )}

      {/* Progress + actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {checkedCount}/{totalItems} packed
        </span>
        <button
          onClick={handleEmail}
          className="text-sm text-teal-600 hover:text-teal-700 underline"
        >
          Email this list
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full transition-all"
          style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
        />
      </div>

      {/* Categories */}
      {packingList.categories.map((cat) => {
        const isCollapsed = collapsed.has(cat.name);
        return (
          <div key={cat.name} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => toggleCollapse(cat.name)}
            >
              <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                <span>{cat.icon}</span>
                {cat.name}
                <span className="text-xs text-gray-400 font-normal">
                  ({cat.items.filter((i) => checked.has(`${cat.name}-${i.label}`)).length}/{cat.items.length})
                </span>
              </span>
              <span className="text-gray-400 text-xs">{isCollapsed ? "▶" : "▼"}</span>
            </button>

            {!isCollapsed && (
              <ul className="divide-y divide-gray-100">
                {cat.items.map((item) => {
                  const key = `${cat.name}-${item.label}`;
                  const isChecked = checked.has(key);
                  return (
                    <li key={key} className="flex items-start gap-3 px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheck(key)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${isChecked ? "line-through text-gray-400" : "text-gray-700"}`}>
                          {item.essential && <span className="text-amber-500 mr-1">★</span>}
                          {item.label}
                        </span>
                        {item.note && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      {checkedCount === totalItems && totalItems > 0 && (
        <div className="text-center py-4 text-teal-600 font-medium text-sm">
          🎉 All packed! Have a great trip.
        </div>
      )}
    </div>
  );
}
