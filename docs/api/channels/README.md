# Channels（通道）API

Channels（通道）用于把 Clawdbot 接入到不同的消息平台（如 WhatsApp / Telegram / Slack / Discord 等）。每个通道由一个 **通道插件（channel plugin）** 提供能力：读取配置、管理多账号、启动/停止运行时、上报状态、（可选）提供网页登录/登出等网关方法。

本目录文档聚焦两件事：

- 网关侧与通道相关的方法（`channels.*`、`web.login.*`）
- 通道插件在运行时需要提供的接口形状（如何被网关识别、如何参与 `channels.status`）

## 网关调用约定（简述）

Clawdbot Gateway 采用 WebSocket 帧协议：

- 请求帧：`{ type: "req", id, method, params }`
- 响应帧：`{ type: "res", id, ok, payload?, error? }`

在发送任何业务方法前，需要先发送一次 `connect`（协议版本当前为 `3`）。协议帧结构定义在：

- `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/frames.js`
- `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/protocol-schemas.js`

## 方法一览

### channels.status

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `channels.status` | `ChannelsStatusParamsSchema` | `ChannelsStatusResultSchema` | 实现：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/channels.js`<br/>Schema：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/channels.js` |

用于获取所有已注册通道插件的状态概览 + 每个通道的账号快照列表。详见 `docs/api/channels/01-status.md`。

### channels.logout

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `channels.logout` | `ChannelsLogoutParamsSchema` | `({ channel, accountId, cleared, ... })` | 实现：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/channels.js`<br/>Schema：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/channels.js` |

用于登出某个通道账号（前提：对应通道插件实现了 `plugin.gateway.logoutAccount()`）。注意：返回值结构由插件决定，网关会补充 `cleared` 并尽量推断 `loggedOut`。

### web.login.start

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `web.login.start` | `WebLoginStartParamsSchema` | `({ message, qrDataUrl? })` | 实现：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/web.js`<br/>Schema：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/channels.js` |

启动“网页扫码登录”流程（当前主要用于 WhatsApp Web）。详见 `docs/api/channels/02-login.md`。

### web.login.wait

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `web.login.wait` | `WebLoginWaitParamsSchema` | `({ connected, message })` | 实现：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/server-methods/web.js`<br/>Schema：`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/gateway/protocol/schema/channels.js` |

等待扫码登录结果；当 `connected: true` 时，网关会自动 `startChannel()` 启动对应通道运行时（如果插件支持）。

## 通道插件接口

通道插件是一个 JS 对象（或模块导出），通过插件系统注册到运行时 registry，最终被 `listChannelPlugins()` 读取并参与 `channels.status`、通道运行时管理等流程。详见 `docs/api/channels/03-plugin-interface.md`。

