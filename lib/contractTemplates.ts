/**
 * Contract & letter templates — field definitions + renderer to PrintDoc.
 * Bodies are plain-text legal boilerplate; values interpolate from the form.
 */
import { PrintDoc } from "@/lib/printDoc";

export interface ContractTemplate {
  id: string;
  label: string;
  description: string;
  fields: { key: string; label: string; type?: "text" | "number" | "date"; placeholder?: string }[];
  render: (d: Record<string, string>, company: string) => PrintDoc;
}

const v = (d: Record<string, string>, k: string, fb = "________________") => d[k]?.trim() || fb;

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "employment",
    label: "Employment Contract",
    description: "Full contract of employment — position, pay, hours, leave, termination",
    fields: [
      { key: "employee", label: "Employee full name" },
      { key: "nationalId", label: "National ID / Passport" },
      { key: "jobTitle", label: "Job title" },
      { key: "department", label: "Department / SBU" },
      { key: "startDate", label: "Start date", type: "date" },
      { key: "salary", label: "Gross monthly salary (USD)", type: "number" },
      { key: "probation", label: "Probation months", type: "number", placeholder: "3" },
      { key: "leaveDays", label: "Annual leave days", type: "number", placeholder: "21" },
    ],
    render: (d, company) => ({
      docType: "CONTRACT OF EMPLOYMENT",
      company,
      ref: `HR/CON/${Date.now().toString(36).toUpperCase()}`,
      sections: [
        {
          heading: "1. PARTIES",
          body: `This Contract of Employment is entered into between ${company} ("the Employer") and ${v(d, "employee")} of National ID/Passport No. ${v(d, "nationalId")} ("the Employee").`,
        },
        {
          heading: "2. POSITION AND COMMENCEMENT",
          fields: [
            { label: "Job Title", value: v(d, "jobTitle") },
            { label: "Department / SBU", value: v(d, "department") },
            { label: "Commencement Date", value: v(d, "startDate") },
            { label: "Probation Period", value: `${v(d, "probation", "3")} months` },
          ],
        },
        {
          heading: "3. REMUNERATION",
          body: `The Employee shall be paid a gross monthly salary of USD ${v(d, "salary")}, payable monthly in arrears on or before the last working day of each month, subject to statutory deductions (PAYE, NSSA) and authorised deductions including approved salary advances, staff loans and Early Pay repayments.`,
        },
        {
          heading: "4. HOURS OF WORK",
          body: "The Employee shall work the standard hours of the Employer, being 40 (forty) hours per week, Monday to Friday, or such shift pattern as may be reasonably required by the business.",
        },
        {
          heading: "5. LEAVE",
          body: `The Employee is entitled to ${v(d, "leaveDays", "21")} working days of paid annual leave per leave cycle, plus sick leave in accordance with the Labour Act [Chapter 28:01] and the Employer's leave policy.`,
        },
        {
          heading: "6. TERMINATION",
          body: "Either party may terminate this contract by giving one (1) month's written notice during probation and three (3) months' written notice thereafter, or payment in lieu of notice. Termination for cause follows the Employer's registered code of conduct.",
        },
        {
          heading: "7. GENERAL",
          body: "This contract constitutes the entire agreement between the parties and supersedes all prior arrangements. It is governed by the laws of Zimbabwe.",
        },
      ],
      signatures: [
        { label: "For and on behalf of the Employer", name: "" },
        { label: "The Employee", name: v(d, "employee", "") },
        { label: "Witness" },
      ],
      footerNote: "Two originals — one retained by the Employer, one by the Employee.",
    }),
  },
  {
    id: "offer",
    label: "Offer Letter",
    description: "Formal offer of employment pending contract signature",
    fields: [
      { key: "employee", label: "Candidate full name" },
      { key: "jobTitle", label: "Job title" },
      { key: "startDate", label: "Proposed start date", type: "date" },
      { key: "salary", label: "Gross monthly salary (USD)", type: "number" },
      { key: "respondBy", label: "Respond by", type: "date" },
    ],
    render: (d, company) => ({
      docType: "OFFER OF EMPLOYMENT",
      company,
      subject: `Dear ${v(d, "employee")},`,
      sections: [
        {
          body: `We are pleased to offer you the position of ${v(d, "jobTitle")} at ${company}, reporting on ${v(d, "startDate")}, at a gross monthly salary of USD ${v(d, "salary")}.\n\nThis offer is conditional upon satisfactory references, verification of qualifications, and signature of a formal Contract of Employment. Please confirm your acceptance in writing by ${v(d, "respondBy")}.\n\nWe look forward to welcoming you to the team.`,
        },
      ],
      signatures: [
        { label: "HR Manager, " + company },
        { label: "Candidate — Accepted" },
      ],
    }),
  },
  {
    id: "nda",
    label: "Non-Disclosure Agreement",
    description: "Confidentiality agreement for staff and contractors",
    fields: [
      { key: "employee", label: "Employee / contractor name" },
      { key: "nationalId", label: "ID number" },
      { key: "role", label: "Role / engagement" },
      { key: "effectiveDate", label: "Effective date", type: "date" },
      { key: "term", label: "Duration (years)", type: "number", placeholder: "2" },
    ],
    render: (d, company) => ({
      docType: "NON-DISCLOSURE AGREEMENT",
      company,
      ref: `HR/NDA/${Date.now().toString(36).toUpperCase()}`,
      sections: [
        {
          heading: "1. PARTIES AND PURPOSE",
          body: `This Non-Disclosure Agreement is made between ${company} ("the Company") and ${v(d, "employee")}, ID No. ${v(d, "nationalId")} ("the Recipient"), in connection with the Recipient's engagement as ${v(d, "role")}, effective ${v(d, "effectiveDate")}.`,
        },
        {
          heading: "2. CONFIDENTIAL INFORMATION",
          body: "Confidential Information includes all non-public information relating to the Company's business, finances, payroll data, employee records, customer data, trade secrets, systems and processes, in any form.",
        },
        {
          heading: "3. OBLIGATIONS",
          body: "The Recipient shall: (a) keep all Confidential Information strictly confidential; (b) use it solely for the purpose of the engagement; (c) not disclose it to any third party without prior written consent; (d) return or destroy all materials containing Confidential Information upon request or termination of the engagement.",
        },
        {
          heading: "4. TERM",
          body: `These obligations remain in force for ${v(d, "term", "2")} year(s) following the end of the engagement.`,
        },
        {
          heading: "5. GOVERNING LAW",
          body: "This Agreement is governed by the laws of Zimbabwe.",
        },
      ],
      signatures: [
        { label: "For and on behalf of the Company" },
        { label: "The Recipient", name: v(d, "employee", "") },
      ],
    }),
  },
  {
    id: "loan",
    label: "Staff Loan Agreement",
    description: "Loan/advance repayment agreement with payroll deduction consent",
    fields: [
      { key: "employee", label: "Employee name" },
      { key: "employeeId", label: "Employee ID" },
      { key: "amount", label: "Principal amount (USD)", type: "number" },
      { key: "months", label: "Repayment months", type: "number", placeholder: "6" },
      { key: "monthly", label: "Monthly deduction (USD)", type: "number" },
      { key: "startDate", label: "First deduction date", type: "date" },
      { key: "reason", label: "Purpose" },
    ],
    render: (d, company) => ({
      docType: "STAFF LOAN AGREEMENT",
      company,
      ref: `FIN/LN/${Date.now().toString(36).toUpperCase()}`,
      sections: [
        {
          heading: "1. THE LOAN",
          body: `${company} ("the Employer") agrees to advance to ${v(d, "employee")}, Employee No. ${v(d, "employeeId")}, a staff loan of USD ${v(d, "amount")} for the purpose of ${v(d, "reason", "personal use")}.`,
        },
        {
          heading: "2. REPAYMENT",
          fields: [
            { label: "Principal", value: `USD ${v(d, "amount")}` },
            { label: "Monthly deduction", value: `USD ${v(d, "monthly")}` },
            { label: "Number of instalments", value: v(d, "months") },
            { label: "First deduction", value: v(d, "startDate") },
          ],
        },
        {
          heading: "3. PAYROLL DEDUCTION AUTHORISATION",
          body: "The Employee irrevocably authorises the Employer to deduct the monthly instalment directly from net salary. If employment ends before full repayment, the outstanding balance becomes immediately due and may be deducted from the Employee's final pay or terminal benefits to the extent permitted by law.",
        },
        {
          heading: "4. ACKNOWLEDGEMENT",
          body: "The Employee confirms receiving the principal amount and agrees to the terms above.",
        },
      ],
      signatures: [
        { label: "For and on behalf of the Employer" },
        { label: "The Employee", name: v(d, "employee", "") },
        { label: "Witness (HR)" },
      ],
    }),
  },
  {
    id: "salary_cert",
    label: "Salary Certificate",
    description: "Employment & income confirmation for banks, rentals, visas",
    fields: [
      { key: "employee", label: "Employee name" },
      { key: "nationalId", label: "ID number" },
      { key: "jobTitle", label: "Job title" },
      { key: "since", label: "Employed since", type: "date" },
      { key: "gross", label: "Gross monthly salary (USD)", type: "number" },
      { key: "net", label: "Net monthly salary (USD)", type: "number" },
      { key: "purpose", label: "Purpose", placeholder: "e.g. Bank loan application" },
    ],
    render: (d, company) => ({
      docType: "EMPLOYMENT & SALARY CERTIFICATE",
      company,
      ref: `HR/CERT/${Date.now().toString(36).toUpperCase()}`,
      subject: "TO WHOM IT MAY CONCERN",
      sections: [
        {
          body: `This is to certify that ${v(d, "employee")}, holder of National ID No. ${v(d, "nationalId")}, is employed by ${company} as ${v(d, "jobTitle")} and has been in our continuous employment since ${v(d, "since")}.\n\nThe Employee's current earnings are:\n\nGross monthly salary: USD ${v(d, "gross")}\nNet monthly salary: USD ${v(d, "net")}\n\nThis certificate is issued at the Employee's request for the purpose of ${v(d, "purpose", "official use")}.`,
        },
      ],
      signatures: [{ label: "Authorised signatory, " + company }],
      footerNote: "Valid for 90 days from date of issue.",
    }),
  },
  {
    id: "warning",
    label: "Written Warning",
    description: "Disciplinary warning letter — misconduct or performance",
    fields: [
      { key: "employee", label: "Employee name" },
      { key: "employeeId", label: "Employee ID" },
      { key: "incidentDate", label: "Date of incident", type: "date" },
      { key: "level", label: "Warning level", placeholder: "e.g. First Written / Final Written" },
      { key: "offence", label: "Nature of offence" },
      { key: "hearingDate", label: "Hearing date", type: "date" },
    ],
    render: (d, company) => ({
      docType: "WRITTEN WARNING",
      company,
      ref: `HR/DISC/${Date.now().toString(36).toUpperCase()}`,
      subject: `To: ${v(d, "employee")} (Employee No. ${v(d, "employeeId")})`,
      sections: [
        {
          heading: "1. THE OFFENCE",
          body: `Following a disciplinary hearing held on ${v(d, "hearingDate")}, it was found that on ${v(d, "incidentDate")} you committed the following offence: ${v(d, "offence")}.`,
        },
        {
          heading: "2. OUTCOME",
          body: `This letter constitutes a ${v(d, "level", "First Written Warning")}, which will remain active on your record for twelve (12) months. A repeat of this or similar misconduct may result in further disciplinary action, up to and including dismissal.`,
        },
        {
          heading: "3. RIGHT OF APPEAL",
          body: "You may appeal this decision in writing to the HR Manager within five (5) working days of receipt of this letter.",
        },
      ],
      signatures: [
        { label: "HR Manager" },
        { label: "Chairperson of hearing" },
        { label: "Employee — receipt acknowledged" },
      ],
    }),
  },
];
