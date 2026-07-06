// Sidheshwar Enterprises — exact reference lockup:
//   SIDHESHWAR   (bold serif caps, white on navy / navy on light)
//   — ENTERPRISES —   (gold italic serif caps, wide-tracked, flanked by short gold dashes)

type Size = "xs" | "sm" | "md" | "lg" | "xl";

// Tracking mirrors the reference: SIDHESHWAR ~0.04em, ENTERPRISES stretched ~0.3em.
const SIZE_MAP: Record<Size, { top: string; sub: string; gap: string; topTracking: string; subTracking: string; dash: string }>= {
  xs: { top: "text-[14px] leading-none", sub: "text-[7px]",  gap: "gap-[3px]", topTracking: "tracking-[0.04em]", subTracking: "tracking-[0.3em]", dash: "w-2"    },
  sm: { top: "text-[20px] leading-none", sub: "text-[9px]",  gap: "gap-1",     topTracking: "tracking-[0.04em]", subTracking: "tracking-[0.3em]", dash: "w-2.5"  },
  md: { top: "text-[28px] leading-none", sub: "text-[11px]", gap: "gap-1.5",   topTracking: "tracking-[0.04em]", subTracking: "tracking-[0.3em]", dash: "w-3"    },
  lg: { top: "text-[40px] leading-none", sub: "text-[14px]", gap: "gap-2",     topTracking: "tracking-[0.04em]", subTracking: "tracking-[0.32em]", dash: "w-4"   },
  xl: { top: "text-[60px] leading-none", sub: "text-[18px]", gap: "gap-2.5",   topTracking: "tracking-[0.04em]", subTracking: "tracking-[0.34em]", dash: "w-6"   },
};

export function BrandLockup({
  size = "md",
  tone = "navy",
  className = "",
}: {
  size?: Size;
  /** kept for API compatibility with existing call sites; visual output is identical. */
  layout?: "stacked" | "inline";
  showEndorsement?: boolean;
  showTagline?: boolean;
  /** "navy" = navy top on light bg. "light" = white top on dark bg (matches reference). */
  tone?: "navy" | "light";
  className?: string;
}) {
  const s = SIZE_MAP[size];
  const primaryColor = tone === "light" ? "#ffffff" : "var(--brand-navy)";

  return (
    <>
      <style>{`
        @keyframes brandWriteErase {
          0%, 14% { width: 0; }
          45%, 66% { width: 24ch; }
          96%, 100% { width: 0; }
        }

        .brand-write-loop {
          display: inline-block;
          max-width: 24ch;
          overflow: hidden;
          white-space: nowrap;
          vertical-align: bottom;
          animation: brandWriteErase 5.2s steps(24, end) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .brand-write-loop { animation: none; width: 24ch; }
        }

        @keyframes claimShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        .claim-premium {
          background: linear-gradient(
            100deg,
            #ff5e8a 0%,
            #ffb199 25%,
            #ffffff 45%,
            #a5f3fc 65%,
            #7c9cff 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: claimShimmer 4.5s linear infinite;
          filter: drop-shadow(0 1px 0 rgba(0,0,0,0.35));
        }

        @media (prefers-reduced-motion: reduce) {
          .claim-premium { animation: none; }
        }
      `}</style>
      <span
        className={`inline-flex flex-col items-center ${s.gap} uppercase rounded-md ${className}`}
        style={{ fontFamily: 'var(--font-display)', background: 'var(--brand-navy)', padding: '0.5rem 0.9rem' }}
        aria-label="Sidheshwar Enterprises"
      >
        <span
          className={`${s.top} ${s.topTracking} font-bold whitespace-nowrap claim-premium`}
        >
          CLAIM FOR SURE
        </span>
        <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span
            aria-hidden
            className={`${s.dash} h-px`}
            style={{ background: 'var(--brand-gold-2)' }}
          />
          <span className={`italic ${s.sub} ${s.subTracking} font-semibold`}>
            <span className="brand-gold-text">BY </span>
            <span className="brand-write-loop">
              <span style={{ color: '#ffffff' }}>SIDHESHWAR</span>
              <span className="brand-gold-text"> ENTERPRISES</span>
            </span>
          </span>
          <span
            aria-hidden
            className={`${s.dash} h-px`}
            style={{ background: 'var(--brand-gold-2)' }}
          />
        </span>
      </span>
    </>
  );
}

export default BrandLockup;