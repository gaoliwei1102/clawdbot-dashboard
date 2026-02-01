import * as React from "react";
import { invokeTool } from "../lib/api";
import type { SessionsListResult } from "../lib/types";
import { usePollingResource } from "./usePollingResource";

export function useSessions(opts?: { pollMs?: number }) {
  const fetcher = React.useCallback(
    (signal: AbortSignal) =>
      invokeTool<SessionsListResult>(
        "sessions_list",
        // Prefer messageLimit=0 to keep payload small (common in clawdbot tooling).
        { limit: 200, messageLimit: 0 },
        { signal }
      ),
    []
  );

  const { data, loading, error, refetch } = usePollingResource(fetcher, { pollMs: opts?.pollMs });

  return { data, sessions: data?.sessions ?? [], loading, error, refetch };
}
