"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const DAYS = [
  { num: 1, date: "Sat, Apr 12", title: "Arrival & Shinjuku Immersion", theme: "🌸 Cherry Blossoms & City Views", weather: "🌤 18°C · Partly cloudy",
    activities: [
      { time: "10:00", cat: "Nature",  name: "Shinjuku Gyoen National Garden",   dur: "2h",   cost: "¥500",   dist: "Starting point", why: "1,000+ cherry trees across 58 acres — gentle walk that eases jet lag perfectly" },
      { time: "12:30", cat: "Food",    name: "Omoide Yokocho (Memory Lane)",     dur: "1h",   cost: "¥1,200", dist: "0.8km",           why: "50-year-old yakitori alley with open charcoal grills — iconic old Tokyo energy" },
      { time: "14:00", cat: "Views",   name: "Tokyo Metropolitan Govt Building", dur: "1.5h", cost: "Free",   dist: "0.3km",           why: "Free 360° panoramic views including Mt. Fuji — 3-min walk from last stop" },
      { time: "19:00", cat: "Food",    name: "Izakaya Dinner, Kabukicho",        dur: "2h",   cost: "¥3,500", dist: "1.1km",           why: "Diverse small plates, local sake — great introduction to Japanese dining culture" },
    ]},
  { num: 2, date: "Sun, Apr 13", title: "Ancient Tokyo & Sky-High Views", theme: "⛩️ Temples, Shrines & Skyline", weather: "☀️ 20°C · Clear skies",
    activities: [
      { time: "08:30", cat: "Culture",      name: "Senso-ji Temple, Asakusa",  dur: "2h",   cost: "Free",   dist: "Starting point", why: "Tokyo's oldest temple (645 AD) — arrive early before tour groups" },
      { time: "11:00", cat: "Shopping",     name: "Nakamise Shopping Street",  dur: "1h",   cost: "¥1,500", dist: "0km",             why: "Traditional crafts adjacent to Senso-ji — zero extra travel time" },
      { time: "13:30", cat: "Architecture", name: "Tokyo Skytree",             dur: "2h",   cost: "¥2,100", dist: "0.5km",           why: "World's tallest tower at 634m — afternoon light is perfect for photos" },
      { time: "19:30", cat: "Food",         name: "Ramen at Fuunji, Shinjuku", dur: "1h",   cost: "¥1,100", dist: "12km",            why: "Michelin-recognised tsukemen — the 20-min queue is worth every minute" },
    ]},
  { num: 3, date: "Mon, Apr 14", title: "Pop Culture & Immersive Art", theme: "🎌 Modernity Meets Tradition", weather: "🌥 16°C · Overcast",
    activities: [
      { time: "09:30", cat: "Culture", name: "Meiji Shrine",               dur: "1.5h", cost: "Free",   dist: "Starting point", why: "Forested city sanctuary — serene contrast after two action-packed days" },
      { time: "11:30", cat: "Culture", name: "Takeshita Street, Harajuku", dur: "1.5h", cost: "¥2,000", dist: "0.5km",           why: "Tokyo's most creative street-fashion corridor" },
      { time: "14:00", cat: "Art",     name: "teamLab Planets, Toyosu",   dur: "2.5h", cost: "¥3,200", dist: "8km",             why: "Immersive digital art you walk into — book ahead, sells out weeks early" },
    ]},
  { num: 4, date: "Tue, Apr 15", title: "Markets, Luxury & Akihabara", theme: "🍣 From Fish Market to Neon Streets", weather: "🌤 19°C · Partly cloudy",
    activities: [
      { time: "07:00", cat: "Food",    name: "Tsukiji Outer Market Breakfast", dur: "1.5h", cost: "¥2,000", dist: "Starting point", why: "Freshest tuna sashimi on earth — fatty-tuna stalls sell out before 10am" },
      { time: "10:00", cat: "Art",     name: "Ginza Gallery District",         dur: "2h",   cost: "Free",   dist: "1.5km",          why: "World-class free galleries — the Itoya stationery store spans 12 floors" },
      { time: "14:00", cat: "Culture", name: "Akihabara Electric Town",        dur: "3h",   cost: "¥3,000", dist: "4km",            why: "Retro gaming, electronics and anime culture packed into 6 city blocks" },
    ]},
  { num: 5, date: "Wed, Apr 16", title: "Day Trip: Kamakura by Sea", theme: "🏔️ Coastal Temples & Ancient Buddha", weather: "☀️ 17°C · Clear",
    activities: [
      { time: "07:30", cat: "Transport", name: "Train to Kamakura (JR Yokosuka)", dur: "1h",   cost: "¥940",   dist: "Starting point", why: "Just 1hr from Tokyo — completely different world of coastal temples" },
      { time: "09:30", cat: "Culture",   name: "Kotoku-in Great Buddha",          dur: "1h",   cost: "¥300",   dist: "3km",            why: "13-metre bronze Buddha cast in 1252 — best before tour groups arrive" },
      { time: "11:30", cat: "Culture",   name: "Tsurugaoka Hachimangu Shrine",    dur: "1.5h", cost: "Free",   dist: "2km",            why: "Kamakura's most sacred shrine with a 1.8km tree-lined approach avenue" },
      { time: "19:00", cat: "Food",      name: "Farewell Dinner, Shinjuku",       dur: "2h",   cost: "¥4,500", dist: "Tokyo",          why: "End where you began — the perfect close to five days in Japan" },
    ]},
];

const CAT_COLOURS: Record<string, { bg: string; color: string; border: string }> = {
  Nature:       { bg: "rgba(64,145,108,0.15)",  color: "#74c69d", border: "rgba(64,145,108,0.3)"   },
  Food:         { bg: "rgba(212,160,23,0.15)",  color: "#e9c46a", border: "rgba(212,160,23,0.3)"   },
  Views:        { bg: "rgba(72,202,228,0.15)",  color: "#90e0ef", border: "rgba(72,202,228,0.3)"   },
  Culture:      { bg: "rgba(82,183,136,0.15)",  color: "#95d5b2", border: "rgba(82,183,136,0.3)"   },
  Shopping:     { bg: "rgba(199,123,85,0.15)",  color: "#f4a261", border: "rgba(199,123,85,0.3)"   },
  Architecture: { bg: "rgba(116,179,206,0.15)", color: "#90c8dc", border: "rgba(116,179,206,0.3)"  },
  Art:          { bg: "rgba(167,139,250,0.12)", color: "#c4b5fd", border: "rgba(167,139,250,0.25)" },
  Transport:    { bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.2)"  },
};

const QUOTES = [
  { text: "I used to spend a full weekend planning a 5-day trip. MyTravel built the same quality plan in 28 seconds. Tweaked two activities and it was perfect.", name: "Sarah M.", role: "Travel blogger · 42 countries", color: "#2d6a4f", init: "S" },
  { text: "The 'why I chose this' note for every activity is genius. It's not just a list — I understand the logic. Makes me trust it completely.", name: "James K.", role: "Solo traveller · Used 14 times", color: "#0096c7", init: "J" },
  { text: "Planned our honeymoon to Kyoto. The geographic sequencing meant we never doubled back once. Our friends couldn't believe we didn't use a travel agent.", name: "Priya & Dev N.", role: "Couple · Kyoto trip", color: "#40916c", init: "P" },
  { text: "The AI concierge sold me on Premium. Asked it to find a vegetarian restaurant near our Day 2 hotel and it gave me three ranked options with walking times.", name: "Lucas F.", role: "Premium subscriber · 8 trips", color: "#c77b55", init: "L" },
  { text: "Group trip planning used to be a nightmare. Now we all vote on activities and MyTravel handles the disagreements automatically. Six friends, zero arguments.", name: "Yuki T.", role: "Group travel organiser", color: "#52b788", init: "Y" },
  { text: "The weather integration is underrated. It scheduled our outdoor hike on the clear day and indoor museum on the rainy day. Just smart.", name: "Alex R.", role: "Adventure traveller", color: "#d4a017", init: "A" },
];

const FEATURES = [
  { icon: "🗺️", title: "Day-by-Day Itinerary",      desc: "Geographically optimised activities sequenced to minimise backtracking. Every item includes duration, cost, and a \"why chosen\" note.", pill: "Free · 3/mo",  pillClass: "bg-emerald-50 text-emerald-700 border border-emerald-200", top: "linear-gradient(135deg,#1b4332,#2d6a4f,#40916c)" },
  { icon: "⚡", title: "Live Streaming Generation",   desc: "No waiting for a spinner. The itinerary streams day by day in real time — see each activity appear as the AI writes it, in under 30 seconds.", pill: "Free · 3/mo",  pillClass: "bg-emerald-50 text-emerald-700 border border-emerald-200", top: "linear-gradient(135deg,#0c4a6e,#0284c7,#0ea5e9)" },
  { icon: "🔄", title: "Single-Day Regeneration",    desc: "\"Make Day 3 more food-focused.\" Regenerate any single day while keeping everything else untouched.", pill: "Premium", pillClass: "bg-amber-50  text-amber-700  border border-amber-200",   top: "linear-gradient(135deg,#2d6a4f,#40916c,#52b788)" },
  { icon: "💬", title: "AI Concierge Chat",           desc: "Chat with AI about your full itinerary. Find restaurants near your hotel, swap dinner on Day 4, or get rainy-day alternatives.", pill: "Premium", pillClass: "bg-amber-50  text-amber-700  border border-amber-200",   top: "linear-gradient(135deg,#0369a1,#0284c7,#38bdf8)" },
  { icon: "🎒", title: "Smart Packing Lists",         desc: "A categorised packing list tailored to your destination, weather forecast, activities, and trip duration — not a generic template.", pill: "Premium", pillClass: "bg-amber-50  text-amber-700  border border-amber-200",   top: "linear-gradient(135deg,#1b4332,#155e3e,#2d6a4f)" },
  { icon: "👥", title: "Group Travel & Voting",       desc: "Invite travel companions to collaborate. Vote on activities — thumbs up, down, or neutral. Agree on the final plan before you go.", pill: "Free",     pillClass: "bg-emerald-50 text-emerald-700 border border-emerald-200", top: "linear-gradient(135deg,#0c4a6e,#0369a1,#0ea5e9)" },
];

/* ─── Frame colors for dark demo mock ──────────────────────────────────────── */
const F = { bg: "#0f1e14", bg2: "#1e3022", text: "#d4e8d4", text2: "#7dc99a", text3: "#4a8a5a" };

/* ─── Demo section ──────────────────────────────────────────────────────────── */

function DemoSection() {
  const streamRef   = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const timerRef    = useRef<HTMLSpanElement>(null);
  const timers      = useRef<ReturnType<typeof setTimeout>[]>([]);
  const interval    = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionRef  = useRef<HTMLElement>(null);
  const startedRef  = useRef(false);

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (interval.current) { clearInterval(interval.current); interval.current = null; }
  }, []);

  const sched = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const setNav = useCallback((n: number, cls: string) => {
    const el = document.getElementById(`dnav-${n}`);
    if (el) el.className = `demo-nav-item ${cls}`;
  }, []);

  const runDemo = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    clearAll();
    stream.innerHTML = "";
    for (let i = 1; i <= 5; i++) setNav(i, "");
    if (progressRef.current) progressRef.current.style.width = "0%";
    if (timerRef.current)    timerRef.current.textContent = "0s";

    let elapsed = 0;
    interval.current = setInterval(() => {
      elapsed++;
      if (timerRef.current)    timerRef.current.textContent = elapsed + "s";
      if (progressRef.current) progressRef.current.style.width = (Math.min(elapsed / 30, 1) * 100) + "%";
      if (elapsed >= 30) { clearInterval(interval.current!); interval.current = null; }
    }, 1000);

    stream.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:16px;padding:40px;text-align:center;color:${F.text2}">
        <div class="demo-orb" style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,rgba(45,106,79,0.3),rgba(72,202,228,0.25));border:1px solid rgba(82,183,136,0.4);display:flex;align-items:center;justify-content:center;font-size:28px">🌿</div>
        <div style="font-weight:600;color:${F.text};font-size:15px">MyTravel-AI is planning your trip…</div>
        <div style="font-size:13px">Fetching weather · Checking budget · Optimising routes</div>
        <div class="demo-dots"><span></span><span></span><span></span></div>
      </div>`;

    sched(() => {
      stream.innerHTML = `
        <div id="ds-status" style="display:flex;align-items:center;gap:10px;background:rgba(45,106,79,0.15);border:1px solid rgba(82,183,136,0.25);border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:#95d5b2">
          <div class="demo-spinner"></div>
          <span id="ds-label">Generating Day 1 of 5…</span>
          <div style="flex:1;height:3px;background:rgba(82,183,136,0.2);border-radius:2px;margin:0 4px">
            <div id="ds-fill" style="height:100%;background:linear-gradient(90deg,#52b788,#48cae4);border-radius:2px;width:0%;transition:width 1.5s ease"></div>
          </div>
          <span id="ds-pct" style="font-weight:600;font-size:12px;white-space:nowrap">0%</span>
        </div>
        <div id="ds-days"></div>`;
    }, 2500);

    let cur = 3000;
    DAYS.forEach((day, di) => {
      const dayT = cur;
      sched(() => {
        if (di > 0) setNav(di, "done");
        setNav(di + 1, "active");
        const pct = Math.round(di / 5 * 100);
        const fill  = document.getElementById("ds-fill")  as HTMLElement | null;
        const pctEl = document.getElementById("ds-pct");
        const lbl   = document.getElementById("ds-label");
        if (fill)  fill.style.width = pct + "%";
        if (pctEl) pctEl.textContent = pct + "%";
        if (lbl)   lbl.textContent = `Generating Day ${di + 1} of 5…`;

        const days = document.getElementById("ds-days");
        if (!days) return;
        const card = document.createElement("div");
        card.className = "demo-card";
        card.style.cssText = `border:1px solid rgba(82,183,136,0.15);border-radius:14px;overflow:hidden;margin-bottom:14px`;
        card.innerHTML = `
          <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:12px 16px;background:${F.bg2};border-bottom:1px solid rgba(255,255,255,0.05)">
            <div>
              <div style="font-size:11px;font-weight:600;color:${F.text3};text-transform:uppercase;letter-spacing:1px">Day ${day.num} · ${day.date}</div>
              <div style="font-size:14px;font-weight:700;color:${F.text};margin-top:2px">${day.title}</div>
              <div style="font-size:12px;color:${F.text2};margin-top:2px">${day.theme}</div>
            </div>
            <div style="font-size:11px;color:${F.text3};background:rgba(255,255,255,0.05);border-radius:6px;padding:4px 8px;flex-shrink:0;white-space:nowrap">${day.weather}</div>
          </div>
          <div id="da-${day.num}"></div>`;
        days.appendChild(card);
        stream.scrollTop = stream.scrollHeight;
      }, dayT);

      cur += 450;
      day.activities.forEach(act => {
        const t = cur;
        sched(() => {
          const list = document.getElementById(`da-${day.num}`);
          if (!list) return;
          const cc = CAT_COLOURS[act.cat] || CAT_COLOURS.Culture;
          const isFree = act.cost === "Free";
          const id = `act-${day.num}-${t}`;
          const item = document.createElement("div");
          item.className = "demo-item";
          item.style.cssText = `display:flex;gap:12px;align-items:flex-start;padding:11px 16px;border-bottom:1px solid rgba(255,255,255,0.04)`;
          item.innerHTML = `
            <div style="font-size:11px;font-weight:700;color:${F.text3};min-width:40px;padding-top:2px">${act.time}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;color:${F.text};line-height:1.3">
                <span id="${id}-t"></span><span class="demo-cursor"></span>
              </div>
              <div id="${id}-w" style="font-size:12px;color:${F.text2};margin-top:4px;line-height:1.5;opacity:0;transition:opacity .4s;display:flex;align-items:flex-start;gap:5px">
                <span style="color:#52b788;flex-shrink:0">✦</span><span>${act.why}</span>
              </div>
              <div id="${id}-b" style="display:flex;gap:5px;margin-top:6px;flex-wrap:wrap;opacity:0;transition:opacity .3s">
                <span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:100px;background:${cc.bg};color:${cc.color};border:1px solid ${cc.border}">${act.cat}</span>
                <span style="font-size:10px;padding:2px 7px;border-radius:100px;background:rgba(72,202,228,0.12);color:#90e0ef;border:1px solid rgba(72,202,228,0.25)">⏱ ${act.dur}</span>
                ${isFree
                  ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:100px;background:rgba(82,183,136,0.2);color:#74c69d;border:1px solid rgba(82,183,136,0.4)">FREE</span>`
                  : `<span style="font-size:10px;padding:2px 7px;border-radius:100px;background:rgba(212,160,23,0.12);color:#e9c46a;border:1px solid rgba(212,160,23,0.25)">💴 ${act.cost}</span>`}
                <span style="font-size:10px;padding:2px 7px;border-radius:100px;background:rgba(199,123,85,0.12);color:#f4a261;border:1px solid rgba(199,123,85,0.25)">📍 ${act.dist}</span>
              </div>
            </div>`;
          list.appendChild(item);
          stream.scrollTop = stream.scrollHeight;

          const titleEl  = document.getElementById(`${id}-t`);
          const cursorEl = item.querySelector(".demo-cursor") as HTMLElement | null;
          const whyEl    = document.getElementById(`${id}-w`);
          const bdgEl    = document.getElementById(`${id}-b`);
          if (!titleEl) return;
          let i = 0;
          function type() {
            if (i < act.name.length) {
              titleEl!.textContent += act.name[i++];
              timers.current.push(setTimeout(type, 25));
            } else {
              cursorEl?.remove();
              timers.current.push(setTimeout(() => { if (whyEl) whyEl.style.opacity = "1"; }, 200));
              timers.current.push(setTimeout(() => { if (bdgEl) bdgEl.style.opacity = "1"; }, 500));
            }
          }
          type();
        }, t);
        cur += 1550;
      });
    });

    sched(() => {
      setNav(5, "done");
      const fill  = document.getElementById("ds-fill")  as HTMLElement | null;
      const pctEl = document.getElementById("ds-pct");
      if (fill)  fill.style.width = "100%";
      if (pctEl) pctEl.textContent = "100%";
      const status = document.getElementById("ds-status");
      if (status) status.outerHTML = `
        <div class="demo-card" style="display:flex;align-items:center;gap:10px;background:rgba(45,106,79,0.15);border:1px solid rgba(82,183,136,0.3);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#95d5b2">
          <span style="font-size:18px">✓</span>
          <span><strong>Your 5-day Tokyo itinerary is ready.</strong> 17 activities · Est. ¥62,390 · Geographically optimised.</span>
        </div>`;
      if (progressRef.current) progressRef.current.style.width = "100%";
    }, cur);
  }, [clearAll, sched, setNav]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !startedRef.current) {
        startedRef.current = true;
        setTimeout(runDemo, 400);
        obs.disconnect();
      }
    }, { threshold: 0.25 });
    obs.observe(section);
    return () => { obs.disconnect(); clearAll(); };
  }, [runDemo, clearAll]);

  return (
    <section ref={sectionRef} id="demo" className="py-24 px-4" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #f0f9ff 100%)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 text-[#1a7a4a]" style={{ background: "rgba(26,122,74,0.08)", border: "1px solid rgba(26,122,74,0.18)" }}>Live Demo</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#0d1f12] mb-4 leading-tight">
            Watch MyTravel-AI plan a Tokyo trip<br className="hidden md:block" /> right now, in real time.
          </h2>
          <p className="text-lg text-[#2d5a3d] max-w-xl mx-auto leading-relaxed">
            MyTravel-AI analyses your travel style, budget, weather, and geography — then streams your itinerary day by day, right in front of you.
          </p>
        </div>

        {/* App mock frame */}
        <div className="rounded-2xl overflow-hidden" style={{ background: F.bg, border: "1px solid rgba(52,199,123,0.2)", boxShadow: "0 40px 100px rgba(13,30,20,0.3),0 0 0 1px rgba(52,199,123,0.08)" }}>
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: F.bg2, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbe2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs max-w-xs w-full" style={{ background: "rgba(255,255,255,0.06)", color: F.text3 }}>
                <span>🔒</span><span>mytravel.app/trips/tokyo-apr-2026</span>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="flex" style={{ height: 500 }}>
            {/* Sidebar */}
            <div className="hidden sm:flex flex-col gap-1 p-4 shrink-0" style={{ width: 220, background: F.bg2, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs font-semibold uppercase tracking-widest px-2 pb-3" style={{ color: F.text3 }}>Trip Details</div>
              <div className="rounded-xl p-3 mb-2" style={{ background: "linear-gradient(135deg,rgba(45,106,79,0.25),rgba(72,202,228,0.1))", border: "1px solid rgba(82,183,136,0.2)" }}>
                <div className="text-sm font-bold mb-2" style={{ color: F.text }}>🗼 Tokyo, Japan</div>
                <div className="text-xs space-y-1" style={{ color: F.text2 }}>
                  <div>📅 Apr 12–17 · 5 days</div>
                  <div>👥 2 adults · Couple</div>
                  <div>💰 ¥200,000 budget</div>
                  <div>🌤 18°C · Partly Cloudy</div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {["Culture","Food","Architecture"].map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(82,183,136,0.2)", color: "#95d5b2", border: "1px solid rgba(82,183,136,0.3)" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
              {[["Pace","Moderate"],["Mobility","Full"]].map(([k,v]) => (
                <div key={k} className="flex justify-between items-center px-2 py-1.5 text-xs">
                  <span style={{ color: F.text3 }}>{k}</span>
                  <span className="font-semibold" style={{ color: F.text }}>{v}</span>
                </div>
              ))}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
              <div className="text-xs font-semibold uppercase tracking-widest px-2 pb-2" style={{ color: F.text3 }}>Itinerary</div>
              {[["Shinjuku",1],["Asakusa",2],["Harajuku",3],["Ginza",4],["Kamakura",5]].map(([place,num]) => (
                <div key={num} id={`dnav-${num}`} className="demo-nav-item">
                  <div className="dot" /> Day {num} · {place}
                </div>
              ))}
            </div>

            {/* Stream */}
            <div ref={streamRef} className="flex-1 overflow-y-auto p-4 flex flex-col" style={{ background: F.bg }} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          <div className="flex-1 max-w-sm h-1 rounded-full overflow-hidden" style={{ background: "#e5e7eb" }}>
            <div ref={progressRef} className="h-full rounded-full" style={{ width: "0%", background: "linear-gradient(90deg,#2d6a4f,#48cae4)", transition: "width .5s linear" }} />
          </div>
          <span ref={timerRef} className="text-xs text-[#6b9a76] w-8 text-right tabular-nums">0s</span>
          <button onClick={runDemo} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-white border border-gray-200 text-[#2d5a3d] hover:bg-gray-50 transition-colors shadow-sm">
            ↺ Replay
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Quotes marquee ─────────────────────────────────────────────────────────── */

function QuotesSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const track = trackRef.current;
    if (!track || track.childElementCount > 0) return;
    [...QUOTES, ...QUOTES].forEach(q => {
      const card = document.createElement("div");
      card.style.cssText = "width:300px;flex-shrink:0;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:22px;backdrop-filter:blur(12px)";
      card.innerHTML = `
        <div style="color:#fbbf24;font-size:13px;letter-spacing:2px;margin-bottom:10px">★★★★★</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.8;margin-bottom:16px">"${q.text}"</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:white;flex-shrink:0;background:${q.color}">${q.init}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.9)">${q.name}</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.45)">${q.role}</div>
          </div>
        </div>`;
      track.appendChild(card);
    });
  }, []);

  return (
    <section className="py-20 overflow-hidden" style={{ background: "linear-gradient(160deg,#0a1628 0%,#0d1f16 50%,#0c1520 100%)" }}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(90deg,#0a1628,transparent)" }} />
        <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(-90deg,#0a1628,transparent)" }} />
        <div ref={trackRef} className="marquee-track" />
      </div>
    </section>
  );
}

/* ─── Landing page ───────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const scrollToDemo = () => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="bg-white text-[#0d1f12]" style={{ fontFamily: "var(--font-sans)" }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between h-16 px-6 lg:px-12 bg-white/85 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-xl text-[#0d1f12] no-underline">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-lg" style={{ background: "linear-gradient(135deg,#0d6e3c,#34c77b,#0ea5e9)" }}>✈</div>
          MyTravel
        </Link>
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {[["#demo","Live Demo"],["#features","Features"],["#pricing","Pricing"]].map(([href,label]) => (
            <li key={href}><a href={href} className="text-sm font-medium text-[#4b7a5e] hover:text-[#0d1f12] transition-colors no-underline">{label}</a></li>
          ))}
          <li><Link href="/blog" className="text-sm font-medium text-[#4b7a5e] hover:text-[#0d1f12] transition-colors no-underline">Blog</Link></li>
        </ul>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-[#2d5a3d] px-4 py-2 rounded-xl border border-black/10 hover:bg-black/3 transition-colors no-underline">Sign in</Link>
          <Link href="/register" className="inline-flex text-sm font-semibold text-white px-4 py-2 rounded-xl no-underline shadow-lg transition-all hover:-translate-y-px" style={{ background: "linear-gradient(135deg,#0d6e3c,#1a7a4a,#34c77b)", boxShadow: "0 4px 16px rgba(26,122,74,0.35)" }}>Start Free</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16" style={{ background: "radial-gradient(ellipse 90% 70% at 15% 20%, rgba(45,106,79,0.18) 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 85% 15%, rgba(14,165,233,0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 50% 95%, rgba(52,199,123,0.12) 0%, transparent 50%), linear-gradient(160deg, #e8faf0 0%, #ebf7ff 45%, #f5feff 100%)" }}>
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(45,106,79,0.2)", boxShadow: "0 2px 16px rgba(45,106,79,0.12)", color: "#1a7a4a", backdropFilter: "blur(8px)" }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0 pulse-badge" style={{ background: "#34c77b" }} />
          Powered by MyTravel-AI
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black tracking-tight leading-none mb-6 text-[#0d1f12]">
          Your dream trip,<br />
          <span className="gradient-text">planned in seconds.</span>
        </h1>
        <p className="text-lg md:text-xl text-[#4b7a5e] max-w-lg mx-auto leading-relaxed mb-10">
          Tell us where you want to go. MyTravel-AI builds a complete, day-by-day itinerary tailored to your style, budget, and travel pace — streamed live as it generates.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button onClick={scrollToDemo} className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-base font-bold text-white shadow-xl transition-all hover:-translate-y-1" style={{ background: "linear-gradient(135deg,#0d6e3c,#1a7a4a,#34c77b)", boxShadow: "0 8px 32px rgba(26,122,74,0.4)" }}>
            ▶ Watch Live Demo
          </button>
          <Link href="/register" className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-base font-bold text-[#0d1f12] no-underline transition-all hover:-translate-y-1" style={{ background: "rgba(255,255,255,0.9)", border: "1.5px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            Plan My Trip — Free
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {[["12,400+","Trips planned"],["98%","User satisfaction"],["180+","Destinations"],["< 30s","To full itinerary"]].map(([num,label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-black mb-1" style={{ background: "linear-gradient(135deg,#0d6e3c,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{num}</div>
              <div className="text-sm text-[#6b9a76] font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo ── */}
      <DemoSection />

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 text-[#1a7a4a]" style={{ background: "rgba(26,122,74,0.08)", border: "1px solid rgba(26,122,74,0.15)" }}>Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#0d1f12] leading-tight">
              Everything you need.<br />Nothing you don&apos;t.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="lp-feature-card">
                <div className="h-20 flex items-center px-7 relative overflow-hidden" style={{ background: f.top }}>
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/15" />
                  <span className="text-3xl relative z-10">{f.icon}</span>
                </div>
                <div className="px-7 pb-7">
                  <h3 className="text-base font-bold mt-5 mb-2 text-[#0d1f12]">{f.title}</h3>
                  <p className="text-sm text-[#2d5a3d] leading-relaxed">{f.desc}</p>
                  <span className={`inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mt-4 ${f.pillClass}`}>{f.pill}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 px-4" style={{ background: "#f6fdf8" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 text-[#1a7a4a]" style={{ background: "rgba(26,122,74,0.08)", border: "1px solid rgba(26,122,74,0.15)" }}>How It Works</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#0d1f12]">Trip planned in 3 steps.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-9 left-1/6 right-1/6 h-0.5" style={{ background: "linear-gradient(90deg,transparent,rgba(26,122,74,0.25),rgba(14,165,233,0.25),transparent)" }} />
            {[
              { n:"1", gradient:"linear-gradient(135deg,#1a7a4a,#34c77b)", shadow:"0 8px 28px rgba(26,122,74,0.3)",  title:"Tell us about your trip",        desc:"Enter your destination, dates, travel style, and budget. Takes 60 seconds." },
              { n:"2", gradient:"linear-gradient(135deg,#0284c7,#38bdf8)", shadow:"0 8px 28px rgba(2,132,199,0.3)",  title:"Watch the AI build it live",     desc:"MyTravel-AI fetches live weather, optimises routes, and streams your itinerary in under 30 seconds." },
              { n:"3", gradient:"linear-gradient(135deg,#d97706,#fbbf24)", shadow:"0 8px 28px rgba(217,119,6,0.3)",  title:"Edit, export & go",               desc:"Drag to reorder, regenerate any day, export to PDF or calendar, and share with travel partners." },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-black text-white relative z-10" style={{ background: s.gradient, boxShadow: s.shadow }}>{s.n}</div>
                <h3 className="text-base font-bold mb-2 text-[#0d1f12]">{s.title}</h3>
                <p className="text-sm text-[#2d5a3d] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quotes ── */}
      <QuotesSection />

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 text-[#1a7a4a]" style={{ background: "rgba(26,122,74,0.08)", border: "1px solid rgba(26,122,74,0.15)" }}>Pricing</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#0d1f12] mb-3">Start free. Go premium<br />when you&apos;re ready.</h2>
            <p className="text-[#4b7a5e]">No credit card required to get started.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Free */}
            <div className="bg-white rounded-3xl p-9 border border-black/8 shadow-md">
              <span className="inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-5" style={{ background: "rgba(120,160,130,0.1)", color: "#5a8a6a", border: "1px solid rgba(120,160,130,0.2)" }}>Free</span>
              <div className="text-xl font-extrabold mb-1 text-[#0d1f12]">Traveller</div>
              <div className="text-sm text-[#4b7a5e] mb-4">Everything you need to get started.</div>
              <div className="flex items-start gap-1 mb-1">
                <span className="text-xl font-bold text-[#0d1f12] mt-2">$</span>
                <span className="text-5xl font-black tracking-tight text-[#0d1f12]">0</span>
                <span className="text-sm text-[#6b9a76] self-end mb-2">/mo</span>
              </div>
              <div className="text-xs text-[#6b9a76] mb-6">Forever free · No credit card</div>
              <div className="h-px bg-black/6 mb-6" />
              {[["✓","3 AI itinerary generations / month",true],["✓","Full day-by-day itinerary with maps",true],["✓","Group collaboration & voting",true],["✓","Alternative activity suggestions",true],["–","Day regeneration",false],["–","AI Concierge Chat",false],["–","AI Packing Lists",false],["–","Offline access",false]].map(([c,f,on]) => (
                <div key={String(f)} className="flex items-start gap-2.5 text-sm mb-3">
                  <span className={`flex-shrink-0 mt-0.5 font-bold ${on ? "text-emerald-600" : "text-slate-300"}`}>{c}</span>
                  <span className={on ? "text-[#2d5a3d]" : "text-slate-400"}>{String(f)}</span>
                </div>
              ))}
              <Link href="/register" className="mt-6 block text-center text-sm font-bold py-3.5 rounded-xl border-2 border-black/10 text-[#0d1f12] hover:bg-black/3 transition-colors no-underline">Get Started Free</Link>
            </div>

            {/* Premium */}
            <div className="rounded-3xl p-9 border" style={{ background: "linear-gradient(160deg,#0d1f16 0%,#1a3a28 50%,#0f2a1e 100%)", borderColor: "rgba(52,199,123,0.3)", boxShadow: "0 24px 64px rgba(13,31,22,0.35),0 0 0 1px rgba(52,199,123,0.15)" }}>
              <span className="inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-5" style={{ background: "rgba(212,160,23,0.12)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.25)" }}>⭐ Most Popular</span>
              <div className="text-xl font-extrabold mb-1 text-white">Premium</div>
              <div className="text-sm text-[#4b8a5e] mb-4">For serious travellers who want everything.</div>
              <div className="flex items-start gap-1 mb-1">
                <span className="text-xl font-bold text-white mt-2">$</span>
                <span className="text-5xl font-black tracking-tight text-white">9</span>
                <span className="text-2xl font-black text-white self-start mt-2">.99</span>
                <span className="text-sm text-[#4b8a5e] self-end mb-2">/mo</span>
              </div>
              <div className="text-xs text-emerald-400 mb-6">or $79/year — save 34%</div>
              <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.1)" }} />
              {[["Unlimited AI itinerary generations"],["Single-day regeneration"],["AI Concierge Chat (unlimited)"],["AI Packing List generation"],["Offline access (PWA + mobile)"],["PDF & calendar export"],["No sponsored placements"],["Priority support"]].map(([f]) => (
                <div key={f} className="flex items-start gap-2.5 text-sm mb-3">
                  <span className="text-emerald-400 flex-shrink-0 mt-0.5 font-bold">✓</span>
                  <span className="text-white/80">{f}</span>
                </div>
              ))}
              <Link href="/register" className="mt-6 block text-center text-sm font-bold py-3.5 rounded-xl text-white no-underline transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg,#34c77b,#059669)", boxShadow: "0 8px 24px rgba(52,199,123,0.4)" }}>Start Premium Free Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 text-center relative overflow-hidden" style={{ background: "radial-gradient(ellipse 80% 60% at 30% 50%,rgba(52,199,123,0.15) 0%,transparent 60%),radial-gradient(ellipse 60% 60% at 80% 40%,rgba(14,165,233,0.12) 0%,transparent 55%),linear-gradient(160deg,#071412 0%,#0a1f16 50%,#070e1a 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-semibold text-emerald-400" style={{ background: "rgba(52,199,123,0.1)", border: "1px solid rgba(52,199,123,0.2)" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #34c77b" }} />
            No credit card required
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-5 leading-tight">
            Ready to plan your<br /><span className="gradient-text">next adventure?</span>
          </h2>
          <p className="text-lg text-white/60 mb-10 leading-relaxed">
            Join 12,400+ travellers who plan smarter trips with MyTravel-AI.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-base font-bold text-white no-underline transition-all hover:-translate-y-1" style={{ background: "linear-gradient(135deg,#0d6e3c,#1a7a4a,#34c77b)", boxShadow: "0 8px 32px rgba(26,122,74,0.4)" }}>
              Plan My Trip — It&apos;s Free
            </Link>
            <button onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })} className="px-7 py-4 rounded-2xl text-base font-bold text-white/80 transition-all hover:text-white hover:bg-white/10" style={{ border: "1.5px solid rgba(255,255,255,0.15)" }}>
              Watch Demo Again
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-14 pt-14 pb-8" style={{ background: "linear-gradient(160deg,#07140d 0%,#0a1a14 60%,#070e18 100%)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex flex-wrap justify-between gap-10 mb-12">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5 font-extrabold text-xl text-white no-underline mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: "linear-gradient(135deg,#0d6e3c,#34c77b,#0ea5e9)" }}>✈</div>
              MyTravel
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              AI-powered travel planning for curious, spontaneous, and budget-conscious travellers.
            </p>
          </div>
          {[
            { title:"Product",  links:[["Features","#"],["Pricing","#pricing"],["Curated Tours","#"],["Mobile App","#"]] },
            { title:"Company",  links:[["About","#"],["Blog","/blog"],["Careers","#"],["Contact","#"]] },
            { title:"Legal",    links:[["Privacy Policy","#"],["Terms of Service","#"],["Cookie Policy","#"]] },
          ].map(g => (
            <div key={g.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.28)" }}>{g.title}</h4>
              <ul className="space-y-2.5 list-none p-0 m-0">
                {g.links.map(([label, href]) => <li key={label}><Link href={href} className="text-sm no-underline transition-colors" style={{ color: "rgba(255,255,255,0.48)" }}>{label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-between items-center gap-3 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>© 2026 MyTravel. All rights reserved.</p>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>Crafted with ❤ for travellers everywhere</span>
        </div>
      </footer>
    </div>
  );
}
