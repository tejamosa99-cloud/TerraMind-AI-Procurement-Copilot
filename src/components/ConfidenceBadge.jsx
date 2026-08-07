import React from "react";

// Confidence % + "why" — every AI response surfaces this, not just a number.
export default function ConfidenceBadge({ score, reasons = [] }) {
  const [open, setOpen] = React.useState(false);
  if (score == null) return null;

  const tone = score >= 85 ? "emerald" : score >= 65 ? "amber" : "red";
  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  }[tone];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={"flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 " + toneClasses}
      >
        AI Confidence: {score}%<span className="text-[10px] opacity-70">{open ? "▲" : "▼"}</span>
      </button>
      {open && reasons.length > 0 && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Based on</div>
          <ul className="mt-2 space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-blue-500">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
