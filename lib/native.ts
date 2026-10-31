"use client";

import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";
import { useAppData } from "./AppDataContext";

const subscribe = () => () => {};

/** True only inside the iPhone app. False on the web and during server rendering. */
export function useIsNative(): boolean {
  return useSyncExternalStore(subscribe, () => Capacitor.isNativePlatform(), () => false);
}

/** Routes a signed-in unpaid user may use inside the iPhone app. */
export const FREE_TIER_ROUTES = ["/dashboard", "/profile", "/settings"] as const;

/**
 * True inside the iPhone app for a signed-in user who hasn't paid yet.
 * The web blocks unpaid users entirely; native gets a free tier (these
 * routes) instead — no purchase path exists in the app either way.
 */
export function useFreeTier(): boolean {
  const native = useIsNative();
  const { user } = useAppData();
  return native && (!user || (user.role === "user" && !user.isPaid));
}
