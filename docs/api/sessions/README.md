# Sessions（会话）文档

本目录描述 `clawdbot` Gateway 协议中的 Sessions（会话）相关能力：列出会话、按条件解析会话 key、查看会话预览、修改会话配置、重置/删除会话、压缩会话转录（transcript）。

> 说明：Sessions API 以“方法名”（如 `sessions.list`）的形式提供，通常通过 WebSocket RPC 调用；返回值中出现的 `path` 为网关进程所在机器上的会话存储文件路径。

## 核心概念

- **sessionKey**：会话的逻辑键（例如 `global`、`unknown`、或 `agent:{agentId}:{...}`）。它用于定位会话条目（entry）以及归属的会话存储文件（store）。
- **sessionId**：会话的物理 ID（UUID）。它通常用于定位会话 transcript（`.jsonl`）文件名及其内容。
- **会话条目（entry）**：存储在 sessions store（通常是 `sessions.json`）中的记录，包含会话状态、路由信息、模型/策略覆盖等字段。
- **transcript**：会话消息记录文件（JSONL）。`sessions.preview` / `sessions.compact` 等方法会读取/改写该文件。

## 目录导航

- `01-crud.md`：会话相关方法（list/get/create/delete/patch/reset/preview/resolve/compact）
- `02-strategy.md`：策略配置（send-policy / model-overrides / level-overrides）
- `03-fields.md`：字段说明（列表返回字段、entry 常见字段、preview 结构等）

