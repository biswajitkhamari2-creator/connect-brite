import { Link } from "@tanstack/react-router";
import {
  Search,
  BarChart3,
  Target,
  FolderCheck,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

type Step = {
  n: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  accent: string; // gradient tail color
};

const STEPS: Step[] = [
  {
    n: "01",
    icon: Search,
    title: "We Understand Your Needs",
    desc: "We listen to your requirements, budget, family needs, and future goals before recommending any policy.",
    accent: "from-[#3B82F6] to-[#6366F1]",
  },
  {
    n: "02",
    icon: BarChart3,
    title: "We Compare Multiple Policies",
    desc: "We compare suitable insurance plans across insurers and explain features, benefits, exclusions, waiting periods, and premiums in simple language.",
    accent: "from-[#0EA5E9] to-[#22D3EE]",
  },
  {
    n: "03",
    icon: Target,
    title: "You Choose with Confidence",
    desc: "We help you make an informed decision based on your priorities. The final choice is always yours.",
    accent: "from-[#10B981] to-[#22C55E]",
  },
  {
    n: "04",
    icon: FolderCheck,
    title: "We Help with Documentation",
    desc: "We assist you in understanding required documents and keeping your policy records organized and accessible.",
    accent: "from-[#6366F1] to-[#8B5CF6]",
  },
  {
    n: "05",
    icon: HeartHandshake,
    title: "Support Through Your Policy Journey",
    desc: "Need guidance for endorsements, renewals, or claim documentation? We're here to assist whenever you need help.",
    accent: "from-[#0B3D91] to-[#3B82F6]",
  },
  {
    n: "06",
    icon: ShieldCheck,
    title: "Claim Assistance When You Need It",
    desc: "If you need to file a claim, we guide you through documentation and process until the insurer communicates its final decision.",
    accent: "from-[#059669] to-[#16A34A]",
  },
];

const COMMITMENTS = [
  "Compare suitable policies",
  "Explain policy features clearly",
  "Help organize your documents",
  "Guide you during the claim process",
  "Dedicated customer support",
];

export default function WhyBuyThroughUsSection() {
  return (
    <section className="relative overflow-hidden bg-[#F6F9FF] py-24 md:py-32">
      <style>{`
        @keyframes wbtu-float { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(3%, -3%, 0) scale(1.08); } }
        @keyframes wbtu-float-2 { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-4%, 4%, 0) scale(1.1); } }
        @keyframes wbtu-rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wbtu-pulse-glow { 0%,100% { box-shadow: 0 0 0 rgba(59,130,246,0); } 50% { box-shadow: 0 0 32px rgba(59,130,246,.35); } }
        @keyframes wbtu-dash { to { stroke-dashoffset: -120; } }
        @keyframes wbtu-particle { 0% { transform: translateY(0) translateX(0); opacity: 0; } 15% { opacity:.7; } 100% { transform: translateY(-320px) translateX(var(--dx,20px)); opacity: 0; } }
        @keyframes wbtu-shimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
        @keyframes wbtu-checkpop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }

        .wbtu-mesh-1 { animation: wbtu-float 16s ease-in-out infinite; }
        .wbtu-mesh-2 { animation: wbtu-float-2 20s ease-in-out infinite; }
        .wbtu-rise { animation: wbtu-rise .9s cubic-bezier(.2,.7,.2,1) both; }
        .wbtu-dash { stroke-dasharray: 8 10; animation: wbtu-dash 6s linear infinite; }
        .wbtu-particle { position: absolute; width: 6px; height: 6px; border-radius: 9999px; background: radial-gradient(circle, #93c5fd, transparent 70%); filter: blur(1px); animation: wbtu-particle 11s linear infinite; }
        .wbtu-card { position: relative; transition: transform .5s cubic-bezier(.2,.7,.2,1), box-shadow .5s ease, border-color .3s ease; }
        .wbtu-card::before { content:""; position:absolute; inset:0; border-radius: 24px; padding:1px; background: linear-gradient(140deg, rgba(59,130,246,.5), rgba(16,185,129,.35), rgba(59,130,246,0)); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0; transition: opacity .4s ease; pointer-events: none; }
        .wbtu-card:hover { transform: translateY(-8px); box-shadow: 0 30px 60px -25px rgba(11,61,145,.35); }
        .wbtu-card:hover::before { opacity: 1; }
        .wbtu-card:hover .wbtu-icon { transform: scale(1.08) rotate(-3deg); }
        .wbtu-icon { transition: transform .5s cubic-bezier(.2,.7,.2,1); }
        .wbtu-cta { position: relative; overflow: hidden; }
        .wbtu-cta::after { content:""; position:absolute; inset:0; background: linear-gradient(120deg, transparent 20%, rgba(255,255,255,.4) 50%, transparent 80%); transform: translateX(-100%); }
        .wbtu-cta:hover::after { animation: wbtu-shimmer 1s ease forwards; }
        .wbtu-cta:hover { animation: wbtu-pulse-glow 1.6s ease-in-out infinite; transform: translateY(-2px); }
        .wbtu-check { animation: wbtu-checkpop .5s cubic-bezier(.2,.7,.2,1) both; }
      `}</style>

      {/* Background mesh + grid */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#EAF3FF] to-[#F6F9FF]" />
        <div className="wbtu-mesh-1 absolute -left-32 top-10 h-[520px] w-[520px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(59,130,246,.28), transparent 65%)" }} />
        <div className="wbtu-mesh-2 absolute -right-40 bottom-0 h-[560px] w-[560px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(16,185,129,.22), transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(rgba(11,61,145,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(11,61,145,.5) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="wbtu-particle"
            style={{
              left: `${(i * 79) % 100}%`,
              bottom: `${(i * 23) % 40}%`,
              animationDelay: `${(i * 0.9) % 11}s`,
              // @ts-expect-error CSS var
              "--dx": `${(i % 2 === 0 ? 1 : -1) * ((i * 13) % 45)}px`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center wbtu-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/25 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B3D91] shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Why Choose Claim For Sure
          </span>
          <h2 className="mt-6 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-[#0B3D91] md:text-5xl">
            From Choosing the Right Policy to{" "}
            <span className="bg-gradient-to-r from-[#0B3D91] via-[#3B82F6] to-[#16A34A] bg-clip-text text-transparent">
              Standing by You at Claim Time.
            </span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-600 md:text-lg">
            We don't disappear after you purchase a policy. We help you compare options,
            understand your needs, and continue supporting you throughout your insurance journey.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative mt-20">
          {/* Vertical animated connector (visible md+) */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 hidden h-full -translate-x-1/2 md:block"
            width="4"
            viewBox="0 0 4 100"
            preserveAspectRatio="none"
          >
            <line
              x1="2"
              y1="0"
              x2="2"
              y2="100"
              stroke="url(#wbtu-grad)"
              strokeWidth="2"
              className="wbtu-dash"
            />
            <defs>
              <linearGradient id="wbtu-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#16A34A" />
              </linearGradient>
            </defs>
          </svg>

          <ol className="grid gap-8 md:grid-cols-2 md:gap-x-16 md:gap-y-14">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const alignRight = i % 2 === 1;
              return (
                <li
                  key={s.n}
                  className={`wbtu-rise relative ${alignRight ? "md:mt-24" : ""}`}
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  {/* Timeline node */}
                  <span
                    aria-hidden="true"
                    className={`absolute top-8 hidden h-4 w-4 rounded-full bg-white shadow-[0_0_0_4px_rgba(59,130,246,0.15)] ring-2 ring-[#3B82F6] md:block ${
                      alignRight ? "-left-[34px]" : "-right-[34px]"
                    }`}
                  />

                  <article className="wbtu-card group relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-6 shadow-xl shadow-[#0B3D91]/5 backdrop-blur-xl md:p-7">
                    <div className="flex items-start gap-4">
                      <div
                        className={`wbtu-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${s.accent} text-white shadow-lg shadow-[#0B3D91]/20`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#0B3D91]/5 px-2.5 py-0.5 text-[11px] font-bold tracking-widest text-[#0B3D91]">
                            STEP {s.n}
                          </span>
                        </div>
                        <h3 className="mt-2 font-display text-lg font-bold tracking-tight text-[#0B3D91] md:text-xl">
                          {s.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[15px]">
                          {s.desc}
                        </p>
                      </div>
                    </div>

                    {/* Ambient corner glow */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${s.accent} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30`}
                    />
                  </article>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Commitment glass card */}
        <div className="relative mt-24 wbtu-rise">
          <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/60 p-8 shadow-2xl shadow-[#0B3D91]/10 backdrop-blur-2xl md:p-12">
            {/* Gradient border sheen */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[28px]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,130,246,.15), rgba(16,185,129,.12) 45%, rgba(255,255,255,0))",
              }}
            />
            <div className="relative grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3B82F6]/15 to-[#16A34A]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B3D91]">
                  <HeartHandshake className="h-3.5 w-3.5" /> Our Commitment
                </span>
                <h3 className="mt-5 font-display text-2xl font-extrabold leading-tight text-[#0B3D91] md:text-3xl">
                  We stay with you from policy selection through claim assistance.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-[15px]">
                  Claim decisions are made solely by the respective insurance company or competent
                  authority. We provide assistance and guidance — we do not guarantee claim approval
                  or settlement.
                </p>
              </div>

              <ul className="grid gap-3">
                {COMMITMENTS.map((c, i) => (
                  <li
                    key={c}
                    className="wbtu-rise flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur"
                    style={{ animationDelay: `${0.08 * i}s` }}
                  >
                    <span className="wbtu-check flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#10B981] to-[#16A34A] text-white shadow-md shadow-[#16A34A]/30">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-slate-800">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-center text-center wbtu-rise">
          <h4 className="font-display text-xl font-bold text-[#0B3D91] md:text-2xl">
            Find the Right Insurance with Expert Guidance
          </h4>
          <Link
            to="/policies"
            className="wbtu-cta mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0B3D91] via-[#3B82F6] to-[#16A34A] px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-[#0B3D91]/25 transition"
          >
            Compare Policies Now <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 max-w-md text-xs text-slate-500">
            No obligation. Talk to our advisors and decide at your own pace.
          </p>
        </div>
      </div>
    </section>
  );
}