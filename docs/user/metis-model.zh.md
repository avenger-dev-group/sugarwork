# Metis 模型路由

[English](metis-model.md) | 中文

SugarWork 基于 base 的 profile 默认选择 `metis/metis-coder-max`。该路由使用 OpenAI Chat Completions，声明 1,000,000 token 上下文窗口，并从 `METIS_API_KEY` 解析 bearer token。部署端点位于随附 profile 配置而非 adapter 源码；profile patch 与 Models 设置可以在不修改 adapter 代码的情况下替换它。Models 设置仍允许添加其他提供方和模型。

## 配置凭据

可以在启动环境、项目 `.env`、harness home 下的 `.env` 或私有 `$SW_HOME/.credentials.yaml` 文件中提供 token。解析优先级依次为启动环境、私有凭据文件、项目 `.env`、harness home 的 `.env`。配置中只保存名称 `METIS_API_KEY`，绝不保存其值。

```yaml
version: 1
refs:
  METIS_API_KEY: replace-with-deployment-secret
```

在 POSIX 系统上，请以 `0600` mode 保持受管凭据文件仅对属主可读。通过 Models 设置输入的 token 会由同一凭据提供方写入，并从下一个请求起使用。

## 兼容性策略

部署端点需要身份验证：未鉴权的模型列表请求返回 HTTP 401，对 Chat Completions 路径的 GET 请求则因为不是预期的 POST 方法而被拒绝。基线运行期间没有可用的 `METIS_API_KEY`，因此在凭据门控套件运行前，已鉴权的网关行为仍待验证。

| 能力 | 随附策略 | 自动化证据 | 已鉴权网关状态 |
|---|---|---|---|
| 普通流式对话 | OpenAI Chat Completions SSE | 协议测试通过 | 待凭据门控运行 |
| 多轮对话 | 保留用户与 assistant 历史 | 协议测试通过 | 待凭据门控运行 |
| 单工具调用 | 启用 function tool 与工具结果 | 协议测试通过 | 待凭据门控运行 |
| 连续工具调用 | 启用重复 assistant／工具结果轮次 | 协议测试通过 | 待凭据门控运行 |
| 结构化 JSON | 由 prompt 约束的 JSON 文本 | 可解析性测试通过 | 待验证；不声称原生严格 schema |
| 超时与取消 | idle watchdog 与调用方 abort | 协议测试通过 | 传输行为已由本地覆盖 |
| 错误返回 | 归一化 400／401／429／500 | 协议测试通过 | 具代表性的鉴权失败待验证 |
| Developer role | 禁用；系统提示使用 `system` | 请求字段测试通过 | 确认网关支持前为降级 |
| 输出 token 字段 | `max_tokens` | 请求字段测试通过 | 不使用 `max_completion_tokens` |
| Reasoning 参数 | 省略 | 请求字段测试通过 | 确认网关支持前不受支持 |
| 图片输入 | 声明为仅文本模型 | 在网络 I/O 前拒绝 | 待网关证据 |

模型的最大输出长度未知。因此 adapter 的常规 32,768 token 元数据回退仍只用于描述，不会自行注入每请求上限；调用方可以提供 `maxTokens`，它会作为 `max_tokens` 发送。

运行 `pnpm exec vitest run packages/llm/llm-pi-ai/tests/metis-compatibility.spec.ts` 执行确定性协议覆盖。同时设置 `METIS_API_KEY` 与 `METIS_BASE_URL` 后，用 `pnpm exec vitest run --config vitest.e2e.config.ts packages/llm/llm-pi-ai/tests/metis.e2e.ts` 运行已部署网关套件。

## 临时登录

Web 应用会在挂载主界面前呈现模拟登录。它接受用户名 `simon` 与任意密码，并且只为当前浏览器标签页保留成功状态。这是一个没有服务端身份或授权的 UI 流程占位，在用于保护数据前必须替换。
