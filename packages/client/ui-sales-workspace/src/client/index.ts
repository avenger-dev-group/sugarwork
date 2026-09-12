/** Sales department feature registration. */

import type { Context } from '@deepseek-ai/cordis'
import type { AppFeatureId, AppWorkbenchPanelId } from '@deepseek-ai/dsh-api-app-bootstrap/types'
import { brandString } from '@deepseek-ai/dsh-brand'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-department-workbench/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { en, zh, type SalesWorkspaceKey } from './locales.ts'
import { SalesAgenda, SalesMetrics, SalesNavIcon, SalesPanel, SalesTasks, type SalesPanelKind } from './SalesWorkspace.tsx'

export type { SalesWorkspaceKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Sales workspace presentation copy. */
    'sales-workspace': SalesWorkspaceKey
  }
}

const NS = 'sales-workspace'
const SALES_FEATURE = brandString<AppFeatureId>('sales-workspace')
const panelIds: Record<SalesPanelKind, AppWorkbenchPanelId> = {
  customers: brandString<AppWorkbenchPanelId>('customers'),
  orders: brandString<AppWorkbenchPanelId>('orders'),
  calls: brandString<AppWorkbenchPanelId>('calls'),
  messages: brandString<AppWorkbenchPanelId>('messages'),
}
const panelKind = new Map<AppWorkbenchPanelId, SalesPanelKind>(
  Object.entries(panelIds).map(([kind, panel]) => [panel, kind as SalesPanelKind]),
)

/** Required feature-registry, layout, locale, and slot services. */
export const inject = ['departmentFeatures', 'layout', 'locale', 'slots']

/** Register the Sales feature and its Dashboard contributions. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-sales-workspace: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.departmentFeatures.register({
    id: SALES_FEATURE,
    panels: Object.values(panelIds),
    mount: (bootstrap) => {
      const disposers: Array<() => void> = []
      const selectPanel = (panel: AppWorkbenchPanelId): void => { ctx.layout.selectPanel(brandString<MainPanelId>(panel)) }

      for (const [kind, panel] of Object.entries(panelIds) as Array<[SalesPanelKind, AppWorkbenchPanelId]>) {
        disposers.push(ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main', key: brandString<MainPanelId>(panel), locale: NS,
          inject: () => ({ kind }),
        }, SalesPanel)))
      }

      for (const [order, item] of bootstrap.navigation.filter(item => item.featureId === SALES_FEATURE).entries()) {
        const kind = panelKind.get(item.panelId)
        if (kind === undefined) throw new Error(`Sales navigation panel ${JSON.stringify(item.panelId)} is not registered`)
        disposers.push(ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: brandString<MainPanelId>(item.panelId), order,
          label: () => t(`nav.${kind}`), inject: () => ({ kind }),
        }, SalesNavIcon)))
      }

      disposers.push(ctx.slots.inject('department.dashboard.agenda', () => ctx.slots.register({
        name: 'department.dashboard.agenda', id: 'sales-agenda', order: 0, locale: NS,
      }, SalesAgenda)))
      disposers.push(ctx.slots.inject('department.dashboard.metrics', () => ctx.slots.register({
        name: 'department.dashboard.metrics', id: 'sales-metrics', order: 0, locale: NS,
        inject: () => ({ selectPanel }),
      }, SalesMetrics)))
      disposers.push(ctx.slots.inject('department.dashboard.tasks', () => ctx.slots.register({
        name: 'department.dashboard.tasks', id: 'sales-tasks', order: 0, locale: NS,
        inject: () => ({ selectPanel }),
      }, SalesTasks)))
      return () => { for (const dispose of disposers.reverse()) dispose() }
    },
  }), 'ui-sales-workspace: feature')
}
