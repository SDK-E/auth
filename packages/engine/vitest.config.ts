import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgres://vitest.invalid/engine",
      AUTH_ENCRYPTION_KEY: "m3-vitest-envelope-key-0123456789abcdef",
    },
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/**/*.test.ts"],
      thresholds: {
        lines: 90,
        functions: 85,
        branches: 80,
        statements: 90,
      },
    },
  },
});
