function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Revenue & Cost Intelligence",
  authTrustHost: (process.env.AUTH_TRUST_HOST ?? "false") === "true",

  azureAdClientId: optional("AZURE_AD_CLIENT_ID"),
  azureAdClientSecret: optional("AZURE_AD_CLIENT_SECRET"),
  azureAdTenantId: optional("AZURE_AD_TENANT_ID"),
};

export function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}
