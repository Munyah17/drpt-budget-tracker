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
import { Bill, Budget, ExpenseEntry, Goal, IncomeEntry, Transaction, UserProfile, UserRole } from "./types";
import { supabase } from "./supabase";

export interface ToastItem {
  id: number;
  message: string;
  icon: string;
  leaving?: boolean;
}

interface AppDataContextValue {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  theme: "light" | "dark";
  toggleTheme: () => void;

  month: string;
  setMonth: (m: string) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;

  toasts: ToastItem[];
  toast: (message: string, icon?: string) => void;

  accounts: typeof ACCOUNTS;
  budgets: Budget[];
  bills: Bill[];

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

  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  categorySpend: Record<string, number>;
  allTransactions: Transaction[];
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

let toastSeq = 1;

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [month, setMonth] = useState("May 2025");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const [income, setIncome] = useState<IncomeEntry[]>(INITIAL_INCOME);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(INITIAL_EXPENSES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [bills] = useState<Bill[]>(INITIAL_BILLS);
  const [budgets] = useState<Budget[]>(BUDGETS);

  useEffect(() => {
    const saved = localStorage.getItem("drpatie-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser storage on mount
    if (saved === "dark" || saved === "light") setTheme(saved);

    // Check for existing session
    const checkSession = async () => {
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
          });
          setIsAuthenticated(true);
        }
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      // For demo purposes, check hardcoded credentials first
      const ADMIN_EMAIL = "munyamuzvidziwa19@gmail.com";
      const ADMIN_PASSWORD = "@@Griezmann177#$";
      const DEMO_EMAIL = "user@demo.com";
      const DEMO_PASSWORD = "demo123";

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Admin login
        const userProfile: UserProfile = {
          id: "admin-001",
          email: ADMIN_EMAIL,
          name: "Admin User",
          role: "admin",
        };
        setUser(userProfile);
        setIsAuthenticated(true);
        localStorage.setItem("drpatie-user", JSON.stringify(userProfile));
        return true;
      }

      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        // Demo user login
        const userProfile: UserProfile = {
          id: "demo-001",
          email: DEMO_EMAIL,
          name: "Demo User",
          role: "user",
        };
        setUser(userProfile);
        setIsAuthenticated(true);
        localStorage.setItem("drpatie-user", JSON.stringify(userProfile));
        return true;
      }

      // Try Supabase auth for other users
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || 'User',
          role: profile?.role || 'user',
        };
        setUser(userProfile);
        setIsAuthenticated(true);
        localStorage.setItem("drpatie-user", JSON.stringify(userProfile));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("drpatie-user");
  }, []);

  const value: AppDataContextValue = {
    isAuthenticated,
    user,
    login,
    logout,
    theme,
    toggleTheme,
    month,
    setMonth,
    sidebarOpen,
    setSidebarOpen,
    toasts,
    toast,
    accounts: ACCOUNTS,
    budgets,
    bills,
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
