import * as React from "react";
import { invokeTool } from "../lib/api";
import type { ChannelsListResult } from "../lib/types";
import { usePollingResource } from "./usePollingResource";

// Helper to check if an error is "tool not available" (404)
function isToolNotAvailableError(error: unknown): boolean {
  if (error instanceof Error && error.name === "GatewayError") {
    const status = (error as { status?: number }).status;
    return status === 404;
  }
  return false;
}

export function useChannels(opts?: { pollMs?: number }) {
  const fetcher = React.useCallback(
    async (signal: AbortSignal) => {
      try {
        return await invokeTool<ChannelsListResult>("channels_list", {}, { signal });
      } catch (error) {
        // If tool not available (404), return empty result instead of throwing
        if (isToolNotAvailableError(error)) {
          return null;
        }
        throw error;
      }
    },
    []
  );

  const { data, loading, error, refetch } = usePollingResource(fetcher, { pollMs: opts?.pollMs });

  return { data, channels: data?.channels ?? [], loading, error, refetch };
}
