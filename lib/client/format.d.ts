/**
 * Shared display formatters.
 *
 * `formatWan` and `formatDate` had three copies each (overview, detail,
 * insights), and `stageLabel` had two. Identical copies are not a style problem:
 * three `formatDate` bodies meant three places to fix a timezone bug, and they
 * had already drifted — the insights copy accepted `''` where the detail copy
 * accepted `null`. One module, one behaviour.
 *
 * Everything here is pure and locale-explicit: the caller passes the active
 * locale, so the result never depends on ambient state (and a replay or a test
 * renders the same string as the live page).
 */
import type { Translate } from './text.js';
/**
 * Format a 万元 figure with thousands separators.
 *
 * Rounds to one decimal: the ledger stores whole 万元, so a decimal only ever
 * appears from an average, and two decimals would imply a precision the data
 * does not have.
 */
export declare function formatWan(value: number): string;
/**
 * Format a ledger date for the active locale.
 *
 * The ledger stores calendar dates, not instants, so a bare `new Date('2026-11-01')`
 * parses as UTC midnight and prints the previous day west of Greenwich. The
 * string is therefore read as local midnight. Anything that is not a calendar
 * date is returned verbatim: showing the raw value is honest, and inventing a
 * parse would hide a hand-edited typo.
 *
 * @param value the raw field, `null`, or `''`
 * @param locale the active locale id
 * @param fallback what to return for an absent value; defaults to `''`
 */
export declare function formatDate(value: string | null, locale: string, fallback?: string): string;
/** Format an ISO instant (not a calendar date) as `HH:MM` for the status bar. */
export declare function clockOf(value: string | null, locale: string): string;
/**
 * The dictionary label for a raw stage bucket key.
 *
 * Accepts the two sentinels `closed` / `unknown` alongside the five gate ids,
 * because every stage-shaped surface (funnel, board column, filter chip) has to
 * render all seven. An unrecognized value falls through unchanged rather than
 * disappearing.
 */
export declare function stageLabel(t: Translate, key: string): string;
/**
 * A stage bucket key for one project: `closed` wins over the normalized stage.
 *
 * Kept here rather than inline so the funnel, the board and the blocker list
 * bucket a project identically.
 */
export declare function stageBucketKey(project: {
    closed: boolean;
    stage: string | null;
}): string;
