import process from "node:process";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lboanbhltmblyyefzvzr.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, txnRef] = process.argv.slice(2);

if (!serviceKey || !email) {
  console.error("Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/approve_direct_payment.mjs <email> [transaction_ref]");
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

function nextMonth(iso) {
  const base = iso && new Date(iso).getTime() > Date.now() ? new Date(iso) : new Date();
  base.setMonth(base.getMonth() + 1);
  return base.toISOString();
}

const paymentsRes = await fetch(
  `${SUPABASE_URL}/rest/v1/payments?user_email=eq.${encodeURIComponent(email)}&status=eq.pending&provider=in.(ecocash,bank)&order=created_at.desc&limit=10&select=id,user_id,user_email,provider,method,amount,currency,reference,status,meta,created_at`,
  { headers, cache: "no-store" }
);
const payments = await paymentsRes.json();
if (!paymentsRes.ok || !Array.isArray(payments)) {
  console.error("payments lookup failed", paymentsRes.status, payments);
  process.exit(1);
}

const payment = txnRef
  ? payments.find((p) => p.meta?.transaction_ref === txnRef) ?? payments[0]
  : payments[0];
if (!payment) {
  console.error("No pending direct-transfer payment found for", email);
  process.exit(1);
}
if (txnRef && payment.meta?.transaction_ref !== txnRef) {
  console.error("Transaction ref mismatch", { wanted: txnRef, got: payment.meta?.transaction_ref });
  process.exit(1);
}

const now = new Date().toISOString();
const payPatch = await fetch(`${SUPABASE_URL}/rest/v1/payments?id=eq.${payment.id}`, {
  method: "PATCH",
  headers: { ...headers, Prefer: "return=minimal" },
  body: JSON.stringify({ status: "paid", paid_at: now }),
});
if (!payPatch.ok) {
  console.error("payment patch failed", payPatch.status, await payPatch.text());
  process.exit(1);
}

const userId = payment.user_id;
if (userId) {
  const profRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=paid_until`,
    { headers, cache: "no-store" }
  );
  const profRows = await profRes.json();
  const paidUntil = nextMonth(Array.isArray(profRows) ? profRows[0]?.paid_until : null);
  const profPatch = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ is_paid: true, paid_until: paidUntil }),
  });
  if (!profPatch.ok) {
    console.error("profile patch failed", profPatch.status, await profPatch.text());
    process.exit(1);
  }

  const confirm = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ email_confirm: true }),
  });
  if (!confirm.ok) {
    console.error("email confirm failed", confirm.status, await confirm.text());
    process.exit(1);
  }
}

console.log(JSON.stringify({ ok: true, paymentId: payment.id, userId, paidUntil: userId ? nextMonth(null) : null }, null, 2));
