"use client";

import { useState } from "react";
import { track } from "@/components/AnalyticsEvents";
import { type FormField, MAX_UPLOAD_MB, PRIVACY_PATH, UPLOAD_TYPES } from "@/lib/forms";

type Props = { fields: FormField[]; page: string };
type Status = "idle" | "sending" | "sent" | "error";

export default function LeadForm({ fields, page }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const submitLabel = fields.find((f) => f.type === "submit")?.label ?? "שליחה";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (file instanceof File && file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setStatus("error");
      setMessage("קובץ זה חורג מהגודל המרבי המותר.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/lead/", { method: "POST", body: data });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      // The conversion: one event per delivered form, with the page it came from.
      track("generate_lead", { form_page: page });
      setStatus("sent");
      setMessage("הפרטים נשלחו, נחזור אליכם בהקדם.");
    } catch {
      setStatus("error");
      setMessage("השליחה לא הצליחה. אפשר לנסות שוב או להתקשר אלינו.");
    }
  }

  return (
    <form className="lead-form" onSubmit={onSubmit}>
      <input type="hidden" name="page" value={page} />
      <label className="hp" aria-hidden="true">
        אתר
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {fields.map((f, i) => {
        const name = `field:${f.label}`;
        if (f.type === "submit") return null;
        if (f.type === "acceptance")
          return (
            <label key={i} className="accept">
              <input type="checkbox" name="accepted" value="yes" required />
              <span>
                אני מאשר/ת שקראתי את <a href={PRIVACY_PATH}>מדיניות הפרטיות</a> של האתר
              </span>
            </label>
          );
        if (f.type === "upload")
          return (
            <label key={i}>
              {f.label}
              <input type="file" name="file" accept={UPLOAD_TYPES.join(",")} required={f.required} />
            </label>
          );
        if (f.type === "textarea")
          return (
            <label key={i}>
              {f.label}
              <textarea name={name} rows={4} placeholder={f.placeholder} required={f.required} />
            </label>
          );
        if (f.type === "select")
          return (
            <label key={i}>
              {f.label}
              <select name={name} required={f.required} defaultValue="">
                <option value="">{f.placeholder ?? f.label}</option>
                {f.options?.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          );
        return (
          <label key={i}>
            {f.label}
            <input
              type={f.type === "tel" || f.type === "email" ? f.type : "text"}
              name={name}
              placeholder={f.placeholder}
              required={f.required}
              autoComplete={f.type === "tel" ? "tel" : f.type === "email" ? "email" : undefined}
            />
          </label>
        );
      })}
      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "שולח..." : submitLabel}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
