import { describe, expect, it } from 'vitest'
import { daysSince, lastActivity, normalizeStage, readDimensions, scanGaps, text } from '../src/gap.js'
import type { PocRecord } from '../src/types.js'

/**
 * Gap-rule contract tests.
 *
 * Every one of the eight rules is pinned to a fixture that triggers it and to
 * the fixture state that must NOT trigger it. The rules are the product's
 * judgement, so a silent change here is a product change.
 */

const NOW = new Date('2026-11-05T00:00:00Z')
const OPTIONS = { now: NOW, staleDays: 30 }

/** A complete, healthy record: every rule must stay silent on it. */
const HEALTHY: PocRecord = {
  poc_id: 'POC-2026-001',
  name: 'Healthy pilot',
  type: 'customer-pilot',
  tier: 'strategic',
  stage: 'G2-方案验证',
  owner: '张三',
  sales_initiator: '李四',
  customer_tech_owner: '王工',
  why_customer_test: '合规改造',
  why_we_test: '区域标杆',
  next_action_goal: '完成灰度接入',
  gates: {
    G0: { complete: true, date: '2026-10-15' },
    G1: { complete: true, date: '2026-10-28', indicators_count: 3, scenarios_count: 4, risks_count: 2 },
    G2: { complete: false, date: null, prerequisites_ready: true, engineers_invested: true },
  },
  success_criteria: [
    { name: 'A', version: 'v1', metric: '99.5%' },
    { name: 'B', version: 'v1', metric: '95%' },
    { name: 'C', version: 'v1', metric: '100%' },
  ],
  success_scenarios: ['办公网', '出差', '第三方', '分支'],
  risks: [{ name: 'R1', level: 'high', mitigation: '预演' }, { name: 'R2', level: 'medium', mitigation: '同步' }],
  result: {
    achievement: '全部完成',
    evidence: '验收报告.pdf',
    recognition: '书面认可',
    next_milestone: '二期扩容',
  },
  timeline: [{ date: '2026-10-28', round: 2, goal: '方案设计', actual: '完成', evidence: '方案 v1.2', customer_feedback: '待评审', recognition_scope: '口头' }],
}

/** Rules a fixture triggers, by rule id. */
function rulesOf(record: PocRecord, options = OPTIONS): string[] {
  return scanGaps(record, options).map((item) => item.rule).sort()
}

describe('a healthy record', () => {
  it('trips no rule at all', () => {
    expect(rulesOf(HEALTHY)).toEqual([])
  })

  it('reports the four dimensions as present', () => {
    expect(readDimensions(HEALTHY)).toEqual({ achievement: true, evidence: true, recognition: true, nextMilestone: true })
  })
})

describe('rule 1 — the three G0 prerequisites', () => {
  it('reports each missing field separately, not one lumped finding', () => {
    const record: PocRecord = { ...HEALTHY, why_customer_test: null, why_we_test: '', customer_tech_owner: null }
    const gaps = scanGaps(record, OPTIONS)
    expect(gaps.map((item) => item.rule)).toEqual(['G0-why-customer', 'G0-why-we', 'G0-tech-owner'])
    // Each finding names the field, so the UI can point at the exact row.
    expect(gaps.map((item) => item.field)).toEqual(['why_customer_test', 'why_we_test', 'customer_tech_owner'])
    // Rule 1 is three findings but one rule number.
    expect(new Set(gaps.map((item) => item.ruleNo))).toEqual(new Set([1]))
    expect(gaps.every((item) => item.level === 'high')).toBe(true)
  })

  it('treats whitespace as missing', () => {
    expect(rulesOf({ ...HEALTHY, customer_tech_owner: '   ' })).toEqual(['G0-tech-owner'])
  })

  it('accepts any one of the fields being present independently', () => {
    expect(rulesOf({ ...HEALTHY, why_we_test: null })).toEqual(['G0-why-we'])
    expect(rulesOf({ ...HEALTHY, why_customer_test: null })).toEqual(['G0-why-customer'])
  })
})

describe('rule 2 — G1 focus overflow', () => {
  it('fires above 3 indicators', () => {
    const record: PocRecord = { ...HEALTHY, success_criteria: [...HEALTHY.success_criteria!, { name: 'D' }] }
    expect(rulesOf(record)).toEqual(['G1-focus-overflow'])
  })

  it('fires above 5 scenarios', () => {
    const record: PocRecord = { ...HEALTHY, success_scenarios: ['a', 'b', 'c', 'd', 'e', 'f'] }
    expect(rulesOf(record)).toEqual(['G1-focus-overflow'])
  })

  it('fires above 3 risks', () => {
    const record: PocRecord = { ...HEALTHY, risks: [...HEALTHY.risks!, { name: 'R3' }, { name: 'R4' }] }
    expect(rulesOf(record)).toEqual(['G1-focus-overflow'])
  })

  it('stays silent exactly at the limits', () => {
    expect(rulesOf({ ...HEALTHY, success_scenarios: ['a', 'b', 'c', 'd', 'e'] })).toEqual([])
    expect(rulesOf({ ...HEALTHY, risks: [...HEALTHY.risks!, { name: 'R3' }] })).toEqual([])
  })

  it('falls back to the recorded gate counters when the lists are absent', () => {
    const record: PocRecord = {
      ...HEALTHY,
      success_criteria: null,
      success_scenarios: null,
      risks: null,
      gates: { ...HEALTHY.gates, G1: { complete: true, indicators_count: 9, scenarios_count: 1, risks_count: 1 } },
    }
    expect(rulesOf(record)).toEqual(['G1-focus-overflow'])
  })

  it('carries the counts as params for the UI copy', () => {
    const gap = scanGaps({ ...HEALTHY, success_criteria: [...HEALTHY.success_criteria!, { name: 'D' }] }, OPTIONS)[0]
    expect(gap?.params).toMatchObject({ indicators: 4, scenarios: 4, risks: 2 })
  })
})

describe('rule 3 — engineers invested before prerequisites', () => {
  it('fires only when prerequisites are false AND engineers are invested', () => {
    const record: PocRecord = { ...HEALTHY, gates: { ...HEALTHY.gates, G2: { prerequisites_ready: false, engineers_invested: true } } }
    expect(rulesOf(record)).toEqual(['G2-prereq-invested'])
  })

  it('stays silent when prerequisites are ready', () => {
    const record: PocRecord = { ...HEALTHY, gates: { ...HEALTHY.gates, G2: { prerequisites_ready: true, engineers_invested: true } } }
    expect(rulesOf(record)).toEqual([])
  })

  it('stays silent when no engineers are invested', () => {
    const record: PocRecord = { ...HEALTHY, gates: { ...HEALTHY.gates, G2: { prerequisites_ready: false, engineers_invested: false } } }
    expect(rulesOf(record)).toEqual([])
  })
})

describe('rules 4 and 5 — evidence and recognition chains', () => {
  it('rule 4 fires when achievement exists without evidence', () => {
    const record: PocRecord = { ...HEALTHY, result: { achievement: '完成', evidence: null, recognition: '书面', next_milestone: '二期' } }
    expect(rulesOf(record)).toEqual(['G3-result-no-evidence'])
  })

  it('rule 5 fires when evidence exists without recognition', () => {
    const record: PocRecord = { ...HEALTHY, result: { achievement: '完成', evidence: '报告', recognition: null, next_milestone: '二期' } }
    expect(rulesOf(record)).toEqual(['G3-evidence-no-recognition'])
  })

  it('fires rule 4 alone when a result has neither evidence nor recognition', () => {
    // Rule 5 is a chain: it needs evidence to exist before a missing
    // recognition is a gap. With no evidence at all, rule 4 is the finding.
    const record: PocRecord = { ...HEALTHY, result: { achievement: '完成', evidence: null, recognition: null, next_milestone: '二期' } }
    expect(rulesOf(record)).toEqual(['G3-result-no-evidence'])
  })

  it('does not fire on evidence without any achievement', () => {
    const record: PocRecord = { ...HEALTHY, result: { achievement: null, evidence: '报告', recognition: null, next_milestone: null } }
    expect(rulesOf(record)).toEqual(['G3-evidence-no-recognition'])
  })
})

describe('rule 6 — a stale next action', () => {
  it('fires when the newest round is older than the threshold', () => {
    const record: PocRecord = { ...HEALTHY, timeline: [{ date: '2026-09-01', round: 1 }] }
    const gaps = scanGaps(record, OPTIONS)
    expect(gaps.map((item) => item.rule)).toEqual(['action-overdue'])
    expect(gaps[0]?.params).toMatchObject({ days: 65, staleDays: 30 })
  })

  it('fires when a next action exists with no timeline at all', () => {
    const record: PocRecord = { ...HEALTHY, timeline: [] }
    const gaps = scanGaps(record, OPTIONS)
    expect(gaps.map((item) => item.rule)).toEqual(['action-overdue'])
    // -1 is the "no activity recorded" sentinel the UI turns into words.
    expect(gaps[0]?.params).toMatchObject({ days: -1 })
  })

  it('stays silent on a fresh round, and on no next action at all', () => {
    expect(rulesOf({ ...HEALTHY, timeline: [{ date: '2026-11-01' }] })).toEqual([])
    expect(rulesOf({ ...HEALTHY, next_action_goal: null, timeline: [] })).toEqual([])
  })

  it('honours the configured threshold', () => {
    const record: PocRecord = { ...HEALTHY, timeline: [{ date: '2026-10-01' }] }
    expect(rulesOf(record, { now: NOW, staleDays: 30 })).toEqual(['action-overdue'])
    expect(rulesOf(record, { now: NOW, staleDays: 60 })).toEqual([])
  })
})

describe('rule 7 — achieved but no next milestone', () => {
  it('fires and sorts first: it is the highest-value gap', () => {
    const record: PocRecord = {
      ...HEALTHY,
      result: { achievement: '全部完成', evidence: '验收报告.pdf', recognition: '书面认可', next_milestone: null },
    }
    const gaps = scanGaps(record, OPTIONS)
    expect(gaps.map((item) => item.rule)).toEqual(['G4-no-next-milestone'])
    expect(gaps[0]?.priority).toBe(95)
  })

  it('stays silent without an achievement', () => {
    expect(rulesOf({ ...HEALTHY, result: { achievement: null, evidence: '报告', recognition: '书面', next_milestone: null } })).toEqual([])
  })
})

describe('rule 8 — closed with an open loop', () => {
  it('fires when any dimension is empty', () => {
    const record: PocRecord = {
      ...HEALTHY,
      stage: 'closed',
      result: { achievement: '完成', evidence: '报告', recognition: null, next_milestone: '二期' },
    }
    const gaps = scanGaps(record, OPTIONS)
    expect(gaps.map((item) => item.rule)).toContain('closed-not-closed-loop')
    expect(gaps.find((item) => item.rule === 'closed-not-closed-loop')?.params).toMatchObject({ missing: 'recognition' })
  })

  it('stays silent when closed with all four dimensions', () => {
    expect(rulesOf({ ...HEALTHY, stage: 'closed' })).toEqual([])
  })
})

describe('ordering and shape', () => {
  it('sorts the highest-value gap first across rules', () => {
    const record: PocRecord = {
      poc_id: 'POC-2026-002',
      name: 'Broken',
      stage: 'G4-结果转化',
      result: { achievement: '完成', evidence: null, recognition: null, next_milestone: null },
      timeline: [],
      next_action_goal: '推进',
    }
    const gaps = scanGaps(record, OPTIONS)
    expect(gaps[0]?.rule).toBe('G4-no-next-milestone')
    // Priority is strictly descending; ties break on the rule number.
    for (let index = 1; index < gaps.length; index += 1) {
      const previous = gaps[index - 1]!
      const current = gaps[index]!
      expect(previous.priority >= current.priority).toBe(true)
    }
  })

  it('stamps every finding with the project identity', () => {
    const gaps = scanGaps({ ...HEALTHY, poc_id: 'POC-X', name: 'X', why_customer_test: null }, OPTIONS)
    expect(gaps.every((item) => item.pocId === 'POC-X' && item.pocName === 'X')).toBe(true)
    expect(gaps.every((item) => item.ruleNo >= 1 && item.ruleNo <= 8)).toBe(true)
  })

  it('survives a record with almost nothing filled in', () => {
    const gaps = scanGaps({}, OPTIONS)
    // Only rule 1 can fire: no action, no achievement, no timeline, not closed.
    expect(gaps.map((item) => item.rule)).toEqual(['G0-why-customer', 'G0-why-we', 'G0-tech-owner'])
  })
})

describe('helpers', () => {
  it('normalizes the free-form stage string', () => {
    expect(normalizeStage('G2-方案验证')).toEqual({ stage: 'G2', closed: false })
    expect(normalizeStage('G0')).toEqual({ stage: 'G0', closed: false })
    expect(normalizeStage('closed')).toEqual({ stage: null, closed: true })
    expect(normalizeStage('CLOSED')).toEqual({ stage: null, closed: true })
    expect(normalizeStage('weird')).toEqual({ stage: null, closed: false })
    expect(normalizeStage(null)).toEqual({ stage: null, closed: false })
  })

  it('reads the newest timeline date and days since it', () => {
    const record: PocRecord = { timeline: [{ date: '2026-10-01' }, { date: '2026-10-20' }, { date: 'bad' }] }
    expect(lastActivity(record)).toBe('2026-10-20')
    expect(daysSince('2026-10-20', NOW)).toBe(16)
    expect(daysSince(null, NOW)).toBeNull()
    expect(lastActivity({})).toBeNull()
  })

  it('coerces scalars to trimmed text', () => {
    expect(text(null)).toBe('')
    expect(text('  x  ')).toBe('x')
    expect(text(3)).toBe('3')
    expect(text({})).toBe('')
  })
})
