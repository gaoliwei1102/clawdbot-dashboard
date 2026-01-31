import * as React from "react";
import { invokeTool } from "../lib/api";
import type { SessionsListResult } from "../lib/types";

export function useSessions(opts?: { pollMs?: number }) {
  const [data, setData] = React.useState<SessionsListResult | null>(null);
  const [error, setError] = React.useState<unknown>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [tick, setTick] = React.useState(0);

  const refetch = React.useCallback(async () => {
    setTick((t) => t + 1);
  }, []);

  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await invokeTool<SessionsListResult>(
          "sessions_list",
          // Prefer messageLimit=0 to keep payload small (common in clawdbot tooling).
          { limit: 200, messageLimit: 0 },
          { signal: ac.signal }
        );
        setData(result);
      } catch (e) {
        if (!ac.signal.aborted) setError(e);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [tick]);

  React.useEffect(() => {
    if (!opts?.pollMs) return;
    const t = window.setInterval(() => {
      void refetch();
    }, opts.pollMs);
    return () => window.clearInterval(t);
  }, [opts?.pollMs, refetch]);

  return { data, sessions: data?.sessions ?? [], loading, error, refetch };
}
