# Gateway WebSocket API - 快速入门

## WS 连接地址

- 默认：`ws://127.0.0.1:18789`
- 若网关启用 TLS/反向代理：使用 `wss://<host>:<port>`（端口/域名以实际部署为准）

## 协议版本

- 当前实现：`PROTOCOL_VERSION = 3`
- 客户端 `connect` 时通过 `minProtocol/maxProtocol` 与服务端做版本协商；若不兼容将被关闭连接。

## 连接流程（最简）

1. 建立 WebSocket 连接（文本帧 JSON）。
2. 服务端会先推送一条事件帧：`event=connect.challenge`（带 `nonce`）。
3. 客户端**第一条请求**必须是 `connect`（把 `nonce` 带入设备签名场景；只用 token/password 时也可忽略设备字段）。
4. 收到响应帧 `ok=true`，`payload.type="hello-ok"` 后，连接进入可用状态。
5. 后续按需调用核心方法；同时监听服务端事件（如 `tick` / `chat` 等）。

