import { mailEnv } from "@sdk-e/shared";

export interface MailInput {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export type MailTransport = "resend" | "sink";

export type MailResult =
  | { ok: true; transport: MailTransport; messageId: string }
  | { ok: false; error: string };

export async function sendMail(input: MailInput): Promise<MailResult> {
  const env = mailEnv();
  if (env.RESEND_API_KEY) {
    return sendViaResend(input, env.RESEND_API_KEY, env.MAIL_FROM);
  }
  return sendViaSmtp(input, env);
}

async function sendViaResend(
  input: MailInput,
  apiKey: string,
  from: string,
): Promise<MailResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    const body = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };
    if (!response.ok) {
      const detail = body.message ?? body.name ?? response.statusText;
      console.error(`sendMail resend rejected (${response.status}): ${detail}`);
      return { ok: false, error: detail };
    }
    return {
      ok: true,
      transport: "resend",
      messageId: body.id ?? crypto.randomUUID(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown resend error";
    console.error(`sendMail resend failed: ${message}`);
    return { ok: false, error: message };
  }
}

async function sendViaSmtp(
  input: MailInput,
  env: ReturnType<typeof mailEnv>,
): Promise<MailResult> {
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
    console.error(`sendMail smtp failed: ${message}`);
    return { ok: false, error: message };
  }
}
