import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PocStore } from '../src/store.js'
import type { RepoCache } from '../src/repo.js'
import type { ProjectDetail } from '../src/types.js'

/**
 * The four stage fixtures under `tests/fixtures/`.
 *
 * Why they exist: the live ledger carries 30 projects, **all of them at G0 with
 * empty `scenarios`, `criteria` and `progress`**. The two-layer detail page is
 * built for the later gates, so without fixtures there is no way to see — or
 * regress-test — what a G2/G3/G4 project actually renders. Each fixture is a
 * complete, structurally valid v3.1 record:
 *
 * - `FIX-G0` — the empty state, which is also the live ledger's real shape.
 * - `FIX-G2` — plan defined, work just started: every scenario unproven.
 * - `FIX-G3` — the mixed case the design exists for: proven / awaiting / no evidence.
 * - `FIX-G4` — fully proven with a next milestone, so no gaps should fire.
 *
 * Structural validity is enforced separately (id formats, enums, required
 * `change`, no dangling ids); these tests pin the *behaviour* those records drive.
 */

const FIXTURE_DIR = join(import.meta.dirname, 'fixtures')
/** A fixed clock, so stage-staleness assertions do not drift with the real date. */
const NOW = new Date('2026-11-18T00:00:00Z')

/** A cache double over the fixture directory, reading real ledger config. */
function fixtureStore(now: Date = NOW): PocStore {
  const ledgerConfig = (name: string): string | null => {
    // The fixtures are validated against the live ledger's own rules when one is
    // available; without it the store's fallback path is exercised instead, which
    // is a real deployment shape and worth covering either way.
    try {
      const root = join(process.env.HOME ?? '', '.dsh', 'cache', 'work-dashboard', 'repo', 'config')
      return readFileSync(join(root, name), 'utf8')
    } catch {
      return null
    }
  }
  const cache = {
    repoPath: FIXTURE_DIR,
    repository: 'fixture/local',
    branch: 'main',
    lastFetchedAt: null as string | null,
    async isReady() { return true },
    async projectFiles() {
      return readdirSync(FIXTURE_DIR)
        .filter((name) => name.endsWith('.yaml'))
        .sort()
        .map((name) => join(FIXTURE_DIR, name))
    },
    async readProject(file: string) { return readFileSync(file, 'utf8') },
    async readRules() { return ledgerConfig('rules.yaml') },
    async readDerive() { return ledgerConfig('derive.yaml') },
    async readHealth() { return ledgerConfig('health.yaml') },
    async signalFiles() { return new Map<string, string>() },
  }
  return new PocStore(cache as unknown as RepoCache, { now: () => now, stallDays: 45 })
}

async function detailOf(id: string, now: Date = NOW): Promise<ProjectDetail> {
  const detail = await fixtureStore(now).detail(id)
  if (detail === null) throw new Error(`fixture ${id} did not parse`)
  return detail
}

describe('stage fixtures — structure', () => {
  it('ships one fixture per stage', () => {
    const names = readdirSync(FIXTURE_DIR).filter((name) => name.endsWith('.yaml')).sort()
    expect(names).toEqual(['FIX-G0.yaml', 'FIX-G2.yaml', 'FIX-G3.yaml', 'FIX-G4.yaml'])
  })

  it('parses every fixture with no warnings', async () => {
    const snapshot = await fixtureStore().snapshot()
    expect(snapshot.projects.map((project) => project.pocId).sort()).toEqual(['FIX-G0', 'FIX-G2', 'FIX-G3', 'FIX-G4'])
    // Any warning here means a fixture drifted from the schema the plugin reads.
    const fixtureWarnings = snapshot.warnings.filter((item) => item.includes('FIX-'))
    expect(fixtureWarnings).toEqual([])
  })
})

describe('FIX-G0 — the empty state (and the live ledger’s real shape)', () => {
  it('renders a project with no plan and no progress without inventing content', async () => {
    const detail = await detailOf('FIX-G0')
    expect(detail.summary.stageLabel).toBe('G0-立项')
    expect(detail.plan.scenarios).toEqual([])
    expect(detail.plan.criteria).toEqual([])
    expect(detail.progress).toEqual([])
    // The G0 floor is incomplete, which is what the page must show.
    expect(detail.gate0.complete).toBe(false)
    expect(detail.gate0.missing.length).toBe(5)
  })

  it('reports the missing G0 prerequisites rather than silence', async () => {
    const detail = await detailOf('FIX-G0')
    const rules = detail.gaps.map((gap) => gap.rule)
    expect(rules).toContain('R1-gate0-missing')
    // 500万 with a gate still at 待评审 is exactly the large-commitment case.
    expect(rules).toContain('R2-large-amount-no-g0')
    // No plan yet, so the state rules must stay quiet: nothing has started.
    expect(rules).not.toContain('R13-scenario-no-evidence')
    expect(rules).not.toContain('R16-scenario-not-started')
  })
})

describe('FIX-G2 — plan defined, work just started', () => {
  it('carries the ledger’s derived state through to the view', async () => {
    const detail = await detailOf('FIX-G2')
    expect(detail.plan.scenarios.map((item) => [item.id, item.status])).toEqual([
      ['scn-01', '无证据'],
      ['scn-02', '未开始'],
      ['scn-03', '未开始'],
    ])
    expect(detail.plan.criteria.map((item) => item.status)).toEqual(['未验证', '未验证', '未验证'])
  })

  it('fires the state rules once work has begun', async () => {
    const rules = (await detailOf('FIX-G2')).gaps.map((gap) => gap.rule)
    expect(rules).toContain('R13-scenario-no-evidence')
    expect(rules).toContain('R16-scenario-not-started')
    expect(rules).toContain('R15-criteria-unverified')
  })

  it('keeps the progress entry’s mandatory change marker', async () => {
    const detail = await detailOf('FIX-G2')
    expect(detail.progress[0]).toMatchObject({ change: '阶段推进', scenarioIds: [], criteriaIds: [] })
  })
})

describe('FIX-G3 — the mixed case the two-layer page exists for', () => {
  it('shows one proven, one awaiting the customer, one with no evidence', async () => {
    const detail = await detailOf('FIX-G3')
    expect(detail.plan.scenarios.map((item) => [item.name, item.status])).toEqual([
      ['办公网远程接入', '已证明'],
      ['出差移动接入', '待客户确认'],
      ['日志检索与留存', '无证据'],
    ])
    // The evidence counts drive the "how much proof" column.
    expect(detail.plan.scenarios.map((item) => item.evidenceCount)).toEqual([3, 1, 0])
  })

  it('separates a proven criterion from an unverified one', async () => {
    const detail = await detailOf('FIX-G3')
    expect(detail.plan.criteria.map((item) => [item.id, item.status])).toEqual([
      ['cri-01', '已达成'],
      ['cri-02', '未验证'],
      ['cri-03', '部分达成'],
    ])
  })

  it('links progress to scenarios and criteria by id, not by name', async () => {
    const detail = await detailOf('FIX-G3')
    expect(detail.progress.map((entry) => entry.scenarioIds)).toEqual([[], ['scn-01'], ['scn-02']])
    expect(detail.progress.map((entry) => entry.criteriaIds)).toEqual([[], ['cri-01'], ['cri-03']])
  })

  it('reports the genuine gaps of a partially proven POC', async () => {
    const rules = (await detailOf('FIX-G3')).gaps.map((gap) => gap.rule)
    // No evidence on the log scenario is the finding this fixture is built around.
    expect(rules).toContain('R13-scenario-no-evidence')
    // Proof exists but the customer has not signed off on the weak-network round.
    expect(rules).toContain('R10-g3-1-without-g3-2')
    expect(rules).toContain('R15-criteria-unverified')
  })

  it('marks R14 as info, not as a fault', async () => {
    const found = (await detailOf('FIX-G3')).gaps.find((gap) => gap.rule === 'R14-scenario-awaiting-customer')
    expect(found).toBeDefined()
    // Waiting on the customer is a state, not a defect.
    expect(found!.level).toBe('info')
  })
})

describe('FIX-G4 — fully proven and converted', () => {
  it('has no gaps at all, which is the one fixture that must stay clean', async () => {
    const detail = await detailOf('FIX-G4')
    expect(detail.gaps).toEqual([])
  })

  it('proves every scenario and every criterion, with a next milestone', async () => {
    const detail = await detailOf('FIX-G4')
    expect(detail.plan.scenarios.every((item) => item.status === '已证明')).toBe(true)
    expect(detail.plan.criteria.every((item) => item.status === '已达成')).toBe(true)
    // R11 would fire if this were absent: achieved with nothing banked.
    expect(detail.outcome.milestone).toBe('取得采购立项批复')
  })
})

describe('stage progression — the same fields read correctly at every gate', () => {
  it('moves from empty to complete as the fixtures advance', async () => {
    const counts = []
    for (const id of ['FIX-G0', 'FIX-G2', 'FIX-G3', 'FIX-G4']) {
      const detail = await detailOf(id)
      counts.push({
        id,
        scenarios: detail.plan.scenarios.length,
        proven: detail.plan.scenarios.filter((item) => item.status === '已证明').length,
        progress: detail.progress.length,
      })
    }
    expect(counts).toEqual([
      { id: 'FIX-G0', scenarios: 0, proven: 0, progress: 0 },
      { id: 'FIX-G2', scenarios: 3, proven: 0, progress: 1 },
      { id: 'FIX-G3', scenarios: 3, proven: 1, progress: 3 },
      { id: 'FIX-G4', scenarios: 3, proven: 3, progress: 2 },
    ])
  })
})
