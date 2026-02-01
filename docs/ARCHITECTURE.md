# Architecture Notes

## UI Direction

“Operator console” 风格：深色底、强边界、少量单一强调色（emerald），避免渐变与浮夸动效；信息密度偏高，强调可读性与可扫描性。

## Data Flow

所有数据通过 `src/lib/api.ts` 的 `invokeTool()` 调用 Gateway：
- URL：`POST ${VITE_GATEWAY_URL}/tools/invoke`
- Authorization：`Authorization: Bearer <token-or-password>`
- Body：`{ tool, args, sessionKey, action? }`

### /tools/invoke HTTP API（来自 clawdbot 源码）

源代码位置（clawdbot npm 包）：
- `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/tools-invoke-http.js`

#### Request

```ts
type ToolsInvokeRequest = {
  tool: string; // 工具名（精确匹配），例如 "sessions_list"
  args?: Record<string, unknown>; // 工具参数对象（可选，默认 {})
  sessionKey?: string; // 可选；"main" 会被 gateway 映射到真实 main session key
  action?: string; // 可选；如果工具 schema 支持 action 且 args.action 未提供，会自动合并进 args
};
```

可选 Header（用于 tool policy / 路由继承，源码中会读取）：
- `x-clawdbot-message-channel`: string（例如 "whatsapp" / "discord" / "telegram" / "slack"）
- `x-clawdbot-account-id`: string

#### Response

成功：

```ts
type ToolsInvokeSuccess = { ok: true; result: unknown };
```

失败（示例，状态码依具体错误而定）：

```ts
type ToolsInvokeError =
  | { error: { type: "unauthorized"; message: "Unauthorized" } } // 401
  | { error: { type: "invalid_request_error"; message: string } } // 400
  | { ok: false; error: { type: "not_found"; message: string } } // 404 (Tool not available)
  | { ok: false; error: { type: "tool_error"; message: string } }; // 400 (tool execute 抛错)
```

#### Tool Result（关键：很多工具把业务数据放在 result.details）

clawdbot 内置工具经常返回 “tool result” 结构（而不是直接返回 payload）：

```ts
type ToolResult<TDetails = unknown> = {
  content?: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
  >;
  details?: TDetails; // 真实业务数据通常在这里
} & Record<string, unknown>;
```

例如 `sessions_list` 的成功返回，常见形态为：

```json
{
  "ok": true,
  "result": {
    "content": [{ "type": "text", "text": "{\\n  \\\"count\\\": 1, ... }" }],
    "details": { "count": 1, "sessions": [{ "key": "main", "totalTokens": 123 }] }
  }
}
```

因此前端默认会优先解包 `result.details`（见 `src/lib/api.ts`），否则会出现 `sessions_list`/`session_status` 等页面数据为空。

Hook 层：
- `src/hooks/useSessions.ts` -> `sessions_list`
- `src/hooks/useChannels.ts` -> `channels_list`
- `src/hooks/useDashboard.ts` -> `sessions_list` + `channels_list` + (可选) `session_status`

页面层：
- `src/components/pages/Dashboard.tsx`
- `src/components/pages/Sessions.tsx`
- `src/components/pages/Channels.tsx`

## Error/Loading Policy (No Mock)

- 任何请求失败：就地显示错误信息 + “重试”按钮（不使用 mock fallback）
- Loading：使用结构化 skeleton（静态，无动画）
- 空数据：给出明确下一步（检查 Gateway 配置/权限）

## Refresh Policy

Header 的 “刷新” 按钮触发全局 refresh tick（`src/lib/refresh.tsx`），各页面监听 tick 并调用自己的 `refetch()`。

## Tool Availability Note

- `sessions_list` / `session_status` 属于 clawdbot core tools（见 `dist/agents/tool-display.json`）。
- `channels_list` **不在 clawdbot core tools 中**：若你的 Gateway 没有安装/启用提供该工具的 plugin，则调用会返回 404（Tool not available）。
