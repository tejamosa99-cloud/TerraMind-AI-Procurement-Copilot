import { Router } from "express";
import aiRoutes from "./ai.routes.js";
import marketRoutes from "./market.routes.js";
import emailRoutes from "./email.routes.js";

const router = Router();
router.use(aiRoutes);
router.use(marketRoutes);
router.use(emailRoutes);
export default router;
