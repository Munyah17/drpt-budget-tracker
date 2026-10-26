"use client";

import { useEffect, useRef, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { useCashFlow } from "@/lib/CashFlowContext";
import { totalsFor } from "@/lib/cashflow";
import Icon from "@/components/Icon";

interface ChatMsg {
  id: number;
  who: "ai" | "user";
  text: string;
}

const SUGGESTIONS = [
  { label: "Where did my money go?", q: "Where did my money go this month?" },
  { label: "What should I cut back?", q: "What am I spending too much on?" },
  { label: "Can I afford a treat?", q: "Can I afford a holiday?" },
  { label: "How much should I save?", q: "How much should I save each month?" },
];

let msgSeq = 1;

export default function AiPage() {
  const { user, currency } = useAppData();
  const { entries } = useCashFlow();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: msgSeq++, who: "ai", text: "Hi, I'm your financial assistant — powered by real AI. Ask me anything about your income, spending or savings." },
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

    const t = totalsFor(entries, currency);
    const context = JSON.stringify({
      currency,
      totals: t,
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
        : `Sorry, I couldn't reach the AI right now (${data.error ?? "unknown error"}).`;
      setMessages((prev) => [...prev, { id: msgSeq++, who: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: msgSeq++, who: "ai", text: "Sorry, I'm offline right now — check your connection and try again." },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">AI Assistant</h2>
          <p className="section-sub">Ask anything about your finances</p>
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
              placeholder="Ask me anything about your financesâ€¦"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChat(input);
              }}
            />
            <button className="send-btn" onClick={() => sendChat(input)} aria-label="Send">
              <Icon name="send" size={17} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
