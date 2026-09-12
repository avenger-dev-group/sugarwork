/** Tab-scoped welcome screen for the application shell; not authentication. */
import { useState, type FormEvent, type ReactNode } from 'react'
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
 * Present a one-click welcome screen before mounting the application.
 * Account and password inputs are presentation-only and are never read or stored.
 * Entry persists for this browser tab and provides no identity or authorization.
 * @param props - application content and localized copy.
 * @returns the welcome screen or application.
 */
export function LoginGate({ children, t }: LoginGateProps) {
  const [entered, setEntered] = useState(initiallyEntered)

  if (entered) return children

  const enter = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    sessionStorage.setItem(ENTRY_STORAGE_KEY, 'true')
    setEntered(true)
  }

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
          <Button type="submit" variant="primary" className={css.enter}>
            {t('login.submit')}
            <span className={css.arrow} aria-hidden="true">→</span>
          </Button>
        </form>
        <p className={css.notice}>{t('login.mockNotice')}</p>
      </section>
    </main>
  )
}
