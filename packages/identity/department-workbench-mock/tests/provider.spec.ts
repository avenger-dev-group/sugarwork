import { Context } from '@deepseek-ai/cordis'
import { brandString } from '@deepseek-ai/dsh-brand'
import { describe, expect, it } from 'vitest'
import type { DepartmentActionId, UserId } from '@deepseek-ai/dsh-department-workbench'
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
      userId: brandString<UserId>('another-user'),
      departmentId: resolved.department.id,
      action: brandString<DepartmentActionId>('session-create'),
    })).resolves.toEqual({ allowed: false, reason: 'identity-mismatch' })
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

  it.each([
    ['duplicate ids', { users: [
      { id: 'user-one', name: 'Lin', status: 'active', primaryDepartmentId: 'platform' },
      { id: 'user-one', name: 'Other', status: 'active', primaryDepartmentId: 'platform' },
    ] }, /duplicate user id/],
    ['duplicate membership ids', { memberships: [
      { id: 'membership-one', userId: 'user-one', departmentId: 'platform', roleId: 'member', status: 'active' },
      { id: 'membership-one', userId: 'user-one', departmentId: 'platform-two', roleId: 'member', status: 'active' },
    ], departments: [
      { id: 'platform', name: 'Platform', status: 'active', featureSetId: 'common', agentPresetId: 'standard', homePanelId: 'dashboard' },
      { id: 'platform-two', name: 'Platform 2', status: 'active', featureSetId: 'common', agentPresetId: 'standard', homePanelId: 'dashboard' },
    ] }, /duplicate membership id/],
    ['duplicate membership pairs', { memberships: [
      { id: 'membership-one', userId: 'user-one', departmentId: 'platform', roleId: 'member', status: 'active' },
      { id: 'membership-two', userId: 'user-one', departmentId: 'platform', roleId: 'member', status: 'disabled' },
    ] }, /duplicate user and department membership/],
    ['missing membership reference', { memberships: [
      { id: 'membership-one', userId: 'missing', departmentId: 'platform', roleId: 'member', status: 'active' },
    ] }, /membership references/],
    ['missing feature set', { departments: [
      { id: 'platform', name: 'Platform', status: 'active', featureSetId: 'missing', agentPresetId: 'standard', homePanelId: 'dashboard' },
    ] }, /missing feature set/],
    ['disabled navigation feature', { featureSets: [
      { id: 'common', features: [], navigation: [{ id: 'dashboard', featureId: 'common-dashboard', panelId: 'dashboard' }] },
    ] }, /disabled feature/],
    ['missing policy reference', { policies: [
      { id: 'member-policy', departmentId: 'missing', roleId: 'member', actions: [], dataScopes: [] },
    ] }, /policy references/],
    ['duplicate policy pair', { policies: [
      { id: 'member-policy', departmentId: 'platform', roleId: 'member', actions: [], dataScopes: [] },
      { id: 'member-policy-two', departmentId: 'platform', roleId: 'member', actions: [], dataScopes: [] },
    ] }, /duplicate department and role policy/],
  ] as const)('rejects %s', (_name, overrides, expected) => {
    expect(() => new MockDepartmentWorkbenchProvider(new Context(), directory(overrides as Partial<Config>)))
      .toThrow(expected)
  })

  it.each([
    ['unknown user', { currentUserId: 'missing' }, 'workbench-unconfigured'],
    ['disabled user', { users: [{ id: 'user-one', name: 'Lin', status: 'disabled', primaryDepartmentId: 'platform' }] }, 'account-disabled'],
    ['missing department', { users: [{ id: 'user-one', name: 'Lin', status: 'active', primaryDepartmentId: 'missing' }] }, 'workbench-unconfigured'],
    ['disabled department', { departments: [{ id: 'platform', name: 'Platform', status: 'disabled', featureSetId: 'common', agentPresetId: 'standard', homePanelId: 'dashboard' }] }, 'department-disabled'],
    ['inactive membership', { memberships: [{ id: 'membership-one', userId: 'user-one', departmentId: 'platform', roleId: 'member', status: 'disabled' }] }, 'workbench-unconfigured'],
    ['missing policy', { policies: [] }, 'directory-invalid'],
  ] as const)('rejects a %s during resolution', async (_name, overrides, code) => {
    const provider = new MockDepartmentWorkbenchProvider(new Context(), directory(overrides))
    await expect(provider.resolveCurrent()).rejects.toMatchObject({ code })
  })
})
