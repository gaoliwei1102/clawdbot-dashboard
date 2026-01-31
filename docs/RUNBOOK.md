# Runbook

## 需要的工具

- Node.js 18+（建议 20+）
- npm / pnpm / yarn 任意一种

## 配置

从 `.env.example` 复制生成 `.env`，至少填：

- `VITE_GATEWAY_URL`
- `VITE_GATEWAY_TOKEN`

可选：
- `VITE_GATEWAY_SESSION_KEY`（默认 `main`）

## 常见问题

### 1) 页面一直报 Gateway 请求失败

检查：
- Gateway 是否在本机运行（默认 `http://127.0.0.1:18789`）
- Token 是否有效（`Authorization: Bearer ...`）
- 是否存在 CORS 限制

如果是 CORS：
- 将 `VITE_GATEWAY_URL=/api`
- 然后 `npm run dev`，通过 dev proxy 访问

### 2) Dashboard 的 Heartbeat 显示 session_status unavailable

这是可选项：如果你的 Gateway 没有提供 `session_status` 工具，不影响其他页面（Sessions/Channels 仍可用）。

### 3) channels_list / sessions_list 返回空

这意味着 Gateway 返回的真实数据为空（本项目不会生成 Mock）。
请检查 Gateway 的实际配置与权限。

