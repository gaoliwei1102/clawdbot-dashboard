import * as React from "react";
import { invokeTool } from "../lib/api";
import type { ChannelsListResult, SessionsListResult, SessionStatusResult } from "../lib/types";
import { usePollingResource } from "./usePollingResource";

export type DashboardData = {
  sessions: SessionsListResult | null;
  channels: ChannelsListResult | null;
  status: SessionStatusResult | null;
  errors: Partial<Record<"sessions_list" | "channels_list" | "session_status", unknown>>;
};

// Helper to check if an error is "tool not available" (404)
function isToolNotAvailableError(error: unknown): boolean {
  if (error instanceof Error && error.name === "GatewayError") {
    const status = (error as { status?: number }).status;
    return status === 404;
  }
  return false;
}

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

    // Only count non-404 errors as actual errors (404 = tool not available, e.g., missing plugin)
    const errors: DashboardData["errors"] = {
      ...(sessionsRes.status === "rejected" && !isToolNotAvailableError(sessionsRes.reason)
        ? { sessions_list: sessionsRes.reason }
        : null),
      ...(channelsRes.status === "rejected" && !isToolNotAvailableError(channelsRes.reason)
        ? { channels_list: channelsRes.reason }
        : null),
      ...(statusRes.status === "rejected" && !isToolNotAvailableError(statusRes.reason)
        ? { session_status: statusRes.reason }
        : null)
    };

    // If both core calls fail (and not 404), surface an error (no mock fallback).
    if (!sessions && !channels) {
      const rejection =
        sessionsRes.status === "rejected"
          ? sessionsRes.reason
          : channelsRes.status === "rejected"
            ? channelsRes.reason
            : null;
      
      // If the only failure was 404 (tool not available), don't throw - just return nulls
      if (rejection && isToolNotAvailableError(rejection)) {
        return { sessions: null, channels: null, status: null, errors };
      }
      
      const reason = rejection ?? new Error("Gateway request failed");
      throw reason;
    }

    return { sessions, channels, status, errors };
  }, []);

  const { data, loading, error, refetch } = usePollingResource(fetcher, { pollMs: opts?.pollMs });

  return {
    data: data ?? { sessions: null, channels: null, status: null, errors: {} },
    loading,
    error,
    refetch
  };
}
