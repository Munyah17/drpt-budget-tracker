/**
 * Server-only Gemini Flash vision extraction for receipts, screenshots and
 * PDF statements. Never import this from client components.
 */

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

export interface ExtractedReceipt {
  merchant: string;
  amount: number;
  currency: string;
  /** ISO date; includes time when the receipt shows it */
  datetime: string;
  category: string;
  vat: number | null;
  line_items: { name: string; price: number }[];
  confidence: number; // 0..1
}

export interface ExtractedItem {
  type: "expense" | "income";
  payee: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  confidence: number;
}

export interface VisionResult {
  kind: "receipt" | "transactions";
  receipt?: ExtractedReceipt;
  items?: ExtractedItem[];
}

const PROMPT = `You extract financial data from a document image/PDF for a budget app.

Decide what kind of document this is:
- "receipt": a single purchase receipt, invoice, or proof of payment → fill "receipt"
- "transactions": a bank statement, transaction list, receipt book page, or screenshot showing MULTIPLE transactions → fill "items"

Rules:
- Reply with ONLY a JSON object matching the schema.
- For a receipt: merchant = seller name, amount = grand total paid (positive), currency = ISO 4217 code, datetime = ISO-8601 including time if printed (otherwise date only), category = best-fit spending category, vat = tax amount if shown else null, line_items only when clearly itemised.
- For transactions: each item type is "expense" (money out, debits, payments) or "income" (money in, credits, deposits). amount is always positive. payee = merchant/counterparty. date = ISO date (YYYY-MM-DD).
- confidence: 0.0-1.0 per item — lower it when a field is guessed or unreadable.
- If the document is unreadable or not financial, return {"kind":"transactions","items":[]}.`;

const SCHEMA = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["receipt", "transactions"] },
    receipt: {
      type: "object",
      properties: {
        merchant: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string" },
        datetime: { type: "string" },
        category: { type: "string" },
        vat: { type: ["number", "null"] },
        line_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: "number" },
            },
          },
        },
        confidence: { type: "number" },
      },
    },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["expense", "income"] },
          payee: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string" },
          date: { type: "string" },
          category: { type: "string" },
          confidence: { type: "number" },
        },
      },
    },
  },
  required: ["kind"],
};

/** Extract receipt or transaction data from an image or PDF (base64). */
export async function extractWithGemini(
  base64: string,
  mime: string
): Promise<VisionResult | { error: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { error: "Extraction is not configured" };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(45_000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mime, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: SCHEMA,
          temperature: 0.1,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data?.error?.message ?? "Extraction failed" };
    }
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) return { error: "Nothing extracted" };
    return JSON.parse(text) as VisionResult;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Extraction failed" };
  }
}
