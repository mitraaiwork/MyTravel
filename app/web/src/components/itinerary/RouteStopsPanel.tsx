"use client";

import { useState } from "react";
import { getCategoryIcon } from "@/lib/utils";
import type { RouteStop, RouteJourney } from "@/types";

interface RouteStopsPanelProps {
  origin: string;
  destination: string;
  journey: RouteJourney;
}

function StopStrip({ from, to, stops }: { from: string; to: string; stops: RouteStop[] }) {
  return (
    <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
      <div className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "var(--forest)", color: "white" }}>
        {from}
      </div>
      {stops.map((stop, i) => (
        <div key={i} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-px" style={{ background: "var(--border-mid)" }} />
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "var(--bg-mint)", color: "var(--forest)", border: "1px solid var(--border-mid)" }}>
            {stop.name.split(",")[0]}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-6 h-px" style={{ background: "var(--border-mid)" }} />
        <div className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "var(--forest)", color: "white" }}>
          {to}
        </div>
      </div>
    </div>
  );
}

function StopCards({ stops }: { stops: RouteStop[] }) {
  return (
    <div className="space-y-3">
      {stops.map((stop, i) => (
        <div key={i} className="flex gap-3 items-start rounded-xl p-3" style={{ background: "var(--bg-cream)", border: "1px solid var(--border-light)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: "var(--bg-mint)", border: "1px solid var(--border-mid)" }}>
            {getCategoryIcon(stop.category)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-semibold" style={{ color: "var(--text-dark)" }}>{stop.name}</span>
              {stop.duration && (
                <span className="text-xs" style={{ background: "white", border: "1px solid var(--border-light)", borderRadius: "var(--r-full)", padding: "1px 7px", color: "var(--text-muted)" }}>
                  ⏱ {stop.duration}
                </span>
              )}
            </div>
            {stop.location && (
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>📍 {stop.location}</div>
            )}
            <div className="text-xs italic leading-relaxed" style={{ color: "var(--text-mid)" }}>
              <span className="not-italic font-bold" style={{ color: "var(--forest)" }}>✦ </span>
              {stop.why_stop}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RouteStopsPanel({ origin, destination, journey }: RouteStopsPanelProps) {
  const [openOut, setOpenOut] = useState(true);
  const [openReturn, setOpenReturn] = useState(true);

  const outbound = journey.outbound ?? [];
  const returnStops = journey.return ?? [];

  if (outbound.length === 0 && returnStops.length === 0) return null;

  function Section({
    title, subtitle, from, to, stops, open, onToggle,
  }: {
    title: string; subtitle: string; from: string; to: string;
    stops: RouteStop[]; open: boolean; onToggle: () => void;
  }) {
    return (
      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid var(--border-mid)", boxShadow: "var(--shadow-sm)" }}>
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left"
          style={{
            background: "linear-gradient(135deg, rgba(45,106,79,0.06) 0%, rgba(72,202,228,0.05) 100%)",
            borderBottom: open ? "1px solid var(--border-light)" : "none",
            cursor: "pointer",
          }}
          onClick={onToggle}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🚗</span>
            <div>
              <div className="text-sm font-bold" style={{ color: "var(--text-dark)" }}>{title}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</div>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full transition-all" style={{ background: "var(--bg-mint)", color: "var(--forest)", border: "1px solid var(--border-mid)" }}>
            {open ? "Hide" : "Show"}
          </span>
        </button>
        {open && (
          <div className="px-5 py-4">
            <StopStrip from={from} to={to} stops={stops} />
            <StopCards stops={stops} />
            <p className="text-xs mt-4 text-center" style={{ color: "var(--text-faint)" }}>
              These stops are suggestions for the drive — skip them if you&apos;re flying
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-2">
      {outbound.length > 0 && (
        <Section
          title={`En Route: ${origin} → ${destination}`}
          subtitle={`${outbound.length} stop${outbound.length !== 1 ? "s" : ""} along the drive · road trips only`}
          from={origin}
          to={destination}
          stops={outbound}
          open={openOut}
          onToggle={() => setOpenOut((v) => !v)}
        />
      )}
      {returnStops.length > 0 && (
        <Section
          title={`Return Route: ${destination} → ${origin}`}
          subtitle={`${returnStops.length} stop${returnStops.length !== 1 ? "s" : ""} on the drive back`}
          from={destination}
          to={origin}
          stops={returnStops}
          open={openReturn}
          onToggle={() => setOpenReturn((v) => !v)}
        />
      )}
    </div>
  );
}
