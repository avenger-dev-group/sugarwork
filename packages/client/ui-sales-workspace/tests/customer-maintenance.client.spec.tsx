// @vitest-environment jsdom
/** SAP customer master-data presentation and mock maintenance behavior. */
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { CustomerMaintenance } from '../src/client/CustomerMaintenance.tsx'
import { en } from '../src/client/locales.ts'

const t = ((key: keyof typeof en) => en[key]) as TranslateNS<'sales-workspace'>

afterEach(cleanup)

describe('Customer maintenance', () => {
  it('filters SAP customer fields and adds a customer in mock state', () => {
    const view = render(<CustomerMaintenance t={t} />)

    expect(view.getByRole('columnheader', { name: 'Customer ID' })).toBeTruthy()
    expect(view.getByRole('columnheader', { name: 'Sales group / office' })).toBeTruthy()
    fireEvent.change(view.getByRole('searchbox', { name: 'Search customer master data' }), { target: { value: 'Hangzhou' } })
    expect(view.getByText('Westlake Hospital')).toBeTruthy()
    expect(view.queryByText('BrightCare Medical')).toBeNull()

    fireEvent.click(view.getByRole('button', { name: 'Add customer' }))
    fireEvent.change(view.getByLabelText(/Customer ID/), { target: { value: '10003001' } })
    fireEvent.change(view.getByLabelText(/Customer name 1/), { target: { value: 'Harbor Health' } })
    fireEvent.click(view.getByRole('button', { name: 'Save customer' }))
    fireEvent.change(view.getByRole('searchbox', { name: 'Search customer master data' }), { target: { value: 'Harbor' } })
    expect(view.getByText('Harbor Health')).toBeTruthy()
  })

  it('edits a customer and keeps the customer id unique', () => {
    const view = render(<CustomerMaintenance t={t} />)

    fireEvent.click(view.getByRole('button', { name: 'Edit BrightCare Medical' }))
    fireEvent.change(view.getByLabelText('City'), { target: { value: 'Suzhou' } })
    fireEvent.click(view.getByRole('button', { name: 'Save customer' }))
    expect(view.getByText('Suzhou')).toBeTruthy()

    fireEvent.click(view.getByRole('button', { name: 'Edit BrightCare Medical' }))
    fireEvent.change(view.getByLabelText(/Customer ID/), { target: { value: '10002106' } })
    fireEvent.click(view.getByRole('button', { name: 'Save customer' }))
    expect(view.getByRole('alert').textContent).toContain('already exists')
  })
})
