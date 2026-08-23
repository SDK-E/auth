import { customAlphabet } from "nanoid";

const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 26);

export function createId(prefix: string): string {
  return `${prefix}_${nano()}`;
}

export const idPrefixes = {
  tenant: "tenant",
  environment: "env",
  domain: "dom",
  application: "app",
  connection: "conn",
  managementClient: "m2m",
  user: "usr",
  identity: "idt",
  passkey: "passkey",
  mfaFactor: "mfa",
  verificationToken: "vtok",
  invitation: "inv",
  organization: "org",
  organizationRole: "orgrole",
  scimDirectory: "scim",
  role: "role",
  permission: "perm",
  userRole: "urole",
  session: "ses",
  refreshToken: "rtk",
  refreshTokenFamily: "rfam",
  grant: "grant",
  authorizationCode: "acode",
  action: "action",
  actionVersion: "actver",
  webhookEndpoint: "hook",
  webhookDelivery: "dlv",
  emailTemplate: "tmpl",
  integrationSetting: "intg",
  auditLog: "audit",
  authEvent: "evt",
  usageRecord: "usagerec",
  staffUser: "staff",
  staffSession: "stfses",
} as const;

export type IdPrefix = (typeof idPrefixes)[keyof typeof idPrefixes];
