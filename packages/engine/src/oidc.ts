import { z } from "zod";

export const authorizeQuerySchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string().min(1),
  redirect_uri: z.string().min(1),
  scope: z.string().default("openid"),
  state: z.string().optional(),
  nonce: z.string().optional(),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal("S256").default("S256"),
  prompt: z.string().optional(),
});

export type AuthorizeQuery = z.infer<typeof authorizeQuerySchema>;

export const tokenRequestSchema = z.object({
  grant_type: z.enum(["authorization_code", "refresh_token"]),
  code: z.string().optional(),
  redirect_uri: z.string().optional(),
  client_id: z.string().optional(),
  code_verifier: z.string().optional(),
  refresh_token: z.string().optional(),
});

export const SCOPE_REGEX = /^[a-z0-9:_\/]+$/;

export function splitScope(scope: string): string[] {
  return [...new Set(scope.split(/\s+/).filter(Boolean))];
}

export function buildDiscoveryMetadata(params: {
  issuer: string;
}): Record<string, unknown> {
  const issuer = params.issuer.replace(/\/$/, "");
  return {
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/oauth/userinfo`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["openid", "email", "profile", "offline_access"],
    claims_supported: [
      "sub",
      "iss",
      "aud",
      "exp",
      "iat",
      "email",
      "email_verified",
      "name",
      "given_name",
      "family_name",
      "nickname",
      "picture",
      "locale",
    ],
  };
}
