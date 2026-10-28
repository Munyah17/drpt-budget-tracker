"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { notifyEvent } from "@/lib/notifyClient";
import { priceUsd, priceLabel, minPriceUsd, minPriceLabel } from "@/lib/pricing";
import Icon from "@/components/Icon";

type PaymentMethod = "paynow" | "stripe" | "ecocash" | "bank";

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
  const [pending, setPending] = useState<{ userId: string; email: string; name: string } | null>(null);
  const cancelled = searchParams.get("cancelled") === "1";

  // Signup redirects straight here — the user may not be signed in yet, so
  // recover the stashed identity from sessionStorage for checkout/webhooks.
  useEffect(() => {
    if (user) return;
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem("drpt-pending-pay");
        if (raw) setPending(JSON.parse(raw));
      } catch { /* no pending identity */ }
    });
  }, [user]);

  const payerId = user?.id ?? pending?.userId;
  const payerEmail = user?.email ?? pending?.email;
  const payerName = user?.name ?? pending?.name;

  const isDirect = selectedMethod === "ecocash" || selectedMethod === "bank";
  const total = selectedMethod ? priceUsd(selectedMethod) : minPriceUsd();

  const whatsappHref = () => {
    const text =
      `Hi, I've paid for WellSpend access.\n` +
      `Name: ${payerName ?? ""}\n` +
      `Email: ${payerEmail ?? ""}\n` +
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
          body: JSON.stringify({ userId: payerId, email: payerEmail, name: payerName }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
          notifyEvent("payment_failed", {
            email: payerEmail, name: payerName,
            method: selectedMethod, detail: data.error || "Could not start payment",
          });
          throw new Error(data.error || "Could not start payment");
        }
        // Paynow returns a poll URL we need later to confirm status
        if (data.pollUrl) sessionStorage.setItem("drpt-paynow-poll", data.pollUrl);
        window.location.href = data.url;
        return;
      }

      // Direct transfers: user pays manually, then sends PoP on WhatsApp
      notifyEvent("transfer_intent", {
        email: payerEmail, name: payerName,
        method: paymentMethodLabel(selectedMethod),
      });
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
        gap: 14,
        padding: "14px 16px",
        border: `1.5px solid ${selectedMethod === id ? "var(--rose-500)" : "var(--card-border)"}`,
        borderRadius: 14,
        background: selectedMethod === id ? "var(--pink-100)" : "var(--card-solid)",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        transition: "border-color .15s, background .15s, transform .1s",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: 44, height: 44, borderRadius: 11, flexShrink: 0,
          background: selectedMethod === id ? "var(--rose-600)" : "var(--pink-100)",
          color: selectedMethod === id ? "#fff" : "var(--rose-600)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background .15s, color .15s",
        }}
      >
        <Icon name={icon} size={21} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{sub}</div>
      </div>
      <div
        style={{
          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
          border: `2px solid ${selectedMethod === id ? "var(--rose-500)" : "var(--card-border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: selectedMethod === id ? "var(--rose-500)" : "transparent",
          transition: "all .15s",
        }}
      >
        {selectedMethod === id && <Icon name="check" size={12} style={{ color: "#fff" }} />}
      </div>
    </button>
  );

  const detailRow = (label: string, value: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0" }}>
      <span style={{ color: "var(--ink-500)", flexShrink: 0 }}>{label}</span>
      <strong style={{ textAlign: "right" }}>{value}</strong>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background:
          "radial-gradient(1200px 600px at 80% -10%, rgba(233,30,99,.18), transparent 60%)," +
          "radial-gradient(900px 500px at -10% 110%, rgba(200,16,87,.14), transparent 55%)," +
          "var(--bg)",
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: 520,
          width: "100%",
          background: "var(--card-solid)",
          overflow: "hidden",
          boxShadow: "0 24px 70px rgba(200,16,87,.16), 0 4px 18px rgba(0,0,0,.08)",
          borderRadius: 22,
        }}
      >
        {/* hero band */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--rose-600), var(--rose-500) 60%, var(--rose-400))",
            color: "#fff",
            padding: "30px 28px 26px",
            textAlign: "center",
          }}
        >
          <div className="login-logo" style={{ marginBottom: 10, justifyContent: "center", color: "#fff" }}>
            WellSpend <span style={{ color: "#ffd7e4" }}>❤</span>
          </div>
          <h2 style={{ marginBottom: 6, color: "#fff" }}>Activate your account</h2>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            from {minPriceLabel()}
          </div>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6, margin: "6px 0 8px" }}>
            <span style={{ fontSize: 15, opacity: .85 }}>once, not monthly</span>
          </div>
          <p style={{ fontSize: 13.5, opacity: .9, marginTop: 8, marginBottom: 0 }}>
            One payment unlocks everything — forever.
          </p>
          {cancelled && (
            <p style={{ fontSize: 13, marginTop: 10, background: "rgba(255,255,255,.18)", borderRadius: 8, padding: "7px 12px", display: "inline-block" }}>
              Payment was cancelled — pick a method to try again.
            </p>
          )}
        </div>

        <div style={{ padding: "24px 26px 26px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
          Choose how to pay
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {methodBtn("paynow", "smartphone", "Paynow", `Ecocash, Omari, InnBucks — ${priceLabel("paynow")} instant`)}
          {methodBtn("stripe", "credit-card", "Card payment", `Visa, Mastercard, AmEx — ${priceLabel("stripe")}`)}
          {methodBtn("ecocash", "banknote", "Ecocash / InnBucks", `Direct transfer — ${priceLabel("ecocash")}`)}
          {methodBtn("bank", "landmark", "Bank Transfer", `FBC USD account — ${priceLabel("bank")}`)}
        </div>

        {/* Direct transfer details */}
        {selectedMethod === "ecocash" && (
          <div style={{ marginBottom: 20, padding: 16, background: "var(--pink-100)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Send ${total.toFixed(2)} via Ecocash or InnBucks to:</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              {detailRow("Number", "+263 77 390 9307")}
              {detailRow("Name", "Munyaradzi J Muzvidziwa")}
              {detailRow("Amount", `$${total.toFixed(2)}`)}
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
              {detailRow("Amount", `$${total.toFixed(2)}`)}
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
              : `Pay ${priceLabel(selectedMethod ?? "paynow")}`}
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, fontSize: 11.5, color: "var(--ink-500)" }}>
          <Icon name="shield" size={12} /> Secure checkout — your card details never touch our servers
        </div>
        </div>
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
