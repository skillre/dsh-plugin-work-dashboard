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
import type { GlobalTimeline, RiskBoard, Snapshot } from '../types.js'
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

/** A severity pill: the one place a risk level becomes colour. */
function LevelPill({ level, t }: { level: string; t: Translate }): JSX.Element {
  if (level === 'high') return <span className="status-pill tone-red"><span className="status-dot" />{t('riskHigh')}</span>
  if (level === 'medium') return <span className="status-pill tone-amber"><span className="status-dot" />{t('riskMedium')}</span>
  if (level === 'low') return <span className="status-pill tone-green"><span className="status-dot" />{t('riskLow')}</span>
  return <span className="status-pill tone-slate"><span className="status-dot" />{t('riskUnset')}</span>
}

/** Map a v3 recognition value onto a pill tone. */
function recognitionTone(value: string): string {
  if (value === '认可') return 'green'
  if (value === '部分认可') return 'amber'
  if (value === '未认可') return 'red'
  return 'slate'
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
                        {entry.type === '' ? t('roundUnnumbered') : entry.type}
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
                      {entry.completion === '' ? null : <span>{t('completionLabel')}：{entry.completion}</span>}
                    </div>
                    {entry.recognition === '' && entry.gate3_1 === '' && entry.gate3_2 === '' ? null : (
                      <div className="timeline-tags">
                        {entry.recognition === '' ? null : (
                          <span className={`status-pill tone-${recognitionTone(entry.recognition)}`}>
                            <span className="status-dot" />
                            {t('recognitionLabel')}：{entry.recognition}
                          </span>
                        )}
                        {entry.gate3_1 === '' ? null : (
                          <span className="chip">{t('gate3_1Label')}：{entry.gate3_1}</span>
                        )}
                        {entry.gate3_2 === '' ? null : (
                          <span className="chip">{t('gate3_2Label')}：{entry.gate3_2}</span>
                        )}
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
