# SugarWork

English | [中文](README.zh.md)

SugarWork is a plugin-based agent workspace for Web and Desktop. Its short command name is `sw`.

## Developer preview

SugarWork is in developer preview and may introduce compatibility-breaking changes.

Review the [safety notice](SAFETY.md) before running the project.

## Run from source

Install Node.js 24 and pnpm, then run:

```sh
git clone https://github.com/avenger-dev-group/sugarwork.git
cd sugarwork
pnpm install
pnpm run build
pnpm sw web
```

`pnpm run build` prepares repository artifacts. `pnpm sw web` starts the Web application at `http://127.0.0.1:3080` by default and opens it in the default browser for a local launch.

Desktop development starts with:

```sh
pnpm run dev:desktop
```

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md). Agents must follow [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)

Third-party dependencies, retained notices, and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
