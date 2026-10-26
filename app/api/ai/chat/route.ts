import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Groq retired the llama-3.x chat models — gpt-oss-120b is the current flagship. Override via GROQ_MODEL.
const MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

/**
 * Groq-backed AI assistant endpoint.
 * POST { messages: {role, content}[], context?: string }
 *  - mode "chat" (default): free-form assistant reply (markdown-ish text)
 *  - mode "advice": returns JSON array of { type, title, text } advice cards
 */
export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "AI is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const context = typeof body.context === "string" ? body.context : "";
  const mode = ["advice", "parse", "digest"].includes(body.mode) ? body.mode as string : "chat";

  const system =
    mode === "parse"
      ? `You convert spoken money-log sentences into structured JSON for a cash tracking app. Reply with ONLY a JSON object: {"type":"expense"|"income", "amount":number, "payee":"who was paid or who paid", "category":"one of Person, Shop, Bills, Food, Transport, Subscriptions, Gift, Health, Fun, Salary, Business, Refund, Interest, Side Hustle, Other", "note":"optional short note or null"}. Infer category from context (e.g. taxi→Transport, groceries→Shop or Food, Netflix→Subscriptions, someone's name→Person, salary→Salary). If amount is missing use 0.`
    : mode === "digest"
      ? `You write the user's weekly money digest for a budget app — warm, plain, motivating. Structure: a one-line headline, a 2-3 line recap of the week (money in vs out), the biggest spending area, one win, and one thing to watch next week. Under 130 words. Use <b> for figures and <ul><li> for the watch/win lines — rendered as HTML. Reference real numbers from the context.`
    : mode === "advice"
      ? `You are a sharp, friendly personal-finance coach inside a budget app. Analyse the user's real cashflow data and respond with practical, specific guidance.
Rules:
- Reply with ONLY a JSON array of 4 to 7 objects: {"type": "warn"|"tip"|"praise"|"action", "title": "…", "text": "…"}
- "warn" = something they're overspending on or should cut down; "tip" = spending advice; "action" = a concrete next step; "praise" = what they're doing well.
- Reference actual numbers, payees and categories from the data. Keep each text under 40 words. Plain text only — no markdown, no emojis.
- If the data is empty or tiny, give general advice for starting out instead.`
      : `You are the friendly AI financial assistant inside the Dr PT budget app. Use the financial context provided to answer questions about the user's income, expenses and savings. Be concise (under 120 words), warm and practical. Use <ul><li> for lists and <b> for figures — the client renders them as HTML. Never make up numbers that aren't in the context.`;

  const payload = {
    model: MODEL,
    temperature: mode === "advice" ? 0.4 : 0.6,
    max_tokens: 900,
    messages: [
      { role: "system", content: system + (context ? `\n\nUSER FINANCIAL CONTEXT:\n${context}` : "") },
      ...(mode === "advice"
        ? [{ role: "user", content: "Review my cashflow and give me your advice cards now." }]
        : mode === "digest"
          ? [{ role: "user", content: "Write my weekly money digest now." }]
          : messages.slice(-12)),
    ],
    ...(mode === "advice" || mode === "parse" ? { response_format: { type: "json_object" } } : {}),
  };

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "AI request failed" },
        { status: 502 }
      );
    }
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    if (mode === "parse") {
      try {
        return NextResponse.json({ entry: JSON.parse(content) });
      } catch {
        return NextResponse.json({ error: "Could not parse the entry" }, { status: 422 });
      }
    }

    if (mode === "advice") {
      // Model returns {"cards": [...]} or a bare array — normalise either
      try {
        const parsed = JSON.parse(content);
        const cards = Array.isArray(parsed) ? parsed : Object.values(parsed)[0];
        return NextResponse.json({ cards: Array.isArray(cards) ? cards : [] });
      } catch {
        return NextResponse.json({ cards: [], error: "Could not parse advice" });
      }
    }
    return NextResponse.json({ reply: content });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}
