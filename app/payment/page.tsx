"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

type PaymentMethod = "paynow" | "stripe" | "zipit" | "ecocash";

export default function PaymentPage() {
  const router = useRouter();
  const { toast, user } = useAppData();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [popFile, setPopFile] = useState<File | null>(null);

  const PAYMENT_PRICE = 1; // $1 once off

  function handlePayment() {
    if (!selectedMethod) {
      toast("Please select a payment method", "x");
      return;
    }

    if ((selectedMethod === "zipit" || selectedMethod === "ecocash") && !popFile) {
      toast("Please upload proof of payment", "x");
      return;
    }

    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      // Update user to paid status
      toast("Payment successful! You now have full access.", "check-circle");
      router.push("/dashboard");
    }, 2000);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="glass-card card-pad" style={{ maxWidth: 500, width: "100%", background: "var(--card-solid)" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div className="login-logo" style={{ marginBottom: 16 }}>
            Dr PT <span style={{ color: "var(--rose-500)" }}>❤</span>
          </div>
          <h2 style={{ marginBottom: 8 }}>Unlock Full Access</h2>
          <p style={{ color: "var(--ink-500)" }}>
            One-time payment of ${PAYMENT_PRICE} to access all features
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {/* Paynow */}
          <button
            className={`payment-method ${selectedMethod === "paynow" ? "selected" : ""}`}
            onClick={() => setSelectedMethod("paynow")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 16,
              border: `2px solid ${selectedMethod === "paynow" ? "var(--rose-500)" : "var(--card-border)"}`,
              borderRadius: "var(--radius-md)",
              background: selectedMethod === "paynow" ? "var(--pink-100)" : "transparent",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--pink-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="smartphone" size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Paynow</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Ecocash, Omari, Innbucks</div>
            </div>
            {selectedMethod === "paynow" && <Icon name="check-circle" size={20} style={{ color: "var(--rose-500)" }} />}
          </button>

          {/* Stripe */}
          <button
            className={`payment-method ${selectedMethod === "stripe" ? "selected" : ""}`}
            onClick={() => setSelectedMethod("stripe")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 16,
              border: `2px solid ${selectedMethod === "stripe" ? "var(--rose-500)" : "var(--card-border)"}`,
              borderRadius: "var(--radius-md)",
              background: selectedMethod === "stripe" ? "var(--pink-100)" : "transparent",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--pink-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="credit-card" size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Stripe</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Visa, Mastercard, AmEx, Wise</div>
            </div>
            {selectedMethod === "stripe" && <Icon name="check-circle" size={20} style={{ color: "var(--rose-500)" }} />}
          </button>

          {/* ZIPIT */}
          <button
            className={`payment-method ${selectedMethod === "zipit" ? "selected" : ""}`}
            onClick={() => setSelectedMethod("zipit")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 16,
              border: `2px solid ${selectedMethod === "zipit" ? "var(--rose-500)" : "var(--card-border)"}`,
              borderRadius: "var(--radius-md)",
              background: selectedMethod === "zipit" ? "var(--pink-100)" : "transparent",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--pink-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="landmark" size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>ZIPIT</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)" }}>FBC Bank - Direct Transfer</div>
            </div>
            {selectedMethod === "zipit" && <Icon name="check-circle" size={20} style={{ color: "var(--rose-500)" }} />}
          </button>

          {/* Ecocash Direct */}
          <button
            className={`payment-method ${selectedMethod === "ecocash" ? "selected" : ""}`}
            onClick={() => setSelectedMethod("ecocash")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 16,
              border: `2px solid ${selectedMethod === "ecocash" ? "var(--rose-500)" : "var(--card-border)"}`,
              borderRadius: "var(--radius-md)",
              background: selectedMethod === "ecocash" ? "var(--pink-100)" : "transparent",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--pink-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="smartphone" size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Ecocash Direct</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Direct Transfer + PoP</div>
            </div>
            {selectedMethod === "ecocash" && <Icon name="check-circle" size={20} style={{ color: "var(--rose-500)" }} />}
          </button>
        </div>

        {/* Payment Details */}
        {selectedMethod === "zipit" && (
          <div style={{ marginBottom: 20, padding: 16, background: "var(--pink-100)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>ZIPIT Details:</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div><strong>Bank:</strong> FBC Bank</div>
              <div><strong>Account No:</strong> 6870465460146</div>
              <div><strong>Account Type:</strong> USD Account</div>
              <div><strong>Amount:</strong> ${PAYMENT_PRICE}</div>
            </div>
          </div>
        )}

        {selectedMethod === "ecocash" && (
          <div style={{ marginBottom: 20, padding: 16, background: "var(--pink-100)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Ecocash Direct Details:</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div><strong>Number:</strong> 0773909307</div>
              <div><strong>Amount:</strong> ${PAYMENT_PRICE}</div>
            </div>
          </div>
        )}

        {/* Proof of Payment Upload */}
        {(selectedMethod === "zipit" || selectedMethod === "ecocash") && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>Upload Proof of Payment</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setPopFile(e.target.files?.[0] || null)}
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>
              Upload screenshot or PDF of your payment confirmation
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={handlePayment}
          disabled={processing}
        >
          {processing ? "Processing..." : `Pay $${PAYMENT_PRICE}`}
        </button>

        <button
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: 10 }}
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
