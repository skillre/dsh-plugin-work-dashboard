/**
 * The v3 collection form: a self-contained HTML file a colleague can fill in.
 *
 * ## What changed from the v1 form
 *
 * The v1 generator modelled `why_customer_test` / `success_criteria` /
 * `result` / `timeline` — all removed by v3. Shipping it would have handed
 * colleagues a file the ledger can no longer read, so it was held back while
 * this replacement was written, and then deleted.
 *
 * v3 is **progress-centred**: `gate0` says whether the project is worth doing,
 * `plan` says how to win, and `progress[]` is the append-only history. The form
 * therefore asks for exactly those three, and nothing else:
 *
 * 1. **G0** — the five prerequisites (four here; `tech_owner` is identity, which
 *    the blank form asks for too), each with a "why this matters" hint.
 * 2. **Plan** — pain, expected recognition, 2–3 criteria, 3–5 scenarios, ≤3
 *    risks, edge. The counts are validated live because the gap rules enforce
 *    them and a colleague cannot know that.
 * 3. **Progress** — one new entry, appended. The form never rewrites history.
 *
 * ## What is kept from v1 because it was hard-won
 *
 * - **One file, no server, no CDN.** Everything inlined, works offline.
 * - **Autosave keyed by the project set**, not by a timestamp: regenerating the
 *   form for the same projects must find the same draft.
 * - **Real YAML out**, via `yaml`'s own stringifier, so `name: 某某：试点` stays
 *   valid.
 * - **One file per project** on download, so two colleagues never clobber a
 *   shared file.
 *
 * ## What it deliberately does NOT do
 *
 * It does not write to the ledger. The output is a `.yaml` the owner reviews and
 * commits; submission stays a human-merged PR, which is the ledger's design.
 */

import YAML from 'yaml'
import type { PocRecord } from './types.js'

/** The four G0 prerequisites that live under `gate0` (the fifth is identity). */
export const G0_FIELDS = Object.freeze([
  'why_customer',
  'why_us',
  'decision_chain',
  'post_poc_decision',
] as const)

/** One plan criterion, as the form edits it. */
export interface FormCriterion {
  name: string
  metric: string
  baseline: string
  target: string
}

/** One plan risk. */
export interface FormRisk {
  name: string
  level: string
  mitigation: string
}

/** One progress entry the form can append. */
export interface FormProgress {
  seq: number | null
  date: string
  type: string
  goal: string
  items: string[]
  actual: string
  completion: string
  evidence: Array<{ title: string; link: string; type: string }>
  customer: { synced_with: string; feedback: string; recognition: string }
  gate3_1: string
  gate3_2: string
  next: { goal: string; owner: string; deadline: string }
}

/**
 * The project shape the form edits.
 *
 * A flat, all-strings view of one `PocRecord` plus its pending progress entry.
 * Flat because the generated page is plain JS with no schema awareness: the Host
 * normalizes once here instead of repeating the walk in the browser.
 */
export interface FormProject {
  pocId: string
  name: string
  system: string
  company: string
  department: string
  amountWan: string
  pocType: string
  owner: string
  sales: string
  techOwner: string
  execSponsor: string
  stage: string
  status: string
  stageSince: string
  gate0: {
    why_customer: string
    why_us: string
    decision_chain: string
    post_poc_decision: string
    competitor: string
    conclusion: string
    reviewer: string
    reviewed_at: string
  }
  plan: {
    customer_pain: string
    expected_recognition: string
    our_edge: string
    criteria: FormCriterion[]
    scenarios: string[]
    risks: FormRisk[]
    timeline_start: string
    timeline_end: string
    gate1_conclusion: string
    gate2_ready: string
  }
  /** The entry this form adds; `null` in a blank form until the user fills it. */
  progress: FormProgress
  /** How many entries the project already has (so `seq` can continue). */
  existingProgressCount: number
}

/** Options for one generation run. */
export interface FormOptions {
  /** `fill` pre-fills from the ledger; `blank` is an empty new-project form. */
  mode: 'fill' | 'blank'
  /** Projects to include; one blank project for `blank` mode. */
  projects: FormProject[]
  /** Clock injection so the generated header and default dates are testable. */
  now?: Date
}

/** Coerce a stored value to the string the form edits. */
function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

/** A `YYYY-MM-DD` date, or `''`. */
function dateText(value: unknown): string {
  const raw = text(value)
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : ''
}

/**
 * Convert one ledger record into the form's project shape.
 *
 * Every field becomes a string or a list of strings. A missing block becomes an
 * empty one rather than `undefined`, so the generated script never has to guard.
 */
export function projectForForm(record: PocRecord): FormProject {
  const gate0 = record.gate0 ?? {}
  const plan = record.plan ?? {}
  const progress = Array.isArray(record.progress) ? record.progress : []
  const org = record.org ?? {}
  const review = gate0.review ?? {}
  return {
    pocId: text(record.poc_id),
    name: text(record.name),
    system: text(org.system),
    company: text(org.company),
    department: text(org.department),
    amountWan: numberText(record.amount_wan),
    pocType: text(record.poc_type),
    owner: text(record.owner),
    sales: text(record.sales),
    techOwner: text(record.tech_owner),
    execSponsor: text(record.exec_sponsor),
    stage: text(record.stage),
    status: text(record.status),
    stageSince: dateText(record.stage_since),
    gate0: {
      why_customer: text(gate0.why_customer),
      why_us: text(gate0.why_us),
      decision_chain: text(gate0.decision_chain),
      post_poc_decision: text(gate0.post_poc_decision),
      competitor: text(gate0.competitor),
      conclusion: text(review.conclusion),
      reviewer: text(review.reviewer),
      reviewed_at: dateText(review.reviewed_at),
    },
    plan: {
      customer_pain: text(plan.customer_pain),
      expected_recognition: text(plan.expected_recognition),
      our_edge: text(plan.our_edge),
      criteria: (Array.isArray(plan.criteria) ? plan.criteria : []).map((item) => ({
        name: text(item?.name),
        metric: text(item?.metric),
        baseline: text(item?.baseline),
        target: text(item?.target),
      })),
      scenarios: (Array.isArray(plan.scenarios) ? plan.scenarios : []).map(text).filter((item) => item !== ''),
      risks: (Array.isArray(plan.risks) ? plan.risks : []).map((item) => ({
        name: text(item?.name),
        level: text(item?.level).toLowerCase(),
        mitigation: text(item?.mitigation),
      })),
      timeline_start: dateText(plan.timeline?.start),
      timeline_end: dateText(plan.timeline?.end),
      gate1_conclusion: text(plan.gate1?.conclusion),
      gate2_ready: text(plan.gate2?.ready),
    },
    progress: blankProgress(progress.length),
    existingProgressCount: progress.length,
  }
}

/** A numeric field as the form's string, keeping `0` distinct from blank. */
function numberText(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  const raw = text(value)
  return raw === '' ? '' : raw
}

/** One empty progress entry, with `seq` continuing the existing count. */
export function blankProgress(existingCount: number): FormProgress {
  return {
    seq: existingCount + 1,
    date: '',
    type: '',
    goal: '',
    items: [''],
    actual: '',
    completion: '',
    evidence: [],
    customer: { synced_with: '', feedback: '', recognition: '' },
    gate3_1: '',
    gate3_2: '',
    next: { goal: '', owner: '', deadline: '' },
  }
}

/** The blank project a `blank`-mode form edits. */
export function blankProject(): FormProject {
  return {
    pocId: '',
    name: '',
    system: '',
    company: '',
    department: '',
    amountWan: '',
    pocType: '',
    owner: '',
    sales: '',
    techOwner: '',
    execSponsor: '',
    stage: 'G0-立项',
    status: '进行中',
    stageSince: '',
    gate0: {
      why_customer: '',
      why_us: '',
      decision_chain: '',
      post_poc_decision: '',
      competitor: '',
      conclusion: '',
      reviewer: '',
      reviewed_at: '',
    },
    plan: {
      customer_pain: '',
      expected_recognition: '',
      our_edge: '',
      criteria: [],
      scenarios: [],
      risks: [],
      timeline_start: '',
      timeline_end: '',
      gate1_conclusion: '',
      gate2_ready: '',
    },
    progress: blankProgress(0),
    existingProgressCount: 0,
  }
}

/**
 * Build the stable draft key.
 *
 * Sorting the ids makes the key independent of selection order, so the same set
 * of projects always resumes the same draft — even if the user regenerates the
 * form later. A blank form gets a constant key so its draft survives too.
 */
export function draftKeyFor(mode: 'fill' | 'blank', pocIds: readonly string[]): string {
  if (mode === 'blank') return 'poc-v3-form-draft-blank'
  return `poc-v3-form-draft-${[...pocIds].sort().join('+')}`
}

/** Drop empty strings from a list, so a stored YAML has no blank rows. */
function compact(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value !== '')
}

/**
 * Serialize one project back to the v3 YAML shape.
 *
 * `yaml`'s own stringifier rather than concatenation: a value containing `: `,
 * `#`, quotes or a newline must be quoted correctly, which hand-built strings
 * get wrong (`name: 某某：试点` produced invalid YAML in the reference tool).
 *
 * Empty plan/progress blocks are emitted as empty collections, not omitted: the
 * ledger's parser tolerates absence, but a colleague reopening the file should
 * see the shape they are expected to fill.
 */
export function projectToYaml(project: FormProject): string {
  const document: Record<string, unknown> = {
    poc_id: project.pocId,
    name: project.name,
    org: {
      system: project.system === '' ? null : project.system,
      company: project.company === '' ? null : project.company,
      department: project.department === '' ? null : project.department,
    },
    amount_wan: project.amountWan === '' ? null : Number(project.amountWan),
    poc_type: project.pocType === '' ? null : project.pocType,
    owner: project.owner === '' ? null : project.owner,
    sales: project.sales === '' ? null : project.sales,
    tech_owner: project.techOwner === '' ? null : project.techOwner,
    exec_sponsor: project.execSponsor === '' ? null : project.execSponsor,
    stage: project.stage,
    status: project.status,
    stage_since: project.stageSince === '' ? null : project.stageSince,
    gate0: {
      why_customer: project.gate0.why_customer === '' ? null : project.gate0.why_customer,
      why_us: project.gate0.why_us === '' ? null : project.gate0.why_us,
      decision_chain: project.gate0.decision_chain === '' ? null : project.gate0.decision_chain,
      post_poc_decision: project.gate0.post_poc_decision === '' ? null : project.gate0.post_poc_decision,
      competitor: project.gate0.competitor === '' ? null : project.gate0.competitor,
      review: {
        conclusion: project.gate0.conclusion === '' ? null : project.gate0.conclusion,
        reviewer: project.gate0.reviewer === '' ? null : project.gate0.reviewer,
        reviewed_at: project.gate0.reviewed_at === '' ? null : project.gate0.reviewed_at,
      },
    },
    plan: {
      customer_pain: project.plan.customer_pain === '' ? null : project.plan.customer_pain,
      expected_recognition: project.plan.expected_recognition === '' ? null : project.plan.expected_recognition,
      criteria: project.plan.criteria
        .filter((criterion) => criterion.name.trim() !== '')
        .map((criterion) => ({
          name: criterion.name.trim(),
          metric: criterion.metric.trim() === '' ? null : criterion.metric.trim(),
          baseline: criterion.baseline.trim() === '' ? null : criterion.baseline.trim(),
          target: criterion.target.trim() === '' ? null : criterion.target.trim(),
        })),
      scenarios: compact(project.plan.scenarios),
      our_edge: project.plan.our_edge === '' ? null : project.plan.our_edge,
      timeline: {
        start: project.plan.timeline_start === '' ? null : project.plan.timeline_start,
        end: project.plan.timeline_end === '' ? null : project.plan.timeline_end,
      },
      risks: project.plan.risks
        .filter((risk) => risk.name.trim() !== '')
        .map((risk) => ({
          name: risk.name.trim(),
          level: risk.level === '' ? null : risk.level,
          mitigation: risk.mitigation.trim() === '' ? null : risk.mitigation.trim(),
        })),
      gate1: { conclusion: project.plan.gate1_conclusion === '' ? null : project.plan.gate1_conclusion },
      gate2: { ready: project.plan.gate2_ready === '' ? null : project.plan.gate2_ready },
    },
    progress: progressIsEmpty(project.progress) ? [] : [serializeProgress(project.progress)],
    outcome: {
      achievement: null,
      customer_recognition: null,
      our_proof: null,
      remaining_risks: null,
      conclusion: { proved: null, recognized: null, next_business: null },
      business: { milestone: null, owner: null, deadline: null, status: null },
      overall: null,
      reviewed_at: null,
    },
  }
  return YAML.stringify(document, { lineWidth: 0 })
}

/** `true` when the form's progress entry carries no user content. */
function progressIsEmpty(entry: FormProgress): boolean {
  return (
    entry.date === '' &&
    entry.type === '' &&
    entry.goal === '' &&
    entry.actual === '' &&
    compact(entry.items).length === 0 &&
    entry.evidence.every((item) => item.title.trim() === '')
  )
}

/** One progress entry in the ledger's own shape. */
function serializeProgress(entry: FormProgress): Record<string, unknown> {
  return {
    seq: entry.seq,
    date: entry.date,
    type: entry.type === '' ? null : entry.type,
    goal: entry.goal === '' ? null : entry.goal,
    items: compact(entry.items),
    actual: entry.actual === '' ? null : entry.actual,
    completion: entry.completion === '' ? null : entry.completion,
    evidence: entry.evidence
      .filter((item) => item.title.trim() !== '')
      .map((item) => ({
        title: item.title.trim(),
        link: item.link.trim() === '' ? null : item.link.trim(),
        type: item.type === '' ? null : item.type,
      })),
    customer: {
      synced_with: entry.customer.synced_with === '' ? null : entry.customer.synced_with,
      feedback: entry.customer.feedback === '' ? null : entry.customer.feedback,
      recognition: entry.customer.recognition === '' ? null : entry.customer.recognition,
    },
    gate3_1: entry.gate3_1 === '' ? null : entry.gate3_1,
    gate3_2: entry.gate3_2 === '' ? null : entry.gate3_2,
    next: {
      goal: entry.next.goal === '' ? null : entry.next.goal,
      owner: entry.next.owner === '' ? null : entry.next.owner,
      deadline: entry.next.deadline === '' ? null : entry.next.deadline,
    },
  }
}

/** Escape a value for embedding inside a `<script>` block. */
function scriptSafe(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/** Escape text for HTML content. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** The enums, mirrored from `schemas/enums.yaml`. */
const ENUMS = {
  pocType: ['SDL', 'ACG', 'AI安全', '保护AI', '虚拟化', '大体量项目'],
  stage: ['G0-立项', 'G1-方案设计', 'G2-方案验证', 'G3-结果验证', 'G4-结果转化', 'closed'],
  status: ['进行中', '暂停', '已关闭', '已取消'],
  g0Conclusion: ['通过', '未通过-退出', '未通过-降级', '待评审'],
  g1Conclusion: ['通过', '补充后进入', '未通过'],
  g2Ready: ['Ready', '有风险', '未Ready'],
  recognition: ['认可', '部分认可', '未认可', '待确认'],
  progressType: ['内部Review', '客户阶段同步', 'Checkpoint'],
  completion: ['0%', '25%', '50%', '75%', '100%'],
  riskLevel: ['high', 'medium', 'low'],
  gate3_1: ['可证明', '待补证据'],
  gate3_2: ['已确认', '待确认'],
  evidenceType: ['文档', '截图', '数据', '邮件', '链接'],
  system: ['人保体系', '国寿体系'],
}

/** The state the generated page boots from. */
export interface FormPayload {
  mode: 'fill' | 'blank'
  generatedAt: string
  today: string
  projects: FormProject[]
  draftKey: string
  enums: typeof ENUMS
  /** The G0 fields, in schema order, with their prompt text. */
  g0Fields: Array<{ key: string; label: string; hint: string }>
}

/** The G0 prompts: the label and the reason each field exists. */
const G0_PROMPTS: Array<{ key: string; label: string; hint: string }> = [
  { key: 'why_customer', label: '客户为什么要测', hint: '客户自己的痛点与压力，不是我们的卖点。' },
  { key: 'why_us', label: '我们为什么测', hint: '对我们的价值：突破点、可复制的样板、后续生意。' },
  { key: 'decision_chain', label: '项目流程 / 决策链', hint: '谁提需求、谁评审、谁签字、按什么流程走。' },
  { key: 'post_poc_decision', label: '测完之后客户会做什么决定', hint: '采购、扩容、试点转正，还是就此结束。' },
]

/**
 * Generate the complete HTML form.
 *
 * The returned string is the whole document: no external stylesheet, script,
 * font or image reference.
 */
export function buildFormHtml(options: FormOptions): string {
  const now = options.now ?? new Date()
  const projects = options.mode === 'blank' ? [blankProject()] : options.projects
  const payload: FormPayload = {
    mode: options.mode,
    generatedAt: now.toISOString(),
    today: now.toISOString().slice(0, 10),
    projects,
    draftKey: draftKeyFor(options.mode, projects.map((project) => project.pocId).filter((id) => id !== '')),
    enums: ENUMS,
    g0Fields: G0_PROMPTS,
  }
  const data = scriptSafe(JSON.stringify(payload))
  const title = options.mode === 'blank' ? 'POC 新建项目表单 v3' : `POC 信息收集表单 v3（${projects.length} 个项目）`

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${FORM_CSS}</style>
</head>
<body>
<div class="shell">
  <header class="topbar">
    <div class="topbar-text">
      <h1 class="topbar-title">${escapeHtml(title)}</h1>
      <p class="topbar-sub">按台账 v3 字段收集。填完点「下载 YAML」，把文件发回项目负责人；保存的是真实 YAML，可以直接提交。</p>
    </div>
    <div class="topbar-actions">
      <span class="save-status" id="saveStatus">已就绪</span>
      <button type="button" class="btn" id="clearBtn">清空草稿</button>
    </div>
  </header>
  <div class="notice" id="restoreNotice" hidden>已恢复上次未提交的草稿。</div>
  <div class="notice notice-warn" id="draftNotice" hidden></div>
  <main id="formBody"></main>
  <footer class="footer">
    <div class="footer-info" id="footerInfo">正在初始化…</div>
    <div class="footer-actions">
      <button type="button" class="btn" id="previewBtn">预览 YAML</button>
      <button type="button" class="btn btn-primary" id="downloadBtn">下载 YAML</button>
    </div>
  </footer>
</div>
<pre class="yaml-preview" id="yamlPreview" hidden></pre>
<div class="toast" id="toast" hidden></div>
<script>
(function () {
  'use strict';
  var DATA = ${data};
  ${FORM_SCRIPT}
})();
</script>
</body>
</html>
`
}

/** A file name for the generated form. */
export function formFileName(options: { mode: 'fill' | 'blank'; pocIds: readonly string[]; now?: Date }): string {
  const now = options.now ?? new Date()
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  if (options.mode === 'blank') return `poc-form-v3-new-${stamp}.html`
  if (options.pocIds.length === 1) return `poc-form-v3-${options.pocIds[0]}-${stamp}.html`
  return `poc-forms-v3-${options.pocIds.length}-${stamp}.html`
}

/** The file name a colleague should save one project's YAML under. */
export function yamlFileName(project: FormProject, now: Date = new Date()): string {
  const id = project.pocId.trim() === '' ? 'new' : project.pocId.trim()
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  return `${id}-${stamp}.yaml`
}

/** Re-export the YAML library's parse for the round-trip test. */
export { YAML }

/** Styles: one inline sheet, the console's own design tokens. */
const FORM_CSS = `
:root{--primary:#2864E8;--text:#192638;--bg:#F5F7FB;--border:#E6EBF2;--green:#218568;--amber:#B77919;--red:#C0392B;--muted:#6B7C93}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Avenir Next','PingFang SC','Microsoft YaHei',system-ui,sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.6;padding:24px}
.shell{max-width:920px;margin:0 auto}
.topbar{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;background:#fff;padding:16px 24px;border-radius:8px;border:1px solid var(--border);margin-bottom:12px;position:sticky;top:0;z-index:100}
.topbar-title{font-size:18px;font-weight:600;line-height:1.4}
.topbar-sub{font-size:12px;color:var(--muted);margin-top:2px}
.topbar-actions{display:flex;align-items:center;gap:8px;flex:none}
.save-status{font-size:12px;color:var(--green);white-space:nowrap}
.notice{background:#E8EFFC;border:1px solid #C9DCFB;border-radius:6px;padding:10px 14px;font-size:13px;margin-bottom:12px}
.notice-warn{background:#FDF4E3;border-color:#F0E2C8;color:#8A5E12}
.card{background:#fff;border-radius:8px;border:1px solid var(--border);padding:20px 24px;margin-bottom:14px}
.card-title{font-size:15px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.card-hint{font-size:12px;color:var(--muted);margin-bottom:14px}
.field{margin-bottom:16px}
.field:last-child{margin-bottom:0}
.field-label{display:block;font-weight:500;margin-bottom:5px;font-size:13px}
.field-label .req{color:var(--red);margin-left:2px}
.field-help{font-size:12px;color:var(--muted);margin-bottom:5px}
.input,.textarea,.select{width:100%;padding:8px 11px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px;background:#fff;color:var(--text)}
.input:focus,.textarea:focus,.select:focus{outline:none;border-color:var(--primary)}
.textarea{min-height:66px;resize:vertical}
.field-error{color:var(--red);font-size:12px;margin-top:4px;display:none}
.field.has-error .input,.field.has-error .textarea,.field.has-error .select{border-color:var(--red)}
.field.has-error .field-error{display:block}
.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}
@media(max-width:640px){.grid-2{grid-template-columns:minmax(0,1fr)}}
.list-item{display:flex;gap:8px;margin-bottom:8px;align-items:flex-start}
.list-item .input{flex:1}
.btn{padding:7px 14px;border-radius:6px;border:1px solid var(--border);background:#fff;cursor:pointer;font-family:inherit;font-size:13px;color:var(--text)}
.btn:hover{background:#F8F9FB}
.btn-primary{background:var(--primary);color:#fff;border-color:var(--primary)}
.btn-primary:hover{background:#1E54C9}
.btn-sm{padding:4px 10px;font-size:12px}
.btn-remove{color:var(--red);border-color:#F0D0CB}
.badge{display:inline-block;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:500}
.badge-ok{background:#E6F4EE;color:var(--green)}
.badge-warn{background:#FDF4E3;color:var(--amber)}
.badge-error{background:#FBEAE8;color:var(--red)}
.badge-info{background:#E8EFFC;color:var(--primary)}
.gaps{background:#FDF8F0;border:1px solid #F0E2C8;border-radius:6px;padding:10px 14px;margin-bottom:14px}
.gap-item{font-size:13px;padding:3px 0;display:flex;gap:8px}
.gap-high{color:var(--red)}
.gap-medium{color:var(--amber)}
.g0-summary{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.g0-chip{font-size:12px;padding:3px 10px;border-radius:12px;border:1px solid var(--border);background:#F7F9FC}
.g0-chip[data-present="true"]{background:#E6F4EE;border-color:#BFE3D3;color:var(--green)}
.g0-chip[data-present="false"]{background:#FBEAE8;border-color:#F0D0CB;color:var(--red)}
.footer{position:sticky;bottom:0;background:#fff;border:1px solid var(--border);border-radius:8px;padding:14px 24px;margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;box-shadow:0 -4px 12px rgba(0,0,0,.04)}
.footer-info{font-size:13px;color:var(--muted)}
.footer-actions{display:flex;gap:8px;flex-wrap:wrap}
.yaml-preview{background:#fff;padding:16px;border-radius:8px;border:1px solid var(--border);overflow:auto;font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;margin-top:14px;white-space:pre-wrap}
.toast{position:fixed;top:80px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;padding:9px 18px;border-radius:6px;font-size:13px;z-index:200}
@media print{.topbar,.footer,.topbar-actions{position:static}}
`

/**
 * The generated page script.
 *
 * Plain ES5 (no arrow functions, no template literals, no `const`): the file has
 * to run from `file://` in any browser a colleague happens to have. It also
 * keeps the generator's own template escaping simple.
 *
 * It renders a form from `DATA`, keeps a draft in localStorage, validates the
 * counts the gap rules enforce, and downloads real YAML — one file per project.
 */
const FORM_SCRIPT = `
  var state = { active: 0 };
  var saveTimer = null;
  var storageAvailable = true;

  function text(value) {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function byId(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return text(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showToast(message) {
    var toast = byId('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toast.hidden = true; }, 2200);
  }

  function probeStorage() {
    try {
      var probe = '__poc_v3_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  }

  function storageKey() { return DATA.draftKey; }

  function loadDraft() {
    if (!storageAvailable) return null;
    try {
      var raw = window.localStorage.getItem(storageKey());
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.projects || !parsed.projects.length) return null;
      return parsed.projects;
    } catch (error) {
      return null;
    }
  }

  function save(quiet) {
    if (!storageAvailable) {
      markSave('草稿无法保存（浏览器禁用了本地存储）');
      return;
    }
    try {
      window.localStorage.setItem(storageKey(), JSON.stringify({ projects: DATA.projects, savedAt: new Date().toISOString() }));
      markSave('已自动保存');
    } catch (error) {
      markSave('草稿保存失败：可能空间不足');
    }
  }

  function markSave(message) {
    var node = byId('saveStatus');
    if (node) node.textContent = message;
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { save(false); }, 600);
  }

  function clearDraft() {
    if (storageAvailable) {
      try { window.localStorage.removeItem(storageKey()); } catch (error) {}
    }
    DATA.projects = DATA.mode === 'blank' ? [blankProject()] : DATA.projects;
    location.reload();
  }

  function blankProject() {
    return ${JSON.stringify(blankProjectPayload())};
  }

  function current() { return DATA.projects[state.active]; }

  function setPath(target, path, value) {
    var parts = path.split('.');
    var node = target;
    for (var i = 0; i < parts.length - 1; i += 1) {
      var key = parts[i];
      if (key === '') continue;
      if (/^\\d+$/.test(key)) key = Number(key);
      if (node[key] === null || node[key] === undefined) node[key] = {};
      node = node[key];
    }
    node[parts[parts.length - 1]] = value;
  }

  function field(label, path, value, options) {
    var opts = options || {};
    var help = opts.help ? '<p class="field-help">' + escapeHtml(opts.help) + '</p>' : '';
    var req = opts.required ? '<span class="req">*</span>' : '';
    var input;
    if (opts.multiline) {
      input = '<textarea class="textarea" data-path="' + escapeHtml(path) + '">' + escapeHtml(value) + '</textarea>';
    } else if (opts.enum) {
      input = '<select class="select" data-path="' + escapeHtml(path) + '">';
      input += '<option value="">— 未填 —</option>';
      for (var i = 0; i < opts.enum.length; i += 1) {
        var option = opts.enum[i];
        input += '<option value="' + escapeHtml(option) + '"' + (option === value ? ' selected' : '') + '>' + escapeHtml(option) + '</option>';
      }
      input += '</select>';
    } else {
      input = '<input class="input" type="' + (opts.date ? 'date' : opts.number ? 'number' : 'text') + '" data-path="' + escapeHtml(path) + '" value="' + escapeHtml(value) + '">';
    }
    return '<div class="field" data-field="' + escapeHtml(path) + '">' +
      '<label class="field-label">' + escapeHtml(label) + req + '</label>' + help + input + '</div>';
  }

  function g0Card(project) {
    var chips = '';
    for (var i = 0; i < DATA.g0Fields.length; i += 1) {
      var def = DATA.g0Fields[i];
      var present = text(project.gate0[def.key]).trim() !== '';
      chips += '<span class="g0-chip" data-present="' + (present ? 'true' : 'false') + '">' +
        (present ? '✓ ' : '✗ ') + escapeHtml(def.label) + '</span>';
    }
    var body = '';
    for (var j = 0; j < DATA.g0Fields.length; j += 1) {
      var field0 = DATA.g0Fields[j];
      body += field(field0.label, 'gate0.' + field0.key, project.gate0[field0.key], { multiline: true, help: field0.hint, required: true });
    }
    body += '<div class="grid-2">' +
      field('主要竞争对手', 'gate0.competitor', project.gate0.competitor, {}) +
      field('G0 评审结论', 'gate0.conclusion', project.gate0.conclusion, { enum: DATA.enums.g0Conclusion }) +
      field('G0 评审人', 'gate0.reviewer', project.gate0.reviewer, {}) +
      field('评审日期', 'gate0.reviewed_at', project.gate0.reviewed_at, { date: true }) +
      '</div>';
    return '<section class="card"><h2 class="card-title">G0 · 值不值得做<span class="badge badge-info">五必填</span></h2>' +
      '<p class="card-hint">四项在 G0 区，第五项是身份区的「客户技术责任人」。这五项齐了，评审才有意义。</p>' +
      '<div class="g0-summary">' + chips + '</div>' + body + '</section>';
  }

  function criteriaList(project) {
    var rows = '';
    for (var i = 0; i < project.plan.criteria.length; i += 1) {
      var criterion = project.plan.criteria[i];
      rows += '<div class="list-item">' +
        '<input class="input" data-path="plan.criteria.' + i + '.name" value="' + escapeHtml(criterion.name) + '" placeholder="指标名称，如「200 人并发稳定 7 天」">' +
        '<input class="input" data-path="plan.criteria.' + i + '.metric" value="' + escapeHtml(criterion.metric) + '" placeholder="度量，如「成功率」">' +
        '<input class="input" data-path="plan.criteria.' + i + '.baseline" value="' + escapeHtml(criterion.baseline) + '" placeholder="基线">' +
        '<input class="input" data-path="plan.criteria.' + i + '.target" value="' + escapeHtml(criterion.target) + '" placeholder="目标，如 ≥99.5%">' +
        '<button type="button" class="btn btn-sm btn-remove" data-remove="criteria" data-index="' + i + '">删</button>' +
        '</div>';
    }
    return rows + '<button type="button" class="btn btn-sm" data-add="criteria">+ 加一条指标</button>';
  }

  function scenarioList(project) {
    var rows = '';
    for (var i = 0; i < project.plan.scenarios.length; i += 1) {
      rows += '<div class="list-item">' +
        '<input class="input" data-path="plan.scenarios.' + i + '" value="' + escapeHtml(project.plan.scenarios[i]) + '" placeholder="测试场景">' +
        '<button type="button" class="btn btn-sm btn-remove" data-remove="scenarios" data-index="' + i + '">删</button>' +
        '</div>';
    }
    return rows + '<button type="button" class="btn btn-sm" data-add="scenarios">+ 加一个场景</button>';
  }

  function riskList(project) {
    var rows = '';
    for (var i = 0; i < project.plan.risks.length; i += 1) {
      var risk = project.plan.risks[i];
      var select = '<select class="select" data-path="plan.risks.' + i + '.level">';
      select += '<option value="">— 未评级 —</option>';
      for (var j = 0; j < DATA.enums.riskLevel.length; j += 1) {
        var level = DATA.enums.riskLevel[j];
        select += '<option value="' + level + '"' + (level === risk.level ? ' selected' : '') + '>' + level + '</option>';
      }
      select += '</select>';
      rows += '<div class="list-item">' +
        '<input class="input" data-path="plan.risks.' + i + '.name" value="' + escapeHtml(risk.name) + '" placeholder="风险">' +
        select +
        '<input class="input" data-path="plan.risks.' + i + '.mitigation" value="' + escapeHtml(risk.mitigation) + '" placeholder="应对">' +
        '<button type="button" class="btn btn-sm btn-remove" data-remove="risks" data-index="' + i + '">删</button>' +
        '</div>';
    }
    return rows + '<button type="button" class="btn btn-sm" data-add="risks">+ 加一条风险</button>';
  }

  function planCard(project) {
    var criteria = project.plan.criteria.length;
    var scenarios = project.plan.scenarios.length;
    var risks = project.plan.risks.length;
    var criteriaBadge = criteria === 0 ? '<span class="badge badge-warn">还没有指标</span>'
      : (criteria >= 2 && criteria <= 3 ? '<span class="badge badge-ok">' + criteria + ' 条，符合 2–3</span>'
      : '<span class="badge badge-error">' + criteria + ' 条，要求 2–3</span>');
    var scenarioBadge = scenarios === 0 ? '<span class="badge badge-warn">还没有场景</span>'
      : (scenarios >= 3 && scenarios <= 5 ? '<span class="badge badge-ok">' + scenarios + ' 个，符合 3–5</span>'
      : '<span class="badge badge-error">' + scenarios + ' 个，要求 3–5</span>');
    var riskBadge = risks === 0 ? '<span class="badge badge-warn">还没有风险</span>'
      : (risks <= 3 ? '<span class="badge badge-ok">' + risks + ' 条，≤3</span>'
      : '<span class="badge badge-error">' + risks + ' 条，超过 3</span>');
    return '<section class="card"><h2 class="card-title">计划 · 怎么赢<span class="badge badge-info">G1 / G2</span></h2>' +
      '<p class="card-hint">指标和场景都有数量要求：指标 2–3 条、场景 3–5 个、风险不超过 3 条。数量不对会在缺口清单里被点名。</p>' +
      field('客户核心痛点', 'plan.customer_pain', project.plan.customer_pain, { multiline: true }) +
      field('期望客户认可什么', 'plan.expected_recognition', project.plan.expected_recognition, { multiline: true }) +
      field('我方优势 / 赢点', 'plan.our_edge', project.plan.our_edge, { multiline: true }) +
      '<div class="field"><label class="field-label">关键成功指标 ' + criteriaBadge + '</label>' + criteriaList(project) + '</div>' +
      '<div class="field"><label class="field-label">关键测试场景 ' + scenarioBadge + '</label>' + scenarioList(project) + '</div>' +
      '<div class="field"><label class="field-label">最大风险 ' + riskBadge + '</label>' + riskList(project) + '</div>' +
      '<div class="grid-2">' +
      field('计划开始', 'plan.timeline_start', project.plan.timeline_start, { date: true }) +
      field('计划结束', 'plan.timeline_end', project.plan.timeline_end, { date: true }) +
      field('G1 结论', 'plan.gate1_conclusion', project.plan.gate1_conclusion, { enum: DATA.enums.g1Conclusion }) +
      field('G2 Ready 状态', 'plan.gate2_ready', project.plan.gate2_ready, { enum: DATA.enums.g2Ready }) +
      '</div></section>';
  }

  function progressCard(project) {
    var entry = project.progress;
    var evidenceRows = '';
    for (var i = 0; i < entry.evidence.length; i += 1) {
      evidenceRows += '<div class="list-item">' +
        '<input class="input" data-path="progress.evidence.' + i + '.title" value="' + escapeHtml(entry.evidence[i].title) + '" placeholder="证据名称，如「压测报告」">' +
        '<input class="input" data-path="progress.evidence.' + i + '.link" value="' + escapeHtml(entry.evidence[i].link) + '" placeholder="链接（可空）">' +
        '<button type="button" class="btn btn-sm btn-remove" data-remove="evidence" data-index="' + i + '">删</button>' +
        '</div>';
    }
    var head = '<section class="card"><h2 class="card-title">进展 · 这一次做了什么' +
      (project.existingProgressCount > 0 ? '<span class="badge badge-info">已有 ' + project.existingProgressCount + ' 条</span>' : '<span class="badge badge-warn">第一条进展</span>') +
      '</h2><p class="card-hint">进展是追加式的：这里填的是一条新记录，不会覆盖已有历史。日期、实际结果和下一步是必填项。</p>';
    var body = '<div class="grid-2">' +
      field('日期', 'progress.date', entry.date, { date: true, required: true }) +
      field('类型', 'progress.type', entry.type, { enum: DATA.enums.progressType, required: true }) +
      field('目标', 'progress.goal', entry.goal, {}) +
      field('完成度', 'progress.completion', entry.completion, { enum: DATA.enums.completion }) +
      '</div>' +
      field('实际结果', 'progress.actual', entry.actual, { multiline: true, required: true, help: '做了什么、结果如何。没有证据的结果会被缺口规则点名。' }) +
      '<div class="field"><label class="field-label">证据（没有证据的结果会被点名）</label>' + evidenceRows +
      '<button type="button" class="btn btn-sm" data-add="evidence">+ 加一条证据</button></div>' +
      '<div class="grid-2">' +
      field('同步对象', 'progress.customer.synced_with', entry.customer.synced_with, {}) +
      field('客户认可度', 'progress.customer.recognition', entry.customer.recognition, { enum: DATA.enums.recognition }) +
      field('G3-1', 'progress.gate3_1', entry.gate3_1, { enum: DATA.enums.gate3_1 }) +
      field('G3-2', 'progress.gate3_2', entry.gate3_2, { enum: DATA.enums.gate3_2 }) +
      '</div>' +
      field('客户反馈', 'progress.customer.feedback', entry.customer.feedback, { multiline: true }) +
      '<div class="grid-2">' +
      field('下一步目标', 'progress.next.goal', entry.next.goal, { multiline: true, required: true }) +
      field('下一步负责人', 'progress.next.owner', entry.next.owner, {}) +
      field('下一步截止', 'progress.next.deadline', entry.next.deadline, { date: true }) +
      '</div></section>';
    return head + body;
  }

  function identityCard(project) {
    return '<section class="card"><h2 class="card-title">身份</h2>' +
      '<p class="card-hint">立项时确定，之后很少变。客户技术责任人算 G0 五必填之一。</p>' +
      '<div class="grid-2">' +
      field('项目编号', 'pocId', project.pocId, { required: DATA.mode === 'blank', help: DATA.mode === 'blank' ? '新建时必填，格式 POC-XXX。' : '' }) +
      field('项目名称', 'name', project.name, { required: true }) +
      field('体系', 'system', project.system, { enum: DATA.enums.system }) +
      field('客户公司', 'company', project.company, {}) +
      field('部门', 'department', project.department, {}) +
      field('预计金额（万元）', 'amountWan', project.amountWan, { number: true }) +
      field('项目类型', 'pocType', project.pocType, { enum: DATA.enums.pocType }) +
      field('阶段', 'stage', project.stage, { enum: DATA.enums.stage }) +
      field('状态', 'status', project.status, { enum: DATA.enums.status }) +
      field('进入阶段日期', 'stageSince', project.stageSince, { date: true, help: '不填就算不出停滞天数。' }) +
      field('负责人（我方）', 'owner', project.owner, { required: true }) +
      field('销售', 'sales', project.sales, {}) +
      field('客户技术责任人', 'techOwner', project.techOwner, { required: true, help: 'G0 五必填之一。' }) +
      field('客户业务决策人', 'execSponsor', project.execSponsor, {}) +
      '</div></section>';
  }

  function render() {
    var project = current();
    var switcher = '';
    if (DATA.projects.length > 1) {
      switcher = '<div class="notice">当前编辑：第 ' + (state.active + 1) + ' / ' + DATA.projects.length + ' 个项目' +
        ' <select class="select" id="projectSwitch" style="width:auto;display:inline-block;margin-left:8px">';
      for (var i = 0; i < DATA.projects.length; i += 1) {
        switcher += '<option value="' + i + '"' + (i === state.active ? ' selected' : '') + '>' +
          escapeHtml(DATA.projects[i].name || DATA.projects[i].pocId || '未命名') + '</option>';
      }
      switcher += '</select></div>';
    }
    byId('formBody').innerHTML = switcher + identityCard(project) + g0Card(project) + planCard(project) + progressCard(project);
    var switchNode = byId('projectSwitch');
    if (switchNode) {
      switchNode.addEventListener('change', function (event) {
        state.active = Number(event.target.value);
        render();
      });
    }
    var info = byId('footerInfo');
    if (info) {
      info.textContent = '共 ' + DATA.projects.length + ' 个项目 · 草稿自动保存在本机浏览器';
    }
  }

  function setPathOn(project, path, value) {
    // "progress.*" paths address the pending entry; everything else addresses
    // the project itself. Keeping the two apart is what stops a progress edit
    // from overwriting a plan field with a same-named key.
    if (path.indexOf('progress.') === 0) {
      setPath({ progress: project.progress }, path, value);
      return;
    }
    setPath(project, path, value);
  }

  function bind() {
    document.addEventListener('input', function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;
      var path = target.getAttribute('data-path');
      if (!path) return;
      setPathOn(current(), path, target.value);
      scheduleSave();
    });
    document.addEventListener('change', function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;
      var path = target.getAttribute('data-path');
      if (!path) return;
      setPathOn(current(), path, target.value);
      scheduleSave();
      if (target.tagName === 'SELECT') render();
    });
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;
      var project = current();
      var addKey = target.getAttribute('data-add');
      var removeKey = target.getAttribute('data-remove');
      if (addKey) {
        if (addKey === 'criteria') project.plan.criteria.push({ name: '', metric: '', baseline: '', target: '' });
        if (addKey === 'scenarios') project.plan.scenarios.push('');
        if (addKey === 'risks') project.plan.risks.push({ name: '', level: '', mitigation: '' });
        if (addKey === 'evidence') project.progress.evidence.push({ title: '', link: '', type: '' });
        scheduleSave();
        render();
        return;
      }
      if (removeKey) {
        var index = Number(target.getAttribute('data-index'));
        if (removeKey === 'criteria') project.plan.criteria.splice(index, 1);
        if (removeKey === 'scenarios') project.plan.scenarios.splice(index, 1);
        if (removeKey === 'risks') project.plan.risks.splice(index, 1);
        if (removeKey === 'evidence') project.progress.evidence.splice(index, 1);
        scheduleSave();
        render();
      }
    });
  }

  /**
   * Serialize one project to the v3 YAML shape.
   *
   * This mirrors the Host's own projectToYaml on purpose: the browser cannot call
   * it, and the file a colleague downloads has to be byte-compatible with what
   * the plugin's own generator would emit. The tests pin both sides to the same
   * output, so a drift shows up as a failure rather than as an unreadable file.
   */
  function toYaml(project) {
    var lines = [];
    function scalar(value) {
      if (value === null || value === undefined || value === '') return 'null';
      var raw = String(value);
      if (/[:#\\n"']/.test(raw) || raw !== raw.trim()) return JSON.stringify(raw);
      return raw;
    }
    function push(key, value, indent) {
      var pad = new Array(indent + 1).join(' ');
      lines.push(pad + key + ': ' + scalar(value));
    }
    push('poc_id', project.pocId, 0);
    push('name', project.name, 0);
    lines.push('org:');
    push('system', project.system, 2);
    push('company', project.company, 2);
    push('department', project.department, 2);
    push('amount_wan', project.amountWan === '' ? '' : Number(project.amountWan), 0);
    push('poc_type', project.pocType, 0);
    push('owner', project.owner, 0);
    push('sales', project.sales, 0);
    push('tech_owner', project.techOwner, 0);
    push('exec_sponsor', project.execSponsor, 0);
    push('stage', project.stage, 0);
    push('status', project.status, 0);
    push('stage_since', project.stageSince, 0);
    lines.push('gate0:');
    push('why_customer', project.gate0.why_customer, 2);
    push('why_us', project.gate0.why_us, 2);
    push('decision_chain', project.gate0.decision_chain, 2);
    push('post_poc_decision', project.gate0.post_poc_decision, 2);
    push('competitor', project.gate0.competitor, 2);
    lines.push('  review:');
    push('conclusion', project.gate0.conclusion, 4);
    push('reviewer', project.gate0.reviewer, 4);
    push('reviewed_at', project.gate0.reviewed_at, 4);
    lines.push('plan:');
    push('customer_pain', project.plan.customer_pain, 2);
    push('expected_recognition', project.plan.expected_recognition, 2);
    push('our_edge', project.plan.our_edge, 2);
    lines.push('  timeline:');
    push('start', project.plan.timeline_start, 4);
    push('end', project.plan.timeline_end, 4);
    lines.push('  gate1:');
    push('conclusion', project.plan.gate1_conclusion, 4);
    lines.push('  gate2:');
    push('ready', project.plan.gate2_ready, 4);
    var i;
    lines.push('  criteria:');
    var criteria = project.plan.criteria.filter(function (item) { return text(item.name).trim() !== ''; });
    if (criteria.length === 0) { lines[lines.length - 1] = '  criteria: []'; }
    for (i = 0; i < criteria.length; i += 1) {
      lines.push('    - name: ' + scalar(criteria[i].name));
      lines.push('      metric: ' + scalar(criteria[i].metric));
      lines.push('      baseline: ' + scalar(criteria[i].baseline));
      lines.push('      target: ' + scalar(criteria[i].target));
    }
    var scenarios = project.plan.scenarios.filter(function (item) { return text(item).trim() !== ''; });
    lines.push('  scenarios:' + (scenarios.length === 0 ? ' []' : ''));
    for (i = 0; i < scenarios.length; i += 1) lines.push('    - ' + scalar(scenarios[i]));
    var risks = project.plan.risks.filter(function (item) { return text(item.name).trim() !== ''; });
    lines.push('  risks:' + (risks.length === 0 ? ' []' : ''));
    for (i = 0; i < risks.length; i += 1) {
      lines.push('    - name: ' + scalar(risks[i].name));
      lines.push('      level: ' + scalar(risks[i].level));
      lines.push('      mitigation: ' + scalar(risks[i].mitigation));
    }
    var entry = project.progress;
    var hasEntry = text(entry.date) !== '' || text(entry.actual) !== '' || text(entry.goal) !== '';
    lines.push('progress:' + (hasEntry ? '' : ' []'));
    if (hasEntry) {
      lines.push('  - seq: ' + (entry.seq === null ? 'null' : entry.seq));
      lines.push('    date: ' + scalar(entry.date));
      lines.push('    type: ' + scalar(entry.type));
      lines.push('    goal: ' + scalar(entry.goal));
      var items = entry.items.filter(function (item) { return text(item).trim() !== ''; });
      lines.push('    items:' + (items.length === 0 ? ' []' : ''));
      for (i = 0; i < items.length; i += 1) lines.push('      - ' + scalar(items[i]));
      lines.push('    actual: ' + scalar(entry.actual));
      lines.push('    completion: ' + scalar(entry.completion));
      var evidence = entry.evidence.filter(function (item) { return text(item.title).trim() !== ''; });
      lines.push('    evidence:' + (evidence.length === 0 ? ' []' : ''));
      for (i = 0; i < evidence.length; i += 1) {
        lines.push('      - title: ' + scalar(evidence[i].title));
        lines.push('        link: ' + scalar(evidence[i].link));
        lines.push('        type: ' + scalar(evidence[i].type));
      }
      lines.push('    customer:');
      lines.push('      synced_with: ' + scalar(entry.customer.synced_with));
      lines.push('      feedback: ' + scalar(entry.customer.feedback));
      lines.push('      recognition: ' + scalar(entry.customer.recognition));
      lines.push('    gate3_1: ' + scalar(entry.gate3_1));
      lines.push('    gate3_2: ' + scalar(entry.gate3_2));
      lines.push('    next:');
      lines.push('      goal: ' + scalar(entry.next.goal));
      lines.push('      owner: ' + scalar(entry.next.owner));
      lines.push('      deadline: ' + scalar(entry.next.deadline));
    }
    return lines.join('\\n') + '\\n';
  }

  function previewYaml() {
    var node = byId('yamlPreview');
    if (!node) return;
    var all = [];
    for (var i = 0; i < DATA.projects.length; i += 1) {
      all.push('# ' + (DATA.projects[i].pocId || '新项目'));
      all.push(toYaml(DATA.projects[i]));
    }
    node.textContent = all.join('\\n');
    node.hidden = false;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function downloadYaml() {
    if (!validateRequired()) {
      showToast('还有必填项没填');
      return;
    }
    var stamp = DATA.today.replace(/-/g, '');
    for (var i = 0; i < DATA.projects.length; i += 1) {
      var project = DATA.projects[i];
      var blob = new Blob([toYaml(project)], { type: 'text/yaml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = (project.pocId.trim() === '' ? 'new' : project.pocId.trim()) + '-' + stamp + '.yaml';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    }
    showToast('已下载 ' + DATA.projects.length + ' 个 YAML 文件');
    save(true);
  }

  /** The three bare-minimum required fields, checked before a download. */
  function validateRequired() {
    var ok = true;
    var project = current();
    var required = [
      ['name', project.name],
      ['owner', project.owner],
      ['techOwner', project.techOwner],
      ['progress.date', project.progress.date],
      ['progress.actual', project.progress.actual],
      ['progress.next.goal', project.progress.next.goal]
    ];
    for (var i = 0; i < required.length; i += 1) {
      var key = required[i][0];
      var value = text(required[i][1]).trim();
      var node = document.querySelector('[data-field="' + key + '"]');
      if (node) node.className = value === '' ? 'field has-error' : 'field';
      if (value === '') ok = false;
    }
    return ok;
  }

  function initState() {
    storageAvailable = probeStorage();
    if (!storageAvailable) {
      var notice = byId('draftNotice');
      if (notice) {
        notice.textContent = '这个浏览器禁用了本地存储，草稿不会自动保存，请填完立即下载。';
        notice.hidden = false;
      }
    }
    var draft = loadDraft();
    if (draft) {
      DATA.projects = draft;
      var restore = byId('restoreNotice');
      if (restore) restore.hidden = false;
    }
  }

  initState();
  bind();
  render();
  if (byId('clearBtn')) byId('clearBtn').addEventListener('click', clearDraft);
  if (byId('previewBtn')) byId('previewBtn').addEventListener('click', previewYaml);
  if (byId('downloadBtn')) byId('downloadBtn').addEventListener('click', downloadYaml);
  setInterval(function () { save(true); }, 30000);
  window.addEventListener('beforeunload', function () { save(true); });
`

/** The blank project, as the generated script builds it. */
function blankProjectPayload(): FormProject {
  return blankProject()
}
