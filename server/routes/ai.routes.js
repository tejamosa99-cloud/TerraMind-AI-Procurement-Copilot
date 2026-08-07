import { Router } from "express";
import { costExplanation, dailyBrief, executiveEmail, negotiation, transformationReport } from "../controllers/ai.controller.js";
import { validateRequest } from "../middleware/validate-request.js";

const router = Router();

router.post("/daily-brief", validateRequest({ selectedDomain: "string", selectedPart: "string", supplierRisk: "string", savedProcesses: "array", currentSavingsM: "number", forecastSavingsM: "number", activeRecommendations: "array" }), dailyBrief);
router.post("/cost-explanation", validateRequest({ partName: "string", domain: "string", supplier: "string", currentPrice: "number", shouldCost: "number", gapPct: "number", annualSpendM: "number" }), costExplanation);
router.post("/negotiation", validateRequest({ partName: "string", currentCost: "number", shouldCost: "number", supplier: "string", annualSpendM: "number", selectedLever: "string", domainRisk: "string", gapPct: "number" }), negotiation);
router.post("/executive-email", validateRequest({ partName: "string", domain: "string", approvedStrategy: "string", owner: "string", expectedSavingsM: "number", timeline: "string", actionRequired: "string", nextMilestone: "string" }), executiveEmail);
router.post("/transformation-report", validateRequest({ latestPart: "string", latestStrategy: "string", annualSavingsTargetM: "number", achievedSavingsYtdM: "number", forecastSavingsM: "number", transformationFunnel: "array", initiativeExecution: "array", savedProcesses: "array" }), transformationReport);

export default router;
