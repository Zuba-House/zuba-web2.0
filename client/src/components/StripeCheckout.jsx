// client/src/components/StripeCheckout.jsx
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { postData } from "../utils/api";
import { unwrapApiResponse } from "../utils/unwrapApiResponse";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function isValidClientSecret(value) {
  return typeof value === "string" && value.includes("_secret_");
}

function readClientSecretFromPayload(payload) {
  if (!payload || typeof payload !== "object") return "";
  const unwrapped = unwrapApiResponse(payload);
  return (
    unwrapped?.clientSecret ||
    unwrapped?.client_secret ||
    payload?.data?.clientSecret ||
    payload?.data?.client_secret ||
    payload?.clientSecret ||
    payload?.client_secret ||
    ""
  );
}

function extractClientSecret(payload) {
  return readClientSecretFromPayload(payload);
}


function StripeForm({ amount, onPaid, onFailed, onProcessingChange, onReady }) {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState("");
  const [intentReady, setIntentReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [intentError, setIntentError] = useState("");

  useEffect(() => {
    if (!amount || amount <= 0) {
      console.warn("Invalid amount for payment intent:", amount);
      setClientSecret("");
      setIntentReady(false);
      return;
    }

    let cancelled = false;
    setIntentError("");
    setIntentReady(false);
    setClientSecret("");
    console.log("Creating payment intent for amount:", amount);

    (async () => {
      try {
        const payload = await postData("/api/stripe/create-payment-intent", { amount });
        if (cancelled) return;

        if (payload?.error || payload?.success === false) {
          setClientSecret("");
          setIntentReady(false);
          setIntentError(payload?.message || "Payment could not be initialized. Please refresh and try again.");
          return;
        }

        const secret = extractClientSecret(payload);
        if (!isValidClientSecret(secret)) {
          setClientSecret("");
          setIntentReady(false);
          setIntentError("Payment could not be initialized. Please refresh and try again.");
          return;
        }

        console.log("Payment intent created:", secret.slice(0, 20) + "...");
        setClientSecret(secret);
        setIntentReady(true);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to create payment intent:", err?.message || err);
        setClientSecret("");
        setIntentReady(false);
        setIntentError(err?.message || "Failed to initialize payment.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [amount]);

  // Notify parent when clientSecret is received (Stripe element should be ready soon)
  useEffect(() => {
    if (clientSecret && intentReady) {
      setTimeout(() => {
        if (typeof onReady === "function") onReady();
      }, 100);
    }
  }, [clientSecret, intentReady, onReady]);

  // When clientSecret and elements are ready, try to focus the CardElement to make it visible on small screens
  useEffect(() => {
    if (!clientSecret) return;
    if (!elements) return;
    const cardEl = elements.getElement(CardElement);
    if (cardEl && typeof cardEl.focus === "function") {
      setTimeout(() => {
        try {
          cardEl.focus();
        } catch {
          // ignore focus failures
        }
      }, 150);
    }
  }, [clientSecret, elements]);

  useEffect(() => {
    onProcessingChange?.(processing);
  }, [processing, onProcessingChange]);

  const ensureSecret = async () => {
    if (isValidClientSecret(clientSecret)) {
      return clientSecret;
    }
    setCreatingIntent(true);
    try {
      console.log("Creating payment intent for amount:", amount);
      const payload = await postData("/api/stripe/create-payment-intent", { amount });

      if (payload?.error || payload?.success === false) {
        throw new Error(payload?.message || "Payment could not be initialized. Please try again.");
      }

      const secret = extractClientSecret(payload);
      if (!isValidClientSecret(secret)) {
        throw new Error("Payment could not be initialized. Please try again.");
      }

      setClientSecret(secret);
      setIntentReady(true);
      console.log("Payment intent created");
      return secret;
    } finally {
      setCreatingIntent(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (processing || creatingIntent) {
      console.log("Payment already processing, please wait...");
      return;
    }

    if (!stripe || !elements) {
      console.error("Stripe not initialized");
      return;
    }

    setProcessing(true);

    let secret = clientSecret;
    try {
      if (!isValidClientSecret(secret)) {
        secret = await ensureSecret();
      }
      if (!isValidClientSecret(secret)) {
        throw new Error("Payment could not be initialized. Please try again.");
      }
    } catch (err) {
      console.error("Failed to create payment intent on submit:", err?.message || err);
      setProcessing(false);
      setIntentError(err?.message || "Failed to initialize payment.");

      const msg = err?.message || "";
      if (msg.includes("STRIPE") || msg.toLowerCase().includes("stripe")) {
        alert("Payment processing is currently unavailable. Please contact support or try again later.");
      } else if (msg) {
        alert(`Payment error: ${msg}`);
      } else {
        alert("Failed to initialize payment. Please try again or contact support.");
      }

      if (onFailed) {
        try {
          await onFailed(err);
        } catch (callbackError) {
          console.error("Error in onFailed callback:", callbackError);
        }
      }

      setTimeout(() => {
        window.location.href = "/order/failed";
      }, 500);
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      console.error("Card element not found");
      setProcessing(false);
      alert("Card form not ready. Please try again.");
      return;
    }

    if (!isValidClientSecret(secret)) {
      setProcessing(false);
      setIntentError("Payment is not ready. Please wait a moment and try again.");
      return;
    }

    console.log("Confirming payment with Stripe...");
    try {
      const result = await stripe.confirmCardPayment(secret, { payment_method: { card } });
      const { error, paymentIntent } = result || {};

      if (error) {
        console.error("Stripe payment failed:", error);
        try {
          const maybePromise = onFailed?.(error);
          if (maybePromise && typeof maybePromise.then === "function") {
            await maybePromise;
          }
        } catch (e) {
          console.error("Error in onFailed handler:", e);
        }
        window.location.href = "/order/failed";
        return;
      }

      if (paymentIntent) {
        console.log("Payment Intent received:", {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
        });

        if (paymentIntent.status === "succeeded") {
          console.log("Payment succeeded, calling onPaid handler...");
          setProcessing(true);
          try {
            const maybePromise = onPaid?.(paymentIntent);
            if (maybePromise && typeof maybePromise.then === "function") {
              await maybePromise;
              console.log("onPaid handler completed");
            } else if (onPaid) {
              onPaid(paymentIntent);
            }

            setTimeout(() => {
              if (window.location.pathname !== "/order/success" && window.location.pathname !== "/order/failed") {
                console.warn("onPaid handler did not redirect, forcing redirect to success...");
                window.location.href = "/order/success";
              }
            }, 3000);
          } catch (e) {
            console.error("Error in onPaid handler:", e);
            setTimeout(() => {
              window.location.href = "/order/success";
            }, 500);
          } finally {
            setProcessing(false);
          }
          return;
        }

        console.warn("PaymentIntent not succeeded:", paymentIntent.status);
        const pseudoError = { message: "Payment not completed", payment_intent: paymentIntent };
        try {
          const maybePromise = onFailed?.(pseudoError);
          if (maybePromise && typeof maybePromise.then === "function") {
            await maybePromise;
          }
        } catch (e) {
          console.error("Error in onFailed handler:", e);
        }
        window.location.href = "/order/failed";
        return;
      }
    } catch (confirmErr) {
      console.error("Stripe confirmCardPayment error:", confirmErr);
      try {
        await onFailed?.(confirmErr);
      } catch (e) {
        console.error("Error in onFailed handler:", e);
      }
      alert("Payment confirmation failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const canPlaceOrder =
    stripe &&
    !processing &&
    !creatingIntent &&
    amount > 0 &&
    intentReady &&
    isValidClientSecret(clientSecret);

  const buttonLabel =
    processing || creatingIntent
      ? "Processing..."
      : !intentReady && !intentError
        ? "Preparing payment..."
        : "Place Order";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full">
      <CardElement className="p-3 border rounded" />
      {intentError ? (
        <p className="text-sm text-red-600" role="alert">{intentError}</p>
      ) : null}
      <button
        type="submit"
        disabled={!canPlaceOrder}
        className="btn-org btn-lg w-full"
      >
        {buttonLabel}
      </button>
    </form>
  );
}

export default function StripeCheckout({ amount, onPaid, onFailed, onProcessingChange, onReady }) {
  useEffect(() => {
    const publishable = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
    const pubPrefix = publishable.substring(0, 6);
    console.log("[Stripe Debug] Publishable key prefix:", pubPrefix, "| masked:", publishable ? publishable.replace(/.(?=.{4})/g, "*") : "(none)");

    const api = import.meta.env.VITE_API_URL;
    if (!api) return;
    (async () => {
      try {
        const res = await axios.get(`${api}/api/stripe/account-info`);
        console.log("[Stripe Debug] Server account info:", res.data.account || res.data);
        console.log("[Stripe Debug] Server key prefix:", res.data.keyPrefix);
        if (res.data.keyPrefix && pubPrefix && res.data.keyPrefix !== pubPrefix) {
          console.warn("[Stripe Debug] KEY MISMATCH: client publishable key prefix does not match server secret key prefix. Ensure both keys come from the same Stripe account and same mode (test/live).");
        }
      } catch (err) {
        console.warn("[Stripe Debug] Failed to fetch server Stripe account info:", err.response?.data || err.message);
      }
    })();
  }, []);

  return (
    <Elements stripe={stripePromise}>
      <StripeForm
        amount={amount}
        onPaid={onPaid}
        onFailed={onFailed}
        onProcessingChange={onProcessingChange}
        onReady={onReady}
      />
    </Elements>
  );
}
