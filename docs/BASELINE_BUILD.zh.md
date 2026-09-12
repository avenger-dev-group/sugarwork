# 基线构建验证

[English](BASELINE_BUILD.md) | 中文

## 摘要

本文记录 2026-09-12 在提交 `6f222c0c3974a3a623175ce5e5b02eee7964dae7` 上完成的品牌和业务改造前基线验证。冻结依赖安装、仓库类型检查、完整构建、Web 启动和 Desktop 开发版启动均成功，未修改源代码或锁文件。构建后 Web 浏览器测试有 358 项通过、16 项跳过，但一个测试套件因当前 macOS 主机无法解析 `remote.localhost` 而失败；聚焦复跑稳定复现了同一主机解析错误。所有产品状态均写入一次性 Harness home 和 Desktop 开发目录，正式 `~/.dsh` 目录树的元数据指纹前后保持不变。

## 目录

- [范围](#baseline-scope)
- [环境](#baseline-environment)
- [命令结果](#baseline-command-results)
- [运行和隔离检查](#baseline-runtime-isolation)
- [已知问题](#baseline-known-issues)
- [基线结论](#baseline-disposition)

-----

<a id="baseline-scope"></a>

## 范围

本基线覆盖根 pnpm 工作区、构建后 Web 测试配置、从源码启动的 Web 应用，以及记录主机上的 Electron Desktop 开发应用。它不涵盖发布打包、签名、公证、Windows 行为、Linux 行为或需要 `DEEPSEEK_API_KEY` 的真实 API 行为。

依赖安装前工作树为空，构建和运行检查结束后仍为空。产品代码、配置、生成产物和锁文件均无需修改；本报告及其翻译记录是唯一纳入版本控制的基线变更。

-----

<a id="baseline-environment"></a>

## 环境

| 项目 | 仓库要求 | 实测基线 |
| --- | --- | --- |
| 仓库 | 当前源代码版本 | `main` 上的 `6f222c0c3974a3a623175ce5e5b02eee7964dae7` |
| 包版本 | 当前根包 | `@deepseek-ai/dsh-root@0.1.5-rc.2` |
| 操作系统 | 受支持的开发主机 | macOS 15.7.3（`24G419`）、Darwin 24.6.0、arm64 |
| 硬件 | 足够的本地资源 | Apple M4 Pro、14 个逻辑 CPU、48 GiB 内存、360 GiB 可用磁盘空间 |
| Node.js | `^22.19.0 \|\| >=24.0.0` | `v22.22.3` |
| Corepack | 用于选择仓库锁定的包管理器 | `0.34.6` |
| pnpm | `packageManager: pnpm@11.7.0` | Corepack 和当前可执行文件均为 `11.7.0` |
| npm | 仅供参考 | `10.9.8` |
| Apple 工具链 | macOS 原生构建支持 | Xcode 26.2（`17C52`）、Apple clang 17.0.0、GNU Make 3.81 |
| Python | 原生模块支持 | `3.13.3` |
| CMake 和 Ninja | 原生构建工具 | CMake 3.22.0、Ninja 1.12.1 |
| Rust | 原生构建工具 | `rustc 1.96.0`、`cargo 1.96.0` |
| Git 和 shell | 开发工具 | Apple Git 2.50.1、zsh 5.9 |

已满足仓库声明的 Node.js 和 pnpm 要求。其余受检主机工具均存在，足以支持本次基线实际执行的原生、Web 和 Desktop 构建路径；本次检查涉及的仓库文件没有为这些工具声明更严格的最低版本。

-----

<a id="baseline-command-results"></a>

## 命令结果

耗时为当前主机上的墙钟时间。构建在类型检查之后执行，因此 13.19 秒的结果复用了前一命令生成的产物。

| 检查 | 命令 | 耗时 | 结果 | 证据 |
| --- | --- | ---: | --- | --- |
| 冻结依赖安装 | `COREPACK_ENABLE_STRICT=1 corepack pnpm install --frozen-lockfile` | 7.49 秒 | 通过 | 解析了 291 个工作区项目，1,262 个包全部复用，锁文件未改变。 |
| 类型检查 | `corepack pnpm run typecheck` | 74.76 秒 | 通过 | Host 和 Client TypeScript 程序均以退出码 0 完成。 |
| 构建 | `corepack pnpm run build` | 13.19 秒 | 通过 | darwin-arm64 原生插件、Host 包、Client 包、Desktop shell 和 Web Vite 应用均成功构建；Vite 转换了 349 个模块。 |
| 首次构建后 Web 门禁 | `corepack pnpm run test:web:built` | 204.40 秒 | 环境失败 | 普通缓存中没有 Playwright Chromium，因此浏览器 fixture 无法启动。 |
| 临时浏览器准备 | `PLAYWRIGHT_BROWSERS_PATH=/tmp/dsh-baseline-playwright corepack pnpm --filter @deepseek-ai/dsh-web-frontend exec playwright install chromium` | 202.41 秒 | 通过 | Chromium、Chromium Headless Shell 和 FFmpeg 安装到 `/tmp`；两次瞬时 TLS 错误均由自动重试恢复。 |
| 完整构建后 Web 测试 | `PLAYWRIGHT_BROWSERS_PATH=/tmp/dsh-baseline-playwright corepack pnpm exec vitest run --config vitest.web.config.ts --reporter=dot` | 516.55 秒 | 一个主机特定失败 | 100 个测试文件通过、1 个失败、1 个跳过；358 项测试通过、16 项跳过。唯一失败为 `apps/web/tests/remote-welcome.e2e.ts`。 |
| 队列操作聚焦复跑 | `PLAYWRIGHT_BROWSERS_PATH=/tmp/dsh-baseline-playwright corepack pnpm exec vitest run apps/web/tests/queue-actions.e2e.ts --config vitest.web.config.ts` | 7.54 秒 | 通过 | 3 项测试全部通过，早先的队列操作症状未复现。 |
| 远程欢迎页聚焦复跑 | `PLAYWRIGHT_BROWSERS_PATH=/tmp/dsh-baseline-playwright corepack pnpm exec vitest run apps/web/tests/remote-welcome.e2e.ts --config vitest.web.config.ts` | 2.66 秒 | 失败 | 启动阶段报错 `getaddrinfo ENOTFOUND remote.localhost`，与当前主机的 `node:dns.lookup` 和 `dscacheutil` 检查一致。 |
| Web 启动 | `DSH_HOME=/tmp/dsh-baseline-web-home.pwXKMg corepack pnpm dsh web --no-open --host 127.0.0.1 --port 0` | 在 10 秒观察窗口内就绪 | 通过 | token 交换成功，重定向页面返回 HTTP 200 和 `text/html`；随后使用 SIGINT 停止进程。 |
| Electron 资产准备 | Electron 44.0.0 darwin-arm64 下载和包安装器 | 116.35 秒 | 通过 | 129,743,965 字节的官方归档匹配 SHA-256 `076d79742986e1b100b69ebecc691cb07368045e54c9087cef631b8622b76a80`，并通过 `unzip -tq`。 |
| Desktop 开发版启动 | `DSH_HOME=/tmp/dsh-baseline-desktop-home.SafW5G DSH_DESKTOP_OPEN_DEVTOOLS=0 corepack pnpm run start:desktop` | 在 10 秒观察窗口内就绪 | 通过 | Electron 44.0.0、其 Renderer 和 Node 22.22.3 Desktop Host 均成功启动；随后使用 SIGINT 停止进程。 |

依赖安装报告了预期的非当前平台工作区包、工作区依赖环，以及构建前尚未生成目标文件的 CLI bin 链接。后续构建生成了 CLI 目标并成功完成。构建输出还包含不影响结果的 tsdown 弃用与打包建议，以及 Vite 分块尺寸警告。

-----

<a id="baseline-runtime-isolation"></a>

## 运行和隔离检查

| 检查面 | 实测结果 |
| --- | --- |
| Web UI | 完成 cookie 交换后，经过认证的 loopback URL 返回 HTTP 200；本报告未保留任何认证 token。 |
| Desktop UI | Chrome DevTools Protocol 返回标题 `DSH 本地构建`、URL `dsh-app://app/index.html`、`document.readyState` 为 `complete`、一个根子元素、非空正文，且不存在启动错误元素。 |
| Desktop 进程 | 应用运行时存在 Electron Main、Renderer 和 Desktop Host；SIGINT 后调试端口 9229、9222 和 9230 均关闭，且没有匹配进程残留。 |
| Web Harness home | 产品状态写入 `/tmp/dsh-baseline-web-home.pwXKMg`；初始化后的工作区存储不含工作区 ID 或工作区记录。 |
| Desktop Harness home | 产品状态写入 `/tmp/dsh-baseline-desktop-home.SafW5G`；初始化后的工作区存储不含工作区 ID 或工作区记录。 |
| Desktop 构建状态 | 一次性 npm 项目和 Electron 浏览器数据均保留在 Desktop README 描述的、已忽略的 `apps/desktop/.desktop-build/development/` 路径下。 |
| 正式 Harness home | Web 和 Desktop 运行前后，`~/.dsh` 的路径、修改时间和大小指纹均为 `76c23d2f90a27b03790dbad8ad17f7c08d6f20555d8b5da34c8c5e9e44d12ee8`。 |
| 工作目录 | 两个运行时均未登记工作区，正式 Harness home 中没有新增会话或设置文件。仓库只作为进程工作目录使用，没有作为产品工作区持久化。 |

Playwright 资产始终位于 `/tmp` 下。Electron 包的首次启动安装器写入了标准 `~/Library/Caches/electron` 下载缓存；这是可执行依赖缓存，不是 Harness 会话、设置、凭据或工作区数据。

-----

<a id="baseline-known-issues"></a>

## 已知问题

1. 当前 macOS 主机无法解析 `remote.localhost`，因此构建后 Web 测试未完全通过。失败的 fixture 使用该主机名构造远程 authority，并在测试正文运行前失败。这是测试可移植性或主机入口路径问题，不是 TypeScript、生产构建、Web 启动或 Desktop 启动失败；本次没有修改 `/etc/hosts` 或产品代码来规避问题。
2. 全新主机在执行 Web 浏览器测试前需要准备 Playwright 浏览器资产。本次验证将它们放在一次性路径中，没有写入普通用户缓存。
3. 首次 Desktop 开发版启动需要 Electron 44.0.0 二进制资产。官方归档在一次中断传输后续传，经过校验和验证并安装到 Electron 的普通依赖缓存，没有修改仓库文件。
4. 使用 SIGINT 停止 Desktop 时，后端可能先于 Renderer 关闭并记录退出阶段的控制流网络错误。所有相关进程和调试监听均已成功终止。

-----

<a id="baseline-disposition"></a>

## 基线结论

仓库在记录版本上可构建：冻结安装、类型检查、完整构建、Web UI 启动和 Desktop 开发版启动均通过，且不需要代码修复。本地主机的 Web 浏览器测试基线仍受上述单一、可复现的 `remote.localhost` 解析失败限制，因此不能表述为该主机上的 Web 测试全部通过。后续品牌或业务改造可以与本次提交、环境、命令集合和隔离证据对照，同时不应把该主机特定失败误判为新引入的回归。
