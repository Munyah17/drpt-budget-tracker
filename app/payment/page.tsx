"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

type PaymentMethod = "paynow" | "stripe" | "ecocash" | "bank";

const PRICE = 1; // $1 once-off
const TRANSFER_FEE = 0.5; // withdrawal/processing fee on direct transfers
const WHATSAPP_POP = "263718560128";

function paymentMethodLabel(m: PaymentMethod) {
  switch (m) {
    case "paynow": return "Paynow";
    case "stripe": return "Card (Stripe)";
    case "ecocash": return "Ecocash / InnBucks";
    case "bank": return "Bank Transfer";
  }
}

function PaymentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, user, isDemo } = useAppData();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [popSent, setPopSent] = useState(false);
  const cancelled = searchParams.get("cancelled") === "1";

  const isDirect = selectedMethod === "ecocash" || selectedMethod === "bank";
  const total = isDirect ? PRICE + TRANSFER_FEE : PRICE;

  const whatsappHref = () => {
    const text =
      `Hi, I've paid for Dr PT access.\n` +
      `Name: ${user?.name ?? ""}\n` +
      `Email: ${user?.email ?? ""}\n` +
      `Phone: \n` +
      `Method: ${selectedMethod ? paymentMethodLabel(selectedMethod) : ""}\n` +
      `Transaction Ref: `;
    return `https://wa.me/${WHATSAPP_POP}?text=${encodeURIComponent(text)}`;
  };

  async function handlePayment() {
    if (!selectedMethod) {
      toast("Please select a payment method", "x");
      return;
    }
    if (isDemo) {
      toast("Demo mode — payments are simulated, nothing is charged.", "sparkles");
      return;
    }

    setProcessing(true);
    try {
      if (selectedMethod === "stripe" || selectedMethod === "paynow") {
        const endpoint =
          selectedMethod === "stripe" ? "/api/checkout/stripe" : "/api/paynow/initiate";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id, email: user?.email, name: user?.name }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || "Could not start payment");
        }
        // Paynow returns a poll URL we need later to confirm status
        if (data.pollUrl) sessionStorage.setItem("drpt-paynow-poll", data.pollUrl);
        window.location.href = data.url;
        return;
      }

      // Direct transfers: user pays manually, then sends PoP on WhatsApp
      setPopSent(true);
      toast("Send your proof of payment on WhatsApp to activate your account.", "send");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Payment failed to start", "x");
    } finally {
      setProcessing(false);
    }
  }

  const methodBtn = (id: PaymentMethod, icon: string, title: string, sub: string) => (
    <button
      className={`payment-method ${selectedMethod === id ? "selected" : ""}`}
      onClick={() => setSelectedMethod(id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 16,
        border: `2px solid ${selectedMethod === id ? "var(--rose-500)" : "var(--card-border)"}`,
        borderRadius: "var(--radius-md)",
        background: selectedMethod === id ? "var(--pink-100)" : "var(--card-solid)",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: "var(--pink-100)", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon name={icon} size={24} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{sub}</div>
      </div>
      {selectedMethod === id && (
        <Icon name="check-circle" size={20} style={{ color: "var(--rose-500)", flexShrink: 0 }} />
      )}
    </button>
  );

  const detailRow = (label: string, value: string) => (
    <div>
      <strong>{label}:</strong> {value}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="glass-card card-pad" style={{ maxWidth: 520, width: "100%", background: "var(--card-solid)" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div className="login-logo" style={{ marginBottom: 16, justifyContent: "center" }}>
            Dr PT <span style={{ color: "var(--rose-500)" }}>❤</span>
          </div>
          <h2 style={{ marginBottom: 8 }}>Activate your account</h2>
          <p style={{ color: "var(--ink-500)" }}>
            One-time payment of ${PRICE} unlocks everything — forever.
          </p>
          {cancelled && (
            <p style={{ color: "var(--red)", fontSize: 13, marginTop: 8 }}>
              Payment was cancelled — pick a method to try again.
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {methodBtn("paynow", "smartphone", "Paynow", "Ecocash, Omari, InnBucks — instant")}
          {methodBtn("stripe", "credit-card", "Card payment", "Visa, Mastercard, AmEx via Stripe")}
          {methodBtn("ecocash", "banknote", "Ecocash / InnBucks", `Direct transfer — $${PRICE.toFixed(2)} + $${TRANSFER_FEE.toFixed(2)} fee`)}
          {methodBtn("bank", "landmark", "Bank Transfer", `FBC USD account — $${PRICE.toFixed(2)} + $${TRANSFER_FEE.toFixed(2)} fee`)}
        </div>

        {/* Direct transfer details */}
        {selectedMethod === "ecocash" && (
          <div style={{ marginBottom: 20, padding: 16, background: "var(--pink-100)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Send ${total.toFixed(2)} via Ecocash or InnBucks to:</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              {detailRow("Number", "+263 77 390 9307")}
              {detailRow("Name", "Munyaradzi J Muzvidziwa")}
              {detailRow("Amount", `$${total.toFixed(2)} (includes $0.50 withdrawal fee)`)}
            </div>
          </div>
        )}

        {selectedMethod === "bank" && (
          <div style={{ marginBottom: 20, padding: 16, background: "var(--pink-100)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Transfer ${total.toFixed(2)} to:</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              {detailRow("Account Name", "Solabliss Zimbabwe Pvt Ltd")}
              {detailRow("Bank", "FBC Bank")}
              {detailRow("Branch", "FBC Center Branch")}
              {detailRow("USD Account", "6870465460146")}
              {detailRow("Amount", `$${total.toFixed(2)} (includes $0.50 fee)`)}
            </div>
          </div>
        )}

        {/* WhatsApp PoP */}
        {isDirect && (
          <div style={{ marginBottom: 20, padding: 16, border: "1px solid var(--card-border)", borderRadius: "var(--radius-sm)", fontSize: 13, lineHeight: 1.7 }}>
            After paying, send your <strong>proof of payment</strong> on WhatsApp to{" "}
            <strong>+263 71 856 0128</strong> with your <strong>name, email, phone and transaction
            reference</strong> — we&apos;ll activate your account as soon as it&apos;s confirmed.
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 12, textDecoration: "none" }}
            >
              <Icon name="send" size={15} /> Send PoP on WhatsApp
            </a>
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={handlePayment}
          disabled={processing || (isDirect && popSent)}
        >
          {processing
            ? "Redirecting to checkout…"
            : isDirect
              ? popSent
                ? "Waiting for PoP verification"
                : `I've sent $${total.toFixed(2)} — continue`
              : `Pay $${PRICE.toFixed(2)}`}
        </button>

        {popSent && (
          <p style={{ fontSize: 12.5, color: "var(--ink-500)", textAlign: "center", marginTop: 10 }}>
            PoP sent? We&apos;ll verify and unlock your account shortly. You can close this page.
          </p>
        )}

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

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentInner />
    </Suspense>
  );
}
