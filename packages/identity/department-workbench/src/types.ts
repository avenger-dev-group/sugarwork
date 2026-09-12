/** Browser-safe and provider-facing department workbench vocabulary. */

import type { Branded } from '@deepseek-ai/dsh-brand'

/** Stable company user identifier. */
export type UserId = Branded<'UserId'>
/** Stable organization department identifier. */
export type DepartmentId = Branded<'DepartmentId'>
/** Stable department membership identifier. */
export type MembershipId = Branded<'MembershipId'>
/** Stable organization role identifier. */
export type RoleId = Branded<'RoleId'>
/** Stable feature-set identifier. */
export type FeatureSetId = Branded<'FeatureSetId'>
/** Stable client feature identifier. */
export type FeatureId = Branded<'FeatureId'>
/** Stable navigation-entry identifier. */
export type NavigationItemId = Branded<'NavigationItemId'>
/** Stable client panel identifier. */
export type WorkbenchPanelId = Branded<'WorkbenchPanelId'>
/** Stable department-policy identifier. */
export type DepartmentPolicyId = Branded<'DepartmentPolicyId'>
/** Stable department action identifier. */
export type DepartmentActionId = Branded<'DepartmentActionId'>

/** Whether an account may enter the application. */
export type AccountStatus = 'active' | 'disabled'
/** Whether a department may provide a workbench. */
export type DepartmentStatus = 'active' | 'disabled'
/** Whether a membership may authorize department access. */
export type MembershipStatus = 'active' | 'disabled'
/** Broad role behavior used by the shared shell. */
export type RoleKind = 'member' | 'administrator'

/** One company user and its MVP primary department assignment. */
export interface UserProfile {
  readonly id: UserId
  readonly name: string
  readonly status: AccountStatus
  readonly primaryDepartmentId?: DepartmentId
}

/** One department's presentation and model-composition references. */
export interface DepartmentDefinition {
  readonly id: DepartmentId
  readonly name: string
  readonly status: DepartmentStatus
  readonly featureSetId: FeatureSetId
  readonly agentPresetId: string
  readonly homePanelId: WorkbenchPanelId
}

/** One user's role inside one department. */
export interface Membership {
  readonly id: MembershipId
  readonly userId: UserId
  readonly departmentId: DepartmentId
  readonly roleId: RoleId
  readonly status: MembershipStatus
}

/** Organization role referenced by memberships and policies. */
export interface Role {
  readonly id: RoleId
  readonly name: string
  readonly kind: RoleKind
}

/** One ordered navigation target owned by an enabled feature. */
export interface NavigationItem {
  readonly id: NavigationItemId
  readonly featureId: FeatureId
  readonly panelId: WorkbenchPanelId
}

/** Features and navigation assigned to one department. */
export interface FeatureSet {
  readonly id: FeatureSetId
  readonly features: readonly FeatureId[]
  readonly navigation: readonly NavigationItem[]
}

/** One provider-interpreted record constraint. */
export interface DepartmentDataScope {
  readonly kind: string
  readonly resource: string
}

/** Actions and data scopes granted to one role in one department. */
export interface DepartmentPolicy {
  readonly id: DepartmentPolicyId
  readonly departmentId: DepartmentId
  readonly roleId: RoleId
  readonly actions: readonly DepartmentActionId[]
  readonly dataScopes: readonly DepartmentDataScope[]
}

/** Server-resolved current workbench; model and policy fields never enter bootstrap. */
export interface ResolvedDepartmentWorkbench {
  readonly user: UserProfile
  readonly department: DepartmentDefinition
  readonly membership: Membership
  readonly role: Role
  readonly featureSet: FeatureSet
  readonly policy: DepartmentPolicy
}

/** Business authorization input whose identity fields come from the server. */
export interface DepartmentAccessRequest {
  readonly userId: UserId
  readonly departmentId: DepartmentId
  readonly action: DepartmentActionId
  readonly resource?: { readonly kind: string; readonly id?: string }
}

/** Business authorization result; allowed results carry mandatory provider constraints. */
export type DepartmentAccessDecision =
  | { readonly allowed: true; readonly constraints: readonly DepartmentDataScope[] }
  | { readonly allowed: false; readonly reason: 'identity-mismatch' | 'action-denied' }

/** Stable workbench-resolution failure exposed to BFF consumers. */
export type DepartmentWorkbenchErrorCode =
  | 'account-disabled'
  | 'department-disabled'
  | 'workbench-unconfigured'
  | 'directory-invalid'

/** Provider failure with a transport-independent category. */
export class DepartmentWorkbenchError extends Error {
  /**
   * @param code - stable resolution category.
   * @param message - operator-facing diagnostic.
   */
  constructor(readonly code: DepartmentWorkbenchErrorCode, message: string) {
    super(message)
    this.name = 'DepartmentWorkbenchError'
  }
}
