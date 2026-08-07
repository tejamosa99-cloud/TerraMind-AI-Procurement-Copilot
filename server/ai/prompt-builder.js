function block(label, data) {
  return `--- ${label} ---\n${JSON.stringify(data, null, 2)}`;
}

function enterpriseContext({ erp, plm, supplierMaster, commodityFeed, costLibrary, historicalNegotiations, portfolioCandidates }) {
  return [
    erp && block("ERP EXTRACT", erp), plm && block("PLM EXTRACT", plm), supplierMaster && block("SUPPLIER MASTER", supplierMaster),
    commodityFeed && block("LIVE COMMODITY FEED", commodityFeed), costLibrary && block("COST LIBRARY / SHOULD-COST MODEL", costLibrary),
    historicalNegotiations && block("HISTORICAL NEGOTIATIONS", historicalNegotiations),
    portfolioCandidates && block("PORTFOLIO CANDIDATES", portfolioCandidates),
  ].filter(Boolean).join("\n\n");
}

const JSON_ONLY = "Return ONLY minified valid JSON. No markdown fences, no commentary, no trailing text.";

export function buildDailyBriefPrompt(ctx) {
  return `You are TerraMind AI, an enterprise procurement intelligence copilot briefing a Chief Procurement Officer each morning, in the style of a McKinsey/BCG/Accenture engagement lead.

Using the enterprise data below, produce a JSON object with EXACTLY these keys:
{
  "executiveSummary": string, "topOpportunity": string, "biggestRisk": string, "commodityHighlights": string[3], "supplierAlerts": string[2-3], "savingsOpportunity": string, "recommendedAction": string,
  "strategicRecommendation": string, "estimatedSavingsM": number, "riskLevel": "Low"|"Medium"|"High"|"Critical", "implementationPriority": "Low"|"Medium"|"High"|"Critical",
  "priorityFocusList": [{ "partName": string, "priorityScore": number (0-100), "reason": string, "commodityInfluence": string, "supplierImpact": string, "potentialSavingsM": number, "recommendedAction": string, "timeline": string }],
  "confidenceScore": number (0-100), "confidenceReasoning": string[3-5]
}
executiveSummary must read as one cohesive brief covering market summary, commodity movement, supplier risks and procurement highlights.
strategicRecommendation must explain, in 2-4 sentences, why procurement should act today and which sourcing strategy (commercial negotiation, VAVE engineering redesign, supplier resourcing/change, or freight & logistics optimization) is preferred right now, grounded in the data below.
estimatedSavingsM is the total $M business impact of acting on this brief; riskLevel and implementationPriority summarize that impact.
priorityFocusList must contain 3 to 5 items, ranked highest priority first, selected ONLY from the PORTFOLIO CANDIDATES listed below (use each part's exact partName) — do not invent parts that are not in that list. Rank using commodity market trends, supplier risk, expected savings, portfolio importance, cost reduction opportunity and the current sourcing strategy.
confidenceReasoning must cite concrete signals from the data below.

${JSON_ONLY}

${enterpriseContext(ctx)}`;
}

export function buildCostExplanationPrompt(ctx) {
  return `You are TerraMind AI, a should-cost engineering consultant writing a client-ready cost driver report.

Using the enterprise data below, produce a JSON object with EXACTLY these keys:
{
  "materialDrivers": string[2-4], "manufacturingDrivers": string[2-4], "supplierPricingBehaviour": string[2-3], "commodityImpact": string[2-3], "engineeringIdeas": string[2-4], "commercialIdeas": string[2-4], "recommendation": string, "confidenceScore": number (0-100), "confidenceReasoning": string[3-5]
}
Write like a consultant's report, not generic AI text — specific, quantified where possible, and grounded in the data below.

${JSON_ONLY}

${enterpriseContext(ctx)}`;
}

export function buildNegotiationPrompt(ctx) {
  return `You are TerraMind AI, the flagship negotiation copilot for a procurement organization, briefing a category manager ahead of a supplier negotiation.

Using the enterprise data below, produce a JSON object with EXACTLY these keys:
{
  "executiveSummary": string, "negotiationObjective": string, "targetPrice": number, "walkAwayPrice": number, "batna": string, "supplierBehaviourAnalysis": string, "likelyObjections": string[3-4], "suggestedResponses": string[3-4], "negotiationStrategy": string, "expectedSavings": string, "businessRisks": string[2-4], "fallbackStrategy": string, "confidenceScore": number (0-100), "confidenceReasoning": string[3-5]
}
likelyObjections[i] and suggestedResponses[i] must correspond 1:1 in order. Ground BATNA and target/walk-away prices in the should-cost and historical negotiation data below.

${JSON_ONLY}

${enterpriseContext(ctx)}`;
}

export function buildExecutiveEmailPrompt(ctx) {
  return `You are TerraMind AI, drafting an executive email on behalf of a procurement lead to an Engineering Head / approver.

Using the enterprise data below, produce a JSON object with EXACTLY these keys:
{
  "subject": string, "executiveSummary": string, "businessContext": string, "decisionTaken": string, "expectedSavings": string, "timeline": string, "requiredApprovals": string[1-3], "nextSteps": string[2-4], "riskStatement": string, "actionItems": string[2-4]
}
Tone: executive, concise, professional.

${JSON_ONLY}

${enterpriseContext(ctx)}`;
}

export function buildTransformationReportPrompt(ctx) {
  return `You are TerraMind AI, a cost transformation program director reporting to the executive board.

Using the enterprise data below, produce a JSON object with EXACTLY these keys:
{
  "transformationSummary": string, "portfolioHealth": string, "savingsAchieved": string, "savingsForecast": string, "risks": string[2-4], "successStories": string[2-3], "openActions": string[2-4], "executiveRecommendations": string[2-4], "nextQuarterPriorities": string[2-4], "confidenceScore": number (0-100), "confidenceReasoning": string[3-5]
}
Write in export-ready board-report language.

${JSON_ONLY}

${enterpriseContext(ctx)}`;
}
