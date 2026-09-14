/** Client feature activation registry driven by one server bootstrap. */

import { Context, Service } from '@deepseek-ai/cordis'
import type { AppBootstrap, AppFeatureId, AppWorkbenchPanelId } from '@deepseek-ai/dsh-api-app-bootstrap/types'

/** One client feature and the panels it owns. */
export interface DepartmentFeatureDefinition {
  readonly id: AppFeatureId
  readonly panels: readonly AppWorkbenchPanelId[]
  /** Mount the feature's slot contributions for the accepted bootstrap. */
  readonly mount: (bootstrap: AppBootstrap) => () => void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Registry of workbench features activated by server bootstrap. */
    departmentFeatures: DepartmentFeatureRegistry
  }
}

/** Validates and activates exactly the features enabled by bootstrap. */
export class DepartmentFeatureRegistry extends Service {
  private readonly definitions = new Map<AppFeatureId, DepartmentFeatureDefinition>()
  private active: readonly (() => void)[] = []
  private current: AppBootstrap | undefined

  /** @param ctx - owning Client context. */
  constructor(ctx: Context) {
    super(ctx, 'departmentFeatures')
  }

  /**
   * Register one stable feature definition.
   * @param definition - feature id, panel ownership, and mount callback.
   * @returns disposer that also unmounts the feature when active.
   */
  register(definition: DepartmentFeatureDefinition): () => void {
    if (this.definitions.has(definition.id)) {
      throw new Error(`department feature ${JSON.stringify(definition.id)} is already registered`)
    }
    this.definitions.set(definition.id, definition)
    try {
      this.activateCurrentIfComplete()
    } catch (error) {
      this.definitions.delete(definition.id)
      throw error
    }
    return () => {
      this.definitions.delete(definition.id)
      if (this.current?.features.includes(definition.id) === true) this.deactivate()
    }
  }

  /**
   * Validate one bootstrap and mount all enabled feature contributions.
   * @param bootstrap - server-selected feature and navigation identifiers.
   */
  activate(bootstrap: AppBootstrap): void {
    this.mount(bootstrap)
    this.current = bootstrap
  }

  /**
   * Retain a cached bootstrap and mount it once every enabled feature has registered.
   * @param bootstrap - previously accepted server bootstrap restored after client-plugin replacement.
   */
  resume(bootstrap: AppBootstrap): void {
    this.current = bootstrap
    this.activateCurrentIfComplete()
  }

  private activateCurrentIfComplete(): void {
    if (
      this.current === undefined
      || this.active.length > 0
      || this.current.features.some(id => !this.definitions.has(id))
    ) return
    this.mount(this.current)
  }

  private mount(bootstrap: AppBootstrap): void {
    const enabled = new Set(bootstrap.features)
    const definitions = bootstrap.features.map((id) => {
      const definition = this.definitions.get(id)
      if (definition === undefined) {
        throw new Error(`department feature ${JSON.stringify(id)} is not registered`)
      }
      return definition
    })
    const panelOwners = new Map<AppWorkbenchPanelId, AppFeatureId>()
    for (const definition of definitions) {
      for (const panel of definition.panels) {
        const owner = panelOwners.get(panel)
        if (owner !== undefined) {
          throw new Error(`workbench panel ${JSON.stringify(panel)} is owned by both ${JSON.stringify(owner)} and ${JSON.stringify(definition.id)}`)
        }
        panelOwners.set(panel, definition.id)
      }
    }
    for (const item of bootstrap.navigation) {
      if (!enabled.has(item.featureId)) {
        throw new Error(`navigation item ${JSON.stringify(item.id)} references a disabled feature`)
      }
      if (panelOwners.get(item.panelId) !== item.featureId) {
        throw new Error(`navigation item ${JSON.stringify(item.id)} references a panel outside its feature`)
      }
    }
    if (!bootstrap.navigation.some(item => item.panelId === bootstrap.department.homePanelId)) {
      throw new Error(`home panel ${JSON.stringify(bootstrap.department.homePanelId)} is absent from navigation`)
    }
    const mounted: Array<() => void> = []
    try {
      for (const definition of definitions) mounted.push(definition.mount(bootstrap))
    } catch (error) {
      for (const dispose of mounted.reverse()) dispose()
      throw error
    }
    this.deactivate()
    this.active = mounted
  }

  /** Unmount all currently active feature contributions. */
  deactivate(): void {
    for (const dispose of [...this.active].reverse()) dispose()
    this.active = []
  }
}
