import "./load-env.ts";
import { spawn } from "node:child_process";

const HTTP_URL =
  process.env.MAIL_HTTP_URL ?? `http://localhost:${process.env.MAIL_HTTP_PORT ?? 1080}`;
const HEALTH_TIMEOUT_MS = 4000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSink(): Promise<boolean> {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${HTTP_URL}/api/health`);
      if (res.ok) return true;
    } catch {
      // sink not up yet
    }
    await sleep(400);
  }
  return false;
}

function openInBrowser(url: string): void {
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  spawn(command, args, { detached: true, stdio: "ignore" }).unref();
}

async function run(): Promise<number> {
  if (!(await waitForSink())) {
    console.error(
      `mail sink unreachable at ${HTTP_URL} — start it with \`pnpm dev\` or \`pnpm mail\``
    );
    return 1;
  }
  console.log(`mail sink: opening inbox UI at ${HTTP_URL}`);
  openInBrowser(HTTP_URL);
  return 0;
}

run().then((code) => process.exit(code));
