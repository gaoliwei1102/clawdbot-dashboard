import * as React from "react";
import { invokeTool } from "../lib/api";
import type { ChannelsListResult } from "../lib/types";
import { usePollingResource } from "./usePollingResource";

export function useChannels(opts?: { pollMs?: number }) {
  const fetcher = React.useCallback(
    (signal: AbortSignal) => invokeTool<ChannelsListResult>("channels_list", {}, { signal }),
    []
  );

  const { data, loading, error, refetch } = usePollingResource(fetcher, { pollMs: opts?.pollMs });

  return { data, channels: data?.channels ?? [], loading, error, refetch };
}
