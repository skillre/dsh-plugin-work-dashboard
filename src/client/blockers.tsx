/**
 * The blocker panel and the worklist: the two surfaces that turn "empty" into
 * "actionable".
 *
 * ## Why one module
 *
 * Both answer the same question — "what do I do about this project" — and both
 * exist because of the same measured problem: on the real ledger every one of
 * the thirty projects has zero progress entries, so the progress-centred views
 * render thirty identical empty states. A page that repeats "no progress yet"
 * thirty times has told the reader nothing; a page that says "twenty-nine
 * projects have no stage start date, fix it here" has.
 *
 * ## The blocker panel
 *
 * The five sources (`gap`, `stalled`, `missing-amount`, `no-progress`,
 * `no-stage-since`) are merged on the Host into ONE ordered list, because in
 * the reader's head they are one idea. This component groups them by project
 * rather than by source: "POC-002 has three problems" is more actionable than
 * "seventeen projects have no amount". Source chips at the top filter it, and
 * each chip carries its own count so a zero-count source can still be offered
 * honestly instead of vanishing.
 *
 * ## The worklist
 *
 * A worklist is not a summary of emptiness — it is a list of edits. Each row
 * names the field to fill in (`decision_chain`, `amount_wan`, …) and why it
 * matters. It reads the same `BlockerBoard` the panel does, narrowed to one
 * project, so a project's worklist and the portfolio panel can never disagree
 * about what is missing.
 *
 * Nothing here filters or sorts projects: the shell already did. Both
 * components take a project id set and render only rows inside it.
 */

import { useMemo, useState } from 'react'
import { BLOCKER_SOURCES } from '../types.js'
import type { BlockerBoard, BlockerRow, BlockerSource, Gate0CheckItem, ProjectDetail } from '../types.js'
import { RULE_META } from '../gap.js'
import { format, type Translate } from './text.js'

/** Source → dictionary key, in the order the chips are offered. */
const SOURCE_TEXT: Record<BlockerSource, string> = {
  gap: 'blockerSourceGap',
  stalled: 'blockerSourceStalled',
  'missing-amount': 'blockerSourceMissingAmount',
  'no-progress': 'blockerSourceNoProgress',
  'no-stage-since': 'blockerSourceNoStageSince',
}

/**
 * Chip order: the finding sources first, then the completeness ones.
 *
 * Severity is NOT the order here. The chips are a filter, so they follow how a
 * reader thinks about the data (content judgement, then data hygiene), not the
 * priority the rows sort by.
 */
const SOURCE_ORDER: readonly BlockerSource[] = [
  'gap',
  'stalled',
  'no-progress',
  'missing-amount',
  'no-stage-since',
]

/** The one-line explanation of a non-gap blocker. */
function sourceCopy(row: BlockerRow, t: Translate): string {
  switch (row.source) {
    case 'stalled':
      return format(t('blockerStalledCopy'), {
        days: String(row.params.days ?? ''),
        stallDays: String(row.params.stallDays ?? ''),
      })
    case 'missing-amount':
      return t('blockerMissingAmountCopy')
    case 'no-progress':
      return t('blockerNoProgressCopy')
    case 'no-stage-since':
      return t('blockerNoStageSinceCopy')
    case 'gap':
      return ''
  }
}

/** A short label for one row, used as the row's headline. */
function rowLabel(row: BlockerRow, t: Translate): string {
  if (row.source !== 'gap' || row.rule === null) return t(SOURCE_TEXT[row.source])
  const meta = RULE_META[row.rule]
  return `R${meta.no} ${format(t(`gap.${row.rule}.title`), { ...row.params })}`
}

/** A project plus its blockers, in row order. */
interface ProjectGroup {
  pocId: string
  pocName: string
  stageLabel: string
  rows: BlockerRow[]
  /**
   * The worst level in the group, for the group's colour.
   *
   * `info` is a real tier as of v3.1 (R14: proof exists, the customer has not
   * spoken yet). It must not promote to `medium`, or a normal waiting state would
   * paint like a missed-evidence finding.
   */
  level: GapLevelLike
}

/** The three severities a group can carry, worst first. */
type GapLevelLike = 'high' | 'medium' | 'info'

/** Rank a level so the worst one wins when groups merge. */
function levelRank(level: GapLevelLike): number {
  if (level === 'high') return 3
  if (level === 'medium') return 2
  return 1
}

/**
 * Group ordered rows by project, preserving the order of first appearance.
 *
 * Order is preserved rather than re-sorted: the Host already ranked the rows
 * globally, so the first project to appear owns the most urgent blocker and the
 * groups inherit that ranking for free.
 */
function groupByProject(rows: BlockerRow[]): ProjectGroup[] {
  const groups = new Map<string, ProjectGroup>()
  for (const row of rows) {
    const existing = groups.get(row.pocId)
    if (existing === undefined) {
      groups.set(row.pocId, {
        pocId: row.pocId,
        pocName: row.pocName,
        stageLabel: row.stageLabel,
        rows: [row],
        level: row.level,
      })
      continue
    }
    existing.rows.push(row)
    if (levelRank(row.level) > levelRank(existing.level)) existing.level = row.level
  }
  return [...groups.values()]
}

/**
 * The portfolio blocker panel.
 *
 * @param board the Host-merged list (unfiltered)
 * @param visibleIds the ids the shell's filters currently show, or `null` for
 *        "no filtering" — the panel narrows to these so a blocker never names a
 *        project that is not in the list below it
 * @param t the dictionary
 * @param onOpen open one project's detail page
 */
export function BlockerPanel({ board, visibleIds, t, onOpen }: {
  board: BlockerBoard
  visibleIds: ReadonlySet<string> | null
  t: Translate
  onOpen(pocId: string): void
}): JSX.Element {
  const [source, setSource] = useState<BlockerSource | null>(null)

  const scoped = useMemo(
    () => (visibleIds === null ? board.rows : board.rows.filter((row) => visibleIds.has(row.pocId))),
    [board.rows, visibleIds],
  )

  // Counts describe the scoped rows, not the portfolio: a chip that says "17"
  // while the list below shows 3 would be the exact disagreement this panel
  // exists to prevent.
  const counts = useMemo(() => {
    const next: Record<BlockerSource, number> = { gap: 0, stalled: 0, 'missing-amount': 0, 'no-progress': 0, 'no-stage-since': 0 }
    for (const row of scoped) next[row.source] += 1
    return next
  }, [scoped])

  const shown = source === null ? scoped : scoped.filter((row) => row.source === source)
  const groups = useMemo(() => groupByProject(shown), [shown])

  const chipEntries = SOURCE_ORDER.filter((key) => counts[key] > 0 || source === key)

  return (
    <div className="blockers">
      <div className="blocker-chips" role="group" aria-label={t('blockerTitle')}>
        <button
          type="button"
          className="blocker-chip"
          data-active={source === null}
          onClick={() => setSource(null)}
          title={t('blockerLegendHint')}
        >
          {t('blockerAll')}
          <span className="blocker-chip-count">{scoped.length}</span>
        </button>
        {chipEntries.map((key) => (
          <button
            key={key}
            type="button"
            className="blocker-chip"
            data-active={source === key}
            data-source={key}
            onClick={() => setSource(source === key ? null : key)}
            title={t('blockerLegendHint')}
          >
            {t(SOURCE_TEXT[key])}
            <span className="blocker-chip-count">{counts[key]}</span>
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="blocker-empty">{t('blockerEmptyFiltered')}</p>
      ) : (
        <div className="blocker-list">
          {groups.map((group) => (
            <section key={group.pocId} className="blocker-group" data-level={group.level}>
              <header className="blocker-group-head">
                <button type="button" className="blocker-project" onClick={() => onOpen(group.pocId)}>
                  {group.pocName === '' ? group.pocId : group.pocName}
                  <span className="blocker-project-id">{group.pocId}</span>
                </button>
                {group.stageLabel === '' ? null : <span className="blocker-stage">{group.stageLabel}</span>}
                <span className="blocker-group-count">{group.rows.length}</span>
              </header>
              <ul className="blocker-rows">
                {group.rows.map((row, index) => (
                  <li key={`${row.source}:${row.rule ?? index}`} className="blocker-row" data-source={row.source}>
                    <span className="blocker-row-headline">{rowLabel(row, t)}</span>
                    {row.source === 'gap' ? null : (
                      <span className="blocker-row-copy">{sourceCopy(row, t)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/** One row of a project's worklist. */
interface WorkItem {
  key: string
  label: string
  copy: string
  action: string
}

/** The G0 field → dictionary label, matching the detail page's own meter. */
const G0_WORK_LABEL: Record<string, string> = {
  why_customer: 'whyCustomerTest',
  why_us: 'whyWeTest',
  decision_chain: 'decisionChain',
  post_poc_decision: 'postPocDecision',
  tech_owner: 'customerTechOwner',
}

/**
 * A single project's worklist: exactly what to fill in next.
 *
 * Derived from the same `BlockerBoard` rows the portfolio panel shows, so the
 * two can never disagree, plus the G0 checklist (which names the field, where a
 * rule row only says "five requirements are missing").
 *
 * @param detail the project (for the G0 checklist and the plan/outcome shape)
 * @param rows this project's blocker rows
 */
export function Worklist({ detail, rows, t }: {
  detail: ProjectDetail
  /**
   * This project's blocker rows, or `null` when the caller has no board yet.
   *
   * The distinction matters: `[]` means "the board says nothing is missing",
   * which is a positive claim worth showing. `null` means "we have not loaded a
   * snapshot", and claiming completeness there would be a lie.
   */
  rows: BlockerRow[] | null
  t: Translate
}): JSX.Element {
  const items = useMemo<WorkItem[]>(() => {
    const next: WorkItem[] = []

    // G0: name the actual fields, in schema order. This is the most concrete
    // instruction the page can give, so it comes first.
    const missing = detail.gate0.checklist.filter((item: Gate0CheckItem) => !item.present)
    for (const [index, item] of missing.entries()) {
      const label = t(G0_WORK_LABEL[item.field] ?? item.field)
      next.push({
        key: `g0:${item.field}`,
        label: format(t('worklistG0Field'), { field: label }),
        // The count is a fact about the group, not about this row: repeating it
        // on all five lines turned the most actionable block on the page into a
        // wall of identical sentences. It is said once, on the first row.
        copy: index === 0 ? t('worklistG0Intro', { count: String(missing.length) }) : '',
        action: index === 0 ? t('worklistG0Hint') : '',
      })
    }

    const has = (source: BlockerSource): boolean => (rows ?? []).some((row) => row.source === source)

    if (has('missing-amount')) {
      next.push({
        key: 'amount',
        label: t('worklistMissingAmountAction'),
        copy: t('worklistMissingAmountIntro'),
        action: '',
      })
    }
    if (has('no-stage-since')) {
      next.push({
        key: 'stage-since',
        label: t('worklistMissingStageSinceAction'),
        copy: t('worklistMissingStageSinceIntro'),
        action: '',
      })
    }
    if (has('no-progress')) {
      next.push({
        key: 'progress',
        label: t('worklistNoProgressAction'),
        copy: t('worklistNoProgressIntro'),
        action: '',
      })
    }
    // A plan with no criteria cannot be accepted; the rule rows already say so,
    // but the worklist is where the reader looks for the next edit.
    if (detail.plan.criteria.length === 0) {
      next.push({
        key: 'plan',
        label: t('worklistNoPlanAction'),
        copy: t('worklistNoPlanIntro'),
        action: '',
      })
    }
    if (detail.outcome.overall === '' && detail.outcome.achievement === '') {
      next.push({
        key: 'outcome',
        label: t('worklistNoOutcomeAction'),
        copy: t('worklistNoOutcomeIntro'),
        action: '',
      })
    }
    return next
  }, [detail, rows, t])

  if (items.length === 0) {
    return (
      <div className="worklist" data-empty="true">
        <p className="worklist-done">{t('worklistDone')}</p>
      </div>
    )
  }

  return (
    <div className="worklist">
      <ul className="worklist-items">
        {items.map((item) => (
          <li key={item.key} className="worklist-item">
            <span className="worklist-mark" aria-hidden="true">□</span>
            <span className="worklist-text">
              <span className="worklist-label">{item.label}</span>
              {item.copy === '' ? null : <span className="worklist-copy">{item.copy}</span>}
              {item.action === '' ? null : <span className="worklist-action">{item.action}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The five sources, re-exported so the shell can build its own labels. */
export { BLOCKER_SOURCES }
