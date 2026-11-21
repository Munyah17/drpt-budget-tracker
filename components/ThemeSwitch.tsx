"use client";

import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import Icon from "./Icon";

/** Two-sided theme switch: moon/dark on the left, sun/light on the right. */
export default function ThemeSwitch() {
  const { theme, toggleTheme } = useAppData();
  const t = useTranslations("Shell");

  const side = (id: "dark" | "light", icon: string, label: string) => (
    <button
      type="button"
      className={"theme-switch-side" + (theme === id ? " active" : "")}
      aria-pressed={theme === id}
      aria-label={label}
      onClick={() => {
        if (theme !== id) toggleTheme();
      }}
    >
      <Icon name={icon} size={15} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="theme-switch" role="group" aria-label={t("toggleTheme")} data-theme={theme}>
      <span className="theme-switch-thumb" aria-hidden="true" />
      {side("dark", "moon", t("themeDark"))}
      {side("light", "sun", t("themeLight"))}
    </div>
  );
}
