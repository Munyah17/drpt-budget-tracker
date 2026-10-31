/**
 * Server-only Groq helper — same endpoint/key as /api/ai/chat, factored out so
 * non-chat callers (e.g. statement column mapping) can reuse it.
 * Never import this from client components.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

/** Ask Groq for a JSON object back; returns parsed JSON or null on failure. */
export async function groqJson<T>(system: string, user: string): Promise<T | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    return content ? (JSON.parse(content) as T) : null;
  } catch {
    return null;
  }
}
