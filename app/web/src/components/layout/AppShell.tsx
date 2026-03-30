"use client";

import type { ReactNode } from "react";
import AppHeader from "./AppHeader";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        .app-shell {
          display: grid;
          grid-template-columns: var(--sidebar-w) 1fr;
          grid-template-rows: var(--header-h) 1fr;
          height: 100vh;
          overflow: hidden;
        }
        .app-shell-main {
          grid-column: 2;
          grid-row: 2;
          overflow-y: auto;
          background:
            radial-gradient(ellipse 70% 50% at 80% 10%, rgba(52,199,123,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 10% 80%, rgba(14,165,233,0.04) 0%, transparent 55%),
            var(--bg-cream);
        }
        @media (max-width: 900px) {
          .app-shell {
            grid-template-columns: 1fr;
          }
          .app-sidebar-el { display: none !important; }
          .app-shell-main { grid-column: 1; }
        }
        @media print {
          .app-shell { height: auto; overflow: visible; display: block; }
          .app-shell-main { overflow: visible; }
        }
      `}</style>
      <div className="app-shell">
        <AppHeader />
        <Sidebar />
        <main className="app-shell-main">
          <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
