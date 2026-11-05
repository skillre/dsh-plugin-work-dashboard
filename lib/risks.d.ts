/**
 * The risk board: every project's risks, sorted by severity.
 *
 * The board answers a different question from the project table. The table says
 * "which project needs attention"; the board says "what could go wrong, and
 * where". It is built from the same records, so the two can never disagree.
 *
 * Severity ordering is deliberate: a `high` risk sorts above every `medium`,
 * and a blank level sorts LAST rather than first. An unset level is not a
 * statement that the risk is mild — it is a missing judgement, and putting it
 * at the top would bury the risks someone actually assessed as serious.
 */
import type { PocRecord, RiskBoard } from './types.js';
/** Severity rank: higher sorts first. A blank level ranks below `low`. */
export declare function riskRank(level: string): number;
/**
 * Build the board from the loaded records.
 *
 * Rows are ordered by severity, then by project id, then by the risk's own
 * order inside the record — a stable order that does not reshuffle between
 * refreshes.
 */
export declare function buildRiskBoard(records: readonly PocRecord[]): RiskBoard;
