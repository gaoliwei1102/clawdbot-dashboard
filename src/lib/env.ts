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

  // In password mode, credentials come from user input (not .env)
  // In token mode, credentials come from .env
  let credentials: string;
  if (authMode === "password") {
    credentials = ""; // Will be provided by useAuth hook at runtime
  } else {
    credentials = readRequired("VITE_GATEWAY_TOKEN");
  }

  return {
    baseUrl: readRequired("VITE_GATEWAY_URL").replace(/\/+$/, ""),
    authMode,
    credentials,
    sessionKey: import.meta.env.VITE_GATEWAY_SESSION_KEY || "main"
  };
}
