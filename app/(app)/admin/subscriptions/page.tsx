"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import CountUp from "@/components/CountUp";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  is_paid: boolean;
  paid_until: string | null;
  created_at: string;
  payment?: {
    provider: string;
    method: string | null;
    amount: number | null;
    currency: string;
    reference: string | null;
    paid_at: string;
  } | null;
}

export default function SubscriptionsPage() {
  const t = useTranslations("Pages.adm_subscriptions");
  const { user } = useAppData();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: await adminHeaders(user?.email) });
      const data = await res.json().catch(() => null);
      setUsers(data?.users ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  const paid = useMemo(() => users.filter((u) => u.is_paid), [users]);
  const active = useMemo(
    () => paid.filter((u) => !u.paid_until || new Date(u.paid_until).getTime() > Date.now()),
    [paid]
  );
  const expired = paid.length - active.length;
  const newThisMonth = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return paid.filter((u) => u.payment && new Date(u.payment.paid_at) >= start).length;
  }, [paid]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return paid.filter((u) =>
      !q || [u.name, u.email, u.payment?.provider, u.payment?.reference]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [paid, search]);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          style={{
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--card-border)",
            background: "transparent",
            color: "inherit",
            fontSize: 14,
            width: 240,
          }}
        />
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("activeSubscriptions")}</div>
          <div className="stat-value"><CountUp end={active.length} decimals={0} /></div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("expiredSubscriptions")}</div>
          <div className="stat-value"><CountUp end={expired} decimals={0} /></div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("newThisMonth")}</div>
          <div className="stat-value"><CountUp end={newThisMonth} decimals={0} /></div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("totalPaidUsers")}</div>
          <div className="stat-value"><CountUp end={paid.length} decimals={0} /></div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div className="card-head">
          <h3>{t("recentSubscriptions")}</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colUser")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colPlan")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colPayment")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colExpiry")}</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "24px 8px", fontSize: 13, color: "var(--ink-500)", textAlign: "center" }}>
                    {loading ? t("loading") : t("emptyState")}
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const isActive = !u.paid_until || new Date(u.paid_until).getTime() > Date.now();
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name || "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 13 }}>{t("planAnnual")}</td>
                    <td style={{ padding: "12px 8px", fontSize: 13 }}>
                      {u.payment
                        ? `${u.payment.provider}${u.payment.method ? ` (${u.payment.method})` : ""} · ${u.payment.currency.toUpperCase()} ${u.payment.amount?.toFixed(2) ?? "—"}`
                        : "—"}
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 13 }}>
                      {u.paid_until ? new Date(u.paid_until).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <span className={`badge ${isActive ? "badge-green" : "badge-amber"}`}>
                        {isActive ? t("statusActive") : t("statusExpired")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
