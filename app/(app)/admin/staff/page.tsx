import { redirect } from "next/navigation";

/** Old Staff Management URL — the page now lives under the staff group. */
export default function StaffRedirect() {
  redirect("/admin/staff/team");
}
