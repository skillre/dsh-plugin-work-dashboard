/**
 * The global timeline: every progress entry of every project, newest first.
 *
 * v3 is progress-centred: `progress[]` IS the history, so this view is the only
 * place that shows rhythm across the whole portfolio — who has gone quiet, when
 * did the team actually do things, and which entries produced evidence versus
 * only a conversation.
 *
 * Entries are ordered by date descending, with the project id as a stable
 * tiebreaker. Dates that do not parse are excluded from the range and the month
 * summary but still appear in the list, because dropping them would hide a
 * record the ledger actually contains.
 */

import { normalizeStage, numberOrNull, text } from './gap.js'
import type { GlobalTimeline, PocRecord, TimelineEntry } from './types.js'

/** `true` when a value is a real `YYYY-MM-DD` date. */
function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

/**
 * Build the global timeline from the loaded records.
 *
 * The silence threshold is expressed in days and matches the gap rule's own
 * default rather than inventing a second notion of "stale".
 */
export function buildGlobalTimeline(records: readonly PocRecord[], options: { stallDays: number }): GlobalTimeline {
  const entries: TimelineEntry[] = []
  const silentProjects: Array<{ pocId: string; pocName: string }> = []

  for (const record of records) {
    const pocId = text(record.poc_id)
    const pocName = text(record.name) === '' ? pocId : text(record.name)
    const { stage } = normalizeStage(record.stage)
    const progress = Array.isArray(record.progress) ? record.progress : []
    if (progress.length === 0) {
      silentProjects.push({ pocId, pocName })
      continue
    }
    for (const raw of progress) {
      const entry = (raw ?? {}) as Record<string, unknown>
      const evidence = Array.isArray(entry.evidence) ? entry.evidence : []
      const customer = (entry.customer ?? {}) as Record<string, unknown>
      const next = (entry.next ?? {}) as Record<string, unknown>
      const titles = evidence
        .map((item) => text((item as Record<string, unknown> | null | undefined)?.title))
        .filter((title) => title !== '')
      entries.push({
        pocId,
        pocName,
        stage,
        date: text(entry.date),
        seq: numberOrNull(entry.seq),
        type: text(entry.type),
        goal: text(entry.goal),
        actual: text(entry.actual),
        completion: text(entry.completion),
        evidence: titles.join(' · '),
        evidenceCount: evidence.length,
        customerFeedback: text(customer.feedback),
        recognition: text(customer.recognition),
        gate3_1: text(entry.gate3_1),
        gate3_2: text(entry.gate3_2),
        nextGoal: text(next.goal),
        nextOwner: text(next.owner),
        nextDeadline: text(next.deadline),
      })
    }
  }

  // Newest first; entries with an unparsable date sink below the dated ones but
  // keep a stable order among themselves.
  entries.sort((left, right) => {
    const leftDated = isDate(left.date)
    const rightDated = isDate(right.date)
    if (leftDated !== rightDated) return leftDated ? -1 : 1
    if (leftDated && rightDated && left.date !== right.date) return right.date.localeCompare(left.date)
    return left.pocId.localeCompare(right.pocId) || (left.seq ?? 0) - (right.seq ?? 0)
  })

  const dated = entries.filter((entry) => isDate(entry.date)).map((entry) => entry.date).sort()
  const range = dated.length === 0 ? null : { from: dated[0]!, to: dated[dated.length - 1]! }

  // One row per month that actually has activity, newest month first.
  const monthCounts = new Map<string, number>()
  for (const entry of entries) {
    if (!isDate(entry.date)) continue
    const month = entry.date.slice(0, 7)
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1)
  }
  const months = [...monthCounts.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((left, right) => right.month.localeCompare(left.month))

  void options.stallDays
  return { entries, range, months, silentProjects }
}
