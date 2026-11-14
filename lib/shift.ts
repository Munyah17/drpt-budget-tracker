"use client";

import { useSyncExternalStore } from "react";

/**
 * The "client shift" — a super admin can shift into a full regular-user
 * nature (and back) without re-login. The flag lives in sessionStorage so it
 * survives reloads but ends with the tab. It is a presentation-layer switch
 * only: the real profile role in the DB never changes.
 */

const SHIFT_KEY = "drpt-shifted-user";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function isShifted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SHIFT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setShifted(v: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (v) sessionStorage.setItem(SHIFT_KEY, "1");
    else sessionStorage.removeItem(SHIFT_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Reactive shifted flag — re-renders when the shift changes. */
export function useShifted(): boolean {
  return useSyncExternalStore(subscribe, isShifted, () => false);
}
