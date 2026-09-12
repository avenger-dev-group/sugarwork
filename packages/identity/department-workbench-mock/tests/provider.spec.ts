import { Context } from '@deepseek-ai/cordis'
import { brandString } from '@deepseek-ai/dsh-brand'
import { describe, expect, it } from 'vitest'
import type { DepartmentActionId } from '@deepseek-ai/dsh-department-workbench'
import { MockDepartmentWorkbenchProvider, type Config } from '../src/index.ts'

function directory(overrides: Partial<Config> = {}): Config {
  return {
    currentUserId: 'user-one',
    users: [{ id: 'user-one', name: 'Lin', status: 'active', primaryDepartmentId: 'platform' }],
    departments: [{ id: 'platform', name: 'Business Platform', status: 'active', featureSetId: 'common', agentPresetId: 'standard', homePanelId: 'dashboard' }],
    memberships: [{ id: 'membership-one', userId: 'user-one', departmentId: 'platform', roleId: 'member', status: 'active' }],
    roles: [{ id: 'member', name: 'Member', kind: 'member' }],
    featureSets: [{ id: 'common', features: ['common-dashboard'], navigation: [{ id: 'dashboard', featureId: 'common-dashboard', panelId: 'dashboard' }] }],
    policies: [{ id: 'member-policy', departmentId: 'platform', roleId: 'member', actions: ['session-create'], dataScopes: [{ kind: 'department', resource: 'shared' }] }],
    ...overrides,
  }
}

describe('MockDepartmentWorkbenchProvider', () => {
  it('resolves the deployment-selected primary workbench and policy', async () => {
    const provider = new MockDepartmentWorkbenchProvider(new Context(), directory())
    const resolved = await provider.resolveCurrent()
    expect(resolved.department.agentPresetId).toBe('standard')
    expect(resolved.featureSet.features).toEqual(['common-dashboard'])
    expect(resolved.policy.dataScopes).toEqual([{ kind: 'department', resource: 'shared' }])
  })

  it('rejects an account without a primary department', async () => {
    const provider = new MockDepartmentWorkbenchProvider(new Context(), directory({
      users: [{ id: 'user-one', name: 'Lin', status: 'active' }],
    }))
    await expect(provider.resolveCurrent()).rejects.toMatchObject({ code: 'workbench-unconfigured' })
  })

  it('authorizes only the resolved identity and policy action', async () => {
    const provider = new MockDepartmentWorkbenchProvider(new Context(), directory())
    const resolved = await provider.resolveCurrent()
    await expect(provider.authorize({
      userId: resolved.user.id,
      departmentId: resolved.department.id,
      action: brandString<DepartmentActionId>('session-create'),
    })).resolves.toEqual({ allowed: true, constraints: [{ kind: 'department', resource: 'shared' }] })
    await expect(provider.authorize({
      userId: resolved.user.id,
      departmentId: resolved.department.id,
      action: brandString<DepartmentActionId>('crm-delete'),
    })).resolves.toEqual({ allowed: false, reason: 'action-denied' })
  })

  it('fails fast when the home panel is absent from navigation', () => {
    expect(() => new MockDepartmentWorkbenchProvider(new Context(), directory({
      featureSets: [{ id: 'common', features: ['common-dashboard'], navigation: [] }],
    }))).toThrow(/home panel/)
  })
})
