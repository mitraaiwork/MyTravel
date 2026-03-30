"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Copy, Check, AlertCircle } from "lucide-react";
import { getDayCount, formatDateRange } from "@/lib/utils";
import type { Itinerary } from "@/types";
import DayCard from "@/components/itinerary/DayCard";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios
      .get<Itinerary>(`${BASE_URL}/share/${token}`)
      .then(({ data }) => setItinerary(data))
      .catch((err) => {
        if (err?.response?.status === 404) {
          setError("This itinerary is no longer shared or the link is invalid.");
        } else {
          setError("Failed to load the shared itinerary. Please try again.");
        }
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function noop(_updated: Itinerary) {}

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-cream)" }}>
      {/* Slim public header */}
      <header
        style={{
          background: "#0d1f16",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.25)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", height: 56 }}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 no-underline"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1b4332 0%, #0d9488 50%, #48cae4 100%)",
                boxShadow: "0 2px 8px rgba(45,106,79,0.35)",
              }}
            >
              ✈
            </div>
            <span className="font-extrabold text-sm tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
              MyTravel
            </span>
          </Link>
          <Link
            href="/register"
            className="btn-primary text-sm"
            style={{ padding: "7px 16px", fontSize: 13 }}
          >
            Create your own
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="skeleton rounded-xl" style={{ height: 80 }} />
            <div className="skeleton rounded-xl" style={{ height: 200 }} />
            <div className="skeleton rounded-xl" style={{ height: 200 }} />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div
            className="card flex flex-col items-center py-16 text-center"
            style={{ borderColor: "rgba(220,38,38,0.15)", background: "#fff5f5" }}
          >
            <AlertCircle size={40} style={{ color: "#dc2626", marginBottom: 16 }} />
            <h1 className="text-lg font-semibold mb-2" style={{ color: "#b91c1c" }}>
              Link unavailable
            </h1>
            <p className="text-sm mb-6" style={{ color: "#dc2626", maxWidth: 360 }}>
              {error}
            </p>
            <Link href="/" className="btn-secondary">
              Go to MyTravel
            </Link>
          </div>
        )}

        {/* Content */}
        {!isLoading && itinerary && (
          <>
            {/* Hero */}
            <div style={{ marginBottom: 24 }}>
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-3"
                style={{
                  background: "rgba(45,106,79,0.10)",
                  color: "var(--forest)",
                  border: "1px solid var(--border-mid)",
                }}
              >
                ✈ Shared Itinerary
              </div>
              <h1
                className="font-extrabold leading-tight"
                style={{ fontSize: 28, color: "var(--text-dark)", marginBottom: 6 }}
              >
                {itinerary.destination}
              </h1>
              <div className="flex items-center gap-3 flex-wrap text-sm" style={{ color: "var(--text-muted)" }}>
                <span>{itinerary.country}</span>
                {itinerary.days.length > 0 && (
                  <>
                    <span style={{ color: "var(--border-mid)" }}>·</span>
                    <span>
                      {getDayCount(
                        itinerary.days[0].date,
                        itinerary.days[itinerary.days.length - 1].date
                      )}{" "}
                      days
                    </span>
                    <span style={{ color: "var(--border-mid)" }}>·</span>
                    <span>
                      {formatDateRange(
                        itinerary.days[0].date,
                        itinerary.days[itinerary.days.length - 1].date
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Summary */}
            {itinerary.summary && (
              <div
                className="text-sm leading-relaxed rounded-xl mb-4"
                style={{
                  background: "linear-gradient(135deg, rgba(52,199,123,0.08), rgba(82,183,136,0.06))",
                  border: "1px solid rgba(45,106,79,0.12)",
                  color: "var(--text-mid)",
                  padding: "14px 16px",
                }}
              >
                {itinerary.summary}
              </div>
            )}

            {/* Practical info */}
            {itinerary.practical_info && (
              <div className="card mb-4 text-sm">
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  Practical Info
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {itinerary.practical_info.currency && (
                    <span className="badge badge-forest">
                      💵 {itinerary.practical_info.currency}
                    </span>
                  )}
                  {itinerary.practical_info.language && (
                    <span className="badge badge-forest">
                      🗣️ {itinerary.practical_info.language}
                    </span>
                  )}
                  {itinerary.practical_info.timezone && (
                    <span className="badge badge-forest">
                      🕐 {itinerary.practical_info.timezone}
                    </span>
                  )}
                </div>
                {itinerary.practical_info.transport_tips &&
                  itinerary.practical_info.transport_tips.length > 0 && (
                    <ul style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {itinerary.practical_info.transport_tips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-xs"
                          style={{ color: "var(--text-mid)" }}
                        >
                          <span style={{ color: "var(--leaf)", flexShrink: 0 }}>•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            )}

            {/* Days — readOnly */}
            <div>
              {itinerary.days.map((day, i) => (
                <DayCard
                  key={day.day}
                  day={day}
                  tripId=""
                  onItineraryChange={noop}
                  defaultOpen={i === 0}
                  readOnly
                />
              ))}
            </div>

            {/* Copy link section */}
            <div
              className="card mt-6"
              style={{ background: "white" }}
            >
              <p
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--text-dark)" }}
              >
                Share this itinerary
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  className="input text-sm flex-1"
                  style={{ color: "var(--text-mid)", background: "var(--bg-mint)" }}
                />
                <button
                  onClick={handleCopy}
                  className="btn-secondary shrink-0 flex items-center gap-1.5 text-sm"
                >
                  {copied ? (
                    <>
                      <Check size={13} style={{ color: "var(--forest)" }} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <p
              className="text-center text-xs mt-8"
              style={{ color: "var(--text-muted)" }}
            >
              Created with{" "}
              <Link
                href="/"
                style={{ color: "var(--forest)", textDecoration: "none", fontWeight: 600 }}
              >
                MyTravel AI
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
