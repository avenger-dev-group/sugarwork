/**
 * Service Definition for account-driven department workbench resolution and
 * business authorization. Providers own identity data; consumers never accept
 * a client-selected department, role, preset, or data scope.
 * @module @deepseek-ai/dsh-department-workbench
 */

import { Context, Service } from '@deepseek-ai/cordis'
import type {
  DepartmentAccessDecision,
  DepartmentAccessRequest,
  ResolvedDepartmentWorkbench,
} from './types.ts'

export type * from './types.ts'
export { DepartmentWorkbenchError } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Current account's server-resolved department workbench and policy. */
    departmentWorkbench: DepartmentWorkbenchProvider
  }
}

/** Provider for the current account's workbench and business authorization. */
export abstract class DepartmentWorkbenchProvider extends Service {
  /** @param ctx - owning Host context. */
  constructor(ctx: Context) {
    super(ctx, 'departmentWorkbench')
  }

  /**
   * Resolve the current authenticated account's active primary workbench.
   * @returns the complete server-side workbench composition.
   * @throws when account data is absent, disabled, or inconsistent.
   */
  abstract resolveCurrent(): Promise<ResolvedDepartmentWorkbench>

  /**
   * Authorize one business operation against current membership and policy.
   * @param request - server-owned identity, action, and optional resource.
   * @returns denial or mandatory provider constraints.
   */
  abstract authorize(request: DepartmentAccessRequest): Promise<DepartmentAccessDecision>
}

export default DepartmentWorkbenchProvider
