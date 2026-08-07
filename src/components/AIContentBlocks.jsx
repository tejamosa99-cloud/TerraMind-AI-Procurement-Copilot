import React from "react";

// Small building blocks shared by every agent's renderContent() so the
// structured AI output reads as one consistent design system.
export function AISection({ icon, label, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
        {icon} {label}
      </div>
      <div className="mt-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}

export function AIBulletList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
          <span className="text-blue-500">&#9656;</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function AIStat({ label, value, tone = "text-slate-900" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={"mt-1 text-lg font-bold " + tone}>{value}</div>
    </div>
  );
}
