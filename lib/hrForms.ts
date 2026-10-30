/**
 * Paperless HR forms — fill online, print for signature, file.
 * Same render-to-PrintDoc pattern as contractTemplates.
 */
import { PrintDoc } from "@/lib/printDoc";

export interface HrFormTemplate {
  id: string;
  label: string;
  description: string;
  fields: { key: string; label: string; type?: "text" | "number" | "date"; placeholder?: string }[];
  render: (d: Record<string, string>, company: string) => PrintDoc;
}

const v = (d: Record<string, string>, k: string, fb = "________________") => d[k]?.trim() || fb;

export const HR_FORMS: HrFormTemplate[] = [
  {
    id: "leave_app",
    label: "Leave Application Form",
    description: "Annual, sick or special leave — employee signs, manager approves",
    fields: [
      { key: "employee", label: "Employee name" },
      { key: "employeeId", label: "Employee ID" },
      { key: "department", label: "Department / SBU" },
      { key: "leaveType", label: "Leave type", placeholder: "Annual / Sick / Maternity / Unpaid" },
      { key: "from", label: "From", type: "date" },
      { key: "to", label: "To", type: "date" },
      { key: "days", label: "Working days", type: "number" },
      { key: "reason", label: "Reason" },
      { key: "contact", label: "Contact during leave" },
    ],
    render: (d, company) => ({
      docType: "LEAVE APPLICATION FORM",
      company,
      ref: `HR/LEV/${Date.now().toString(36).toUpperCase()}`,
      sections: [
        {
          heading: "1. EMPLOYEE DETAILS",
          fields: [
            { label: "Name", value: v(d, "employee") },
            { label: "Employee ID", value: v(d, "employeeId") },
            { label: "Department / SBU", value: v(d, "department") },
          ],
        },
        {
          heading: "2. LEAVE REQUESTED",
          fields: [
            { label: "Type", value: v(d, "leaveType") },
            { label: "From", value: v(d, "from") },
            { label: "To", value: v(d, "to") },
            { label: "Working days", value: v(d, "days") },
            { label: "Reason", value: v(d, "reason") },
            { label: "Contact during leave", value: v(d, "contact") },
          ],
        },
        {
          heading: "3. APPROVAL (office use)",
          fields: [
            { label: "Decision", value: "Approved ☐    Declined ☐" },
            { label: "Comments", value: "_____________________________________________" },
          ],
        },
      ],
      signatures: [
        { label: "Employee" },
        { label: "Line Manager" },
        { label: "HR" },
      ],
    }),
  },
  {
    id: "loan_app",
    label: "Staff Loan Application",
    description: "Loan request with payroll-deduction authorisation built in",
    fields: [
      { key: "employee", label: "Employee name" },
      { key: "employeeId", label: "Employee ID" },
      { key: "amount", label: "Amount requested (USD)", type: "number" },
      { key: "months", label: "Repayment months", type: "number" },
      { key: "monthly", label: "Monthly deduction (USD)", type: "number" },
      { key: "reason", label: "Purpose" },
    ],
    render: (d, company) => ({
      docType: "STAFF LOAN APPLICATION",
      company,
      ref: `FIN/LN-APP/${Date.now().toString(36).toUpperCase()}`,
      sections: [
        {
          heading: "1. APPLICATION",
          fields: [
            { label: "Employee", value: v(d, "employee") },
            { label: "Employee ID", value: v(d, "employeeId") },
            { label: "Amount requested", value: `USD ${v(d, "amount")}` },
            { label: "Repayment period", value: `${v(d, "months")} months` },
            { label: "Monthly deduction", value: `USD ${v(d, "monthly")}` },
            { label: "Purpose", value: v(d, "reason") },
          ],
        },
        {
          heading: "2. DECLARATION & DEDUCTION AUTHORISATION",
          body: "I apply for the staff loan described above and, if approved, authorise the deduction of the monthly instalment directly from my net salary. I understand the balance becomes immediately payable should my employment end before full repayment.",
        },
        {
          heading: "3. OFFICE USE — decision",
          fields: [{ label: "Approved / Declined", value: "_____________" }, { label: "Signed agreement ref", value: "_____________" }],
        },
      ],
      signatures: [
        { label: "Applicant", name: v(d, "employee", "") },
        { label: "HR" },
        { label: "Finance" },
      ],
    }),
  },
  {
    id: "expense_claim",
    label: "Expense Claim Form",
    description: "Out-of-pocket reimbursement claim with receipt checklist",
    fields: [
      { key: "employee", label: "Claimant name" },
      { key: "department", label: "Department / SBU" },
      { key: "category", label: "Category", placeholder: "Travel / Fuel / Meals / Other" },
      { key: "expenseDate", label: "Date of expense", type: "date" },
      { key: "amount", label: "Amount claimed (USD)", type: "number" },
      { key: "description", label: "Description / business reason" },
      { key: "receipts", label: "Receipts attached", type: "number" },
    ],
    render: (d, company) => ({
      docType: "EXPENSE CLAIM FORM",
      company,
      ref: `FIN/EXP/${Date.now().toString(36).toUpperCase()}`,
      sections: [
        {
          heading: "1. CLAIM DETAILS",
          fields: [
            { label: "Claimant", value: v(d, "employee") },
            { label: "Department / SBU", value: v(d, "department") },
            { label: "Category", value: v(d, "category") },
            { label: "Date of expense", value: v(d, "expenseDate") },
            { label: "Amount", value: `USD ${v(d, "amount")}` },
            { label: "Receipts attached", value: v(d, "receipts", "0") },
          ],
        },
        {
          heading: "2. DESCRIPTION",
          body: v(d, "description", "\n\n"),
        },
        {
          heading: "3. APPROVAL & PAYMENT (office use)",
          fields: [
            { label: "Approved amount", value: "USD _____________" },
            { label: "Paid via", value: "Payroll ☐    Wallet ☐    Bank ☐" },
          ],
        },
      ],
      signatures: [
        { label: "Claimant", name: v(d, "employee", "") },
        { label: "Line Manager" },
        { label: "Finance" },
      ],
    }),
  },
  {
    id: "disciplinary",
    label: "Disciplinary Report",
    description: "Incident record feeding hearings and warning letters",
    fields: [
      { key: "employee", label: "Employee name" },
      { key: "employeeId", label: "Employee ID" },
      { key: "incidentDate", label: "Date of incident", type: "date" },
      { key: "location", label: "Location / department" },
      { key: "reportedBy", label: "Reported by" },
      { key: "offence", label: "Nature of offence" },
      { key: "witnesses", label: "Witnesses" },
      { key: "action", label: "Immediate action taken" },
    ],
    render: (d, company) => ({
      docType: "DISCIPLINARY INCIDENT REPORT",
      company,
      ref: `HR/DISC-R/${Date.now().toString(36).toUpperCase()}`,
      sections: [
        {
          heading: "1. INCIDENT DETAILS",
          fields: [
            { label: "Employee", value: v(d, "employee") },
            { label: "Employee ID", value: v(d, "employeeId") },
            { label: "Date of incident", value: v(d, "incidentDate") },
            { label: "Location / department", value: v(d, "location") },
            { label: "Reported by", value: v(d, "reportedBy") },
            { label: "Witnesses", value: v(d, "witnesses") },
          ],
        },
        {
          heading: "2. NATURE OF OFFENCE",
          body: v(d, "offence", "\n\n"),
        },
        {
          heading: "3. IMMEDIATE ACTION TAKEN",
          body: v(d, "action", "\n\n"),
        },
        {
          heading: "4. RECOMMENDATION (office use)",
          fields: [{ label: "Recommended outcome", value: "_____________________________________________" }],
        },
      ],
      signatures: [
        { label: "Reporting officer", name: v(d, "reportedBy", "") },
        { label: "HR Manager" },
      ],
    }),
  },
  {
    id: "sick_note",
    label: "Sick Note Register",
    description: "Medical certificate cover sheet filed with the doctor's note",
    fields: [
      { key: "employee", label: "Employee name" },
      { key: "employeeId", label: "Employee ID" },
      { key: "clinic", label: "Clinic / doctor" },
      { key: "certNo", label: "Certificate number" },
      { key: "from", label: "Absent from", type: "date" },
      { key: "to", label: "Absent to", type: "date" },
      { key: "days", label: "Days", type: "number" },
    ],
    render: (d, company) => ({
      docType: "SICK LEAVE — MEDICAL CERTIFICATE REGISTER",
      company,
      ref: `HR/SICK/${Date.now().toString(36).toUpperCase()}`,
      sections: [
        {
          heading: "1. EMPLOYEE & ABSENCE",
          fields: [
            { label: "Employee", value: v(d, "employee") },
            { label: "Employee ID", value: v(d, "employeeId") },
            { label: "Absent from", value: v(d, "from") },
            { label: "Absent to", value: v(d, "to") },
            { label: "Days", value: v(d, "days") },
          ],
        },
        {
          heading: "2. MEDICAL CERTIFICATE",
          fields: [
            { label: "Issuing clinic / doctor", value: v(d, "clinic") },
            { label: "Certificate number", value: v(d, "certNo") },
            { label: "Original attached", value: "Yes ☐    No ☐" },
          ],
        },
        {
          heading: "3. NOTES",
          body: "The medical certificate must be attached to this register. Sick leave is administered in terms of the Labour Act [Chapter 28:01] and company policy.",
        },
      ],
      signatures: [
        { label: "Employee" },
        { label: "HR — verified" },
      ],
    }),
  },
  {
    id: "asset_issue",
    label: "Asset Issue Form",
    description: "Company property handover — laptops, phones, bus passes, keys",
    fields: [
      { key: "employee", label: "Employee name" },
      { key: "employeeId", label: "Employee ID" },
      { key: "asset", label: "Asset description", placeholder: "e.g. Dell laptop / Bus pass / Keys" },
      { key: "serial", label: "Serial / asset number" },
      { key: "condition", label: "Condition on issue" },
      { key: "returnBy", label: "Return date (if temporary)", type: "date" },
    ],
    render: (d, company) => ({
      docType: "COMPANY ASSET ISSUE FORM",
      company,
      ref: `HR/ASSET/${Date.now().toString(36).toUpperCase()}`,
      sections: [
        {
          heading: "1. ASSET ISSUED",
          fields: [
            { label: "Issued to", value: v(d, "employee") },
            { label: "Employee ID", value: v(d, "employeeId") },
            { label: "Asset", value: v(d, "asset") },
            { label: "Serial / asset no.", value: v(d, "serial") },
            { label: "Condition", value: v(d, "condition") },
            { label: "Return by", value: v(d, "returnBy", "On termination") },
          ],
        },
        {
          heading: "2. DECLARATION",
          body: "I acknowledge receipt of the company property described above in the stated condition and accept responsibility for its safekeeping. I will return it on demand or on termination of employment, fair wear and tear excepted.",
        },
      ],
      signatures: [
        { label: "Employee", name: v(d, "employee", "") },
        { label: "Issuing officer" },
      ],
    }),
  },
  {
    id: "exit_checklist",
    label: "Exit Clearance Checklist",
    description: "Offboarding sign-off — assets, access, final pay",
    fields: [
      { key: "employee", label: "Employee name" },
      { key: "employeeId", label: "Employee ID" },
      { key: "lastDay", label: "Last working day", type: "date" },
      { key: "reason", label: "Reason for exit", placeholder: "Resignation / Retirement / Dismissal / Contract end" },
    ],
    render: (d, company) => ({
      docType: "EXIT CLEARANCE CHECKLIST",
      company,
      ref: `HR/EXIT/${Date.now().toString(36).toUpperCase()}`,
      sections: [
        {
          heading: "1. EMPLOYEE",
          fields: [
            { label: "Name", value: v(d, "employee") },
            { label: "Employee ID", value: v(d, "employeeId") },
            { label: "Last working day", value: v(d, "lastDay") },
            { label: "Reason", value: v(d, "reason") },
          ],
        },
        {
          heading: "2. CLEARANCES — sign off each item",
          fields: [
            { label: "Company assets returned (laptop, keys, bus pass, uniform)", value: "☐" },
            { label: "System & email access revoked", value: "☐" },
            { label: "Outstanding loans / advances reconciled", value: "☐" },
            { label: "Leave balance calculated", value: "☐" },
            { label: "Exit interview conducted", value: "☐" },
            { label: "Final pay computation approved", value: "☐" },
          ],
        },
        {
          heading: "3. FINAL PAY (office use)",
          fields: [{ label: "Net final pay", value: "USD _____________" }, { label: "Deductions applied", value: "_____________" }],
        },
      ],
      signatures: [
        { label: "Employee" },
        { label: "Line Manager" },
        { label: "HR" },
        { label: "Finance" },
      ],
    }),
  },
];
