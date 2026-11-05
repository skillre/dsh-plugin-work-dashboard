/**
 * The milestone-3 views: export a form, the risk board, and the global timeline.
 *
 * All three are read-only aggregations over data the Host already parsed, so
 * these components hold no logic that could disagree with the board: the Host
 * computes the ordering (severity, dates) and the Client renders it.
 *
 * The export flow is the one place the browser produces a file: the Host returns
 * the HTML string, and the Client hands it to a Blob download. Nothing about the
 * generated form is assembled in the browser, so the form and the plugin cannot
 * drift apart.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ExportOutcome, GlobalTimeline, RiskBoard, Snapshot } from '../types.js'
import { ActionError } from './api.js'
import type { ClientApi } from './api.js'
import { format, type Translate } from './text.js'

/** A one-line error message from the Host. */
function errorText(t: Translate, error: unknown): string {
  if (error instanceof ActionError) {
    const key = `error.${error.code.replace(/^poc-console\//, '')}`
    const translated = t(key)
    return translated === key ? error.message : translated
  }
  if (error instanceof Error) return error.message
  return t('error.failed')
}

/** Turn a generated document into a downloaded file, then revoke the URL. */
function downloadHtml(fileName: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  // Revoking immediately can cancel the download on some browsers; one second
  // is enough for the click to be consumed.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** The export page: pick projects, generate one self-contained form. */
export function ExportPage({
  api,
  t,
  snapshot,
  onBack,
}: {
  api: ClientApi
  t: Translate
  snapshot: Snapshot | null
  onBack(): void
}): JSX.Element {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [done, setDone] = useState<ExportOutcome | null>(null)

  const projects = snapshot?.projects ?? []
  const blank = selected.size === 0

  const toggle = useCallback((pocId: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(pocId)) next.delete(pocId)
      else next.add(pocId)
      return next
    })
  }, [])

  const selectAll = useCallback(() => setSelected(new Set(projects.map((project) => project.pocId))), [projects])
  const selectNone = useCallback(() => setSelected(new Set()), [])

  const generate = useCallback(async () => {
    setBusy(true)
    setFailure(null)
    try {
      const outcome = await api.exportForm({
        pocIds: [...selected],
        mode: selected.size === 0 ? 'blank' : 'fill',
      })
      downloadHtml(outcome.fileName, outcome.html)
      setDone(outcome)
    } catch (error) {
      setFailure(errorText(t, error))
    } finally {
      setBusy(false)
    }
  }, [api, selected, t])

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">{t('exportTitle')}</h1>
          <p className="page-subtitle">{t('exportSubtitle')}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={onBack}>{t('back')}</button>
        </div>
      </div>
      <div className="page-body">
        {failure !== null ? (
          <div className="failure" role="alert" style={{ marginBottom: 16 }}>
            <div className="failure-text">
              <div className="failure-title">⚠ {t('exportFailed')}</div>
              <div className="failure-reason">{t('failureReason')}：{failure}</div>
            </div>
          </div>
        ) : null}

        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">{t('tableTitle')}</h2>
            <span className="panel-kicker">{format(t('exportSelected'), { count: selected.size })}</span>
          </div>
          <div className="panel-body">
            {projects.length === 0 ? (
              <div className="padded gap-copy" style={{ padding: '12px 16px', margin: 0 }}>{t('exportNoProjects')}</div>
            ) : (
              <>
                <div className="export-toolbar">
                  <button type="button" className="btn btn-small" onClick={selectAll}>{t('exportSelectAll')}</button>
                  <button type="button" className="btn btn-small" onClick={selectNone}>{t('exportSelectNone')}</button>
                </div>
                <div className="export-list">
                  {projects.map((project) => (
                    <label key={project.pocId} className="export-row" data-selected={selected.has(project.pocId)}>
                      <input
                        type="checkbox"
                        checked={selected.has(project.pocId)}
                        onChange={() => toggle(project.pocId)}
                        aria-label={project.name}
                      />
                      <span className="export-name">{project.name}</span>
                      <span className="project-id">{project.pocId}</span>
                      <span className="export-stage">{project.stageLabel === '' ? t('stageUnknown') : project.stageLabel}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="panel-footer submit-bar">
            <div className="submit-hint">
              {blank ? t('exportBlankHint') : t('exportHint')}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || (projects.length === 0 && !blank)}
              onClick={() => { void generate() }}
            >
              {busy ? <><span className="spinner" /> {t('exportGenerating')}</> : t('exportGenerate')}
            </button>
          </div>
        </div>

        {done !== null ? (
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-header">
              <h2 className="panel-title">✓ {t('exportDone', { name: done.fileName })}</h2>
              <span className="panel-kicker">{format(t('exportSize'), { kb: Math.round(done.bytes / 1024) })}</span>
            </div>
            <div className="panel-body padded">
              <p className="gap-copy" style={{ margin: 0 }}>{t('exportHint')}</p>
              <p className="gap-copy" style={{ margin: '6px 0 0' }}>
                {done.pocIds.length === 0 ? t('exportBlank') : done.pocIds.join(' · ')}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}

/** One severity pill. */
function LevelPill({ level, t }: { level: string; t: Translate }): JSX.Element {
  if (level === 'high') return <span className="status-pill tone-red"><span className="status-dot" />{t('riskHigh')}</span>
  if (level === 'medium') return <span className="status-pill tone-amber"><span className="status-dot" />{t('riskMedium')}</span>
  if (level === 'low') return <span className="status-pill tone-green"><span className="status-dot" />{t('riskLow')}</span>
  return <span className="status-pill tone-slate"><span className="status-dot" />{t('riskUnset')}</span>
}

/** The risk board. */
export function RiskBoardPage({
  api,
  t,
  onBack,
  onOpenProject,
}: {
  api: ClientApi
  t: Translate
  onBack(): void
  onOpenProject(pocId: string): void
}): JSX.Element {
  const [board, setBoard] = useState<RiskBoard | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    void (async () => {
      try {
        const next = await api.risks()
        if (live) setBoard(next)
      } catch (error) {
        if (live) setFailure(errorText(t, error))
      }
    })()
    return () => { live = false }
  }, [api, t])

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">{t('risksBoardTitle')}</h1>
          <p className="page-subtitle">{t('risksSubtitle')}</p>
          {board === null ? null : (
            <p className="page-source">
              <span>{format(t('riskCounts'), { high: board.counts.high, medium: board.counts.medium, low: board.counts.low, unset: board.counts.unset })}</span>
              <span>·</span>
              <span>{format(t('riskProjects'), { withRisks: board.projectsWithRisks, total: board.projectsTotal })}</span>
            </p>
          )}
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={onBack}>{t('back')}</button>
        </div>
      </div>
      <div className="page-body">
        {failure !== null ? (
          <div className="failure" role="alert"><div className="failure-text"><div className="failure-reason">{failure}</div></div></div>
        ) : null}
        {board === null ? (
          <div className="empty-state"><span className="spinner" /> <p className="empty-copy">{t('loading')}</p></div>
        ) : board.rows.length === 0 ? (
          <div className="empty-state"><h2 className="empty-title">{t('riskNoRisks')}</h2></div>
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat-card" data-tone="red">
                <div className="stat-label">{t('riskHigh')}</div>
                <div className="stat-value" data-tone="red">{board.counts.high}</div>
              </div>
              <div className="stat-card" data-tone="amber">
                <div className="stat-label">{t('riskMedium')}</div>
                <div className="stat-value" data-tone="amber">{board.counts.medium}</div>
              </div>
              <div className="stat-card" data-tone="green">
                <div className="stat-label">{t('riskLow')}</div>
                <div className="stat-value" data-tone="green">{board.counts.low}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t('riskUnset')}</div>
                <div className="stat-value">{board.counts.unset}</div>
                <div className="stat-note">{t('riskUnsetHint')}</div>
              </div>
            </div>
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">{t('risksBoardTitle')}</h2>
                <span className="panel-kicker">{board.rows.length}</span>
              </div>
              <div className="panel-body">
                <div className="risk-list">
                  {board.rows.map((row, index) => (
                    <div key={`${row.pocId}:${index}`} className="risk-row" data-level={row.level === '' ? 'unset' : row.level}>
                      <div className="risk-head">
                        <LevelPill level={row.level} t={t} />
                        <span className="risk-name">{row.name === '' ? t('emptyField') : row.name}</span>
                      </div>
                      {row.mitigation === '' ? null : (
                        <div className="risk-mitigation">{t('riskMitigation')}：{row.mitigation}</div>
                      )}
                      <div className="risk-foot">
                        <button type="button" className="gap-link" onClick={() => onOpenProject(row.pocId)}>
                          {row.pocName} · {row.pocId}
                        </button>
                        {row.gapCount > 0 ? (
                          <span className="risk-gap">{format(t('riskGapContext'), { count: row.gapCount, high: row.highGapCount })}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

/** The global timeline. */
export function TimelinePage({
  api,
  t,
  locale,
  onBack,
  onOpenProject,
}: {
  api: ClientApi
  t: Translate
  locale: string
  onBack(): void
  onOpenProject(pocId: string): void
}): JSX.Element {
  const [timeline, setTimeline] = useState<GlobalTimeline | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    void (async () => {
      try {
        const next = await api.timeline()
        if (live) setTimeline(next)
      } catch (error) {
        if (live) setFailure(errorText(t, error))
      }
    })()
    return () => { live = false }
  }, [api, t])

  const months = useMemo(() => timeline?.months ?? [], [timeline])

  /** A `YYYY-MM-DD` date rendered for the active locale. */
  const formatDate = useCallback((value: string): string => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value === '' ? '—' : value
    const stamp = new Date(`${value}T00:00:00`)
    if (Number.isNaN(stamp.getTime())) return value
    return stamp.toLocaleDateString(locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }, [locale])

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">{t('timelineTitle')}</h1>
          <p className="page-subtitle">{t('timelineSubtitle')}</p>
          {timeline === null ? null : (
            <p className="page-source">
              {timeline.range === null ? null : (
                <>
                  <span>{format(t('timelineRange'), { from: formatDate(timeline.range.from), to: formatDate(timeline.range.to) })}</span>
                  <span>·</span>
                </>
              )}
              <span>{format(t('timelineCount'), { count: timeline.entries.length })}</span>
              {timeline.silentProjects.length > 0 ? (
                <>
                  <span>·</span>
                  <span>{format(t('timelineSilent'), { count: timeline.silentProjects.length })}</span>
                </>
              ) : null}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={onBack}>{t('back')}</button>
        </div>
      </div>
      <div className="page-body">
        {failure !== null ? (
          <div className="failure" role="alert"><div className="failure-text"><div className="failure-reason">{failure}</div></div></div>
        ) : null}
        {timeline === null ? (
          <div className="empty-state"><span className="spinner" /> <p className="empty-copy">{t('loading')}</p></div>
        ) : timeline.entries.length === 0 ? (
          <div className="empty-state"><h2 className="empty-title">{t('timelineEmpty')}</h2></div>
        ) : (
          <>
            {months.length > 0 ? (
              <div className="month-strip">
                {months.map((month) => (
                  <div key={month.month} className="month-cell">
                    <span className="month-label">{month.month}</span>
                    <span className="month-count">{format(t('timelineMonth'), { month: '', count: month.count }).replace(/^：|^: /, '')}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {timeline.silentProjects.length > 0 ? (
              <div className="panel" style={{ marginBottom: 16 }}>
                <div className="panel-header">
                  <h2 className="panel-title">{format(t('timelineSilent'), { count: timeline.silentProjects.length })}</h2>
                </div>
                <div className="panel-body padded">
                  <div className="chip-row">
                    {timeline.silentProjects.map((project) => (
                      <button key={project.pocId} type="button" className="chip chip-button" onClick={() => onOpenProject(project.pocId)}>
                        {project.pocName} · {project.pocId}
                      </button>
                    ))}
                  </div>
                  <p className="gap-copy" style={{ margin: '8px 0 0' }}>{t('timelineSilentHint')}</p>
                </div>
              </div>
            ) : null}
            <div className="timeline">
              {timeline.entries.map((entry, index) => (
                <div key={`${entry.pocId}:${entry.date}:${index}`} className="timeline-item">
                  <div className="timeline-marker" aria-hidden="true" />
                  <div className="timeline-content">
                    <div className="timeline-heading">
                      <span className="timeline-date">{formatDate(entry.date)}</span>
                      <span className="timeline-meta">
                        {entry.round === null ? t('roundUnnumbered') : format(t('timelineRoundShort'), { round: entry.round })}
                      </span>
                      <button type="button" className="gap-link" onClick={() => onOpenProject(entry.pocId)}>
                        {entry.pocName} · {entry.pocId}
                      </button>
                    </div>
                    {entry.goal === '' ? null : <div className="timeline-copy"><span>{entry.goal}</span></div>}
                    <div className="timeline-copy">
                      {entry.actual === '' ? null : <span>{t('timelineActual')}：{entry.actual}</span>}
                      {entry.evidence === '' ? (
                        <span className="timeline-missing">{t('timelineNoEvidence')}</span>
                      ) : (
                        <span>{t('evidenceLabel')}：{entry.evidence}</span>
                      )}
                      {entry.customerFeedback === '' ? (
                        <span className="timeline-missing">{t('timelineNoFeedback')}</span>
                      ) : (
                        <span>{t('feedbackLabel')}：{entry.customerFeedback}</span>
                      )}
                    </div>
                    {entry.recognitionScope === '' ? null : (
                      <div className="timeline-tags">
                        <span className={`status-pill tone-${entry.recognitionScope === '无' ? 'slate' : 'green'}`}>
                          <span className="status-dot" />
                          {t('recognitionLabel')}：{entry.recognitionScope}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
