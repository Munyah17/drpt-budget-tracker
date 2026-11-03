import { apiOk, withApi } from "@/lib/server/api";

export const runtime = "nodejs";

/** GET /api/v1 — discovery: service info, key scopes, resource index. */
export const GET = withApi("read", async (_req, key) =>
  apiOk({
    service: "WellSpend API",
    version: "v1",
    key: { name: key.name, prefix: `${key.key_prefix}…`, scopes: key.scopes },
    auth: "X-API-Key: drpt_sk_... or Authorization: Bearer drpt_sk_...",
    rateLimit: "120 requests/minute per key — X-RateLimit-* headers on every response",
    resources: {
      corporates: {
        list: "GET /api/v1/corporates?status=&limit=&offset=",
        create: "POST /api/v1/corporates",
      },
      employees: {
        list: "GET /api/v1/employees?corporate_id=&limit=&offset=",
        create: "POST /api/v1/employees",
      },
      invoices: {
        list: "GET /api/v1/invoices?kind=&status=&corporate_id=",
        create: "POST /api/v1/invoices",
        read: "GET /api/v1/invoices/:id",
        update: "PATCH /api/v1/invoices/:id",
      },
    },
    webhooks:
      "Subscriptions POST {event, timestamp, data} to your URL with X-WellSpend-Signature (HMAC-SHA256). Events: corporate.created, employee.created, invoice.created, invoice.paid",
    envelopes: "Success → {data} | Error → {error:{code,message}}",
  })
);
