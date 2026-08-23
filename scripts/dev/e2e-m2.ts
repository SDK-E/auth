const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const MAIL = "http://127.0.0.1:1080";
const CLIENT_ID = "client_platform_spa_dev";
const REDIRECT_URI = "http://localhost:3000/dashboard";
const EMAIL = "hicham@sdk.enterprises";

let failures = 0;

function check(name: string, condition: boolean, detail = "") {
  const status = condition ? "PASS" : "FAIL";
  if (!condition) failures += 1;
  console.log(`${status} ${name}${detail ? ` :: ${detail}` : ""}`);
}

function pkcePair() {
  const verifier = Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString("base64url");
  return { verifier };
}

async function digestChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return Buffer.from(digest).toString("base64url");
}

let cookieJar: Record<string, string> = {};

function storeCookies(response: Response) {
  const setCookies = response.headers.getSetCookie?.() ?? [];
  for (const line of setCookies) {
    const [pair] = line.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) cookieJar[pair.slice(0, idx)] = pair.slice(idx + 1);
  }
}

function cookieHeader(): string {
  return Object.entries(cookieJar)
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

async function main() {
  await fetch(`${MAIL}/api/email/all`, { method: "DELETE" }).catch(() => undefined);
  cookieJar = {};

  const { verifier } = pkcePair();
  const challenge = await digestChallenge(verifier);
  const state = `st_${Date.now()}`;
  const nonce = `no_${Date.now()}`;

  const authorizeParams = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "openid email offline_access profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const discovery = await fetch(`${BASE}/.well-known/openid-configuration`);
  const discoveryBody = await discovery.json();
  check(
    "discovery",
    discovery.status === 200 && String(discoveryBody.issuer).startsWith("http"),
    `issuer=${discoveryBody.issuer}`,
  );

  const jwksRes = await fetch(`${BASE}/.well-known/jwks.json`);
  const jwks = await jwksRes.json();
  check("jwks", Array.isArray(jwks.keys) && jwks.keys.length > 0, `${jwks.keys?.length} key(s)`);

  const authorizeStart = `${BASE}/authorize?${authorizeParams}`;
  const step1 = await fetch(authorizeStart, { redirect: "manual" });
  storeCookies(step1);
  check(
    "authorize redirects to login when unauthenticated",
    step1.status === 302 && String(step1.headers.get("location")).includes("/u/login"),
    `status=${step1.status}`,
  );

  const emailForm = new URLSearchParams({ email: EMAIL, return_to: `/authorize?${authorizeParams}` });
  const step2 = await fetch(`${BASE}/u/api/login/email`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: emailForm,
    redirect: "manual",
  });
  storeCookies(step2);
  const step2Location = step2.headers.get("location") ?? "";
  check(
    "email submission issues otp",
    step2.status === 303 && step2Location.includes("/u/login/verify"),
    `status=${step2.status} location=${step2Location.slice(0, 60)}`,
  );
  if (step2Location.includes("/u/login?")) {
    console.log(`   mail-send error page: ${decodeURIComponent(step2Location)}`);
  }

  let code: string | undefined;
  for (let attempt = 0; attempt < 20 && !code; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const mailRes = await fetch(`${MAIL}/api/email`);
    const mailJson = await mailRes.text();
    code = mailJson.match(/\b(\d{6})\b/)?.[1];
  }
  check("otp delivered to sink", Boolean(code), `code=${code}`);

  const verifyForm = new URLSearchParams({
    email: EMAIL,
    code: code ?? "",
    return_to: `/authorize?${authorizeParams}`,
  });
  const step3 = await fetch(`${BASE}/u/api/login/verify`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: verifyForm,
    redirect: "manual",
  });
  storeCookies(step3);
  const verifyLocation = step3.headers.get("location") ?? "";
  check(
    "verify authenticates and returns to authorize",
    step3.status === 303 && verifyLocation.includes("/authorize?"),
    `status=${step3.status}`,
  );
  check("session cookie set", Boolean(cookieJar["sdk_e_session"]));

  const step4 = await fetch(verifyLocation.startsWith("http") ? verifyLocation : `${BASE}${verifyLocation}`, {
    headers: { cookie: cookieHeader() },
    redirect: "manual",
  });
  storeCookies(step4);
  const callbackLocation = step4.headers.get("location") ?? "";
  const callbackUrl = new URL(callbackLocation.startsWith("http") ? callbackLocation : `${BASE}${callbackLocation}`);
  const authCode = callbackUrl.searchParams.get("code");
  check(
    "authorize issues code for authenticated session",
    step4.status === 302 && callbackUrl.searchParams.get("state") === state && Boolean(authCode),
    `state_ok=${callbackUrl.searchParams.get("state") === state}`,
  );

  const tokenForm = new URLSearchParams({
    grant_type: "authorization_code",
    code: authCode ?? "",
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });
  const step5 = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: tokenForm,
  });
  const tokens = await step5.json();
  check(
    "token exchange succeeds",
    step5.status === 200 && typeof tokens.access_token === "string" && typeof tokens.id_token === "string",
    `status=${step5.status} error=${tokens.error}`,
  );
  check("refresh_token issued", typeof tokens.refresh_token === "string");

  const idDecoded = tokens.id_token ? decodeJwt(tokens.id_token) : undefined;
  check(
    "id_token signed with jwks kid + nonce honored",
    Boolean(idDecoded) &&
      jwks.keys.some((k: { kid?: string }) => k.kid === idDecoded?.header.kid) &&
      idDecoded?.payload.nonce === nonce &&
      idDecoded?.payload.email === EMAIL,
    `kid=${idDecoded?.header.kid}`,
  );

  const userinfo = await fetch(`${BASE}/oauth/userinfo`, {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  const userinfoBody = await userinfo.json();
  check(
    "userinfo returns scoped claims",
    userinfo.status === 200 && userinfoBody.email === EMAIL && userinfoBody.sub === idDecoded?.payload.sub,
    `status=${userinfo.status}`,
  );

  const refreshForm = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
    client_id: CLIENT_ID,
  });
  const step6 = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: refreshForm,
  });
  const rotated = await step6.json();
  check(
    "refresh rotation issues new token",
    step6.status === 200 && typeof rotated.refresh_token === "string" && rotated.refresh_token !== tokens.refresh_token,
    `status=${step6.status}`,
  );

  const replayForm = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
    client_id: CLIENT_ID,
  });
  const step7 = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: replayForm,
  });
  const replayed = await step7.json();
  check(
    "replayed refresh rejected as reuse",
    step7.status === 400 && replayed.error === "invalid_grant",
    `error=${replayed.error}`,
  );

  const familyKill = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: rotated.refresh_token,
    client_id: CLIENT_ID,
  });
  const step8 = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: familyKill,
  });
  const killed = await step8.json();
  check(
    "entire family revoked after reuse detection",
    step8.status === 400,
    `error=${killed.error}`,
  );

  const dashboard = await fetch(`${BASE}/dashboard`, {
    headers: { cookie: cookieHeader() },
    redirect: "manual",
  });
  const dashboardHtml = dashboard.status === 200 ? await dashboard.text() : "";
  check(
    "dogfooded dashboard session renders",
    dashboard.status === 200 && dashboardHtml.includes(EMAIL),
    `status=${dashboard.status}`,
  );

  const anonDashboard = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
  check(
    "dashboard gated for anonymous visitors",
    (anonDashboard.status === 302 || anonDashboard.status === 307) &&
      String(anonDashboard.headers.get("location")).includes("/u/login"),
    `status=${anonDashboard.status}`,
  );

  const badPkce = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "openid",
    code_challenge: "tooshort",
    code_challenge_method: "S256",
  });
  const badAuthorize = await fetch(`${BASE}/authorize?${badPkce}`, { redirect: "manual" });
  check(
    "authorize rejects malformed pkce",
    badAuthorize.status === 400,
    `status=${badAuthorize.status}`,
  );

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
