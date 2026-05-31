import express from "express";
import auth, { optionalAuth } from "../middlewares/auth.js";
import {
  createCheckoutSession,
  createPaymentIntent,
  getCheckoutStatus,
  getSavedPaymentMethods,
  getStripeAccountInfo,
  stripeHealth,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-payment-intent", auth, createPaymentIntent);
router.get("/saved-payment-methods", auth, getSavedPaymentMethods);
router.post("/create-checkout-session", createCheckoutSession);
router.get("/checkout-status/:sessionId", getCheckoutStatus);
router.get("/health", stripeHealth);
router.get("/account-info", getStripeAccountInfo);

export default router;


