/**
 * The global timeline: every progress entry of every project, newest first.
 *
 * v3 is progress-centred: `progress[]` IS the history, so this view is the only
 * place that shows rhythm across the whole portfolio — who has gone quiet, when
 * did the team actually do things, and which entries produced evidence versus
 * only a conversation.
 *
 * Entries are ordered by date descending, with the project id as a stable
 * tiebreaker. Dates that do not parse are excluded from the range and the month
 * summary but still appear in the list, because dropping them would hide a
 * record the ledger actually contains.
 */
import type { GlobalTimeline, PocRecord } from './types.js';
/**
 * Build the global timeline from the loaded records.
 *
 * The silence threshold is expressed in days and matches the gap rule's own
 * default rather than inventing a second notion of "stale".
 */
export declare function buildGlobalTimeline(records: readonly PocRecord[], options: {
    stallDays: number;
}): GlobalTimeline;
