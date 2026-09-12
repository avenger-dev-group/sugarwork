# Agent Note: Account-free workspace entry

Status: implemented

English | [中文](2026-09-12-account-free-workspace-entry.zh.md)

## Problem

The workspace needs a recognizable account-and-password entry screen while its production identity service is absent. Display fields must not imply that credentials are validated or create a fixed account.

## Decision

The welcome screen presents account and masked password fields with a blue Enter workspace button. Empty and arbitrary values enter equally; the submit handler reads neither input and stores no credentials. A tab-scoped boolean retains entry across reloads. The centered layout keeps the form usable on small screens.

This replaces the fixed-account form described by the [browser-session entry note](../feature/2026-09-12-browser-session-mock-login.md). That note retains ownership of conditional application mounting and the separation from Host authorization. Browser automation uses an identity-free fragment.

## Alternatives considered

**Validate a shared username.** Rejected because a fixed demo account adds a restriction without providing authentication.

**Remove the account and password inputs.** Rejected because the requested design retains the familiar login presentation before authentication is connected.

## Consequences

No user identity is stored or validated by the welcome screen. Real sign-in requires a server-verified identity service before these fields participate in authentication.

Component tests cover empty and arbitrary inputs, absence of stored credentials, and tab-state restoration; the assembled browser scenario records the localized screen and verifies keyboard entry, reload, and narrow viewport geometry.
