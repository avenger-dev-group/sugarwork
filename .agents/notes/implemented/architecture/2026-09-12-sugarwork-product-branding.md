# Agent Note: Separate SugarWork product branding from DSH compatibility identifiers

Status: implemented

English | [中文](2026-09-12-sugarwork-product-branding.zh.md)

## Problem

The shipped Web and Desktop applications need one company product identity, while the existing npm package graph, configuration keys, profile names, wire identifiers, and provider adapters already use DSH or DeepSeek names. Renaming both sets together would turn a presentation change into an incompatible repository-wide migration, but leaving old artwork or product copy in customer-facing surfaces would present two product identities.

## Decision

SugarWork is the only product identity rendered by the shipped Web and Electron applications. The document title, sidebar, conversation welcome page, boot and recovery pages, menus, dialogs, installer and artifact names, PWA metadata, application icons, and model-visible product self-description use `SugarWork`. Brand marks use the company-provided blue artwork in development and release builds; the shell's blue `SW` fallback remains available only to compositions that omit the SugarWork brand package.

The Electron release identity is `com.aixvo.sugarwork` on macOS and Windows. Packaging rejects a different `DSH_DESKTOP_APP_ID` value. Both test and production updater origins remain deployment inputs through `DOWNLOAD_TEST_ORIGIN` and `DOWNLOAD_PROD_ORIGIN`; the object prefix is `_/sugarwork/desktop/stable/<target>/`.

The canonical product command is `sw`; the published CLI also retains `dsh` as a transition alias. New installations resolve product data from `$SW_HOME` and default to `~/.sw`, while `$DSH_HOME` remains a read-compatible explicit override. The private repository root is `@sugarwork-ai/sw-root`, and first-party Chat context-producer labels use the `@sugarwork-ai/sw-*` product namespace. Runtime package imports, build identities, durable Session producer IDs, remaining environment families, TypeScript and Python API names, and ACP protocol identifiers retain their compatibility names until a coordinated package migration. Provider-facing DeepSeek names continue to identify the selectable model service and never act as SugarWork product branding.

The existing `ui-brand-official` package name and `official` build-profile value remain compatibility identifiers. Its implementation supplies SugarWork marks and name to both sidebar and conversation slots whenever the package is mounted, so development and release builds use the same visible identity and the shipped composition contains no active DeepSeek product-brand occupant.

The optional repository badge skill now registers `sugarwork-badge`, installs SugarWork artwork and links to the company repository. Its historical npm package name remains an internal compatibility identifier. Outbound generic HTTP and model attribution use the `sugarwork` product token and the company repository URL; DeepSeek-specific wire header names remain protocol identifiers for that provider.

MIT licensing, third-party notices, and legally required copyright or attribution text remain intact and are not product-brand surfaces.

The SugarWork documentation site publishes only its localized product home pages while company documentation is rebuilt. The old user guide and development tutorial trees are deleted; repository-owned architecture, testing, package contracts, Agent Notes, licenses, and notices remain available to maintain the code. The default-branch CI uses GitHub-hosted runners, while real-provider E2E is an explicit repository opt-in so a missing external credential cannot present as a product build failure.

## Verification

Unit and Web acceptance tests pin the SugarWork title, welcome copy, PWA metadata, slot occupants, application identifier, artifact names, and configurable updater origins. Desktop development capture verifies the rendered shell and Web client together. A source audit of the product-facing application and client trees distinguishes remaining provider or compatibility identifiers from rendered product identity.

## Alternatives considered

**Rename every compatibility identifier in one mechanical pass.** This would break package consumers, profiles, environment configuration, persisted sessions, protocol peers, provider routing, and SDKs. The migration instead starts with canonical product-owned entry points and requires an owned npm scope before package identities change.

**Keep the upstream brand plugin and override only the application title.** The sidebar, welcome page, favicon, startup screen, installer, and application icon would still communicate another identity.

**Hard-code the production update host.** The company update service is not selected yet, so a configurable HTTPS origin preserves release validation without committing to an address.

## Consequences

Users see one SugarWork identity across Web, Desktop, CLI help, documentation, and release artifacts. New local data uses the SugarWork path, while explicit legacy home configuration continues to resolve. Maintainers must classify future occurrences by audience: product-facing copy and artwork use SugarWork, DeepSeek provider names remain provider labels, and implementation identifiers change only through an explicit compatibility migration.
