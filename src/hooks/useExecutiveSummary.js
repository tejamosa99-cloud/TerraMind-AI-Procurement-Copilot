import { useAI } from "./useAI";

// Agent 1-specific composition over useAI: knows the daily-brief endpoint
// shape so the component only has to hand over domain state.
export function useExecutiveSummary() {
  const ai = useAI("daily-brief");

  function generate({ domain, selectedPart, supplierRisk, savedProcesses, currentSavingsM, forecastSavingsM, activeRecommendations, portfolioCandidates }) {
    return ai.generate({
      selectedDomain: domain,
      selectedPart,
      supplierRisk,
      savedProcesses,
      currentSavingsM,
      forecastSavingsM,
      activeRecommendations,
      portfolioCandidates,
    });
  }

  return { ...ai, generate };
}
