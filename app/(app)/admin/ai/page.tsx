"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";

export default function AdminAIPage() {
  const t = useTranslations("Pages.adm_ai");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: t("initialMessage") }
  ]);

  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const q = query.trim();
    if (!q || sending) return;
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setQuery("");
    setSending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ??
            data.error ??
            t("serviceUnavailable"),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("serviceUnreachable") },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ height: "calc(100vh - 200px)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
          {sending && (
            <div className="typing-dots"><span /><span /><span /></div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "70%",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: msg.role === "user" ? "var(--rose-500)" : "var(--card-solid)",
                  color: msg.role === "user" ? "white" : "var(--ink-900)",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--card-border)", paddingTop: 16 }}>
          <input
            type="text"
            placeholder={t("inputPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            style={{ flex: 1, padding: "12px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}
          />
          <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
            <Icon name="send" size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
