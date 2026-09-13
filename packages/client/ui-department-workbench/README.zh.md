---
description: "由 Bootstrap 驱动的部门功能注册表和共享工作台 Dashboard。"
kind: "package-reference"
---
# UI Department Workbench

[English](README.md) | 中文

## 概述

`@deepseek-ai/dsh-client-ui-department-workbench` 校验服务端启用的客户端功能、挂载相应 Slot contribution，并提供包含员工与考勤展示的通用部门 Dashboard。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>
## 使用本包

功能插件注册稳定的功能 id、所拥有的面板 id 和 mount 回调。激活过程会在挂载任何部门界面前拒绝缺失功能、重复面板归属、无效导航和缺失首页面板。客户端插件挂载时会保留已缓存的 Bootstrap，并在所有已启用功能重新注册后恢复工作台，无需再次请求服务端或等待 ready 事件。部门包通过 Dashboard 的日程、关注指标和任务列表 Slot 提供内容，无需导入本功能的运行时值。

<a id="model-experience"></a>
## 模型体验

无。本包只改变浏览器导航和 Dashboard 呈现。

#### KV Cache 影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 员工编号、考勤事件和工作安排目前只是展示用 mock 数据，等待后续引入相应 Host 服务。

<a id="dev-note"></a>
### 开发备注

无。

**运行时不变式：** 不发布伴生入口；激活时同步校验功能和面板归属。
