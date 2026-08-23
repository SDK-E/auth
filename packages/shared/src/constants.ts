export const SESSION_COOKIE_NAME = "sdk_e_session";
export const DEFAULT_BASE_DOMAIN = "auth.sdk.enterprises";

export const TOKEN_LIFETIMES_SECONDS = {
  authorizationCode: 60,
  accessToken: 900,
  idToken: 600,
  refreshTokenIdle: 30 * 24 * 60 * 60,
  refreshTokenAbsolute: 180 * 24 * 60 * 60,
  sessionIdle: 14 * 24 * 60 * 60,
  sessionAbsolute: 365 * 24 * 60 * 60,
  verificationToken: 15 * 60,
} as const;

export const MANAGEMENT_API_PREFIX = "/api/v2";
