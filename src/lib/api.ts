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

export async function invokeTool<T>(
  tool: string,
  args: Record<string, unknown> = {},
  opts?: { signal?: AbortSignal }
): Promise<T> {
  const { baseUrl, token, sessionKey } = getGatewayEnv();

  const res = await fetch(`${baseUrl}/tools/invoke`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
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
    throw new GatewayError(`[Gateway] ${tool} failed (${res.status})`, {
      status: res.status,
      detail
    });
  }

  // Gateway commonly wraps results as { result: ... } (see skills/openclaw-skills references).
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

