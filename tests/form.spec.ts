import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import YAML from 'yaml'
import {
  FORM_SCHEMA_VERSION,
  LEGACY_FORM_SCHEMA_VERSION,
  buildFormHtml,
  blankProject,
  checkFormCompatibility,
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
    criteria: [{ id: 'cri-01', name: '200 人并发', metric: '成功率', baseline: null, target: '≥99.5%' }],
    scenarios: [
      { id: 'scn-01', name: '办公网接入', goal: '200 人并发达标' },
      { id: 'scn-02', name: '移动接入', goal: '弱网可用' },
      { id: 'scn-03', name: '出差接入', goal: '出差场景稳定' },
    ],
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

/**
 * Parse the form's YAML output the way the ledger would.
 *
 * Module-level rather than nested in one `describe`: both the YAML-shape tests and
 * the v3.1 round-trip tests need it, and a duplicated copy would eventually drift.
 */
function roundTrip(project: FormProject): Record<string, unknown> {
  return YAML.parse(projectToYaml(project)) as Record<string, unknown>
}

describe('form → YAML', () => {
  /** Round-trip a project through the serializer and the real parser. */
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
    project.plan.criteria.push({ id: '', name: '  ', metric: '', baseline: '', target: '' })
    project.plan.scenarios.push({ id: '', name: '', goal: '' })
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

/**
 * v3.1 form compatibility.
 *
 * `poc-export` writes a standalone HTML page that colleagues fill in offline, so
 * copies live on their laptops long after the schema moves. The v3.0 form stores
 * `progress[].items` and a bare string array of scenarios; importing one as v3.1
 * would drop every scenario and criterion reference **without an error**, and the
 * ledger's proof chain hangs entirely off those ids.
 *
 * These tests pin the refusal, because a silent partial import is the expensive
 * failure: the colleague believes their work was recorded.
 */
describe('form schema compatibility', () => {
  it('accepts a form generated by the current schema', () => {
    const payload = { schemaVersion: FORM_SCHEMA_VERSION, mode: 'fill', projects: [] }
    const result = checkFormCompatibility(payload)
    expect(result.compatible).toBe(true)
    expect(result.reason).toBe('')
  })

  it('refuses a v3.0 form and says why', () => {
    const result = checkFormCompatibility({ schemaVersion: LEGACY_FORM_SCHEMA_VERSION, mode: 'fill', projects: [] })
    expect(result.compatible).toBe(false)
    expect(result.declared).toBe(LEGACY_FORM_SCHEMA_VERSION)
    // The message has to name the consequence, not just report a version.
    expect(result.reason).toContain('场景')
    expect(result.reason).toContain('丢失')
  })

  it('treats a form with no stamp at all as v3.0', () => {
    // Every form generated before this change lacks the field entirely.
    const result = checkFormCompatibility({ mode: 'fill', projects: [] })
    expect(result.compatible).toBe(false)
    expect(result.declared).toBe(LEGACY_FORM_SCHEMA_VERSION)
  })

  it('refuses a future schema it cannot interpret', () => {
    const result = checkFormCompatibility({ schemaVersion: '9.9', mode: 'fill', projects: [] })
    expect(result.compatible).toBe(false)
    expect(result.declared).toBe('9.9')
    expect(result.reason).toContain('9.9')
  })

  it('refuses something that is not a form payload at all', () => {
    expect(checkFormCompatibility(null).compatible).toBe(false)
    expect(checkFormCompatibility('nope').compatible).toBe(false)
    expect(checkFormCompatibility([]).compatible).toBe(false)
  })
})

describe('v3.1 form round-trip', () => {
  it('carries scenario and criterion ids through unchanged', () => {
    // Ids are the join key evidence uses; renumbering would orphan every proof.
    const project = projectForForm(RECORD)
    const parsed = roundTrip(project)
    const plan = parsed.plan as Record<string, unknown>
    expect((plan.scenarios as Array<Record<string, unknown>>).map((item) => item.id)).toEqual(['scn-01', 'scn-02', 'scn-03'])
    expect((plan.criteria as Array<Record<string, unknown>>)[0]?.id).toBe('cri-01')
  })

  it('writes the mandatory change marker on the progress entry', () => {
    const project = projectForForm(RECORD)
    project.progress.date = '2026-11-18'
    project.progress.type = '客户阶段同步'
    project.progress.change = '证据补充'
    project.progress.actual = '完成压测'
    project.progress.scenarioIds = ['scn-01']
    project.progress.criteriaIds = ['cri-01']
    const parsed = roundTrip(project)
    const entry = (parsed.progress as Array<Record<string, unknown>>)[0]
    expect(entry?.change).toBe('证据补充')
    expect(entry?.scenario_ids).toEqual(['scn-01'])
    expect(entry?.criteria_ids).toEqual(['cri-01'])
    // v3.0's field must never appear again.
    expect(entry).not.toHaveProperty('items')
  })

  it('gives a scenario in a v3.0 record an id on the way into the form', () => {
    // A ledger file still on 3.0 (or hand-written without ids) must not produce a
    // form that cannot reference anything.
    const legacy = { ...RECORD, plan: { ...RECORD.plan, scenarios: [{ name: '无 id 场景' } as never] } }
    const project = projectForForm(legacy as never)
    expect(project.plan.scenarios[0]?.id).toBe('scn-01')
  })
})

/**
 * The generated page, not just the Host-side serializer.
 *
 * `buildFormHtml` embeds its own copy of the YAML writer as a plain-JS string,
 * because the page has to work standalone with no module loading. That copy is
 * invisible to the type checker, so it is asserted here from the outside: a
 * v3.1 page that still writes `items` would produce files the ledger rejects.
 */
describe('generated page emits v3.1 YAML', () => {
  const page = (): string => buildFormHtml({ mode: 'fill', projects: [projectForForm(RECORD)], now: new Date('2026-11-18T00:00:00Z') })

  it('stamps the schema version into the boot payload', () => {
    expect(page()).toContain(`"schemaVersion":"${FORM_SCHEMA_VERSION}"`)
  })

  it('writes scenario_ids and criteria_ids, never items', () => {
    const html = page()
    expect(html).toContain('scenario_ids:')
    expect(html).toContain('criteria_ids:')
    // The removed v3.0 field must not survive anywhere in the emitted page.
    expect(html).not.toContain("'    items:'")
  })

  it('writes the mandatory change marker', () => {
    expect(page()).toContain("lines.push('    change: ' + scalar(entry.change));")
  })

  it('offers the whole progress_change enum to the person filling it in', () => {
    const html = page()
    for (const value of ['阶段推进', '场景新增', '目标调整', '证据补充', '风险出现', '风险解除', '无实质进展']) {
      expect(html).toContain(value)
    }
  })

  it('stays a single self-contained document', () => {
    const html = page()
    // No external stylesheet, script, font or image: colleagues open it offline.
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet/i)
    expect(html).not.toMatch(/<script[^>]+src=/i)
    expect(html).toContain('<html')
    expect(html).toContain('</html>')
  })
})
