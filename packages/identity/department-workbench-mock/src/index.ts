/**
 * Configured in-memory provider for department-workbench platform development.
 * The deployment selects one current user; browser requests cannot choose it.
 * @module @deepseek-ai/dsh-department-workbench-mock
 */

import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { brandString } from '@deepseek-ai/dsh-brand'
import {
  DepartmentWorkbenchError,
  DepartmentWorkbenchProvider,
  type DepartmentAccessDecision,
  type DepartmentAccessRequest,
  type DepartmentActionId,
  type DepartmentDefinition,
  type DepartmentId,
  type DepartmentPolicy,
  type DepartmentPolicyId,
  type FeatureId,
  type FeatureSet,
  type FeatureSetId,
  type Membership,
  type MembershipId,
  type NavigationItemId,
  type ResolvedDepartmentWorkbench,
  type Role,
  type RoleId,
  type UserId,
  type UserProfile,
  type WorkbenchPanelId,
} from '@deepseek-ai/dsh-department-workbench'

interface UserConfig {
  /** Stable user id. */
  readonly id: string
  /** Display name. */
  readonly name: string
  /** Account entry status. */
  readonly status: 'active' | 'disabled'
  /** MVP primary department id. */
  readonly primaryDepartmentId?: string
}

interface DepartmentConfig {
  /** Stable department id. */
  readonly id: string
  /** Display name. */
  readonly name: string
  /** Department entry status. */
  readonly status: 'active' | 'disabled'
  /** Referenced feature-set id. */
  readonly featureSetId: string
  /** Server-selected Agent preset id. */
  readonly agentPresetId: string
  /** Initial main-panel id. */
  readonly homePanelId: string
}

interface MembershipConfig {
  /** Stable membership id. */
  readonly id: string
  /** Referenced user id. */
  readonly userId: string
  /** Referenced department id. */
  readonly departmentId: string
  /** Referenced role id. */
  readonly roleId: string
  /** Membership authorization status. */
  readonly status: 'active' | 'disabled'
}

interface RoleConfig {
  /** Stable role id. */
  readonly id: string
  /** Display name. */
  readonly name: string
  /** Shared-shell role behavior. */
  readonly kind: 'member' | 'administrator'
}

interface NavigationConfig {
  /** Stable navigation-item id. */
  readonly id: string
  /** Feature that owns this item. */
  readonly featureId: string
  /** Panel selected by this item. */
  readonly panelId: string
}

interface FeatureSetConfig {
  /** Stable feature-set id. */
  readonly id: string
  /** Enabled client feature ids. */
  readonly features: readonly string[]
  /** Ordered navigation entries. */
  readonly navigation: readonly NavigationConfig[]
}

interface DataScopeConfig {
  /** Provider-interpreted scope kind. */
  readonly kind: string
  /** Provider-interpreted resource name. */
  readonly resource: string
}

interface PolicyConfig {
  /** Stable policy id. */
  readonly id: string
  /** Department governed by the policy. */
  readonly departmentId: string
  /** Role governed by the policy. */
  readonly roleId: string
  /** Allowed business action ids. */
  readonly actions: readonly string[]
  /** Mandatory data constraints for allowed actions. */
  readonly dataScopes: readonly DataScopeConfig[]
}

/** Complete mock organization directory supplied by the deployment. */
export interface Config {
  /** Deployment-selected account id; browser requests cannot override it. */
  readonly currentUserId: string
  /** Complete mock user directory. */
  readonly users: readonly UserConfig[]
  /** Complete mock department directory. */
  readonly departments: readonly DepartmentConfig[]
  /** User-to-department role assignments. */
  readonly memberships: readonly MembershipConfig[]
  /** Roles referenced by memberships. */
  readonly roles: readonly RoleConfig[]
  /** Feature sets referenced by departments. */
  readonly featureSets: readonly FeatureSetConfig[]
  /** Department-and-role authorization policies. */
  readonly policies: readonly PolicyConfig[]
}

const identifier = z.string().pattern(/^[a-z][a-z0-9-]*$/).required()
const recordId = { id: identifier }

/** Runtime schema for the mock organization directory. */
export const Config: z<Config> = z.object({
  currentUserId: identifier,
  users: z.array(z.object({
    ...recordId,
    name: z.string().required(),
    status: z.union(['active', 'disabled'] as const).required(),
    primaryDepartmentId: identifier,
  })).required(),
  departments: z.array(z.object({
    ...recordId,
    name: z.string().required(),
    status: z.union(['active', 'disabled'] as const).required(),
    featureSetId: identifier,
    agentPresetId: identifier,
    homePanelId: identifier,
  })).required(),
  memberships: z.array(z.object({
    ...recordId,
    userId: identifier,
    departmentId: identifier,
    roleId: identifier,
    status: z.union(['active', 'disabled'] as const).required(),
  })).required(),
  roles: z.array(z.object({
    ...recordId,
    name: z.string().required(),
    kind: z.union(['member', 'administrator'] as const).required(),
  })).required(),
  featureSets: z.array(z.object({
    ...recordId,
    features: z.array(identifier).required(),
    navigation: z.array(z.object({
      id: identifier,
      featureId: identifier,
      panelId: identifier,
    })).required(),
  })).required(),
  policies: z.array(z.object({
    ...recordId,
    departmentId: identifier,
    roleId: identifier,
    actions: z.array(identifier).required(),
    dataScopes: z.array(z.object({
      kind: identifier,
      resource: identifier,
    })).required(),
  })).required(),
}) as z<Config>

/** In-memory development provider over one validated configuration snapshot. */
export class MockDepartmentWorkbenchProvider extends DepartmentWorkbenchProvider {
  static Config = Config

  private readonly users: ReadonlyMap<UserId, UserProfile>
  private readonly departments: ReadonlyMap<DepartmentId, DepartmentDefinition>
  private readonly memberships: readonly Membership[]
  private readonly roles: ReadonlyMap<RoleId, Role>
  private readonly featureSets: ReadonlyMap<FeatureSetId, FeatureSet>
  private readonly policies: readonly DepartmentPolicy[]
  private readonly currentUserId: UserId

  /**
   * @param ctx - owning Host context.
   * @param config - complete mock directory and server-selected current user.
   */
  constructor(ctx: Context, config: Config) {
    super(ctx)
    this.currentUserId = brandString<UserId>(config.currentUserId)
    this.users = uniqueMap('user', config.users.map((user) => {
      const id = brandString<UserId>(user.id)
      return [id, {
        id,
        name: user.name,
        status: user.status,
        ...(user.primaryDepartmentId === undefined
          ? {}
          : { primaryDepartmentId: brandString<DepartmentId>(user.primaryDepartmentId) }),
      }] as const
    }))
    this.departments = uniqueMap('department', config.departments.map((department) => {
      const id = brandString<DepartmentId>(department.id)
      return [id, {
        id,
        name: department.name,
        status: department.status,
        featureSetId: brandString<FeatureSetId>(department.featureSetId),
        agentPresetId: department.agentPresetId,
        homePanelId: brandString<WorkbenchPanelId>(department.homePanelId),
      }] as const
    }))
    this.memberships = config.memberships.map(membership => ({
      id: brandString<MembershipId>(membership.id),
      userId: brandString<UserId>(membership.userId),
      departmentId: brandString<DepartmentId>(membership.departmentId),
      roleId: brandString<RoleId>(membership.roleId),
      status: membership.status,
    }))
    this.roles = uniqueMap('role', config.roles.map((role) => {
      const id = brandString<RoleId>(role.id)
      return [id, { id, name: role.name, kind: role.kind }] as const
    }))
    this.featureSets = uniqueMap('feature set', config.featureSets.map((featureSet) => {
      const id = brandString<FeatureSetId>(featureSet.id)
      return [id, {
        id,
        features: featureSet.features.map(feature => brandString<FeatureId>(feature)),
        navigation: featureSet.navigation.map(item => ({
          id: brandString<NavigationItemId>(item.id),
          featureId: brandString<FeatureId>(item.featureId),
          panelId: brandString<WorkbenchPanelId>(item.panelId),
        })),
      }] as const
    }))
    this.policies = config.policies.map(policy => ({
      id: brandString<DepartmentPolicyId>(policy.id),
      departmentId: brandString<DepartmentId>(policy.departmentId),
      roleId: brandString<RoleId>(policy.roleId),
      actions: policy.actions.map(action => brandString<DepartmentActionId>(action)),
      dataScopes: policy.dataScopes,
    }))
    validateDirectory(this.users, this.departments, this.memberships, this.roles, this.featureSets, this.policies)
  }

  /** Resolve the configured current account and its active primary workbench. */
  resolveCurrent(): Promise<ResolvedDepartmentWorkbench> {
    try {
      return Promise.resolve(this.resolveCurrentValue())
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)))
    }
  }

  private resolveCurrentValue(): ResolvedDepartmentWorkbench {
    const user = this.users.get(this.currentUserId)
    if (user === undefined || user.primaryDepartmentId === undefined) {
      throw new DepartmentWorkbenchError('workbench-unconfigured', 'current account has no configured primary workbench')
    }
    if (user.status !== 'active') {
      throw new DepartmentWorkbenchError('account-disabled', 'current account is disabled')
    }
    const department = this.departments.get(user.primaryDepartmentId)
    if (department === undefined) {
      throw new DepartmentWorkbenchError('workbench-unconfigured', 'primary department does not exist')
    }
    if (department.status !== 'active') {
      throw new DepartmentWorkbenchError('department-disabled', 'primary department is disabled')
    }
    const matching = this.memberships.filter(membership =>
      membership.userId === user.id && membership.departmentId === department.id && membership.status === 'active')
    if (matching.length !== 1) {
      throw new DepartmentWorkbenchError('workbench-unconfigured', 'primary department needs exactly one active membership')
    }
    const membership = matching[0] as Membership
    const role = this.roles.get(membership.roleId)
    const featureSet = this.featureSets.get(department.featureSetId)
    const policy = this.policies.find(candidate =>
      candidate.departmentId === department.id && candidate.roleId === membership.roleId)
    if (role === undefined || featureSet === undefined || policy === undefined) {
      throw new DepartmentWorkbenchError('directory-invalid', 'primary workbench references missing role, feature set, or policy')
    }
    return { user, department, membership, role, featureSet, policy }
  }

  /** Authorize an operation against the currently resolved identity and policy. */
  async authorize(request: DepartmentAccessRequest): Promise<DepartmentAccessDecision> {
    const current = await this.resolveCurrent()
    if (request.userId !== current.user.id || request.departmentId !== current.department.id) {
      return { allowed: false, reason: 'identity-mismatch' }
    }
    if (!current.policy.actions.includes(request.action)) {
      return { allowed: false, reason: 'action-denied' }
    }
    return { allowed: true, constraints: current.policy.dataScopes }
  }
}

function uniqueMap<K, V>(subject: string, entries: readonly (readonly [K, V])[]): ReadonlyMap<K, V> {
  const result = new Map<K, V>()
  for (const [id, value] of entries) {
    if (result.has(id)) throw new DepartmentWorkbenchError('directory-invalid', `duplicate ${subject} id`)
    result.set(id, value)
  }
  return result
}

function validateDirectory(
  users: ReadonlyMap<UserId, UserProfile>,
  departments: ReadonlyMap<DepartmentId, DepartmentDefinition>,
  memberships: readonly Membership[],
  roles: ReadonlyMap<RoleId, Role>,
  featureSets: ReadonlyMap<FeatureSetId, FeatureSet>,
  policies: readonly DepartmentPolicy[],
): void {
  const pairs = new Set<string>()
  const membershipIds = new Set<MembershipId>()
  for (const membership of memberships) {
    if (membershipIds.has(membership.id)) {
      throw new DepartmentWorkbenchError('directory-invalid', 'duplicate membership id')
    }
    membershipIds.add(membership.id)
    const pair = `${membership.userId}\u0000${membership.departmentId}`
    if (pairs.has(pair)) {
      throw new DepartmentWorkbenchError('directory-invalid', 'duplicate user and department membership')
    }
    pairs.add(pair)
    if (!users.has(membership.userId) || !departments.has(membership.departmentId) || !roles.has(membership.roleId)) {
      throw new DepartmentWorkbenchError('directory-invalid', 'membership references a missing user, department, or role')
    }
  }
  for (const department of departments.values()) {
    const features = featureSets.get(department.featureSetId)
    if (features === undefined) {
      throw new DepartmentWorkbenchError('directory-invalid', 'department references a missing feature set')
    }
    const enabled = new Set(features.features)
    if (features.navigation.some(item => !enabled.has(item.featureId))) {
      throw new DepartmentWorkbenchError('directory-invalid', 'navigation references a disabled feature')
    }
    if (!features.navigation.some(item => item.panelId === department.homePanelId)) {
      throw new DepartmentWorkbenchError('directory-invalid', 'department home panel is absent from navigation')
    }
  }
  const policyKeys = new Set<string>()
  for (const policy of policies) {
    if (!departments.has(policy.departmentId) || !roles.has(policy.roleId)) {
      throw new DepartmentWorkbenchError('directory-invalid', 'policy references a missing department or role')
    }
    const key = `${policy.departmentId}\u0000${policy.roleId}`
    if (policyKeys.has(key)) throw new DepartmentWorkbenchError('directory-invalid', 'duplicate department and role policy')
    policyKeys.add(key)
  }
}

export default MockDepartmentWorkbenchProvider
