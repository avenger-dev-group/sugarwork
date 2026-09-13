// @vitest-environment jsdom
/** Call filtering, selection, and detail-summary behavior. */
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { CallWorkspace } from '../src/client/CallWorkspace.tsx'
import { en } from '../src/client/locales.ts'

const t = ((key: keyof typeof en) => en[key]) as TranslateNS<'sales-workspace'>

afterEach(cleanup)

describe('Call workspace', () => {
  it('filters calls and opens a detail panel with recording and AI summary', () => {
    const view = render(<CallWorkspace t={t} />)

    expect(view.getByRole('columnheader', { name: 'Call time' })).toBeTruthy()
    expect(view.getByText('Protective supplies pricing')).toBeTruthy()
    fireEvent.change(view.getByLabelText('Status'), { target: { value: 'missed' } })
    expect(view.getByText('Westlake Hospital')).toBeTruthy()
    expect(view.queryByText('BrightCare Medical')).toBeNull()

    fireEvent.click(view.getByRole('button', { name: 'Details Westlake Hospital' }))
    expect(view.getByRole('complementary', { name: 'Call details' })).toBeTruthy()
    expect(view.getByText('AI call summary')).toBeTruthy()
    expect(view.getByText(/fourteen days/)).toBeTruthy()
    const playButton = view.getByRole('button', { name: 'Play' }) as HTMLButtonElement
    expect(playButton.disabled).toBe(true)
    fireEvent.click(view.getByRole('button', { name: 'Close call details' }))
    expect(view.queryByRole('complementary', { name: 'Call details' })).toBeNull()
  })

  it('searches, filters direction, opens rows, and toggles playable recordings', () => {
    const view = render(<CallWorkspace t={t} />)
    fireEvent.change(view.getByRole('searchbox', { name: /Search call records/ }), { target: { value: 'protective supplies' } })
    expect(view.getByText('BrightCare Medical')).toBeTruthy()
    fireEvent.change(view.getByRole('searchbox', { name: /Search call records/ }), { target: { value: 'absent' } })
    expect(view.getByText('No matching records')).toBeTruthy()
    fireEvent.change(view.getByRole('searchbox', { name: /Search call records/ }), { target: { value: '' } })

    fireEvent.change(view.getByLabelText('Direction'), { target: { value: 'inbound' } })
    expect(view.getByText('ALISON SJ')).toBeTruthy()
    expect(view.queryByText('BrightCare Medical')).toBeNull()
    fireEvent.change(view.getByLabelText('Status'), { target: { value: 'answered' } })
    fireEvent.click(view.getByText('ALISON SJ').closest('tr')!)

    const play = view.getByRole('button', { name: 'Play' })
    fireEvent.click(play)
    expect(view.getByRole('button', { name: 'Pause' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(view.getByRole('button', { name: 'Pause' }))
    expect(view.getByRole('button', { name: 'Play' }).getAttribute('aria-pressed')).toBe('false')

    fireEvent.change(view.getByLabelText('Direction'), { target: { value: 'outbound' } })
    expect(view.getByText('BrightCare Medical')).toBeTruthy()
  })
})
