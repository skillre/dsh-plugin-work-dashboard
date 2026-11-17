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
import { daysSince, latestProgress, normalizeStage, numberOrNull, scanGaps, text } from './gap.js';
import { BLOCKER_SOURCES } from './types.js';
/** Severity and sort weight for one source. */
const SOURCE_META = {
    // A stalled project is losing money right now; nothing else outranks it.
    stalled: { level: 'high', priority: 88 },
    // No progress at all is the "invisible work" case the timeline also flags.
    'no-progress': { level: 'high', priority: 86 },
    'missing-amount': { level: 'medium', priority: 58 },
    // The gap rules carry their own priority; this is only the fallback.
    gap: { level: 'high', priority: 80 },
    'no-stage-since': { level: 'medium', priority: 44 },
};
/** An empty count map, so every source key exists even at zero. */
function emptyCounts() {
    return { gap: 0, stalled: 0, 'missing-amount': 0, 'no-progress': 0, 'no-stage-since': 0 };
}
/** One row from a gap finding; the rule's own level and priority win. */
function fromGap(item, stageLabel) {
    return {
        source: 'gap',
        level: item.level,
        priority: item.priority,
        pocId: item.pocId,
        pocName: item.pocName,
        stageLabel,
        rule: item.rule,
        ruleNo: item.ruleNo,
        params: item.params ?? {},
    };
}
/** One row from a non-gap source. */
function fromSource(source, record, stageLabel, params = {}) {
    const meta = SOURCE_META[source];
    const pocId = text(record.poc_id);
    const name = text(record.name);
    return {
        source,
        level: meta.level,
        priority: meta.priority,
        pocId,
        pocName: name === '' ? pocId : name,
        stageLabel,
        rule: null,
        ruleNo: 0,
        params,
    };
}
/**
 * Whether the record has any progress entry at all.
 *
 * `latestProgress` is the single definition of "the newest entry" in this
 * codebase; using it here keeps the board, the summary and the detail page in
 * agreement about what counts as activity.
 */
function hasProgress(record) {
    return latestProgress(record) !== null;
}
/**
 * Build the blocker board from the loaded records.
 *
 * Ordering: a global priority descending, then project id, then source. The
 * gap rules keep their own weights (R11 outranks R2, and so on), so this list
 * is a merge of rankings rather than a re-ranking — which is the point: the
 * most valuable finding must not sink because it came from a smaller source.
 */
export function buildBlockerBoard(records, options) {
    const rows = [];
    const counts = emptyCounts();
    const blocked = new Set();
    for (const record of records) {
        const pocId = text(record.poc_id);
        const rawStage = text(record.stage);
        const { closed } = normalizeStage(record.stage);
        const stageLabel = closed ? 'closed' : rawStage;
        const before = rows.length;
        // 1. The twelve rules. Delegated, never reimplemented.
        for (const item of scanGaps(record, options)) {
            rows.push(fromGap(item, stageLabel));
            counts.gap += 1;
        }
        // 2. Stalled: the stage clock exists AND has run out. R12 already reports
        //    exactly this case, so the row is only added when R12 did not fire —
        //    otherwise the same fact would appear twice under two labels.
        const since = text(record.stage_since);
        const isDated = /^\d{4}-\d{2}-\d{2}$/.test(since);
        const stalledDays = isDated ? daysSince(since, options.now) : null;
        const r12Fired = rows.some((row) => row.pocId === pocId && row.rule === 'R12-stage-stalled');
        if (stalledDays !== null && stalledDays > options.stallDays && !r12Fired) {
            rows.push(fromSource('stalled', record, stageLabel, { days: stalledDays, stallDays: options.stallDays }));
            counts.stalled += 1;
        }
        // 3. Missing amount. `0` is the ledger's "not filled", not "free".
        if ((numberOrNull(record.amount_wan) ?? 0) === 0) {
            rows.push(fromSource('missing-amount', record, stageLabel));
            counts['missing-amount'] += 1;
        }
        // 4. No progress at all.
        if (!hasProgress(record)) {
            rows.push(fromSource('no-progress', record, stageLabel));
            counts['no-progress'] += 1;
        }
        // 5. The stall clock never started.
        if (!isDated) {
            rows.push(fromSource('no-stage-since', record, stageLabel));
            counts['no-stage-since'] += 1;
        }
        if (rows.length > before)
            blocked.add(pocId);
    }
    rows.sort((left, right) => right.priority - left.priority ||
        left.pocId.localeCompare(right.pocId) ||
        left.source.localeCompare(right.source));
    return {
        rows,
        counts,
        projectsBlocked: blocked.size,
        projectsTotal: records.length,
    };
}
/** An empty board for the cold-cache case, so the Client needs no null check. */
export function emptyBlockerBoard() {
    return {
        rows: [],
        counts: emptyCounts(),
        projectsBlocked: 0,
        projectsTotal: 0,
    };
}
/** Every source key, re-exported so the Client can build its chips. */
export { BLOCKER_SOURCES };
