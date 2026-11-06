import { describe, expect, it } from 'vitest'
import { buildGlobalTimeline } from '../src/timeline.js'
import type { PocRecord } from '../src/types.js'

/**
 * Global-timeline tests.
 *
 * The timeline's value is that it makes rhythm visible: newest first, one row
 * per month that actually had activity, and an explicit list of projects with no
 * history at all. An unparsable date must not be silently dropped from the list,
 * but must not poison the range or the month summary either.
 */

const BASE: PocRecord = {
  poc_id: 'POC-2026-001',
  name: '某某银行零信任试点',
  stage: 'G2-方案验证',
}

describe('ordering', () => {
  it('sorts every round newest first', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-1', name: 'A', progress: [{ date: '2026-10-01', seq: 1 }, { date: '2026-11-01', seq: 2 }] },
      { ...BASE, poc_id: 'P-2', name: 'B', progress: [{ date: '2026-10-20', seq: 1 }] },
    ]
    const timeline = buildGlobalTimeline(records, { stallDays: 45 })
    expect(timeline.entries.map((entry) => entry.date)).toEqual(['2026-11-01', '2026-10-20', '2026-10-01'])
  })

  it('keeps a stable order for the same date', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-2', name: 'B', progress: [{ date: '2026-10-01', seq: 1 }] },
      { ...BASE, poc_id: 'P-1', name: 'A', progress: [{ date: '2026-10-01', seq: 2 }] },
    ]
    const timeline = buildGlobalTimeline(records, { stallDays: 45 })
    expect(timeline.entries.map((entry) => entry.pocId)).toEqual(['P-1', 'P-2'])
  })

  it('sinks an unparsable date below the dated entries but still lists it', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-1', name: 'A', progress: [{ date: '2026-10-01', seq: 1 }, { date: 'bad', seq: 2 }] },
    ]
    const timeline = buildGlobalTimeline(records, { stallDays: 45 })
    expect(timeline.entries).toHaveLength(2)
    expect(timeline.entries[0]?.date).toBe('2026-10-01')
    expect(timeline.entries[1]?.date).toBe('bad')
    // The bad date is excluded from the range.
    expect(timeline.range).toEqual({ from: '2026-10-01', to: '2026-10-01' })
  })
})

describe('range and months', () => {
  it('reports the oldest and newest dated entries', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-1', name: 'A', progress: [{ date: '2026-09-01' }, { date: '2026-11-01' }] },
      { ...BASE, poc_id: 'P-2', name: 'B', progress: [{ date: '2026-10-15' }] },
    ]
    const timeline = buildGlobalTimeline(records, { stallDays: 45 })
    expect(timeline.range).toEqual({ from: '2026-09-01', to: '2026-11-01' })
  })

  it('summarizes activity per month, newest month first', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-1', name: 'A', progress: [{ date: '2026-10-01' }, { date: '2026-10-20' }, { date: '2026-11-01' }] },
    ]
    const timeline = buildGlobalTimeline(records, { stallDays: 45 })
    expect(timeline.months).toEqual([
      { month: '2026-11', count: 1 },
      { month: '2026-10', count: 2 },
    ])
  })

  it('reports a null range when nothing is dated', () => {
    const records: PocRecord[] = [{ ...BASE, poc_id: 'P-1', progress: [{ date: 'bad' }] }]
    const timeline = buildGlobalTimeline(records, { stallDays: 45 })
    expect(timeline.range).toBeNull()
    expect(timeline.months).toEqual([])
    expect(timeline.entries).toHaveLength(1)
  })
})

describe('silent projects', () => {
  it('lists projects with no timeline at all', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-1', name: 'A', progress: [{ date: '2026-10-01' }] },
      { ...BASE, poc_id: 'P-2', name: 'B', progress: [] },
      { ...BASE, poc_id: 'P-3', name: 'C' },
    ]
    const timeline = buildGlobalTimeline(records, { stallDays: 45 })
    expect(timeline.silentProjects.map((project) => project.pocId)).toEqual(['P-2', 'P-3'])
  })

  it('does not list a project whose only entries are undated', () => {
    // It HAS a timeline; it is not silent, its dates are just unusable.
    const timeline = buildGlobalTimeline([{ ...BASE, poc_id: 'P-1', progress: [{ date: 'bad' }] }], { stallDays: 45 })
    expect(timeline.silentProjects).toEqual([])
  })
})

describe('entry shape', () => {
  it('carries every v3 progress field, with evidence flattened for display', () => {
    const timeline = buildGlobalTimeline([
      {
        ...BASE,
        poc_id: 'P-1',
        progress: [{
          date: '2026-10-01',
          seq: 2,
          type: '内部Review',
          goal: 'G',
          actual: 'A',
          completion: '75%',
          evidence: [{ title: '压测报告', type: '文档' }, { title: '截图', type: '截图' }],
          customer: { synced_with: '王工', feedback: 'F', recognition: '部分认可' },
          gate3_1: '可证明',
          gate3_2: '待确认',
          next: { goal: '补齐', owner: '张三', deadline: '2026-11-20' },
        }],
      },
    ], { stallDays: 45 })
    expect(timeline.entries[0]).toMatchObject({
      pocId: 'P-1',
      date: '2026-10-01',
      seq: 2,
      type: '内部Review',
      goal: 'G',
      actual: 'A',
      completion: '75%',
      evidence: '压测报告 · 截图',
      evidenceCount: 2,
      customerFeedback: 'F',
      recognition: '部分认可',
      gate3_1: '可证明',
      gate3_2: '待确认',
      nextGoal: '补齐',
      nextOwner: '张三',
      nextDeadline: '2026-11-20',
    })
  })

  it('treats a missing seq as null', () => {
    const timeline = buildGlobalTimeline([{ ...BASE, poc_id: 'P-1', progress: [{ date: '2026-10-01' }] }], { stallDays: 45 })
    expect(timeline.entries[0]?.seq).toBeNull()
  })

  it('handles an empty ledger', () => {
    const timeline = buildGlobalTimeline([], { stallDays: 45 })
    expect(timeline).toEqual({ entries: [], range: null, months: [], silentProjects: [] })
  })
})
