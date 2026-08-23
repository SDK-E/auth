export const dynamic = "force-static";

export async function GET() {
  const body = [
    "Contact: mailto:hello@sdk.enterprises",
    `Expires: ${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()}`,
    "Preferred-Languages: en, fr",
    "Canonical: https://auth.sdk.enterprises/.well-known/security.txt",
    "Policy: https://auth.sdk.enterprises/security",
  ].join("\n");
  return new Response(`${body}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
