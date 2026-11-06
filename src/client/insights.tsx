/**
 * The two aggregation surfaces: the risk board and the global timeline.
 *
 * Both answer a question the per-project views cannot, and they answer it in
 * different shapes on purpose:
 *
 * - **The risk board is a severity aggregation.** A flat list sorted by rank
 *   reads as "some risks"; stacked severity lanes read as "how much of the
 *   portfolio is on fire, and where". The distribution figure at the top is the
 *   same partition drawn as one bar, so the lanes and the figure can never
 *   disagree — both come from one `bucket()` pass over `board.rows`.
 * - **The timeline is a month aggregation.** A single stream sorted by date
 *   loses the rhythm of the work; grouping by month, with a divider per month
 *   and a monthly sparkline above it, makes "we did nothing in August" visible
 *   without reading every card.
 *
 * Both components are PURE. The shell loads the snapshot and hands the
 * aggregation in, so there is no `api` prop, no `useEffect`, no loading state,
 * and no second copy of the data that could drift from the one the shell
 * filtered. The shell mounts no page header for either surface but does hand in
 * `onBack`, so each page renders its own title block and one back control; a
 * second copy of the frame is not rendered, only the missing part of it.
 *
 * Interactive rows use a stretched link rather than a nested control. A whole
 * risk row opens its project, but the spec's project reference is itself a
 * `<button>` and a `<button>` may not contain another one. So the project
 * button is the row's only control and its `::after` overlay covers the row:
 * clicking anywhere opens the project, the tab order stays one stop per row,
 * and the markup remains legal. The timeline card is *not* a button — its
 * header carries one project link button — so the rest of the card stays
 * selectable text.
 *
 * Chart primitives are reused from `charts.tsx`; nothing here draws its own
 * SVG. `SeverityBar` carries the risk partition; `Sparkbars` (not
 * `ColumnChart`) carries the monthly counts: the series is a count per month
 * with many narrow buckets and no second variable, which is exactly what a
 * compact spark bar is for, while `ColumnChart` is reserved for the stage
 * funnel where column height and tone encode two different things.
 */

import type { RiskRow, TimelineEntry } from '../types.js'
import type { RiskBoardProps, TimelineProps } from './view-contract.js'
import { BarList, InlineMeter, SeverityBar, Sparkbars } from './charts.jsx'
import { format } from './text.js'
import type { Translate } from './text.js'

/** The four judgement tones; a chart may only use these. */
type Tone = 'green' | 'amber' | 'red' | 'slate'

/** A severity swimlane. Anything the ledger did not grade falls into `unset`. */
type LaneKey = 'high' | 'medium' | 'low' | 'unset'

/** Lane order is also severity order: worst first, ungraded last. */
const LANE_ORDER: readonly LaneKey[] = ['high', 'medium', 'low', 'unset']

/** Lane key → dictionary key. `unset` is a lane, not a missing value. */
const LANE_TEXT: Record<LaneKey, string> = {
  high: 'riskHigh',
  medium: 'riskMedium',
  low: 'riskLow',
  unset: 'riskUnset',
}

/** Lane key → palette tone. */
const LANE_TONE: Record<LaneKey, Tone> = {
  high: 'red',
  medium: 'amber',
  low: 'green',
  unset: 'slate',
}

/**
 * Normalise a raw `RiskRow.level` onto a lane.
 *
 * `''` is the ledger's "not graded yet" and is *not* the same as "harmless",
 * so it keeps its own lane and its own (neutral) colour. Any unexpected level
 * also lands in `unset` rather than being dropped: a row that disappears
 * because of a typo in the ledger would be worse than a row in the wrong lane.
 */
function laneOf(level: string): LaneKey {
  if (level === 'high' || level === 'medium' || level === 'low') return level
  return 'unset'
}

/** `name · id`, or just the id when the ledger left the name blank. */
function projectLabel(name: string, pocId: string): string {
  return name === '' ? pocId : `${name} · ${pocId}`
}

/**
 * A `YYYY-MM-DD` date rendered for the active locale.
 *
 * The ledger stores calendar dates, not instants, so the string is parsed as
 * local midnight — `new Date('2026-11-01')` alone is UTC and would print the
 * previous day west of Greenwich.
 */
function formatDate(value: string, locale: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value === '' ? '—' : value
  const stamp = new Date(`${value}T00:00:00`)
  if (Number.isNaN(stamp.getTime())) return value
  return stamp.toLocaleDateString(locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Map a v3 recognition value onto a tone.
 *
 * The values are the ledger's own Chinese vocabulary (the data is authored in
 * Chinese regardless of UI locale), so this maps data, not copy.
 */
function recognitionTone(value: string): Tone {
  if (value === '认可') return 'green'
  if (value === '部分认可') return 'amber'
  if (value === '未认可') return 'red'
  return 'slate'
}

/** A severity pill: the one place a risk level becomes colour. */
function LevelPill({ level, t }: { level: string; t: Translate }): JSX.Element {
  if (level === 'high') return <span className="status-pill tone-red"><span className="status-dot" />{t('riskHigh')}</span>
  if (level === 'medium') return <span className="status-pill tone-amber"><span className="status-dot" />{t('riskMedium')}</span>
  if (level === 'low') return <span className="status-pill tone-green"><span className="status-dot" />{t('riskLow')}</span>
  return <span className="status-pill tone-slate"><span className="status-dot" />{t('riskUnset')}</span>
}

/** How many risks one project carries, and how bad the worst of them is. */
interface ProjectTally {
  pocId: string
  pocName: string
  count: number
  /** High-severity count, surfaced in the concentration note. */
  high: number
  tone: Tone
}

/** The risk board: severity distribution, then one lane per severity. */
export function RiskBoardPage(props: RiskBoardProps): JSX.Element {
  const { board, t, onOpenProject } = props

  // One pass over the rows builds both the lanes and the figure. Deriving the
  // partition here (instead of reading `board.counts` for the figure and the
  // rows for the lanes) means the picture and the list are guaranteed to be the
  // same partition, which is the only way two views of one dataset stay honest.
  const buckets: Record<LaneKey, RiskRow[]> = { high: [], medium: [], low: [], unset: [] }
  const tallies = new Map<string, ProjectTally>()
  for (const row of board.rows) {
    buckets[laneOf(row.level)].push(row)
    const existing = tallies.get(row.pocId)
    if (existing === undefined) {
      tallies.set(row.pocId, {
        pocId: row.pocId,
        pocName: row.pocName,
        count: 1,
        high: row.level === 'high' ? 1 : 0,
        tone: LANE_TONE[laneOf(row.level)],
      })
    } else {
      existing.count += 1
      // The project's own tone is its worst risk, not its latest one.
      if (row.level === 'high') {
        existing.high += 1
        existing.tone = 'red'
      } else if (row.level === 'medium' && existing.tone !== 'red') {
        existing.tone = 'amber'
      }
    }
  }

  const lanes = LANE_ORDER.map((key) => ({
    key,
    label: t(LANE_TEXT[key]),
    rows: buckets[key],
    count: buckets[key].length,
    tone: LANE_TONE[key],
  }))
  const hasRisks = board.rows.length > 0

  // The per-project summary is a concentration read, not a second risk list: it
  // is capped at the heaviest eight projects so the top of the page stays a
  // summary instead of becoming the page.
  const projectRows = [...tallies.values()]
    .sort((left, right) => right.count - left.count || left.pocName.localeCompare(right.pocName))
    .slice(0, 8)
    .map((tally) => ({
      key: tally.pocId,
      // The bar list already prints its own value column, so the label stays the
      // name and the id goes on the quieter second line instead of being repeated.
      label: tally.pocName === '' ? tally.pocId : tally.pocName,
      value: tally.count,
      display: String(tally.count),
      tone: tally.tone,
      note: tally.high === 0 ? tally.pocId : `${tally.pocId} · ${t('riskHigh')} ${tally.high}`,
    }))
  const projectPeak = projectRows.reduce((peak, row) => Math.max(peak, row.value), 0)

  // The caption and the figure's screen-reader summary are the same sentence
  // built once, so they cannot drift apart.
  const laneNote = format(t('riskLaneNote'), {
    high: buckets.high.length,
    medium: buckets.medium.length,
    low: buckets.low.length,
    unset: buckets.unset.length,
  })

  return (
    <section className="risk-board">
      {/* The shell mounts no page header for this surface, but it does hand in
          `onBack`, so the title and the way back live here. `Esc` reaches this
          button through the shell's key handler only on the detail page, so a
          real focusable control is the keyboard path. */}
      <header className="risk-head">
        <div className="risk-head-text">
          <h1 className="risk-head-title">{t('risksBoardTitle')}</h1>
          <p className="risk-head-subtitle">{t('risksSubtitle')}</p>
        </div>
        <button type="button" className="risk-back" onClick={props.onBack}>{t('back')}</button>
      </header>

      {hasRisks ? (
        <section className="risk-figure" aria-labelledby="risk-figure-title">
          <header className="risk-figure-head">
            <h2 className="risk-figure-title" id="risk-figure-title">{t('riskLaneTitle')}</h2>
            <span className="risk-figure-note">
              {format(t('riskBoardNote'), { count: board.rows.length, projects: board.projectsWithRisks })}
            </span>
          </header>
          <SeverityBar
            lanes={lanes.map((lane) => ({ key: lane.key, label: lane.label, value: lane.count, tone: lane.tone }))}
            ariaLabel={t('riskLaneTitle')}
            summary={laneNote}
          />
          <p className="risk-caption">{laneNote}</p>
        </section>
      ) : null}

      {hasRisks && projectRows.length > 1 ? (
        <section className="risk-projects" aria-labelledby="risk-projects-title">
          <header className="risk-figure-head">
            <h2 className="risk-figure-title" id="risk-projects-title">{t('riskSourceProject')}</h2>
            <span className="risk-figure-note">{format(t('riskProjects'), { withRisks: board.projectsWithRisks, total: board.projectsTotal })}</span>
          </header>
          <BarList
            rows={projectRows}
            ariaLabel={t('riskSourceProject')}
            summary={projectRows.map((row) => `${row.label} ${row.value}`).join(' · ')}
            max={projectPeak}
          />
        </section>
      ) : null}

      {hasRisks ? (
        <div className="risk-lanes">
          {lanes.map((lane) =>
            lane.count === 0 ? null : (
              <section key={lane.key} className="risk-lane" data-level={lane.key} aria-label={lane.label}>
                <header className="risk-lane-head">
                  <LevelPill level={lane.key} t={t} />
                  <span className="risk-lane-count">{lane.count}</span>
                  <span className="risk-lane-meter">
                    <InlineMeter value={lane.count} max={board.rows.length} tone={lane.tone} />
                  </span>
                  <span className="risk-lane-share">{Math.round((lane.count / board.rows.length) * 100)}%</span>
                </header>
                <ul className="risk-rows">
                  {lane.rows.map((row, index) => (
                    <li key={`${row.pocId}:${index}`} className="risk-row-item">
                      {/* Stretched link: the project button is the only
                          interactive element, and its overlay covers the whole
                          row, so clicking anywhere opens the project without
                          nesting a button inside a button. */}
                      <div className="risk-row" data-level={laneOf(row.level)}>
                        <span className="risk-row-main">
                          <span className="risk-name">{row.name === '' ? t('emptyField') : row.name}</span>
                          {row.mitigation === '' ? null : (
                            <span className="risk-mitigation">
                              <span className="risk-mitigation-label">{t('riskMitigation')}</span>
                              {row.mitigation}
                            </span>
                          )}
                        </span>
                        <span className="risk-row-side">
                          <button
                            type="button"
                            className="risk-project"
                            onClick={() => onOpenProject(row.pocId)}
                          >
                            {projectLabel(row.pocName, row.pocId)}
                            <span className="risk-project-arrow" aria-hidden="true">→</span>
                          </button>
                          {row.gapCount > 0 ? (
                            <span className="risk-gap">
                              {format(t('riskGapContext'), { count: row.gapCount, high: row.highGapCount })}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      ) : (
        <div className="risk-empty" role="status">
          <span className="risk-empty-mark" aria-hidden="true">—</span>
          <p className="risk-empty-copy">{t('riskNoRisks')}</p>
        </div>
      )}
    </section>
  )
}

/** One month of the stream, entries already newest-first. */
interface MonthGroup {
  month: string
  entries: TimelineEntry[]
}

/** `YYYY-MM` of a date string, or `''` when the ledger's value is not a date. */
function monthOf(date: string): string {
  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : ''
}

/**
 * Group the stream by month, newest month first and newest entry first inside
 * each month.
 *
 * The Host already sorts entries newest-first, so the sort here is a no-op for
 * well-formed data and only pins the order for a hand-edited ledger. Grouping
 * happens in one pass; month order is explicit rather than "first seen", so a
 * single out-of-order row cannot reorder the whole stream.
 */
function groupEntries(entries: TimelineEntry[]): MonthGroup[] {
  const byMonth = new Map<string, TimelineEntry[]>()
  for (const entry of entries) {
    const month = monthOf(entry.date)
    const bucket = byMonth.get(month)
    if (bucket === undefined) byMonth.set(month, [entry])
    else bucket.push(entry)
  }
  return [...byMonth.entries()]
    .sort((left, right) => {
      if (left[0] === '') return 1
      if (right[0] === '') return -1
      return right[0].localeCompare(left[0])
    })
    .map(([month, group]) => ({
      month,
      entries: [...group].sort((left, right) => right.date.localeCompare(left.date)),
    }))
}

/** One labelled line of a timeline card body. */
interface EntryField {
  key: string
  label: string
  value: string
  emphasis: 'muted' | 'strong' | 'normal' | 'missing'
}

/** One footer chip of a timeline card. */
interface EntryChip {
  key: string
  label?: string
  value: string
}

/** The global timeline: monthly distribution, silent projects, then the stream. */
export function TimelinePage(props: TimelineProps): JSX.Element {
  const { timeline, locale, t, onOpenProject } = props

  const groups = groupEntries(timeline.entries)
  const hasEntries = timeline.entries.length > 0

  // `timeline.months` is newest-first because it is a summary strip. The figure
  // is read left-to-right as time, so it is reversed once, here, and the caption
  // says which range the axis covers.
  const sparkPoints = [...timeline.months].reverse()
  const range = timeline.range === null
    ? null
    : format(t('timelineRange'), { from: formatDate(timeline.range.from, locale), to: formatDate(timeline.range.to, locale) })
  // The caption and the figure's screen-reader summary are one sentence built
  // once, so a reader who hears the summary and one who reads the caption get
  // the same numbers.
  const laneNote = format(t('tlLaneNote'), { count: timeline.entries.length })

  return (
    <section className="tl-page">
      {/* Same reason as the risk board: the shell supplies no header here, so
          the title, subtitle and back control are the surface's own. */}
      <header className="tl-head">
        <div className="tl-head-text">
          <h1 className="tl-head-title">{t('timelineTitle')}</h1>
          <p className="tl-head-subtitle">{t('timelineSubtitle')}</p>
        </div>
        <button type="button" className="tl-back" onClick={props.onBack}>{t('back')}</button>
      </header>

      {hasEntries ? (
        <section className="tl-figure" aria-labelledby="tl-figure-title">
          <header className="tl-figure-head">
            <h2 className="tl-figure-title" id="tl-figure-title">{t('tlLaneTitle')}</h2>
            <span className="tl-figure-note">{range === null ? laneNote : range}</span>
          </header>
          <Sparkbars
            points={sparkPoints.map((point) => ({ month: point.month, count: point.count }))}
            ariaLabel={t('tlLaneTitle')}
            summary={laneNote}
          />
          <p className="tl-caption">
            {range === null ? laneNote : `${laneNote} · ${range}`}
          </p>
        </section>
      ) : null}

      {timeline.silentProjects.length > 0 ? (
        <section className="tl-silent" aria-labelledby="tl-silent-title">
          <header className="tl-silent-head">
            <h2 className="tl-silent-title" id="tl-silent-title">{t('tlSilentTitle')}</h2>
            <span className="tl-silent-note">{format(t('tlSilentNote'), { count: timeline.silentProjects.length })}</span>
          </header>
          <div className="tl-silent-chips">
            {timeline.silentProjects.map((project) => (
              <button
                key={project.pocId}
                type="button"
                className="tl-chip-button"
                onClick={() => onOpenProject(project.pocId)}
              >
                {projectLabel(project.pocName, project.pocId)}
              </button>
            ))}
          </div>
          <p className="tl-silent-hint">{t('timelineSilentHint')}</p>
        </section>
      ) : null}

      {hasEntries ? (
        <div className="tl-stream">
          {groups.map((group) => (
            <section key={group.month === '' ? 'undated' : group.month} className="tl-month-group">
              <div className="tl-month">
                <span className="tl-month-label">{group.month === '' ? t('emptyField') : group.month}</span>
                <span className="tl-month-count">{format(t('timelineCount'), { count: group.entries.length })}</span>
                <span className="tl-month-rule" aria-hidden="true" />
              </div>
              <ul className="tl-entries">
                {group.entries.map((entry, index) => {
                  const fields: EntryField[] = [
                    {
                      key: 'goal',
                      label: t('tlEntryGoal'),
                      value: entry.goal === '' ? t('emptyField') : entry.goal,
                      emphasis: entry.goal === '' ? 'missing' : 'muted',
                    },
                    {
                      key: 'actual',
                      label: t('tlEntryActual'),
                      value: entry.actual === '' ? t('emptyField') : entry.actual,
                      emphasis: entry.actual === '' ? 'missing' : 'strong',
                    },
                    {
                      key: 'evidence',
                      label: t('tlEntryEvidence'),
                      value: entry.evidence === '' ? t('timelineNoEvidence') : entry.evidence,
                      emphasis: entry.evidence === '' ? 'missing' : 'normal',
                    },
                    {
                      key: 'customer',
                      label: t('tlEntryCustomer'),
                      value: entry.customerFeedback === '' ? t('timelineNoFeedback') : entry.customerFeedback,
                      emphasis: entry.customerFeedback === '' ? 'missing' : 'normal',
                    },
                  ]
                  const chips: EntryChip[] = []
                  if (entry.completion !== '') chips.push({ key: 'completion', label: t('completionLabel'), value: entry.completion })
                  if (entry.gate3_1 !== '') chips.push({ key: 'gate3-1', label: t('gate3_1Label'), value: entry.gate3_1 })
                  if (entry.gate3_2 !== '') chips.push({ key: 'gate3-2', label: t('gate3_2Label'), value: entry.gate3_2 })
                  // The next milestone belongs with the other forward-looking
                  // facts, not in the body: the body is what this round did.
                  if (entry.nextGoal !== '') chips.push({ key: 'next', label: t('tlEntryNext'), value: entry.nextGoal })
                  // No dictionary key exists for an owner or a deadline label; the
                  // `@` glyph and the date form carry that meaning on their own.
                  if (entry.nextOwner !== '') chips.push({ key: 'owner', value: `@${entry.nextOwner}` })
                  if (entry.nextDeadline !== '') chips.push({ key: 'deadline', value: formatDate(entry.nextDeadline, locale) })

                  return (
                    <li key={`${entry.pocId}:${entry.date}:${index}`} className="tl-entry">
                      <div className="tl-gutter" aria-hidden="true">
                        <span className="tl-node" data-tone={recognitionTone(entry.recognition)} />
                      </div>
                      <article className="tl-card">
                        <header className="tl-card-head">
                          <time className="tl-date" dateTime={entry.date}>{formatDate(entry.date, locale)}</time>
                          <span className="tl-type">{entry.type === '' ? t('roundUnnumbered') : entry.type}</span>
                          <button
                            type="button"
                            className="tl-project"
                            onClick={() => onOpenProject(entry.pocId)}
                          >
                            {projectLabel(entry.pocName, entry.pocId)}
                          </button>
                          {entry.recognition === '' ? null : (
                            <span className={`status-pill tone-${recognitionTone(entry.recognition)} tl-recog`}>
                              <span className="status-dot" />
                              {entry.recognition}
                            </span>
                          )}
                        </header>
                        <dl className="tl-fields">
                          {fields.map((field) => (
                            <div key={field.key} className="tl-field">
                              <dt className="tl-field-label">{field.label}</dt>
                              <dd className="tl-field-value" data-emphasis={field.emphasis}>{field.value}</dd>
                            </div>
                          ))}
                        </dl>
                        {chips.length === 0 ? null : (
                          <footer className="tl-chips">
                            {chips.map((chip) => (
                              <span key={chip.key} className="tl-chip">
                                {chip.label === undefined ? null : <span className="tl-chip-label">{chip.label}</span>}
                                {chip.value}
                              </span>
                            ))}
                          </footer>
                        )}
                      </article>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="tl-empty" role="status">
          <span className="tl-empty-mark" aria-hidden="true">—</span>
          <p className="tl-empty-copy">{t('timelineEmpty')}</p>
        </div>
      )}
    </section>
  )
}
