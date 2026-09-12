// @vitest-environment jsdom
/** User-visible behavior of the temporary browser-session login gate. */
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { en } from '@deepseek-ai/dsh-client-locale/src/locales/en.ts'
import { LoginGate } from '../src/client/LoginGate.tsx'

const t = ((key: string) => {
  if (key === 'brand.name') return 'SugarWork'
  if (key === 'brand.markFallback') return 'SW'
  return en[key as keyof typeof en]
}) as TranslateNS<'common'>

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  history.replaceState(null, '', '/')
})

describe('LoginGate', () => {
  it('keeps the application unmounted and reports an incorrect username', () => {
    const view = render(<LoginGate t={t}><div>private workspace</div></LoginGate>)

    expect(view.queryByText('private workspace')).toBeNull()
    fireEvent.change(view.getByLabelText('Username'), { target: { value: 'someone' } })
    fireEvent.click(view.getByRole('button', { name: /Enter workspace/ }))
    expect(view.getByRole('alert').textContent).toContain('Use simon')

    fireEvent.change(view.getByLabelText('Username'), { target: { value: 'simon' } })
    expect(view.queryByRole('alert')).toBeNull()
  })

  it('accepts simon with an empty password and retains the login for this tab', () => {
    const view = render(<LoginGate t={t}><div>private workspace</div></LoginGate>)

    fireEvent.change(view.getByLabelText('Username'), { target: { value: ' simon ' } })
    expect((view.getByLabelText('Password') as HTMLInputElement).value).toBe('')
    fireEvent.click(view.getByRole('button', { name: /Enter workspace/ }))

    expect(view.getByText('private workspace')).toBeTruthy()
    expect(sessionStorage.getItem('sugarwork.mock-login.username')).toBe('simon')
  })

  it('restores an authenticated browser session without rendering the form', () => {
    sessionStorage.setItem('sugarwork.mock-login.username', 'simon')
    const view = render(<LoginGate t={t}><div>private workspace</div></LoginGate>)

    expect(view.getByText('private workspace')).toBeTruthy()
    expect(view.queryByRole('heading', { name: 'Sign in to SugarWork' })).toBeNull()
  })

  it('accepts the browser-test handoff marker and removes it from the address', () => {
    history.replaceState(null, '', '/workspace?fixture#dsh-mock-login=simon')
    const view = render(<LoginGate t={t}><div>private workspace</div></LoginGate>)

    expect(view.getByText('private workspace')).toBeTruthy()
    expect(location.pathname).toBe('/workspace')
    expect(location.search).toBe('?fixture')
    expect(location.hash).toBe('')
  })
})
