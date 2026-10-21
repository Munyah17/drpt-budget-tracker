"use client";

import { useEffect, useRef, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { AI_RESPONSES } from "@/lib/data";
import { gbp } from "@/lib/format";
import Icon from "@/components/Icon";

interface ChatMsg {
  id: number;
  who: "ai" | "user";
  text: string;
}

const SUGGESTIONS = [
  { label: "Where did my money go?", q: "Where did my money go this month?" },
  { label: "Summarise June", q: "Summarise June" },
  { label: "Can I afford a holiday?", q: "Can I afford a holiday?" },
  { label: "How much should I save?", q: "How much should I save?" },
];

let msgSeq = 1;

export default function AiPage() {
  const { totalIncome, totalExpenses } = useAppData();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: msgSeq++, who: "ai", text: "Hi Dr PT, I'm your financial assistant. Ask me anything about your income, spending or savings goals." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  function sendChat(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: msgSeq++, who: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const reply =
        AI_RESPONSES[text.trim().toLowerCase()] ||
        `That's a great question. Based on your current income of ${gbp(totalIncome)} and expenses of ${gbp(totalExpenses)}, you're in a solid financial position this month.`;
      setMessages((prev) => [...prev, { id: msgSeq++, who: "ai", text: reply }]);
    }, 1200);
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
              placeholder="Ask me anything about your finances…"
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
