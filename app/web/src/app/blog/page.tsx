import Link from "next/link";

const POSTS = [
  {
    slug: "how-ai-changed-travel-planning",
    title: "How AI Changed the Way I Plan Trips Forever",
    excerpt:
      "I used to spend entire weekends piecing together itineraries from forum threads and booking sites that never quite came together. Then I tried AI-powered planning, and the way I think about travel changed completely.",
    category: "Travel Tips",
    date: "March 15, 2026",
    readTime: "6 min read",
    gradient: "linear-gradient(135deg,#1b4332,#2d6a4f,#40916c)",
    pillClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    emoji: "🤖",
  },
  {
    slug: "hidden-gems-southeast-asia-2026",
    title: "7 Hidden Gems in Southeast Asia You Haven't Discovered Yet",
    excerpt:
      "Beyond Bali and Bangkok, Southeast Asia hides a constellation of destinations that reward the curious traveller. Here are seven places that should be on every adventurer's radar in 2026.",
    category: "Destination Guides",
    date: "March 22, 2026",
    readTime: "8 min read",
    gradient: "linear-gradient(135deg,#0c4a6e,#0284c7,#38bdf8)",
    pillClass: "bg-sky-50 text-sky-700 border border-sky-200",
    emoji: "🗺️",
  },
];

export default function BlogPage() {
  return (
    <div className="bg-white text-[#0d1f12]" style={{ fontFamily: "var(--font-sans)" }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between h-16 px-6 lg:px-12 bg-white/85 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-xl text-[#0d1f12] no-underline">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-lg" style={{ background: "linear-gradient(135deg,#0d6e3c,#34c77b,#0ea5e9)" }}>✈</div>
          MyTravel
        </Link>
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {[["/#demo","Live Demo"],["/#features","Features"],["/#pricing","Pricing"],["blog","Blog"]].map(([href,label]) => (
            <li key={href}>
              <Link
                href={`/${href}`}
                className="text-sm font-medium no-underline transition-colors"
                style={{ color: href === "blog" ? "#0d1f12" : "#4b7a5e" }}
              >
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
      <section className="pt-40 pb-24 px-6 text-center" style={{ background: "radial-gradient(ellipse 80% 60% at 25% 30%, rgba(45,106,79,0.14) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(14,165,233,0.16) 0%, transparent 55%), linear-gradient(160deg, #e8faf0 0%, #ebf7ff 50%, #f5feff 100%)" }}>
        <span className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6 text-[#1a7a4a]" style={{ background: "rgba(26,122,74,0.08)", border: "1px solid rgba(26,122,74,0.18)" }}>
          The MyTravel Blog
        </span>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none mb-6 text-[#0d1f12]">
          Travel smarter.<br />
          <span className="gradient-text">Explore deeper.</span>
        </h1>
        <p className="text-lg md:text-xl text-[#4b7a5e] max-w-lg mx-auto leading-relaxed">
          Guides, tips, and destination deep-dives from the MyTravel team and the travellers who inspire us.
        </p>
      </section>

      {/* ── Posts Grid ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {POSTS.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="no-underline group">
                <article className="lp-feature-card h-full flex flex-col" style={{ borderRadius: "var(--r-xl, 20px)", overflow: "hidden" }}>
                  {/* Coloured top banner */}
                  <div className="h-28 flex items-end px-7 pb-5 relative overflow-hidden" style={{ background: post.gradient }}>
                    <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full bg-white/10" />
                    <div className="absolute right-6 top-6 text-4xl">{post.emoji}</div>
                    <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full relative z-10 ${post.pillClass}`}>
                      {post.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 px-7 py-6">
                    <h2 className="text-xl font-black text-[#0d1f12] leading-snug mb-3 group-hover:text-[#1a7a4a] transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-[#2d5a3d] leading-relaxed flex-1 mb-5">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-black/6">
                      <div className="flex items-center gap-3 text-xs text-[#6b9a76]">
                        <span>{post.date}</span>
                        <span>·</span>
                        <span>{post.readTime}</span>
                      </div>
                      <span className="text-sm font-semibold text-[#1a7a4a] group-hover:translate-x-1 transition-transform inline-block">
                        Read →
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6 text-center" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(52,199,123,0.12) 0%, transparent 65%), linear-gradient(160deg,#071412 0%,#0a1f16 50%,#070e1a 100%)" }}>
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-semibold text-emerald-400" style={{ background: "rgba(52,199,123,0.1)", border: "1px solid rgba(52,199,123,0.2)" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #34c77b" }} />
            Ready to plan your next trip?
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-4 leading-tight">
            Turn inspiration into<br /><span className="gradient-text">a real itinerary.</span>
          </h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            MyTravel-AI builds a complete, day-by-day plan tailored to your style in under 30 seconds.
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
