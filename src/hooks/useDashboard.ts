import * as React from "react";
import { invokeTool } from "../lib/api";
import type { ChannelsListResult, SessionsListResult, SessionStatusResult } from "../lib/types";

export type DashboardData = {
  sessions: SessionsListResult | null;
  channels: ChannelsListResult | null;
  status: SessionStatusResult | null;
};

export function useDashboard(opts?: { pollMs?: number }) {
  const [data, setData] = React.useState<DashboardData>({
    sessions: null,
    channels: null,
    status: null
  });
  const [error, setError] = React.useState<unknown>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [sessionsRes, channelsRes, statusRes] = await Promise.allSettled([
        invokeTool<SessionsListResult>("sessions_list", { limit: 200, messageLimit: 0 }),
        invokeTool<ChannelsListResult>("channels_list", {}),
        // Optional "heartbeat" for dashboard headline.
        invokeTool<SessionStatusResult>("session_status", {})
      ]);

      const sessions = sessionsRes.status === "fulfilled" ? sessionsRes.value : null;
      const channels = channelsRes.status === "fulfilled" ? channelsRes.value : null;
      const status = statusRes.status === "fulfilled" ? statusRes.value : null;

      // If both core calls fail, surface an error (no mock fallback).
      if (!sessions && !channels) {
        setError(
          sessionsRes.status === "rejected" ? sessionsRes.reason : channelsRes.status === "rejected" ? channelsRes.reason : new Error("Gateway request failed")
        );
      }

      setData({ sessions, channels, status });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  React.useEffect(() => {
    if (!opts?.pollMs) return;
    const t = window.setInterval(() => {
      void refetch();
    }, opts.pollMs);
    return () => window.clearInterval(t);
  }, [opts?.pollMs, refetch]);

  return { data, loading, error, refetch };
}
