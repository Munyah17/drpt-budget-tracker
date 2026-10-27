"use client";

import { FormEvent, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
      toast(`Reminder set — ${bill.name}`);
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save reminder", "x");
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
      toast("Reminder removed");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Remind me — ${bill.name}`} onClose={onClose}>
      <form onSubmit={handleSave}>
        <div className="field">
          <label>Send via</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value as ReminderPref["channel"])}>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        <div className="field">
          <label>{channel === "email" ? "Email address" : "Phone number (E.164 format)"}</label>
          <input
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={channel === "email" ? "you@example.com" : "+263771234567"}
          />
        </div>
        <div className="field">
          <label>Timing</label>
          <select value={daysBefore} onChange={(e) => setDaysBefore(Number(e.target.value))}>
            <option value={0}>On the due date</option>
            <option value={1}>1 day before</option>
            <option value={3}>3 days before</option>
            <option value={7}>7 days before</option>
          </select>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-500)", margin: "4px 0 14px" }}>
          Sends once when the window opens. Email works now — SMS &amp; WhatsApp send once a
          messaging provider is connected.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} type="submit" disabled={saving}>
            {saving ? "Saving…" : existing ? "Update reminder" : "Set reminder"}
          </button>
          {existing && (
            <button type="button" className="btn btn-ghost" onClick={handleRemove} disabled={saving}>
              Remove
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function AddBillModal({ onClose }: { onClose: () => void }) {
  const { addBill, toast } = useAppData();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    addBill({ name, amount: parseFloat(amount) || 0, due, icon: "receipt" });
    toast(`Bill "${name}" added`);
    onClose();
  }

  return (
    <Modal title="Add Bill" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Bill name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Council Tax" />
        </div>
        <div className="field">
          <label>Amount ({sym()})</label>
          <input required type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label>Due date</label>
          <input required type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Add Bill</button>
      </form>
    </Modal>
  );
}

export default function BillsPage() {
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
      toast("Bill reminders are part of the paid plan", "x");
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
          <h2 className="section-title">Bills</h2>
          <p className="section-sub">Stay ahead of every due date</p>
        </div>
      </div>
      <div className="tabs" style={{ marginBottom: 18 }}>
        {(["upcoming", "overdue", "paid"] as Tab[]).map((t) => (
          <button key={t} className={"tab-btn" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <FilterBar
        searchPlaceholder="Search bills..."
        onSearchChange={setSearch}
      />
      <div className="grid grid-2">
        {filtered.length === 0 && <p style={{ color: "var(--ink-500)" }}>No bills in this tab.</p>}
        {filtered.map((b) => {
          const badge =
            b.status === "paid" ? (
              <span className="badge badge-green">Paid</span>
            ) : b.status === "overdue" ? (
              <span className="badge badge-red">{Math.abs(b.daysLeft)} days overdue</span>
            ) : (
              <span className="badge badge-amber">
                {b.daysLeft} day{b.daysLeft === 1 ? "" : "s"} left
              </span>
            );
          return (
            <div key={b.id} className="glass-card hoverable bill-card">
              <div className="bill-ic">
                <Icon name={b.icon} size={19} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>Due {ukDate(b.due)}</div>
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
                      title={prefs[String(b.id)] ? "Edit reminder" : "Set a reminder"}
                    >
                      <Icon name="bell" size={13} />{" "}
                      {prefs[String(b.id)]
                        ? `${prefs[String(b.id)].channel} · ${prefs[String(b.id)].days_before === 0 ? "on due date" : `${prefs[String(b.id)].days_before}d before`}`
                        : "Remind me"}
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() => { markBillPaid(b.id); toast(`${b.name} marked as paid`); }}
                    >
                      Mark paid
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
          <Icon name="plus" size={16} /> Add Bill
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
