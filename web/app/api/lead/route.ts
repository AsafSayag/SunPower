import { MAX_UPLOAD_MB, UPLOAD_TYPES } from "@/lib/forms";

// Receives every site form and passes it on to LEAD_WEBHOOK_URL (the hub that will fan out to
// WhatsApp, email and the CRM). Until that address is set, submissions are refused, not dropped silently.
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

  const out = new FormData();
  out.set("page", String(data.get("page") ?? "").slice(0, 200));
  out.set("submittedAt", new Date().toISOString());
  let hasContent = false;
  for (const [key, value] of data.entries()) {
    if (!key.startsWith("field:") || typeof value !== "string") continue;
    const text = value.trim().slice(0, 2000);
    if (text) hasContent = true;
    out.set(key.slice(6).slice(0, 100), text);
  }
  if (!hasContent) return Response.json({ error: "empty" }, { status: 400 });

  const file = data.get("file");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024 || !UPLOAD_TYPES.includes(ext))
      return Response.json({ error: "bad_file" }, { status: 400 });
    out.set("file", file, file.name);
  }

  const hook = process.env.LEAD_WEBHOOK_URL;
  if (!hook) return Response.json({ error: "not_configured" }, { status: 503 });

  const res = await fetch(hook, { method: "POST", body: out });
  if (!res.ok) return Response.json({ error: "delivery_failed" }, { status: 502 });
  return Response.json({ ok: true });
}
