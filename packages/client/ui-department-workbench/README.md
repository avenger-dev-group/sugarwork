---
description: "Bootstrap-driven department feature registry and shared workbench Dashboard."
kind: "package-reference"
---
# UI Department Workbench

English | [中文](README.zh.md)

## Summary

`@deepseek-ai/dsh-client-ui-department-workbench` validates server-enabled client features, mounts their slot contributions, and provides the common department Dashboard with employee and attendance presentation.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="use-this-package"></a>
## Use this package

Feature plugins register stable feature ids, their owned panel ids, and a mount callback. Activation rejects missing features, duplicate panel ownership, invalid navigation, and an absent home panel before mounting any department surface. A client-plugin mount retains an already cached bootstrap and restores the workbench when every enabled feature registers again, without another server request or ready event. Department packages fill the Dashboard agenda, attention-metric, and task-list slots without importing this feature's runtime values.

<a id="model-experience"></a>
## Model Experience

None, as the package changes browser navigation and Dashboard presentation only.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Employee numbers, attendance events, and work schedules are presentation-only mock data until their Host service is introduced.

<a id="dev-note"></a>
### Dev Note

None.

**Runtime invariant:** No companion is published; activation validates feature and panel ownership synchronously.
