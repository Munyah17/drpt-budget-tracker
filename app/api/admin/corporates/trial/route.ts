import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbPatch } from "@/lib/server/supabaseAdmin";
import { isAdminRequest } from "@/lib/server/admin";
import { sendUserEmail } from "@/lib/server/notify";
import { detailTable, highlightBox, BRAND } from "@/lib/server/emailTemplate";
import { APP_URL } from "@/lib/server/appUrl";
import crypto from "crypto";

export const runtime = "nodejs";

async function denied(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!(await isAdminRequest(req, serviceKey))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** POST /api/admin/corporates/trial — generate a 7-day trial link and email it */
export async function POST(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;

  const body = await req.json().catch(() => null);
  const corporateId = body?.corporate_id;
  const email = body?.email;

  if (!corporateId) {
    return NextResponse.json({ error: "corporate_id required" }, { status: 400 });
  }

  // Get corporate details
  const rows = await sbGet<Record<string, unknown>>(
    "corporates",
    `id=eq.${encodeURIComponent(corporateId)}&select=id,name,contact_email,contact_name,trial_started_at,trial_ends_at&limit=1`
  );
  const corp = rows[0];
  if (!corp) {
    return NextResponse.json({ error: "Corporate not found" }, { status: 404 });
  }

  // Check if trial already active
  const now = Date.now();
  const trialEnds = corp.trial_ends_at ? new Date(corp.trial_ends_at as string).getTime() : null;
  if (trialEnds && trialEnds > now) {
    return NextResponse.json({ 
      error: "Trial already active", 
      trial_ends_at: corp.trial_ends_at,
      trial_days_left: Math.ceil((trialEnds - now) / 86400000)
    }, { status: 400 });
  }

  // Generate trial token
  const trialToken = crypto.randomBytes(32).toString("hex");
  const trialStartedAt = new Date().toISOString();
  const trialEndsAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // Update corporate with trial info
  const ok = await sbPatch(
    "corporates",
    `id=eq.${encodeURIComponent(corporateId)}`,
    {
      trial_started_at: trialStartedAt,
      trial_ends_at: trialEndsAt,
      trial_token: trialToken,
    }
  );

  if (!ok) {
    return NextResponse.json({ error: "Failed to update corporate" }, { status: 500 });
  }

  // Generate trial link
  const trialLink = `${APP_URL}/corporate/trial?token=${trialToken}&corp=${corporateId}`;

  // Send email if contact email exists
  const contactEmail = (email || corp.contact_email) as string;
  const contactName = corp.contact_name as string;
  
  if (contactEmail) {
    const emailBody = `
      <p>Hi ${contactName || "there"},</p>
      <p>Your <strong>7-day free trial</strong> for the Unified HR Solution has been activated!</p>
      ${detailTable([
        ["Company", corp.name as string],
        ["Trial Period", "7 days"],
        ["Started", new Date(trialStartedAt).toLocaleDateString()],
        ["Ends", new Date(trialEndsAt).toLocaleDateString()],
      ])}
      ${highlightBox(`Click the button below to access your trial dashboard. You have full access to all HR features during this period.`)}
      <p style="margin-top: 20px; font-size: 13px; color: #666;">
        After your trial ends, you can choose to subscribe to continue using the service.
      </p>
    `;

    await sendUserEmail({
      to: contactEmail,
      subject: `Your 7-day Unified HR trial is ready - ${corp.name}`,
      heading: "Trial Activated",
      emoji: "🚀",
      badge: "Trial",
      badgeColor: BRAND.green,
      bodyHtml: emailBody,
      cta: { label: "Access Your Trial", url: trialLink },
    });
  }

  return NextResponse.json({
    success: true,
    trial_link: trialLink,
    trial_started_at: trialStartedAt,
    trial_ends_at: trialEndsAt,
    email_sent: !!contactEmail,
  });
}
