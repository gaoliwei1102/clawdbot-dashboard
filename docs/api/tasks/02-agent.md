# Agent 调用（`agent` / `agent.wait` / `agents.list`）

本节描述通过网关调用 agent 运行、等待运行结束，以及列出可用 agent 的方法。

## 方法

### agent.invoke（协议方法名：`agent`）

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `agent` | `AgentParams`：<br>`message: string`<br>`agentId?: string`<br>`to?/replyTo?: string`<br>`sessionId?/sessionKey?: string`<br>`deliver?: boolean`<br>`channel?/replyChannel?: string`<br>`accountId?/replyAccountId?: string`<br>`threadId?: string`<br>`attachments?: any[]`<br>`thinking?: string`<br>`timeout?: number`<br>`lane?: string`<br>`extraSystemPrompt?: string`<br>`groupId?/groupChannel?/groupSpace?: string`<br>`label?: string`<br>`spawnedBy?: string`<br>`idempotencyKey: string` | **第一次响应（立即）**：`{ runId: string, status: "accepted", acceptedAt: number }`<br>**随后可能追加第二次响应（同 request id）**：<br>`{ runId: string, status: "ok", summary: "completed", result: any }` 或<br>`{ runId: string, status: "error", summary: string }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/agent.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/agent.js` |

发起一次 agent 运行。该方法是**异步**的：服务端通常会先立即返回 `accepted`（并给出 `runId`），后台继续执行；部分客户端会收到第二次 `res`（同 request id）作为最终结果。

`idempotencyKey` 用于去重：同一个 key 重试时，服务端会复用缓存的结果，避免重复触发运行。

JavaScript 示例（发起运行 + 使用 `agent.wait` 等待最终状态）：

```js
import { randomUUID } from "node:crypto";

const runId = randomUUID();

// 1) 发起一次运行（通常立即返回 accepted）
const accepted = await gatewayClient.request("agent", {
  idempotencyKey: runId,
  message: "请用三句话总结今天的任务进度。",
  // agentId: "default", // 可选：指定 agent
  deliver: false, // 可选：是否尝试投递到外部 channel
});

console.log(accepted); // { runId, status: "accepted", acceptedAt: ... }

// 2) 等待（长任务建议循环 wait）
const final = await gatewayClient.request("agent.wait", { runId, timeoutMs: 30_000 });
console.log(final);
```

### `agent.wait`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `agent.wait` | `runId: string`<br>`timeoutMs?: number`（默认约 30000） | 超时：`{ runId, status: "timeout" }`<br>完成：`{ runId, status: "ok"\|"error", startedAt?: number, endedAt?: number, error?: string }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/agent.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/agent-job.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/agent.js` |

等待某个 `runId` 的生命周期结束事件（`ok/error`），最多等待 `timeoutMs`；超时返回 `status: "timeout"`。

### `agents.list`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `agents.list` | `{}` | `{ defaultId: string, mainKey: string, scope: "per-sender"\|"global", agents: Array<{ id: string, name?: string, identity?: {...} }> }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/agents.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/agents-models-skills.js` |

列出当前网关可用的 agent 摘要信息（含默认 agent、scope 等）。

JavaScript 示例（渲染一个选择列表）：

```js
const res = await gatewayClient.request("agents.list", {});
console.log("default:", res.defaultId);
console.table(res.agents.map((a) => ({ id: a.id, name: a.name ?? a.identity?.name })));
```

