/** React-free client bootstrap state over the generated Remote namespace. */

import { Context, Service } from '@deepseek-ai/cordis'
import type { ClientRemote } from '@deepseek-ai/dsh-api-gateway/client'
import { notifySubscribers, type ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { AppBootstrap } from '../types.ts'

/** Application bootstrap loading state. */
export type AppBootstrapState =
  | { readonly phase: 'idle' }
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly value: AppBootstrap }
  | { readonly phase: 'error'; readonly code?: string }

/** Client bootstrap commands and observable state. */
export interface IAppBootstrapClient extends ObservableSnapshot<AppBootstrapState> {
  /**
   * Resolve the server-owned current workbench, coalescing concurrent callers.
   * @returns the accepted bootstrap, or undefined after a classified failure.
   */
  load(): Promise<AppBootstrap | undefined>
  /** Return to the entry screen without changing server identity. */
  reset(): void
}

interface AppBootstrapRemote {
  get(request: Record<never, never>): Promise<RemoteResult<AppBootstrap>>
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Client-side current workbench bootstrap state. */
    appBootstrap: IAppBootstrapClient
  }
}

/** Client service caching one bootstrap per active entry lifecycle. */
export class AppBootstrapClient extends Service implements IAppBootstrapClient {
  private state: AppBootstrapState = { phase: 'idle' }
  private readonly listeners = new Set<() => void>()
  private pending: Promise<AppBootstrap | undefined> | undefined

  /**
   * @param ctx - Client context that owns the service.
   * @param remote - generated bootstrap Remote namespace.
   */
  constructor(ctx: Context, private readonly remote: AppBootstrapRemote) {
    super(ctx, 'appBootstrap')
  }

  /** Current immutable loading state. */
  getSnapshot = (): AppBootstrapState => this.state

  /** Subscribe to state replacement. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /**
   * Resolve and cache the current workbench.
   * @returns the accepted bootstrap, or undefined after a classified failure.
   */
  load(): Promise<AppBootstrap | undefined> {
    if (this.state.phase === 'ready') return Promise.resolve(this.state.value)
    if (this.pending !== undefined) return this.pending
    this.publish({ phase: 'loading' })
    this.pending = this.remote.get({}).then(
      (result) => {
        if (!result.ok) {
          this.publish({ phase: 'error', code: result.error.code })
          return undefined
        }
        this.publish({ phase: 'ready', value: result.value })
        this.ctx.emit('app-bootstrap/ready', result.value)
        return result.value
      },
      (error: unknown) => {
        this.publish({ phase: 'error', ...remoteErrorCode(error) })
        return undefined
      },
    ).finally(() => { this.pending = undefined })
    return this.pending
  }

  /** Clear the client-side bootstrap cache. */
  reset(): void {
    this.publish({ phase: 'idle' })
  }

  private publish(state: AppBootstrapState): void {
    this.state = state
    notifySubscribers(this.listeners, '[app-bootstrap]')
  }
}

declare module '@deepseek-ai/cordis' {
  interface Events {
    /**
     * The client accepted a complete server-resolved workbench bootstrap.
     * @mode emit
     * @param value - accepted bootstrap value.
     */
    'app-bootstrap/ready'(value: AppBootstrap): void
  }
}

/** Required generated Remote namespace. */
export const inject = ['remote', 'remote.appBootstrap']

/**
 * Provide the client bootstrap state service.
 * @param ctx - Client root Context.
 */
export function apply(ctx: Context): void {
  const remote = (ctx.remote as ClientRemote & { appBootstrap: AppBootstrapRemote }).appBootstrap
  new AppBootstrapClient(ctx, remote)
}

function remoteErrorCode(error: unknown): { readonly code?: string } {
  if (typeof error !== 'object' || error === null || !('code' in error)) return {}
  return typeof error.code === 'string' ? { code: error.code } : {}
}
