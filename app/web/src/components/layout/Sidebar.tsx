"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";

const MAIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/trips/new",  label: "New Trip",  icon: "✈" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="app-sidebar-el flex flex-col overflow-y-auto py-4 px-2.5 print:hidden"
      style={{
        gridColumn: 1,
        gridRow: 2,
        background: "linear-gradient(180deg, #0d1f16 0%, #122b1e 60%, #0f2318 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        height: "100%",
      }}
    >
      {/* Main nav */}
      <div
        className="text-xs font-bold uppercase tracking-widest px-2.5 pb-2 pt-1"
        style={{ color: "rgba(255,255,255,0.28)", letterSpacing: "1.2px" }}
      >
        Main
      </div>

      {MAIN_NAV.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 no-underline transition-all"
          style={
            isActive(href)
              ? {
                  background: "linear-gradient(135deg, rgba(52,199,123,0.18), rgba(82,183,136,0.10))",
                  color: "#74c69d",
                  fontWeight: 600,
                  border: "1px solid rgba(52,199,123,0.22)",
                }
              : { color: "rgba(255,255,255,0.60)", border: "1px solid transparent" }
          }
          onMouseEnter={(e) => {
            if (!isActive(href))
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)";
          }}
          onMouseLeave={(e) => {
            if (!isActive(href))
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          }}
        >
          <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
          {label}
        </Link>
      ))}

      {/* Divider */}
      <div className="my-3 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

      {/* Premium section */}
      <div
        className="text-xs font-bold uppercase tracking-widest px-2.5 pb-2"
        style={{ color: "rgba(212,160,23,0.55)", letterSpacing: "1.2px" }}
      >
        Premium ✦
      </div>

      {[
        { label: "AI Concierge", icon: "💬" },
        { label: "Smart Packing", icon: "🎒" },
        { label: "Day Regen", icon: "🔄" },
        { label: "Unlimited Gen", icon: "∞" },
      ].map(({ label, icon }) => (
        <button
          key={label}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 w-full text-left transition-all"
          style={{ color: "rgba(212,160,23,0.65)", background: "none", border: "1px solid transparent", cursor: "default" }}
          title="Upgrade to Premium"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,160,23,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "#e9c46a";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(212,160,23,0.65)";
          }}
        >
          <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
          <span className="flex-1">{label}</span>
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(244,162,97,0.12))",
              color: "#92400e",
              border: "1px solid rgba(212,160,23,0.35)",
              fontSize: "9px",
            }}
          >
            PRO
          </span>
        </button>
      ))}

      {/* Bottom — user info & sign out */}
      <div className="mt-auto pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div
          className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg mb-2 cursor-default select-none"
          style={{ transition: "var(--trans)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2d6a4f, #52b788)" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div
              className="text-sm font-semibold truncate"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {user?.full_name ?? "Traveller"}
            </div>
            <div
              className="text-xs truncate"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              {user?.email ?? ""}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm w-full text-left transition-all"
          style={{ color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
          }}
        >
          <span className="w-5 text-center flex-shrink-0">→</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
