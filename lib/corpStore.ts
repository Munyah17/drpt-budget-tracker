"use client";

/**
 * Shared client-side store for corporate portal data.
 *
 * Persisted to localStorage under one key so every corporate page AND the
 * employee portal read/write the same records — employee leave requests show
 * up in the HR approvals inbox, approved loans appear as payroll deductions,
 * etc. Swap for Supabase tables when the backend is ready; keep this API.
 */
import { useSyncExternalStore } from "react";

const KEY = "drpt-corp-store";

export type PayrollStatus = "Draft" | "Pending Review" | "Approved" | "Paid" | "Rejected";
export type ClaimStatus = "Pending" | "Approved" | "Rejected" | "Reimbursed";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";
export type AdvanceStatus = "Pending" | "Approved" | "Paid Out" | "Settled" | "Rejected";

export interface PayrollRunRec {
  id: string;
  period: string;
  kind: "Regular" | "Off-cycle";
  employees: number;
  totalAmount: number;
  status: PayrollStatus;
  payDate: string; // ISO or display
  createdBy?: string;
  approvedBy?: string;
  note?: string;
}

export interface ExpenseClaim {
  id: string;
  employee: string;
  category: string;
  amount: number;
  date: string;
  note: string;
  status: ClaimStatus;
}

export interface StaffLoan {
  id: string;
  employee: string;
  amount: number;
  months: number;
  monthlyDeduction: number;
  monthsPaid: number;
  reason: string;
  status: ClaimStatus;
}

export interface LeaveReq {
  id: string;
  employee: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: LeaveStatus;
}

export interface CorpRoleRec {
  id: string;
  name: string;
  description: string;
  members: number;
  perms: string[];
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  date: string;
}

export interface CorpDoc {
  id: string;
  employee: string;
  docType: string;
  expires: string; // ISO date
}

export interface CorpEmployee {
  id: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  grossPay: number;
  bankName: string;
  bankAccount: string;
}

/** Earned Wage Access request — "Early Pay". */
export interface SalaryAdvance {
  id: string;
  employee: string;
  /** What the employee receives now */
  amount: number;
  /** Flat access fee */
  fee: number;
  /** Total deducted from the next payslip (amount + fee) */
  repay: number;
  status: AdvanceStatus;
  requestedAt: string; // ISO date
  decidedBy?: string;
  paidOutAt?: string;
  settledRunId?: string;
}

/** Employer-level Early Pay policy. */
export interface EwaConfig {
  enabled: boolean;
  /** Access fee as % of the advance (e.g. 10 → get $90, repay $100) */
  feePct: number;
  /** Max share of already-earned wages an employee may access, % */
  maxAccruedPct: number;
  /** Advances at or below this amount skip manual approval (0 = always review) */
  autoApproveBelow: number;
  /** Max advances per employee per calendar month */
  maxPerMonth: number;
}

export interface CorpStore {
  payrollRuns: PayrollRunRec[];
  claims: ExpenseClaim[];
  loans: StaffLoan[];
  advances: SalaryAdvance[];
  ewa: EwaConfig;
  leave: LeaveReq[];
  roles: CorpRoleRec[];
  announcements: Announcement[];
  docs: CorpDoc[];
  employees: CorpEmployee[];
  leaveQuotaDays: number;
}

export const ALL_PERMS = [
  "run_payroll",
  "approve_payroll",
  "approve_leave",
  "approve_claims",
  "manage_employees",
  "view_reports",
  "manage_roles",
  "post_announcements",
] as const;

export const PERM_LABELS: Record<string, string> = {
  run_payroll: "Create payroll runs",
  approve_payroll: "Approve & disburse payroll",
  approve_leave: "Approve leave requests",
  approve_claims: "Approve claims & loans",
  manage_employees: "Add/edit employees",
  view_reports: "View reports",
  manage_roles: "Manage roles",
  post_announcements: "Post announcements",
};

const empty = (): CorpStore => ({
  payrollRuns: [],
  claims: [],
  loans: [],
  advances: [],
  ewa: {
    enabled: true,
    feePct: 10,
    maxAccruedPct: 50,
    autoApproveBelow: 0,
    maxPerMonth: 2,
  },
  leave: [],
  roles: [
    { id: "r1", name: "Org Admin", description: "Full control over the organisation", members: 1, perms: [...ALL_PERMS] },
    { id: "r2", name: "HR Manager", description: "People, leave and announcements", members: 0, perms: ["approve_leave", "manage_employees", "post_announcements", "view_reports"] },
    { id: "r3", name: "Payroll Officer", description: "Creates payroll runs, cannot approve", members: 0, perms: ["run_payroll", "view_reports"] },
    { id: "r4", name: "Finance Approver", description: "Approves payroll and disbursements", members: 0, perms: ["approve_payroll", "approve_claims", "view_reports"] },
    { id: "r5", name: "Line Manager", description: "Approves leave for their team", members: 0, perms: ["approve_leave"] },
  ],
  announcements: [],
  docs: [],
  employees: [],
  leaveQuotaDays: 21,
});

// ---------- persistence ----------
let cache: CorpStore | null = null;
const listeners = new Set<() => void>();

function load(): CorpStore {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CorpStore>;
      cache = { ...empty(), ...parsed };
      return cache;
    }
  } catch { /* fresh */ }
  cache = empty();
  return cache;
}

function save(next: CorpStore) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}

/** Update the whole store (or one slice via an updater). */
export function updateCorp(fn: (s: CorpStore) => CorpStore) {
  save(fn(load()));
}

export function setSlice<K extends keyof CorpStore>(key: K, value: CorpStore[K]) {
  updateCorp((s) => ({ ...s, [key]: value }));
}

export const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 999)}`;

// ---------- React binding ----------
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; cb(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

const EMPTY_SNAPSHOT = empty();

export function useCorpStore(): CorpStore {
  return useSyncExternalStore(subscribe, load, () => EMPTY_SNAPSHOT);
}

/** Generic record → display rows for RecordModal etc. */
export function daysUntil(iso: string): number {
  const t = new Date(iso + "T00:00:00").getTime();
  return Math.ceil((t - Date.now()) / 864e5);
}

/** Payroll pipeline helpers */
export const PAYROLL_FLOW: PayrollStatus[] = ["Draft", "Pending Review", "Approved", "Paid"];

export function payrollNext(status: PayrollStatus): PayrollStatus | null {
  if (status === "Draft") return "Pending Review";
  if (status === "Pending Review") return "Approved";
  if (status === "Approved") return "Paid";
  return null;
}

export function payrollBadge(status: PayrollStatus): string {
  switch (status) {
    case "Paid": return "badge-green";
    case "Approved": return "badge-blue";
    case "Pending Review": return "badge-amber";
    case "Rejected": return "badge-red";
    default: return "";
  }
}
