import React from "react";

function Sparkline({ points, color }) {
  if (!points || points.length < 2) return null;
  const w = 72,
    h = 22;
  const min = Math.min(...points),
    max = Math.max(...points);
  const range = max - min || 1;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// Live Market Data display: current price, 24h change, 7-day trend, last
// updated — sourced from server/marketData.js (mocked, adapter-ready).
export default function MarketTicker({ marketData, loading, error }) {
  if (loading) return <div className="text-sm text-slate-500">Loading live commodity feed…</div>;
  if (!marketData) return null;

  const entries = Object.entries(marketData).filter(([k]) => !["cached", "providerLabel"].includes(k));

  return (
    <div>
      {error && <div className="mb-2 text-xs text-amber-600">{error.message}</div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {entries.map(([key, c]) => {
          const up = c.change24hPct >= 0;
          return (
            <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-slate-500">{c.name}</div>
                <Sparkline points={c.trend7d} color={up ? "#059669" : "#dc2626"} />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900">{c.price}</span>
                <span className="text-xs text-slate-400">{c.unit}</span>
              </div>
              <div className={"text-xs font-semibold " + (up ? "text-emerald-600" : "text-red-600")}>
                {up ? "↑" : "↓"} {Math.abs(c.change24hPct)}% 24h
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                Updated {c.lastUpdated ? new Date(c.lastUpdated).toLocaleTimeString() : "—"}
              </div>
            </div>
          );
        })}
      </div>
      {marketData.providerLabel && (
        <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-400">
          {marketData.providerLabel}
          {marketData.cached ? " · cached" : ""}
        </div>
      )}
    </div>
  );
}
