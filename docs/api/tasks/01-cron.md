# Cron 任务（`cron.*`）

本节描述网关方法 `cron.*`（列出/新增/更新/删除/手动运行/状态/运行记录）。

## 数据结构（核心字段）

### CronSchedule（`schedule`）

- `{"kind":"at","atMs": number}`：在指定时间点运行（毫秒时间戳）。
- `{"kind":"every","everyMs": number,"anchorMs"?: number}`：按固定间隔运行，可选锚点。
- `{"kind":"cron","expr": string,"tz"?: string}`：cron 表达式（可选时区）。

原项目路径：
- `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/cron.js`

### CronPayload（`payload`）

- `{"kind":"systemEvent","text": string}`：触发一条系统事件文本。
- `{"kind":"agentTurn","message": string, ...}`：触发一次 agent 对话回合。
  - 可选：`model` / `thinking` / `timeoutSeconds` / `deliver` / `channel` / `to` / `bestEffortDeliver`

原项目路径：
- `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/cron.js`

### CronJob（返回对象）

常见字段：`id`、`name`、`enabled`、`schedule`、`payload`、`sessionTarget`（`main|isolated`）、`wakeMode`（`next-heartbeat|now`）、`state`（含 `nextRunAtMs`/`lastRunAtMs` 等）。

原项目路径：
- `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/cron.js`

## 方法

### `cron.list`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `cron.list` | `includeDisabled?: boolean` | `{ jobs: CronJob[] }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/cron.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/cron.js` |

列出任务。默认不返回禁用任务；传 `includeDisabled: true` 可包含禁用任务。

JavaScript 示例（列出全部任务）：

```js
// 假设 gatewayClient.request(method, params) 会发起一次网关请求并返回 payload
const { jobs } = await gatewayClient.request("cron.list", { includeDisabled: true });
console.log(jobs.map((j) => ({ id: j.id, name: j.name, next: j.state?.nextRunAtMs })));
```

### `cron.status`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `cron.status` | `{}` | `{ enabled: boolean, storePath: string, jobs: number, nextWakeAtMs: number \| null }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/cron.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/cron/service/ops.js` |

返回 cron 服务状态（是否启用、任务数量、下一次唤醒时间等）。

### `cron.add`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `cron.add` | `CronAddParams`：<br>`name: string`<br>`agentId?: string \| null`<br>`enabled?: boolean`<br>`deleteAfterRun?: boolean`<br>`schedule: CronSchedule`<br>`sessionTarget: "main"\|"isolated"`<br>`wakeMode: "next-heartbeat"\|"now"`<br>`payload: CronPayload`<br>`description?: string`<br>`isolation?: { postToMainPrefix?, postToMainMode?, postToMainMaxChars? }` | `CronJob` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/cron.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/cron.js` |

创建一个 cron 任务并返回完整 `CronJob`。

JavaScript 示例（每小时让 agent 执行一次，并尝试投递到指定 channel/to）：

```js
const job = await gatewayClient.request("cron.add", {
  name: "hourly-report",
  enabled: true,
  schedule: { kind: "every", everyMs: 60 * 60 * 1000 },
  sessionTarget: "main",
  wakeMode: "now",
  payload: {
    kind: "agentTurn",
    message: "请输出一份简短的每小时状态报告。",
    deliver: true,
    channel: "last", // 或显式 channel 名称
    to: "some-target-id", // 视具体 channel 而定
    timeoutSeconds: 60,
  },
});

console.log("created", job.id);
```

### `cron.update`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `cron.update` | `{ id: string, patch: CronJobPatch }` 或 `{ jobId: string, patch: CronJobPatch }` | `CronJob` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/cron.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/cron.js` |

按 `id/jobId` 更新任务。`patch` 支持部分字段更新（例如 `enabled`、`schedule`、`payload` 等）。

JavaScript 示例（禁用任务）：

```js
const updated = await gatewayClient.request("cron.update", {
  id: jobId,
  patch: { enabled: false },
});
console.log(updated.enabled); // false
```

### `cron.remove`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `cron.remove` | `{ id: string }` 或 `{ jobId: string }` | `{ ok: boolean, removed: boolean }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/cron.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/cron/service/ops.js` |

删除任务。`removed` 表示是否真的删除到了（不存在时可能为 `false`）。

### `cron.run`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `cron.run` | `{ id: string, mode?: "due"\|"force" }` 或 `{ jobId: string, mode?: "due"\|"force" }` | `{ ok: true, ran: boolean, reason?: "not-due" }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/cron.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/cron/service/ops.js` |

手动触发一次运行：

- `mode: "due"`（默认）：只有到期（due）才会执行，否则返回 `ran: false, reason: "not-due"`。
- `mode: "force"`：忽略 due 判断，强制执行。

JavaScript 示例（强制运行一次）：

```js
const res = await gatewayClient.request("cron.run", { id: jobId, mode: "force" });
console.log(res); // { ok: true, ran: true }
```

### `cron.runs`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `cron.runs` | `{ id: string, limit?: number }` 或 `{ jobId: string, limit?: number }` | `{ entries: CronRunLogEntry[] }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/cron.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/cron/run-log.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/cron.js` |

读取任务运行记录（JSONL 日志，服务端会从文件尾部向前读取并按时间升序返回）。`limit` 最大 5000，默认约 200。

JavaScript 示例（读取最近 50 条）：

```js
const { entries } = await gatewayClient.request("cron.runs", { id: jobId, limit: 50 });
for (const e of entries) {
  console.log(new Date(e.ts).toISOString(), e.status, e.summary ?? "");
}
```

