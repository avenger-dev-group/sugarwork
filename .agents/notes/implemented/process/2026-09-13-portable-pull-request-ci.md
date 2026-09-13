# Agent Note: Portable pull-request CI

Status: implemented

English | [中文](2026-09-13-portable-pull-request-ci.zh.md)

## Problem

Required pull-request jobs that name organization-owned larger runners remain queued when a repository has no assignment for those runner names. The aggregate verdict then cannot start even when every standard-hosted job succeeds. A separate real-provider check also treated the model's exact acknowledgement wording as correctness evidence, so a completed tool call with correct external effects could fail because the provider added explanatory text.

## Decision

The `ci.yml` Linux correctness jobs default to `ubuntu-24.04`, and the native Windows jobs default to `windows-2025`. The existing `DSH_CI_FAILOVER_LINUX` and `DSH_CI_FAILOVER_WINDOWS` selectors still accept `selfhosted` and `blacksmith`; Dependabot retains the standard-hosted fallback when a selector chooses the persistent self-hosted pool. Repository-specific larger-runner capacity is therefore optional rather than a prerequisite for a pull-request verdict.

Each job selects concurrency with the same runner selector that chooses its machine. Standard hosted jobs keep aggregate gates, coverage partitions, Vitest workers, artifact readers, and snapshots within their four-vCPU capacity. Self-hosted and Blacksmith jobs retain the wider concurrency budgets that match their selected machines.

The installed-wheel real Metis check requires each turn to complete after a model-requested tool call. It verifies file creation, the host-only challenge copy, source preservation, and session-log framing through external observations. The prompt still requests a sentinel acknowledgement, but provider-generated wording is not asserted; deterministic keyless SDK tests own exact final-response projection.

This decision supersedes only the default larger-runner selection described by the [CI failover runbook](2026-07-26-ci-failover-runbook.md) and the [native Windows CI decision](2026-08-08-native-windows-pull-request-ci.md). Their split job topology, platform coverage, optional failover routes, and trust rules remain in force. The [installed-wheel Python validation decision](../testing/2026-08-23-installed-python-wheel-black-box-ci.md) owns the external-effect checks.

## Alternatives considered

**Provision the inherited larger-runner names in every repository.** Rejected because required correctness evidence would depend on organization administration, paid capacity, and labels that repository code cannot verify.

**Disable the exhaustive `ci.yml` workflow and rely only on `sugarwork-ci.yml`.** Rejected because the shorter workflow does not replace per-file coverage, snapshot, artifact, and native Windows evidence.

**Retry until the model emits the exact sentinel or accept a sentinel substring.** Rejected because retries spend provider calls without changing the nondeterministic observation, while a substring still trusts the model's report instead of the files and log produced by the run.

## Consequences

Pull-request jobs can enter GitHub's standard hosted queues without repository-specific runner setup. Resource-proportional concurrency prevents standard machines from multiplying subprocesses beyond their CPU capacity, while cancellation, fail-fast behavior, and job timeouts continue to bound superseded or failed work. Optional self-hosted and Blacksmith routes retain higher parallel throughput when maintainers deliberately select them. Live-provider wording variation no longer creates a false failure, while missing credentials, incomplete turns, absent tool calls, incorrect bytes, source mutation, or an invalid session log still fail the check.
