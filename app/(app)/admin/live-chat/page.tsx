"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "@/components/Icon";

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  isAdmin: boolean;
}

interface ChatSession {
  id: string;
  user: string;
  email: string;
  status: "active" | "waiting" | "closed";
  lastMessage: string;
}

export default function LiveChatPage() {
  const { toast } = useAppData();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");

  const mockSessions: ChatSession[] = [];

  const mockMessages: ChatMessage[] = [];

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "badge-green",
      waiting: "badge-amber",
      closed: "badge-red",
    };
    return <span className={`badge ${colors[status as keyof typeof colors]}`}>{status}</span>;
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    toast("Message sent", "check-circle");
    setMessageInput("");
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Live Chat</h2>
          <p className="section-sub">Real-time support chat with users</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "300px 1fr", gap: 20 }}>
        <div className="glass-card card-pad">
          <h3 style={{ marginBottom: 16 }}>Active Chats</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mockSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session.id)}
                style={{
                  padding: 12,
                  borderRadius: "var(--radius-sm)",
                  background: selectedSession === session.id ? "var(--pink-100)" : "var(--card-solid)",
                  cursor: "pointer",
                  border: selectedSession === session.id ? "2px solid var(--rose-500)" : "1px solid var(--card-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{session.user}</span>
                  {getStatusBadge(session.status)}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{session.email}</div>
                <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {session.lastMessage}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card card-pad" style={{ display: "flex", flexDirection: "column", height: "500px" }}>
          {selectedSession ? (
            <>
              <div style={{ borderBottom: "1px solid var(--card-border)", paddingBottom: 12, marginBottom: 12 }}>
                <h3>Chat with John Doe</h3>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>john.doe@email.com</div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.isAdmin ? "flex-end" : "flex-start",
                      maxWidth: "70%",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        background: msg.isAdmin ? "var(--rose-500)" : "var(--card-solid)",
                        color: msg.isAdmin ? "white" : "var(--ink-900)",
                      }}
                    >
                      <div style={{ fontSize: 13 }}>{msg.message}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px solid var(--card-border)", paddingTop: 12 }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}
                />
                <button className="btn btn-primary" onClick={handleSendMessage}>
                  <Icon name="send" size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ink-500)" }}>
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>
    </>
  );
}
