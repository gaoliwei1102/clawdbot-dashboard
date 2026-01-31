import * as React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";
import { getGatewayEnv } from "../../lib/env";
import { Dialog, DialogContent, DialogTrigger } from "../ui/Dialog";
import { IconButton } from "../ui/IconButton";

function Brand() {
  return (
    <div className="flex items-baseline gap-2 px-3 py-3">
      <div className="font-display text-lg text-zinc-100">Clawdbot</div>
      <div className="text-xs text-zinc-400">Dashboard</div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900",
          isActive && "bg-zinc-900 text-zinc-50"
        )
      }
    >
      <span className="inline-flex size-5 items-center justify-center text-zinc-300">{icon}</span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SidebarInner({ variant }: { variant: "desktop" | "mobile" }) {
  let envOk = true;
  try {
    getGatewayEnv();
  } catch {
    envOk = false;
  }

  return (
    <div className={cn("flex h-full min-h-dvh flex-col", variant === "mobile" && "min-h-0")}>
      <Brand />
      <div className="px-3">
        <div
          className={cn(
            "rounded-md border px-3 py-2 text-xs tabular-nums",
            envOk ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"
          )}
        >
          {envOk ? "Gateway env: ready" : "Gateway env: missing (.env)"}
        </div>
      </div>
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-2">
        <NavItem
          to="/dashboard"
          label="仪表盘"
          icon={
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 13.5V20h6.5v-6.5H4zM13.5 4H20v6.5h-6.5V4zM13.5 13.5H20V20h-6.5v-6.5zM4 4h6.5v6.5H4V4z" />
            </svg>
          }
        />
        <NavItem
          to="/sessions"
          label="会话管理"
          icon={
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 7h10M7 12h10M7 17h6" />
              <path d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
          }
        />
        <NavItem
          to="/channels"
          label="通道状态"
          icon={
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 12a5 5 0 0110 0" />
              <path d="M5 12a7 7 0 0114 0" />
              <path d="M9.5 12a2.5 2.5 0 015 0" />
              <path d="M12 21a1.5 1.5 0 01-1.5-1.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5A1.5 1.5 0 0112 21z" />
            </svg>
          }
        />
      </nav>
      <div className={cn("safe-bottom border-t border-zinc-800 px-3 py-3 text-xs text-zinc-500", variant === "mobile" && "border-none")}>
        <div className="p-pretty">
          数据来自 Gateway 工具调用：<span className="text-zinc-300">sessions_list / channels_list</span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="safe-top hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-950/70 md:block">
      <SidebarInner variant="desktop" />
    </aside>
  );
}

export function MobileNav() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <IconButton aria-label="Open navigation">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 7h14M5 12h14M5 17h14" />
          </svg>
        </IconButton>
      </DialogTrigger>
      <DialogContent className="p-0">
        <div className="border-b border-zinc-800 px-3 py-3">
          <div className="font-display text-base">Navigation</div>
        </div>
        <div className="px-2 py-2">
          <SidebarInner variant="mobile" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

