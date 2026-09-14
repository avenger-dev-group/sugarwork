/** Searchable mock call history with an expandable detail panel. */

import { useMemo, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { Button, Input } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SalesWorkspaceKey } from './locales.ts'
import css from './CallWorkspace.module.css'

type CallDirection = 'inbound' | 'outbound'
type CallStatus = 'answered' | 'missed'

interface CallRecord {
  readonly id: string
  readonly customer: string
  readonly phone: string
  readonly direction: CallDirection
  readonly status: CallStatus
  readonly startedAt: string
  readonly displayDate: string
  readonly displayTime: string
  readonly duration: string
  readonly owner: string
  readonly subject: SalesWorkspaceKey
  readonly summary: SalesWorkspaceKey
  readonly keyPoints: readonly SalesWorkspaceKey[]
  readonly nextAction: SalesWorkspaceKey
}

const calls: readonly CallRecord[] = [
  { id: 'call-1', customer: 'BrightCare Medical', phone: '+1 620 604 6097', direction: 'outbound', status: 'answered', startedAt: '2026-09-13 09:12:36', displayDate: '09/13', displayTime: '09:12', duration: '12:48', owner: 'SIMON.F', subject: 'calls.data.1.subject', summary: 'calls.data.1.summary', keyPoints: ['calls.data.1.point1', 'calls.data.1.point2', 'calls.data.1.point3'], nextAction: 'calls.data.1.next' },
  { id: 'call-2', customer: 'ALISON SJ', phone: '(408) 402-6529', direction: 'inbound', status: 'answered', startedAt: '2026-09-13 08:46:10', displayDate: '09/13', displayTime: '08:46', duration: '05:21', owner: 'SIMON.F', subject: 'calls.data.2.subject', summary: 'calls.data.2.summary', keyPoints: ['calls.data.2.point1', 'calls.data.2.point2', 'calls.data.2.point3'], nextAction: 'calls.data.2.next' },
  { id: 'call-3', customer: 'Westlake Hospital', phone: '+86 571 8890 2146', direction: 'outbound', status: 'missed', startedAt: '2026-09-12 16:20:04', displayDate: '09/12', displayTime: '16:20', duration: '00:00', owner: 'SIMON.F', subject: 'calls.data.3.subject', summary: 'calls.data.3.summary', keyPoints: ['calls.data.3.point1', 'calls.data.3.point2', 'calls.data.3.point3'], nextAction: 'calls.data.3.next' },
  { id: 'call-4', customer: 'Sunrise Pharmacy', phone: '+86 25 8362 1770', direction: 'inbound', status: 'answered', startedAt: '2026-09-12 14:08:51', displayDate: '09/12', displayTime: '14:08', duration: '08:34', owner: 'SIMON.F', subject: 'calls.data.4.subject', summary: 'calls.data.4.summary', keyPoints: ['calls.data.4.point1', 'calls.data.4.point2', 'calls.data.4.point3'], nextAction: 'calls.data.4.next' },
  { id: 'call-5', customer: 'Unknown caller', phone: '+1 559 425 4086', direction: 'inbound', status: 'missed', startedAt: '2026-09-11 17:35:22', displayDate: '09/11', displayTime: '17:35', duration: '00:00', owner: 'SIMON.F', subject: 'calls.data.5.subject', summary: 'calls.data.5.summary', keyPoints: ['calls.data.5.point1', 'calls.data.5.point2'], nextAction: 'calls.data.5.next' },
]

/** Render call records and reveal the selected call's metadata and summary. */
export function CallWorkspace({ t }: PropsLocale<'sales-workspace'>) {
  const [query, setQuery] = useState('')
  const [direction, setDirection] = useState<'all' | CallDirection>('all')
  const [status, setStatus] = useState<'all' | CallStatus>('all')
  const [selected, setSelected] = useState<CallRecord | null>(null)
  const [playing, setPlaying] = useState(false)
  const visibleCalls = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return calls.filter(call => (
      (direction === 'all' || call.direction === direction)
      && (status === 'all' || call.status === status)
      && (normalizedQuery === '' || `${call.customer} ${call.phone} ${t(call.subject)}`.toLocaleLowerCase().includes(normalizedQuery))
    ))
  }, [direction, query, status, t])
  const selectCall = (call: CallRecord): void => {
    setPlaying(false)
    setSelected(call)
  }

  return (
    <div className={css.callWorkspace} data-detail-open={selected !== null}>
      <section className={css.callList} aria-label={t('calls.list.label')}>
        <div className={css.toolbar}>
          <Input
            className={css.searchInput}
            type="search"
            value={query}
            aria-label={t('calls.search.label')}
            placeholder={t('calls.search.placeholder')}
            icon={<SearchIcon />}
            onChange={(event) => { setQuery(event.currentTarget.value) }}
          />
          <label className={css.filterField}><span>{t('calls.filter.direction')}</span><select value={direction} onChange={(event) => { setDirection(event.currentTarget.value as 'all' | CallDirection) }}><option value="all">{t('calls.filter.all')}</option><option value="inbound">{t('calls.direction.inbound')}</option><option value="outbound">{t('calls.direction.outbound')}</option></select></label>
          <label className={css.filterField}><span>{t('calls.filter.status')}</span><select value={status} onChange={(event) => { setStatus(event.currentTarget.value as 'all' | CallStatus) }}><option value="all">{t('calls.filter.all')}</option><option value="answered">{t('calls.status.answered')}</option><option value="missed">{t('calls.status.missed')}</option></select></label>
          <span className={css.resultCount}><strong>{visibleCalls.length}</strong> {t('panel.results')}</span>
        </div>
        <div className={css.tableViewport}>
          <table>
            <thead><tr><th scope="col">{t('calls.column.contact')}</th><th scope="col">{t('calls.column.direction')}</th><th scope="col">{t('calls.column.time')}</th><th scope="col">{t('calls.column.duration')}</th><th scope="col">{t('calls.column.subject')}</th><th scope="col">{t('calls.column.status')}</th><th scope="col"><span className={css.visuallyHidden}>{t('calls.column.actions')}</span></th></tr></thead>
            <tbody>
              {visibleCalls.map(call => (
                <tr key={call.id} data-selected={selected?.id === call.id} onClick={() => { selectCall(call) }}>
                  <td><span className={css.callMark} data-direction={call.direction} aria-hidden="true">{call.direction === 'inbound' ? '↙' : '↗'}</span><span><strong>{call.customer}</strong><small>{call.phone}</small></span></td>
                  <td><span className={css.direction}>{t(`calls.direction.${call.direction}`)}</span></td>
                  <td><strong>{call.displayTime}</strong><small>{call.displayDate}</small></td>
                  <td className={css.numeric}>{call.duration}</td>
                  <td className={css.subject}>{t(call.subject)}</td>
                  <td><span className={css.status} data-status={call.status}>{t(`calls.status.${call.status}`)}</span></td>
                  <td><Button variant="ghost" size="sm" aria-label={`${t('calls.open')} ${call.customer}`} onClick={() => { selectCall(call) }}>{t('calls.open')}</Button></td>
                </tr>
              ))}
              {visibleCalls.length === 0 && <tr><td className={css.emptyCell} colSpan={7}><strong>{t('panel.empty.title')}</strong><small>{t('panel.empty.detail')}</small></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {selected !== null && (
        <aside className={css.detailPanel} aria-label={t('calls.detail.label')}>
          <header className={css.detailHeader}>
            <div className={css.heroMark} aria-hidden="true">☎</div>
            <Button variant="ghost" size="sm" className={css.closeButton} aria-label={t('calls.detail.close')} onClick={() => { setSelected(null) }}>×</Button>
            <strong>{selected.customer}</strong>
            <span>{selected.phone}</span>
            <div className={css.heroMeta}><span className={css.direction}>{t(`calls.direction.${selected.direction}`)}</span><span className={css.status} data-status={selected.status}>{t(`calls.status.${selected.status}`)}</span></div>
          </header>
          <dl className={css.factGrid}>
            <div><dt>{t('calls.detail.time')}</dt><dd>{selected.startedAt}</dd></div>
            <div><dt>{t('calls.detail.duration')}</dt><dd>{selected.duration}</dd></div>
            <div><dt>{t('calls.detail.owner')}</dt><dd>{selected.owner}</dd></div>
            <div><dt>{t('calls.detail.subject')}</dt><dd>{t(selected.subject)}</dd></div>
          </dl>
          <section className={css.recording} aria-label={t('calls.detail.recording')}>
            <div><span className={css.recordingMark} aria-hidden="true">◖</span><strong>{t('calls.detail.recording')}</strong><Button variant="ghost" size="sm" aria-pressed={playing} disabled={selected.duration === '00:00'} onClick={() => { setPlaying(current => !current) }}>{playing ? t('calls.detail.pause') : t('calls.detail.play')}</Button></div>
            <span className={css.progress}><i data-playing={playing} /></span>
            <small><span>00:00</span><span>{selected.duration}</span></small>
          </section>
          <section className={css.summary}><p>{t('calls.detail.summary')}</p><h2>{t(selected.summary)}</h2></section>
          <section className={css.keyPoints}><h3>{t('calls.detail.keyPoints')}</h3><ul>{selected.keyPoints.map(point => <li key={point}>{t(point)}</li>)}</ul></section>
          <section className={css.nextAction}><span>{t('calls.detail.nextAction')}</span><strong>{t(selected.nextAction)}</strong></section>
        </aside>
      )}
    </div>
  )
}

function SearchIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="4.75" /><path d="m12 12 4 4" /></svg>
}
