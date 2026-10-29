"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { useCashFlow } from "@/lib/CashFlowContext";
import { totalsFor } from "@/lib/cashflow";
import Icon from "@/components/Icon";

interface ChatMsg {
  id: number;
  who: "ai" | "user";
  text: string;
}

const SUGGESTION_KEYS = [
  { label: "sugMoney", q: "sugMoneyQ" },
  { label: "sugCut", q: "sugCutQ" },
  { label: "sugTreat", q: "sugTreatQ" },
  { label: "sugSave", q: "sugSaveQ" },
];

let msgSeq = 1;

export default function AiPage() {
  const t = useTranslations("Pages.ai");
  const { user, currency } = useAppData();
  const { entries } = useCashFlow();
  const SUGGESTIONS = SUGGESTION_KEYS.map((s) => ({ label: t(s.label), q: t(s.q) }));
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: msgSeq++, who: "ai", text: t("welcome") },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  async function sendChat(text: string) {
    if (!text.trim()) return;
    const userMsg = { id: msgSeq++, who: "user" as const, text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    const totals = totalsFor(entries, currency);
    const context = JSON.stringify({
      currency,
      totals,
      recentEntries: entries.slice(0, 30).map((e) => ({
        type: e.type, amount: e.amount, currency: e.currency,
        category: e.category, payee: e.payee, date: e.date.slice(0, 10),
      })),
      userName: user?.name,
    });

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          messages: [
            ...messages.slice(-8).map((m) => ({
              role: m.who === "ai" ? "assistant" : "user",
              content: m.text.replace(/<[^>]+>/g, " "),
            })),
            { role: "user", content: text },
          ],
        }),
      });
      const data = await res.json();
      const reply = res.ok
        ? data.reply
        : t("errReach", { error: data.error ?? t("unknownError") });
      setMessages((prev) => [...prev, { id: msgSeq++, who: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: msgSeq++, who: "ai", text: t("errOffline") },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("sub")}</p>
        </div>
      </div>
      <div className="glass-card card-pad">
        <div className="chat-wrap">
          <div className="chat-scroll" ref={scrollRef}>
            {messages.map((m) => (
              <div className={"msg " + m.who} key={m.id}>
                <div className="msg-avatar">
                  <Icon name={m.who === "ai" ? "heart" : "user"} size={16} />
                </div>
                <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: m.text }} />
              </div>
            ))}
            {typing && (
              <div className="msg ai">
                <div className="msg-avatar">
                  <Icon name="heart" size={16} />
                </div>
                <div className="msg-bubble">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="chat-suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s.label} className="suggest-chip" onClick={() => sendChat(s.q)}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              placeholder={t("phAsk")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChat(input);
              }}
            />
            <button className="send-btn" onClick={() => sendChat(input)} aria-label={t("ariaSend")}>
              <Icon name="send" size={17} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
