import { NextRequest, NextResponse } from "next/server";
import { marketFor } from "@/lib/pricing";
import { pricesForCountry } from "@/lib/server/pricing";

export const runtime = "nodejs";

/** Public resolved prices for a checkout country (defaults + admin overrides). */
export async function GET(req: NextRequest) {
  const country = (req.nextUrl.searchParams.get("country") ?? "").trim();
  const data = await pricesForCountry(country);
  return NextResponse.json(
    { country: country.toLowerCase(), market: marketFor(country), ...data },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
