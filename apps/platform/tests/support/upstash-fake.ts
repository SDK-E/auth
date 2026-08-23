import { createServer, type Server } from "node:http";

type Entry = { value: string; expiresAt: number | null };

type FakeUpstash = {
  url: string;
  close: () => Promise<void>;
};

function parseInteger(value: string): number | null {
  if (!/^-?\d+$/.test(value)) return null;
  return Number(value);
}

function handleCommand(store: Map<string, Entry>, command: string, args: string[]): unknown {
  const key = args[0] ?? "";
  switch (command) {
    case "PING":
      return "PONG";
    case "FLUSHALL":
    case "FLUSHDB":
      store.clear();
      return "OK";
    case "GET":
      return store.get(key)?.value ?? null;
    case "DEL":
    case "UNLINK": {
      let deleted = 0;
      for (const k of args) {
        if (store.delete(k)) deleted += 1;
      }
      return deleted;
    }
    case "EXPIRE": {
      const entry = store.get(key);
      if (!entry) return 0;
      const seconds = parseInteger(args[1] ?? "");
      if (seconds === null || seconds <= 0) throw new Error("ERR invalid expire time");
      entry.expiresAt = Date.now() + seconds * 1000;
      return 1;
    }
    case "TTL": {
      const entry = store.get(key);
      if (!entry) return -2;
      if (entry.expiresAt === null) return -1;
      return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    }
    case "INCR":
    case "DECR": {
      const current = parseInteger(store.get(key)?.value ?? "0");
      if (current === null) throw new Error("ERR value is not an integer or out of range");
      const next = command === "INCR" ? current + 1 : current - 1;
      const existing = store.get(key);
      store.set(key, { value: String(next), expiresAt: existing?.expiresAt ?? null });
      return next;
    }
    default:
      throw new Error(`ERR unknown command '${command.toLowerCase()}'`);
  }
}

function encodeBase64(value: unknown): unknown {
  if (typeof value === "string") return Buffer.from(value, "utf8").toString("base64");
  if (Array.isArray(value)) return value.map(encodeBase64);
  return value;
}

export function startFakeUpstash(token: string): Promise<FakeUpstash> {
  const store = new Map<string, Entry>();
  const server: Server = createServer((req, res) => {
    void (async () => {
      const auth = req.headers.authorization ?? "";
      if (auth !== `Bearer ${token}`) {
        res.writeHead(401).end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
      const base64 = req.headers["upstash-encoding"] === "base64";
      try {
        const isPipeline = new URL(req.url ?? "/", "http://localhost").pathname === "/pipeline";
        let commands: unknown[] = [];
        if (req.method === "POST") {
          const body = await new Promise<string>((resolve, reject) => {
            let raw = "";
            req.on("data", (chunk) => {
              raw += chunk;
            });
            req.on("end", () => resolve(raw));
            req.on("error", reject);
          });
          commands = JSON.parse(body || "[]");
        } else {
          commands = (req.url ?? "/").split("/").filter(Boolean).map(decodeURIComponent);
        }
        const list: unknown[][] = Array.isArray(commands[0]) ? (commands as unknown[][]) : [commands as unknown[]];
        const outcomes = list.map(([cmd, ...args]) => {
          try {
            const result = handleCommand(
              store,
              String(cmd).toUpperCase(),
              args.map(String),
            );
            return { result: base64 ? encodeBase64(result) : result };
          } catch (error) {
            return { error: error instanceof Error ? error.message : "ERR internal" };
          }
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(isPipeline || list.length > 1 ? outcomes : outcomes[0]));
      } catch (error) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : "ERR internal" }));
      }
    })();
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("fake upstash listen failed");
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        close: () => new Promise<void>((resolveClose) => server.close(() => resolveClose())),
      });
    });
  });
}
