/** Browser-safe account and department bootstrap vocabulary. */

import type { Branded } from '@deepseek-ai/dsh-brand'

/** Client-visible account identifier. */
export type AppUserId = Branded<'AppUserId'>
/** Client-visible department identifier. */
export type AppDepartmentId = Branded<'AppDepartmentId'>
/** Client-visible role identifier. */
export type AppRoleId = Branded<'AppRoleId'>
/** Client feature identifier. */
export type AppFeatureId = Branded<'AppFeatureId'>
/** Client navigation identifier. */
export type AppNavigationItemId = Branded<'AppNavigationItemId'>
/** Client workbench panel identifier. */
export type AppWorkbenchPanelId = Branded<'AppWorkbenchPanelId'>
/** Broad role behavior available to the shared client shell. */
export type AppRoleKind = 'member' | 'administrator'

/** One client-safe workbench navigation target. */
export interface AppNavigationItem {
  readonly id: AppNavigationItemId
  readonly featureId: AppFeatureId
  readonly panelId: AppWorkbenchPanelId
}

/** One authenticated application's user, department, and enabled presentation. */
export interface AppBootstrap {
  readonly user: {
    readonly id: AppUserId
    readonly name: string
    readonly role: { readonly id: AppRoleId; readonly name: string; readonly kind: AppRoleKind }
  }
  readonly department: {
    readonly id: AppDepartmentId
    readonly name: string
    readonly homePanelId: AppWorkbenchPanelId
  }
  readonly features: readonly AppFeatureId[]
  readonly navigation: readonly AppNavigationItem[]
}

/** Empty request reserved for future connection-scoped bootstrap negotiation. */
export type AppBootstrapRequest = Record<never, never>

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** The authenticated account has no usable primary department. */
    'account/workbench-unconfigured': Record<never, never>
    /** The authenticated account is disabled. */
    'account/disabled': Record<never, never>
    /** The authenticated account's primary department is disabled. */
    'department/disabled': { readonly departmentId?: AppDepartmentId }
    /** The server-side organization directory is inconsistent. */
    'department/directory-invalid': Record<never, never>
  }
}

export {}
