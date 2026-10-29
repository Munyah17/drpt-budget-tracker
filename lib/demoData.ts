import { Bill, Budget, ExpenseEntry, Goal, IncomeEntry } from "./types";

/** A believable month for the "See Demo" walkthrough, built around today so it never looks stale. Demo only; never saved. */
export function demoData() {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const day = (n: number) => iso(new Date(now.getFullYear(), now.getMonth(), Math.max(1, Math.min(n, now.getDate()))));
  const inDays = (n: number) => iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));

  const income: IncomeEntry[] = [
    { id: 9001, source: "Salary", category: "Salary", date: day(1), amount: 2400, recurring: "Monthly" },
    { id: 9002, source: "Freelance design", category: "Private Practice", date: day(12), amount: 350, recurring: "None" },
  ];

  const spend = (id: number, merchant: string, category: string, d: number, amount: number, method = "Debit Card", recurring = false): ExpenseEntry => ({
    id, merchant, category, date: day(d), amount, account: "Main account", method, tags: [], recurring,
  });
  const expenses: ExpenseEntry[] = [
    spend(9101, "Rent", "Housing", 1, 800, "Bank Transfer", true),
    spend(9102, "Food Lovers Market", "Food", 3, 64.2),
    spend(9103, "Engen Fuel", "Transport", 5, 45),
    spend(9104, "Netflix", "Entertainment", 6, 12.99, "Credit Card", true),
    spend(9105, "Electricity prepaid", "Utilities", 8, 40, "Debit Card"),
    spend(9106, "Pharmacy", "Health", 10, 22.5),
    spend(9107, "Woolworths", "Food", 14, 78.4),
    spend(9108, "Uber", "Transport", 16, 18.75),
    spend(9109, "Gym membership", "Personal", 18, 30, "Direct Debit", true),
    spend(9110, "Takeaway", "Food", 21, 24.6),
  ].filter((e) => e.date <= iso(now));

  const goals: Goal[] = [
    { id: 9201, name: "Emergency fund", target: 3000, saved: 1250, deadline: inDays(180) },
    { id: 9202, name: "Holiday", target: 1200, saved: 420, deadline: inDays(120) },
  ];

  const bills: Bill[] = [
    { id: 9301, name: "Internet", amount: 45, due: inDays(4), status: "upcoming", daysLeft: 4, icon: "wifi" },
    { id: 9302, name: "Car insurance", amount: 68, due: inDays(9), status: "upcoming", daysLeft: 9, icon: "shield" },
  ];

  const budgets: Budget[] = [
    { category: "Housing", budget: 850, spent: 0 },
    { category: "Food", budget: 300, spent: 0 },
    { category: "Transport", budget: 120, spent: 0 },
    { category: "Entertainment", budget: 60, spent: 0 },
    { category: "Utilities", budget: 90, spent: 0 },
  ].map((b) => ({ ...b, spent: expenses.filter((e) => e.category === b.category).reduce((s, e) => s + e.amount, 0) }));

  return { income, expenses, goals, bills, budgets };
}
