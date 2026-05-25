import express from "express";
import {
  createCheckoutSession,
  createPaymentIntent,
  getCheckoutStatus,
  getStripeAccountInfo,
  stripeHealth,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-payment-intent", createPaymentIntent);
router.post("/create-checkout-session", createCheckoutSession);
router.get("/checkout-status/:sessionId", getCheckoutStatus);
router.get("/health", stripeHealth);
router.get("/account-info", getStripeAccountInfo);

export default router;


