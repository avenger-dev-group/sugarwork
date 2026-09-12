// @vitest-environment jsdom
/** User-visible behavior of the tab-scoped workspace entry. */
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
  it('keeps the application unmounted until the user enters without credentials', () => {
    const view = render(<LoginGate t={t}><div>private workspace</div></LoginGate>)

    expect(view.queryByText('private workspace')).toBeNull()
    expect((view.getByLabelText('Account') as HTMLInputElement).value).toBe('')
    expect((view.getByLabelText('Password') as HTMLInputElement).type).toBe('password')
    fireEvent.click(view.getByRole('button', { name: /Enter workspace/ }))
    expect(view.getByText('private workspace')).toBeTruthy()
  })

  it('retains entry when the application remounts in the same tab', () => {
    const view = render(<LoginGate t={t}><div>private workspace</div></LoginGate>)

    fireEvent.click(view.getByRole('button', { name: /Enter workspace/ }))
    view.unmount()
    const restored = render(<LoginGate t={t}><div>private workspace</div></LoginGate>)
    expect(restored.getByText('private workspace')).toBeTruthy()
  })

  it('accepts arbitrary display credentials without retaining them', () => {
    const view = render(<LoginGate t={t}><div>private workspace</div></LoginGate>)
    fireEvent.change(view.getByLabelText('Account'), { target: { value: 'any-account' } })
    fireEvent.change(view.getByLabelText('Password'), { target: { value: 'demo-password' } })
    fireEvent.click(view.getByRole('button', { name: /Enter workspace/ }))
    expect(view.getByText('private workspace')).toBeTruthy()
    expect(Object.entries(sessionStorage)).toEqual([['sugarwork.workspace.entered', 'true']])
  })

  it('does not interpret an unrelated storage value as workspace entry', () => {
    sessionStorage.setItem('sugarwork.workspace.entered', 'false')
    const view = render(<LoginGate t={t}><div>private workspace</div></LoginGate>)

    expect(view.queryByText('private workspace')).toBeNull()
    expect(view.getByRole('button', { name: /Enter workspace/ })).toBeTruthy()
  })

  it('accepts the browser-test handoff marker and removes it from the address', () => {
    history.replaceState(null, '', '/workspace?fixture#dsh-enter-workspace')
    const view = render(<LoginGate t={t}><div>private workspace</div></LoginGate>)

    expect(view.getByText('private workspace')).toBeTruthy()
    expect(location.pathname).toBe('/workspace')
    expect(location.search).toBe('?fixture')
    expect(location.hash).toBe('')
  })
})
