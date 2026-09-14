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
    const disabledFeature = brandString<AppFeatureId>('sales-workspace')
    const disabledPanel = brandString<AppWorkbenchPanelId>('customers')
    const disposeMounted = vi.fn()
    const mount = vi.fn(() => disposeMounted)
    registry.register({ id: feature, panels: [panel], mount })
    registry.activate(bootstrap)
    expect(mount).toHaveBeenCalledWith(bootstrap)
    const unregisterDisabled = registry.register({ id: disabledFeature, panels: [disabledPanel], mount: vi.fn(() => () => {}) })
    unregisterDisabled()
    expect(mount).toHaveBeenCalledOnce()
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

  it('rejects duplicate registrations and unregisters through its disposer', () => {
    const registry = new DepartmentFeatureRegistry(new Context())
    const dispose = registry.register({ id: feature, panels: [panel], mount: () => () => {} })
    expect(() => { registry.register({ id: feature, panels: [panel], mount: () => () => {} }) }).toThrow(/already registered/)
    dispose()
    expect(() => { registry.activate(bootstrap) }).toThrow(/not registered/)
  })

  it('resumes a cached bootstrap after all enabled features register again', () => {
    const registry = new DepartmentFeatureRegistry(new Context())
    const otherFeature = brandString<AppFeatureId>('sales-workspace')
    const otherPanel = brandString<AppWorkbenchPanelId>('customers')
    const firstDispose = vi.fn()
    const secondDispose = vi.fn()
    const firstMount = vi.fn(() => firstDispose)
    const secondMount = vi.fn(() => secondDispose)
    registry.register({ id: feature, panels: [panel], mount: firstMount })
    const twoFeatures = {
      ...bootstrap,
      features: [feature, otherFeature],
      navigation: [
        ...bootstrap.navigation,
        { id: brandString<AppNavigationItemId>('customers'), featureId: otherFeature, panelId: otherPanel },
      ],
    }

    registry.resume(twoFeatures)
    expect(firstMount).not.toHaveBeenCalled()
    const unregister = registry.register({ id: otherFeature, panels: [otherPanel], mount: secondMount })
    expect(firstMount).toHaveBeenCalledWith(twoFeatures)
    expect(secondMount).toHaveBeenCalledWith(twoFeatures)

    unregister()
    expect(firstDispose).toHaveBeenCalledOnce()
    expect(secondDispose).toHaveBeenCalledOnce()
    registry.register({ id: otherFeature, panels: [otherPanel], mount: secondMount })
    expect(firstMount).toHaveBeenCalledTimes(2)
    expect(secondMount).toHaveBeenCalledTimes(2)
  })

  it('rolls back a late registration that makes a resumed bootstrap invalid', () => {
    const registry = new DepartmentFeatureRegistry(new Context())
    const otherFeature = brandString<AppFeatureId>('sales-workspace')
    const otherPanel = brandString<AppWorkbenchPanelId>('customers')
    registry.register({ id: feature, panels: [panel], mount: () => () => {} })
    registry.resume({ ...bootstrap, features: [feature, otherFeature] })

    expect(() => {
      registry.register({ id: otherFeature, panels: [panel], mount: () => () => {} })
    }).toThrow(/owned by both/)
    expect(() => {
      registry.register({ id: otherFeature, panels: [otherPanel], mount: () => () => {} })
    }).not.toThrow()
  })

  it('rejects duplicate panel ownership, disabled navigation, and absent home navigation', () => {
    const registry = new DepartmentFeatureRegistry(new Context())
    const otherFeature = brandString<AppFeatureId>('sales-workspace')
    registry.register({ id: feature, panels: [panel], mount: () => () => {} })
    registry.register({ id: otherFeature, panels: [panel], mount: () => () => {} })
    expect(() => { registry.activate({ ...bootstrap, features: [feature, otherFeature] }) }).toThrow(/owned by both/)
    expect(() => {
      registry.activate({
        ...bootstrap,
        features: [feature],
        navigation: [{ ...bootstrap.navigation[0]!, featureId: otherFeature }],
      })
    }).toThrow(/disabled feature/)
    expect(() => { registry.activate({ ...bootstrap, navigation: [] }) }).toThrow(/absent from navigation/)
  })

  it('unwinds earlier mounts when a later feature mount fails and replaces active mounts', () => {
    const registry = new DepartmentFeatureRegistry(new Context())
    const otherFeature = brandString<AppFeatureId>('sales-workspace')
    const otherPanel = brandString<AppWorkbenchPanelId>('customers')
    const firstDispose = vi.fn()
    registry.register({ id: feature, panels: [panel], mount: () => firstDispose })
    registry.register({ id: otherFeature, panels: [otherPanel], mount: () => { throw new Error('mount failed') } })
    const twoFeatures = {
      ...bootstrap,
      features: [feature, otherFeature],
      navigation: [
        ...bootstrap.navigation,
        { id: brandString<AppNavigationItemId>('customers'), featureId: otherFeature, panelId: otherPanel },
      ],
    }
    expect(() => { registry.activate(twoFeatures) }).toThrow('mount failed')
    expect(firstDispose).toHaveBeenCalledOnce()

    registry.activate(bootstrap)
    registry.activate(bootstrap)
    expect(firstDispose).toHaveBeenCalledTimes(2)
  })
})
