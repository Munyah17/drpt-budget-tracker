"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import { COUNTRIES } from "@/lib/countries";
import { MARKET_PRICE_USD, marketFor, priceUsdFor, type PriceMarket } from "@/lib/pricing";
import Icon from "@/components/Icon";

interface PriceOverride {
  id: number;
  scope: "market" | "country";
  key: string;
  amount_usd: number;
  updated_at?: string;
}

const MARKETS = Object.keys(MARKET_PRICE_USD) as PriceMarket[];
const MARKET_LABELS: Record<PriceMarket, string> = {
  africa: "Africa",
  southamerica: "South America",
  asia: "Asia",
  australia: "Australia",
  europe: "Europe",
  us: "United States",
};

export default function PricingPage() {
  const { user, toast } = useAppData();
  const adminEmail = user?.email;
  const locale = useLocale();
  const isSuper = user?.role === "super_admin";
  const [overrides, setOverrides] = useState<PriceOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [countryPick, setCountryPick] = useState("");
  const [countryAmount, setCountryAmount] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing", { headers: await adminHeaders(adminEmail) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setOverrides(data?.overrides ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load prices");
    } finally {
      setLoading(false);
    }
  }, [adminEmail]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const overrideMap = useMemo(
    () => new Map(overrides.map((o) => [`${o.scope}:${o.key}`, Number(o.amount_usd)])),
    [overrides]
  );

  const countryNames = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return (code: string) => names.of(code.toUpperCase()) ?? code.toUpperCase();
  }, [locale]);

  const draftFor = (scope: "market" | "country", key: string) =>
    drafts[`${scope}:${key}`] ?? overrideMap.get(`${scope}:${key}`)?.toString() ?? "";

  const setDraft = (scope: "market" | "country", key: string, value: string) =>
    setDrafts((prev) => ({ ...prev, [`${scope}:${key}`]: value }));

  async function save(scope: "market" | "country", key: string, amountUsd: number) {
    const id = `${scope}:${key}`;
    setSaving(id);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
        body: JSON.stringify({ scope, key, amountUsd }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      toast("Price saved", "check-circle");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "x");
    } finally {
      setSaving(null);
    }
  }

  async function remove(scope: "market" | "country", key: string) {
    const id = `${scope}:${key}`;
    setSaving(id);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
        body: JSON.stringify({ scope, key }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      toast("Custom price removed", "trash-2");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "x");
    } finally {
      setSaving(null);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: 110,
    padding: "8px 10px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--card-border)",
    background: "transparent",
    color: "inherit",
    fontSize: 13,
  };

  if (!isSuper) {
    return (
      <div className="glass-card card-pad" style={{ maxWidth: 560 }}>
        <h2 className="section-title">Super admin only</h2>
        <p className="section-sub">Custom pricing is restricted to the Super Admin account.</p>
      </div>
    );
  }

  const countryOverrides = overrides
    .filter((o) => o.scope === "country")
    .sort((a, b) => a.key.localeCompare(b.key));

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="section-title">Pricing</h2>
          <p className="section-sub">Custom monthly prices by region (market) or country. Country overrides win over market overrides.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => void load()} disabled={loading}>
          <Icon name="refresh-cw" size={15} style={{ marginRight: 6 }} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="glass-card card-pad" style={{ marginBottom: 20, color: "var(--ink-500)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>Regional markets</h3>
          <span className="chip">USD / month</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MARKETS.map((m) => {
            const id = `market:${m}`;
            const hasOverride = overrideMap.has(id);
            const defaultUsd = MARKET_PRICE_USD[m];
            return (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{MARKET_LABELS[m]}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>default ${defaultUsd.toFixed(2)}</div>
                </div>
                <span style={{ fontSize: 12, color: "var(--ink-500)" }}>Custom</span>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={defaultUsd.toFixed(2)}
                  value={draftFor("market", m)}
                  onChange={(e) => setDraft("market", m, e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  style={{ padding: "8px 14px", fontSize: 13 }}
                  disabled={saving === id || !draftFor("market", m)}
                  onClick={() => void save("market", m, Number(draftFor("market", m)))}
                >
                  Save
                </button>
                {hasOverride && (
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "8px 14px", fontSize: 13, color: "var(--red)" }}
                    disabled={saving === id}
                    onClick={() => void remove("market", m)}
                  >
                    Clear
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>Country overrides</h3>
          <span className="chip">USD / month</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <select
            className="settings-select"
            style={{ ...inputStyle, width: 220 }}
            value={countryPick}
            onChange={(e) => setCountryPick(e.target.value)}
          >
            <option value="">Select country…</option>
            {COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {countryNames(code)} ({code.toUpperCase()})
              </option>
            ))}
          </select>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            placeholder={countryPick ? priceUsdFor("stripe", countryPick).toFixed(2) : "0.00"}
            value={countryAmount}
            onChange={(e) => setCountryAmount(e.target.value)}
          />
          <button
            className="btn btn-primary"
            style={{ padding: "8px 14px", fontSize: 13 }}
            disabled={!countryPick || !countryAmount || saving === `country:${countryPick}`}
            onClick={() => void save("country", countryPick, Number(countryAmount))}
          >
            {overrideMap.has(`country:${countryPick}`) ? "Update" : "Add"}
          </button>
        </div>

        {countryOverrides.length === 0 ? (
          <p style={{ color: "var(--ink-500)", fontSize: 13 }}>No country overrides yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {countryOverrides.map((o) => (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {countryNames(o.key)} <span style={{ color: "var(--ink-500)", fontWeight: 500 }}>({o.key.toUpperCase()})</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
                    {marketFor(o.key) ? MARKET_LABELS[marketFor(o.key)!] : "No market"} · default ${priceUsdFor("stripe", o.key).toFixed(2)}
                  </div>
                </div>
                <strong style={{ fontSize: 15 }}>${Number(o.amount_usd).toFixed(2)}</strong>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "6px 12px", fontSize: 13, color: "var(--red)", marginLeft: "auto" }}
                  disabled={saving === `country:${o.key}`}
                  onClick={() => void remove("country", o.key)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
