# Agent Note: Metis 默认模型路由

Status: implemented

[English](2026-09-12-metis-default-model-route.md) | 中文

## 问题

SugarWork 基于 base 的 profile 需要使用公司部署的模型，同时不把凭据写入源码，也不删除可选功能与下游 profile 仍依赖的 DeepSeek 实现。网关标识为 OpenAI Chat Completions，但组装发行版时不一定具备其可选 role、token 字段、reasoning 控制、图片输入与工具调用的已鉴权证据。

## 决策

base 组合通过 `dsh-llm-pi-ai` 声明 `metis` 路由，并选择 `metis/metis-coder-max` 作为默认 Agent 路由。profile 持有部署端点，允许通过 profile patch 或 Models 设置替换它，且只保存 `METIS_API_KEY` 凭据引用。常规凭据优先级仍为启动环境、私有受管凭据文件、项目 `.env`、harness home 的 `.env`。用户设置会把额外提供方路由与模型条目合并到同一 adapter。

声明的模型拥有 1,000,000 token 上下文窗口。在已鉴权兼容性运行证明更广泛的支持前，请求 profile 使用保守的 OpenAI Chat Completions 子集：系统提示保持 `system`，输出上限使用 `max_tokens`，省略 reasoning 字段与流式 usage 选项，禁用严格工具 schema 模式，模型仅声明文本输入。协议仍允许工具定义与工具结果轮次。未知的输出容量使用 adapter 的描述性回退，不会作为请求上限注入。

原生 `dsh-llm-deepseek` 配置项仍保留安装，后续 profile patch 仍可寻址，但在 base 组合中禁用，因而从默认活动路由集合中移除其模型与凭据引导。DeepSeek 支持的 web 搜索与需主动开启的会话贡献仍是具有独立配置的独立能力。

确定性测试使 Metis profile 针对脚本化 OpenAI Chat Completions 服务器执行流式文本、多轮历史、单次与连续工具调用、prompt 约束 JSON、超时、取消与错误映射。另一套由 `METIS_API_KEY` 与 `METIS_BASE_URL` 门控的测试会针对已部署网关执行流式、多轮、工具调用与 JSON。报告会区分确定性协议证据与已鉴权部署证据。

## 考虑过的替代方案

**修改原生 DeepSeek adapter 代表 Metis。** 不采用，因为公司路由是手动声明的 OpenAI 兼容提供方；改变原生 adapter 会把无关的端点和模型假设绑在一起，也会失去现有独立实现。

**根据模型名称假定网关的可选能力。** 不采用，因为 role、reasoning、图片、严格 schema 与 token 字段兼容性属于已部署 HTTP 端点。保守声明可避免应用发送网关尚未接受的字段或内容。

**在 TypeScript 中写入 token 或固定端点常量。** 不采用，因为凭据必须经过凭据 seam，部署地址则属于组合。profile 级默认值配合环境覆盖，可使两者都留在 adapter 源码之外。

**删除 DeepSeek 包与 UI 代码。** 不采用，因为可选搜索、贡献、自定义 profile 与下游组合仍在使用它们。禁用 base adapter 会改变默认产品策略，但不破坏这些依赖。

## 结果

- 基于 base 的 Web、headless、SDK 与 ACP 入口默认解析 Metis；ACP 携带相同的显式路由。
- 缺少 `METIS_API_KEY` 时，请求通过标准的缺少凭据诊断失败，不会回退到其他提供方。
- 用户可通过 Models 设置保存 Metis token，也可经受支持的环境层提供；无需重新构建即可添加自定义路由。
- 在已鉴权证据支持明确的 profile 修改前，developer role、reasoning 参数、图片输入、原生严格 JSON schema 与 `max_completion_tokens` 仍不可用。
- 无需机密即可持续测试协议级兼容性；无法运行凭据门控套件时，部署兼容性会明确保持待验证状态。
