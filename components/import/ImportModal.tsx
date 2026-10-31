"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Capacitor } from "@capacitor/core";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import { useAppData } from "@/lib/AppDataContext";
import { authedFetch } from "@/lib/clientApi";
import { trackEvent } from "@/lib/analytics";
import { EXPENSE_CATS, INCOME_CATEGORIES } from "@/lib/data";

interface ReviewItem {
  include: boolean;
  type: "expense" | "income";
  payee: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  confidence: number;
}

type Stage = "pick" | "busy" | "review";

const FILE_ACCEPT = "image/*,.pdf,.csv,.txt,.xlsx";

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

/**
 * Scan a receipt / upload a statement or PoP and let the server extract the
 * transactions. Everything lands in an editable review list — nothing is
 * added until the user confirms. Receipt camera only shows on native.
 */
export default function ImportModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.import");
  const { user, addExpense, addIncome, accounts, toast } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("pick");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [docId, setDocId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const native = typeof window !== "undefined" && Capacitor.isNativePlatform();

  // Modal mounts only when opened — one event per import session
  useEffect(() => { trackEvent("import_open"); }, []);

  async function sendForExtraction(base64: string, mime: string, filename: string, source: string) {
    if (!user) return;
    setStage("busy");
    setError("");
    try {
      const res = await authedFetch(user.id, "/api/import", {
        method: "POST",
        body: JSON.stringify({ base64, mime, filename, source }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.items) || !data.items.length) {
        trackEvent("import_failed", { source, detail: data.error ?? "empty" });
        setError(data.error ?? t("errGeneric"));
        setStage("pick");
        return;
      }
      setDocId(data.documentId ?? null);
      trackEvent("import_extracted", { source, count: data.items.length });
      setItems(
        data.items.map((i: Omit<ReviewItem, "include">) => ({
          include: true,
          type: i.type === "income" ? "income" : "expense",
          payee: i.payee ?? "",
          amount: i.amount ?? 0,
          currency: i.currency ?? "GBP",
          date: i.date ?? new Date().toISOString().slice(0, 10),
          category: i.category ?? "Other",
          confidence: typeof i.confidence === "number" ? i.confidence : 0.7,
        }))
      );
      setStage("review");
    } catch {
      trackEvent("import_failed", { source, detail: "network" });
      setError(t("errService"));
      setStage("pick");
    }
  }

  async function handleCamera() {
    try {
      const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt, // camera or gallery — user's choice
        quality: 80,
        correctOrientation: true,
      });
      if (!photo.base64String) return;
      await sendForExtraction(photo.base64String, `image/${photo.format || "jpeg"}`, "receipt", "camera");
    } catch { /* user cancelled */ }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const base64 = await fileToBase64(file);
    await sendForExtraction(base64, file.type, file.name, "upload");
  }

  function patchItem(i: number, patch: Partial<ReviewItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function handleConfirm() {
    const chosen = items.filter((i) => i.include && i.amount > 0 && i.date);
    if (!chosen.length) { onClose(); return; }
    for (const i of chosen) {
      if (i.type === "income") {
        addIncome({
          source: i.payee || t("fallbackIncome"),
          category: INCOME_CATEGORIES.includes(i.category) ? i.category : "Gift",
          date: i.date,
          amount: i.amount,
          recurring: "None",
        });
      } else {
        addExpense({
          merchant: i.payee || t("fallbackExpense"),
          category: EXPENSE_CATS.includes(i.category) ? i.category : "Other",
          date: i.date,
          amount: i.amount,
          account: accounts[0]?.name ?? "Cash",
          method: "Bank Transfer",
          tags: ["import"],
          recurring: false,
        });
      }
    }
    if (docId && user) {
      void authedFetch(user.id, "/api/import/confirm", {
        method: "POST",
        body: JSON.stringify({ documentId: docId, acceptedCount: chosen.length }),
      }).catch(() => {});
    }
    toast(t("toastAdded", { count: chosen.length }), "check-circle");
    trackEvent("import_confirmed", { count: chosen.length });
    onClose();
  }

  const chosenCount = items.filter((i) => i.include).length;

  return (
    <Modal title={t("title")} onClose={onClose}>
      {stage === "pick" && (
        <>
          <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 14 }}>{t("desc")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {native && (
              <button className="btn btn-primary" onClick={handleCamera}>
                <Icon name="camera" size={16} style={{ marginRight: 8 }} />{t("cameraBtn")}
              </button>
            )}
            <button className={"btn " + (native ? "btn-ghost" : "btn-primary")} onClick={() => fileRef.current?.click()}>
              <Icon name="upload-cloud" size={16} style={{ marginRight: 8 }} />{t("fileBtn")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={FILE_ACCEPT}
              style={{ display: "none" }}
              onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ""; }}
            />
          </div>
          {error && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 12 }}>{error}</p>}
        </>
      )}

      {stage === "busy" && (
        <div style={{ textAlign: "center", padding: "30px 0", color: "var(--ink-500)", fontSize: 14 }}>
          <Icon name="scan-line" size={28} style={{ color: "var(--rose-600)", marginBottom: 10 }} />
          <p style={{ margin: 0 }}>{t("busy")}</p>
        </div>
      )}

      {stage === "review" && (
        <>
          <p style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 10 }}>{t("reviewHint")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "50vh", overflowY: "auto" }}>
            {items.map((item, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: "10px 12px",
                  opacity: item.include ? 1 : 0.45,
                  border: item.confidence < 0.6 ? "1px solid var(--amber)" : "1px solid var(--card-border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={item.include}
                    onChange={(e) => patchItem(i, { include: e.target.checked })}
                    aria-label={t("rowInclude")}
                  />
                  <button
                    type="button"
                    className={"badge " + (item.type === "income" ? "badge-green" : "badge-red")}
                    onClick={() =>
                      patchItem(i, {
                        type: item.type === "income" ? "expense" : "income",
                        category: item.type === "income" ? EXPENSE_CATS[0] : INCOME_CATEGORIES[0],
                      })
                    }
                    data-tip={t("typeToggleTip")}
                    style={{ border: "none", cursor: "pointer" }}
                  >
                    {item.type === "income" ? t("typeIncome") : t("typeExpense")}
                  </button>
                  <input
                    value={item.payee}
                    onChange={(e) => patchItem(i, { payee: e.target.value })}
                    placeholder={t("payeePh")}
                    style={{ flex: 1, fontWeight: 600 }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr", gap: 8 }}>
                  <input
                    type="number" step="0.01" min="0" value={item.amount || ""}
                    onChange={(e) => patchItem(i, { amount: parseFloat(e.target.value) || 0 })}
                    aria-label={t("colAmount")}
                  />
                  <input
                    type="date" value={item.date}
                    onChange={(e) => patchItem(i, { date: e.target.value })}
                    aria-label={t("colDate")}
                  />
                  <select
                    value={item.category}
                    onChange={(e) => patchItem(i, { category: e.target.value })}
                    aria-label={t("colCategory")}
                  >
                    {(item.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATS).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {item.confidence < 0.6 && (
                  <p style={{ fontSize: 11.5, color: "var(--amber)", margin: "6px 0 0" }}>
                    <Icon name="alert-triangle" size={11} style={{ marginRight: 4 }} />{t("lowConfidence")}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              {t("cancel")}
            </button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleConfirm} disabled={!chosenCount}>
              <Icon name="check" size={14} style={{ marginRight: 6 }} />{t("addBtn", { count: chosenCount })}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
