"use client";

import { useAppData } from "@/lib/AppDataContext";
import Icon from "./Icon";

export default function ToastHost() {
  const { toasts } = useAppData();
  return (
    <div id="toast-wrap">
      {toasts.map((t) => (
        <div className={"toast" + (t.leaving ? " toast-out" : "")} key={t.id}>
          <Icon name={t.icon} size={18} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
