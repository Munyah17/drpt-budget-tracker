export function gbp(n: number): string {
  const neg = n < 0;
  n = Math.abs(n);
  return (neg ? "-" : "") + "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ukDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 1 || /[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
