import { AI_ENDPOINTS } from "../constants/ai-endpoints.js";
import { AppError } from "../utils/app-error.js";

// Critical fields carry the response's actual content — if Gemini omits or
// mistypes one of these, the response is genuinely unusable and we reject it.
const CRITICAL_SCHEMAS = {
  [AI_ENDPOINTS.DAILY_BRIEF]: {
    executiveSummary: "string",
    topOpportunity: "string",
    biggestRisk: "string",
    savingsOpportunity: "string",
    recommendedAction: "string",
  },
  [AI_ENDPOINTS.COST_EXPLANATION]: {
    recommendation: "string",
  },
  [AI_ENDPOINTS.NEGOTIATION]: {
    executiveSummary: "string",
    negotiationObjective: "string",
    targetPrice: "number",
    walkAwayPrice: "number",
    batna: "string",
    supplierBehaviourAnalysis: "string",
    negotiationStrategy: "string",
    expectedSavings: "string",
    fallbackStrategy: "string",
  },
  [AI_ENDPOINTS.EXECUTIVE_EMAIL]: {
    subject: "string",
    executiveSummary: "string",
    businessContext: "string",
    decisionTaken: "string",
    expectedSavings: "string",
    timeline: "string",
    riskStatement: "string",
  },
  [AI_ENDPOINTS.TRANSFORMATION_REPORT]: {
    transformationSummary: "string",
    portfolioHealth: "string",
    savingsAchieved: "string",
    savingsForecast: "string",
  },
};

// Soft fields (bullet lists + confidence metadata) are normalized instead of
// enforced. Gemini routinely varies their shape — a paragraph instead of a
// list, a numeric string, or the field missing entirely — and none of that
// should sink an otherwise-good response. They're still always present in
// the returned object, in a stable shape, so the API contract doesn't change.
const SOFT_ARRAY_FIELDS = {
  [AI_ENDPOINTS.DAILY_BRIEF]: ["commodityHighlights", "supplierAlerts", "confidenceReasoning"],
  [AI_ENDPOINTS.COST_EXPLANATION]: [
    "materialDrivers", "manufacturingDrivers", "supplierPricingBehaviour",
    "commodityImpact", "engineeringIdeas", "commercialIdeas", "confidenceReasoning",
  ],
  [AI_ENDPOINTS.NEGOTIATION]: ["likelyObjections", "suggestedResponses", "businessRisks", "confidenceReasoning"],
  [AI_ENDPOINTS.EXECUTIVE_EMAIL]: ["requiredApprovals", "nextSteps", "actionItems"],
  [AI_ENDPOINTS.TRANSFORMATION_REPORT]: [
    "risks", "successStories", "openActions", "executiveRecommendations", "nextQuarterPriorities", "confidenceReasoning",
  ],
};

const SOFT_NUMBER_FIELDS = {
  [AI_ENDPOINTS.DAILY_BRIEF]: ["confidenceScore"],
  [AI_ENDPOINTS.COST_EXPLANATION]: ["confidenceScore"],
  [AI_ENDPOINTS.NEGOTIATION]: ["confidenceScore"],
  [AI_ENDPOINTS.EXECUTIVE_EMAIL]: [],
  [AI_ENDPOINTS.TRANSFORMATION_REPORT]: ["confidenceScore"],
};

const REASONING_FALLBACK = "Confidence reasoning unavailable.";
const IMPACT_LEVELS = ["Low", "Medium", "High", "Critical"];

// Normalizes a free-form level string ("high", "HIGH RISK", ...) onto the
// fixed Low/Medium/High/Critical scale the UI renders as a badge. Unknown or
// missing input defaults to "Medium" rather than failing the response.
function normalizeImpactLevel(value) {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  const match = IMPACT_LEVELS.find((level) => v.startsWith(level.toLowerCase()));
  return match || "Medium";
}

function normalizeSavingsM(value) {
  const num = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : value;
  return typeof num === "number" && Number.isFinite(num) ? Math.round(num * 100) / 100 : null;
}

// The Priority Focus List is a soft, best-effort field — Gemini's shape here
// varies more than a plain string array, so each item is normalized
// individually and junk/empty items are dropped rather than rejecting the
// whole daily brief over one malformed list entry.
function normalizePriorityFocusList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .slice(0, 5)
    .map((item) => ({
      partName: typeof item.partName === "string" ? item.partName.trim() : "",
      priorityScore: normalizeConfidenceScore(item.priorityScore) ?? 0,
      reason: typeof item.reason === "string" ? item.reason.trim() : "",
      commodityInfluence: typeof item.commodityInfluence === "string" ? item.commodityInfluence.trim() : "",
      supplierImpact: typeof item.supplierImpact === "string" ? item.supplierImpact.trim() : "",
      potentialSavingsM: normalizeSavingsM(item.potentialSavingsM) ?? 0,
      recommendedAction: typeof item.recommendedAction === "string" ? item.recommendedAction.trim() : "",
      timeline: typeof item.timeline === "string" ? item.timeline.trim() : "",
    }))
    .filter((item) => item.partName && (item.reason || item.recommendedAction));
}

function parseJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start < 0 || end < start) throw new AppError("AI returned invalid JSON.", { code: "AI_INVALID_RESPONSE", status: 502 });
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      throw new AppError("AI returned invalid JSON.", { code: "AI_INVALID_RESPONSE", status: 502 });
    }
  }
}

// Accepts an array of strings, a single string, or nothing — always returns
// an array of non-empty strings so callers (and the frontend) never have to
// branch on shape. `fallbackText`, if given, fills an empty result.
function normalizeStringArray(value, fallbackText) {
  let items;
  if (Array.isArray(value)) {
    items = value.filter((item) => typeof item === "string" && item.trim() !== "").map((item) => item.trim());
  } else if (typeof value === "string" && value.trim() !== "") {
    items = [value.trim()];
  } else {
    items = [];
  }
  if (items.length === 0 && fallbackText) items = [fallbackText];
  return items;
}

// Accepts a real number or a numeric-looking string ("88", "88%"); anything
// else normalizes to null, which the frontend already treats as "no score".
function normalizeConfidenceScore(value) {
  const num = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : value;
  if (typeof num !== "number" || !Number.isFinite(num)) return null;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function validateAiResponse(endpoint, text) {
  const data = parseJson(text);
  const criticalSchema = CRITICAL_SCHEMAS[endpoint];
  if (!criticalSchema || !data || Array.isArray(data) || typeof data !== "object") {
    throw new AppError("AI response has an unsupported shape.", { code: "AI_INVALID_RESPONSE", status: 502 });
  }

  for (const [field, expectedType] of Object.entries(criticalSchema)) {
    const value = data[field];
    const valid = typeof value === expectedType && !(expectedType === "number" && Number.isNaN(value));
    if (!valid) {
      throw new AppError(`AI response is missing a valid ${field} field.`, { code: "AI_INVALID_RESPONSE", status: 502 });
    }
  }

  const normalized = { ...data };
  for (const field of SOFT_ARRAY_FIELDS[endpoint] || []) {
    normalized[field] = normalizeStringArray(data[field], field === "confidenceReasoning" ? REASONING_FALLBACK : undefined);
  }
  for (const field of SOFT_NUMBER_FIELDS[endpoint] || []) {
    normalized[field] = normalizeConfidenceScore(data[field]);
  }

  // Daily Brief's Section 2-4 fields (strategic recommendation, business
  // impact, priority focus list) are additive and best-effort: a missing or
  // malformed field here degrades gracefully instead of failing the brief.
  if (endpoint === AI_ENDPOINTS.DAILY_BRIEF) {
    normalized.strategicRecommendation =
      typeof data.strategicRecommendation === "string" && data.strategicRecommendation.trim()
        ? data.strategicRecommendation.trim()
        : normalized.recommendedAction;
    normalized.estimatedSavingsM = normalizeSavingsM(data.estimatedSavingsM);
    normalized.riskLevel = normalizeImpactLevel(data.riskLevel);
    normalized.implementationPriority = normalizeImpactLevel(data.implementationPriority);
    normalized.priorityFocusList = normalizePriorityFocusList(data.priorityFocusList);
  }

  return normalized;
}
