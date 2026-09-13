import { Context } from '@deepseek-ai/cordis'
import { DepartmentWorkbenchError, type ResolvedDepartmentWorkbench } from '@deepseek-ai/dsh-department-workbench'
import { remoteErrorOf, remoteMethods } from '@deepseek-ai/dsh-typert-protocol'
import { describe, expect, it, vi } from 'vitest'
import AppBootstrapController from '../src/index.ts'

const resolved = {
  user: { id: 'user-one', name: 'Lin' },
  department: { id: 'sales', name: 'Sales', homePanelId: 'dashboard' },
  role: { id: 'member', name: 'Member', kind: 'member' },
  featureSet: {
    features: ['common-dashboard'],
    navigation: [{ id: 'dashboard', featureId: 'common-dashboard', panelId: 'dashboard' }],
  },
} as unknown as ResolvedDepartmentWorkbench

function controller(resolveCurrent: () => Promise<ResolvedDepartmentWorkbench>): AppBootstrapController {
  const ctx = new Context()
  ctx.provide('departmentWorkbench', { resolveCurrent } as never)
  return new AppBootstrapController(ctx)
}

describe('AppBootstrapController', () => {
  it('publishes and projects the appBootstrap Remote method', async () => {
    const service = controller(vi.fn(async () => resolved))
    expect(service.typertRemote.namespace).toBe('appBootstrap')
    expect(remoteMethods(service)).toEqual([{ method: 'get', invocation: { kind: 'direct' } }])
    await expect(service.get({})).resolves.toEqual({
      user: { id: 'user-one', name: 'Lin', role: { id: 'member', name: 'Member', kind: 'member' } },
      department: { id: 'sales', name: 'Sales', homePanelId: 'dashboard' },
      features: ['common-dashboard'],
      navigation: [{ id: 'dashboard', featureId: 'common-dashboard', panelId: 'dashboard' }],
    })
  })

  it.each([
    ['workbench-unconfigured', 'account/workbench-unconfigured'],
    ['account-disabled', 'account/disabled'],
    ['department-disabled', 'department/disabled'],
    ['directory-invalid', 'department/directory-invalid'],
  ] as const)('maps %s to %s', async (source, expected) => {
    const service = controller(async () => { throw new DepartmentWorkbenchError(source, 'unavailable') })
    const failure = await service.get({}).catch((error: unknown) => error)
    expect(remoteErrorOf(failure)).toMatchObject({ code: expected, message: 'unavailable', details: {} })
  })

  it('preserves failures outside the workbench error vocabulary', async () => {
    const failure = new Error('provider failed')
    const service = controller(async () => { throw failure })
    await expect(service.get({})).rejects.toBe(failure)
  })

  it('rejects an impossible workbench error code', async () => {
    const service = controller(async () => {
      throw new DepartmentWorkbenchError('unknown' as never, 'unknown')
    })
    await expect(service.get({})).rejects.toThrow('unreachable department workbench error: unknown')
  })
})
