"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import RecordModal, { RowRecord } from "@/components/RecordModal";

type ModalMode = "view" | "edit" | "create";

interface CrudModal {
  mode: ModalMode;
  record: RowRecord;
  index: number;
}

export interface UseCrudOptions<T> {
  /** Create-only inputs appended after createFields (e.g. "password").
   *  Not part of T — stripped from the saved row. */
  extraFields?: string[];
  /**
   * Runs before a created row is saved — e.g. provisioning a real login
   * account. Throw to abort: the message is toasted, the row is not added
   * and the modal stays open. Return a partial to merge into the new row
   * (e.g. a server-generated id).
   */
  onCreate?: (values: RowRecord) => Promise<Partial<T> | void>;
  /** Record keys that are display-only — shown read-only even in edit mode
   *  (e.g. fetched payment details that aren't editable). */
  readonlyFields?: string[];
}

/**
 * Generic list-CRUD hook for table pages with static seed data.
 * T must be an object with string fields (the typical admin table shape).
 * `createFields` lists the keys rendered in the create form — required because
 * seed arrays are usually empty, so fields cannot be inferred from a record.
 */
export function useCrud<T extends object>(
  initial: T[],
  label: string,
  createFields: readonly Extract<keyof T, string>[],
  options: UseCrudOptions<T> = {},
) {
  const t = useTranslations("Pages.components");
  const { toast } = useAppData();
  const [items, setItems] = useState<T[]>(initial);
  const [modal, setModal] = useState<CrudModal | null>(null);

  const openModal = (mode: ModalMode, item?: T, index?: number) => {
    const record: RowRecord = item
      ? ({ ...item } as unknown as RowRecord)
      : Object.fromEntries(
          [
            ...(createFields.length ? createFields : Object.keys(initial[0] ?? {})),
            ...(options.extraFields ?? []),
          ].map((k) => [k, ""]),
        );
    setModal({ mode, record, index: index ?? -1 });
  };

  const handleSave = async (values: RowRecord) => {
    if (!modal) return;
    if (modal.mode === "create") {
      let merged: Partial<T> | void;
      try {
        merged = await options.onCreate?.(values);
      } catch (err) {
        toast(err instanceof Error && err.message ? err.message : t("crud_create_failed"), "x");
        return; // keep the modal open so the admin's input isn't lost
      }
      const extras = new Set(options.extraFields ?? []);
      const row = Object.fromEntries(Object.entries(values).filter(([k]) => !extras.has(k)));
      setItems((prev) => [...prev, { ...row, ...(merged ?? {}) } as unknown as T]);
      toast(t("crud_created", { label }));
    } else {
      setItems((prev) => prev.map((e, i) => (i === modal.index ? ({ ...e, ...values } as T) : e)));
      toast(t("crud_updated", { label }));
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!modal) return;
    setItems((prev) => prev.filter((_, i) => i !== modal.index));
    toast(t("crud_deleted", { label }), "trash-2");
    setModal(null);
  };

  const modalNode = modal && (
    <RecordModal
      mode={modal.mode}
      title={
        modal.mode === "create"
          ? t("crud_add", { label })
          : modal.mode === "edit"
            ? t("crud_edit", { label })
            : t("crud_details", { label })
      }
      record={modal.record}
      readonlyKeys={options.readonlyFields}
      onClose={() => setModal(null)}
      onSave={handleSave}
      onDelete={modal.mode === "view" ? handleDelete : undefined}
    />
  );

  return { items, setItems, openModal, modalNode };
}
