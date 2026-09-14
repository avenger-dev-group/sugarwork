---
description: "供开发部署使用、经过校验的内存部门工作台提供方。"
kind: "package-reference"
---
# Department Workbench Mock

[English](README.md) | 中文

## 概述

`@deepseek-ai/dsh-department-workbench-mock` 提供经过校验的内存组织目录和由部署选择的当前账号，使通用平台可以在生产身份服务接入前运行。

## 目录

- [使用本包](#use-this-package)
- [配置](#configuration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>
## 使用本包

把用户、部门、成员关系、角色、功能集和策略配置成一个快照。重复或悬空引用会导致加载失败。浏览器不能选择 `currentUserId`。

<a id="configuration"></a>
## 配置

生成的[配置目录](../../../docs/config-catalog.zh.md)列出全部字段。

<a id="model-experience"></a>
## 模型体验

无。本提供方不改变模型输入。

#### KV Cache 影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 目录在单个进程内保持静态，并且只表示一个当前账号。

<a id="dev-note"></a>
### 开发备注

无。

**运行时不变式：** 不发布伴生入口；构造函数校验负责全部内部引用。
