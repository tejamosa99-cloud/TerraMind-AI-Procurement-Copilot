import React from "react";
import { useDemoMode } from "../context/DemoModeContext";

// Lets the app run fully offline for a presentation (local fixtures) or
// against the live backend/Gemini + market feed.
export default function DemoModeToggle() {
  const { demoMode, setDemoMode } = useDemoMode();
  return (
    <button
      onClick={() => setDemoMode(!demoMode)}
      className={
        "rounded-xl border px-4 py-2 text-left shadow-sm transition-colors duration-150 " +
        (demoMode ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")
      }
      title="Toggle between offline demo fixtures and the live AI backend"
    >
      <div className="flex items-center gap-2">
        <span className={"h-2.5 w-2.5 rounded-full " + (demoMode ? "bg-amber-500" : "bg-emerald-500")} />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{demoMode ? "Demo Mode" : "Enterprise Mode"}</span>
      </div>
      <div className={"text-sm font-bold " + (demoMode ? "text-amber-700" : "text-emerald-700")}>
        {demoMode ? "Offline Fixtures" : "Live AI + Market Data"}
      </div>
    </button>
  );
}
