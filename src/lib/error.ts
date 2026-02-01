import { GatewayError } from "./api";

export function getErrorMessage(err: unknown): string {
  if (err instanceof GatewayError) {
    // Keep the UI consistent and avoid leaking large structured error payloads by default.
    return err.message;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err === null || err === undefined) return "Unknown error";

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

