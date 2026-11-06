import { describe, expect, it } from 'vitest'
import { daysSince, lastProgressDate, normalizeStage, readDimensions, scanGaps, text } from '../src/gap.js'
import type { PocRecord } from '../src/types.js'

/**
 * The twelve v3 gap rules, one test per rule.
 *
 * Each rule is a total function of `(record, options)` with the clock injected,
 * so every case is a fixture plus a pinned `now`. A rule that fires on a healthy
 * project, or stays silent on a broken one, is a bug the acceptance list would
 * catch in production — these tests catch it here.
 */

const NOW = new Date('2026-11-06T00:00:00Z')
const OPTIONS = { now: NOW, stallDays: 45 }

/** A minimal record; each test overrides only what its rule reads. */
function record(overrides: Partial<PocRecord> = {}): PocRecord {
  return {
    poc_id: 'POC-001',
    name: '测试项目',
    org: { system: '人保体系', company: '人保财险' },
    amount_wan: 100,
    poc_type: 'SDL',
    stage: 'G0-立项',
    status: '进行中',
    gate0: { missing: [], complete: true, review: { conclusion: '通过' } },
    plan: {
      criteria: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
      scenarios: ['s1', 's2', 's3'],
      risks: [{ name: 'r1' }],
      gate2: { ready: 'Ready' },
    },
    progress: [],
    outcome: {},
    ...overrides,
  }
}

/** Collect the rule ids a record triggers. */
function rules(poc: PocRecord, options = OPTIONS): string[] {
  return scanGaps(poc, options).map((gap) => gap.rule)
}

describe('R1 — G0 required fields', () => {
  it('fires when gate0.missing is non-empty', () => {
    const poc = record({ gate0: { missing: ['decision_chain', 'post_poc_decision'], complete: false } })
    expect(rules(poc)).toContain('R1-gate0-missing')
    const gap = scanGaps(poc, OPTIONS).find((item) => item.rule === 'R1-gate0-missing')!
    expect(gap.level).toBe('high')
    expect(gap.params).toMatchObject({ count: 2, missing: 'decision_chain,post_poc_decision' })
  })

  it('stays silent when nothing is missing', () => {
    expect(rules(record())).not.toContain('R1-gate0-missing')
  })
})

describe('R2 — large amount without G0 clearance', () => {
  it('fires at 300万 and above when the conclusion is not 通过', () => {
    const poc = record({ amount_wan: 300, gate0: { missing: [], complete: false, review: { conclusion: '待评审' } } })
    expect(rules(poc)).toContain('R2-large-amount-no-g0')
  })

  it('fires when the conclusion is missing entirely', () => {
    const poc = record({ amount_wan: 1500, gate0: { missing: [], review: {} } })
    expect(rules(poc)).toContain('R2-large-amount-no-g0')
    expect(scanGaps(poc, OPTIONS).find((g) => g.rule === 'R2-large-amount-no-g0')?.params).toMatchObject({ conclusion: '未评审' })
  })

  it('stays silent below 300万 and when G0 passed', () => {
    expect(rules(record({ amount_wan: 299, gate0: { missing: [], review: {} } }))).not.toContain('R2-large-amount-no-g0')
    expect(rules(record({ amount_wan: 1500 }))).not.toContain('R2-large-amount-no-g0')
  })
})

describe('R3 — G0 passed but no success criteria', () => {
  it('fires when the gate passed and criteria is empty', () => {
    const poc = record({ plan: { criteria: [], scenarios: [], risks: [], gate2: { ready: 'Ready' } } })
    expect(rules(poc)).toContain('R3-g0-passed-no-plan')
  })

  it('stays silent when the gate has not passed', () => {
    const poc = record({
      gate0: { missing: [], review: { conclusion: '待评审' } },
      plan: { criteria: [], scenarios: [], risks: [], gate2: { ready: 'Ready' } },
    })
    expect(rules(poc)).not.toContain('R3-g0-passed-no-plan')
  })
})

describe('R4–R6 — focus limits', () => {
  it('R4 fires for 1 or 4+ criteria, silent for 2–3', () => {
    expect(rules(record({ plan: { criteria: [{ name: 'a' }], scenarios: ['s1', 's2', 's3'], risks: [] } }))).toContain('R4-criteria-count')
    expect(rules(record({ plan: { criteria: [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }], scenarios: ['s1', 's2', 's3'], risks: [] } }))).toContain('R4-criteria-count')
    expect(rules(record())).not.toContain('R4-criteria-count')
  })

  it('R5 fires for fewer than 3 or more than 5 scenarios', () => {
    expect(rules(record({ plan: { criteria: [{ name: 'a' }, { name: 'b' }], scenarios: ['s1'], risks: [] } }))).toContain('R5-scenarios-count')
    expect(rules(record({ plan: { criteria: [{ name: 'a' }, { name: 'b' }], scenarios: ['1', '2', '3', '4', '5', '6'], risks: [] } }))).toContain('R5-scenarios-count')
    expect(rules(record())).not.toContain('R5-scenarios-count')
  })

  it('R6 fires above three risks', () => {
    expect(rules(record({ plan: { criteria: [{ name: 'a' }, { name: 'b' }], scenarios: ['s1', 's2', 's3'], risks: [{}, {}, {}, {}] } }))).toContain('R6-risks-overflow')
    expect(rules(record())).not.toContain('R6-risks-overflow')
  })

  it('does not punish a project that has not planned yet', () => {
    // Empty lists mean "not planned", which R3 covers; R4–R6 must stay silent
    // or every brand-new project would show three focus gaps on day one.
    const poc = record({
      gate0: { missing: ['why_customer'], review: { conclusion: '待评审' } },
      plan: { criteria: [], scenarios: [], risks: [] },
    })
    expect(rules(poc)).not.toContain('R4-criteria-count')
    expect(rules(poc)).not.toContain('R5-scenarios-count')
    expect(rules(poc)).not.toContain('R6-risks-overflow')
  })
})

describe('R7 — progress while G2 is not ready', () => {
  it('fires when progress exists and gate2 is not Ready', () => {
    const poc = record({
      plan: { criteria: [{ name: 'a' }, { name: 'b' }], scenarios: ['s1', 's2', 's3'], risks: [], gate2: { ready: '未Ready' } },
      progress: [{ date: '2026-10-01', actual: '做了' }],
    })
    expect(rules(poc)).toContain('R7-g2-not-ready')
  })

  it('stays silent without progress, even when G2 is not ready', () => {
    const poc = record({
      plan: { criteria: [{ name: 'a' }, { name: 'b' }], scenarios: ['s1', 's2', 's3'], risks: [], gate2: { ready: '未Ready' } },
    })
    expect(rules(poc)).not.toContain('R7-g2-not-ready')
  })
})

describe('R8–R10 — the proof chain, judged by the newest entry', () => {
  it('R8 fires when the newest entry claims an actual result with no evidence', () => {
    const poc = record({ progress: [{ date: '2026-10-01', actual: '完成了', evidence: [] }] })
    expect(rules(poc)).toContain('R8-progress-no-evidence')
  })

  it('R9 fires when evidence exists but recognition is 未认可 or 待确认', () => {
    const poc = record({
      progress: [{ date: '2026-10-01', actual: '完成', evidence: [{ title: '报告' }], customer: { recognition: '待确认' } }],
    })
    expect(rules(poc)).toContain('R9-evidence-no-recognition')
  })

  it('R9 stays silent when the customer actually recognised it', () => {
    const poc = record({
      progress: [{ date: '2026-10-01', actual: '完成', evidence: [{ title: '报告' }], customer: { recognition: '认可' } }],
    })
    expect(rules(poc)).not.toContain('R9-evidence-no-recognition')
  })

  it('R10 fires when gate3_1 is 可证明 but gate3_2 is not 已确认', () => {
    const poc = record({ progress: [{ date: '2026-10-01', gate3_1: '可证明', gate3_2: '待确认' }] })
    expect(rules(poc)).toContain('R10-g3-1-without-g3-2')
  })

  it('R10 stays silent once the result is confirmed', () => {
    const poc = record({ progress: [{ date: '2026-10-01', gate3_1: '可证明', gate3_2: '已确认' }] })
    expect(rules(poc)).not.toContain('R10-g3-1-without-g3-2')
  })

  it('reads only the LAST entry, not an earlier one', () => {
    // An older entry with no evidence must not keep R8 firing after the team
    // added evidence in a later round.
    const poc = record({
      progress: [
        { date: '2026-09-01', actual: '做了', evidence: [] },
        { date: '2026-10-01', actual: '完成', evidence: [{ title: '报告' }], customer: { recognition: '认可' } },
      ],
    })
    expect(rules(poc)).not.toContain('R8-progress-no-evidence')
  })
})

describe('R11 — achieved without a next milestone', () => {
  it('fires when achievement is 达成 and business.milestone is empty', () => {
    const poc = record({ outcome: { achievement: '达成', business: { milestone: null } } })
    expect(rules(poc)).toContain('R11-no-next-milestone')
  })

  it('stays silent when a milestone exists or the result is not 达成', () => {
    expect(rules(record({ outcome: { achievement: '达成', business: { milestone: '立项' } } }))).not.toContain('R11-no-next-milestone')
    expect(rules(record({ outcome: { achievement: '部分达成', business: {} } }))).not.toContain('R11-no-next-milestone')
  })

  it('outranks every other rule, because value was created and none banked', () => {
    const poc = record({
      gate0: { missing: ['decision_chain'], review: {} },
      amount_wan: 1500,
      outcome: { achievement: '达成', business: {} },
    })
    const found = scanGaps(poc, OPTIONS)
    expect(found[0]?.rule).toBe('R11-no-next-milestone')
  })
})

describe('R12 — stage stalled', () => {
  it('fires when stage_since is older than the threshold', () => {
    // 2026-09-01 → 2026-11-06 is 66 days.
    const poc = record({ stage: 'G2-方案验证', stage_since: '2026-09-01' })
    expect(rules(poc)).toContain('R12-stage-stalled')
    expect(scanGaps(poc, OPTIONS).find((g) => g.rule === 'R12-stage-stalled')?.params).toMatchObject({ days: 66, stallDays: 45 })
  })

  it('stays silent inside the threshold and without stage_since', () => {
    expect(rules(record({ stage_since: '2026-10-20' }))).not.toContain('R12-stage-stalled')
    expect(rules(record({ stage_since: null }))).not.toContain('R12-stage-stalled')
  })
})

describe('severity and ordering', () => {
  it('marks every rule high or medium, never anything else', () => {
    const all = scanGaps(
      record({
        amount_wan: 1500,
        gate0: { missing: ['x'], review: {} },
        plan: { criteria: [], scenarios: [], risks: [] },
        progress: [{ date: '2026-10-01', actual: 'a', gate3_1: '可证明' }],
        outcome: { achievement: '达成', business: {} },
        stage_since: '2026-01-01',
      }),
      OPTIONS,
    )
    expect(all.every((gap) => gap.level === 'high' || gap.level === 'medium')).toBe(true)
  })

  it('sorts by priority then rule number, so the order is deterministic', () => {
    const found = scanGaps(record({ amount_wan: 1500, gate0: { missing: ['x'], review: {} } }), OPTIONS)
    for (let index = 1; index < found.length; index += 1) {
      const previous = found[index - 1]!
      const current = found[index]!
      expect(previous.priority).toBeGreaterThanOrEqual(current.priority)
      if (previous.priority === current.priority) expect(previous.ruleNo).toBeLessThan(current.ruleNo)
    }
  })

  it('numbers each rule 1-12 and reaches every rule with a matching record', () => {
    // One record cannot violate every rule at once (R3 needs an empty plan while
    // R4/R5 need a non-empty one), so each rule gets the fixture that triggers it.
    const cases: Array<[string, PocRecord]> = [
      ['R1-gate0-missing', record({ gate0: { missing: ['x'], review: {} } })],
      ['R2-large-amount-no-g0', record({ amount_wan: 1500, gate0: { missing: [], review: {} } })],
      ['R3-g0-passed-no-plan', record({ plan: { criteria: [], scenarios: [], risks: [], gate2: { ready: 'Ready' } } })],
      ['R4-criteria-count', record({ plan: { criteria: [{ name: 'a' }], scenarios: ['s1', 's2', 's3'], risks: [] } })],
      ['R5-scenarios-count', record({ plan: { criteria: [{ name: 'a' }, { name: 'b' }], scenarios: ['s1'], risks: [] } })],
      ['R6-risks-overflow', record({ plan: { criteria: [{ name: 'a' }, { name: 'b' }], scenarios: ['s1', 's2', 's3'], risks: [{}, {}, {}, {}] } })],
      ['R7-g2-not-ready', record({ plan: { criteria: [{ name: 'a' }, { name: 'b' }], scenarios: ['s1', 's2', 's3'], risks: [], gate2: { ready: '未Ready' } }, progress: [{ date: '2026-10-01', actual: 'a', evidence: [{ title: 'e' }], customer: { recognition: '认可' } }] })],
      ['R8-progress-no-evidence', record({ progress: [{ date: '2026-10-01', actual: 'a', evidence: [] }] })],
      ['R9-evidence-no-recognition', record({ progress: [{ date: '2026-10-01', actual: 'a', evidence: [{ title: 'e' }], customer: { recognition: '待确认' } }] })],
      ['R10-g3-1-without-g3-2', record({ progress: [{ date: '2026-10-01', gate3_1: '可证明', gate3_2: '待确认' }] })],
      ['R11-no-next-milestone', record({ outcome: { achievement: '达成', business: {} } })],
      ['R12-stage-stalled', record({ stage_since: '2026-01-01' })],
    ]
    const numbers = new Map<number, string>()
    for (const [rule, poc] of cases) {
      const found = scanGaps(poc, OPTIONS).find((gap) => gap.rule === rule)
      expect(found, `${rule} must be reachable`).toBeDefined()
      numbers.set(found!.ruleNo, rule)
    }
    expect(numbers.size).toBe(12)
    expect([...numbers.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })
})

describe('v3 helpers', () => {
  it('normalizes the stage strings the ledger actually uses', () => {
    expect(normalizeStage('G0-立项')).toEqual({ stage: 'G0', closed: false })
    expect(normalizeStage('G4-结果转化')).toEqual({ stage: 'G4', closed: false })
    expect(normalizeStage('closed')).toEqual({ stage: null, closed: true })
    expect(normalizeStage(null)).toEqual({ stage: null, closed: false })
    expect(normalizeStage('未知')).toEqual({ stage: null, closed: false })
  })

  it('reads the four dimensions from outcome, not from a result block', () => {
    expect(readDimensions(record({ outcome: {} }))).toEqual({
      achievement: false, evidence: false, recognition: false, nextMilestone: false,
    })
    expect(readDimensions(record({
      outcome: { achievement: '达成', customer_recognition: '认可', our_proof: '报告', business: { milestone: '立项' } },
    }))).toEqual({ achievement: true, evidence: true, recognition: true, nextMilestone: true })
  })

  it('counts evidence from the newest progress entry even when outcome is blank', () => {
    // A project that progressed but has not been summarised yet still has proof.
    const poc = record({ outcome: {}, progress: [{ date: '2026-10-01', evidence: [{ title: '报告' }] }] })
    expect(readDimensions(poc).evidence).toBe(true)
  })

  it('takes the newest progress date and tolerates malformed ones', () => {
    expect(lastProgressDate(record({ progress: [{ date: '2026-10-15' }, { date: '2026-11-01' }, { date: 'not-a-date' }] }))).toBe('2026-11-01')
    expect(lastProgressDate(record({ progress: [] }))).toBeNull()
  })

  it('measures whole days and refuses to guess from a bad date', () => {
    expect(daysSince('2026-10-20', NOW)).toBe(17)
    expect(daysSince('nope', NOW)).toBeNull()
    expect(daysSince(null, NOW)).toBeNull()
  })

  it('collapses absent scalars to the empty string', () => {
    expect(text(null)).toBe('')
    expect(text(undefined)).toBe('')
    expect(text('  x  ')).toBe('x')
    expect(text(0)).toBe('0')
    expect(text(false)).toBe('false')
  })
})
