"use client";

import { FormEvent, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { supabase } from "@/lib/supabase";
import type { Bill } from "@/lib/types";
import {  fmt, ukDate , sym } from "@/lib/format";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";

type Tab = "upcoming" | "overdue" | "paid";

interface ReminderPref {
  bill_id: string;
  bill_name: string;
  due_date: string;
  channel: "email" | "sms" | "whatsapp";
  days_before: number;
  destination: string;
}

/** Paid add-on: configure a one-shot bill reminder (email / SMS / WhatsApp). */
function ReminderModal({
  bill,
  existing,
  onClose,
  onSaved,
  onRemoved,
}: {
  bill: Bill;
  existing?: ReminderPref;
  onClose: () => void;
  onSaved: (p: ReminderPref) => void;
  onRemoved: (billId: string) => void;
}) {
  const t = useTranslations("Pages.bills");
  const { user, toast } = useAppData();
  const [channel, setChannel] = useState<ReminderPref["channel"]>(existing?.channel ?? "email");
  const [daysBefore, setDaysBefore] = useState(existing?.days_before ?? 1);
  const [destination, setDestination] = useState(existing?.destination ?? user?.email ?? "");
  const [saving, setSaving] = useState(false);

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      // Local admin proves itself by email; real users by their JWT.
      "x-admin-email": user?.email ?? "",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          billId: bill.id,
          billName: bill.name,
          amount: bill.amount,
          currency: user?.currency ?? "USD",
          dueDate: bill.due,
          channel,
          daysBefore,
          destination: destination.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      onSaved({
        bill_id: String(bill.id),
        bill_name: bill.name,
        due_date: bill.due,
        channel,
        days_before: daysBefore,
        destination: destination.trim(),
      });
      toast(t("toastReminderSet", { name: bill.name }));
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("toastSaveFail"), "x");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      await fetch(`/api/reminders?billId=${encodeURIComponent(String(bill.id))}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      onRemoved(String(bill.id));
      toast(t("toastReminderRemoved"));
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={t("reminderTitle", { name: bill.name })} onClose={onClose}>
      <form onSubmit={handleSave}>
        <div className="field">
          <label>{t("sendVia")}</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value as ReminderPref["channel"])}>
            <option value="email">{t("chEmail")}</option>
            <option value="sms">{t("chSms")}</option>
            <option value="whatsapp">{t("chWhatsapp")}</option>
          </select>
        </div>
        <div className="field">
          <label>{channel === "email" ? t("destEmail") : t("destPhone")}</label>
          <input
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={channel === "email" ? "you@example.com" : "+263771234567"}
          />
        </div>
        <div className="field">
          <label>{t("timing")}</label>
          <select value={daysBefore} onChange={(e) => setDaysBefore(Number(e.target.value))}>
            <option value={0}>{t("optDue")}</option>
            <option value={1}>{t("opt1")}</option>
            <option value={3}>{t("opt3")}</option>
            <option value={7}>{t("opt7")}</option>
          </select>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-500)", margin: "4px 0 14px" }}>
          {t("reminderNote")}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} type="submit" disabled={saving}>
            {saving ? t("saving") : existing ? t("updateReminder") : t("setReminder")}
          </button>
          {existing && (
            <button type="button" className="btn btn-ghost" onClick={handleRemove} disabled={saving}>
              {t("remove")}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function AddBillModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.bills");
  const { addBill, toast } = useAppData();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    addBill({ name, amount: parseFloat(amount) || 0, due, icon: "receipt" });
    toast(t("toastAdded", { name }));
    onClose();
  }

  return (
    <Modal title={t("addTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>{t("billName")}</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t("phBillName")} />
        </div>
        <div className="field">
          <label>{t("amount", { sym: sym() })}</label>
          <input required type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("dueDate")}</label>
          <input required type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("addBtn")}</button>
      </form>
    </Modal>
  );
}

export default function BillsPage() {
  const t = useTranslations("Pages.bills");
  const { bills, markBillPaid, toast, user } = useAppData();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [reminderBill, setReminderBill] = useState<Bill | null>(null);
  const [prefs, setPrefs] = useState<Record<string, ReminderPref>>({});

  // Saved reminder prefs from the server (paid add-on). Best-effort — the
  // bills list itself works whether or not the reminders table exists.
  const loadPrefs = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/reminders", {
        headers: {
          "x-admin-email": user?.email ?? "",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      const map: Record<string, ReminderPref> = {};
      (json.reminders ?? []).forEach((r: ReminderPref) => { map[r.bill_id] = r; });
      setPrefs(map);
    } catch {
      /* reminders unavailable — bills list still works */
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => void loadPrefs());
  }, [loadPrefs]);

  function openReminder(b: Bill) {
    if (!user?.isPaid) {
      toast(t("toastPaid"), "x");
      router.push("/payment");
      return;
    }
    setReminderBill(b);
  }

  const filtered = useMemo(() => {
    return bills.filter((b) => 
      b.status === tab && 
      b.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [bills, tab, search]);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
        </div>
      </div>
      <div className="tabs" style={{ marginBottom: 18 }}>
        {(["upcoming", "overdue", "paid"] as Tab[]).map((tabKey) => (
          <button key={tabKey} className={"tab-btn" + (tab === tabKey ? " active" : "")} onClick={() => setTab(tabKey)}>
            {t(tabKey)}
          </button>
        ))}
      </div>
      <FilterBar
        searchPlaceholder={t("phSearch")}
        onSearchChange={setSearch}
      />
      <div className="grid grid-2">
        {filtered.length === 0 && <p style={{ color: "var(--ink-500)" }}>{t("empty")}</p>}
        {filtered.map((b) => {
          const badge =
            b.status === "paid" ? (
              <span className="badge badge-green">{t("badgePaid")}</span>
            ) : b.status === "overdue" ? (
              <span className="badge badge-red">{t("badgeOverdue", { days: Math.abs(b.daysLeft) })}</span>
            ) : (
              <span className="badge badge-amber">
                {t("badgeLeft", { days: b.daysLeft })}
              </span>
            );
          return (
            <div key={b.id} className="glass-card hoverable bill-card">
              <div className="bill-ic">
                <Icon name={b.icon} size={19} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{t("due", { date: ukDate(b.due) })}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>{fmt(b.amount)}</div>
                {badge}
                {b.status !== "paid" && (
                  <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() => openReminder(b)}
                      title={prefs[String(b.id)] ? t("editReminderTip") : t("setReminderTip")}
                    >
                      <Icon name="bell" size={13} />{" "}
                      {prefs[String(b.id)]
                        ? t("reminderMeta", { channel: prefs[String(b.id)].channel, when: prefs[String(b.id)].days_before === 0 ? t("onDueDate") : t("daysBefore", { days: prefs[String(b.id)].days_before }) })
                        : t("remindMe")}
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() => { markBillPaid(b.id); toast(t("toastPaidBill", { name: b.name })); }}
                    >
                      {t("markPaid")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Icon name="plus" size={16} /> {t("addBtn")}
        </button>
      </div>
      {modalOpen && <AddBillModal onClose={() => setModalOpen(false)} />}
      {reminderBill && (
        <ReminderModal
          bill={reminderBill}
          existing={prefs[String(reminderBill.id)]}
          onClose={() => setReminderBill(null)}
          onSaved={(p) => setPrefs((prev) => ({ ...prev, [p.bill_id]: p }))}
          onRemoved={(billId) =>
            setPrefs((prev) => {
              const next = { ...prev };
              delete next[billId];
              return next;
            })
          }
        />
      )}
    </>
  );
}
