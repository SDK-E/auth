import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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

function listMessages(messages: SinkMessage[]): string {
  if (messages.length === 0) return "mail sink: no messages";
  return messages.map(listLine).join("\n");
}

function sinkUnreachable(): string {
  return `mail sink unreachable at ${HTTP_URL} — start it with \`npm run dev\` (starts automatically) or \`npm run mail\`.`;
}

const server = new McpServer({
  name: "mail-sink",
  version: "1.0.0",
});

server.registerTool(
  "list_emails",
  {
    description:
      "List every email currently held in the local dev mail sink (id, received time, from, to, subject). Use read_email for the body.",
    inputSchema: {},
  },
  async () => {
    try {
      const messages = (await fetchJson("/api/email")) as SinkMessage[];
      return { content: [{ type: "text", text: listMessages(messages) }] };
    } catch {
      return { content: [{ type: "text", text: sinkUnreachable() }] };
    }
  }
);

server.registerTool(
  "read_email",
  {
    description:
      "Read the full body of a message from the local dev mail sink by its id (see list_emails).",
    inputSchema: {
      id: z.string().describe("Message id as shown by list_emails"),
    },
  },
  async ({ id }) => {
    try {
      const message = (await fetchJson(`/api/email/${id}`)) as SinkMessage;
      const body = message.text ?? message.html ?? "(no body)";
      return {
        content: [{ type: "text", text: `${listLine(message)}\n---\n${body}` }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text:
              err instanceof Error && err.message.includes("404")
                ? `mail sink: message ${id} not found (was it cleared?)`
                : sinkUnreachable(),
          },
        ],
      };
    }
  }
);

server.registerTool(
  "clear_emails",
  {
    description: "Remove every message currently held in the local dev mail sink.",
    inputSchema: {},
  },
  async () => {
    try {
      const result = (await fetchJson("/api/email/all", { method: "DELETE" })) as {
        ok: boolean;
      };
      return {
        content: [
          { type: "text", text: result.ok ? "mail sink: cleared" : "mail sink: clear failed" },
        ],
      };
    } catch {
      return { content: [{ type: "text", text: sinkUnreachable() }] };
    }
  }
);

server.registerTool(
  "wait_for_email",
  {
    description:
      "Block until a new message arrives in the local dev mail sink, optionally matching a subject, from or to substring. Returns the message. Fails after the timeout. Use this to verify the enquiry form sent its email.",
    inputSchema: {
      match: z
        .string()
        .optional()
        .describe("Substring to match against subject, from or to. Omit to match any new message."),
      timeout_seconds: z
        .number()
        .int()
        .positive()
        .default(30)
        .describe("How long to wait before failing."),
    },
  },
  async ({ match, timeout_seconds }) => {
    try {
      const before = new Set(((await fetchJson("/api/email")) as SinkMessage[]).map((m) => m.id));
      const matches = (m: SinkMessage): boolean => {
        if (!match) return true;
        return (
          m.subject.includes(match) ||
          m.from.includes(match) ||
          m.to.some((addr) => addr.includes(match))
        );
      };
      const deadline = Date.now() + timeout_seconds * 1000;
      while (Date.now() < deadline) {
        const messages = (await fetchJson("/api/email")) as SinkMessage[];
        const found = messages.find((m) => !before.has(m.id) && matches(m));
        if (found) {
          const body = found.text ?? found.html ?? "(no body)";
          return {
            content: [{ type: "text", text: `${listLine(found)}\n---\n${body}` }],
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      return {
        content: [
          {
            type: "text",
            text: `mail sink: no matching message within ${timeout_seconds}s`,
          },
        ],
        isError: true,
      };
    } catch {
      return { content: [{ type: "text", text: sinkUnreachable() }] };
    }
  }
);

await server.connect(new StdioServerTransport());
