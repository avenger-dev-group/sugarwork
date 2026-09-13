// @vitest-environment jsdom
/** Common Dashboard employee and attendance behavior. */
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { Dashboard, DashboardIcon } from '../src/client/Dashboard.tsx'
import { en } from '../src/client/locales.ts'
import type {} from '../src/client/index.ts'

const t = ((key: keyof typeof en, params?: Record<string, string>) => {
  let value = en[key]
  for (const [name, replacement] of Object.entries(params ?? {})) value = value.replace(`{${name}}`, replacement)
  return value
}) as TranslateNS<'department-workbench'>

afterEach(cleanup)

describe('Department Dashboard', () => {
  it('shows the current employee, attendance, and department extension areas', () => {
    const openAgent = vi.fn()
    const renderSlot = vi.fn((key: string) => <span>{key}</span>)
    const props = {
      bootstrap: {
        user: { id: 'sales-demo-user', name: 'Lin Chen', role: { id: 'sales-representative', name: 'Sales Representative', kind: 'member' } },
        department: { id: 'sales', name: 'Sales', homePanelId: 'dashboard' },
      },
      openAgent,
      renderSlot,
      t,
    } as unknown as Parameters<typeof Dashboard>[0]
    const view = render(<Dashboard {...props} />)

    expect(view.getByRole('heading', { name: 'Good morning, Lin Chen' })).toBeTruthy()
    expect(view.getByText('Clock in')).toBeTruthy()
    expect(view.getByText('Sales Representative · Sales')).toBeTruthy()
    expect(renderSlot).toHaveBeenCalledWith('department.dashboard.metrics', {}, expect.any(Object))
    fireEvent.click(view.getByRole('button', { name: /Open AI Agent/ }))
    expect(openAgent).toHaveBeenCalledOnce()
  })

  it('renders inactive and active navigation glyphs', () => {
    const inactive = render(<DashboardIcon size={20} active={false} />)
    expect(inactive.container.querySelectorAll('path')).toHaveLength(1)
    inactive.unmount()
    const active = render(<DashboardIcon size={16} active />)
    expect(active.container.querySelector('svg')?.getAttribute('width')).toBe('16')
    expect(active.container.querySelectorAll('path')).toHaveLength(2)
  })
})
