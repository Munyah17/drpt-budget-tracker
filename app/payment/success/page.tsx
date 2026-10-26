"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

type Phase = "verifying" | "paid" | "pending" | "error";

function SuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, updateUser, user } = useAppData();
  const [phase, setPhase] = useState<Phase>("verifying");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const provider = searchParams.get("provider");
      const uid = searchParams.get("uid") || user?.id || "";

      let url = "";
      if (provider === "stripe") {
        const sessionId = searchParams.get("session_id") ?? "";
        if (!sessionId) return setPhase("error");
        url = `/api/verify-payment?provider=stripe&session_id=${encodeURIComponent(sessionId)}&uid=${encodeURIComponent(uid)}`;
      } else if (provider === "paynow") {
        const pollUrl = sessionStorage.getItem("drpt-paynow-poll") ?? "";
        if (!pollUrl) return setPhase("pending");
        url = `/api/verify-payment?provider=paynow&pollurl=${encodeURIComponent(pollUrl)}&uid=${encodeURIComponent(uid)}`;
      } else {
        return setPhase("error");
      }

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.paid) {
          updateUser({ isPaid: true });
          setPhase("paid");
          toast("Payment confirmed — welcome aboard!", "check-circle");
          setTimeout(() => router.push("/dashboard"), 1600);
        } else {
          // Paynow can lag a few seconds after redirect — allow one retry poll
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
    const provider = searchParams.get("provider");
    const uid = searchParams.get("uid") || user?.id || "";
    const pollUrl = sessionStorage.getItem("drpt-paynow-poll") ?? "";
    const sessionId = searchParams.get("session_id") ?? "";
    const url =
      provider === "stripe"
        ? `/api/verify-payment?provider=stripe&session_id=${encodeURIComponent(sessionId)}&uid=${encodeURIComponent(uid)}`
        : `/api/verify-payment?provider=paynow&pollurl=${encodeURIComponent(pollUrl)}&uid=${encodeURIComponent(uid)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.paid) {
        updateUser({ isPaid: true });
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
    verifying: { title: "Confirming your payment…", text: "Hold tight, we're checking with the payment provider." },
    paid: { title: "Payment confirmed 🎉", text: "Full access unlocked. Taking you to your dashboard…" },
    pending: { title: "Payment still processing", text: "Your provider hasn't confirmed yet — it can take a minute. Check again below." },
    error: { title: "We couldn't confirm that payment", text: "If you were charged, send your receipt via WhatsApp and we'll sort it out." },
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
            Check payment status again
          </button>
        )}
        {(phase === "pending" || phase === "error") && (
          <a
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: 10, textDecoration: "none" }}
            href={`https://wa.me/263718560128?text=${encodeURIComponent("Hi, my WellSpend payment needs a manual check.\nEmail: " + (user?.email ?? "") + "\nRef: ")}`}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="send" size={15} /> Get help on WhatsApp
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
