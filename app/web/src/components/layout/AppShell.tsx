"use client";

import type { ReactNode } from "react";
import AppHeader from "./AppHeader";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

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
        .app-content-area {
          padding: 28px 32px;
          max-width: 1280px;
        }
        /* Bottom nav — desktop hidden */
        .app-bottom-nav { display: none; }

        @media (max-width: 900px) {
          .app-shell {
            grid-template-columns: 1fr;
          }
          .app-sidebar-el { display: none !important; }
          .app-shell-main {
            grid-column: 1;
            padding-bottom: 72px; /* space for bottom nav */
          }
          .app-content-area {
            padding: 16px 16px 8px;
          }
          /* Bottom nav — mobile visible */
          .app-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
            height: 60px;
            padding-bottom: env(safe-area-inset-bottom);
            background: #0d1f16;
            border-top: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 -4px 20px rgba(0,0,0,0.30);
            align-items: stretch;
          }
          .bottom-nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            text-decoration: none;
            transition: background 0.15s ease;
            -webkit-tap-highlight-color: transparent;
          }
          .bottom-nav-item:active {
            background: rgba(255,255,255,0.06);
          }
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
          <div className="app-content-area">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
