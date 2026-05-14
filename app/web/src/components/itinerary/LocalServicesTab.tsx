"use client";

import { useEffect, useState } from "react";
import { itineraryApi } from "@/lib/api";
import type { LocalServiceCategory, LocalServiceItem } from "@/types";

// Exported only for the print section in page.tsx
export const LOCAL_SERVICE_CATEGORIES: LocalServiceCategory[] = [
  {
    id: "emergency", label: "Emergency", emoji: "🚨",
    items: [
      { name: "Emergency Services", note: "Police · Fire · Ambulance", phone: "911" },
      { name: "City Police Station", address: "Downtown precinct", hours: "24 hrs" },
      { name: "Fire & Rescue", address: "Central fire station", hours: "24 hrs" },
    ],
  },
  {
    id: "hospital", label: "Hospital & Urgent Care", emoji: "🏥",
    items: [
      { name: "City General Hospital", address: "Medical district", hours: "24 hrs" },
      { name: "Urgent Care Clinic", address: "Near city centre", hours: "8 am–10 pm" },
    ],
  },
  {
    id: "pharmacy", label: "Pharmacy", emoji: "💊",
    items: [
      { name: "Central Pharmacy", address: "High Street", hours: "8 am–9 pm" },
      { name: "24-Hour Pharmacy", address: "Near main square", hours: "24 hrs" },
    ],
  },
  {
    id: "grocery", label: "Grocery & Supermarket", emoji: "🛒",
    items: [
      { name: "City Supermarket", address: "Market Square" },
      { name: "Convenience Store", address: "Near accommodation", hours: "7 am–11 pm" },
    ],
  },
  {
    id: "atm", label: "ATM & Currency Exchange", emoji: "🏧",
    items: [
      { name: "International ATM", address: "City Centre" },
      { name: "Currency Exchange", address: "Airport & tourist areas", hours: "6 am–10 pm" },
    ],
  },
  {
    id: "embassy", label: "Embassy & Consulate", emoji: "🛟",
    items: [
      { name: "US Embassy", address: "Embassy District" },
      { name: "UK Consulate", address: "Diplomatic Quarter" },
    ],
  },
];

const CATEGORY_STYLE: Record<string, { bg: string; border: string; accent: string }> = {
  emergency: { bg: "rgba(239,68,68,0.05)",   border: "rgba(239,68,68,0.18)",   accent: "#dc2626" },
  hospital:  { bg: "rgba(14,165,233,0.05)",  border: "rgba(14,165,233,0.18)",  accent: "#0369a1" },
  pharmacy:  { bg: "rgba(16,185,129,0.05)",  border: "rgba(16,185,129,0.18)",  accent: "#059669" },
  grocery:   { bg: "rgba(22,163,74,0.05)",   border: "rgba(22,163,74,0.18)",   accent: "#15803d" },
  atm:       { bg: "rgba(234,179,8,0.05)",   border: "rgba(234,179,8,0.18)",   accent: "#b45309" },
  embassy:   { bg: "rgba(139,92,246,0.05)",  border: "rgba(139,92,246,0.18)",  accent: "#7c3aed" },
};

const DEFAULT_STYLE = { bg: "rgba(100,100,100,0.05)", border: "rgba(100,100,100,0.15)", accent: "#64748b" };

function ServiceRow({
  item,
  style,
  isLast,
}: {
  item: LocalServiceItem;
  style: { bg: string; border: string; accent: string };
  isLast: boolean;
}) {
  const hasLinks = item.website || item.phone || item.address;
  return (
    <div style={{
      padding: "13px 16px",
      borderBottom: isLast ? "none" : "1px solid var(--border-light)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: item.note || item.address || item.phone ? 5 : 0 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-dark)", lineHeight: 1.4 }}>{item.name}</span>
        {item.hours && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: style.accent, whiteSpace: "nowrap",
            background: style.bg, border: `1px solid ${style.border}`,
            borderRadius: 20, padding: "2px 9px", flexShrink: 0,
          }}>
            {item.hours}
          </span>
        )}
      </div>

      {item.note && (
        <div style={{ fontSize: 12, color: style.accent, marginBottom: 5, lineHeight: 1.4 }}>{item.note}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: hasLinks ? 9 : 0 }}>
        {item.address && (
          <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: 5, lineHeight: 1.4 }}>
            <span style={{ marginTop: 1, flexShrink: 0 }}>📍</span>
            <span>{item.address}</span>
          </span>
        )}
        {item.phone && (
          <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ flexShrink: 0 }}>📞</span>
            <span>{item.phone}</span>
          </span>
        )}
      </div>

      {hasLinks && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {item.website && (
            <a href={item.website} target="_blank" rel="noopener noreferrer" style={chipStyle}>
              Website
            </a>
          )}
          {item.phone && (
            <a href={`tel:${item.phone}`} style={chipStyle}>
              Call
            </a>
          )}
          {item.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(item.name + " " + (item.address ?? ""))}`}
              target="_blank"
              rel="noopener noreferrer"
              style={chipStyle}
            >
              Directions
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const chipStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-muted)",
  textDecoration: "none",
  background: "rgba(100,100,100,0.05)",
  border: "1px solid var(--border-light)",
  borderRadius: 6,
  padding: "3px 10px",
};

function CategoryCard({ cat }: { cat: LocalServiceCategory }) {
  const s = CATEGORY_STYLE[cat.id] ?? DEFAULT_STYLE;
  return (
    <div style={{
      background: "white",
      border: "1px solid var(--border-light)",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "11px 16px",
        background: s.bg,
        borderBottom: `1px solid ${s.border}`,
      }}>
        <span style={{ fontSize: 15 }}>{cat.emoji}</span>
        <span style={{
          fontWeight: 700, fontSize: 11,
          textTransform: "uppercase", letterSpacing: "0.7px",
          color: s.accent,
        }}>
          {cat.label}
        </span>
        {cat.items.length > 0 && (
          <span style={{
            marginLeft: "auto", fontSize: 10, fontWeight: 700,
            color: s.accent, background: "white",
            border: `1px solid ${s.border}`, borderRadius: 10,
            padding: "1px 7px",
          }}>
            {cat.items.length}
          </span>
        )}
      </div>

      {cat.items.length > 0
        ? cat.items.map((item, i) => (
            <ServiceRow key={i} item={item} style={s} isLast={i === cat.items.length - 1} />
          ))
        : (
          <div style={{
            padding: "14px 16px",
            fontSize: 12, color: "var(--text-muted)",
            fontStyle: "italic", lineHeight: 1.5,
          }}>
            {cat.not_found_note ?? "No services found within 25 miles."}
          </div>
        )
      }
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[78, 62, 70].map((w, i) => (
        <div key={i} style={{
          borderRadius: 14,
          border: "1px solid var(--border-light)",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            height: 40,
            background: "rgba(100,100,100,0.05)",
            borderBottom: "1px solid var(--border-light)",
          }} />
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ height: 13, background: "rgba(100,100,100,0.07)", borderRadius: 6, width: `${w}%` }} />
            <div style={{ height: 11, background: "rgba(100,100,100,0.05)", borderRadius: 6, width: `${w - 18}%` }} />
          </div>
          <div style={{ borderTop: "1px solid var(--border-light)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ height: 13, background: "rgba(100,100,100,0.07)", borderRadius: 6, width: `${w - 10}%` }} />
            <div style={{ height: 11, background: "rgba(100,100,100,0.05)", borderRadius: 6, width: `${w - 25}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LocalServicesTab({ destination, publicId }: { destination: string; publicId: string }) {
  const [categories, setCategories] = useState<LocalServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReal, setIsReal] = useState(false);
  const [notApplicable, setNotApplicable] = useState(false);
  const [notApplicableMsg, setNotApplicableMsg] = useState("");
  const [referenceCity, setReferenceCity] = useState("");

  useEffect(() => {
    let cancelled = false;
    itineraryApi.getLocalServices(publicId)
      .then((data) => {
        if (cancelled) return;
        if (data.not_applicable) {
          setNotApplicable(true);
          setNotApplicableMsg(data.message ?? "Local services are shown for specific cities or towns.");
        } else if (data.categories?.length) {
          setCategories(data.categories);
          setIsReal(true);
          if (data.reference_city) setReferenceCity(data.reference_city);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [publicId]);

  const subtitle = loading
    ? `Loading services for ${destination}…`
    : notApplicable
      ? destination
      : referenceCity
        ? `MyTravel found services within 25 miles of ${referenceCity}`
        : isReal
          ? `MyTravel found services within 25 miles of ${destination}`
          : `Contacts and services near ${destination}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px",
        background: "linear-gradient(135deg, rgba(14,165,233,0.07) 0%, rgba(22,163,74,0.07) 100%)",
        border: "1px solid var(--border-light)",
        borderRadius: 14,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "rgba(14,165,233,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>
          🏥
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)" }}>
            Local Services &amp; Emergency Contacts
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>
            {subtitle}
          </div>
        </div>
        {loading && (
          <svg className="animate-spin h-4 w-4 flex-shrink-0" style={{ color: "var(--forest)" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && <Skeleton />}

      {/* Not-applicable state */}
      {!loading && notApplicable && (
        <div style={{
          padding: "36px 24px", textAlign: "center",
          background: "rgba(100,100,100,0.03)",
          border: "1px solid var(--border-light)", borderRadius: 14,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌍</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-dark)", marginBottom: 8 }}>
            Local services aren&apos;t available for {destination}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
            {notApplicableMsg}
          </div>
        </div>
      )}

      {/* Category cards */}
      {!loading && !notApplicable && categories.map(cat => (
        <CategoryCard key={cat.id} cat={cat} />
      ))}
    </div>
  );
}
