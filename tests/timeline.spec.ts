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
      { ...BASE, poc_id: 'P-1', name: 'A', timeline: [{ date: '2026-10-01', round: 1 }, { date: '2026-11-01', round: 2 }] },
      { ...BASE, poc_id: 'P-2', name: 'B', timeline: [{ date: '2026-10-20', round: 1 }] },
    ]
    const timeline = buildGlobalTimeline(records, { staleDays: 30 })
    expect(timeline.entries.map((entry) => entry.date)).toEqual(['2026-11-01', '2026-10-20', '2026-10-01'])
  })

  it('keeps a stable order for the same date', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-2', name: 'B', timeline: [{ date: '2026-10-01', round: 1 }] },
      { ...BASE, poc_id: 'P-1', name: 'A', timeline: [{ date: '2026-10-01', round: 2 }] },
    ]
    const timeline = buildGlobalTimeline(records, { staleDays: 30 })
    expect(timeline.entries.map((entry) => entry.pocId)).toEqual(['P-1', 'P-2'])
  })

  it('sinks an unparsable date below the dated entries but still lists it', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-1', name: 'A', timeline: [{ date: '2026-10-01', round: 1 }, { date: 'bad', round: 2 }] },
    ]
    const timeline = buildGlobalTimeline(records, { staleDays: 30 })
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
      { ...BASE, poc_id: 'P-1', name: 'A', timeline: [{ date: '2026-09-01' }, { date: '2026-11-01' }] },
      { ...BASE, poc_id: 'P-2', name: 'B', timeline: [{ date: '2026-10-15' }] },
    ]
    const timeline = buildGlobalTimeline(records, { staleDays: 30 })
    expect(timeline.range).toEqual({ from: '2026-09-01', to: '2026-11-01' })
  })

  it('summarizes activity per month, newest month first', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-1', name: 'A', timeline: [{ date: '2026-10-01' }, { date: '2026-10-20' }, { date: '2026-11-01' }] },
    ]
    const timeline = buildGlobalTimeline(records, { staleDays: 30 })
    expect(timeline.months).toEqual([
      { month: '2026-11', count: 1 },
      { month: '2026-10', count: 2 },
    ])
  })

  it('reports a null range when nothing is dated', () => {
    const records: PocRecord[] = [{ ...BASE, poc_id: 'P-1', timeline: [{ date: 'bad' }] }]
    const timeline = buildGlobalTimeline(records, { staleDays: 30 })
    expect(timeline.range).toBeNull()
    expect(timeline.months).toEqual([])
    expect(timeline.entries).toHaveLength(1)
  })
})

describe('silent projects', () => {
  it('lists projects with no timeline at all', () => {
    const records: PocRecord[] = [
      { ...BASE, poc_id: 'P-1', name: 'A', timeline: [{ date: '2026-10-01' }] },
      { ...BASE, poc_id: 'P-2', name: 'B', timeline: [] },
      { ...BASE, poc_id: 'P-3', name: 'C' },
    ]
    const timeline = buildGlobalTimeline(records, { staleDays: 30 })
    expect(timeline.silentProjects.map((project) => project.pocId)).toEqual(['P-2', 'P-3'])
  })

  it('does not list a project whose only entries are undated', () => {
    // It HAS a timeline; it is not silent, its dates are just unusable.
    const timeline = buildGlobalTimeline([{ ...BASE, poc_id: 'P-1', timeline: [{ date: 'bad' }] }], { staleDays: 30 })
    expect(timeline.silentProjects).toEqual([])
  })
})

describe('entry shape', () => {
  it('carries every round field as a string, with the round number as a number', () => {
    const timeline = buildGlobalTimeline([
      {
        ...BASE,
        poc_id: 'P-1',
        timeline: [{ date: '2026-10-01', round: 2, goal: 'G', actual: 'A', evidence: 'E', customer_feedback: 'F', recognition_scope: '书面' }],
      },
    ], { staleDays: 30 })
    expect(timeline.entries[0]).toMatchObject({
      pocId: 'P-1', date: '2026-10-01', round: 2, goal: 'G', actual: 'A', evidence: 'E', customerFeedback: 'F', recognitionScope: '书面',
    })
  })

  it('treats a missing round number as null', () => {
    const timeline = buildGlobalTimeline([{ ...BASE, poc_id: 'P-1', timeline: [{ date: '2026-10-01' }] }], { staleDays: 30 })
    expect(timeline.entries[0]?.round).toBeNull()
  })

  it('handles an empty ledger', () => {
    const timeline = buildGlobalTimeline([], { staleDays: 30 })
    expect(timeline).toEqual({ entries: [], range: null, months: [], silentProjects: [] })
  })
})
