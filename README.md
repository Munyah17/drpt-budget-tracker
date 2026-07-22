# Dr Patie ❤ — Personal Budget Tracker

A Next.js (App Router + TypeScript) port of the Dr Patie personal budget tracker prototype — same UI/UX, same features, rebuilt as a proper Next.js app instead of a single static HTML file.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Plain CSS (design tokens ported from the original prototype, no UI framework)
- In-memory React Context for app state (income, expenses, bills, savings goals, budgets, theme, toasts)

## Pages

Dashboard, Income, Expenses, Transactions, Budget Planner, Savings Goals, Bills, Reports, Analytics, AI Assistant (canned responses), Calendar, Settings, Profile — plus a login screen gate.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with any email/password (the login form is a prototype gate, not real auth) to reach the dashboard.

## Notes

- Data is seeded in `lib/data.ts` and lives only in memory for the session (add/edit/delete on Income, Expenses and Savings Goals persists in state, not to a backend).
- Theme preference (light/dark) persists via `localStorage`.
