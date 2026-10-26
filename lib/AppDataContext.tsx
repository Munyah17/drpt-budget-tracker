"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ACCOUNTS,
  BILLS as INITIAL_BILLS,
  BUDGETS,
  INITIAL_EXPENSES,
  INITIAL_GOALS,
  INITIAL_INCOME,
} from "./data";
import { Account, Bill, Budget, ExpenseEntry, Goal, IncomeEntry, Transaction, UserProfile, UserRole, Currency } from "./types";
import { supabase } from "./supabase";
import { DEFAULT_CURRENCY, formatCurrency, setActiveCurrency } from "./format";

export interface ToastItem {
  id: number;
  message: string;
  icon: string;
  leaving?: boolean;
}

interface AppDataContextValue {
  isAuthenticated: boolean;
  /** True once the initial session restore (localStorage + Supabase) has settled */
  authReady: boolean;
  user: UserProfile | null;
  /** True while browsing with the throwaway demo account — nothing is persisted */
  isDemo: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  /** One-click demo sign-in for prospective customers — in-memory only */
  loginDemo: () => void;
  logout: () => void;

  theme: "light" | "dark";
  toggleTheme: () => void;

  month: string;
  setMonth: (m: string) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;

  toasts: ToastItem[];
  toast: (message: string, icon?: string) => void;

  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Format an amount in the active currency (user profile or selected) */
  fmt: (n: number) => string;

  accounts: Account[];
  addAccount: (account: Account) => void;
  updateUser: (patch: Partial<UserProfile>) => void;
  budgets: Budget[];
  updateBudget: (category: string, amount: number) => void;
  bills: Bill[];
  addBill: (bill: Omit<Bill, "id" | "status" | "daysLeft">) => void;
  markBillPaid: (id: number) => void;

  income: IncomeEntry[];
  addIncome: (entry: Omit<IncomeEntry, "id">) => void;
  updateIncome: (id: number, entry: Omit<IncomeEntry, "id">) => void;
  deleteIncome: (id: number) => void;

  expenses: ExpenseEntry[];
  addExpense: (entry: Omit<ExpenseEntry, "id">) => void;
  updateExpense: (id: number, entry: Omit<ExpenseEntry, "id">) => void;
  deleteExpense: (id: number) => void;

  goals: Goal[];
  addGoal: (goal: Omit<Goal, "id">) => void;
  updateGoal: (id: number, goal: Omit<Goal, "id">) => void;
  deleteGoal: (id: number) => void;

  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  categorySpend: Record<string, number>;
  allTransactions: Transaction[];
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

let toastSeq = 1;

/** Profile used for the public "See Demo" walkthrough — regular user, paid, unsaved */
const DEMO_USER_PROFILE: UserProfile = {
  id: "demo-preview",
  email: "demo@wellspend.app",
  name: "Demo User",
  role: "user",
  currency: DEFAULT_CURRENCY,
  isPaid: true,
};

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [month, setMonth] = useState("May 2025");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const [accounts, setAccounts] = useState<Account[]>(ACCOUNTS);
  const [income, setIncome] = useState<IncomeEntry[]>(INITIAL_INCOME);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(INITIAL_EXPENSES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [budgets, setBudgets] = useState<Budget[]>(BUDGETS);

  useEffect(() => {
    const saved = localStorage.getItem("drpatie-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser storage on mount
    if (saved === "dark" || saved === "light") setTheme(saved);

    // Restore chosen display currency
    const savedCurrency = localStorage.getItem("drpatie-currency");
    if (savedCurrency) setCurrencyState(savedCurrency);

    // Restore locally persisted profile (demo/admin/corporate/employee logins
    // have no Supabase session, so this is the only thing that survives reload)
    try {
      const raw = localStorage.getItem("drpatie-user");
      if (raw) {
        const profile = JSON.parse(raw) as UserProfile;
        setUser(profile);
        setIsAuthenticated(true);
      }
    } catch {
      localStorage.removeItem("drpatie-user");
    }

    // Check for existing Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: profile.name || 'User',
              role: profile.role || 'user',
              currency: profile.currency || DEFAULT_CURRENCY,
              isPaid: profile.is_paid || false,
            });
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setAuthReady(true);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Keep module-level active currency in sync for the shorthand formatters
  useEffect(() => {
    setActiveCurrency(user?.currency || currency);
  }, [user?.currency, currency]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("drpatie-theme", next);
      return next;
    });
  }, []);

  const toast = useCallback((message: string, icon = "check-circle") => {
    const id = toastSeq++;
    setToasts((prev) => [...prev, { id, message, icon }]);
    const leaveTimer = setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      const removeTimer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timers.current.delete(id);
      }, 300);
      timers.current.set(id, removeTimer);
    }, 2800);
    timers.current.set(id, leaveTimer);
  }, []);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
    };
  }, []);

  const addIncome = useCallback((entry: Omit<IncomeEntry, "id">) => {
    setIncome((prev) => [{ id: Date.now(), ...entry }, ...prev]);
  }, []);
  const updateIncome = useCallback((id: number, entry: Omit<IncomeEntry, "id">) => {
    setIncome((prev) => prev.map((i) => (i.id === id ? { id, ...entry } : i)));
  }, []);
  const deleteIncome = useCallback((id: number) => {
    setIncome((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addExpense = useCallback((entry: Omit<ExpenseEntry, "id">) => {
    setExpenses((prev) => [{ id: Date.now(), ...entry }, ...prev]);
  }, []);
  const updateExpense = useCallback((id: number, entry: Omit<ExpenseEntry, "id">) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { id, ...entry } : e)));
  }, []);
  const deleteExpense = useCallback((id: number) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, "id">) => {
    setGoals((prev) => [...prev, { id: Date.now(), ...goal }]);
  }, []);
  const updateGoal = useCallback((id: number, goal: Omit<Goal, "id">) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { id, ...goal } : g)));
  }, []);
  const deleteGoal = useCallback((id: number) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const updateBudget = useCallback((category: string, amount: number) => {
    setBudgets((prev) => prev.map((b) => (b.category === category ? { ...b, budget: amount } : b)));
  }, []);

  const addAccount = useCallback((account: Account) => {
    setAccounts((prev) => [...prev, account]);
  }, []);

  const updateUser = useCallback((patch: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      // Demo sessions are never persisted
      if (next.id !== DEMO_USER_PROFILE.id) {
        localStorage.setItem("drpatie-user", JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const addBill = useCallback((bill: Omit<Bill, "id" | "status" | "daysLeft">) => {
    const daysLeft = Math.max(0, Math.ceil((new Date(bill.due).getTime() - Date.now()) / 86400000));
    setBills((prev) => [...prev, { id: Date.now(), status: "upcoming" as const, daysLeft, ...bill }]);
  }, []);

  const markBillPaid = useCallback((id: number) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, status: "paid" as const, daysLeft: 0 } : b)));
  }, []);

  const totalIncome = useMemo(() => income.reduce((s, i) => s + i.amount, 0), [income]);
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalBalance = useMemo(() => ACCOUNTS.reduce((s, a) => s + a.balance, 0), []);
  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const allTransactions = useMemo<Transaction[]>(() => {
    const inc: Transaction[] = income.map((i) => ({
      id: "in" + i.id,
      name: i.source,
      category: i.category,
      date: i.date,
      amount: i.amount,
      type: "income",
      account: "Barclays Current",
    }));
    const exp: Transaction[] = expenses.map((e) => ({
      id: "ex" + e.id,
      name: e.merchant,
      category: e.category,
      date: e.date,
      amount: -e.amount,
      type: "expense",
      account: e.account,
    }));
    return [...inc, ...exp].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [income, expenses]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    try {
      // For demo purposes, check hardcoded credentials first
      const ADMIN_EMAIL = "munyamuzvidziwa19@gmail.com";
      const ADMIN_PASSWORD = "@@Griezmann177#$";
      const DEMO_EMAIL = "user@demo.com";
      const DEMO_PASSWORD = "demo123";
      const CORPORATE_EMAIL = "corp@demo.com";
      const CORPORATE_PASSWORD = "corp123";
      const EMPLOYEE_EMAIL = "employee@acme.com";
      const EMPLOYEE_PASSWORD = "emp123";

      if (email === EMPLOYEE_EMAIL && password === EMPLOYEE_PASSWORD) {
        // Employee accounts are issued by a corporate company — tied to an organisation
        const userProfile: UserProfile = {
          id: "emp-001",
          email: EMPLOYEE_EMAIL,
          name: "Emma Wilson",
          role: "employee",
          currency: DEFAULT_CURRENCY,
          isPaid: true,
          organisation: "Acme Corporation",
        };
        setUser(userProfile);
        setIsAuthenticated(true);
        localStorage.setItem("drpatie-user", JSON.stringify(userProfile));
        return { success: true, role: "employee" };
      }

      if (email === CORPORATE_EMAIL && password === CORPORATE_PASSWORD) {
        const userProfile: UserProfile = {
          id: "corp-001",
          email: CORPORATE_EMAIL,
          name: "Corporate Admin",
          role: "corporate",
          currency: DEFAULT_CURRENCY,
          isPaid: true,
        };
        setUser(userProfile);
        setIsAuthenticated(true);
        localStorage.setItem("drpatie-user", JSON.stringify(userProfile));
        return { success: true, role: "corporate" };
      }

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Admin login
        const userProfile: UserProfile = {
          id: "admin-001",
          email: ADMIN_EMAIL,
          name: "Admin User",
          role: "admin",
          currency: DEFAULT_CURRENCY,
          isPaid: true,
        };
        setUser(userProfile);
        setIsAuthenticated(true);
        localStorage.setItem("drpatie-user", JSON.stringify(userProfile));
        return { success: true, role: "admin" };
      }

      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        // Demo user login
        const userProfile: UserProfile = {
          id: "demo-001",
          email: DEMO_EMAIL,
          name: "Demo User",
          role: "user",
          currency: DEFAULT_CURRENCY,
          isPaid: true,
        };
        setUser(userProfile);
        setIsAuthenticated(true);
        localStorage.setItem("drpatie-user", JSON.stringify(userProfile));
        return { success: true, role: "user" };
      }

      // Try Supabase auth for other users
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userRole: UserRole = profile?.role || 'user';
        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || 'User',
          role: userRole,
          currency: profile?.currency || DEFAULT_CURRENCY,
          isPaid: profile?.is_paid || false,
        };
        setUser(userProfile);
        setIsAuthenticated(true);
        localStorage.setItem("drpatie-user", JSON.stringify(userProfile));
        return { success: true, role: userRole };
      }

      return { success: false, error: "Sign-in failed. Please try again." };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error instanceof Error ? error.message : "Sign-in failed. Please try again." };
    }
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("drpatie-currency", c);
    setUser((prev) => (prev ? { ...prev, currency: c } : prev));
  }, []);

  const fmt = useCallback(
    (n: number) => formatCurrency(n, user?.currency || currency),
    [user?.currency, currency]
  );

  const loginDemo = useCallback(() => {
    // In-memory only: no Supabase session, no localStorage — refresh/logout ends it
    setIsDemo(true);
    setUser(DEMO_USER_PROFILE);
    setIsAuthenticated(true);
    setAuthReady(true);
  }, []);

  const logout = useCallback(async () => {
    if (!isDemo) await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setIsDemo(false);
    localStorage.removeItem("drpatie-user");
  }, [isDemo]);

  const value: AppDataContextValue = {
    isAuthenticated,
    authReady,
    user,
    isDemo,
    login,
    loginDemo,
    logout,
    theme,
    toggleTheme,
    month,
    setMonth,
    sidebarOpen,
    setSidebarOpen,
    toasts,
    toast,
    currency,
    setCurrency,
    fmt,
    accounts,
    addAccount,
    updateUser,
    budgets,
    updateBudget,
    bills,
    addBill,
    markBillPaid,
    income,
    addIncome,
    updateIncome,
    deleteIncome,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    totalIncome,
    totalExpenses,
    totalBalance,
    categorySpend,
    allTransactions,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
