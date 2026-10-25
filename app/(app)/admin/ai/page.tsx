"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

export default function AdminAIPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm the Dr PT Platform AI. I can provide insights about platform performance, user behavior, revenue trends, and operational metrics. What would you like to know?" }
  ]);

  const handleSend = () => {
    if (!query.trim()) return;
    setMessages([...messages, { role: "user", content: query }]);
    
    setTimeout(() => {
      const responses: Record<string, string> = {
        "how many users": "Currently, the platform has 1,247 total users with 892 active users in the last 30 days. User growth has increased by 15% this month.",
        "revenue": "Platform revenue for this month is $456 from 456 paid subscriptions. MRR (Monthly Recurring Revenue) is trending upward with a 12% growth rate.",
        "churn": "Current churn rate is 2.3%, which is below the industry average of 5%. Most churn occurs in the first 30 days after signup.",
        "performance": "System uptime is 99.9% with an average API latency of 45ms. Error rate is at 0.12%, well within acceptable limits.",
        "popular features": "The most used features are Dashboard (89% of users), Transactions (76%), and Budget Planner (68%). AI Assistant usage has grown by 45% this month.",
      };
      
      const matchedKey = Object.keys(responses).find(k => query.toLowerCase().includes(k));
      const response = matchedKey ? responses[matchedKey] : "I can help you analyze platform data. Try asking about user count, revenue, churn, performance, or popular features.";
      
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setQuery("");
    }, 1000);
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Platform AI Insights</h2>
          <p className="section-sub">AI-powered platform analytics and insights</p>
        </div>
      </div>

      <div className="glass-card card-pad" style={{ height: "calc(100vh - 200px)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
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
            placeholder="Ask about platform metrics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            style={{ flex: 1, padding: "12px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)" }}
          />
          <button className="btn btn-primary" onClick={handleSend}>
            <Icon name="send" size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
