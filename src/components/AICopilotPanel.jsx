import React from "react";
import AIReasoningTimeline from "./AIReasoningTimeline";
import ConfidenceBadge from "./ConfidenceBadge";

// Reusable TerraMind AI panel: title + generate/regenerate + reasoning
// timeline + structured response + confidence + retry + copy.
// Every AI section in the app (Agents 1-5) renders through this component.
export default function AICopilotPanel({
  title,
  subtitle,
  icon = "🧠",
  status = "idle", // idle | thinking | done | error
  error,
  data,
  onGenerate,
  generateLabel = "Generate",
  idleHint = "Click generate for an AI-powered analysis.",
  renderContent,
  copyText,
  className = "",
}) {
  const [copied, setCopied] = React.useState(false);
  const loading = status === "thinking";

  function handleCopy() {
    const text = typeof copyText === "function" ? copyText(data) : copyText;
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={"rounded-xl border border-blue-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md " + className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
            {icon} AI Recommendation
          </span>
          <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === "done" && data?.confidenceScore != null && (
            <ConfidenceBadge score={data.confidenceScore} reasons={data.confidenceReasoning} />
          )}
          {status === "done" && copyText && (
            <button
              onClick={handleCopy}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50"
            >
              {copied ? "Copied!" : "📋 Copy"}
            </button>
          )}
          <button
            onClick={onGenerate}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {loading ? "Thinking…" : status === "done" ? "🔄 Regenerate" : generateLabel}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {status === "thinking" ? (
          <AIReasoningTimeline active />
        ) : status === "error" ? (
          <div className="space-y-3">
            <p className="text-red-600">{error?.message || "Unable to complete this request."}</p>
            <button
              onClick={onGenerate}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors duration-150 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        ) : status === "done" && data ? (
          renderContent ? renderContent(data) : <p className="whitespace-pre-wrap text-sm text-slate-700">{JSON.stringify(data)}</p>
        ) : (
          <p className="text-sm text-slate-500">{idleHint}</p>
        )}
      </div>
    </div>
  );
}
