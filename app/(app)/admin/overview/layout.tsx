import { redirect } from "next/navigation";

/** /admin/overview was the old placeholder route — the real dashboard lives at /admin. */
export default function AdminOverviewLayout({ children }: { children: unknown }) {
  void children;
  redirect("/admin");
}
