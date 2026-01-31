# Exec 审批（`exec.approval.*`）

当系统需要执行外部命令且策略要求人工确认时，会走“审批”流程：

1) 调用 `exec.approval.request` 创建审批并等待决策（允许/拒绝/超时）。  
2) 由某个客户端（例如控制台 UI）调用 `exec.approval.resolve` 写入决策。  
3) 服务端同时会广播事件 `exec.approval.requested` / `exec.approval.resolved` 便于订阅。

## 方法

### `exec.approval.request`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `exec.approval.request` | `command: string`<br>`id?: string`（可选：自定义审批 id）<br>`cwd?: string\|null`<br>`host?: string\|null`<br>`security?: string\|null`<br>`ask?: string\|null`<br>`agentId?: string\|null`<br>`resolvedPath?: string\|null`<br>`sessionKey?: string\|null`<br>`timeoutMs?: number`（默认约 120000） | `{ id: string, decision: "allow-once"\|"allow-always"\|"deny"\|null, createdAtMs: number, expiresAtMs: number }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/exec-approval.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/exec-approval-manager.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/exec-approvals.js` |

创建一个“待审批”记录并等待决策：

- 如果在 `timeoutMs` 内无人决策，返回 `decision: null`。
- 如果传入 `id` 且该 `id` 已存在未决记录，会返回错误（`approval id already pending`）。

JavaScript 示例（请求审批并处理结果）：

```js
const res = await gatewayClient.request("exec.approval.request", {
  command: "git status",
  cwd: "/workspace/clawdbot-dashboard",
  ask: "是否允许运行该命令？",
  timeoutMs: 60_000,
});

if (res.decision === "allow-once" || res.decision === "allow-always") {
  console.log("approved:", res.decision);
} else if (res.decision === "deny") {
  throw new Error("command denied");
} else {
  throw new Error("approval timeout");
}
```

### `exec.approval.resolve`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `exec.approval.resolve` | `id: string`<br>`decision: "allow-once"\|"allow-always"\|"deny"` | `{ ok: true }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/exec-approval.js` |

对某个审批记录做出决策。若 `id` 不存在或已过期，会返回错误（`unknown approval id`）。

JavaScript 示例（人工/自动决策端调用）：

```js
await gatewayClient.request("exec.approval.resolve", {
  id: approvalId,
  decision: "allow-once",
});
```

## 相关事件（订阅用）

虽然不是“方法”，但在实现 UI 或外部审批器时通常需要订阅：

- `exec.approval.requested`：payload 含 `{ id, request, createdAtMs, expiresAtMs }`
- `exec.approval.resolved`：payload 含 `{ id, decision, resolvedBy?, ts }`

原项目路径：
- `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/exec-approval.js`

