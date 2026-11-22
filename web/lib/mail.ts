import nodemailer from "nodemailer";

/* Lead emails go out through the business's own Google Workspace mailbox.
   SMTP_USER      the mailbox that sends (for example office@sun-power.co.il)
   SMTP_PASSWORD  an app password created for that mailbox, never the real password
   LEAD_TO        comma-separated recipients; defaults to SMTP_USER */
export const mailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD);

type Lead = { page: string; fields: [string, string][]; file?: { name: string; data: Buffer } };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function sendLead(lead: Lead) {
  const user = process.env.SMTP_USER!;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: process.env.SMTP_PASSWORD! },
  });
  const email = lead.fields.find(([, v]) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))?.[1];
  const rows = lead.fields.map(([k, v]) => `<tr><th align="right" style="padding:4px 12px">${esc(k)}</th><td style="padding:4px 12px">${esc(v)}</td></tr>`);
  await transport.sendMail({
    from: `"אתר סאן פאוור" <${user}>`,
    to: (process.env.LEAD_TO ?? user).split(",").map((s) => s.trim()).filter(Boolean),
    replyTo: email,
    // Same subject the old site used, so existing mail filters keep working.
    subject: `ליד חדש מהאתר - דף ${lead.page}`,
    text: lead.fields.map(([k, v]) => `${k}: ${v}`).join("\n"),
    html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2>ליד חדש מהאתר</h2><p>עמוד: ${esc(lead.page)}</p><table>${rows.join("")}</table></div>`,
    attachments: lead.file ? [{ filename: lead.file.name, content: lead.file.data }] : undefined,
  });
}
