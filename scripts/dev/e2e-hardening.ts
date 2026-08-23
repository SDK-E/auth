import { execFileSync } from "node:child_process";
import { asc } from "drizzle-orm";
import { auditLogs, getDb } from "@sdk-e/db";
import { canonicalJson, computeAuditEntryHash } from "../../apps/platform/src/lib/auth/audit.ts";

for (const path of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(path);
  } catch {}
}

const ROOT = new URL("../../", import.meta.url).pathname;
const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const MAIL = "http://127.0.0.1:1080";
const CLIENT_ID = "client_platform_spa_dev";
const REDIRECT_URI = "http://localhost:3000/dashboard";
const NONCE = Date.now().toString(36);

let failures = 0;

function check(name: string, condition: boolean, detail = "") {
  const status = condition ? "PASS" : "FAIL";
  if (!condition) failures += 1;
  console.log(`${status} ${name}${detail ? ` :: ${detail}` : ""}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pkcePair() {
  const verifier = Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString("base64url");
  return { verifier };
}

async function digestChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return Buffer.from(digest).toString("base64url");
}

type Jar = Record<string, string>;

function storeCookies(jar: Jar, response: Response) {
  const setCookies = response.headers.getSetCookie?.() ?? [];
  for (const line of setCookies) {
    const [pair] = line.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) jar[pair.slice(0, idx)] = pair.slice(idx + 1);
  }
}

function cookieHeader(jar: Jar): string {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function decodeJwt(token: string): { header: Record<string, unknown>; payload: Record<string, unknown> } {
  const [h, p] = token.split(".");
  return {
    header: JSON.parse(Buffer.from(h, "base64url").toString()),
    payload: JSON.parse(Buffer.from(p, "base64url").toString()),
  };
}

function postForm(jar: Jar, path: string, form: URLSearchParams) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookieHeader(jar) },
    body: form,
    redirect: "manual",
  });
}

async function requestOtp(jar: Jar, email: string, returnTo: string): Promise<string> {
  const res = await postForm(jar, "/u/api/login/email", new URLSearchParams({ email, return_to: returnTo }));
  storeCookies(jar, res);
  return res.headers.get("location") ?? "";
}

interface SinkMessage {
  id: string;
  to: string[];
  text: string | null;
}

async function pollOtp(
  recipient: string,
  seenIds: Set<string>,
  timeoutMs = 15000,
): Promise<{ id: string; code: string } | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${MAIL}/api/email`);
    const messages = (await res.json()) as SinkMessage[];
    for (const message of messages) {
      if (seenIds.has(message.id) || !message.to.includes(recipient)) continue;
      const code = message.text?.match(/\b(\d{6})\b/)?.[1];
      if (code) {
        seenIds.add(message.id);
        return { id: message.id, code };
      }
      seenIds.add(message.id);
    }
    await sleep(400);
  }
  return undefined;
}

async function flushLocalRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token || !/127\.0\.0\.1|localhost/.test(url)) return;
  await fetch(`${url.replace(/\/$/, "")}/flushall`, { headers: { authorization: `Bearer ${token}` } }).catch(
    () => undefined,
  );
}

async function getJwks(): Promise<Array<{ kid?: string }>> {
  const res = await fetch(`${BASE}/.well-known/jwks.json`);
  const body = (await res.json()) as { keys?: Array<{ kid?: string }> };
  return body.keys ?? [];
}

type LoginResult =
  | { ok: true; tokens: Record<string, string>; jar: Jar }
  | { ok: false; step: string; detail: string };

async function fullLoginFlow(email: string): Promise<LoginResult> {
  const jar: Jar = {};
  const seen = new Set<string>();
  const { verifier } = pkcePair();
  const challenge = await digestChallenge(verifier);
  const state = `st_${NONCE}_${Math.floor(Math.random() * 1e6)}`;
  const authorizeQuery = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "openid email offline_access profile",
    state,
    nonce: `no_${state}`,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const emailLocation = await requestOtp(jar, email, `/authorize?${authorizeQuery}`);
  if (!emailLocation.includes("/u/login/verify")) {
    return { ok: false, step: "email submission", detail: decodeURIComponent(emailLocation).slice(0, 90) };
  }
  const otp = await pollOtp(email, seen);
  if (!otp) return { ok: false, step: "otp delivery", detail: "no mail for recipient" };

  const verifyRes = await postForm(
    jar,
    "/u/api/login/verify",
    new URLSearchParams({ email, code: otp.code, return_to: `/authorize?${authorizeQuery}` }),
  );
  storeCookies(jar, verifyRes);
  const verifyLocation = verifyRes.headers.get("location") ?? "";
  if (!verifyLocation.includes("/authorize?")) {
    return { ok: false, step: "verify", detail: decodeURIComponent(verifyLocation).slice(0, 90) };
  }

  const callbackRes = await fetch(verifyLocation.startsWith("http") ? verifyLocation : `${BASE}${verifyLocation}`, {
    headers: { cookie: cookieHeader(jar) },
    redirect: "manual",
  });
  storeCookies(jar, callbackRes);
  const callbackUrl = new URL(callbackRes.headers.get("location") ?? "", BASE);
  const authCode = callbackUrl.searchParams.get("code");
  if (!authCode) return { ok: false, step: "authorize callback", detail: "no code issued" };

  const tokenRes = await postForm(
    jar,
    "/oauth/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  );
  const tokens = (await tokenRes.json()) as Record<string, string>;
  if (tokenRes.status !== 200 || !tokens.access_token) {
    return { ok: false, step: "token exchange", detail: String(tokens.error) };
  }
  return { ok: true, tokens, jar };
}

async function checkNormalFlowUnaffected(headKid: string | undefined) {
  const email = `harden-normal-${NONCE}@sdk.enterprises`;
  const result = await fullLoginFlow(email);
  check("normal single login flow unaffected by limits", result.ok, result.ok ? "" : `${result.step}: ${result.detail}`);
  if (!result.ok) return undefined;

  const tokens = result.tokens as Record<string, string>;
  const idKid = tokens.id_token ? (decodeJwt(tokens.id_token).header.kid as string) : undefined;
  check("fresh token signed by rotated head key", idKid === headKid, `kid=${idKid} head=${headKid}`);

  const refreshRes = await postForm(
    {},
    "/oauth/token",
    new URLSearchParams({ grant_type: "refresh_token", refresh_token: tokens.refresh_token, client_id: CLIENT_ID }),
  );
  const rotated = (await refreshRes.json()) as Record<string, string>;
  check("refresh rotation still succeeds", refreshRes.status === 200 && Boolean(rotated.refresh_token));

  const replayRes = await postForm(
    {},
    "/oauth/token",
    new URLSearchParams({ grant_type: "refresh_token", refresh_token: tokens.refresh_token, client_id: CLIENT_ID }),
  );
  const replayed = (await replayRes.json()) as Record<string, string>;
  check(
    "replayed refresh rejected with reuse detection",
    replayRes.status === 400 && replayed.error === "invalid_grant",
    `error=${replayed.error}`,
  );

  const familyRes = await postForm(
    {},
    "/oauth/token",
    new URLSearchParams({ grant_type: "refresh_token", refresh_token: rotated.refresh_token, client_id: CLIENT_ID }),
  );
  check("rotated child dead after family revocation", familyRes.status === 400);

  const logoutRes = await fetch(`${BASE}/u/logout`, {
    headers: { cookie: cookieHeader(result.jar) },
    redirect: "manual",
  });
  storeCookies(result.jar, logoutRes);
  check(
    "logout clears session and redirects",
    logoutRes.status === 303 && !result.jar["sdk_e_session"],
    `status=${logoutRes.status}`,
  );
}

async function checkRevokePublishesAuditEvent() {
  const email = `harden-revoke-${NONCE}@sdk.enterprises`;
  const result = await fullLoginFlow(email);
  if (!result.ok) {
    check("revoke flow exercised", false, `${result.step}: ${result.detail}`);
    return;
  }
  await postForm(
    result.jar,
    "/oauth/revoke",
    new URLSearchParams({ token: result.tokens.refresh_token, client_id: CLIENT_ID }),
  );
  const afterRes = await postForm(
    result.jar,
    "/oauth/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: result.tokens.refresh_token,
      client_id: CLIENT_ID,
    }),
  );
  check(
    "revoked refresh token rejected",
    afterRes.status === 400 && ((await afterRes.json()) as Record<string, string>).error === "invalid_grant",
  );
}

async function checkOtpRequestCap() {
  const email = `harden-otpcap-${NONCE}@sdk.enterprises`;
  const locations: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    locations.push(await requestOtp({}, email, "/dashboard"));
  }
  const firstThreeOk = locations
    .slice(0, 3)
    .every((location) => location.includes("/u/login/verify"));
  const fourthBlocked = locations[3]?.includes("/u/login?error=") ?? false;
  const fourthDecoded = decodeURIComponent(locations[3] ?? "");
  check("first three otp requests allowed", firstThreeOk, locations.slice(0, 3).map((l) => l.slice(0, 40)).join(" | "));
  check("fourth otp request inside window blocked", fourthBlocked, fourthDecoded.slice(0, 80));
  check(
    "block copy stays neutral",
    fourthDecoded.includes("Too many attempts. Try again shortly."),
    fourthDecoded.slice(0, 80),
  );
}

async function checkVerifyLockout() {
  const email = `harden-lockout-${NONCE}@sdk.enterprises`;
  const seen = new Set<string>();
  const first = await pollAfterRequest(email, seen);
  if (!first) {
    check("lockout setup: initial otp delivered", false, "no mail");
    return;
  }

  let failureRedirects = 0;
  for (const wrong of ["111111", "222222", "333333", "444444", "555555"]) {
    const res = await postForm(
      {},
      "/u/api/login/verify",
      new URLSearchParams({ email, code: wrong, return_to: "/dashboard" }),
    );
    const location = res.headers.get("location") ?? "";
    if (res.status === 303 && location.includes("error=")) failureRedirects += 1;
  }
  check("five wrong codes each rejected neutrally", failureRedirects === 5, `${failureRedirects}/5`);

  const correctAttempt = await postForm(
    {},
    "/u/api/login/verify",
    new URLSearchParams({ email, code: first.code, return_to: "/dashboard" }),
  );
  const correctLocation = decodeURIComponent(correctAttempt.headers.get("location") ?? "");
  check(
    "correct outstanding code rejected after lockout",
    correctAttempt.status === 303 &&
      correctLocation.includes("/u/login/verify") &&
      correctLocation.includes("error="),
    correctLocation.slice(0, 80),
  );

  const second = await pollAfterRequest(email, seen);
  if (!second) {
    check("re-request delivers fresh otp", false, "no mail");
    return;
  }
  const jar: Jar = {};
  const recovery = await postForm(
    jar,
    "/u/api/login/verify",
    new URLSearchParams({ email, code: second.code, return_to: "/dashboard" }),
  );
  storeCookies(jar, recovery);
  check(
    "fresh code after re-request recovers login",
    recovery.status === 303 && !(recovery.headers.get("location") ?? "").includes("error="),
    decodeURIComponent(recovery.headers.get("location") ?? "").slice(0, 60),
  );
  check("session established on recovery", Boolean(jar["sdk_e_session"]));
}

async function pollAfterRequest(email: string, seen: Set<string>) {
  const location = await requestOtp({}, email, "/dashboard");
  if (!location.includes("/u/login/verify")) return undefined;
  return pollOtp(email, seen);
}

async function checkTokenFlood() {
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code: "flood_bogus_code",
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: "a".repeat(43),
  });
  const responses = await Promise.all(
    Array.from({ length: 70 }, () =>
      fetch(`${BASE}/oauth/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form,
      }),
    ),
  );
  const tooMany = responses.filter((res) => res.status === 429);
  const retryAfter = tooMany[0]?.headers.get("retry-after");
  check("token flood tripped 429", tooMany.length > 0, `${tooMany.length} x 429`);
  check("retry-after header present and numeric", Boolean(retryAfter && Number(retryAfter) > 0), `retry-after=${retryAfter}`);
}

async function checkAuditLedger() {
  const db = getDb();
  const rows = await db.select().from(auditLogs).orderBy(asc(auditLogs.seq));
  const actionTypes = new Set(rows.map((row) => row.actionType));
  const required = [
    "login_success",
    "login_failure",
    "logout",
    "token_issued",
    "token_refreshed",
    "refresh_reuse_detected",
    "token_revoked",
    "signing_key_created",
  ];
  const missing = required.filter((action) => !actionTypes.has(action));
  check("audit rows exist for every wired event type", missing.length === 0, missing.join(","));

  const headByEnvironment = new Map<string, string>();
  let broken: string | undefined;
  for (const row of rows) {
    const expectedPrev = headByEnvironment.get(row.environmentId) ?? "0";
    const fields = {
      tenantId: row.tenantId,
      environmentId: row.environmentId,
      actorType: row.actorType,
      actorId: row.actorId,
      actionType: row.actionType,
      targetType: row.targetType,
      targetId: row.targetId,
      payload: row.payload,
      ip: row.ip,
      userAgent: row.userAgent,
      occurredAt: row.occurredAt.toISOString(),
    };
    const recomputed = computeAuditEntryHash(expectedPrev, fields);
    if (row.previousHash !== expectedPrev || row.entryHash !== recomputed) {
      broken = `seq=${row.seq} action=${row.actionType}`;
      break;
    }
    headByEnvironment.set(row.environmentId, row.entryHash);
  }
  check("audit hash chain recomputes cleanly from genesis", !broken, broken ?? `${rows.length} rows verified`);
}

async function main() {
  await flushLocalRedis();
  await fetch(`${MAIL}/api/email/all`, { method: "DELETE" }).catch(() => undefined);

  const beforeKids = await getJwks();
  const previousKid = beforeKids[0]?.kid;

  execFileSync(process.execPath, [`${ROOT}scripts/db/rotate-keys.ts`, "development"], {
    cwd: ROOT,
    env: process.env,
    stdio: "pipe",
    timeout: 30000,
  });
  check("keys:rotate exits cleanly", true, `previous head=${previousKid}`);

  const afterKeys = await getJwks();
  const headKid = afterKeys[0]?.kid;
  check(
    "jwks publishes new head kid and keeps previous",
    Boolean(headKid && headKid !== previousKid && afterKeys.some((k) => k.kid === previousKid)),
    `head=${headKid}`,
  );

  await checkNormalFlowUnaffected(headKid);
  await checkRevokePublishesAuditEvent();
  await checkOtpRequestCap();
  await checkVerifyLockout();
  await checkTokenFlood();
  await flushLocalRedis();
  await checkAuditLedger();

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
