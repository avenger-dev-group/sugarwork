# Agent Note: Worker preview pi-ai catalog

Status: implemented

English | [中文](2026-09-13-worker-preview-pi-ai-catalog.zh.md)

## Problem

The browser Worker replaces Node-only `pi-ai` with a bundled compatibility module. The shipped Web profile configures a hand-declared Metis route, so `llm-pi-ai` calls the protocol and provider factories while its plugin activates. A compatibility module that rejects those catalog-construction calls prevents the whole preview tree from reaching its interactive page even though the preview sends no model request.

## Decision

The Worker compatibility module implements the catalog-only subset that `llm-pi-ai` uses to register and describe configured providers: structural protocol factories, provider construction, a mutable in-memory provider collection, model lookup, and reasoning-level description. Authentication, refresh, completion, streaming, and deferred-request operations remain named refusals. The real built-page preview test boots the composed Web profile through this subset and rejects as soon as the shell renders a terminal plugin-load error instead of waiting for the success milestone timeout.

## Alternatives considered

**Disable `llm-pi-ai` in the packed profile.** Rejected because the preview would stop exercising the same provider catalog and default-model composition that the shipped Web profile exposes.

**Bundle the complete `pi-ai` dependency and its cloud transports.** Rejected because the preview does not send real model requests, while the Node-only transport dependency tree would enlarge the Worker and imply capabilities that its host cannot support.

## Consequences

The browser preview can activate with Metis as the default configured route and can display its model metadata. A caller that attempts provider authentication, catalog refresh, or generation receives an immediate refusal naming `pi-ai`; the Worker does not silently simulate a response or claim real-provider support.
