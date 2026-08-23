import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

interface Entry {
  value: string;
  expiresAt: number | null;
}

const PORT = Number(process.env.REDIS_LOCAL_PORT ?? 8000);
const TOKEN = process.env.REDIS_LOCAL_TOKEN ?? "upstash";

const store = new Map<string, Entry>();

function isExpired(entry: Entry): boolean {
  return entry.expiresAt !== null && entry.expiresAt <= Date.now();
}

function getEntry(key: string): Entry | undefined {
  const entry = store.get(key);
  if (entry && isExpired(entry)) {
    store.delete(key);
    return undefined;
  }
  return entry;
}

function parseInteger(value: string): number | null {
  if (!/^-?\d+$/.test(value)) return null;
  return Number(value);
}

function handleCommand(command: string, args: string[]): unknown {
  const key = args[0];

  switch (command) {
    case "PING":
      return args[0] ? args[0] : "PONG";
    case "ECHO":
      return key ?? "";
    case "FLUSHALL":
    case "FLUSHDB":
      store.clear();
      return "OK";
    case "GET":
      return getEntry(key)?.value ?? null;
    case "SET": {
      if (!key) throw new Error("ERR wrong number of arguments for 'set' command");
      let expiresAt: number | null = null;
      let condition: "nx" | "xx" | null = null;
      for (let i = 1; i < args.length; i += 1) {
        const option = args[i].toUpperCase();
        if (option === "EX") {
          const seconds = parseInteger(args[++i] ?? "");
          if (seconds === null || seconds <= 0) throw new Error("ERR invalid expire time in 'set' command");
          expiresAt = Date.now() + seconds * 1000;
        } else if (option === "PX") {
          const ms = parseInteger(args[++i] ?? "");
          if (ms === null || ms <= 0) throw new Error("ERR invalid expire time in 'set' command");
          expiresAt = Date.now() + ms;
        } else if (option === "NX") {
          condition = "nx";
        } else if (option === "XX") {
          condition = "xx";
        }
      }
      const existing = getEntry(key);
      if (condition === "nx" && existing) return null;
      if (condition === "xx" && !existing) return null;
      store.set(key, { value: args[1], expiresAt });
      return "OK";
    }
    case "DEL":
    case "UNLINK": {
      let deleted = 0;
      for (const k of args) {
        if (getEntry(k)) {
          store.delete(k);
          deleted += 1;
        }
      }
      return deleted;
    }
    case "EXISTS":
      return args.filter((k) => Boolean(getEntry(k))).length;
    case "EXPIRE": {
      const entry = getEntry(key);
      if (!entry) return 0;
      const seconds = parseInteger(args[1] ?? "");
      if (seconds === null || seconds <= 0) throw new Error("ERR invalid expire time in 'expire' command");
      entry.expiresAt = Date.now() + seconds * 1000;
      return 1;
    }
    case "PERSIST": {
      const entry = getEntry(key);
      if (!entry || entry.expiresAt === null) return 0;
      entry.expiresAt = null;
      return 1;
    }
    case "TTL": {
      const entry = getEntry(key);
      if (!entry) return -2;
      if (entry.expiresAt === null) return -1;
      return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    }
    case "PTTL": {
      const entry = getEntry(key);
      if (!entry) return -2;
      if (entry.expiresAt === null) return -1;
      return Math.max(0, entry.expiresAt - Date.now());
    }
    case "INCR":
    case "DECR":
    case "INCRBY":
    case "DECRBY": {
      const current = parseInteger(getEntry(key)?.value ?? "0");
      if (current === null) throw new Error("ERR value is not an integer or out of range");
      const delta =
        command === "INCR" ? 1 : command === "DECR" ? -1 : parseInteger(args[1] ?? "");
      if (delta === null) throw new Error("ERR value is not an integer or out of range");
      const next =
        command === "INCRBY"
          ? current + delta
          : command === "DECRBY"
            ? current - delta
            : current + delta;
      store.set(key, { value: String(next), expiresAt: getEntry(key)?.expiresAt ?? null });
      return next;
    }
    case "KEYS": {
      const pattern = key ?? "*";
      const regex = new RegExp(
        `^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")}$`,
      );
      return [...store.keys()].filter((k) => getEntry(k) !== undefined && regex.test(k));
    }
    default:
      throw new Error(`ERR unknown command '${command.toLowerCase()}'`);
  }
}

function authorize(req: IncomingMessage): boolean {
  const header = req.headers.authorization ?? "";
  return header === `Bearer ${TOKEN}`;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function encodeBase64(value: unknown): unknown {
  if (typeof value === "string") return Buffer.from(value, "utf8").toString("base64");
  if (Array.isArray(value)) return value.map(encodeBase64);
  return value;
}

async function dispatch(
  commands: string[][],
  base64: boolean,
): Promise<Array<{ result?: unknown; error?: string }>> {
  const results: Array<{ result?: unknown; error?: string }> = [];
  for (const [command, ...args] of commands) {
    try {
      const result = handleCommand(String(command).toUpperCase(), args.map(String));
      results.push({ result: base64 ? encodeBase64(result) : result });
    } catch (error) {
      results.push({ error: error instanceof Error ? error.message : "ERR internal" });
    }
  }
  return results;
}

const server = createServer(async (req, res) => {
  if (!authorize(req)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  const base64 = (req.headers["upstash-encoding"] ?? "") === "base64";
  try {
    const rawBody = req.method === "POST" ? await readBody(req) : "";
    if (req.method === "POST" && (url.pathname === "/" || url.pathname === "/pipeline")) {
      const body = JSON.parse(rawBody);
      const commands: string[][] = Array.isArray(body?.[0]) ? body : [body];
      const outcomes = await dispatch(commands, base64);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(url.pathname === "/pipeline" ? outcomes : outcomes[0]));
      return;
    }

    if (req.method === "GET" || req.method === "POST") {
      const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
      if (segments.length > 0) {
        const [outcome] = await dispatch([segments], base64);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(outcome));
        return;
      }
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "ERR internal",
      }),
    );
  }
});

server.listen(PORT, () => {
  console.log(`redis local: Upstash-compatible API on http://127.0.0.1:${PORT} (token: ${TOKEN})`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  });
}
