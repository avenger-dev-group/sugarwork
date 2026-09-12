---
description: "销售导航、通用 Dashboard 贡献和模拟业务面板。"
kind: "package-reference"
---
# @deepseek-ai/dsh-client-ui-sales-workspace

[English](README.md) | 中文

## 概述

使用本包可为销售部门提供现有客户、订单、通话记录和短信工作台。它会向共享 Dashboard 添加销售日程、关注计数和优先行动。其记录是模拟展示数据，不会授予 CRM 或通信访问权限。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

请将本插件与部门工作台功能注册表一同挂载，然后在 Host 生成的 Bootstrap 中启用 `sales-workspace` 及其面板 ID。

### 适用场景

销售功能集应选择本包。共享员工、考勤和 AI 展示应留在 `ui-department-workbench`；其他部门应使用独立功能包。

### 最小配置

```yaml
- id: ui-sales-workspace
  name: '@deepseek-ai/dsh-client-ui-sales-workspace'
```

本包没有配置字段。Host Bootstrap 负责启用其 `customers`、`orders`、`calls` 和 `messages` 面板 ID。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部机制——点击展开</summary>

本包注册一个部门功能。其 mount 回调贡献四个 keyed 主面板和四个侧边栏条目，然后填充 Dashboard 拥有的日程、指标和任务 Slot。停用该功能时，这些贡献会一并释放。

| 文件 | 职责 |
|---|---|
| [`src/client/index.ts`](src/client/index.ts) | 注册功能与 Slot contribution |
| [`src/client/SalesWorkspace.tsx`](src/client/SalesWorkspace.tsx) | 渲染 Dashboard 卡片与销售面板 |
| [`src/client/locales.ts`](src/client/locales.ts) | 拥有中英文产品文案 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [UI Department Workbench](../ui-department-workbench/README.zh.md)——功能激活与 Dashboard Slot 所有权。
- [Web Client Slots](../../../docs/subsystems/slots.zh.md)——生命周期与跨包 UI 组合。
- [Web Client 架构](../../../docs/subsystems/web-client.zh.md)——浏览器功能包边界。

-----

<a id="model-experience"></a>
## 模型体验

无。本包只改变浏览器导航与销售展示。

#### KV Cache 影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

本包目前用于展示导航和页面组合，而不是实时销售系统。

- 客户、订单、通话、短信、会议和任务记录是展示用 mock 数据；没有挂载 CRM 或通信 Tool。
- Dashboard 计数不会从 Host projection 刷新。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

无。

</details>

**运行时不变式：** 不发布伴生入口；部门功能注册表会在本包挂载 Slot contribution 之前校验每个已启用面板。
