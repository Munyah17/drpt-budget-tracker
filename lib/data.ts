import { Account, Bill, Budget, ExpenseEntry, Goal, IncomeEntry, Currency } from "./types";

export const USER = {
  name: "Dr PT",
  short: "Dr PT",
  email: "drpt@email.com",
  location: "London, UK",
};

export const ACCOUNTS: Account[] = [
  { name: "Barclays Current", icon: "landmark", balance: 4256.8 },
  { name: "Lloyds Savings", icon: "piggy-bank", balance: 3450.0 },
  { name: "Monzo", icon: "credit-card", balance: 719.7 },
  { name: "Revolut", icon: "wallet", balance: 0.0 },
];

export const INITIAL_INCOME: IncomeEntry[] = [
  { id: 1, source: "NHS Salary", category: "Salary", date: "2025-05-28", amount: 4120.0, recurring: "Monthly" },
  { id: 2, source: "Private Practice", category: "Private Practice", date: "2025-05-25", amount: 850.0, recurring: "Weekly" },
  { id: 3, source: "Locum Shift", category: "Locum", date: "2025-05-20", amount: 450.0, recurring: "None" },
  { id: 4, source: "Investment Interest", category: "Investments", date: "2025-05-15", amount: 80.0, recurring: "Monthly" },
  { id: 5, source: "Gift", category: "Gift", date: "2025-05-10", amount: 150.0, recurring: "None" },
];

export const INITIAL_EXPENSES: ExpenseEntry[] = [
  { id: 1, merchant: "Tesco", category: "Food", date: "2025-05-26", amount: 76.45, account: "Barclays Current", method: "Debit Card", tags: ["Groceries"], recurring: false },
  { id: 2, merchant: "Shell", category: "Fuel", date: "2025-05-25", amount: 45.0, account: "Barclays Current", method: "Debit Card", tags: ["Transport"], recurring: false },
  { id: 3, merchant: "Amazon", category: "Shopping", date: "2025-05-24", amount: 32.99, account: "Barclays Current", method: "Debit Card", tags: ["Shopping"], recurring: false },
  { id: 4, merchant: "Gym Membership", category: "Health", date: "2025-05-23", amount: 25.0, account: "Barclays Current", method: "Direct Debit", tags: ["Health"], recurring: true },
  { id: 5, merchant: "Nando's", category: "Entertainment", date: "2025-05-22", amount: 28.5, account: "Monzo", method: "Debit Card", tags: ["Dining"], recurring: false },
  { id: 6, merchant: "Royal College Fee", category: "Education", date: "2025-05-20", amount: 120.0, account: "Barclays Current", method: "Card", tags: ["Professional"], recurring: false },
];

export const BILLS: Bill[] = [
  { id: 1, name: "Council Tax", amount: 120.0, due: "2025-06-01", status: "upcoming", daysLeft: 1, icon: "landmark" },
  { id: 2, name: "Broadband", amount: 29.99, due: "2025-06-02", status: "upcoming", daysLeft: 2, icon: "wifi" },
  { id: 3, name: "Electricity", amount: 67.45, due: "2025-06-05", status: "upcoming", daysLeft: 5, icon: "zap" },
  { id: 4, name: "Medical Defence Insurance", amount: 54.0, due: "2025-06-10", status: "upcoming", daysLeft: 10, icon: "shield" },
  { id: 5, name: "Water Rates", amount: 41.2, due: "2025-05-18", status: "paid", daysLeft: 0, icon: "droplet" },
  { id: 6, name: "Mobile Phone", amount: 22.0, due: "2025-05-12", status: "paid", daysLeft: 0, icon: "smartphone" },
  { id: 7, name: "Netflix", amount: 15.99, due: "2025-05-08", status: "overdue", daysLeft: -2, icon: "tv" },
];

export const INITIAL_GOALS: Goal[] = [
  { id: 1, name: "Vacation to Dubai", target: 2500.0, saved: 1400.0, deadline: "31/12/2025" },
  { id: 2, name: "Emergency Fund", target: 6000.0, saved: 3250.0, deadline: "30/09/2025" },
  { id: 3, name: "New Car", target: 5000.0, saved: 1800.0, deadline: "30/06/2026" },
  { id: 4, name: "House Deposit", target: 20000.0, saved: 4200.0, deadline: "31/12/2026" },
  { id: 5, name: "Investment Fund", target: 10000.0, saved: 2600.0, deadline: "31/03/2027" },
];

export const BUDGETS: Budget[] = [
  { category: "Housing", budget: 1200, spent: 1120 },
  { category: "Transport", budget: 600, spent: 540 },
  { category: "Food", budget: 500, spent: 410 },
  { category: "Utilities", budget: 300, spent: 280 },
  { category: "Health", budget: 300, spent: 260 },
  { category: "Personal", budget: 400, spent: 330 },
  { category: "Entertainment", budget: 250, spent: 180 },
  { category: "Other", budget: 400, spent: 96 },
];

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
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  income: [5200, 5350, 5400, 5500, 5650, 5700],
  expenses: [3400, 3550, 3100, 3300, 3214.75, 3050],
};

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { id: "income", label: "Income", icon: "wallet" },
  { id: "expenses", label: "Expenses", icon: "shopping-bag" },
  { id: "transactions", label: "Transactions", icon: "list" },
  { id: "budget", label: "Budget Planner", icon: "pie-chart" },
  { id: "savings", label: "Savings Goals", icon: "target" },
  { id: "bills", label: "Bills", icon: "receipt" },
  { id: "reports", label: "Reports", icon: "file-text" },
  { id: "analytics", label: "Analytics", icon: "bar-chart-3" },
  { id: "ai", label: "AI Assistant", icon: "sparkles" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "profile", label: "Profile", icon: "user-circle" },
];

export const ADMIN_NAV_ITEMS = [
  { id: "admin", label: "Dashboard", icon: "layout-dashboard" },
  { id: "transactions", label: "Transactions", icon: "list" },
  { id: "reports", label: "Reports", icon: "file-text" },
  { id: "analytics", label: "Analytics", icon: "bar-chart-3" },
  { id: "ai", label: "AI Assistant", icon: "sparkles" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "profile", label: "Profile", icon: "user-circle" },
  { id: "users", label: "User Management", icon: "users" },
  { id: "staff", label: "Staff Management", icon: "user-plus" },
  { id: "accounting", label: "Accounting", icon: "calculator" },
  { id: "pricing", label: "Pricing", icon: "tag" },
  { id: "support", label: "Support", icon: "help-circle" },
  { id: "subscriptions", label: "Subscriptions", icon: "credit-card" },
  { id: "system-health", label: "System Health", icon: "activity" },
  { id: "system-settings", label: "System Settings", icon: "sliders" },
  { id: "configurations", label: "Configurations", icon: "settings" },
  { id: "documentation", label: "Documentation", icon: "book" },
  { id: "billing", label: "Billing & Revenue", icon: "dollar-sign" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "marketing", label: "Marketing", icon: "megaphone" },
  { id: "audit-logs", label: "Audit Logs", icon: "file-check" },
  { id: "live-chat", label: "Live Chat", icon: "message-square" },
  { id: "announcements", label: "Announcements", icon: "radio" },
  { id: "version-control", label: "Version Control", icon: "git-branch" },
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

export const CURRENCIES: Currency[] = [
  "GBP", "USD", "EUR", "ZAR", "AUD", "CAD", "JPY", "CNY", "INR", "BWP", "ZWL"
];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  ZAR: "R",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  BWP: "P",
  ZWL: "$",
};

export const REPORTS = [
  { name: "Income Report", desc: "View your income summary", icon: "trending-up" },
  { name: "Expense Report", desc: "View your expense summary", icon: "trending-down" },
  { name: "Cash Flow Statement", desc: "See your cash flow", icon: "repeat" },
  { name: "Net Worth Report", desc: "View your net worth over time", icon: "landmark" },
  { name: "Budget Performance", desc: "Compare budget vs actual", icon: "gauge" },
];

export const AI_RESPONSES: Record<string, string> = {
  "where did my money go this month?": `You spent £3,214.75 this month. The largest expenses were:<ul><li>Housing: £1,120.00 (34.9%)</li><li>Transport: £540.00 (16.8%)</li><li>Food: £410.00 (12.8%)</li><li>Utilities: £280.00 (8.7%)</li></ul>Tip: you spent 27% more on dining out compared to April. Would you like tips to reduce this?`,
  "summarise june": `June is projected to bring in £5,700 in income against roughly £3,050 in expenses — a healthier month than May, mostly thanks to lower fuel and shopping spend.`,
  "can i afford a holiday?": `Based on your Emergency Fund (54% funded) and current savings rate of 43%, a £1,400 holiday in December looks affordable — you're already 56% of the way to your Vacation to Dubai goal.`,
  "how much should i save?": `A good target for your income level is 20–25% of take-home pay. You're currently saving around 43%, well above that benchmark — nicely done.`,
};

export interface CalEvent {
  type: "income" | "expense" | "bill" | "savings";
  label: string;
  amount: number;
}
export const CAL_EVENTS: Record<string, CalEvent[]> = {
  "2025-05-28": [{ type: "income", label: "NHS Salary", amount: 4120.0 }],
  "2025-06-01": [{ type: "bill", label: "Council Tax", amount: -120.0 }],
  "2025-06-02": [{ type: "bill", label: "Broadband", amount: -29.99 }],
  "2025-05-26": [{ type: "expense", label: "Tesco", amount: -76.45 }],
  "2025-05-25": [
    { type: "expense", label: "Shell", amount: -45.0 },
    { type: "income", label: "Private Practice", amount: 850.0 },
  ],
};
export const EVENT_COLOR: Record<string, string> = {
  income: "#1a9c6d",
  expense: "#e91e63",
  bill: "#d98c0e",
  savings: "#a3134f",
};
