import { getGatewayEnv } from "./env";

export type GatewayToolInvokeResponse<T> = {
  ok?: boolean;
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
      // Gateway HTTP endpoint uses Bearer token auth
      headers["Authorization"] = `Bearer ${currentPassword}`;
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

  // Gateway wraps results as { ok: true, result: ... }.
  // Many clawdbot tools return a "ToolResult" shape: { content: [...], details: <payload> }.
  // For dashboard usage we want the payload, so prefer unwrapping `result.details` when present.
  const rawResult =
    json && typeof json === "object" && "result" in json ? (json as GatewayToolInvokeResponse<unknown>).result : json;
  const unwrapped = unwrapToolDetails(rawResult);
  if (unwrapped !== undefined) return unwrapped as T;
  if (rawResult !== undefined) return rawResult as T;
  return (json as unknown as T) ?? ({} as T);
}

async function safeReadText(res: Response): Promise<string | undefined> {
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}

function unwrapToolDetails(value: unknown): unknown | undefined {
  if (!value || typeof value !== "object") return undefined;
  // Prefer `details` only when it is explicitly present, otherwise keep the raw result.
  if (!("details" in value)) return undefined;
  const details = (value as { details?: unknown }).details;
  return details === undefined ? undefined : details;
}

export type GatewayEnv = {
  baseUrl: string;
  authMode: "password" | "token";
  credentials: string;
  sessionKey: string;
};
