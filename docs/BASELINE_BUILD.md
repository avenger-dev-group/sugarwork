# Baseline build verification

English | [中文](BASELINE_BUILD.zh.md)

## Summary

This report records the pre-customization baseline verified on 2026-09-12 at commit `6f222c0c3974a3a623175ce5e5b02eee7964dae7`. The frozen dependency installation, repository typecheck, complete build, Web startup, and Desktop development startup succeeded without a source-code or lockfile change. The built Web browser suite completed with 358 passed tests and 16 skipped tests, but one suite failed because this macOS host does not resolve `remote.localhost`; the focused rerun reproduced the same host-resolution failure. Disposable Harness homes and the Desktop development directories contained all generated product state, while a metadata fingerprint of the normal `~/.sw` tree remained unchanged.

## Contents

- [Scope](#baseline-scope)
- [Environment](#baseline-environment)
- [Command results](#baseline-command-results)
- [Runtime and isolation checks](#baseline-runtime-isolation)
- [Known issues](#baseline-known-issues)
- [Baseline disposition](#baseline-disposition)

-----

<a id="baseline-scope"></a>

## Scope

The baseline covers the root pnpm workspace, the built Web test configuration, the source-launched Web application, and the Electron Desktop development application on the recorded host. It does not qualify release packaging, signing, notarization, Windows behavior, Linux behavior, or real-API behavior requiring `DEEPSEEK_API_KEY`.

The worktree was clean before dependency installation and remained clean after the build and runtime checks. No product code, configuration, generated artifact, or lockfile change was required; this report and its translation records are the only tracked baseline changes.

-----

<a id="baseline-environment"></a>

## Environment

| Item | Repository requirement | Observed baseline |
| --- | --- | --- |
| Repository | Current source revision | `6f222c0c3974a3a623175ce5e5b02eee7964dae7` on `main` |
| Package version | Current root package | `@deepseek-ai/dsh-root@0.1.5-rc.2` |
| Operating system | Supported development host | macOS 15.7.3 (`24G419`), Darwin 24.6.0, arm64 |
| Hardware | Sufficient local resources | Apple M4 Pro, 14 logical CPUs, 48 GiB RAM, 360 GiB free disk space |
| Node.js | `^22.19.0 \|\| >=24.0.0` | `v22.22.3` |
| Corepack | Required to select the locked package manager | `0.34.6` |
| pnpm | `packageManager: pnpm@11.7.0` | `11.7.0` through Corepack and the active executable |
| npm | Informational | `10.9.8` |
| Apple toolchain | Native macOS build support | Xcode 26.2 (`17C52`), Apple clang 17.0.0, GNU Make 3.81 |
| Python | Native-module support | `3.13.3` |
| CMake and Ninja | Native build tooling | CMake 3.22.0, Ninja 1.12.1 |
| Rust | Native build tooling | `rustc 1.96.0`, `cargo 1.96.0` |
| Git and shell | Development tooling | Apple Git 2.50.1, zsh 5.9 |

The declared Node.js and pnpm requirements were satisfied. The remaining inspected host tools were present and were sufficient for the native, Web, and Desktop build paths exercised by this baseline; the repository files inspected for this verification do not declare stricter minimum versions for those tools.

-----

<a id="baseline-command-results"></a>

## Command results

Elapsed times are wall-clock measurements from this host. The build followed typecheck, so its 13.19-second result reused artifacts emitted during the earlier command.

| Check | Command | Elapsed | Result | Evidence |
| --- | --- | ---: | --- | --- |
| Frozen dependency installation | `COREPACK_ENABLE_STRICT=1 corepack pnpm install --frozen-lockfile` | 7.49 s | Pass | 291 workspace projects were resolved; all 1,262 packages were reused and the lockfile did not change. |
| Typecheck | `corepack pnpm run typecheck` | 74.76 s | Pass | Host and client TypeScript programs completed with exit code 0. |
| Build | `corepack pnpm run build` | 13.19 s | Pass | Native darwin-arm64 addon, host packages, client packages, Desktop shell, and the Web Vite application built successfully; Vite transformed 349 modules. |
| Initial built Web gate | `corepack pnpm run test:web:built` | 204.40 s | Environment failure | Playwright Chromium was absent from the normal cache, so browser fixtures could not start. |
| Temporary browser provisioning | `PLAYWRIGHT_BROWSERS_PATH=/tmp/dsh-baseline-playwright corepack pnpm --filter @deepseek-ai/dsh-web-frontend exec playwright install chromium` | 202.41 s | Pass | Chromium, Chromium Headless Shell, and FFmpeg were installed below `/tmp`; two transient TLS retries recovered automatically. |
| Full built Web suite | `PLAYWRIGHT_BROWSERS_PATH=/tmp/dsh-baseline-playwright corepack pnpm exec vitest run --config vitest.web.config.ts --reporter=dot` | 516.55 s | One host-specific failure | 100 test files passed, one failed, and one skipped; 358 tests passed and 16 skipped. The sole failure was `apps/web/tests/remote-welcome.e2e.ts`. |
| Queue-action focused rerun | `PLAYWRIGHT_BROWSERS_PATH=/tmp/dsh-baseline-playwright corepack pnpm exec vitest run apps/web/tests/queue-actions.e2e.ts --config vitest.web.config.ts` | 7.54 s | Pass | All 3 tests passed, so the earlier queue-action symptom did not reproduce. |
| Remote-welcome focused rerun | `PLAYWRIGHT_BROWSERS_PATH=/tmp/dsh-baseline-playwright corepack pnpm exec vitest run apps/web/tests/remote-welcome.e2e.ts --config vitest.web.config.ts` | 2.66 s | Fail | Startup failed at `getaddrinfo ENOTFOUND remote.localhost`, matching `node:dns.lookup` and `dscacheutil` checks on this host. |
| Web startup | `DSH_HOME=/tmp/dsh-baseline-web-home.pwXKMg corepack pnpm sw web --no-open --host 127.0.0.1 --port 0` | Ready within the 10 s observation window | Pass | The token exchange completed and the redirected page returned HTTP 200 with `text/html`; the process was then stopped with SIGINT. |
| Electron asset preparation | Electron 44.0.0 darwin-arm64 download and package installer | 116.35 s | Pass | The 129,743,965-byte official archive matched SHA-256 `076d79742986e1b100b69ebecc691cb07368045e54c9087cef631b8622b76a80` and passed `unzip -tq`. |
| Desktop development startup | `DSH_HOME=/tmp/dsh-baseline-desktop-home.SafW5G DSH_DESKTOP_OPEN_DEVTOOLS=0 corepack pnpm run start:desktop` | Ready within the 10 s observation window | Pass | Electron 44.0.0, its renderer, and the Node 22.22.3 Desktop Host started; the process was then stopped with SIGINT. |

Dependency installation reported expected unsupported-platform workspace packages, a workspace dependency cycle, and pre-build CLI bin links whose target had not yet been emitted. The subsequent build created the CLI target and completed successfully. Build output also contained non-fatal tsdown deprecation and bundling suggestions plus Vite's chunk-size warning.

-----

<a id="baseline-runtime-isolation"></a>

## Runtime and isolation checks

| Surface | Observed result |
| --- | --- |
| Web UI | The authenticated loopback URL returned HTTP 200 after cookie exchange; no authentication token is retained in this report. |
| Desktop UI | Chrome DevTools Protocol reported title `DSH 本地构建`, URL `dsh-app://app/index.html`, `document.readyState` equal to `complete`, one root child, non-empty body text, and no startup-error element. |
| Desktop processes | Electron main, renderer, and Desktop Host were present while the application was running; debug ports 9229, 9222, and 9230 closed after SIGINT and no matching process remained. |
| Web Harness home | Product state was written to `/tmp/dsh-baseline-web-home.pwXKMg`; its initialized workspace store contained no workspace IDs or workspace records. |
| Desktop Harness home | Product state was written to `/tmp/dsh-baseline-desktop-home.SafW5G`; its initialized workspace store contained no workspace IDs or workspace records. |
| Desktop build state | The disposable npm project and Electron browser data remained under ignored `apps/desktop/.desktop-build/development/` paths described by the Desktop README. |
| Normal Harness home | A path, modification-time, and size fingerprint of `~/.sw` was `76c23d2f90a27b03790dbad8ad17f7c08d6f20555d8b5da34c8c5e9e44d12ee8` both before and after the Web and Desktop runs. |
| Work directories | Neither runtime registered a workspace, and no session or settings file was created in the normal Harness home. The repository remained the process working directory only; it was not persisted as a product workspace. |

Playwright assets stayed below `/tmp`. Electron's package-level first-launch installer populated the standard `~/Library/Caches/electron` download cache; this is executable dependency cache, not Harness session, settings, credential, or workspace data.

-----

<a id="baseline-known-issues"></a>

## Known issues

1. The built Web suite is not fully green on this macOS host because `remote.localhost` has no host or DNS resolution. The failing fixture constructs a remote authority with that hostname and fails before its test body can run. This is a test portability or host-entry-path issue, not a TypeScript, production build, Web startup, or Desktop startup failure; no `/etc/hosts` or product-code workaround was applied.
2. A fresh machine needs Playwright browser assets before the Web browser lane can run. This verification kept them in a disposable path instead of the normal user cache.
3. The first Desktop development launch needed the Electron 44.0.0 binary asset. Its official archive was resumed after an interrupted transfer, checksum-verified, and installed into Electron's normal dependency cache without changing repository files.
4. Stopping Desktop with SIGINT closes the backend before the renderer and can log a shutdown-time control-stream network error. All related processes and debug listeners terminated successfully.

-----

<a id="baseline-disposition"></a>

## Baseline disposition

The repository is buildable at the recorded revision: frozen installation, typecheck, full build, Web UI startup, and Desktop development startup all pass, and no code fix is necessary. The local Web browser-test baseline remains qualified by the single reproducible `remote.localhost` resolution failure above; it must not be reported as a fully passing Web suite on this host. Future brand or business changes can compare against this commit, environment, command set, and isolation evidence without treating the host-specific test failure as a newly introduced regression.
