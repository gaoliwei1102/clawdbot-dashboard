import * as React from "react";
import { invokeTool } from "../lib/api";
import type { ChannelsListResult } from "../lib/types";
import { usePollingResource } from "./usePollingResource";

export function useChannels(opts?: { pollMs?: number }) {
  const fetcher = React.useCallback(
    async (signal: AbortSignal) => {
      try {
        return await invokeTool<ChannelsListResult>("channels_list", {}, { signal });
      } catch (error) {
        // If tool not available (404), return null (not an error)
        if (
          error instanceof Error &&
          error.name === "GatewayError" &&
          (error as { status?: number }).status === 404
        ) {
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
