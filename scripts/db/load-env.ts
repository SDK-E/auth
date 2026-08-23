for (const path of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(path);
  } catch {}
}
