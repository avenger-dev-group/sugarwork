---
description: "Sales navigation, common-Dashboard contributions, and mock business panels."
kind: "package-reference"
---
# @deepseek-ai/dsh-client-ui-sales-workspace

English | [中文](README.zh.md)

## Summary

Use this package to give a Sales department an existing-customer, order, call-log, and message workspace. It adds Sales schedule, attention counts, and prioritized actions to the shared Dashboard. Its records are mock presentation data and do not grant CRM or communication access.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the plugin beside the department-workbench feature registry, then enable `sales-workspace` and its panel ids in the Host-produced Bootstrap.

### When to choose it

Choose this package for the Sales feature set. Keep shared employee, attendance, and AI presentation in `ui-department-workbench`; use a separate feature package for another department.

### Minimal configuration

```yaml
- id: ui-sales-workspace
  name: '@deepseek-ai/dsh-client-ui-sales-workspace'
```

The package has no configuration fields. The Host Bootstrap enables its `customers`, `orders`, `calls`, and `messages` panel ids.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The package registers one department feature. Its mount callback contributes four keyed main panels and four sidebar rows, then fills the Dashboard-owned agenda, metric, and task slots. Deactivating the feature disposes those contributions together.

| File | Role |
|---|---|
| [`src/client/index.ts`](src/client/index.ts) | Registers the feature and Slot contributions |
| [`src/client/SalesWorkspace.tsx`](src/client/SalesWorkspace.tsx) | Renders Dashboard cards and Sales panels |
| [`src/client/locales.ts`](src/client/locales.ts) | Owns English and Chinese product copy |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [UI Department Workbench](../ui-department-workbench/README.md) — feature activation and Dashboard Slot ownership.
- [Web Client Slots](../../../docs/subsystems/slots.md) — lifecycle and cross-package UI composition.
- [Web Client architecture](../../../docs/subsystems/web-client.md) — browser feature package boundaries.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package changes browser navigation and Sales presentation only.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

The package currently demonstrates navigation and page composition rather than a live Sales system.

- Customer, order, call, message, meeting, and task records are presentation-only mock data; no CRM or communication Tool is mounted.
- Dashboard counts do not refresh from a Host projection.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>

**Runtime invariant:** No companion is published; the department feature registry validates every enabled panel before this package mounts its Slot contributions.
