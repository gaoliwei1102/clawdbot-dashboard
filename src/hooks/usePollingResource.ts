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

// Small helper to standardize: abort in-flight requests on refetch/unmount,
// and ignore out-of-order responses.
export function usePollingResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
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
    setError(null);

    try {
      const next = await fetcher(ac.signal);
      if (ac.signal.aborted || reqId !== reqIdRef.current) return;
      setData(next);
    } catch (e) {
      if (ac.signal.aborted || reqId !== reqIdRef.current) return;
      setError(e);
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
    }, opts.pollMs);
    return () => window.clearInterval(t);
  }, [opts?.pollMs, refetch]);

  return { data, loading, error, refetch };
}

