interface SinkMessage {
  id: string;
  receivedAt: string;
  from: string;
  to: string[];
  subject: string;
  text: string | null;
  html: string | null;
}

const HTTP_URL = process.env.MAIL_HTTP_URL ?? "http://localhost:1080";

async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${HTTP_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`mail sink API returned ${res.status} for ${path}`);
  }
  return res.json();
}

function listLine(message: SinkMessage): string {
  return `#${message.id}  ${message.receivedAt}  ${message.from} → ${message.to.join(", ")}  —  ${message.subject}`;
}

function printMessage(message: SinkMessage): void {
  console.log(listLine(message));
  console.log("---");
  console.log(message.text ?? message.html ?? "(no body)");
}

function usage(): void {
  console.error(
    "usage: node scripts/mail-cli.ts <list|read <id>|wait [match] [--timeout SECONDS]|clear|health>"
  );
}

function parseTimeoutArg(args: string[], fallback: number): number {
  const index = args.indexOf("--timeout");
  if (index === -1 || index + 1 >= args.length) return fallback;
  const value = Number(args[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function run(): Promise<number> {
  const [cmd, ...rest] = process.argv.slice(2);

  switch (cmd) {
    case "list": {
      const messages = (await fetchJson("/api/email")) as SinkMessage[];
      if (messages.length === 0) {
        console.log("mail sink: no messages");
        return 0;
      }
      messages.forEach((m) => console.log(listLine(m)));
      return 0;
    }

    case "read": {
      const id = rest[0];
      if (!id) {
        usage();
        return 2;
      }
      const message = (await fetchJson(`/api/email/${id}`)) as SinkMessage;
      printMessage(message);
      return 0;
    }

    case "wait": {
      const match = rest.find((a) => !a.startsWith("--")) ?? null;
      const timeoutSeconds = parseTimeoutArg(rest, 30);
      const before = new Set(((await fetchJson("/api/email")) as SinkMessage[]).map((m) => m.id));
      const matches = (m: SinkMessage): boolean => {
        if (!match) return true;
        return (
          m.subject.includes(match) ||
          m.from.includes(match) ||
          m.to.some((addr) => addr.includes(match))
        );
      };
      const deadline = Date.now() + timeoutSeconds * 1000;
      while (Date.now() < deadline) {
        const messages = (await fetchJson("/api/email")) as SinkMessage[];
        const found = messages.find((m) => !before.has(m.id) && matches(m));
        if (found) {
          printMessage(found);
          return 0;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      console.error(`mail sink: no matching message within ${timeoutSeconds}s`);
      return 1;
    }

    case "clear": {
      const result = (await fetchJson("/api/email/all", { method: "DELETE" })) as {
        ok: boolean;
      };
      console.log(result.ok ? "mail sink: cleared" : "mail sink: clear failed");
      return 0;
    }

    case "health": {
      const health = (await fetchJson("/api/health")) as {
        ok: boolean;
        smtpPort: number;
        httpUrl: string;
        messageCount: number;
      };
      console.log(
        `mail sink: SMTP :${health.smtpPort}, HTTP ${health.httpUrl} — ${health.messageCount} message(s)`
      );
      return 0;
    }

    default: {
      usage();
      return 2;
    }
  }
}

run()
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    console.error(
      `mail sink unreachable at ${HTTP_URL} — start it with \`npm run dev\` or \`npm run mail\``,
      err instanceof Error ? `(${err.message})` : ""
    );
    process.exit(1);
  });
