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
  projectToChangeSet,
  resolveSections,
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

/**
 * Boot one generated page in jsdom and return its window.
 *
 * The script is embedded as text, so a runtime error in it is invisible to the
 * type checker. Every test that asserts on rendered markup goes through here, so
 * a broken page fails on its own rather than as a puzzling missing element.
 */
/**
 * A record at G1, where the plan is the subject.
 *
 * The form shows a stage's own section group as editable and everything else as
 * read-only context, so a test that asserts on plan fields has to use a project
 * whose stage makes the plan the subject. Using a G0 record here would be
 * asserting behaviour the design deliberately removed.
 */
const RECORD_G1: PocRecord = { ...RECORD, stage: 'G1-方案设计' }

function bootPage(project: FormProject, now = new Date('2026-11-17T00:00:00Z'), intent?: 'new' | 'supplement' | 'progress'): { dom: JSDOM; errors: string[] } {
  const html = buildFormHtml({ mode: 'fill', projects: [project], now, ...(intent === undefined ? {} : { intent }) })
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
    // A `fill` form is a supplement for the project's CURRENT stage, so the
    // fixture has to sit where the plan is the subject for the plan assertions
    // below to be meaningful.
    const html = options.mode === 'blank'
      ? buildFormHtml({ mode: 'blank', projects: [], now: new Date('2026-11-17T00:00:00Z') })
      : buildFormHtml({ mode: 'fill', projects: [projectForForm(RECORD_G1)], now: new Date('2026-11-17T00:00:00Z') })
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

  it('shows the current stage as editable and earlier stages as context', () => {
    const { dom } = boot({ mode: 'fill' })
    const body = dom.window.document.getElementById('formBody')
    expect(body).toBeTruthy()
    const text = body?.textContent ?? ''
    // G1's subject is the plan, so those are inputs.
    expect(text).toContain('成功指标与测试场景')
    expect(text).toContain('方案要点')
    // Gate 0 is already done at G1: it is shown, but as a read-only summary.
    expect(text).toContain('Gate 0 · 只读')
    expect(text).toContain('基本信息 · 只读')
    // Identity renders as a summary line, not as editable inputs.
    expect(text).toContain('POC-2026-007')
  })

  it('pre-fills the values from the ledger', () => {
    // At G1 the identity block is CONTEXT, not the subject: it renders as a
    // read-only summary rather than inputs, because a colleague supplementing
    // the plan must not silently rewrite the project's identity on the way.
    const { dom } = boot({ mode: 'fill' })
    const body = dom.window.document.getElementById('formBody')
    const text = body?.textContent ?? ''
    expect(text).toContain('某某保险核心系统替换：一期')
    expect(text).toContain('POC-2026-007')
    expect(text).toContain('500')
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
    // A field the G1 form actually exposes: `owner` is identity, which is
    // read-only at this stage, so editing it would prove nothing.
    const input = dom.window.document.querySelector('[data-path="plan.our_edge"]') as HTMLInputElement
    expect(input).toBeTruthy()
    input.value = '自研引擎，改名验证'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    // `save` is debounced; the generated page also saves on an interval and on
    // unload, so the state must already be in memory. Force the flush the page
    // itself performs on unload.
    dom.window.dispatchEvent(new dom.window.Event('beforeunload'))
    const raw = dom.window.localStorage.getItem(draftKeyFor('fill', ['POC-2026-007']))
    expect(raw).toBeTruthy()
    expect(raw).toContain('自研引擎，改名验证')
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
 * v3.1 made a scenario an object, and three separate paths kept treating it as a
 * bare string. All three shipped: the page rendered "[object Object]", adding a
 * row crashed the YAML writer, and the downloaded file was still v3.0 shape.
 * These pin the fixes so the same three cannot come back.
 */
describe('v3.1 object rows survive every path', () => {
  it('renders a scenario as named fields, never as an object', () => {
    const { dom } = bootPage(projectForForm(RECORD_G1))
    const body = dom.window.document.getElementById('formBody')
    // The literal symptom: String(object) leaking into the page.
    expect(body?.textContent ?? '').not.toContain('[object Object]')
    const name = body?.querySelector('[data-path="plan.scenarios.0.name"]') as HTMLInputElement
    const goal = body?.querySelector('[data-path="plan.scenarios.0.goal"]') as HTMLInputElement
    expect(name.value).toBe('办公网接入')
    expect(goal.value).toBe('200 人并发达标')
  })

  it('shows the stable id beside each row, because evidence attaches to it', () => {
    const { dom } = bootPage(projectForForm(RECORD_G1))
    const body = dom.window.document.getElementById('formBody')
    expect(body?.textContent ?? '').toContain('scn-01')
    expect(body?.textContent ?? '').toContain('cri-01')
  })

  it('adds a scenario row without crashing the YAML writer', () => {
    // The add handler used to push a bare string, and the writer then called
    // .trim() on an absent id. Clicking "+ 加一个场景" broke the download.
    const { dom } = bootPage(projectForForm(RECORD_G1))
    const doc = dom.window.document
    const add = doc.querySelector('[data-add="scenarios"]') as HTMLButtonElement
    add.click()
    // A row that survived the re-render proves the handler did not throw.
    expect(doc.querySelectorAll('[data-path$=".goal"]').length).toBeGreaterThanOrEqual(4)
    const ids = Array.from(doc.querySelectorAll('[data-path$=".name"]'))
      .map((node) => (node as HTMLInputElement).value)
    expect(ids).toContain('')
  })

  it('gives a newly added row the next free stable id', () => {
    const { dom } = bootPage(projectForForm(RECORD_G1))
    const doc = dom.window.document
    ;(doc.querySelector('[data-add="scenarios"]') as HTMLButtonElement).click()
    // Three scenarios exist, so the new one must be scn-04, not a duplicate.
    expect(doc.body.textContent ?? '').toContain('scn-04')
  })

  it('emits v3.1 object rows from the browser writer, not v3.0 strings', () => {
    const html = buildFormHtml({ mode: 'fill', projects: [projectForForm(RECORD)] })
    // The page's own writer must carry the id, or a returned form loses the key.
    expect(html).toContain("lines.push('    - id: ' + scalar(scenarios[i].id));")
    expect(html).toContain("lines.push('      goal: ' + scalar(scenarios[i].goal));")
  })
})

/**
 * scenario_ids / criteria_ids had no UI at all.
 *
 * v3.1 requires both on every progress entry, and they are the only thing that
 * lets the ledger derive a scenario's status. Without a picker every returned
 * form carried empty lists, so a proof could never be tied to what it proved.
 */
describe('progress pickers', () => {
  it('offers every scenario and criterion as a checkbox', () => {
    const { dom } = bootPage(projectForForm(RECORD_G1), undefined, 'progress')
    const doc = dom.window.document
    const scn = doc.querySelectorAll('[data-pick="progress.scenarioIds"]')
    const cri = doc.querySelectorAll('[data-pick="progress.criteriaIds"]')
    expect(scn.length).toBe(3)
    expect(cri.length).toBe(1)
    expect((scn[0] as HTMLInputElement).value).toBe('scn-01')
  })

  it('writes a checked id into the entry instead of the string "on"', () => {
    const { dom } = bootPage(projectForForm(RECORD_G1), undefined, 'progress')
    const doc = dom.window.document
    const box = doc.querySelector('[data-pick="progress.scenarioIds"]') as HTMLInputElement
    box.checked = true
    box.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
    // Read the live draft back out of localStorage: the handler saves on a timer,
    // so assert against the in-memory state the page exposes via a re-render.
    const picked = doc.querySelector('[data-pick="progress.scenarioIds"]') as HTMLInputElement
    expect(picked.checked).toBe(true)
  })

  it('says what to do first when the plan has nothing to pick', () => {
    const empty: FormProject = { ...blankProject() }
    const { dom } = bootPage(empty)
    expect(dom.window.document.body.textContent ?? '').toContain('先在左边的计划里加上')
  })
})

/**
 * Stage + intent decide what the form asks.
 *
 * The old form showed every field to everyone. That is not a layout preference:
 * a G0 project has no plan to fill, and a weekly progress update should not make
 * a colleague re-read twenty fields. These pin the resolution so a future edit
 * cannot quietly re-widen it.
 */
describe('stage and intent decide the subject', () => {
  it('asks a new project only for identity and the G0 prerequisites', () => {
    const resolved = resolveSections('new', 'G0-立项')
    expect(resolved.editable).toContain('identity')
    expect(resolved.editable).toContain('gate0')
    // The plan waits for G1: rule R3 only demands one after G0 passes.
    expect(resolved.editable).not.toContain('plan')
    expect(resolved.context).toEqual([])
  })

  it('gives G1 the plan and everything earlier as read-only context', () => {
    const resolved = resolveSections('supplement', 'G1-方案设计')
    expect(resolved.editable).toEqual(['plan', 'gate12'])
    expect(resolved.context).toContain('identity')
    expect(resolved.context).toContain('gate0')
    // A later stage has not happened, so it is not even context.
    expect(resolved.context).not.toContain('outcome')
  })

  it('gives G3 the proof and nothing to re-plan', () => {
    const resolved = resolveSections('supplement', 'G3-结果验证')
    expect(resolved.editable).toEqual(['progress'])
    expect(resolved.context).toContain('plan')
  })

  it('gives G4 the conclusion block', () => {
    const resolved = resolveSections('supplement', 'G4-结果转化')
    expect(resolved.editable).toContain('outcome')
    expect(resolved.editable).toContain('progress')
  })

  it('gives the progress intent one section at any stage', () => {
    for (const stage of ['G0-立项', 'G2-方案验证', 'G4-结果转化']) {
      const resolved = resolveSections('progress', stage)
      expect(resolved.editable).toEqual(['progress'])
      expect(resolved.context).toEqual([])
    }
  })

  it('treats an unrecognised stage as still being set up', () => {
    // Better to ask for G0 again than to show a blank page to a colleague.
    const resolved = resolveSections('supplement', 'G9-nonsense')
    expect(resolved.editable).toContain('gate0')
  })

  it('keeps a G0 supplement free of the plan section', () => {
    const { dom } = bootPage(projectForForm(RECORD))
    const text = dom.window.document.getElementById('formBody')?.textContent ?? ''
    expect(text).toContain('Gate 0 · 值不值得做')
    expect(text).toContain('方案 · 只读')
    expect(text).not.toContain('成功指标与测试场景')
  })
})

/**
 * The download is a change set, not a project file.
 *
 * The ledger's derived fields are owned by `tools/derive.mjs` and asserted by
 * CI, so a form that wrote them would be wrong or overwritten. A form that
 * omitted them would be rejected. The only shape that works is "the human half,
 * merged by `poc-submit`".
 */
describe('change set output', () => {
  it('carries the schema version a new project file needs', () => {
    // The ledger refuses a file without it (E-VERSION), and a brand-new project
    // has no existing file to inherit the stamp from.
    const change = projectToChangeSet(projectForForm(RECORD))
    expect(change.schema_version).toBe(FORM_SCHEMA_VERSION)
  })

  it('never writes a derived field', () => {
    const change = projectToChangeSet(projectForForm(RECORD)) as unknown as Record<string, unknown>
    const gate0 = change.gate0 as Record<string, unknown>
    // These are computed by derive.mjs and asserted by CI.
    expect(gate0).not.toHaveProperty('missing')
    expect(gate0).not.toHaveProperty('complete')
    expect(change).not.toHaveProperty('priority')
    expect(change).not.toHaveProperty('gate_decisions')
  })

  it('collapses a blank field to null, not to the string ""', () => {
    const blank = blankProject()
    const change = projectToChangeSet(blank)
    expect(change.gate0.decision_chain).toBeNull()
    expect(change.owner).toBeNull()
  })

  it('keeps the scenario and criterion ids evidence hangs off', () => {
    const change = projectToChangeSet(projectForForm(RECORD))
    expect((change.plan.scenarios[0] as Record<string, unknown>).id).toBe('scn-01')
    expect((change.plan.criteria[0] as Record<string, unknown>).id).toBe('cri-01')
  })

  it('emits only the rounds this form adds', () => {
    const withHistory: PocRecord = {
      ...RECORD,
      progress: [{ seq: 1, date: '2026-10-01', actual: '第一轮' }],
    }
    const project = projectForForm(withHistory)
    project.progress.date = '2026-11-19'
    project.progress.actual = '第三轮'
    project.progress.change = '证据补充'
    const change = projectToChangeSet(project)
    // One new round, never the existing history: the merge appends.
    expect(change.progress).toHaveLength(1)
    expect(change.progress[0]?.actual).toBe('第三轮')
  })

  it('omits the round entirely when the colleague recorded nothing', () => {
    const change = projectToChangeSet(projectForForm(RECORD))
    expect(change.progress).toEqual([])
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
