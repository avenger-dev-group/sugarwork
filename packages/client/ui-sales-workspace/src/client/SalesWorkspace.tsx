/** Sales Dashboard contributions and business-list panels. */

import type { AppWorkbenchPanelId } from '@deepseek-ai/dsh-api-app-bootstrap/types'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SidebarPanelIconOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { BusinessDataTable } from './BusinessDataTable.tsx'
import { CallWorkspace } from './CallWorkspace.tsx'
import { CustomerMaintenance } from './CustomerMaintenance.tsx'
import css from './SalesWorkspace.module.css'

/** Sales panel supported by the mock feature package. */
export type SalesPanelKind = 'customers' | 'orders' | 'calls' | 'messages'

interface SalesNavigationInjected {
  readonly selectPanel: (panel: AppWorkbenchPanelId) => void
}

interface SalesPanelInjected {
  readonly kind: SalesPanelKind
}

interface SalesNavIconInjected {
  readonly kind: SalesPanelKind
}

type SalesDashboardProps = PropsRuntime<'department.dashboard.metrics'> & PropsLocale<'sales-workspace'> & InjectFace<SalesNavigationInjected>
type SalesPanelProps = PropsRuntime<'main'> & PropsLocale<'sales-workspace'> & InjectFace<SalesPanelInjected>
type SalesIconProps = SidebarPanelIconOwnerProps & InjectFace<SalesNavIconInjected>

const metrics = [
  { kind: 'customers', count: '8', label: 'metric.customers.label', note: 'metric.customers.note', mark: 'C' },
  { kind: 'orders', count: '6', label: 'metric.orders.label', note: 'metric.orders.note', mark: 'O' },
  { kind: 'calls', count: '8', label: 'metric.calls.label', note: 'metric.calls.note', mark: '☎' },
  { kind: 'messages', count: '2', label: 'metric.messages.label', note: 'metric.messages.note', mark: 'M' },
] as const

const tasks = [
  { kind: 'calls', time: '09:00', title: 'tasks.call.title', detail: 'tasks.call.detail', badge: 'tasks.call.badge', tone: 'urgent' },
  { kind: 'orders', time: '11:30', title: 'tasks.order.title', detail: 'tasks.order.detail', badge: 'tasks.order.badge', tone: 'important' },
  { kind: 'customers', time: '14:00', title: 'tasks.customer.title', detail: 'tasks.customer.detail', badge: 'tasks.customer.badge', tone: 'followup' },
  { kind: 'messages', time: '16:00', title: 'tasks.message.title', detail: 'tasks.message.detail', badge: 'tasks.message.badge', tone: 'message' },
] as const

const agenda = [
  { time: '09:30', title: 'agenda.standup.title', detail: 'agenda.standup.detail' },
  { time: '14:00', title: 'agenda.review.title', detail: 'agenda.review.detail' },
  { time: '16:30', title: 'agenda.pipeline.title', detail: 'agenda.pipeline.detail' },
] as const

/** Render the Sales schedule in the common Dashboard. */
export function SalesAgenda({ t }: PropsRuntime<'department.dashboard.agenda'> & PropsLocale<'sales-workspace'>) {
  return (
    <div className={css.agendaList}>
      {agenda.map(item => (
        <div className={css.agendaRow} key={item.time}>
          <time>{item.time}</time>
          <span><strong>{t(item.title)}</strong><small>{t(item.detail)}</small></span>
        </div>
      ))}
    </div>
  )
}

/** Render Sales attention counts that navigate to their owning panels. */
export function SalesMetrics({ selectPanel, t }: SalesDashboardProps) {
  return metrics.map(metric => (
    <button
      type="button"
      className={css.metricCard}
      data-tone={metric.kind}
      key={metric.kind}
      onClick={() => { selectPanel(metric.kind as AppWorkbenchPanelId) }}
    >
      <span className={css.metricMark} aria-hidden="true">{metric.mark}</span>
      <span className={css.metricCopy}>
        <strong>{metric.count}</strong>
        <span>{t(metric.label)}</span>
        <small>{t(metric.note)}</small>
      </span>
      <span className={css.metricArrow} aria-hidden="true">↗</span>
    </button>
  ))
}

/** Render the Sales action list derived from customer, order, call, and message work. */
export function SalesTasks({ selectPanel, t }: SalesDashboardProps) {
  return (
    <section className={css.tasks} aria-labelledby="sales-tasks-title">
      <header className={css.tasksHeader}>
        <div><p>{t('tasks.eyebrow')}</p><h2 id="sales-tasks-title">{t('tasks.title')}</h2></div>
        <span>{t('tasks.count')}</span>
      </header>
      <div className={css.taskList}>
        {tasks.map(task => (
          <button
            type="button"
            className={css.taskRow}
            data-tone={task.tone}
            key={task.title}
            onClick={() => { selectPanel(task.kind as AppWorkbenchPanelId) }}
          >
            <time>{task.time}</time>
            <span className={css.taskState} aria-hidden="true" />
            <span className={css.taskCopy}><strong>{t(task.title)}</strong><small>{t(task.detail)}</small></span>
            <span className={css.taskBadge}>{t(task.badge)}</span>
            <span className={css.taskOpen}>{t('tasks.open')} <span aria-hidden="true">→</span></span>
          </button>
        ))}
      </div>
    </section>
  )
}

/** Render one mock Sales business panel. */
export function SalesPanel({ kind, t }: SalesPanelProps) {
  const rows = [1, 2, 3] as const
  const localizedRows = rows.map(row => ({
    id: row,
    name: t(`panel.${kind}.row${row}.name`),
    detail: t(`panel.${kind}.row${row}.meta`),
    status: t(`panel.${kind}.row${row}.state`),
  }))

  return (
    <main className={css.panel} aria-labelledby={`sales-${kind}-title`}>
      <header className={css.panelHeader}>
        <div>
          <p>{t('panel.updated')}</p>
          <h1 id={`sales-${kind}-title`}>{t(`panel.${kind}.title`)}</h1>
          <span>{t(`panel.${kind}.description`)}</span>
        </div>
        <strong>{t(`panel.${kind}.summary`)}</strong>
      </header>
      <section className={css.panelWorkspace} aria-label={t(`panel.${kind}.title`)}>
        {kind === 'customers'
          ? <CustomerMaintenance t={t} />
          : kind === 'calls'
            ? <CallWorkspace t={t} />
            : (
              <BusinessDataTable
                rows={localizedRows}
                labels={{
                  searchLabel: t('panel.search.label'),
                  searchPlaceholder: t('panel.search.placeholder'),
                  filterLabel: t('panel.filter.label'),
                  allStatuses: t('panel.filter.all'),
                  results: t('panel.results'),
                  recordColumn: t('panel.column.record'),
                  detailColumn: t('panel.column.details'),
                  statusColumn: t('panel.column.status'),
                  sortByRecord: t('panel.sort.record'),
                  emptyTitle: t('panel.empty.title'),
                  emptyDetail: t('panel.empty.detail'),
                }}
              />
            )}
      </section>
    </main>
  )
}

/** Render a compact glyph for one Sales sidebar destination. */
export function SalesNavIcon({ active, kind, size }: SalesIconProps) {
  const paths: Record<SalesPanelKind, string> = {
    customers: 'M6.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-4.25 7c.3-3 1.7-4.5 4.25-4.5s3.95 1.5 4.25 4.5M13 6.5h4.5M15.25 4.25v4.5',
    orders: 'M4 3.25h12v13.5H4zM7 7h6M7 10h6M7 13h3.5',
    calls: 'M5 3.5 8 7 6.5 8.75c1.15 2.2 2.55 3.6 4.75 4.75L13 12l3.5 3c-.9 1.2-2.15 1.7-3.5 1.25-4.7-1.55-7.7-4.55-9.25-9.25C3.3 5.65 3.8 4.4 5 3.5Z',
    messages: 'M3.25 4.25h13.5v10H8l-3.5 2.5v-2.5H3.25zM6 7.5h8M6 10.5h5.5',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d={paths[kind]} stroke="currentColor" strokeWidth={active ? 1.8 : 1.45} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
