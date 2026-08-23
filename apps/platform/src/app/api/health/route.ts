import { dbHealthCheck } from "@sdk-e/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await dbHealthCheck();
  return Response.json({
    status: database.ok ? "ok" : "degraded",
    service: "platform",
    version: "0.1.0",
    checks: { database },
    timestamp: new Date().toISOString(),
  });
}
