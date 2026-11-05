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

/** Every gap rule id this plugin knows. */
export const GAP_RULES = Object.freeze([
  'G0-why-customer',
  'G0-why-we',
  'G0-tech-owner',
  'G1-focus-overflow',
  'G2-prereq-invested',
  'G3-result-no-evidence',
  'G3-evidence-no-recognition',
  'action-overdue',
  'G4-no-next-milestone',
  'closed-not-closed-loop',
] as const)
export type GapRule = (typeof GAP_RULES)[number]

/** Severity a gap carries; `high` sorts first and paints red. */
export type GapLevel = 'high' | 'medium'

/** One YAML gate block as stored in the repository. */
export interface GateRecord {
  complete?: boolean | null
  date?: string | null
  indicators_count?: number | null
  scenarios_count?: number | null
  risks_count?: number | null
  prerequisites_ready?: boolean | null
  engineers_invested?: boolean | null
}

/** One success criterion, normalized for the wire. */
export interface CriterionView {
  name: string
  version: string
  metric: string
}

/** One tracked risk, normalized for the wire. */
export interface RiskView {
  name: string
  level: string
  mitigation: string
}

/** One success criterion as stored in the repository YAML. */
export interface CriterionRecord {
  name?: string | null
  version?: string | null
  metric?: string | null
}

/** One tracked risk as stored in the repository YAML. */
export interface RiskRecord {
  name?: string | null
  level?: string | null
  mitigation?: string | null
}

/** The four-dimensional result block. */
export interface ResultRecord {
  achievement?: string | null
  evidence?: string | null
  recognition?: string | null
  next_milestone?: string | null
}

/** One append-only timeline round. */
export interface TimelineRecord {
  date?: string | null
  round?: number | null
  goal?: string | null
  actual?: string | null
  evidence?: string | null
  customer_feedback?: string | null
  recognition_scope?: string | null
}

/**
 * One parsed `projects/<poc_id>.yaml`.
 *
 * Every field is optional: the repository is hand-edited, so a partially
 * filled project is normal input, not a malformed record. The gap scanner is
 * what turns absence into a finding.
 */
export interface PocRecord {
  poc_id?: string | null
  name?: string | null
  type?: string | null
  tier?: string | null
  stage?: string | null
  owner?: string | null
  sales_initiator?: string | null
  customer_tech_owner?: string | null
  why_customer_test?: string | null
  why_we_test?: string | null
  next_action_goal?: string | null
  gates?: Partial<Record<StageId, GateRecord>> | null
  success_criteria?: CriterionRecord[] | null
  success_scenarios?: (string | null)[] | null
  risks?: RiskRecord[] | null
  result?: ResultRecord | null
  timeline?: TimelineRecord[] | null
  /** Unknown extra keys survive the parse so a future schema still loads. */
  [key: string]: unknown
}

/** The four dimensions resolved to booleans for rendering. */
export type Dimensions = Record<DimensionKey, boolean>

/** One row of the project table. */
export interface ProjectSummary {
  pocId: string
  name: string
  type: string
  tier: string
  /** Raw `stage` string from the YAML, e.g. `G2-方案验证`. */
  stageLabel: string
  /** Normalized stage id; `null` when the raw value is not recognized. */
  stage: StageId | null
  /** `true` when the raw stage is `closed`. */
  closed: boolean
  /**
   * Per-stage completion straight from `gates.G0..G4.complete`.
   *
   * The rail must not infer "done" from the current stage position: a project
   * can sit at G4 while its G3 gate was never actually signed off, and showing
   * that as complete would hide the exact gap the ledger exists to expose.
   */
  gateComplete: [boolean, boolean, boolean, boolean, boolean]
  owner: string
  dimensions: Dimensions
  /** How many of the four dimensions are present. */
  dimensionCount: number
  gapCount: number
  highGapCount: number
  /** Date of the newest timeline round, or `null` when there is none. */
  lastActivity: string | null
  /** Whole days since {@link lastActivity}; `null` without a timeline. */
  daysSinceActivity: number | null
}

/** One gap finding, addressed to a project and a rule. */
export interface GapItem {
  rule: GapRule
  /** Rule number 1-8, as numbered in the ledger schema. */
  ruleNo: number
  level: GapLevel
  /** Sort weight: higher is more urgent. */
  priority: number
  pocId: string
  pocName: string
  /** The offending YAML field, when the rule targets exactly one. */
  field?: string
  /** Rule-specific numbers the Client interpolates into its copy. */
  params?: Record<string, number | string>
}

/** The headline counters above the project table. */
export interface Stats {
  /** Projects that are neither `closed` nor fully converted. */
  active: number
  /** Projects missing at least one of the three G0 prerequisites. */
  g0Incomplete: number
  /** Projects carrying a high-severity gap. */
  atRisk: number
  /** Projects with achievement, evidence and recognition all present. */
  convertible: number
  total: number
  closed: number
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
  /** Non-fatal findings: unreadable files, unparsable YAML, duplicates. */
  warnings: string[]
}

/** One gate row on the detail page. */
export interface GateDetail {
  stage: StageId
  complete: boolean
  date: string | null
  indicators: number | null
  scenarios: number | null
  risks: number | null
  prerequisitesReady: boolean | null
  engineersInvested: boolean | null
}

/** One timeline round as the detail page receives it: every field present. */
export interface TimelineRound {
  date: string
  round: number | null
  goal: string
  actual: string
  evidence: string
  customer_feedback: string
  recognition_scope: string
}

/** The result block as the detail page receives it: every field present. */
export interface ResultView {
  achievement: string
  evidence: string
  recognition: string
  next_milestone: string
}

/** Everything the detail page renders. */
export interface ProjectDetail {
  summary: ProjectSummary
  type: string
  tier: string
  owner: string
  salesInitiator: string
  customerTechOwner: string
  whyCustomerTest: string
  whyWeTest: string
  nextActionGoal: string
  gates: GateDetail[]
  criteria: CriterionView[]
  scenarios: string[]
  risks: RiskView[]
  result: ResultView
  timeline: TimelineRound[]
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
  | { action: 'export'; pocIds: string[]; mode: 'fill' | 'blank' }
  | { action: 'risks' }
  | { action: 'timeline' }









/** Reply to `export`: a self-contained HTML form the user saves to disk. */
export interface ExportOutcome {
  /** The generated HTML document, ready to write as a file. */
  html: string
  /** Suggested file name, e.g. `poc-forms-20261105-3.html`. */
  fileName: string
  /** Which projects the form covers (empty for a blank form). */
  pocIds: string[]
  /** `fill` pre-fills from the ledger; `blank` is a new-project form. */
  mode: 'fill' | 'blank'
  /** Size of the generated document, in characters. */
  bytes: number
}

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
  round: number | null
  goal: string
  actual: string
  evidence: string
  customerFeedback: string
  recognitionScope: string
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
