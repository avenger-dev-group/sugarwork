---
description: "服务端解析的应用 Bootstrap Remote 及其可观察浏览器状态适配器。"
kind: "package-reference"
---
# App Bootstrap

[English](README.md) | 中文

## 概述

`@deepseek-ai/dsh-api-app-bootstrap` 把已认证账号的部门工作台投影为一次客户端安全的 Bootstrap 响应。Preset id、策略和数据范围保留在 Host。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>
## 使用本包

Host 注册 `appBootstrap.get`；Client 提供 `ctx.appBootstrap`，包含合并加载、缓存、错误状态与 `app-bootstrap/ready` 事件。登录界面调用该方法时不会发送账号、部门、角色或 preset 选择值。

<a id="model-experience"></a>
## 模型体验

无。Bootstrap 只控制浏览器呈现，不暴露模型可见输入。

#### KV Cache 影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 身份认证传输尚未接入；当前由 mock 提供方选择账号。
- Session 归属将由下一版已发布 Session 格式引入，而不会修改已提交的历史版本。

<a id="dev-note"></a>
### 开发备注

无。

**运行时不变式：** 不发布伴生入口；Typert 校验生成的 Remote descriptor，提供方校验组织状态。
