/**
 * The eight ledger gap rules, as pure functions.
 *
 * The rules are hard-coded here on purpose: they are the product's judgement,
 * not repository data, so they must not drift with a script the data source
 * happens to ship. Every rule is a total function of `(record, options)` —
 * no clock, no filesystem, no locale — so `tests/gap.spec.ts` can pin each one
 * to a table of fixtures.
 *
 * Rule numbering follows `poc-schema.md`. Rule 1 is three separate findings
 * (one per missing G0 prerequisite) because the console has to tell the user
 * *which* field is missing, not merely that something is.
 */
import type { GapItem, PocRecord, StageId } from './types.js';
/** Normalize the free-form `stage` string onto a stage id. */
export declare function normalizeStage(raw: unknown): {
    stage: StageId | null;
    closed: boolean;
};
/** Trim a scalar to a string; absent, null and blank all collapse to `''`. */
export declare function text(value: unknown): string;
/** Options the rule set needs from the caller, so it stays clock-free. */
export interface ScanOptions {
    /** Injected clock: the rules compare against it, tests pin it. */
    now: Date;
    /** Days of silence after which an unclosed next action counts as stale. */
    staleDays: number;
}
/** The four dimensions, resolved to presence flags. */
export declare function readDimensions(poc: PocRecord): {
    achievement: boolean;
    evidence: boolean;
    recognition: boolean;
    nextMilestone: boolean;
};
/**
 * Scan one record and return every gap it has.
 *
 * The returned list is ordered by severity then rule number; the overview page
 * concatenates the per-project lists and re-sorts, so order here only has to be
 * stable for tests.
 */
export declare function scanGaps(poc: PocRecord, options: ScanOptions): GapItem[];
/**
 * The newest timeline date, or `null` when the timeline is absent or empty.
 *
 * Only `YYYY-MM-DD` values are considered: a hand-edited ledger can contain
 * anything, and comparing unparsable text lexicographically would let "bad"
 * sort after every real date. A date that cannot be parsed is ignored, which
 * makes it exactly as stale as no date at all.
 */
export declare function lastActivity(poc: PocRecord): string | null;
/** Whole days between a `YYYY-MM-DD` date and the scan clock. */
export declare function daysSince(date: string | null, now: Date): number | null;
