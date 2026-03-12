import { env } from "@/lib/env";
import { LoginClient } from "@/app/login/LoginClient";

export default function LoginPage() {
  const azureEnabled = Boolean(
    env.azureAdClientId && env.azureAdClientSecret && env.azureAdTenantId,
  );
  return <LoginClient azureEnabled={azureEnabled} />;
}
