/** Reusable Sales business table with local search, status filtering, and record sorting. */

import { useMemo, useState } from 'react'
import { Input } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './BusinessDataTable.module.css'

/** One localized record rendered by {@link BusinessDataTable}. */
export interface BusinessDataTableRow {
  readonly id: number
  readonly name: string
  readonly detail: string
  readonly status: string
}

/** Complete localized copy required by the reusable business table. */
export interface BusinessDataTableLabels {
  readonly searchLabel: string
  readonly searchPlaceholder: string
  readonly filterLabel: string
  readonly allStatuses: string
  readonly results: string
  readonly recordColumn: string
  readonly detailColumn: string
  readonly statusColumn: string
  readonly sortByRecord: string
  readonly emptyTitle: string
  readonly emptyDetail: string
}

interface BusinessDataTableProps {
  readonly rows: readonly BusinessDataTableRow[]
  readonly labels: BusinessDataTableLabels
}

type SortDirection = 'none' | 'ascending' | 'descending'

/**
 * Render one compact business table shared by every Sales list panel.
 * @param props - localized rows and complete table copy.
 * @returns searchable, filterable, sortable table content.
 */
export function BusinessDataTable({ rows, labels }: BusinessDataTableProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [sortDirection, setSortDirection] = useState<SortDirection>('none')
  const statuses = useMemo(() => [...new Set(rows.map(row => row.status))], [rows])
  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    const filtered = rows.filter(row => (
      (status === 'all' || row.status === status)
      && (normalizedQuery.length === 0
        || `${row.name} ${row.detail} ${row.status}`.toLocaleLowerCase().includes(normalizedQuery))
    ))
    if (sortDirection === 'none') return filtered
    return [...filtered].sort((left, right) => {
      const order = left.name.localeCompare(right.name)
      return sortDirection === 'ascending' ? order : -order
    })
  }, [query, rows, sortDirection, status])
  const toggleSort = (): void => {
    setSortDirection(current => current === 'ascending' ? 'descending' : 'ascending')
  }

  return (
    <div className={css.dataTable}>
      <div className={css.toolbar}>
        <Input
          className={css.searchInput}
          type="search"
          value={query}
          aria-label={labels.searchLabel}
          placeholder={labels.searchPlaceholder}
          icon={<SearchIcon />}
          onChange={(event) => { setQuery(event.currentTarget.value) }}
        />
        <label className={css.filterField}>
          <span>{labels.filterLabel}</span>
          <select value={status} onChange={(event) => { setStatus(event.currentTarget.value) }}>
            <option value="all">{labels.allStatuses}</option>
            {statuses.map(item => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <span className={css.resultCount} aria-live="polite">
          <strong>{visibleRows.length}</strong> {labels.results}
        </span>
      </div>
      <div className={css.tableViewport}>
        <table>
          <thead>
            <tr>
              <th scope="col" aria-sort={sortDirection}>
                <button type="button" onClick={toggleSort} aria-label={labels.sortByRecord}>
                  {labels.recordColumn}
                  <SortIcon direction={sortDirection} />
                </button>
              </th>
              <th scope="col">{labels.detailColumn}</th>
              <th scope="col">{labels.statusColumn}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(row => (
              <tr key={row.id}>
                <td>
                  <span className={css.recordIndex} aria-hidden="true">{String(row.id).padStart(2, '0')}</span>
                  <strong>{row.name}</strong>
                </td>
                <td className={css.detail}>{row.detail}</td>
                <td><span className={css.status}>{row.status}</span></td>
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td className={css.emptyCell} colSpan={3}>
                  <span aria-hidden="true">⌕</span>
                  <strong>{labels.emptyTitle}</strong>
                  <small>{labels.emptyDetail}</small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="4.75" />
      <path d="m12 12 4 4" />
    </svg>
  )
}

function SortIcon({ direction }: { readonly direction: SortDirection }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" data-direction={direction}>
      <path d="m5 6 3-3 3 3M11 10l-3 3-3-3" />
    </svg>
  )
}
