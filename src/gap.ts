/**
 * The sixteen v3.1 gap rules, as pure functions.
 *
 * Every rule is a total function of `(record, options)` — no clock, no
 * filesystem, no locale — so `tests/gap.spec.ts` can pin each one to a fixture.
 *
 * Thresholds are NOT hard-coded here. They arrive through
 * {@link ScanOptions.rules}, parsed from the ledger's `config/rules.yaml`, because
 * the ledger treats that file as the single source ("three copied rule lists
 * drift; one does not"). A caller that omits `rules` gets the built-in fallback,
 * which is the same set of numbers but is labelled as a fallback in the UI.
 *
 * The v3 model is **progress-centred**: a project is judged by its latest
 * progress entry, not by a separately-maintained `result` block. Rules 8–10
 * therefore read the newest entry, and rule 7 compares "has any progress"
 * against the G2 readiness flag.
 *
 * Rules 13–16 are the v3.1 additions and read the ledger's **derived**
 * per-scenario and per-criterion state (`scenarios[].status`,
 * `criteria[].status`) rather than re-deriving it: the ledger's `derive.mjs` is
 * the only writer of those fields, and a second implementation here would
 * eventually disagree with CI.
 */

import type { GapItem, GapLevel, PocRecord, StageId } from './types.js'
import { FALLBACK_RULE_META, fallbackRules, type RuleThresholds, type RulesBundle } from './rules.js'

/** Stage prefixes a raw `stage` value can normalize to, in order. */
const STAGE_PREFIXES: ReadonlyArray<readonly [StageId, string]> = [
  ['G0', 'G0'],
  ['G1', 'G1'],
  ['G2', 'G2'],
  ['G3', 'G3'],
  ['G4', 'G4'],
]

/** Normalize the free-form `stage` string onto a stage id. */
export function normalizeStage(raw: unknown): { stage: StageId | null; closed: boolean } {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (value === '') return { stage: null, closed: false }
  if (value.toLowerCase() === 'closed') return { stage: null, closed: true }
  for (const [stage, prefix] of STAGE_PREFIXES) {
    if (value === prefix || value.startsWith(`${prefix}-`)) return { stage, closed: false }
  }
  return { stage: null, closed: false }
}

/** Trim a scalar to a string; absent, null and blank all collapse to `''`. */
export function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

/** `true` when a value carries no content at all. */
export function blank(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0
  return text(value) === ''
}

/** A numeric value, or `null` when absent or not a finite number. */
export function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/** Options the rule set needs from the caller, so it stays clock-free. */
export interface ScanOptions {
  /** Injected clock: the rules compare against it, tests pin it. */
  now: Date
  /** Days in one stage after which rule 12 fires. */
  stallDays: number
  /**
   * The thresholds and rule metadata in force.
   *
   * Omitted means "use the built-in fallback": the scan still runs, but the
   * caller should surface that its findings came from fallback numbers, not from
   * the ledger's `config/rules.yaml`.
   */
  rules?: RulesBundle
}

/** Rule metadata: number, severity and sort weight. */
export const RULE_META: Record<GapItem['rule'], { no: number; level: GapLevel; priority: number }> = {
  // R1: the G0 floor. Nothing downstream is trustworthy without it.
  'R1-gate0-missing': { no: 1, level: 'high', priority: 90 },
  // R2: a large commitment decided before the gate was cleared.
  'R2-large-amount-no-g0': { no: 2, level: 'high', priority: 94 },
  // R3: cleared the gate, then never wrote down what success means.
  'R3-g0-passed-no-plan': { no: 3, level: 'high', priority: 92 },
  // R4–R6: focus. A pilot measuring everything measures nothing.
  'R4-criteria-count': { no: 4, level: 'medium', priority: 50 },
  'R5-scenarios-count': { no: 5, level: 'medium', priority: 48 },
  'R6-risks-overflow': { no: 6, level: 'medium', priority: 46 },
  // R7: testing before the prerequisites are ready burns team time.
  'R7-g2-not-ready': { no: 7, level: 'high', priority: 84 },
  // R8–R10: the proof chain, read from the newest progress entry.
  'R8-progress-no-evidence': { no: 8, level: 'high', priority: 82 },
  'R9-evidence-no-recognition': { no: 9, level: 'high', priority: 80 },
  'R10-g3-1-without-g3-2': { no: 10, level: 'high', priority: 78 },
  // R11: it worked, and nothing followed. The highest-value gap, as the
  // original design documented: value was created and none of it was banked.
  'R11-no-next-milestone': { no: 11, level: 'high', priority: 96 },
  // R12: the project has not moved.
  'R12-stage-stalled': { no: 12, level: 'medium', priority: 40 },
  // R13–R16: the plan is the right shape but the work has not moved. A scenario
  // with no evidence behind it is the state-level twin of R8, per item instead
  // of per entry.
  'R13-scenario-no-evidence': { no: 13, level: 'high', priority: 88 },
  'R14-scenario-awaiting-customer': { no: 14, level: 'info', priority: 30 },
  'R15-criteria-unverified': { no: 15, level: 'medium', priority: 44 },
  'R16-scenario-not-started': { no: 16, level: 'medium', priority: 42 },
}

/** The thresholds in force, from the ledger bundle or the built-in fallback. */
function thresholdsOf(options: ScanOptions): RuleThresholds {
  return (options.rules ?? fallbackRules()).thresholds
}

/** Build one finding, stamping the rule metadata from {@link RULE_META}. */
function gap(poc: PocRecord, rule: GapItem['rule'], extra: Pick<GapItem, 'field' | 'params'> = {}): GapItem {
  const meta = RULE_META[rule]
  return {
    rule,
    ruleNo: meta.no,
    level: meta.level,
    priority: meta.priority,
    pocId: text(poc.poc_id),
    pocName: text(poc.name),
    ...extra,
  }
}

/** The four dimensions, resolved from the v3 `outcome` block. */
export function readDimensions(poc: PocRecord): {
  achievement: boolean
  evidence: boolean
  recognition: boolean
  nextMilestone: boolean
} {
  const outcome = poc.outcome ?? {}
  const progress = Array.isArray(poc.progress) ? poc.progress : []
  const last = progress.length === 0 ? null : progress[progress.length - 1]
  // `outcome` is mostly auto-derived from the last progress entry, so a project
  // that has progressed but not yet had its outcome summarised still counts:
  // evidence exists when either the outcome or the newest entry carries it.
  const lastEvidence = Array.isArray(last?.evidence) ? last!.evidence! : []
  return {
    achievement: !blank(outcome.achievement),
    evidence: !blank(outcome.our_proof) || lastEvidence.length > 0,
    recognition: !blank(outcome.customer_recognition),
    nextMilestone: !blank(outcome.business?.milestone),
  }
}

/** The newest progress entry, or `null`. */
export function latestProgress(poc: PocRecord): Record<string, unknown> | null {
  const progress = Array.isArray(poc.progress) ? poc.progress : []
  const last = progress.length === 0 ? null : progress[progress.length - 1]
  return (last ?? null) as Record<string, unknown> | null
}

/** The newest progress date, or `null`. */
export function lastProgressDate(poc: PocRecord): string | null {
  const progress = Array.isArray(poc.progress) ? poc.progress : []
  let newest: string | null = null
  for (const entry of progress) {
    const date = text(entry?.date)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    if (Number.isNaN(Date.parse(`${date}T00:00:00Z`))) continue
    if (newest === null || date > newest) newest = date
  }
  return newest
}

/** Whole days between a `YYYY-MM-DD` date and the scan clock. */
export function daysSince(date: string | null, now: Date): number | null {
  if (date === null) return null
  const stamp = Date.parse(`${date}T00:00:00Z`)
  if (Number.isNaN(stamp)) return null
  return Math.floor((now.getTime() - stamp) / 86_400_000)
}

/**
 * Scan one record and return every v3 gap it has.
 *
 * The returned list is ordered by severity then rule number; the overview page
 * concatenates the per-project lists and re-sorts, so order here only has to be
 * stable for tests.
 */
export function scanGaps(poc: PocRecord, options: ScanOptions): GapItem[] {
  const gaps: GapItem[] = []
  const thresholds = thresholdsOf(options)
  const gate0 = poc.gate0 ?? {}
  const plan = poc.plan ?? {}
  const outcome = poc.outcome ?? {}
  const amountWan = numberOrNull(poc.amount_wan) ?? 0
  const progress = Array.isArray(poc.progress) ? poc.progress : []
  const last = latestProgress(poc)

  // R1 — the five G0 prerequisites. `gate0.missing` is computed by the ledger and
  // was verified against actual field emptiness, so it is trusted as-is.
  const missing = Array.isArray(gate0.missing) ? gate0.missing.map(text).filter((item) => item !== '') : []
  if (missing.length > 0) {
    gaps.push(gap(poc, 'R1-gate0-missing', { field: 'gate0.missing', params: { count: missing.length, missing: missing.join(',') } }))
  }

  // R2 — a large commitment whose G0 was never cleared.
  const conclusion = text(gate0.review?.conclusion)
  if (amountWan >= thresholds.largeAmountWan && conclusion !== '通过') {
    gaps.push(gap(poc, 'R2-large-amount-no-g0', { field: 'gate0.review.conclusion', params: { amountWan, conclusion: conclusion === '' ? '未评审' : conclusion } }))
  }

  // R3 — cleared the gate but never defined success.
  if (conclusion === '通过' && (plan.criteria ?? []).length === 0) {
    gaps.push(gap(poc, 'R3-g0-passed-no-plan', { field: 'plan.criteria' }))
  }

  // R4–R6 — focus limits. Only fires when the list is non-empty, so a project
  // that has not planned yet is not punished twice (R3 covers that case).
  const criteria = (plan.criteria ?? []).length
  if (criteria > 0 && (criteria < thresholds.criteria.min || criteria > thresholds.criteria.max)) {
    gaps.push(gap(poc, 'R4-criteria-count', { field: 'plan.criteria', params: { count: criteria, min: thresholds.criteria.min, max: thresholds.criteria.max } }))
  }
  const scenarios = (plan.scenarios ?? []).length
  if (scenarios > 0 && (scenarios < thresholds.scenarios.min || scenarios > thresholds.scenarios.max)) {
    gaps.push(gap(poc, 'R5-scenarios-count', { field: 'plan.scenarios', params: { count: scenarios, min: thresholds.scenarios.min, max: thresholds.scenarios.max } }))
  }
  const risks = (plan.risks ?? []).length
  if (risks > thresholds.risks.max) {
    gaps.push(gap(poc, 'R6-risks-overflow', { field: 'plan.risks', params: { count: risks, max: thresholds.risks.max } }))
  }

  // R7 — testing started before G2 was ready.
  const ready = text(plan.gate2?.ready)
  if (progress.length > 0 && ready !== 'Ready') {
    gaps.push(gap(poc, 'R7-g2-not-ready', { field: 'plan.gate2.ready', params: { ready: ready === '' ? '未设置' : ready } }))
  }

  // R8–R10 — the proof chain, judged by the NEWEST progress entry only.
  if (last !== null) {
    const evidence = Array.isArray(last.evidence) ? last.evidence : []
    const actual = text(last.actual)
    const recognition = text((last.customer as Record<string, unknown> | null | undefined)?.recognition)
    // R8: a claimed result with nothing behind it.
    if (actual !== '' && evidence.length === 0) {
      gaps.push(gap(poc, 'R8-progress-no-evidence', { field: 'progress.evidence', params: { seq: numberOrNull(last.seq) ?? 0 } }))
    }
    // R9: evidence exists, but the customer has not confirmed it.
    if (evidence.length > 0 && (recognition === '未认可' || recognition === '待确认')) {
      gaps.push(gap(poc, 'R9-evidence-no-recognition', { field: 'progress.customer.recognition', params: { recognition } }))
    }
    // R10: provable, but never confirmed.
    if (text(last.gate3_1) === '可证明' && text(last.gate3_2) !== '已确认') {
      gaps.push(gap(poc, 'R10-g3-1-without-g3-2', { field: 'progress.gate3_2', params: { gate3_2: text(last.gate3_2) === '' ? '未填' : text(last.gate3_2) } }))
    }
  }

  // R11 — achieved, and no next milestone: value created, none banked.
  if (text(outcome.achievement) === '达成' && blank(outcome.business?.milestone)) {
    gaps.push(gap(poc, 'R11-no-next-milestone', { field: 'outcome.business.milestone' }))
  }

  // R12 — the project has not moved for `stallDays`.
  // The schema says `stage_since`; a project without it cannot be judged, so it
  // is not reported rather than assumed stale.
  const since = text(poc.stage_since)
  if (/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    const days = daysSince(since, options.now)
    if (days !== null && days > thresholds.stallDays) {
      gaps.push(gap(poc, 'R12-stage-stalled', { field: 'stage_since', params: { days, stage: text(poc.stage), stallDays: thresholds.stallDays } }))
    }
  }

  // R13–R16 — the v3.1 state rules. They read the ledger's DERIVED per-item
  // state, never a locally recomputed one: `tools/derive.mjs` is the only writer
  // of `scenarios[].status` / `criteria[].status`, and CI rejects a file whose
  // stored value disagrees with it. Re-deriving here would give this plugin a
  // second opinion that the ledger would then call wrong.
  const scenarioItems = Array.isArray(plan.scenarios) ? plan.scenarios : []
  const criteriaItems = Array.isArray(plan.criteria) ? plan.criteria : []
  const hasProgress = progress.length > 0

  // R13 — a scenario was claimed but nothing backs it. Guarded by
  // `requires-progress`: before any progress exists, "no evidence" is just the
  // project not having started, which is not a finding.
  const unproven = scenarioItems.filter((item) => text(item?.status) === '无证据')
  if (hasProgress && unproven.length > 0) {
    gaps.push(gap(poc, 'R13-scenario-no-evidence', {
      field: 'plan.scenarios',
      params: { count: unproven.length, scenarios: unproven.map((item) => text(item?.name) || text(item?.id)).filter((name) => name !== '').join(',') },
    }))
  }

  // R14 — proof exists and the customer has not spoken. `info`, not `medium`:
  // waiting on the customer is a status, not a fault of the project.
  const awaiting = scenarioItems.filter((item) => text(item?.status) === '待客户确认')
  if (awaiting.length > 0) {
    gaps.push(gap(poc, 'R14-scenario-awaiting-customer', {
      field: 'plan.scenarios',
      params: { count: awaiting.length, scenarios: awaiting.map((item) => text(item?.name) || text(item?.id)).filter((name) => name !== '').join(',') },
    }))
  }

  // R15 — the plan is the right SIZE but a criterion is unverified.
  // The guard is deliberate and comes from the ledger: R4 already reports a
  // plan of the wrong size, so firing R15 alongside it reports the same fact
  // twice and trains people to ignore the list. Fix the plan first.
  const criteriaInRange = criteria >= thresholds.criteria.min && criteria <= thresholds.criteria.max
  const unverified = criteriaItems.filter((item) => text(item?.status) === '未验证')
  if (criteriaInRange && unverified.length > 0) {
    gaps.push(gap(poc, 'R15-criteria-unverified', {
      field: 'plan.criteria',
      params: { count: unverified.length, criteria: unverified.map((item) => text(item?.name) || text(item?.id)).filter((name) => name !== '').join(',') },
    }))
  }

  // R16 — the plan is the right size, work has begun, and a scenario was never
  // reached. Same guard shape as R15, plus `requires-progress`.
  const scenariosInRange = scenarios >= thresholds.scenarios.min && scenarios <= thresholds.scenarios.max
  const notStarted = scenarioItems.filter((item) => text(item?.status) === '未开始')
  if (scenariosInRange && hasProgress && notStarted.length > 0) {
    gaps.push(gap(poc, 'R16-scenario-not-started', {
      field: 'plan.scenarios',
      params: { count: notStarted.length, scenarios: notStarted.map((item) => text(item?.name) || text(item?.id)).filter((name) => name !== '').join(',') },
    }))
  }

  return gaps.sort((left, right) => right.priority - left.priority || left.ruleNo - right.ruleNo || left.rule.localeCompare(right.rule))
}
