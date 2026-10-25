"use client";

import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";

interface Article {
  title: string;
  desc: string;
  updated: string;
}

const ARTICLES_DATA: Article[] = [
  { title: "User Guide", desc: "How to use the platform", updated: "2d ago" },
  { title: "Admin Guide", desc: "Platform administration", updated: "1w ago" },
  { title: "API Documentation", desc: "API reference and examples", updated: "3d ago" },
];

export default function DocumentationPage() {
  const crud = useCrud(ARTICLES_DATA, "Article");
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Documentation</h2>
          <p className="section-sub">Platform documentation and guides</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          Add Article
        </button>
      </div>

      <div className="grid grid-2">
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>Getting Started</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {crud.items.map((doc, idx) => (
              <div key={idx} onClick={() => crud.openModal("view", doc, idx)} style={{ padding: 12, borderRadius: "var(--radius-sm)", background: "var(--pink-100)", cursor: "pointer" }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{doc.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{doc.desc}</div>
                <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 4 }}>Updated {doc.updated}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>FAQs</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { q: "How do I reset my password?", a: "Click 'Forgot password' on the login page" },
              { q: "What payment methods are accepted?", a: "Paynow, Stripe, ZIPIT, Ecocash" },
              { q: "How do I cancel my subscription?", a: "Contact support for assistance" },
            ].map((faq, idx) => (
              <div key={idx} style={{ padding: 12, borderRadius: "var(--radius-sm)", background: "var(--card-solid)" }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{faq.q}</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {crud.modalNode}
    </>
  );
}
