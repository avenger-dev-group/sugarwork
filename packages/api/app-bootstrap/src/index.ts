/** Host Remote owner for authenticated application bootstrap. */

import { Context } from '@deepseek-ai/cordis'
import { brandString } from '@deepseek-ai/dsh-brand'
import {
  DepartmentWorkbenchError,
  type ResolvedDepartmentWorkbench,
} from '@deepseek-ai/dsh-department-workbench'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {
  AppBootstrap,
  AppBootstrapRequest,
  AppDepartmentId,
  AppFeatureId,
  AppNavigationItemId,
  AppRoleId,
  AppUserId,
  AppWorkbenchPanelId,
} from './types.ts'

export type * from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Account and department bootstrap Remote owner. */
    appBootstrapController: AppBootstrapController
  }
}

/** Host service backing the generated `ctx.remote.appBootstrap` namespace. */
export class AppBootstrapController extends TypertRemoteService {
  static inject = ['departmentWorkbench', 'typert']

  /** @param ctx - Host context containing the department workbench provider. */
  constructor(ctx: Context) {
    super(ctx, 'appBootstrapController', { namespace: 'appBootstrap' })
  }

  /**
   * Resolve the current account's presentation bootstrap without exposing its preset or policy.
   * @param _request - reserved empty request.
   * @returns client-safe user, department, feature, and navigation values.
   */
  @Remote('get')
  async get(_request: AppBootstrapRequest): Promise<AppBootstrap> {
    try {
      return projectBootstrap(await this.ctx.departmentWorkbench.resolveCurrent())
    } catch (error) {
      if (!(error instanceof DepartmentWorkbenchError)) throw error
      switch (error.code) {
        case 'workbench-unconfigured':
          throw new RemoteError('account/workbench-unconfigured', error.message, {})
        case 'account-disabled':
          throw new RemoteError('account/disabled', error.message, {})
        case 'department-disabled':
          throw new RemoteError('department/disabled', error.message, {})
        case 'directory-invalid':
          throw new RemoteError('department/directory-invalid', error.message, {})
        default:
          return assertNever(error.code)
      }
    }
  }
}

/** Project one server-only workbench resolution to its client-safe bootstrap. */
function projectBootstrap(current: ResolvedDepartmentWorkbench): AppBootstrap {
  return {
    user: {
      id: brandString<AppUserId>(current.user.id),
      name: current.user.name,
      role: { id: brandString<AppRoleId>(current.role.id), name: current.role.name, kind: current.role.kind },
    },
    department: {
      id: brandString<AppDepartmentId>(current.department.id),
      name: current.department.name,
      homePanelId: brandString<AppWorkbenchPanelId>(current.department.homePanelId),
    },
    features: current.featureSet.features.map(feature => brandString<AppFeatureId>(feature)),
    navigation: current.featureSet.navigation.map(item => ({
      id: brandString<AppNavigationItemId>(item.id),
      featureId: brandString<AppFeatureId>(item.featureId),
      panelId: brandString<AppWorkbenchPanelId>(item.panelId),
    })),
  }
}

function assertNever(value: never): never {
  throw new Error(`unreachable department workbench error: ${String(value)}`)
}

export default AppBootstrapController
