# web.login.start / web.login.wait（WhatsApp 示例）

`web.login.*` 是一组“通用网页登录”网关方法。网关会在已注册的通道插件中，寻找第一个声明了对应方法的提供方：

- `plugin.gatewayMethods` 包含 `web.login.start` / `web.login.wait`
- 并实现 `plugin.gateway.loginWithQrStart()` / `plugin.gateway.loginWithQrWait()`

当前典型提供方是 WhatsApp 通道插件（`whatsappPlugin.gatewayMethods = ["web.login.start", "web.login.wait"]`）。

## web.login.start

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `web.login.start` | `WebLoginStartParamsSchema` | `({ message, qrDataUrl? })` | 实现：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/web.js`<br/>Schema：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/channels.js`<br/>返回逻辑（WhatsApp）：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/web/login-qr.js` |

简要说明：

- 网关会先 `stopChannel(provider.id, accountId)`，避免运行时占用资源影响登录流程。
- 成功后通常返回一个二维码数据 URL：`qrDataUrl: "data:image/png;base64,..."`，可直接在网页中用 `<img src="...">` 展示。
- 如果该账号已绑定且未 `force`，可能只返回提示 `message`（不生成新二维码）。

参数要点（`WebLoginStartParamsSchema`）：

- `force?: boolean`：强制生成新二维码（覆盖“已绑定”场景）。
- `timeoutMs?: number`：等待二维码生成的超时（WhatsApp 内部默认约 30s，且会有最小下限）。
- `verbose?: boolean`：更详细日志。
- `accountId?: string`：多账号时指定账号（不传则使用插件默认账号）。

## web.login.wait

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `web.login.wait` | `WebLoginWaitParamsSchema` | `({ connected, message })` | 实现：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/web.js`<br/>Schema：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/channels.js`<br/>返回逻辑（WhatsApp）：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/web/login-qr.js` |

简要说明：

- 等待用户完成扫码/绑定。
- 当返回 `connected: true` 时，网关会自动 `startChannel(provider.id, accountId)` 启动对应通道运行时（如果插件实现了 `gateway.startAccount`）。
- 如果没有进行中的登录（未调用过 `web.login.start` 或已过期），会返回 `connected: false` 并给出提示 `message`。

参数要点（`WebLoginWaitParamsSchema`）：

- `timeoutMs?: number`：本次等待的超时；超时后返回 `connected:false`（不抛错）。
- `accountId?: string`：等待哪个账号的登录进度。

## WhatsApp 操作流程（建议）

1. 调用 `web.login.start` 获取 `qrDataUrl`
2. 在 WhatsApp 手机端打开：Settings → Linked Devices → Link a device，扫描二维码
3. 轮询调用 `web.login.wait`（或用户确认扫码后再调用一次）
4. 当 `connected: true` 返回后，WhatsApp 通道应进入可用状态（可用 `channels.status` 验证）

## JavaScript 示例（扫码登录 + 等待）

```js
import { randomUUID } from "node:crypto";

const wsUrl = process.env.CLAWDBOT_GATEWAY_URL;
const ws = new WebSocket(wsUrl);

function sendReq(method, params) {
  const id = randomUUID();
  ws.send(JSON.stringify({ type: "req", id, method, params }));
  return id;
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

ws.addEventListener("open", () => {
  sendReq("connect", {
    minProtocol: 3,
    maxProtocol: 3,
    client: {
      id: "gateway-client",
      version: "docs-example",
      platform: process.platform,
      mode: "ui",
    },
  });
});

ws.addEventListener("message", async (ev) => {
  const frame = JSON.parse(String(ev.data));

  if (frame.type === "res" && frame.ok && frame.payload?.type === "hello-ok") {
    // 1) 请求二维码
    sendReq("web.login.start", { force: false, timeoutMs: 30_000, verbose: false });
    return;
  }

  if (frame.type === "res" && frame.ok && frame.payload?.qrDataUrl) {
    const { message, qrDataUrl } = frame.payload;
    console.log(message);
    console.log("qrDataUrl:", qrDataUrl.slice(0, 64) + "…");

    // 2) 轮询等待扫码结果
    while (true) {
      sendReq("web.login.wait", { timeoutMs: 10_000 });
      await sleep(1500);
      // 这里简单用“消息回调”接结果；也可以把 req/res 关联起来做成 Promise。
      break;
    }
    return;
  }

  if (frame.type === "res" && frame.ok && typeof frame.payload?.connected === "boolean") {
    console.log("connected:", frame.payload.connected, "message:", frame.payload.message);
    if (frame.payload.connected) {
      // 可选：登录后立即拉一次 status 验证
      sendReq("channels.status", { probe: false });
    }
    return;
  }

  if (frame.type === "res" && !frame.ok) {
    console.error("gateway error:", frame.error);
  }
});
```

