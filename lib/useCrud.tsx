"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import RecordModal, { RowRecord } from "@/components/RecordModal";

type ModalMode = "view" | "edit" | "create";

interface CrudModal {
  mode: ModalMode;
  record: RowRecord;
  index: number;
}

const titleFor = (mode: ModalMode, label: string) =>
  mode === "create" ? `Add ${label}` : mode === "edit" ? `Edit ${label}` : `${label} Details`;

/**
 * Generic list-CRUD hook for table pages with static seed data.
 * T must be an object with string fields (the typical admin table shape).
 */
export function useCrud<T extends object>(initial: T[], label: string) {
  const { toast } = useAppData();
  const [items, setItems] = useState<T[]>(initial);
  const [modal, setModal] = useState<CrudModal | null>(null);

  const openModal = (mode: ModalMode, item?: T, index?: number) => {
    const record: RowRecord = item
      ? ({ ...item } as unknown as RowRecord)
      : Object.fromEntries(Object.keys(initial[0] ?? {}).map((k) => [k, ""]));
    setModal({ mode, record, index: index ?? -1 });
  };

  const handleSave = (values: RowRecord) => {
    if (!modal) return;
    if (modal.mode === "create") {
      setItems((prev) => [...prev, values as unknown as T]);
      toast(`${label} created`);
    } else {
      setItems((prev) => prev.map((e, i) => (i === modal.index ? ({ ...e, ...values } as T) : e)));
      toast(`${label} updated`);
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!modal) return;
    setItems((prev) => prev.filter((_, i) => i !== modal.index));
    toast(`${label} deleted`, "trash-2");
    setModal(null);
  };

  const modalNode = modal && (
    <RecordModal
      mode={modal.mode}
      title={titleFor(modal.mode, label)}
      record={modal.record}
      onClose={() => setModal(null)}
      onSave={handleSave}
      onDelete={modal.mode === "view" ? handleDelete : undefined}
    />
  );

  return { items, setItems, openModal, modalNode };
}
