/** Department feature registry and the shared workbench Dashboard. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-app-bootstrap/client'
import type { AppBootstrap, AppFeatureId, AppWorkbenchPanelId } from '@deepseek-ai/dsh-api-app-bootstrap/types'
import { brandString } from '@deepseek-ai/dsh-brand'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { Dashboard, DashboardIcon } from './Dashboard.tsx'
import { en, zh, type DepartmentWorkbenchKey } from './locales.ts'
import { DepartmentFeatureRegistry } from './registry.ts'

export { DepartmentFeatureRegistry } from './registry.ts'
export type { DepartmentFeatureDefinition } from './registry.ts'
export type { DepartmentWorkbenchKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Shared department-workbench presentation copy. */
    'department-workbench': DepartmentWorkbenchKey
  }

  interface SlotMap {
    /** Department-owned schedule cards on the common Dashboard. */
    'department.dashboard.agenda': { kind: 'list'; scope: 'root' }
    /** Department-owned attention metrics on the common Dashboard. */
    'department.dashboard.metrics': { kind: 'list'; scope: 'root' }
    /** Department-owned action lists on the common Dashboard. */
    'department.dashboard.tasks': { kind: 'list'; scope: 'root' }
  }
}

const NS = 'department-workbench'
const DASHBOARD_FEATURE = brandString<AppFeatureId>('common-dashboard')
const DASHBOARD_PANEL = brandString<AppWorkbenchPanelId>('dashboard')
const OPEN_AGENT_AUTOMATION_HASH = '#dsh-open-agent'

/** Required bootstrap, layout, locale, and slot services. */
export const inject = ['appBootstrap', 'layout', 'locale', 'slots']

/**
 * Register the shared Dashboard feature and activate server-enabled features.
 * @param ctx - Client root Context.
 */
export function apply(ctx: Context): void {
  const registry = new DepartmentFeatureRegistry(ctx)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-department-workbench: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.effect(() => registry.register({
    id: DASHBOARD_FEATURE,
    panels: [DASHBOARD_PANEL],
    mount: (bootstrap) => {
      const mainPanel = brandString<MainPanelId>(DASHBOARD_PANEL)
      const disposeMain = ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: mainPanel,
        locale: NS,
        children: {
          'department.dashboard.agenda': { kind: 'list', scope: 'root' },
          'department.dashboard.metrics': { kind: 'list', scope: 'root' },
          'department.dashboard.tasks': { kind: 'list', scope: 'root' },
        },
        inject: () => ({ bootstrap, openAgent: () => { ctx.layout.selectPanel(null) } }),
      }, Dashboard))
      const disposeNav = ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: mainPanel,
        order: -100,
        label: () => t('dashboard.nav'),
      }, DashboardIcon))
      return () => {
        disposeNav()
        disposeMain()
      }
    },
  }), 'ui-department-workbench: common Dashboard feature')
  const selectHome = (bootstrap: AppBootstrap): void => {
    ctx.layout.selectPanel(typeof location !== 'undefined' && location.hash === OPEN_AGENT_AUTOMATION_HASH
      ? null
      : brandString<MainPanelId>(bootstrap.department.homePanelId))
  }
  ctx.on('app-bootstrap/ready', (bootstrap) => {
    registry.activate(bootstrap)
    selectHome(bootstrap)
  })
  const current = ctx.appBootstrap.getSnapshot()
  if (current.phase === 'ready') {
    registry.resume(current.value)
    selectHome(current.value)
  }
  ctx.effect(() => () => { registry.deactivate() }, 'ui-department-workbench: active features')
}
