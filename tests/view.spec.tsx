// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { WorkDashboardPage } from '../src/client/view.jsx'
import type { ClientApi } from '../src/client/api.js'
import type { ClientLocaleLike } from '../src/client/contracts.js'
import { dictFor, format } from '../src/client/text.js'
import type { PocRecord, ProjectDetail, ProjectSummary, Snapshot } from '../src/types.js'

/**
 * Console page tests.
 *
 * These cover the acceptance criteria a screenshot cannot prove cheaply: the
 * empty state before any pull, the four dimensions rendered as four separate
 * cells, the G0→G4 rail, the pending ordering, the detail page, the settings
 * persistence, and the timer cadence (including that it stops on unmount).
 */

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

/** One project summary as the Host sends it. */
function summary(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    pocId: 'POC-2026-001',
    name: '某某银行零信任试点',
    type: 'customer-pilot',
    tier: 'strategic',
    stageLabel: 'G2-方案验证',
    stage: 'G2',
    closed: false,
    gateComplete: [true, true, false, false, false],
    owner: '张三',
    dimensions: { achievement: true, evidence: true, recognition: false, nextMilestone: false },
    dimensionCount: 2,
    gapCount: 2,
    highGapCount: 2,
    lastActivity: '2026-10-28',
    daysSinceActivity: 8,
    ...overrides,
  }
}

/** A snapshot with three projects and a couple of gaps. */
function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  const projects: ProjectSummary[] = [
    summary(),
    summary({
      pocId: 'POC-2026-002', name: '某某集团办公网改造', stageLabel: 'G0-立项', stage: 'G0',
      gateComplete: [false, false, false, false, false],
      dimensions: { achievement: false, evidence: false, recognition: false, nextMilestone: false },
      dimensionCount: 0, gapCount: 3, highGapCount: 3,
    }),
    summary({
      pocId: 'POC-2026-003', name: '某某制造产线安全接入', stageLabel: 'G4-结果转化', stage: 'G4',
      gateComplete: [true, true, true, true, false],
      dimensions: { achievement: true, evidence: true, recognition: true, nextMilestone: false },
      dimensionCount: 3, gapCount: 1, highGapCount: 1,
    }),
  ]
  return {
    cacheReady: true,
    repository: 'skillre/workbranch',
    fetchedAt: '2026-11-05T04:00:00.000Z',
    cachePath: '/Users/u/.dsh/cache/work-dashboard/repo',
    projects,
    stats: { active: 3, g0Incomplete: 1, atRisk: 2, convertible: 1, total: 3, closed: 0 },
    gaps: [
      {
        rule: 'G4-no-next-milestone', ruleNo: 7, level: 'high', priority: 95,
        pocId: 'POC-2026-003', pocName: '某某制造产线安全接入', field: 'result.next_milestone',
      },
      {
        rule: 'G0-why-customer', ruleNo: 1, level: 'high', priority: 90,
        pocId: 'POC-2026-002', pocName: '某某集团办公网改造', field: 'why_customer_test',
      },
    ],
    warnings: [],
    ...overrides,
  }
}

/** The detail record for POC-2026-003. */
function detail(): ProjectDetail {
  return {
    summary: summary({
      pocId: 'POC-2026-003', name: '某某制造产线安全接入', stageLabel: 'G4-结果转化', stage: 'G4',
      gateComplete: [true, true, true, false, false],
      dimensions: { achievement: true, evidence: true, recognition: true, nextMilestone: false }, dimensionCount: 3,
    }),
    type: 'customer-pilot',
    tier: 'high-value',
    owner: '孙八',
    salesInitiator: '周九',
    customerTechOwner: '吴工',
    whyCustomerTest: '产线设备远程运维存在安全风险',
    whyWeTest: '制造业是重点行业',
    nextActionGoal: '完成验收并推动复购',
    gates: [
      { stage: 'G0', complete: true, date: '2026-09-01', indicators: null, scenarios: null, risks: null, prerequisitesReady: null, engineersInvested: null },
      { stage: 'G1', complete: true, date: '2026-09-20', indicators: 2, scenarios: 3, risks: 1, prerequisitesReady: null, engineersInvested: null },
      { stage: 'G2', complete: true, date: '2026-10-10', indicators: null, scenarios: null, risks: null, prerequisitesReady: true, engineersInvested: true },
      { stage: 'G3', complete: false, date: null, indicators: null, scenarios: null, risks: null, prerequisitesReady: null, engineersInvested: null },
      { stage: 'G4', complete: false, date: null, indicators: null, scenarios: null, risks: null, prerequisitesReady: null, engineersInvested: null },
    ],
    criteria: [{ name: '50 台设备接入', version: 'v1', metric: '接入成功率 100%' }],
    scenarios: ['产线设备远程运维', '供应商临时接入'],
    risks: [{ name: '产线不能停机', level: 'medium', mitigation: '分批次夜间实施' }],
    result: { achievement: '全部完成', evidence: '验收报告.pdf', recognition: '书面认可', next_milestone: '' },
    timeline: [
      { date: '2026-09-01', round: 1, goal: '完成立项', actual: '已完成', evidence: '立项文档', customer_feedback: '认可', recognition_scope: '口头' },
      { date: '2026-11-01', round: 3, goal: '完成验收', actual: '客户验收通过', evidence: '验收报告.pdf', customer_feedback: '高度认可', recognition_scope: '正式验收' },
    ],
    gaps: [{ rule: 'G4-no-next-milestone', ruleNo: 7, level: 'high', priority: 95, pocId: 'POC-2026-003', pocName: '某某制造产线安全接入', field: 'result.next_milestone' }],
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
      if (record.summary.pocId !== pocId) {
        const { ActionError } = await import('../src/client/api.js')
        throw new ActionError('work-dashboard/unknown-project', `No project with poc_id ${pocId}.`, {})
      }
      return record
    },
    async exportForm(input: { pocIds: string[]; mode: 'fill' | 'blank' }) {
      return { html: '<html></html>', fileName: 'poc-form.html', pocIds: input.pocIds, mode: input.mode, bytes: 13 }
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
    const api = makeApi({ initial: snapshot({ cacheReady: false, projects: [], stats: { active: 0, g0Incomplete: 0, atRisk: 0, convertible: 0, total: 0, closed: 0 }, gaps: [] }) })
    await renderPage(api)
    expect(screen.getByText('还没有数据')).toBeTruthy()
    expect(screen.getByText('点【刷新】从 GitHub 拉取 POC 台账')).toBeTruthy()
    expect(screen.getByRole('button', { name: '立即刷新' })).toBeTruthy()
    // The data source and cache path are disclosed, not hidden.
    expect(screen.getAllByText(/github\.com\/skillre\/workbranch/).length).toBeGreaterThan(0)
  })

  it('does not pull data on its own: the empty state makes no refresh call', async () => {
    const api = makeApi({ initial: snapshot({ cacheReady: false, projects: [], gaps: [], stats: { active: 0, g0Incomplete: 0, atRisk: 0, convertible: 0, total: 0, closed: 0 } }) })
    await renderPage(api)
    expect(api.refreshCalls).toBe(0)
  })

  it('pulls when the empty-state button is pressed, then shows the board', async () => {
    const api = makeApi({
      initial: snapshot({ cacheReady: false, projects: [], gaps: [], stats: { active: 0, g0Incomplete: 0, atRisk: 0, convertible: 0, total: 0, closed: 0 } }),
      refreshed: snapshot(),
    })
    await renderPage(api)
    fireEvent.click(screen.getByRole('button', { name: '立即刷新' }))
    await waitFor(() => expect(screen.getByText('项目总览')).toBeTruthy())
    expect(api.refreshCalls).toBe(1)
  })
})

describe('overview page', () => {
  it('shows the four headline counters', async () => {
    await renderPage(makeApi())
    for (const label of ['进行中', '待补 G0', '有风险', '可转化']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
    expect(screen.getByText('项目总览')).toBeTruthy()
  })

  it('renders one row per project with name, stage and gap count', async () => {
    await renderPage(makeApi())
    expect(screen.getByText('某某银行零信任试点')).toBeTruthy()
    expect(screen.getAllByText('某某集团办公网改造').length).toBeGreaterThan(0)
    expect(screen.getAllByText('某某制造产线安全接入').length).toBeGreaterThan(0)
    expect(screen.getAllByText('G2-方案验证').length).toBeGreaterThan(0)
  })

  it('renders the four dimensions as FOUR separate cells per project, never merged', async () => {
    await renderPage(makeApi())
    const rows = document.querySelectorAll('.project-row')
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      const cells = row.querySelectorAll('.dim-cell')
      expect(cells).toHaveLength(4)
      // Every cell carries its own label and its own present/missing state.
      const labels = [...cells].map((cell) => cell.querySelector('.dim-label')?.textContent)
      expect(labels).toEqual(['目标达成', '证据', '客户认可', '下一步'])
      const marks = [...cells].map((cell) => (cell as HTMLElement).dataset.present)
      expect(marks).toHaveLength(4)
    }
    // The incomplete project shows the exact per-dimension state.
    const brokenRow = [...rows].find((row) => row.textContent?.includes('某某集团办公网改造'))!
    const marks = [...brokenRow.querySelectorAll('.dim-cell')].map((cell) => (cell as HTMLElement).dataset.present)
    expect(marks).toEqual(['false', 'false', 'false', 'false'])
  })

  it('marks present and missing dimensions differently', async () => {
    await renderPage(makeApi())
    const row = [...document.querySelectorAll('.project-row')].find((candidate) => candidate.textContent?.includes('某某银行零信任试点'))!
    const cells = [...row.querySelectorAll('.dim-cell')]
    expect(cells.map((cell) => (cell as HTMLElement).dataset.present)).toEqual(['true', 'true', 'false', 'false'])
  })

  it('shows a five-dot G0→G4 rail per row with distinct done/current states', async () => {
    await renderPage(makeApi())
    const rows = [...document.querySelectorAll('.project-row')]
    expect(rows).toHaveLength(3)
    for (const row of rows) expect(row.querySelectorAll('.stage-dot')).toHaveLength(5)
    // POC-001 is at G2 with its G0/G1 gates signed off: the dots follow the
    // ledger's gate records, and G2 is highlighted as the current stage.
    const dots = [...rows[0]!.querySelectorAll('.stage-dot')]
    expect(dots.map((dot) => ({
      done: (dot as HTMLElement).dataset.done,
      current: (dot as HTMLElement).dataset.current,
    }))).toEqual([
      { done: 'true', current: 'false' },
      { done: 'true', current: 'false' },
      { done: 'false', current: 'true' },
      { done: 'false', current: 'false' },
      { done: 'false', current: 'false' },
    ])
  })

  it('lists the pending gaps in priority order', async () => {
    await renderPage(makeApi())
    const pending = document.querySelectorAll('.gap-item')
    expect(pending.length).toBeGreaterThanOrEqual(2)
    // The G4 gap (priority 95) sorts before the G0 gap (priority 90).
    expect(pending[0]?.textContent).toContain('做成了但没有下一步')
    expect(pending[1]?.textContent).toContain('G0 缺「客户为什么测」')
    // Severity paints the flag.
    expect(pending[0]?.className).toContain('gap-level-high')
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
    const api = makeApi({ initial: snapshot({ cacheReady: false, projects: [], gaps: [], stats: { active: 0, g0Incomplete: 0, atRisk: 0, convertible: 0, total: 0, closed: 0 } }), failRefresh: '无法连接 github.com' })
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
  it('opens from a table row and shows the full record', async () => {
    await renderPage(makeApi())
    const row = [...document.querySelectorAll('.project-row')].find((candidate) => candidate.textContent?.includes('某某制造产线安全接入'))!
    fireEvent.click(row)
    await waitFor(() => expect(screen.getByText('某某制造产线安全接入')).toBeTruthy())
    expect(screen.getByText('阶段轨道')).toBeTruthy()
    expect(screen.getByText('四维结果')).toBeTruthy()
    expect(screen.getByText('G0 立项三必填')).toBeTruthy()
    expect(screen.getByText('时间线')).toBeTruthy()
  })

  it('shows the four dimensions as four separate summary cards', async () => {
    await renderPage(makeApi())
    fireEvent.click([...document.querySelectorAll('.project-row')].find((row) => row.textContent?.includes('某某制造产线安全接入'))!)
    await waitFor(() => expect(document.querySelectorAll('.summary-item').length).toBe(4))
    const cards = [...document.querySelectorAll('.summary-item')]
    expect(cards.map((card) => card.querySelector('.summary-label')?.textContent)).toEqual(['目标达成', '证据', '客户认可', '下一步'])
    expect(cards.map((card) => (card as HTMLElement).dataset.present)).toEqual(['true', 'true', 'true', 'false'])
  })

  it('shows the timeline rounds in order, with evidence and recognition', async () => {
    await renderPage(makeApi())
    fireEvent.click([...document.querySelectorAll('.project-row')].find((row) => row.textContent?.includes('某某制造产线安全接入'))!)
    await waitFor(() => expect(document.querySelectorAll('.timeline-item').length).toBe(2))
    const items = [...document.querySelectorAll('.timeline-item')]
    expect(items[0]?.textContent).toContain('2026/09/01')
    expect(items[1]?.textContent).toContain('正式验收')
    expect(items[1]?.textContent).toContain('验收报告.pdf')
  })

  it('returns to the overview with the back button', async () => {
    await renderPage(makeApi())
    fireEvent.click([...document.querySelectorAll('.project-row')].find((row) => row.textContent?.includes('某某制造产线安全接入'))!)
    await waitFor(() => expect(screen.getByRole('button', { name: '← 返回' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '← 返回' }))
    await waitFor(() => expect(screen.getByText('项目总览')).toBeTruthy())
  })
})

describe('milestone 3 views', () => {
  it('opens the export page and lists projects with checkboxes', async () => {
    await renderPage(makeApi())
    const header = document.querySelector('.header-actions') as HTMLElement
    fireEvent.click(within(header).getByText('导出表单'))
    await waitFor(() => expect(document.querySelector('.export-list')).not.toBeNull())
    expect(document.querySelectorAll('.export-row')).toHaveLength(3)
    expect(document.querySelectorAll('.export-row input[type="checkbox"]')).toHaveLength(3)
  })

  it('generates a blank form when nothing is selected', async () => {
    const api = makeApi()
    await renderPage(api)
    const header = document.querySelector('.header-actions') as HTMLElement
    fireEvent.click(within(header).getByText('导出表单'))
    await waitFor(() => expect(document.querySelector('.export-list')).not.toBeNull())
    // Nothing selected: the hint explains a blank form will be produced.
    expect(screen.getAllByText(/空白/).length).toBeGreaterThan(0)
  })

  it('opens the risk board with rows ordered high → medium → unrated', async () => {
    await renderPage(makeApi())
    const header = document.querySelector('.header-actions') as HTMLElement
    fireEvent.click(within(header).getByText('风险看板'))
    await waitFor(() => expect(document.querySelectorAll('.risk-row').length).toBe(3))
    const rows = [...document.querySelectorAll('.risk-row')]
    expect(rows.map((row) => (row as HTMLElement).dataset.level)).toEqual(['high', 'medium', 'unset'])
    // Each row names its project so it is not read in isolation.
    expect(rows[0]?.textContent).toContain('某某制造产线安全接入')
  })

  it('shows the risk severity counters', async () => {
    await renderPage(makeApi())
    const header = document.querySelector('.header-actions') as HTMLElement
    fireEvent.click(within(header).getByText('风险看板'))
    await waitFor(() => expect(document.querySelector('.stat-grid')).not.toBeNull())
    expect(screen.getAllByText(/高 1/).length).toBeGreaterThan(0)
  })

  it('opens the global timeline newest-first with the silent projects listed', async () => {
    await renderPage(makeApi())
    const header = document.querySelector('.header-actions') as HTMLElement
    fireEvent.click(within(header).getByText('时间线'))
    await waitFor(() => expect(document.querySelectorAll('.timeline-item').length).toBe(2))
    const items = [...document.querySelectorAll('.timeline-item')]
    expect(items[0]?.textContent).toContain('2026/11/01')
    expect(items[1]?.textContent).toContain('2026/10/28')
    // The project with no history is named rather than silently absent.
    expect(screen.getAllByText(/某某集团办公网改造/).length).toBeGreaterThan(0)
  })

  it('marks a round with no evidence and no feedback explicitly', async () => {
    await renderPage(makeApi())
    const header = document.querySelector('.header-actions') as HTMLElement
    fireEvent.click(within(header).getByText('时间线'))
    await waitFor(() => expect(document.querySelectorAll('.timeline-item').length).toBe(2))
    // The 2026-10-28 round has neither, and saying so is the point.
    expect(screen.getAllByText('无证据').length).toBeGreaterThan(0)
    expect(screen.getAllByText('无客户反馈').length).toBeGreaterThan(0)
  })

  it('opens a project from a timeline entry', async () => {
    await renderPage(makeApi())
    const header = document.querySelector('.header-actions') as HTMLElement
    fireEvent.click(within(header).getByText('时间线'))
    await waitFor(() => expect(document.querySelectorAll('.timeline-item').length).toBe(2))
    const link = [...document.querySelectorAll('.timeline-item .gap-link')][0] as HTMLElement
    fireEvent.click(link)
    await waitFor(() => expect(document.querySelector('.project-hero')).not.toBeNull())
  })
})

describe('bilingual copy', () => {
  it('renders the English dictionary when the locale is en', async () => {
    await renderPage(makeApi(), makeLocale('en'))
    // The shell identity sits in the eyebrow; the page title is the module name.
    expect(screen.getByText('Work Dashboard · read-only')).toBeTruthy()
    expect(screen.getAllByText('POC Operations').length).toBeGreaterThan(0)
    expect(screen.getByText('Projects')).toBeTruthy()
    // The four dimension labels stay four separate labels in English too.
    const labels = [...document.querySelectorAll('.project-row')][0]!.querySelectorAll('.dim-label')
    expect([...labels].map((label) => label.textContent)).toEqual(['Goal met', 'Evidence', 'Recognition', 'Next step'])
  })
})

/** The `PocRecord` type is re-exported by the view module for renderer users. */
describe('module surface', () => {
  it('exports the page and the sidebar glyph', async () => {
    const view = await import('../src/client/view.jsx')
    expect(view.WorkDashboardPage).toBeTypeOf('function')
    expect(view.SidebarGlyph).toBeTypeOf('function')
    const record: PocRecord = { poc_id: 'x' }
    expect(record.poc_id).toBe('x')
  })
})
