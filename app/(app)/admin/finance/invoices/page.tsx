"use client";

import { useState, useMemo, useEffect, useCallback, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { adminHeaders } from "@/lib/adminClient";
import { PRINT_DOC_KEY, PrintDocData } from "@/components/PrintDocument";
import { formatCurrency } from "@/lib/format";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";

interface DocItem {
  description: string;
  qty: number;
  unitPrice: number;
  discount?: number;
}

interface Doc {
  id: string;
  number: string;
  kind: "invoice" | "quotation";
  bill_to_name: string;
  bill_to_lines: string[];
  items: DocItem[];
  subtotal: number;
  extra_totals: { label: string; amount: number }[];
  total: number;
  notes: string[];
  status: string;
  due_date: string | null;
  corporate_id: string | null;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Corporate {
  id: string;
  name: string;
  contact_email: string;
}

/** Issuer details printed on every document. */
const ISSUER = {
  companyName: "WellSpend",
  companyLines: ["Harare, Zimbabwe", "+263 77 390 9307"],
  banking: ["FBC Bank — 6870465460146 (USD)", "Ecocash — 0773 909 307"],
};

const EMPTY_FORM = {
  kind: "invoice" as Doc["kind"],
  corporateId: "",
  clientName: "",
  clientLine: "",
  vat: "15",
  dueDate: "",
  notes: "",
};
const EMPTY_ITEM: DocItem = { description: "", qty: 1, unitPrice: 0 };

const statusBadge = (s: string) =>
  s === "Paid" || s === "Accepted" ? "badge-green" :
  s === "Overdue" || s === "Declined" ? "badge-red" :
  s === "Draft" ? "badge-amber" : "badge-blue";

export default function AdminInvoicesPage() {
  const t = useTranslations("Pages.adm_finance_invoices");
  const { toast, user } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState(EMPTY_FORM);
  const [items, setItems] = useState<DocItem[]>([{ ...EMPTY_ITEM }]);

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/invoices", { headers: await adminHeaders(user?.email) });
      const data = await res.json().catch(() => []);
      setDocs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadDocs();
    (async () => {
      const res = await fetch("/api/admin/corporates", { headers: await adminHeaders(user?.email) });
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) setCorporates(data);
    })();
  }, [loadDocs, user?.email]);

  const filteredData = useMemo(() => {
    return docs.filter((d) =>
      (!kindFilter || d.kind === kindFilter) &&
      (!statusFilter || d.status === statusFilter) &&
      (d.number.toLowerCase().includes(search.toLowerCase()) ||
        d.bill_to_name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [docs, search, statusFilter, kindFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = (iso: string | null) => {
      if (!iso) return false;
      const dt = new Date(iso);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    };
    const invs = docs.filter((d) => d.kind === "invoice");
    return {
      outstanding: invs.filter((d) => d.status !== "Paid").reduce((s, d) => s + Number(d.total), 0),
      overdue: invs.filter((d) => d.status === "Overdue").length,
      issuedThisMonth: docs.filter((d) => thisMonth(d.issued_at ?? d.created_at)).length,
      paidThisMonth: invs.filter((d) => thisMonth(d.paid_at)).reduce((s, d) => s + Number(d.total), 0),
    };
  }, [docs]);

  const liveSubtotal = items.reduce((s, i) => s + i.qty * i.unitPrice - (i.discount ?? 0), 0);
  const liveTotal = liveSubtotal + Math.round(liveSubtotal * (Number(f.vat) || 0)) / 100;

  function updItem(i: number, patch: Partial<DocItem>) {
    setItems((prev) => prev.map((it, x) => (x === i ? { ...it, ...patch } : it)));
  }

  /** Hand the document to /print/invoice via sessionStorage and open it. */
  function openDoc(d: Doc) {
    const doc: PrintDocData = {
      kind: d.kind === "quotation" ? "QUOTATION" : "INVOICE",
      number: d.number,
      date: new Date(d.issued_at ?? d.created_at).toLocaleDateString("en-GB"),
      ...ISSUER,
      billToName: d.bill_to_name,
      billToLines: d.bill_to_lines,
      items: d.items,
      extraTotals: d.extra_totals,
      notes: [
        ...(d.due_date
          ? [d.kind === "quotation"
              ? t("noteValid", { date: d.due_date })
              : t("noteDue", { date: d.due_date })]
          : []),
        ...d.notes,
      ],
      currency: "USD",
    };
    sessionStorage.setItem(PRINT_DOC_KEY, JSON.stringify(doc));
    window.open("/print/invoice", "_blank");
  }

  function openCreate(kind: Doc["kind"]) {
    setF({ ...EMPTY_FORM, kind });
    setItems([{ ...EMPTY_ITEM }]);
    setModalOpen(true);
  }

  async function createDoc(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const corp = corporates.find((c) => c.id === f.corporateId);
    const cleanItems = items
      .map((i) => ({ ...i, description: i.description.trim() }))
      .filter((i) => i.description && i.qty > 0);
    const vatPct = Number(f.vat) || 0;
    const subtotal = cleanItems.reduce((s, i) => s + i.qty * i.unitPrice - (i.discount ?? 0), 0);
    const extraTotals = vatPct > 0
      ? [{ label: `VAT (${vatPct}%)`, amount: Math.round(subtotal * vatPct) / 100 }]
      : [];

    setSaving(true);
    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
      body: JSON.stringify({
        kind: f.kind,
        bill_to_name: corp ? corp.name : f.clientName.trim(),
        bill_to_lines: [
          ...(corp?.contact_email ? [corp.contact_email] : []),
          ...(f.clientLine.trim() ? [f.clientLine.trim()] : []),
        ],
        items: cleanItems,
        extra_totals: extraTotals,
        due_date: f.dueDate || null,
        notes: f.notes.trim() ? [f.notes.trim()] : [],
        corporate_id: corp?.id ?? null,
        status: f.kind === "quotation" ? "Sent" : "Pending",
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast(t("toastError"), "x");
      return;
    }
    const row = (await res.json()) as Doc;
    toast(t("toastCreated", { number: row.number }), "check-circle");
    setModalOpen(false);
    setF(EMPTY_FORM);
    setItems([{ ...EMPTY_ITEM }]);
    loadDocs();
    openDoc(row);
  }

  async function markPaid(d: Doc) {
    const res = await fetch("/api/admin/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await adminHeaders(user?.email)) },
      body: JSON.stringify({ id: d.id, status: "Paid" }),
    });
    if (!res.ok) {
      toast(t("toastError"), "x");
      return;
    }
    toast(t("toastMarkedPaid", { number: d.number }), "check-circle");
    loadDocs();
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => openCreate("quotation")}>
            <Icon name="file-text" size={16} style={{ marginRight: 8 }} />
            {t("newQuotation")}
          </button>
          <button className="btn btn-primary" onClick={() => openCreate("invoice")}>
            <Icon name="plus" size={16} style={{ marginRight: 8 }} />
            {t("newInvoice")}
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statTotalOutstanding")}</div>
          <div className="stat-value">{formatCurrency(stats.outstanding)}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statOverdue")}</div>
          <div className="stat-value">{stats.overdue}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statThisMonth")}</div>
          <div className="stat-value">{stats.issuedThisMonth}</div>
        </div>
        <div className="glass-card card-pad">
          <div className="stat-label">{t("statPaidThisMonth")}</div>
          <div className="stat-value">{formatCurrency(stats.paidThisMonth)}</div>
        </div>
      </div>

      <div className="glass-card card-pad">
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {([
            { v: "", l: t("kindAll") },
            { v: "invoice", l: t("kindInvoices") },
            { v: "quotation", l: t("kindQuotations") },
          ] as const).map((o) => (
            <button
              key={o.v}
              className={`btn ${kindFilter === o.v ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "6px 14px", fontSize: 13 }}
              onClick={() => setKindFilter(o.v)}
            >
              {o.l}
            </button>
          ))}
        </div>
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          statusOptions={[
            { value: "Pending", label: t("statusPending") },
            { value: "Paid", label: t("statusPaid") },
            { value: "Overdue", label: t("statusOverdue") },
            { value: "Sent", label: t("statusSent") },
            { value: "Draft", label: t("statusDraft") },
            { value: "Accepted", label: t("statusAccepted") },
            { value: "Declined", label: t("statusDeclined") },
          ]}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thDoc")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thType")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thClient")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thAmount")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thDue")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thStatus")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {loading ? t("loading") : t("emptyState")}
                </td>
              </tr>
            )}
            {filteredData.map((d) => (
              <tr key={d.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{d.number}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${d.kind === "quotation" ? "badge-amber" : "badge-blue"}`}>
                    {d.kind === "quotation" ? t("badgeQuotation") : t("badgeInvoice")}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{d.bill_to_name}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600 }}>{formatCurrency(Number(d.total))}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{d.due_date ?? "—"}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span className={`badge ${statusBadge(d.status)}`}>{d.status}</span>
                </td>
                <td style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => openDoc(d)} title={t("generate")}>
                    <Icon name="printer" size={14} style={{ marginRight: 4 }} />{t("generate")}
                  </button>
                  {d.kind === "invoice" && d.status !== "Paid" && (
                    <>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => markPaid(d)} title={t("markPaid")}>
                        <Icon name="check" size={14} style={{ marginRight: 4 }} />{t("markPaid")}
                      </button>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => toast(t("toastReminderSent", { number: d.number }), "send")}>
                        <Icon name="send" size={14} style={{ marginRight: 4 }} />{t("remind")}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal
          title={f.kind === "quotation" ? t("createTitleQuotation") : t("createTitleInvoice")}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={createDoc}>
            <div className="field">
              <label>{t("fClient")}</label>
              <select
                className="settings-select"
                style={{ width: "100%" }}
                value={f.corporateId}
                onChange={(e) => setF({ ...f, corporateId: e.target.value })}
              >
                <option value="">{t("fClientNone")}</option>
                {corporates.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {!f.corporateId && (
              <div className="field">
                <label>{t("fClientName")} *</label>
                <input
                  value={f.clientName}
                  onChange={(e) => setF({ ...f, clientName: e.target.value })}
                  placeholder={t("fClientNamePh")}
                  required
                />
              </div>
            )}
            <div className="field">
              <label>{t("fClientLine")}</label>
              <input
                value={f.clientLine}
                onChange={(e) => setF({ ...f, clientLine: e.target.value })}
                placeholder={t("fClientLinePh")}
              />
            </div>

            <div className="field">
              <label>{t("items")} *</label>
              {items.map((it, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 64px 90px 80px 30px", gap: 6, marginBottom: 6 }}>
                  <input placeholder={t("colDesc")} value={it.description} onChange={(e) => updItem(i, { description: e.target.value })} />
                  <input type="number" min={1} placeholder={t("colQty")} value={it.qty || ""} onChange={(e) => updItem(i, { qty: Number(e.target.value) })} />
                  <input type="number" min={0} step="0.01" placeholder={t("colPrice")} value={it.unitPrice || ""} onChange={(e) => updItem(i, { unitPrice: Number(e.target.value) })} />
                  <input type="number" min={0} step="0.01" placeholder={t("colDiscount")} value={it.discount || ""} onChange={(e) => updItem(i, { discount: Number(e.target.value) || undefined })} />
                  <button type="button" className="btn btn-ghost" style={{ padding: "4px 6px" }} onClick={() => setItems(items.filter((_, x) => x !== i))} title={t("removeItem")}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setItems([...items, { ...EMPTY_ITEM }])}>
                <Icon name="plus" size={14} style={{ marginRight: 4 }} />{t("addItem")}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="field">
                <label>{t("fVat")}</label>
                <input type="number" min={0} step="0.1" value={f.vat} onChange={(e) => setF({ ...f, vat: e.target.value })} />
              </div>
              <div className="field">
                <label>{f.kind === "quotation" ? t("fValid") : t("fDue")}</label>
                <input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>{t("fNotes")}</label>
              <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder={t("fNotesPh")} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--card-border)", marginTop: 4, marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{t("total")}</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(liveTotal)}</span>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={saving}>
              {saving ? t("issuing") : t("issue")}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
