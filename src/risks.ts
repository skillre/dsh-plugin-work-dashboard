/**
 * The risk board: every project's risks, sorted by severity.
 *
 * The board answers a different question from the project table. The table says
 * "which project needs attention"; the board says "what could go wrong, and
 * where". It is built from the same records, so the two can never disagree.
 *
 * Severity ordering is deliberate: a `high` risk sorts above every `medium`,
 * and a blank level sorts LAST rather than first. An unset level is not a
 * statement that the risk is mild — it is a missing judgement, and putting it
 * at the top would bury the risks someone actually assessed as serious.
 */

import { normalizeStage, text } from './gap.js'
import type { PocRecord, RiskBoard, RiskRow } from './types.js'

/** Severity rank: higher sorts first. A blank level ranks below `low`. */
export function riskRank(level: string): number {
  switch (level.toLowerCase()) {
    case 'high':
      return 3
    case 'medium':
      return 2
    case 'low':
      return 1
    default:
      return 0
  }
}

/** Count how many high-severity gaps a project carries, for board context. */
function gapCounts(record: PocRecord): { total: number; high: number } {
  const result = record.result ?? {}
  const filled = (value: unknown): boolean => text(value) !== ''
  let total = 0
  let high = 0
  const push = (isHigh: boolean): void => {
    total += 1
    if (isHigh) high += 1
  }
  if (!filled(record.why_customer_test) || !filled(record.why_we_test) || !filled(record.customer_tech_owner)) push(true)
  if (filled(result.achievement) && !filled(result.evidence)) push(true)
  if (filled(result.evidence) && !filled(result.recognition)) push(true)
  if (filled(result.achievement) && !filled(result.next_milestone)) push(true)
  return { total, high }
}

/**
 * Build the board from the loaded records.
 *
 * Rows are ordered by severity, then by project id, then by the risk's own
 * order inside the record — a stable order that does not reshuffle between
 * refreshes.
 */
export function buildRiskBoard(records: readonly PocRecord[]): RiskBoard {
  const rows: RiskRow[] = []
  let projectsWithRisks = 0

  for (const record of records) {
    const pocId = text(record.poc_id)
    const pocName = text(record.name) === '' ? pocId : text(record.name)
    const { stage } = normalizeStage(record.stage)
    const risks = Array.isArray(record.risks) ? record.risks : []
    if (risks.length === 0) continue
    projectsWithRisks += 1
    const counts = gapCounts(record)
    for (const raw of risks) {
      const value = (raw ?? {}) as Record<string, unknown>
      const level = text(value.level).toLowerCase()
      rows.push({
        pocId,
        pocName,
        stage,
        level,
        rank: riskRank(level),
        name: text(value.name),
        mitigation: text(value.mitigation),
        gapCount: counts.total,
        highGapCount: counts.high,
      })
    }
  }

  rows.sort((left, right) => right.rank - left.rank || left.pocId.localeCompare(right.pocId) || left.name.localeCompare(right.name))

  const counts = { high: 0, medium: 0, low: 0, unset: 0, total: rows.length }
  for (const row of rows) {
    if (row.level === 'high') counts.high += 1
    else if (row.level === 'medium') counts.medium += 1
    else if (row.level === 'low') counts.low += 1
    else counts.unset += 1
  }

  return { rows, counts, projectsWithRisks, projectsTotal: records.length }
}
