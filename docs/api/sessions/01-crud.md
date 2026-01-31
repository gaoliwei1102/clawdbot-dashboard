# Sessions 方法（CRUD + 工具方法）

本页按方法逐一说明 Gateway Sessions API。每个方法都包含：

- 表格：方法名｜参数｜返回值｜原项目路径
- 简要说明
- 核心方法的 JavaScript 示例

## `sessions.list`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `sessions.list` | `limit?: number`<br>`activeMinutes?: number`<br>`includeGlobal?: boolean`<br>`includeUnknown?: boolean`<br>`includeDerivedTitles?: boolean`<br>`includeLastMessage?: boolean`<br>`label?: string`<br>`spawnedBy?: string`<br>`agentId?: string`<br>`search?: string` | `{ ts: number, path: string, count: number, defaults: {...}, sessions: SessionSummary[] }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/sessions.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/sessions.js` |

用于列出会话（按更新时间倒序）。可通过 `search`、`label`、`agentId`、`spawnedBy` 等过滤。

```js
// 伪代码：gateway.request(method, params) => { ok, result, error }
const res = await gateway.request("sessions.list", {
  limit: 50,
  includeDerivedTitles: true,
  includeLastMessage: true,
});

if (!res.ok) throw new Error(res.error?.message);
console.log(res.result.count, res.result.sessions);
```

## `sessions.preview`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `sessions.preview` | `keys: string[]`（最多取前 64 个）<br>`limit?: number`（默认 12）<br>`maxChars?: number`（默认 240） | `{ ts: number, previews: Array<{ key: string, status: \"ok\"\\|\"empty\"\\|\"missing\"\\|\"error\", items: Array<{ role: string, text: string }> }> }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/sessions.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/sessions.js` |

从 transcript 的尾部读取最近消息，生成轻量预览（避免拉取完整消息历史）。

```js
const res = await gateway.request("sessions.preview", {
  keys: ["global", "agent:main:wechat:group:123"],
  limit: 8,
  maxChars: 200,
});

if (res.ok) {
  for (const p of res.result.previews) {
    console.log(p.key, p.status, p.items);
  }
}
```

## `sessions.resolve`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `sessions.resolve` | 三选一（不可同时提供）：<br>`key?: string`<br>`sessionId?: string`<br>`label?: string`<br>可选过滤：`agentId?: string`、`spawnedBy?: string`、`includeGlobal?: boolean`、`includeUnknown?: boolean` | `{ ok: true, key: string }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/sessions.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/sessions.js` |

用于把“模糊定位条件”（例如 `label`、`sessionId`）解析为唯一的 canonical `key`。当匹配到 0 个或多个会话时会返回错误。

```js
// 通过 label 找到 session key
const res = await gateway.request("sessions.resolve", { label: "我的会话别名" });
if (!res.ok) throw new Error(res.error?.message);
console.log("resolved key =", res.result.key);
```

## `sessions.patch`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `sessions.patch` | `key: string`<br>可选 patch 字段：`label?: string|null`、`thinkingLevel?: string|null`、`verboseLevel?: string|null`、`reasoningLevel?: string|null`、`responseUsage?: \"off\"\\|\"tokens\"\\|\"full\"\\|\"on\"|null`、`elevatedLevel?: string|null`、`execHost?: string|null`、`execSecurity?: string|null`、`execAsk?: string|null`、`execNode?: string|null`、`model?: string|null`、`spawnedBy?: string|null`、`sendPolicy?: \"allow\"\\|\"deny\"|null`、`groupActivation?: \"mention\"\\|\"always\"|null` | `{ ok: true, path: string, key: string, entry: object }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/sessions.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/sessions.js` |

对会话 entry 做部分更新（并返回更新后的 `entry`）。当指定的 `key` 不存在时，`sessions.patch` 会创建一个最小 entry（带 `sessionId` / `updatedAt`）后再应用 patch。

```js
// 设置 label、发送策略、以及更详细的输出
const res = await gateway.request("sessions.patch", {
  key: "global",
  label: "全局会话",
  sendPolicy: "allow",
  verboseLevel: "on",
});

if (!res.ok) throw new Error(res.error?.message);
console.log(res.result.entry);
```

## `sessions.reset`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `sessions.reset` | `key: string` | `{ ok: true, key: string, entry: object }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/sessions.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/sessions.js` |

重置会话：生成新的 `sessionId` 并清零 token 计数，同时保留部分“偏好/配置类”字段（如 thinking/verbose/reasoning、`sendPolicy`、`label` 等，详见字段文档）。

```js
const res = await gateway.request("sessions.reset", { key: "global" });
if (!res.ok) throw new Error(res.error?.message);
console.log("new sessionId =", res.result.entry.sessionId);
```

## `sessions.delete`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `sessions.delete` | `key: string`<br>`deleteTranscript?: boolean`（默认 `true`） | `{ ok: true, key: string, deleted: boolean, archived: string[] }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/sessions.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/sessions.js` |

删除会话 entry，并（默认）将 transcript 文件做归档（best-effort）。主会话（main session）不允许删除。

```js
const res = await gateway.request("sessions.delete", {
  key: "agent:main:wechat:group:123",
  deleteTranscript: true,
});
if (!res.ok) throw new Error(res.error?.message);
console.log(res.result.deleted, res.result.archived);
```

## `sessions.compact`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `sessions.compact` | `key: string`<br>`maxLines?: number`（默认 400） | `{ ok: true, key: string, compacted: boolean, archived?: string, kept?: number, reason?: string }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/sessions.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/sessions.js` |

压缩 transcript：当行数超过 `maxLines` 时，归档原文件并只保留最后 `maxLines` 行；同时会清除 entry 中的 token 计数字段（下次运行会重新统计）。

```js
const res = await gateway.request("sessions.compact", {
  key: "global",
  maxLines: 500,
});
if (!res.ok) throw new Error(res.error?.message);
console.log(res.result);
```

## `sessions.get`（说明：当前协议无独立方法）

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `sessions.get`（未提供） | - | - | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/sessions.js` |

当前 Gateway 协议未提供只读的 `sessions.get`。

- **获取会话列表/展示字段**：用 `sessions.list`（并结合 `search`/`label`/`agentId` 等过滤）。
- **获取并返回完整 entry（注意：会写入/可能创建）**：可用 `sessions.patch`（只提供 `key` 或提供少量字段）拿到 `entry`。

## `sessions.create`（说明：通常由 `sessions.patch` 代替）

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `sessions.create`（未提供） | - | - | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/sessions.js` |

当前 Gateway 协议未提供独立的 `sessions.create`；一般使用 `sessions.patch` 对不存在的 `key` 进行“创建 + 配置”。

```js
// 创建/初始化一个会话 key，并设置 label
const res = await gateway.request("sessions.patch", {
  key: "global",
  label: "全局会话",
});
if (!res.ok) throw new Error(res.error?.message);
console.log(res.result.entry);
```

