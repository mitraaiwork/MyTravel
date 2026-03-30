import Link from "next/link";
import { notFound } from "next/navigation";

/* ─── Blog content ──────────────────────────────────────────────────────────── */

const POSTS: Record<string, {
  title: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  authorInitial: string;
  authorColor: string;
  gradient: string;
  emoji: string;
  pillClass: string;
  sections: { heading?: string; body?: string; type?: "quote" | "tip" | "list"; items?: string[] }[];
  relatedSlug: string;
  relatedTitle: string;
}> = {
  "how-ai-changed-travel-planning": {
    title: "How AI Changed the Way I Plan Trips Forever",
    category: "Travel Tips",
    date: "March 15, 2026",
    readTime: "6 min read",
    author: "Sarah M.",
    authorRole: "Travel writer · 42 countries",
    authorInitial: "S",
    authorColor: "#2d6a4f",
    gradient: "linear-gradient(135deg,#1b4332,#2d6a4f,#40916c)",
    emoji: "🤖",
    pillClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    relatedSlug: "hidden-gems-southeast-asia-2026",
    relatedTitle: "7 Hidden Gems in Southeast Asia You Haven't Discovered Yet",
    sections: [
      {
        body: "I used to spend entire weekends piecing together itineraries. Forum threads, travel blogs, booking sites, Google Maps pinned to the point of absurdity — and the result was always the same: a plan that looked fine on paper but felt deeply generic in reality. I'd land in a new city and realise my \"curated\" list was basically just the top ten results on TripAdvisor, sorted by proximity to my hotel.",
      },
      {
        body: "So when a friend mentioned she'd been using an AI travel planner, I was sceptical in that particular way you are when something sounds too good. I'd tried the chatbot approach before and found it useful for quick Q&A but useless for actual planning — the outputs were vague, inconsistent, and required so much back-and-forth that it was faster to do it myself.",
      },
      {
        heading: "The first time it actually worked",
        body: "My first real test was a 6-day trip to Lisbon. I entered my dates, told the system I was travelling solo, that I preferred walking over taxis, and that I wanted a mix of history and contemporary art. Within about 25 seconds, I had a complete day-by-day plan. Not a template. A real plan — with specific opening hours, walking distances between venues, meal recommendations keyed to the neighbourhoods I'd be in, and notes on why each choice had been made.",
      },
      {
        type: "quote",
        body: "\"The note under LX Factory on Day 3 said: 'Skip the market on weekends — it gets tourist-heavy. Sunday morning is best for the resident designers and fewer crowds.' That's local knowledge. That's the kind of thing a friend who'd lived in Lisbon would tell you.\"",
      },
      {
        heading: "What actually changed",
        body: "The shift wasn't just in the quality of the itinerary — it was in how I use the time I used to spend planning. Instead of three evenings of research, I'm now spending that time learning a few phrases in the local language, reading about the history of where I'm going, or just being excited instead of stressed.",
      },
      {
        type: "list",
        heading: "The three things that made the biggest difference:",
        items: [
          "Geographic sequencing — activities are grouped so you're never doubling back across the city. Sounds basic, but I'd never consistently achieved it manually.",
          "Weather awareness — the itinerary scheduled my outdoor hike on the clear day and the museum cluster on the day with afternoon rain. The AI had pulled the forecast.",
          "The 'why chosen' field — every single activity had a one-sentence reason. It made me trust the plan enough to actually follow it, instead of second-guessing every choice.",
        ],
      },
      {
        heading: "What AI can't replace",
        body: "I want to be honest about the limits. AI planning is remarkable for structure and discovery — for giving you a coherent framework in a city you don't know. But the best moments of any trip are still the unplanned ones: the conversation with the cafe owner who tells you about a festival happening tonight, the wrong turn that leads to the view you'll remember for years. The AI gives you a brilliant starting point. What you do with it is still entirely your own.",
      },
      {
        type: "tip",
        body: "💡 Pro tip: Use the itinerary as a living document, not a script. The best travellers I know treat AI-generated plans as a base layer — they'll follow about 70% of it and leave room to improvise. The plan earns your trust; then you can break it.",
      },
      {
        body: "I've now planned fourteen trips with MyTravel-AI, from a four-day city break in Porto to a three-week overland through Vietnam. Each one has been better than anything I produced manually. Not because the AI knows more than me — it probably doesn't — but because it removes the friction between idea and action. And for travel, that friction is everything.",
      },
    ],
  },

  "hidden-gems-southeast-asia-2026": {
    title: "7 Hidden Gems in Southeast Asia You Haven't Discovered Yet",
    category: "Destination Guides",
    date: "March 22, 2026",
    readTime: "8 min read",
    author: "James K.",
    authorRole: "Solo traveller · 14 countries in SEA",
    authorInitial: "J",
    authorColor: "#0096c7",
    gradient: "linear-gradient(135deg,#0c4a6e,#0284c7,#38bdf8)",
    emoji: "🗺️",
    pillClass: "bg-sky-50 text-sky-700 border border-sky-200",
    relatedSlug: "how-ai-changed-travel-planning",
    relatedTitle: "How AI Changed the Way I Plan Trips Forever",
    sections: [
      {
        body: "Southeast Asia is one of the most visited regions on Earth, and for obvious reasons: warm weather, extraordinary food, ancient temples, and a density of genuinely beautiful places that's hard to match anywhere. But the same Instagram algorithm that makes everywhere look accessible has also created some significant traffic jams. Ha Long Bay in peak season. The Angkor Wat sunrise queue. Koh Phi Phi on a long weekend.",
      },
      {
        body: "These are worth seeing. They're famous for good reasons. But there's a parallel Southeast Asia just beyond the well-worn routes — places that are fully infrastructure-ready, safe, and rewarding, but that haven't yet reached saturation point. Here are seven that are on my list right now.",
      },
      {
        heading: "1. Kampot, Cambodia",
        body: "A sleepy riverside town in southern Cambodia that somehow still has the feel of a place that hasn't decided what it wants to be yet — which is exactly its charm. The famous Kampot pepper grows in the hills nearby; you can visit the farms directly. The colonial-era architecture is largely intact. The river at sunset, watched from a wooden deck with a cold drink, is as good as anything in the region.",
      },
      {
        type: "tip",
        body: "💡 Stay on the river road rather than in the town centre. The guesthouses here have front-row river views and are often half the price of comparable places.",
      },
      {
        heading: "2. Mrauk U, Myanmar",
        body: "Often called the \"Bagan no one talks about,\" Mrauk U is a 15th-century temple city in Rakhine State with almost no Western tourist infrastructure — which means almost no Western tourists. The temples here were built to function as fortresses as well as religious sites; their walls are thick stone, built to flood-fill during the monsoon. The light in the early morning, as mist rises off the paddy fields between the pagodas, is like nothing else.",
      },
      {
        heading: "3. Con Dao Islands, Vietnam",
        body: "Vietnam's most beautiful coastline is almost certainly Con Dao — a small archipelago off the south coast with turquoise water, nearly empty beaches, and a sombre, significant history as the site of a notorious colonial prison. The diving here is considered among the best in Southeast Asia. The sea turtle sanctuary at Con Dao National Park is genuinely moving — you can watch nesting turtles by night with a ranger.",
      },
      {
        type: "quote",
        body: "\"Con Dao has no 7-Elevens, no walking streets, no jet ski rentals. It has one ATM and it runs out of cash on weekends. Pack accordingly. Bring a book. This is exactly the point.\"",
      },
      {
        heading: "4. Hsipaw, Myanmar",
        body: "A small Shan State hill town where the main activity is walking through tea and coffee plantations and staying with local families. Trekking here is genuinely community-run — the trails are owned and guided by local villages, who decide where visitors can and can't go. The train journey in, crossing the famous Gokteik Viaduct, is one of the most beautiful in Asia.",
      },
      {
        heading: "5. Battambang, Cambodia",
        body: "Cambodia's second city is frequently used as a stop between Phnom Penh and Siem Reap but rarely treated as a destination in its own right. That's a mistake. The colonial architecture is better-preserved than anywhere in the country. The bamboo train — a flat wooden platform on railway wheels powered by a small motor — is one of the great travel experiences of the region. And the contemporary arts scene, centred on a cluster of NGO-funded organisations, is producing some genuinely interesting work.",
      },
      {
        heading: "6. Kep, Cambodia",
        body: "Twenty minutes from Kampot, Kep is even smaller and even quieter. It was the Cambodian elite's beach resort of choice until 1975; the villas are still there, many of them crumbling romantically into the jungle. The crab market is one of the best meals in the region — fresh crabs cooked with local pepper and served at plastic tables on the waterfront at sunset.",
      },
      {
        heading: "7. Pu Luong, Vietnam",
        body: "A nature reserve in Thanh Hoa Province, about three hours southwest of Hanoi, that sees a fraction of the traffic of Sapa or Ha Giang. The scenery is arguably their equal: tiered rice paddies, limestone peaks, traditional stilt villages, and the kind of cycling routes that make you stop every five minutes because there's something extraordinary around every bend. The wet season (July–September) makes the paddies luminous green.",
      },
      {
        type: "list",
        heading: "Quick planning notes for any of these:",
        items: [
          "All seven destinations are reachable via public transport — no need for private tours or expensive transfers.",
          "Shoulder season (April–May, October–November) gives you better weather and far fewer crowds than peak periods.",
          "For Cambodia in particular, a single-country visa covers all three Cambodian destinations on this list.",
          "MyTravel-AI handles all of these destinations well — the day-by-day structure is especially useful where Google Maps coverage is thin.",
        ],
      },
      {
        body: "The best version of travelling Southeast Asia right now isn't about finding the most remote place — it's about being one step off the main circuit. These seven places are all accessible, all genuinely rewarding, and all at the point where you still feel like a traveller rather than a visitor. That window won't stay open forever.",
      },
    ],
  },
};

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export async function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();

  return (
    <div className="bg-white text-[#0d1f12]" style={{ fontFamily: "var(--font-sans)" }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between h-16 px-6 lg:px-12 bg-white/85 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-xl text-[#0d1f12] no-underline">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-lg" style={{ background: "linear-gradient(135deg,#0d6e3c,#34c77b,#0ea5e9)" }}>✈</div>
          MyTravel
        </Link>
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {[["/#demo","Live Demo"],["/#features","Features"],["/#pricing","Pricing"],["/blog","Blog"]].map(([href,label]) => (
            <li key={href}>
              <Link href={href} className="text-sm font-medium no-underline transition-colors" style={{ color: href === "/blog" ? "#0d1f12" : "#4b7a5e" }}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-[#2d5a3d] px-4 py-2 rounded-xl border border-black/10 hover:bg-black/3 transition-colors no-underline">Sign in</Link>
          <Link href="/register" className="inline-flex text-sm font-semibold text-white px-4 py-2 rounded-xl no-underline shadow-lg transition-all hover:-translate-y-px" style={{ background: "linear-gradient(135deg,#0d6e3c,#1a7a4a,#34c77b)", boxShadow: "0 4px 16px rgba(26,122,74,0.35)" }}>Start Free</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="pt-16">
        <div className="h-56 sm:h-72 flex flex-col justify-end px-6 pb-10 relative overflow-hidden" style={{ background: post.gradient }}>
          <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute right-10 top-10 text-6xl opacity-80">{post.emoji}</div>
          <div className="max-w-3xl mx-auto w-full relative z-10">
            <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${post.pillClass}`}>
              {post.category}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mt-4">
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Meta bar ── */}
      <div className="border-b border-black/6" style={{ background: "#f6fdf8" }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4 flex-wrap">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: post.authorColor }}>
            {post.authorInitial}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#0d1f12]">{post.author}</div>
            <div className="text-xs text-[#6b9a76]">{post.authorRole}</div>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#6b9a76] ml-auto">
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-2 text-xs text-[#6b9a76]">
          <Link href="/" className="no-underline hover:text-[#1a7a4a] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="no-underline hover:text-[#1a7a4a] transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-[#0d1f12] font-medium truncate max-w-48">{post.category}</span>
        </div>
      </div>

      {/* ── Article body ── */}
      <article className="max-w-3xl mx-auto px-6 py-10 pb-20">
        {post.sections.map((section, i) => {
          if (section.type === "quote") {
            return (
              <blockquote
                key={i}
                className="my-8 pl-5 border-l-4 italic text-base leading-relaxed"
                style={{ borderColor: "#2d6a4f", color: "#2d5a3d", background: "rgba(45,106,79,0.04)", borderRadius: "0 12px 12px 0", padding: "18px 20px 18px 24px" }}
              >
                {section.body}
              </blockquote>
            );
          }
          if (section.type === "tip") {
            return (
              <div
                key={i}
                className="my-8 rounded-2xl px-6 py-4 text-sm leading-relaxed"
                style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid rgba(212,160,23,0.25)", color: "#92400e" }}
              >
                {section.body}
              </div>
            );
          }
          if (section.type === "list") {
            return (
              <div key={i} className="my-8">
                {section.heading && (
                  <h2 className="text-xl font-black text-[#0d1f12] mb-4">{section.heading}</h2>
                )}
                <ul className="space-y-3">
                  {section.items?.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-[#2d5a3d]">
                      <span className="mt-1 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#1a7a4a,#34c77b)" }}>
                        {j + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          return (
            <div key={i} className="my-6">
              {section.heading && (
                <h2 className="text-2xl font-black text-[#0d1f12] mb-3 mt-10">{section.heading}</h2>
              )}
              <p className="text-base leading-relaxed text-[#2d5a3d]">{section.body}</p>
            </div>
          );
        })}

        {/* ── Author footer ── */}
        <div className="mt-16 pt-8 border-t border-black/6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0" style={{ background: post.authorColor }}>
            {post.authorInitial}
          </div>
          <div>
            <div className="font-bold text-[#0d1f12]">{post.author}</div>
            <div className="text-sm text-[#6b9a76]">{post.authorRole}</div>
          </div>
        </div>
      </article>

      {/* ── Read next ── */}
      <section className="py-16 px-4" style={{ background: "#f6fdf8" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-[#6b9a76] mb-5">Read Next</div>
          <Link href={`/blog/${post.relatedSlug}`} className="no-underline group block">
            <div className="lp-feature-card rounded-2xl overflow-hidden flex items-center gap-6 p-6">
              <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl" style={{ background: "linear-gradient(135deg,#e8faf0,#ebf7ff)" }}>
                {post.relatedSlug === "how-ai-changed-travel-planning" ? "🤖" : "🗺️"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-[#0d1f12] text-base leading-snug group-hover:text-[#1a7a4a] transition-colors">
                  {post.relatedTitle}
                </div>
              </div>
              <span className="text-[#1a7a4a] font-bold text-sm group-hover:translate-x-1 transition-transform inline-block flex-shrink-0">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-center" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(52,199,123,0.12) 0%, transparent 65%), linear-gradient(160deg,#071412 0%,#0a1f16 50%,#070e1a 100%)" }}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-black tracking-tight text-white mb-4 leading-tight">
            Ready to plan your<br /><span className="gradient-text">next adventure?</span>
          </h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            MyTravel-AI builds a complete, day-by-day itinerary in under 30 seconds.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-base font-bold text-white no-underline transition-all hover:-translate-y-1" style={{ background: "linear-gradient(135deg,#0d6e3c,#1a7a4a,#34c77b)", boxShadow: "0 8px 32px rgba(26,122,74,0.4)" }}>
            Plan My Trip — It&apos;s Free
          </Link>
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
            { title: "Product",  links: [["Features","/#features"],["Pricing","/#pricing"],["Curated Tours","#"],["Mobile App","#"]] },
            { title: "Company",  links: [["About","#"],["Blog","/blog"],["Careers","#"],["Contact","#"]] },
            { title: "Legal",    links: [["Privacy Policy","#"],["Terms of Service","#"],["Cookie Policy","#"]] },
          ].map(g => (
            <div key={g.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.28)" }}>{g.title}</h4>
              <ul className="space-y-2.5 list-none p-0 m-0">
                {g.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm no-underline transition-colors" style={{ color: "rgba(255,255,255,0.48)" }}>{label}</Link>
                  </li>
                ))}
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
