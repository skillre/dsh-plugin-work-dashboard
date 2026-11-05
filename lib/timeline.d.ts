/**
 * The global timeline: every round of every project, newest first.
 *
 * The schema says a timeline is append-only, one entry per review round. Read
 * project by project, that history is invisible: you see the latest state and
 * nothing about rhythm. The global view answers the questions the per-project
 * page cannot — who has gone quiet, when did the team actually do things, and
 * which rounds produced evidence versus only a conversation.
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
 * `now` is injected so the "silent projects" list is deterministic in tests;
 * the silence threshold is expressed in days and matches the gap rule's own
 * default rather than inventing a second notion of "stale".
 */
export declare function buildGlobalTimeline(records: readonly PocRecord[], options: {
    staleDays: number;
}): GlobalTimeline;
