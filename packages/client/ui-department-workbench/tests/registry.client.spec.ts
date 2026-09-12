import { Context } from '@deepseek-ai/cordis'
import { brandString } from '@deepseek-ai/dsh-brand'
import { describe, expect, it, vi } from 'vitest'
import type { AppBootstrap, AppFeatureId, AppNavigationItemId, AppWorkbenchPanelId } from '@deepseek-ai/dsh-api-app-bootstrap/types'
import { DepartmentFeatureRegistry } from '../src/client/registry.ts'

const feature = brandString<AppFeatureId>('common-dashboard')
const panel = brandString<AppWorkbenchPanelId>('dashboard')
const bootstrap = {
  user: { id: 'user-one', name: 'Lin', role: { id: 'member', name: 'Member', kind: 'member' } },
  department: { id: 'platform', name: 'Business Platform', homePanelId: panel },
  features: [feature],
  navigation: [{ id: brandString<AppNavigationItemId>('dashboard'), featureId: feature, panelId: panel }],
} as unknown as AppBootstrap

describe('DepartmentFeatureRegistry', () => {
  it('mounts only the server-enabled registered features and unwinds them', () => {
    const registry = new DepartmentFeatureRegistry(new Context())
    const disposeMounted = vi.fn()
    const mount = vi.fn(() => disposeMounted)
    registry.register({ id: feature, panels: [panel], mount })
    registry.activate(bootstrap)
    expect(mount).toHaveBeenCalledWith(bootstrap)
    registry.deactivate()
    expect(disposeMounted).toHaveBeenCalledOnce()
  })

  it('rejects navigation whose panel is not owned by its feature', () => {
    const registry = new DepartmentFeatureRegistry(new Context())
    registry.register({ id: feature, panels: [], mount: () => () => {} })
    expect(() => { registry.activate(bootstrap) }).toThrow(/outside its feature/)
  })

  it('rejects an enabled feature without a client registration', () => {
    const registry = new DepartmentFeatureRegistry(new Context())
    expect(() => { registry.activate(bootstrap) }).toThrow(/not registered/)
  })
})
