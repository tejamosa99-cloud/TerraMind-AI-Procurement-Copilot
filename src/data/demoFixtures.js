// Local fixtures used by Demo Mode so the app works fully offline during a
// presentation. Shapes mirror exactly what the /api/* endpoints return.

export const DEMO_MARKET_DATA = {
  steel: { symbol: "STEEL", name: "Steel / Alloy", unit: "USD/tonne", price: 742.5, change24hPct: 2.9, trend7d: [718, 724, 731, 726, 735, 739, 742.5], source: "demo", lastUpdated: "2026-08-06T06:00:00.000Z" },
  iron: { symbol: "IRON", name: "Iron Ore", unit: "USD/tonne", price: 108.2, change24hPct: 1.6, trend7d: [103, 104.5, 105, 106.8, 107, 107.6, 108.2], source: "demo", lastUpdated: "2026-08-06T06:00:00.000Z" },
  rubber: { symbol: "RUBBER", name: "Natural Rubber", unit: "USD/kg", price: 1.61, change24hPct: -3.8, trend7d: [1.72, 1.7, 1.68, 1.66, 1.64, 1.63, 1.61], source: "demo", lastUpdated: "2026-08-06T06:00:00.000Z" },
  aluminium: { symbol: "ALU", name: "Aluminium", unit: "USD/tonne", price: 2312, change24hPct: 0.4, trend7d: [2288, 2295, 2301, 2299, 2305, 2309, 2312], source: "demo", lastUpdated: "2026-08-06T06:00:00.000Z" },
  cached: false,
  providerLabel: "Demo Fixture (offline)",
};

export const DEMO_FIXTURES = {
  marketData: DEMO_MARKET_DATA,

  "daily-brief": {
    executiveSummary: "Portfolio savings are tracking 4% ahead of the $36.5M annual target, led by commercial negotiation wins in Proprietary Systems. Steel is up 2.9% in 24 hours, adding pressure to castings and forgings quotes due for renewal this month.",
    topOpportunity: "Front Axle Housing (Castings) — $1.04M identified savings via commercial negotiation, AI confidence 94%.",
    biggestRisk: "Transmission Case supplier quote updated +8% against a single-source supplier — concentration risk flagged.",
    commodityHighlights: ["Steel up 2.9% in 24h, up 3.4% over 7 days", "Rubber down 3.8% — favorable for tyre category renewals", "Iron ore up 1.6%, tracking steel"],
    supplierAlerts: ["ABC Foundry: quote variance +8% pending review", "Apollo Rubber: on-time delivery dipped to 84% last quarter"],
    savingsOpportunity: "$2.1M in near-term opportunities across 3 flagged parts this week.",
    recommendedAction: "Approve the Front Axle Housing negotiation brief today to lock in savings before the steel index resets next week.",
    strategicRecommendation: "Procurement should act today because the steel index is on an upward trend that resets supplier pricing next week — every day of delay narrows the negotiation window on castings and forgings. Commercial negotiation is the preferred sourcing strategy right now: it is low-effort, fastest to value, and the should-cost gap on the top 3 flagged parts is driven by supplier margin rather than raw material, which VAVE redesign cannot capture as quickly.",
    estimatedSavingsM: 2.1,
    riskLevel: "Medium",
    implementationPriority: "High",
    priorityFocusList: [
      {
        partName: "Front Axle Housing", priorityScore: 96,
        reason: "Largest identified savings opportunity in the portfolio with a well-benchmarked should-cost gap.",
        commodityInfluence: "Steel up 2.9% in 24h is tightening supplier margin, strengthening the negotiation case.",
        supplierImpact: "ABC Foundry quote variance is under review — leverage for a target-price reset.",
        potentialSavingsM: 1.04, recommendedAction: "Open commercial negotiation using the should-cost benchmark.", timeline: "2 Weeks",
      },
      {
        partName: "Transmission Case", priorityScore: 88,
        reason: "Single-source supplier just raised its quote 8% — concentration risk requires immediate attention.",
        commodityInfluence: "Steel and iron ore both trending up, compounding the quote increase.",
        supplierImpact: "Concentration risk flagged — no qualified alternate source yet.",
        potentialSavingsM: 0.61, recommendedAction: "Escalate the quote variance and evaluate dual-sourcing.", timeline: "1 Month",
      },
      {
        partName: "Hydraulic Lift Cover", priorityScore: 79,
        reason: "Engineering approval already received, clearing the path for a fast VAVE redesign.",
        commodityInfluence: "Rubber content is down 3.8%, modestly improving the redesign business case.",
        supplierImpact: "Stable supplier performance — low execution risk.",
        potentialSavingsM: 0.45, recommendedAction: "Queue for VAVE wall-thickness rollout next design freeze.", timeline: "5 Months",
      },
    ],
    confidenceScore: 91,
    confidenceReasoning: [
      "Supplier performance history for ABC Foundry over the last 4 quarters",
      "Commodity volatility on steel/iron feeds within normal seasonal range",
      "3 historical negotiations on this part family closed within target range",
      "Should-cost model benchmark coverage at 96% for this domain",
    ],
  },

  "cost-explanation": {
    materialDrivers: ["Raw material (cast iron + alloy additions) accounts for ~46% of unit cost", "Steel index is up 3.4% over 7 days, tightening supplier margins further"],
    manufacturingDrivers: ["Machining cycle time is 18% above benchmark for comparable castings", "Tooling amortization still active for 6 more months"],
    supplierPricingBehaviour: ["Supplier has held price flat for 3 quarters then moved all at once — batching behavior", "Quote includes an unexplained 4% contingency line"],
    commodityImpact: ["Every 1% move in steel index shifts landed cost by ~$1.80/unit", "Rubber content is negligible for this part family"],
    engineeringIdeas: ["Wall-thickness reduction already validated — extend to this variant", "Consolidate two brackets into a single casting to cut one operation"],
    commercialIdeas: ["Bundle volume across sister plants for a rebate tier", "Introduce a 12-month index-linked price formula to remove renegotiation friction"],
    recommendation: "Pursue commercial negotiation first (fast, low engineering risk), then queue VAVE wall-thickness rollout for the next design freeze window.",
    confidenceScore: 88,
    confidenceReasoning: ["Should-cost model benchmark coverage 96%", "3 comparable supplier quotes on file", "Commodity feed refreshed within the hour"],
  },

  negotiation: {
    executiveSummary: "Supplier quote is 14% above the AI should-cost benchmark. A commercial negotiation targeting the should-cost price is achievable within 2 weeks given supplier concession history and no near-term capacity constraints.",
    negotiationObjective: "Reduce unit price from $248 to the should-cost benchmark of $214 without disrupting Q3 delivery schedule.",
    targetPrice: 214,
    walkAwayPrice: 229,
    batna: "Qualified second-source (Precision Metalworks) can absorb 30% of volume within 3 months if incumbent will not move.",
    supplierBehaviourAnalysis: "Incumbent has historically conceded on price after a volume commitment is offered, but resists on lead time. Financial health is rated A- with capacity headroom.",
    likelyObjections: ["Steel index has risen, so we cannot reduce price right now.", "Our tooling and quality investment justifies the premium.", "We cannot commit without a multi-year volume guarantee."],
    suggestedResponses: ["Show the should-cost model isolates commodity pass-through separately from margin — index moves don't justify this gap.", "Acknowledge investment but request itemized cost breakdown to validate the premium against benchmark.", "Offer a 12-month volume commitment in exchange for meeting target price, with an index-linked formula for future commodity moves."],
    negotiationStrategy: "Open with the should-cost benchmark and index-linked pricing proposal; anchor on target price, use BATNA as leverage only if supplier stalls past week 1.",
    expectedSavings: "$1.04M annually at target price, $0.65M annually at walk-away price.",
    businessRisks: ["Second-source qualification adds 3 months if BATNA is triggered", "Relationship strain if negotiation is perceived as adversarial"],
    fallbackStrategy: "Phase in a 50/50 dual-source split over 2 quarters while incumbent price is renegotiated on the next cycle.",
    confidenceScore: 94,
    confidenceReasoning: ["4 prior negotiations on this supplier averaged 7% reduction", "Should-cost model benchmark coverage 96%", "Supplier financial health rated A- with headroom", "Commodity feed shows steel move is within normal pass-through range"],
  },

  "executive-email": {
    subject: "Approval Requested: Front Axle Housing Cost Reduction — $1.04M Annual Savings",
    executiveSummary: "Requesting approval to proceed with a commercial negotiation on the Front Axle Housing, targeting the AI should-cost benchmark and $1.04M in annual savings.",
    businessContext: "Current supplier quote sits 14% above the should-cost benchmark. Steel index volatility makes near-term action time-sensitive.",
    decisionTaken: "Proceed with commercial negotiation, opening at the should-cost target price with an index-linked pricing proposal.",
    expectedSavings: "$1.04M annually ($0.65M at walk-away price).",
    timeline: "2 weeks — Week 1 commercial notice and benchmark brief, Week 2 formal alignment and agreement.",
    requiredApprovals: ["Procurement Director sign-off on target price", "Engineering sign-off on no-spec-change confirmation"],
    nextSteps: ["Issue commercial notice this week", "Schedule supplier alignment meeting", "Prepare index-linked pricing addendum"],
    riskStatement: "If negotiation stalls beyond week 2, a qualified second source can absorb 30% of volume within 3 months as a fallback.",
    actionItems: ["Procurement Lead to issue notice by Friday", "Engineering to confirm no spec changes required", "Finance to validate savings booking method"],
  },

  "transformation-report": {
    transformationSummary: "Cost transformation program is tracking ahead of the $36.5M target, with $21.8M realized YTD and a live forecast of $38.9M. Commercial negotiation remains the highest-velocity lever this quarter.",
    portfolioHealth: "Healthy — 3 of 6 case domains have active saved processes, funnel conversion from idea to implementation holds at ~44%.",
    savingsAchieved: "$21.8M realized YTD against a $36.5M board-approved target.",
    savingsForecast: "$38.9M forecast for the fiscal year, 107% of target.",
    risks: ["Steel index volatility could compress VAVE savings assumptions", "Two initiatives are behind schedule on engineering qualification"],
    successStories: ["Transmission Case commercial negotiation closed 8% ahead of target", "Hydraulic Lift Cover VAVE redesign passed qualification with zero rework"],
    openActions: ["Finalize Steering Knuckle supplier resourcing decision", "Re-baseline Q4 VAVE pipeline against updated commodity forecast"],
    executiveRecommendations: ["Accelerate commercial negotiation lever across the remaining tail-spend domains", "Lock index-linked pricing formulas on the top 10 spend parts to reduce renegotiation cycles"],
    nextQuarterPriorities: ["Scale dual-sourcing pilot to 2 additional domains", "Launch VAVE pipeline for Gears & Shafts domain"],
    confidenceScore: 90,
    confidenceReasoning: ["Forecast built from saved, approved processes only", "3 consecutive quarters of funnel conversion data", "Commodity feed refreshed within the hour"],
  },
};
