/** SAP-aligned mock customer maintenance table. */

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { Button, Input, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './CustomerMaintenance.module.css'

interface SapCustomer {
  readonly customerId: string
  readonly name1: string
  readonly name2: string
  readonly accountGroup: string
  readonly plant: string
  readonly salesGroup: string
  readonly salesOffice: string
  readonly street: string
  readonly city: string
  readonly street5: string
  readonly postalCode: string
  readonly region: string
  readonly createdAt: string
  readonly updatedAt: string
}

type EditableCustomer = Omit<SapCustomer, 'createdAt' | 'updatedAt'>

const customers: readonly SapCustomer[] = [
  { customerId: '10001842', name1: 'BrightCare Medical', name2: 'Procurement Center', accountGroup: 'Z001', plant: 'CN01', salesGroup: 'S12', salesOffice: 'SH01', street: '688 Century Avenue', city: 'Shanghai', street5: 'Pudong New Area', postalCode: '200120', region: 'Shanghai', createdAt: '2024-03-18', updatedAt: '2026-09-12 16:42' },
  { customerId: '10002106', name1: 'Westlake Hospital', name2: 'Supply Department', accountGroup: 'Z002', plant: 'CN02', salesGroup: 'S08', salesOffice: 'HZ01', street: '79 Qingchun Road', city: 'Hangzhou', street5: 'Shangcheng District', postalCode: '310003', region: 'Zhejiang', createdAt: '2024-08-06', updatedAt: '2026-09-11 09:18' },
  { customerId: '10002351', name1: 'GreenValley Clinics', name2: '', accountGroup: 'Z001', plant: 'CN01', salesGroup: 'S12', salesOffice: 'SH01', street: '218 Huaihai Road', city: 'Shanghai', street5: 'Huangpu District', postalCode: '200021', region: 'Shanghai', createdAt: '2025-01-22', updatedAt: '2026-09-10 14:05' },
  { customerId: '10002774', name1: 'Sunrise Pharmacy', name2: 'East China Operations', accountGroup: 'Z003', plant: 'CN03', salesGroup: 'S05', salesOffice: 'NJ01', street: '35 Hanzhong Road', city: 'Nanjing', street5: 'Qinhuai District', postalCode: '210005', region: 'Jiangsu', createdAt: '2025-11-03', updatedAt: '2026-09-09 11:26' },
]

const emptyCustomer: EditableCustomer = {
  customerId: '', name1: '', name2: '', accountGroup: '', plant: '', salesGroup: '', salesOffice: '',
  street: '', city: '', street5: '', postalCode: '', region: '',
}

type CustomerField = keyof EditableCustomer

/** Render editable customer master data using the mock SAP customer fields. */
export function CustomerMaintenance({ t }: PropsLocale<'sales-workspace'>) {
  const [records, setRecords] = useState<readonly SapCustomer[]>(customers)
  const [query, setQuery] = useState('')
  const [accountGroup, setAccountGroup] = useState('all')
  const [plant, setPlant] = useState('all')
  const [editor, setEditor] = useState<{ readonly mode: 'add' | 'edit'; readonly originalId?: string } | null>(null)
  const [form, setForm] = useState<EditableCustomer>(emptyCustomer)
  const [duplicateId, setDuplicateId] = useState(false)
  const accountGroups = useMemo(() => [...new Set(records.map(record => record.accountGroup))].sort(), [records])
  const plants = useMemo(() => [...new Set(records.map(record => record.plant))].sort(), [records])
  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return records.filter(record => (
      (accountGroup === 'all' || record.accountGroup === accountGroup)
      && (plant === 'all' || record.plant === plant)
      && (normalizedQuery === '' || Object.values(record).join(' ').toLocaleLowerCase().includes(normalizedQuery))
    ))
  }, [accountGroup, plant, query, records])

  const openAdd = (): void => {
    setForm(emptyCustomer)
    setDuplicateId(false)
    setEditor({ mode: 'add' })
  }
  const openEdit = (record: SapCustomer): void => {
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...editable } = record
    setForm(editable)
    setDuplicateId(false)
    setEditor({ mode: 'edit', originalId: record.customerId })
  }
  const updateField = (field: CustomerField, value: string): void => {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'customerId') setDuplicateId(false)
  }
  const save = (): void => {
    if (editor === null || form.customerId.trim() === '' || form.name1.trim() === '') return
    const normalizedId = form.customerId.trim()
    if (records.some(record => record.customerId === normalizedId && record.customerId !== editor.originalId)) {
      setDuplicateId(true)
      return
    }
    const previous = records.find(record => record.customerId === editor.originalId)
    const saved: SapCustomer = {
      ...form,
      customerId: normalizedId,
      name1: form.name1.trim(),
      createdAt: previous?.createdAt ?? '2026-09-13',
      updatedAt: '2026-09-13 10:30',
    }
    setRecords(current => editor.mode === 'add'
      ? [saved, ...current]
      : current.map(record => record.customerId === editor.originalId ? saved : record))
    setEditor(null)
  }

  return (
    <div className={css.customerTable}>
      <div className={css.toolbar}>
        <Input
          className={css.searchInput}
          type="search"
          value={query}
          aria-label={t('customers.search.label')}
          placeholder={t('customers.search.placeholder')}
          icon={<SearchIcon />}
          onChange={(event) => { setQuery(event.currentTarget.value) }}
        />
        <Filter label={t('customers.filter.group')} value={accountGroup} allLabel={t('customers.filter.all')} options={accountGroups} onChange={setAccountGroup} />
        <Filter label={t('customers.filter.plant')} value={plant} allLabel={t('customers.filter.all')} options={plants} onChange={setPlant} />
        <span className={css.resultCount}><strong>{visibleRecords.length}</strong> {t('panel.results')}</span>
        <Button variant="primary" size="sm" onClick={openAdd}><span aria-hidden="true">＋</span>{t('customers.add')}</Button>
      </div>
      <div className={css.tableViewport}>
        <table>
          <thead>
            <tr>
              <th scope="col">{t('customers.column.id')}</th>
              <th scope="col">{t('customers.column.name')}</th>
              <th scope="col">{t('customers.column.group')}</th>
              <th scope="col">{t('customers.column.plant')}</th>
              <th scope="col">{t('customers.column.sales')}</th>
              <th scope="col">{t('customers.column.location')}</th>
              <th scope="col">{t('customers.column.updated')}</th>
              <th scope="col"><span className={css.visuallyHidden}>{t('customers.column.actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map(record => (
              <tr key={record.customerId}>
                <td><strong className={css.customerId}>{record.customerId}</strong></td>
                <td><strong>{record.name1}</strong>{record.name2 !== '' && <small>{record.name2}</small>}</td>
                <td><span className={css.codeBadge}>{record.accountGroup}</span></td>
                <td>{record.plant}</td>
                <td><strong>{record.salesGroup}</strong><small>{record.salesOffice}</small></td>
                <td><strong>{record.city}</strong><small>{record.region}</small></td>
                <td className={css.updated}>{record.updatedAt}</td>
                <td><Button variant="outline" size="sm" aria-label={`${t('customers.edit')} ${record.name1}`} onClick={() => { openEdit(record) }}>{t('customers.edit')}</Button></td>
              </tr>
            ))}
            {visibleRecords.length === 0 && (
              <tr><td className={css.emptyCell} colSpan={8}><strong>{t('panel.empty.title')}</strong><small>{t('panel.empty.detail')}</small></td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal
        open={editor !== null}
        onClose={() => { setEditor(null) }}
        title={editor?.mode === 'edit' ? t('customers.editor.editTitle') : t('customers.editor.addTitle')}
        description={t('customers.editor.description')}
        closeLabel={t('customers.editor.close')}
        className={css.editorModal ?? ''}
        contentClassName={css.editorContent ?? ''}
        footer={(
          <>
            <Button variant="outline" onClick={() => { setEditor(null) }}>{t('customers.editor.cancel')}</Button>
            <Button variant="primary" disabled={form.customerId.trim() === '' || form.name1.trim() === ''} onClick={save}>{t('customers.editor.save')}</Button>
          </>
        )}
      >
        <div className={css.formSections}>
          <FormSection title={t('customers.section.basic')}>
            <CustomerInput field="customerId" value={form.customerId} label={t('customers.field.id')} required onChange={updateField} />
            <CustomerInput field="accountGroup" value={form.accountGroup} label={t('customers.field.group')} onChange={updateField} />
            <CustomerInput field="name1" value={form.name1} label={t('customers.field.name1')} required onChange={updateField} />
            <CustomerInput field="name2" value={form.name2} label={t('customers.field.name2')} onChange={updateField} />
          </FormSection>
          <FormSection title={t('customers.section.sales')}>
            <CustomerInput field="plant" value={form.plant} label={t('customers.field.plant')} onChange={updateField} />
            <CustomerInput field="salesGroup" value={form.salesGroup} label={t('customers.field.salesGroup')} onChange={updateField} />
            <CustomerInput field="salesOffice" value={form.salesOffice} label={t('customers.field.salesOffice')} onChange={updateField} />
          </FormSection>
          <FormSection title={t('customers.section.address')}>
            <CustomerInput field="street" value={form.street} label={t('customers.field.street')} onChange={updateField} />
            <CustomerInput field="street5" value={form.street5} label={t('customers.field.street5')} onChange={updateField} />
            <CustomerInput field="city" value={form.city} label={t('customers.field.city')} onChange={updateField} />
            <CustomerInput field="postalCode" value={form.postalCode} label={t('customers.field.postalCode')} onChange={updateField} />
            <CustomerInput field="region" value={form.region} label={t('customers.field.region')} onChange={updateField} />
          </FormSection>
          {duplicateId && <p className={css.formError} role="alert">{t('customers.editor.duplicate')}</p>}
        </div>
      </Modal>
    </div>
  )
}

interface FilterProps {
  readonly label: string
  readonly value: string
  readonly allLabel: string
  readonly options: readonly string[]
  readonly onChange: (value: string) => void
}

function Filter({ label, value, allLabel, options, onChange }: FilterProps) {
  return (
    <label className={css.filterField}>
      <span>{label}</span>
      <select value={value} onChange={(event) => { onChange(event.currentTarget.value) }}>
        <option value="all">{allLabel}</option>
        {options.map(option => <option value={option} key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function FormSection({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return <fieldset className={css.formSection}><legend>{title}</legend><div className={css.formGrid}>{children}</div></fieldset>
}

interface CustomerInputProps {
  readonly field: CustomerField
  readonly value: string
  readonly label: string
  readonly required?: boolean
  readonly onChange: (field: CustomerField, value: string) => void
}

function CustomerInput({ field, value, label, required = false, onChange }: CustomerInputProps) {
  return (
    <label className={css.inputField}>
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
      <Input value={value} required={required} onChange={(event) => { onChange(field, event.currentTarget.value) }} />
    </label>
  )
}

function SearchIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="4.75" /><path d="m12 12 4 4" /></svg>
}
