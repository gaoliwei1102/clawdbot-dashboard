import * as React from "react";
import { useLocation } from "react-router-dom";
import { useRefresh } from "../../lib/refresh";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Dialog, DialogContent, DialogTrigger } from "../ui/Dialog";
import { MobileNav } from "./Sidebar";

function useTitle() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/sessions")) return "会话管理";
  if (pathname.startsWith("/channels")) return "通道状态";
  return "仪表盘";
}

function maskToken(token: string) {
  if (token.length <= 10) return "********";
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

export function Header() {
  const title = useTitle();
  const { trigger } = useRefresh();

  const env = {
    baseUrl: import.meta.env.VITE_GATEWAY_URL ?? "",
    token: import.meta.env.VITE_GATEWAY_TOKEN ?? "",
    sessionKey: import.meta.env.VITE_GATEWAY_SESSION_KEY ?? "main"
  };

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="md:hidden">
          <MobileNav />
        </div>
        <div className="min-w-0 flex-1">
          <div className="h-balance font-display text-lg text-zinc-50">{title}</div>
          <div className="mt-0.5 truncate text-xs text-zinc-500 tabular-nums">
            Gateway: {env.baseUrl || "(unset)"} · sessionKey: {env.sessionKey}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={trigger}>
            刷新
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                环境变量
              </Button>
            </DialogTrigger>
            <DialogContent>
              <div className="space-y-3">
                <div className="font-display text-base">Gateway 配置</div>
                <Card className="p-3">
                  <div className="space-y-2 text-sm text-zinc-200 tabular-nums">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-zinc-400">VITE_GATEWAY_URL</div>
                      <div className="truncate text-right">{env.baseUrl || "(unset)"}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-zinc-400">VITE_GATEWAY_SESSION_KEY</div>
                      <div className="truncate text-right">{env.sessionKey}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-zinc-400">VITE_GATEWAY_TOKEN</div>
                      <div className="truncate text-right">
                        {env.token ? maskToken(env.token) : "(unset)"}
                      </div>
                    </div>
                  </div>
                </Card>
                <div className="p-pretty text-xs text-zinc-400">
                  Token 会注入到浏览器端请求中（Authorization: Bearer …）。请仅在可信环境使用。
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

