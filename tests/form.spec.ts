import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import YAML from 'yaml'
import {
  buildFormHtml,
  blankProject,
  draftKeyFor,
  formFileName,
  projectForForm,
  projectToYaml,
  yamlFileName,
} from '../src/form.js'
import type { FormProject } from '../src/form.js'
import type { PocRecord } from '../src/types.js'

/**
 * The v3 collection form.
 *
 * Two things need proving, and neither is provable from the generator's source:
 *
 * 1. **The YAML is readable.** A form that produces a file the ledger cannot
 *    parse has wasted a colleague's afternoon. So every test round-trips through
 *    the real `yaml` parser and asserts the v3 shape comes back.
 * 2. **The generated page actually runs.** The script is embedded as text; a
 *    syntax error in it would be invisible until someone double-clicked the
 *    file. So the page is booted in jsdom and its real handlers are exercised.
 */

/** A minimal but realistic v3 record. */
const RECORD: PocRecord = {
  poc_id: 'POC-2026-007',
  name: '某某保险核心系统替换：一期',
  org: { system: '人保体系', company: '人保财险', department: '信息技术部' },
  amount_wan: 500,
  poc_type: 'AI安全',
  owner: '张三',
  sales: '李四',
  tech_owner: '王工',
  exec_sponsor: null,
  stage: 'G0-立项',
  status: '进行中',
  stage_since: null,
  gate0: {
    why_customer: '客户要做等保合规改造',
    why_us: '区域标杆，可复制五家',
    decision_chain: null,
    post_poc_decision: null,
    competitor: '厂商A',
    review: { conclusion: null, reviewer: '杨闯', reviewed_at: null },
    missing: ['decision_chain', 'post_poc_decision'],
    complete: false,
  },
  plan: {
    customer_pain: '现有接入体验差',
    criteria: [{ name: '200 人并发', metric: '成功率', baseline: null, target: '≥99.5%' }],
    scenarios: ['办公网接入', '移动接入', '出差接入'],
    risks: [{ name: '产线不能停机', level: 'high', mitigation: '分批次夜间实施' }],
    our_edge: '自研引擎',
  },
  progress: [],
  outcome: {},
}

describe('project → form', () => {
  it('flattens a v3 record into the fields the form edits', () => {
    const form = projectForForm(RECORD)
    expect(form.pocId).toBe('POC-2026-007')
    expect(form.company).toBe('人保财险')
    expect(form.gate0.why_customer).toContain('等保')
    expect(form.plan.criteria).toHaveLength(1)
    expect(form.plan.scenarios).toHaveLength(3)
    expect(form.plan.risks[0]?.level).toBe('high')
  })

  it('starts the pending progress entry after the existing ones', () => {
    const withHistory: PocRecord = {
      ...RECORD,
      progress: [
        { seq: 1, date: '2026-10-01', actual: '第一轮' },
        { seq: 2, date: '2026-10-15', actual: '第二轮' },
      ],
    }
    const form = projectForForm(withHistory)
    // The form APPENDS; it must never reuse an existing sequence number.
    expect(form.existingProgressCount).toBe(2)
    expect(form.progress.seq).toBe(3)
  })

  it('treats a missing block as an empty one, so the page needs no guards', () => {
    const bare: PocRecord = { poc_id: 'X', name: 'Y' }
    const form = projectForForm(bare)
    expect(form.gate0.decision_chain).toBe('')
    expect(form.plan.criteria).toEqual([])
    expect(form.progress.evidence).toEqual([])
  })

  it('keeps a zero amount distinct from an empty one', () => {
    expect(projectForForm({ ...RECORD, amount_wan: 0 }).amountWan).toBe('0')
    expect(projectForForm({ ...RECORD, amount_wan: null }).amountWan).toBe('')
  })
})

describe('form → YAML', () => {
  /** Round-trip a project through the serializer and the real parser. */
  function roundTrip(project: FormProject): Record<string, unknown> {
    return YAML.parse(projectToYaml(project)) as Record<string, unknown>
  }

  it('produces YAML the ledger parser reads back with the same identity', () => {
    const parsed = roundTrip(projectForForm(RECORD))
    expect(parsed.poc_id).toBe('POC-2026-007')
    expect(parsed.amount_wan).toBe(500)
    expect((parsed.org as Record<string, unknown>).company).toBe('人保财险')
  })

  it('escapes a value whose text would otherwise break the document', () => {
    // The reference tool emitted a bare `name: 某某：试点`, which is invalid YAML
    // because of the colon. The stringifier has to quote it.
    const project = { ...blankProject(), pocId: 'POC-X', name: '某某：试点 #1', owner: '张三', techOwner: '王工' }
    const parsed = roundTrip(project)
    expect(parsed.name).toBe('某某：试点 #1')
  })

  it('emits an append-only progress entry with its evidence and next step', () => {
    const project = projectForForm(RECORD)
    project.progress.date = '2026-11-17'
    project.progress.type = '客户阶段同步'
    project.progress.goal = '验证 200 人并发'
    project.progress.actual = '完成 150 人灰度'
    project.progress.completion = '75%'
    project.progress.evidence = [{ title: '压测报告', link: 'https://example.com/a', type: '文档' }]
    project.progress.customer = { synced_with: '吴工', feedback: '满意', recognition: '部分认可' }
    project.progress.gate3_1 = '可证明'
    project.progress.gate3_2 = '待确认'
    project.progress.next = { goal: '补齐 200 人', owner: '张三', deadline: '2026-11-30' }

    const parsed = roundTrip(project)
    const progress = parsed.progress as Array<Record<string, unknown>>
    expect(progress).toHaveLength(1)
    expect(progress[0]?.seq).toBe(1)
    expect(progress[0]?.completion).toBe('75%')
    expect(progress[0]?.evidence).toHaveLength(1)
    expect((progress[0]?.next as Record<string, unknown>).goal).toBe('补齐 200 人')
  })

  it('omits a progress block the colleague never touched', () => {
    const parsed = roundTrip(projectForForm(RECORD))
    // An untouched entry must not become a blank row in the ledger's history.
    expect(parsed.progress).toEqual([])
  })

  it('drops blank list rows instead of persisting placeholders', () => {
    const project = projectForForm(RECORD)
    project.plan.criteria.push({ name: '  ', metric: '', baseline: '', target: '' })
    project.plan.scenarios.push('')
    project.plan.risks.push({ name: '', level: '', mitigation: '' })
    const parsed = roundTrip(project)
    expect(parsed.plan).toBeDefined()
    const plan = parsed.plan as Record<string, unknown>
    expect(plan.criteria).toHaveLength(1)
    expect(plan.scenarios).toHaveLength(3)
    expect(plan.risks).toHaveLength(1)
  })

  it('nulls an absent scalar rather than writing the string "null"', () => {
    const project = { ...blankProject(), pocId: 'POC-X', name: 'N', owner: 'O', techOwner: 'T' }
    const parsed = roundTrip(project)
    expect(parsed.amount_wan).toBeNull()
    expect(parsed.sales).toBeNull()
    expect(parsed.stage_since).toBeNull()
  })

  it('keeps the decision chain even when every other G0 field is blank', () => {
    const project = projectForForm(RECORD)
    project.gate0.why_customer = ''
    const parsed = roundTrip(project)
    const gate0 = parsed.gate0 as Record<string, unknown>
    expect(gate0.why_customer).toBeNull()
    expect(gate0.decision_chain).toBeNull()
    // The block itself survives, so a colleague reopening the file sees the shape.
    expect(gate0.review).toBeDefined()
  })
})

describe('draft key', () => {
  it('is independent of selection order', () => {
    expect(draftKeyFor('fill', ['B', 'A'])).toBe(draftKeyFor('fill', ['A', 'B']))
  })

  it('differs per project set, so two batches never share a draft', () => {
    expect(draftKeyFor('fill', ['A'])).not.toBe(draftKeyFor('fill', ['A', 'B']))
  })

  it('is constant for a blank form', () => {
    expect(draftKeyFor('blank', [])).toBe(draftKeyFor('blank', ['whatever']))
  })
})

describe('file names', () => {
  it('names a single-project form by its id and date', () => {
    expect(formFileName({ mode: 'fill', pocIds: ['POC-1'], now: new Date('2026-11-17T00:00:00Z') })).toBe('poc-form-v3-POC-1-20261117.html')
  })

  it('names a batch form by its count', () => {
    expect(formFileName({ mode: 'fill', pocIds: ['A', 'B'], now: new Date('2026-11-17T00:00:00Z') })).toBe('poc-forms-v3-2-20261117.html')
  })

  it('names the downloaded YAML after the project', () => {
    const project = { ...blankProject(), pocId: 'POC-9' }
    expect(yamlFileName(project, new Date('2026-11-17T00:00:00Z'))).toBe('POC-9-20261117.yaml')
  })
})

describe('the generated page', () => {
  /** Boot the generated HTML in jsdom and return its window. */
  function boot(options: { mode: 'fill' | 'blank' }): { dom: JSDOM; errors: string[] } {
    const html = options.mode === 'blank'
      ? buildFormHtml({ mode: 'blank', projects: [], now: new Date('2026-11-17T00:00:00Z') })
      : buildFormHtml({ mode: 'fill', projects: [projectForForm(RECORD)], now: new Date('2026-11-17T00:00:00Z') })
    const errors: string[] = []
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'https://local.invalid/form.html',
      beforeParse(window) {
        window.addEventListener('error', (event) => { errors.push(String(event.message)) })
      },
    })
    return { dom, errors }
  }

  it('boots without a script error', () => {
    const { errors } = boot({ mode: 'fill' })
    // A syntax or reference error here means the file a colleague opens is dead.
    expect(errors).toEqual([])
  })

  it('renders the identity, G0, plan and progress cards', () => {
    const { dom } = boot({ mode: 'fill' })
    const body = dom.window.document.getElementById('formBody')
    expect(body).toBeTruthy()
    const text = body?.textContent ?? ''
    expect(text).toContain('身份')
    expect(text).toContain('G0')
    expect(text).toContain('计划')
    expect(text).toContain('进展')
    // The G0 checklist shows which prerequisites are still missing.
    expect(text).toContain('客户为什么要测')
    expect(text).toContain('项目流程 / 决策链')
  })

  it('pre-fills the values from the ledger', () => {
    const { dom } = boot({ mode: 'fill' })
    const nameInput = dom.window.document.querySelector('[data-path="name"]') as HTMLInputElement
    expect(nameInput.value).toBe('某某保险核心系统替换：一期')
    const amount = dom.window.document.querySelector('[data-path="amountWan"]') as HTMLInputElement
    expect(amount.value).toBe('500')
  })

  it('flags the gap-rule counts live, so a colleague sees 2–3 criteria', () => {
    const { dom } = boot({ mode: 'fill' })
    const badges = [...dom.window.document.querySelectorAll('.badge')].map((node) => node.textContent ?? '')
    // One criterion is below the documented 2–3, and the page must say so.
    expect(badges.some((badge) => badge.includes('要求 2–3'))).toBe(true)
    // Three scenarios are inside 3–5.
    expect(badges.some((badge) => badge.includes('符合 3–5'))).toBe(true)
  })

  it('adds a criterion row when the add button is pressed', () => {
    const { dom } = boot({ mode: 'fill' })
    const before = dom.window.document.querySelectorAll('[data-path^="plan.criteria."]').length
    const add = dom.window.document.querySelector('[data-add="criteria"]') as HTMLElement
    add.click()
    const after = dom.window.document.querySelectorAll('[data-path^="plan.criteria."]').length
    expect(after).toBe(before + 4)
  })

  it('keeps a draft in localStorage under the project-set key', () => {
    const { dom } = boot({ mode: 'fill' })
    const input = dom.window.document.querySelector('[data-path="owner"]') as HTMLInputElement
    input.value = '李四改名'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    // `save` is debounced; the generated page also saves on an interval and on
    // unload, so the state must already be in memory. Force the flush the page
    // itself performs on unload.
    dom.window.dispatchEvent(new dom.window.Event('beforeunload'))
    const raw = dom.window.localStorage.getItem(draftKeyFor('fill', ['POC-2026-007']))
    expect(raw).toBeTruthy()
    expect(raw).toContain('李四改名')
  })

  it('builds a blank form with the required identity fields empty', () => {
    const { dom } = boot({ mode: 'blank' })
    const id = dom.window.document.querySelector('[data-path="pocId"]') as HTMLInputElement
    expect(id.value).toBe('')
    // A blank form starts at G0, the only stage a new project can begin in.
    const stage = dom.window.document.querySelector('[data-path="stage"]') as HTMLSelectElement
    expect(stage.value).toBe('G0-立项')
  })
})
