import { AI_ENDPOINTS } from "../constants/ai-endpoints.js";
import { generateStructured } from "../services/gemini.service.js";
import { getMarketData } from "../services/market-data.service.js";
import { costLibraryRecord, erpRecord, historicalNegotiationsRecord, plmRecord, supplierMasterRecord } from "../services/enterprise-data.service.js";
import { buildCostExplanationPrompt, buildDailyBriefPrompt, buildExecutiveEmailPrompt, buildNegotiationPrompt, buildTransformationReportPrompt } from "../ai/prompt-builder.js";
import { TtlCache } from "../utils/cache.js";
import { env } from "../config/env.js";

const responseCache = new TtlCache({ ttlMs: env.aiCacheTtlMs, maxEntries: env.aiCacheMaxEntries });

function cacheKey(endpoint, payload) {
  return `${endpoint}:${JSON.stringify(payload)}`;
}

async function generate(endpoint, payload, prompt) {
  const key = cacheKey(endpoint, payload);
  const cached = responseCache.get(key);
  if (cached) return { ...cached, cached: true };
  const data = await generateStructured({ endpoint, prompt });
  responseCache.set(key, data);
  return { ...data, cached: false };
}

export async function dailyBrief(req, res, next) {
  try {
    const body = req.body;
    const market = await getMarketData();
    const prompt = buildDailyBriefPrompt({
      erp: erpRecord({ selectedDomain: body.selectedDomain, selectedPart: body.selectedPart, savedProcesses: body.savedProcesses, currentSavingsM: body.currentSavingsM, forecastSavingsM: body.forecastSavingsM }),
      supplierMaster: { domainRisk: body.supplierRisk, activeRecommendations: body.activeRecommendations }, commodityFeed: market,
      portfolioCandidates: body.portfolioCandidates,
    });
    res.json(await generate(AI_ENDPOINTS.DAILY_BRIEF, body, prompt));
  } catch (error) { next(error); }
}

export async function costExplanation(req, res, next) {
  try {
    const body = req.body;
    const market = await getMarketData();
    const prompt = buildCostExplanationPrompt({
      erp: erpRecord({ partName: body.partName, annualSpendM: body.annualSpendM }), plm: plmRecord(body.partName, body.domain),
      supplierMaster: supplierMasterRecord(body.supplier), commodityFeed: market,
      costLibrary: costLibraryRecord({ shouldCost: body.shouldCost, currentPrice: body.currentPrice, gapPct: body.gapPct }),
    });
    res.json(await generate(AI_ENDPOINTS.COST_EXPLANATION, body, prompt));
  } catch (error) { next(error); }
}

export async function negotiation(req, res, next) {
  try {
    const body = req.body;
    const market = await getMarketData();
    const prompt = buildNegotiationPrompt({
      erp: erpRecord({ partName: body.partName, annualSpendM: body.annualSpendM, selectedLever: body.selectedLever }),
      supplierMaster: supplierMasterRecord(body.supplier), commodityFeed: market,
      costLibrary: costLibraryRecord({ shouldCost: body.shouldCost, currentPrice: body.currentCost, gapPct: body.gapPct }),
      historicalNegotiations: historicalNegotiationsRecord(body.partName, body.domainRisk),
    });
    res.json(await generate(AI_ENDPOINTS.NEGOTIATION, body, prompt));
  } catch (error) { next(error); }
}

export async function executiveEmail(req, res, next) {
  try {
    const body = req.body;
    const prompt = buildExecutiveEmailPrompt({
      erp: erpRecord({ partName: body.partName, domain: body.domain, approvedStrategy: body.approvedStrategy, owner: body.owner, expectedSavingsM: body.expectedSavingsM, timeline: body.timeline, actionRequired: body.actionRequired, nextMilestone: body.nextMilestone }),
    });
    res.json(await generate(AI_ENDPOINTS.EXECUTIVE_EMAIL, body, prompt));
  } catch (error) { next(error); }
}

export async function transformationReport(req, res, next) {
  try {
    const body = req.body;
    const prompt = buildTransformationReportPrompt({
      erp: erpRecord({ latestPart: body.latestPart, latestStrategy: body.latestStrategy, annualSavingsTargetM: body.annualSavingsTargetM, achievedSavingsYtdM: body.achievedSavingsYtdM, forecastSavingsM: body.forecastSavingsM }),
      costLibrary: { transformationFunnel: body.transformationFunnel, initiativeExecution: body.initiativeExecution },
      historicalNegotiations: { savedProcesses: body.savedProcesses },
    });
    res.json(await generate(AI_ENDPOINTS.TRANSFORMATION_REPORT, body, prompt));
  } catch (error) { next(error); }
}
