"use client";

import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";

const subscribe = () => () => {};

/** True only inside the iPhone app. False on the web and during server rendering. */
export function useIsNative(): boolean {
  return useSyncExternalStore(subscribe, () => Capacitor.isNativePlatform(), () => false);
}
