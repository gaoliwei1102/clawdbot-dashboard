import { getGatewayEnv } from "./env";

export type GatewayToolInvokeResponse<T> = {
  result?: T;
} & Record<string, unknown>;

export class GatewayError extends Error {
  status?: number;
  detail?: unknown;

  constructor(message: string, opts?: { status?: number; detail?: unknown }) {
    super(message);
    this.name = "GatewayError";
    this.status = opts?.status;
    this.detail = opts?.detail;
  }
}

// Simple auth state shared across the app
let currentPassword: string | null = null;

export function setPassword(pwd: string) {
  currentPassword = pwd;
}

export function clearPassword() {
  currentPassword = null;
}

export async function invokeTool<T>(
  tool: string,
  args: Record<string, unknown> = {},
  opts?: { signal?: AbortSignal }
): Promise<T> {
  const { baseUrl, authMode, credentials, sessionKey } = getGatewayEnv();

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (authMode === "password") {
    // Use password from memory (entered by user)
    if (currentPassword) {
      const auth = btoa(`admin:${currentPassword}`);
      headers["Authorization"] = `Basic ${auth}`;
    } else {
      throw new GatewayError("[Gateway] Password required. Please enter your password.");
    }
  } else {
    // Bearer token
    headers["Authorization"] = `Bearer ${credentials}`;
  }

  const res = await fetch(`${baseUrl}/tools/invoke`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tool, args, sessionKey }),
    signal: opts?.signal
  });

  let json: GatewayToolInvokeResponse<T> | undefined = undefined;
  try {
    json = (await res.json()) as GatewayToolInvokeResponse<T>;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const detail = json ?? (await safeReadText(res));
    // If unauthorized, clear the password
    if (res.status === 401) {
      currentPassword = null;
      // Let the UI know we need to re-auth (password mode) or token is invalid.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("gateway:unauthorized"));
      }
    }
    throw new GatewayError(`[Gateway] ${tool} failed (${res.status})`, {
      status: res.status,
      detail
    });
  }

  // Gateway commonly wraps results as { result: ... }
  if (json && "result" in json && json.result !== undefined) return json.result as T;
  return (json as unknown as T) ?? ({} as T);
}

async function safeReadText(res: Response): Promise<string | undefined> {
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}

export type GatewayEnv = {
  baseUrl: string;
  authMode: "password" | "token";
  credentials: string;
  sessionKey: string;
};
