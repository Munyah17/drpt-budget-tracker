"use client";

import { useState, useMemo, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import { useCorpStore, updateCorp, nextId, daysUntil, CorpDoc } from "@/lib/corpStore";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;
const DOC_TYPES = ["employmentContract", "workPermit", "passportId", "professionalCertificate", "driversLicence", "medicalCertificate", "visa"] as const;

function expiryBadge(days: number) {
  if (days < 0) return { cls: "badge-red", key: "badgeExpired" };
  if (days <= 30) return { cls: "badge-red", key: "badgeDaysLeft" };
  if (days <= 90) return { cls: "badge-amber", key: "badgeDaysLeft" };
  return { cls: "badge-green", key: "badgeDaysLeft" };
}

function DocModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.corp_compliance");
  const { toast } = useAppData();
  const [employee, setEmployee] = useState("");
  const [docType, setDocType] = useState<string>(DOC_TYPES[0]);
  const [expires, setExpires] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    updateCorp((s) => ({
      ...s,
      docs: [...s.docs, { id: nextId("doc"), employee, docType, expires }],
    }));
    toast(t("toastRegistered"), "check-circle");
    onClose();
  }

  return (
    <Modal title={t("registerDocument")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>{t("thEmployee")}</label><input required value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder={t("fullNamePlaceholder")} /></div>
        <div className="field">
          <label>{t("fieldDocType")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((d) => <option key={d} value={d}>{t(`docType.${d}`)}</option>)}
          </select>
        </div>
        <div className="field"><label>{t("fieldExpiry")}</label><input required type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("register")}</button>
      </form>
    </Modal>
  );
}

export default function CompliancePage() {
  const t = useTranslations("Pages.corp_compliance");
  const { toast } = useAppData();
  const store = useCorpStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);

  const docTypeLabel = (v: string) => (t.has(`docType.${v}`) ? t(`docType.${v}`) : v);

  const withDays = useMemo(
    () =>
      store.docs
        .map((d) => ({ ...d, days: daysUntil(d.expires) }))
        .sort((a, b) => a.days - b.days),
    [store.docs]
  );

  const filtered = useMemo(
    () =>
      withDays.filter((d) => {
        if (statusFilter === "Expired" && d.days >= 0) return false;
        if (statusFilter === "Expiring" && (d.days < 0 || d.days > 90)) return false;
        if (statusFilter === "Valid" && d.days <= 90) return false;
        return (
          d.employee.toLowerCase().includes(search.toLowerCase()) ||
          d.docType.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [withDays, search, statusFilter]
  );

  const expired = withDays.filter((d) => d.days < 0).length;
  const expiring = withDays.filter((d) => d.days >= 0 && d.days <= 90).length;

  function remove(doc: CorpDoc) {
    updateCorp((s) => ({ ...s, docs: s.docs.filter((x) => x.id !== doc.id) }));
    toast(t("toastRemoved"), "trash-2");
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />{t("registerDocument")}
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad"><div className="stat-label">{t("statTracked")}</div><div className="stat-value">{store.docs.length}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">{t("statExpired")}</div><div className="stat-value" style={{ color: expired ? "var(--red)" : undefined }}>{expired}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">{t("statExpiring")}</div><div className="stat-value" style={{ color: expiring ? "var(--amber)" : undefined }}>{expiring}</div></div>
        <div className="glass-card card-pad"><div className="stat-label">{t("statValid")}</div><div className="stat-value" style={{ color: "var(--green)" }}>{withDays.filter((d) => d.days > 90).length}</div></div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[
            { value: "Expired", label: t("statExpired") },
            { value: "Expiring", label: t("statExpiring") },
            { value: "Valid", label: t("filterValid") },
          ]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>{t("thEmployee")}</th><th style={th}>{t("thDocument")}</th><th style={th}>{t("thExpires")}</th>
              <th style={th}>{t("thStatus")}</th><th style={th}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                {t("emptyState")}
              </td></tr>
            )}
            {filtered.map((d) => {
              const b = expiryBadge(d.days);
              return (
                <tr key={d.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ ...td, fontWeight: 600 }}>{d.employee}</td>
                  <td style={td}>{docTypeLabel(d.docType)}</td>
                  <td style={td}>{d.expires}</td>
                  <td style={td}><span className={"badge " + b.cls}>{t(b.key, { days: d.days })}</span></td>
                  <td style={td}>
                    {d.days <= 30 && d.days >= 0 && (
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--rose-600)" }}
                        onClick={() => toast(t("toastReminder", { employee: d.employee, docType: docTypeLabel(d.docType) }), "bell")}>
                        <Icon name="bell" size={13} style={{ marginRight: 4 }} />{t("remind")}
                      </button>
                    )}
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }} onClick={() => remove(d)}>
                      <Icon name="trash-2" size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {creating && <DocModal onClose={() => setCreating(false)} />}
    </>
  );
}
