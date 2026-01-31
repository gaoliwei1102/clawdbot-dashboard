# Sessions 策略配置

本页描述与会话相关的“策略/覆盖”能力，主要包括：

- `send-policy`：是否允许对外发送（allow/deny）
- `model-overrides`：会话级模型选择覆盖（provider/model）
- `level-overrides`：会话级行为/输出等级覆盖（thinking/verbose/reasoning/usage/elevated 等）

## send-policy（发送策略）

**目标**：决定“某个会话是否允许发送消息”。

- 会话 entry 若显式设置了 `sendPolicy`（例如通过 `sessions.patch`），则该值优先生效。
- 否则使用全局配置 `cfg.session.sendPolicy`（规则匹配：`channel` / `chatType` / `keyPrefix`）。
- 规则中一旦命中 `action: "deny"` 会立即拒绝；如果命中过至少一条允许规则且没有 deny，则允许；否则走 `default`（默认允许）。

参考实现：

- `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/sessions/send-policy.js`

示例（会话级覆盖）：

```js
// 禁止该会话发送（只影响该 sessionKey）
await gateway.request("sessions.patch", {
  key: "agent:main:wechat:group:123",
  sendPolicy: "deny",
});
```

## model-overrides（模型覆盖）

**目标**：在会话维度指定“本会话后续使用哪个 provider/model”（而不是只依赖全局默认模型）。

在 Gateway 中通过 `sessions.patch` 的 `model` 字段触发解析（需要网关侧可用的 model catalog）：

- `model: string`：设置/切换模型（具体可接受的写法取决于 model catalog 与解析逻辑）
- `model: null`：恢复到默认模型（清除 override）

实现涉及：

- `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/sessions/model-overrides.js`

注意事项：

- 网关在解析 `model` 时依赖 model catalog；若不可用，会返回 `UNAVAILABLE: "model catalog unavailable"`。
- 会话实际“最后一次跑的模型”通常记录在 `entry.modelProvider` / `entry.model`；而覆盖通常存储在 `entry.providerOverride` / `entry.modelOverride`（两者含义不同）。

示例（设置模型）：

```js
await gateway.request("sessions.patch", {
  key: "global",
  // 示例值：实际写法以你的 model catalog 为准
  model: "openai:gpt-4o-mini",
});
```

## level-overrides（等级/行为覆盖）

**目标**：对单个会话设置“输出风格/思考方式/展示细节”等。

在 Gateway 中统一通过 `sessions.patch` 设置/清除（`null` 表示清除字段，恢复默认行为）：

- `thinkingLevel`：思考等级（可用值与 provider/model 能力相关；例如 `xhigh` 仅部分模型支持）
- `verboseLevel`：是否更详细输出（`"on"` / `"off"`，或 `null` 清除）
- `reasoningLevel`：推理输出策略（`"on"` / `"off"` / `"stream"`，或 `null` 清除）
- `responseUsage`：usage 展示（`"off"` / `"tokens"` / `"full"`，或 `null` 清除；历史兼容 `"on"`）
- `elevatedLevel`：能力提升/权限提升（`"on"` / `"off"` / `"ask"` / `"full"`，或 `null` 清除）

参考实现（其中 `verboseLevel` 的解析/应用在此文件）：

- `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/sessions/level-overrides.js`

示例（更详细输出 + 显示 token）：

```js
await gateway.request("sessions.patch", {
  key: "global",
  verboseLevel: "on",
  responseUsage: "tokens",
});
```

