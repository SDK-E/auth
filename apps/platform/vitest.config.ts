import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@sdk-e\/db$/, replacement: `${rootDir}tests/shims/db.ts` },
      { find: /^@\//, replacement: `${rootDir}src/` },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text"],
      include: ["src/lib/auth/**/*.ts", "src/lib/redis.ts"],
      exclude: ["src/**/*.test.ts"],
      thresholds: {
        lines: 75,
        functions: 70,
        branches: 65,
        statements: 75,
      },
    },
  },
});
