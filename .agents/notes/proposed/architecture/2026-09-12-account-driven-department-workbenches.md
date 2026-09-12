# Agent Note: Account-driven department workbenches

Status: proposed

English | [中文](2026-09-12-account-driven-department-workbenches.zh.md)

## Problem

SugarWork needs one company application in which a signed-in account enters the workbench assigned by its primary department. The shared shell remains stable, while navigation, home content, agent guidance, available tools, and business-data access vary by department and role. The MVP gives an ordinary user one primary department and no workbench selector, but the stored model must admit additional memberships later.

The current browser entry screen is not authentication: [`LoginGate`](../../../../packages/client/ui-layout/src/client/LoginGate.tsx) records a tab-local `sessionStorage` flag and does not read the displayed account or password. This behavior is deliberate for the current account-free product ([mock-login note](../../implemented/feature/2026-09-12-browser-session-mock-login.md), [simplification note](../../implemented/simplification/2026-09-12-account-free-workspace-entry.md)). Browser launch-token authentication protects the whole local Host API but proves no company account, department, or role ([design](../../implemented/architecture/2026-08-24-browser-token-authentication.md)). Neither mechanism can authorize managed business data.

Session creation currently accepts an optional `agentPreset` from the Remote request, and Session list, search, restore, follow, fork, and event streams operate without an account-and-department scope. Presets already persist in Session headers and restore exact per-Session composition ([design](../../implemented/architecture/2026-08-03-per-session-agent-presets.md)), but the caller can still influence the selection. A managed deployment must instead resolve the preset on the server and must prevent every direct identifier path from crossing an ownership boundary.

The existing `Workspace` domain means a local filesystem directory and groups Sessions by `cwd`. Reusing it for an organization department would merge unrelated meanings and break current local behavior. This proposal introduces Department Workbench as a separate product concept and keeps every existing Workspace API and persistence meaning intact.

## Proposal

After authentication, the server resolves the active user, primary department, membership, role, feature set, department policy, and agent preset. One authenticated bootstrap response describes only client presentation. Session creation and every business operation independently use the server-owned principal and policy.

```text
authenticated account
  -> active user + primary department + active membership + role
  -> department feature set + home panel
  -> server-selected agent preset
  -> Session(userId, departmentId, agentPreset)
  -> policy-constrained tools and data
```

The design has three independent controls. The Feature Set controls what registered client capabilities are visible. The agent preset controls the persona, skills, and tool schemas presented to the model. `DepartmentPolicy` controls whether a business operation may execute and which records its provider may read or mutate. The first two improve presentation and model behavior; only the third is an authorization control.

### Existing foundations and required changes

| Surface | Reuse | Required change |
|---|---|---|
| LoginGate | Keep the local account-free entry behavior in local profiles | A managed profile replaces it with real sign-in and authenticated bootstrap; the password is never handled by the mock gate |
| Browser authentication | Keep authority, Origin, Fetch Metadata, signed-cookie, and WebSocket checks | Add a managed account provider and carry an authenticated principal through HTTP and WebSocket request scope |
| [Session Controller](../../../../packages/api/session-controller/README.md) | Keep the lifecycle and command ownership | Require an explicit server-derived Session access scope for every create, read, mutation, resume, and stream operation |
| Remote Gateway | Keep Typert endpoint registration and transport dispatch | Add exact Fetch handlers for managed sign-in and sign-out, expose authenticated `app.bootstrap`, and propagate the principal without accepting client identity claims |
| Agent Presets | Keep host registries, scoped per-Session composition, and the durable header field | Resolve the department preset on the server; omit user selection and authoring from ordinary managed profiles |
| Skill Registry | Keep scoped registry merging | Register company skills globally and department skills only inside the selected preset |
| UI Slots | Keep typed, effect-owned extension points | Add a Department Feature Registry that materializes only bootstrap-enabled slot contributions; slots remain composition, not authorization |
| Storage Domain | Keep typed domain persistence | Store the MVP organization directory as one versioned, atomically replaced global document until a transactional provider exists |
| [Session Query](../../../../packages/session-query/session-query/README.md) | Keep the derived cross-Session index | Index and filter `userId` and `departmentId` before search, ordering, or pagination |
| Workspace | Keep local-directory identity and `cwd` grouping unchanged | Introduce distinct Department and Department Workbench names, services, routes, and persistence |

## Domain model

Identifiers crossing package boundaries are branded. The persisted records use stable identifiers rather than names, and deployment validation resolves every reference before serving traffic.

```ts
export {}

type Branded<T, Name extends string> = T & { readonly __brand: Name }
type UserId = Branded<string, 'UserId'>
type DepartmentId = Branded<string, 'DepartmentId'>
type MembershipId = Branded<string, 'MembershipId'>
type RoleId = Branded<string, 'RoleId'>
type FeatureSetId = Branded<string, 'FeatureSetId'>
type FeatureId = Branded<string, 'FeatureId'>
type NavigationItemId = Branded<string, 'NavigationItemId'>
type AgentPresetId = Branded<string, 'AgentPresetId'>
type PanelId = Branded<string, 'PanelId'>
type DepartmentPolicyId = Branded<string, 'DepartmentPolicyId'>
type DepartmentActionId = Branded<string, 'DepartmentActionId'>
interface DepartmentDataScope { kind: string; resource: string }

type AccountStatus = 'active' | 'disabled'
type DepartmentStatus = 'active' | 'disabled'
type MembershipStatus = 'active' | 'disabled'
type RoleKind = 'member' | 'administrator'

interface UserProfile {
  id: UserId
  name: string
  status: AccountStatus
  primaryDepartmentId?: DepartmentId
}

interface DepartmentDefinition {
  id: DepartmentId
  name: string
  status: DepartmentStatus
  featureSetId: FeatureSetId
  agentPresetId: AgentPresetId
  homePanelId: PanelId
}

interface Membership {
  id: MembershipId
  userId: UserId
  departmentId: DepartmentId
  roleId: RoleId
  status: MembershipStatus
}

interface Role {
  id: RoleId
  name: string
  kind: RoleKind
}

interface FeatureSet {
  id: FeatureSetId
  features: readonly FeatureId[]
  navigation: readonly NavigationItem[]
}

interface NavigationItem {
  id: NavigationItemId
  featureId: FeatureId
  panelId: PanelId
}

interface DepartmentPolicy {
  id: DepartmentPolicyId
  departmentId: DepartmentId
  roleId: RoleId
  actions: readonly DepartmentActionId[]
  dataScopes: readonly DepartmentDataScope[]
}
```

The organization directory enforces these invariants at load and replacement time:

- A `(userId, departmentId)` pair has at most one Membership.
- An ordinary active user has exactly one active Membership matching `primaryDepartmentId` in the MVP. Additional non-primary memberships may be stored but are not selectable.
- Every Department references an existing Feature Set, agent preset, home panel, and policy coverage for its allowed roles.
- A disabled account or Department cannot produce an active workbench. A missing primary Department produces the configured-workbench error instead of choosing a default.
- An administrator is an active member of a dedicated administration Department whose Feature Set, preset, home panel, and policies follow the same invariants. Administration is not a bypass around Session ownership.

The first storage-backed provider persists an `OrganizationDirectoryV1` global through [`storage-domain`](../../../../packages/storage/storage-domain/README.md). One validated document makes cross-record replacement atomic with the storage behavior available today. A later SQL provider may normalize the records without changing the Service Definition or its consumers.

The account directory, account authentication, and department authorization are complete capability seams: each has a Service Definition, a provider, and named consumers. The existing anonymous installation identifier, credential authorization flows, and permission presets are not company identity or business authorization and are not reused for these roles.

## Authentication and bootstrap

Managed authentication issues an opaque, random server-session cookie. The cookie maps to a server-side login record; it does not embed role, department, preset, or feature claims. Each request resolves or revalidates the current account state so account disablement, membership changes, and logout take effect without trusting stale client claims. The current launch-token provider remains available for local profiles and maps to reserved local user and Department identifiers.

The connection layer authenticates once at the transport edge and establishes a request principal. BFF handlers may read that transport scope, but reusable services receive an explicit `SessionAccessScope` or `DepartmentAccessRequest`; authorization must not depend on an unobservable ambient value below the BFF. A WebSocket binds one principal to its connection generation and closes or refuses further delivery after logout, account disablement, or authority rotation.

The client fetches one bootstrap after login or reconnect:

```ts
export {}

type Branded<T, Name extends string> = T & { readonly __brand: Name }
type UserId = Branded<string, 'UserId'>
type DepartmentId = Branded<string, 'DepartmentId'>
type RoleId = Branded<string, 'RoleId'>
type FeatureId = Branded<string, 'FeatureId'>
type NavigationItemId = Branded<string, 'NavigationItemId'>
type PanelId = Branded<string, 'PanelId'>
type RoleKind = 'member' | 'administrator'

interface NavigationItem {
  id: NavigationItemId
  featureId: FeatureId
  panelId: PanelId
}

interface AppBootstrap {
  user: {
    id: UserId
    name: string
    role: { id: RoleId; name: string; kind: RoleKind }
  }
  department: {
    id: DepartmentId
    name: string
    homePanelId: PanelId
  }
  features: readonly FeatureId[]
  navigation: readonly NavigationItem[]
}
```

`AppBootstrap` deliberately omits `agentPresetId`, tool grants, data scopes, filesystem roots, and policy records. Navigation entries contain stable identifiers only; feature plugins own localized labels and icons. The client caches bootstrap for the current authenticated connection generation and refetches it after sign-in, reconnect, explicit account refresh, or an invalidation event.

Resolution has explicit outcomes:

- A missing primary Department or Membership returns `account/workbench-unconfigured`, rendered as “Account workbench is not configured yet.”
- A disabled account rejects authentication; a disabled Department returns `department/disabled` and cannot open the application.
- Multiple active candidates or a mismatched primary Membership fail as deployment-data errors. The server never guesses.
- A future switcher submits a target Department identifier only to an endpoint that verifies an active Membership and issues a new bootstrap context. It does not change any existing Session owner.

## Session ownership and preset selection

The next adjacent Session format adds required branded `userId` and `departmentId` fields to `SessionHeader`. The existing durable `agentPreset` field is the resolved `agentPresetId`; duplicating it under a second name would create two authorities. Because required header fields are a structural change and the current format is released, implementation creates the next version and an adjacent migration package without modifying any committed predecessor ([migration rule](../../implemented/architecture/2026-08-31-released-session-format-migrations.md), [release status](../../../../docs/session-format-status.md)).

For existing local Sessions, the adjacent migration writes reserved local user and Department identifiers. Local profiles continue to resolve that reserved principal, while managed account providers reject the reserved namespace. This preserves local history without accidentally granting historical Sessions to the first company account that signs in.

Managed `session.create` accepts no user, Department, role, preset, Feature Set, or data-scope input. It resolves the authenticated principal, primary active Membership, Department, and `agentPresetId` in one server operation and writes them into the initial header. Local profiles may retain their existing Workspace and preset inputs through a separate composition; the managed controller rejects those fields instead of silently ignoring them.

Session ownership is immutable. Current role and DepartmentPolicy are evaluated on access and execution rather than copied into the Session as authority. Consequently, revoking a Membership immediately blocks the Session without rewriting its log, while restoring an allowed Session still reconstructs the exact preset recorded at creation.

All access paths apply exact `userId + departmentId` filtering before returning metadata, content, or existence:

- list, search, inspect, page, follow, resume, prompt, interrupt, archive, export, attachment, and Session-linked file operations;
- control events, Remote forwarded events, and WebSocket subscriptions;
- Session Query indexes, full-text candidate selection, ordering, and pagination;
- fork, delegation, and continuable child restoration.

An unauthorized identifier returns the same `session/not-found` result as an absent identifier. Forks and subagents inherit `userId`, `departmentId`, and `agentPreset` exactly; callers cannot override them. A future cross-department transfer creates a new Session under an explicitly activated Membership and does not mutate history.

## Presets, skills, and tools

The existing layered Skill Registry already supports global providers plus a scoped provider inside a preset ([registry](../../../../packages/skill/skill/README.md), [filesystem provider](../../../../packages/skill/skill-filesystem/README.md), [standard preset](../../../../packages/preset/agent-presets/presets/standard/agent.cordis.yml), [Cordis preset](../../../../packages/preset/agent-presets/presets/cordis/agent.cordis.yml)). Managed deployments use that mechanism directly:

```text
department agent
  = company skills
  + department skills
  + department persona
  + department tool schemas
```

Company skills are registered once by the deployment. A Department preset mounts only that Department's `customSkillDirs`; managed presets set `includeDefaultRoots: false` so project and personal filesystem skills do not enter a company agent accidentally. Deployment validation rejects duplicate skill names across the company and Department catalogs. A future deliberate override needs an explicit manifest rule rather than relying on registry precedence.

The Department selects a company-maintained preset. Ordinary managed profiles omit the preset selector and preset authoring UI, and the Remote create request cannot name a preset. Changing a Department definition affects new Sessions only; existing Sessions restore their recorded preset. A Department-wide preset should not be duplicated per role unless the model-visible persona or tool schemas truly differ; role-specific data access belongs to DepartmentPolicy.

A skill is model guidance, not permission. Exposing a CRM tool schema in the sales preset lets the model request the operation; it does not authorize the operation or grant access to every customer record.

## Department Feature Registry

[`ui-slots`](../../../../packages/client/ui-slots/README.md) remains the mechanism by which client plugins contribute the shared shell, panels, overlays, and right-side content. A new browser-side Department Feature Registry groups those contributions under stable `FeatureId` values. Each feature definition owns its localized label keys, icon, navigation target, main panels, optional right panels, and required dependencies.

Bootstrap provides an ordered list of enabled feature and navigation identifiers. The registry validates that every identifier and `homePanelId` exists, that a navigation target belongs to an enabled feature, and that dependencies are satisfied. Unknown or inconsistent references fail visibly as deployment errors. The router and panel controller refuse direct navigation to a registered but disabled panel.

Common features register Dashboard, AI Agent, messages, and settings. Sales, marketing, and later departments register independent feature bundles. The shell renders the same brand and frame while the enabled bundle changes the core area. Static client copy remains locale-owned; the server sends user and Department names as data, not translated menu strings.

Feature filtering is not a security check. Direct Remote calls, tool execution, exports, and data-provider queries remain protected when no UI is present.

## DepartmentPolicy and data access

`DepartmentPolicy` is distinct from sandbox/approval permission presets and from credential authorization. Its Service Definition accepts an authenticated principal plus a server-owned action and resource description and returns either denial or mandatory provider constraints:

```ts
export {}

type Branded<T, Name extends string> = T & { readonly __brand: Name }
type UserId = Branded<string, 'UserId'>
type DepartmentId = Branded<string, 'DepartmentId'>
type DepartmentActionId = Branded<string, 'DepartmentActionId'>
type DepartmentResourceKind = Branded<string, 'DepartmentResourceKind'>
type DepartmentDenialReason = Branded<string, 'DepartmentDenialReason'>
interface DepartmentDataConstraint { field: string; value: string }

interface DepartmentAccessRequest {
  userId: UserId
  departmentId: DepartmentId
  action: DepartmentActionId
  resource?: { kind: DepartmentResourceKind; id?: string }
}

type DepartmentAccessDecision =
  | { allowed: true; constraints: readonly DepartmentDataConstraint[] }
  | { allowed: false; reason: DepartmentDenialReason }
```

Every business Tool and Remote API consumer calls this service inside its execution path. The CRM or order provider compiles returned constraints into mandatory `departmentId`, ownership, territory, or assigned-record predicates. A client or model may submit a customer or order identifier, but it never supplies the authoritative Department predicate and cannot widen the returned constraints. List and search providers apply constraints before pagination and aggregation, not after fetching a cross-Department result.

The preset may hide tools that no role in the Department can use, and a request composer may omit role-denied schemas from the next model request to reduce futile calls. The executor remains the final authority because Session history, stale model output, direct API clients, and configuration mistakes can still request a hidden operation. Any model-visible change to available tools must remain reconstructable from logged Session facts under the repository's model-visible/logged rule.

## Migration and delivery sequence

1. **Organization model and provider.** Add branded identifiers, the account-directory Service Definition, the versioned storage-backed provider, validation, and deployment configuration for UserProfile, Department, Membership, Role, FeatureSet, and DepartmentPolicy. Seed the reserved local principal separately from managed company data.
2. **Managed authentication and bootstrap.** Add the account authentication provider, principal propagation, sign-in/sign-out endpoints, authenticated `app.bootstrap`, explicit failure UI, and managed replacement for LoginGate while retaining the local profile.
3. **Session ownership.** Add the adjacent Session format and migration, durable ownership fields, scoped Session Query indexes, server-selected preset creation, authorization on every Session path and stream, and exact fork/subagent inheritance. Update both SDK projections and expected outputs where the Session lifecycle changes.
4. **Skill and policy composition.** Register company skills globally, add Department preset skill roots, validate catalog collisions, implement DepartmentPolicy consumers, and enforce constraints in the first business Tool and Remote provider.
5. **Feature-driven workbench shell.** Add the Department Feature Registry, bootstrap-driven navigation and home panel, disabled-route handling, locale-owned copy, and common feature bundle.
6. **Sales MVP.** Add the sales Feature Set, preset, persona, skills, CRM/order policy adapters, pages, snapshots, and browser evidence as a separate implementation change.
7. **Marketing validation.** Add marketing activities, content, campaign, and lead features to prove the architecture has no sales-specific assumptions. Defer the visible multi-Department switcher until this validation identifies its concrete interaction requirements.

Each non-trivial implementation slice carries its own Agent Note or advances this proposal before merge, updates affected README and JSDoc contracts, and runs the smallest checks selected by the repository pre-push workflow.

## Test strategy

- **Organization data:** schema and reference validation; unique Membership pairs; missing, inactive, and mismatched primary Departments; disabled accounts and Departments; administrator workbench; retained non-primary Memberships with no selector.
- **Authentication:** valid and invalid login, opaque cookie attributes, logout and revocation, Origin and Fetch Metadata rejection, WebSocket principal binding, disabled-account disconnect, and unchanged local launch-token behavior.
- **Bootstrap and UI:** one request per authenticated connection generation; reconnect/invalidation refresh; unknown features, panels, and dependencies fail visibly; direct disabled-panel URLs fail; common shell plus sales and marketing fixture compositions; locale-key coverage.
- **Sessions:** adjacent-format migration to reserved local ownership, predecessor immutability, round-trip header codec, query schema upgrade, and isolation between two users in one Department and one user in another Department across every metadata, content, stream, export, attachment, restore, and mutation path.
- **Forks and subagents:** exact ownership and preset inheritance, rejected overrides, continuable child restoration, and no cross-Department event delivery.
- **Presets and skills:** server selection, managed request rejection for `agentPreset`, global-plus-Department merge, absence of project/user roots, collision validation, and stable restoration after a Department changes its preset.
- **Policy and providers:** allowed action, role denial, inactive Membership, required Department/owner constraints, direct Tool and Remote bypass attempts, scoped pagination and aggregation, and executor denial when a schema is stale or hidden.
- **Product evidence:** focused unit and integration tests, keyless recorded-Session snapshots for changed model-visible behavior, real composed-profile browser tests for the workbench, and both TypeScript and Python expected outputs when their Session projections change.

## Alternatives considered

**Let users choose a Business Space after login** — rejected for the MVP. The primary Department is account configuration, so a selector creates an unauthorized choice and additional empty state. Multiple memberships remain stored for a later explicit, server-validated switcher.

**Reuse Workspace for Department** — rejected. Workspace is a local filesystem directory and a `cwd` grouping; changing that meaning would couple organization authorization to host paths.

**Copy common skills into every Department** — rejected. Copies drift and make one company guidance change a multi-directory migration; scoped registry composition already provides sharing.

**Trust client Feature Set or preset input** — rejected. A client can be stale or malicious, so bootstrap is output-only and Session creation resolves the preset from server data.

**Use UI visibility as authorization** — rejected. Direct API, tool, restored Session, and stale model paths bypass the UI.

**Persist role and policy grants as Session authority** — rejected. Membership and policy changes must revoke access immediately; the Session records identity, Department, and model composition, while current policy owns execution.

**Use the browser launch token or anonymous installation identifier as a company account** — rejected. They identify local Host authority or an installation, not a human user or organization membership.

**Normalize organization records into separate storage-domain tables immediately** — not chosen for the MVP because the current facility does not provide a cross-table transaction. One versioned directory document gives atomic reference validation; normalization waits for a provider that preserves that property.

## Acceptance criteria

- An ordinary managed account reaches exactly one server-selected active Department workbench without a selector and receives a stable common shell plus its enabled feature bundle.
- Unconfigured and disabled states produce explicit outcomes; an administrator uses a defined administration Department rather than bypassing the model.
- The browser cannot select or modify `agentPresetId`, policy constraints, Department identity, or tool grants.
- Every current-format Session has immutable `userId`, `departmentId`, and resolved `agentPreset`; all Session reads, search, streams, restore, fork, and child operations enforce exact ownership.
- Company and Department skills compose without copies, while every business Tool and provider enforces current DepartmentPolicy constraints independently of the model and UI.
- Existing local Workspace semantics and account-free local profiles remain supported through their own composition.
- Sales can ship as the first feature bundle without embedding sales assumptions in authentication, Sessions, the shared shell, or the Feature Registry; marketing can be added through data and plugin registration.

## Risks

- **Incomplete Session consumer migration could leak metadata or events.** Maintain one inventory covering Session Controller, Session Query, control streams, Remote event forwarding, uploads, exports, Session-linked files, forks, subagents, and both SDKs; isolation tests use colliding titles and identifiers across principals.
- **Long-lived connections could outlive revocation.** Bind a principal to a connection generation, revalidate on protected operations, and terminate delivery on logout, disablement, or authority rotation.
- **Feature registration could be mistaken for enforcement.** Keep denial tests at Tool, Remote API, and provider layers with the feature enabled, disabled, and called without the browser.
- **One global organization document will eventually limit concurrent administration.** The MVP favors atomic consistency and a small deployment; the Service Definition keeps a later transactional SQL provider replaceable.
- **Department configuration can drift from plugins or presets.** Validate every Feature, panel, preset, skill catalog, role, and policy reference before the server becomes ready.
- **Role changes can alter model-visible tool schemas mid-Session.** Treat executor policy as authoritative, make request-time schema filtering deterministic and logged, and test restoration across a policy change.
