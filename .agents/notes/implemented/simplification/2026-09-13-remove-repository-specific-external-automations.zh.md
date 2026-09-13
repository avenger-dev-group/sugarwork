# Agent Note: 移除仓库专用的外部自动化

Status: implemented

[English](2026-09-13-remove-repository-specific-external-automations.md) | 中文

## 问题

复制而来的仓库工作流假定可以访问两个外部系统：用于逐 PR 预览且受保护的 Cloudflare Pages 项目，以及 `deepseek-harness` 组织的 Issue Project。每个 PR 都会尝试使用 `avenger-dev-group/sugarwork` 并不拥有的凭据与资源，导致无关的产品变更在自身验证完成前收到失败检查。

Issue 自动化编码了一套正式规划流程：PR metadata 验证、审计评论、Project 归属、Priority 与 Start Date 字段，以及由评审事件驱动的 Status 转换。本仓库不使用该流程。预览工作流同样会构建并发布完整的浏览器 worker 镜像，但本仓库不维护相应 Cloudflare 项目，也不要求托管的 PR 预览。

## 决策

仓库不包含 Cloudflare PR 预览工作流，也不包含由 GitHub App 支持的 Issue 或 Project 自动化。仓库没有这些工作流的外部服务配置、策略实现或测试，根级检查也不会执行它们。

Issue 与 PR 模板继续作为可选的贡献者填写指引。GitHub 原生的 Issue、PR、标签和 Project 控件由人工操作。已有的远程 Cloudflare 部署和 GitHub Project 数据不属于仓库，本次移除不会修改它们。

本次移除整合了由评审事件直接指定状态、Project 局部规划字段和托管预览运行器规格三个已实现决策。它们仍有价值的权衡转化为重新引入条件：未来的状态投影必须显式保留人工状态覆盖并表示评审交接；Project 规划字段需要唯一且明确的所有者，不能镜像存储；托管预览需要仓库自有的部署目标、访问策略、凭据和重新测量的运行器数据。

## 验证

仓库搜索找不到 Cloudflare 预览、Issue policy 凭据、Issue 生命周期、Project 策略实现或已移除的检查名称。保留的 CI 工作流测试只加载实际存在的工作流，文档检查验证活跃 Agent Note 树，包依赖策略不受这些流程删除影响。

## 考虑过的替代方案

**把两个系统改为当前仓库目标并配置凭据。** 仓库自有的 GitHub App 和 Cloudflare 项目可以让工作流运行，但团队不需要这两套自动化，也不应承担对应的权限、维护和失败处理责任。

**在凭据缺失时跳过工作流。** 条件跳过可以避免红色检查，但会保留没有运维负责人的休眠代码、测试和文档。

**用个人访问令牌替代 GitHub App。** 个人 token 会把自动化绑定到单个用户，同时仍然强加团队不需要的 Issue 流程。它还会削弱已删除工作流原本采用的短期、安装范围内身份。

**使用 `GITHUB_TOKEN` 保留只读 PR policy。** 这种方式不需要 Project 写入凭据，但仍会强制团队不需要的 Issue 引用和仓库专用标签。

## 后果

PR 不会发布托管预览，也不会因为缺少 Cloudflare、GitHub App 或 Project 凭据而失败。Issue 不会在 `Inbox`、`In progress`、`In review`、`Done` 和 `No action` 之间自动移动；没有自动化初始化规划日期、协调优先级、删除标签或写入审计评论。

仓库不再集中强制 Issue 到 PR 的规划 metadata。重新引入任何部分都需要当前团队负责人、明确的目标组织或服务、最小权限凭据，以及针对所选行为的专门测试，而不是整体恢复已删除内容。
