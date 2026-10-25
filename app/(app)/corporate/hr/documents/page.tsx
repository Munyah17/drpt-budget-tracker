"use client";

import { useState, useMemo } from "react";
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

const DOCS_DATA: Doc[] = [
  { name: "Employment Contract — Emma Wilson", category: "Contracts", employee: "Emma Wilson", uploaded: "2024-01-15", size: "240 KB" },
  { name: "Health & Safety Policy v3", category: "Policies", employee: "All Staff", uploaded: "2025-03-02", size: "1.1 MB" },
  { name: "ID Copy — David Brown", category: "Identification", employee: "David Brown", uploaded: "2024-03-10", size: "520 KB" },
  { name: "Leave Policy 2025", category: "Policies", employee: "All Staff", uploaded: "2025-01-05", size: "310 KB" },
];

export default function DocumentsPage() {
  const { toast } = useAppData();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const crud = useCrud(DOCS_DATA, "Document");

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
      `${d.name}\n\nCategory: ${d.category}\nEmployee: ${d.employee}\nUploaded: ${d.uploaded}\nSize: ${d.size}\n\n(Placeholder document content)`
    );
    toast(`${d.name} downloaded`, "download");
  };

  const upload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      crud.setItems((prev) => [
        { name: file.name, category: "Uploads", employee: "All Staff", uploaded: new Date().toISOString().slice(0, 10), size: `${Math.max(1, Math.round(file.size / 1024))} KB` },
        ...prev,
      ]);
      toast(`${file.name} uploaded`, "upload-cloud");
    };
    input.click();
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Documents</h2>
          <p className="section-sub">Employee records, contracts and policies</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => crud.openModal("create")}>
            <Icon name="plus" size={16} style={{ marginRight: 8 }} />
            New Record
          </button>
          <button className="btn btn-primary" onClick={upload}>
            <Icon name="upload-cloud" size={16} style={{ marginRight: 8 }} />
            Upload Document
          </button>
        </div>
      </div>

      <div className="glass-card card-pad">
        <FilterBar
          searchPlaceholder="Search documents..."
          categoryOptions={categories.map((c) => ({ value: c, label: c }))}
          onSearchChange={setSearch}
          onCategoryChange={setCategoryFilter}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left" }}>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Document</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Category</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Employee</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Uploaded</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Size</th>
              <th style={{ padding: "12px 8px", fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-500)", padding: 30 }}>
                  No documents match your search.
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
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDownload(d)}><Icon name="download" size={14} style={{ marginRight: 4 }} />Download</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => crud.openModal("view", d, crud.items.indexOf(d))}><Icon name="eye" size={14} style={{ marginRight: 4 }} />View</button>
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
