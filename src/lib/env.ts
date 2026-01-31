export type GatewayEnv = {
  baseUrl: string;
  authMode: "password" | "token";
  credentials: string; // password or token
  sessionKey: string;
};

function readRequired(name: keyof ImportMetaEnv): string {
  const v = import.meta.env[name];
  if (!v) {
    throw new Error(
      `[env] Missing ${name}. Create clawdbot-dashboard/.env from .env.example.`
    );
  }
  return v;
}

function readOptional(name: keyof ImportMetaEnv): string | undefined {
  return import.meta.env[name];
}

export function getGatewayEnv(): GatewayEnv {
  const authMode = (readOptional("VITE_AUTH_MODE") || "token") as "password" | "token";

  return {
    baseUrl: readRequired("VITE_GATEWAY_URL").replace(/\/+$/, ""),
    authMode,
    credentials: authMode === "password"
      ? readRequired("VITE_GATEWAY_PASSWORD")
      : readRequired("VITE_GATEWAY_TOKEN"),
    sessionKey: import.meta.env.VITE_GATEWAY_SESSION_KEY || "main"
  };
}
