export { Sandbox } from "@vercel/sandbox";

export interface ActionRunnerConfig {
  runtime: string;
  timeoutMs: number;
  memoryMb: number;
  maxConcurrentSandboxes: number;
  sandboxIdleTimeoutMs: number;
}

export const defaultActionRunnerConfig: ActionRunnerConfig = {
  runtime: "node24",
  timeoutMs: 5_000,
  memoryMb: 512,
  maxConcurrentSandboxes: 4,
  sandboxIdleTimeoutMs: 60_000,
};
