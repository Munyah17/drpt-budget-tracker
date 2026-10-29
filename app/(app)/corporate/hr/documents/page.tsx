"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { useCrud } from "@/lib/useCrud";
import { downloadBlob } from "@/lib/download";
import Icon from "@/components/Icon";
import FilterBar from "@/components/FilterBar";

interface Doc {
  name: string;
  category: string;
  employee: string;
  uploaded: string;
  size: string;
}

const DOCS_DATA: Doc[] = [];

export default function DocumentsPage() {
  const t = useTranslations("Pages.corp_hr_documents");
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const crud = useCrud(DOCS_DATA, t("entityLabel"));

  const filteredData = useMemo(() => {
    return crud.items.filter((d) =>
      (!categoryFilter || d.category === categoryFilter) &&
      (d.name.toLowerCase().includes(search.toLowerCase()) || d.employee.toLowerCase().includes(search.toLowerCase()))
    );
  }, [crud.items, search, categoryFilter]);

  const categories = useMemo(() => [...new Set(crud.items.map((d) => d.category))], [crud.items]);

  const handleDownload = (d: Doc) => {
    downloadBlob(
      `${d.name.replace(/[^\w]+/g, "-").toLowerCase()}.txt`,
      t("docContent", { name: d.name, category: d.category, employee: d.employee, uploaded: d.uploaded, size: d.size })
    );
    toast(t("toastDownloaded", { name: d.name }), "download");
  };

  const upload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      crud.setItems((prev) => [
        { name: file.name, category: t("defaultCategory"), employee: t("allStaff"), uploaded: new Date().toISOString().slice(0, 10), size: `${Math.max(1, Math.round(file.size / 1024))} KB` },
        ...prev,
      ]);
      toast(t("toastUploaded", { name: file.name }), "upload-cloud");
    };
    input.click();
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-sub">{t("subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => crud.openModal("create")}>
            <Icon name="plus" size={16} style={{ marginRight: 8 }} />
            {t("newRecord")}
          </button>
          <button className="btn btn-primary" onClick={upload}>
            <Icon name="upload-cloud" size={16} style={{ marginRight: 8 }} />
            {t("uploadDocument")}
          </button>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder={t("searchPlaceholder")}
          categoryOptions={categories.map((c) => ({ value: c, label: c }))}
          onSearchChange={setSearch}
          onCategoryChange={setCategoryFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colDocument")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colCategory")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colEmployee")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colUploaded")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colSize")}</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  {t("emptyState")}
                </td>
              </tr>
            )}
            {filteredData.map((d, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{d.name}</td>
                <td style={{ padding: "12px 8px" }}><span className="badge badge-blue">{d.category}</span></td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{d.employee}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{d.uploaded}</td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>{d.size}</td>
                <td style={{ padding: "12px 8px" }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload(d)}><Icon name="download" size={14} style={{ marginRight: 4 }} />{t("download")}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", d, crud.items.indexOf(d))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />{t("view")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crud.modalNode}
    </>
  );
}
