import React from "react";

const DEFAULT_STEPS = [
  "Reading ERP data",
  "Checking supplier history",
  "Reading commodity markets",
  "Comparing should-cost",
  "Evaluating savings",
  "Generating recommendation",
  "Finalizing response",
];

// Animated "AI thinking" checklist shown while a request is in flight —
// makes the wait read as visible reasoning rather than a blank spinner.
export default function AIReasoningTimeline({ active, steps = DEFAULT_STEPS, durationMs = 2000 }) {
  const [stepIndex, setStepIndex] = React.useState(-1);

  React.useEffect(() => {
    if (!active) {
      setStepIndex(-1);
      return;
    }
    setStepIndex(0);
    const stepDuration = durationMs / steps.length;
    const timers = steps.map((_, i) => setTimeout(() => setStepIndex(i), Math.round(i * stepDuration)));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, durationMs]);

  if (!active) return null;

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "pending";
        return (
          <div key={step} className="flex items-center gap-3 text-sm">
            <span
              className={
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors duration-150 " +
                (state === "done"
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : state === "active"
                  ? "border-blue-400 bg-blue-50 text-blue-600"
                  : "border-slate-200 bg-white text-slate-400")
              }
            >
              {state === "done" ? "✓" : state === "active" ? <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" /> : ""}
            </span>
            <span className={state === "pending" ? "text-slate-400" : state === "active" ? "font-semibold text-blue-700" : "text-slate-600"}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
