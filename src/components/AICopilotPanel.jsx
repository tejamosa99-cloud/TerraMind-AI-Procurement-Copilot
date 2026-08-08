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
  // Compact "Level 1" view: (data) => ReactNode. When provided alongside
  // renderContent, the panel opens collapsed to just this summary — the
  // full renderContent detail lives behind an "Expand Analysis" toggle so
  // the page reads as one clear answer first, not a data dump. No content
  // is removed, just deferred behind a click.
  summary,
  expandLabel = "Expand Analysis",
  collapseLabel = "Show Less",
  copyText,
  className = "",
  // When a HumanApprovalPanel already renders its own "Regenerate" action
  // for this content (Agents 2/3/4), hide this header's redundant regenerate
  // button once the result is in — the approval panel becomes the single
  // place to trigger it (and correctly resets the approval flag, which this
  // header button does not). The initial Generate / error Retry affordance
  // is unaffected — it's the only trigger before a HumanApprovalPanel exists.
  regenerateInApprovalPanel = false,
}) {
  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const loading = status === "thinking";
  const done = status === "done" && data;

  React.useEffect(() => { setExpanded(false); }, [data]);

  function handleCopy() {
    const text = typeof copyText === "function" ? copyText(data) : copyText;
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={"rounded-2xl border border-brand-200 bg-white p-4 shadow-glow transition-shadow duration-200 hover:shadow-glow-md " + className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={"inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 " + (loading ? "ai-pulse" : "")}>
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
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 shadow-sm transition-colors duration-150 hover:border-brand-400 hover:bg-brand-50"
            >
              {copied ? "Copied!" : "📋 Copy"}
            </button>
          )}
          {!(regenerateInApprovalPanel && status === "done") && (
            <button
              onClick={onGenerate}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:shadow-glow hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {loading ? "Thinking…" : status === "done" ? "🔄 Regenerate" : generateLabel}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        {status === "thinking" ? (
          <AIReasoningTimeline active />
        ) : status === "error" ? (
          <div className="space-y-3">
            <p className="text-red-600">{error?.message || "Unable to complete this request."}</p>
            <button
              onClick={onGenerate}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[13px] font-medium text-red-700 transition-colors duration-150 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        ) : done ? (
          summary ? (
            <div>
              {summary(data)}
              {renderContent && (
                <>
                  <button
                    onClick={() => setExpanded((e) => !e)}
                    className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 transition-colors duration-150 hover:text-brand-700"
                  >
                    <span className={"inline-block transition-transform duration-200 " + (expanded ? "rotate-180" : "")}>▾</span>
                    {expanded ? collapseLabel : expandLabel}
                  </button>
                  <div className={"grid transition-all duration-300 ease-in-out " + (expanded ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">{renderContent(data)}</div>
                  </div>
                </>
              )}
            </div>
          ) : renderContent ? (
            renderContent(data)
          ) : (
            <p className="whitespace-pre-wrap text-sm text-slate-700">{JSON.stringify(data)}</p>
          )
        ) : (
          <p className="text-sm text-slate-500">{idleHint}</p>
        )}
      </div>
    </div>
  );
}
