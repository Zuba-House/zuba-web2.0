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

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function StripeForm({ amount, onPaid, onProcessingChange, onReady }) {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const api = import.meta.env.VITE_API_URL;
    
    if (!amount || amount <= 0) {
      console.warn("⚠️ Invalid amount for payment intent:", amount);
      setClientSecret("");
      return;
    }
    
    console.log("💰 Creating payment intent for amount:", amount);
    axios
      .post(`${api}/api/stripe/create-payment-intent`, { amount })
      .then((res) => {
        console.log("✅ Payment intent created:", res.data.clientSecret.substring(0, 20) + "...");
        setClientSecret(res.data.clientSecret);
      })
      .catch((err) => {
        console.error("❌ Failed to create payment intent:", err.response?.data || err.message);
        setClientSecret("");
      });
  }, [amount]);

  // Notify parent when clientSecret is received (Stripe element should be ready soon)
  useEffect(() => {
    if (clientSecret) {
      // small timeout to allow Elements to render
      setTimeout(() => {
        if (typeof onReady === "function") onReady();
      }, 100);
    }
  }, [clientSecret, onReady]);

  // When clientSecret and elements are ready, try to focus the CardElement to make it visible on small screens
  useEffect(() => {
    if (!clientSecret) return;
    if (!elements) return;
    const cardEl = elements.getElement(CardElement);
    if (cardEl && typeof cardEl.focus === 'function') {
      // small delay to ensure element is mounted
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    setProcessing(true);
    const card = elements.getElement(CardElement);
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card } }
    );
    setProcessing(false);
    if (error) {
      console.error("Stripe payment failed:", error);
      window.location.href = "/order/failed";
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      onPaid?.(paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full">
      <CardElement className="p-3 border rounded" />
      <button
        type="submit"
        disabled={!stripe || !clientSecret || processing}
        className="btn-org btn-lg w-full"
      >
        {processing ? "Processing..." : "Pay with Card"}
      </button>
    </form>
  );
}

export default function StripeCheckout({ amount, onPaid, onProcessingChange, onReady }) {
  return (
    <Elements stripe={stripePromise}>
      <StripeForm
        amount={amount}
        onPaid={onPaid}
        onProcessingChange={onProcessingChange}
        onReady={onReady}
      />
    </Elements>
  );
}
