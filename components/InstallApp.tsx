"use client";

import { ButtonHTMLAttributes, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "./Modal";
import Icon from "./Icon";
import { useIsNative } from "@/lib/native";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as { standalone?: boolean }).standalone === true;

/**
 * "Get the app" button — triggers the real install flow where the platform
 * supports it (Android/desktop Chrome via beforeinstallprompt), shows
 * step-by-step instructions on iOS Safari, and hides itself inside the
 * native app or when already installed.
 */
export default function InstallApp({
  className = "btn btn-ghost btn-sm",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const t = useTranslations("Landing.install");
  const native = useIsNative();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Defer state writes out of the effect body (react-hooks/set-state-in-effect)
    queueMicrotask(() => {
      if (native || isStandalone()) setHidden(true);
    });
    if (native || isStandalone()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [native]);

  if (hidden || installed) return null;

  const onClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    setShowHelp(true);
  };

  return (
    <>
      <button type="button" className={className} onClick={onClick} {...rest}>
        <Icon name="download" size={14} style={{ marginRight: 6 }} />
        {t("button")}
      </button>
      {showHelp && (
        <Modal title={t("modalTitle")} onClose={() => setShowHelp(false)}>
          {isIOS() ? (
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.9, color: "var(--ink-700)" }}>
              <li>{t("iosStep1")}</li>
              <li>{t("iosStep2")}</li>
              <li>{t("iosStep3")}</li>
            </ol>
          ) : (
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.9, color: "var(--ink-700)" }}>
              <li>{t("step1")}</li>
              <li>{t("step2")}</li>
            </ol>
          )}
          <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--ink-500)" }}>{t("modalNote")}</p>
        </Modal>
      )}
    </>
  );
}
