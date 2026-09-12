---
description: "服务端解析用户、部门、成员关系、角色、功能集和部门策略的 Service Definition。"
kind: "package-reference"
---
# Department Workbench

[English](README.md) | 中文

## 概述

`@deepseek-ai/dsh-department-workbench` 定义 Host 服务，用于解析已认证账号的主部门工作台并鉴权部门操作。它与文件系统 `Workspace` 概念相互独立。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>
## 使用本包

提供方实现 `resolveCurrent()` 与 `authorize()`。消费方必须使用返回的身份和策略；浏览器提交的部门、角色、preset 和数据范围值均不具备权威性。

<a id="model-experience"></a>
## 模型体验

无。本 Definition 不注册提示词、工具或会话事件。

#### KV Cache 影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- MVP 解析器只暴露一个主部门，但成员关系模型允许以后增加多部门选择。

<a id="dev-note"></a>
### 开发备注

无。

**运行时不变式：** 不发布伴生入口，因为提供方负责目录一致性，消费方只接收一次完整解析结果。
