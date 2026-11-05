import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PocStore } from '../src/store.js'
import { RepoCache, RepoError, assertSafeCacheRoot } from '../src/repo.js'
import type { Snapshot } from '../src/types.js'

/**
 * Store tests over a real temporary cache directory.
 *
 * The git half is not exercised here (that is the isolated-profile integration
 * test's job); these tests cover the YAML parse, the summary arithmetic, the
 * warning paths, and the wipe/adopt rules that protect the user's filesystem.
 */

const NOW = new Date('2026-11-05T00:00:00Z')

/** The three fixtures the specification asks for, plus one broken file. */
const COMPLETE = `poc_id: POC-2026-001
name: 某某银行零信任试点
type: customer-pilot
tier: strategic
stage: G2-方案验证
owner: 张三
sales_initiator: 李四
customer_tech_owner: 王工
why_customer_test: 客户要做等保合规改造
why_we_test: 客户是区域标杆
next_action_goal: 两周内完成 200 人灰度接入
gates:
  G0: { complete: true, date: 2026-10-15 }
  G1: { complete: true, date: 2026-10-28, indicators_count: 3, scenarios_count: 4, risks_count: 2 }
  G2: { complete: false, prerequisites_ready: true, engineers_invested: true }
success_criteria:
  - { name: 200 人并发, version: v1, metric: 成功率 ≥ 99.5% }
success_scenarios: [办公网远程接入, 出差移动接入, 第三方运维临时接入]
risks:
  - { name: AD 环境老旧, level: high, mitigation: 提前预演 }
result:
  achievement: null
  evidence: null
  recognition: null
  next_milestone: null
timeline:
  - { date: 2026-10-15, round: 1, goal: 完成立项, actual: 已完成, evidence: 立项邮件, customer_feedback: 认可方向, recognition_scope: 口头 }
  - { date: 2026-10-28, round: 2, goal: 完成方案设计, actual: 完成, evidence: 方案文档 v1.2, customer_feedback: 待评审, recognition_scope: 无 }
`

const MISSING_G0 = `poc_id: POC-2026-002
name: 某某集团办公网改造
type: tech-validation
tier: normal
stage: G0-立项
owner: 赵六
sales_initiator: 钱七
customer_tech_owner: null
why_customer_test: null
why_we_test: null
next_action_goal: null
gates:
  G0: { complete: false }
  G1: { complete: false, indicators_count: 0, scenarios_count: 0, risks_count: 0 }
  G2: { complete: false, prerequisites_ready: false, engineers_invested: false }
success_criteria: []
success_scenarios: []
risks: []
result: { achievement: null, evidence: null, recognition: null, next_milestone: null }
timeline: []
`

const G4_NO_NEXT = `poc_id: POC-2026-003
name: 某某制造产线安全接入
type: customer-pilot
tier: high-value
stage: G4-结果转化
owner: 孙八
sales_initiator: 周九
customer_tech_owner: 吴工
why_customer_test: 产线设备远程运维存在安全风险
why_we_test: 制造业是重点行业
next_action_goal: 完成验收并推动复购
gates:
  G0: { complete: true, date: 2026-09-01 }
  G1: { complete: true, date: 2026-09-20, indicators_count: 2, scenarios_count: 3, risks_count: 1 }
  G2: { complete: true, date: 2026-10-10, prerequisites_ready: true, engineers_invested: true }
success_criteria:
  - { name: 50 台设备接入 }
  - { name: 运维全程审计 }
success_scenarios: [产线设备远程运维, 供应商临时接入, 车间网络隔离]
risks:
  - { name: 产线不能停机, level: medium, mitigation: 分批次夜间实施 }
result:
  achievement: 全部完成，客户验收通过
  evidence: 验收报告.pdf
  recognition: 客户 IT 部门书面认可
  next_milestone: null
timeline:
  - { date: 2026-09-01, round: 1, goal: 完成立项 }
  - { date: 2026-10-10, round: 2, goal: 完成方案验证 }
  - { date: 2026-11-01, round: 3, goal: 完成验收, recognition_scope: 正式验收 }
`

let root = ''
let repoPath = ''

/** Build a cache-shaped directory tree for the store to read. */
async function seed(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'poc-store-test-'))
  const projects = join(dir, 'projects')
  await mkdir(projects, { recursive: true })
  for (const [name, body] of Object.entries(files)) await writeFile(join(projects, name), body, 'utf8')
  return dir
}

/** A cache double: the store only calls these three members. */
function cacheOf(path: string, ready = true) {
  return {
    repoPath: path,
    repository: 'skillre/workbranch',
    branch: 'main',
    lastFetchedAt: '2026-11-05T04:00:00.000Z' as string | null,
    async isReady() { return ready },
    async projectFiles() {
      const { readdir } = await import('node:fs/promises')
      const names = await readdir(join(path, 'projects'))
      return names.filter((name) => name.endsWith('.yaml')).sort().map((name) => join(path, 'projects', name))
    },
    async readProject(file: string) {
      const { readFile, stat } = await import('node:fs/promises')
      const info = await stat(file)
      if (info.size > 512 * 1024) throw new RepoError('too-large', 'too large')
      return readFile(file, 'utf8')
    },
  }
}

beforeAll(async () => {
  root = await seed({ 'POC-2026-001.yaml': COMPLETE, 'POC-2026-002.yaml': MISSING_G0, 'POC-2026-003.yaml': G4_NO_NEXT })
  repoPath = root
})

afterAll(async () => {
  if (root !== '') await rm(root, { recursive: true, force: true })
})

describe('snapshot', () => {
  it('reports the three projects with their summaries', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
    const snapshot: Snapshot = await store.snapshot()
    expect(snapshot.cacheReady).toBe(true)
    expect(snapshot.projects).toHaveLength(3)
    expect(snapshot.repository).toBe('skillre/workbranch')
    expect(snapshot.fetchedAt).toBe('2026-11-05T04:00:00.000Z')
    const byId = new Map(snapshot.projects.map((project) => [project.pocId, project]))
    expect(byId.get('POC-2026-001')).toMatchObject({ name: '某某银行零信任试点', stage: 'G2', closed: false })
    expect(byId.get('POC-2026-003')?.dimensionCount).toBe(3)
    expect(byId.get('POC-2026-002')?.dimensionCount).toBe(0)
  })

  it('counts the four dimensions separately per project', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
    const snapshot = await store.snapshot()
    const project = snapshot.projects.find((candidate) => candidate.pocId === 'POC-2026-003')!
    expect(project.dimensions).toEqual({ achievement: true, evidence: true, recognition: true, nextMilestone: false })
    const missing = snapshot.projects.find((candidate) => candidate.pocId === 'POC-2026-002')!
    expect(missing.dimensions).toEqual({ achievement: false, evidence: false, recognition: false, nextMilestone: false })
  })

  it('computes the four headline counters', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
    const snapshot = await store.snapshot()
    expect(snapshot.stats).toMatchObject({
      total: 3,
      active: 3,
      // POC-002 is missing all three G0 prerequisites.
      g0Incomplete: 1,
      // POC-003 carries the G4 no-next-milestone high gap; POC-002 the G0 ones.
      atRisk: 2,
      // POC-003 has achievement + evidence + recognition.
      convertible: 1,
      closed: 0,
    })
  })

  it('orders the pending list by priority and includes every rule', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
    const snapshot = await store.snapshot()
    expect(snapshot.gaps.length).toBeGreaterThan(0)
    expect(snapshot.gaps[0]?.rule).toBe('G4-no-next-milestone')
    const rules = new Set(snapshot.gaps.map((gap) => gap.rule))
    expect(rules.has('G0-why-customer')).toBe(true)
    expect(rules.has('G4-no-next-milestone')).toBe(true)
    expect(snapshot.gaps.every((gap) => gap.pocName !== '' && gap.pocId !== '')).toBe(true)
  })

  it('reports gate completion from the ledger records, not the stage position', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
    const snapshot = await store.snapshot()
    const g4 = snapshot.projects.find((project) => project.pocId === 'POC-2026-003')!
    // POC-2026-003 sits at G4 with G0..G2 recorded complete and no G3/G4 date.
    expect(g4.gateComplete).toEqual([true, true, true, false, false])
    const g0 = snapshot.projects.find((project) => project.pocId === 'POC-2026-002')!
    expect(g0.gateComplete).toEqual([false, false, false, false, false])
  })

  it('sorts projects so the ones needing attention come first', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
    const snapshot = await store.snapshot()
    expect(snapshot.projects[0]?.highGapCount).toBeGreaterThanOrEqual(snapshot.projects[1]?.highGapCount ?? 0)
  })

  it('reports an empty, not-ready cache without throwing', async () => {
    const store = new PocStore(cacheOf(repoPath, false) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
    const snapshot = await store.snapshot()
    expect(snapshot).toMatchObject({ cacheReady: false, projects: [], gaps: [], warnings: [] })
    expect(snapshot.stats.total).toBe(0)
    expect(snapshot.cachePath).toBe(repoPath)
  })
})

describe('detail', () => {
  it('returns the full record for one project', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
    const detail = await store.detail('POC-2026-003')
    expect(detail).not.toBeNull()
    expect(detail!.summary.name).toBe('某某制造产线安全接入')
    expect(detail!.gates.map((gate) => gate.stage)).toEqual(['G0', 'G1', 'G2', 'G3', 'G4'])
    expect(detail!.gates[0]).toMatchObject({ stage: 'G0', complete: true, date: '2026-09-01' })
    expect(detail!.gates[3]).toMatchObject({ stage: 'G3', complete: false, date: null })
    expect(detail!.criteria).toHaveLength(2)
    expect(detail!.scenarios).toHaveLength(3)
    expect(detail!.risks).toHaveLength(1)
    expect(detail!.timeline).toHaveLength(3)
    expect(detail!.timeline[2]).toMatchObject({ date: '2026-11-01', round: 3, recognition_scope: '正式验收' })
    expect(detail!.result.next_milestone).toBe('')
    expect(detail!.gaps.map((gap) => gap.rule)).toContain('G4-no-next-milestone')
  })

  it('returns null for an unknown id and for a cold cache', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
    expect(await store.detail('POC-9999')).toBeNull()
    const cold = new PocStore(cacheOf(repoPath, false) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
    expect(await cold.detail('POC-2026-001')).toBeNull()
  })

  it('renders the G0 prerequisites of a broken project as empty strings', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
    const detail = await store.detail('POC-2026-002')
    expect(detail!.whyCustomerTest).toBe('')
    expect(detail!.whyWeTest).toBe('')
    expect(detail!.customerTechOwner).toBe('')
  })
})

describe('warnings', () => {
  it('skips an unparsable file and keeps the rest', async () => {
    const dir = await seed({ 'POC-2026-001.yaml': COMPLETE, 'broken.yaml': 'poc_id: [unclosed\n' })
    try {
      const store = new PocStore(cacheOf(dir) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
      const snapshot = await store.snapshot()
      expect(snapshot.projects).toHaveLength(1)
      expect(snapshot.warnings).toHaveLength(1)
      expect(snapshot.warnings[0]).toContain('broken.yaml')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('falls back to the file name when poc_id is missing', async () => {
    const dir = await seed({ 'POC-2026-010.yaml': 'name: 无编号项目\nstage: G0-立项\n' })
    try {
      const store = new PocStore(cacheOf(dir) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
      const snapshot = await store.snapshot()
      expect(snapshot.projects[0]?.pocId).toBe('POC-2026-010')
      expect(snapshot.warnings.some((warning) => warning.includes('poc_id is missing'))).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('warns about an empty file and a non-mapping document', async () => {
    const dir = await seed({ 'empty.yaml': '', 'list.yaml': '- a\n- b\n' })
    try {
      const store = new PocStore(cacheOf(dir) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
      const snapshot = await store.snapshot()
      expect(snapshot.projects).toHaveLength(0)
      expect(snapshot.warnings).toHaveLength(2)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('warns about a duplicate poc_id but still shows both rows', async () => {
    const dir = await seed({ 'a.yaml': 'poc_id: POC-2026-001\nname: A\n', 'b.yaml': 'poc_id: POC-2026-001\nname: B\n' })
    try {
      const store = new PocStore(cacheOf(dir) as unknown as RepoCache, { now: () => NOW, staleDays: 30 })
      const snapshot = await store.snapshot()
      expect(snapshot.projects).toHaveLength(2)
      expect(snapshot.warnings.some((warning) => warning.includes('already defined'))).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe('cache directory safety', () => {
  it('refuses a cache root that is the home directory or too shallow', () => {
    expect(() => assertSafeCacheRoot('/Users/u', '/Users/u')).toThrow(/home directory/)
    expect(() => assertSafeCacheRoot('/tmp', '/Users/u')).toThrow(/too shallow/)
    expect(() => assertSafeCacheRoot('', '/Users/u')).toThrow(/empty/)
    expect(assertSafeCacheRoot('/Users/u/.dsh/cache/poc-console', '/Users/u')).toBe('/Users/u/.dsh/cache/poc-console')
  })

  it('wipes a cache it created and recreates the marker', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'poc-cache-test-'))
    const cacheRoot = join(dir, 'poc-console')
    try {
      const cache = new RepoCache({ cacheRoot, repository: 'skillre/workbranch', branch: 'main', cloneTimeoutMs: 1000, fetchTimeoutMs: 1000, remoteUrl: 'https://github.com/skillre/workbranch.git' })
      await cache.prepare()
      // A leftover clone from a previous run must be gone after prepare().
      await mkdir(join(cacheRoot, 'repo', 'projects'), { recursive: true })
      await cache.prepare()
      expect(await cache.isReady()).toBe(false)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('maps an unwritable cache root to an authored cache-unwritable code', async () => {
    // A read-only parent makes mkdir fail with EACCES/EPERM, which must not
    // surface as an opaque internal error on the first request.
    const dir = await mkdtemp(join(tmpdir(), 'poc-cache-ro-'))
    const readOnly = join(dir, 'ro')
    await mkdir(readOnly)
    await (await import('node:fs/promises')).chmod(readOnly, 0o500)
    const cache = new RepoCache({ cacheRoot: join(readOnly, 'poc-console'), repository: 'skillre/workbranch', branch: 'main', cloneTimeoutMs: 1000, fetchTimeoutMs: 1000, remoteUrl: 'https://github.com/skillre/workbranch.git' })
    try {
      const error = await cache.prepare().then(() => null, (caught: unknown) => caught)
      expect(error).toBeInstanceOf(RepoError)
      expect(['cache-unwritable', 'cache-failed']).toContain((error as RepoError).code)
      expect((error as RepoError).message).toContain('cacheRoot')
    } finally {
      await (await import('node:fs/promises')).chmod(readOnly, 0o700)
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('adopts an empty pre-existing directory but refuses a foreign non-empty one', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'poc-cache-test-'))
    try {
      const empty = join(dir, 'empty')
      await mkdir(empty)
      const cache = new RepoCache({ cacheRoot: empty, repository: 'skillre/workbranch', branch: 'main', cloneTimeoutMs: 1000, fetchTimeoutMs: 1000, remoteUrl: 'https://github.com/skillre/workbranch.git' })
      await expect(cache.prepare()).resolves.toBeUndefined()

      const foreign = join(dir, 'foreign')
      await mkdir(foreign)
      await writeFile(join(foreign, 'precious.txt'), 'do not delete', 'utf8')
      const guarded = new RepoCache({ cacheRoot: foreign, repository: 'skillre/workbranch', branch: 'main', cloneTimeoutMs: 1000, fetchTimeoutMs: 1000, remoteUrl: 'https://github.com/skillre/workbranch.git' })
      await expect(guarded.prepare()).rejects.toThrow(/refusing to clear/)
      // The user's file is still there.
      expect(await import('node:fs/promises').then((fs) => fs.readFile(join(foreign, 'precious.txt'), 'utf8'))).toBe('do not delete')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
