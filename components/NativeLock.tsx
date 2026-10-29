"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Inside the iOS app only: asks for Face ID / Touch ID (or the device passcode) on launch and whenever the app returns
 * from the background after more than a minute, and hides the budget behind a lock screen until it passes.
 * On the web this renders nothing.
 */
const GRACE_MS = 60_000;

export default function NativeLock() {
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const hiddenAt = useRef<number | null>(null);
  const native = typeof window !== "undefined" && Capacitor.isNativePlatform();

  const unlock = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
      const info = await BiometricAuth.checkBiometry();
      if (!info.isAvailable && !info.deviceIsSecure) {
        setLocked(false); // nothing to authenticate with on this device
        return;
      }
      await BiometricAuth.authenticate({ reason: "Unlock WellSpend", allowDeviceCredential: true });
      setLocked(false);
    } catch {
      // Cancelled or failed: stay locked so the person can try again.
    } finally {
      setBusy(false);
    }
  }, [busy]);

  useEffect(() => {
    if (!native) return;
    // The platform is only known in the browser, so the lock is raised after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocked(true);
    void unlock();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current && Date.now() - hiddenAt.current > GRACE_MS) {
        hiddenAt.current = null;
        setLocked(true);
        void unlock();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  if (!native || !locked) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100000, background: "#fff7fa", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14, padding: 32, textAlign: "center", color: "#3b1226",
      }}
    >
      <div style={{ width: 84, height: 84, borderRadius: 20, background: "#c81057", color: "#fff", fontWeight: 700, fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>PT</div>
      <h1 style={{ fontSize: 22, margin: 0 }}>WellSpend is locked</h1>
      <p style={{ margin: 0, color: "#7a4a60" }}>Unlock with Face ID to see your budget.</p>
      <button
        onClick={() => void unlock()}
        disabled={busy}
        style={{ background: "#c81057", color: "#fff", border: 0, borderRadius: 14, padding: "14px 26px", fontSize: 16, fontWeight: 600 }}
      >
        Unlock
      </button>
    </div>
  );
}
