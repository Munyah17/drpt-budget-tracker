/**
 * Shared payslip model + Zimbabwe-style payslip PDF plumbing.
 *
 * Produces a payslip through /print/payslip — a dedicated print route
 * (same pattern as /print/statement) that renders an A4 sheet and lets the
 * user save it as a real PDF via the browser print dialog.
 */

export const PAYSLIP_KEY = "drpt-payslip";

export interface PayslipLine {
  label: string;
  amount: number;
}

export interface PayslipDoc {
  // Employer
  company: string;
  companyAddress: string;
  period: string;
  // Employee details (left column)
  employeeId: string;
  department: string;
  dateOfJoining: string;
  bankNameBranch: string;
  // Employee details (right column)
  name: string;
  designation: string;
  daysWorked: string;
  bankAccount: string;
  // Money
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  currencyLabel: string;
}

const rand = (seed: number, min: number, max: number) => {
  // Deterministic pseudo-random so the same employee always gets the same slip
  const x = Math.sin(seed) * 10000;
  return min + (x - Math.floor(x)) * (max - min);
};

const money = (n: number) => Math.round(n * 100) / 100;

const nameSeed = (s: string) =>
  [...s].reduce((acc, c) => acc + c.charCodeAt(0), 0);

/**
 * Build a plausible Zimbabwean payslip for demo purposes.
 * Deterministic per employee name + period so re-downloads match.
 */
export function buildPayslipDoc(opts: {
  employee: string;
  period: string;
  company?: string;
  employeeId?: string;
}): PayslipDoc {
  const { employee, period } = opts;
  const seed = nameSeed(employee + period);

  const basic = money(rand(seed + 1, 90000, 160000));
  const housing = money(basic * rand(seed + 2, 0.3, 0.45));
  const transport = money(basic * rand(seed + 3, 0.18, 0.28));
  const attendance = money(rand(seed + 4, 600, 1400));
  const night = money(rand(seed + 5, 500, 900));
  const overtime = money(rand(seed + 6, 4000, 9000));
  const holidayOT = money(rand(seed + 7, 10000, 19000));
  const earnings: PayslipLine[] = [
    { label: "Basic Salary", amount: basic },
    { label: "Housing Allowance", amount: housing },
    { label: "Transport Allowance", amount: transport },
    { label: "Attendance Bonus", amount: attendance },
    { label: "Night Allowance", amount: night },
    { label: "Overtime", amount: overtime },
    { label: "Overtime on Holiday", amount: holidayOT },
  ];

  const gross = earnings.reduce((s, e) => s + e.amount, 0);
  const deductions: PayslipLine[] = [
    { label: "PAYE", amount: money(gross * 0.21) },
    { label: "Absent deduction", amount: money(rand(seed + 8, 2500, 5000)) },
    { label: "NSSA deduction", amount: money(gross * 0.04) },
    { label: "Union", amount: money(rand(seed + 9, 3000, 5500)) },
  ];

  return {
    company: opts.company ?? "Zimbabwe Manufacturing",
    companyAddress: "Chisapi Cres, Harare, Zimbabwe",
    period,
    employeeId: opts.employeeId ?? String(2000 + (seed % 8000)),
    department: "Administration",
    dateOfJoining: "Oct 26, 2014",
    bankNameBranch: "CBZ Bank Limited, Harare",
    name: employee,
    designation: "Admin Officer",
    daysWorked: "26.5",
    bankAccount: String(1000000 + (seed % 900000)),
    earnings,
    deductions,
    currencyLabel: "Dollar",
  };
}

/** Dollar-formatted figure for list/table display, matching the PDF totals. */
export const usd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Gross / deductions / net derived from a doc's line items. */
export function payslipTotals(doc: PayslipDoc) {
  const gross = doc.earnings.reduce((s, e) => s + e.amount, 0);
  const deductions = doc.deductions.reduce((s, d) => s + d.amount, 0);
  return { gross, deductions, net: Math.round(gross - deductions) };
}

/** Persist the doc for the print route and open it in a new tab. */
export function openPayslipPdf(doc: PayslipDoc) {
  sessionStorage.setItem(PAYSLIP_KEY, JSON.stringify(doc));
  window.open("/print/payslip", "_blank");
}
