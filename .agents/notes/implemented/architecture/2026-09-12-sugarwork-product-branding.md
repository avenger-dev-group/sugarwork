# Agent Note: Separate SugarWork product branding from DSH compatibility identifiers

Status: implemented

English | [中文](2026-09-12-sugarwork-product-branding.zh.md)

## Problem

The shipped Web and Desktop applications need one company product identity, while the existing npm package graph, configuration keys, profile names, wire identifiers, and provider adapters already use DSH or DeepSeek names. Renaming both sets together would turn a presentation change into an incompatible repository-wide migration, but leaving old artwork or product copy in customer-facing surfaces would present two product identities.

## Decision

SugarWork is the only product identity rendered by the shipped Web and Electron applications. The document title, sidebar, conversation welcome page, boot and recovery pages, menus, dialogs, installer and artifact names, PWA metadata, application icons, and model-visible product self-description use `SugarWork`. Brand marks use the company-provided blue artwork; local builds use a blue `SW` fallback instead of another company's logo.

The Electron release identity is `com.aixvo.sugarwork` on macOS and Windows. Packaging rejects a different `DSH_DESKTOP_APP_ID` value. Both test and production updater origins remain deployment inputs through `DOWNLOAD_TEST_ORIGIN` and `DOWNLOAD_PROD_ORIGIN`; the object prefix is `_/sugarwork/desktop/stable/<target>/`.

Compatibility identifiers remain unchanged when they identify implementation rather than product presentation. These include the `@deepseek-ai/dsh-*` package scope, `dsh` commands and environment variables, profile and storage paths, TypeScript and Python API names, session and ACP protocol identifiers, repository URLs, and DeepSeek model-provider names. Provider-facing DeepSeek names continue to identify the selectable model service and never act as SugarWork product branding.

The existing `ui-brand-official` package name and `official` build-profile value remain compatibility identifiers. Its implementation supplies SugarWork marks and name to both sidebar and conversation slots, so the shipped composition contains no active DeepSeek product-brand occupant.

MIT licensing, third-party notices, and legally required copyright or attribution text remain intact and are not product-brand surfaces.

## Verification

Unit and Web acceptance tests pin the SugarWork title, welcome copy, PWA metadata, slot occupants, application identifier, artifact names, and configurable updater origins. Desktop development capture verifies the rendered shell and Web client together. A source audit of the product-facing application and client trees distinguishes remaining provider or compatibility identifiers from rendered product identity.

## Alternatives considered

**Rename every DSH and DeepSeek identifier.** This would remove old strings from source but break package consumers, profiles, environment configuration, persisted sessions, protocol peers, provider routing, and SDKs without improving the visible product identity.

**Keep the upstream brand plugin and override only the application title.** The sidebar, welcome page, favicon, startup screen, installer, and application icon would still communicate another identity.

**Hard-code the production update host.** The company update service is not selected yet, so a configurable HTTPS origin preserves release validation without committing to an address.

## Consequences

Users see one SugarWork identity across Web and Desktop, and release artifacts carry the company application identifier and naming. Existing code and stored data keep their compatible DSH identifiers. Maintainers must classify future occurrences by audience: product-facing copy and artwork use SugarWork, DeepSeek provider names remain provider labels, and implementation identifiers change only through an explicit compatibility migration.
