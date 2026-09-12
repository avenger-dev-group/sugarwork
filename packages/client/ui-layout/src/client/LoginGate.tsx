/** Browser-session mock login gate for the application shell. */
import { useState, type FormEvent, type ReactNode } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import css from './LoginGate.module.css'

const MOCK_USERNAME = 'simon'
const LOGIN_STORAGE_KEY = 'sugarwork.mock-login.username'
const AUTOMATION_LOGIN_HASH = '#dsh-mock-login=simon'

/** Props for the mock login gate. */
export interface LoginGateProps {
  /** Authenticated application tree, not mounted before login succeeds. */
  children: ReactNode
  /** Application-shell translator. */
  t: TranslateNS<'common'>
}

/** Read whether this browser tab already completed the mock login. */
function initiallyAuthenticated(): boolean {
  if (location.hash === AUTOMATION_LOGIN_HASH) {
    sessionStorage.setItem(LOGIN_STORAGE_KEY, MOCK_USERNAME)
    history.replaceState(history.state, '', `${location.pathname}${location.search}`)
  }
  return sessionStorage.getItem(LOGIN_STORAGE_KEY) === MOCK_USERNAME
}

/**
 * Require the temporary local identity before mounting the main application.
 * The password is intentionally not inspected; this component is a UI-flow
 * placeholder and provides no server-side authorization.
 * @param props - authenticated content and localized copy.
 * @returns the login form or authenticated application.
 */
export function LoginGate({ children, t }: LoginGateProps) {
  const [authenticated, setAuthenticated] = useState(initiallyAuthenticated)
  const [username, setUsername] = useState('')
  const [invalid, setInvalid] = useState(false)

  if (authenticated) return children

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (username.trim() !== MOCK_USERNAME) {
      setInvalid(true)
      return
    }
    sessionStorage.setItem(LOGIN_STORAGE_KEY, MOCK_USERNAME)
    setAuthenticated(true)
  }

  return (
    <main className={css.page}>
      <div className={css.grid} aria-hidden="true" />
      <section className={css.brandPanel} aria-label={t('brand.name')}>
        <div className={css.brandRow}>
          <span className={css.mark} aria-hidden="true">{t('brand.markFallback')}</span>
          <span className={css.brandName}>{t('brand.name')}</span>
        </div>
        <div className={css.signal}>
          <span className={css.signalDot} aria-hidden="true" />
          {t('login.status')}
        </div>
        <div className={css.statement} aria-hidden="true">
          <span>{t('login.statement.build')}</span>
          <span>{t('login.statement.think')}</span>
          <span>{t('login.statement.ship')}</span>
        </div>
        <p className={css.mockNotice}>{t('login.mockNotice')}</p>
      </section>

      <section className={css.formPanel}>
        <form className={css.form} onSubmit={submit}>
          <p className={css.eyebrow}>{t('login.eyebrow')}</p>
          <h1>{t('login.title')}</h1>
          <p className={css.description}>{t('login.description')}</p>

          <label className={css.field}>
            <span>{t('login.username')}</span>
            <input
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              placeholder={t('login.username.placeholder')}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? 'mock-login-error' : undefined}
              onChange={(event) => {
                setUsername(event.currentTarget.value)
                if (invalid) setInvalid(false)
              }}
            />
          </label>

          <label className={css.field}>
            <span>{t('login.password')}</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder={t('login.password.placeholder')}
            />
          </label>

          <div className={css.errorSlot} aria-live="polite">
            {invalid && <p id="mock-login-error" role="alert">{t('login.invalid')}</p>}
          </div>

          <button type="submit">
            <span>{t('login.submit')}</span>
            <span aria-hidden="true">↗</span>
          </button>
        </form>
      </section>
    </main>
  )
}
