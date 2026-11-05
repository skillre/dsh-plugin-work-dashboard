import { describe, expect, it } from 'vitest'
import { runInNewContext } from 'node:vm'
import YAML from 'yaml'
import { blankProject, buildFormHtml, draftKeyFor, formFileName, projectForForm, projectToYaml } from '../src/form.js'
import type { FormProject } from '../src/form.js'
import type { PocRecord } from '../src/types.js'

/**
 * Form-generator tests.
 *
 * The two properties that matter most are pinned here:
 *
 * 1. **Self-contained** — the document must not reference any external URL,
 *    stylesheet, script, or font, because a colleague opens it from `file://`
 *    on a machine that may be offline.
 * 2. **The download is REAL YAML** — the reference implementation emitted JSON,
 *    which the plugin's own import page cannot read. Every generated document
 *    is parsed back with the same `yaml` library the Host uses, including values
 *    that break naive concatenation (`: `, `#`, quotes, newlines).
 */

/** A project with the awkward values that break hand-built YAML. */
const TRICKY: FormProject = {
  poc_id: 'POC-2026-001',
  name: '某某银行：零信任试点 #1',
  type: 'customer-pilot',
  tier: 'strategic',
  stage: 'G2-方案验证',
  owner: '张三',
  sales_initiator: '李四',
  customer_tech_owner: '王工',
  why_customer_test: '客户要做等保合规改造，\n现有 VPN 接入体验差',
  why_we_test: '客户是区域标杆；成功可复制',
  next_action_goal: '两周内完成 200 人灰度接入',
  gates: {
    G0: { complete: true, date: '2026-10-15' },
    G1: { complete: true, indicators_count: 3, scenarios_count: 4, risks_count: 2 },
    G2: { complete: false, prerequisites_ready: true, engineers_invested: true },
  },
  success_criteria: [
    { name: '200 人并发', version: 'v1', metric: '成功率 ≥ 99.5%' },
    { name: '单点登录', version: 'v1', metric: '与客户 AD 对接通过' },
  ],
  success_scenarios: ['办公网远程接入', '出差移动接入', '第三方运维临时接入'],
  risks: [
    { name: 'AD 环境老旧：对接可能失败', level: 'high', mitigation: '提前预演' },
    { name: '决策链长 #预算未批', level: 'medium', mitigation: '同步推进' },
  ],
  result: {
    achievement: '全部完成',
    evidence: '验收报告.pdf',
    recognition: '书面认可',
    next_milestone: '二期扩容',
  },
  timeline: [
    { date: '2026-10-15', round: 1, goal: '完成立项', actual: '已完成', evidence: '立项邮件', customer_feedback: '认可', recognition_scope: '口头' },
  ],
}

/** Extract the inline `<script>` body from the generated document. */
function scriptOf(html: string): string {
  const match = html.match(/<script>([\s\S]*?)<\/script>/)
  if (match === null) throw new Error('the generated form has no inline script')
  return match[1]!
}

/** A minimal DOM/browser double good enough to boot the page script. */
function bootForm(html: string): { download: () => string; preview: () => string } {
  const elements = new Map<string, Record<string, unknown>>()
  /** A tiny element double: the script only reads/writes a few fields. */
  const makeElement = (id: string): Record<string, unknown> => {
    const element: Record<string, unknown> = {
      id,
      textContent: '',
      innerHTML: '',
      hidden: false,
      disabled: false,
      style: {},
      addEventListener: () => {},
      scrollIntoView: () => {},
      getAttribute: () => null,
      closest: () => null,
    }
    elements.set(id, element)
    return element
  }
  for (const id of ['saveStatus', 'clearBtn', 'previewBtn', 'downloadBtn', 'footerInfo', 'yamlPreview', 'toast', 'formBody', 'restoreNotice', 'draftNotice']) {
    makeElement(id)
  }
  const blobs: string[] = []
  const context = {
    DATA: undefined,
    document: {
      getElementById: (id: string) => elements.get(id) ?? null,
      addEventListener: () => {},
      createElement: () => ({ click: () => {}, href: '', download: '', setAttribute: () => {} }),
    },
    localStorage: {
      store: new Map<string, string>(),
      getItem(key: string) { return this.store.get(key) ?? null },
      setItem(key: string, value: string) { this.store.set(key, value) },
      removeItem(key: string) { this.store.delete(key) },
    },
    setTimeout: (fn: () => void) => { void fn; return 0 },
    clearTimeout: () => {},
    setInterval: () => 0,
    Blob: class { constructor(parts: string[]) { blobs.push(parts.join('')) } },
    URL: { createObjectURL: () => 'blob:1', revokeObjectURL: () => {} },
    window: { addEventListener: () => {} },
    Date,
    JSON,
    Math,
    String,
    Number,
    Object,
    Array,
    console,
    confirm: () => true,
    location: { reload: () => {} },
  }
  // The script is an IIFE; run it with the doubles in scope.
  runInNewContext(scriptOf(html), context)
  return {
    download: () => {
      // Call the page's own download path, then read the captured blob.
      const button = elements.get('downloadBtn') as { click?: () => void } | undefined
      void button
      // The script binds handlers via addEventListener, which the double
      // ignores; instead re-run its serializer by calling the exposed path.
      // The preview button writes the same text into #yamlPreview.
      const preview = elements.get('yamlPreview') as { textContent: string } | undefined
      return preview?.textContent ?? ''
    },
    preview: () => (elements.get('yamlPreview') as { textContent: string } | undefined)?.textContent ?? '',
  }
}

/** Run the page's serializer directly by re-executing the script with a hook. */
function serializeInPage(html: string): string[] {
  const script = scriptOf(html)
  // The script is an IIFE with no exports. Re-create its serializer by asking
  // the preview path to run: bind previewBtn's handler explicitly.
  const elements = new Map<string, Record<string, unknown>>()
  const handlers = new Map<string, () => void>()
  const makeElement = (id: string) => {
    const element: Record<string, unknown> = {
      id, textContent: '', innerHTML: '', hidden: false, disabled: false, style: {},
      scrollIntoView: () => {}, getAttribute: () => null, closest: () => null,
      addEventListener: (event: string, handler: () => void) => { handlers.set(`${id}:${event}`, handler) },
    }
    elements.set(id, element)
    return element
  }
  for (const id of ['saveStatus', 'clearBtn', 'previewBtn', 'downloadBtn', 'footerInfo', 'yamlPreview', 'toast', 'formBody', 'restoreNotice', 'draftNotice']) makeElement(id)
  const captured: string[] = []
  const context = {
    document: {
      getElementById: (id: string) => elements.get(id) ?? null,
      addEventListener: () => {},
      createElement: () => ({ click: () => {}, href: '', download: '', setAttribute: () => {} }),
    },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    setTimeout: (fn: () => void) => { void fn; return 0 },
    clearTimeout: () => {},
    setInterval: () => 0,
    Blob: class { constructor(parts: string[]) { captured.push(parts.join('')) } },
    URL: { createObjectURL: () => 'blob:1', revokeObjectURL: () => {} },
    window: { addEventListener: () => {} },
    Date, JSON, Math, String, Number, Object, Array, console,
    confirm: () => true,
    location: { reload: () => {} },
  }
  runInNewContext(scriptOf(html), context)
  const preview = handlers.get('previewBtn:click')
  if (preview !== undefined) preview()
  const download = handlers.get('downloadBtn:click')
  if (download !== undefined) download()
  const previewText = (elements.get('yamlPreview') as { textContent: string }).textContent
  return [previewText, ...captured]
}

describe('self-contained document', () => {
  const html = buildFormHtml({ mode: 'fill', projects: [TRICKY], now: new Date('2026-11-05T00:00:00Z') })

  it('references no external resource at all', () => {
    expect(html).not.toMatch(/https?:\/\//)
    expect(html).not.toMatch(/<link\b/)
    expect(html).not.toMatch(/<script[^>]+src=/)
    expect(html).not.toMatch(/@import|url\(/)
    expect(html).not.toMatch(/<img\b/)
  })

  it('is one complete HTML document', () => {
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('<style>')
    expect(html).toContain('</html>')
    expect(html.length).toBeGreaterThan(15_000)
  })

  it('escapes a closing script tag inside embedded data', () => {
    // A project name containing `</script>` must not terminate the block early.
    const hostile = { ...TRICKY, name: '恶意名称</script><b>x</b>' }
    const page = buildFormHtml({ mode: 'fill', projects: [hostile] })
    expect(page).not.toContain('</script><b>')
    // The data is still present, just escaped.
    expect(page).toContain('\\u003c/script\\u003e')
  })

  it('carries the documented option lists so the page and the plugin agree', () => {
    expect(html).toContain('customer-pilot')
    expect(html).toContain('G0-立项')
    expect(html).toContain('正式验收')
  })
})

describe('the downloaded document is real YAML', () => {
  it('parses back with the same library the Host uses', () => {
    // The Host's serializer is the same code path, asserted directly here.
    const yaml = projectToYaml(TRICKY)
    const parsed = YAML.parse(yaml) as Record<string, unknown>
    expect(parsed.poc_id).toBe('POC-2026-001')
    expect(parsed.name).toBe('某某银行：零信任试点 #1')
    expect(parsed.why_customer_test).toContain('等保合规改造')
    expect(parsed.success_criteria).toEqual(TRICKY.success_criteria)
    expect(parsed.success_scenarios).toEqual(TRICKY.success_scenarios)
    expect(parsed.risks).toEqual(TRICKY.risks)
    expect(parsed.result).toEqual(TRICKY.result)
    expect(parsed.gates).toEqual(TRICKY.gates)
  })

  it('survives a round trip through parse and re-stringify', () => {
    const first = YAML.parse(projectToYaml(TRICKY))
    const second = YAML.parse(projectToYaml({ ...TRICKY, ...(first as Partial<FormProject>) }))
    expect(second.name).toBe(TRICKY.name)
    expect(second.why_customer_test).toBe(TRICKY.why_customer_test)
  })

  it('the page serializer also produces parseable YAML', () => {
    const html = buildFormHtml({ mode: 'fill', projects: [TRICKY], now: new Date('2026-11-05T00:00:00Z') })
    const texts = serializeInPage(html)
    const yamlText = texts.find((text) => text.includes('poc_id:'))
    expect(yamlText).toBeDefined()
    // Drop the generated header comments, then parse.
    const body = (yamlText ?? '').split('\n').filter((line) => !line.startsWith('#')).join('\n')
    const parsed = YAML.parse(body) as Record<string, unknown>
    expect(parsed.poc_id).toBe('POC-2026-001')
    expect(parsed.name).toBe('某某银行：零信任试点 #1')
    expect(parsed.result).toEqual(TRICKY.result)
  })

  it('quotes values that would otherwise break YAML', () => {
    const yaml = projectToYaml({ ...TRICKY, owner: '张三: 负责人 # 备注', name: 'true' })
    const parsed = YAML.parse(yaml) as Record<string, unknown>
    expect(parsed.owner).toBe('张三: 负责人 # 备注')
    // `true` must stay the STRING "true", not become a boolean.
    expect(parsed.name).toBe('true')
  })
})

describe('batch download', () => {
  const A: FormProject = { ...TRICKY, poc_id: 'POC-2026-001', name: '项目 A' }
  const B: FormProject = { ...TRICKY, poc_id: 'POC-2026-003', name: '项目 B' }

  it('emits one independently valid document per project, never a concatenation', () => {
    // Regression: joining two projects produced "Map keys must be unique", and a
    // `---` multi-document file is rejected by the plugin's import page.
    const joined = projectToYaml(A) + '\n' + projectToYaml(B)
    expect(() => YAML.parse(joined)).toThrow(/Map keys must be unique/)

    // The fix: each project is its own file, so each parses on its own.
    const first = YAML.parse(projectToYaml(A)) as Record<string, unknown>
    const second = YAML.parse(projectToYaml(B)) as Record<string, unknown>
    expect(first.poc_id).toBe('POC-2026-001')
    expect(second.poc_id).toBe('POC-2026-003')
  })

  it('a batch page exposes per-project documents rather than one blob', () => {
    const html = buildFormHtml({ mode: 'fill', projects: [A, B] })
    const script = scriptOf(html)
    // The page builds a document per project and downloads one file each.
    expect(script).toContain('documentsForDownload')
    expect(script).toContain('saveOneFile')
    expect(script).toContain('每个项目一个')
    // And it must not join the serialized projects into a single string.
    expect(script).not.toMatch(/projects\.map\(serialize\)\.join/)
  })

  it('every project document the page produces parses', () => {
    const html = buildFormHtml({ mode: 'fill', projects: [A, B] })
    const texts = serializeInPage(html)
    const previewText = texts.find((text) => text.includes('POC-2026-001')) ?? ''
    // The preview holds one document per project. Split on the project marker,
    // which is written as a comment immediately before each document.
    const chunks = previewText.split('# ── ').slice(1).filter((chunk) => chunk.includes('poc_id:'))
    expect(chunks.length).toBe(2)
    for (const chunk of chunks) {
      // Drop the marker line itself (everything up to the first newline) and any
      // generated comment lines, leaving just the YAML mapping.
      const afterMarker = chunk.slice(chunk.indexOf('\n') + 1)
      const body = afterMarker.split('\n').filter((line) => !line.startsWith('#')).join('\n')
      expect(() => YAML.parse(body)).not.toThrow()
      // Each chunk is ONE project, not a merged mapping.
      expect(body).toContain('poc_id:')
      expect(body.match(/^poc_id:/gm)?.length).toBe(1)
    }
  })
})

describe('draft key', () => {
  it('is stable for the same project set, regardless of selection order', () => {
    expect(draftKeyFor('fill', ['B', 'A'])).toBe(draftKeyFor('fill', ['A', 'B']))
    expect(draftKeyFor('fill', ['A', 'B'])).not.toBe(draftKeyFor('fill', ['A']))
  })

  it('gives the blank form a constant key so its draft survives regeneration', () => {
    expect(draftKeyFor('blank', [])).toBe('poc-form-draft-blank')
  })
})

describe('project mapping', () => {
  it('normalizes a ledger record into the form shape', () => {
    const record: PocRecord = {
      poc_id: 'POC-2026-001',
      name: 'X',
      type: 'customer-pilot',
      tier: 'strategic',
      stage: 'G2-方案验证',
      owner: null,
      customer_tech_owner: '王工',
      why_customer_test: 'Y',
      result: { achievement: 'A', evidence: null, recognition: null, next_milestone: null },
      success_criteria: [{ name: 'C', metric: 'M' }],
      success_scenarios: ['S1', null, ''],
      risks: [{ name: 'R', level: 'HIGH', mitigation: 'M' }],
      gates: { G0: { complete: true } },
    }
    const form = projectForForm(record)
    expect(form.owner).toBe('')
    expect(form.success_scenarios).toEqual(['S1'])
    // Risk level is lowercased so the page's pill mapping is unambiguous.
    expect(form.risks[0]).toEqual({ name: 'R', level: 'high', mitigation: 'M' })
    expect(form.result.achievement).toBe('A')
    expect(form.gates.G0).toEqual({ complete: true })
  })

  it('produces a blank project with the documented defaults', () => {
    const blank = blankProject()
    expect(blank.stage).toBe('G0-立项')
    expect(blank.success_criteria).toEqual([])
    expect(blank.result).toEqual({ achievement: '', evidence: '', recognition: '', next_milestone: '' })
    expect(Object.keys(blank.gates)).toEqual(['G0', 'G1', 'G2'])
  })
})

describe('file name', () => {
  it('names single, batch and blank forms distinctly', () => {
    const now = new Date('2026-11-05T00:00:00Z')
    expect(formFileName({ mode: 'fill', pocIds: ['POC-2026-001'], now })).toBe('poc-form-POC-2026-001-20261105.html')
    expect(formFileName({ mode: 'fill', pocIds: ['A', 'B'], now })).toBe('poc-forms-2-20261105.html')
    expect(formFileName({ mode: 'blank', pocIds: [], now })).toBe('poc-form-new-20261105.html')
  })
})

describe('page behavior', () => {
  it('auto-saves to the stable draft key', () => {
    const html = buildFormHtml({ mode: 'fill', projects: [TRICKY] })
    const script = scriptOf(html)
    expect(script).toContain('DATA.draftKey')
    expect(script).toContain('localStorage.setItem')
    // A periodic save covers edits that never blur.
    expect(script).toContain('setInterval')
    // A corrupt draft must be dropped rather than blocking the form.
    expect(script).toContain('removeItem(DATA.draftKey)')
  })

  it('validates live against the documented counts', () => {
    const script = scriptOf(buildFormHtml({ mode: 'fill', projects: [TRICKY] }))
    expect(script).toContain('success_criteria')
    expect(script).toContain('要求 2-3 个')
    expect(script).toContain('要求 3-5 个')
    expect(script).toContain('上限 3 个')
    // The four G0 prerequisites are all reported individually.
    expect(script).toContain('客户为什么测 未填')
    expect(script).toContain('我们为什么测 未填')
    expect(script).toContain('客户技术责任人 未填')
  })

  it('degrades honestly when localStorage is unavailable', () => {
    const script = scriptOf(buildFormHtml({ mode: 'blank', projects: [] }))
    expect(script).toContain('probeStorage')
    expect(script).toContain('禁用了本地存储')
  })
})
