"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "./Modal";

export type RowRecord = Record<string, string>;

interface RecordModalProps {
  mode: "view" | "edit" | "create";
  title: string;
  record: RowRecord;
  /** Keys that should not be shown/editable (e.g. internal ids) */
  hiddenKeys?: string[];
  /** Keys rendered read-only even in edit/create mode */
  readonlyKeys?: string[];
  onClose: () => void;
  onSave?: (values: RowRecord) => void;
  onDelete?: () => void;
}

const humanize = (key: string) =>
  key
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function RecordModal(props: RecordModalProps) {
  // Remount the stateful body whenever a different record/mode opens so
  // draft and confirm state reset without a setState-in-effect.
  return <RecordModalInner key={`${props.mode}:${JSON.stringify(props.record)}`} {...props} />;
}

function RecordModalInner({
  mode,
  title,
  record,
  hiddenKeys = [],
  readonlyKeys = [],
  onClose,
  onSave,
  onDelete,
}: RecordModalProps) {
  const t = useTranslations("Pages.components");
  const [draft, setDraft] = useState<RowRecord>(record);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const keys = Object.keys(record).filter((k) => !hiddenKeys.includes(k));
  const editable = mode !== "view";

  const handleSubmit = () => {
    onSave?.(draft);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {keys.map((key) => {
          const readOnly = !editable || readonlyKeys.includes(key);
          return (
            <div key={key} className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12, color: "var(--ink-500)" }}>{humanize(key)}</label>
              {readOnly ? (
                <div style={{ padding: "8px 0", fontWeight: 500 }}>{record[key] || "—"}</div>
              ) : (
                <input
                  value={draft[key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                />
              )}
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          {editable && (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>
              {mode === "create" ? t("record_create") : t("record_save")}
            </button>
          )}
          {mode === "view" && onDelete && !confirmingDelete && (
            <button
              className="btn btn-ghost"
              style={{ flex: 1, color: "var(--red-500)" }}
              onClick={() => setConfirmingDelete(true)}
            >
              {t("record_delete")}
            </button>
          )}
          {mode === "view" && onDelete && confirmingDelete && (
            <button
              className="btn btn-primary"
              style={{ flex: 1, background: "var(--red-500)" }}
              onClick={onDelete}
            >
              {t("record_confirmDelete")}
            </button>
          )}
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            {editable ? t("record_cancel") : t("record_close")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
