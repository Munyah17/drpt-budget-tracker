"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAppData } from "@/lib/AppDataContext";
import { roleHome } from "@/lib/adminClient";
import { trackEvent } from "@/lib/analytics";
import Icon from "@/components/Icon";

export default function ConfirmedActions({ type }: { type: string }) {
  const t = useTranslations("Pages.confirmed");
  const { authReady, isAuthenticated, user } = useAppData();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent("confirmation_view", { type });
  }, [type]);

  const signedIn = authReady && isAuthenticated;

  return (
    <div className="confirm-actions">
      <Link
        href={signedIn ? roleHome(user?.role ?? "user") : "/login"}
        className="btn btn-primary"
      >
        {signedIn ? t("ctaDashboard") : t("ctaSignIn")}
        <Icon name="chevron-right" size={16} />
      </Link>
      <Link href="/" className="btn btn-ghost">
        {t("ctaHome")}
      </Link>
    </div>
  );
}
