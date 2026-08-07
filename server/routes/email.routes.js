import { Router } from "express";
import { sendEmail, emailHealth } from "../controllers/email.controller.js";

const router = Router();
router.post("/send-email", sendEmail);
router.get("/email-health", emailHealth);
export default router;
