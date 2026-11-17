/**
 * The unified blocker board: every reason a project is stuck, in one list.
 *
 * The dashboard used to answer "what is stuck" in three unrelated places: the
 * pending rail (the 12 gap rules), the risk board (an independent page), and a
 * one-line footnote about missing amounts. A reader had to merge them mentally,
 * and the merge was never complete — a project with no amount and no progress
 * appeared in none of the three.
 *
 * This module does that merge once, on the Host, so the Client cannot disagree
 * with itself. Five sources, each with its own level and priority:
 *
 * 1. `gap` — the twelve v3 rules. Delegated to `scanGaps` so this board and the
 *    pending rail can never report different gap counts.
 * 2. `stalled` — the stage has not moved past `stallDays`. Deliberately NOT
 *    R12: R12 only fires when `stage_since` exists, which on the real ledger is
 *    one project in thirty. A project with no `stage_since` is not "not stuck",
 *    it is unmeasurable, and that is what `no-stage-since` reports.
 * 3. `missing-amount` — `amount_wan` is 0. A project with no amount cannot be
 *    ranked, forecast, or compared against the large-amount rule.
 * 4. `no-progress` — the project has never recorded a progress entry. This is
 *    the single largest blocker on a freshly imported ledger and it appeared
 *    nowhere before.
 * 5. `no-stage-since` — no `stage_since`, so the stall clock never started.
 *
 * Each source contributes at most ONE row per project. Two rows saying "this
 * project is stalled" and "this project has no stage_since" would be the same
 * finding twice, and a list that double-counts cannot be sorted honestly.
 */
import type { ScanOptions } from './gap.js';
import type { BlockerBoard, PocRecord } from './types.js';
import { BLOCKER_SOURCES } from './types.js';
/**
 * Build the blocker board from the loaded records.
 *
 * Ordering: a global priority descending, then project id, then source. The
 * gap rules keep their own weights (R11 outranks R2, and so on), so this list
 * is a merge of rankings rather than a re-ranking — which is the point: the
 * most valuable finding must not sink because it came from a smaller source.
 */
export declare function buildBlockerBoard(records: readonly PocRecord[], options: ScanOptions): BlockerBoard;
/** An empty board for the cold-cache case, so the Client needs no null check. */
export declare function emptyBlockerBoard(): BlockerBoard;
/** Every source key, re-exported so the Client can build its chips. */
export { BLOCKER_SOURCES };
