/**
 * The POC console page: overview, detail, and the refresh machinery.
 *
 * State rules: the Host owns every ledger record; this page holds only view
 * state (which page, which project, the last snapshot, the refresh cadence).
 * Every refresh goes to the Host and its response replaces the snapshot in
 * place, so two tabs on the same console converge instead of fighting.
 *
 * Refresh policy, per the specification:
 * - The cache is wiped by the Host at mount, so the first paint is the empty
 *   state; nothing is pulled until the user presses Refresh.
 * - The timer exists only while this page is mounted and its cadence is not
 *   `off`; closing the page stops it (that is the documented, intended
 *   behaviour).
 * - A scheduled refresh never replaces the visible error; it only reports a
 *   failure in the status bar, so a flaky network cannot spam the page.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DIMENSIONS, STAGES, type DimensionKey, type GapItem, type PocRecord, type ProjectDetail, type ProjectSummary, type RefreshInterval, type Snapshot, type StageId } from '../types.js'
import { ActionError } from './api.js'
import type { ClientApi } from './api.js'
import type { ClientLocaleLike } from './contracts.js'
import {
  DEFAULT_PREFERENCE,
  clampMinutes,
  intervalMs,
  parseInterval,
  readPreference,
  writePreference,
  type RefreshPreference,
} from './preferences.js'
import { ExportPage, RiskBoardPage, TimelinePage } from './insights.jsx'
import { CONSOLE_CSS } from './styles.js'
import { format, type Translate } from './text.js'
import { CUSTOM_MINUTES_MAX, CUSTOM_MINUTES_MIN } from '../types.js'

/** Which page the console shows. */
type Page =
  | { kind: 'overview' }
  | { kind: 'detail'; pocId: string }
  /** Import an uploaded file: `pocId: null` means a brand-new project. */
  | { kind: 'export' }
  | { kind: 'risks' }
  | { kind: 'timeline' }

/** Props the `main` slot passes through; the console owns its own data. */
export interface WorkDashboardPageProps {
  api: ClientApi
  locale: ClientLocaleLike
  t: Translate
}

/** The sidebar glyph: a five-step stage rail, sized by the sidebar slot. */
export function SidebarGlyph({ size = 18 }: { size?: number; active?: boolean }): JSX.Element {
  return (
    <svg className="wd-glyph" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="3.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="6" y="8" width="5.4" height="3.6" rx="1.2" fill="currentColor" opacity="0.85" />
      <rect x="12.6" y="8" width="5.4" height="3.6" rx="1.2" fill="currentColor" opacity="0.35" />
      <rect x="6" y="13" width="12" height="3.4" rx="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

/** A `date` (or ISO stamp) rendered for the active locale; `''` stays `''`. */
function formatStamp(value: string | null, locale: string, withTime = false): string {
  if (value === null || value === '') return ''
  const stamp = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(stamp.getTime())) return value
  const zh = locale.toLowerCase().startsWith('zh')
  return stamp.toLocaleString(zh ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

/** A wall-clock `HH:MM` for the "refreshed at" status text. */
function clockOf(value: string | null, locale: string): string {
  if (value === null) return ''
  const stamp = new Date(value)
  if (Number.isNaN(stamp.getTime())) return ''
  return stamp.toLocaleTimeString(locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}

/** The four dimension keys in display order, with their dictionary keys. */
const DIMENSION_LABELS: Record<DimensionKey, string> = {
  achievement: 'dimAchievement',
  evidence: 'dimEvidence',
  recognition: 'dimRecognition',
  nextMilestone: 'dimNextMilestone',
}

/** Tone for a stage: done stages green, the current one blue, the rest slate. */
function stageTone(stage: StageId | null, closed: boolean): 'green' | 'blue' | 'slate' {
  if (closed) return 'green'
  if (stage === null) return 'slate'
  return 'blue'
}

/** How a project's stage reads in a pill. */
function stagePill(t: Translate, project: ProjectSummary): string {
  if (project.closed) return t('stageClosed')
  if (project.stageLabel !== '') return project.stageLabel
  return t('stageUnknown')
}

/** Advisory next project id, derived from the ids the snapshot already holds. */
function suggestNextId(snapshot: Snapshot | null): string {
  const year = new Date().getFullYear()
  let highest = 0
  for (const project of snapshot?.projects ?? []) {
    const match = project.pocId.match(/^POC-[0-9]{4}-([0-9]{3,})$/)
    if (match === null) continue
    const sequence = Number(match[1])
    if (Number.isFinite(sequence) && sequence > highest) highest = sequence
  }
  return `POC-${year}-${String(highest + 1).padStart(3, '0')}`
}

/** Render the four dimensions as four separate cells, never merged. */
function DimensionCells({ summary, t }: { summary: ProjectSummary; t: Translate }): JSX.Element {
  return (
    <div className="dim-grid" role="group" aria-label={t('colDimensions')}>
      {DIMENSIONS.map((key) => {
        const present = summary.dimensions[key]
        return (
          <div key={key} className="dim-cell" data-present={present} title={`${t(DIMENSION_LABELS[key])}: ${present ? t('dimPresent') : t('dimMissing')}`}>
            <span className="dim-label">{t(DIMENSION_LABELS[key])}</span>
            <span className="dim-mark">{present ? `✓ ${t('dimPresent')}` : `✗ ${t('dimMissing')}`}</span>
          </div>
        )
      })}
    </div>
  )
}

/** The G0→G4 track as five dots: the overview table's compact form. */
function StageDots({ summary, t }: { summary: ProjectSummary; t: Translate }): JSX.Element {
  const currentIndex = summary.stage === null ? -1 : STAGES.indexOf(summary.stage)
  return (
    <div className="stage-dots" role="img" aria-label={t('stageTrack')}>
      {STAGES.map((stage, index) => {
        // Completion comes from the ledger's own gate record; the current
        // position only decides which dot is highlighted.
        const done = summary.gateComplete[index] === true
        const current = !summary.closed && index === currentIndex
        return (
          <span key={stage} className="stage-dot" data-done={done} data-current={current}
            title={`${t(`stage${stage}`)} · ${done ? t('stageDone') : current ? t('stageCurrent') : t('stagePending')}`} />
        )
      })}
    </div>
  )
}

/** The G0→G4 horizontal rail; done / current / pending are distinct. */
function StageTrack({ summary, t, compact = false }: { summary: ProjectSummary; t: Translate; compact?: boolean }): JSX.Element {
  const currentIndex = summary.stage === null ? -1 : STAGES.indexOf(summary.stage)
  return (
    <div className="stage-track" role="list" aria-label={t('stageTrack')}>
      {STAGES.map((stage, index) => {
        // The rail reports the ledger's gate records, not an inferred
        // "everything before the current stage must be done".
        const done = summary.gateComplete[index] === true
        const current = !summary.closed && index === currentIndex
        return (
          <div key={stage} className="stage-step" role="listitem" data-done={done} data-current={current} data-reached={done || current}
            aria-current={current ? 'step' : undefined}
            title={`${t(`stage${stage}`)} · ${done ? t('stageDone') : current ? t('stageCurrent') : t('stagePending')}`}>
            <div className="stage-marker">{done ? '✓' : current ? '◉' : index + 1}</div>
            <div className="stage-label">{stage}</div>
            {compact ? null : (
              <div className="stage-caption">{done ? t('stageDone') : current ? t('stageCurrent') : t('stagePending')}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** The four headline counters. */
function StatGrid({ snapshot, t }: { snapshot: Snapshot; t: Translate }): JSX.Element {
  const stats = snapshot.stats
  return (
    <div className="stat-grid">
      <div className="stat-card" data-tone="blue">
        <div className="stat-label">{t('statActive')}</div>
        <div className="stat-value">{stats.active}</div>
        <div className="stat-note">{t('statTotal')} {stats.total}</div>
      </div>
      <div className="stat-card" data-tone="amber">
        <div className="stat-label">{t('statG0')}</div>
        <div className="stat-value" data-tone="amber">{stats.g0Incomplete}</div>
        <div className="stat-note">G0</div>
      </div>
      <div className="stat-card" data-tone="red">
        <div className="stat-label">{t('statRisk')}</div>
        <div className="stat-value" data-tone="red">{stats.atRisk}</div>
        <div className="stat-note">{t('statClosed')} {stats.closed}</div>
      </div>
      <div className="stat-card" data-tone="green">
        <div className="stat-label">{t('statConvertible')}</div>
        <div className="stat-value" data-tone="green">{stats.convertible}</div>
        <div className="stat-note">{t('dimAchievement')} + {t('dimEvidence')} + {t('dimRecognition')}</div>
      </div>
    </div>
  )
}

/** The project table: name, stage, four dimensions, gap count, action. */
function ProjectTable({ snapshot, t, onOpen }: { snapshot: Snapshot; t: Translate; onOpen(pocId: string): void }): JSX.Element {
  return (
    <table className="project-table">
      <thead className="table-head">
        <tr>
          <th style={{ width: '30%' }}>{t('colProject')}</th>
          <th style={{ width: '13%' }}>{t('colStage')}</th>
          <th style={{ width: '37%' }}>{t('colDimensions')}</th>
          <th style={{ width: '10%' }}>{t('colGaps')}</th>
          <th style={{ width: '10%' }}>{t('colAction')}</th>
        </tr>
      </thead>
      <tbody>
        {snapshot.projects.map((project) => {
          const level = project.highGapCount > 0 ? 'high' : project.gapCount > 0 ? 'medium' : 'none'
          return (
            <tr
              key={project.pocId}
              className="project-row"
              tabIndex={0}
              onClick={() => onOpen(project.pocId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpen(project.pocId)
                }
              }}
            >
              <td>
                <span className="project-name">{project.name}</span>
                <span className="project-id">{project.pocId}{project.owner === '' ? '' : ` · ${project.owner}`}</span>
              </td>
              <td>
                <div className="stage-cell">
                  <span className={`status-pill tone-${stageTone(project.stage, project.closed)}`}>
                    <span className="status-dot" />
                    {stagePill(t, project)}
                  </span>
                  <StageDots summary={project} t={t} />
                </div>
              </td>
              <td>
                <DimensionCells summary={project} t={t} />
              </td>
              <td>
                <span className="gap-count" data-level={level}>
                  {project.gapCount === 0 ? '—' : project.gapCount}
                </span>
                {project.highGapCount > 0 ? <span className="project-meta"> · {project.highGapCount}!</span> : null}
              </td>
              <td>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpen(project.pocId)
                    }}
                  >
                    {t('detail')}
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** The pending rail: every gap, most urgent first. */
function PendingList({ gaps, t, onOpen }: { gaps: GapItem[]; t: Translate; onOpen(pocId: string): void }): JSX.Element {
  if (gaps.length === 0) {
    return <div className="panel-body padded"><div className="empty-copy" style={{ margin: 0 }}>{t('pendingEmpty')}</div></div>
  }
  return (
    <div className="gap-list">
      {gaps.map((item) => (
        <div key={`${item.pocId}:${item.rule}`} className={`gap-item gap-level-${item.level}`}>
          <span className="gap-flag" aria-hidden="true" />
          <div className="gap-text">
            <div className="gap-title">{t(`gap.${item.rule}.title`)}</div>
            <div className="gap-copy">
              {format(t(`gap.${item.rule}.copy`), {
                ...(item.params ?? {}),
                // -1 is the Host's sentinel for "no timeline record at all",
                // which is not the same thing as "not refreshed yet".
                days: item.params?.days === -1 ? t('noTimeline') : String(item.params?.days ?? ''),
              })}
            </div>
            <div className="gap-project">
              <span>{item.pocName === '' ? item.pocId : item.pocName}</span>
              <span>·</span>
              <span>{item.pocId}</span>
              <button type="button" className="gap-link" onClick={() => onOpen(item.pocId)}>
                {t('openDetail')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** The settings sheet: four cadences, persisted to localStorage on save. */
function RefreshSettings({
  preference,
  t,
  onSave,
  onCancel,
}: {
  preference: RefreshPreference
  t: Translate
  onSave(next: RefreshPreference): void
  onCancel(): void
}): JSX.Element {
  const [interval, setIntervalValue] = useState<RefreshInterval>(preference.interval)
  const [minutes, setMinutes] = useState<string>(String(preference.customMinutes))
  const parsedMinutes = Number(minutes)
  const minutesValid = Number.isFinite(parsedMinutes) && parsedMinutes >= CUSTOM_MINUTES_MIN && parsedMinutes <= CUSTOM_MINUTES_MAX
  const rows: Array<{ value: RefreshInterval; label: string }> = [
    { value: 'off', label: t('intervalOff') },
    { value: '10m', label: t('interval10m') },
    { value: '1h', label: t('interval1h') },
    { value: 'custom', label: t('intervalCustom') },
  ]
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={t('refreshSettings')}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel()
        }}>
        <div className="modal-header">
          <h2 className="modal-title">{t('refreshSettings')}</h2>
        </div>
        <div className="modal-content">
          {rows.map((row) => (
            <label key={row.value} className="checkbox-row" data-selected={interval === row.value}>
              <input type="radio" name="poc-refresh-interval" value={row.value} checked={interval === row.value} onChange={() => setIntervalValue(row.value)} />
              <span>{row.label}</span>
            </label>
          ))}
          {interval === 'custom' ? (
            <div className="inline-field">
              <input
                className="input"
                type="number"
                min={CUSTOM_MINUTES_MIN}
                max={CUSTOM_MINUTES_MAX}
                step={1}
                value={minutes}
                aria-label={t('customMinutes')}
                onChange={(event) => setMinutes(event.target.value)}
              />
              <span>{t('customMinutes')}</span>
            </div>
          ) : null}
          {interval === 'custom' && !minutesValid ? (
            <p className="form-error">{format(t('customMinutesError'), { min: CUSTOM_MINUTES_MIN, max: CUSTOM_MINUTES_MAX })}</p>
          ) : null}
          <div className="helper-box">
            {interval === 'off'
              ? t('autoRefreshOff')
              : format(t('autoRefreshOn'), {
                  minutes: interval === '10m' ? 10 : interval === '1h' ? 60 : minutesValid ? clampMinutes(parsedMinutes) : 0,
                })}
          </div>
        </div>
        <div className="modal-footer">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onCancel}>{t('cancel')}</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={interval === 'custom' && !minutesValid}
            onClick={() => onSave({ interval, customMinutes: minutesValid ? clampMinutes(parsedMinutes) : preference.customMinutes })}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}

/** The empty state: the cache is wiped, so this is what a cold start shows. */
function EmptyState({ snapshot, t, busy, onRefresh }: { snapshot: Snapshot | null; t: Translate; busy: boolean; onRefresh(): void }): JSX.Element {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path d="M3.5 7.2l8.5-4.2 8.5 4.2v9.6L12 21l-8.5-4.2V7.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M3.5 7.2L12 11.6l8.5-4.4M12 11.6V21" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="empty-title">{t('emptyTitle')}</h2>
      <p className="empty-copy">{t('emptyCopy')}</p>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={onRefresh}>
        {busy ? <><span className="spinner" /> {t('refreshing')}</> : t('emptyRefresh')}
      </button>
      {busy ? <p className="empty-copy" style={{ marginTop: 6 }}>{t('refreshingHint')}</p> : null}
      <p className="empty-meta">
        {t('dataSource')}：github.com/{snapshot?.repository ?? ''} · {t('emptyPath')}：{snapshot?.cachePath ?? ''}
      </p>
    </div>
  )
}

/** The failure banner: a clear reason plus a retry button. */
function FailureBanner({ message, t, onRetry, busy }: { message: string; t: Translate; onRetry(): void; busy: boolean }): JSX.Element {
  return (
    <div className="failure" role="alert">
      <div className="failure-text">
        <div className="failure-title">⚠ {t('failureTitle')}</div>
        <div className="failure-reason">{t('failureReason')}：{message}</div>
      </div>
      <button type="button" className="btn btn-small" disabled={busy} onClick={onRetry}>{t('failureRetry')}</button>
    </div>
  )
}

/** Map a Host error onto a dictionary key, keeping the Host message as detail. */
function errorText(t: Translate, error: unknown): string {
  if (error instanceof ActionError) {
    const key = `error.${error.code.replace(/^poc-console\//, '')}`
    const translated = t(key)
    // `t` returns the key itself when a dictionary entry is missing, so an
    // unknown code falls back to the Host's own (already user-facing) message.
    return translated === key ? error.message : translated
  }
  if (error instanceof Error) return error.message
  return t('error.failed')
}

/** The overview page: stats, table, pending rail. */
function OverviewPage({ snapshot, t, onOpen }: { snapshot: Snapshot; t: Translate; onOpen(pocId: string): void }): JSX.Element {
  return (
    <>
      <StatGrid snapshot={snapshot} t={t} />
      <div className="workspace-grid">
        <div className="primary-column">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">{t('tableTitle')}</h2>
              <span className="panel-kicker">{snapshot.projects.length}</span>
            </div>
            <div className="panel-body">
              {snapshot.projects.length === 0
                ? <div className="panel-body padded">{t('noProjects')}</div>
                : <ProjectTable snapshot={snapshot} t={t} onOpen={onOpen} />}
            </div>
          </div>
          {snapshot.warnings.length > 0 ? (
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">{t('warningsTitle')}</h2>
                <span className="panel-kicker">{snapshot.warnings.length}</span>
              </div>
              <div className="panel-body padded">
                {snapshot.warnings.map((warning) => (
                  <p key={warning} className="gap-copy" style={{ margin: '0 0 4px' }}>· {warning}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="secondary-column">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">{t('pendingTitle')}</h2>
              <span className="panel-kicker">{format(t('pendingCount'), { count: snapshot.gaps.length })}</span>
            </div>
            <div className="panel-body">
              <PendingList gaps={snapshot.gaps} t={t} onOpen={onOpen} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/** One detail row; an empty value is shown as the explicit "(empty)" marker. */
function DetailRow({ label, value, t }: { label: string; value: string; t: Translate }): JSX.Element {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className={value === '' ? 'detail-value is-empty' : 'detail-value'}>{value === '' ? t('emptyField') : value}</span>
    </div>
  )
}

/** The detail page: hero, stage track, four dimensions, then the full record. */
function DetailPage({ detail, t, locale, onBack }: { detail: ProjectDetail; t: Translate; locale: string; onBack(): void }): JSX.Element {
  const summary = detail.summary
  const resultPresent: Record<DimensionKey, boolean> = {
    achievement: detail.result.achievement !== '',
    evidence: detail.result.evidence !== '',
    recognition: detail.result.recognition !== '',
    nextMilestone: detail.result.next_milestone !== '',
  }
  const resultValue: Record<DimensionKey, string> = {
    achievement: detail.result.achievement,
    evidence: detail.result.evidence,
    recognition: detail.result.recognition,
    nextMilestone: detail.result.next_milestone,
  }
  const identity = format(t('detailIdentity'), {
    pocId: summary.pocId,
    stage: summary.stageLabel === '' ? t('stageUnknown') : summary.stageLabel,
    tier: detail.tier === '' ? '—' : detail.tier,
  })
  return (
    <>
      <div className="project-hero">
        <div className="project-hero-top">
          <div className="project-hero-text">
            <h1 className="project-title">{summary.name}</h1>
            <p className="project-identity">{identity}</p>
          </div>
          <div className="project-hero-actions">
            <button type="button" className="btn" onClick={onBack}>{t('back')}</button>
          </div>
        </div>
        <div className="detail-section">
          <h2 className="section-heading">{t('stageTrack')}</h2>
          <StageTrack summary={summary} t={t} />
        </div>
      </div>
      <div className="detail-body">
        <div className="detail-section">
          <h2 className="section-heading">{t('sectionFourDim')}<span className="section-kicker">{format(t('dimensionCount'), { count: summary.dimensionCount })}</span></h2>
          <div className="status-summary">
            {DIMENSIONS.map((key) => (
              <div key={key} className="summary-item" data-present={resultPresent[key]}>
                <span className="summary-label">{t(DIMENSION_LABELS[key])}</span>
                <span className="summary-value">{resultPresent[key] ? `✓ ${t('dimPresent')}` : `✗ ${t('dimMissing')}`}</span>
                <span className="summary-note">{resultPresent[key] ? resultValue[key] : t('emptyField')}</span>
              </div>
            ))}
          </div>
        </div>

        {detail.gaps.length > 0 ? (
          <div className="detail-section">
            <h2 className="section-heading">{t('sectionGaps')}<span className="section-kicker">{detail.gaps.length}</span></h2>
            <div className="detail-list">
              {detail.gaps.map((item) => (
                <div key={item.rule} className={`gap-item gap-level-${item.level}`}>
                  <span className="gap-flag" aria-hidden="true" />
                  <div className="gap-text">
                    <div className="gap-title">{t(`gap.${item.rule}.title`)}</div>
                    <div className="gap-copy">{format(t(`gap.${item.rule}.copy`), { ...(item.params ?? {}) })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="detail-section">
          <h2 className="section-heading">{t('sectionG0')}</h2>
          <div className="detail-list">
            <DetailRow label={t('whyCustomerTest')} value={detail.whyCustomerTest} t={t} />
            <DetailRow label={t('whyWeTest')} value={detail.whyWeTest} t={t} />
            <DetailRow label={t('customerTechOwner')} value={detail.customerTechOwner} t={t} />
            <DetailRow label={t('nextActionGoal')} value={detail.nextActionGoal} t={t} />
            <DetailRow label={t('owner')} value={detail.owner} t={t} />
            <DetailRow label={t('salesInitiator')} value={detail.salesInitiator} t={t} />
            <DetailRow label={t('type')} value={detail.type} t={t} />
            <DetailRow label={t('tier')} value={detail.tier} t={t} />
          </div>
        </div>

        <div className="detail-section">
          <h2 className="section-heading">{t('sectionGates')}</h2>
          <div className="detail-list">
            {detail.gates.map((gate) => (
              <div key={gate.stage} className="gate-row">
                <span className="gate-stage">{gate.stage}</span>
                <span className={`status-pill tone-${gate.complete ? 'green' : 'slate'}`}>
                  <span className="status-dot" />
                  {gate.complete ? t('stageDone') : t('stagePending')}
                </span>
                <span className="gate-copy">
                  {gate.date === null ? '' : `${t('gateDate')} ${formatStamp(gate.date, locale)} · `}
                  {gate.indicators === null && gate.scenarios === null && gate.risks === null
                    ? ''
                    : format(t('gateCounts'), {
                        indicators: gate.indicators ?? '—',
                        scenarios: gate.scenarios ?? '—',
                        risks: gate.risks ?? '—',
                      })}
                  {gate.prerequisitesReady === null ? '' : ` · ${format(t('gatePrereq'), { ready: gate.prerequisitesReady ? t('yes') : t('no') })}`}
                  {gate.engineersInvested === null ? '' : ` · ${format(t('gateEngineers'), { invested: gate.engineersInvested ? t('yes') : t('no') })}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h2 className="section-heading">{t('sectionScope')}</h2>
          <div className="detail-list">
            <div className="detail-row">
              <span className="detail-label">{t('criteriaTitle')} · {t('criteriaLimitHint')}</span>
              <div className="detail-value">
                {detail.criteria.length === 0 ? <span className="is-empty" style={{ fontStyle: 'italic', opacity: .7 }}>{t('emptyField')}</span> : (
                  <div className="chip-row">
                    {detail.criteria.map((criterion, index) => (
                      <span key={`${criterion.name}:${index}`} className="chip" title={criterion.metric}>
                        {criterion.name === '' ? t('emptyField') : criterion.name}
                        {criterion.metric === '' ? '' : ` · ${criterion.metric}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t('scenariosTitle')} · {t('scenariosLimitHint')}</span>
              <div className="detail-value">
                {detail.scenarios.length === 0 ? t('emptyField') : (
                  <div className="chip-row">{detail.scenarios.map((scenario, index) => <span key={`${scenario}:${index}`} className="chip">{scenario}</span>)}</div>
                )}
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t('risksTitle')} · {t('risksLimitHint')}</span>
              <div className="detail-value">
                {detail.risks.length === 0 ? t('emptyField') : (
                  <div className="chip-row">
                    {detail.risks.map((risk, index) => (
                      <span key={`${risk.name}:${index}`} className="chip" title={risk.mitigation}>
                        {risk.name === '' ? t('emptyField') : risk.name}
                        {risk.level === '' ? '' : ` · ${risk.level}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2 className="section-heading">{t('sectionTimeline')}<span className="section-kicker">{detail.timeline.length}</span></h2>
          {detail.timeline.length === 0 ? (
            <p className="gap-copy" style={{ margin: 0 }}>{t('noTimeline')}</p>
          ) : (
            <div className="timeline">
              {detail.timeline.map((round, index) => (
                <div key={`${round.date}:${index}`} className="timeline-item">
                  <div className="timeline-marker" aria-hidden="true" />
                  <div className="timeline-content">
                    <div className="timeline-heading">
                      <span className="timeline-date">{round.date === '' ? '—' : formatStamp(round.date, locale)}</span>
                      <span className="timeline-meta">
                        {round.round === null ? t('roundUnnumbered') : format(t('round'), { round: round.round })}
                        {round.goal === '' ? '' : ` · ${round.goal}`}
                      </span>
                    </div>
                    <div className="timeline-copy">
                      {round.actual === '' ? null : <span>{round.actual}</span>}
                      {round.evidence === '' ? null : <span>{t('evidenceLabel')}：{round.evidence}</span>}
                      {round.customer_feedback === '' ? null : <span>{t('feedbackLabel')}：{round.customer_feedback}</span>}
                    </div>
                    {round.recognition_scope === '' ? null : (
                      <div className="timeline-tags">
                        <span className={`status-pill tone-${round.recognition_scope === '无' ? 'slate' : 'green'}`}>
                          <span className="status-dot" />
                          {t('recognitionLabel')}：{round.recognition_scope}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/** The console page: owns the snapshot, the page, and the refresh cadence. */
export function WorkDashboardPage({ api, locale, t }: WorkDashboardPageProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [page, setPage] = useState<Page>({ kind: 'overview' })
  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState<string | null>(null)
  const [preference, setPreference] = useState<RefreshPreference>(DEFAULT_PREFERENCE)
  const [settingsOpen, setSettingsOpen] = useState(false)

  /** The in-flight refresh, so a second press reuses it instead of stacking. */
  const inFlight = useRef<Promise<void> | null>(null)
  /** Whether the page is mounted; a scheduled tick after unmount must not paint. */
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // Load the stored cadence once, after mount (never during SSR/first paint).
  useEffect(() => {
    setPreference(readPreference())
  }, [])

  /** Pull the snapshot without refreshing the cache. */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = await api.list()
      if (mounted.current) {
        setSnapshot(next)
        setFailure(null)
      }
    } catch (error) {
      if (mounted.current) setFailure(errorText(t, error))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [api, t])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * Refresh: clone or fast-forward, then adopt the new snapshot.
   *
   * `manual` distinguishes a user press from a timer tick. A manual press owns
   * the visible error banner and the retry affordance; a timer tick only
   * annotates the status bar, so a flaky network cannot repaint the page.
   */
  const refresh = useCallback(async (manual: boolean) => {
    if (inFlight.current !== null) return inFlight.current
    const job = (async () => {
      setBusy(true)
      if (manual) setFailure(null)
      setStatusNote(null)
      try {
        const { snapshot: next } = await api.refresh()
        if (!mounted.current) return
        setSnapshot(next)
        setFailure(null)
      } catch (error) {
        if (!mounted.current) return
        const message = errorText(t, error)
        if (manual) setFailure(message)
        else setStatusNote(`${t('autoRefreshFailed')}：${message}`)
      } finally {
        if (mounted.current) setBusy(false)
      }
    })()
    inFlight.current = job.finally(() => { inFlight.current = null })
    return inFlight.current
  }, [api, t])

  // Scheduled refresh: exists only while this page is mounted and not `off`.
  const period = intervalMs(preference)
  useEffect(() => {
    if (period === null) return
    const timer = setInterval(() => { void refresh(false) }, period)
    return () => { clearInterval(timer) }
  }, [period, refresh])

  /** Open one project's detail page; the Host is the source of the record. */
  const openDetail = useCallback(async (pocId: string) => {
    setPage({ kind: 'detail', pocId })
    setDetail(null)
    try {
      const next = await api.detail(pocId)
      if (mounted.current) setDetail(next)
    } catch (error) {
      if (mounted.current) setFailure(errorText(t, error))
    }
  }, [api, t])

  const backToOverview = useCallback(() => {
    setPage({ kind: 'overview' })
    setDetail(null)
    setFailure(null)
  }, [])

  const savePreference = useCallback((next: RefreshPreference) => {
    setPreference(next)
    writePreference(next)
    setSettingsOpen(false)
  }, [])

  const activeLocale = locale.getSnapshot().active
  const refreshed = useMemo(() => {
    if (snapshot?.fetchedAt === null || snapshot?.fetchedAt === undefined) return t('neverRefreshed')
    return format(t('refreshedAt'), { time: clockOf(snapshot.fetchedAt, activeLocale) })
  }, [snapshot, t, activeLocale])

  const autoNote = period === null
    ? t('autoRefreshOff')
    : format(t('autoRefreshOn'), { minutes: Math.round(period / 60_000) })

  return (
    <>
      <style>{CONSOLE_CSS}</style>
      <div className="wd-shell">
        <div className="page">
          {page.kind === 'overview' ? (
            <>
            <div className="module-rail">
              <button type="button" className="module-tab" data-active="true" title={t('modulePocHint')}>
                <span className="module-tab-dot" />
                {t('modulePoc')}
              </button>
              <span className="module-rail-hint">{t('moduleMore')}</span>
            </div>
            <div className="page-header">
              <div className="page-header-text">
                <p className="page-eyebrow">{t('eyebrow')}</p>
                <h1 className="page-title">{t('modulePoc')}</h1>
                <p className="page-subtitle">{t('subtitle')}</p>
                <p className="page-source">
                  {t('dataSource')}：<code>github.com/{snapshot?.repository ?? ''}</code>
                  <span>·</span>
                  <span>{refreshed}</span>
                </p>
              </div>
              <div className="header-actions">
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => { void refresh(true) }}>
                  {busy ? <><span className="spinner" /> {t('refreshing')}</> : t('refresh')}
                </button>
                <button type="button" className="btn" onClick={() => setPage({ kind: 'export' })} disabled={snapshot === null || !snapshot.cacheReady}>
                  {t('exportNav')}
                </button>
                <button type="button" className="btn" onClick={() => setPage({ kind: 'risks' })} disabled={snapshot === null || !snapshot.cacheReady}>
                  {t('risksNav')}
                </button>
                <button type="button" className="btn" onClick={() => setPage({ kind: 'timeline' })} disabled={snapshot === null || !snapshot.cacheReady}>
                  {t('timelineNav')}
                </button>
                <button type="button" className="btn" onClick={() => setSettingsOpen(true)} title={autoNote}>
                  {t('refreshSettings')}
                </button>
              </div>
            </div>
            </>
          ) : null}

          {page.kind === 'export' ? (
            <ExportPage api={api} t={t} snapshot={snapshot} onBack={backToOverview} />
          ) : page.kind === 'risks' ? (
            <RiskBoardPage api={api} t={t} onBack={backToOverview} onOpenProject={(pocId) => { void openDetail(pocId) }} />
          ) : page.kind === 'timeline' ? (
            <TimelinePage api={api} t={t} locale={activeLocale} onBack={backToOverview} onOpenProject={(pocId) => { void openDetail(pocId) }} />
          ) : null}

          {page.kind === 'export' || page.kind === 'risks' || page.kind === 'timeline' ? null : (
          <div className={page.kind === 'overview' ? 'page-body' : 'detail-body'}>
            {failure !== null ? (
              <div style={{ marginBottom: 16 }}>
                <FailureBanner message={failure} t={t} busy={busy} onRetry={() => { void refresh(true) }} />
              </div>
            ) : null}

            {loading ? (
              <div className="empty-state"><span className="spinner" /> <p className="empty-copy">{t('loading')}</p></div>
            ) : page.kind === 'detail' ? (
              detail === null ? (
                <div className="empty-state">
                  <h2 className="empty-title">{t('detailMissing')}</h2>
                  <p className="empty-copy">{format(t('detailMissingCopy'), { pocId: page.pocId })}</p>
                  <button type="button" className="btn" onClick={backToOverview}>{t('back')}</button>
                </div>
              ) : (
                <DetailPage detail={detail} t={t} locale={activeLocale} onBack={backToOverview} />
              )
            ) : snapshot !== null && !snapshot.cacheReady ? (
              <EmptyState snapshot={snapshot} t={t} busy={busy} onRefresh={() => { void refresh(true) }} />
            ) : snapshot === null ? null : (
              <OverviewPage
                snapshot={snapshot}
                t={t}
                onOpen={(pocId) => { void openDetail(pocId) }}
              />
            )}
          </div>
          )}

          <div className="page-footer">
            <span>{autoNote}</span>
            {statusNote === null ? null : <><span>·</span><span>{statusNote}</span></>}
          </div>
        </div>
      </div>
      {settingsOpen ? (
        <RefreshSettings
          preference={preference}
          t={t}
          onSave={savePreference}
          onCancel={() => setSettingsOpen(false)}
        />
      ) : null}
    </>
  )
}

/** Re-export the record type the detail renderer consumes. */
export type { PocRecord }
