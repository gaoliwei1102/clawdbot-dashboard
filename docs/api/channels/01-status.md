# channels.status

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `channels.status` | `ChannelsStatusParamsSchema` | `ChannelsStatusResultSchema` | 实现：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/channels.js`<br/>Schema：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/channels.js` |

获取所有通道插件的状态信息。网关会：

- 读取配置（`loadConfig()`）
- 读取当前运行时快照（`context.getRuntimeSnapshot()`）
- 枚举已注册的通道插件（`listChannelPlugins()`）
- 对每个通道插件的每个账号生成一个 `ChannelAccountSnapshot`
- 汇总为一个统一 payload 返回给客户端

## 参数（params）

参数结构见 `ChannelsStatusParamsSchema`：

- `probe?: boolean`
  - `true`：对每个“启用且已配置”的账号执行（可选）探测/审计钩子：
    - `plugin.status.probeAccount({ account, timeoutMs, cfg })`
    - `plugin.status.auditAccount({ account, timeoutMs, cfg, probe })`
  - `false / undefined`：不做探测，只返回静态/运行时信息。
- `timeoutMs?: number`
  - 当 `probe=true` 时用于 `probeAccount/auditAccount` 的超时参数。
  - 网关内部会把它下限钳制到 `>= 1000ms`；默认值为 `10000ms`。

## 返回值（payload）

返回结构见 `ChannelsStatusResultSchema`，核心字段如下：

- `ts: number`：服务端生成时间戳（毫秒）。
- `channelOrder: string[]`：UI 推荐的通道展示顺序（来自插件 meta）。
- `channelLabels: Record<channelId, label>`：通道短名称映射（用于 UI）。
- `channelDetailLabels?: Record<channelId, detailLabel>`：通道详细名称映射。
- `channelSystemImages?: Record<channelId, systemImage>`：通道系统图标标识（可选）。
- `channelMeta?: Array<{ id, label, detailLabel, systemImage? }>`：通道 UI 元信息数组（可选）。
- `channels: Record<channelId, unknown>`：每个通道的“汇总状态”对象。
  - 若插件实现了 `plugin.status.buildChannelSummary(...)`，这里的结构由插件决定（网关不强约束）。
  - 否则网关至少给出 `{ configured: boolean }`（取默认账号快照里的 `configured`）。
- `channelAccounts: Record<channelId, ChannelAccountSnapshot[]>`
  - 每个通道是一组账号快照（账号列表来自 `plugin.config.listAccountIds(cfg)`）。
  - `ChannelAccountSnapshot` 是“可扩展结构”（Schema 允许 additionalProperties），插件可以附加自定义字段（例如 `lastDisconnect`、`authAgeMs` 等）。
- `channelDefaultAccountId: Record<channelId, accountId>`：每个通道的默认账号 id。

### ChannelAccountSnapshot（常见字段）

Schema 中已定义的常见字段（均为可选，除 `accountId` 外）：

- `accountId: string`
- `name?: string`
- `enabled?: boolean`
- `configured?: boolean`
- `linked?: boolean`
- `running?: boolean`
- `connected?: boolean`
- `reconnectAttempts?: number`
- `lastConnectedAt?: number`
- `lastError?: string`
- `lastStartAt?: number`
- `lastStopAt?: number`
- `lastInboundAt?: number`
- `lastOutboundAt?: number`
- `lastProbeAt?: number`（仅当 `probe=true` 且实际执行了探测时，网关会补充该字段）
- `probe?: unknown` / `audit?: unknown`：插件探测/审计结果（结构由插件定义）

## JavaScript 示例

示例演示：

1) 先 `connect` 完成握手（协议版本当前为 `3`）  
2) 再调用 `channels.status`

```js
import { randomUUID } from "node:crypto";

const wsUrl = process.env.CLAWDBOT_GATEWAY_URL; // 例如 ws://127.0.0.1:3001
const ws = new WebSocket(wsUrl);

function sendReq(method, params) {
  const id = randomUUID();
  ws.send(JSON.stringify({ type: "req", id, method, params }));
  return id;
}

ws.addEventListener("open", () => {
  // 1) connect（握手）
  sendReq("connect", {
    minProtocol: 3,
    maxProtocol: 3,
    client: {
      id: "gateway-client",
      version: "docs-example",
      platform: process.platform,
      mode: "ui",
    },
    // 如果网关开启了 token/password，这里需要带上 auth
    // auth: { token: process.env.CLAWDBOT_GATEWAY_TOKEN },
  });
});

ws.addEventListener("message", (ev) => {
  const frame = JSON.parse(String(ev.data));

  // connect 的响应会返回 hello-ok（在 res.payload 中）
  if (frame.type === "res" && frame.ok && frame.payload?.type === "hello-ok") {
    // 2) 调用 channels.status
    sendReq("channels.status", { probe: true, timeoutMs: 10_000 });
    return;
  }

  if (frame.type === "res" && frame.ok && frame.payload?.channels && frame.payload?.channelAccounts) {
    const payload = frame.payload;
    console.log("channels:", Object.keys(payload.channels));
    console.log("whatsapp accounts:", payload.channelAccounts.whatsapp);
  }

  if (frame.type === "res" && !frame.ok) {
    console.error("gateway error:", frame.error);
  }
});
```

