/**
 * The sixteen v3.1 gap rules, as pure functions.
 *
 * Every rule is a total function of `(record, options)` — no clock, no
 * filesystem, no locale — so `tests/gap.spec.ts` can pin each one to a fixture.
 *
 * Thresholds are NOT hard-coded here. They arrive through
 * {@link ScanOptions.rules}, parsed from the ledger's `config/rules.yaml`, because
 * the ledger treats that file as the single source ("three copied rule lists
 * drift; one does not"). A caller that omits `rules` gets the built-in fallback,
 * which is the same set of numbers but is labelled as a fallback in the UI.
 *
 * The v3 model is **progress-centred**: a project is judged by its latest
 * progress entry, not by a separately-maintained `result` block. Rules 8–10
 * therefore read the newest entry, and rule 7 compares "has any progress"
 * against the G2 readiness flag.
 *
 * Rules 13–16 are the v3.1 additions and read the ledger's **derived**
 * per-scenario and per-criterion state (`scenarios[].status`,
 * `criteria[].status`) rather than re-deriving it: the ledger's `derive.mjs` is
 * the only writer of those fields, and a second implementation here would
 * eventually disagree with CI.
 */
import type { GapItem, GapLevel, PocRecord, StageId } from './types.js';
import { type RulesBundle } from './rules.js';
/** Normalize the free-form `stage` string onto a stage id. */
export declare function normalizeStage(raw: unknown): {
    stage: StageId | null;
    closed: boolean;
};
/** Trim a scalar to a string; absent, null and blank all collapse to `''`. */
export declare function text(value: unknown): string;
/** `true` when a value carries no content at all. */
export declare function blank(value: unknown): boolean;
/** A numeric value, or `null` when absent or not a finite number. */
export declare function numberOrNull(value: unknown): number | null;
/** Options the rule set needs from the caller, so it stays clock-free. */
export interface ScanOptions {
    /** Injected clock: the rules compare against it, tests pin it. */
    now: Date;
    /** Days in one stage after which rule 12 fires. */
    stallDays: number;
    /**
     * The thresholds and rule metadata in force.
     *
     * Omitted means "use the built-in fallback": the scan still runs, but the
     * caller should surface that its findings came from fallback numbers, not from
     * the ledger's `config/rules.yaml`.
     */
    rules?: RulesBundle;
}
/** Rule metadata: number, severity and sort weight. */
export declare const RULE_META: Record<GapItem['rule'], {
    no: number;
    level: GapLevel;
    priority: number;
}>;
/** The four dimensions, resolved from the v3 `outcome` block. */
export declare function readDimensions(poc: PocRecord): {
    achievement: boolean;
    evidence: boolean;
    recognition: boolean;
    nextMilestone: boolean;
};
/** The newest progress entry, or `null`. */
export declare function latestProgress(poc: PocRecord): Record<string, unknown> | null;
/** The newest progress date, or `null`. */
export declare function lastProgressDate(poc: PocRecord): string | null;
/** Whole days between a `YYYY-MM-DD` date and the scan clock. */
export declare function daysSince(date: string | null, now: Date): number | null;
/**
 * Scan one record and return every v3 gap it has.
 *
 * The returned list is ordered by severity then rule number; the overview page
 * concatenates the per-project lists and re-sorts, so order here only has to be
 * stable for tests.
 */
export declare function scanGaps(poc: PocRecord, options: ScanOptions): GapItem[];
