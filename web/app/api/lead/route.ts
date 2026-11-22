import { MAX_UPLOAD_MB, UPLOAD_TYPES } from "@/lib/forms";
import { mailConfigured, sendLead } from "@/lib/mail";

/* Receives every site form. Delivery, in order of preference:
   1. email through the business mailbox (SMTP_USER / SMTP_PASSWORD)
   2. a webhook (LEAD_WEBHOOK_URL), kept for a future CRM
   With neither configured the request is refused, never dropped silently. */
export async function POST(request: Request) {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  // Bots fill the hidden field; answer OK so they do not retry.
  if (data.get("website")) return Response.json({ ok: true });
  if (data.get("accepted") !== "yes") return Response.json({ error: "consent_required" }, { status: 400 });

  const page = String(data.get("page") ?? "").slice(0, 200);
  const fields: [string, string][] = [];
  for (const [key, value] of data.entries()) {
    if (!key.startsWith("field:") || typeof value !== "string") continue;
    const text = value.trim().slice(0, 2000);
    if (text) fields.push([key.slice(6).slice(0, 100), text]);
  }
  if (!fields.length) return Response.json({ error: "empty" }, { status: 400 });

  const upload = data.get("file");
  let file: { name: string; data: Buffer } | undefined;
  if (upload instanceof File && upload.size > 0) {
    const ext = upload.name.slice(upload.name.lastIndexOf(".")).toLowerCase();
    if (upload.size > MAX_UPLOAD_MB * 1024 * 1024 || !UPLOAD_TYPES.includes(ext))
      return Response.json({ error: "bad_file" }, { status: 400 });
    file = { name: upload.name.slice(-120), data: Buffer.from(await upload.arrayBuffer()) };
  }

  const hook = process.env.LEAD_WEBHOOK_URL;
  if (!mailConfigured() && !hook) return Response.json({ error: "not_configured" }, { status: 503 });

  try {
    if (mailConfigured()) await sendLead({ page, fields, file });
    if (hook) {
      const out = new FormData();
      out.set("page", page);
      out.set("submittedAt", new Date().toISOString());
      for (const [k, v] of fields) out.set(k, v);
      const res = await fetch(hook, { method: "POST", body: out });
      if (!res.ok && !mailConfigured()) throw new Error(`webhook ${res.status}`);
    }
  } catch (err) {
    // Logged for the site owner; the visitor sees a retry message with the phone number.
    console.error("lead delivery failed", err instanceof Error ? err.message : err);
    return Response.json({ error: "delivery_failed" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
