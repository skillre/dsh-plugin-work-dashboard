/**
 * The twelve v3 gap rules, as pure functions.
 *
 * The rules are hard-coded here on purpose: they are the product's judgement,
 * not repository data, so they must not drift with a script the data source
 * happens to ship. Every rule is a total function of `(record, options)` —
 * no clock, no filesystem, no locale — so `tests/gap.spec.ts` can pin each one
 * to a fixture.
 *
 * The v3 model is **progress-centred**: a project is judged by its latest
 * progress entry, not by a separately-maintained `result` block. Rules 8–10
 * therefore read `progress[progress.length - 1]`, and rule 7 compares "has any
 * progress" against the G2 readiness flag.
 */
import type { GapItem, GapLevel, PocRecord, StageId } from './types.js';
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
