import { mailEnv } from "@sdk-e/shared";

export interface MailInput {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export type MailTransport = "sink";

export type MailResult =
  | { ok: true; transport: MailTransport; messageId: string }
  | { ok: false; error: string };

export async function sendMail(input: MailInput): Promise<MailResult> {
  const env = mailEnv();
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport(env.MAIL_SMTP_URL);
    const info = await transport.sendMail({
      from: env.MAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true, transport: "sink", messageId: info.messageId };
  } catch (error) {
    const message =
      error instanceof Error
        ? `${error.message}${"code" in error ? ` (${String(error.code)})` : ""}`
        : "unknown mail error";
    console.error(`sendMail failed via ${env.MAIL_SMTP_URL}: ${message}`);
    return { ok: false, error: message };
  }
}
