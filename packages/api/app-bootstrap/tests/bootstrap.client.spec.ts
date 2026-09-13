import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import type { AppBootstrap } from '../src/types.ts'
import { AppBootstrapClient, apply, inject } from '../src/client/index.ts'

const bootstrap = {
  user: { id: 'user-one', name: 'Lin', role: { id: 'member', name: 'Member', kind: 'member' } },
  department: { id: 'platform', name: 'Business Platform', homePanelId: 'dashboard' },
  features: ['common-dashboard'],
  navigation: [{ id: 'dashboard', featureId: 'common-dashboard', panelId: 'dashboard' }],
} as unknown as AppBootstrap

describe('AppBootstrapClient', () => {
  it('coalesces concurrent loads and caches the accepted bootstrap', async () => {
    const get = vi.fn(async () => ({ ok: true, value: bootstrap }) as const)
    const ctx = new Context()
    const ready = vi.fn()
    ctx.on('app-bootstrap/ready', ready)
    const client = new AppBootstrapClient(ctx, { get })
    const notified = vi.fn()
    const unsubscribe = client.subscribe(notified)
    const first = client.load()
    const second = client.load()
    await expect(Promise.all([first, second])).resolves.toEqual([bootstrap, bootstrap])
    await client.load()
    expect(get).toHaveBeenCalledTimes(1)
    expect(client.getSnapshot()).toEqual({ phase: 'ready', value: bootstrap })
    expect(ready).toHaveBeenCalledWith(bootstrap)
    expect(notified).toHaveBeenCalledTimes(2)
    unsubscribe()
    client.reset()
    expect(client.getSnapshot()).toEqual({ phase: 'idle' })
    expect(notified).toHaveBeenCalledTimes(2)
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

  it.each([
    [{ code: 'network/unavailable' }, { phase: 'error', code: 'network/unavailable' }],
    [{ code: 503 }, { phase: 'error' }],
    [null, { phase: 'error' }],
    ['offline', { phase: 'error' }],
  ] as const)('classifies rejected Remote calls without assuming their value', async (failure, expected) => {
    // oxlint-disable-next-line typescript/prefer-promise-reject-errors -- non-Error Remote failures are the cases under test.
    const client = new AppBootstrapClient(new Context(), { get: vi.fn(async () => Promise.reject(failure)) })
    await expect(client.load()).resolves.toBeUndefined()
    expect(client.getSnapshot()).toEqual(expected)
  })

  it('wires the generated Remote namespace into the client service', async () => {
    const ctx = new Context()
    const get = vi.fn(async () => ({ ok: true, value: bootstrap }) as const)
    ctx.provide('remote', { appBootstrap: { get } } as never)
    apply(ctx)
    await expect(ctx.appBootstrap.load()).resolves.toBe(bootstrap)
    expect(inject).toEqual(['remote', 'remote.appBootstrap'])
  })
})
