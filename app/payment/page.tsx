"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { notifyEvent } from "@/lib/notifyClient";
import { priceUsdFor, priceLabelFor, minPriceUsdFor, minPriceLabelFor, priceBreakdown } from "@/lib/pricing";
import { COUNTRIES } from "@/lib/countries";
import Icon from "@/components/Icon";
import { useIsNative } from "@/lib/native";

type PaymentMethod = "paynow" | "stripe" | "ecocash" | "bank";

const WHATSAPP_POP = "263718560128";

function PaymentInner() {
  const t = useTranslations("Pages.payment");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, user, isDemo } = useAppData();
  const native = useIsNative();
  // No purchases inside the iPhone app.
  useEffect(() => {
    if (native) router.replace("/login");
  }, [native, router]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [popSent, setPopSent] = useState(false);
  const [pending, setPending] = useState<{ userId: string; email: string; name: string; country?: string } | null>(null);
  // Fallback region picker for accounts that predate the mandatory country
  // field — the charged price is still resolved server-side from the profile.
  const [regionChoice, setRegionChoice] = useState("");
  const locale = useLocale();
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
  const region = (user?.country ?? pending?.country ?? regionChoice).toLowerCase();
  // Paynow / EcoCash / bank transfer only settle in Zimbabwe — everywhere
  // else it's card-only via Stripe.
  const isZimbabwe = region === "zw";

  const countryOptions = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return COUNTRIES.map((code) => ({ code, label: names.of(code) ?? code }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [locale]);
  const regionName = useMemo(() => {
    if (!region) return "";
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return names.of(region.toUpperCase()) ?? region.toUpperCase();
  }, [region, locale]);

  const isDirect = selectedMethod === "ecocash" || selectedMethod === "bank";
  const total = selectedMethod ? priceUsdFor(selectedMethod, region) : minPriceUsdFor(region);

  const methodLabels: Record<PaymentMethod, string> = {
    paynow: t("methodPaynow"),
    stripe: t("methodStripe"),
    ecocash: t("methodEcocash"),
    bank: t("methodBank"),
  };

  const whatsappHref = () => {
    const text = t("whatsappMessage", {
      name: payerName ?? "",
      email: payerEmail ?? "",
      method: selectedMethod ? methodLabels[selectedMethod] : "",
    });
    return `https://wa.me/${WHATSAPP_POP}?text=${encodeURIComponent(text)}`;
  };

  async function handlePayment() {
    if (!selectedMethod) {
      toast(t("selectMethodToast"), "x");
      return;
    }
    if (isDemo) {
      toast(t("demoModeToast"), "sparkles");
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
          body: JSON.stringify({ userId: payerId, email: payerEmail, name: payerName, country: region }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
          notifyEvent("payment_failed", {
            email: payerEmail, name: payerName,
            method: selectedMethod, detail: data.error || t("couldNotStartPayment"),
          });
          throw new Error(data.error || t("couldNotStartPayment"));
        }
        // Paynow returns a poll URL we need later to confirm status
        if (data.pollUrl) sessionStorage.setItem("drpt-paynow-poll", data.pollUrl);
        window.location.assign(data.url);
        return;
      }

      // Direct transfers: user pays manually, then sends PoP on WhatsApp
      notifyEvent("transfer_intent", {
        email: payerEmail, name: payerName,
        method: methodLabels[selectedMethod],
      });
      setPopSent(true);
      toast(t("popInstructionsToast"), "send");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("paymentFailedToast"), "x");
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
          <h2 style={{ marginBottom: 6, color: "#fff" }}>{t("heroTitle")}</h2>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {region ? t("fromPrice", { price: minPriceLabelFor(region) }) : "—"}
          </div>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6, margin: "6px 0 8px" }}>
            <span style={{ fontSize: 15, opacity: .85 }}>{region ? t("onceNotMonthly") : t("regionPrompt")}</span>
          </div>
          <p style={{ fontSize: 13.5, opacity: .9, marginTop: 8, marginBottom: 0 }}>
            {t("tagline")}
          </p>
          {cancelled && (
            <p style={{ fontSize: 13, marginTop: 10, background: "rgba(255,255,255,.18)", borderRadius: 8, padding: "7px 12px", display: "inline-block" }}>
              {t("cancelledNotice")}
            </p>
          )}
        </div>

        <div style={{ padding: "24px 26px 26px" }}>
        {!region ? (
          <div style={{ textAlign: "center", padding: "18px 8px 8px" }}>
            <p style={{ fontSize: 13.5, color: "var(--ink-500)", marginBottom: 14 }}>{t("regionPrompt")}</p>
            <select
              className="settings-select"
              style={{ width: "100%", padding: "12px 14px", fontSize: 14 }}
              value={regionChoice}
              onChange={(e) => setRegionChoice(e.target.value)}
            >
              <option value="" disabled>{t("countryPh")}</option>
              {countryOptions.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        ) : (
        <>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
          {t("chooseHowToPay")} · {regionName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {isZimbabwe && methodBtn("paynow", "smartphone", t("methodPaynow"), t("paynowSub", { price: priceLabelFor("paynow", region) }))}
          {isZimbabwe && methodBtn("ecocash", "banknote", t("methodEcocash"), t("ecocashSub", { price: priceLabelFor("ecocash", region) }))}
          {isZimbabwe && methodBtn("bank", "landmark", t("methodBank"), t("bankSub", { price: priceLabelFor("bank", region) }))}
          <button
            className={`payment-method ${selectedMethod === "stripe" ? "selected" : ""}`}
            onClick={() => setSelectedMethod("stripe")}
            style={{
              display: "block",
              padding: selectedMethod === "stripe" ? 3 : 0,
              border: `1.5px solid ${selectedMethod === "stripe" ? "var(--rose-500)" : "var(--card-border)"}`,
              borderRadius: 14,
              background: "var(--card-solid)",
              cursor: "pointer",
              width: "100%",
              transition: "border-color .15s",
              fontFamily: "inherit",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/stripe-banner.png"
              alt={t("methodStripeAlt")}
              style={{ display: "block", width: "100%", borderRadius: 10 }}
            />
          </button>
        </div>

        {/* Itemised total — $1 principal plus regional levies and processing */}
        {selectedMethod && (
          <div style={{ marginBottom: 20, padding: "14px 16px", border: "1px solid var(--card-border)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
              {t("breakdownTitle")}
            </div>
            {priceBreakdown(selectedMethod, region).map((line) =>
              detailRow(
                line.key === "principal"
                  ? t("linePrincipal")
                  : line.key === "processing"
                    ? t(`processing_${selectedMethod}`)
                    : t(`fee_${line.key}`),
                `$${(line.cents / 100).toFixed(2)}`
              )
            )}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0 2px", borderTop: "1px solid var(--card-border)", marginTop: 6 }}>
              <strong>{t("lineTotal")}</strong>
              <strong style={{ color: "var(--rose-600)" }}>{priceLabelFor(selectedMethod, region)}</strong>
            </div>
          </div>
        )}

        {/* Direct transfer details */}
        {selectedMethod === "ecocash" && (
          <div style={{ marginBottom: 20, padding: 16, background: "var(--pink-100)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("sendViaEcocash", { amount: total.toFixed(2) })}</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              {detailRow(t("labelNumber"), "+263 77 390 9307")}
              {detailRow(t("labelName"), "Munyaradzi J Muzvidziwa")}
              {detailRow(t("labelAmount"), `$${total.toFixed(2)}`)}
            </div>
          </div>
        )}

        {selectedMethod === "bank" && (
          <div style={{ marginBottom: 20, padding: 16, background: "var(--pink-100)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("transferTo", { amount: total.toFixed(2) })}</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              {detailRow(t("labelAccountName"), "Solabliss Zimbabwe Pvt Ltd")}
              {detailRow(t("labelBank"), "FBC Bank")}
              {detailRow(t("labelBranch"), "FBC Center Branch")}
              {detailRow(t("labelUsdAccount"), "6870465460146")}
              {detailRow(t("labelAmount"), `$${total.toFixed(2)}`)}
            </div>
          </div>
        )}

        {/* WhatsApp PoP */}
        {isDirect && (
          <div style={{ marginBottom: 20, padding: 16, border: "1px solid var(--card-border)", borderRadius: "var(--radius-sm)", fontSize: 13, lineHeight: 1.7 }}>
            {t.rich("popInstructions", {
              strong: (chunks) => <strong>{chunks}</strong>,
              phone: "+263 71 856 0128",
            })}
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 12, textDecoration: "none" }}
            >
              <Icon name="send" size={15} /> {t("sendPopWhatsApp")}
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
            ? t("redirecting")
            : isDirect
              ? popSent
                ? t("waitingForPop")
                : t("sentAmount", { amount: total.toFixed(2) })
              : t("payAmount", { price: priceLabelFor(selectedMethod ?? "paynow", region) })}
        </button>

        {popSent && (
          <p style={{ fontSize: 12.5, color: "var(--ink-500)", textAlign: "center", marginTop: 10 }}>
            {t("popSentNote")}
          </p>
        )}

        <button
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: 10 }}
          onClick={() => router.back()}
        >
          {t("cancel")}
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, fontSize: 11.5, color: "var(--ink-500)" }}>
          <Icon name="shield" size={12} /> {t("secureCheckout")}
        </div>
        </>
        )}
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
