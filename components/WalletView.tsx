"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { useAppData } from "@/lib/AppDataContext";
import {
  useWallet, openWallet, walletCredit, walletDebit,
  issueCard, setCardStatus,
  CardNetwork, CardKind, WalletCard, Rail,
} from "@/lib/walletStore";
import { ukDate } from "@/lib/format";
import { usd } from "@/lib/payslip";

const th = { padding: "12px 8px", fontWeight: 600, fontSize: 13 } as const;
const td = { padding: "12px 8px", fontSize: 13 } as const;

const NETWORK_STYLE: Record<CardNetwork, { bg: string; badge: string }> = {
  ZimSwitch: { bg: "linear-gradient(135deg,#0f4c81,#1b6bb3)", badge: "ZIMSWITCH" },
  Visa: { bg: "linear-gradient(135deg,#1a1f71,#2f3bb3)", badge: "VISA" },
  Mastercard: { bg: "linear-gradient(135deg,#5b1a2e,#8f2d4d)", badge: "MASTERCARD" },
};

function CardFace({ card, onToggle }: { card: WalletCard; onToggle: () => void }) {
  const t = useTranslations("Pages.wallet");
  const style = NETWORK_STYLE[card.network];
  return (
    <div style={{ minWidth: 250, flex: "0 0 auto" }}>
      <div style={{
        background: style.bg, borderRadius: 16, padding: "16px 18px", color: "#fff",
        boxShadow: "0 8px 24px rgba(0,0,0,.18)", position: "relative", overflow: "hidden",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <span style={{ fontSize: 11, letterSpacing: 2, fontWeight: 800, opacity: .9 }}>{style.badge}</span>
          <span className="chip" style={{ background: "rgba(255,255,255,.18)", color: "#fff", fontSize: 10.5 }}>
            {card.kind === "virtual" ? t("kindVirtual") : t("kindPhysical")}
          </span>
        </div>
        <div style={{ fontSize: 17, letterSpacing: 2.5, fontWeight: 700, marginBottom: 16, fontFamily: "monospace" }}>
          •••• •••• •••• {card.last4}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 9.5, opacity: .7, textTransform: "uppercase", letterSpacing: 1 }}>{t("cardHolder")}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>{card.holder}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9.5, opacity: .7, textTransform: "uppercase", letterSpacing: 1 }}>{t("cardSpends")}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{card.source === "Early Pay" ? t("sourceEwa") : t("sourceWallet")}</div>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{card.expiry}</div>
        </div>
        <div style={{ position: "absolute", top: 12, right: 14, opacity: .5 }}><Icon name="wifi" size={18} /></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "0 4px" }}>
        <span className={"badge " + (card.status === "Active" ? "badge-green" : card.status === "Ordered" ? "badge-amber" : "badge-red")}>
          {card.status === "Active" ? t("statusActive") : card.status === "Ordered" ? t("statusOrdered") : t("statusFrozen")}
        </span>
        {card.status !== "Ordered" && (
          <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11.5 }} onClick={onToggle}>
            {card.status === "Active" ? t("freeze") : t("unfreeze")}
          </button>
        )}
      </div>
    </div>
  );
}

function IssueCardModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Pages.wallet");
  const { user, toast } = useAppData();
  const [network, setNetwork] = useState<CardNetwork>("ZimSwitch");
  const [kind, setKind] = useState<CardKind>("virtual");
  const [source, setSource] = useState<WalletCard["source"]>("Wallet");

  function submit(e: FormEvent) {
    e.preventDefault();
    issueCard(network, kind, user?.name ?? "Cardholder", source);
    toast(kind === "virtual" ? t("toastVirtualIssued", { network }) : t("toastOrdered", { network }), "check-circle");
    onClose();
  }

  return (
    <Modal title={t("issueTitle")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>{t("issueNetwork")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={network} onChange={(e) => setNetwork(e.target.value as CardNetwork)}>
            <option value="ZimSwitch">ZimSwitch</option>
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
          </select>
        </div>
        <div className="field">
          <label>{t("issueKind")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={kind} onChange={(e) => setKind(e.target.value as CardKind)}>
            <option value="virtual">{t("kindVirtual")} — {t("kindVirtualHint")}</option>
            <option value="physical">{t("kindPhysical")} — {t("kindPhysicalHint")}</option>
          </select>
        </div>
        <div className="field">
          <label>{t("issueSource")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={source} onChange={(e) => setSource(e.target.value as WalletCard["source"])}>
            <option value="Wallet">{t("sourceWallet")}</option>
            <option value="Early Pay">{t("sourceEwa")}</option>
          </select>
          <p style={{ fontSize: 12, color: "var(--ink-500)", margin: "6px 0 0" }}>{t("issueSourceHint")}</p>
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit">{t("issueBtn")}</button>
      </form>
    </Modal>
  );
}

function SendModal({ balance, onClose }: { balance: number; onClose: () => void }) {
  const t = useTranslations("Pages.wallet");
  const { toast } = useAppData();
  const [rail, setRail] = useState<"ZIPIT" | "RTGS">("ZIPIT");
  const [dest, setDest] = useState("");
  const [amount, setAmount] = useState("");
  const amt = parseFloat(amount) || 0;
  const over = amt > balance;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (amt <= 0 || over) return;
    const ok = walletDebit(amt, rail === "ZIPIT" ? t("txnZipitOut") : t("txnRtgsOut"), rail, dest);
    if (!ok) { toast(t("insufficient"), "x"); return; }
    toast(rail === "ZIPIT" ? t("toastZipitSent", { amount: usd(amt) }) : t("toastRtgsSent", { amount: usd(amt) }), "check-circle");
    onClose();
  }

  return (
    <Modal title={t("sendTitle")} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>{t("sendRail")}</label>
          <select className="settings-select" style={{ width: "100%" }} value={rail} onChange={(e) => setRail(e.target.value as "ZIPIT" | "RTGS")}>
            <option value="ZIPIT">ZIPIT — {t("railZipitHint")}</option>
            <option value="RTGS">RTGS — {t("railRtgsHint")}</option>
          </select>
        </div>
        <div className="field">
          <label>{rail === "ZIPIT" ? t("sendDestZipit") : t("sendDestRtgs")}</label>
          <input required value={dest} onChange={(e) => setDest(e.target.value)} placeholder={rail === "ZIPIT" ? t("destZipitPh") : t("destRtgsPh")} />
        </div>
        <div className="field">
          <label>{t("sendAmount")}</label>
          <input required type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        {over && <p style={{ fontSize: 12.5, color: "var(--red)", margin: "-4px 0 10px" }}>{t("insufficient")}</p>}
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={amt <= 0 || over}>
          {rail === "ZIPIT" ? t("sendZipit") : t("sendRtgs")}
        </button>
      </form>
    </Modal>
  );
}

export default function WalletView() {
  const t = useTranslations("Pages.wallet");
  const { toast } = useAppData();
  const w = useWallet();
  const [sendOpen, setSendOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  const railLabel = (r: Rail) =>
    r === "ZIPIT" ? "ZIPIT" : r === "RTGS" ? "RTGS" : r === "EWA" ? t("railEwa") : r === "Card" ? t("railCard") : r === "TopUp" ? "ZIPIT" : t("railInternal");

  if (!w.opened) {
    return (
      <div className="glass-card card-pad" style={{ textAlign: "center", padding: "44px 24px" }}>
        <div className="merchant-ic" style={{ width: 56, height: 56, borderRadius: 18, margin: "0 auto 16px" }}>
          <Icon name="wallet" size={26} />
        </div>
        <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{t("openTitle")}</h3>
        <p style={{ fontSize: 13.5, color: "var(--ink-500)", maxWidth: 460, margin: "0 auto 20px" }}>{t("openText")}</p>
        <ul style={{ display: "inline-flex", flexDirection: "column", gap: 8, textAlign: "left", fontSize: 13.5, color: "var(--ink-700)", marginBottom: 24 }}>
          <li><Icon name="check" size={14} style={{ marginRight: 8, color: "var(--green)" }} />{t("openB1")}</li>
          <li><Icon name="check" size={14} style={{ marginRight: 8, color: "var(--green)" }} />{t("openB2")}</li>
          <li><Icon name="check" size={14} style={{ marginRight: 8, color: "var(--green)" }} />{t("openB3")}</li>
        </ul>
        <div>
          <button className="btn btn-primary" onClick={() => { openWallet(); toast(t("toastOpened"), "check-circle"); }}>
            <Icon name="plus" size={16} style={{ marginRight: 8 }} />{t("openBtn")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card card-pad" style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="stat-label">{t("balance")}</div>
          <div className="stat-value" style={{ fontSize: 34 }}>{usd(w.balance)}</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", fontFamily: "monospace", letterSpacing: 1 }}>{w.accountNo}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => setSendOpen(true)}>
            <Icon name="send" size={15} style={{ marginRight: 8 }} />{t("sendBtn")}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => { walletCredit(100, t("txnTopUp"), "TopUp"); toast(t("toastTopUp", { amount: usd(100) }), "check-circle"); }}
          >
            <Icon name="download" size={15} style={{ marginRight: 8 }} />{t("topUpBtn")}
          </button>
        </div>
      </div>

      <div className="card-head" style={{ marginBottom: 12 }}>
        <h3 style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{t("cardsTitle")}</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => setCardOpen(true)}>
          <Icon name="plus" size={14} style={{ marginRight: 6 }} />{t("issueBtn")}
        </button>
      </div>
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12, marginBottom: 12 }}>
        {w.cards.length === 0 && (
          <div className="glass-card card-pad" style={{ width: "100%", textAlign: "center", color: "var(--ink-500)", fontSize: 13.5 }}>
            {t("noCards")}
          </div>
        )}
        {w.cards.map((c) => (
          <CardFace key={c.id} card={c} onToggle={() => setCardStatus(c.id, c.status === "Active" ? "Frozen" : "Active")} />
        ))}
      </div>

      <div className="glass-card card-pad">
        <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>{t("txnsTitle")}</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={th}>{t("thTxn")}</th>
              <th style={th}>{t("thRail")}</th>
              <th style={th}>{t("thCounterparty")}</th>
              <th style={th}>{t("thAmount")}</th>
              <th style={th}>{t("thStatus")}</th>
              <th style={th}>{t("thDate")}</th>
            </tr>
          </thead>
          <tbody>
            {w.txns.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>{t("noTxns")}</td></tr>
            )}
            {w.txns.map((x) => (
              <tr key={x.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ ...td, fontWeight: 600 }}>{x.label}</td>
                <td style={td}><span className="chip">{railLabel(x.rail)}</span></td>
                <td style={td}>{x.counterparty ?? "—"}</td>
                <td style={{ ...td, fontWeight: 700, color: x.direction === "in" ? "var(--green)" : "var(--red)" }}>
                  {x.direction === "in" ? "+" : "−"}{usd(x.amount)}
                </td>
                <td style={td}>
                  <span className={"badge " + (x.status === "Done" ? "badge-green" : x.status === "Processing" ? "badge-amber" : "badge-red")}>
                    {x.status === "Done" ? t("txnDone") : x.status === "Processing" ? t("txnProcessing") : t("txnFailed")}
                  </span>
                </td>
                <td style={td}>{ukDate(x.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sendOpen && <SendModal balance={w.balance} onClose={() => setSendOpen(false)} />}
      {cardOpen && <IssueCardModal onClose={() => setCardOpen(false)} />}
    </>
  );
}
