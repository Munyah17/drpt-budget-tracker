"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { EXPENSE_CATS } from "@/lib/data";
import Icon from "./Icon";

const KEY = "drpt-no-spend-challenge";

interface ChallengeState {
  category: string;
  startedAt: string; // ISO date the challenge started
}

/**
 * No-Spend Challenge — pick a category and keep a streak of days
 * without logging any expense in it. Streak breaks automatically
 * if a matching expense is found on or after the start date.
 */
export default function NoSpendChallenge() {
  const t = useTranslations("Pages.components");
  const { expenses } = useAppData();
  const [challenge, setChallenge] = useState<ChallengeState | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as ChallengeState) : null;
    } catch {
      return null;
    }
  });
  const [pick, setPick] = useState(EXPENSE_CATS[0] ?? "Food");

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);

  // Consecutive clean days: from startedAt through today, counting days
  // with zero expenses in the chosen category. A hit ends the streak.
  const { streak, broken } = useMemo(() => {
    if (!challenge) return { streak: 0, broken: false };
    const cat = challenge.category;
    const start = challenge.startedAt;
    const hitDates = new Set(
      expenses.filter((e) => e.category === cat && e.date >= start).map((e) => e.date)
    );
    const today = new Date();
    let s = 0;
    let broke = false;
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      if (hitDates.has(dayKey(d))) {
        broke = true;
        s = 0;
        // restart the count from the day after the slip
        continue;
      }
      s++;
    }
    return { streak: s, broken: broke };
  }, [challenge, expenses]);

  function start() {
    const c = { category: pick, startedAt: dayKey(new Date()) };
    setChallenge(c);
    localStorage.setItem(KEY, JSON.stringify(c));
  }

  function stop() {
    setChallenge(null);
    localStorage.removeItem(KEY);
  }

  return (
    <div className="glass-card card-pad">
      <div className="card-head" style={{ marginBottom: 10 }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="zap" size={16} style={{ color: "var(--rose-600)" }} /> {t("noSpend_title")}
        </h3>
      </div>

      {!challenge ? (
        <>
          <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12 }}>
            {t("noSpend_desc")}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              style={{
                flex: 1, padding: "10px 12px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--card-border)", background: "var(--card-solid)", fontSize: 13.5,
              }}
            >
              {EXPENSE_CATS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={start}>{t("noSpend_start")}</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ textAlign: "center", padding: "8px 0 12px" }}>
            <div style={{ fontSize: 38, fontWeight: 800, color: "var(--rose-600)", lineHeight: 1 }}>
              {streak}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 4 }}>
              {t.rich("noSpend_days", {
                count: streak,
                category: challenge.category,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </div>
          </div>
          {broken && (
            <p style={{ fontSize: 12.5, color: "#d97706", marginBottom: 10, textAlign: "center" }}>
              {t("noSpend_broken")}
            </p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12.5 }} onClick={stop}>
              {t("noSpend_end")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
