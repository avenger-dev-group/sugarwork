/** Common department landing panel and its sidebar glyph. */

import type { AppBootstrap } from '@deepseek-ai/dsh-api-app-bootstrap/types'
import type { InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SidebarPanelIconOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import css from './Dashboard.module.css'

interface DashboardInjected {
  readonly bootstrap: AppBootstrap
  readonly openAgent: () => void
}

/** Complete common Dashboard panel props. */
export type DashboardProps =
  & PropsRuntime<'main'>
  & PropsRenderSlots<'department.dashboard.agenda' | 'department.dashboard.metrics' | 'department.dashboard.tasks'>
  & PropsLocale<'department-workbench'>
  & InjectFace<DashboardInjected>

/** Render the common workbench landing panel. */
export function Dashboard({ bootstrap, openAgent, renderSlot, t }: DashboardProps) {
  const attendance = [
    ['attendance.start', '08:58'],
    ['attendance.lunchOut', '12:04'],
    ['attendance.lunchIn', '13:01'],
  ] as const
  return (
    <main className={css.page} aria-labelledby="department-dashboard-title">
      <header className={css.header}>
        <div className={css.identity}>
          <span className={css.eyebrow}>{t('dashboard.eyebrow')}</span>
          <span className={css.department}>{bootstrap.department.name}</span>
        </div>
        <div className={css.account}>
          <span className={css.avatar} aria-hidden="true">{bootstrap.user.name.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{bootstrap.user.name}</strong>
            <small>{bootstrap.user.role.name}</small>
          </span>
        </div>
      </header>

      <section className={css.hero}>
        <div className={css.heroCopy}>
          <p className={css.kicker}>{t('dashboard.today')}</p>
          <h1 id="department-dashboard-title">{t('dashboard.title', { name: bootstrap.user.name })}</h1>
          <p className={css.lede}>{t('dashboard.description', { department: bootstrap.department.name })}</p>
        </div>
        <button type="button" className={css.primaryAction} onClick={openAgent}>
          <span className={css.actionMark} aria-hidden="true">✦</span>
          <span>{t('dashboard.openAgent')}</span>
          <span aria-hidden="true">↗</span>
        </button>
      </section>

      <section className={css.contextGrid} aria-label={t('dashboard.employeeOverview')}>
        <article className={css.contextCard}>
          <div className={css.cardHeading}>
            <span>{t('employee.title')}</span>
            <span className={css.liveStatus}>{t('employee.working')}</span>
          </div>
          <div className={css.employeeBody}>
            <span className={css.employeeAvatar} aria-hidden="true">{bootstrap.user.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{bootstrap.user.name}</strong>
              <p>{bootstrap.user.role.name} · {bootstrap.department.name}</p>
            </div>
          </div>
          <dl className={css.employeeMeta}>
            <div><dt>{t('employee.number')}</dt><dd>{t('employee.numberValue')}</dd></div>
            <div><dt>{t('employee.workday')}</dt><dd>{t('employee.workdayValue')}</dd></div>
          </dl>
        </article>

        <article className={css.contextCard}>
          <div className={css.cardHeading}>
            <span>{t('attendance.title')}</span>
            <span className={css.cardHint}>{t('attendance.normal')}</span>
          </div>
          <div className={css.attendanceList}>
            {attendance.map(([key, time]) => (
              <div className={css.attendanceRow} key={key}>
                <span className={css.timelineDot} aria-hidden="true" />
                <span>{t(key)}</span>
                <time>{time}</time>
              </div>
            ))}
            <div className={`${css.attendanceRow} ${css.attendancePending}`}>
              <span className={css.timelineDot} aria-hidden="true" />
              <span>{t('attendance.end')}</span>
              <time>{t('attendance.pending')}</time>
            </div>
          </div>
        </article>

        <article className={`${css.contextCard} ${css.agendaCard}`}>
          <div className={css.cardHeading}>
            <span>{t('agenda.title')}</span>
            <span className={css.cardHint}>{t('agenda.today')}</span>
          </div>
          {renderSlot('department.dashboard.agenda', {}, {
            fallback: <p className={css.empty}>{t('agenda.empty')}</p>,
          })}
        </article>
      </section>

      <section className={css.section} aria-labelledby="dashboard-focus-title">
        <div className={css.sectionHeading}>
          <div>
            <p>{t('focus.eyebrow')}</p>
            <h2 id="dashboard-focus-title">{t('focus.title')}</h2>
          </div>
          <span>{t('focus.hint')}</span>
        </div>
        <div className={css.slotGrid}>
          {renderSlot('department.dashboard.metrics', {}, {
            fallback: <p className={css.empty}>{t('focus.empty')}</p>,
          })}
        </div>
      </section>

      <section className={css.workGrid} aria-label={t('dashboard.workAreas')}>
        <div className={css.taskArea}>
          {renderSlot('department.dashboard.tasks', {}, {
            fallback: <p className={css.empty}>{t('tasks.empty')}</p>,
          })}
        </div>
        <aside className={css.aiCard}>
          <span className={css.aiMark} aria-hidden="true">{t('ai.mark')}</span>
          <p className={css.aiEyebrow}>{t('ai.eyebrow')}</p>
          <h2>{t('ai.title')}</h2>
          <p>{t('ai.description')}</p>
          <button type="button" onClick={openAgent}>{t('ai.action')} <span aria-hidden="true">→</span></button>
          <div className={css.policyNote}>
            <span aria-hidden="true">◇</span>
            <span>{t('ai.policy')}</span>
          </div>
        </aside>
      </section>
    </main>
  )
}

/** Render the Dashboard navigation glyph at the shell-requested size. */
export function DashboardIcon({ size, active }: SidebarPanelIconOwnerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3.25 3.25h5.5v5.5h-5.5zM11.25 3.25h5.5v3.5h-5.5zM3.25 11.25h5.5v5.5h-5.5zM11.25 9.25h5.5v7.5h-5.5z" stroke="currentColor" strokeWidth="1.5" />
      {active && <path d="M4.75 7.15 6.05 5.8l1.15.95" stroke="currentColor" strokeWidth="1.25" />}
    </svg>
  )
}
