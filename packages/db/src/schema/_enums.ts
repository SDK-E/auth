import { pgEnum } from "drizzle-orm/pg-core";

export const tenantStatusEnum = pgEnum("tenant_status", [
  "pending",
  "active",
  "suspended",
  "closed",
]);

export const environmentKeyEnum = pgEnum("environment_key", [
  "development",
  "staging",
  "production",
]);

export const domainKindEnum = pgEnum("domain_kind", ["primary_subdomain", "custom"]);

export const applicationTypeEnum = pgEnum("application_type", [
  "spa",
  "regular_web",
  "native",
  "m2m",
]);

export const connectionStrategyEnum = pgEnum("connection_strategy", [
  "database",
  "google_oauth2",
  "github",
  "apple",
  "microsoft_entra",
  "oidc",
  "saml",
  "ldap",
  "sms",
  "email",
]);

export const mfaFactorTypeEnum = pgEnum("mfa_factor_type", [
  "totp",
  "sms",
  "email",
  "recovery_code",
]);

export const verificationPurposeEnum = pgEnum("verification_purpose", [
  "email_verify",
  "password_reset",
  "magic_link",
  "email_otp",
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

export const scimProviderEnum = pgEnum("scim_provider", [
  "okta",
  "entra_id",
  "jumpcloud",
  "generic",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
]);

export const subscriptionSourceEnum = pgEnum("subscription_source", [
  "direct",
  "vercel_marketplace",
]);

export const usageMetricEnum = pgEnum("usage_metric", [
  "mau",
  "actions_invocations",
  "webhook_deliveries",
]);

export const actionTriggerEnum = pgEnum("action_trigger", [
  "pre_register",
  "post_register",
  "pre_userinfo",
  "post_login",
  "credentials_exchange",
  "send_phone_message",
  "password_reset_post",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "success",
  "failed",
  "dead",
]);

export const emailTemplateKeyEnum = pgEnum("email_template_key", [
  "verify_email",
  "welcome_email",
  "reset_password",
  "magic_link",
  "otp",
  "mfa_enrollment",
]);

export const integrationProviderEnum = pgEnum("integration_provider", [
  "resend",
  "twilio",
  "smtp_custom",
  "stripe",
  "clickhouse",
]);

export const actorTypeEnum = pgEnum("actor_type", ["user", "staff", "client", "system"]);

export const authEventTypeEnum = pgEnum("auth_event_type", [
  "signup",
  "login_success",
  "login_failure",
  "logout",
  "mfa_challenge_issued",
  "mfa_challenge_passed",
  "mfa_challenge_failed",
  "token_issued",
  "token_refreshed",
  "token_revoked",
  "password_changed",
  "passkey_registered",
  "passkey_used",
  "scim_user_provisioned",
  "scim_user_deprovisioned",
]);

export const authEventResultEnum = pgEnum("auth_event_result", [
  "success",
  "failure",
  "pending",
]);

export const webauthnDeviceTypeEnum = pgEnum("webauthn_device_type", [
  "single_device",
  "multi_device",
]);
