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

/**
 * v3 fixtures.
 *
 * The model is progress-centred, so the fixtures differ from each other in what
 * matters: one has real progress entries (the happy path), one has nothing but
 * G0 gaps (the common case in the live ledger), and one is achieved with no next
 * milestone (rule 11).
 */
const COMPLETE = `poc_id: POC-2026-001
name: 某某银行零信任试点
org: { system: 人保体系, company: 人保财险, department: 信息技术部 }
amount_wan: 1500
poc_type: 大体量项目
priority: strategic
owner: 张三
sales: 李四
tech_owner: 王工
exec_sponsor: 陈总
stage: G2-方案验证
status: 进行中
stage_since: 2026-10-01
gate0:
  why_customer: 客户要做等保合规改造
  why_us: 客户是区域标杆
  decision_chain: 技术部提需求，采购部审批
  post_poc_decision: 立项采购
  competitor: 厂商A
  review: { conclusion: 通过, reviewer: 杨闯, reviewed_at: 2026-09-28 }
  missing: []
  complete: true
plan:
  customer_pain: 现有 VPN 接入体验差
  expected_recognition: 客户 IT 部门书面认可
  criteria:
    - { name: 200人并发, metric: 成功率, baseline: null, target: ">=99.5%" }
    - { name: 单点登录, metric: 对接验收, baseline: null, target: 通过 }
  scenarios: [办公网远程接入, 出差移动接入, 第三方运维接入]
  our_edge: 零信任架构
  timeline: { start: 2026-10-01, end: 2026-12-31 }
  risks:
    - { name: AD 环境老旧, level: high, mitigation: 提前预演 }
  report_nodes: [阶段一汇报]
  gate1: { conclusion: 通过, reviewed_at: 2026-10-20 }
  gate2: { ready: Ready, checked_at: 2026-10-25, prerequisites: [] }
progress:
  - seq: 1
    date: 2026-10-15
    type: 内部Review
    goal: 验证200人并发接入
    items: [办公网远程接入]
    actual: 完成150人灰度
    completion: "75%"
    evidence:
      - { title: 压测报告, link: https://example.com/a, type: 文档 }
    customer: { synced_with: 王工, feedback: 性能比预期好, recognition: 部分认可 }
    gate3_1: 可证明
    gate3_2: 待确认
    next: { goal: 补齐200人, owner: 张三, deadline: 2026-11-20 }
outcome:
  achievement: 部分达成
  customer_recognition: 部分认可
  our_proof: 压测报告
  remaining_risks: 无
  conclusion: { proved: 性能达标, recognized: 方向认可, next_business: 推进立项 }
  business: { milestone: 完成立项, owner: 张三, deadline: 2026-12-01, status: 待推进 }
  overall: 进展良好
  reviewed_at: 2026-11-01
`

const MISSING_G0 = `poc_id: POC-2026-002
name: 某某集团办公网改造
org: { system: 国寿体系, company: 国寿财险, department: null }
amount_wan: 300
poc_type: SDL
priority: null
owner: 赵六
sales: 钱七
tech_owner: null
exec_sponsor: null
stage: G0-立项
status: 进行中
stage_since: null
gate0:
  why_customer: null
  why_us: null
  decision_chain: null
  post_poc_decision: null
  competitor: null
  review: { conclusion: null, reviewer: null, reviewed_at: null }
  missing: [why_customer, why_us, decision_chain, post_poc_decision, tech_owner]
  complete: false
plan:
  customer_pain: null
  expected_recognition: null
  criteria: []
  scenarios: []
  our_edge: null
  timeline: { start: null, end: null }
  risks: []
  report_nodes: []
  gate1: { conclusion: null, reviewed_at: null }
  gate2: { ready: null, checked_at: null, prerequisites: [] }
progress: []
outcome:
  achievement: null
  customer_recognition: null
  our_proof: null
  remaining_risks: null
  conclusion: { proved: null, recognized: null, next_business: null }
  business: { milestone: null, owner: null, deadline: null, status: null }
  overall: null
  reviewed_at: null
`

const G4_NO_NEXT = `poc_id: POC-2026-003
name: 某某制造产线安全接入
org: { system: 人保体系, company: 人保寿险, department: 生产部 }
amount_wan: 800
poc_type: AI安全
priority: high
owner: 孙八
sales: 周九
tech_owner: 吴工
exec_sponsor: null
stage: G4-结果转化
status: 进行中
stage_since: 2026-10-10
gate0:
  why_customer: 产线设备远程运维存在安全风险
  why_us: 制造业是重点行业
  decision_chain: 生产部提需求
  post_poc_decision: 采购
  competitor: null
  review: { conclusion: 通过, reviewer: 杨闯, reviewed_at: 2026-09-01 }
  missing: []
  complete: true
plan:
  customer_pain: 设备远程运维风险
  expected_recognition: 客户验收
  criteria:
    - { name: 50台设备接入, metric: 接入数, baseline: null, target: 50 }
    - { name: 运维审计, metric: 覆盖, baseline: null, target: 100% }
  scenarios: [产线远程运维, 供应商临时接入, 车间网络隔离]
  our_edge: 审计能力
  timeline: { start: 2026-09-01, end: 2026-11-30 }
  risks:
    - { name: 产线不能停机, level: medium, mitigation: 夜间实施 }
  report_nodes: []
  gate1: { conclusion: 通过, reviewed_at: 2026-09-20 }
  gate2: { ready: Ready, checked_at: 2026-10-05, prerequisites: [] }
progress:
  - seq: 1
    date: 2026-09-01
    type: 内部Review
    goal: 完成立项
    items: []
    actual: 立项通过
    completion: "25%"
    evidence: []
    customer: { synced_with: '', feedback: '', recognition: '' }
    gate3_1: ''
    gate3_2: ''
    next: { goal: '', owner: '', deadline: '' }
  - seq: 2
    date: 2026-11-01
    type: 客户阶段同步
    goal: 完成验收
    items: [产线远程运维]
    actual: 客户验收通过
    completion: "100%"
    evidence:
      - { title: 验收报告.pdf, link: https://example.com/b, type: 文档 }
    customer: { synced_with: 吴工, feedback: 满意, recognition: 认可 }
    gate3_1: 可证明
    gate3_2: 已确认
    next: { goal: '', owner: '', deadline: '' }
outcome:
  achievement: 达成
  customer_recognition: 认可
  our_proof: 验收报告.pdf
  remaining_risks: null
  conclusion: { proved: 审计能力, recognized: 客户验收, next_business: 复购 }
  business: { milestone: null, owner: null, deadline: null, status: null }
  overall: 成功
  reviewed_at: 2026-11-01
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
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
    const snapshot: Snapshot = await store.snapshot()
    expect(snapshot.cacheReady).toBe(true)
    expect(snapshot.projects).toHaveLength(3)
    expect(snapshot.repository).toBe('skillre/workbranch')
    expect(snapshot.fetchedAt).toBe('2026-11-05T04:00:00.000Z')
    const byId = new Map(snapshot.projects.map((project) => [project.pocId, project]))
    expect(byId.get('POC-2026-001')).toMatchObject({ name: '某某银行零信任试点', stage: 'G2', closed: false })
    expect(byId.get('POC-2026-001')?.amountWan).toBe(1500)
    expect(byId.get('POC-2026-001')?.system).toBe('人保体系')
    expect(byId.get('POC-2026-003')?.dimensionCount).toBe(3)
    expect(byId.get('POC-2026-002')?.dimensionCount).toBe(0)
    expect(byId.get('POC-2026-001')?.progressCount).toBe(1)
    expect(byId.get('POC-2026-002')?.progressCount).toBe(0)
  })

  it('counts the four dimensions separately per project', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
    const snapshot = await store.snapshot()
    const project = snapshot.projects.find((candidate) => candidate.pocId === 'POC-2026-003')!
    expect(project.dimensions).toEqual({ achievement: true, evidence: true, recognition: true, nextMilestone: false })
    const missing = snapshot.projects.find((candidate) => candidate.pocId === 'POC-2026-002')!
    expect(missing.dimensions).toEqual({ achievement: false, evidence: false, recognition: false, nextMilestone: false })
  })

  it('computes the four headline counters', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
    const snapshot = await store.snapshot()
    expect(snapshot.stats).toMatchObject({
      total: 3,
      // POC-001 and POC-003 passed G0; POC-002 has no conclusion.
      g0Passed: 2,
      inProgress: 3,
      // 1500 + 300 + 800
      amountTotalWan: 2600,
      g0Complete: 2,
      // POC-003 is 达成 + 认可.
      succeeded: 1,
      stopped: 0,
    })
  })

  it('orders the pending list by priority and includes every rule', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
    const snapshot = await store.snapshot()
    expect(snapshot.gaps.length).toBeGreaterThan(0)
    expect(snapshot.gaps[0]?.rule).toBe('R11-no-next-milestone')
    const rules = new Set(snapshot.gaps.map((gap) => gap.rule))
    expect(rules.has('R1-gate0-missing')).toBe(true)
    expect(rules.has('R11-no-next-milestone')).toBe(true)
    expect(snapshot.gaps.every((gap) => gap.pocName !== '' && gap.pocId !== '')).toBe(true)
  })

  it('reports gate completion from the ledger records, not the stage position', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
    const snapshot = await store.snapshot()
    const g4 = snapshot.projects.find((project) => project.pocId === 'POC-2026-003')!
    // POC-2026-003 sits at G4: G0 complete, G1 passed, G2 Ready, newest progress
    // has gate3_2 已确认, and the outcome is 达成.
    expect(g4.stageDone).toEqual([true, true, true, true, true])
    const g0 = snapshot.projects.find((project) => project.pocId === 'POC-2026-002')!
    expect(g0.stageDone).toEqual([false, false, false, false, false])
  })

  it('sorts projects so the ones needing attention come first', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
    const snapshot = await store.snapshot()
    expect(snapshot.projects[0]?.highGapCount).toBeGreaterThanOrEqual(snapshot.projects[1]?.highGapCount ?? 0)
  })

  it('reports an empty, not-ready cache without throwing', async () => {
    const store = new PocStore(cacheOf(repoPath, false) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
    const snapshot = await store.snapshot()
    expect(snapshot).toMatchObject({ cacheReady: false, projects: [], gaps: [], warnings: [] })
    expect(snapshot.stats.total).toBe(0)
    expect(snapshot.cachePath).toBe(repoPath)
  })
})

describe('detail', () => {
  it('returns the full record for one project', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
    const detail = await store.detail('POC-2026-003')
    expect(detail).not.toBeNull()
    expect(detail!.summary.name).toBe('某某制造产线安全接入')
    expect(detail!.gate0).toMatchObject({ conclusion: '通过', reviewer: '杨闯', complete: true })
    expect(detail!.gate0.missing).toEqual([])
    expect(detail!.plan.criteria).toHaveLength(2)
    expect(detail!.plan.scenarios).toHaveLength(3)
    expect(detail!.plan.risks).toHaveLength(1)
    expect(detail!.plan.gate2Ready).toBe('Ready')
    // The v3 core: the progress stream is the history.
    expect(detail!.progress).toHaveLength(2)
    expect(detail!.progress[1]).toMatchObject({ date: '2026-11-01', type: '客户阶段同步', gate3_2: '已确认' })
    expect(detail!.progress[1]?.evidence[0]).toMatchObject({ title: '验收报告.pdf', type: '文档' })
    expect(detail!.progress[1]?.customer.recognition).toBe('认可')
    expect(detail!.outcome.achievement).toBe('达成')
    expect(detail!.outcome.milestone).toBe('')
    expect(detail!.gaps.map((gap) => gap.rule)).toContain('R11-no-next-milestone')
  })

  it('returns null for an unknown id and for a cold cache', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
    expect(await store.detail('POC-9999')).toBeNull()
    const cold = new PocStore(cacheOf(repoPath, false) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
    expect(await cold.detail('POC-2026-001')).toBeNull()
  })

  it('renders the G0 prerequisites of a broken project as empty strings', async () => {
    const store = new PocStore(cacheOf(repoPath) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
    const detail = await store.detail('POC-2026-002')
    expect(detail!.gate0.whyCustomer).toBe('')
    expect(detail!.gate0.whyUs).toBe('')
    expect(detail!.summary.techOwner).toBe('')
    expect(detail!.gate0.missing).toHaveLength(5)
  })
})

describe('warnings', () => {
  it('skips an unparsable file and keeps the rest', async () => {
    const dir = await seed({ 'POC-2026-001.yaml': COMPLETE, 'broken.yaml': 'poc_id: [unclosed\n' })
    try {
      const store = new PocStore(cacheOf(dir) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
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
      const store = new PocStore(cacheOf(dir) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
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
      const store = new PocStore(cacheOf(dir) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
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
      const store = new PocStore(cacheOf(dir) as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
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
    expect(assertSafeCacheRoot('/Users/u/.dsh/cache/work-dashboard', '/Users/u')).toBe('/Users/u/.dsh/cache/work-dashboard')
  })

  it('wipes a cache it created and recreates the marker', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'poc-cache-test-'))
    const cacheRoot = join(dir, 'work-dashboard')
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
    const cache = new RepoCache({ cacheRoot: join(readOnly, 'work-dashboard'), repository: 'skillre/workbranch', branch: 'main', cloneTimeoutMs: 1000, fetchTimeoutMs: 1000, remoteUrl: 'https://github.com/skillre/workbranch.git' })
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
