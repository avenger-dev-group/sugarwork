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

  it('searches and filters localized business rows without an in-panel back action', () => {
    const props = { kind: 'messages', t } as unknown as Parameters<typeof SalesPanel>[0]
    const view = render(<SalesPanel {...props} />)

    expect(view.getByRole('heading', { name: 'Messages' })).toBeTruthy()
    expect(view.getByRole('table')).toBeTruthy()
    expect(view.getByRole('columnheader', { name: /Business record/ })).toBeTruthy()
    expect(view.getByText('GreenValley Clinics')).toBeTruthy()
    expect(view.queryByRole('button', { name: 'Back to Dashboard' })).toBeNull()

    fireEvent.change(view.getByRole('searchbox', { name: 'Search sales records' }), { target: { value: 'BrightCare' } })
    expect(view.getByText('BrightCare Medical')).toBeTruthy()
    expect(view.queryByText('GreenValley Clinics')).toBeNull()

    fireEvent.change(view.getByRole('combobox', { name: /Status/ }), { target: { value: 'Unread' } })
    expect(view.getByText('No matching records')).toBeTruthy()

    fireEvent.change(view.getByRole('searchbox', { name: 'Search sales records' }), { target: { value: '' } })
    fireEvent.change(view.getByRole('combobox', { name: /Status/ }), { target: { value: 'all' } })
    fireEvent.click(view.getByRole('button', { name: 'Sort by business record' }))
    const bodyRows = view.getAllByRole('row').slice(1)
    expect(bodyRows[0]?.textContent).toContain('BrightCare Medical')
  })
})
