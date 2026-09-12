---
description: "Validated in-memory department-workbench provider for development deployments."
kind: "package-reference"
---
# Department Workbench Mock

English | [中文](README.zh.md)

## Summary

`@deepseek-ai/dsh-department-workbench-mock` supplies a validated in-memory organization directory and a deployment-selected current account. It lets the common platform run before a production identity service exists.

## Table of Contents

- [Use this package](#use-this-package)
- [Configuration](#configuration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="use-this-package"></a>
## Use this package

Configure users, departments, memberships, roles, feature sets, and policies as one snapshot. Load fails for duplicate or dangling references. The browser cannot choose `currentUserId`.

<a id="configuration"></a>
## Configuration

The generated [configuration catalog](../../../docs/config-catalog.md) lists all fields.

<a id="model-experience"></a>
## Model Experience

None, as this provider does not alter model input.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The directory is static for one process and represents only one current account.

<a id="dev-note"></a>
### Dev Note

None.

**Runtime invariant:** No companion is published; constructor validation owns all internal references.
