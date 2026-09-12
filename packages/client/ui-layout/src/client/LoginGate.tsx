/** Tab-scoped entry screen that admits only a server-resolved workbench. */
import { useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react'
import type { IAppBootstrapClient } from '@deepseek-ai/dsh-api-app-bootstrap/client'
import { Button, Input } from '@deepseek-ai/dsh-client-ui-primitives'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import css from './LoginGate.module.css'

const ENTRY_STORAGE_KEY = 'sugarwork.workspace.entered'
const AUTOMATION_ENTRY_HASH = '#dsh-enter-workspace'

/** Props for the workspace welcome screen. */
export interface LoginGateProps {
  /** Application tree, not mounted before the user enters the workspace. */
  children: ReactNode
  /** Application-shell translator. */
  t: TranslateNS<'common'>
  /** Server bootstrap state and load command. */
  appBootstrap: IAppBootstrapClient
}

/** Read the tab's entry state and consume the browser automation handoff. */
function initiallyEntered(): boolean {
  if (location.hash === AUTOMATION_ENTRY_HASH) {
    sessionStorage.setItem(ENTRY_STORAGE_KEY, 'true')
    history.replaceState(history.state, '', `${location.pathname}${location.search}`)
  }
  return sessionStorage.getItem(ENTRY_STORAGE_KEY) === 'true'
}

/**
 * Present the workbench entry screen and mount the application only after the
 * server resolves the current account, department, role, and feature set.
 * Account and password inputs remain presentation-only while the configured
 * mock provider owns the current user.
 * @param props - application content and localized copy.
 * @returns the welcome screen or application.
 */
export function LoginGate({ children, t, appBootstrap }: LoginGateProps) {
  const [entered, setEntered] = useState(initiallyEntered)
  const state = useSyncExternalStore(
    listener => appBootstrap.subscribe(listener),
    () => appBootstrap.getSnapshot(),
  )

  useEffect(() => {
    if (entered && state.phase === 'idle') void appBootstrap.load()
  }, [appBootstrap, entered, state.phase])

  if (state.phase === 'ready') return children

  const enter = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    sessionStorage.setItem(ENTRY_STORAGE_KEY, 'true')
    setEntered(true)
    void appBootstrap.load()
  }

  const error = state.phase === 'error'
    ? state.code === 'account/workbench-unconfigured'
      ? t('login.error.unconfigured')
      : state.code === 'department/disabled'
        ? t('login.error.departmentDisabled')
        : state.code === 'account/disabled'
          ? t('login.error.accountDisabled')
          : t('login.error.generic')
    : undefined

  return (
    <main className={css.page}>
      <section className={css.welcome} aria-labelledby="workspace-welcome-title">
        <div className={css.brandRow}>
          <img className={css.mark} src="./favicon.png" width={56} height={56} alt="" aria-hidden="true" />
          <span className={css.brandName}>{t('brand.name')}</span>
        </div>
        <h1 id="workspace-welcome-title">{t('login.title')}</h1>
        <p className={css.description}>{t('login.description')}</p>
        <form className={css.form} onSubmit={enter}>
          <label className={css.label}>
            <span>{t('login.username')}</span>
            <Input className={css.field} autoComplete="username" placeholder={t('login.username.placeholder')} />
          </label>
          <label className={css.label}>
            <span>{t('login.password')}</span>
            <Input className={css.field} type="password" autoComplete="current-password" placeholder={t('login.password.placeholder')} />
          </label>
          <Button type="submit" variant="primary" className={css.enter} disabled={state.phase === 'loading'}>
            {state.phase === 'loading' ? t('login.loading') : error === undefined ? t('login.submit') : t('login.retry')}
            <span className={css.arrow} aria-hidden="true">→</span>
          </Button>
        </form>
        {error !== undefined && <p className={css.error} role="alert">{error}</p>}
        <p className={css.notice}>{t('login.mockNotice')}</p>
      </section>
    </main>
  )
}
