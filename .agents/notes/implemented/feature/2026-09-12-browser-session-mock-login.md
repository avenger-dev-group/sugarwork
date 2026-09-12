# Agent Note: Browser-session mock login

Status: implemented

English | [中文](2026-09-12-browser-session-mock-login.zh.md)

## Problem

The Web application needs an entry step before the main workspace while the production identity service and its authorization protocol do not yet exist. Mounting the complete workspace behind an unimplemented form would make the visual flow misleading if the form claimed to protect server resources.

## Decision

The root layout owns a localized entry screen and does not mount the three-column application frame until the user enters. Entry is retained in `sessionStorage`, so it survives a refresh in the same browser tab without creating a durable identity. The [account-free entry decision](../simplification/2026-09-12-account-free-workspace-entry.md) replaces the fixed-account form.

The browser test scaffold can request the same workspace entry through the `#dsh-enter-workspace` fragment. The gate consumes and removes that fragment before mounting the application, which keeps unrelated browser scenarios focused on their owning behavior without adding another authentication mechanism.

The page identifies the form as a demo and states that the account and password are optional. The component contract and package documentation explicitly state that it provides no server-side authentication or authorization. Replacing it requires a server-verified session and an application bootstrap decision; production credentials never belong in this component.

## Alternatives considered

**Store a mock login in durable settings or local storage.** Rejected because the placeholder must not resemble a durable account session or leak between tabs. Tab-scoped storage keeps its limited lifetime visible.

**Mount the application behind the form and hide it with CSS.** Rejected because hidden controls and effects would still run before login and could initiate requests. Conditional mounting gives the placeholder a clear lifecycle boundary.

**Implement a fake server token.** Rejected because it would create a second temporary authentication protocol and migration burden without providing real identity assurance.

## Consequences

- A browser tab without an entry flag starts at the welcome screen; one click enters the workspace.
- Application services represented below the root React frame do not mount until the mock login succeeds, while Host services remain unchanged.
- The UI is localized, responsive, theme-token based, keyboard-operable, and keeps the entry action visible on narrow screens.
- The placeholder does not protect data and must not be described or deployed as a security control.
