import { createTransport } from "nodemailer";

export interface MailOptions {
  to: string;
  toName: string;
  subject: string;
  html: string;
}

/**
 * Sends an email. SMTP settings come from environment variables so the app
 * works out of the box: if unset, messages are logged to the console instead
 * of being sent.
 */
export async function sendMail({ to, toName, subject, html }: MailOptions): Promise<void> {
  if (process.env.SMTP_HOST) {
    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASS ?? "",
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "Noreply <noreply@example.com>",
      to: `"${toName}" <${to}>`,
      subject,
      html,
    });
    return;
  }
  // No SMTP configured: mirror the email to the console for development.
  console.log(
    `[mail] To: "${toName}" <${to}>\n[mail] Subject: ${subject}\n[mail] Body:\n${html}`,
  );
}