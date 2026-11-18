/**
 * The rules and thresholds the ledger declares, parsed into typed constants.
 *
 * Why this file exists at all: the ledger's `config/rules.yaml` says, in as many
 * words, that "three copied rule lists drift; one does not". Those thresholds
 * decide what counts as a finding, and they belong to the data source, not to
 * this plugin. Hard-coding `300`, `2–3`, `3–5` and `45` here would make the plugin
 * and the ledger disagree the first time either one is tuned — and the plugin
 * would keep reporting findings the ledger no longer makes.
 *
 * Two versions are in play and they are NOT the same thing:
 *
 * - `schema_version` is the **shape** of the data (`schemas/enums.yaml`).
 * - `rulesVersion` here is the **judgement** applied to that shape.
 *
 * A project can be schema-current while its findings are computed by older rules.
 *
 * When the file is missing — an older cache, or a cache that has not been
 * refreshed since the ledger added `config/` — the built-in defaults below are
 * used and {@link RulesBundle.source} says so. Falling back silently would let a
 * stale cache look like a healthy one; the caller renders the difference.
 */

import YAML from 'yaml'
import type { GapRule } from './types.js'

/** Where the thresholds in force came from. */
export type RulesSource = 'ledger' | 'fallback'

/** Focus limits for a list field, as declared by the ledger. */
export interface RangeThreshold {
  min: number
  max: number
}

/** Every threshold `rules.yaml` publishes, with the built-in fallback applied. */
export interface RuleThresholds {
  /** Above this amount a cleared G0 is mandatory (R2). */
  largeAmountWan: number
  /** Success-criteria focus limit (R4). */
  criteria: RangeThreshold
  /** Scenario focus limit (R5). */
  scenarios: RangeThreshold
  /** Maximum tracked risks (R6). */
  risks: { max: number }
  /** Days in one stage before R12 reports a stall. */
  stallDays: number
}

/** Priority thresholds, kept because the board sorts by the derived value. */
export interface PriorityThresholds {
  strategicWan: number
  highWan: number
  strategicPocTypes: readonly string[]
}

/** One rule's presentation metadata. */
export interface RuleMeta {
  id: string
  name: string
  level: GapLevelLike
  priority: number
  guard: string | null
}

/** The three severities `rules.yaml` can express. */
export type GapLevelLike = 'high' | 'medium' | 'info'

/**
 * The rule ids this plugin implements, in schema order.
 *
 * Kept separate from the ledger's list on purpose: the ledger may add a rule the
 * plugin does not yet render, and that must not crash the scan. Anything in
 * `ledgerOrder` without an entry here is simply not evaluated.
 */
export const KNOWN_RULES: ReadonlyArray<GapRule> = Object.freeze([
  'R1-gate0-missing',
  'R2-large-amount-no-g0',
  'R3-g0-passed-no-plan',
  'R4-criteria-count',
  'R5-scenarios-count',
  'R6-risks-overflow',
  'R7-g2-not-ready',
  'R8-progress-no-evidence',
  'R9-evidence-no-recognition',
  'R10-g3-1-without-g3-2',
  'R11-no-next-milestone',
  'R12-stage-stalled',
  'R13-scenario-no-evidence',
  'R14-scenario-awaiting-customer',
  'R15-criteria-unverified',
  'R16-scenario-not-started',
])

/**
 * The ledger's rule numbers mapped onto this plugin's rule ids.
 *
 * The ledger numbers rules `R1..R16`; the plugin needs a stable identifier per
 * rule because the Client renders copy keyed on it. The mapping is the only place
 * the ledger's numbering enters the code.
 */
const LEDGER_NUMBER_TO_RULE: Record<string, GapRule> = {
  R1: 'R1-gate0-missing',
  R2: 'R2-large-amount-no-g0',
  R3: 'R3-g0-passed-no-plan',
  R4: 'R4-criteria-count',
  R5: 'R5-scenarios-count',
  R6: 'R6-risks-overflow',
  R7: 'R7-g2-not-ready',
  R8: 'R8-progress-no-evidence',
  R9: 'R9-evidence-no-recognition',
  R10: 'R10-g3-1-without-g3-2',
  R11: 'R11-no-next-milestone',
  R12: 'R12-stage-stalled',
  R13: 'R13-scenario-no-evidence',
  R14: 'R14-scenario-awaiting-customer',
  R15: 'R15-criteria-unverified',
  R16: 'R16-scenario-not-started',
}

/**
 * The built-in copy of `rules.yaml`, used when the cache has no `config/`.
 *
 * These are the values shipped with schema 3.1 / rules 3.2. They are a **fallback,
 * not the source of truth**: when the ledger's file is present it always wins.
 */
export const FALLBACK_THRESHOLDS: RuleThresholds = Object.freeze({
  largeAmountWan: 300,
  criteria: { min: 2, max: 3 },
  scenarios: { min: 3, max: 5 },
  risks: { max: 3 },
  stallDays: 45,
})

export const FALLBACK_PRIORITY: PriorityThresholds = Object.freeze({
  strategicWan: 1000,
  highWan: 300,
  strategicPocTypes: ['大体量项目'],
})

/** Fallback metadata, matching `rules.yaml` rules 1–16. */
export const FALLBACK_RULE_META: Record<string, RuleMeta> = Object.freeze({
  R1: { id: 'R1', name: 'G0 五必填缺失', level: 'high', priority: 90, guard: null },
  R2: { id: 'R2', name: '大金额未过 G0', level: 'high', priority: 94, guard: null },
  R3: { id: 'R3', name: 'G0 通过无计划', level: 'high', priority: 92, guard: null },
  R4: { id: 'R4', name: '成功标准不聚焦', level: 'medium', priority: 50, guard: null },
  R5: { id: 'R5', name: '场景不聚焦', level: 'medium', priority: 48, guard: null },
  R6: { id: 'R6', name: '风险超限', level: 'medium', priority: 46, guard: null },
  R7: { id: 'R7', name: 'G2 未就绪已开测', level: 'high', priority: 84, guard: null },
  R8: { id: 'R8', name: '进展无证据', level: 'high', priority: 82, guard: null },
  R9: { id: 'R9', name: '有证据无认可', level: 'high', priority: 80, guard: null },
  R10: { id: 'R10', name: 'G3-1 无 G3-2', level: 'high', priority: 78, guard: null },
  R11: { id: 'R11', name: '达成无下一步', level: 'high', priority: 96, guard: null },
  R12: { id: 'R12', name: '阶段停滞', level: 'medium', priority: 40, guard: null },
  R13: { id: 'R13', name: '场景无证据', level: 'high', priority: 88, guard: 'requires-progress' },
  R14: { id: 'R14', name: '场景待客户确认', level: 'info', priority: 30, guard: null },
  R15: { id: 'R15', name: '指标未验证', level: 'medium', priority: 44, guard: 'criteria-count-in-range' },
  R16: { id: 'R16', name: '场景未开始', level: 'medium', priority: 42, guard: 'scenarios-count-in-range-and-progress' },
})

/** Everything the scan needs from the ledger's declared rules. */
export interface RulesBundle {
  source: RulesSource
  /** `config/rules.yaml#version`, or empty when the file was absent. */
  rulesVersion: string
  thresholds: RuleThresholds
  priority: PriorityThresholds
  /** Metadata keyed by the ledger's rule id (`R1`..`R16`). */
  rules: Record<string, RuleMeta>
  /** Non-fatal problems met while reading the file, for the UI to surface. */
  warnings: string[]
}

/** The bundle used when no ledger file is readable. */
export function fallbackRules(warnings: string[] = []): RulesBundle {
  return {
    source: 'fallback',
    rulesVersion: '',
    thresholds: FALLBACK_THRESHOLDS,
    priority: FALLBACK_PRIORITY,
    rules: { ...FALLBACK_RULE_META },
    warnings,
  }
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function asRange(value: unknown, fallback: RangeThreshold): RangeThreshold {
  if (typeof value !== 'object' || value === null) return fallback
  const record = value as Record<string, unknown>
  const min = asNumber(record.min, fallback.min)
  const max = asNumber(record.max, fallback.max)
  // A crossed range would make every project fail R4/R5 forever. Refusing it is
  // safer than shipping a rule that can never be satisfied.
  if (min > max) return fallback
  return { min, max }
}

function asStringArray(value: unknown, fallback: readonly string[]): readonly string[] {
  if (!Array.isArray(value)) return fallback
  const items = value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter((item) => item !== '')
  return items.length === 0 ? fallback : items
}

/**
 * Parse `config/rules.yaml` into a {@link RulesBundle}.
 *
 * Returns the fallback bundle when the source is empty or unparsable, and records
 * why in `warnings` — an unreadable rules file is a degraded cache, not a reason
 * to refuse to scan.
 */
export function parseRules(source: string | null | undefined): RulesBundle {
  if (typeof source !== 'string' || source.trim() === '') {
    return fallbackRules(['config/rules.yaml 不可读，阈值回落到内置默认值'])
  }
  let document: unknown
  try {
    document = YAML.parse(source)
  } catch (error) {
    const detail = error instanceof Error ? error.message.split('\n')[0] : 'invalid YAML'
    return fallbackRules([`config/rules.yaml 解析失败（${detail}），阈值回落到内置默认值`])
  }
  if (typeof document !== 'object' || document === null) {
    return fallbackRules(['config/rules.yaml 不是 YAML 映射，阈值回落到内置默认值'])
  }
  const root = document as Record<string, unknown>
  const thresholdsRaw = (root.thresholds ?? {}) as Record<string, unknown>
  const priorityRaw = (root.priority ?? {}) as Record<string, unknown>

  const thresholds: RuleThresholds = {
    largeAmountWan: asNumber(thresholdsRaw.large_amount_wan, FALLBACK_THRESHOLDS.largeAmountWan),
    criteria: asRange(thresholdsRaw.criteria, FALLBACK_THRESHOLDS.criteria),
    scenarios: asRange(thresholdsRaw.scenarios, FALLBACK_THRESHOLDS.scenarios),
    risks: { max: asNumber((thresholdsRaw.risks as Record<string, unknown> | undefined)?.max, FALLBACK_THRESHOLDS.risks.max) },
    stallDays: asNumber(thresholdsRaw.stall_days, FALLBACK_THRESHOLDS.stallDays),
  }

  const priority: PriorityThresholds = {
    strategicWan: asNumber(priorityRaw.strategic_wan, FALLBACK_PRIORITY.strategicWan),
    highWan: asNumber(priorityRaw.high_wan, FALLBACK_PRIORITY.highWan),
    strategicPocTypes: asStringArray(priorityRaw.strategic_poc_types, FALLBACK_PRIORITY.strategicPocTypes),
  }

  const rules: Record<string, RuleMeta> = { ...FALLBACK_RULE_META }
  const warnings: string[] = []
  if (Array.isArray(root.rules)) {
    for (const entry of root.rules) {
      if (typeof entry !== 'object' || entry === null) continue
      const record = entry as Record<string, unknown>
      const id = typeof record.id === 'string' ? record.id.trim() : ''
      if (id === '') continue
      const fallback = FALLBACK_RULE_META[id]
      const level = record.level
      rules[id] = {
        id,
        name: typeof record.name === 'string' && record.name.trim() !== '' ? record.name.trim() : (fallback?.name ?? id),
        level: level === 'high' || level === 'medium' || level === 'info' ? level : (fallback?.level ?? 'medium'),
        priority: asNumber(record.priority, fallback?.priority ?? 50),
        guard: typeof record.guard === 'string' && record.guard.trim() !== '' ? record.guard.trim() : null,
      }
    }
  } else {
    warnings.push('config/rules.yaml 缺少 rules 列表，规则元数据回落到内置默认值')
  }

  return {
    source: 'ledger',
    rulesVersion: typeof root.version === 'string' ? root.version.trim() : '',
    thresholds,
    priority,
    rules,
    warnings,
  }
}

/** The plugin's rule id for a ledger rule number (`R13` → `R13-scenario-no-evidence`). */
export function ruleForLedgerId(ledgerId: string): GapRule | null {
  return LEDGER_NUMBER_TO_RULE[ledgerId] ?? null
}

/** Every rule id the ledger declares in `rules.yaml`, in file order. */
export function ledgerRuleIds(bundle: RulesBundle): string[] {
  return Object.keys(bundle.rules)
}
