import { describe, expect, it } from 'vitest'
import { buildRiskBoard, riskRank } from '../src/risks.js'
import type { PocRecord } from '../src/types.js'

/**
 * Risk-board tests.
 *
 * The board's whole value is its ordering, so that is what is pinned: a high
 * risk outranks every medium, and an unset level sorts LAST. An unset level is
 * not a claim that a risk is mild — it is a missing judgement, and putting it at
 * the top would bury the risks someone actually assessed as serious.
 */

const NOW = new Date('2026-11-06T00:00:00Z')
const OPTIONS = { now: NOW, stallDays: 45 }

/** A healthy v3 record; tests override only the risks they care about. */
const BASE: PocRecord = {
  poc_id: 'POC-2026-001',
  name: '某某银行零信任试点',
  stage: 'G2-方案验证',
  gate0: { missing: [], complete: true, review: { conclusion: '通过' } },
  plan: { criteria: [{ name: 'a' }, { name: 'b' }], scenarios: ['s1', 's2', 's3'], risks: [] },
  progress: [],
  outcome: {},
}

/** A record carrying exactly the given plan risks. */
function withRisks(id: string, name: string, risks: Array<{ name?: string; level?: string; mitigation?: string }>): PocRecord {
  return { ...BASE, poc_id: id, name, plan: { ...BASE.plan, risks } }
}

describe('severity ranking', () => {
  it('ranks high above medium above low above unset', () => {
    expect(riskRank('high')).toBeGreaterThan(riskRank('medium'))
    expect(riskRank('medium')).toBeGreaterThan(riskRank('low'))
    expect(riskRank('low')).toBeGreaterThan(riskRank(''))
    expect(riskRank('nonsense')).toBe(0)
  })

  it('is case-insensitive', () => {
    expect(riskRank('HIGH')).toBe(riskRank('high'))
    expect(riskRank('Medium')).toBe(riskRank('medium'))
  })
})

describe('board assembly', () => {
  it('orders every high risk before every medium, and unset last', () => {
    const records: PocRecord[] = [
      withRisks('P-1', 'A', [{ name: 'medium risk', level: 'medium' }]),
      withRisks('P-2', 'B', [{ name: 'unset risk' }]),
      withRisks('P-3', 'C', [{ name: 'high risk', level: 'high' }]),
      withRisks('P-4', 'D', [{ name: 'low risk', level: 'low' }]),
    ]
    const board = buildRiskBoard(records, OPTIONS)
    expect(board.rows.map((row) => row.level)).toEqual(['high', 'medium', 'low', ''])
    expect(board.rows.map((row) => row.name)).toEqual(['high risk', 'medium risk', 'low risk', 'unset risk'])
  })

  it('flattens multiple risks per project and keeps a stable order within a level', () => {
    const records: PocRecord[] = [
      withRisks('P-1', 'A', [{ name: 'a1', level: 'high' }, { name: 'a2', level: 'low' }]),
      withRisks('P-2', 'B', [{ name: 'b1', level: 'high' }]),
    ]
    const board = buildRiskBoard(records, OPTIONS)
    expect(board.rows).toHaveLength(3)
    expect(board.rows.filter((row) => row.level === 'high').map((row) => row.name)).toEqual(['a1', 'b1'])
  })

  it('counts each severity and the total', () => {
    const records: PocRecord[] = [
      withRisks('P-1', 'A', [{ name: 'h', level: 'high' }, { name: 'm', level: 'medium' }]),
      withRisks('P-2', 'B', [{ name: 'u' }]),
    ]
    const board = buildRiskBoard(records, OPTIONS)
    expect(board.counts).toMatchObject({ high: 1, medium: 1, low: 0, unset: 1 })
    expect(board.rows).toHaveLength(3)
    expect(board.projectsTotal).toBe(2)
  })

  it('carries the project gap context so a row is not read in isolation', () => {
    // A project at 1500万 with no G0 clearance carries a high R2 gap.
    const record: PocRecord = {
      ...BASE,
      poc_id: 'P-9',
      amount_wan: 1500,
      gate0: { missing: [], review: {} },
      plan: { criteria: [{ name: 'a' }, { name: 'b' }], scenarios: ['s1', 's2', 's3'], risks: [{ name: 'r', level: 'medium' }] },
    }
    const board = buildRiskBoard([record], OPTIONS)
    expect(board.rows[0]?.gapCount).toBeGreaterThan(0)
    expect(board.rows[0]?.highGapCount).toBeGreaterThan(0)
  })

  it('falls back to the id when a project has no name', () => {
    const board = buildRiskBoard([withRisks('P-7', '', [{ name: 'r', level: 'high' }])], OPTIONS)
    expect(board.rows[0]?.pocName).toBe('P-7')
  })

  it('survives a risk with no fields at all', () => {
    const board = buildRiskBoard([withRisks('P-8', 'H', [{}])], OPTIONS)
    expect(board.rows).toHaveLength(1)
    expect(board.rows[0]).toMatchObject({ name: '', level: '', mitigation: '' })
  })

  it('returns an empty board when no project has risks', () => {
    const board = buildRiskBoard([BASE], OPTIONS)
    expect(board.rows).toEqual([])
    expect(board.counts).toMatchObject({ high: 0, medium: 0, low: 0, unset: 0 })
  })
})
