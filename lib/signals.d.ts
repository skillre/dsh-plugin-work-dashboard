/**
 * The agent's conclusions (`signals/<poc_id>.yaml`) and the staleness limits
 * (`config/health.yaml`).
 *
 * ## Why this is a separate module from `rules.ts`
 *
 * The ledger draws a hard line between two kinds of machine output:
 *
 * - `projects/*.yaml` derived fields (`scenarios[].status`, …) are
 *   **deterministic calculations** over one record, written by `tools/derive.mjs`.
 *   CI rejects a stored value that disagrees with the script.
 * - `signals/*.yaml` are **judgements that need cross-record reasoning** ("can this
 *   upgrade?", "who should be chased?"). They are written only by the agent
 *   account, never by hand, and they are an opinion rather than a fact.
 *
 * Keeping them apart is the whole point of the directory: if the two were mixed,
 * a human edit could overwrite a machine conclusion and nobody could tell who
 * said what.
 *
 * ## The contract this module honours
 *
 * The ledger's `signals/README.md` states one rule for consumers: **degrade
 * gracefully on missing fields.** A signal is optional, its schema may evolve,
 * and most projects have none at all. So every field here is optional and every
 * parse failure becomes a warning — a bad signal must never blank out the page
 * that displays the human facts.
 */
/** What the agent concluded about a possible gate promotion. */
export interface GateUpgradeSignal {
    eligible: boolean;
    from: string;
    to: string;
    missing: string[];
    basis: string[];
    note: string;
}
/** The agent's health read for one project. */
export interface HealthSignal {
    /** `ok` | `warn` | `bad`; empty when the agent did not judge. */
    level: string;
    /** Days since the newest progress round; `null` when there is no progress. */
    factsStaleDays: number | null;
    /** Days since anybody looked at the plan or the G0 review. */
    judgmentStaleDays: number | null;
    reasons: string[];
    nextAction: {
        text: string;
        owner: string;
        due: string;
    };
}
/**
 * A signal risk's severity.
 *
 * Deliberately NOT `GapLevel`: a gap is a rule violation that the ledger defines,
 * while a signal risk is the agent's opinion. They share the word "level" and
 * nothing else — `info` would be meaningless here, and `low` would be meaningless
 * there. Reusing one type would force a cast and hide exactly the mismatch this
 * distinction exists to keep visible.
 */
export type SignalRiskLevel = 'high' | 'medium' | 'low';
/** One risk the agent raised, distinct from the human `plan.risks[]`. */
export interface SignalRisk {
    id: string;
    level: SignalRiskLevel;
    text: string;
    source: string;
}
/** One project's machine judgement. */
export interface ProjectSignal {
    pocId: string;
    schemaVersion: string;
    generatedAt: string;
    generatedBy: string;
    rulesVersion: string;
    /** The `projects/` blob sha the judgement was computed from. */
    projectSha: string;
    gateUpgrade: GateUpgradeSignal | null;
    health: HealthSignal | null;
    risks: SignalRisk[];
}
/** Every signal in the cache, plus the problems met while reading them. */
export interface SignalBundle {
    /** Whether the cache carries a `signals/` directory at all. */
    present: boolean;
    byPocId: Map<string, ProjectSignal>;
    warnings: string[];
}
/**
 * Parse one `signals/<poc_id>.yaml`.
 *
 * Returns `null` for a document that is not a mapping, so the caller records a
 * warning. Missing inner fields are normal and produce empty values.
 */
export declare function parseSignal(pocId: string, source: string): ProjectSignal | null;
/**
 * Parse the whole `signals/` directory.
 *
 * One unreadable signal is skipped with a warning, never escalated: the ledger's
 * consumer contract is explicit that a signal directory may be absent or partial.
 */
export declare function parseSignals(files: Map<string, string>): SignalBundle;
/** The bundle used when the cache has no `signals/` directory. */
export declare function emptySignals(): SignalBundle;
/** The two independent staleness notions the ledger defines. */
export interface HealthThresholds {
    stallDays: number;
    /** Facts go stale when nothing has happened. */
    progressStaleDays: number;
    changeStaleDays: number;
    /** Judgment goes stale when nobody has looked. */
    g0ReviewStaleDays: number;
    planStaleDays: number;
    /** Which checks apply at each stage, as declared. */
    byStage: Record<string, string[]>;
    source: 'ledger' | 'fallback';
    warnings: string[];
}
/**
 * Built-in copy of `config/health.yaml` at rules 3.2.
 *
 * A fallback, not the source of truth: when the file is readable it always wins.
 */
export declare const FALLBACK_HEALTH: Omit<HealthThresholds, 'source' | 'warnings'>;
/** Parse `config/health.yaml`, falling back to the built-in limits. */
export declare function parseHealthConfig(source: string | null | undefined): HealthThresholds;
