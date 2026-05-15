"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";

const NAV = [
  { href: "/dashboard", label: "Home",     icon: "🏠" },
  { href: "/trips/new", label: "New Trip", icon: "✈" },
  { href: "/profile",   label: "Profile",  icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav className="app-bottom-nav print:hidden">
      {NAV.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className="bottom-nav-item"
          style={isActive(href) ? { color: "var(--leaf)" } : { color: "rgba(255,255,255,0.50)" }}
        >
          <span style={{ fontSize: 22 }}>{icon}</span>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2px" }}>{label}</span>
        </Link>
      ))}
      <button
        className="bottom-nav-item"
        style={{ color: "rgba(255,255,255,0.50)", background: "none", border: "none", cursor: "pointer" }}
        onClick={() => { logout(); router.push("/login"); }}
      >
        <span style={{ fontSize: 22 }}>→</span>
        <span style={{ fontSize: 11, fontWeight: 600 }}>Sign out</span>
      </button>
    </nav>
  );
}
