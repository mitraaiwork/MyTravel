import { useMemo, useState, useEffect } from "react";
import type { Trip, Itinerary, Day, Activity } from "@/types";

interface InTripMode {
  isInTrip: boolean;
  currentDay: Day | null;
  nextActivity: Activity | null;
}

export function useInTripMode(trip: Trip | null, itinerary: Itinerary | null): InTripMode {
  const [forceInTrip, setForceInTrip] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setForceInTrip(p.has("inTrip") || p.has("intrip"));
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const isInTrip =
    forceInTrip ||
    (trip != null && trip.start_date <= today && today <= trip.end_date);

  const currentDay = useMemo(() => {
    if (!isInTrip || !itinerary) return null;
    return forceInTrip
      ? (itinerary.days[0] ?? null)
      : (itinerary.days.find((d) => d.date === today) ?? null);
  }, [isInTrip, itinerary, forceInTrip, today]);

  const nextActivity = useMemo(() => {
    if (!currentDay) return null;
    const now = new Date().toTimeString().slice(0, 5);
    return currentDay.activities.find((a) => (a.time ?? "00:00") > now) ?? null;
  }, [currentDay]);

  return { isInTrip, currentDay, nextActivity };
}
