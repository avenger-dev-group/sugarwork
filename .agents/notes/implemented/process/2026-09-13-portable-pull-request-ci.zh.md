# Agent Note: 可移植的拉取请求 CI

Status: implemented

[English](2026-09-13-portable-pull-request-ci.md) | 中文

## Problem

必需的拉取请求作业如果指定组织自有的大型运行器，在仓库未获分配这些运行器名称时就会一直排队。即使所有标准托管作业都成功，聚合判定也无法启动。另一项真实提供方检查还把模型的精确确认文字当作正确性证据，因此已完成且外部效果正确的工具调用可能只因提供方附加了解释文字而失败。

## Decision

`ci.yml` 的 Linux 正确性作业默认使用 `ubuntu-24.04`，原生 Windows 作业默认使用 `windows-2025`。现有 `DSH_CI_FAILOVER_LINUX` 与 `DSH_CI_FAILOVER_WINDOWS` 选择器仍接受 `selfhosted` 和 `blacksmith`；选择器指向持久化自托管池时，Dependabot 继续回退到标准托管运行器。因此，仓库专属的大型运行器容量成为可选项，而不是取得拉取请求判定的前提。

安装后 wheel 的真实 Metis 检查要求每个轮次在模型请求工具调用后完成。它通过外部观察验证文件创建、仅宿主知道的挑战值复制、源文件保留和 session 日志 framing。提示词仍要求 sentinel 确认，但测试不断言提供方生成的文字；确定性的 keyless SDK 测试负责最终响应的精确投影。

本决策只取代 [CI 故障切换手册](2026-07-26-ci-failover-runbook.zh.md)与[原生 Windows CI 决策](2026-08-08-native-windows-pull-request-ci.zh.md)中默认选择大型运行器的部分。它们拆分作业的拓扑、平台覆盖、可选故障切换路径与信任规则继续生效。[安装后 Python wheel 验证决策](../testing/2026-08-23-installed-python-wheel-black-box-ci.zh.md)负责外部效果检查。

## Alternatives considered

**在每个仓库中配置继承来的大型运行器名称。** 否决：必需的正确性证据会依赖组织管理、付费容量，以及仓库代码无法验证的标签。

**停用完整的 `ci.yml` 工作流，只依赖 `sugarwork-ci.yml`。** 否决：较短的工作流不能替代逐文件覆盖率、快照、构建产物和原生 Windows 证据。

**重试直到模型输出精确 sentinel，或者接受包含 sentinel 的字符串。** 否决：重试会消耗提供方调用，却没有改变不确定的观察；子字符串仍然信任模型报告，而不是本次运行产生的文件和日志。

## Consequences

拉取请求作业无需仓库专属运行器设置即可进入 GitHub 的标准托管队列。标准机器的并行容量低于原大型运行器目标，因此完整作业在获得机器后可能执行更久；取消、快速失败行为和作业超时继续约束已被取代或失败的工作。维护者明确选择时，仍可使用自托管与 Blacksmith 路径。真实提供方的措辞变化不再造成误报，而缺少凭据、轮次未完成、没有工具调用、字节错误、源文件被修改或 session 日志无效仍会使检查失败。
