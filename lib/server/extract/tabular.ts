/**
 * Server-only CSV/XLSX statement parsing. Rows are mapped to transactions
 * locally after Groq guesses the column layout — cheap even for big files.
 * Never import this from client components.
 */
import ExcelJS from "exceljs";
import { groqJson } from "./groq";
import type { ExtractedItem } from "./gemini";

/** Minimal CSV reader: handles quoted fields, commas-in-quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell); cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

/** First worksheet of an .xlsx file → grid of display strings. */
export async function readXlsx(buf: ArrayBuffer | Buffer): Promise<string[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const rows: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (r) => {
    const cells: string[] = [];
    for (let c = 1; c <= r.cellCount; c++) {
      const v = r.getCell(c).value;
      cells.push(
        v == null ? "" :
        v instanceof Date ? v.toISOString().slice(0, 10) :
        typeof v === "object" && "text" in v ? String((v as { text: unknown }).text) :
        typeof v === "object" && "result" in v ? String((v as { result: unknown }).result ?? "") :
        String(v)
      );
    }
    rows.push(cells);
  });
  return rows;
}

interface ColumnMap {
  date_col: number;
  desc_col: number;
  amount_col: number;
  debit_col: number;
  credit_col: number;
  currency_col: number;
  currency: string;
  date_format: string;
  amount_negates: boolean;
}

const MAP_PROMPT = `You identify columns in a bank statement export. Given the header row and sample rows (as JSON arrays, index from 0), reply with ONLY JSON:
{"date_col":i,"desc_col":i,"amount_col":i,"debit_col":i,"credit_col":i,"currency_col":i,"currency":"ISO fallback","date_format":"YYYY-MM-DD|DD/MM/YYYY|MM/DD/YYYY|DD-MM-YYYY|DD.MM.YYYY","amount_negates":false}
- amount_col: single column of signed amounts (-1 if the file splits money out/in into two columns)
- debit_col/credit_col: money-out / money-in columns (-1 when using amount_col)
- amount_negates: true when POSITIVE numbers in amount_col mean money going OUT
- desc_col: the column with merchant/payee/narrative text
- Use -1 for any column that doesn't exist.`;

async function guessColumns(grid: string[][]): Promise<ColumnMap | null> {
  if (grid.length < 2) return null;
  const header = grid[0];
  const samples = grid.slice(1, 6);
  const mapped = await groqJson<ColumnMap>(
    MAP_PROMPT,
    JSON.stringify({ header, samples })
  );
  if (mapped && typeof mapped.date_col === "number" && mapped.date_col >= 0) {
    return mapped;
  }
  // Heuristic fallback: first column containing a date-looking value is the
  // date column; first numeric column is amount; first text column is payee.
  const first = samples[0] ?? [];
  const dateIdx = first.findIndex((v) => /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(v.trim()));
  const amtIdx = first.findIndex((v, i) => i !== dateIdx && /^-?[\d,]+(\.\d{1,2})?$/.test(v.trim()));
  const descIdx = first.findIndex((v, i) => i !== dateIdx && i !== amtIdx && v.trim().length > 2 && Number.isNaN(Number(v)));
  if (dateIdx < 0 || amtIdx < 0) return null;
  return {
    date_col: dateIdx, desc_col: descIdx, amount_col: amtIdx,
    debit_col: -1, credit_col: -1, currency_col: -1,
    currency: "GBP", date_format: "auto", amount_negates: false,
  };
}

function toIsoDate(raw: string, fmt: string): string | null {
  const s = raw.trim();
  const m = s.match(/^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})$/);
  if (!m) return null;
  const [, a, b] = m;
  let c = m[3];
  if (a.length === 4) return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
  if (c.length === 2) c = `20${c}`;
  const d1 = Number(a), d2 = Number(b);
  const day = fmt.startsWith("MM/") || (fmt === "auto" && d1 <= 12 && d2 > 12) ? d2 : d1;
  const mon = day === d1 ? d2 : d1;
  if (day > 31 || mon > 12) return null;
  return `${c}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toAmount(raw: string): number | null {
  const n = Number(raw.trim().replace(/[,£$€\s]/g, "").replace(/^\((.*)\)$/, "-$1"));
  return Number.isFinite(n) && n !== 0 ? n : null;
}

/** Grid → normalised transactions. Returns empty when columns can't be mapped. */
export async function gridToItems(grid: string[][]): Promise<ExtractedItem[]> {
  const map = await guessColumns(grid);
  if (!map) return [];
  const items: ExtractedItem[] = [];
  for (const row of grid.slice(1)) {
    const date = toIsoDate(row[map.date_col] ?? "", map.date_format);
    if (!date) continue;

    let amount: number | null = null;
    let type: "expense" | "income" = "expense";
    if (map.amount_col >= 0) {
      const raw = toAmount(row[map.amount_col] ?? "");
      if (raw == null) continue;
      const signed = map.amount_negates ? -raw : raw;
      type = signed < 0 ? "expense" : "income";
      amount = Math.abs(signed);
    } else {
      const debit = toAmount(row[map.debit_col] ?? "");
      const credit = toAmount(row[map.credit_col] ?? "");
      if (debit != null) { type = "expense"; amount = Math.abs(debit); }
      else if (credit != null) { type = "income"; amount = Math.abs(credit); }
      else continue;
    }

    items.push({
      type,
      payee: (row[map.desc_col] ?? "").trim().slice(0, 120) || "Unknown",
      amount,
      currency: (row[map.currency_col] ?? map.currency ?? "GBP").trim().slice(0, 3).toUpperCase(),
      date,
      category: "Other",
      confidence: 0.8,
    });
  }
  return items;
}
