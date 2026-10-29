/**
 * Earned Wage Access helpers — accrual math for the "Early Pay" feature.
 * Employees may access a share of the salary they have ALREADY earned this
 * month; the advance plus a flat access fee is repaid from the next payslip.
 */

const isWorkday = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6;

/** Mon–Fri days in a calendar month. */
export function workdaysInMonth(year: number, month: number): number {
  let n = 0;
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) if (isWorkday(new Date(year, month, d))) n++;
  return n;
}

/** Mon–Fri days elapsed so far this month, including today. */
export function workdaysElapsed(now: Date): number {
  let n = 0;
  for (let d = 1; d <= now.getDate(); d++)
    if (isWorkday(new Date(now.getFullYear(), now.getMonth(), d))) n++;
  return n;
}

/** Salary earned so far this month (pro-rated over working days). */
export function accruedWages(netMonthly: number, now: Date): number {
  const total = workdaysInMonth(now.getFullYear(), now.getMonth());
  if (!total || netMonthly <= 0) return 0;
  return Math.round(((netMonthly * workdaysElapsed(now)) / total) * 100) / 100;
}

/** The day salary lands — last weekday of the month. */
export function nextPayday(now: Date): Date {
  let d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  while (!isWorkday(d)) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  return d;
}

/** Access fee for a requested amount. */
export function advanceFee(amount: number, feePct: number): number {
  return Math.round(amount * (feePct / 100) * 100) / 100;
}
