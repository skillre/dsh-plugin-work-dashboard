/**
 * The portfolio summary surfaces: the KPI strip and the budget panel.
 *
 * ## Why they exist
 *
 * The overview could already answer "which project is this" and "which stage is
 * it in", but the four numbers a reader checks first — how many projects, how
 * many are moving, how much money, how many are blocked — were scattered: the
 * project count lived in a chart header, the amount total in a panel subtitle,
 * the blocked count nowhere at all, and the percentage split of the budget was
 * something the reader had to assemble from three unrelated figures.
 *
 * ## The KPI strip
 *
 * Five figures, each a filter as well as a reading — the same contract the band
 * already uses. Clicking "blocked" narrows the list to blocked projects;
 * clicking a stage narrows to that stage. A figure that cannot be filtered (the
 * total) is deliberately NOT clickable, so the page never offers an action that
 * does nothing.
 *
 * ## The budget panel
 *
 * One panel with a stated definition, instead of three accidental figures:
 *
 * - **approved** — G0 review passed, so the money is at least justified;
 * - **pending** — has an amount but no passing review yet;
 * - **unset** — no amount at all, which is the number that makes the total a lie.
 *
 * That last bucket is the reason the panel exists. A budget total that silently
 * omits four projects is worse than no total, because it looks authoritative.
 */

import { useMemo } from 'react'
import type { OrgBucket, PortfolioAnalysis, ProjectSummary, StageBucket, Stats } from '../types.js'
import { STAGES } from '../types.js'
import { InlineMeter } from './charts.jsx'
import { formatWan, stageBucketKey, stageLabel } from './format.js'
import { format, type Translate } from './text.js'

/** One figure in the KPI strip. */
interface KpiFigure {
  key: string
  label: string
  value: string
  /** The secondary note under the value. */
  note: string
  tone: 'blue' | 'green' | 'amber' | 'red' | 'slate'
  /** Applied when the figure is pressed; `null` renders a non-interactive cell. */
  onSelect: (() => void) | null
  active: boolean
}

/**
 * The KPI strip: five figures above the band.
 *
 * @param stats the Host's counters (never recomputed here)
 * @param analysis the stage buckets, for the stage figure
 * @param blockedCount how many projects carry at least one blocker
 * @param total the unfiltered project count
 * @param activeStage the stage filter currently applied, or `null`
 * @param t the dictionary
 * @param onFilter apply a filter dimension (and clear it when equal)
 * @param onClearFilters reset every filter
 */
export function KpiStrip({ stats, analysis, blockedCount, total, activeStage, t, onFilter, onClearFilters }: {
  stats: Stats
  analysis: PortfolioAnalysis
  blockedCount: number
  total: number
  activeStage: string | null
  t: Translate
  onFilter(next: { stage: string | null }): void
  onClearFilters(): void
}): JSX.Element {
  const stageCounts = useMemo(() => {
    const next: Array<{ key: string; label: string; count: number }> = []
    for (const bucket of analysis.stages) {
      if (bucket.key === 'unknown' && bucket.count === 0) continue
      next.push({ key: bucket.key, label: stageLabel(t, bucket.key), count: bucket.count })
    }
    return next
  }, [analysis.stages, t])

  // The stage figure shows the funnel as one compact line rather than five cells:
  // five more KPI cells would make the strip a second band, and the band is
  // already below it.
  const stageSummary = stageCounts.map((bucket) => `${bucket.label} ${bucket.count}`).join(' · ')

  const figures: KpiFigure[] = [
    {
      key: 'total',
      label: t('kpiTotal'),
      value: String(stats.total),
      note: format(t('kpiAllNote'), { count: total }),
      tone: 'slate',
      // Not clickable: "all projects" cannot narrow anything.
      onSelect: null,
      active: false,
    },
    {
      key: 'active',
      label: t('kpiActive'),
      value: String(stats.inProgress),
      note: format(t('kpiBlockedNote'), { count: stats.inProgress }),
      tone: 'blue',
      onSelect: () => onClearFilters(),
      active: false,
    },
    {
      key: 'budget',
      label: t('kpiBudget'),
      value: formatWan(stats.amountTotalWan),
      note: t('statAmountUnit'),
      tone: 'amber',
      onSelect: null,
      active: false,
    },
    {
      key: 'blocked',
      label: t('kpiBlocked'),
      value: String(blockedCount),
      note: format(t('kpiBlockedNote'), { count: blockedCount }),
      tone: blockedCount > 0 ? 'red' : 'green',
      onSelect: () => onClearFilters(),
      active: false,
    },
    {
      key: 'g0',
      label: t('kpiG0Passed'),
      value: String(stats.g0Passed),
      note: format(t('kpiAllNote'), { count: stats.total }),
      tone: 'green',
      onSelect: () => onClearFilters(),
      active: false,
    },
  ]

  return (
    <section className="kpi-strip" aria-label={t('kpiTitle')}>
      <div className="kpi-cells">
        {figures.map((figure) => (
          <div key={figure.key} className="kpi-cell" data-tone={figure.tone} data-clickable={figure.onSelect !== null}>
            <span className="kpi-label">{figure.label}</span>
            <span className="kpi-value">{figure.value}</span>
            <span className="kpi-note">{figure.note}</span>
          </div>
        ))}
      </div>
      <div className="kpi-stages" role="group" aria-label={t('kpiStageBreakdown')}>
        <span className="kpi-stages-label">{t('kpiStageBreakdown')}</span>
        <div className="kpi-stage-chips">
          {stageCounts.map((bucket) => (
            <button
              key={bucket.key}
              type="button"
              className="kpi-stage-chip"
              data-active={activeStage === bucket.key}
              data-zero={bucket.count === 0}
              disabled={bucket.count === 0 && activeStage !== bucket.key}
              title={`${bucket.label} · ${bucket.count}`}
              onClick={() => onFilter({ stage: activeStage === bucket.key ? null : bucket.key })}
            >
              {bucket.label}
              <span className="kpi-stage-count">{bucket.count}</span>
            </button>
          ))}
        </div>
        <span className="kpi-stages-summary" aria-hidden="true">{stageSummary}</span>
      </div>
    </section>
  )
}

/** The three budget buckets, with their amounts and counts. */
interface BudgetSplit {
  approved: { count: number; amount: number }
  pending: { count: number; amount: number }
  unset: { count: number }
}

/**
 * Split the projects into the three budget buckets.
 *
 * The split reads `g0Passed` (the review verdict) rather than the stage, because
 * the question "is this money justified" is the gate-0 question, and a project
 * can sit at G2 with a review that never passed.
 */
function splitBudget(projects: ProjectSummary[]): BudgetSplit {
  const split: BudgetSplit = {
    approved: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
    unset: { count: 0 },
  }
  for (const project of projects) {
    if (project.amountWan === 0) {
      split.unset.count += 1
      continue
    }
    if (project.g0Passed) {
      split.approved.count += 1
      split.approved.amount += project.amountWan
    } else {
      split.pending.count += 1
      split.pending.amount += project.amountWan
    }
  }
  return split
}

/**
 * The budget panel: one definition, three buckets, then the org split.
 *
 * @param projects the CURRENTLY VISIBLE projects, so the panel follows the
 *        filters exactly like the band does
 * @param analysis the org breakdown for the same subset
 * @param t the dictionary
 */
export function BudgetPanel({ projects, analysis, t }: {
  projects: ProjectSummary[]
  analysis: PortfolioAnalysis
  t: Translate
}): JSX.Element {
  const split = useMemo(() => splitBudget(projects), [projects])
  const total = split.approved.amount + split.pending.amount

  // The segmented bar is the panel's one figure: three parts of the visible
  // total. Buckets with zero share are omitted rather than drawn at 1px, because
  // a hairline reads as "a little" when the truth is "none".
  const segments = [
    { key: 'approved', value: split.approved.amount, tone: 'green' as const, label: t('budgetApproved') },
    { key: 'pending', value: split.pending.amount, tone: 'amber' as const, label: t('budgetPending') },
  ].filter((segment) => segment.value > 0)

  const orgRows = analysis.orgs.slice(0, 5).map((row: OrgBucket) => ({
    key: `${row.system}\u0000${row.company}`,
    label: row.company === '' ? (row.system === '' ? t('dtUnset') : row.system) : row.company,
    ...(row.system === '' ? {} : { note: row.system }),
    value: row.amountWan,
  }))

  if (total === 0 && split.unset.count === 0) {
    return (
      <section className="budget-panel" aria-label={t('budgetTitle')}>
        <header className="budget-head">
          <h2 className="budget-title">{t('budgetTitle')}</h2>
        </header>
        <p className="budget-empty">{t('budgetEmpty')}</p>
      </section>
    )
  }

  return (
    <section className="budget-panel" aria-label={t('budgetTitle')}>
      <header className="budget-head">
        <h2 className="budget-title">{t('budgetTitle')}</h2>
        <span className="budget-note">{t('budgetNote')}</span>
      </header>

      <div className="budget-total">
        <span className="budget-total-label">{t('budgetTotal')}</span>
        <span className="budget-total-value">
          {formatWan(total)}
          <span className="budget-total-unit">{t('statAmountUnit')}</span>
        </span>
      </div>

      {segments.length === 0 ? null : (
        <div className="budget-bar" role="img" aria-label={segments.map((segment) => `${segment.label} ${formatWan(segment.value)}`).join(', ')}>
          {segments.map((segment) => (
            <span
              key={segment.key}
              className="budget-bar-segment"
              data-tone={segment.tone}
              style={{ width: `${total === 0 ? 0 : (segment.value / total) * 100}%` }}
            />
          ))}
        </div>
      )}

      <dl className="budget-rows">
        <div className="budget-row" data-tone="green">
          <dt className="budget-row-label">{t('budgetApproved')}</dt>
          <dd className="budget-row-value">{format(t('budgetApprovedNote'), { count: split.approved.count, amount: formatWan(split.approved.amount) })}</dd>
        </div>
        <div className="budget-row" data-tone="amber">
          <dt className="budget-row-label">{t('budgetPending')}</dt>
          <dd className="budget-row-value">{format(t('budgetPendingNote'), { count: split.pending.count, amount: formatWan(split.pending.amount) })}</dd>
        </div>
        <div className="budget-row" data-tone={split.unset.count > 0 ? 'red' : 'slate'}>
          <dt className="budget-row-label">{t('budgetUnset')}</dt>
          <dd className="budget-row-value">{format(t('budgetUnsetNote'), { count: split.unset.count })}</dd>
        </div>
      </dl>

      {split.unset.count > 0 ? (
        <p className="budget-warning" role="note">
          {format(t('budgetUnsetWarning'), { count: split.unset.count })}
        </p>
      ) : null}

      {orgRows.length === 0 ? null : (
        <div className="budget-orgs">
          <span className="budget-orgs-label">{t('budgetByOrg')}</span>
          {orgRows.map((row) => {
            const share = total === 0 ? 0 : row.value / total
            return (
              <div key={row.key} className="budget-org-row">
                <span className="budget-org-name">
                  {row.label}
                  {row.note === undefined ? null : <span className="budget-org-system">{row.note}</span>}
                </span>
                <InlineMeter value={row.value} max={total} tone="blue" />
                <span className="budget-org-value">{Math.round(share * 100)}%</span>
              </div>
            )
          })}
        </div>
      )}

      <p className="budget-concentration">
        {format(t('budgetConcentrationCopy'), { share: Math.round(analysis.concentration * 100) })}
      </p>
    </section>
  )
}

/**
 * The in-stage completion figure: how far each gate's projects actually are.
 *
 * The stage funnel alone cannot answer this on a ledger where every project sits
 * at G0, because six columns collapse into one. This figure adds the second
 * dimension the funnel lacks: within a stage bucket, how many projects have that
 * gate's own evidence recorded (`stageDone`, derived per gate by the Host).
 *
 * Reading it: the funnel says "30 at G0"; this says "0 of those 30 have a
 * complete G0". Together they describe a portfolio that has started but not
 * cleared its first gate — which the funnel alone cannot distinguish from a
 * healthy pipeline that happens to be early.
 */
export function StageProgressFigure({ analysis, projects, t }: {
  analysis: PortfolioAnalysis
  projects: ProjectSummary[]
  t: Translate
}): JSX.Element {
  const rows = useMemo(() => {
    return analysis.stages
      .filter((bucket: StageBucket) => bucket.key !== 'unknown')
      .map((bucket) => {
        const inBucket = projects.filter((project) => stageBucketKey(project) === bucket.key)
        const index = STAGES.indexOf(bucket.key as (typeof STAGES)[number])
        // `closed` and `unknown` have no gate of their own, so the "done" count
        // is not a gate verdict there; it is simply "all of them", which would
        // flatter the picture. They are therefore reported without progress.
        const done = index === -1
          ? inBucket.length
          : inBucket.filter((project) => project.stageDone[index] === true).length
        return {
          key: bucket.key,
          label: stageLabel(t, bucket.key),
          total: inBucket.length,
          done,
          hasGate: index !== -1,
        }
      })
  }, [analysis.stages, projects, t])

  return (
    <div className="stage-progress">
      {rows.map((row) => (
        <div key={row.key} className="stage-progress-row" data-empty={row.total === 0}>
          <span className="stage-progress-label">{row.label}</span>
          {row.total === 0 ? (
            <span className="stage-progress-empty">{t('stageNoData')}</span>
          ) : (
            <>
              <InlineMeter value={row.done} max={row.total} tone={row.done === row.total ? 'green' : 'blue'} />
              <span className="stage-progress-value">
                {row.hasGate ? format(t('stageProgressNote'), { done: row.done, total: row.total }) : `${row.total}`}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
