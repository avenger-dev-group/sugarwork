# Agent Note: 语义化 Issue 与拉取请求模板

Status: implemented

[English](2026-09-03-semantic-issue-templates-and-policy.md) | 中文

## 问题

Issue 与拉取请求（Pull Request，PR）模板把信息收集问题与评审证据混在一起，并用 `details` 元素折叠全部内容。未使用的 frontmatter 以及独立的 Idea 和 Research 模板增加了选择，却没有改变贡献者描述工作的方式。

## 决策

Issue 模板只覆盖 Bug、Feature 和 Task。Bug 收集摘要、复现方式、当前行为、预期行为和环境。Feature 收集动机和行为。Task 收集摘要和交付物。除非未来的决策为 Idea 与 Research 定义不同的行为，否则它们属于 Task。

Issue 模板 frontmatter 只含 `name`、`about` 和 `type`。Markdown 标题定义信息层级，HTML 注释说明每个标题下应填写的内容。

PR 模板包含 `Motivation`、在 `Changes` 中相邻排列的公共接口与行为变化占位说明，以及直接展示每项测试方法并在局部 `details` 元素中放置对应证明的 `Testing` 条目。

模板只为贡献者提供填写指引。CI 不验证模板的展示方式或填写内容，仓库也没有 Issue 或 Project 生命周期自动化。[仓库自动化决策](../simplification/2026-09-13-remove-repository-specific-external-automations.zh.md)说明了这一选择。

## 考虑过的替代方案

**保留 Idea 和 Research 模板。** 它们的表单没有建立区别于 Task 的行为，因此独立入口只会增加选择，不能保留有意义的差异。

**在 CI 中验证模板展示方式。** 展示检查可能拒绝原本可执行的工作，却不能证明其动机、预期行为或交付物是否清晰。仓库不要求这套流程自动化。

**自动修复 metadata 或分类 Issue。** 这些行为需要修改规则、凭据、失败处理和由组织负责的规划流程。在仓库明确采用该流程前，它们保持缺席。

## 后果

贡献者会看到简短表单，其标题对应 Issue 信息收集和 PR 评审中有用的信息。模板不会创建或强制标签、Issue 类型、优先级、Project 归属或生命周期状态。

模板变更接受普通代码评审，不使用专门的静态策略测试。GitHub 原生的 Issue 与 PR 行为是最终依据。
