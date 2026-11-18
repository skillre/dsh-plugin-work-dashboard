/**
 * The agent's conclusions (`signals/<poc_id>.yaml`) and the staleness limits
 * (`config/health.yaml`).
 *
 * ## Why this is a separate module from `rules.ts`
 *
 * The ledger draws a hard line between two kinds of machine output:
 *
 * - `projects/*.yaml` derived fields (`scenarios[].status`, …) are
 *   **deterministic calculations** over one record, written by `tools/derive.mjs`.
 *   CI rejects a stored value that disagrees with the script.
 * - `signals/*.yaml` are **judgements that need cross-record reasoning** ("can this
 *   upgrade?", "who should be chased?"). They are written only by the agent
 *   account, never by hand, and they are an opinion rather than a fact.
 *
 * Keeping them apart is the whole point of the directory: if the two were mixed,
 * a human edit could overwrite a machine conclusion and nobody could tell who
 * said what.
 *
 * ## The contract this module honours
 *
 * The ledger's `signals/README.md` states one rule for consumers: **degrade
 * gracefully on missing fields.** A signal is optional, its schema may evolve,
 * and most projects have none at all. So every field here is optional and every
 * parse failure becomes a warning — a bad signal must never blank out the page
 * that displays the human facts.
 */

import YAML from 'yaml'

/** What the agent concluded about a possible gate promotion. */
export interface GateUpgradeSignal {
  eligible: boolean
  from: string
  to: string
  missing: string[]
  basis: string[]
  note: string
}

/** The agent's health read for one project. */
export interface HealthSignal {
  /** `ok` | `warn` | `bad`; empty when the agent did not judge. */
  level: string
  /** Days since the newest progress round; `null` when there is no progress. */
  factsStaleDays: number | null
  /** Days since anybody looked at the plan or the G0 review. */
  judgmentStaleDays: number | null
  reasons: string[]
  nextAction: { text: string; owner: string; due: string }
}

/**
 * A signal risk's severity.
 *
 * Deliberately NOT `GapLevel`: a gap is a rule violation that the ledger defines,
 * while a signal risk is the agent's opinion. They share the word "level" and
 * nothing else — `info` would be meaningless here, and `low` would be meaningless
 * there. Reusing one type would force a cast and hide exactly the mismatch this
 * distinction exists to keep visible.
 */
export type SignalRiskLevel = 'high' | 'medium' | 'low'

/** One risk the agent raised, distinct from the human `plan.risks[]`. */
export interface SignalRisk {
  id: string
  level: SignalRiskLevel
  text: string
  source: string
}

/** One project's machine judgement. */
export interface ProjectSignal {
  pocId: string
  schemaVersion: string
  generatedAt: string
  generatedBy: string
  rulesVersion: string
  /** The `projects/` blob sha the judgement was computed from. */
  projectSha: string
  gateUpgrade: GateUpgradeSignal | null
  health: HealthSignal | null
  risks: SignalRisk[]
}

/** Every signal in the cache, plus the problems met while reading them. */
export interface SignalBundle {
  /** Whether the cache carries a `signals/` directory at all. */
  present: boolean
  byPocId: Map<string, ProjectSignal>
  warnings: string[]
}

function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(text).filter((item) => item !== '')
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/** A risk level the ledger can express, collapsed onto this plugin's three. */
function riskLevel(value: unknown): SignalRiskLevel {
  const raw = text(value).toLowerCase()
  if (raw === 'high') return 'high'
  if (raw === 'low') return 'low'
  if (raw === 'medium' || raw === 'mid') return 'medium'
  // An unknown level must not silently become `high`: that would promote a
  // machine opinion to the top of the board. `medium` keeps it visible without
  // letting a typo shout.
  return 'medium'
}

function parseGateUpgrade(value: unknown): GateUpgradeSignal | null {
  const record = asRecord(value)
  if (record === null) return null
  return {
    eligible: record.eligible === true,
    from: text(record.from),
    to: text(record.to),
    missing: stringList(record.missing),
    basis: stringList(record.basis),
    note: text(record.note),
  }
}

function parseHealth(value: unknown): HealthSignal | null {
  const record = asRecord(value)
  if (record === null) return null
  const action = asRecord(record.next_action)
  return {
    level: text(record.level),
    factsStaleDays: numberOrNull(record.facts_stale_days),
    judgmentStaleDays: numberOrNull(record.judgment_stale_days),
    reasons: stringList(record.reasons),
    nextAction: {
      text: text(action?.text),
      owner: text(action?.owner),
      due: text(action?.due),
    },
  }
}

function parseRisks(value: unknown): SignalRisk[] {
  if (!Array.isArray(value)) return []
  const risks: SignalRisk[] = []
  value.forEach((entry, index) => {
    const record = asRecord(entry)
    if (record === null) return
    const body = text(record.text)
    // A risk with no text says nothing; keeping it would render an empty row.
    if (body === '') return
    risks.push({
      id: text(record.id) || `signal-risk-${index + 1}`,
      level: riskLevel(record.level),
      text: body,
      source: text(record.source),
    })
  })
  return risks
}

/**
 * Parse one `signals/<poc_id>.yaml`.
 *
 * Returns `null` for a document that is not a mapping, so the caller records a
 * warning. Missing inner fields are normal and produce empty values.
 */
export function parseSignal(pocId: string, source: string): ProjectSignal | null {
  let document: unknown
  try {
    document = YAML.parse(source)
  } catch {
    return null
  }
  const record = asRecord(document)
  if (record === null) return null
  return {
    pocId: text(record.poc_id) || pocId,
    schemaVersion: text(record.schema_version),
    generatedAt: text(record.generated_at),
    generatedBy: text(record.generated_by),
    rulesVersion: text(record.rules_version),
    projectSha: text(asRecord(record.inputs)?.project_sha),
    gateUpgrade: parseGateUpgrade(record.gate_upgrade),
    health: parseHealth(record.health),
    risks: parseRisks(record.risks),
  }
}

/**
 * Parse the whole `signals/` directory.
 *
 * One unreadable signal is skipped with a warning, never escalated: the ledger's
 * consumer contract is explicit that a signal directory may be absent or partial.
 */
export function parseSignals(files: Map<string, string>): SignalBundle {
  const byPocId = new Map<string, ProjectSignal>()
  const warnings: string[] = []
  for (const [filePocId, source] of files) {
    const parsed = parseSignal(filePocId, source)
    if (parsed === null) {
      warnings.push(`signals/${filePocId}.yaml: 不是可解析的 YAML 映射，已跳过`)
      continue
    }
    byPocId.set(parsed.pocId, parsed)
  }
  return { present: files.size > 0, byPocId, warnings }
}

/** The bundle used when the cache has no `signals/` directory. */
export function emptySignals(): SignalBundle {
  return { present: false, byPocId: new Map(), warnings: [] }
}

// ---------------------------------------------------------------------------
// config/health.yaml — the staleness limits
// ---------------------------------------------------------------------------

/** The two independent staleness notions the ledger defines. */
export interface HealthThresholds {
  stallDays: number
  /** Facts go stale when nothing has happened. */
  progressStaleDays: number
  changeStaleDays: number
  /** Judgment goes stale when nobody has looked. */
  g0ReviewStaleDays: number
  planStaleDays: number
  /** Which checks apply at each stage, as declared. */
  byStage: Record<string, string[]>
  source: 'ledger' | 'fallback'
  warnings: string[]
}

/**
 * Built-in copy of `config/health.yaml` at rules 3.2.
 *
 * A fallback, not the source of truth: when the file is readable it always wins.
 */
export const FALLBACK_HEALTH: Omit<HealthThresholds, 'source' | 'warnings'> = Object.freeze({
  stallDays: 45,
  progressStaleDays: 7,
  changeStaleDays: 14,
  g0ReviewStaleDays: 30,
  planStaleDays: 30,
  byStage: {
    G0: ['change_stale_days', 'g0_review_stale_days'],
    G1: ['change_stale_days', 'plan_stale_days'],
    G2: ['change_stale_days', 'progress_stale_days'],
    G3: ['change_stale_days', 'progress_stale_days'],
    G4: ['change_stale_days', 'progress_stale_days'],
    closed: ['change_stale_days'],
  },
})

function asNumber(value: unknown, fallback: number): number {
  const parsed = numberOrNull(value)
  return parsed === null ? fallback : parsed
}

/** Parse `config/health.yaml`, falling back to the built-in limits. */
export function parseHealthConfig(source: string | null | undefined): HealthThresholds {
  const fallback = (warnings: string[]): HealthThresholds => ({
    ...FALLBACK_HEALTH,
    source: 'fallback',
    warnings,
  })
  if (typeof source !== 'string' || source.trim() === '') {
    return fallback(['config/health.yaml 不可读，陈旧度阈值回落到内置默认值'])
  }
  let document: unknown
  try {
    document = YAML.parse(source)
  } catch (error) {
    const detail = error instanceof Error ? error.message.split('\n')[0] : 'invalid YAML'
    return fallback([`config/health.yaml 解析失败（${detail}），陈旧度阈值回落到内置默认值`])
  }
  const root = asRecord(document)
  if (root === null) return fallback(['config/health.yaml 不是 YAML 映射，陈旧度阈值回落到内置默认值'])

  const facts = asRecord(root.facts) ?? {}
  const judgment = asRecord(root.judgment) ?? {}
  const byStageRaw = asRecord(root.by_stage) ?? {}
  const byStage: Record<string, string[]> = { ...FALLBACK_HEALTH.byStage }
  for (const [stage, checks] of Object.entries(byStageRaw)) {
    const list = stringList(checks)
    if (list.length > 0) byStage[stage] = list
  }

  return {
    stallDays: asNumber(root.stall_days, FALLBACK_HEALTH.stallDays),
    progressStaleDays: asNumber(facts.progress_stale_days, FALLBACK_HEALTH.progressStaleDays),
    changeStaleDays: asNumber(facts.change_stale_days, FALLBACK_HEALTH.changeStaleDays),
    g0ReviewStaleDays: asNumber(judgment.g0_review_stale_days, FALLBACK_HEALTH.g0ReviewStaleDays),
    planStaleDays: asNumber(judgment.plan_stale_days, FALLBACK_HEALTH.planStaleDays),
    byStage,
    source: 'ledger',
    warnings: [],
  }
}
