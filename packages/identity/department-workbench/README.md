---
description: "Service Definition for server-resolved users, departments, memberships, roles, feature sets, and department policies."
kind: "package-reference"
---
# Department Workbench

English | [中文](README.zh.md)

## Summary

`@deepseek-ai/dsh-department-workbench` defines the Host service that resolves an authenticated account's primary department workbench and authorizes department operations. It is independent from the filesystem `Workspace` concept.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="use-this-package"></a>
## Use this package

Providers implement `resolveCurrent()` and `authorize()`. Consumers must use the returned identity and policy; browser-supplied department, role, preset, and data-scope values are never authoritative.

<a id="model-experience"></a>
## Model Experience

None, as the Definition registers no prompt, tool, or session event.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The MVP resolver exposes one primary department while the membership model permits later multi-department selection.

<a id="dev-note"></a>
### Dev Note

None.

**Runtime invariant:** No companion is published because providers own directory consistency and consumers receive one resolved result.
