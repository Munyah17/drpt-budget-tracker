export interface Account {
  name: string;
  icon: string;
  balance: number;
}

export interface IncomeEntry {
  id: number;
  source: string;
  category: string;
  date: string;
  amount: number;
  recurring: "None" | "Weekly" | "Monthly" | "Yearly";
}

export interface ExpenseEntry {
  id: number;
  merchant: string;
  category: string;
  date: string;
  amount: number;
  account: string;
  method: string;
  tags: string[];
  recurring: boolean;
}

export interface Bill {
  id: number;
  name: string;
  amount: number;
  due: string;
  status: "upcoming" | "paid" | "overdue";
  daysLeft: number;
  icon: string;
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  saved: number;
  deadline: string;
}

export interface Budget {
  category: string;
  budget: number;
  spent: number;
}

export interface Transaction {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  account: string;
}

export type UserRole = "admin" | "user" | "corporate" | "employee";

export type Currency = "GBP" | "USD" | "EUR" | "ZAR" | "AUD" | "CAD" | "JPY" | "CNY" | "INR" | "BWP" | "ZWL";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  currency: Currency;
  isPaid: boolean;
  /** Set for corporate-issued employee accounts — ties the account to an organisation */
  organisation?: string;
}
