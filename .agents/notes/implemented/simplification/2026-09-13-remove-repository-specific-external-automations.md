# Agent Note: Remove repository-specific external automations

Status: implemented

English | [中文](2026-09-13-remove-repository-specific-external-automations.zh.md)

## Problem

The copied repository workflow set assumed access to two externally owned systems: a protected Cloudflare Pages project for per-PR previews and the `deepseek-harness` organization's Issue Project. Each pull request attempted to use credentials and resources that `avenger-dev-group/sugarwork` does not own, so unrelated product changes received failing checks before their own validation completed.

The Issue automation encoded a formal planning process: PR metadata validation, audit comments, Project membership, Priority and Start Date fields, and review-driven Status transitions. The repository does not use that process. The preview workflow likewise built and published the complete browser-worker image even though this repository does not maintain the Cloudflare project or require hosted PR previews.

## Decision

The repository has no Cloudflare PR-preview workflow and no GitHub App-backed Issue or Project automation. It contains no external-service configuration for those workflows, no policy implementation or tests, and no root gate entries that execute them.

Issue and pull-request templates remain as optional contributor guidance. GitHub's native Issue, pull-request, label, and Project controls are operated manually. Existing remote Cloudflare deployments and GitHub Project data are outside the repository and are not modified by this removal.

The removal consolidates the implemented decisions for event-directed review status, Project-local planning fields, and hosted preview sizing. Their useful trade-offs remain here as reintroduction conditions: a future status projection must preserve human status overrides and model review handoffs explicitly; Project planning fields need one declared owner rather than mirrored values; and a hosted preview needs a repository-owned deployment target, access policy, credentials, and fresh runner measurements.

## Verification

Repository search finds no Cloudflare preview, Issue-policy credential, Issue lifecycle, Project-policy implementation, or removed gate name. The surviving CI workflow tests load only existing workflows, documentation checks validate the active Agent Note tree, and the package dependency policy remains independent of these process removals.

## Alternatives considered

**Retarget both systems and configure credentials.** A repository-owned GitHub App and Cloudflare project could make the workflows operational, but the team does not require either automation and would inherit their permission, maintenance, and failure obligations.

**Skip each workflow when credentials are absent.** Conditional skips avoid red checks but retain dormant code, tests, and documentation with no operational owner.

**Replace the GitHub App with a personal access token.** A personal token would attach automation to one user and still impose an unwanted Issue process. It also weakens the short-lived, installation-scoped identity the deleted workflow was designed to use.

**Keep a read-only PR policy using `GITHUB_TOKEN`.** This avoids Project write credentials but still enforces Issue references and repository-specific labels that the team does not require.

## Consequences

Pull requests do not publish hosted previews or fail because Cloudflare, GitHub App, or Project credentials are absent. Issues do not move automatically between `Inbox`, `In progress`, `In review`, `Done`, and `No action`; no automation initializes planning dates, reconciles priority, removes labels, or writes audit comments.

The repository loses centralized enforcement of Issue-to-PR planning metadata. Reintroducing any part requires a current team owner, an explicit target organization or service, least-privilege credentials, and focused tests for the selected behavior rather than restoring the removed bundle wholesale.
