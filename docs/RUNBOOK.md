# Runbook

## 需要的工具

- Node.js 18+（建议 20+）
- npm / pnpm / yarn 任意一种

## 配置

从 `.env.example` 复制生成 `.env`，至少填：

- `VITE_GATEWAY_URL`
- `VITE_AUTH_MODE`（`password` 或 `token`）
- `VITE_GATEWAY_TOKEN`（当 `VITE_AUTH_MODE=token` 时需要）

可选：
- `VITE_GATEWAY_SESSION_KEY`（默认 `main`）

## Gateway /tools/invoke API（给排障用）

请求：

```bash
curl -sS \\
  -X POST \"$VITE_GATEWAY_URL/tools/invoke\" \\
  -H \"Authorization: Bearer <token-or-password>\" \\
  -H \"Content-Type: application/json\" \\
  --data '{\"tool\":\"sessions_list\",\"args\":{\"limit\":5,\"messageLimit\":0},\"sessionKey\":\"main\"}'
```

注意：
- clawdbot 的很多工具返回 `result.details` 才是“业务数据”（见 `docs/ARCHITECTURE.md`）。
- 如果返回 401：说明 token/password 不对，或 Gateway 处于不同的认证模式。
- 如果返回 404（Tool not available）：说明该工具在当前 Gateway 不可用（常见于 plugin 工具未启用）。

## 常见问题

### 1) 页面一直报 Gateway 请求失败

检查：
- Gateway 是否在本机运行（默认 `http://127.0.0.1:18789`）
- Token / Password 是否有效（`Authorization: Bearer ...`）
- 是否存在 CORS 限制
- 如果是 `https://`，浏览器是否因为证书不受信任而阻止请求（自签名证书很常见）

如果是 CORS：
- 将 `VITE_GATEWAY_URL=/api`
- 然后 `npm run dev`，通过 dev proxy 访问

### 2) Dashboard 的 Heartbeat 显示 session_status unavailable

这是可选项：如果你的 Gateway 没有提供 `session_status` 工具，不影响其他页面（Sessions/Channels 仍可用）。

### 3) channels_list / sessions_list 返回空

先区分两种情况：

1) **请求成功但业务数据确实为空**
- `sessions_list` 的 `details.sessions` 为空：说明当前 gateway session store 里没有可见 session，或被 tool policy / sandbox visibility 限制过滤掉。
- `channels_list` 的 `details.channels` 为空：说明通道提供方未启用，或该工具本身未能拿到任何通道状态。

2) **前端解包不正确导致“看起来为空”**
- clawdbot 常见 tool result 形态是 `{ content, details }`，业务数据在 `details`。
- 本项目已在 `src/lib/api.ts` 统一做了解包（优先返回 `result.details`）。

建议直接用 curl 对照：
- 如果 `result.details.sessions`/`result.details.channels` 有数据，但页面还是空：优先检查浏览器控制台网络响应是否被代理/缓存改写。
- 如果 `result.details` 本身就为空：回到 Gateway 配置、权限与 plugin 启用状态排查。
