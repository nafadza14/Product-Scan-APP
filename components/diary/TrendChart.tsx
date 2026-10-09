import React, { useMemo, useRef, useState } from 'react';

export interface Point {
  t: number; // timestamp
  v: number; // 0-100
}

/**
 * Single-series line chart on a fixed 0-100 scale with a tap/hover crosshair.
 * Used for the overall skin score (large) and each metric (compact).
 */
const TrendChart: React.FC<{
  points: Point[];
  height?: number;
  compact?: boolean;
  formatDate: (t: number) => string;
  label: string;
  color?: string;
}> = ({ points, height = 180, compact = false, formatDate, label, color = '#0E2B2E' }) => {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 340;
  const H = height;
  const pad = compact ? { l: 4, r: 4, t: 8, b: 8 } : { l: 30, r: 12, t: 14, b: 26 };
  const sorted = useMemo(() => [...points].sort((a, b) => a.t - b.t), [points]);

  if (sorted.length === 0) return null;
  const t0 = sorted[0].t;
  const t1 = sorted[sorted.length - 1].t;
  const span = Math.max(1, t1 - t0);
  const x = (t: number) => (sorted.length === 1 ? (pad.l + W - pad.r) / 2 : pad.l + ((t - t0) / span) * (W - pad.l - pad.r));
  // Compact sparklines zoom to their own range so small changes are visible; the main chart keeps 0-100.
  const vs = sorted.map((p) => p.v);
  const lo = compact ? Math.max(0, Math.min(...vs) - 6) : 0;
  const hi = compact ? Math.min(100, Math.max(...vs) + 6) : 100;
  const y = (v: number) => pad.t + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - pad.t - pad.b);

  const path = sorted.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = `${path} L${x(t1).toFixed(1)},${y(lo)} L${x(t0).toFixed(1)},${y(lo)} Z`;
  const last = sorted[sorted.length - 1];
  const h = hover !== null ? sorted[hover] : null;

  const pick = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((clientX - r.left) / r.width) * W;
    let best = 0;
    sorted.forEach((p, i) => {
      if (Math.abs(x(p.t) - px) < Math.abs(x(sorted[best].t) - px)) best = i;
    });
    setHover(best);
  };

  return (
    <div className="relative" dir="ltr">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        style={{ height: compact ? height * 0.6 : undefined }}
        preserveAspectRatio={compact ? 'none' : undefined}
        role="img"
        aria-label={`${label}: ${sorted.map((p) => `${formatDate(p.t)} ${p.v}`).join(', ')}`}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`fill-${label.replace(/\W/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.14" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {!compact &&
          [0, 50, 100].map((g) => (
            <g key={g}>
              <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="#D3DEDB" strokeWidth="1" strokeDasharray={g === 0 ? undefined : '3 4'} />
              <text x={pad.l - 6} y={y(g) + 4} textAnchor="end" fontSize="10" fill="#6E8283">
                {g}
              </text>
            </g>
          ))}
        {!compact && sorted.length > 1 && (
          <>
            <text x={pad.l} y={H - 6} fontSize="10" fill="#6E8283">
              {formatDate(t0)}
            </text>
            <text x={W - pad.r} y={H - 6} fontSize="10" fill="#6E8283" textAnchor="end">
              {formatDate(t1)}
            </text>
          </>
        )}
        <path d={area} fill={`url(#fill-${label.replace(/\W/g, '')})`} />
        <path d={path} fill="none" stroke={color} strokeWidth={compact ? 2.5 : 2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {!compact &&
          sorted.map((p, i) => (
            <circle key={i} cx={x(p.t)} cy={y(p.v)} r={i === sorted.length - 1 ? 5 : 3.5} fill={i === sorted.length - 1 ? '#EE5F3B' : color} stroke="#fff" strokeWidth="2" />
          ))}
        {h && (
          <line x1={x(h.t)} x2={x(h.t)} y1={pad.t} y2={H - pad.b} stroke="#0E2B2E" strokeOpacity="0.25" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        )}
        {h && !compact && <circle cx={x(h.t)} cy={y(h.v)} r="6" fill="#EE5F3B" stroke="#fff" strokeWidth="2" />}
      </svg>
      {h && (
        <div
          className="absolute -top-1 pointer-events-none rounded-xl bg-ink text-white px-2.5 py-1.5 text-[12px] leading-tight shadow-lift whitespace-nowrap"
          style={{ left: `${(x(h.t) / W) * 100}%`, transform: `translate(${x(h.t) > W * 0.7 ? '-100%' : x(h.t) < W * 0.3 ? '0' : '-50%'}, -100%)` }}
        >
          <span className="font-semibold tabular-nums">{h.v}</span> <span className="text-white/70">{formatDate(h.t)}</span>
        </div>
      )}
      {compact && !h && <span className="sr-only">{last.v}</span>}
    </div>
  );
};

export default TrendChart;
