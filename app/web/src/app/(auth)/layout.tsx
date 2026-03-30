import Link from "next/link";
import type { ReactNode } from "react";

const DESTINATION_PHOTOS = [
  { id: "photo-1570077188670-e3a8d69ac5ff", label: "Santorini" },
  { id: "photo-1540959733332-eab4deabeeaf", label: "Tokyo" },
  { id: "photo-1499856871958-5b9627545d1a", label: "Paris" },
  { id: "photo-1526772662000-3f88f10405ff", label: "Bali" },
  { id: "photo-1483729558449-99ef09a8c325", label: "Rio" },
  { id: "photo-1521747116042-5a810fda9664", label: "Cappadocia" },
  { id: "photo-1506905925346-21bda4d32df4", label: "Swiss Alps" },
  { id: "photo-1518509562904-e7ef99cdcc86", label: "Maldives" },
  { id: "photo-1552832230-c0197dd311b5", label: "Rome" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "440px 1fr",
        minHeight: "100vh",
      }}
    >
      {/* ── Brand panel ──────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 55%, #40916c 100%)",
          padding: "48px 40px",
        }}
      >
        {/* Photo mosaic background */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1" style={{ opacity: 0.35 }}>
          {DESTINATION_PHOTOS.map(({ id, label }) => (
            <div key={id} className="relative overflow-hidden rounded-lg">
              <img
                src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=70`}
                alt={label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
              <span className="absolute bottom-1.5 left-2 text-white/80 font-medium" style={{ fontSize: "10px" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Semi-transparent overlay for text readability */}
        <div className="absolute inset-0" style={{ background: "rgba(27,67,50,0.35)" }} />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10 no-underline mb-14">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.20)" }}
          >
            ✈
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">MyTravel</span>
        </Link>

        {/* Headline */}
        <div className="relative z-10 mt-auto mb-8">
          <h2
            className="font-extrabold text-white leading-tight mb-6"
            style={{ fontSize: "28px", letterSpacing: "-0.5px" }}
          >
            Welcome back. Your next adventure is waiting.
          </h2>
          <ul className="space-y-3.5">
            {[
              "Your saved trips are ready to continue",
              "Share itineraries and plan with friends",
              "AI-powered plans ready in 30 seconds",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.87)" }}>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white font-bold"
                  style={{ background: "rgba(255,255,255,0.20)", fontSize: "11px" }}
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Recent trips pills */}
        <div className="relative z-10 mb-8">
          <div className="flex gap-2 flex-wrap mb-2">
            {[
              { flag: "🇯🇵", label: "Tokyo · 5 days" },
              { flag: "🇫🇷", label: "Paris · 6 days" },
              { flag: "🇮🇩", label: "Bali · 7 days" },
              { flag: "🇮🇹", label: "Rome · 4 days" },
            ].map((t) => (
              <div
                key={t.label}
                className="flex items-center gap-2 text-sm"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  color: "rgba(255,255,255,0.90)",
                }}
              >
                {t.flag} <span>{t.label}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.50)", paddingTop: "4px" }}>
            Trips planned this week by MyTravel users
          </p>
        </div>

        {/* Quote */}
        <blockquote
          className="relative z-10"
          style={{
            background: "rgba(255,255,255,0.10)",
            borderRadius: "var(--r-md)",
            borderLeft: "3px solid rgba(255,255,255,0.30)",
            padding: "20px",
          }}
        >
          <p className="text-sm italic leading-relaxed" style={{ color: "rgba(255,255,255,0.87)" }}>
            &ldquo;The geographic sequencing meant we never doubled back once. Our friends couldn&apos;t believe we didn&apos;t use a travel agent.&rdquo;
          </p>
          <cite className="block text-xs mt-1.5 not-italic" style={{ color: "rgba(255,255,255,0.55)" }}>
            — Priya &amp; Dev N., Kyoto honeymoon
          </cite>
        </blockquote>
      </div>

      {/* ── Form panel ────────────────────────────────────────────── */}
      <div className="flex items-center justify-center px-8 py-12 bg-white min-h-screen">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <span className="text-xl">✈</span>
          <span className="font-bold text-lg" style={{ color: "var(--forest)" }}>MyTravel</span>
        </div>
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
