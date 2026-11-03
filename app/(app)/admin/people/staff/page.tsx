import { redirect } from "next/navigation";

/** Internal Staff moved out of User Management → /admin/staff/internal. */
export default function PeopleStaffRedirect() {
  redirect("/admin/staff/internal");
}
