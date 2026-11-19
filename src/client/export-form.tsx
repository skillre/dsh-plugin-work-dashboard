/**
 * The export-form dialog.
 *
 * ## Why a dialog and not a page
 *
 * Exporting is a short, reversible action with three inputs (which projects, fill
 * or blank, download). Making it a fourth surface would cost a page of state for
 * something a reader does once per colleague, so it is a modal over the list —
 * and the list is exactly what it needs, because the selection defaults to
 * whatever the current filters show.
 *
 * ## What it does
 *
 * Asks the Host for the generated document, then hands the browser a Blob. The
 * generation itself lives on the Host (`src/form.ts`) because it needs the YAML
 * serializer; this module owns only the selection and the download.
 *
 * Saving uses an object URL with a real `download` name, and revokes it on the
 * next tick: a leaked object URL keeps the whole document in memory for the
 * lifetime of the page, which on a batch of 30 projects is not free.
 */

import { useMemo, useState } from 'react'
import type { ClientApi } from './api.js'
import type { ProjectSummary } from '../types.js'
import { format, type Translate } from './text.js'

/** One row in the selection list. */
interface SelectableProject {
  pocId: string
  name: string
  company: string
  /** The raw `stage` string, used by the stage filter and the row's badge. */
  stage: string
  /** Normalised stage id (`G0`…`G4`, `closed`, `unknown`), for grouping. */
  stageKey: string
}

/** What the colleague is doing; decides how much of the form is editable. */
type ExportIntent = 'new' | 'supplement' | 'progress'

/** The stage buckets the filter offers, in reading order. */
const STAGE_FILTERS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'G0', label: 'G0' },
  { key: 'G1', label: 'G1' },
  { key: 'G2', label: 'G2' },
  { key: 'G3', label: 'G3' },
  { key: 'G4', label: 'G4' },
  { key: 'closed', label: '已结束' },
]

/**
 * The dialog.
 *
 * @param api the Host client, used for `exportForm`
 * @param projects the CURRENTLY VISIBLE projects, so "select all" means "what I
 *        am looking at" rather than "the whole ledger"
 * @param t the dictionary
 * @param onClose dismiss the dialog
 * @param onError surface a failure through the page's own banner
 */
export function ExportFormDialog({ api, projects, t, onClose, onError }: {
  api: ClientApi
  projects: ProjectSummary[]
  t: Translate
  onClose(): void
  onError(message: string): void
}): JSX.Element {
  const rows = useMemo<SelectableProject[]>(
    () => projects.map((project) => ({
      pocId: project.pocId,
      name: project.name,
      company: project.company,
      stage: project.stageLabel,
      stageKey: project.closed ? 'closed' : project.stage ?? 'unknown',
    })),
    [projects],
  )
  /**
   * The intent, and the stage filter that goes with it.
   *
   * `new` takes no projects at all, so a selection is meaningless there; the
   * other two are batch actions and a colleague almost always wants "every G0
   * project", not "all thirty".
   */
  const [intent, setIntent] = useState<ExportIntent>('supplement')
  const [stageFilter, setStageFilter] = useState<string | null>(null)
  const visibleRows = useMemo(
    () => (stageFilter === null ? rows : rows.filter((row) => row.stageKey === stageFilter)),
    [rows, stageFilter],
  )
  const [selected, setSelected] = useState<Set<string>>(() => new Set(rows.map((row) => row.pocId)))
  const [busy, setBusy] = useState(false)

  const toggle = (pocId: string): void => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(pocId)) next.delete(pocId)
      else next.add(pocId)
      return next
    })
  }

  // Selection is scoped to what the filter shows: "全选" must mean "all the
  // ones I can see", never "silently also the hidden ones".
  const selectAll = (): void => setSelected(new Set(visibleRows.map((row) => row.pocId)))
  const selectNone = (): void => setSelected(new Set())

  /**
   * Generate and download.
   *
   * No selection means a blank new-project form, which is the documented
   * behaviour and the common case for a colleague starting a fresh POC. It is
   * therefore a normal path, not an error.
   */
  const generate = async (): Promise<void> => {
    setBusy(true)
    try {
      const mode = intent === 'new' ? 'blank' : 'fill'
      const result = await api.exportForm(mode, mode === 'blank' ? [] : [...selected], intent)
      const blob = new Blob([result.html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = result.fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      // Revoke on the next tick: the browser needs the URL alive until the
      // download starts, and a leaked one pins the document in memory.
      setTimeout(() => URL.revokeObjectURL(url), 4_000)
      onClose()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('exportFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}
    >
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-label={t('exportTitle')}
        onKeyDown={(event) => { if (event.key === 'Escape' && !busy) onClose() }}
      >
        <div className="modal-header">
          <h2 className="modal-title">{t('exportTitle')}</h2>
        </div>
        <div className="modal-content">
          <p className="modal-lead">{t('exportSubtitle')}</p>

          {/*
            * The intent comes first because it decides what the form ASKS, not
            * just how much of it is shown. Registering a project, filling in the
            * current stage and appending one progress round are three different
            * documents, and a colleague picking the wrong one wastes the whole
            * round trip.
            */}
          <div className="export-intent" role="group" aria-label={t('exportIntentLabel')}>
            {([
              { key: 'new' as const, label: t('exportIntentNew'), hint: t('exportIntentNewHint') },
              { key: 'supplement' as const, label: t('exportIntentSupplement'), hint: t('exportIntentSupplementHint') },
              { key: 'progress' as const, label: t('exportIntentProgress'), hint: t('exportIntentProgressHint') },
            ]).map((option) => (
              <button
                key={option.key}
                type="button"
                className="export-intent-btn"
                data-active={intent === option.key}
                title={option.hint}
                disabled={busy}
                onClick={() => setIntent(option.key)}
              >
                <span className="export-intent-label">{option.label}</span>
                <span className="export-intent-hint">{option.hint}</span>
              </button>
            ))}
          </div>

          {intent === 'new' ? (
            <div className="helper-box">{t('exportNewHint')}</div>
          ) : (
            <>
              <div className="export-stage-filter" role="group" aria-label={t('exportStageFilterLabel')}>
                <button
                  type="button"
                  className="btn btn-small"
                  data-active={stageFilter === null}
                  onClick={() => setStageFilter(null)}
                  disabled={busy}
                >
                  {t('exportStageAll')}
                </button>
                {STAGE_FILTERS.map((bucket) => {
                  const count = rows.filter((row) => row.stageKey === bucket.key).length
                  return (
                    <button
                      key={bucket.key}
                      type="button"
                      className="btn btn-small"
                      data-active={stageFilter === bucket.key}
                      data-zero={count === 0}
                      disabled={busy || (count === 0 && stageFilter !== bucket.key)}
                      onClick={() => setStageFilter(stageFilter === bucket.key ? null : bucket.key)}
                    >
                      {bucket.label}
                      <span className="export-stage-count">{count}</span>
                    </button>
                  )
                })}
              </div>

              <div className="export-toolbar">
                <button type="button" className="btn btn-small" onClick={selectAll} disabled={busy}>{t('exportSelectAll')}</button>
                <button type="button" className="btn btn-small" onClick={selectNone} disabled={busy}>{t('exportSelectNone')}</button>
                <span className="export-count">{format(t('exportSelected'), { count: selected.size })}</span>
              </div>
            </>
          )}

          {intent !== 'new' && (rows.length === 0 ? (
            <p className="modal-lead">{t('exportNoProjects')}</p>
          ) : visibleRows.length === 0 ? (
            <p className="modal-lead">{t('exportStageEmpty')}</p>
          ) : (
            <ul className="export-list">
              {visibleRows.map((row) => (
                <li key={row.pocId}>
                  <label className="export-row" data-selected={selected.has(row.pocId)}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.pocId)}
                      disabled={busy}
                      onChange={() => toggle(row.pocId)}
                    />
                    <span className="export-row-text">
                      <span className="export-row-name">{row.name === '' ? row.pocId : row.name}</span>
                      <span className="export-row-meta">
                        {row.pocId}
                        {row.company === '' ? '' : ` · ${row.company}`}
                        {row.stage === '' ? '' : ` · ${row.stage}`}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ))}

          {intent === 'new' ? null : (
            <div className="helper-box">
              {selected.size === 0 ? t('exportBlankHint') : t('exportHint')}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose} disabled={busy}>{t('cancel')}</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { void generate() }}
            disabled={busy || (intent !== 'new' && selected.size === 0)}
          >
            {busy ? <><span className="spinner" /> {t('exportGenerating')}</> : t('exportGenerate')}
          </button>
        </div>
      </div>
    </div>
  )
}
