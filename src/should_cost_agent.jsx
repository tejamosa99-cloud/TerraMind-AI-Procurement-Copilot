import React from "react";
import { sendExecutiveEmail } from "./services/emailService";
import AICopilotPanel from "./components/AICopilotPanel";
import MarketTicker from "./components/MarketTicker";
import DemoModeToggle from "./components/DemoModeToggle";
import { AISection, AIBulletList, AIStat } from "./components/AIContentBlocks";
import { DemoModeProvider } from "./context/DemoModeContext";
import { useAI } from "./hooks/useAI";
import { useMarketData } from "./hooks/useMarketData";
import { useExecutiveSummary } from "./hooks/useExecutiveSummary";
import { loadAnalyses, saveAnalysis, deleteAnalysis, updateAnalysis, calculateDashboardMetrics } from "./services/analysisHistory";
// ════════════════════════════════ DATA ════════════════════════════════
const DOMAINS = [
  { key: "all",   label: "All Domains",                      spend: 630, risk: "Overall Structural Cost",        comm: "1-5%", vave: "0-10%", pot: 0.000 },
  { key: "prop",  label: "Proprietary Systems & Assemblies", spend: 300, risk: "supplier dependency, IP",        comm: "1-3%", vave: "2-4%",  pot: 0.058 },
  { key: "cast",  label: "Castings",                          spend: 120, risk: "tooling, durability",            comm: "3-5%", vave: "5-8%",  pot: 0.145 },
  { key: "forg",  label: "Forgings & Alloy-Steel Parts",      spend: 85,  risk: "fatigue testing, qualification", comm: "3-5%", vave: "5-10%", pot: 0.135 },
  { key: "tyre",  label: "Tyres & Rubber",                    spend: 60,  risk: "supplier concentration",         comm: "2-3%", vave: "0-2%",  pot: 0.045 },
  { key: "gear",  label: "Gears & Shafts",                    spend: 50,  risk: "tolerance, heat-treat quality",  comm: "2-4%", vave: "3-5%",  pot: 0.095 },
  { key: "other", label: "Other Tail Components",             spend: 15,  risk: "fragmented tail spend",          comm: "2-5%", vave: "3-8%",  pot: 0.110 },
];
const DOM = Object.fromEntries(DOMAINS.map((d) => [d.key, d]));
const SUPPLIERS = ["ABC Foundry", "Apollo Rubber", "Global Components", "Precision Metalworks", "Apex Hydraulics"];
const HEROES = {
  cast: ["Front Axle Housing"],
  prop: ["Transmission Case", "Hydraulic Lift Cover"],
  forg: ["Steering Knuckle"], tyre: ["Rear Tyre 18.4-38"], gear: ["PTO Output Shaft"], other: ["Fender Panel Set"],
};
const SUFFIX = [["H", 7], ["N", 13], ["T", 19], ["Z", 25], ["F", 31], ["L", 37], ["R", 43], ["X", 49]];

function seedOf(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000; return h; }

const PARTS = [];
DOMAINS.filter((d) => d.key !== "all").forEach((d) => {
  const names = [...(HEROES[d.key] || []), ...SUFFIX.map(([L, n]) => `${d.label.split(" ")[0]} Part ${L}-${n}`)]
    .slice(0, 9);
  names.forEach((name, i) => {
    const s = seedOf(d.key + name);
    const price = 96 + (s % 340);
    const gapPct = 9 + (s % 9);
    const spend = +(3.4 + ((s >> 3) % 14) * 1.1).toFixed(2);
    PARTS.push({
      id: d.key + "-" + i, name, domain: d.key,
      supplier: SUPPLIERS[(s + i) % SUPPLIERS.length],
      price, gapPct, shouldCost: Math.round(price * (1 - gapPct / 100)), spend,
    });
  });
});
// the reference part from the live build
const FAH = PARTS.find((p) => p.name === "Front Axle Housing");
Object.assign(FAH, { price: 248, shouldCost: 214, gapPct: 14, spend: 18, supplier: "ABC Foundry" });

const potOf   = (p) => p.spend * DOM[p.domain].pot;
const LEVERS  = [
  { key: "comm",  name: "Commercial Negotiation",        r: 0.800, ttv: "2 Weeks", eff: "LOW",    conf: 94, badge: "AI OPTIMAL CHOICE" },
  { key: "vave",  name: "VAVE Engineering Redesign",     r: 0.988, ttv: "5 Months", eff: "MEDIUM", conf: 88 },
  { key: "supp",  name: "Supplier Resourcing / Change",  r: 1.084, ttv: "7 Months", eff: "HIGH",   conf: 79 },
  { key: "frt",   name: "Freight & Logistics Optimization", r: 0.142, ttv: "1 Month", eff: "LOW",  conf: 96 },
];
const leverValue = (p, l) => potOf(p) * l.r;
const OWNERS = {
  comm: "Sarah Jenkins (Procurement Lead)", vave: "David Miller (Component Eng)",
  supp: "Sarah Jenkins (Procurement Lead)", frt: "Arun Fernandes (Logistics Lead)",
};

const m$  = (n) => "$" + n.toFixed(2) + "M";
const m1$ = (n) => "$" + n.toFixed(2) + "M";
const EFF_TONE = { LOW: "text-emerald-700 border-emerald-200 bg-emerald-50", MEDIUM: "text-amber-700 border-amber-200 bg-amber-50",
  HIGH: "text-red-700 border-red-200 bg-red-50" };
const IMPACT_TONE = { Low: "text-emerald-600", Medium: "text-amber-600", High: "text-red-600", Critical: "text-red-700" };

// ════════════════════════════════ SHARED UI ════════════════════════════
function Badge({ children, tone = "violet" }) {
  const t = { violet: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-100 text-blue-800",
    cyan: "border-blue-200 bg-blue-50 text-blue-700" }[tone];
  return <span className={"rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider " + t}>{children}</span>;
}
function AgentTag({ n, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
      <span className="h-2 w-2 rounded-full bg-blue-600" />
      <span className="text-xs font-bold uppercase tracking-widest text-blue-700">Agent {n} &middot; {label}</span>
    </span>
  );
}
function Panel({ children, className = "" }) {
  return <div className={"rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md " + className}>{children}</div>;
}

// Accenture-style operating model: every agent is one of three roles. Visual
// label only — does not affect navigation or the agent's actual behavior.
const AGENT_ROLES = {
  1: { role: "FRONT AGENT", subtitle: "Executive Intelligence", tone: "border-blue-200 bg-blue-50 text-blue-700" },
  2: { role: "ASSIST AGENT", subtitle: "Should-Cost Intelligence", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  3: { role: "ASSIST AGENT", subtitle: "Negotiation & VAVE Intelligence", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  4: { role: "ASSIST AGENT", subtitle: "Executive Communication", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  5: { role: "BACK AGENT", subtitle: "Impact Monitoring & Continuous Learning", tone: "border-amber-200 bg-amber-50 text-amber-700" },
};
function AgentRoleBadge({ n }) {
  const r = AGENT_ROLES[n];
  return (
    <span className={"inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider " + r.tone}>
      {r.role} &middot; {r.subtitle}
    </span>
  );
}

// Compact horizontal workflow strip shown at the top of every agent page.
// Purely a visual indicator of progress through the 5-agent pipeline —
// completed steps (green), the current step (blue), pending steps (gray).
const TIMELINE_LABELS = ["Executive Intelligence", "Should Cost", "Negotiation", "Executive Approval", "Impact Tracking"];
function AgentStatusTimeline({ step }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {TIMELINE_LABELS.map((label, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "current" : "pending";
        const tone = state === "done" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : state === "current" ? "border-blue-300 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-400";
        const dot = state === "done" ? "bg-emerald-500" : state === "current" ? "bg-blue-500" : "bg-slate-300";
        return (
          <React.Fragment key={label}>
            <span className={"flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold " + tone}>
              <span className={"h-2 w-2 rounded-full " + dot} />
              {label}
            </span>
            {n < TIMELINE_LABELS.length && <span className="text-slate-300">&rarr;</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// The human validation gate shown after every AI generation. Wording here
// ("Human Approval Required") is deliberately consistent across every agent
// so AI never appears to make the final call — only a human "Approve" click
// progresses the workflow.
function HumanApprovalPanel({ title, children, approved, onApprove, approveLabel = "Approve", onRegenerate, regenerateLabel = "Regenerate", onCancel, cancelLabel = "Cancel" }) {
  return (
    <Panel className={approved ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40"}>
      <Badge tone={approved ? "green" : "violet"}>{approved ? "Approved" : "Human Approval Required"}</Badge>
      <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
      {children && <div className="mt-1 text-sm text-slate-600">{children}</div>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={onApprove} disabled={approved}
          className={"rounded-lg px-5 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 " + (approved ? "cursor-not-allowed bg-emerald-300" : "bg-emerald-600 hover:bg-emerald-700")}>
          &#9989; {approved ? "Approved" : approveLabel}
        </button>
        {onRegenerate && (
          <button onClick={onRegenerate} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">
            &#128260; {regenerateLabel}
          </button>
        )}
        {onCancel && (
          <button onClick={onCancel} className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 font-semibold text-red-600 shadow-sm transition-colors duration-150 hover:bg-red-100">
            &#10005; {cancelLabel}
          </button>
        )}
      </div>
    </Panel>
  );
}

// "Recommended Next Step" handoff card — shown once an agent's primary AI
// output is ready, pointing the human at the next agent in the pipeline.
function NextStepCard({ text, actionLabel, onAction }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Recommended Next Step</div>
          <p className="mt-1 text-sm text-slate-700">{text}</p>
        </div>
        <button onClick={onAction} className="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700">
          {actionLabel} &rarr;
        </button>
      </div>
    </div>
  );
}

// Consistent Previous/Next Agent navigation, present on every agent page and
// pinned to the bottom of the viewport as the user scrolls. Reuses the same
// go() step-guard as every other in-app navigation control, so selection
// requirements (e.g. "pick a part before Agent 2") stay enforced.
function AgentNav({ step, go, approvals, toast }) {
  // Steps 2 and 3 require human approval in-page before progressing — this
  // sticky shortcut must honor the same gate, otherwise it would let someone
  // skip the approval panel entirely by using the footer instead of the
  // in-content "Move to Agent N" button.
  function handleNext() {
    if ((step === 2 || step === 3) && !approvals?.[step]) {
      toast?.("Human approval required before moving to the next agent.");
      return;
    }
    go(step + 1);
  }
  return (
    <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      {step > 1 ? (
        <button onClick={() => go(step - 1)}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">
          &larr; Previous Agent
        </button>
      ) : <span />}
      {step < 5 ? (
        <button onClick={handleNext}
          className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700">
          Next Agent &rarr;
        </button>
      ) : <span />}
    </div>
  );
}

const ANALYSIS_STATUSES = ["Completed", "In Progress", "On Hold", "Cancelled"];

// Edit panel for a single Recent Analyses record. Only the fields a human
// can reasonably override are editable (part name, supplier, domain,
// expected savings, status) — AI-generated fields like confidence score and
// timestamp are read-only and not exposed here.
function EditAnalysisModal({ analysis, onSave, onClose }) {
  const [form, setForm] = React.useState({
    partName: analysis.partName,
    supplier: analysis.supplier,
    domain: analysis.domain,
    expectedSavings: analysis.expectedSavings,
    status: analysis.status,
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSave() {
    onSave({
      partName: form.partName.trim() || analysis.partName,
      supplier: form.supplier.trim() || analysis.supplier,
      domain: form.domain,
      expectedSavings: Number(form.expectedSavings) || 0,
      status: form.status,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[22px] font-bold text-slate-900">Edit Analysis</h3>
        <p className="mt-1 text-sm text-slate-500">Update the record's details. AI-generated content is not editable here.</p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Part Name</span>
            <input value={form.partName} onChange={set("partName")}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Supplier</span>
            <input value={form.supplier} onChange={set("supplier")}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Domain</span>
            <select value={form.domain} onChange={set("domain")}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
              {DOMAINS.filter((x) => x.key !== "all").map((x) => <option key={x.key} value={x.label}>{x.label}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expected Savings ($M)</span>
              <input type="number" step="0.01" value={form.expectedSavings} onChange={set("expectedSavings")}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
              <select value={form.status} onChange={set("status")}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                {ANALYSIS_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">
            Cancel
          </button>
          <button onClick={handleSave} className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════ AGENT 1 · EXECUTIVE INTELLIGENCE ═══════════════
function Agent1({ selected, setSelected, go, saved, removeSaved, forecast, analyses, metrics, editAnalysis, removeAnalysis, openPartInAgent2 }) {
  const [dom, setDom] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [editingAnalysis, setEditingAnalysis] = React.useState(null);
  const [focusListOpen, setFocusListOpen] = React.useState(() => {
    try { return sessionStorage.getItem("terramind_focus_list_open") === "1"; } catch { return false; }
  });
  React.useEffect(() => {
    try { sessionStorage.setItem("terramind_focus_list_open", focusListOpen ? "1" : "0"); } catch { /* ignore */ }
  }, [focusListOpen]);
  const d = DOM[dom];
  const market = useMarketData();
  const brief = useExecutiveSummary();

  // Real portfolio data the AI selects its Priority Focus List from \u2014 grounds
  // the list in actual parts/suppliers/savings instead of the model
  // inventing entries. Top 12 by potential savings keeps the prompt compact.
  const portfolioCandidates = React.useMemo(() => (
    [...PARTS]
      .map((p) => ({
        partName: p.name,
        domain: DOM[p.domain].label,
        supplier: p.supplier,
        currentPrice: p.price,
        shouldCost: p.shouldCost,
        gapPct: p.gapPct,
        annualSpendM: p.spend,
        potentialSavingsM: +potOf(p).toFixed(2),
        domainRisk: DOM[p.domain].risk,
      }))
      .sort((a, b) => b.potentialSavingsM - a.potentialSavingsM)
      .slice(0, 12)
  ), []);

  const list = PARTS
    .filter((p) => dom === "all" || p.domain === dom)
    .filter((p) => !q || (p.name + p.supplier + DOM[p.domain].risk).toLowerCase().includes(q.toLowerCase()));

  // Closed-loop learning: once Agent 5 confirms savings were realized, that
  // outcome is patched onto the matching Recent Analyses record (see Agent5
  // below). Feeding it back into the daily brief lets the AI ground future
  // commentary in what was actually achieved, not just what was forecast.
  const realizedSavingsHistory = React.useMemo(() => (
    analyses
      .filter((a) => a.realizedSavings != null)
      .slice(0, 10)
      .map((a) => ({
        partName: a.partName,
        realizedSavingsM: a.realizedSavings,
        implementationDate: a.implementationDate,
        supplier: a.supplier,
        commodity: a.commodity,
        selectedLever: a.selectedLever,
        actualSavingsM: a.actualSavings,
      }))
  ), [analyses]);

  function handleGenerateDailyBrief() {
    brief.generate({
      domain: d.label,
      selectedPart: selected ? selected.name : "None selected",
      supplierRisk: d.risk,
      savedProcesses: saved.map((s) => ({ part: s.part, lever: s.lever, value: s.value })),
      currentSavingsM: saved.reduce((s, x) => s + x.value, 0),
      forecastSavingsM: forecast,
      activeRecommendations: portfolioCandidates.slice(0, 3).map((c) => c.partName),
      portfolioCandidates,
      realizedSavingsHistory,
    });
  }

  const steelChange = market.data?.steel?.change24hPct;
  const rubberChange = market.data?.rubber?.change24hPct;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <AgentTag n="1" label="Executive Intelligence" />
              <AgentRoleBadge n={1} />
            </div>
            <Badge tone="green">Live Stream Sync</Badge>
          </div>
          <h2 className="mt-4 text-[32px] font-bold tracking-tight text-slate-900">AI Daily Brief</h2>
          <p className="mt-1 text-slate-600">Good Morning. Here is what requires your strategic attention today based on live ERP &amp; Market data.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ["Steel Price", steelChange == null ? "\u2026" : (steelChange >= 0 ? "\u2191 +" : "\u2193 ") + steelChange + "%", steelChange >= 0 ? "text-red-600" : "text-emerald-600"],
              ["Rubber Price", rubberChange == null ? "\u2026" : (rubberChange >= 0 ? "\u2191 +" : "\u2193 ") + rubberChange + "%", rubberChange >= 0 ? "text-red-600" : "text-emerald-600"],
              ["Supplier Quotes", "3 Updated", "text-blue-600"], ["Saved Processes", saved.length + " Active", "text-emerald-600"],
              ["Forecast Savings", m$(forecast), "text-blue-600"]].map(([l, v, c]) => (
              <div key={l} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">{l}</div>
                <div className={"mt-1 text-lg font-bold " + c}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <Panel>
          <h3 className="text-base font-bold text-slate-900">Live Commodity Market Feed</h3>
          <p className="text-sm text-slate-500">Current price, 24h change, 7-day trend and last-updated timestamp. Feeds every AI prompt automatically.</p>
          <div className="mt-3">
            <MarketTicker marketData={market.data} loading={market.loading} error={market.error} />
          </div>
        </Panel>

        <AICopilotPanel
          title="TerraMind AI Daily Procurement Intelligence"
          subtitle="Gemini-generated executive intelligence from live ERP, supplier, market and portfolio signals."
          status={brief.status}
          error={brief.error}
          data={brief.data}
          onGenerate={handleGenerateDailyBrief}
          generateLabel="Generate AI Brief"
          idleHint="Generate an executive summary, strategic recommendation, expected business impact and an AI-prioritized focus list."
          copyText={(d) => d && [d.executiveSummary, "", "Strategic Recommendation: " + d.strategicRecommendation, "Recommended Action: " + d.recommendedAction].join("\n")}
          renderContent={(d) => (
            <div className="space-y-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Section 1 &middot; Executive Summary</div>
                <div className="mt-2 space-y-3">
                  <AISection icon="📋" label="Market &amp; Procurement Summary">{d.executiveSummary}</AISection>
                  <div className="grid gap-3 md:grid-cols-2">
                    <AISection icon="🎯" label="Today's Top Opportunity">{d.topOpportunity}</AISection>
                    <AISection icon="⚠️" label="Supplier Risk">{d.biggestRisk}</AISection>
                  </div>
                  <AISection icon="📈" label="Commodity Movement"><AIBulletList items={d.commodityHighlights} /></AISection>
                  <AISection icon="🏭" label="Procurement Highlights"><AIBulletList items={d.supplierAlerts} /></AISection>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Section 2 &middot; Strategic Recommendation</div>
                <div className="mt-2">
                  <AISection icon="🧭" label="Why Act Today &amp; Preferred Sourcing Strategy">{d.strategicRecommendation}</AISection>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Section 3 &middot; Expected Business Impact</div>
                <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <AIStat label="Estimated Savings" value={d.estimatedSavingsM != null ? m$(d.estimatedSavingsM) : "—"} tone="text-emerald-600" />
                  <AIStat label="Risk Level" value={d.riskLevel || "—"} tone={IMPACT_TONE[d.riskLevel] || "text-slate-900"} />
                  <AIStat label="Confidence" value={d.confidenceScore != null ? d.confidenceScore + "%" : "—"} tone="text-blue-600" />
                  <AIStat label="Implementation Priority" value={d.implementationPriority || "—"} tone={IMPACT_TONE[d.implementationPriority] || "text-slate-900"} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <button onClick={() => setFocusListOpen((o) => !o)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-left">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <span className={"inline-block text-base text-blue-600 transition-transform duration-200 " + (focusListOpen ? "rotate-0" : "-rotate-90")}>&#9660;</span>
                      AI Priority Focus List
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{(d.priorityFocusList || []).length} AI-ranked parts &middot; commodity trend, supplier risk, expected savings and portfolio importance</p>
                  </div>
                  <Badge tone="blue">{focusListOpen ? "Collapse" : "Expand"}</Badge>
                </button>
                <div className={"grid transition-all duration-300 ease-in-out " + (focusListOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <div className="space-y-3 border-t border-slate-200 p-4">
                      {(!d.priorityFocusList || d.priorityFocusList.length === 0) && (
                        <p className="text-sm text-slate-500">No prioritized parts were returned for this brief.</p>
                      )}
                      {(d.priorityFocusList || []).map((item, i) => {
                        const part = PARTS.find((p) => p.name === item.partName);
                        return (
                          <div key={item.partName + i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">#{i + 1}</span>
                                <span className="font-bold text-slate-900">{item.partName}</span>
                              </div>
                              <Badge tone="blue">Priority Score {item.priorityScore}</Badge>
                            </div>
                            <p className="mt-2 text-sm text-slate-600"><b className="text-slate-700">Why prioritized:</b> {item.reason}</p>
                            <div className="mt-2 grid gap-1.5 text-xs text-slate-500 sm:grid-cols-2">
                              <div><b className="text-slate-700">Commodity Influence:</b> {item.commodityInfluence}</div>
                              <div><b className="text-slate-700">Supplier Impact:</b> {item.supplierImpact}</div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                <span className="font-bold text-emerald-600">{m$(item.potentialSavingsM)} <span className="font-normal text-slate-500">Est. Savings</span></span>
                                <span className="text-slate-600"><b className="text-slate-700">Recommended Lever:</b> {item.recommendedAction}</span>
                                <span className="text-slate-500">Timeline: {item.timeline}</span>
                              </div>
                              <button onClick={() => part && openPartInAgent2(part)} disabled={!part}
                                className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                                Open Analysis &rarr;
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        />

        {brief.status === "done" && (() => {
          const topPick = brief.data?.priorityFocusList?.[0]?.partName || portfolioCandidates[0]?.partName;
          const topPart = topPick && PARTS.find((p) => p.name === topPick);
          return (
            <NextStepCard
              text={topPick ? `Analyse ${topPick} using Should-Cost Intelligence.` : "Select a priority part and analyse it using Should-Cost Intelligence."}
              actionLabel="Open Agent 2"
              onAction={() => (topPart ? openPartInAgent2(topPart) : go(2))}
            />
          );
        })()}

        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Analyses</h3>
              <p className="text-sm text-slate-500">Automatically logged from every completed AI negotiation analysis</p>
            </div>
            <Badge tone="green">{metrics.totalAnalyses} Records</Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[["Total Analyses", metrics.totalAnalyses, "text-slate-900"],
              ["Savings Identified", m$(metrics.savingsIdentified), "text-emerald-600"],
              ["Avg. AI Confidence", metrics.averageConfidence == null ? "\u2014" : metrics.averageConfidence + "%", "text-blue-600"],
              ["Active Recommendations", metrics.activeRecommendations, "text-blue-600"]].map(([l, v, c]) => (
              <div key={l} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">{l}</div>
                <div className={"mt-1 text-lg font-bold " + c}>{v}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {analyses.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
                No analyses have been completed yet.<br />Run your first analysis to begin building procurement intelligence.
              </p>
            )}
            {analyses.map((a) => (
              <div key={a.analysisId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{a.partName}</span>
                    <Badge>{a.selectedLever}</Badge>
                    <Badge tone="green">{a.status}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-slate-500">Expected Savings</div>
                    <div className="text-lg font-bold text-emerald-600">{m$(a.expectedSavings)}</div>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-slate-500">
                    {a.domain} &middot; {a.supplier} &middot; AI Confidence: <b className="text-slate-600">{a.confidenceScore}%</b> &middot; {new Date(a.timestamp).toLocaleString()}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => setEditingAnalysis(a)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">
                      &#9998; Edit
                    </button>
                    <button onClick={() => removeAnalysis?.(a.analysisId)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 shadow-sm transition-colors duration-150 hover:bg-red-100">
                      &#128465; Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {editingAnalysis && (
          <EditAnalysisModal
            analysis={editingAnalysis}
            onClose={() => setEditingAnalysis(null)}
            onSave={(patch) => { editAnalysis?.(editingAnalysis.analysisId, patch); setEditingAnalysis(null); }}
          />
        )}
      </div>

      <div className="space-y-6">
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[22px] font-bold text-slate-900">Smart Part Search by Domain</h3>
              <p className="mt-1 text-sm text-slate-500">Segregated into 6 case study domains ($630M total spend)</p>
            </div>
            <Badge>Accenture Case Edition</Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {DOMAINS.map((x) => (
              <button key={x.key} onClick={() => setDom(x.key)}
                className={"rounded-full px-3 py-1.5 text-sm font-bold " +
                  (dom === x.key ? "bg-blue-600 text-white shadow-sm" : "border border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:bg-blue-50")}>
                {x.label} (${x.spend}M)
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div>
              <div className="font-bold text-blue-600">{d.label}</div>
              <div className="text-sm text-slate-500">Main Risk: {d.risk}</div>
            </div>
            <div className="text-sm text-slate-600">
              Comm: <b className="text-emerald-600">{d.comm}</b> | VAVE: <b className="text-blue-600">{d.vave}</b>
            </div>
          </div>

          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parts, suppliers or risks..."
            className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />

          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
            {list.map((p) => {
              const sel = selected && selected.id === p.id;
              const wasSaved = saved.some((s) => s.partId === p.id);
              return (
                <button key={p.id} onClick={() => setSelected(p)}
                  className={"flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left " +
                    (sel ? "border-l-4 border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300")}>
                  <span className="min-w-0">
                    <span className="block font-bold text-slate-900">
                      {p.name} {wasSaved && <span className="text-xs font-normal text-emerald-600">[Saved]</span>}
                    </span>
                    <span className="block text-sm text-slate-500">{p.supplier} &middot; <span className="text-blue-600">{DOM[p.domain].label}</span></span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-bold text-slate-900">${p.price}</span>
                    <span className="block text-xs text-emerald-600">{m$(potOf(p))} Pot.</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        {selected && (
          <Panel className="border-blue-200">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="cyan">Ready for Analysis</Badge>
                <h3 className="mt-2 text-[22px] font-bold text-slate-900">{selected.name}</h3>
                <p className="text-sm text-slate-500">
                  Supplier: <b className="text-slate-700">{selected.supplier}</b> &middot; Risk: <b className="text-slate-700">{DOM[selected.domain].risk}</b>
                </p>
              </div>
              <button onClick={() => go(2)}
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700">
                Analyze Part &rarr; Move to Agent 2
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[["Current Price", "$" + selected.price, "text-slate-900"], ["Potential Savings", m$(potOf(selected)), "text-emerald-600"],
                ["Annual Spend", "$" + selected.spend.toFixed(2) + "M", "text-slate-900"], ["AI Should Cost", "$" + selected.shouldCost, "text-blue-600"]].map(([l, v, c]) => (
                <div key={l} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">{l}</div>
                  <div className={"mt-1 text-2xl font-bold " + c}>{v}</div>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════ AGENT 2 · COST INTELLIGENCE ════════════════════
function Agent2({ part, go, approved, setApproved }) {
  const mix = [["Material", 42, "bg-blue-600"], ["Machining", 28, "bg-blue-400"], ["Assembly", 15, "bg-teal-400"],
    ["Overheads", 10, "bg-amber-500"], ["Logistics", 5, "bg-emerald-400"]];
  const d = DOM[part.domain];

  const [whyOpen, setWhyOpen] = React.useState(false);
  const market = useMarketData();
  const why = useAI("cost-explanation");

  function handleExplainCost() {
    why.generate({
      partName: part.name,
      domain: d.label,
      supplier: part.supplier,
      currentPrice: part.price,
      shouldCost: part.shouldCost,
      gapPct: part.gapPct,
      annualSpendM: part.spend,
      costMix: mix.map(([name, pct]) => ({ name, pct })),
      domainRisk: d.risk,
    });
  }

  function toggleWhy() {
    const next = !whyOpen;
    setWhyOpen(next);
    if (next && why.status === "idle") handleExplainCost();
  }

  const commodityMix = [
    ["Steel / Alloy", 54, "bg-blue-500", market.data?.steel],
    ["Iron", 26, "bg-blue-400", market.data?.iron],
    ["Rubber", 12, "bg-emerald-500", market.data?.rubber],
    ["Other", 8, "bg-slate-500", null],
  ];

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <AgentTag n="2" label="Cost Intelligence Agent" />
              <AgentRoleBadge n={2} />
            </div>
            <h2 className="mt-4 text-[32px] font-bold tracking-tight text-slate-900">Cost Driver &amp; Should-Cost Breakdown</h2>
            <p className="mt-1 text-slate-500">
              Analyzing WHY <b className="text-slate-700">{part.name}</b> costs ${part.price} per unit and identifying baseline gaps.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Domain: {d.label}</div>
            <div className="text-2xl font-bold text-blue-600">{part.name}</div>
            <div className="text-sm text-slate-500">{part.supplier} &middot; Spend: ${part.spend.toFixed(2)}M</div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h3 className="text-lg font-bold text-slate-900">Cost Breakdown Structure</h3>
          <p className="text-sm text-slate-500">Unit Price: ${part.price}</p>
          <div className="mt-5 flex h-6 overflow-hidden rounded-full">
            {mix.map(([n, v, c]) => <div key={n} className={c} style={{ width: v + "%" }} />)}
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            {mix.map(([n, v, c]) => (
              <span key={n} className="flex items-center gap-2 text-sm text-slate-600">
                <span className={"h-2.5 w-2.5 rounded-full " + c} />{n} ({v}%)
              </span>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="text-lg font-bold text-slate-900">Should Cost Gap Analysis</h3>
          <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div><div className="text-sm text-slate-500">Supplier Quote</div><div className="text-[32px] font-bold tracking-tight text-slate-900">${part.price}</div></div>
            <div><div className="text-sm text-slate-500">AI Should Cost</div><div className="text-3xl font-bold text-blue-600">${part.shouldCost}</div></div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-center">
              <div className="text-xs uppercase tracking-wider text-red-600">Unjustified Gap</div>
              <div className="text-3xl font-bold text-red-600">{part.gapPct}%</div>
            </div>
          </div>
          <p className="mt-4 text-slate-600">
            AI indicates supplier quote is <b className="text-slate-900">{part.gapPct}% above theoretical should-cost</b> based on raw material and processing benchmarks.
          </p>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel>
          <h3 className="text-base font-bold text-slate-900">Supplier Scorecard</h3>
          <div className="mt-3 space-y-3">
            {[["Quality (PPM)", 88, "bg-emerald-500"], ["On-Time Delivery", 94, "bg-blue-500"], ["Cost Competitiveness", 62, "bg-amber-500"], ["Responsiveness", 76, "bg-blue-300"]].map(([l, v, c]) => (
              <div key={l}>
                <div className="flex justify-between text-sm"><span className="text-slate-600">{l}</span><span className="font-bold text-slate-900">{v}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"><div className={"h-2 " + c} style={{ width: v + "%" }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">{part.supplier} &middot; cost competitiveness is the weak axis.</p>
        </Panel>

        <Panel>
          <h3 className="text-base font-bold text-slate-900">Existing VAVE Pipeline</h3>
          <div className="mt-3 space-y-2">
            {[["Wall-thickness reduction", "Validated", "text-emerald-600"], ["Machining stock reduction", "In review", "text-amber-600"],
              ["Platform commonisation", "Idea", "text-slate-500"], ["Material substitution", "Blocked", "text-red-600"]].map(([n, s, c]) => (
              <div key={n} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-700">{n}</span><span className={"text-xs font-bold " + c}>{s}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="text-base font-bold text-slate-900">Commodity Exposure Mix</h3>
          <p className="text-xs text-slate-500">Live 24h change from the commodity feed</p>
          <div className="mt-3 space-y-3">
            {commodityMix.map(([l, v, c, live]) => {
              const chg = live?.change24hPct;
              const mv = chg == null ? "flat" : (chg >= 0 ? "\u2191 +" : "\u2193 ") + chg + "%";
              return (
                <div key={l}>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">{l}</span><span className="text-slate-500">{v}% &middot; {mv}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"><div className={"h-2 " + c} style={{ width: v + "%" }} /></div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel>
        <button onClick={toggleWhy} className="flex w-full flex-wrap items-center justify-between gap-3 text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Why is this component expensive?</h3>
            <p className="text-sm text-slate-500">AI-generated deep-dive into cost drivers, materials, manufacturing, suppliers and engineering opportunities.</p>
          </div>
          <span className={"text-2xl text-slate-500 transition-transform " + (whyOpen ? "rotate-180" : "")}>&#9662;</span>
        </button>
        {whyOpen && (
          <div className="mt-4">
            <AICopilotPanel
              title="AI Cost Driver Explanation"
              subtitle="Reads like a consultant's report — material, manufacturing, supplier and commodity drivers, plus improvement ideas."
              status={why.status}
              error={why.error}
              data={why.data}
              onGenerate={handleExplainCost}
              generateLabel="Explain Cost Drivers"
              idleHint="Generating an AI cost driver explanation…"
              className="border-slate-200"
              copyText={(d) => d && [d.recommendation].join("\n")}
              renderContent={(d) => (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <AISection icon="🧱" label="Material Drivers"><AIBulletList items={d.materialDrivers} /></AISection>
                    <AISection icon="⚙️" label="Manufacturing Drivers"><AIBulletList items={d.manufacturingDrivers} /></AISection>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <AISection icon="🏭" label="Supplier Pricing Behaviour"><AIBulletList items={d.supplierPricingBehaviour} /></AISection>
                    <AISection icon="📈" label="Commodity Impact"><AIBulletList items={d.commodityImpact} /></AISection>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <AISection icon="🔧" label="Engineering Improvement Ideas"><AIBulletList items={d.engineeringIdeas} /></AISection>
                    <AISection icon="🤝" label="Commercial Improvement Ideas"><AIBulletList items={d.commercialIdeas} /></AISection>
                  </div>
                  <AISection icon="✅" label="Overall Recommendation">{d.recommendation}</AISection>
                </div>
              )}
            />
          </div>
        )}
      </Panel>

      {why.status === "done" && (
        <HumanApprovalPanel
          title="Human Decision Required"
          approved={approved}
          approveLabel="Approve Analysis"
          onApprove={() => setApproved(true)}
          regenerateLabel="Request Regeneration"
          onRegenerate={() => { setApproved(false); handleExplainCost(); }}
          cancelLabel="Cancel"
          onCancel={() => go(1)}
        >
          Review the AI cost driver explanation above. Approving confirms procurement has reviewed the AI's reasoning before moving to lever evaluation.
        </HumanApprovalPanel>
      )}

      {approved && (
        <NextStepCard text="Develop negotiation strategy." actionLabel="Open Agent 3" onAction={() => go(3)} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => go(1)} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">
          &larr; Back to Agent 1
        </button>
        <div className="text-right">
          <button onClick={() => go(3)} disabled={!approved}
            className={"rounded-lg px-6 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 " + (approved ? "bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-slate-300")}>
            Evaluate Levers &rarr; Move to Agent 3
          </button>
          {!approved && <p className="mt-1 text-xs text-slate-500">Generate the AI cost driver explanation above and approve it to continue.</p>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════ AGENT 3 · COST LEVER DECISION ═════════════════
function Agent3({ part, lever, setLever, go, recordAnalysis, approved, setApproved }) {
  const [modal, setModal] = React.useState(false);
  const d = DOM[part.domain];
  const sel = lever || LEVERS[0];
  const market = useMarketData();
  const negotiation = useAI("negotiation");

  function handleGenerateBrief() {
    negotiation.generate({
      partName: part.name,
      currentCost: part.price,
      shouldCost: part.shouldCost,
      supplier: part.supplier,
      annualSpendM: part.spend,
      selectedLever: sel.name,
      domainRisk: d.risk,
      gapPct: part.gapPct,
      expectedSavingsM: leverValue(part, sel),
      timeToValue: sel.ttv,
      engineeringEffort: sel.eff,
      aiConfidence: sel.conf,
      leadOwner: OWNERS[sel.key],
    });
  }

  // A completed AI negotiation analysis is only logged to the Agent 1
  // "Recent Analyses" dashboard once a human explicitly approves it below —
  // AI output alone no longer auto-progresses the workflow or the audit
  // trail. The ref still guards against double-recording the same approved
  // result (e.g. a stray extra click before the button disables).
  const recordedDataRef = React.useRef(null);
  function handleApproveStrategy() {
    if (negotiation.status !== "done" || !negotiation.data) return;
    if (recordedDataRef.current !== negotiation.data) {
      recordedDataRef.current = negotiation.data;
      recordAnalysis?.({
        analysisId: "an_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        timestamp: new Date().toISOString(),
        domain: d.label,
        partName: part.name,
        supplier: part.supplier,
        currentCost: part.price,
        shouldCost: part.shouldCost,
        expectedSavings: +leverValue(part, sel).toFixed(2),
        selectedLever: sel.name,
        confidenceScore: negotiation.data.confidenceScore ?? sel.conf,
        status: "Completed",
        // extra convenience fields used by existing UI patterns elsewhere
        partId: part.id,
        owner: OWNERS[sel.key],
      });
    }
    setApproved(true);
  }

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <AgentTag n="3" label="Cost Lever Decision Agent" />
              <AgentRoleBadge n={3} />
            </div>
            <h2 className="mt-4 text-[32px] font-bold tracking-tight text-slate-900">Strategic Lever Evaluation &amp; Recommendation</h2>
            <p className="mt-1 text-slate-500">
              Comparing strategic levers for <b className="text-slate-700">{part.name}</b> ({d.label} &middot; ${part.spend.toFixed(2)}M Spend).
            </p>
          </div>
          <Badge tone="green">Case Category: {d.label}</Badge>
        </div>
      </Panel>

      <Panel>
        <h3 className="text-lg font-bold text-slate-900">Cost Reduction Lever Matrix</h3>
        <p className="text-sm text-slate-500">Select a lever to evaluate implementation playbook</p>
        <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-slate-50">
                {["LEVER", "EXPECTED SAVINGS", "TIME TO VALUE", "ENGINEERING EFFORT", "CONFIDENCE SCORE", "ACTION"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEVERS.map((l) => {
                const isSel = sel.key === l.key;
                return (
                  <tr key={l.key} className={"border-b border-slate-200 transition-colors duration-150 " + (isSel ? "border-l-4 border-l-blue-500 bg-blue-50" : "odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/50")}>
                    <td className="px-3 py-4">
                      <span className={"font-bold " + (isSel ? "text-blue-700" : "text-slate-900")}>{l.name}</span>
                      {l.badge && <span className="ml-2 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{l.badge}</span>}
                    </td>
                    <td className="px-3 py-4 text-lg font-bold text-emerald-600">{m$(leverValue(part, l))}</td>
                    <td className="px-3 py-4 text-slate-700">{l.ttv}</td>
                    <td className="px-3 py-4"><span className={"rounded-full border px-3 py-1 text-xs font-bold " + EFF_TONE[l.eff]}>{l.eff}</span></td>
                    <td className="px-3 py-4 text-base font-bold text-slate-900">{l.conf}%</td>
                    <td className="px-3 py-4">
                      <button onClick={() => setLever(l)}
                        className={"rounded-lg border px-4 py-1.5 text-sm font-bold transition-colors duration-150 " +
                          (isSel ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50")}>
                        {isSel ? "Selected" : "Select"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="absolute -right-12 top-4 rotate-45 bg-blue-600 px-12 py-1 text-xs font-bold text-white">OPTIMAL CHOICE</div>
        <Badge>AI Recommendation Insight</Badge>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-[22px] font-bold text-slate-900">Selected Lever: {sel.name}</h3>
          <div className="text-right">
            <div className="text-sm text-slate-500">AI Confidence</div>
            <div className="text-3xl font-bold text-emerald-600">{sel.conf}%</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["Expected Savings", m$(leverValue(part, sel)), "text-emerald-600"], ["Timeline", sel.ttv, "text-slate-900"],
            ["Engineering Effort", sel.eff.charAt(0) + sel.eff.slice(1).toLowerCase(), "text-amber-600"],
            ["Domain Risk Mitigated", d.risk, "text-slate-900"]].map(([l, v, c]) => (
            <div key={l} className="rounded-xl border border-blue-200 bg-white p-3">
              <div className="text-xs text-slate-500">{l}</div>
              <div className={"mt-1 font-bold " + c}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <Panel className="border-slate-200">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Live Commodity Context feeding this negotiation</h3>
        <div className="mt-3">
          <MarketTicker marketData={market.data} loading={market.loading} error={market.error} />
        </div>
      </Panel>

      <AICopilotPanel
        title="AI Negotiation Copilot"
        subtitle={`Flagship Gemini-generated negotiation strategy for ${part.name} under ${sel.name}.`}
        status={negotiation.status}
        error={negotiation.error}
        data={negotiation.data}
        onGenerate={handleGenerateBrief}
        generateLabel="Generate AI Negotiation Strategy"
        idleHint="Generate an executive summary, negotiation objective, target/walk-away price, BATNA, supplier behaviour analysis, objections & responses, strategy, savings, risks, fallback and confidence score."
        copyText={(d) => d && [
          "Executive Summary: " + d.executiveSummary,
          "Objective: " + d.negotiationObjective,
          "Target Price: $" + d.targetPrice + " | Walk-Away: $" + d.walkAwayPrice,
          "BATNA: " + d.batna,
          "Strategy: " + d.negotiationStrategy,
          "Expected Savings: " + d.expectedSavings,
          "Fallback: " + d.fallbackStrategy,
        ].join("\n")}
        renderContent={(d) => (
          <div className="space-y-3">
            <AISection icon="📋" label="Executive Summary">{d.executiveSummary}</AISection>
            <AISection icon="🎯" label="Negotiation Objective">{d.negotiationObjective}</AISection>

            <div className="grid gap-3 md:grid-cols-3">
              <AIStat label="Target Price" value={"$" + d.targetPrice} tone="text-emerald-600" />
              <AIStat label="Walk-Away Price" value={"$" + d.walkAwayPrice} tone="text-amber-600" />
              <AIStat label="Expected Savings" value={d.expectedSavings} tone="text-blue-600" />
            </div>

            <AISection icon="🔀" label="BATNA (Best Alternative)">{d.batna}</AISection>
            <AISection icon="🕵️" label="Supplier Behaviour Analysis">{d.supplierBehaviourAnalysis}</AISection>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">💬 Objections &amp; Suggested Responses</div>
              <div className="mt-3 space-y-3">
                {(d.likelyObjections || []).map((obj, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-sm text-red-700"><b>Objection:</b> {obj}</div>
                    <div className="mt-1 text-sm text-emerald-700"><b>Response:</b> {d.suggestedResponses?.[i]}</div>
                  </div>
                ))}
              </div>
            </div>

            <AISection icon="🧭" label="Negotiation Strategy">{d.negotiationStrategy}</AISection>
            <AISection icon="⚠️" label="Business Risks"><AIBulletList items={d.businessRisks} /></AISection>
            <AISection icon="🛟" label="Fallback Strategy">{d.fallbackStrategy}</AISection>
          </div>
        )}
      />

      {negotiation.status === "done" && (
        <HumanApprovalPanel
          title="Engineering / Procurement Review"
          approved={approved}
          approveLabel="Approve Strategy"
          onApprove={handleApproveStrategy}
          regenerateLabel="Regenerate Strategy"
          onRegenerate={() => { setApproved(false); recordedDataRef.current = null; handleGenerateBrief(); }}
          cancelLabel="Cancel"
          onCancel={() => go(2)}
        >
          Review the AI negotiation strategy above for <b>{sel.name}</b>. Approving logs this as a completed analysis and unlocks the execution plan.
        </HumanApprovalPanel>
      )}

      {approved && (
        <NextStepCard text="Prepare executive approval." actionLabel="Open Agent 4" onAction={() => go(4)} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => setModal(true)} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">
          View Detailed Rationale
        </button>
        <div className="text-right">
          <button onClick={() => go(4)} disabled={!approved}
            className={"rounded-lg px-6 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 " + (approved ? "bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-slate-300")}>
            Generate Execution Plan &rarr; Move to Agent 4
          </button>
          {!approved && <p className="mt-1 text-xs text-slate-500">Generate the AI negotiation strategy above and approve it to continue.</p>}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={() => setModal(false)}>
          <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[22px] font-bold text-slate-900">Lever Decision Analysis: {part.name}</h3>
            <p className="mt-1 text-slate-500">Deep-dive rationale for selecting <b className="text-blue-700">{sel.name}</b> under <b className="text-blue-700">{d.label}</b>.</p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-bold uppercase tracking-wider text-slate-500">Case Domain &amp; Risk</div>
              <p className="mt-1 text-slate-700">{d.label} &middot; Risk: {d.risk}</p>
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-bold uppercase tracking-wider text-slate-500">Strategy Rationale</div>
              <p className="mt-1 text-slate-700">
                Supplier quote (${part.price}) exceeds Should-Cost baseline (${part.shouldCost}) by {part.gapPct}%. Executing <b className="text-blue-700">{sel.name}</b> under lead owner <b className="text-slate-900">{OWNERS[sel.key]}</b> captures target savings cleanly.
              </p>
            </div>
            <button onClick={() => setModal(false)} className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">Close Details</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════ AGENT 4 · EXECUTION PLANNER ═══════════════════
function playbook(part, l) {
  const d = DOM[part.domain], gap = part.price - part.shouldCost;
  const walk = Math.round(part.price - gap * 0.6);
  const val = leverValue(part, l);
  const P = {
    comm: { title: "Commercial Negotiation Execution Playbook", pill: "TARGET PRICE: $" + part.shouldCost + " / UNIT",
      paramsTitle: "\uD83C\uDFAF Pricing Parameters & Guardrails",
      params: [["Current Quote", "$" + part.price, "text-slate-900"], ["Target Negotiation Price", "$" + part.shouldCost, "text-emerald-600"],
        ["Walk-Away Limit Price", "$" + walk, "text-amber-600"], ["Expected Annual Savings", m$(val), "text-blue-600"]],
      argsTitle: "\uD83D\uDCAC AI Key Negotiation Arguments",
      args: [`Supplier quote is ${part.gapPct}% higher than AI benchmark should-cost model ($${part.shouldCost}).`,
        `Case domain benchmark targets commercial savings of ${d.comm}.`,
        `Mitigate primary domain risk: ${d.risk} via explicit contract terms.`,
        "Combine order volumes across sister plants for volume rebate tiering."],
      peopleTitle: "\uD83D\uDC65 Meeting Participants & Lead Owner",
      people: [["Lead Negotiator", "Sarah Jenkins (Procurement Lead)"], ["Engineering Rep", "David Miller (Component Eng)"], ["Supplier Contact", part.supplier + " Sales VP"]],
      timeline: ["Week 1: Issue Commercial Notice & Benchmark Brief", "Week 2: Formal Alignment Meeting & Agreement Finalization"] },
    vave: { title: "VAVE Engineering Redesign Execution Playbook", pill: "TARGET UNIT COST: $" + Math.round(part.shouldCost * 0.92),
      paramsTitle: "\uD83C\uDFAF Design Parameters & Guardrails",
      params: [["Current Unit Cost", "$" + part.price, "text-slate-900"], ["Post-Redesign Target", "$" + Math.round(part.shouldCost * 0.92), "text-emerald-600"],
        ["Qualification Budget", "$180k", "text-amber-600"], ["Expected Annual Savings", m$(val), "text-blue-600"]],
      argsTitle: "\uD83D\uDCAC AI Key Redesign Arguments",
      args: [`Teardown benchmarks show lighter geometry achieving the same function in ${d.label}.`,
        `Case domain benchmark targets VAVE savings of ${d.vave}.`,
        `Primary domain risk ${d.risk} is controlled by a physical qualification gate.`,
        "Commonise the change across sister platforms to multiply the saving."],
      peopleTitle: "\uD83D\uDC65 Project Team & Lead Owner",
      people: [["Lead Engineer", "David Miller (Component Eng)"], ["Cost Engineer", "Sarah Jenkins (Procurement Lead)"], ["Test Lab", "Terravik Validation Centre"]],
      timeline: ["Month 1: Concept & FEA sign-off", "Month 2-3: Prototype build and first-article inspection",
        "Month 4: Physical qualification to pass criterion", "Month 5: PPAP and production release"] },
    supp: { title: "Supplier Resourcing / Change Execution Playbook", pill: "TARGET LANDED COST: $" + Math.round(part.shouldCost * 0.97),
      paramsTitle: "\uD83C\uDFAF Sourcing Parameters & Guardrails",
      params: [["Incumbent Quote", "$" + part.price, "text-slate-900"], ["Target Landed Cost", "$" + Math.round(part.shouldCost * 0.97), "text-emerald-600"],
        ["Switching & Tooling Cost", "$420k", "text-amber-600"], ["Expected Annual Savings", m$(val), "text-blue-600"]],
      argsTitle: "\uD83D\uDCAC AI Key Sourcing Arguments",
      args: ["Three alternate sources qualified on capability, capacity and financial health.",
        `Dual-sourcing removes the concentration exposure flagged as ${d.risk}.`,
        "Retain incumbent at 30% allocation to protect continuity during transition.",
        "Tooling ownership must transfer before any volume moves."],
      peopleTitle: "\uD83D\uDC65 Sourcing Team & Lead Owner",
      people: [["Lead Sourcing Manager", "Sarah Jenkins (Procurement Lead)"], ["Supplier Quality", "Priya Nair (SQE)"], ["Engineering Rep", "David Miller (Component Eng)"]],
      timeline: ["Month 1-2: RFQ and capability audit", "Month 3-4: Sample approval and PPAP",
        "Month 5-6: Pilot volume and dual-run", "Month 7: Full transition and incumbent step-down"] },
    frt: { title: "Freight & Logistics Optimization Playbook", pill: "TARGET LANE SAVING: " + m$(val),
      paramsTitle: "\uD83C\uDFAF Lane Parameters & Guardrails",
      params: [["Current Lane", "Spot booked", "text-slate-900"], ["Recommended Lane", "12-month contracted", "text-emerald-600"],
        ["Transit Change", "+0 days", "text-amber-600"], ["Expected Annual Savings", m$(val), "text-blue-600"]],
      argsTitle: "\uD83D\uDCAC AI Key Logistics Arguments",
      args: ["Inbound freight is bought on spot, so the rate resets on every booking.",
        "Contracting the lane fixes the rate without lengthening transit.",
        "Consolidation with two other suppliers adds saving but costs transit days.",
        "Packaging should-cost and in-housing releases a further reduction."],
      peopleTitle: "\uD83D\uDC65 Logistics Team & Lead Owner",
      people: [["Lead Owner", "Arun Fernandes (Logistics Lead)"], ["Freight Forwarder", "Regional 3PL partner"], ["Plant Materials", "Inbound scheduling"]],
      timeline: ["Week 1-2: Lane tender and rate benchmark", "Week 3-4: Contract award and cut-over"] },
  };
  return P[l.key];
}

function formatEmailText(d) {
  if (!d) return "";
  return [
    "Subject: " + d.subject,
    "",
    d.executiveSummary,
    "",
    "Business Context:",
    d.businessContext,
    "",
    "Decision Taken:",
    d.decisionTaken,
    "",
    "Expected Savings: " + d.expectedSavings,
    "Timeline: " + d.timeline,
    "",
    "Required Approvals:",
    ...(d.requiredApprovals || []).map((a) => "- " + a),
    "",
    "Next Steps:",
    ...(d.nextSteps || []).map((a) => "- " + a),
    "",
    "Risk Statement:",
    d.riskStatement,
    "",
    "Action Items:",
    ...(d.actionItems || []).map((a) => "- " + a),
  ].join("\n");
}

function Agent4({ part, lever, go, toast }) {
  const pb = playbook(part, lever);
  const d = DOM[part.domain];

  const emailAI = useAI("executive-email");
  const [emailDraft, setEmailDraft] = React.useState("");
  const [emailTo, setEmailTo] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (emailAI.status === "done" && emailAI.data) setEmailDraft(formatEmailText(emailAI.data));
  }, [emailAI.status, emailAI.data]);

  function handleGenerateEmail() {
    emailAI.generate({
      partName: part.name,
      domain: d.label,
      approvedStrategy: lever.name,
      owner: OWNERS[lever.key],
      expectedSavingsM: leverValue(part, lever),
      timeline: lever.ttv,
      actionRequired: pb.args[0],
      nextMilestone: pb.timeline[0],
    });
  }

  function copyEmail() {
    if (!emailDraft) return;
    navigator.clipboard?.writeText(emailDraft).then(() => toast("Email copied to clipboard."));
  }

  async function sendEmail() {
    if (!emailDraft) return;
    setSending(true);
    try {
      const subjectMatch = emailDraft.match(/^Subject:\s*(.+)$/mi);
      const subject = subjectMatch ? subjectMatch[1].trim() : `TerraMind Update: ${part.name}`;
      await sendExecutiveEmail({ toEmail: emailTo, subject, message: emailDraft });
      toast("Executive email sent.");
    } catch (error) {
      toast(error.message || "Unable to send the email right now.");
    } finally {
      setSending(false);
    }
  }

  function download() {
    const lines = [
      "TERRAMIND \u2014 EXECUTION PLAYBOOK", "=".repeat(60), "",
      "Part:        " + part.name, "Domain:      " + d.label, "Supplier:    " + part.supplier,
      "Annual spend: $" + part.spend.toFixed(2) + "M", "", "STRATEGY: " + lever.name,
      "Expected annual savings: " + m$(leverValue(part, lever)),
      "Time to value: " + lever.ttv + "   Engineering effort: " + lever.eff + "   AI confidence: " + lever.conf + "%",
      "", pb.paramsTitle.replace(/[^\x20-\x7E]/g, "").trim(), "-".repeat(60),
      ...pb.params.map(([l, v]) => "  " + l.padEnd(30) + v),
      "", pb.argsTitle.replace(/[^\x20-\x7E]/g, "").trim(), "-".repeat(60),
      ...pb.args.map((a, i) => "  " + (i + 1) + ". " + a),
      "", pb.peopleTitle.replace(/[^\x20-\x7E]/g, "").trim(), "-".repeat(60),
      ...pb.people.map(([l, v]) => "  " + l.padEnd(24) + v),
      "", "EXECUTION TIMELINE", "-".repeat(60),
      ...pb.timeline.map((t) => "  " + t),
      "", "=".repeat(60), "Generated by TerraMind \u2014 AI Cost Transformation Engine v3.4",
      "Booked autonomously by the agent: $0.00. Every action requires a named human approver.",
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "TerraMind_Playbook_" + part.name.replace(/\s+/g, "_") + "_" + lever.key + ".txt";
    a.click(); URL.revokeObjectURL(a.href);
    toast("Playbook downloaded for " + lever.name + ".");
  }

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <AgentTag n="4" label="Execution Planner Agent" />
            <h2 className="mt-4 text-[32px] font-bold tracking-tight text-slate-900">Execution Roadmap &amp; Action Playbook</h2>
            <p className="mt-1 text-slate-500">
              Converting chosen strategy into actionable execution workflow for <b className="text-slate-700">{part.name}</b> ({d.label}).
            </p>
          </div>
          <Badge tone="green">Strategy: {lever.name}</Badge>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[22px] font-bold text-slate-900">{pb.title}</h3>
          <Badge tone="blue">{pb.pill}</Badge>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-lg font-bold text-blue-600">{pb.paramsTitle}</h4>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {pb.params.map(([l, v, c]) => (
                <div key={l} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">{l}</div>
                  <div className={"mt-1 text-xl font-bold " + c}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-lg font-bold text-blue-600">{pb.argsTitle}</h4>
            <ul className="mt-3 space-y-2">
              {pb.args.map((a, i) => (
                <li key={i} className="flex gap-2 text-slate-600"><span className="text-blue-600">&#9656;</span><span>{a}</span></li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-lg font-bold text-blue-600">{pb.peopleTitle}</h4>
            <div className="mt-3 space-y-1 text-slate-600">
              {pb.people.map(([l, v]) => <div key={l}>{l}: <b className="text-slate-900">{v}</b></div>)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-lg font-bold text-blue-600">{"\uD83D\uDCC5"} Execution Timeline</h4>
            <div className="mt-3 space-y-1 text-slate-600">{pb.timeline.map((t) => <div key={t}>{t}</div>)}</div>
          </div>
        </div>
      </Panel>

      <AICopilotPanel
        title="AI Executive Email Drafter"
        subtitle={`Gemini-drafted executive update for ${part.name} (${lever.name}).`}
        status={emailAI.status}
        error={emailAI.error}
        data={emailAI.data}
        onGenerate={handleGenerateEmail}
        generateLabel="Generate Executive Email"
        idleHint="Generate subject, executive summary, business context, decision taken, expected savings, timeline, required approvals, next steps, risk statement and action items."
        renderContent={(d) => (
          <div className="space-y-3">
            <AISection icon="\u2709\uFE0F" label="Subject">{d.subject}</AISection>
            <AISection icon="\uD83D\uDCCB" label="Executive Summary">{d.executiveSummary}</AISection>
            <div className="grid gap-3 md:grid-cols-2">
              <AISection icon="\uD83C\uDFE2" label="Business Context">{d.businessContext}</AISection>
              <AISection icon="\u2705" label="Decision Taken">{d.decisionTaken}</AISection>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <AIStat label="Expected Savings" value={d.expectedSavings} tone="text-emerald-600" />
              <AIStat label="Timeline" value={d.timeline} tone="text-blue-600" />
            </div>
            <AISection icon="\uD83D\uDD8B\uFE0F" label="Required Approvals"><AIBulletList items={d.requiredApprovals} /></AISection>
            <AISection icon="\u27A1\uFE0F" label="Next Steps"><AIBulletList items={d.nextSteps} /></AISection>
            <AISection icon="\u26A0\uFE0F" label="Risk Statement">{d.riskStatement}</AISection>
            <AISection icon="\uD83D\uDDC2\uFE0F" label="Action Items"><AIBulletList items={d.actionItems} /></AISection>
            <p className="text-xs text-slate-500">Edited into the editable draft below \u2014 copy, tweak or send from there.</p>
          </div>
        )}
      />

      {emailDraft && emailAI.status !== "thinking" && (
        <Panel>
          <h3 className="text-base font-bold text-slate-900">Review &amp; Send</h3>
          <p className="text-sm text-slate-500">Edit the draft below before copying or sending.</p>
          <input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="Recipient email address"
            className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          <textarea value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} rows={12}
            className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          <div className="mt-3 flex flex-wrap gap-3">
            <button onClick={copyEmail} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">
              {"\uD83D\uDCCB"} Copy Email
            </button>
            <button onClick={sendEmail} disabled={sending || !emailTo}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
              {sending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {sending ? "Sending\u2026" : "\uD83D\uDCE4 Send Email"}
            </button>
          </div>
        </Panel>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => go(3)} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">
            &larr; Back to Agent 3
          </button>
          <button onClick={download} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">
            {"\uD83D\uDCC4"} Download {lever.name} Playbook
          </button>
        </div>
        <button onClick={() => go(5)} className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700">
          Track Impact &rarr; Move to Agent 5
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════ AGENT 5 · TRANSFORMATION MONITOR ══════════════
function Agent5({ part, lever, saved, save, removeSaved, forecast, achieved, go, toast }) {
  const savedThis = saved.some((s) => s.partId === part.id);
  const funnel = [["Ideas Generated", 2100, "bg-blue-700", 100], ["Prioritized Opportunities", 420, "bg-blue-500", 80],
    ["Approved & Saved Processes", 168 + saved.length, "bg-teal-500", 62], ["Implemented & Realized", 73, "bg-emerald-600", 44]];
  const initiatives = [["Commercial Negotiations", 18, 20, "text-emerald-600"], ["VAVE Engineering Projects", 12, 15, "text-blue-600"],
    ["Supplier Resourcing Changes", 6, 8, "text-blue-600"]];
  const summary = [
    "Negotiation initiatives are progressing ahead of schedule with 90% completion across high-priority parts.",
    "VAVE implementation remains on target with zero engineering hold-ups reported across all 6 case domains ($630M spend pool).",
    `Current forecast (${m$(forecast)}) comfortably exceeds annual cost transformation target ($36.5M).`,
    "Updating Agent 1 priorities with updated savings data and completed action status.",
  ];

  const report = useAI("transformation-report");

  function handleGenerateReport() {
    report.generate({
      latestPart: part.name,
      latestStrategy: lever.name,
      annualSavingsTargetM: 36.5,
      achievedSavingsYtdM: achieved,
      forecastSavingsM: forecast,
      transformationFunnel: funnel.map(([label, value]) => ({ label, value })),
      initiativeExecution: initiatives.map(([label, done, total]) => ({ label, done, total })),
      savedProcesses: saved.map((s) => ({ part: s.part, strategy: s.lever, owner: s.owner, savingM: s.value })),
    });
  }

  function dl(name, body) {
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
    toast(name + " downloaded.");
  }
  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <AgentTag n="5" label="Transformation Monitor Agent" />
            <h2 className="mt-4 text-[32px] font-bold tracking-tight text-slate-900">Business Impact &amp; Process Finalization</h2>
            <p className="mt-1 text-slate-500">
              Review outcomes for <b className="text-slate-700">{part.name}</b> and click <b className="text-slate-900">"Save Process"</b> to update annual savings forecast.
            </p>
          </div>
          <button onClick={save} disabled={savedThis}
            className={"rounded-lg px-6 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 " + (savedThis ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700")}>
            {"\uD83D\uDCBE"} {savedThis ? "Process Saved" : "Save Process"}
          </button>
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-3">
        <Panel><div className="text-base font-medium text-slate-500">Annual Savings Target</div>
          <div className="mt-2 text-4xl font-bold text-slate-900">$36.5M</div>
          <div className="mt-1 text-sm text-slate-500">Board Approved Baseline Target</div></Panel>
        <Panel><div className="text-base font-medium text-slate-500">Achieved Realized Savings (YTD)</div>
          <div className="mt-2 text-4xl font-bold text-emerald-600">{m$(achieved)}</div>
          <div className="mt-1 text-sm text-slate-500">Physical Implementation Verified Baseline</div></Panel>
        <Panel className="border-blue-200"><div className="text-base font-medium text-slate-500">Annual Forecast (Updated Live)</div>
          <div className="mt-2 text-4xl font-bold text-blue-600">{m$(forecast)}</div>
          <div className="mt-1 text-sm text-blue-600">Updates whenever a process is saved!</div></Panel>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-bold text-emerald-600">Saved Analysis Processes ({saved.length})</h3>
          <Badge tone="green">Forecast Updated</Badge>
        </div>
        <div className="mt-3 space-y-2">
          {saved.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-sm text-slate-500">No processes saved yet.</p>}
          {saved.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div><b className="text-slate-900">{s.part}</b>
                <span className="ml-2 text-sm text-slate-500">Strategy: {s.lever} &middot; Owner: {s.owner} &middot; {s.when}</span></div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-600">+{m$(s.value)} to Forecast</span>
                <button onClick={() => removeSaved(s.id)} className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors duration-150 hover:bg-red-100">{"\uD83D\uDDD1"}</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h3 className="text-lg font-bold text-slate-900">Transformation Funnel Progress</h3>
          <p className="text-sm text-slate-500">Idea generation to value realization ($630M total spend pool)</p>
          <div className="mt-4 space-y-2">
            {funnel.map(([l, v, c, w], i) => (
              <div key={l} style={{ marginLeft: i * 28 }}>
                <div className={"flex items-center justify-between rounded-xl px-4 py-3 " + c} style={{ width: w + "%" }}>
                  <span className="font-bold text-white">{l}</span><span className="font-bold text-white">{v}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h3 className="text-lg font-bold text-slate-900">Initiative Execution Status</h3>
          <div className="mt-4 space-y-4">
            {initiatives.map(([l, a, b, c]) => (
              <div key={l}>
                <div className="flex justify-between"><span className="font-bold text-slate-900">{l}</span><span className={"font-bold " + c}>{a} / {b} Complete</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-2 bg-blue-600" style={{ width: (a / b) * 100 + "%" }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <AICopilotPanel
        title="AI Executive Transformation Report"
        subtitle="Gemini-generated, export-ready board report covering portfolio, savings, risk and recommendations."
        status={report.status}
        error={report.error}
        data={report.data}
        onGenerate={handleGenerateReport}
        generateLabel="Generate AI Report"
        idleHint="Generate a transformation summary, portfolio health, savings achieved/forecast, risks, success stories, open actions, executive recommendations and next-quarter priorities."
        copyText={(d) => d && [d.transformationSummary, "", "Portfolio Health: " + d.portfolioHealth].join("\n")}
        renderContent={(d) => (
          <div className="space-y-3">
            <AISection icon="📋" label="Transformation Summary">{d.transformationSummary}</AISection>
            <div className="grid gap-3 md:grid-cols-3">
              <AIStat label="Portfolio Health" value={d.portfolioHealth} tone="text-blue-600" />
              <AIStat label="Savings Achieved" value={d.savingsAchieved} tone="text-emerald-600" />
              <AIStat label="Savings Forecast" value={d.savingsForecast} tone="text-blue-600" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <AISection icon="⚠️" label="Risks"><AIBulletList items={d.risks} /></AISection>
              <AISection icon="🏆" label="Success Stories"><AIBulletList items={d.successStories} /></AISection>
            </div>
            <AISection icon="📌" label="Open Actions"><AIBulletList items={d.openActions} /></AISection>
            <AISection icon="🧭" label="Executive Recommendations"><AIBulletList items={d.executiveRecommendations} /></AISection>
            <AISection icon="🗓️" label="Next Quarter Priorities"><AIBulletList items={d.nextQuarterPriorities} /></AISection>
          </div>
        )}
      />

      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => dl("TerraMind_Executive_Report.txt",
            ["TERRAMIND \u2014 AI EXECUTIVE SUMMARY REPORT", "=".repeat(60), "",
             "Annual savings target:  $36.5M", "Achieved realized (YTD): " + m$(achieved), "Annual forecast (live):  " + m$(forecast), "",
             "SAVED PROCESSES", "-".repeat(60),
             ...saved.map((s) => "  " + s.part + " | " + s.lever + " | " + s.owner + " | +" + m$(s.value)),
             "", "EXECUTIVE SUMMARY", "-".repeat(60),
             ...(report.data
               ? [report.data.transformationSummary, "", "Portfolio Health: " + report.data.portfolioHealth,
                  "", "Executive Recommendations:", ...(report.data.executiveRecommendations || []).map((r) => "  - " + r)]
               : summary.map((s, i) => "  " + (i + 1) + ". " + s)),
             "", "Booked autonomously by the agent: $0.00"].join("\n"))}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">
            {"\uD83D\uDCC4"} Download Executive Report
          </button>
          <button onClick={() => dl("TerraMind_Monthly_Review.csv",
            "Part,Domain,Strategy,Owner,Saving ($M),Saved At\n" +
            saved.map((s) => [s.part, s.domain, s.lever, s.owner, s.value.toFixed(2), s.when].join(",")).join("\n"))}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50">
            {"\uD83D\uDCCA"} Export Monthly Review
          </button>
        </div>
        <button onClick={() => go(1)} className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700">
          Start New Analysis &rarr; Loop Back to Agent 1
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════ APP SHELL ══════════════════════════════
function App() {
  const [step, setStep] = React.useState(1);
  const [part, setPart] = React.useState(null);
  const [lever, setLever] = React.useState(null);
  const [saved, setSaved] = React.useState([]);
  const [analyses, setAnalyses] = React.useState(loadAnalyses);
  const [msg, setMsg] = React.useState("");
  // Per-step human approval flags (Agent 2 = should-cost analysis, Agent 3 =
  // negotiation strategy). Gates both the in-page "Move to Agent N" buttons
  // and the sticky AgentNav shortcut — see setStepApproved() below.
  const [approvals, setApprovals] = React.useState({});
  const toast = (t) => { setMsg(t); setTimeout(() => setMsg(""), 3000); };
  function setStepApproved(step, value) {
    setApprovals((a) => ({ ...a, [step]: value }));
  }

  function recordAnalysis(record) {
    setAnalyses((prev) => saveAnalysis(record, prev));
  }
  function removeAnalysis(analysisId) {
    setAnalyses((prev) => deleteAnalysis(analysisId, prev));
  }
  function editAnalysis(analysisId, patch) {
    setAnalyses((prev) => updateAnalysis(analysisId, patch, prev));
  }
  const metrics = calculateDashboardMetrics(analyses);

  const achieved = metrics.savingsIdentified;
  const forecast = 36.5 + saved.reduce((s, x) => s + x.value, 0);

  function go(n) {
    if (n >= 2 && !part) { toast("Select a part in Agent 1 first."); return; }
    if (n >= 4 && !lever) { toast("Select a cost lever in Agent 3 first."); return; }
    setStep(n);
  }
  // Selecting a new part invalidates any prior should-cost/strategy approval
  // — those were granted for a different part's AI output, not this one.
  function pick(p) { setPart(p); setLever(null); setApprovals({}); }
  // Selects a part and jumps straight to Agent 2 in one action (used by the
  // Priority Focus List's "Open Analysis" button). Deliberately does not
  // route through go()/pick() separately: go()'s "part must already be
  // selected" guard closes over this render's `part`, which is still stale
  // at the moment of the click — calling setPart then go(2) in the same
  // handler would read the pre-update value and incorrectly block the jump.
  function openPartInAgent2(p) { setPart(p); setLever(null); setApprovals({}); setStep(2); }
  // Changing the selected lever invalidates the prior strategy approval —
  // that approval was for the old lever's AI negotiation output.
  function chooseLever(l) { setLever(l); setStepApproved(3, false); }
  function save() {
    const rec = { id: "s" + Date.now(), partId: part.id, part: part.name, domain: DOM[part.domain].label,
      lever: lever.name, owner: OWNERS[lever.key], when: "Today " + new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      value: +leverValue(part, lever).toFixed(2) };
    setSaved((S) => (S.some((x) => x.partId === rec.partId) ? S : [rec, ...S]));
    toast("Process saved. Annual forecast updated.");
  }
  const removeSaved = (id) => setSaved((S) => S.filter((x) => x.id !== id));

  const STEPS = [["Agent 1: Executive Intel", "Daily Priorities"], ["Agent 2: Cost Intel", "Should Cost & Drivers"],
    ["Agent 3: Decision Intel", "Lever Optimization"], ["Agent 4: Execution Intel", "Action Roadmap"],
    ["Agent 5: Transformation Monitor", "Track & Save Process"]];

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-700 antialiased">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl font-black text-white shadow-sm">T</div>
            <div><h1 className="text-[22px] font-bold text-slate-900">TerraMind</h1>
              <p className="text-sm text-slate-500">AI Cost Transformation Engine v3.4</p></div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[["Target Savings", "$36.5M", "text-blue-600", "border-slate-200"], ["Achieved YTD", m$(achieved), "text-emerald-600", "border-slate-200"],
              ["Forecast (Updated Live)", m$(forecast), "text-blue-600", "border-blue-200"], ["Status", forecast >= 36.5 ? "On Track" : "At Risk", "text-emerald-600", "border-slate-200"]].map(([l, v, c, b]) => (
              <div key={l} className={"rounded-xl border bg-white px-4 py-3 shadow-sm " + b}>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{l}</div>
                <div className={"text-3xl font-bold leading-tight " + c}>{v}</div>
              </div>
            ))}
            <DemoModeToggle />
          </div>
        </header>

        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white shadow-sm">{step}</span>
            <span>
              <span className="block text-base font-bold text-slate-900">{STEPS[step - 1][0]}</span>
              <span className="block text-sm text-slate-500">{STEPS[step - 1][1]}</span>
            </span>
          </div>
          <span className="text-sm font-semibold text-slate-500">Step {step} of 5</span>
        </nav>

        <AgentStatusTimeline step={step} />

        {step === 1 && <Agent1 selected={part} setSelected={pick} go={go} saved={saved} removeSaved={removeSaved} forecast={forecast}
          analyses={analyses} metrics={metrics} editAnalysis={editAnalysis} removeAnalysis={removeAnalysis} openPartInAgent2={openPartInAgent2} />}
        {step === 2 && part && <Agent2 part={part} go={go} approved={!!approvals[2]} setApproved={(v) => setStepApproved(2, v)} />}
        {step === 3 && part && <Agent3 part={part} lever={lever} setLever={chooseLever} go={go} recordAnalysis={recordAnalysis}
          approved={!!approvals[3]} setApproved={(v) => setStepApproved(3, v)} />}
        {step === 4 && part && lever && <Agent4 part={part} lever={lever} go={go} toast={toast} />}
        {step === 5 && part && lever && <Agent5 part={part} lever={lever} saved={saved} save={save} removeSaved={removeSaved}
          forecast={forecast} achieved={achieved} go={go} toast={toast} analyses={analyses} metrics={metrics} editAnalysis={editAnalysis} />}

        <AgentNav step={step} go={go} approvals={approvals} toast={toast} />

        {msg && (
          <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-white shadow-lg">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Root() {
  return (
    <DemoModeProvider>
      <App />
    </DemoModeProvider>
  );
}
