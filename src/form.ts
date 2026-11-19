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
import type { PocRecord, StageId } from './types.js'

/** The four G0 prerequisites that live under `gate0` (the fifth is identity). */
export const G0_FIELDS = Object.freeze([
  'why_customer',
  'why_us',
  'decision_chain',
  'post_poc_decision',
] as const)

/** One plan criterion, as the form edits it. */
export interface FormCriterion {
  /** `cri-NN`; carried through so a returned form never renumbers the plan. */
  id: string
  name: string
  metric: string
  baseline: string
  target: string
}

/**
 * One plan scenario.
 *
 * v3.1 made this an object with a stable id, because evidence attaches by id:
 * a form that renumbered scenarios would silently orphan every proof it had.
 * `id` is therefore carried through untouched and is not user-editable.
 */
export interface FormScenario {
  /** `scn-NN`; stable for the life of the project. */
  id: string
  name: string
  goal: string
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
  /** v3.1: what moved compared to the previous round. Required. */
  change: string
  goal: string
  /** `scn-NN` ids picked from the plan's scenarios. */
  scenarioIds: string[]
  /** `cri-NN` ids picked from the plan's criteria; independent of scenarios. */
  criteriaIds: string[]
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
    scenarios: FormScenario[]
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
  /**
   * The G4 conclusion block.
   *
   * It was missing entirely: the form could collect a progress round but not the
   * one thing a G4 project exists to state — what was proved, what the customer
   * accepted, and what business step follows. Every field is optional because
   * only a G4 form shows them.
   */
  outcome: {
    achievement: string
    customer_recognition: string
    our_proof: string
    proved: string
    recognized: string
    next_business: string
    milestone: string
    businessOwner: string
    businessDeadline: string
    businessStatus: string
    overall: string
  }
}

/**
 * What the colleague is here to do.
 *
 * Two orthogonal questions decide what the form asks, and conflating them is
 * what made the old form a 20-field wall:
 *
 * - the **stage** says which fields are the subject (a G1 project is about the
 *   plan, a G3 project is about the proof);
 * - the **intent** says how deep to go (registering a new project, filling in
 *   the current stage, or appending one round of progress).
 *
 * The same G2 project needs completely different forms for "first test" and
 * "weekly sync", so a stage-only split would still force a colleague to scroll
 * past everything they are not editing.
 */
export type FormIntent = 'new' | 'supplement' | 'progress'

/** The section groups a form can show. Order is reading order. */
export type FormSection =
  | 'identity'
  | 'gate0'
  | 'plan'
  | 'gate12'
  | 'progress'
  | 'outcome'

/** The stage ids, local to keep the browser payload free of the frozen tuple. */
const STAGE_IDS = ['G0', 'G1', 'G2', 'G3', 'G4'] as const

/**
 * Which sections each stage is about.
 *
 * Derived from the ledger's own structure rather than invented: `schemas/poc-schema.md`
 * groups fields into ①identity ②gate0 ③plan ④progress ⑤outcome, each gate's
 * verdict lives in its group, and the 16 gap rules judge by the same grouping
 * (R1–R3 gate0, R4–R6 plan, R8–R10 progress, R11 outcome). So "G1 fills the plan"
 * is the data model, not a convention this form invented.
 */
const SECTIONS_FOR_STAGE: Record<StageId, readonly FormSection[]> = {
  G0: ['identity', 'gate0'],
  G1: ['plan', 'gate12'],
  G2: ['plan', 'gate12', 'progress'],
  G3: ['progress'],
  G4: ['progress', 'outcome'],
}

/**
 * The sections one intent may EDIT.
 *
 * `new` asks only for what a project needs to exist: identity plus the five G0
 * prerequisites. It deliberately does not ask for a plan — gap rule R3 only
 * demands a plan *after* G0 passes, so asking earlier pushes people to write a
 * plan before they have thought one through, which R4/R5 then reject.
 *
 * `progress` edits nothing but the appended round: it is the highest-frequency
 * form and must fit one screen.
 */
const EDITABLE_FOR_INTENT: Record<FormIntent, readonly FormSection[]> = {
  new: ['identity', 'gate0'],
  supplement: ['identity', 'gate0', 'plan', 'gate12', 'progress', 'outcome'],
  progress: ['progress'],
}

/**
 * Resolve what a form should ask, given the intent and the project's stage.
 *
 * Returns the editable sections (the subject) and the context sections (shown
 * read-only so the colleague knows what they are adding to). An unknown stage
 * falls back to G0's set: a project whose stage is unrecognised is, for form
 * purposes, still being set up.
 */
export function resolveSections(
  intent: FormIntent,
  stage: string,
): { editable: FormSection[]; context: FormSection[] } {
  const key = (STAGE_IDS.find((id) => stage === id || stage.startsWith(`${id}-`)) ?? 'G0') as StageId
  const stageSections = SECTIONS_FOR_STAGE[key]
  const allowed = EDITABLE_FOR_INTENT[intent]
  if (intent === 'new' || intent === 'progress') {
    const editable = allowed.filter((section) => section === 'identity' || section === 'gate0' || section === 'progress')
    return { editable: [...editable], context: [] }
  }
  // `supplement` edits the current stage's subject, and shows only what came
  // BEFORE it as read-only context — never a later stage, which has not
  // happened yet. Showing a G4 project's empty conclusion block to someone
  // filling in G1 invites them to invent a conclusion.
  const editable = stageSections.filter((section) => allowed.includes(section))
  const order: readonly FormSection[] = ['identity', 'gate0', 'plan', 'gate12', 'progress', 'outcome']
  const currentIndex = stageSections.length === 0 ? -1 : Math.max(...stageSections.map((section) => order.indexOf(section)))
  const context = order.filter((section) => {
    if (section === 'progress') return false
    if (editable.includes(section)) return false
    // Only sections that precede the current stage's subject.
    return order.indexOf(section) < currentIndex
  })
  return { editable: [...editable], context }
}

/** Options for one generation run. */
export interface FormOptions {
  /** `fill` pre-fills from the ledger; `blank` is an empty new-project form. */
  mode: 'fill' | 'blank'
  /**
   * What the colleague is doing. Defaults from `mode`: `blank` → `new`,
   * `fill` → `supplement`. `progress` is the one-screen append form.
   */
  intent?: FormIntent
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
  const outcome = record.outcome ?? {}
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
      criteria: (Array.isArray(plan.criteria) ? plan.criteria : []).map((item, index) => ({
        // A criterion without an id in the ledger is given one on the way out so
        // the form can reference it; the Host is what writes it back.
        id: text(item?.id) === '' ? `cri-${String(index + 1).padStart(2, '0')}` : text(item?.id),
        name: text(item?.name),
        metric: text(item?.metric),
        baseline: text(item?.baseline),
        target: text(item?.target),
      })),
      // v3.1: objects with a stable id, not bare strings.
      scenarios: (Array.isArray(plan.scenarios) ? plan.scenarios : [])
        .filter((item) => item !== null && item !== undefined)
        .map((item, index) => ({
          id: text(item?.id) === '' ? `scn-${String(index + 1).padStart(2, '0')}` : text(item?.id),
          name: text(item?.name),
          goal: text(item?.goal),
        })),
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
    // G4 only. Read here so a G4 form opens with the current conclusion in
    // place rather than blank, which would invite overwriting it by omission.
    outcome: {
      achievement: text(outcome.achievement),
      customer_recognition: text(outcome.customer_recognition),
      our_proof: text(outcome.our_proof),
      proved: text((outcome.conclusion ?? {}).proved),
      recognized: text((outcome.conclusion ?? {}).recognized),
      next_business: text((outcome.conclusion ?? {}).next_business),
      milestone: text((outcome.business ?? {}).milestone),
      businessOwner: text((outcome.business ?? {}).owner),
      businessDeadline: dateText((outcome.business ?? {}).deadline),
      businessStatus: text((outcome.business ?? {}).status),
      overall: text(outcome.overall),
    },
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
    change: '',
    goal: '',
    scenarioIds: [],
    criteriaIds: [],
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
    outcome: {
      achievement: '',
      customer_recognition: '',
      our_proof: '',
      proved: '',
      recognized: '',
      next_business: '',
      milestone: '',
      businessOwner: '',
      businessDeadline: '',
      businessStatus: '',
      overall: '',
    },
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
 *
 * **This is not the download format.** The form ships a change set (see
 * {@link projectToChangeSet}); a complete file would have to carry the ledger's
 * derived fields (`gate0.missing`, `priority`, scenario status), and those are
 * owned by `tools/derive.mjs` — writing them here would either be wrong or be
 * overwritten by CI. `projectToYaml` remains for tests and for a full-file
 * preview.
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
        .filter((criterion) => (criterion.name ?? '').trim() !== '')
        .map((criterion) => ({
          // Never renumber: a returned criterion keeps the id evidence cites.
          id: (criterion.id ?? '').trim() === '' ? null : (criterion.id ?? '').trim(),
          name: criterion.name.trim(),
          metric: (criterion.metric ?? '').trim() === '' ? null : criterion.metric.trim(),
          baseline: (criterion.baseline ?? '').trim() === '' ? null : criterion.baseline.trim(),
          target: (criterion.target ?? '').trim() === '' ? null : criterion.target.trim(),
        })),
      scenarios: project.plan.scenarios
        .filter((scenario) => (scenario.name ?? '').trim() !== '')
        .map((scenario) => ({
          id: (scenario.id ?? '').trim() === '' ? null : (scenario.id ?? '').trim(),
          name: scenario.name.trim(),
          goal: (scenario.goal ?? '').trim() === '' ? null : scenario.goal.trim(),
        })),
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

/**
 * One project's change set: what the colleague touched, and nothing else.
 *
 * ## Why a change set rather than a file
 *
 * A `projects/*.yaml` file carries three kinds of value: what a human wrote, what
 * the ledger derives (`gate0.missing`, `gate0.complete`, `priority`, per-scenario
 * status), and what the clock implies. Only the first belongs to a form. The
 * derived ones are computed by `tools/derive.mjs` and asserted by CI, so a form
 * that wrote them would either be wrong or be overwritten — and a form that
 * omitted them would produce a file CI rejects.
 *
 * So the form ships only the human half, `poc-submit` merges it into the existing
 * file (preserving everything it did not touch), and CI recomputes the rest.
 *
 * `schema_version` IS included even though it is a constant: the ledger refuses a
 * file without it (`E-VERSION`), and a brand-new project has no existing file to
 * inherit the stamp from.
 */
export interface FormChangeSet {
  schema_version: string
  poc_id: string
  name: string
  org: { system: string | null; company: string | null; department: string | null }
  amount_wan: number | null
  poc_type: string | null
  owner: string | null
  sales: string | null
  tech_owner: string | null
  exec_sponsor: string | null
  stage: string
  status: string
  stage_since: string | null
  gate0: {
    why_customer: string | null
    why_us: string | null
    decision_chain: string | null
    post_poc_decision: string | null
    competitor: string | null
    review: { conclusion: string | null; reviewer: string | null; reviewed_at: string | null }
  }
  plan: {
    customer_pain: string | null
    expected_recognition: string | null
    our_edge: string | null
    criteria: Array<Record<string, unknown>>
    scenarios: Array<Record<string, unknown>>
    risks: Array<Record<string, unknown>>
    timeline: { start: string | null; end: string | null }
    gate1: { conclusion: string | null }
    gate2: { ready: string | null }
  }
  /** The rounds this form ADDS; empty when the colleague recorded none. */
  progress: Array<Record<string, unknown>>
}

/** `''` becomes `null`: the ledger's "absent" is null, never the string "". */
function orNull(value: string): string | null {
  return value === '' ? null : value
}

/**
 * Build one project's change set from the form state.
 *
 * Every field the form can edit appears, so `poc-submit` can apply the whole
 * object with `setIfPresent` semantics: a blank field means "I did not change
 * this", which the merge step must not read as "delete it".
 */
export function projectToChangeSet(project: FormProject): FormChangeSet {
  return {
    schema_version: FORM_SCHEMA_VERSION,
    poc_id: project.pocId.trim(),
    name: project.name.trim(),
    org: {
      system: orNull(project.system.trim()),
      company: orNull(project.company.trim()),
      department: orNull(project.department.trim()),
    },
    amount_wan: project.amountWan === '' ? null : Number(project.amountWan),
    poc_type: orNull(project.pocType.trim()),
    owner: orNull(project.owner.trim()),
    sales: orNull(project.sales.trim()),
    tech_owner: orNull(project.techOwner.trim()),
    exec_sponsor: orNull(project.execSponsor.trim()),
    stage: project.stage,
    status: project.status,
    stage_since: orNull(project.stageSince.trim()),
    gate0: {
      why_customer: orNull(project.gate0.why_customer.trim()),
      why_us: orNull(project.gate0.why_us.trim()),
      decision_chain: orNull(project.gate0.decision_chain.trim()),
      post_poc_decision: orNull(project.gate0.post_poc_decision.trim()),
      competitor: orNull(project.gate0.competitor.trim()),
      review: {
        conclusion: orNull(project.gate0.conclusion.trim()),
        reviewer: orNull(project.gate0.reviewer.trim()),
        reviewed_at: orNull(project.gate0.reviewed_at.trim()),
      },
    },
    plan: {
      customer_pain: orNull(project.plan.customer_pain.trim()),
      expected_recognition: orNull(project.plan.expected_recognition.trim()),
      our_edge: orNull(project.plan.our_edge.trim()),
      criteria: project.plan.criteria
        .filter((item) => (item.name ?? '').trim() !== '')
        .map((item) => ({
          id: orNull((item.id ?? '').trim()),
          name: item.name.trim(),
          metric: orNull((item.metric ?? '').trim()),
          baseline: orNull((item.baseline ?? '').trim()),
          target: orNull((item.target ?? '').trim()),
        })),
      scenarios: project.plan.scenarios
        .filter((item) => (item.name ?? '').trim() !== '')
        .map((item) => ({
          id: orNull((item.id ?? '').trim()),
          name: item.name.trim(),
          goal: orNull((item.goal ?? '').trim()),
        })),
      risks: project.plan.risks
        .filter((item) => item.name.trim() !== '')
        .map((item) => ({
          name: item.name.trim(),
          level: orNull(item.level.trim()),
          mitigation: orNull(item.mitigation.trim()),
        })),
      timeline: {
        start: orNull(project.plan.timeline_start.trim()),
        end: orNull(project.plan.timeline_end.trim()),
      },
      gate1: { conclusion: orNull(project.plan.gate1_conclusion.trim()) },
      gate2: { ready: orNull(project.plan.gate2_ready.trim()) },
    },
    // Append-only: this is the list of NEW rounds, never the existing history.
    progress: progressIsEmpty(project.progress) ? [] : [serializeProgress(project.progress)],
  }
}

/** The whole download: one change set per project, plus provenance. */
export interface FormChangeDocument {
  schemaVersion: string
  generatedAt: string
  generatedBy: string
  intent: FormIntent
  changes: FormChangeSet[]
}

/** Build the document a colleague sends back. */
export function buildChangeDocument(options: {
  projects: readonly FormProject[]
  intent: FormIntent
  now?: Date
}): FormChangeDocument {
  return {
    schemaVersion: FORM_SCHEMA_VERSION,
    generatedAt: (options.now ?? new Date()).toISOString(),
    generatedBy: 'POC 信息收集表单 v3.1',
    intent: options.intent,
    changes: options.projects.map((project) => projectToChangeSet(project)),
  }
}

/** `true` when the form's progress entry carries no user content. */
function progressIsEmpty(entry: FormProgress): boolean {
  return (
    entry.date === '' &&
    entry.type === '' &&
    entry.goal === '' &&
    entry.actual === '' &&
    compact(entry.scenarioIds).length === 0 &&
    compact(entry.criteriaIds).length === 0 &&
    entry.evidence.every((item) => item.title.trim() === '')
  )
}

/** One progress entry in the ledger's own shape. */
function serializeProgress(entry: FormProgress): Record<string, unknown> {
  return {
    seq: entry.seq,
    date: entry.date,
    type: entry.type === '' ? null : entry.type,
    // `change` is mandatory in v3.1: a round that does not say what moved is the
    // single most common way a timeline decays into "communicated with customer".
    change: entry.change === '' ? null : entry.change,
    goal: entry.goal === '' ? null : entry.goal,
    scenario_ids: compact(entry.scenarioIds),
    criteria_ids: compact(entry.criteriaIds),
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
  status: ['未开始', '进行中', '暂停', '已关闭', '已取消'],
  g0Conclusion: ['通过', '未通过-退出', '未通过-降级', '待评审'],
  g1Conclusion: ['通过', '补充后进入', '未通过'],
  g2Ready: ['Ready', '有风险', '未Ready'],
  recognition: ['认可', '部分认可', '未认可', '待确认'],
  progressType: ['内部Review', '客户阶段同步', 'Checkpoint'],
  // v3.1: mandatory on every progress entry. "无实质进展" is an allowed value:
  // saying "nothing moved" beats writing a sentence that hides it.
  progressChange: ['阶段推进', '场景新增', '目标调整', '证据补充', '风险出现', '风险解除', '无实质进展'],
  completion: ['0%', '25%', '50%', '75%', '100%'],
  riskLevel: ['high', 'medium', 'low'],
  gate3_1: ['可证明', '待补证据'],
  gate3_2: ['已确认', '待确认'],
  evidenceType: ['文档', '截图', '数据', '邮件', '链接'],
  system: ['人保体系', '国寿体系'],
  // G4 only: the outcome block is the one thing no earlier stage asks for.
  achievement: ['达成', '部分达成', '未达成'],
  businessStatus: ['已进入下一里程碑', '待推进', '补救中', '无后续动作'],
}

/**
 * The schema generation this form emits.
 *
 * Stamped into every generated page so a returned form can be checked against
 * the schema that will read it. There is deliberately **no older-shape
 * fallback**: the ledger declares one shape version and its validator rejects
 * anything else outright (`E-VERSION`). A tolerant reader here would only move
 * that failure later — to a point where the colleague already believes their
 * work was recorded.
 */
export const FORM_SCHEMA_VERSION = '3.1'

/**
 * The stamp a pre-v3.1 form carries.
 *
 * A named constant only so the refusal message can name it. This is not a
 * supported shape: nothing parses it, nothing converts it, and importing one is
 * refused rather than half-applied.
 */
export const LEGACY_FORM_SCHEMA_VERSION = '3.0'

/** The state the generated page boots from. */
export interface FormPayload {
  mode: 'fill' | 'blank'
  /** What the colleague is doing; decides how much of the page is editable. */
  intent: FormIntent
  /** The schema this page writes. Absent means a pre-v3.1 form. */
  schemaVersion: string
  generatedAt: string
  today: string
  projects: FormProject[]
  /**
   * Per-project section resolution, index-aligned with `projects`.
   *
   * Resolved on the Host rather than in the page because the mapping is a
   * statement about the ledger's own structure, and the browser has no way to
   * check it. Sending it also keeps the payload inspectable: reading the JSON
   * tells you exactly what the page will let you edit.
   */
  sections: Array<{ editable: FormSection[]; context: FormSection[] }>
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
  const intent: FormIntent = options.intent ?? (options.mode === 'blank' ? 'new' : 'supplement')
  const payload: FormPayload = {
    mode: options.mode,
    intent,
    schemaVersion: FORM_SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    today: now.toISOString().slice(0, 10),
    projects,
    // Each project's stage decides which sections are the subject, so the
    // resolution is per project rather than per document.
    sections: projects.map((project) => resolveSections(intent, project.stage)),
    draftKey: draftKeyFor(options.mode, projects.map((project) => project.pocId).filter((id) => id !== '')),
    enums: ENUMS,
    g0Fields: G0_PROMPTS,
  }
  const data = scriptSafe(JSON.stringify(payload))
  const title = intent === 'new'
    ? 'POC 新建项目表单 v3'
    : intent === 'progress'
      ? `POC 进展记录表单 v3（${projects.length} 个项目）`
      : `POC 信息补充表单 v3（${projects.length} 个项目）`

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
  <div class="notice" id="restoreNotice" hidden>已恢复上次未提交的草稿。</div>
  <div class="notice notice-warn" id="draftNotice" hidden></div>
  <!-- The banner is rendered by the script from DATA, so it carries the project's
       real identity instead of a static page title that says nothing. -->
  <main id="formBody"></main>
  <footer class="footer">
    <div class="footer-info" id="footerInfo">正在初始化…</div>
    <div class="footer-actions">
      <button type="button" class="btn" id="previewBtn">预览变更集</button>
      <button type="button" class="btn btn-primary" id="downloadBtn">下载变更集</button>
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

/**
 * Whether a returned form was generated by this schema generation.
 *
 * `poc-export` produces a standalone HTML file that colleagues fill in offline,
 * so **old copies keep circulating** long after the schema moves. A pre-v3.1
 * form carries `progress[].items` and a string array of scenarios; reading it as
 * v3.1 would drop every scenario and criterion reference without an error, and
 * the ledger's whole proof chain hangs off those ids.
 *
 * So this is a hard gate rather than a tolerant reader: a stale form is refused
 * with an explanation, not silently half-imported. There is no conversion path
 * and none is planned — the ledger itself rejects any other shape version.
 */
export interface FormCompatibility {
  compatible: boolean
  /** The schema the file declares, or empty when it predates the stamp. */
  declared: string
  /** A message safe to show the person who just filled the form in. */
  reason: string
}

/**
 * Check a parsed form payload against {@link FORM_SCHEMA_VERSION}.
 *
 * Accepts the raw parsed object rather than a typed payload, because the whole
 * point is to inspect a document whose shape may be from an older generation.
 */
export function checkFormCompatibility(payload: unknown): FormCompatibility {
  if (typeof payload !== 'object' || payload === null) {
    return {
      compatible: false,
      declared: '',
      reason: '这个文件不是本表单导出的格式，无法导入。',
    }
  }
  const record = payload as Record<string, unknown>
  const declared = typeof record.schemaVersion === 'string' ? record.schemaVersion.trim() : ''
  if (declared === FORM_SCHEMA_VERSION) {
    return { compatible: true, declared, reason: '' }
  }
  if (declared === LEGACY_FORM_SCHEMA_VERSION || declared === '') {
    return {
      compatible: false,
      declared: declared === '' ? LEGACY_FORM_SCHEMA_VERSION : declared,
      reason:
        `这个表单是 v${LEGACY_FORM_SCHEMA_VERSION} 或更早版本导出的，台账只接受 v${FORM_SCHEMA_VERSION}。` +
        '旧表单的场景是字符串、指标没有 id，而证据按 id 挂靠，导入后会丢失全部场景与指标引用。' +
        '台账不做旧结构兼容，请重新导出一份 v' + FORM_SCHEMA_VERSION + ' 表单再填。',
    }
  }
  return {
    compatible: false,
    declared,
    reason: `这个表单声明的版本是 v${declared}，当前台账读取的是 v${FORM_SCHEMA_VERSION}，无法确认字段含义一致，已拒绝导入。`,
  }
}

/** Styles: one inline sheet, the console's own design tokens. */
const FORM_CSS = `
/* ===========================================================================
 * The form mirrors the detail page, not a generic settings screen.
 *
 * A colleague filling this in is answering the same questions the detail page
 * asks: what does Gate 0 say, what are the criteria and scenarios, what happened
 * this round. So the layout follows the detail page's own contract — a banner,
 * then a fixed two-column body (commitments left, record right), then a
 * full-width closing block — instead of one long stack of generic cards.
 *
 * The tokens are the dashboard's: same palette, same 8px rhythm, same type
 * scale. Nothing here invents a new visual language, because the form is the
 * same product seen from the other side.
 * ======================================================================== */
:root{
  --primary:#2864E8;--primary-soft:rgba(40,100,232,.09);
  --text:#192638;--text-2:#4A5A70;--text-3:#7A8AA0;
  --bg:#F5F7FB;--surface:#fff;--inset:#F7F9FC;
  --border:#E6EBF2;--green:#218568;--green-soft:rgba(33,133,104,.10);
  --amber:#B77919;--amber-soft:rgba(183,121,25,.11);
  --red:#C0392B;--red-soft:rgba(192,57,43,.10);
  --slate:#5A6A80;--slate-soft:rgba(90,106,128,.10);
  --shadow-1:0 1px 2px rgba(20,32,52,.05);
  --shadow-2:0 2px 6px rgba(20,32,52,.07),0 1px 2px rgba(20,32,52,.04);
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Avenir Next','PingFang SC','Microsoft YaHei',system-ui,sans-serif;
  background:var(--bg);color:var(--text);font-size:13px;line-height:20px;
  -webkit-font-smoothing:antialiased;padding:20px 28px 96px;
}
.shell{max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:16px}

/* ---------- banner: identity + progress, the detail page's header ---------- */
.banner{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 18px;
  padding:16px 20px;background:var(--surface);border:1px solid var(--border);
  border-radius:10px;position:sticky;top:0;z-index:100;box-shadow:var(--shadow-1);
}
.banner-main{display:flex;flex-direction:column;gap:4px;min-width:0}
.banner-kicker{font-size:10px;font-weight:650;letter-spacing:.05em;text-transform:uppercase;color:var(--primary)}
.banner-title{margin:0;font-size:20px;line-height:28px;font-weight:700;letter-spacing:-.01em;overflow-wrap:anywhere}
.banner-meta{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;font-size:10.5px;color:var(--text-3)}
.banner-id{font-family:var(--mono);font-size:10px}
.banner-side{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.banner-pills{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end}
.banner-actions{display:flex;align-items:center;gap:8px}
.save-status{font-size:10.5px;color:var(--green);white-space:nowrap}
.banner-nav{
  grid-column:1/-1;display:flex;align-items:center;gap:10px;
  padding-top:10px;border-top:1px solid var(--border);
}
.banner-step{margin:0 auto;font-size:10px;color:var(--text-3);font-variant-numeric:tabular-nums}

/* ---------- the fixed two-column contract, same ratio as the detail page --- */
.columns{display:grid;grid-template-columns:minmax(0,1.72fr) minmax(0,1fr);gap:18px;align-items:start}
@media(max-width:1080px){.columns{grid-template-columns:minmax(0,1fr)}}
.col{display:flex;flex-direction:column;gap:18px;min-width:0}

/* ---------- section: one block with a heading and a rule ---------- */
.sec{display:flex;flex-direction:column;gap:10px;min-width:0}
.sec-head{display:flex;align-items:baseline;gap:9px;padding-bottom:7px;border-bottom:1px solid var(--border)}
.sec-title{margin:0;font-size:13.5px;line-height:20px;font-weight:650;letter-spacing:-.005em}
.sec-kicker{margin-left:auto;font-size:10.5px;color:var(--text-3);font-variant-numeric:tabular-nums}
.sec-hint{margin:0;font-size:11px;line-height:17px;color:var(--text-2)}

/* ---------- Gate 0 as the same 2x3 card grid the detail page uses ---------- */
.g0-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media(max-width:720px){.g0-grid{grid-template-columns:minmax(0,1fr)}}
.g0-card{
  display:flex;flex-direction:column;gap:5px;padding:10px 12px;
  border-radius:8px;background:var(--surface);border:1px solid var(--border);
}
.g0-card[data-present="false"]{background:var(--inset);border-style:dashed}
.g0-card-head{display:flex;align-items:baseline;gap:8px}
.g0-card-label{font-size:11px;line-height:16px;font-weight:650}
.g0-card-label .req{color:var(--red);margin-left:2px}
.g0-card-missing{
  margin-left:auto;font-size:9px;line-height:13px;font-weight:650;white-space:nowrap;
  color:var(--amber);background:var(--amber-soft);padding:1px 5px;border-radius:4px;
}
.g0-card .textarea{min-height:54px;font-size:11px;line-height:16px;border-color:transparent;background:transparent;padding:2px 0}
.g0-card .textarea:hover{border-color:var(--border);background:var(--surface);padding:6px 8px}
.g0-card .textarea:focus{border-color:var(--primary);background:var(--surface);padding:6px 8px}
.g0-help{font-size:10px;line-height:14px;color:var(--text-3)}

/* ---------- list rows: criteria and scenarios as cards, not bare inputs --- */
.row-card{
  display:flex;flex-direction:column;gap:6px;padding:9px 11px;
  border-radius:8px;background:var(--surface);border:1px solid var(--border);
}
.row-card-head{display:flex;align-items:center;gap:8px}
.row-card-id{
  flex:none;font-family:var(--mono);font-size:9px;line-height:13px;
  color:var(--text-3);background:var(--inset);border:1px solid var(--border);
  padding:1px 5px;border-radius:4px;
}
.row-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
@media(max-width:720px){.row-card-grid{grid-template-columns:minmax(0,1fr)}}
.mini{display:flex;flex-direction:column;gap:2px;min-width:0}
.mini-wide{margin-top:2px}
.mini-label{font-size:9.5px;font-weight:600;letter-spacing:.03em;color:var(--text-3)}

/* ---------- fields ---------- */
.field{display:flex;flex-direction:column;gap:4px;min-width:0}
.field-label{font-size:11px;font-weight:650;color:var(--text)}
.field-label .req{color:var(--red);margin-left:2px}
.field-help{font-size:10px;line-height:15px;color:var(--text-3)}
.input,.textarea,.select{
  width:100%;padding:6px 9px;border:1px solid var(--border);border-radius:6px;
  font-family:inherit;font-size:12px;line-height:18px;background:var(--surface);color:var(--text);
}
.input-flush{border-color:transparent;background:transparent;padding:2px 0;font-size:13px;font-weight:600}
.input-flush:hover{border-color:var(--border);background:var(--surface);padding:5px 8px}
.input-flush:focus{border-color:var(--primary);background:var(--surface);padding:5px 8px}
.input:focus,.textarea:focus,.select:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}
.textarea{min-height:60px;resize:vertical}
.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px}
@media(max-width:720px){.grid-2{grid-template-columns:minmax(0,1fr)}}
.field.has-error .input,.field.has-error .textarea,.field.has-error .select{border-color:var(--red)}
.field-error{color:var(--red);font-size:10px;display:none}
.field.has-error .field-error{display:block}

/* ---------- id pickers: which scenario / criterion this round touched ------ */
.pick-list{display:flex;flex-wrap:wrap;gap:6px}
.pick{
  display:flex;align-items:center;gap:6px;padding:5px 9px;border-radius:7px;
  border:1px solid var(--border);background:var(--surface);cursor:pointer;font-size:11px;
}
.pick:hover{border-color:var(--primary)}
.pick:has(input:checked){background:var(--primary-soft);border-color:var(--primary)}
.pick input{accent-color:var(--primary);margin:0}
.pick-id{font-family:var(--mono);font-size:9px;color:var(--text-3)}
.pick-name{overflow-wrap:anywhere}

/* ---------- atoms ---------- */
.btn{
  padding:6px 12px;border-radius:6px;border:1px solid var(--border);background:var(--surface);
  cursor:pointer;font-family:inherit;font-size:12px;color:var(--text);white-space:nowrap;
}
.btn:hover{background:var(--inset)}
.btn-primary{background:var(--primary);color:#fff;border-color:var(--primary);font-weight:600}
.btn-primary:hover{background:#1E54C9}
.btn-sm{padding:3px 9px;font-size:11px}
.btn-remove{color:var(--red);border-color:rgba(192,57,43,.28);flex:none}
.badge{display:inline-block;padding:1px 7px;border-radius:4px;font-size:10px;font-weight:600;white-space:nowrap}
.badge-ok{background:var(--green-soft);color:var(--green)}
.badge-warn{background:var(--amber-soft);color:var(--amber)}
.badge-error{background:var(--red-soft);color:var(--red)}
.badge-info{background:var(--primary-soft);color:var(--primary)}
.pill{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:13px;font-size:10.5px;font-weight:600}
.pill-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex:none}
.pill-blue{background:var(--primary-soft);color:var(--primary)}
.pill-slate{background:var(--slate-soft);color:var(--slate)}
.pill-amber{background:var(--amber-soft);color:var(--amber)}
.pill-green{background:var(--green-soft);color:var(--green)}
.pill-red{background:var(--red-soft);color:var(--red)}

/* ---------- readiness strip: the same reminder band as the detail page ----- */
.readiness{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;
  padding:11px 14px;border-radius:10px;background:var(--surface);
  border:1px solid var(--border);border-left:3px solid var(--slate);
}
.readiness[data-tone="green"]{border-left-color:var(--green)}
.readiness[data-tone="amber"]{border-left-color:var(--amber)}
.readiness[data-tone="red"]{border-left-color:var(--red)}
@media(max-width:720px){.readiness{grid-template-columns:minmax(0,1fr)}}
.ready-cell{display:flex;flex-direction:column;gap:2px;min-width:0}
.ready-label{font-size:9.5px;font-weight:650;letter-spacing:.05em;text-transform:uppercase;color:var(--text-3)}
.ready-value{font-size:11px;line-height:17px;color:var(--text-2);overflow-wrap:anywhere}

/* ---------- notices / footer ---------- */
.notice{
  background:var(--primary-soft);border:1px solid rgba(40,100,232,.22);border-radius:8px;
  padding:9px 13px;font-size:11.5px;color:var(--text-2);
}
.notice-warn{background:var(--amber-soft);border-color:rgba(183,121,25,.24);color:#8A5E12}
.footer{
  position:fixed;bottom:0;left:0;right:0;z-index:150;
  background:var(--surface);border-top:1px solid var(--border);
  padding:11px 28px;display:flex;justify-content:space-between;align-items:center;gap:12px;
  flex-wrap:wrap;box-shadow:0 -4px 12px rgba(20,32,52,.06);
}
.footer-info{font-size:11.5px;color:var(--text-3)}
.footer-actions{display:flex;gap:8px;flex-wrap:wrap}
.yaml-preview{
  background:var(--surface);padding:16px;border-radius:10px;border:1px solid var(--border);
  overflow:auto;font-size:11px;font-family:var(--mono);white-space:pre-wrap;line-height:1.55;
}
.toast{
  position:fixed;top:76px;left:50%;transform:translateX(-50%);
  background:var(--green);color:#fff;padding:8px 17px;border-radius:7px;
  font-size:12px;z-index:200;box-shadow:var(--shadow-2);
}
@media print{
  .banner,.footer{position:static;box-shadow:none}
  body{padding:0}
}
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

  /**
   * A new list row, carrying the next free stable id.
   *
   * v3.1 requires an id on every scenario and criterion because evidence and
   * progress reference them. A row added without one used to crash the YAML
   * writer outright (it called '.trim()' on an absent id), and even when it did
   * not, the row could never be referenced. The id is derived from the highest
   * existing suffix so deleting a row never renumbers the survivors.
   */
  function nextRow(prefix, list, fields) {
    var highest = 0;
    for (var i = 0; i < list.length; i += 1) {
      var match = new RegExp('^' + prefix + '-(\\\\d+)$').exec(text(list[i].id));
      if (match) highest = Math.max(highest, Number(match[1]));
    }
    fields.id = prefix + '-' + ('0' + (highest + 1)).slice(-2);
    return fields;
  }

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

  /**
   * Gate 0 as the same 2x3 card grid the detail page uses.
   *
   * A generic stack of labelled textareas hid the thing a colleague most needs
   * to see: WHICH of the five prerequisites is still missing. The grid makes a
   * blank cell a visible gap rather than one empty box among many.
   */
  function g0Card(project) {
    var cards = '';
    var present = 0;
    for (var i = 0; i < DATA.g0Fields.length; i += 1) {
      var def = DATA.g0Fields[i];
      var filled = text(project.gate0[def.key]).trim() !== '';
      if (filled) present += 1;
      cards += '<div class="g0-card" data-present="' + (filled ? 'true' : 'false') + '">' +
        '<div class="g0-card-head"><span class="g0-card-label">' + escapeHtml(def.label) +
          '<span class="req">*</span></span>' +
          (filled ? '' : '<span class="g0-card-missing">缺失</span>') + '</div>' +
        '<textarea class="textarea" data-path="gate0.' + def.key + '" placeholder="' +
          escapeHtml(def.hint) + '">' + escapeHtml(project.gate0[def.key]) + '</textarea>' +
        '</div>';
    }
    // The fifth prerequisite lives in the identity block, so it is counted here
    // but edited there — showing it twice would let the two copies disagree.
    var techFilled = text(project.techOwner).trim() !== '';
    if (techFilled) present += 1;
    cards += '<div class="g0-card" data-present="' + (techFilled ? 'true' : 'false') + '">' +
      '<div class="g0-card-head"><span class="g0-card-label">客户技术责任人' +
        '<span class="req">*</span></span>' +
        (techFilled ? '' : '<span class="g0-card-missing">缺失</span>') + '</div>' +
      '<input class="input" data-path="techOwner" value="' + escapeHtml(project.techOwner) + '" placeholder="第五项必填，在下方身份区也能改">' +
      '</div>';

    var tone = present === 5 ? 'badge-ok' : present === 0 ? 'badge-warn' : 'badge-info';
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">Gate 0 · 值不值得做</h2>' +
        '<span class="sec-kicker">五必填 <span class="badge ' + tone + '">' + present + ' / 5</span></span></header>' +
      '<p class="sec-hint">这五项齐了，G0 评审才有意义。四项在 gate0 区，第五项是身份区的「客户技术责任人」——两处都能改，改的是同一个字段。</p>' +
      '<div class="g0-grid">' + cards + '</div>' +
      '<div class="grid-2">' +
        field('主要竞争对手', 'gate0.competitor', project.gate0.competitor, {}) +
        field('G0 评审结论', 'gate0.conclusion', project.gate0.conclusion, { enum: DATA.enums.g0Conclusion }) +
        field('G0 评审人', 'gate0.reviewer', project.gate0.reviewer, {}) +
        field('评审日期', 'gate0.reviewed_at', project.gate0.reviewed_at, { date: true }) +
      '</div></section>';
  }

  function criteriaList(project) {
    var rows = '';
    for (var i = 0; i < project.plan.criteria.length; i += 1) {
      var criterion = project.plan.criteria[i];
      rows += '<div class="row-card">' +
        '<div class="row-card-head">' +
          '<span class="row-card-id mono">' + escapeHtml(criterion.id) + '</span>' +
          '<input class="input input-flush" data-path="plan.criteria.' + i + '.name" value="' + escapeHtml(criterion.name) + '" placeholder="指标名称，如「200 人并发稳定 7 天」">' +
          '<button type="button" class="btn btn-sm btn-remove" data-remove="criteria" data-index="' + i + '" title="删除这条指标">删</button>' +
        '</div>' +
        '<div class="row-card-grid">' +
          '<label class="mini"><span class="mini-label">度量</span>' +
            '<input class="input" data-path="plan.criteria.' + i + '.metric" value="' + escapeHtml(criterion.metric) + '" placeholder="如「成功率」"></label>' +
          '<label class="mini"><span class="mini-label">基线</span>' +
            '<input class="input" data-path="plan.criteria.' + i + '.baseline" value="' + escapeHtml(criterion.baseline) + '" placeholder="当前值"></label>' +
          '<label class="mini"><span class="mini-label">目标</span>' +
            '<input class="input" data-path="plan.criteria.' + i + '.target" value="' + escapeHtml(criterion.target) + '" placeholder="如 ≥99.5%"></label>' +
        '</div></div>';
    }
    return rows + '<button type="button" class="btn btn-sm" data-add="criteria">+ 加一条指标</button>';
  }

  /**
   * The scenario list.
   *
   * v3.1 made a scenario an object with a stable id, not a bare string. The old
   * renderer still printed the object, which is why every scenario row showed
   * "[object Object]" — the id is carried through untouched because evidence
   * attaches to it, and 'name' / 'goal' are the two editable parts.
   */
  function scenarioList(project) {
    var rows = '';
    for (var i = 0; i < project.plan.scenarios.length; i += 1) {
      var scenario = project.plan.scenarios[i];
      rows += '<div class="row-card">' +
        '<div class="row-card-head">' +
          '<span class="row-card-id mono">' + escapeHtml(scenario.id) + '</span>' +
          '<input class="input input-flush" data-path="plan.scenarios.' + i + '.name" value="' + escapeHtml(scenario.name) + '" placeholder="场景名称，如「办公网远程接入」">' +
          '<button type="button" class="btn btn-sm btn-remove" data-remove="scenarios" data-index="' + i + '" title="删除这个场景">删</button>' +
        '</div>' +
        '<label class="mini mini-wide"><span class="mini-label">成功目标</span>' +
          '<input class="input" data-path="plan.scenarios.' + i + '.goal" value="' + escapeHtml(scenario.goal) + '" placeholder="如 5000 人并发成功率 ≥99.5%，稳定 7 天"></label>' +
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

  /** The plan block: how we win, split into what we commit to and the limits. */
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
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">成功指标与测试场景</h2>' +
        '<span class="sec-kicker">G1 / G2</span></header>' +
      '<p class="sec-hint">指标 2–3 条、场景 3–5 个。数量不对会在缺口清单里被点名。id 由系统分配，不要改——证据靠它挂靠。</p>' +
      '<div class="sec"><label class="field-label">关键成功指标 ' + criteriaBadge + '</label>' + criteriaList(project) + '</div>' +
      '<div class="sec"><label class="field-label">关键测试场景 ' + scenarioBadge + '</label>' + scenarioList(project) + '</div>' +
      '</section>';
  }

  /** The plan's narrative + its limits, which belong on the record side. */
  function planNarrative(project) {
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">方案要点</h2></header>' +
      field('客户核心痛点', 'plan.customer_pain', project.plan.customer_pain, { multiline: true }) +
      field('期望客户认可什么', 'plan.expected_recognition', project.plan.expected_recognition, { multiline: true }) +
      field('我方优势 / 赢点', 'plan.our_edge', project.plan.our_edge, { multiline: true }) +
      '</section>';
  }

  function riskCard(project) {
    var risks = project.plan.risks.length;
    var riskBadge = risks === 0 ? '<span class="badge badge-warn">还没有风险</span>'
      : (risks <= 3 ? '<span class="badge badge-ok">' + risks + ' 条，≤3</span>'
      : '<span class="badge badge-error">' + risks + ' 条，超过 3</span>');
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">最大风险</h2>' +
        '<span class="sec-kicker">' + riskBadge + '</span></header>' +
      riskList(project) + '</section>';
  }

  function gateCard(project) {
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">Gate 结论与时间</h2></header>' +
      '<div class="grid-2">' +
        field('计划开始', 'plan.timeline_start', project.plan.timeline_start, { date: true }) +
        field('计划结束', 'plan.timeline_end', project.plan.timeline_end, { date: true }) +
        field('G1 结论', 'plan.gate1_conclusion', project.plan.gate1_conclusion, { enum: DATA.enums.g1Conclusion }) +
        field('G2 Ready 状态', 'plan.gate2_ready', project.plan.gate2_ready, { enum: DATA.enums.g2Ready }) +
      '</div></section>';
  }

  /**
   * This round's entry — the append-only half of the ledger.
   *
   * Kept as one section rather than split across the columns: a progress entry is
   * read as a single unit ("what happened, what proves it, who said so, what
   * next"), and splitting it would let a colleague fill the top half and forget
   * the evidence below.
   */
  /**
   * A checkbox group that picks which scenarios / criteria this round touched.
   *
   * v3.1 requires scenario_ids / criteria_ids on every progress entry, and they
   * are what makes a scenario's status derivable at all. The form shipped without
   * any way to set them, so every returned form carried an empty list and the
   * ledger could never work out which scenario a proof belonged to.
   *
   * The two lists are deliberately independent: a round can prove a criterion
   * without touching any scenario, which is why they are separate groups rather
   * than a nested scenario -> criteria tree.
   */
  function idPicker(label, path, unused, options, selected, hint) {
    if (options.length === 0) {
      return '<div class="field"><label class="field-label">' + escapeHtml(label) + '</label>' +
        '<p class="field-help">' + escapeHtml(hint) + '</p>' +
        '<p class="field-help">先在左边的计划里加上，再来勾选。</p></div>';
    }
    var chosen = {};
    for (var i = 0; i < selected.length; i += 1) chosen[text(selected[i])] = true;
    var boxes = '';
    for (var j = 0; j < options.length; j += 1) {
      var option = options[j];
      boxes += '<label class="pick">' +
        '<input type="checkbox" data-pick="' + escapeHtml(path) + '" value="' + escapeHtml(option.id) + '"' +
          (chosen[option.id] ? ' checked' : '') + '>' +
        '<span class="pick-id">' + escapeHtml(option.id) + '</span>' +
        '<span class="pick-name">' + escapeHtml(option.name || '（未命名）') + '</span>' +
        '</label>';
    }
    return '<div class="field"><label class="field-label">' + escapeHtml(label) + '</label>' +
      '<p class="field-help">' + escapeHtml(hint) + '</p>' +
      '<div class="pick-list">' + boxes + '</div></div>';
  }

  function progressCard(project) {
    var entry = project.progress;
    var evidenceRows = '';
    for (var i = 0; i < entry.evidence.length; i += 1) {
      evidenceRows += '<div class="row-card"><div class="row-card-head">' +
        '<input class="input" data-path="progress.evidence.' + i + '.title" value="' + escapeHtml(entry.evidence[i].title) + '" placeholder="证据名称，如「压测报告」">' +
        '<input class="input" data-path="progress.evidence.' + i + '.link" value="' + escapeHtml(entry.evidence[i].link) + '" placeholder="链接（可空）">' +
        '<button type="button" class="btn btn-sm btn-remove" data-remove="evidence" data-index="' + i + '">删</button>' +
        '</div></div>';
    }
    var countBadge = project.existingProgressCount > 0
      ? '<span class="badge badge-info">已有 ' + project.existingProgressCount + ' 条</span>'
      : '<span class="badge badge-warn">第一条进展</span>';
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">这一轮进展</h2>' +
        '<span class="sec-kicker">' + countBadge + '</span></header>' +
      '<p class="sec-hint">追加式：这里填的是第 ' + (project.existingProgressCount + 1) + ' 条新记录，不会覆盖已有历史。</p>' +
      '<div class="grid-2">' +
        field('日期', 'progress.date', entry.date, { date: true, required: true }) +
        field('类型', 'progress.type', entry.type, { enum: DATA.enums.progressType, required: true }) +
        field('这一次什么变了', 'progress.change', entry.change, { enum: DATA.enums.progressChange, required: true, help: 'v3.1 必填。「无实质进展」也是正当答案——比写空话好。' }) +
        field('完成度', 'progress.completion', entry.completion, { enum: DATA.enums.completion }) +
      '</div>' +
      field('目标', 'progress.goal', entry.goal, {}) +
      field('实际结果', 'progress.actual', entry.actual, { multiline: true, required: true, help: '做了什么、结果如何。没有证据的结果会被缺口规则点名。' }) +
      idPicker('这一轮推进了哪些场景', 'progress.scenarioIds', null, project.plan.scenarios, entry.scenarioIds,
        '勾选这一轮实际验证过的场景。场景状态（已证明 / 待客户确认 / 无证据）由这里的勾选加上证据推导出来。') +
      idPicker('这一轮验证了哪些指标', 'progress.criteriaIds', null, project.plan.criteria, entry.criteriaIds,
        '与场景相互独立：一条指标可以被验证而没有推进任何场景。') +
      '<div class="field"><label class="field-label">证据<span class="req">*</span></label>' +
        '<p class="field-help">没有证据的结果会被缺口规则点名。证据挂到勾选的场景上。</p>' + evidenceRows +
        '<button type="button" class="btn btn-sm" data-add="evidence">+ 加一条证据</button></div>' +
      '<div class="grid-2">' +
        field('同步对象', 'progress.customer.synced_with', entry.customer.synced_with, {}) +
        field('客户认可度', 'progress.customer.recognition', entry.customer.recognition, { enum: DATA.enums.recognition }) +
        field('G3-1', 'progress.gate3_1', entry.gate3_1, { enum: DATA.enums.gate3_1 }) +
        field('G3-2', 'progress.gate3_2', entry.gate3_2, { enum: DATA.enums.gate3_2 }) +
      '</div>' +
      field('客户反馈', 'progress.customer.feedback', entry.customer.feedback, { multiline: true }) +
      '</section>';
  }

  /** The closing block: next actions, spanning both columns like the detail page. */
  function nextCard(project) {
    var next = project.progress.next;
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">下一步工作目标及计划</h2>' +
        '<span class="sec-kicker">承接 progress[].next</span></header>' +
      '<div class="grid-2">' +
        field('下一步目标', 'progress.next.goal', next.goal, { multiline: true, required: true }) +
        field('负责人', 'progress.next.owner', next.owner, {}) +
        field('截止日期', 'progress.next.deadline', next.deadline, { date: true }) +
      '</div></section>';
  }

  /** Identity: the fields the detail page keeps in its right-hand column. */
  function identityCard(project) {
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">基本信息</h2></header>' +
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

  /**
   * The readiness strip: what this form will still be missing after it is filled.
   *
   * Mirrors the dashboard's reminder band. A colleague filling a form cannot know
   * that a blank 'stage_since' makes the stall clock uncomputable, or that an
   * unpassed G0 blocks the upgrade review — so the form says it while they can
   * still fix it, rather than surfacing it weeks later on the dashboard.
   */
  function readinessCard(project, canEdit) {
    var editable = canEdit || {};
    var gate0Filled = 0;
    for (var i = 0; i < DATA.g0Fields.length; i += 1) {
      if (text(project.gate0[DATA.g0Fields[i].key]).trim() !== '') gate0Filled += 1;
    }
    if (text(project.techOwner).trim() !== '') gate0Filled += 1;

    var clocks = [];
    if (text(project.stageSince).trim() === '') clocks.push('进入阶段日期');
    if (text(project.gate0.reviewed_at).trim() === '') clocks.push('G0 评审日期');
    var clockTone = clocks.length === 0 ? 'green' : 'slate';
    var clockValue = clocks.length === 0
      ? '两个时钟都已启动，停滞与陈旧能算出来'
      : '缺 ' + clocks.join('、') + ' —— 补了才算得出停滞和陈旧';

    var conclusion = text(project.gate0.conclusion).trim();
    var gateTone = 'slate';
    var gateValue = '还没有 G0 评审结论';
    if (conclusion === '通过' && gate0Filled === 5) {
      gateTone = 'amber';
      gateValue = '五必填已齐且评审通过 —— 可以申请升 G1';
    } else if (conclusion === '未通过-退出' || conclusion === '未通过-降级') {
      gateTone = 'red';
      gateValue = 'G0 结论「' + conclusion + '」，不再提示升级';
    } else if (gate0Filled === 5) {
      gateTone = 'green';
      gateValue = '五必填已齐，可以安排 G0 评审';
    } else {
      gateValue = '还缺 ' + (5 - gate0Filled) + ' 项，评审前要补齐';
    }

    var crit = project.plan.criteria.length;
    var scn = project.plan.scenarios.length;
    var focusTone = (crit >= 2 && crit <= 3 && scn >= 3 && scn <= 5) ? 'green' : 'amber';
    var focusValue = '指标 ' + crit + ' 条、场景 ' + scn + ' 个';

    var tone = gateTone === 'red' ? 'red' : (clockTone === 'slate' || focusTone === 'amber' || gateTone === 'amber') ? 'amber' : 'green';
    return '<section class="readiness" data-tone="' + tone + '">' +
      '<div class="ready-cell"><span class="ready-label">Gate 0 五必填</span>' +
        '<span class="ready-value">' + gate0Filled + ' / 5 · ' + escapeHtml(gateValue) + '</span></div>' +
      '<div class="ready-cell"><span class="ready-label">陈旧度时钟</span>' +
        '<span class="ready-value">' + escapeHtml(clockValue) + '</span></div>' +
      // The focus cell only means something once a plan is expected. A brand-new
      // project has no plan by design (R3 asks for one only after G0 passes), so
      // showing "0 条指标，要求 2–3" would invent a failure.
      (DATA.intent === 'new' ? '' :
        '<div class="ready-cell"><span class="ready-label">计划聚焦</span>' +
        '<span class="ready-value">' + escapeHtml(focusValue) +
          (focusTone === 'green' ? '' : ' · 要求指标 2–3、场景 3–5') + '</span></div>') +
      '</section>';
  }

  /**
   * The page: banner, readiness strip, then the detail page's fixed two columns.
   *
   * Commitments left (Gate 0, criteria, scenarios), the record right (identity,
   * plan narrative, risks, gates), next actions closing across both. That is the
   * same contract the detail page holds at every gate, so the person filling the
   * form and the person reading the dashboard are looking at the same layout.
   */
  function render() {
    var project = current();
    var title = project.name || project.pocId || '新建项目';
    var meta = [];
    if (project.pocId) meta.push('<span class="banner-id">' + escapeHtml(project.pocId) + '</span>');
    var org = [project.system, project.company, project.pocType].filter(function (item) { return text(item).trim() !== ''; });
    if (org.length) meta.push('<span>' + escapeHtml(org.join(' · ')) + '</span>');
    if (text(project.owner).trim() !== '') meta.push('<span>我方 Owner ' + escapeHtml(project.owner) + '</span>');

    var pills = '';
    if (text(project.stage).trim() !== '') pills += '<span class="pill pill-blue"><span class="pill-dot"></span>' + escapeHtml(project.stage) + '</span>';
    if (text(project.status).trim() !== '') pills += '<span class="pill pill-slate"><span class="pill-dot"></span>' + escapeHtml(project.status) + '</span>';
    var amount = text(project.amountWan).trim();
    if (amount !== '') pills += '<span class="pill pill-amber">' + escapeHtml(amount) + ' 万元</span>';

    var switcher = '';
    if (DATA.projects.length > 1) {
      switcher = '<div class="banner-step">第 ' + (state.active + 1) + ' / ' + DATA.projects.length + ' 个项目' +
        ' <select class="select" id="projectSwitch" style="width:auto;display:inline-block">';
      for (var i = 0; i < DATA.projects.length; i += 1) {
        switcher += '<option value="' + i + '"' + (i === state.active ? ' selected' : '') + '>' +
          escapeHtml(DATA.projects[i].name || DATA.projects[i].pocId || '未命名') + '</option>';
      }
      switcher += '</select></div>';
    }

    var banner = '<header class="banner">' +
      '<div class="banner-main">' +
        '<span class="banner-kicker">POC 信息收集 · ' + intentLabel() + '</span>' +
        '<h1 class="banner-title">' + escapeHtml(title) + '</h1>' +
        '<div class="banner-meta">' + meta.join('') + '</div>' +
      '</div>' +
      '<div class="banner-side">' +
        '<div class="banner-pills">' + pills + '</div>' +
        '<div class="banner-actions"><span class="save-status" id="saveStatus">已就绪</span>' +
          '<button type="button" class="btn" id="clearBtn">清空草稿</button></div>' +
      '</div>' +
      (switcher ? '<nav class="banner-nav">' + switcher + '</nav>' : '') +
      '</header>';

    // Which sections this page is about, resolved on the Host from the intent
    // and the project's stage. Everything outside 'editable' is shown collapsed
    // and read-only, so a colleague adding a progress round never scrolls past
    // twenty fields they are not editing.
    var plan_ = DATA.sections[state.active] || { editable: ['identity', 'gate0', 'plan', 'progress'], context: [] };
    var canEdit = {};
    for (var e = 0; e < plan_.editable.length; e += 1) canEdit[plan_.editable[e]] = true;

    var body = banner + readinessCard(project, canEdit);

    // 'progress' intent is the one-screen case: the round and nothing else.
    if (DATA.intent === 'progress') {
      body += progressCard(project) + nextCard(project);
      byId('formBody').innerHTML = body;
      bindSwitch();
      markFooter();
      return;
    }

    var left = '';
    if (canEdit.gate0) left += g0Card(project); else left += contextGate0(project);
    // A new project has no plan yet, so there is nothing to show read-only —
    // an empty "方案 · 只读" block would only suggest work that does not exist.
    if (canEdit.plan) left += planCard(project);
    else if (DATA.intent !== 'new') left += contextPlan(project);

    var right = '';
    if (canEdit.identity) right += identityCard(project); else right += contextIdentity(project);
    if (canEdit.plan) right += planNarrative(project) + riskCard(project);
    if (canEdit.gate12) right += gateCard(project);
    if (canEdit.outcome) right += outcomeCard(project);

    if (left !== '') body += '<div class="columns"><div class="col">' + left + '</div><div class="col">' + right + '</div></div>';
    else if (right !== '') body += '<div class="columns"><div class="col"></div><div class="col">' + right + '</div></div>';

    if (canEdit.progress || DATA.intent === 'new') body += progressCard(project) + nextCard(project);

    byId('formBody').innerHTML = body;
    bindSwitch();
    markFooter();
  }

  /** Wire the project switcher, if the batch has more than one project. */
  function bindSwitch() {
    var switchNode = byId('projectSwitch');
    if (!switchNode) return;
    switchNode.addEventListener('change', function (event) {
      state.active = Number(event.target.value);
      render();
    });
  }

  /** The intent, as a phrase for the banner and the footer. */
  function intentLabel() {
    return DATA.intent === 'new' ? '新建项目' : DATA.intent === 'progress' ? '记录进展' : '补充信息';
  }

  function markFooter() {
    var info = byId('footerInfo');
    if (!info) return;
    info.textContent = intentLabel() + ' · 共 ' + DATA.projects.length + ' 个项目 · 草稿自动保存在本机浏览器';
  }

  /** Read-only Gate 0 summary: a completed stage is context, not a task. */
  function contextGate0(project) {
    var present = 0;
    for (var i = 0; i < DATA.g0Fields.length; i += 1) {
      if (text(project.gate0[DATA.g0Fields[i].key]).trim() !== '') present += 1;
    }
    if (text(project.techOwner).trim() !== '') present += 1;
    var tone = present === 5 ? 'badge-ok' : 'badge-warn';
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">Gate 0 · 只读</h2>' +
        '<span class="sec-kicker"><span class="badge ' + tone + '">五必填 ' + present + ' / 5</span></span></header>' +
      '<p class="sec-hint">这一阶段已完成，内容作为上下文展示。要修改请单独导出「补充信息」表单并选择 G0。</p>' +
      '</section>';
  }

  /** Read-only plan summary. */
  function contextPlan(project) {
    var crit = project.plan.criteria.length;
    var scn = project.plan.scenarios.length;
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">方案 · 只读</h2>' +
        '<span class="sec-kicker">指标 ' + crit + ' · 场景 ' + scn + '</span></header>' +
      '<p class="sec-hint">方案已锁定为只读。要改计划，请导出「补充信息」表单并选择对应阶段。</p>' +
      '</section>';
  }

  /** Read-only identity summary: the fields a colleague must not re-edit here. */
  function contextIdentity(project) {
    var bits = [];
    if (project.pocId) bits.push(project.pocId);
    if (project.system) bits.push(project.system);
    if (project.company) bits.push(project.company);
    if (project.owner) bits.push('Owner ' + project.owner);
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">基本信息 · 只读</h2></header>' +
      '<p class="sec-hint">' + escapeHtml(bits.join(' · ') || '未填写') + '</p>' +
      '</section>';
  }

  /** The G4 block: conclusion and conversion, which no other stage asks for. */
  function outcomeCard(project) {
    var o = project.outcome || {};
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">结论与转化</h2>' +
        '<span class="sec-kicker">G4</span></header>' +
      '<p class="sec-hint">这一阶段要回答：证明了什么、客户认可什么、下一步业务动作是什么。</p>' +
      field('我们证明了什么', 'outcome.conclusion.proved', o.proved || '', { multiline: true }) +
      field('客户认可了什么', 'outcome.conclusion.recognized', o.recognized || '', { multiline: true }) +
      field('下一步业务动作', 'outcome.conclusion.next_business', o.next_business || '', { multiline: true }) +
      field('我方证据', 'outcome.our_proof', o.our_proof || '', { multiline: true }) +
      '<div class="grid-2">' +
        field('目标达成', 'outcome.achievement', o.achievement || '', { enum: DATA.enums.achievement }) +
        field('客户认可', 'outcome.customer_recognition', o.customer_recognition || '', { enum: DATA.enums.recognition }) +
        field('Next Milestone', 'outcome.business.milestone', o.milestone || '') +
        field('业务负责人', 'outcome.business.owner', o.businessOwner || '') +
        field('业务截止', 'outcome.business.deadline', o.businessDeadline || '', { date: true }) +
        field('业务状态', 'outcome.business.status', o.businessStatus || '', { enum: DATA.enums.businessStatus }) +
      '</div>' +
      field('总体结论', 'outcome.overall', o.overall || '', { multiline: true }) +
      '</section>';
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
      // A picker checkbox writes an id LIST, not a scalar, so it takes its own
      // branch: routing it through setPath would replace the array with "on".
      var pickPath = target.getAttribute('data-pick');
      if (pickPath) {
        var entry = current().progress;
        var list = pickPath === 'progress.scenarioIds' ? entry.scenarioIds : entry.criteriaIds;
        var id = target.value;
        var at = list.indexOf(id);
        if (target.checked && at < 0) list.push(id);
        if (!target.checked && at >= 0) list.splice(at, 1);
        scheduleSave();
        return;
      }
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
        if (addKey === 'criteria') project.plan.criteria.push(nextRow('cri', project.plan.criteria, { name: '', metric: '', baseline: '', target: '' }));
        if (addKey === 'scenarios') project.plan.scenarios.push(nextRow('scn', project.plan.scenarios, { name: '', goal: '' }));
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
      // v3.1: the id comes first because it is the join key evidence uses.
      lines.push('    - id: ' + scalar(criteria[i].id));
      lines.push('      name: ' + scalar(criteria[i].name));
      lines.push('      metric: ' + scalar(criteria[i].metric));
      lines.push('      baseline: ' + scalar(criteria[i].baseline));
      lines.push('      target: ' + scalar(criteria[i].target));
    }
    var scenarios = project.plan.scenarios.filter(function (item) { return text(item.name).trim() !== ''; });
    lines.push('  scenarios:' + (scenarios.length === 0 ? ' []' : ''));
    for (i = 0; i < scenarios.length; i += 1) {
      lines.push('    - id: ' + scalar(scenarios[i].id));
      lines.push('      name: ' + scalar(scenarios[i].name));
      lines.push('      goal: ' + scalar(scenarios[i].goal));
    }
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
      lines.push('    change: ' + scalar(entry.change));
      lines.push('    goal: ' + scalar(entry.goal));
      var scnIds = entry.scenarioIds.filter(function (item) { return text(item).trim() !== ''; });
      lines.push('    scenario_ids:' + (scnIds.length === 0 ? ' []' : ''));
      for (i = 0; i < scnIds.length; i += 1) lines.push('      - ' + scalar(scnIds[i]));
      var criIds = entry.criteriaIds.filter(function (item) { return text(item).trim() !== ''; });
      lines.push('    criteria_ids:' + (criIds.length === 0 ? ' []' : ''));
      for (i = 0; i < criIds.length; i += 1) lines.push('      - ' + scalar(criIds[i]));
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

  /**
   * Serialize the whole page to the change document a colleague sends back.
   *
   * This is the DOWNLOAD format. It carries only the fields a human filled in,
   * never the ledger's derived values: 'gate0.missing', 'gate0.complete',
   * 'priority' and the per-scenario statuses are computed by 'tools/derive.mjs'
   * and asserted by CI, so a form that wrote them would be either wrong or
   * overwritten. 'poc-submit' merges this object into the existing project file
   * and leaves everything else — including 'gate_decisions', existing progress
   * history and gate verdicts — untouched.
   */
  function toChangeDocument() {
    var changes = [];
    for (var i = 0; i < DATA.projects.length; i += 1) {
      changes.push(changeSetOf(DATA.projects[i]));
    }
    return {
      schemaVersion: DATA.schemaVersion,
      generatedAt: new Date().toISOString(),
      generatedBy: 'POC 信息收集表单 v3.1',
      intent: DATA.intent,
      changes: changes
    };
  }

  /** One project's human-authored fields, with '' collapsed to null. */
  function changeSetOf(project) {
    function orNull(value) {
      var raw = text(value).trim();
      return raw === '' ? null : raw;
    }
    var criteria = [];
    for (var i = 0; i < project.plan.criteria.length; i += 1) {
      var c = project.plan.criteria[i];
      if (text(c.name).trim() === '') continue;
      criteria.push({ id: orNull(c.id), name: text(c.name).trim(), metric: orNull(c.metric), baseline: orNull(c.baseline), target: orNull(c.target) });
    }
    var scenarios = [];
    for (var j = 0; j < project.plan.scenarios.length; j += 1) {
      var sc = project.plan.scenarios[j];
      if (text(sc.name).trim() === '') continue;
      scenarios.push({ id: orNull(sc.id), name: text(sc.name).trim(), goal: orNull(sc.goal) });
    }
    var risks = [];
    for (var k = 0; k < project.plan.risks.length; k += 1) {
      var r = project.plan.risks[k];
      if (text(r.name).trim() === '') continue;
      risks.push({ name: text(r.name).trim(), level: orNull(r.level), mitigation: orNull(r.mitigation) });
    }
    var rounds = [];
    var entry = project.progress;
    var touched = text(entry.date).trim() !== '' || text(entry.actual).trim() !== '' || text(entry.goal).trim() !== '';
    if (touched) rounds.push(progressEntryOf(entry));
    return {
      schema_version: DATA.schemaVersion,
      poc_id: text(project.pocId).trim(),
      name: text(project.name).trim(),
      org: { system: orNull(project.system), company: orNull(project.company), department: orNull(project.department) },
      amount_wan: text(project.amountWan).trim() === '' ? null : Number(project.amountWan),
      poc_type: orNull(project.pocType),
      owner: orNull(project.owner),
      sales: orNull(project.sales),
      tech_owner: orNull(project.techOwner),
      exec_sponsor: orNull(project.execSponsor),
      stage: project.stage,
      status: project.status,
      stage_since: orNull(project.stageSince),
      gate0: {
        why_customer: orNull(project.gate0.why_customer),
        why_us: orNull(project.gate0.why_us),
        decision_chain: orNull(project.gate0.decision_chain),
        post_poc_decision: orNull(project.gate0.post_poc_decision),
        competitor: orNull(project.gate0.competitor),
        review: { conclusion: orNull(project.gate0.conclusion), reviewer: orNull(project.gate0.reviewer), reviewed_at: orNull(project.gate0.reviewed_at) }
      },
      plan: {
        customer_pain: orNull(project.plan.customer_pain),
        expected_recognition: orNull(project.plan.expected_recognition),
        our_edge: orNull(project.plan.our_edge),
        criteria: criteria,
        scenarios: scenarios,
        risks: risks,
        timeline: { start: orNull(project.plan.timeline_start), end: orNull(project.plan.timeline_end) },
        gate1: { conclusion: orNull(project.plan.gate1_conclusion) },
        gate2: { ready: orNull(project.plan.gate2_ready) }
      },
      progress: rounds
    };
  }

  /** One appended round, in the ledger's v3.1 shape. */
  function progressEntryOf(entry) {
    function orNull(value) {
      var raw = text(value).trim();
      return raw === '' ? null : raw;
    }
    var evidence = [];
    for (var i = 0; i < entry.evidence.length; i += 1) {
      var item = entry.evidence[i];
      if (text(item.title).trim() === '') continue;
      evidence.push({ title: text(item.title).trim(), link: orNull(item.link), type: orNull(item.type) });
    }
    var scnIds = [];
    for (var j = 0; j < entry.scenarioIds.length; j += 1) if (text(entry.scenarioIds[j]).trim() !== '') scnIds.push(text(entry.scenarioIds[j]).trim());
    var criIds = [];
    for (var k = 0; k < entry.criteriaIds.length; k += 1) if (text(entry.criteriaIds[k]).trim() !== '') criIds.push(text(entry.criteriaIds[k]).trim());
    return {
      date: orNull(entry.date),
      type: orNull(entry.type),
      change: orNull(entry.change),
      goal: orNull(entry.goal),
      scenario_ids: scnIds,
      criteria_ids: criIds,
      actual: orNull(entry.actual),
      completion: orNull(entry.completion),
      evidence: evidence,
      customer: { synced_with: orNull(entry.customer.synced_with), feedback: orNull(entry.customer.feedback), recognition: orNull(entry.customer.recognition) },
      gate3_1: orNull(entry.gate3_1),
      gate3_2: orNull(entry.gate3_2),
      next: { goal: orNull(entry.next.goal), owner: orNull(entry.next.owner), deadline: orNull(entry.next.deadline) }
    };
  }

  function previewYaml() {
    var node = byId('yamlPreview');
    if (!node) return;
    node.textContent = JSON.stringify(toChangeDocument(), null, 2);
    node.hidden = false;
    // Guarded: scrollIntoView is absent in jsdom and in a few older embedded
    // webviews. Scrolling is a convenience, so a missing implementation must not
    // throw after the preview has already been rendered.
    if (node.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function downloadYaml() {
    if (!validateRequired()) {
      showToast('还有必填项没填');
      return;
    }
    var stamp = DATA.today.replace(/-/g, '');
    var document_ = toChangeDocument();
    var blob = new Blob([JSON.stringify(document_, null, 2)], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    // One file for the whole batch: the merge step keys off 'changes[]', and a
    // batch is what the colleague was handed.
    anchor.download = 'poc-changes-' + stamp + '.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    showToast('已下载 poc-changes-' + stamp + '.json');
    save(true);
  }

  /** The bare-minimum required fields, checked before a download. */
  function validateRequired() {
    var ok = true;
    var project = current();
    var required = [
      ['name', project.name],
      ['owner', project.owner],
      ['techOwner', project.techOwner],
      ['progress.date', project.progress.date],
      // v3.1 makes 'change' mandatory: a round that does not say what moved is
      // how a timeline decays into "communicated with customer". The ledger
      // rejects a null, so the form must refuse to download one.
      ['progress.change', project.progress.change],
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
