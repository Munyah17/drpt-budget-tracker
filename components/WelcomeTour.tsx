"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "./Icon";

const KEY = "ws-welcome-seen";
const EVENT = "ws-welcome-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
function seen(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true; // storage blocked: never nag
  }
}

const SLIDES = [
  { icon: "plus", key: "s1" },
  { icon: "pie-chart", key: "s2" },
  { icon: "receipt", key: "s3" },
] as const;

/** Three short cards, once, the first time someone opens their own (non-demo) account. */
export default function WelcomeTour() {
  const t = useTranslations("Welcome");
  const { user, isDemo } = useAppData();
  const alreadySeen = useSyncExternalStore(subscribe, seen, () => true);
  const [i, setI] = useState(0);

  if (alreadySeen || isDemo || user?.role !== "user") return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch { /* ignore */ }
    window.dispatchEvent(new Event(EVENT));
  };
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" style={{ alignItems: "center", paddingTop: 0 }}>
      <div className="modal-box" style={{ maxWidth: 360, textAlign: "center", padding: "32px 26px 22px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px", background: "linear-gradient(135deg,var(--rose-600),var(--rose-400))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={slide.icon} size={28} />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>{t(`${slide.key}Title`)}</h3>
        <p style={{ margin: 0, color: "var(--ink-500)", lineHeight: 1.5 }}>{t(`${slide.key}Body`)}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "20px 0" }}>
          {SLIDES.map((_, n) => (
            <span key={n} style={{ width: n === i ? 18 : 6, height: 6, borderRadius: 99, background: n === i ? "var(--rose-600)" : "var(--pink-100)", transition: "width .2s" }} />
          ))}
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => (last ? close() : setI(i + 1))}>
          {last ? t("start") : t("next")}
        </button>
        {!last && (
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 6 }} onClick={close}>{t("skip")}</button>
        )}
      </div>
    </div>
  );
}
