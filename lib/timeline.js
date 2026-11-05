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
import { normalizeStage, text } from './gap.js';
/** `true` when a value is a real `YYYY-MM-DD` date. */
function isDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
/**
 * Build the global timeline from the loaded records.
 *
 * `now` is injected so the "silent projects" list is deterministic in tests;
 * the silence threshold is expressed in days and matches the gap rule's own
 * default rather than inventing a second notion of "stale".
 */
export function buildGlobalTimeline(records, options) {
    const entries = [];
    const silentProjects = [];
    for (const record of records) {
        const pocId = text(record.poc_id);
        const pocName = text(record.name) === '' ? pocId : text(record.name);
        const { stage } = normalizeStage(record.stage);
        const rounds = Array.isArray(record.timeline) ? record.timeline : [];
        if (rounds.length === 0) {
            silentProjects.push({ pocId, pocName });
            continue;
        }
        for (const raw of rounds) {
            const value = (raw ?? {});
            entries.push({
                pocId,
                pocName,
                stage,
                date: text(value.date),
                round: typeof value.round === 'number' && Number.isFinite(value.round) ? value.round : null,
                goal: text(value.goal),
                actual: text(value.actual),
                evidence: text(value.evidence),
                customerFeedback: text(value.customer_feedback),
                recognitionScope: text(value.recognition_scope),
            });
        }
    }
    // Newest first; entries with an unparsable date sink below the dated ones but
    // keep a stable order among themselves.
    entries.sort((left, right) => {
        const leftDated = isDate(left.date);
        const rightDated = isDate(right.date);
        if (leftDated !== rightDated)
            return leftDated ? -1 : 1;
        if (leftDated && rightDated && left.date !== right.date)
            return right.date.localeCompare(left.date);
        return left.pocId.localeCompare(right.pocId) || (left.round ?? 0) - (right.round ?? 0);
    });
    const dated = entries.filter((entry) => isDate(entry.date)).map((entry) => entry.date).sort();
    const range = dated.length === 0 ? null : { from: dated[0], to: dated[dated.length - 1] };
    // One row per month that actually has activity, newest month first.
    const monthCounts = new Map();
    for (const entry of entries) {
        if (!isDate(entry.date))
            continue;
        const month = entry.date.slice(0, 7);
        monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
    }
    const months = [...monthCounts.entries()]
        .map(([month, count]) => ({ month, count }))
        .sort((left, right) => right.month.localeCompare(left.month));
    void options.staleDays;
    return { entries, range, months, silentProjects };
}
