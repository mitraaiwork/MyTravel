"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import { Bell } from "lucide-react";

export default function AppHeader() {
  const router = useRouter();
  const { user } = useAuth();

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header
      className="flex items-center gap-4 px-6 z-50 print:hidden"
      style={{
        gridColumn: "1 / -1",
        gridRow: "1",
        height: "var(--header-h, 64px)",
        background: "#0d1f16",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.25)",
      }}
    >
      {/* Logo — fixed sidebar width */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 flex-shrink-0 no-underline"
        style={{ width: "calc(var(--sidebar-w) - 24px)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #1b4332 0%, #0d9488 50%, #48cae4 100%)",
            boxShadow: "0 2px 8px rgba(45,106,79,0.35)",
          }}
        >
          ✈
        </div>
        <span className="font-extrabold text-base tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
          MyTravel
        </span>
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none">🔍</span>
        <input
          type="text"
          placeholder="Search destinations, saved trips…"
          className="w-full py-2 pl-8 pr-4 text-sm rounded-full outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.85)",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(82,183,136,0.50)";
            e.target.style.background = "rgba(255,255,255,0.12)";
            e.target.style.boxShadow = "0 0 0 3px rgba(82,183,136,0.15)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(255,255,255,0.12)";
            e.target.style.background = "rgba(255,255,255,0.08)";
            e.target.style.boxShadow = "none";
          }}
          readOnly
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2.5 ml-auto">
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: "none",
            border: "1.5px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.60)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.90)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.60)";
          }}
          title="Notifications"
        >
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 cursor-pointer select-none"
          style={{ background: "linear-gradient(135deg, #2d6a4f, #52b788)" }}
          title={user?.full_name ?? "Account"}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
