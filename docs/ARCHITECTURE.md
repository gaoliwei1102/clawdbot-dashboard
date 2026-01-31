# Architecture Notes

## UI Direction

“Operator console” 风格：深色底、强边界、少量单一强调色（emerald），避免渐变与浮夸动效；信息密度偏高，强调可读性与可扫描性。

## Data Flow

所有数据通过 `src/lib/api.ts` 的 `invokeTool()` 调用 Gateway：
- URL：`${VITE_GATEWAY_URL}/tools/invoke`
- Authorization：`Bearer ${VITE_GATEWAY_TOKEN}`
- Body：`{ tool, args, sessionKey }`

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

