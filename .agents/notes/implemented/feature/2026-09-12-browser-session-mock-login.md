# Agent Note: Browser-session mock login

Status: implemented

English | [中文](2026-09-12-browser-session-mock-login.zh.md)

## Problem

The Web application needs an entry step before the main workspace while the production identity service and its authorization protocol do not yet exist. Mounting the complete workspace behind an unimplemented form would make the visual flow misleading if the form claimed to protect server resources.

## Decision

The root layout owns a localized mock login and does not mount the three-column application frame until it succeeds. The form accepts the exact username `simon` after trimming whitespace and accepts every password, including an empty value. Success is retained in `sessionStorage`, so it survives a refresh in the same browser tab but does not become a cross-tab or durable identity.

The browser test scaffold can request the same public mock identity through the `#dsh-mock-login=simon` fragment. The gate consumes and removes that fragment before mounting the application, which keeps unrelated browser scenarios focused on their owning behavior without adding another authentication mechanism.

The page labels itself as demo authentication and states that the production identity service is pending. The component contract and package documentation explicitly state that it provides no server-side authentication or authorization. Replacing it requires a server-verified session and an application bootstrap decision; production credentials never belong in this component.

## Alternatives considered

**Store a mock login in durable settings or local storage.** Rejected because the placeholder must not resemble a durable account session or leak between tabs. Tab-scoped storage keeps its limited lifetime visible.

**Mount the application behind the form and hide it with CSS.** Rejected because hidden controls and effects would still run before login and could initiate requests. Conditional mounting gives the placeholder a clear lifecycle boundary.

**Implement a fake server token.** Rejected because it would create a second temporary authentication protocol and migration burden without providing real identity assurance.

## Consequences

- Every fresh browser tab starts at the login page; `simon` enters with any password.
- Application services represented below the root React frame do not mount until the mock login succeeds, while Host services remain unchanged.
- The UI is localized, responsive, theme-token based, keyboard-operable, and announces an invalid username as an alert.
- The placeholder does not protect data and must not be described or deployed as a security control.
