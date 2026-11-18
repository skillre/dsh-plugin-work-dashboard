import { describe, expect, it } from 'vitest'
import { buildBlockerBoard, emptyBlockerBoard } from '../src/blockers.js'
import { scanGaps } from '../src/gap.js'
import type { PocRecord } from '../src/types.js'

/**
 * Blocker-board tests.
 *
 * The board's whole point is that it is a MERGE, so these pin the merge itself
 * rather than the individual rules (which `gap.spec.ts` already covers):
 *
 * 1. Every source contributes;
 * 2. no source double-counts a fact another source already reported;
 * 3. the gap rows agree exactly with `scanGaps` — if these two ever diverge, the
 *    panel and the list below it would contradict each other.
 */

const NOW = new Date('2026-11-06T00:00:00Z')
const OPTIONS = { now: NOW, stallDays: 45 }

/** A record with nothing wrong: complete G0, a plan, progress, an amount. */
const HEALTHY: PocRecord = {
  poc_id: 'POC-2026-001',
  name: '健康的项目',
  stage: 'G2-方案验证',
  stage_since: '2026-11-01',
  amount_wan: 500,
  gate0: { missing: [], complete: true, review: { conclusion: '通过' } },
  plan: {
    criteria: [{ name: 'a' }, { name: 'b' }],
    scenarios: [{ id: 'scn-01', name: 's1' }, { id: 'scn-02', name: 's2' }, { id: 'scn-03', name: 's3' }],
    risks: [],
    gate2: { ready: 'Ready' },
  },
  progress: [
    {
      seq: 1,
      date: '2026-11-01',
      actual: '完成验证',
      evidence: [{ title: '报告', link: 'https://example.com', type: '文档' }],
      customer: { recognition: '认可' },
    },
  ],
  outcome: { achievement: '达成', business: { milestone: '进入采购' } },
}

/** Build one record by overriding the healthy base. */
function record(overrides: Partial<PocRecord>): PocRecord {
  return { ...HEALTHY, ...overrides }
}

describe('an untouched record', () => {
  it('reports nothing', () => {
    const board = buildBlockerBoard([HEALTHY], OPTIONS)
    expect(board.rows).toEqual([])
    expect(board.projectsBlocked).toBe(0)
    expect(board.counts).toEqual({ gap: 0, stalled: 0, 'missing-amount': 0, 'no-progress': 0, 'no-stage-since': 0 })
  })
})

describe('the four completeness sources', () => {
  it('reports a missing amount', () => {
    const board = buildBlockerBoard([record({ amount_wan: 0 })], OPTIONS)
    const rows = board.rows.filter((row) => row.source === 'missing-amount')
    expect(rows.length).toBe(1)
    expect(rows[0]?.level).toBe('medium')
    // A non-gap row must not claim a rule number: the badge would lie.
    expect(rows[0]?.rule).toBeNull()
    expect(rows[0]?.ruleNo).toBe(0)
  })

  it('treats an absent amount the same as zero', () => {
    const board = buildBlockerBoard([record({ amount_wan: null })], OPTIONS)
    expect(board.counts['missing-amount']).toBe(1)
  })

  it('reports a project with no progress entries', () => {
    const board = buildBlockerBoard([record({ progress: [] })], OPTIONS)
    expect(board.counts['no-progress']).toBe(1)
  })

  it('reports a missing stage start date', () => {
    const board = buildBlockerBoard([record({ stage_since: null })], OPTIONS)
    expect(board.counts['no-stage-since']).toBe(1)
    expect(board.counts.stalled).toBe(0)
  })

  it('reports a stall, and lets R12 own it when R12 fires', () => {
    // `stage_since` far in the past makes R12 fire, and R12 already says
    // "stalled"; the `stalled` source therefore stays silent so the same fact
    // is not reported twice under two labels.
    const expired = record({ stage_since: '2026-01-01' })
    const board = buildBlockerBoard([expired], OPTIONS)
    expect(board.rows.some((row) => row.rule === 'R12-stage-stalled')).toBe(true)
    expect(board.counts.stalled).toBe(0)
    // Inside the threshold: the clock exists but has not expired.
    const fresh = record({ stage_since: '2026-10-20' })
    expect(buildBlockerBoard([fresh], OPTIONS).counts.stalled).toBe(0)
  })
})

describe('no double counting', () => {
  it('does not report a stall when R12 already reported it', () => {
    // R12 fires on exactly this shape, so the stalled source must stay silent
    // and the same fact must appear once, under its rule number.
    const board = buildBlockerBoard([record({ stage_since: '2026-01-01' })], OPTIONS)
    const r12 = board.rows.filter((row) => row.rule === 'R12-stage-stalled')
    expect(r12.length).toBe(1)
    expect(board.counts.stalled).toBe(0)
  })

  it('never emits two non-gap rows for the same project and source', () => {
    const board = buildBlockerBoard(
      [record({ poc_id: 'A', amount_wan: 0, progress: [], stage_since: null }), record({ poc_id: 'B', amount_wan: 0 })],
      OPTIONS,
    )
    const seen = new Set<string>()
    for (const row of board.rows) {
      if (row.source === 'gap') continue
      const key = `${row.pocId}:${row.source}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })

  it('counts a project once even when it has several blockers', () => {
    const board = buildBlockerBoard([record({ amount_wan: 0, progress: [], stage_since: null })], OPTIONS)
    expect(board.projectsBlocked).toBe(1)
    // ...but every blocker still gets its own row.
    expect(board.counts['missing-amount']).toBe(1)
    expect(board.counts['no-progress']).toBe(1)
    expect(board.counts['no-stage-since']).toBe(1)
  })
})

describe('agreement with the gap scanner', () => {
  it('emits exactly the rows scanGaps produces', () => {
    const bare: PocRecord = {
      poc_id: 'POC-2026-009',
      name: '裸项目',
      amount_wan: 500,
      stage: 'G0-立项',
      gate0: { missing: ['decision_chain'], complete: false },
      plan: {},
      progress: [],
      outcome: {},
    }
    const board = buildBlockerBoard([bare], OPTIONS)
    const expected = scanGaps(bare, OPTIONS)
    const gapRows = board.rows.filter((row) => row.source === 'gap')
    expect(gapRows.length).toBe(expected.length)
    expect(gapRows.map((row) => row.rule)).toEqual(expect.arrayContaining(expected.map((item) => item.rule)))
    expect(board.counts.gap).toBe(expected.length)
  })
})

describe('ordering', () => {
  it('sorts by priority, so the most valuable finding is not buried', () => {
    // A large-amount gap (R2, priority 94) outranks a missing amount (58) and a
    // missing stage date (44), regardless of which source produced it.
    const board = buildBlockerBoard(
      [record({ poc_id: 'A', amount_wan: 900, gate0: { missing: [], complete: true, review: { conclusion: '' } }, stage_since: null })],
      OPTIONS,
    )
    const priorities = board.rows.map((row) => row.priority)
    expect(priorities).toEqual([...priorities].sort((left, right) => right - left))
  })

  it('breaks ties by project id so the order is stable between refreshes', () => {
    const board = buildBlockerBoard(
      [record({ poc_id: 'B', amount_wan: 0, progress: [], stage_since: null }), record({ poc_id: 'A', amount_wan: 0, progress: [], stage_since: null })],
      OPTIONS,
    )
    const firstPass = board.rows.map((row) => `${row.pocId}:${row.source}`)
    const second = buildBlockerBoard(
      [record({ poc_id: 'A', amount_wan: 0, progress: [], stage_since: null }), record({ poc_id: 'B', amount_wan: 0, progress: [], stage_since: null })],
      OPTIONS,
    )
    expect(second.rows.map((row) => `${row.pocId}:${row.source}`)).toEqual(firstPass)
  })
})

describe('the empty board', () => {
  it('has every source key so the Client needs no null check', () => {
    expect(emptyBlockerBoard().counts).toEqual({ gap: 0, stalled: 0, 'missing-amount': 0, 'no-progress': 0, 'no-stage-since': 0 })
    expect(emptyBlockerBoard().rows).toEqual([])
  })
})
