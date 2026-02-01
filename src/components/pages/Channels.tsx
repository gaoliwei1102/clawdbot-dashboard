import * as React from "react";
import { useRefresh } from "../../lib/refresh";
import { getErrorMessage } from "../../lib/error";
import type { Channel } from "../../lib/types";
import { useChannels } from "../../hooks/useChannels";
import { Badge, type BadgeVariant } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Input } from "../ui/Input";
import { Skeleton } from "../ui/Skeleton";

function normalizePlatform(ch: Channel): string {
  const raw = (ch.platform || ch.name || ch.id || "unknown").toString().toLowerCase();
  if (raw.includes("whatsapp")) return "WhatsApp";
  if (raw.includes("discord")) return "Discord";
  if (raw.includes("telegram")) return "Telegram";
  if (raw.includes("slack")) return "Slack";
  return (ch.platform || ch.name || ch.id || "Unknown").toString();
}

function connectedHeuristic(ch: Channel): boolean | null {
  if (typeof ch.connected === "boolean") return ch.connected;
  const s = (ch.status || "").toString().toLowerCase();
  if (!s) return null;
  if (["ok", "online", "connected", "ready", "running"].some((k) => s.includes(k))) return true;
  if (["down", "offline", "error", "disconnected", "dead"].some((k) => s.includes(k))) return false;
  return null;
}

function iconFor(platform: string) {
  const p = platform.toLowerCase();
  const cls = "size-6";
  if (p === "discord") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M8 9.5c1.2-.9 2.6-1.3 4-1.3s2.8.4 4 1.3" />
        <path d="M8.2 16.5c1.1.7 2.4 1 3.8 1s2.7-.3 3.8-1" />
        <path d="M7 6.5c-1.6 1.8-2.5 4.1-2.5 6.6 0 4.3 3.1 7.4 7.5 7.4s7.5-3.1 7.5-7.4c0-2.5-.9-4.8-2.5-6.6" />
        <path d="M9 12.8h.01M15 12.8h.01" />
      </svg>
    );
  }
  if (p === "telegram") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 5L3.6 11.7c-.7.3-.7 1.3.1 1.5l4.7 1.3 1.7 5.1c.2.7 1.1.8 1.5.3l2.8-3.2 4.7 3.5c.6.4 1.5.1 1.7-.7L22 6.2c.2-.8-.4-1.5-1-1.2z" />
      </svg>
    );
  }
  if (p === "slack") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M8.5 13.5a2 2 0 11-2-2h2v2zM10.5 13.5h3v7a2 2 0 11-2-2h-1v-5z" />
        <path d="M10.5 8.5a2 2 0 11-2-2h2v2zM10.5 10.5v3h-7a2 2 0 112-2v-1h5z" />
        <path d="M15.5 10.5a2 2 0 112-2v2h-2zM13.5 10.5h-3v-7a2 2 0 112 2h1v5z" />
        <path d="M13.5 15.5a2 2 0 112 2h-2v-2zM13.5 13.5v-3h7a2 2 0 11-2 2v1h-5z" />
      </svg>
    );
  }
  // WhatsApp / default
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20 12a8 8 0 01-12.3 6.9L4 20l1.2-3.5A8 8 0 1120 12z" />
      <path d="M9.3 9.2c.3-.5.6-.5 1-.2l.9.7c.3.2.4.6.2.9l-.4.6c-.1.2-.1.4 0 .6.5 1 1.4 1.9 2.4 2.4.2.1.4.1.6 0l.6-.4c.3-.2.7-.2.9.2l.7.9c.3.4.3.7-.2 1-1 .7-2.4.8-3.8.2-2.1-.9-4-2.8-4.9-4.9-.6-1.4-.5-2.8.2-3.8z" />
    </svg>
  );
}

export function ChannelsPage() {
  const { tick } = useRefresh();
  const { channels, loading, error, refetch } = useChannels({ pollMs: 10000 });
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    void refetch();
  }, [tick, refetch]);

  const filtered = React.useMemo(() => {
    if (!query) return channels;
    const q = query.toLowerCase();
    return channels.filter((ch) => {
      const p = normalizePlatform(ch).toLowerCase();
      const s = (ch.status || "").toString().toLowerCase();
      const n = (ch.name || "").toString().toLowerCase();
      const id = (ch.id || "").toString().toLowerCase();
      return `${p} ${s} ${n} ${id}`.includes(q);
    });
  }, [channels, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="h-balance font-display text-xl text-zinc-50">通道状态</div>
          <div className="p-pretty mt-1 text-sm text-zinc-400">
            WhatsApp / Discord / Telegram / Slack 等通道卡片；数据来自{" "}
            <span className="text-zinc-200">channels_list</span>。
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refetch}>
            刷新通道
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Channels</CardTitle>
            <div className="w-[min(520px,80vw)]">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索平台 / 名称 / 状态…" />
            </div>
          </div>
          {error ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <div className="min-w-0 truncate">{getErrorMessage(error)}</div>
              <Button onClick={refetch} size="sm">
                重试
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <div className="space-y-3">
              <div className="p-pretty text-sm text-zinc-500">
                channels_list 请求失败。若返回 404，说明当前 Gateway 未提供该工具（常见于 plugin 未启用）。
              </div>
              <div>
                <Button onClick={refetch}>重试</Button>
              </div>
            </div>
          ) : filtered.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((ch, idx) => (
                <ChannelCard key={ch.id ?? ch.name ?? String(idx)} ch={ch} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-pretty text-sm text-zinc-500">
                channels_list 返回空。请确认 Gateway 已启用通道提供方（WhatsApp/Discord/Telegram/Slack…）。
              </div>
              <div>
                <Button onClick={refetch}>重试</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChannelCard({ ch }: { ch: Channel }) {
  const platform = normalizePlatform(ch);
  const connected = connectedHeuristic(ch);
  const status = (ch.status || "").toString() || "unknown";

  const badgeVariant: BadgeVariant =
    connected === true ? "ok" : connected === false ? "bad" : status.toLowerCase().includes("warn") ? "warn" : "neutral";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-emerald-200">{iconFor(platform)}</div>
            <div className="min-w-0">
              <div className="truncate font-display text-base text-zinc-50">{platform}</div>
              <div className="truncate text-xs text-zinc-500">{ch.name || ch.id || "—"}</div>
            </div>
          </div>
        </div>
        <Badge variant={badgeVariant}>{status}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 tabular-nums">
          <div className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2">
            <div>connected</div>
            <div className="mt-1 text-zinc-200">
              {connected === null ? "unknown" : connected ? "true" : "false"}
            </div>
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2">
            <div>last seen</div>
            <div className="mt-1 truncate text-zinc-200">{ch.lastSeenAt ? String(ch.lastSeenAt) : "—"}</div>
          </div>
        </div>

        <details className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2">
          <summary className="cursor-pointer text-xs text-zinc-300">raw</summary>
          <pre className="mt-2 max-h-48 overflow-auto text-xs text-zinc-200">
            {JSON.stringify(ch, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
