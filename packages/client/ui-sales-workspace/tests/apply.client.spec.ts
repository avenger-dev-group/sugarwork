import { Context } from '@deepseek-ai/cordis'
import type { AppBootstrap } from '@deepseek-ai/dsh-api-app-bootstrap/types'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { DepartmentFeatureRegistry, type DepartmentFeatureDefinition } from '@deepseek-ai/dsh-client-ui-department-workbench/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
import { describe, expect, it, vi } from 'vitest'
import { SalesAgenda, SalesMetrics, SalesNavIcon, SalesPanel, SalesTasks } from '../src/client/SalesWorkspace.tsx'
import { apply, inject } from '../src/client/index.ts'
import { apply as hostApply } from '../src/index.ts'

const bootstrap = {
  user: { id: 'user-one', name: 'Lin', role: { id: 'member', name: 'Member', kind: 'member' } },
  department: { id: 'sales', name: 'Sales', homePanelId: 'customers' },
  features: ['sales-workspace'],
  navigation: [
    { id: 'customers', featureId: 'sales-workspace', panelId: 'customers' },
    { id: 'calls', featureId: 'sales-workspace', panelId: 'calls' },
  ],
} as unknown as AppBootstrap

describe('Sales workspace apply', () => {
  it('keeps the host entry inert and declares its client dependencies', () => {
    expect(hostApply).not.toThrow()
    expect(inject).toEqual(['departmentFeatures', 'layout', 'locale', 'slots'])
  })

  it('registers all Sales panels and Dashboard contributions for activation', async () => {
    const ctx = new Context()
    await ctx.plugin(SlotRegistry).await()
    ctx.provide('locale', new LocaleRuntime(ctx))
    const registry = new DepartmentFeatureRegistry(ctx)
    const selectPanel = vi.fn()
    ctx.provide('layout', { selectPanel } as never)
    const slots = ctx.get('slots') as SlotRegistry
    slots.register({
      name: 'root',
      children: {
        main: { kind: 'keyed', scope: 'root' },
        'sidebar.panellist': { kind: 'list', scope: 'root' },
        'department.dashboard.agenda': { kind: 'list', scope: 'root' },
        'department.dashboard.metrics': { kind: 'list', scope: 'root' },
        'department.dashboard.tasks': { kind: 'list', scope: 'root' },
      },
    } as never, () => null)

    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    registry.activate(bootstrap)

    expect(slots.entries('main').map(entry => entry.component)).toEqual([
      SalesPanel, SalesPanel, SalesPanel, SalesPanel,
    ])
    expect(slots.entries('sidebar.panellist').map(entry => entry.component)).toEqual([SalesNavIcon, SalesNavIcon])
    expect(slots.entries('sidebar.panellist').map(entry => resolveSlotLabel(entry.options.label))).toEqual(['Existing Customers', 'Call Logs'])
    expect(slots.entries('department.dashboard.agenda')[0]?.component).toBe(SalesAgenda)
    expect(slots.entries('department.dashboard.metrics')[0]?.component).toBe(SalesMetrics)
    expect(slots.entries('department.dashboard.tasks')[0]?.component).toBe(SalesTasks)

    const mainInjected = (slots.entries('main')[0]?.inject as () => { kind: string })()
    expect(mainInjected.kind).toBe('customers')
    const navInjected = (slots.entries('sidebar.panellist')[0]?.inject as () => { kind: string })()
    expect(navInjected.kind).toBe('customers')
    const metricInjected = (slots.entries('department.dashboard.metrics')[0]?.inject as () => { selectPanel: (panel: never) => void })()
    metricInjected.selectPanel('orders' as never)
    expect(selectPanel).toHaveBeenCalledWith('orders')
    const taskInjected = (slots.entries('department.dashboard.tasks')[0]?.inject as () => { selectPanel: (panel: never) => void })()
    taskInjected.selectPanel('calls' as never)
    expect(selectPanel).toHaveBeenLastCalledWith('calls')

    registry.deactivate()
    expect(slots.entries('main')).toHaveLength(0)
    await fiber.dispose()
  })

  it('rejects navigation panels absent from the Sales panel registry', async () => {
    const ctx = new Context()
    await ctx.plugin(SlotRegistry).await()
    ctx.provide('locale', new LocaleRuntime(ctx))
    const registry = new DepartmentFeatureRegistry(ctx)
    ctx.provide('layout', { selectPanel: vi.fn() } as never)
    const slots = ctx.get('slots') as SlotRegistry
    slots.register({
      name: 'root',
      children: { main: { kind: 'keyed', scope: 'root' }, 'sidebar.panellist': { kind: 'list', scope: 'root' } },
    } as never, () => null)
    await ctx.plugin({ inject: [...inject], apply }).await()
    const definition = (registry as unknown as { definitions: Map<string, DepartmentFeatureDefinition> })
      .definitions.get('sales-workspace')
    expect(() => { definition?.mount({ ...bootstrap, navigation: [{ ...bootstrap.navigation[0]!, panelId: 'unknown' as never }] }) })
      .toThrow(/is not registered/)
  })
})
