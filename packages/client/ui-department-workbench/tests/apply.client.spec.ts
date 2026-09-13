import { Context } from '@deepseek-ai/cordis'
import type { AppBootstrap } from '@deepseek-ai/dsh-api-app-bootstrap/types'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
import { describe, expect, it, vi } from 'vitest'
import { Dashboard, DashboardIcon } from '../src/client/Dashboard.tsx'
import { apply, inject } from '../src/client/index.ts'
import { apply as hostApply } from '../src/index.ts'

const bootstrap = {
  user: { id: 'user-one', name: 'Lin', role: { id: 'member', name: 'Member', kind: 'member' } },
  department: { id: 'sales', name: 'Sales', homePanelId: 'dashboard' },
  features: ['common-dashboard'],
  navigation: [{ id: 'dashboard', featureId: 'common-dashboard', panelId: 'dashboard' }],
} as unknown as AppBootstrap

describe('department workbench apply', () => {
  it('keeps the host entry inert and declares its client dependencies', () => {
    expect(hostApply).not.toThrow()
    expect(inject).toEqual(['appBootstrap', 'layout', 'locale', 'slots'])
  })

  it('registers, activates, injects, and tears down the common Dashboard', async () => {
    const ctx = new Context()
    await ctx.plugin(SlotRegistry).await()
    ctx.provide('locale', new LocaleRuntime(ctx))
    ctx.provide('appBootstrap', { getSnapshot: () => ({ phase: 'idle' }) } as never)
    const selectPanel = vi.fn()
    ctx.provide('layout', { selectPanel } as never)
    const slots = ctx.get('slots') as SlotRegistry
    slots.register({
      name: 'root',
      children: {
        main: { kind: 'keyed', scope: 'root' },
        'sidebar.panellist': { kind: 'list', scope: 'root' },
      },
    } as never, () => null)

    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    ctx.emit('app-bootstrap/ready', bootstrap)

    const [main] = slots.entries('main')
    const [nav] = slots.entries('sidebar.panellist')
    expect(main?.component).toBe(Dashboard)
    expect(nav?.component).toBe(DashboardIcon)
    expect(resolveSlotLabel(nav?.options.label)).toBe('Dashboard')
    expect(selectPanel).toHaveBeenCalledWith('dashboard')
    const injected = (main?.inject as () => { bootstrap: AppBootstrap; openAgent: () => void })()
    expect(injected.bootstrap).toBe(bootstrap)
    injected.openAgent()
    expect(selectPanel).toHaveBeenLastCalledWith(null)

    await fiber.dispose()
    expect(slots.entries('main')).toHaveLength(0)
    expect(slots.entries('sidebar.panellist')).toHaveLength(0)
  })

  it('reactivates the cached workbench when the client plugin mounts after bootstrap', async () => {
    const ctx = new Context()
    await ctx.plugin(SlotRegistry).await()
    ctx.provide('locale', new LocaleRuntime(ctx))
    ctx.provide('appBootstrap', { getSnapshot: () => ({ phase: 'ready', value: bootstrap }) } as never)
    const selectPanel = vi.fn()
    ctx.provide('layout', { selectPanel } as never)
    const slots = ctx.get('slots') as SlotRegistry
    slots.register({
      name: 'root',
      children: {
        main: { kind: 'keyed', scope: 'root' },
        'sidebar.panellist': { kind: 'list', scope: 'root' },
      },
    } as never, () => null)

    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()

    expect(slots.entries('main')[0]?.component).toBe(Dashboard)
    expect(slots.entries('sidebar.panellist')[0]?.component).toBe(DashboardIcon)
    expect(selectPanel).toHaveBeenCalledWith('dashboard')

    await fiber.dispose()
    expect(slots.entries('main')).toHaveLength(0)
    expect(slots.entries('sidebar.panellist')).toHaveLength(0)
  })
})
