import { execSync } from "node:child_process";
import { platform } from "node:os";

type Command = "list" | "find" | "pid" | "check" | "kill" | "kill-force";

interface ProcessInfo {
  pid: number;
  command: string;
  user: string;
  protocol: string;
  port: number;
}

function exec(command: string): string {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  } catch {
    return "";
  }
}

function parsePortFromName(name: string): number | null {
  const match = name.match(/:(\d+)\s*\(/);
  return match ? Number(match[1]) : null;
}

function getListeningPorts(): ProcessInfo[] {
  const results: ProcessInfo[] = [];

  if (platform() === "win32") {
    const output = exec("netstat -ano -p tcp");
    const lines = output.split("\n");
    for (const line of lines) {
      const match = line.trim().match(/^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/);
      if (match) {
        const port = Number(match[1]);
        const pid = Number(match[2]);
        const cmd = exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`).trim();
        const commandMatch = cmd.match(/^"([^"]+)"/);
        results.push({
          pid,
          command: commandMatch?.[1] ?? "unknown",
          user: "",
          protocol: "tcp",
          port,
        });
      }
    }
  } else {
    const output = exec("lsof -iTCP -sTCP:LISTEN -P -n");
    const lines = output.split("\n");
    for (const line of lines) {
      if (line.startsWith("COMMAND")) continue;
      const parts = line.trim().split(/\s+/);
      if (parts.length < 8) continue;
      const command = parts[0];
      const pid = Number(parts[1]);
      const user = parts[2];
      const name = parts.slice(8).join(" ");
      const port = parsePortFromName(name);
      if (port !== null && Number.isFinite(port)) {
        const protocol = parts[7]?.toLowerCase() === "tcp" ? "tcp" : "udp";
        results.push({
          pid,
          command,
          user,
          protocol,
          port,
        });
      }
    }
  }

  return results;
}

function getProcessesOnPorts(ports: number[]): Map<number, ProcessInfo[]> {
  const all = getListeningPorts();
  const map = new Map<number, ProcessInfo[]>();
  for (const port of ports) {
    map.set(
      port,
      all.filter((p) => p.port === port)
    );
  }
  return map;
}

function killProcess(pid: number, signal: NodeJS.Signals = "SIGTERM"): boolean {
  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
}

function usage(): void {
  console.error(
    `usage: portkiller <list|find <port...>|pid <port...>|check <port...>|kill <port...>|kill-force <port...>>`
  );
}

async function run(): Promise<number> {
  const [cmd, ...rest] = process.argv.slice(2);

  if (!cmd) {
    usage();
    return 2;
  }

  const ports = rest.map(Number).filter((n) => Number.isFinite(n) && n > 0 && n <= 65535);

  switch (cmd) {
    case "list": {
      const entries = getListeningPorts();
      if (entries.length === 0) {
        console.log("no listening ports found");
        return 0;
      }
      for (const p of entries) {
        console.log(`${p.port}\t${p.pid}\t${p.user}\t${p.command}\t${p.protocol}`);
      }
      return 0;
    }

    case "find":
    case "pid":
    case "check":
    case "kill":
    case "kill-force": {
      if (ports.length === 0) {
        console.error("no valid port numbers provided");
        usage();
        return 2;
      }

      const map = getProcessesOnPorts(ports);
      let hasError = false;

      for (const port of ports) {
        const procs = map.get(port) ?? [];
        if (procs.length === 0) {
          console.log(`port ${port} is free`);
          continue;
        }

        for (const proc of procs) {
          if (cmd === "find") {
            console.log(
              `${proc.port}\t${proc.pid}\t${proc.user}\t${proc.command}\t${proc.protocol}`
            );
          } else if (cmd === "pid") {
            console.log(proc.pid);
          } else if (cmd === "check") {
            console.log(`port ${port} is occupied by pid ${proc.pid} (${proc.command})`);
            hasError = true;
          } else if (cmd === "kill") {
            const ok = killProcess(proc.pid, "SIGTERM");
            console.log(
              ok
                ? `killed pid ${proc.pid} on port ${port}`
                : `failed to kill pid ${proc.pid} on port ${port}`
            );
            if (!ok) hasError = true;
          } else if (cmd === "kill-force") {
            const ok = killProcess(proc.pid, "SIGKILL");
            console.log(
              ok
                ? `force killed pid ${proc.pid} on port ${port}`
                : `failed to force kill pid ${proc.pid} on port ${port}`
            );
            if (!ok) hasError = true;
          }
        }
      }

      return hasError ? 1 : 0;
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
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
