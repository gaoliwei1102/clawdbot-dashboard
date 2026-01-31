# 帧结构与核心方法

## 帧结构（JSON 文本）

### 请求帧（Request）

```json
{ "type": "req", "id": "uuid", "method": "xxx.yyy", "params": { } }
```

### 响应帧（Response）

```json
{ "type": "res", "id": "uuid", "ok": true, "payload": { } }
```

失败时：

```json
{ "type": "res", "id": "uuid", "ok": false, "error": { "code": "…", "message": "…", "details": "…" } }
```

### 事件帧（Event）

```json
{ "type": "event", "event": "tick", "payload": { }, "seq": 1 }
```

连接建立后服务端会先发 `connect.challenge`，客户端需用它完成握手（见 `connect`）。

## 核心方法

### connect

| 方法名 | 参数 | 返回值 | 原项目路径 |
|---|---|---|---|
| `connect` | `ConnectParams`（核心字段：`minProtocol/maxProtocol`、`client:{id,version,platform,mode}`；可选：`auth:{token/password}`、`device:{id,publicKey,signature,signedAt,nonce}`、`role/scopes`） | `HelloOk`（`payload.type="hello-ok"`，含 `protocol/server/features/snapshot/policy`） | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server/ws-connection/message-handler.js` |

```js
ws.send(JSON.stringify({ type:"req", id:crypto.randomUUID(), method:"connect", params:{ minProtocol:3, maxProtocol:3, client:{ id:"my-app", version:"dev", platform:"node", mode:"backend" } } }));
```

### health

| 方法名 | 参数 | 返回值 | 原项目路径 |
|---|---|---|---|
| `health` | `{ probe?: boolean }` | 健康快照对象（`{ ts, ... }`；`probe=true` 会做更“实时”的探测） | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/health.js` |

```js
ws.send(JSON.stringify({ type:"req", id:crypto.randomUUID(), method:"health", params:{ probe:false } }));
```

### poll

| 方法名 | 参数 | 返回值 | 原项目路径 |
|---|---|---|---|
| `poll` | `{ to, question, options[2..12], maxSelections?, durationHours?, channel?, accountId?, idempotencyKey }` | `{ runId, messageId, channel, toJid?, channelId?, conversationId?, pollId? }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/send.js` |

```js
ws.send(JSON.stringify({ type:"req", id:crypto.randomUUID(), method:"poll", params:{ to:"...", question:"Q?", options:["A","B"], idempotencyKey:crypto.randomUUID() } }));
```

### chat.send

| 方法名 | 参数 | 返回值 | 原项目路径 |
|---|---|---|---|
| `chat.send` | `{ sessionKey, message, thinking?, deliver?, attachments?, timeoutMs?, idempotencyKey }` | 立即 ACK：`{ runId:idempotencyKey, status:"started"|"in_flight" }`；后续增量/最终内容走 `event="chat"` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/chat.js` |

```js
ws.send(JSON.stringify({ type:"req", id:crypto.randomUUID(), method:"chat.send", params:{ sessionKey:"main", message:"hi", idempotencyKey:crypto.randomUUID() } }));
```

### chat.history

| 方法名 | 参数 | 返回值 | 原项目路径 |
|---|---|---|---|
| `chat.history` | `{ sessionKey, limit? }` | `{ sessionKey, sessionId?, messages:[], thinkingLevel }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/chat.js` |

```js
ws.send(JSON.stringify({ type:"req", id:crypto.randomUUID(), method:"chat.history", params:{ sessionKey:"main", limit:50 } }));
```

### sessions.list

| 方法名 | 参数 | 返回值 | 原项目路径 |
|---|---|---|---|
| `sessions.list` | `{ limit?, activeMinutes?, includeGlobal?, includeUnknown?, includeDerivedTitles?, includeLastMessage?, label?, spawnedBy?, agentId?, search? }` | `{ ts, path, count, defaults, sessions:[...] }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/sessions.js` |

```js
ws.send(JSON.stringify({ type:"req", id:crypto.randomUUID(), method:"sessions.list", params:{ limit:20 } }));
```

### channels.status

| 方法名 | 参数 | 返回值 | 原项目路径 |
|---|---|---|---|
| `channels.status` | `{ probe?: boolean, timeoutMs?: number }` | `{ ts, channelOrder, channelLabels, channels, channelAccounts, channelDefaultAccountId, ... }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/channels.js` |

```js
ws.send(JSON.stringify({ type:"req", id:crypto.randomUUID(), method:"channels.status", params:{ probe:false } }));
```

