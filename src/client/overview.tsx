/**
 * The overview surface: portfolio band, three project views, and the pending rail.
 *
 * The overview is the answer to one question — "what should I look at next?" —
 * and the redesign's premise is that a table alone cannot answer it. So the
 * surface is layered:
 *
 * 1. **The portfolio band.** Six figures, each a chart, each answering a
 *    distribution question the list cannot: where the money sits by stage, which
 *    system carries it, what kinds of project exist, how concentrated the amount
 *    is, how much of the portfolio has each of the four dimensions, and which
 *    gap rules fire most. Every figure is a filter as well as a reading: clicking
 *    a segment narrows the list below it, which is why a chart and a filter are
 *    the same object here rather than two controls that can disagree.
 *
 * 2. **Three readings of one dataset.** Cards answer "what needs me"; the board
 *    answers "where is everything piled up"; the table answers "show me the
 *    numbers". They share one filtered, one sorted list from the shell, so a
 *    mode switch can never change what is visible — only how it is read.
 *
 * 3. **The pending rail.** Gaps grouped by rule, because twelve rules applied to
 *    twenty-three projects is a systemic pattern, not a to-do list; grouping by
 *    rule says "everyone is missing the decision chain", which a flat list of
 *    findings cannot.
 *
 * Nothing here draws its own SVG: every figure comes from `charts.tsx`, and
 * nothing here filters or sorts: the shell already did.
 */

import { useState } from 'react'
import type { AmountRow, DimensionKey, GapItem, OrgBucket, ProjectSummary, StageBucket, TypeBucket } from '../types.js'
import { DIMENSIONS, STAGES } from '../types.js'
import { RULE_META } from '../gap.js'
import {
  BarList,
  ColumnChart,
  Donut,
  InlineMeter,
  Legend,
  RadialMeter,
  StageRailMini,
  dimensionTone,
} from './charts.jsx'
import { format, type Translate } from './text.js'
import type { OverviewProps } from './view-contract.js'

/** The four dimension keys mapped onto their dictionary labels. */
const DIMENSION_TEXT: Record<DimensionKey, string> = {
  achievement: 'dimAchievement',
  evidence: 'dimEvidence',
  recognition: 'dimRecognition',
  nextMilestone: 'dimNextMilestone',
}

/** Format 万元 with thousands separators. */
function formatWan(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return rounded.toLocaleString('zh-CN', { maximumFractionDigits: 1 })
}

/** A `YYYY-MM-DD` date rendered for the active locale; anything else passes through. */
function formatDate(value: string | null, locale: string): string {
  if (value === null || value === '') return '—'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const stamp = new Date(`${value}T00:00:00`)
  if (Number.isNaN(stamp.getTime())) return value
  return stamp.toLocaleDateString(locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/** The stage bucket label, via the dictionary. */
function stageLabel(t: Translate, key: string): string {
  if (key === 'closed') return t('stageClosed')
  if (key === 'unknown') return t('stageUnknown')
  if ((STAGES as readonly string[]).includes(key)) return t(`stage${key}`)
  return key
}

/** The gap badge on a card: severity first, then the count, then nothing. */
function GapBadge({ project, t }: { project: ProjectSummary; t: Translate }): JSX.Element | null {
  if (project.gapCount === 0) return null
  if (project.highGapCount > 0) {
    return (
      <span className="pcard-badge" data-tone="red">
        {format(t('cardGapBadgeHigh'), { count: project.highGapCount })}
      </span>
    )
  }
  return (
    <span className="pcard-badge" data-tone="amber">
      {format(t('cardGapBadge'), { count: project.gapCount })}
    </span>
  )
}

/**
 * The four dimensions of one project, as four separate marks.
 *
 * The product invariant is that the four dimensions are never merged into a
 * single score; that rule survives the redesign, and this is where the card
 * honours it. Each mark is its own element with its own state.
 */
function DimensionMarks({ project, t }: { project: ProjectSummary; t: Translate }): JSX.Element {
  return (
    <div className="pcard-dims" role="group" aria-label={t('colDimensions')}>
      {DIMENSIONS.map((key) => {
        const present = project.dimensions[key]
        return (
          <span key={key} className="pcard-dim" data-present={present} title={`${t(DIMENSION_TEXT[key])}: ${present ? t('dimPresent') : t('dimMissing')}`}>
            <span className="pcard-dim-mark" aria-hidden="true">{present ? '✓' : '✗'}</span>
            <span className="pcard-dim-label">{t(DIMENSION_TEXT[key])}</span>
          </span>
        )
      })}
    </div>
  )
}

/** One project card: the default reading of the list. */
function ProjectCard({ project, selected, locale, t, onOpen }: { project: ProjectSummary; selected: boolean; locale: string; t: Translate; onOpen(pocId: string): void }): JSX.Element {
  return (
    <div
      className="pcard"
      role="button"
      tabIndex={0}
      data-selected={selected}
      data-closed={project.closed}
      onClick={() => onOpen(project.pocId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(project.pocId)
        }
      }}
    >
      <div className="pcard-head">
        <div className="pcard-title-block">
          <span className="pcard-name">{project.name}</span>
          <span className="pcard-id">{project.pocId}{project.owner === '' ? '' : ` · ${project.owner}`}</span>
        </div>
        <GapBadge project={project} t={t} />
      </div>

      <div className="pcard-stage">
        <span className="status-pill tone-blue pcard-stage-pill">
          <span className="status-dot" />
          {project.closed ? t('stageClosed') : project.stageLabel === '' ? t('stageUnknown') : project.stageLabel}
        </span>
        <StageRailMini
          done={project.stageDone}
          current={project.stage}
          closed={project.closed}
          ariaLabel={`${t('stageTrack')} · ${project.pocId}`}
        />
      </div>

      <div className="pcard-meta">
        <span className="pcard-org">{project.system === '' ? t('emptyField') : project.system} · {project.company === '' ? t('emptyField') : project.company}</span>
        <span className="pcard-amount">
          {project.amountWan === 0 ? '—' : formatWan(project.amountWan)}
          <span className="pcard-unit">{project.amountWan === 0 ? '' : t('statAmountUnit')}</span>
        </span>
      </div>

      <div className="pcard-progress">
        <span className="pcard-progress-label">{t('cardLatestProgress')}</span>
        {project.progressCount === 0 ? (
          <span className="pcard-progress-copy is-muted">{t('cardNoProgress')}</span>
        ) : (
          <span className="pcard-progress-copy">{project.lastProgressSummary === '' ? t('emptyField') : project.lastProgressSummary}</span>
        )}
        {project.progressCount === 0 ? null : (
          <span className="pcard-progress-meta">
            {formatDate(project.lastProgressDate, locale)} · {format(t('cardProgressCount'), { count: project.progressCount })}
          </span>
        )}
      </div>

      <DimensionMarks project={project} t={t} />

      <div className="pcard-foot">
        <span className="pcard-since">
          {project.daysInStage === null
            ? t('cardNoStageSince')
            : format(t('cardStageSince'), { days: project.daysInStage })}
        </span>
        <span className="pcard-open">{t('cardOpen')} →</span>
      </div>
    </div>
  )
}

/** The card view: a responsive grid of project cards. */
function ProjectCards({ projects, selectedId, locale, t, onOpen }: { projects: ProjectSummary[]; selectedId: string | null; locale: string; t: Translate; onOpen(pocId: string): void }): JSX.Element {
  return (
    <div className="pcard-grid">
      {projects.map((project) => (
        <ProjectCard
          key={project.pocId}
          project={project}
          selected={selectedId === project.pocId}
          locale={locale}
          t={t}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}

/** The stage buckets the board renders as columns, in funnel order. */
const BOARD_KEYS = ['G0', 'G1', 'G2', 'G3', 'G4', 'closed', 'unknown'] as const

/** One condensed card for the board view. */
function BoardCard({ project, t, onOpen }: { project: ProjectSummary; t: Translate; onOpen(pocId: string): void }): JSX.Element {
  return (
    <button type="button" className="pboard-card" data-high={project.highGapCount > 0} onClick={() => onOpen(project.pocId)}>
      <span className="pboard-card-name">{project.name}</span>
      <span className="pboard-card-meta">
        {project.amountWan === 0 ? '—' : `${formatWan(project.amountWan)} ${t('statAmountUnit')}`}
        {project.owner === '' ? null : <span className="pboard-card-owner"> · {project.owner}</span>}
      </span>
      {project.progressCount === 0 ? (
        <span className="pboard-card-progress is-muted">{t('cardNoProgress')}</span>
      ) : (
        <span className="pboard-card-progress">{project.lastProgressSummary === '' ? t('emptyField') : project.lastProgressSummary}</span>
      )}
      {project.highGapCount > 0 ? (
        <span className="pboard-card-gap" data-tone="red">{format(t('boardHighBadge'), { count: project.highGapCount })}</span>
      ) : null}
    </button>
  )
}

/**
 * The board view: one column per stage.
 *
 * The trailing "closed / unknown" columns only render when they hold a project:
 * a permanently empty column would be furniture, and the five gate columns are
 * the ones that describe the pipeline.
 */
function ProjectBoard({ projects, t, onOpen }: { projects: ProjectSummary[]; t: Translate; onOpen(pocId: string): void }): JSX.Element {
  const columns = BOARD_KEYS.map((key) => {
    const rows = projects.filter((project) => (project.closed ? 'closed' : project.stage ?? 'unknown') === key)
    return {
      key,
      label: stageLabel(t, key),
      rows,
      amount: rows.reduce((sum, project) => sum + project.amountWan, 0),
    }
  }).filter((column) => column.rows.length > 0 || (column.key !== 'closed' && column.key !== 'unknown'))
  const peak = columns.reduce((highest, column) => Math.max(highest, column.rows.length), 0)

  return (
    <div className="pboard">
      {columns.map((column) => (
        <section key={column.key} className="pboard-column" data-empty={column.rows.length === 0}>
          <header className="pboard-column-head">
            <span className="pboard-column-label">{column.label}</span>
            <span className="pboard-column-count">{format(t('boardColumnCount'), { count: column.rows.length, amount: formatWan(column.amount) })}</span>
            <InlineMeter value={column.rows.length} max={peak} tone={column.key === 'closed' || column.key === 'unknown' ? 'slate' : 'blue'} />
          </header>
          <div className="pboard-column-body">
            {column.rows.length === 0 ? (
              <div className="pboard-empty">{t('boardEmptyColumn')}</div>
            ) : (
              column.rows.map((project) => <BoardCard key={project.pocId} project={project} t={t} onOpen={onOpen} />)
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

/** One sortable column header. */
function SortableHead({
  label,
  active,
  asc,
  align,
  onClick,
  t,
}: {
  label: string
  active: boolean
  asc: boolean
  align?: 'right' | 'left'
  onClick(): void
  t: Translate
}): JSX.Element {
  return (
    <th style={align === undefined ? undefined : { textAlign: align }}>
      <button type="button" className="ptable-sort" data-active={active} title={t('tableSortByThis')} onClick={onClick}>
        {label}
        <span className="ptable-sort-arrow" aria-hidden="true">{active ? (asc ? '↑' : '↓') : ''}</span>
      </button>
    </th>
  )
}

/**
 * The table view: the spec's seven columns, upgraded.
 *
 * The seven columns are a product requirement, so they stay; what changed is
 * that the numbers became readable (an amount bar behind the figure), the headers
 * became sortable, and the header sticks while the list scrolls.
 */
function ProjectTable({ projects, selectedId, locale, t, sortKey, sortAsc, onSort, onOpen }: {
  projects: ProjectSummary[]
  selectedId: string | null
  locale: string
  t: Translate
  sortKey: string
  sortAsc: boolean
  onSort(key: 'stage' | 'amount' | 'progress'): void
  onOpen(pocId: string): void
}): JSX.Element {
  const peak = projects.reduce((highest, project) => Math.max(highest, project.amountWan), 0)
  return (
    <table className="project-table ptable">
      <thead className="table-head">
        <tr>
          <th style={{ width: '22%' }}>{t('colProject')}</th>
          <th style={{ width: '14%' }}>{t('colOrg')}</th>
          <SortableHead label={t('colStage')} active={sortKey === 'stage'} asc={sortAsc} onClick={() => onSort('stage')} t={t} />
          <SortableHead label={t('colAmount')} active={sortKey === 'amount'} asc={sortAsc} align="right" onClick={() => onSort('amount')} t={t} />
          <SortableHead label={t('colLatestProgress')} active={sortKey === 'progress'} asc={sortAsc} onClick={() => onSort('progress')} t={t} />
          <th style={{ width: '8%' }}>{t('colGaps')}</th>
          <th style={{ width: '10%', textAlign: 'right' }}>{t('colAction')}</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => {
          const level = project.highGapCount > 0 ? 'high' : project.gapCount > 0 ? 'medium' : 'none'
          return (
            <tr
              key={project.pocId}
              className="project-row"
              tabIndex={0}
              data-selected={selectedId === project.pocId}
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
                <span className="project-org">{project.system === '' ? t('emptyField') : project.system}</span>
                <span className="project-id">{project.company === '' ? t('emptyField') : project.company}</span>
              </td>
              <td>
                <div className="ptable-stage">
                  <span className="status-pill tone-blue">
                    <span className="status-dot" />
                    {project.closed ? t('stageClosed') : project.stageLabel === '' ? t('stageUnknown') : project.stageLabel}
                  </span>
                  <StageRailMini done={project.stageDone} current={project.stage} closed={project.closed} ariaLabel={`${t('stageTrack')} · ${project.pocId}`} />
                </div>
              </td>
              <td>
                <div className="ptable-amount">
                  <span className="amount-cell">{project.amountWan === 0 ? '—' : formatWan(project.amountWan)}</span>
                  <InlineMeter value={project.amountWan} max={peak} tone="amber" />
                </div>
              </td>
              <td>
                {project.progressCount === 0 ? (
                  <span className="project-meta is-muted">{t('cardNoProgress')}</span>
                ) : (
                  <>
                    <span className="progress-summary">{project.lastProgressSummary === '' ? t('emptyField') : project.lastProgressSummary}</span>
                    <span className="project-id">
                      {format(t('tableProgressCell'), { date: formatDate(project.lastProgressDate, locale), count: project.progressCount })}
                    </span>
                  </>
                )}
              </td>
              <td>
                <div className="gap-cell">
                  <span className="gap-count" data-level={level}>{project.gapCount === 0 ? '—' : project.gapCount}</span>
                  {project.highGapCount > 0 ? <span className="project-meta">{project.highGapCount}!</span> : null}
                </div>
              </td>
              <td>
                <div className="row-actions">
                  <button type="button" className="btn btn-small" onClick={(event) => { event.stopPropagation(); onOpen(project.pocId) }}>
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

/** One gap row inside a pending group. */
function PendingGap({ item, t, onOpen }: { item: GapItem; t: Translate; onOpen(pocId: string): void }): JSX.Element {
  return (
    <div className="pending-gap">
      <div className="pending-gap-copy">
        {format(t(`gap.${item.rule}.copy`), {
          ...(item.params ?? {}),
          // -1 is the Host's sentinel for "no timeline record at all", which is
          // not the same thing as "not refreshed yet".
          days: item.params?.days === -1 ? t('noTimeline') : String(item.params?.days ?? ''),
        })}
      </div>
      <div className="pending-gap-project">
        <button type="button" className="pending-link" onClick={() => onOpen(item.pocId)}>
          {item.pocName === '' ? item.pocId : `${item.pocName} · ${item.pocId}`}
        </button>
      </div>
    </div>
  )
}

/**
 * The pending rail, grouped by rule.
 *
 * Grouping is the point: twelve rules over many projects is a systemic pattern,
 * so the rail says "nine projects are missing the decision chain" rather than
 * repeating the same finding nine times. Groups collapse, and the collapse state
 * is local presentation state, not page state.
 */
function PendingRail({ gaps, t, onOpen }: { gaps: GapItem[]; t: Translate; onOpen(pocId: string): void }): JSX.Element {
  const groups = new Map<string, GapItem[]>()
  for (const item of gaps) {
    const existing = groups.get(item.rule)
    if (existing === undefined) groups.set(item.rule, [item])
    else existing.push(item)
  }
  const ordered = [...groups.entries()].sort((left, right) => {
    const leftMeta = RULE_META[left[0] as GapItem['rule']]
    const rightMeta = RULE_META[right[0] as GapItem['rule']]
    return rightMeta.priority - leftMeta.priority || leftMeta.no - rightMeta.no
  })

  return (
    <div className="pending">
      {ordered.map(([rule, items]) => {
        const meta = RULE_META[rule as GapItem['rule']]
        const visible = items.slice(0, 3)
        return (
          <section key={rule} className="pending-group" data-level={meta.level} aria-label={format(t(`gap.${rule}.title`), { ...(items[0]?.params ?? {}) })}>
            <header className="pending-group-head">
              <span className="pending-rule-no">R{meta.no}</span>
              <span className="pending-rule-title">{format(t(`gap.${rule}.title`), { ...(items[0]?.params ?? {}) })}</span>
              <span className="pending-rule-count">{format(t('pendingRuleCount'), { count: items.length })}</span>
            </header>
            <div className="pending-group-body">
              {visible.map((item, index) => (
                <PendingGap key={`${item.pocId}:${index}`} item={item} t={t} onOpen={onOpen} />
              ))}
              {items.length > visible.length ? (
                <div className="pending-more">{format(t('pendingMoreProjects'), { count: items.length - visible.length })}</div>
              ) : null}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/** The band: six figures, each a reading and a filter. */
function PortfolioBand({ props }: { props: OverviewProps }): JSX.Element {
  const { analysis, filters, t, onFilter, onOpen } = props
  const totalProjects = analysis.stages.reduce((sum, bucket) => sum + bucket.count, 0)
  const totalAmount = analysis.stages.reduce((sum, bucket) => sum + bucket.amountWan, 0)

  const stageColumns = analysis.stages
    .filter((bucket: StageBucket) => bucket.key !== 'unknown')
    .map((bucket) => ({
      key: bucket.key,
      label: stageLabel(t, bucket.key),
      value: bucket.count,
      secondary: bucket.amountWan,
      tone: bucket.highGapCount > 0 ? ('red' as const) : ('blue' as const),
      active: filters.stage === bucket.key,
    }))

  // Capped at four: the band answers "which system carries the money", and a
  // five-row list makes the row taller than every other figure beside it.
  const orgRows = analysis.orgs.slice(0, 3).map((row: OrgBucket) => ({
    key: `${row.system}\u0000${row.company}`,
    label: row.company === '' ? (row.system === '' ? t('dtUnset') : row.system) : row.company,
    ...(row.system === '' ? {} : { note: row.system }),
    value: row.amountWan,
    display: format(t('orgAmountLabel'), { amount: formatWan(row.amountWan) }),
    tone: row.highGapCount > 0 ? ('red' as const) : ('blue' as const),
  }))

  const typeSlices = analysis.types.map((row: TypeBucket) => ({
    key: row.pocType === '' ? '\u0000' : row.pocType,
    label: row.pocType === '' ? t('dtUnset') : row.pocType,
    value: row.count,
  }))

  const amountRows = analysis.topAmounts.map((row: AmountRow) => ({
    key: row.pocId,
    label: row.pocName === '' ? row.pocId : row.pocName,
    note: row.pocId,
    value: row.amountWan,
    display: format(t('amountShareLabel'), { share: Math.round(row.share * 100) }),
    tone: 'amber' as const,
  }))

  // A rule title carries placeholders (`{amountWan}`, `{days}`), so the band
  // interpolates them from a representative finding for that rule rather than
  // rendering the raw template. The count on the bar is the portfolio total; the
  // title describes the rule, which is what a legend is for.
  const representative = new Map<string, GapItem>()
  for (const item of props.gaps) {
    if (!representative.has(item.rule)) representative.set(item.rule, item)
  }
  // Capped at five: the band shows which rules are systemic, not the whole list.
  const gapRows = analysis.gapRules.slice(0, 4).map((row) => ({
    key: row.rule,
    label: `R${row.ruleNo} ${format(t(`gap.${row.rule}.title`), { ...(representative.get(row.rule)?.params ?? {}) })}`,
    value: row.count,
    display: format(t('gapRuleFiresLabel'), { count: row.count }),
    tone: row.level === 'high' ? ('red' as const) : ('amber' as const),
  }))

  // The band is context, so it must not own the first screen: it collapses to
  // its header in one click, and the state is remembered for this session only
  // (a persisted collapse would hide the portfolio from someone who forgot it).
  const [collapsed, setCollapsed] = useState(false)
  return (
    <section className="pf-band" data-collapsed={collapsed} aria-label={t('bandTitle')}>
      <header className="pf-band-head">
        <h2 className="pf-band-title">{t('bandTitle')}</h2>
        <span className="pf-band-note">{format(t('bandNote'), { count: totalProjects, amount: formatWan(totalAmount) })}</span>
        <button
          type="button"
          className="pf-collapse"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? `${t('pendingExpand')} ▾` : `${t('pendingCollapse')} ▴`}
        </button>
      </header>
      <div className="pf-grid">
        <div className="chart-block pf-block" data-span="4">
          <div className="chart-block-head">
            <h3 className="chart-block-title">{t('bandStages')}</h3>
            <span className="chart-block-note">{t('bandStagesNote')}</span>
          </div>
          <ColumnChart
            columns={stageColumns}
            ariaLabel={t('bandStages')}
            summary={analysis.stages.map((bucket) => `${stageLabel(t, bucket.key)} ${bucket.count}`).join(', ')}
            onSelect={(key) => onFilter({ stage: filters.stage === key ? null : key })}
            activeKey={filters.stage}
            height={72}
          />
          <Legend
            items={analysis.stages
              .filter((bucket) => bucket.count > 0)
              .map((bucket) => ({ key: bucket.key, label: stageLabel(t, bucket.key), tone: 'blue', value: format(t('stageAmountLabel'), { amount: formatWan(bucket.amountWan) }) }))}
          />
        </div><div className="chart-block pf-block" data-span="4">
          <div className="chart-block-head">
            <h3 className="chart-block-title">{t('bandDims')}</h3>
            <span className="chart-block-note">{t('bandDimsNote')}</span>
          </div>
          <div className="pf-radials">
            {analysis.dimensions.map((row) => (
              <RadialMeter
                key={row.key}
                ratio={row.ratio}
                label={t(DIMENSION_TEXT[row.key])}
                value={format(t('coveragePresent'), { present: row.present, total: row.present + row.missing })}
                {...(row.missing > 0 ? { note: format(t('coverageMissingNote'), { count: row.missing }) } : {})}
                tone={dimensionTone(row.key)}
                ariaLabel={`${t(DIMENSION_TEXT[row.key])} ${row.present}/${row.present + row.missing}`}
              />
            ))}
          </div>
        </div><div className="chart-block pf-block" data-span="2">
          <div className="chart-block-head">
            <h3 className="chart-block-title">{t('bandOrgs')}</h3>
            <span className="chart-block-note">{t('bandOrgsNote')}</span>
          </div>
          <BarList
            rows={orgRows}
            ariaLabel={t('bandOrgs')}
            summary={orgRows.map((row) => `${row.label} ${row.value}`).join(', ')}
            onSelect={(key) => {
              const [system = '', company = ''] = key.split('\u0000')
              onFilter({ system: system === '' ? null : system, company: company === '' ? null : company })
            }}
          />
        </div><div className="chart-block pf-block" data-span="2">
          <div className="chart-block-head">
            <h3 className="chart-block-title">{t('bandTypes')}</h3>
            <span className="chart-block-note">{t('bandTypesNote')}</span>
          </div>
          <Donut
            slices={typeSlices}
            ariaLabel={t('bandTypes')}
            summary={typeSlices.map((slice) => `${slice.label} ${slice.value}`).join(', ')}
            centerValue={String(totalProjects)}
            centerLabel={t('colProject')}
            onSelect={(key) => onFilter({ pocType: filters.pocType === key ? null : key === '\u0000' ? null : key })}
            activeKey={filters.pocType}
          />
        </div><div className="chart-block pf-block" data-span="2">
          <div className="chart-block-head">
            <h3 className="chart-block-title">{t('bandAmounts')}</h3>
            <span className="chart-block-note">{t('bandAmountsNote')}</span>
          </div>
          <BarList
            rows={amountRows}
            ariaLabel={t('bandAmounts')}
            summary={amountRows.map((row) => `${row.label} ${row.value}`).join(', ')}
            onSelect={(pocId) => onOpen(pocId)}
          />
          <p className="pf-note" data-tone={analysis.concentration > 0.33 ? 'amber' : 'muted'} title={analysis.concentration > 0.33 ? t('concentrationHigh') : t('concentrationNormal')}>
            {format(t('amountConcentrationLabel'), { share: Math.round(analysis.concentration * 100) })}
            {analysis.amountMissing > 0 ? ` · ${format(t('amountMissingLabel'), { count: analysis.amountMissing })}` : null}
          </p>
        </div><div className="chart-block pf-block" data-span="2">
          <div className="chart-block-head">
            <h3 className="chart-block-title">{t('bandGapRules')}</h3>
            <span className="chart-block-note">{format(t('bandGapRulesNote'), { count: props.gaps.length })}</span>
          </div>
          <BarList
            rows={gapRows}
            ariaLabel={t('bandGapRules')}
            summary={gapRows.map((row) => `${row.label} ${row.value}`).join(', ')}
          />
        </div>      </div>
    </section>
  )
}

/** The filtered-out state: the snapshot has projects, the filters hide them all. */
function FilteredEmpty({ t, onClearFilters }: { t: Translate; onClearFilters(): void }): JSX.Element {
  return (
    <div className="empty-state">
      <h2 className="empty-title">{t('filteredEmptyTitle')}</h2>
      <p className="empty-copy">{t('filteredEmptyCopy')}</p>
      <button type="button" className="btn" onClick={onClearFilters}>{t('filteredEmptyReset')}</button>
    </div>
  )
}

/** The overview: the band, the list in its current reading, and the pending rail. */
export function OverviewPage(props: OverviewProps): JSX.Element {
  const { projects, gaps, viewMode, selectedId, locale, t, filteredOut, onOpen, onClearFilters, onSort, sortKey, sortAsc } = props

  return (
    <>
      <PortfolioBand props={props} />
      <div className="workspace-grid">
        <div className="primary-column">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">{t('tableTitle')}</h2>
              <span className="panel-kicker">{projects.length}</span>
            </div>
            <div className="panel-body">
              {filteredOut ? (
                <FilteredEmpty t={t} onClearFilters={onClearFilters} />
              ) : viewMode === 'cards' ? (
                <ProjectCards projects={projects} selectedId={selectedId} locale={locale} t={t} onOpen={onOpen} />
              ) : viewMode === 'board' ? (
                <ProjectBoard projects={projects} t={t} onOpen={onOpen} />
              ) : (
                <ProjectTable
                  projects={projects}
                  selectedId={selectedId}
                  locale={locale}
                  t={t}
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={(key) => onSort(key as never)}
                  onOpen={onOpen}
                />
              )}
            </div>
          </div>
          {props.snapshot.warnings.length > 0 ? (
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">{t('warningsTitle')}</h2>
                <span className="panel-kicker">{props.snapshot.warnings.length}</span>
              </div>
              <div className="panel-body padded">
                {props.snapshot.warnings.map((warning) => (
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
              <span className="panel-kicker">{format(t('pendingCount'), { count: gaps.length })}</span>
            </div>
            <div className="panel-body">
              {gaps.length === 0 ? (
                <div className="panel-body padded">
                  <div className="empty-copy" style={{ margin: 0 }}>{filteredOut ? t('pendingEmptyFiltered') : t('pendingEmpty')}</div>
                </div>
              ) : (
                <PendingRail gaps={gaps} t={t} onOpen={onOpen} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/** The dimension keys, re-exported for the tests that assert the four-way split. */
export { DIMENSIONS }
