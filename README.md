# clawdbot-dashboard

React 18 + Vite + Tailwind CSS + Recharts + React Router 的 Clawdbot Dashboard 前端。

核心原则：**不使用 Mock 数据**，所有页面都通过 Gateway HTTP API 调用工具获取真实数据。

## Quick Start

1) 进入项目目录

```bash
cd clawdbot-dashboard
```

2) 配置环境变量

```bash
cp .env.example .env
```

至少需要：
- `VITE_GATEWAY_URL`
- `VITE_GATEWAY_TOKEN`

3) 安装依赖并启动（需要联网拉取 npm 包）

```bash
npm install
npm run dev
```

打开：`http://localhost:8002`

## Gateway API

默认调用：
- `POST {VITE_GATEWAY_URL}/tools/invoke`
- Header：`Authorization: Bearer ${VITE_GATEWAY_TOKEN}`
- Body（JSON）：

```json
{
  "tool": "sessions_list",
  "args": { "limit": 200, "messageLimit": 0 },
  "sessionKey": "main"
}
```

常见返回会包装为：

```json
{ "result": { "sessions": [] } }
```

本项目会自动优先读取 `result` 字段（见 `src/lib/api.ts`）。

## CORS / 本地开发代理

如果 Gateway 没有对浏览器开放 CORS：
- 将 `VITE_GATEWAY_URL` 设为 `/api`
- `vite` dev server 会代理 `/api/* -> http://127.0.0.1:18789/*`（见 `vite.config.ts`）

注意：这只解决开发期 CORS；生产环境仍建议通过同域反代或网关配置 CORS。

## 页面

- `/dashboard` 仪表盘：实时概览（`sessions_list` / `channels_list` / 可选 `session_status`）
- `/sessions` 会话管理：列表、搜索、筛选（`sessions_list`）
- `/channels` 通道状态：WhatsApp/Discord/Telegram/Slack 等卡片（`channels_list`）

## 目录结构

- `src/components/layout/` Sidebar, Header
- `src/components/pages/` Dashboard, Sessions, Channels
- `src/components/ui/` Button, Card, Table 等（Radix + Tailwind）
- `src/lib/api.ts` Gateway API 调用封装
- `src/hooks/` useSessions, useChannels, useDashboard 等

## 安全提示

`VITE_GATEWAY_TOKEN` 会注入到前端构建产物中并在浏览器端发送请求（这是 Vite 的机制）。请在可信环境使用，并考虑在生产环境通过后端代理/短期 token/权限隔离降低风险。

