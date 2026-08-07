// Analysis History store. Every completed AI negotiation analysis (Agent 3)
// is recorded here — this is what makes the Agent 1 dashboard dynamic
// instead of hardcoded demo rows. Persisted to localStorage for now; if a
// backend persistence layer is added later, swap the implementation of
// loadAnalyses()/persistAnalyses() only — callers don't need to change.

const STORAGE_KEY = "terramind_analysis_history";

export function loadAnalyses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistAnalyses(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable (private mode, quota, etc) — history still
    // works for the current session via React state, just won't persist.
  }
  return list;
}

// Prepends a new analysis record and persists the result. Pass the caller's
// current in-memory list (e.g. React state) so this stays a pure append —
// it does not re-read storage itself, avoiding races with async state.
export function saveAnalysis(record, currentList = loadAnalyses()) {
  return persistAnalyses([record, ...currentList]);
}

// Removes a single record by id and persists the result.
export function deleteAnalysis(analysisId, currentList = loadAnalyses()) {
  return persistAnalyses(currentList.filter((a) => a.analysisId !== analysisId));
}

// Patches editable fields on a single record (part name, supplier, domain,
// expected savings, status) and persists the result. Does not touch
// AI-generated fields (confidenceScore, timestamp, analysisId, etc).
export function updateAnalysis(analysisId, patch, currentList = loadAnalyses()) {
  return persistAnalyses(currentList.map((a) => (a.analysisId === analysisId ? { ...a, ...patch } : a)));
}

export function calculateDashboardMetrics(analyses) {
  const totalAnalyses = analyses.length;
  const savingsIdentified = analyses.reduce((sum, a) => sum + (Number(a.expectedSavings) || 0), 0);
  const confidenceScores = analyses.map((a) => Number(a.confidenceScore)).filter((n) => Number.isFinite(n));
  const averageConfidence = confidenceScores.length
    ? Math.round(confidenceScores.reduce((sum, n) => sum + n, 0) / confidenceScores.length)
    : null;
  const activeRecommendations = totalAnalyses;

  return { totalAnalyses, savingsIdentified, averageConfidence, activeRecommendations };
}
