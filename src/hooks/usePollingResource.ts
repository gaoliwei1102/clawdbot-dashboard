import * as React from "react";

export type PollingOptions = {
  pollMs?: number;
  immediate?: boolean;
};

export type PollingResult<T> = {
  data: T | null;
  loading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
};

// Helper to check if an error is "tool not available" (404)
function isToolNotAvailableError(error: unknown): boolean {
  if (error instanceof Error && error.name === "GatewayError") {
    const status = (error as { status?: number }).status;
    return status === 404;
  }
  return false;
}

// Small helper to standardize: abort in-flight requests on refetch/unmount,
// and ignore out-of-order responses.
export function usePollingResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T | null>,
  opts?: PollingOptions
): PollingResult<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<unknown>(null);
  const [loading, setLoading] = React.useState<boolean>(opts?.immediate !== false);

  const acRef = React.useRef<AbortController | null>(null);
  const reqIdRef = React.useRef(0);

  const refetch = React.useCallback(async () => {
    // Abort any previous request.
    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;

    const reqId = ++reqIdRef.current;
    setLoading(true);
    // Clear error at start of new request
    setError(null);

    try {
      const next = await fetcher(ac.signal);
      if (ac.signal.aborted || reqId !== reqIdRef.current) return;
      // Successful response - clear error and update data
      setData(next);
      setError(null);
    } catch (e) {
      if (ac.signal.aborted || reqId !== reqIdRef.current) return;
      // 404 for optional tools is not a real error
      if (isToolNotAvailableError(e)) {
        setData(null);
        setError(null);
      } else {
        setError(e);
      }
    } finally {
      if (ac.signal.aborted || reqId !== reqIdRef.current) return;
      setLoading(false);
    }
  }, [fetcher]);

  React.useEffect(() => {
    if (opts?.immediate === false) return;
    void refetch();
    return () => {
      acRef.current?.abort();
    };
  }, [opts?.immediate, refetch]);

  React.useEffect(() => {
    if (!opts?.pollMs) return;
    const t = window.setInterval(() => {
      void refetch();
    }, opts?.pollMs);
    return () => window.clearInterval(t);
  }, [opts?.pollMs, refetch]);

  return { data, loading, error, refetch };
}
