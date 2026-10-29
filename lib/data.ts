import { Account, Bill, Budget, ExpenseEntry, Goal, IncomeEntry, Currency } from "./types";

export const USER = {
  name: "WellSpend",
  short: "WellSpend",
  email: "wellspend@email.com",
  location: "London, UK",
};

// All seeded demo data removed — real users start with a clean slate.
export const ACCOUNTS: Account[] = [];

export const INITIAL_INCOME: IncomeEntry[] = [];

export const INITIAL_EXPENSES: ExpenseEntry[] = [];

export const BILLS: Bill[] = [];

export const INITIAL_GOALS: Goal[] = [];

export const BUDGETS: Budget[] = [];

export const CATEGORY_COLORS: Record<string, string> = {
  Housing: "#c81457",
  Transport: "#e91e63",
  Food: "#f0568d",
  Utilities: "#f9a8c9",
  Health: "#a3134f",
  Personal: "#5c0a2b",
  Entertainment: "#ff8fab",
  Other: "#d9b8c6",
  Fuel: "#e91e63",
  Shopping: "#f0568d",
  Education: "#a3134f",
};

export const MONTHLY_TREND = {
  labels: [] as string[],
  income: [] as number[],
  expenses: [] as number[],
};

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { id: "cashflow", label: "Cash Flow", icon: "banknote" },
  { id: "income", label: "Income", icon: "wallet" },
  { id: "expenses", label: "Expenses", icon: "shopping-bag" },
  { id: "transactions", label: "Transactions", icon: "list" },
  { id: "budget", label: "Budget Planner", icon: "pie-chart" },
  { id: "savings", label: "Savings Goals", icon: "target" },
  { id: "borrowing", label: "Borrowing", icon: "credit-card" },
  { id: "net-worth", label: "Net Worth", icon: "target" },
  { id: "subscriptions", label: "Subscriptions", icon: "repeat" },
  { id: "bills", label: "Bills", icon: "receipt" },
  { id: "reports", label: "Reports", icon: "file-text" },
  { id: "analytics", label: "Analytics", icon: "bar-chart-3" },
  { id: "ai", label: "AI Assistant", icon: "sparkles" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "profile", label: "Profile", icon: "user-circle" },
];

export const ADMIN_NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "layout-dashboard" },
  { id: "analytics", label: "Analytics", icon: "bar-chart-3" },
  { 
    id: "organisations", 
    label: "Organisations", 
    icon: "building-2",
    subItems: [
      { id: "corporates", label: "Corporate Clients" },
      { id: "contracts", label: "Contracts" },
      { id: "onboarding", label: "Onboarding" }
    ]
  },
  { 
    id: "people", 
    label: "User Management", 
    icon: "users",
    subItems: [
      { id: "individuals", label: "Individual Clients" },
      { id: "employees", label: "Corporate Employees" },
      { id: "staff", label: "Internal Staff" }
    ]
  },
  { 
    id: "operations", 
    label: "Operations", 
    icon: "activity",
    subItems: [
      { id: "payroll", label: "Payroll Batches" },
      { id: "payslips", label: "Payslip Delivery" },
      { id: "exceptions", label: "Exceptions & Incidents" }
    ]
  },
  { 
    id: "finance", 
    label: "Finance", 
    icon: "dollar-sign",
    subItems: [
      { id: "invoices", label: "Invoices" },
      { id: "payments", label: "Payments" },
      { id: "subscriptions", label: "Subscriptions" }
    ]
  },
  { 
    id: "integrations", 
    label: "Integrations", 
    icon: "link",
    subItems: [
      { id: "banks", label: "Bank Connections" },
      { id: "payroll", label: "Payroll Providers" },
      { id: "accounting", label: "Accounting" }
    ]
  },
  { id: "reports", label: "Reports", icon: "file-text" },
  { 
    id: "risk-security", 
    label: "Risk & Security", 
    icon: "shield",
    subItems: [
      { id: "audit", label: "Audit Logs" },
      { id: "access", label: "Access Control" },
      { id: "incidents", label: "Incidents" }
    ]
  },
  { id: "settings", label: "Settings", icon: "settings" },
];

export const CORPORATE_NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: "layout-dashboard" },
  {
    id: "employees",
    label: "Employees",
    icon: "users",
    subItems: [
      { id: "directory", label: "Directory" },
      { id: "onboarding", label: "Onboarding" },
      { id: "import", label: "Bulk Import" }
    ]
  },
  {
    id: "payroll",
    label: "Payroll",
    icon: "dollar-sign",
    subItems: [
      { id: "runs", label: "Payroll Runs" },
      { id: "disbursements", label: "Disbursements" },
      { id: "payslips", label: "Payslips" }
    ]
  },
  { id: "expense-claims", label: "Expense Claims", icon: "receipt" },
  { id: "staff-loans", label: "Early Pay & Loans", icon: "banknote" },
  { id: "announcements", label: "Announcements", icon: "bell" },
  { id: "benefits", label: "Benefits", icon: "heart-pulse" },
  {
    id: "hr",
    label: "HR",
    icon: "clipboard-check",
    subItems: [
      { id: "leave", label: "Leave Management" },
      { id: "attendance", label: "Attendance" },
      { id: "recruitment", label: "Recruitment" },
      { id: "performance", label: "Performance" },
      { id: "documents", label: "Documents" },
      { id: "offboarding", label: "Offboarding" }
    ]
  },
  { id: "compliance", label: "Compliance", icon: "clipboard-check" },
  { id: "roles", label: "Roles & Access", icon: "user-circle" },
  { id: "reports", label: "Reports", icon: "file-text" },
  { id: "integrations", label: "Integrations", icon: "plug" },
  { id: "developer", label: "Developer & API", icon: "key" },
  { id: "settings", label: "Settings", icon: "settings" },
];

// Corporate employees get the full general app plus an Employment section
// that is only available because their account was issued by an organisation.
export const EMPLOYEE_NAV_ITEMS = [
  { id: "employment", label: "Employment", icon: "briefcase", href: "/employee" },
  { id: "payslips", label: "Payslips", icon: "file-text", href: "/employee/payslips" },
  { id: "salary", label: "Salary Management", icon: "dollar-sign", href: "/employee/salary" },
  { id: "leave", label: "Leave", icon: "calendar", href: "/employee/leave" },
  { id: "borrowing-emp", label: "Early Pay", icon: "zap", href: "/employee/borrowing" },
  { id: "benefits", label: "Benefits", icon: "heart-pulse", href: "/employee/benefits" },
  ...NAV_ITEMS.filter((n) => n.id !== "borrowing"),
];

export const INCOME_CATEGORIES = ["Salary", "Private Practice", "Locum", "Investments", "Bonus", "Gift"];
export const INCOME_ICONS: Record<string, string> = {
  Salary: "briefcase",
  "Private Practice": "stethoscope",
  Locum: "clock",
  Investments: "trending-up",
  Bonus: "gift",
  Gift: "gift",
};

export const EXPENSE_CATS = [
  "Housing", "Food", "Fuel", "Insurance", "Council Tax", "Utilities", "Medical",
  "Shopping", "Travel", "Entertainment", "Subscriptions", "Health", "Family", "Education", "Other",
];
export const EXPENSE_ICONS: Record<string, string> = {
  Housing: "home",
  Food: "shopping-cart",
  Fuel: "fuel",
  Insurance: "shield",
  "Council Tax": "landmark",
  Utilities: "zap",
  Medical: "stethoscope",
  Shopping: "shopping-bag",
  Travel: "plane",
  Entertainment: "utensils",
  Subscriptions: "repeat",
  Health: "heart-pulse",
  Family: "users",
  Education: "graduation-cap",
  Other: "more-horizontal",
};

export const PAYMENT_METHODS = ["Debit Card", "Credit Card", "Direct Debit", "Bank Transfer", "Cash"];

/** All active ISO 4217 currency codes — USD first as the app default */
export const CURRENCIES: Currency[] = [
  "USD",
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL",
  "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY",
  "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EGP",
  "ERN", "ETB", "EUR", "FJD", "FKP", "GBP", "GEL", "GHS", "GIP", "GMD",
  "GNF", "GTQ", "GYD", "HKD", "HNL", "HTG", "HUF", "IDR", "ILS", "INR",
  "IQD", "IRR", "ISK", "JMD", "JOD", "JPY", "KES", "KGS", "KHR", "KMF",
  "KPW", "KRW", "KWD", "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL",
  "LYD", "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR",
  "MVR", "MWK", "MXN", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR",
  "NZD", "OMR", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR",
  "RON", "RSD", "RUB", "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD",
  "SHP", "SLE", "SOS", "SRD", "SSP", "STN", "SYP", "SZL", "THB", "TJS",
  "TMT", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "UYU",
  "UZS", "VES", "VND", "VUV", "WST", "XAF", "XCD", "XOF", "XPF", "YER",
  "ZAR", "ZMW",
];

export const REPORTS = [
  { key: "income", icon: "trending-up" },
  { key: "expense", icon: "trending-down" },
  { key: "cashflow", icon: "repeat" },
  { key: "networth", icon: "landmark" },
  { key: "budget", icon: "gauge" },
] as const;

export const AI_RESPONSES: Record<string, string> = {};

export interface CalEvent {
  type: "income" | "expense" | "bill" | "savings";
  label: string;
  amount: number;
}
export const CAL_EVENTS: Record<string, CalEvent[]> = {};
export const EVENT_COLOR: Record<string, string> = {
  income: "#1a9c6d",
  expense: "#e91e63",
  bill: "#d98c0e",
  savings: "#a3134f",
};
