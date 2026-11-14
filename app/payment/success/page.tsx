"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { trackEvent } from "@/lib/analytics";
import Icon from "@/components/Icon";
import { useTranslations } from "next-intl";

type Phase = "verifying" | "paid" | "pending" | "error";

interface PendingSignup {
  email: string;
  password: string;
  name: string;
  phone?: string;
  gender?: string;
  profession?: string;
  country?: string;
  referral_code?: string | null;
}

function SuccessInner() {
  const t = useTranslations("Pages.payment_success");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, updateUser, user, login } = useAppData();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const ran = useRef(false);

  // Pay-first signup: the registration was stashed before checkout and the
  // account is created ONLY now that the payment is confirmed.
  const signup: PendingSignup | null = (() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("drpt-pending-signup");
      return raw ? (JSON.parse(raw) as PendingSignup) : null;
    } catch {
      return null;
    }
  })();

  function verifyUrl(uid: string, dry: boolean): string {
    const provider = searchParams.get("provider");
    if (provider === "stripe") {
      const sessionId = searchParams.get("session_id") ?? "";
      return `/api/verify-payment?provider=stripe&session_id=${encodeURIComponent(sessionId)}&uid=${encodeURIComponent(uid)}${dry ? "&dry=1" : ""}`;
    }
    const pollUrl = sessionStorage.getItem("drpt-paynow-poll") ?? "";
    return `/api/verify-payment?provider=paynow&pollurl=${encodeURIComponent(pollUrl)}&uid=${encodeURIComponent(uid)}${dry ? "&dry=1" : ""}`;
  }

  async function checkPaid(uid: string, dry: boolean): Promise<boolean> {
    const provider = searchParams.get("provider");
    if (!provider || (provider === "stripe" && !searchParams.get("session_id")) || (provider === "paynow" && !sessionStorage.getItem("drpt-paynow-poll"))) {
      return false;
    }
    const res = await fetch(verifyUrl(uid, dry));
    const data = await res.json();
    return data.paid === true;
  }

  /** Create the account for a paid signup, then activate it. Returns the new uid. */
  async function provisionSignup(): Promise<string | null> {
    if (!signup) return null;
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: signup.email,
        password: signup.password,
        name: signup.name,
        phone: signup.phone,
        gender: signup.gender,
        profession: signup.profession,
        country: signup.country,
        referral_code: signup.referral_code,
      }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok || !data.userId) {
      setErrorMsg(data?.error || t("signupFailed"));
      return null;
    }
    return data.userId as string;
  }

  async function complete(uid: string) {
    // Real verify — marks the profile paid and writes the ledger entry once.
    const ok = await checkPaid(uid, false);
    if (!ok) return false;
    if (signup) {
      // Sign in so the app session exists, then land on the dashboard.
      await login(signup.email, signup.password, true);
      trackEvent("signup", {}, { email: signup.email });
      try { sessionStorage.removeItem("drpt-pending-signup"); } catch { /* ignore */ }
    }
    trackEvent("payment", { provider: searchParams.get("provider") }, user);
    setPhase("paid");
    toast(t("confirmedToast"), "check-circle");
    setTimeout(() => router.push("/dashboard"), 1600);
    return true;
  }

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        if (signup) {
          // 1. Confirm the money arrived — dry run, no account exists yet.
          const paid = await checkPaid("", true);
          if (!paid) {
            setPhase("pending"); // Paynow can lag — allow a manual recheck
            return;
          }
          // 2. Payment confirmed → NOW create the account.
          const uid = await provisionSignup();
          if (!uid) {
            setPhase("error");
            return;
          }
          // 3. Activate the fresh account and sign in.
          const ok = await complete(uid);
          if (!ok) setPhase("pending");
          return;
        }

        // Existing-user flow (renewal / activation of an already-created account).
        const uid = searchParams.get("uid") || user?.id || "";
        const ok = await checkPaid(uid, false);
        if (ok) {
          updateUser({ isPaid: true });
          trackEvent("payment", { provider: searchParams.get("provider") }, user);
          setPhase("paid");
          toast(t("confirmedToast"), "check-circle");
          setTimeout(() => router.push("/dashboard"), 1600);
        } else {
          setPhase("pending");
        }
      } catch {
        setPhase("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function recheck() {
    setPhase("verifying");
    try {
      if (signup) {
        const paid = await checkPaid("", true);
        if (!paid) {
          setPhase("pending");
          return;
        }
        const uid = await provisionSignup();
        if (!uid) {
          setPhase("error");
          return;
        }
        const ok = await complete(uid);
        if (!ok) setPhase("pending");
        return;
      }
      const uid = searchParams.get("uid") || user?.id || "";
      const ok = await checkPaid(uid, false);
      if (ok) {
        updateUser({ isPaid: true });
        trackEvent("payment", { provider: searchParams.get("provider") }, user);
        setPhase("paid");
        setTimeout(() => router.push("/dashboard"), 1600);
      } else {
        setPhase("pending");
      }
    } catch {
      setPhase("error");
    }
  }

  const body: Record<Phase, { title: string; text: string }> = {
    verifying: { title: t("verifyingTitle"), text: t("verifyingText") },
    paid: { title: t("paidTitle"), text: t("paidText") },
    pending: { title: t("pendingTitle"), text: t("pendingText") },
    error: { title: t("errorTitle"), text: errorMsg || t("errorText") },
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="glass-card card-pad" style={{ maxWidth: 440, width: "100%", textAlign: "center", background: "var(--card-solid)" }}>
        <div className="login-logo" style={{ justifyContent: "center", marginBottom: 18 }}>
          WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <Icon
            name={phase === "paid" ? "check-circle" : phase === "error" ? "x" : "clock"}
            size={44}
            style={{ color: phase === "paid" ? "var(--green)" : phase === "error" ? "var(--red)" : "var(--amber)" }}
          />
        </div>
        <h2 style={{ margin: "0 0 8px" }}>{body[phase].title}</h2>
        <p style={{ color: "var(--ink-500)", fontSize: 14, margin: "0 0 22px" }}>{body[phase].text}</p>
        {phase === "pending" && (
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={recheck}>
            {t("checkAgain")}
          </button>
        )}
        {(phase === "pending" || phase === "error") && (
          <a
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: 10, textDecoration: "none" }}
            href={`https://wa.me/263718560128?text=${encodeURIComponent(t("whatsappHelp", { email: signup?.email ?? user?.email ?? "" }))}`}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="send" size={15} /> {t("getHelp")}
          </a>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}
