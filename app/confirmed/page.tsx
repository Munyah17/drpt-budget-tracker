import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Icon from "@/components/Icon";
import ConfirmedActions from "./ConfirmedActions";

const TYPES = ["signup", "payment", "account"] as const;
type ConfirmationType = (typeof TYPES)[number];

export const metadata: Metadata = {
  title: "Confirmed — WellSpend",
  robots: { index: false, follow: false },
};

const NEXT_STEPS = [
  { icon: "pie-chart", key: "stepBudget" },
  { icon: "receipt", key: "stepTrack" },
  { icon: "target", key: "stepGoal" },
] as const;

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const t = await getTranslations("Pages.confirmed");
  const raw = (await searchParams).type;
  const requested = Array.isArray(raw) ? raw[0] : raw;
  const type: ConfirmationType = TYPES.includes(requested as ConfirmationType)
    ? (requested as ConfirmationType)
    : "account";

  return (
    <main className="confirm-wrap">
      <div className="confirm-card fade-up" data-confirmation={type}>
        <Link href="/" className="login-logo confirm-logo">
          WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
        </Link>

        <div className="confirm-check" aria-hidden="true">
          <Icon name="check" size={38} />
        </div>

        <span className="badge badge-green">{t(`${type}.badge`)}</span>
        <h1>{t(`${type}.title`)}</h1>
        <p className="confirm-text">{t(`${type}.text`)}</p>

        <ConfirmedActions type={type} />

        <div className="confirm-next">
          <div className="confirm-next-title">{t("nextTitle")}</div>
          <ul>
            {NEXT_STEPS.map((s) => (
              <li key={s.key}>
                <span className="confirm-next-icon"><Icon name={s.icon} size={18} /></span>
                <span>{t(s.key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
