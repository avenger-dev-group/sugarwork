// @vitest-environment jsdom
/** User-visible Sales dashboard and panel behavior. */
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { AppWorkbenchPanelId } from '@deepseek-ai/dsh-api-app-bootstrap/types'
import { SalesMetrics, SalesPanel, SalesTasks } from '../src/client/SalesWorkspace.tsx'
import { en } from '../src/client/locales.ts'
import type {} from '../src/client/index.ts'

const t = ((key: keyof typeof en) => en[key]) as TranslateNS<'sales-workspace'>

afterEach(cleanup)

describe('Sales workspace presentation', () => {
  it('routes attention cards and tasks to their Sales panels', () => {
    const selectPanel = vi.fn<(panel: AppWorkbenchPanelId) => void>()
    const metricProps = { selectPanel, t } as unknown as Parameters<typeof SalesMetrics>[0]
    const view = render(<SalesMetrics {...metricProps} />)
    fireEvent.click(view.getByRole('button', { name: /Customers to follow up/ }))
    expect(selectPanel).toHaveBeenCalledWith('customers')

    view.unmount()
    const taskProps = { selectPanel, t } as unknown as Parameters<typeof SalesTasks>[0]
    const tasks = render(<SalesTasks {...taskProps} />)
    fireEvent.click(tasks.getByRole('button', { name: /Confirm the Sunrise Pharmacy order/ }))
    expect(selectPanel).toHaveBeenLastCalledWith('orders')
  })

  it('renders localized business rows and returns to the Dashboard', () => {
    const selectPanel = vi.fn<(panel: AppWorkbenchPanelId) => void>()
    const props = { kind: 'messages', selectPanel, t } as unknown as Parameters<typeof SalesPanel>[0]
    const view = render(<SalesPanel {...props} />)

    expect(view.getByRole('heading', { name: 'Messages' })).toBeTruthy()
    expect(view.getByText('GreenValley Clinics')).toBeTruthy()
    fireEvent.click(view.getByRole('button', { name: 'Back to Dashboard' }))
    expect(selectPanel).toHaveBeenCalledWith('dashboard')
  })
})
