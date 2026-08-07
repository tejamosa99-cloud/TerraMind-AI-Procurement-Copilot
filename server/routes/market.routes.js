import { Router } from "express";
import { health, marketData } from "../controllers/market.controller.js";

const router = Router();
router.get("/health", health);
router.get("/market-data", marketData);
export default router;
