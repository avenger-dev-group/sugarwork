# Agent Note: Metis default model route

Status: implemented

English | [中文](2026-09-12-metis-default-model-route.zh.md)

## Problem

Base-backed SugarWork profiles need to use the company-deployed model without embedding credentials in source or removing the existing DeepSeek implementation that optional features and downstream profiles still depend on. The gateway identifies as OpenAI Chat Completions, but authenticated evidence for its optional roles, token fields, reasoning controls, image input, and tool calling is not always available when a release is assembled.

## Decision

The base composition declares the `metis` route through `dsh-llm-pi-ai` and selects `metis/metis-coder-max` as the default Agent route. The profile owns the deployment endpoint, keeps it replaceable through a profile patch or Models settings, and stores only the `METIS_API_KEY` credential reference. Normal credential precedence remains launch environment, the private managed credential file, project `.env`, then harness-home `.env`. User settings merge additional provider routes and model entries into the same adapter.

The declared model has a 1,000,000-token context window. Until an authenticated compatibility run proves broader support, the request profile uses the conservative OpenAI Chat Completions subset: system prompts remain `system`, output caps use `max_tokens`, reasoning fields and streaming usage options are omitted, strict tool-schema mode is disabled, and the model advertises text input only. Tool definitions and tool-result rounds remain enabled by the protocol. The unknown output capacity uses the adapter's descriptive fallback and is not injected as a request cap.

The native `dsh-llm-deepseek` row remains installed and addressable by later profile patches but is disabled in the base composition, removing its models and credential prompt from the default active route set. DeepSeek-backed web search and opt-in session contribution remain separate capabilities with separate configuration.

Deterministic tests execute the Metis profile against a scripted OpenAI Chat Completions server for streaming text, multi-turn history, one and sequential tool calls, prompt-constrained JSON, timeout, cancellation, and error mapping. A separate `METIS_API_KEY` and `METIS_BASE_URL` gated suite exercises streaming, multi-turn, tool calls, and JSON against the deployed gateway. Reports distinguish deterministic protocol evidence from authenticated deployment evidence.

## Alternatives considered

**Modify the native DeepSeek adapter to speak for Metis.** Rejected because the company route is a hand-declared OpenAI-compatible provider, while changing the native adapter would entangle unrelated endpoint and model assumptions and remove the existing independent implementation.

**Assume optional gateway capabilities from the model name.** Rejected because role, reasoning, image, strict-schema, and token-field compatibility belong to the deployed HTTP endpoint. Conservative declarations prevent the application from sending fields or content that the gateway has not accepted.

**Put the token or a fixed endpoint constant in TypeScript.** Rejected because credentials require the credential seam and deployment addresses belong to composition. A profile-level default plus environment override keeps both outside adapter source.

**Remove DeepSeek packages and UI code.** Rejected because optional search, contribution, custom profiles, and downstream compositions still consume them. Disabling the base adapter changes the default product posture without breaking those dependencies.

## Consequences

- Base-backed Web, headless, SDK, and ACP entry points resolve Metis by default; ACP carries the same explicit route.
- A missing `METIS_API_KEY` fails requests through the standard missing-credential diagnostic instead of falling back to another provider.
- Users can save the Metis token through Models settings or supply it through supported environment layers, and can add custom routes without rebuilding.
- Developer-role messages, reasoning parameters, image input, native strict JSON schema, and `max_completion_tokens` remain unavailable until authenticated evidence supports a deliberate profile change.
- Protocol-level compatibility is continuously tested without secrets; deployment compatibility remains visibly pending when the credential-gated suite cannot run.
