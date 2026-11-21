"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function TrialActivationPage() {
  const t = useTranslations("Pages.corporate.trial");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "expired">("loading");
  const [corporate, setCorporate] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const corpId = searchParams.get("corp");

    if (!token || !corpId) {
      setStatus("invalid");
      setError(t("missingParams"));
      return;
    }

    const validateTrial = async () => {
      try {
        const res = await fetch(`/api/corporate/trial?token=${encodeURIComponent(token)}&corp=${encodeURIComponent(corpId)}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus("invalid");
          setError(data.error || t("invalidLink"));
          return;
        }

        if (data.corporate.trial_expired) {
          setStatus("expired");
          setCorporate(data.corporate);
          return;
        }

        setStatus("valid");
        setCorporate(data.corporate);

        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          router.push(`/login?next=/corporate/overview&trial=${token}&corp=${corpId}`);
        }, 3000);
      } catch (err) {
        setStatus("invalid");
        setError(t("validationError"));
      }
    };

    validateTrial();
  }, [searchParams, router, t]);

  if (status === "loading") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: "4px solid var(--border)",
            borderTopColor: "var(--rose-500)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem",
          }} />
          <p style={{ color: "var(--text-muted)" }}>{t("validating")}</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{
          maxWidth: "400px",
          padding: "2rem",
          background: "var(--surface)",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--text)" }}>{t("invalidTitle")}</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{error}</p>
          <button
            onClick={() => router.push("/login")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "var(--rose-500)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {t("goToLogin")}
          </button>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{
          maxWidth: "400px",
          padding: "2rem",
          background: "var(--surface)",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏰</div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--text)" }}>{t("expiredTitle")}</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            {t("expiredMessage", { company: corporate?.name || "your company" })}
          </p>
          <button
            onClick={() => router.push("/login")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "var(--rose-500)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {t("contactSales")}
          </button>
        </div>
      </div>
    );
  }

  // Valid trial
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        maxWidth: "500px",
        padding: "2rem",
        background: "var(--surface)",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--text)" }}>
          {t("trialActivated", { company: corporate?.name || "your company" })}
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
          {t("trialDaysLeft", { days: corporate?.trial_days_left || 7 })}
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          {t("redirecting")}
        </p>
        <div style={{
          width: "100%",
          height: "4px",
          background: "var(--border)",
          borderRadius: "2px",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            background: "var(--rose-500)",
            animation: "progress 3s linear forwards",
          }} />
        </div>
      </div>
    </div>
  );
}
