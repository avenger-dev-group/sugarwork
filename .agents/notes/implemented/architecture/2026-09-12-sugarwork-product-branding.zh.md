# Agent Note: 将 SugarWork 产品品牌与 DSH 兼容标识分离

Status: implemented

[English](2026-09-12-sugarwork-product-branding.md) | 中文

## 问题

发布的 Web 与 Desktop 应用需要统一使用公司的产品身份，而现有 npm 包依赖图、配置键、profile 名称、线路标识与提供方适配器已经使用 DSH 或 DeepSeek 名称。同步重命名两类标识会把呈现改动扩大为不兼容的全仓迁移；如果在客户可见界面保留旧图稿或产品文案，又会呈现两个产品身份。

## 决策

SugarWork 是发布的 Web 与 Electron 应用唯一呈现的产品身份。文档标题、侧栏、会话欢迎页、启动与恢复页、菜单、对话框、安装包与产物名称、PWA 元数据、应用图标以及模型可见的产品自述都使用 `SugarWork`。开发构建与发布构建的品牌标记都使用公司提供的蓝色图稿；外壳的蓝色 `SW` 回退只供未组合 SugarWork 品牌包的组合使用。

Electron 在 macOS 与 Windows 上的发布标识为 `com.aixvo.sugarwork`。打包会拒绝取值不同的 `DSH_DESKTOP_APP_ID`。测试与生产更新 origin 分别通过 `DOWNLOAD_TEST_ORIGIN` 和 `DOWNLOAD_PROD_ORIGIN` 保持为部署输入；对象前缀为 `_/sugarwork/desktop/stable/<target>/`。

产品规范命令为 `sw`；发布的 CLI 暂时保留 `dsh` 作为迁移别名。新安装从 `$SW_HOME` 解析产品数据并默认使用 `~/.sw`，同时 `$DSH_HOME` 继续作为可显式设置的读取兼容覆盖值。仓库私有根包使用 `@sugarwork-ai/sw-root`，Chat 中的第一方上下文生产者标签使用 `@sugarwork-ai/sw-*` 产品命名空间。运行时包导入、构建身份、持久化 Session 生产者 ID、其余环境变量族、TypeScript 与 Python API 名称以及 ACP 协议标识保留兼容名称，直到完成协调一致的包迁移。面向提供方的 DeepSeek 名称继续标识可选择的模型服务，不充当 SugarWork 产品品牌。

现有 `ui-brand-official` 包名与 `official` 构建 profile 值保持为兼容标识。只要挂载本包，它的实现就同时向侧栏与会话 slot 提供 SugarWork 标志和名称，因此开发构建与发布构建使用相同的可见身份，发布组合中也不存在仍然生效的 DeepSeek 产品品牌 occupant。

可选的仓库徽章 skill 现在注册为 `sugarwork-badge`，安装 SugarWork 图稿并链接公司仓库；其历史 npm 包名继续作为内部兼容标识保留。通用 HTTP 请求与模型归属信息使用 `sugarwork` 产品 token 和公司仓库 URL；DeepSeek 专用 wire header 名称作为对应提供方的协议标识保留。

MIT License、第三方声明以及法律要求保留的版权或归属文字保持完整，不属于产品品牌界面。

SugarWork 文档站在公司文档重建期间仅发布本地化产品首页。旧用户指南与开发教程目录已经删除；维护代码所需的仓库架构、测试说明、包约定、Agent Note、许可证与声明继续保留。默认分支 CI 使用 GitHub 托管 runner；真实提供方 E2E 需要仓库显式启用，因此缺少外部凭证不会表现为产品构建失败。

## 验证

单元测试与 Web 验收测试固定 SugarWork 标题、欢迎文案、PWA 元数据、slot occupant、应用标识、产物名称以及可配置更新 origin。Desktop 开发版截图共同验证渲染后的壳与 Web 客户端。对面向产品的应用和客户端目录进行源码审计，以区分仍然保留的提供方或兼容标识与渲染出的产品身份。

## 考虑过的替代方案

**一次机械替换所有兼容标识。** 这种方式会破坏包使用方、profile、环境配置、持久化 Session、协议对端、提供方路由与 SDK。迁移先从产品拥有的规范入口开始，包身份则必须在确认公司拥有的 npm scope 后再修改。

**保留上游品牌插件，只覆盖应用标题。** 侧栏、欢迎页、favicon、启动画面、安装包与应用图标仍会传达另一个身份。

**硬编码生产更新服务。** 公司更新服务尚未确定，因此可配置的 HTTPS origin 可以保留发布校验，同时不提前绑定地址。

## 影响

用户在 Web、Desktop、CLI 帮助、文档与发布产物中看到统一的 SugarWork 身份。新的本地数据使用 SugarWork 路径，显式旧主目录配置仍可解析。维护者必须按受众判断后续出现的名称：面向产品的文案与图稿使用 SugarWork，DeepSeek 提供方名称保留为提供方标签，实现标识只通过明确的兼容迁移修改。
