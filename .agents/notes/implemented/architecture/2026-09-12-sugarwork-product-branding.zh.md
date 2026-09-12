# Agent Note: 将 SugarWork 产品品牌与 DSH 兼容标识分离

Status: implemented

[English](2026-09-12-sugarwork-product-branding.md) | 中文

## 问题

发布的 Web 与 Desktop 应用需要统一使用公司的产品身份，而现有 npm 包依赖图、配置键、profile 名称、线路标识与提供方适配器已经使用 DSH 或 DeepSeek 名称。同步重命名两类标识会把呈现改动扩大为不兼容的全仓迁移；如果在客户可见界面保留旧图稿或产品文案，又会呈现两个产品身份。

## 决策

SugarWork 是发布的 Web 与 Electron 应用唯一呈现的产品身份。文档标题、侧栏、会话欢迎页、启动与恢复页、菜单、对话框、安装包与产物名称、PWA 元数据、应用图标以及模型可见的产品自述都使用 `SugarWork`。品牌标记使用公司提供的蓝色图稿；本地构建使用蓝色 `SW` 回退，不显示其他公司的 Logo。

Electron 在 macOS 与 Windows 上的发布标识为 `com.aixvo.sugarwork`。打包会拒绝取值不同的 `DSH_DESKTOP_APP_ID`。测试与生产更新 origin 分别通过 `DOWNLOAD_TEST_ORIGIN` 和 `DOWNLOAD_PROD_ORIGIN` 保持为部署输入；对象前缀为 `_/sugarwork/desktop/stable/<target>/`。

用于标识实现而非产品呈现的兼容标识保持不变，包括 `@deepseek-ai/dsh-*` 包 scope、`dsh` 命令与环境变量、profile 与存储路径、TypeScript 与 Python API 名称、Session 与 ACP 协议标识、仓库 URL，以及 DeepSeek 模型提供方名称。面向提供方的 DeepSeek 名称继续标识可选择的模型服务，不充当 SugarWork 产品品牌。

现有 `ui-brand-official` 包名与 `official` 构建 profile 值保持为兼容标识。它的实现同时向侧栏与会话 slot 提供 SugarWork 标志和名称，因此发布组合中不存在仍然生效的 DeepSeek 产品品牌 occupant。

MIT License、第三方声明以及法律要求保留的版权或归属文字保持完整，不属于产品品牌界面。

## 验证

单元测试与 Web 验收测试固定 SugarWork 标题、欢迎文案、PWA 元数据、slot occupant、应用标识、产物名称以及可配置更新 origin。Desktop 开发版截图共同验证渲染后的壳与 Web 客户端。对面向产品的应用和客户端目录进行源码审计，以区分仍然保留的提供方或兼容标识与渲染出的产品身份。

## 考虑过的替代方案

**重命名所有 DSH 与 DeepSeek 标识。** 这种方式可以从源码删除旧字符串，却会破坏包使用方、profile、环境配置、持久化 Session、协议对端、提供方路由与 SDK，而不会进一步改善用户可见的产品身份。

**保留上游品牌插件，只覆盖应用标题。** 侧栏、欢迎页、favicon、启动画面、安装包与应用图标仍会传达另一个身份。

**硬编码生产更新服务。** 公司更新服务尚未确定，因此可配置的 HTTPS origin 可以保留发布校验，同时不提前绑定地址。

## 影响

用户在 Web 与 Desktop 中看到统一的 SugarWork 身份，发布产物带有公司的应用标识与命名。现有代码和存储数据保留兼容的 DSH 标识。维护者必须按受众判断后续出现的名称：面向产品的文案与图稿使用 SugarWork，DeepSeek 提供方名称保留为提供方标签，实现标识只通过明确的兼容迁移修改。
