# SugarWork

[English](README.md) | 中文

SugarWork 是基于插件架构的 Web 与桌面智能体工作空间，短命令名为 `sw`。

## 开发者预览

SugarWork 处于开发者预览阶段，可能引入破坏兼容性的变更。

运行本项目前，请阅读[安全说明](SAFETY.zh.md)。

## 从源码运行

安装 Node.js 24 与 pnpm，然后运行：

```sh
git clone https://github.com/avenger-dev-group/sugarwork.git
cd sugarwork
pnpm install
pnpm run build
pnpm sw web
```

`pnpm run build` 会准备仓库产物。`pnpm sw web` 默认在 `http://127.0.0.1:3080` 启动 Web 应用，并在本机启动时使用默认浏览器打开。

桌面开发使用：

```sh
pnpm run dev:desktop
```

## 开发

请先阅读[开发指南](docs/development.zh.md)与[架构文档](docs/architecture.zh.md)。Agent 必须遵循 [AGENTS.md](AGENTS.md)。

## 许可证

[MIT](LICENSE)

第三方依赖、保留声明及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
