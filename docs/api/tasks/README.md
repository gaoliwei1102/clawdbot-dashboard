# Tasks（任务系统）概述

本目录文档描述 clawdbot 网关（gateway）中的“任务系统”相关能力，主要由以下部分组成：

- **Cron 任务（`cron.*`）**：创建/更新/运行定时任务（一次性、固定间隔、或 cron 表达式）。任务的 **payload** 可以是系统事件（`systemEvent`）或一次 agent 对话（`agentTurn`）。
- **Agent 调用（`agent` / `agent.wait` / `agents.list`）**：向某个 agent 发起一次运行（异步），并可等待运行结束或列出可用 agent。
- **Exec 审批（`exec.approval.*`）**：当系统需要执行外部命令（例如工具/技能触发）且策略要求人工确认时，通过审批请求/决议完成允许或拒绝。
- **进程与命令队列（process）**：内部命令执行与并发控制（lane 队列、超时、spawn 兜底等），用于保证外部命令执行可控。

文档索引：

- `docs/api/tasks/01-cron.md`：`cron.list/add/update/remove/run/status/runs`
- `docs/api/tasks/02-agent.md`：`agent`（文中以 *agent.invoke* 描述）、`agent.wait`、`agents.list`
- `docs/api/tasks/03-exec-approvals.md`：`exec.approval.request` / `exec.approval.resolve`
- `docs/api/tasks/04-process.md`：进程/命令队列说明（内部模块）

> 说明：本文档基于已编译的 clawdbot 发行版源码阅读整理（见各方法表格中的“原项目路径”列）。
