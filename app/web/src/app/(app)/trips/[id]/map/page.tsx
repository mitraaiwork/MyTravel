"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { tripsApi, itineraryApi } from "@/lib/api";
import type { Trip, Itinerary } from "@/types";

const ItineraryMap = dynamic(
  () => import("@/components/map/ItineraryMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center rounded-xl"
        style={{ background: "var(--bg-mint)" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--forest)", borderTopColor: "transparent" }} />
      </div>
    ),
  }
);

export default function MapPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [t, it] = await Promise.all([
          tripsApi.get(tripId),
          itineraryApi.get(tripId),
        ]);
        setTrip(t);
        setItinerary(it);
      } catch {
        setError("Failed to load map data.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [tripId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", maxWidth: 1100 }}>
      {/* Header */}
      <div className="mb-4" style={{ flexShrink: 0 }}>
        {/* Breadcrumb */}
        <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          <Link href="/dashboard" style={{ color: "var(--forest)", textDecoration: "none" }}>
            My Trips
          </Link>
          {" / "}
          <Link href={`/trips/${tripId}`} style={{ color: "var(--forest)", textDecoration: "none" }}>
            {trip?.destination ?? "Trip"}
          </Link>
          {" / Map"}
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="font-extrabold" style={{ fontSize: 22, color: "var(--text-dark)" }}>
            {trip?.destination ?? "Trip map"}
          </h1>

          {/* Tab row */}
          <div className="flex gap-1 rounded-xl p-1 text-sm"
            style={{ background: "var(--border-light)", border: "1px solid var(--border-light)" }}>
            <Link
              href={`/trips/${tripId}`}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ color: "var(--text-mid)", textDecoration: "none", transition: "var(--trans)" }}
            >
              Itinerary
            </Link>
            <span
              className="px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{
                background: "white",
                color: "var(--forest)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              Map
            </span>
          </div>
        </div>
      </div>

      {/* Map area */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center rounded-xl"
            style={{ background: "var(--bg-mint)" }}>
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--forest)", borderTopColor: "transparent" }} />
          </div>
        ) : error || !itinerary ? (
          <div className="w-full h-full flex items-center justify-center rounded-xl"
            style={{ background: "#fff1f1", border: "1px solid rgba(220,38,38,0.15)" }}>
            <div className="text-center">
              <p className="mb-3" style={{ color: "#dc2626" }}>{error ?? "No itinerary found."}</p>
              <Link href={`/trips/${tripId}`} className="btn-secondary">
                Back to itinerary
              </Link>
            </div>
          </div>
        ) : (
          <ItineraryMap itinerary={itinerary} />
        )}
      </div>
    </div>
  );
}
