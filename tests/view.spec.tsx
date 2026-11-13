// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { WorkDashboardPage } from '../src/client/shell.jsx'
import type { ClientApi } from '../src/client/api.js'
import type { ClientLocaleLike } from '../src/client/contracts.js'
import { dictFor, format } from '../src/client/text.js'
import type { PocRecord, PortfolioAnalysis, ProgressView, ProjectDetail, ProjectSummary, Snapshot } from '../src/types.js'

/**
 * Console page tests.
 *
 * These cover the acceptance criteria a screenshot cannot prove cheaply: the
 * empty state before any pull, the four dimensions rendered as four separate
 * cells, the G0→G4 rail, the pending ordering, the detail page, the settings
 * persistence, and the timer cadence (including that it stops on unmount).
 */

/**
 * Make sure this file really has a working `localStorage`.
 *
 * Node 26 defines its own experimental `globalThis.localStorage`, and vitest's
 * jsdom environment only copies a window property onto the global object when
 * that name is *not* already present there. So on Node 26 the real Storage
 * object never arrives: the runtime's stub (which is unusable without
 * `--localstorage-file`) shadows it, `browserStorage()` correctly reports
 * "unavailable", and every assertion in this file fails — while the identical
 * code passes on Node 22 and 24. The `jsdom` instance vitest exposes owns a
 * real Storage, so install that one whenever the global is not usable, which
 * keeps this suite meaningful on every supported Node line instead of skipping
 * the storage assertions on the newest one.
 */
beforeAll(() => {
  const usable = (candidate: unknown): boolean => {
    try {
      const storage = candidate as Storage
      storage.setItem('__storage-probe__', '1')
      const roundTripped = storage.getItem('__storage-probe__') === '1'
      storage.removeItem('__storage-probe__')
      return roundTripped
    } catch {
      return false
    }
  }

  if (usable(globalThis.localStorage)) return
  const storage = (globalThis as { jsdom?: { window: Window } }).jsdom?.window.localStorage
  if (storage === undefined) {
    throw new Error(
      'This suite needs a working localStorage: neither the global nor the jsdom window provides one, ' +
        'so the cadence-persistence assertions cannot be verified.',
    )
  }
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true })
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.useRealTimers()
})

/** A dictionary-backed translate function, mirroring the locale service. */
function makeTranslate(locale = 'zh') {
  const dict = dictFor(locale)
  return (key: string, params?: Record<string, string | number>) => format(dict[key] ?? key, params ?? {})
}

/** The locale service double; `active` is fixed per render. */
function makeLocale(active = 'zh'): ClientLocaleLike {
  return {
    getSnapshot: () => ({ active, locales: [{ id: 'zh' }, { id: 'en' }], revision: 1 }),
    subscribe: () => () => {},
    register: () => () => {},
    bind: () => makeTranslate(active),
  }
}

/** One v3 project summary as the Host sends it. */
function summary(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    pocId: 'POC-2026-001',
    name: '某某银行零信任试点',
    system: '人保体系',
    company: '人保财险',
    department: '信息技术部',
    pocType: '大体量项目',
    amountWan: 1500,
    priority: 'strategic',
    stageLabel: 'G2-方案验证',
    stage: 'G2',
    closed: false,
    status: '进行中',
    stageSince: '2026-10-01',
    daysInStage: 36,
    owner: '张三',
    techOwner: '王工',
    g0Conclusion: '通过',
    g0Passed: true,
    g0Complete: true,
    g0MissingCount: 0,
    stageDone: [true, true, true, false, false],
    dimensions: { achievement: true, evidence: true, recognition: false, nextMilestone: false },
    dimensionCount: 2,
    gapCount: 2,
    highGapCount: 2,
    progressCount: 1,
    lastProgressDate: '2026-10-15',
    lastProgressSummary: '内部Review · 完成150人灰度 · 75%',
    daysSinceProgress: 22,
    outcomeAchievement: '部分达成',
    outcomeRecognition: '部分认可',
    ...overrides,
  }
}

/** The portfolio analysis the band renders, derived from the same three projects. */
function analysis(): PortfolioAnalysis {
  return {
    stages: [
      { key: 'G0', count: 1, amountWan: 300, highGapCount: 1 },
      { key: 'G1', count: 0, amountWan: 0, highGapCount: 0 },
      { key: 'G2', count: 1, amountWan: 1500, highGapCount: 2 },
      { key: 'G3', count: 0, amountWan: 0, highGapCount: 0 },
      { key: 'G4', count: 1, amountWan: 800, highGapCount: 1 },
      { key: 'closed', count: 0, amountWan: 0, highGapCount: 0 },
      { key: 'unknown', count: 0, amountWan: 0, highGapCount: 0 },
    ],
    orgs: [
      { system: '人保体系', company: '人保财险', count: 1, amountWan: 1500, highGapCount: 1 },
      { system: '人保体系', company: '人保寿险', count: 1, amountWan: 800, highGapCount: 1 },
      { system: '国寿体系', company: '国寿财险', count: 1, amountWan: 300, highGapCount: 1 },
    ],
    types: [
      { pocType: '大体量项目', count: 1, amountWan: 1500 },
      { pocType: 'SDL', count: 1, amountWan: 300 },
      { pocType: 'AI安全', count: 1, amountWan: 800 },
    ],
    topAmounts: [
      { pocId: 'POC-2026-001', pocName: '某某银行零信任试点', amountWan: 1500, share: 1500 / 2600, stage: 'G2', closed: false },
      { pocId: 'POC-2026-003', pocName: '某某制造产线安全接入', amountWan: 800, share: 800 / 2600, stage: 'G4', closed: false },
      { pocId: 'POC-2026-002', pocName: '某某集团办公网改造', amountWan: 300, share: 300 / 2600, stage: 'G0', closed: false },
    ],
    dimensions: [
      { key: 'achievement', present: 2, missing: 1, ratio: 2 / 3 },
      { key: 'evidence', present: 2, missing: 1, ratio: 2 / 3 },
      { key: 'recognition', present: 2, missing: 1, ratio: 2 / 3 },
      { key: 'nextMilestone', present: 1, missing: 2, ratio: 1 / 3 },
    ],
    gapRules: [
      { rule: 'R1-gate0-missing', ruleNo: 1, level: 'high', count: 1 },
      { rule: 'R11-no-next-milestone', ruleNo: 11, level: 'high', count: 1 },
    ],
    concentration: 1500 / 2600,
    amountMissing: 0,
    withProgress: 2,
    lastActivity: '2026-11-01',
  }
}

/** A v3 snapshot with three projects and a couple of gaps. */
function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  const projects: ProjectSummary[] = [
    summary(),
    summary({
      pocId: 'POC-2026-002', name: '某某集团办公网改造', system: '国寿体系', company: '国寿财险',
      stageLabel: 'G0-立项', stage: 'G0', amountWan: 300, pocType: 'SDL',
      stageDone: [false, false, false, false, false],
      g0Conclusion: '', g0Passed: false, g0Complete: false, g0MissingCount: 5,
      dimensions: { achievement: false, evidence: false, recognition: false, nextMilestone: false },
      dimensionCount: 0, gapCount: 3, highGapCount: 3,
      progressCount: 0, lastProgressDate: null, lastProgressSummary: '', daysSinceProgress: null,
      outcomeAchievement: '', outcomeRecognition: '',
    }),
    summary({
      pocId: 'POC-2026-003', name: '某某制造产线安全接入', system: '人保体系', company: '人保寿险',
      stageLabel: 'G4-结果转化', stage: 'G4', amountWan: 800, pocType: 'AI安全',
      stageDone: [true, true, true, true, true],
      dimensions: { achievement: true, evidence: true, recognition: true, nextMilestone: false },
      dimensionCount: 3, gapCount: 1, highGapCount: 1,
      progressCount: 2, lastProgressDate: '2026-11-01', lastProgressSummary: '客户阶段同步 · 客户验收通过 · 100%',
      outcomeAchievement: '达成', outcomeRecognition: '认可',
    }),
  ]
  return {
    cacheReady: true,
    repository: 'skillre/workbranch',
    fetchedAt: '2026-11-05T04:00:00.000Z',
    cachePath: '/Users/u/.dsh/cache/work-dashboard/repo',
    projects,
    stats: { total: 3, g0Passed: 2, inProgress: 3, amountTotalWan: 2600, g0Complete: 2, awaitingCustomer: 0, succeeded: 1, stopped: 0 },
    analysis: analysis(),
    gaps: [
      {
        rule: 'R11-no-next-milestone', ruleNo: 11, level: 'high', priority: 96,
        pocId: 'POC-2026-003', pocName: '某某制造产线安全接入', field: 'outcome.business.milestone',
      },
      {
        rule: 'R1-gate0-missing', ruleNo: 1, level: 'high', priority: 90,
        pocId: 'POC-2026-002', pocName: '某某集团办公网改造', field: 'gate0.missing',
        params: { count: 5, missing: 'why_customer,why_us,decision_chain,post_poc_decision,tech_owner' },
      },
    ],
    warnings: [],
    ...overrides,
  }
}

/** One progress entry as the Host sends it. */
function progressEntry(overrides: Partial<ProgressView> = {}): ProgressView {
  return {
    seq: 2,
    date: '2026-11-01',
    type: '客户阶段同步',
    goal: '完成验收',
    items: ['产线远程运维'],
    actual: '客户验收通过',
    completion: '100%',
    evidence: [{ title: '验收报告.pdf', link: 'https://example.com/b', type: '文档' }],
    customer: { syncedWith: '吴工', feedback: '满意', recognition: '认可' },
    gate3_1: '可证明',
    gate3_2: '已确认',
    next: { goal: '', owner: '', deadline: '' },
    ...overrides,
  }
}

/** The v3 detail record for POC-2026-003. */
function detail(): ProjectDetail {
  return {
    summary: summary({
      pocId: 'POC-2026-003', name: '某某制造产线安全接入', system: '人保体系', company: '人保寿险',
      stageLabel: 'G4-结果转化', stage: 'G4', amountWan: 800, pocType: 'AI安全',
      stageDone: [true, true, true, true, true],
      dimensions: { achievement: true, evidence: true, recognition: true, nextMilestone: false }, dimensionCount: 3,
      progressCount: 2, lastProgressDate: '2026-11-01', outcomeAchievement: '达成', outcomeRecognition: '认可',
    }),
    org: { system: '人保体系', company: '人保寿险', department: '生产部' },
    sales: '周九',
    execSponsor: '',
    gate0: {
      whyCustomer: '产线设备远程运维存在安全风险',
      whyUs: '制造业是重点行业',
      decisionChain: '生产部提需求',
      postPocDecision: '采购',
      competitor: '',
      conclusion: '通过',
      reviewer: '杨闯',
      reviewedAt: '2026-09-01',
      missing: [],
      complete: true,
      checklist: [
        { field: 'why_customer', present: true, value: '产线设备远程运维存在安全风险' },
        { field: 'why_us', present: true, value: '制造业是重点行业' },
        { field: 'decision_chain', present: true, value: '生产部提需求' },
        { field: 'post_poc_decision', present: true, value: '采购' },
        { field: 'tech_owner', present: true, value: '吴工' },
      ],
    },
    plan: {
      customerPain: '设备远程运维风险',
      expectedRecognition: '客户验收',
      criteria: [{ name: '50 台设备接入', metric: '接入成功率', baseline: '', target: '100%' }],
      scenarios: ['产线设备远程运维', '供应商临时接入'],
      ourEdge: '审计能力',
      timelineStart: '2026-09-01',
      timelineEnd: '2026-11-30',
      risks: [{ name: '产线不能停机', level: 'medium', mitigation: '分批次夜间实施' }],
      reportNodes: [],
      gate1Conclusion: '通过',
      gate2Ready: 'Ready',
    },
    progress: [
      progressEntry({ seq: 1, date: '2026-09-01', type: '内部Review', goal: '完成立项', actual: '立项通过', completion: '25%', evidence: [], customer: { syncedWith: '', feedback: '', recognition: '' }, gate3_1: '', gate3_2: '' }),
      progressEntry(),
    ],
    outcome: {
      achievement: '达成',
      customerRecognition: '认可',
      ourProof: '验收报告.pdf',
      remainingRisks: '',
      proved: '审计能力',
      recognized: '客户验收',
      nextBusiness: '复购',
      milestone: '',
      businessOwner: '',
      businessDeadline: '',
      businessStatus: '',
      overall: '成功',
      reviewedAt: '2026-11-01',
    },
    gaps: [{ rule: 'R11-no-next-milestone', ruleNo: 11, level: 'high', priority: 96, pocId: 'POC-2026-003', pocName: '某某制造产线安全接入', field: 'outcome.business.milestone' }],
  }
}

/** An API double whose refresh behaviour each test decides. */
function makeApi(options: {
  initial?: Snapshot
  refreshed?: Snapshot
  detailRecord?: ProjectDetail
  failRefresh?: string
} = {}): ClientApi & { refreshCalls: number } {
  const api = {
    refreshCalls: 0,
    async list() {
      return options.initial ?? snapshot()
    },
    async refresh() {
      api.refreshCalls += 1
      if (options.failRefresh !== undefined) {
        const { ActionError } = await import('../src/client/api.js')
        throw new ActionError('work-dashboard/network', options.failRefresh, {})
      }
      return {
        snapshot: options.refreshed ?? options.initial ?? snapshot(),
        outcome: { mode: 'clone' as const, durationMs: 3000, finishedAt: '2026-11-05T04:00:00.000Z' },
      }
    },
    async detail(pocId: string) {
      const record = options.detailRecord ?? detail()
      // An unknown id is a real Host error and must still be testable; any id
      // the snapshot knows is served by adapting the record's identity, so a
      // test can open whichever project the current sort happens to put first.
      if (pocId !== record.summary.pocId) {
        const known = (options.initial ?? snapshot()).projects.some((project) => project.pocId === pocId)
        if (!known) {
          const { ActionError } = await import('../src/client/api.js')
          throw new ActionError('work-dashboard/unknown-project', `No project with poc_id ${pocId}.`, {})
        }
        const target = (options.initial ?? snapshot()).projects.find((project) => project.pocId === pocId)!
        return { ...record, summary: { ...record.summary, ...target } }
      }
      return record
    },
    async risks() {
      return {
        rows: [
          { pocId: 'POC-2026-003', pocName: '某某制造产线安全接入', stage: 'G4' as const, level: 'high', rank: 3, name: '产线不能停机', mitigation: '分批次夜间实施', gapCount: 1, highGapCount: 1 },
          { pocId: 'POC-2026-001', pocName: '某某银行零信任试点', stage: 'G2' as const, level: 'medium', rank: 2, name: '客户决策链长', mitigation: '同步推进', gapCount: 2, highGapCount: 2 },
          { pocId: 'POC-2026-001', pocName: '某某银行零信任试点', stage: 'G2' as const, level: '', rank: 0, name: '未评级的风险', mitigation: '', gapCount: 2, highGapCount: 2 },
        ],
        counts: { high: 1, medium: 1, low: 0, unset: 1, total: 3 },
        projectsWithRisks: 2,
        projectsTotal: 3,
      }
    },
    async timeline() {
      return {
        entries: [
          { pocId: 'POC-2026-003', pocName: '某某制造产线安全接入', stage: 'G4' as const, date: '2026-11-01', round: 3, goal: '完成验收', actual: '客户验收通过', evidence: '验收报告.pdf', customerFeedback: '高度认可', recognitionScope: '正式验收' },
          { pocId: 'POC-2026-001', pocName: '某某银行零信任试点', stage: 'G2' as const, date: '2026-10-28', round: 2, goal: '完成方案设计', actual: '完成', evidence: '', customerFeedback: '', recognitionScope: '无' },
        ],
        range: { from: '2026-10-28', to: '2026-11-01' },
        months: [{ month: '2026-11', count: 1 }, { month: '2026-10', count: 1 }],
        silentProjects: [{ pocId: 'POC-2026-002', pocName: '某某集团办公网改造' }],
      }
    },
  }
  return api as unknown as ClientApi & { refreshCalls: number }
}

/** Render the page and wait for the initial load to settle. */
async function renderPage(api: ClientApi, locale = makeLocale()) {
  const t = makeTranslate(locale.getSnapshot().active)
  render(<WorkDashboardPage api={api} locale={locale} t={t} />)
  await waitFor(() => {
    if (screen.queryByText('加载中…') !== null) throw new Error('still loading')
  })
  return { t }
}

describe('empty state', () => {
  it('shows "no data yet" with a refresh call to action on a cold cache', async () => {
    const api = makeApi({ initial: snapshot({ cacheReady: false, projects: [], stats: { total: 0, g0Passed: 0, inProgress: 0, amountTotalWan: 0, g0Complete: 0, awaitingCustomer: 0, succeeded: 0, stopped: 0 }, gaps: [] }) })
    await renderPage(api)
    expect(screen.getByText('还没有数据')).toBeTruthy()
    expect(screen.getByText('点【刷新】从 GitHub 拉取 POC 台账')).toBeTruthy()
    expect(screen.getByRole('button', { name: '立即刷新' })).toBeTruthy()
    // The data source and cache path are disclosed, not hidden.
    expect(screen.getAllByText(/github\.com\/skillre\/workbranch/).length).toBeGreaterThan(0)
  })

  it('does not pull data on its own: the empty state makes no refresh call', async () => {
    const api = makeApi({ initial: snapshot({ cacheReady: false, projects: [], gaps: [], stats: { total: 0, g0Passed: 0, inProgress: 0, amountTotalWan: 0, g0Complete: 0, awaitingCustomer: 0, succeeded: 0, stopped: 0 } }) })
    await renderPage(api)
    expect(api.refreshCalls).toBe(0)
  })

  it('pulls when the empty-state button is pressed, then shows the board', async () => {
    const api = makeApi({
      initial: snapshot({ cacheReady: false, projects: [], gaps: [], stats: { total: 0, g0Passed: 0, inProgress: 0, amountTotalWan: 0, g0Complete: 0, awaitingCustomer: 0, succeeded: 0, stopped: 0 } }),
      refreshed: snapshot(),
    })
    await renderPage(api)
    fireEvent.click(screen.getByRole('button', { name: '立即刷新' }))
    await waitFor(() => expect(screen.getByText('项目总览')).toBeTruthy())
    expect(api.refreshCalls).toBe(1)
  })
})

describe('overview page', () => {
  it('renders the portfolio band instead of a flat stat strip', async () => {
    await renderPage(makeApi())
    // The band is the answer to "where does the money and the risk sit": six
    // figures, each a chart rather than a number in a box.
    expect(document.querySelectorAll('.chart-block').length).toBeGreaterThanOrEqual(6)
    expect(screen.getAllByText('组合视图').length).toBeGreaterThan(0)
    expect(screen.getAllByText('阶段分布').length).toBeGreaterThan(0)
    expect(screen.getAllByText('体系 / 公司').length).toBeGreaterThan(0)
    expect(screen.getAllByText('金额集中度').length).toBeGreaterThan(0)
    expect(screen.getAllByText('四维覆盖').length).toBeGreaterThan(0)
  })

  it('renders four radial coverage meters, one per dimension', async () => {
    await renderPage(makeApi())
    const meters = document.querySelectorAll('.radial')
    expect(meters).toHaveLength(4)
    expect([...meters].map((meter) => meter.getAttribute('aria-label')?.slice(0, 2))).toEqual(['目标', '证据', '客户', '下一'])
  })

  it('defaults to the card view and shows one card per project', async () => {
    await renderPage(makeApi())
    // Cards are the default: they answer "what needs me" better than rows.
    expect(document.querySelectorAll('.pcard').length).toBe(3)
    expect([...document.querySelectorAll('.pcard-name')].map((node) => node.textContent)).toContain('某某银行零信任试点')
    expect([...document.querySelectorAll('.pcard-name')].map((node) => node.textContent)).toContain('某某集团办公网改造')
  })

  it('switches to the board view with one column per stage', async () => {
    await renderPage(makeApi())
    fireEvent.click(screen.getByRole('button', { name: '看板' }))
    await waitFor(() => expect(document.querySelectorAll('.pboard-column').length).toBeGreaterThanOrEqual(5))
    // Each project lands in exactly one column, so the board total is the list.
    expect(document.querySelectorAll('.pboard-card').length).toBe(3)
  })

  it('switches to the table view with the seven spec columns', async () => {
    await renderPage(makeApi())
    fireEvent.click(screen.getByRole('button', { name: '表格' }))
    await waitFor(() => expect(document.querySelectorAll('.project-row').length).toBe(3))
    const headers = [...document.querySelectorAll('.table-head th')].map((cell) => cell.textContent?.replace(/[↑↓]/g, '').trim())
    expect(headers).toEqual(['项目', '体系/公司', '阶段', '金额', '最新进展', '缺口', '操作'])
  })

  it('filters by search text across name, id and owner', async () => {
    await renderPage(makeApi())
    const box = screen.getByRole('searchbox') as HTMLInputElement
    fireEvent.change(box, { target: { value: '制造' } })
    await waitFor(() => expect(document.querySelectorAll('.pcard').length).toBe(1))
    expect([...document.querySelectorAll('.pcard-name')].map((node) => node.textContent)).toEqual(['某某制造产线安全接入'])
    fireEvent.change(box, { target: { value: 'POC-2026-002' } })
    await waitFor(() => expect(document.querySelectorAll('.pcard').length).toBe(1))
    expect([...document.querySelectorAll('.pcard-name')].map((node) => node.textContent)).toEqual(['某某集团办公网改造'])
  })

  it('filters by a stage chip and clears it again', async () => {
    await renderPage(makeApi())
    const chip = [...document.querySelectorAll('.filter-chip')].find((node) => node.textContent?.includes('G2 方案验证'))
    expect(chip).toBeTruthy()
    fireEvent.click(chip!)
    await waitFor(() => expect(document.querySelectorAll('.pcard').length).toBe(1))
    fireEvent.click(chip!)
    await waitFor(() => expect(document.querySelectorAll('.pcard').length).toBe(3))
  })

  it('shows an explicit empty state when the filters match nothing', async () => {
    await renderPage(makeApi())
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz-no-such-project' } })
    await waitFor(() => expect(screen.getByText('没有符合条件的项目')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /清除筛选/ }))
    await waitFor(() => expect(document.querySelectorAll('.pcard').length).toBe(3))
  })

  it('moves the keyboard cursor with the arrow keys and opens with Enter', async () => {
    await renderPage(makeApi())
    const shell = document.querySelector('.wd-shell') as HTMLElement
    fireEvent.keyDown(shell, { key: 'ArrowDown' })
    await waitFor(() => expect(document.querySelectorAll('.pcard[data-selected="true"]').length).toBe(1))
    fireEvent.keyDown(shell, { key: 'Enter' })
    await waitFor(() => expect(document.querySelectorAll('.dt-rail').length).toBe(1))
  })

  it('shows the latest progress of the newest entry', async () => {
    await renderPage(makeApi())
    expect(screen.getAllByText(/客户阶段同步/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/还没有进展/).length).toBeGreaterThan(0)
  })

  it('groups the pending rail by rule', async () => {
    await renderPage(makeApi())
    expect(screen.getByText('待处理')).toBeTruthy()
    // R11 (priority 96) sorts before R1 (priority 90).
    const groups = [...document.querySelectorAll('.pending-group')]
    expect(groups.length).toBeGreaterThanOrEqual(2)
    expect(groups[0]?.textContent).toContain('已达成但无下一步里程碑')
    expect(groups[1]?.textContent).toContain('G0 必填未齐')
    expect(groups[0]?.getAttribute('data-level')).toBe('high')
  })

  it('shows the refresh timestamp once data exists', async () => {
    await renderPage(makeApi())
    expect(screen.getAllByText(/已刷新/).length).toBeGreaterThan(0)
  })
})

describe('refresh', () => {
  it('pulls on the header button and adopts the new snapshot', async () => {
    const initial = snapshot({ fetchedAt: null })
    const api = makeApi({ initial, refreshed: snapshot({ fetchedAt: '2026-11-05T05:00:00.000Z' }) })
    await renderPage(api)
    fireEvent.click(screen.getByRole('button', { name: '刷新' }))
    await waitFor(() => expect(api.refreshCalls).toBe(1))
    await waitFor(() => expect(screen.getByText('项目总览')).toBeTruthy())
  })

  it('shows a clear failure reason and a retry button when a pull fails', async () => {
    const api = makeApi({ initial: snapshot({ cacheReady: false, projects: [], gaps: [], stats: { total: 0, g0Passed: 0, inProgress: 0, amountTotalWan: 0, g0Complete: 0, awaitingCustomer: 0, succeeded: 0, stopped: 0 } }), failRefresh: '无法连接 github.com' })
    await renderPage(api)
    fireEvent.click(screen.getByRole('button', { name: '立即刷新' }))
    await waitFor(() => expect(screen.getByText(/拉取失败/)).toBeTruthy())
    // The dictionary maps the Host's stable code to localized copy.
    expect(screen.getAllByText(/无法连接 github\.com/).length).toBeGreaterThan(0)
    const retry = screen.getByRole('button', { name: '重试' })
    expect(retry).toBeTruthy()
    fireEvent.click(retry)
    await waitFor(() => expect(api.refreshCalls).toBe(2))
  })

  it('does not stack two concurrent pulls', async () => {
    const gate: { release: (() => void) | null } = { release: null }
    const api = {
      async list() { return snapshot() },
      async refresh() {
        api.calls += 1
        await new Promise<void>((resolve) => { gate.release = resolve })
        return { snapshot: snapshot(), outcome: { mode: 'clone' as const, durationMs: 1, finishedAt: '2026-11-05T04:00:00.000Z' } }
      },
      async detail() { return detail() },
      calls: 0,
    } as unknown as ClientApi & { calls: number }
    await renderPage(api)
    const button = screen.getByRole('button', { name: '刷新' })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)
    expect(api.calls).toBe(1)
    gate.release?.()
    await waitFor(() => expect(api.calls).toBe(1))
  })
})

describe('refresh settings', () => {
  it('offers the four documented cadences and defaults to manual only', async () => {
    await renderPage(makeApi())
    fireEvent.click(screen.getByRole('button', { name: '刷新设置' }))
    const dialog = screen.getByRole('dialog', { name: '刷新设置' })
    expect(within(dialog).getByText('关闭（仅手动）')).toBeTruthy()
    expect(within(dialog).getByText('每 10 分钟')).toBeTruthy()
    expect(within(dialog).getByText('每 1 小时')).toBeTruthy()
    expect(within(dialog).getByText('自定义')).toBeTruthy()
    const checked = within(dialog).getAllByRole('radio').find((radio) => (radio as HTMLInputElement).checked)
    expect((checked as HTMLInputElement).value).toBe('off')
  })

  it('persists the chosen cadence to localStorage', async () => {
    await renderPage(makeApi())
    fireEvent.click(screen.getByRole('button', { name: '刷新设置' }))
    const dialog = screen.getByRole('dialog', { name: '刷新设置' })
    fireEvent.click(within(dialog).getByText('每 10 分钟'))
    fireEvent.click(within(dialog).getByRole('button', { name: '保存' }))
    expect(localStorage.getItem('work-dashboard.refreshInterval')).toBe('10m')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('validates a custom minute count and rejects an out-of-range value', async () => {
    await renderPage(makeApi())
    fireEvent.click(screen.getByRole('button', { name: '刷新设置' }))
    const dialog = screen.getByRole('dialog', { name: '刷新设置' })
    fireEvent.click(within(dialog).getByText('自定义'))
    const input = within(dialog).getByRole('spinbutton') as HTMLInputElement
    fireEvent.change(input, { target: { value: '0' } })
    expect(within(dialog).getByText(/请输入 1–1440 之间的整数分钟数/)).toBeTruthy()
    expect((within(dialog).getByRole('button', { name: '保存' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(input, { target: { value: '30' } })
    fireEvent.click(within(dialog).getByRole('button', { name: '保存' }))
    expect(localStorage.getItem('work-dashboard.refreshInterval')).toBe('custom')
    expect(localStorage.getItem('work-dashboard.customMinutes')).toBe('30')
  })

  it('restores the stored cadence on the next mount', async () => {
    localStorage.setItem('work-dashboard.refreshInterval', 'custom')
    localStorage.setItem('work-dashboard.customMinutes', '45')
    await renderPage(makeApi())
    fireEvent.click(screen.getByRole('button', { name: '刷新设置' }))
    const dialog = screen.getByRole('dialog', { name: '刷新设置' })
    const checked = within(dialog).getAllByRole('radio').find((radio) => (radio as HTMLInputElement).checked)
    expect((checked as HTMLInputElement).value).toBe('custom')
    expect((within(dialog).getByRole('spinbutton') as HTMLInputElement).value).toBe('45')
  })
})

describe('the scheduled refresh', () => {
  it('fires automatically on the configured cadence', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    localStorage.setItem('work-dashboard.refreshInterval', '10m')
    const api = makeApi()
    await renderPage(api)
    // The cadence is read after mount; the timer only starts once it is known.
    await waitFor(() => expect(document.querySelector('.page-footer')?.textContent).toContain('每 10 分钟'))
    vi.advanceTimersByTime(10 * 60_000)
    await waitFor(() => expect(api.refreshCalls).toBe(1))
  })

  it('does not fire when the cadence is off', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const api = makeApi()
    await renderPage(api)
    vi.advanceTimersByTime(60 * 60_000)
    expect(api.refreshCalls).toBe(0)
  })

  it('stops the timer when the page unmounts', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    localStorage.setItem('work-dashboard.refreshInterval', '10m')
    const api = makeApi()
    await renderPage(api)
    await waitFor(() => expect(document.querySelector('.page-footer')?.textContent).toContain('每 10 分钟'))
    cleanup()
    vi.advanceTimersByTime(60 * 60_000)
    expect(api.refreshCalls).toBe(0)
  })

  it('reports a scheduled failure in the status bar without replacing the board', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    localStorage.setItem('work-dashboard.refreshInterval', '10m')
    const api = makeApi({ failRefresh: '无法连接 github.com' })
    await renderPage(api)
    await waitFor(() => expect(document.querySelector('.page-footer')?.textContent).toContain('每 10 分钟'))
    vi.advanceTimersByTime(10 * 60_000)
    await waitFor(() => expect(document.querySelector('.page-footer')?.textContent).toContain('定时刷新失败'))
    // The table is still there: a scheduled failure is a note, not a takeover.
    expect(screen.getByText('项目总览')).toBeTruthy()
  })
})

describe('detail page', () => {
  /** Open a project from the card view (the default). */
  function openProject(name: string): void {
    const card = [...document.querySelectorAll('.pcard')].find((node) => node.textContent?.includes(name))
    if (card === undefined) throw new Error(`no card for ${name}`)
    fireEvent.click(card)
  }

  it('opens from a card and shows the layered record', async () => {
    await renderPage(makeApi())
    openProject('某某制造产线安全接入')
    await waitFor(() => expect(document.querySelectorAll('.dt-rail').length).toBe(1))
    // The rail is the persistent "project file"; the stream is the reading pane.
    expect(screen.getAllByText('进展流').length).toBeGreaterThan(0)
    expect(screen.getAllByText('四维结果').length).toBeGreaterThan(0)
    expect(screen.getAllByText('G0 必填完整度').length).toBeGreaterThan(0)
    expect(screen.getAllByText('计划（G1 / G2）').length).toBeGreaterThan(0)
    expect(screen.getAllByText('结论').length).toBeGreaterThan(0)
  })

  it('shows the four dimensions as four separate summary cards', async () => {
    await renderPage(makeApi())
    openProject('某某制造产线安全接入')
    await waitFor(() => expect(document.querySelectorAll('.dim-card').length).toBe(4))
    const cards = [...document.querySelectorAll('.dim-card')]
    expect(cards.map((card) => (card as HTMLElement).dataset.present)).toEqual(['true', 'true', 'true', 'false'])
    // The origin tag distinguishes a derived dimension from a hand-filled one.
    expect(cards.map((card) => (card as HTMLElement).dataset.origin)).toEqual(['auto', 'manual', 'auto', 'manual'])
  })

  it('shows a project with nothing filled in as four missing dimensions', async () => {
    await renderPage(makeApi({
      detailRecord: {
        ...detail(),
        summary: { ...detail().summary, pocId: 'POC-2026-002', name: '某某集团办公网改造', dimensions: { achievement: false, evidence: false, recognition: false, nextMilestone: false }, dimensionCount: 0 },
        outcome: { ...detail().outcome, achievement: '', customerRecognition: '', ourProof: '', milestone: '' },
        progress: [],
      },
    }))
    openProject('某某集团办公网改造')
    await waitFor(() => expect(document.querySelectorAll('.dim-card').length).toBe(4))
    expect([...document.querySelectorAll('.dim-card')].map((card) => (card as HTMLElement).dataset.present)).toEqual(['false', 'false', 'false', 'false'])
  })

  it('renders the five G0 prerequisites as one meter, including tech_owner', async () => {
    await renderPage(makeApi())
    openProject('某某制造产线安全接入')
    await waitFor(() => expect(document.querySelectorAll('.g0-cell').length).toBe(5))
    const cells = [...document.querySelectorAll('.g0-cell')]
    expect(cells.map((cell) => (cell as HTMLElement).dataset.present)).toEqual(['true', 'true', 'true', 'true', 'true'])
    // tech_owner lives in the identity block but still counts as one of the five.
    expect(cells[4]?.textContent).toContain('客户技术责任人')
  })

  it('shows the progress stream newest-first, with evidence and recognition', async () => {
    await renderPage(makeApi())
    openProject('某某制造产线安全接入')
    await waitFor(() => expect(document.querySelectorAll('.prog-item').length).toBe(2))
    const items = [...document.querySelectorAll('.prog-item')]
    expect(items[0]?.textContent).toContain('2026/11/01')
    expect(items[0]?.textContent).toContain('验收报告.pdf')
    expect(items[0]?.textContent).toContain('认可')
    expect(items[1]?.textContent).toContain('2026/09/01')
    // A linked evidence title is a real anchor, not a dead chip.
    expect(items[0]?.querySelector('a[href="https://example.com/b"]')).not.toBeNull()
  })

  it('marks an entry with no evidence and no next step explicitly', async () => {
    await renderPage(makeApi())
    openProject('某某制造产线安全接入')
    await waitFor(() => expect(document.querySelectorAll('.prog-item').length).toBe(2))
    const oldest = [...document.querySelectorAll('.prog-item')][1]!
    expect(oldest.textContent).toContain('无证据')
    expect(oldest.textContent).toContain('没有安排下一步')
  })

  it('shows an explicit empty state when a project has no progress yet', async () => {
    // The live ledger currently has 23 projects with `progress: []`, so this is
    // the state the user will actually meet first.
    await renderPage(makeApi({
      detailRecord: {
        ...detail(),
        progress: [],
        summary: { ...detail().summary, progressCount: 0, lastProgressDate: null, lastProgressSummary: '' },
      },
    }))
    openProject('某某制造产线安全接入')
    await waitFor(() => expect(screen.getByText('还没有进展记录')).toBeTruthy())
    expect(screen.getByText('第一次进展后，这里会显示完整时间线。')).toBeTruthy()
  })

  it('returns to the overview with the back button', async () => {
    await renderPage(makeApi())
    openProject('某某制造产线安全接入')
    await waitFor(() => expect(screen.getByRole('button', { name: '← 返回' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '← 返回' }))
    await waitFor(() => expect(document.querySelectorAll('.pcard').length).toBe(3))
  })

  it('leaves the detail page with Escape', async () => {
    await renderPage(makeApi())
    openProject('某某制造产线安全接入')
    await waitFor(() => expect(document.querySelectorAll('.dt-rail').length).toBe(1))
    fireEvent.keyDown(document.querySelector('.wd-shell') as HTMLElement, { key: 'Escape' })
    await waitFor(() => expect(document.querySelectorAll('.pcard').length).toBe(3))
  })
})

describe('milestone 3 views', () => {
  it('opens the risk board with severity lanes', async () => {
    await renderPage(makeApi())
    const header = document.querySelector('.header-actions') as HTMLElement
    fireEvent.click(within(header).getByText('风险看板'))
    await waitFor(() => expect(document.querySelectorAll('.risk-row').length).toBe(3))
    // The board is grouped into lanes, so severity reads as a shape not a sort.
    const lanes = [...document.querySelectorAll('.risk-lane')]
    expect(lanes.length).toBeGreaterThanOrEqual(2)
    expect(lanes[0]?.textContent).toContain('高')
    const rows = [...document.querySelectorAll('.risk-row')]
    expect(rows[0]?.textContent).toContain('某某制造产线安全接入')
  })

  it('shows the risk severity distribution figure', async () => {
    await renderPage(makeApi())
    const header = document.querySelector('.header-actions') as HTMLElement
    fireEvent.click(within(header).getByText('风险看板'))
    await waitFor(() => expect(document.querySelectorAll('.segbar-seg').length).toBeGreaterThanOrEqual(3))
  })

  it('opens the global timeline newest-first with the silent projects listed', async () => {
    await renderPage(makeApi())
    const header = document.querySelector('.header-actions') as HTMLElement
    fireEvent.click(within(header).getByText('时间线'))
    await waitFor(() => expect(document.querySelectorAll('.tl-entry').length).toBe(2))
    const items = [...document.querySelectorAll('.tl-entry')]
    expect(items[0]?.textContent).toContain('2026/11/01')
    expect(items[1]?.textContent).toContain('2026/10/28')
    expect(screen.getAllByText(/某某集团办公网改造/).length).toBeGreaterThan(0)
  })

  it('marks a round with no evidence and no feedback explicitly', async () => {
    await renderPage(makeApi())
    const header = document.querySelector('.header-actions') as HTMLElement
    fireEvent.click(within(header).getByText('时间线'))
    await waitFor(() => expect(document.querySelectorAll('.tl-entry').length).toBe(2))
    expect(screen.getAllByText('无证据').length).toBeGreaterThan(0)
    expect(screen.getAllByText('无客户反馈').length).toBeGreaterThan(0)
  })
})

describe('bilingual copy', () => {
  it('renders the English dictionary when the locale is en', async () => {
    await renderPage(makeApi(), makeLocale('en'))
    // The shell identity sits in the eyebrow; the page title is the module name.
    expect(screen.getByText('Work Dashboard · read-only')).toBeTruthy()
    expect(screen.getAllByText('POC Operations').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Portfolio view').length).toBeGreaterThan(0)
    // The four dimension labels stay four separate labels in English too, on the
    // detail page where the v3 model renders them.
    // The API double only serves POC-2026-003's detail record.
    fireEvent.click([...document.querySelectorAll('.pcard')].find((card) => card.textContent?.includes('某某制造产线安全接入'))!)
    await waitFor(() => expect(document.querySelectorAll('.dim-card').length).toBe(4))
    const labels = [...document.querySelectorAll('.dim-card')].map((node) => node.querySelector('.dim-card-label')?.textContent)
    expect(labels).toEqual(['Goal met', 'Evidence', 'Recognition', 'Next step'])
  })
})

/** The `PocRecord` type is re-exported by the view module for renderer users. */
describe('module surface', () => {
  it('exports the page and the sidebar glyph', async () => {
    const shell = await import('../src/client/shell.jsx')
    expect(shell.WorkDashboardPage).toBeTypeOf('function')
    expect(shell.SidebarGlyph).toBeTypeOf('function')
    const record: PocRecord = { poc_id: 'x' }
    expect(record.poc_id).toBe('x')
  })
})
