import express from "express";
const router = express.Router();
import * as tabbyController from "../controller/tabbyController.js";

// Check eligibility
router.post("/eligibility", tabbyController.checkEligibility);

// Create Tabby session
router.post("/create-session", tabbyController.createTabbySession);

// Webhook endpoint
router.post("/webhook", tabbyController.handleWebhook);

// Verify payment
router.post("/verify", tabbyController.verifyPayment);

export default router;

