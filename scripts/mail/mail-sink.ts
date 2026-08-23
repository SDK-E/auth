import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import smtpTester from "smtp-tester";

interface StoredMessage {
  id: number;
  receivedAt: string;
  sender: string;
  receivers: string[];
  subject: string;
  text: string | null;
  html: string | null;
  raw: string;
}

const SMTP_PORT = Number(process.env.MAIL_SMTP_PORT ?? 1025);
const HTTP_PORT = Number(process.env.MAIL_HTTP_PORT ?? 1080);

const messages: StoredMessage[] = [];

const smtp = smtpTester.init(SMTP_PORT);

smtp.bind((_recipient, id, email) => {
  const rawSubject = email.headers.subject;
  const subject = typeof rawSubject === "string" ? rawSubject : String(rawSubject ?? "");
  const message: StoredMessage = {
    id,
    receivedAt: new Date().toISOString(),
    sender: email.sender,
    receivers: Object.keys(email.receivers),
    subject,
    text: typeof email.body === "string" ? email.body : null,
    html: typeof email.html === "string" ? email.html : null,
    raw: email.data,
  };
  messages.push(message);
  console.log(
    `mail sink: received #${id} — ${subject} (from ${message.sender} to ${message.receivers.join(", ")})`
  );
});

function publicMessage(message: StoredMessage) {
  return {
    id: String(message.id),
    receivedAt: message.receivedAt,
    from: message.sender,
    to: message.receivers,
    subject: message.subject,
    text: message.text,
    html: message.html,
  };
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://localhost:${HTTP_PORT}`);
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      smtpPort: SMTP_PORT,
      httpUrl: `http://localhost:${HTTP_PORT}`,
      messageCount: messages.length,
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/email") {
    sendJson(res, 200, messages.map(publicMessage));
    return;
  }

  const idMatch = pathname.match(/^\/api\/email\/(\d+)$/);
  if (req.method === "GET" && idMatch) {
    const message = messages.find((m) => m.id === Number(idMatch[1]));
    if (!message) {
      sendJson(res, 404, { error: "message not found" });
      return;
    }
    sendJson(res, 200, publicMessage(message));
    return;
  }

  if (req.method === "DELETE" && pathname === "/api/email/all") {
    messages.length = 0;
    sendJson(res, 200, { ok: true, messageCount: 0 });
    return;
  }

  sendJson(res, 404, { error: "not found" });
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`mail sink: SMTP on :${SMTP_PORT}, HTTP API on http://localhost:${HTTP_PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    httpServer.close(() => smtp.stop(() => process.exit(0)));
    setTimeout(() => process.exit(0), 1000).unref();
  });
}
