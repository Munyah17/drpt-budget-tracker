import { redirect } from "next/navigation";

/** Payroll moved out of Operations — it's our internal payroll under Staff Management. */
export default function OpsPayrollRedirect() {
  redirect("/admin/staff/payroll");
}
