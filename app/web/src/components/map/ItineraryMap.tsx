"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Itinerary } from "@/types";

interface ItineraryMapProps {
  itinerary: Itinerary;
  highlightDay?: number;
}

const DAY_COLOURS = [
  "#2d6a4f",
  "#0096c7",
  "#e76f51",
  "#9b59b6",
  "#f4a261",
  "#52b788",
  "#48cae4",
  "#e63946",
  "#06d6a0",
  "#ffd166",
];

export default function ItineraryMap({ itinerary, highlightDay }: ItineraryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const noPinsRef = useRef(false);

  // selectedDay: null = show all, number = show only that day
  const [selectedDay, setSelectedDay] = useState<number | null>(
    highlightDay ?? null
  );

  // markers grouped by day number: { el: HTMLElement, marker: any }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dayMarkersRef = useRef<Map<number, { el: HTMLElement; marker: any }[]>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dayBoundsRef = useRef<Map<number, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allBoundsRef = useRef<any>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !mapContainer.current || mapRef.current) return;

    let mounted = true;

    import("mapbox-gl").then((mapboxgl) => {
      if (!mounted || mapRef.current || !mapContainer.current) return;

      const mapboxGl = mapboxgl.default ?? mapboxgl;
      mapboxGl.accessToken = token;

      const map = new mapboxGl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: [0, 20],
        zoom: 1.5,
      });
      mapRef.current = map;

      map.on("load", () => {
        const allBounds = new mapboxGl.LngLatBounds();
        let hasCoords = false;

        itinerary.days.forEach((day, dayIndex) => {
          const colour = DAY_COLOURS[dayIndex % DAY_COLOURS.length];
          const dayBounds = new mapboxGl.LngLatBounds();
          const dayMarkers: { el: HTMLElement; marker: any }[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

          day.activities.forEach((activity) => {
            if (!activity.lat || !activity.lng) return;

            hasCoords = true;
            allBounds.extend([activity.lng, activity.lat]);
            dayBounds.extend([activity.lng, activity.lat]);

            const el = document.createElement("div");
            el.style.cssText = `
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background-color: ${colour};
              border: 2px solid white;
              box-shadow: 0 1px 4px rgba(0,0,0,0.35);
              cursor: pointer;
              transition: opacity 0.2s;
            `;

            const popup = new mapboxGl.Popup({ offset: 10, closeButton: false }).setHTML(`
              <div style="font-family:sans-serif;font-size:13px;line-height:1.4;max-width:180px">
                <div style="font-weight:600;color:#1a2e1a">${activity.name}</div>
                ${activity.time ? `<div style="color:#666;font-size:11px">${activity.time}</div>` : ""}
                <div style="margin-top:2px">
                  <span style="background:${colour}22;color:${colour};font-size:11px;padding:1px 6px;border-radius:10px">${activity.category}</span>
                </div>
                <div style="color:#888;font-size:10px;margin-top:3px">Day ${day.day}</div>
              </div>
            `);

            const marker = new mapboxGl.Marker({ element: el })
              .setLngLat([activity.lng, activity.lat])
              .setPopup(popup)
              .addTo(map);

            dayMarkers.push({ el, marker });
          });

          if (dayMarkers.length > 0) {
            dayMarkersRef.current.set(day.day, dayMarkers);
            dayBoundsRef.current.set(day.day, dayBounds);
          }
        });

        if (hasCoords) {
          allBoundsRef.current = allBounds;
          map.fitBounds(allBounds, { padding: 60, maxZoom: 14 });
        } else {
          noPinsRef.current = true;
        }
      });
    });

    return () => {
      mounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── React to day filter changes ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    dayMarkersRef.current.forEach((markers, dayNum) => {
      const visible = selectedDay === null || selectedDay === dayNum;
      markers.forEach(({ el }) => {
        el.style.opacity = visible ? "1" : "0";
        el.style.pointerEvents = visible ? "auto" : "none";
      });
    });

    if (!map.loaded()) return;

    if (selectedDay !== null) {
      const bounds = dayBoundsRef.current.get(selectedDay);
      if (bounds) map.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    } else if (allBoundsRef.current) {
      map.fitBounds(allBoundsRef.current, { padding: 60, maxZoom: 14 });
    }
  }, [selectedDay]);

  if (!token) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-sm font-medium">Map unavailable</p>
          <p className="text-xs mt-1">Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />

      {/* No-pins overlay */}
      {noPinsRef.current && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-4 shadow-md text-center">
            <p className="text-sm font-medium text-gray-700">No location pins</p>
            <p className="text-xs text-gray-400 mt-0.5">Regenerate your itinerary to get map pins</p>
          </div>
        </div>
      )}

      {/* ── Day filter bar ── */}
      {itinerary.days.length > 0 && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-2xl shadow-lg"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(0,0,0,0.08)",
            maxWidth: "calc(100% - 24px)",
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {/* "All" pill */}
          <button
            onClick={() => setSelectedDay(null)}
            style={{
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              transition: "all 0.15s",
              background: selectedDay === null ? "#1a2e1a" : "transparent",
              color: selectedDay === null ? "white" : "#666",
            }}
          >
            All
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 14, background: "rgba(0,0,0,0.12)", flexShrink: 0 }} />

          {/* Day pills */}
          {itinerary.days.map((day, i) => {
            const colour = DAY_COLOURS[i % DAY_COLOURS.length];
            const active = selectedDay === day.day;
            return (
              <button
                key={day.day}
                onClick={() => setSelectedDay(active ? null : day.day)}
                title={day.theme ?? `Day ${day.day}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s",
                  background: active ? colour : "transparent",
                  color: active ? "white" : "#444",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: active ? "rgba(255,255,255,0.7)" : colour,
                    flexShrink: 0,
                  }}
                />
                Day {day.day}
                {day.area && (
                  <span style={{ color: active ? "rgba(255,255,255,0.75)" : "#999", fontWeight: 400 }}>
                    · {day.area}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
