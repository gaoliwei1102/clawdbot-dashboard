# 进程 / 命令队列（process）

本节描述 clawdbot 内部的“进程执行与并发控制”实现（不属于网关对外方法），用于：

- 以 **lane（车道）** 为粒度对命令执行进行排队与限流（默认每个 lane 串行）。
- 以统一方式执行外部命令（`execFile` / `spawn`），支持超时、stdout/stderr 收集等。
- 在出现某些平台/环境问题时，对 `spawn` 做“兜底重试”。
- 将宿主进程收到的 signal 转发给子进程，便于优雅退出。

## 命令队列（`process/command-queue.js`）

队列是一个进程内全局 `Map<lane, state>`；每个 lane 维护：

- `queue`: 等待执行的任务队列
- `active`: 当前执行中的任务数
- `maxConcurrent`: 并发上限（默认 1）

### `setCommandLaneConcurrency`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `setCommandLaneConcurrency` | `lane: string`<br>`maxConcurrent: number` | `void` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/command-queue.js` |

设置某个 lane 的并发上限（最小为 1），并触发 drain。

### `enqueueCommandInLane`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `enqueueCommandInLane` | `lane: string`<br>`task: () => Promise<T> \| T`<br>`opts?: { warnAfterMs?: number, onWait?: (waitedMs:number, queueAhead:number) => void }` | `Promise<T>` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/command-queue.js` |

将一个任务放入指定 lane 队列并返回其结果。若排队等待超过 `warnAfterMs`（默认约 2000ms），会触发告警日志/回调。

JavaScript 示例（同一 lane 串行执行两个任务）：

```js
import { enqueueCommandInLane } from "clawdbot/dist/process/command-queue.js";

await enqueueCommandInLane("git", async () => {
  // do something...
});

await enqueueCommandInLane("git", async () => {
  // 这里会等待上一个任务完成后再执行
});
```

### `enqueueCommand`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `enqueueCommand` | `task: () => Promise<T> \| T`<br>`opts?: { warnAfterMs?: number, onWait?: ... }` | `Promise<T>` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/command-queue.js` |

`enqueueCommandInLane("main", ...)` 的简写。

### `getQueueSize`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `getQueueSize` | `lane?: string`（默认 `"main"`） | `number`（`active + queued`） | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/command-queue.js` |

返回某个 lane 的总占用（执行中 + 排队中）。

### `getTotalQueueSize`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `getTotalQueueSize` | 无 | `number`（所有 lane 的 `active + queued` 求和） | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/command-queue.js` |

### `clearCommandLane`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `clearCommandLane` | `lane?: string`（默认 `"main"`） | `number`（移除的排队任务数，不含 active） | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/command-queue.js` |

清空某个 lane 的等待队列（不会中断正在执行的任务）。

## 命令执行（`process/exec.js`）

### `runExec`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `runExec` | `command: string`<br>`args: string[]`<br>`opts?: number \| { timeoutMs: number, maxBuffer?: number }`（默认超时约 10000ms） | `Promise<{ stdout: string, stderr: string }>`（失败会 throw） | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/exec.js` |

基于 `execFile` 的简单封装，适合短输出命令；支持超时与（可选）最大缓冲区。

### `runCommandWithTimeout`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `runCommandWithTimeout` | `argv: string[]`（含可执行文件与参数）<br>`optionsOrTimeout: number \| { timeoutMs: number, cwd?: string, input?: string, env?: Record<string,string>, windowsVerbatimArguments?: boolean }` | `Promise<{ stdout: string, stderr: string, code: number\|null, signal: string\|null, killed: boolean }>` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/exec.js`<br>`/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/spawn-utils.js` |

基于 `spawn` 的封装：支持传入 stdin（`input`）、合并 env、并在超时后尝试 `SIGKILL` 结束子进程。

## Spawn 工具（`process/spawn-utils.js`）

### `resolveCommandStdio`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `resolveCommandStdio` | `{ hasInput: boolean, preferInherit: boolean }` | `[stdin, "pipe", "pipe"]`（用于 `spawn` 的 stdio） | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/spawn-utils.js` |

决定 stdin 是 `pipe` 还是 `inherit`；stdout/stderr 始终为 `pipe`。

### `formatSpawnError`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `formatSpawnError` | `err: unknown` | `string` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/spawn-utils.js` |

将 `spawn` 错误格式化为更可读的字符串（尽量拼上 `code/syscall/errno` 等）。

### `spawnWithFallback`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `spawnWithFallback` | `{ argv: string[], options: SpawnOptions, fallbacks?: Array<{ label?: string, options: Partial<SpawnOptions> }>, retryCodes?: string[], spawnImpl?: Function, onFallback?: (err, fallback) => void }` | `Promise<{ child: ChildProcess, usedFallback: boolean, fallbackLabel?: string }>` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/spawn-utils.js` |

当 `spawn` 因特定错误码（默认 `EBADF`）失败时，按 fallbacks 依次重试，直到成功或判定不可重试。

## 子进程 signal 转发（`process/child-process-bridge.js`）

### `attachChildProcessBridge`

| 方法名 | 参数 | 返回值 | 原项目路径 |
| --- | --- | --- | --- |
| `attachChildProcessBridge` | `child: ChildProcess`<br>`opts?: { signals?: string[], onSignal?: (signal: string) => void }` | `{ detach: () => void }` | `/root/.nvm/versions/node/v24.13.0/lib/node_modules/clawdbot/dist/process/child-process-bridge.js` |

在宿主进程收到常见信号（Linux/macOS 默认 `SIGTERM/SIGINT/SIGHUP/SIGQUIT`；Windows 默认 `SIGTERM/SIGINT/SIGBREAK`）时，尝试将该信号转发给子进程，并在子进程退出后自动移除监听器。

