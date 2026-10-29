"use client";

import { useTranslations } from "next-intl";
import { useCrud } from "@/lib/useCrud";
import Icon from "@/components/Icon";

interface Article {
  title: string;
  desc: string;
  updated: string;
}

const ARTICLES_DATA: Article[] = [];

export default function DocumentationPage() {
  const t = useTranslations("Pages.adm_documentation");
  const crud = useCrud(ARTICLES_DATA, t("articleLabel"));
  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
  ];
  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => crud.openModal("create")}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t("addArticle")}
        </button>
      </div>

      <div className="grid grid-2">
        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("gettingStarted")}</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {crud.items.map((doc, idx) => (
              <div key={idx} onClick={() => crud.openModal("view", doc, idx)} style={{ padding: 12, borderRadius: "var(--radius-sm)", background: "var(--pink-100)", cursor: "pointer" }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{doc.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{doc.desc}</div>
                <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 4 }}>{t("updated", { date: doc.updated })}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card card-pad">
          <div className="card-head">
            <h3>{t("faqs")}</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, idx) => (
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
