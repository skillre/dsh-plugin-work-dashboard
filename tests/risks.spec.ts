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

const BASE: PocRecord = {
  poc_id: 'POC-2026-001',
  name: '某某银行零信任试点',
  stage: 'G2-方案验证',
  why_customer_test: 'X',
  why_we_test: 'Y',
  customer_tech_owner: '王工',
  result: { achievement: null, evidence: null, recognition: null, next_milestone: null },
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
      { ...BASE, poc_id: 'P-1', name: 'A', risks: [{ name: 'medium risk', level: 'medium' }] },
      { ...BASE, poc_id: 'P-2', name: 'B', risks: [{ name: 'unset risk' }] },
      { ...BASE, poc_id: 'P-3', name: 'C', risks: [{ name: 'high risk', level: 'high' }] },
      { ...BASE, poc_id: 'P-4', name: 'D', risks: [{ name: 'low risk', level: 'low' }] },
    ]
    const board = buildRiskBoard(records)
    expect(board.rows.map((row) => row.level)).toEqual(['high', 'medium', 'low', ''])
    expect(board.rows.map((row) => row.name)).toEqual(['high risk', 'medium risk', 'low risk', 'unset risk'])
  })

  it('flattens multiple risks per project and keeps a stable order within a level', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-1', name: 'A', risks: [{ name: 'r1', level: 'high' }, { name: 'r2', level: 'high' }] },
      { ...BASE, poc_id: 'P-2', name: 'B', risks: [{ name: 'r3', level: 'high' }] },
    ]
    const board = buildRiskBoard(records)
    expect(board.rows).toHaveLength(3)
    // Same rank: ordered by project id, so a refresh cannot reshuffle them.
    expect(board.rows.map((row) => row.pocId)).toEqual(['P-1', 'P-1', 'P-2'])
    expect(board.rows.map((row) => row.name)).toEqual(['r1', 'r2', 'r3'])
  })

  it('counts each severity and the total', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-1', name: 'A', risks: [{ name: 'h1', level: 'high' }, { name: 'm1', level: 'medium' }] },
      { ...BASE, poc_id: 'P-2', name: 'B', risks: [{ name: 'l1', level: 'low' }, { name: 'u1' }] },
    ]
    const board = buildRiskBoard(records)
    expect(board.counts).toEqual({ high: 1, medium: 1, low: 1, unset: 1, total: 4 })
    expect(board.projectsWithRisks).toBe(2)
    expect(board.projectsTotal).toBe(2)
  })

  it('reports zero projects-with-risks when nothing is registered', () => {
    const records: PocRecord[] = [{ ...BASE, poc_id: 'P-1', name: 'A' }, { ...BASE, poc_id: 'P-2', name: 'B' }]
    const board = buildRiskBoard(records)
    expect(board.rows).toEqual([])
    expect(board.projectsWithRisks).toBe(0)
    expect(board.projectsTotal).toBe(2)
  })

  it('carries the project gap context so a row is not read in isolation', () => {
    // POC-003-shaped record: achieved + evidenced + recognised, no next milestone.
    const record: PocRecord = {
      ...BASE,
      poc_id: 'P-3',
      name: 'C',
      risks: [{ name: 'r', level: 'medium' }],
      result: { achievement: '完成', evidence: '报告', recognition: '书面', next_milestone: null },
    }
    const board = buildRiskBoard([record])
    expect(board.rows[0]?.gapCount).toBe(1)
    expect(board.rows[0]?.highGapCount).toBe(1)
  })

  it('falls back to the id when a project has no name', () => {
    const board = buildRiskBoard([{ ...BASE, poc_id: 'P-9', name: null, risks: [{ name: 'r', level: 'high' }] }])
    expect(board.rows[0]?.pocName).toBe('P-9')
  })

  it('survives a risk with no fields at all', () => {
    const board = buildRiskBoard([{ ...BASE, poc_id: 'P-1', risks: [{} as never] }])
    expect(board.rows[0]).toMatchObject({ level: '', name: '', mitigation: '', rank: 0 })
  })
})
