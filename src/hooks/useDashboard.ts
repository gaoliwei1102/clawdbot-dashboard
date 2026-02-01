import * as React from "react";
import { invokeTool } from "../lib/api";
import type { ChannelsListResult, SessionsListResult, SessionStatusResult } from "../lib/types";
import { usePollingResource } from "./usePollingResource";

export type DashboardData = {
  sessions: SessionsListResult | null;
  channels: ChannelsListResult | null;
  status: SessionStatusResult | null;
};

export function useDashboard(opts?: { pollMs?: number }) {
  const fetcher = React.useCallback(async (signal: AbortSignal): Promise<DashboardData> => {
    const [sessionsRes, channelsRes, statusRes] = await Promise.allSettled([
      invokeTool<SessionsListResult>("sessions_list", { limit: 200, messageLimit: 0 }, { signal }),
      invokeTool<ChannelsListResult>("channels_list", {}, { signal }),
      // Optional "heartbeat" for dashboard headline.
      invokeTool<SessionStatusResult>("session_status", {}, { signal })
    ]);

    const sessions = sessionsRes.status === "fulfilled" ? sessionsRes.value : null;
    const channels = channelsRes.status === "fulfilled" ? channelsRes.value : null;
    const status = statusRes.status === "fulfilled" ? statusRes.value : null;

    // If both core calls fail, surface an error (no mock fallback).
    if (!sessions && !channels) {
      const reason =
        sessionsRes.status === "rejected"
          ? sessionsRes.reason
          : channelsRes.status === "rejected"
            ? channelsRes.reason
            : new Error("Gateway request failed");
      throw reason;
    }

    return { sessions, channels, status };
  }, []);

  const { data, loading, error, refetch } = usePollingResource(fetcher, { pollMs: opts?.pollMs });

  return {
    data: data ?? { sessions: null, channels: null, status: null },
    loading,
    error,
    refetch
  };
}
