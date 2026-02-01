import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useRefresh } from "../../lib/refresh";
import type { Channel, Session } from "../../lib/types";
import { useDashboard } from "../../hooks/useDashboard";
import { getErrorMessage } from "../../lib/error";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";

function sumTokens(sessions: Session[]) {
  return sessions.reduce((acc, s) => acc + (typeof s.totalTokens === "number" ? s.totalTokens : 0), 0);
}

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

export function DashboardPage() {
  const { tick } = useRefresh();
  const { data, loading, error, refetch } = useDashboard({ pollMs: 8000 });

  React.useEffect(() => {
    void refetch();
  }, [tick, refetch]);

  const sessions = data.sessions?.sessions ?? [];
  const channels = data.channels?.channels ?? [];

  const totalTokens = sumTokens(sessions);
  const connectedCount = channels.reduce((acc, ch) => (connectedHeuristic(ch) ? acc + 1 : acc), 0);
  const knownStatus = channels.some((ch) => connectedHeuristic(ch) !== null);

  const topSessions = React.useMemo(() => {
    const sorted = [...sessions].sort((a, b) => (b.totalTokens ?? 0) - (a.totalTokens ?? 0)).slice(0, 10);
    return sorted.map((s) => ({
      key: s.key,
      tokens: typeof s.totalTokens === "number" ? s.totalTokens : 0
    }));
  }, [sessions]);

  const channelsByPlatform = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const ch of channels) {
      const p = normalizePlatform(ch);
      map.set(p, (map.get(p) || 0) + 1);
    }
    return Array.from(map.entries()).map(([platform, count]) => ({ platform, count }));
  }, [channels]);

  const statusText = data.status?.details?.statusText;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="h-balance font-display text-xl text-zinc-50">实时状态概览</div>
          <div className="p-pretty mt-1 text-sm text-zinc-400">
            直接调用 Gateway 工具 API（无 Mock）。建议在本机运行：URL {import.meta.env.VITE_GATEWAY_URL || "(unset)"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refetch}>
            立即拉取
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader>
            <CardTitle>Gateway 请求失败</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-pretty text-sm text-red-200">
              请检查 `VITE_GATEWAY_URL` / `VITE_GATEWAY_TOKEN`，以及 Gateway 是否允许浏览器跨域访问。
            </div>
	            <div className="rounded-md border border-red-500/20 bg-zinc-950/60 p-3 text-xs text-zinc-200">
	              {getErrorMessage(error)}
	            </div>
            <div>
              <Button onClick={refetch}>重试</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-semibold tabular-nums">{sessions.length}</div>
            )}
            <div className="mt-2 text-xs text-zinc-500">来自 sessions_list</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-semibold tabular-nums">{totalTokens.toLocaleString()}</div>
            )}
            <div className="mt-2 text-xs text-zinc-500">sum(session.totalTokens)</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Channels</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-semibold tabular-nums">{channels.length}</div>
                {knownStatus ? (
                  <Badge variant={connectedCount === channels.length ? "ok" : connectedCount > 0 ? "warn" : "bad"}>
                    {connectedCount} connected
                  </Badge>
                ) : (
                  <Badge variant="neutral">status unknown</Badge>
                )}
              </div>
            )}
            <div className="mt-2 text-xs text-zinc-500">来自 channels_list</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Heartbeat</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : statusText ? (
              <div className="p-pretty text-sm text-zinc-200">{statusText}</div>
            ) : (
              <div className="p-pretty text-sm text-zinc-500">session_status unavailable</div>
            )}
            <div className="mt-2 text-xs text-zinc-500">来自 session_status</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Sessions by Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : topSessions.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSessions} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis dataKey="key" tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} axisLine={false} interval={0} height={60} />
                    <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#09090b",
                        border: "1px solid #27272a",
                        color: "#e4e4e7"
                      }}
                      cursor={{ fill: "rgba(16,185,129,0.08)" }}
                    />
                    <Bar dataKey="tokens" fill="#34d399" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-pretty text-sm text-zinc-500">
                sessions_list 返回空。请确认 Gateway 正在运行且 token 有权限。
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channels by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : channelsByPlatform.length ? (
              <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          contentStyle={{
                            background: "#09090b",
                            border: "1px solid #27272a",
                            color: "#e4e4e7"
                          }}
                        />
                        <Pie
                          data={channelsByPlatform}
                          dataKey="count"
                          nameKey="platform"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          fill="#34d399"
                          stroke="#09090b"
                          isAnimationActive={false}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="space-y-2">
                    {channelsByPlatform
                      .slice()
                      .sort((a, b) => b.count - a.count)
                      .map((row) => (
                        <div key={row.platform} className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                          <div className="truncate text-sm text-zinc-100">{row.platform}</div>
                          <div className="text-sm tabular-nums text-zinc-300">{row.count}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-pretty text-sm text-zinc-500">
                channels_list 返回空。请确认 Gateway 已配置 WhatsApp/Discord/Telegram/Slack 等通道。
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
