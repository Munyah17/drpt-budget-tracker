"use client";

import { useState } from "react";
import Icon from "./Icon";
import QuickAddModal from "./QuickAddModal";

export default function Fab() {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  return (
    <>
      <button
        aria-label="Add transaction"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: "linear-gradient(135deg,var(--rose-600),var(--rose-400))",
          color: "#fff",
          border: "none",
          boxShadow: "0 14px 30px -6px rgba(200,20,87,.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 500,
          transition: "transform .2s",
          transform: hover ? "scale(1.08) rotate(90deg)" : "scale(1) rotate(0deg)",
        }}
      >
        <Icon name="plus" size={24} />
      </button>
      {open && <QuickAddModal onClose={() => setOpen(false)} />}
    </>
  );
}
