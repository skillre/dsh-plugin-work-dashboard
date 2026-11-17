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
}

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
    () => projects.map((project) => ({ pocId: project.pocId, name: project.name, company: project.company })),
    [projects],
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

  const selectAll = (): void => setSelected(new Set(rows.map((row) => row.pocId)))
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
      const mode = selected.size === 0 ? 'blank' : 'fill'
      const result = await api.exportForm(mode, mode === 'blank' ? [] : [...selected])
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

          <div className="export-toolbar">
            <button type="button" className="btn btn-small" onClick={selectAll} disabled={busy}>{t('exportSelectAll')}</button>
            <button type="button" className="btn btn-small" onClick={selectNone} disabled={busy}>{t('exportSelectNone')}</button>
            <span className="export-count">{format(t('exportSelected'), { count: selected.size })}</span>
          </div>

          {rows.length === 0 ? (
            <p className="modal-lead">{t('exportNoProjects')}</p>
          ) : (
            <ul className="export-list">
              {rows.map((row) => (
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
                      <span className="export-row-meta">{row.pocId}{row.company === '' ? '' : ` · ${row.company}`}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="helper-box">
            {selected.size === 0 ? t('exportBlankHint') : t('exportHint')}
          </div>
        </div>
        <div className="modal-footer">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose} disabled={busy}>{t('cancel')}</button>
          <button type="button" className="btn btn-primary" onClick={() => { void generate() }} disabled={busy}>
            {busy ? <><span className="spinner" /> {t('exportGenerating')}</> : t('exportGenerate')}
          </button>
        </div>
      </div>
    </div>
  )
}
