"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import Icon from "./Icon";

export default function Modal({
  title,
  onClose,
  children,
  tabs,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  tabs?: ReactNode;
}) {
  const t = useTranslations("Pages.components");
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label={t("modal_close")}>
            <Icon name="x" size={16} />
          </button>
        </div>
        {tabs}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
