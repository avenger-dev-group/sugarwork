import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import type { AppBootstrap } from '../src/types.ts'
import { AppBootstrapClient } from '../src/client/index.ts'

const bootstrap = {
  user: { id: 'user-one', name: 'Lin', role: { id: 'member', name: 'Member', kind: 'member' } },
  department: { id: 'platform', name: 'Business Platform', homePanelId: 'dashboard' },
  features: ['common-dashboard'],
  navigation: [{ id: 'dashboard', featureId: 'common-dashboard', panelId: 'dashboard' }],
} as unknown as AppBootstrap

describe('AppBootstrapClient', () => {
  it('coalesces concurrent loads and caches the accepted bootstrap', async () => {
    const get = vi.fn(async () => ({ ok: true, value: bootstrap }) as const)
    const client = new AppBootstrapClient(new Context(), { get })
    const first = client.load()
    const second = client.load()
    await expect(Promise.all([first, second])).resolves.toEqual([bootstrap, bootstrap])
    await client.load()
    expect(get).toHaveBeenCalledTimes(1)
    expect(client.getSnapshot()).toEqual({ phase: 'ready', value: bootstrap })
  })

  it('publishes a stable remote error code and permits retry', async () => {
    const get = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        error: { code: 'account/workbench-unconfigured', message: 'not configured', details: {} },
      } as const)
      .mockResolvedValueOnce({ ok: true, value: bootstrap } as const)
    const client = new AppBootstrapClient(new Context(), { get })
    await expect(client.load()).resolves.toBeUndefined()
    expect(client.getSnapshot()).toEqual({ phase: 'error', code: 'account/workbench-unconfigured' })
    await expect(client.load()).resolves.toEqual(bootstrap)
  })
})
