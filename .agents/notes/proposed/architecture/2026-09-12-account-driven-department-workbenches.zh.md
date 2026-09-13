# Agent Note: 账号驱动的部门工作台

状态：提议

[English](2026-09-12-account-driven-department-workbenches.md) | 中文

## 问题

SugarWork 需要成为一个统一的公司应用：账号登录后直接进入其主部门所分配的工作台。共享应用框架保持稳定，导航、首页内容、agent 指导、可用工具和业务数据访问则随部门与角色变化。MVP 为普通用户设置一个主部门且不提供工作台切换器，但存储模型必须允许以后增加其他部门成员关系。

当前浏览器入口并不执行身份认证：[LoginGate](../../../../packages/client/ui-layout/src/client/LoginGate.tsx) 只记录标签页本地的 `sessionStorage` 标记，也不会读取界面上的账号或密码。这是当前无账号产品的既定行为（[模拟登录说明](../../implemented/feature/2026-09-12-browser-session-mock-login.zh.md)、[简化说明](../../implemented/simplification/2026-09-12-account-free-workspace-entry.zh.md)）。浏览器启动令牌认证保护整个本地 Host API，但不证明公司账号、部门或角色（[设计](../../implemented/architecture/2026-08-24-browser-token-authentication.zh.md)）。这两种机制都不能授权受管业务数据。

当前 Session 创建的 Remote 请求可传入可选的 `agentPreset`，Session 列表、搜索、恢复、跟随、fork 和事件流也没有账号与部门范围。Preset 已经持久化到 Session header，并能恢复每个 Session 的精确组合（[设计](../../implemented/architecture/2026-08-03-per-session-agent-presets.zh.md)），但调用方仍能影响选择。受管部署必须改为由服务端解析 preset，并阻止所有直接标识符访问路径跨越所有权范围。

现有 `Workspace` 领域表示本地文件目录，并通过 `cwd` 对 Session 分组。将其复用于组织部门会混合无关语义，并破坏当前本地行为。本提议把 Department Workbench 作为独立产品概念引入，保持所有现有 Workspace API 与持久化语义不变。

## 提议

认证完成后，服务端解析当前用户、主部门、成员关系、角色、功能集、部门策略和 agent preset。一次已认证的 bootstrap 响应只描述客户端展示。Session 创建与每个业务操作分别使用服务端持有的主体和策略。

```text
authenticated account
  -> active user + primary department + active membership + role
  -> department feature set + home panel
  -> server-selected agent preset
  -> Session(userId, departmentId, agentPreset)
  -> policy-constrained tools and data
```

本设计包含三个相互独立的控制。功能集控制已注册客户端能力的可见性。agent preset 控制向模型展示的 persona、skill 和工具 schema。`DepartmentPolicy` 控制业务操作是否可以执行，以及提供方能够读取或修改哪些记录。前两项改善展示与模型行为；只有第三项是授权控制。

### 现有基础与所需变更

| 表面 | 复用内容 | 所需变更 |
|---|---|---|
| LoginGate | 本地 profile 保留无账号入口行为 | 受管 profile 用真实登录和已认证 bootstrap 替换它；模拟入口绝不处理密码 |
| 浏览器认证 | 保留 authority、Origin、Fetch Metadata、签名 cookie 和 WebSocket 检查 | 增加受管账号提供方，并在 HTTP 与 WebSocket 请求范围中携带已认证主体 |
| [Session Controller](../../../../packages/api/session-controller/README.zh.md) | 保留生命周期与命令所有权 | 每个创建、读取、修改、恢复和流操作都要求显式的服务端派生 Session 访问范围 |
| Remote Gateway | 保留 Typert 端点注册与传输分发 | 为受管登录和登出增加精确 Fetch handler，暴露已认证 `app.bootstrap`，并传递主体且不接受客户端身份声明 |
| Agent Presets | 保留 Host 注册表、按 Session 划分范围的组合和持久化 header 字段 | 在服务端解析部门 preset；普通受管 profile 不包含用户选择和创作能力 |
| Skill Registry | 保留分范围的注册表合并 | 全局注册公司 skill，仅在选定 preset 内注册部门 skill |
| UI Slots | 保留类型化且归 effect 所有的扩展点 | 增加 Department Feature Registry，只实例化 bootstrap 启用的 slot 贡献；slot 仍负责组合而非授权 |
| Storage Domain | 保留类型化领域持久化 | 在事务型提供方出现前，把 MVP 组织目录保存为单个版本化且原子替换的全局文档 |
| [Session Query](../../../../packages/session-query/session-query/README.zh.md) | 保留派生的跨 Session 索引 | 在搜索、排序或分页前索引并过滤 `userId` 与 `departmentId` |
| Workspace | 保持本地目录身份和 `cwd` 分组不变 | 引入独立的 Department 与 Department Workbench 名称、服务、路由和持久化 |

## 领域模型

跨 package 传递的标识符使用品牌类型。持久化记录使用稳定标识符而非名称，部署校验在接收流量前解析所有引用。

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

组织目录在加载和替换时强制执行以下不变量：

- 每个 `(userId, departmentId)` 组合最多对应一个 Membership。
- MVP 中，每个启用的普通用户恰好有一个启用的 Membership 与 `primaryDepartmentId` 对应。可以存储额外的非主成员关系，但不能选择它们。
- 每个 Department 都引用已有的功能集、agent preset、首页 panel，并且其允许角色有完整的策略覆盖。
- 停用账号或 Department 无法产生启用工作台。缺失主 Department 时返回工作台未配置错误，而不选择默认项。
- 管理员是专用管理 Department 的启用成员；该 Department 的功能集、preset、首页 panel 和策略遵循相同不变量。管理身份不能绕过 Session 所有权。

第一个存储提供方通过 [`storage-domain`](../../../../packages/storage/storage-domain/README.zh.md) 持久化全局 `OrganizationDirectoryV1`。单个已校验文档利用现有存储行为保证跨记录替换的原子性。以后可以使用 SQL 提供方规范化记录，而不改变 Service Definition 或其消费者。

账号目录、账号认证和部门授权都是完整的能力接缝：各自包含 Service Definition、提供方和具名消费者。现有匿名安装标识符、凭据授权流程和权限 preset 都不是公司身份或业务授权，不复用于这些职责。

## 认证与 bootstrap

受管认证签发不透明的随机服务端会话 cookie。Cookie 映射到服务端登录记录，不内嵌角色、部门、preset 或 feature 声明。每个请求重新解析或校验当前账号状态，因此账号停用、成员关系变化和登出可以生效，而无须信任过期客户端声明。当前启动令牌提供方继续用于本地 profile，并映射到保留的本地用户和 Department 标识符。

连接层在传输边缘完成一次认证并建立请求主体。BFF handler 可以读取该传输范围，但可复用服务接收显式的 `SessionAccessScope` 或 `DepartmentAccessRequest`；BFF 以下的授权不得依赖不可观察的环境值。WebSocket 把一个主体绑定到其连接世代，在登出、账号停用或 authority 轮换后关闭连接或停止继续发送。

客户端在登录或重连后获取一次 bootstrap：

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

`AppBootstrap` 特意不包含 `agentPresetId`、工具授权、数据范围、文件系统根目录和策略记录。导航条目只包含稳定标识符；feature 插件拥有本地化标签键和图标。客户端为当前已认证连接世代缓存 bootstrap，并在登录、重连、显式账号刷新或收到失效事件后重新获取。

解析具有明确结果：

- 缺少主 Department 或 Membership 时返回 `account/workbench-unconfigured`，界面显示“账号尚未配置工作台”。
- 停用账号会拒绝认证；停用 Department 返回 `department/disabled`，且不能进入应用。
- 多个启用候选或主 Membership 不匹配属于部署数据错误并直接失败。服务端不做猜测。
- 未来的切换器只把目标 Department 标识符提交到校验启用 Membership 的端点，并签发新的 bootstrap 上下文。它不会改变任何现有 Session 的所有者。

## Session 所有权与 preset 选择

下一个相邻 Session 格式向 `SessionHeader` 增加必需的品牌类型 `userId` 和 `departmentId` 字段。现有持久化 `agentPreset` 字段就是已解析的 `agentPresetId`；以第二个名称复制它会形成两个权威。由于必需 header 字段属于结构变更，且当前格式已经发布，实现时必须创建下一个版本与相邻迁移 package，不修改任何已提交的前代（[迁移规则](../../implemented/architecture/2026-08-31-released-session-format-migrations.zh.md)、[发布状态](../../../../docs/session-format-status.zh.md)）。

对于现有本地 Session，相邻迁移写入保留的本地用户与 Department 标识符。本地 profile 继续解析该保留主体，而受管账号提供方拒绝保留命名空间。这样既保留本地历史，也不会意外把历史 Session 授予第一个登录的公司账号。

受管 `session.create` 不接受用户、Department、角色、preset、功能集或数据范围输入。它在一个服务端操作中解析已认证主体、主启用 Membership、Department 和 `agentPresetId`，并把它们写入初始 header。本地 profile 可以通过独立组合保留现有 Workspace 和 preset 输入；受管 controller 应拒绝这些字段，而不是静默忽略。

Session 所有权不可变。当前角色和 DepartmentPolicy 在访问与执行时计算，而不作为权威复制进 Session。因此，撤销 Membership 会立即阻止访问 Session，且无须重写日志；恢复仍被允许的 Session 时，则按创建时记录的精确 preset 重建。

所有访问路径在返回元数据、内容或存在性之前应用精确的 `userId + departmentId` 过滤：

- 列表、搜索、检查、分页、跟随、恢复、prompt、中断、归档、导出、附件和 Session 关联文件操作；
- 控制事件、Remote 转发事件和 WebSocket 订阅；
- Session Query 索引、全文候选选择、排序和分页；
- fork、委派和可继续子 agent 恢复。

未授权标识符返回与不存在标识符相同的 `session/not-found` 结果。Fork 和 subagent 原样继承 `userId`、`departmentId` 与 `agentPreset`，调用方不能覆盖。未来的跨部门转移会在显式启用的 Membership 下创建新 Session，而不修改历史。

## Preset、skill 与工具

现有分层 Skill Registry 已支持全局提供方和 preset 内的 scoped 提供方（[注册表](../../../../packages/skill/skill/README.zh.md)、[文件系统提供方](../../../../packages/skill/skill-filesystem/README.zh.md)、[standard preset](../../../../packages/preset/agent-presets/presets/standard/agent.cordis.yml)、[Cordis preset](../../../../packages/preset/agent-presets/presets/cordis/agent.cordis.yml)）。受管部署直接使用该机制：

```text
department agent
  = company skills
  + department skills
  + department persona
  + department tool schemas
```

公司 skill 由部署只注册一次。Department preset 只挂载该 Department 的 `customSkillDirs`；受管 preset 设置 `includeDefaultRoots: false`，避免项目和个人文件系统 skill 意外进入公司 agent。部署校验拒绝公司与 Department 目录之间的 skill 重名。未来若确实需要覆盖，必须增加显式 manifest 规则，而不是依赖注册表优先级。

Department 选择公司维护的 preset。普通受管 profile 不包含 preset 选择器和 preset 创作 UI，Remote 创建请求也不能指定 preset。改变 Department 定义只影响新 Session；现有 Session 恢复其已记录 preset。除非模型可见的 persona 或工具 schema 确实不同，否则不应按角色复制部门级 preset；角色相关数据访问属于 DepartmentPolicy。

Skill 是模型指导，不是权限。在销售 preset 中暴露 CRM 工具 schema，只让模型可以请求该操作；它不会授权操作，也不会授予全部客户记录访问权。

## Department Feature Registry

[`ui-slots`](../../../../packages/client/ui-slots/README.zh.md) 继续作为客户端插件贡献共享框架、panel、overlay 和右侧内容的机制。新的浏览器侧 Department Feature Registry 把这些贡献归到稳定的 `FeatureId` 下。每个 feature 定义拥有自己的本地化标签键、图标、导航目标、主 panel、可选右侧 panel 和必需依赖。

Bootstrap 提供已启用 feature 与导航标识符的有序列表。注册表校验每个标识符和 `homePanelId` 都存在、导航目标属于已启用 feature，且所有依赖满足。未知或不一致引用作为部署错误明确失败。路由器和 panel controller 拒绝直接导航到已注册但未启用的 panel。

客户端在连接世代保持启用期间保留已接受的 bootstrap。当 HMR 替换注册表或已启用的 feature 插件时，注册表会等待所有已启用 feature 重新注册，然后使用缓存的 bootstrap 恢复全部 contribution，无需再次请求服务端或等待 ready 事件。

公共 feature 注册 Dashboard、AI Agent、消息和设置。销售、市场和以后其他部门分别注册独立 feature bundle。框架渲染相同的品牌与外壳，核心区域则随启用 bundle 改变。静态客户端文案继续归 locale 所有；服务端把用户和 Department 名称作为数据发送，而不发送翻译后的菜单字符串。

Feature 过滤不是安全检查。没有 UI 时，直接 Remote 调用、工具执行、导出和数据提供方查询仍受保护。

## DepartmentPolicy 与数据访问

`DepartmentPolicy` 与沙箱/审批权限 preset、凭据授权相互独立。它的 Service Definition 接收已认证主体以及服务端持有的 action 与资源说明，返回拒绝或提供方必须执行的约束：

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

每个业务工具和 Remote API 消费者都在执行路径内部调用该服务。CRM 或订单提供方把返回约束编译成强制的 `departmentId`、所有者、区域或被分配记录谓词。客户端或模型可以提交客户或订单标识符，但绝不提供权威 Department 谓词，也不能扩大返回的约束。列表和搜索提供方必须在分页与聚合之前应用约束，而不是获取跨 Department 结果后再过滤。

Preset 可以隐藏 Department 中所有角色都不能使用的工具；请求组合器也可以在下一次模型请求中省略角色无权使用的 schema，以减少无效调用。执行器仍是最终权威，因为 Session 历史、过期模型输出、直接 API 客户端和配置错误仍可能请求被隐藏操作。根据仓库的“模型可见即已记录”规则，模型可见工具的任何变化都必须能从已记录 Session 事实重建。

## 迁移与交付顺序

1. **组织模型与提供方。** 增加品牌标识符、账号目录 Service Definition、版本化存储提供方、校验，以及 UserProfile、Department、Membership、Role、FeatureSet 和 DepartmentPolicy 的部署配置。保留本地主体与受管公司数据分别初始化。
2. **受管认证与 bootstrap。** 增加账号认证提供方、主体传递、登录/登出端点、已认证 `app.bootstrap`、明确的失败界面，以及受管 LoginGate 替代，同时保留本地 profile。
3. **Session 所有权。** 增加相邻 Session 格式与迁移、持久化所有权字段、带范围的 Session Query 索引、服务端选择 preset 的创建流程、所有 Session 路径和事件流的授权，以及 fork/subagent 的精确继承。Session 生命周期变化时同步更新两个 SDK 的投影与预期输出。
4. **Skill 与策略组合。** 全局注册公司 skill，增加 Department preset 的 skill 根目录，校验目录冲突，实现 DepartmentPolicy 消费者，并在首个业务工具和 Remote 提供方中执行约束。
5. **Feature 驱动的工作台框架。** 增加 Department Feature Registry、bootstrap 驱动的导航与首页 panel、禁用路由处理、locale 所有的文案和公共 feature bundle。
6. **销售 MVP。** 以独立实现变更增加销售功能集、preset、persona、skill、CRM/订单策略适配器、页面、快照和浏览器证据。
7. **市场部验证。** 增加市场活动、内容、投放和线索 feature，证明架构没有销售专属假设。可见的多 Department 切换器继续推迟，直到此验证明确其具体交互要求。

每个非平凡实现切片在合并前携带自己的 Agent Note 或推进本提议，同步更新受影响 README 与 JSDoc 契约，并运行仓库 pre-push 工作流选择的最小检查集合。

## 测试策略

- **组织数据：** schema 与引用校验；Membership 组合唯一性；缺失、停用和不匹配的主 Department；停用账号与 Department；管理员工作台；保留无切换器的非主 Membership。
- **认证：** 有效与无效登录、不透明 cookie 属性、登出与撤销、Origin 与 Fetch Metadata 拒绝、WebSocket 主体绑定、停用账号断开，以及不变的本地启动令牌行为。
- **Bootstrap 与 UI：** 每个已认证连接世代只请求一次；重连/失效刷新；未知 feature、panel 和依赖明确失败；直接访问禁用 panel 的 URL 失败；公共框架加销售与市场 fixture 组合；locale 键覆盖。
- **Session：** 迁移到保留本地所有权的相邻格式、前代不可变、header codec 往返、查询 schema 升级，以及同 Department 两名用户和另一 Department 一名用户在所有元数据、内容、事件流、导出、附件、恢复与修改路径上的隔离。
- **Fork 与 subagent：** 精确继承所有权和 preset、拒绝覆盖、可继续子 agent 恢复，以及没有跨 Department 事件发送。
- **Preset 与 skill：** 服务端选择、受管请求中拒绝 `agentPreset`、全局与 Department 合并、排除项目/用户根目录、重名校验，以及 Department 改变 preset 后的稳定恢复。
- **策略与提供方：** 允许 action、角色拒绝、停用 Membership、必需 Department/所有者约束、直接工具和 Remote 绕过尝试、带范围分页与聚合，以及 schema 过期或隐藏时的执行器拒绝。
- **产品证据：** 聚焦的单元与集成测试、模型可见行为变化的无密钥录制 Session 快照、真实组合 profile 的工作台浏览器测试，以及两个 SDK 的 Session 投影变化时对应的 TypeScript 与 Python 预期输出。

## 考虑过的替代方案

**让用户在登录后选择 Business Space** — MVP 不采用。主 Department 属于账号配置，选择器会产生未授权选择和额外空状态。仍存储多成员关系，供以后显式且经服务端校验的切换器使用。

**把 Workspace 复用于 Department** — 不采用。Workspace 是本地文件系统目录与 `cwd` 分组；改变该含义会把组织授权与 Host 路径耦合。

**把公共 skill 复制到每个 Department** — 不采用。副本会产生漂移，并把一次公司指导变更变成多目录迁移；scoped 注册表组合已经提供共享能力。

**信任客户端功能集或 preset 输入** — 不采用。客户端可能过期或恶意，因此 bootstrap 只作为输出，Session 创建根据服务端数据解析 preset。

**把 UI 可见性用作授权** — 不采用。直接 API、工具、已恢复 Session 和过期模型路径都能绕过 UI。

**把角色与策略授权持久化为 Session 权威** — 不采用。成员关系与策略变化必须立即撤销访问；Session 记录身份、Department 与模型组合，当前策略拥有执行权威。

**把浏览器启动令牌或匿名安装标识符用作公司账号** — 不采用。它们标识本地 Host authority 或安装，而不标识人类用户或组织成员关系。

**立即把组织记录规范化到不同 storage-domain 表** — MVP 不采用，因为当前 facility 不提供跨表事务。单个版本化目录文档提供原子引用校验；规范化等待能保持该属性的提供方。

## 验收标准

- 普通受管账号无需切换器即可进入唯一一个由服务端选择的启用 Department 工作台，并获得稳定公共框架和其启用 feature bundle。
- 未配置与停用状态产生明确结果；管理员使用已定义的管理 Department，而不绕过模型。
- 浏览器不能选择或修改 `agentPresetId`、策略约束、Department 身份或工具授权。
- 每个当前格式 Session 都具有不可变的 `userId`、`departmentId` 和已解析 `agentPreset`；所有 Session 读取、搜索、事件流、恢复、fork 与子操作执行精确所有权校验。
- 公司与 Department skill 无副本组合；每个业务工具和提供方独立于模型与 UI 执行当前 DepartmentPolicy 约束。
- 现有本地 Workspace 语义和无账号本地 profile 通过各自组合继续受到支持。
- 销售可以作为首个 feature bundle 交付，而不在认证、Session、共享框架或 Feature Registry 中嵌入销售假设；市场部可通过数据与插件注册加入。

## 风险

- **Session 消费者迁移不完整可能泄露元数据或事件。** 维护一份覆盖 Session Controller、Session Query、控制事件流、Remote 事件转发、上传、导出、Session 关联文件、fork、subagent 和两个 SDK 的清单；隔离测试在不同主体间使用冲突标题与标识符。
- **长连接可能在撤销后继续存活。** 把主体绑定到连接世代，在受保护操作上重新校验，并在登出、停用或 authority 轮换时终止发送。
- **Feature 注册可能被误认为强制授权。** 在启用 feature、禁用 feature 和无浏览器调用三种情况下，都保留工具、Remote API 与提供方层的拒绝测试。
- **单一全局组织文档最终会限制并发管理。** MVP 优先小规模部署中的原子一致性；Service Definition 使以后可替换为事务型 SQL 提供方。
- **Department 配置可能与插件或 preset 漂移。** 服务端就绪前校验每个 Feature、panel、preset、skill 目录、角色和策略引用。
- **角色变化可能在 Session 中途改变模型可见工具 schema。** 以执行器策略为权威，使请求时 schema 过滤具有确定性且被记录，并测试策略变化前后的恢复。
