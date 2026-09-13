# Agent Note: Worker preview 的 pi-ai catalog

Status: implemented

[English](2026-09-13-worker-preview-pi-ai-catalog.md) | 中文

## Problem

浏览器 Worker 使用 bundle 内的兼容模块替换仅支持 Node 的 `pi-ai`。发布的 Web profile 配置了手工声明的 Metis route，因此 `llm-pi-ai` 在插件激活时会调用协议工厂和提供方工厂。如果兼容模块拒绝这些 catalog 构造调用，即使 preview 不发送模型请求，整棵 preview tree 也无法进入可交互页面。

## Decision

Worker 兼容模块实现 `llm-pi-ai` 用于注册和描述已配置提供方的仅 catalog 子集：结构化协议工厂、提供方构造、可变的内存提供方集合、模型查找和推理等级描述。认证、刷新、补全、流式与延迟请求操作继续使用具名拒绝。真实构建页面的 preview 测试通过这个子集启动组合后的 Web profile；shell 一旦渲染终止性的插件加载错误，测试便立即拒绝，不再等待成功里程碑超时。

## Alternatives considered

**在打包 profile 中禁用 `llm-pi-ai`。** 否决：preview 将不再覆盖发布 Web profile 所暴露的同一提供方 catalog 和默认模型组合。

**打包完整的 `pi-ai` 依赖及其云端 transport。** 否决：preview 不发送真实模型请求，而仅支持 Node 的 transport 依赖树会增大 Worker，并暗示其宿主无法支持的能力。

## Consequences

浏览器 preview 可以在 Metis 作为默认配置 route 时完成激活，并显示其模型元数据。尝试提供方认证、catalog 刷新或生成的调用方会立即收到指明 `pi-ai` 的拒绝；Worker 不会静默模拟响应，也不会声称支持真实提供方。
