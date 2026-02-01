import * as React from "react";
import { useRefresh } from "../../lib/refresh";
import { getErrorMessage } from "../../lib/error";
import type { Session } from "../../lib/types";
import { useSessions } from "../../hooks/useSessions";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/DropdownMenu";
import { Input } from "../ui/Input";
import { Skeleton } from "../ui/Skeleton";
import { Table, TBody, TD, TH, THead } from "../ui/Table";

function uniq(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
}

function matchSession(s: Session, q: string) {
  const hay = `${s.key} ${s.model ?? ""} ${s.channel ?? ""}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

export function SessionsPage() {
  const { tick } = useRefresh();
  const { sessions, loading, error, refetch } = useSessions({ pollMs: 10000 });

  const [query, setQuery] = React.useState("");
  const [channel, setChannel] = React.useState<string | null>(null);
  const [model, setModel] = React.useState<string | null>(null);

  React.useEffect(() => {
    void refetch();
  }, [tick, refetch]);

  const channels = React.useMemo(() => uniq(sessions.map((s) => s.channel)), [sessions]);
  const models = React.useMemo(() => uniq(sessions.map((s) => s.model)), [sessions]);

  const filtered = React.useMemo(() => {
    return sessions
      .filter((s) => (query ? matchSession(s, query) : true))
      .filter((s) => (channel ? s.channel === channel : true))
      .filter((s) => (model ? s.model === model : true));
  }, [sessions, query, channel, model]);

  const totalTokens = filtered.reduce(
    (acc, s) => acc + (typeof s.totalTokens === "number" ? s.totalTokens : 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="h-balance font-display text-xl text-zinc-50">会话管理</div>
          <div className="p-pretty mt-1 text-sm text-zinc-400">
            支持搜索与筛选；数据来自 Gateway 工具 <span className="text-zinc-200">sessions_list</span>。
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refetch}>
            刷新列表
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Sessions</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-[min(520px,80vw)]">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索 key / model / channel…"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="md">
                    Channel {channel ? `: ${channel}` : ""}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setChannel(null)}>All</DropdownMenuItem>
                  {channels.map((c) => (
                    <DropdownMenuItem key={c} onSelect={() => setChannel(c)}>
                      {c}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="md">
                    Model {model ? `: ${model}` : ""}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setModel(null)}>All</DropdownMenuItem>
                  {models.map((m) => (
                    <DropdownMenuItem key={m} onSelect={() => setModel(m)}>
                      {m}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {(channel || model || query) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setQuery("");
                    setChannel(null);
                    setModel(null);
                  }}
                >
                  清除
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 tabular-nums">
            <Badge variant="neutral">{filtered.length} sessions</Badge>
            <Badge variant="neutral">{totalTokens.toLocaleString()} tokens</Badge>
            {loading ? <Badge variant="warn">loading…</Badge> : <Badge variant="ok">live</Badge>}
          </div>

	          {error ? (
	            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
	              {getErrorMessage(error)}
	            </div>
	          ) : null}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : filtered.length ? (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <TH>Key</TH>
                    <TH>Model</TH>
                    <TH>Channel</TH>
                    <TH className="text-right">Total Tokens</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {filtered.map((s) => (
                    <SessionRow key={s.key} s={s} />
                  ))}
                </TBody>
              </Table>
            </div>
          ) : (
            <div className="p-4">
              <div className="p-pretty text-sm text-zinc-500">
                没有可显示的会话。试试清除筛选，或确认 Gateway 返回了 sessions_list 数据。
              </div>
              <div className="mt-3">
                <Button onClick={refetch}>重试</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionRow({ s }: { s: Session }) {
  const tokens = typeof s.totalTokens === "number" ? s.totalTokens : 0;
  return (
    <tr className="hover:bg-zinc-950/40">
      <TD className="font-mono text-xs text-zinc-200">{s.key}</TD>
      <TD className="text-zinc-300">{s.model || <span className="text-zinc-500">—</span>}</TD>
      <TD className="text-zinc-300">{s.channel || <span className="text-zinc-500">—</span>}</TD>
      <TD className="text-right tabular-nums text-zinc-200">{tokens.toLocaleString()}</TD>
      <TD className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Session actions">
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                void navigator.clipboard.writeText(s.key);
              }}
            >
              Copy key
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                const payload = JSON.stringify(s, null, 2);
                void navigator.clipboard.writeText(payload);
              }}
            >
              Copy JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TD>
    </tr>
  );
}
