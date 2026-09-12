# Metis model route

English | [中文](metis-model.zh.md)

SugarWork's base-backed profiles select `metis/metis-coder-max` by default. The route uses OpenAI Chat Completions, declares a 1,000,000-token context window, and resolves its bearer token from `METIS_API_KEY`. The deployment endpoint is part of the shipped profile configuration rather than adapter source; profile patches and Models settings can replace it without changing adapter code. Additional providers and models remain available through Models settings.

## Configure credentials

Supply the token in the launch environment, the project `.env`, the harness-home `.env`, or the private `$SW_HOME/.credentials.yaml` file. Resolution precedence is launch environment, private credential file, project `.env`, then harness-home `.env`. The configuration stores only the name `METIS_API_KEY`, never its value.

```yaml
version: 1
refs:
  METIS_API_KEY: replace-with-deployment-secret
```

On POSIX, keep the managed credential file readable only by its owner with mode `0600`. A token entered through Models settings is written through the same credential provider and is used by the next request.

## Compatibility posture

The deployed endpoint requires authentication: an unauthenticated model-list request returns HTTP 401, while a GET request to the Chat Completions path is rejected as the expected non-POST method. No `METIS_API_KEY` was available during the baseline run, so authenticated gateway behavior remains pending until the credential-gated suite runs.

| Capability | Shipped posture | Automated evidence | Authenticated gateway status |
|---|---|---|---|
| Ordinary streaming conversation | OpenAI Chat Completions SSE | Protocol test passes | Pending credential-gated run |
| Multi-turn conversation | User and assistant history preserved | Protocol test passes | Pending credential-gated run |
| Single tool call | Function tools and tool results enabled | Protocol test passes | Pending credential-gated run |
| Sequential tool calls | Repeated assistant/tool-result rounds enabled | Protocol test passes | Pending credential-gated run |
| Structured JSON | Prompt-constrained JSON text | Parseability test passes | Pending; native strict schema is not claimed |
| Timeout and cancellation | Idle watchdog and caller abort | Protocol test passes | Transport behavior covered locally |
| Error returns | 400/401/429/500 normalized | Protocol test passes | Representative authenticated failures pending |
| Developer role | Disabled; system prompt uses `system` | Request-field test passes | Degraded until gateway support is confirmed |
| Output token field | `max_tokens` | Request-field test passes | `max_completion_tokens` not used |
| Reasoning parameters | Omitted | Request-field test passes | Unsupported until gateway support is confirmed |
| Image input | Text-only model declaration | Unsupported before network I/O | Pending gateway evidence |

The model's maximum output length is unknown. The adapter's ordinary 32,768-token metadata fallback therefore remains descriptive and does not inject a per-request limit; callers may provide `maxTokens`, which is sent as `max_tokens`.

Run deterministic protocol coverage with `pnpm exec vitest run packages/llm/llm-pi-ai/tests/metis-compatibility.spec.ts`. Run the deployed-gateway suite with both `METIS_API_KEY` and `METIS_BASE_URL` set: `pnpm exec vitest run --config vitest.e2e.config.ts packages/llm/llm-pi-ai/tests/metis.e2e.ts`.

## Temporary login

The Web application presents a mock login before mounting the main interface. It accepts the username `simon` and any password, retaining success only for the current browser tab. This is a UI-flow placeholder with no server-side identity or authorization and must be replaced before it is used to protect data.
