/**
 * Wire vocabulary shared by the Host and Client halves of the POC console.
 *
 * Everything here is plain, lossless JSON: the Host owns the repository cache
 * and the YAML parse, the Client owns only view state, and only these shapes
 * cross the Connection RPC boundary. Both halves compile from this file, so the
 * Client bundle carries the same literals without importing Host code.
 *
 * Localized copy is deliberately NOT here: the Host sends stable rule ids and
 * field names, and the Client maps them onto dictionary keys. One dictionary
 * therefore covers both halves, and a new rule never needs a Host release note.
 */

/** RPC endpoint path under the shared `/api` channel. */
export const ENDPOINT = 'skillre-work-dashboard/execute'

/** Sidebar panel id, main panel key, and locale namespace. */
export const PANEL_ID = 'skillre-work-dashboard'
export const LOCALE_NAMESPACE = 'skillreWorkDashboard'

/**
 * Browser-local refresh settings. They are a user preference, not plugin
 * configuration, so they live in `localStorage` and never reach the Host.
 */
export const REFRESH_INTERVAL_KEY = 'work-dashboard.refreshInterval'
export const CUSTOM_MINUTES_KEY = 'work-dashboard.customMinutes'

/** The refresh cadences the settings dialog offers. */
export const REFRESH_INTERVALS = Object.freeze(['off', '10m', '1h', 'custom'] as const)
export type RefreshInterval = (typeof REFRESH_INTERVALS)[number]

/** Default custom cadence, in minutes, when the user picks `custom` first. */
export const DEFAULT_CUSTOM_MINUTES = 30

/** Bounds of the custom cadence, in minutes. */
export const CUSTOM_MINUTES_MIN = 1
export const CUSTOM_MINUTES_MAX = 1440

/** The four stages of a POC plus the closed state. */
export const STAGES = Object.freeze(['G0', 'G1', 'G2', 'G3', 'G4'] as const)
export type StageId = (typeof STAGES)[number]

/** The four dimensions that must be tracked separately, never merged. */
export const DIMENSIONS = Object.freeze(['achievement', 'evidence', 'recognition', 'nextMilestone'] as const)
export type DimensionKey = (typeof DIMENSIONS)[number]

/**
 * How the overview renders the same project list.
 *
 * One dataset, three readings: `cards` answers "what needs me", `board` answers
 * "where is everything sitting", `table` answers "show me the numbers". Switching
 * never refetches and never drops the active filters.
 */
export const VIEW_MODES = Object.freeze(['cards', 'board', 'table'] as const)
export type ViewMode = (typeof VIEW_MODES)[number]

/** The overview's sort orders. */
export const SORT_KEYS = Object.freeze(['attention', 'amount', 'progress', 'stage'] as const)
export type SortKey = (typeof SORT_KEYS)[number]

/** Browser-local view preference key (search/filters are session-only). */
export const VIEW_MODE_KEY = 'work-dashboard.viewMode'
export const SORT_KEY_KEY = 'work-dashboard.sortKey'

/** Every gap rule id this plugin knows. */
export const GAP_RULES = Object.freeze([
  'R1-gate0-missing',
  'R2-large-amount-no-g0',
  'R3-g0-passed-no-plan',
  'R4-criteria-count',
  'R5-scenarios-count',
  'R6-risks-overflow',
  'R7-g2-not-ready',
  'R8-progress-no-evidence',
  'R9-evidence-no-recognition',
  'R10-g3-1-without-g3-2',
  'R11-no-next-milestone',
  'R12-stage-stalled',
] as const)
export type GapRule = (typeof GAP_RULES)[number]

/** Severity a gap carries; `high` sorts first and paints red. */
export type GapLevel = 'high' | 'medium'

/** One evidence artefact attached to a progress entry. */
export interface EvidenceRecord {
  title?: string | null
  link?: string | null
  type?: string | null
}

/** One success criterion (`plan.criteria[]`). */
export interface CriterionRecord {
  name?: string | null
  metric?: string | null
  baseline?: string | number | null
  target?: string | number | null
}

/** One tracked risk (`plan.risks[]`). */
export interface RiskRecord {
  name?: string | null
  level?: string | null
  mitigation?: string | null
}

/** One progress entry (`progress[]`) — the centre of the v3 model. */
export interface ProgressRecord {
  seq?: number | null
  date?: string | null
  type?: string | null
  goal?: string | null
  items?: (string | null)[] | null
  actual?: string | null
  completion?: string | null
  evidence?: EvidenceRecord[] | null
  customer?: {
    synced_with?: string | null
    feedback?: string | null
    recognition?: string | null
  } | null
  gate3_1?: string | null
  gate3_2?: string | null
  next?: {
    goal?: string | null
    owner?: string | null
    deadline?: string | null
  } | null
}

/** The G0 block: whether the project is worth doing. */
export interface Gate0Record {
  why_customer?: string | null
  why_us?: string | null
  decision_chain?: string | null
  post_poc_decision?: string | null
  competitor?: string | null
  review?: {
    conclusion?: string | null
    reviewer?: string | null
    reviewed_at?: string | null
  } | null
  /** Computed by the ledger; `null` when absent. */
  missing?: (string | null)[] | null
  complete?: boolean | null
}

/** The plan block: how to win (G1/G2). */
export interface PlanRecord {
  customer_pain?: string | null
  expected_recognition?: string | null
  criteria?: CriterionRecord[] | null
  scenarios?: (string | null)[] | null
  our_edge?: string | null
  timeline?: { start?: string | null; end?: string | null } | null
  risks?: RiskRecord[] | null
  report_nodes?: (string | null)[] | null
  gate1?: { conclusion?: string | null; reviewed_at?: string | null } | null
  gate2?: {
    ready?: string | null
    checked_at?: string | null
    prerequisites?: unknown[] | null
  } | null
}

/** The outcome block: the conclusion, mostly derived from the last progress. */
export interface OutcomeRecord {
  achievement?: string | null
  customer_recognition?: string | null
  our_proof?: string | null
  remaining_risks?: string | null
  conclusion?: {
    proved?: string | null
    recognized?: string | null
    next_business?: string | null
  } | null
  business?: {
    milestone?: string | null
    owner?: string | null
    deadline?: string | null
    status?: string | null
  } | null
  overall?: string | null
  reviewed_at?: string | null
}

/** The identity block. */
export interface OrgRecord {
  system?: string | null
  company?: string | null
  department?: string | null
}

/**
 * One parsed `projects/<poc_id>.yaml` in the v3 model.
 *
 * Every field is optional: the repository is hand-edited, so a partially filled
 * project is normal input, not a malformed record. The gap scanner is what turns
 * absence into a finding.
 */
export interface PocRecord {
  poc_id?: string | null
  name?: string | null
  org?: OrgRecord | null
  amount_wan?: number | null
  poc_type?: string | null
  priority?: string | null
  owner?: string | null
  sales?: string | null
  tech_owner?: string | null
  exec_sponsor?: string | null
  stage?: string | null
  status?: string | null
  stage_since?: string | null
  gate0?: Gate0Record | null
  plan?: PlanRecord | null
  progress?: ProgressRecord[] | null
  outcome?: OutcomeRecord | null
  /** Unknown extra keys survive the parse so a future schema still loads. */
  [key: string]: unknown
}

/** The four dimensions resolved to presence flags. */
export type Dimensions = Record<DimensionKey, boolean>

/** One row of the project table. */
export interface ProjectSummary {
  pocId: string
  name: string
  /** `org.system` — the top grouping dimension. */
  system: string
  /** `org.company` — the company under a system. */
  company: string
  /** `org.department`, or `''`. */
  department: string
  /** `poc_type` enum value. */
  pocType: string
  /** `amount_wan`; `0` when the ledger left it blank. */
  amountWan: number
  /** `priority`, or `''` when not set. */
  priority: string
  /** Raw `stage` string, e.g. `G0-立项`. */
  stageLabel: string
  /** Normalized stage id; `null` when unrecognized or `closed`. */
  stage: StageId | null
  /** `true` when `stage` is `closed`. */
  closed: boolean
  /** `status` enum value, e.g. 进行中. */
  status: string
  /** `stage_since`, or `null`. */
  stageSince: string | null
  /** Whole days in the current stage; `null` without `stage_since`. */
  daysInStage: number | null
  owner: string
  techOwner: string
  /** G0 review conclusion, or `''`. */
  g0Conclusion: string
  /** `true` when `gate0.review.conclusion` is 通过. */
  g0Passed: boolean
  /** `true` when `gate0.complete` is true. */
  g0Complete: boolean
  /**
   * Per-stage done flags derived from the v3 gate fields, in G0..G4 order.
   *
   * v3 has no `gates.G0..G4.complete` array any more, so each stage reads its
   * own source: G0 from `gate0.complete`, G1 from `plan.gate1.conclusion`,
   * G2 from `plan.gate2.ready`, G3 from the newest progress `gate3_2`, and G4
   * from `outcome.achievement`. Deriving from position instead would report
   * stages as done that were never actually signed off.
   */
  stageDone: [boolean, boolean, boolean, boolean, boolean]
  /** How many of the five G0 prerequisites are missing. */
  g0MissingCount: number
  dimensions: Dimensions
  /** How many of the four dimensions are present. */
  dimensionCount: number
  gapCount: number
  highGapCount: number
  /** Number of progress entries. */
  progressCount: number
  /** Date of the newest progress entry, or `null`. */
  lastProgressDate: string | null
  /** One-line summary of the newest progress entry, or `''`. */
  lastProgressSummary: string
  /** Whole days since the newest progress entry; `null` when there is none. */
  daysSinceProgress: number | null
  /** Raw `outcome.achievement`; `''` when unset. Used for the success counter. */
  outcomeAchievement: string
  /** Raw `outcome.customer_recognition`; `''` when unset. */
  outcomeRecognition: string
}

/** One gap finding, addressed to a project and a rule. */
export interface GapItem {
  rule: GapRule
  /** Rule number 1-12, as numbered in the v3 schema. */
  ruleNo: number
  level: GapLevel
  /** Sort weight: higher is more urgent. */
  priority: number
  pocId: string
  pocName: string
  /** The offending YAML field, when the rule targets exactly one. */
  field?: string
  /** Rule-specific values the Client interpolates into its copy. */
  params?: Record<string, number | string>
}

/** The headline counters above the project table (v3). */
export interface Stats {
  /** Every project in the ledger. */
  total: number
  /** `gate0.review.conclusion === '通过'`. */
  g0Passed: number
  /** `status === '进行中'`. */
  inProgress: number
  /** Sum of `amount_wan`, in 万元. */
  amountTotalWan: number
  /** `gate0.complete === true`. */
  g0Complete: number
  /** Projects whose newest progress is waiting on the customer. */
  awaitingCustomer: number
  /** `outcome.achievement === '达成'` and the customer recognised it. */
  succeeded: number
  /** `status === '暂停' | '已关闭' | '已取消'`. */
  stopped: number
}

/** One stage column of the funnel: how many projects, and how much money. */
export interface StageBucket {
  /** `G0`..`G4`, or `closed` for the terminal state. */
  key: StageId | 'closed' | 'unknown'
  /** Projects whose current stage is this bucket. */
  count: number
  /** Summed `amount_wan` of those projects. */
  amountWan: number
  /** Projects in this bucket that still carry a high-severity gap. */
  highGapCount: number
}

/** One row of the 体系 / 公司 breakdown. */
export interface OrgBucket {
  /** `org.system`, or `''` when unset. */
  system: string
  /** `org.company`, or `''` when unset. */
  company: string
  count: number
  amountWan: number
  /** Projects under this company carrying at least one high gap. */
  highGapCount: number
}

/** One row of the `poc_type` composition. */
export interface TypeBucket {
  pocType: string
  count: number
  amountWan: number
}

/** One bar of the amount-concentration list. */
export interface AmountRow {
  pocId: string
  pocName: string
  amountWan: number
  /** Share of the portfolio total, `0..1`. */
  share: number
  stage: StageId | null
  closed: boolean
}

/** Coverage of one of the four dimensions across the portfolio. */
export interface DimensionCoverage {
  key: DimensionKey
  /** Projects where the dimension is present. */
  present: number
  /** Projects where it is missing. */
  missing: number
  /** `present / total`, `0..1`; `0` when there are no projects. */
  ratio: number
}

/** How often one gap rule fires across the portfolio. */
export interface GapRuleCount {
  rule: GapRule
  ruleNo: number
  level: GapLevel
  count: number
}

/**
 * The portfolio analysis the overview band renders.
 *
 * Every number here is a pure aggregation of the same `projects` rows the
 * table shows, so the charts and the list can never disagree. It is computed
 * once on the Host and shipped as JSON; the Client never re-derives it.
 */
export interface PortfolioAnalysis {
  /** Stage funnel, in G0→G4→closed order. */
  stages: StageBucket[]
  /** 体系/公司 breakdown, biggest amount first. */
  orgs: OrgBucket[]
  /** `poc_type` composition, biggest count first. */
  types: TypeBucket[]
  /** Largest projects by amount, biggest first (at most 5). */
  topAmounts: AmountRow[]
  /** The four dimensions in `DIMENSIONS` order. */
  dimensions: DimensionCoverage[]
  /** Gap rules that fired at least once, most frequent first. */
  gapRules: GapRuleCount[]
  /** Amount held by the largest single project, `0..1` of the total. */
  concentration: number
  /** Projects with no amount recorded. */
  amountMissing: number
  /** Projects with at least one progress entry. */
  withProgress: number
  /** Newest progress date across the portfolio, or `null`. */
  lastActivity: string | null
}

/** Everything the overview page renders. */
export interface Snapshot {
  /** `true` once a clone exists and parsed without a fatal error. */
  cacheReady: boolean
  /** `owner/name` of the configured data source. */
  repository: string
  /** ISO timestamp of the last successful refresh in this process. */
  fetchedAt: string | null
  /** Absolute path of the local clone the data came from. */
  cachePath: string
  projects: ProjectSummary[]
  stats: Stats
  gaps: GapItem[]
  /** Aggregated portfolio view; empty buckets when there are no projects. */
  analysis: PortfolioAnalysis
  /** Non-fatal findings: unreadable files, unparsable YAML, duplicates. */
  warnings: string[]
}

/** One progress entry as the detail page receives it: every field present. */
export interface ProgressView {
  seq: number | null
  date: string
  type: string
  goal: string
  items: string[]
  actual: string
  completion: string
  evidence: Array<{ title: string; link: string; type: string }>
  customer: { syncedWith: string; feedback: string; recognition: string }
  gate3_1: string
  gate3_2: string
  next: { goal: string; owner: string; deadline: string }
}

/** The outcome block as the detail page receives it: every field present. */
export interface OutcomeView {
  achievement: string
  customerRecognition: string
  ourProof: string
  remainingRisks: string
  proved: string
  recognized: string
  nextBusiness: string
  milestone: string
  businessOwner: string
  businessDeadline: string
  businessStatus: string
  overall: string
  reviewedAt: string
}

/** One G0 prerequisite, resolved for the completeness meter. */
export interface Gate0CheckItem {
  /** The YAML field name, e.g. `why_customer`. */
  field: string
  /** `true` when the field carries content. */
  present: boolean
  /** The field's current text, or `''`. */
  value: string
}

/** The G0 block as the detail page receives it. */
export interface Gate0View {
  whyCustomer: string
  whyUs: string
  decisionChain: string
  postPocDecision: string
  competitor: string
  conclusion: string
  reviewer: string
  reviewedAt: string
  missing: string[]
  complete: boolean
  /**
   * The five G0 prerequisites in schema order, each with its own presence flag.
   *
   * v3 counts `tech_owner` as one of the five, and it lives in the identity
   * block rather than under `gate0`, so the meter cannot be derived from
   * `gate0.missing` alone without losing that row.
   */
  checklist: Gate0CheckItem[]
}

/** The plan block as the detail page receives it. */
export interface PlanView {
  customerPain: string
  expectedRecognition: string
  criteria: Array<{ name: string; metric: string; baseline: string; target: string }>
  scenarios: string[]
  ourEdge: string
  timelineStart: string
  timelineEnd: string
  risks: Array<{ name: string; level: string; mitigation: string }>
  reportNodes: string[]
  gate1Conclusion: string
  gate2Ready: string
}

/** Everything the detail page renders. */
export interface ProjectDetail {
  summary: ProjectSummary
  org: OrgRecord
  sales: string
  execSponsor: string
  gate0: Gate0View
  plan: PlanView
  progress: ProgressView[]
  outcome: OutcomeView
  gaps: GapItem[]
}

/** One endpoint outcome, mirroring the Connection RPC result envelope. */
export type PocResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string; details: Record<string, unknown> } }

/** Request kinds accepted by the Host endpoint. */
export type PocRequest =
  | { action: 'list' }
  | { action: 'refresh' }
  | { action: 'detail'; pocId: string }
  | { action: 'risks' }
  | { action: 'timeline' }









/** One risk row on the risk board. */
export interface RiskRow {
  pocId: string
  pocName: string
  stage: StageId | null
  /** `high` | `medium` | `low`, or `''` when the ledger left it blank. */
  level: string
  /** Normalized severity rank: higher sorts first. */
  rank: number
  name: string
  mitigation: string
  /** A high-severity gap on the same project, for context. */
  gapCount: number
  highGapCount: number
}

/** The risk board. */
export interface RiskBoard {
  rows: RiskRow[]
  counts: { high: number; medium: number; low: number; unset: number; total: number }
  /** Projects that carry at least one risk row. */
  projectsWithRisks: number
  /** Total projects scanned, so the board can say "3 of 3". */
  projectsTotal: number
}

/** One round on the global timeline. */
export interface TimelineEntry {
  pocId: string
  pocName: string
  stage: StageId | null
  date: string
  /** `progress[].seq`; `null` when the ledger left it blank. */
  seq: number | null
  /** `progress[].type` — 内部Review / 客户阶段同步 / Checkpoint. */
  type: string
  goal: string
  actual: string
  completion: string
  /** Evidence titles, joined for one-line display. */
  evidence: string
  /** How many evidence artefacts this entry carries. */
  evidenceCount: number
  customerFeedback: string
  recognition: string
  gate3_1: string
  gate3_2: string
  nextGoal: string
  nextOwner: string
  nextDeadline: string
}

/** The global timeline view. */
export interface GlobalTimeline {
  entries: TimelineEntry[]
  /** Oldest and newest dates actually present, or `null` when empty. */
  range: { from: string; to: string } | null
  /** Entries per month, newest month first, for the summary strip. */
  months: Array<{ month: string; count: number }>
  /** Projects with no timeline at all — the "invisible work" list. */
  silentProjects: Array<{ pocId: string; pocName: string }>
}


/** Reply to `refresh`: the outcome plus what the Host did to the cache. */
export interface RefreshOutcome {
  /** `clone` on a first pull, `fetch` when the clone already existed. */
  mode: 'clone' | 'fetch'
  /** Milliseconds the git work took. */
  durationMs: number
  /** ISO timestamp of the moment the refresh finished. */
  finishedAt: string
}
