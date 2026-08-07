// Temporary deterministic adapters. Their API mirrors the future ERP, PLM,
// supplier master and cost-library integrations so controllers remain stable.
function seedOf(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  return hash;
}

export function supplierMasterRecord(supplier) {
  const seed = seedOf(supplier || "unknown");
  return {
    supplierName: supplier,
    onTimeDeliveryPct: 84 + (seed % 14),
    qualityPpm: 60 + (seed % 200),
    financialHealthRating: ["A", "A-", "B+", "B"][seed % 4],
    activeContracts: 2 + (seed % 5),
    lastAuditDate: `2026-0${1 + (seed % 6)}-15`,
  };
}

export function historicalNegotiationsRecord(partName, domain) {
  const seed = seedOf(`${partName || ""}${domain || ""}`);
  return {
    priorNegotiationRounds: 1 + (seed % 4),
    averageHistoricalReductionPct: 4 + (seed % 9),
    lastNegotiationOutcome: seed % 3 === 0 ? "Target price achieved" : seed % 3 === 1 ? "Partial concession, walk-away avoided" : "Deferred to next quarter",
    supplierConcessionPattern: seed % 2 === 0 ? "Concedes on price after volume commitment" : "Concedes on lead time before price",
  };
}

export function costLibraryRecord({ shouldCost, currentPrice, gapPct }) {
  return {
    shouldCostModelVersion: "SCM-4.2",
    benchmarkSource: "TerraMind Cost Library (raw material + process benchmarks)",
    shouldCost,
    currentQuote: currentPrice,
    unjustifiedGapPct: gapPct,
  };
}

export function plmRecord(partName, domain) {
  const seed = seedOf(`${partName || ""}plm`);
  return {
    partName,
    domain,
    engineeringChangeRequestsOpen: seed % 3,
    designMaturity: seed % 2 === 0 ? "Production release" : "Engineering change in review",
  };
}

export function erpRecord(payload) {
  return { plant: "Plant 4 — Tractor Assembly", fiscalYear: "FY26", ...payload };
}
