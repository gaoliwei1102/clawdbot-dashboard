export type GatewayEnv = {
  baseUrl: string;
  token: string;
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

export function getGatewayEnv(): GatewayEnv {
  return {
    baseUrl: readRequired("VITE_GATEWAY_URL").replace(/\/+$/, ""),
    token: readRequired("VITE_GATEWAY_TOKEN"),
    sessionKey: import.meta.env.VITE_GATEWAY_SESSION_KEY || "main"
  };
}

