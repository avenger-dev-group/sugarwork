---
description: "Server-resolved application bootstrap Remote and its observable browser state adapter."
kind: "package-reference"
---
# App Bootstrap

English | [中文](README.zh.md)

## Summary

`@deepseek-ai/dsh-api-app-bootstrap` projects the authenticated account's department workbench into one client-safe bootstrap response. Preset ids, policies, and data scopes remain on the Host.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="use-this-package"></a>
## Use this package

The Host registers `appBootstrap.get`; the Client provides `ctx.appBootstrap` with coalesced loading, caching, error state, and an `app-bootstrap/ready` event. Login surfaces invoke the method without sending an account, department, role, or preset selector.

<a id="model-experience"></a>
## Model Experience

None, as bootstrap controls browser presentation and exposes no model-visible input.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Authentication transport is deferred; the active mock provider chooses the account.
- Session ownership is introduced by the next released Session format rather than changing committed generations.

<a id="dev-note"></a>
### Dev Note

None.

**Runtime invariant:** No companion is published; Typert validates the generated Remote descriptors and the provider validates organization state.
