import { dbHealthCheck } from "@sdk-e/db";
import { kvHealthCheck } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const [database, cache] = await Promise.all([dbHealthCheck(), kvHealthCheck()]);
  const degraded = !database.ok || cache.status === "error";
  return Response.json(
    {
      status: degraded ? "degraded" : "ok",
      service: "platform",
      version: "0.1.0",
      checks: { database, cache },
      timestamp: new Date().toISOString(),
    },
    { status: degraded ? 503 : 200 },
  );
}
