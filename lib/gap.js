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
/** Stage ids a raw `stage` value can normalize to, in order. */
const STAGE_PREFIXES = [
    ['G0', 'G0'],
    ['G1', 'G1'],
    ['G2', 'G2'],
    ['G3', 'G3'],
    ['G4', 'G4'],
];
/** Normalize the free-form `stage` string onto a stage id. */
export function normalizeStage(raw) {
    const text = typeof raw === 'string' ? raw.trim() : '';
    if (text === '')
        return { stage: null, closed: false };
    if (text.toLowerCase() === 'closed')
        return { stage: null, closed: true };
    for (const [stage, prefix] of STAGE_PREFIXES) {
        if (text === prefix || text.startsWith(`${prefix}-`))
            return { stage, closed: false };
    }
    return { stage: null, closed: false };
}
/** Trim a scalar to a string; absent, null and blank all collapse to `''`. */
export function text(value) {
    if (value === null || value === undefined)
        return '';
    if (typeof value === 'string')
        return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    return '';
}
/** Treat a value as "filled" only when it carries non-blank content. */
function filled(value) {
    if (Array.isArray(value))
        return value.length > 0;
    return text(value) !== '';
}
/** A numeric gate counter, or `null` when it is absent or not a number. */
function counter(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
/** Rule metadata: number, severity and sort weight. */
const RULE_META = {
    // Rule 1: the G0 floor. Missing any of the three means the project was never
    // framed, so everything downstream is guesswork — the highest severity.
    'G0-why-customer': { no: 1, level: 'high', priority: 90 },
    'G0-why-we': { no: 1, level: 'high', priority: 88 },
    'G0-tech-owner': { no: 1, level: 'high', priority: 86 },
    // Rule 2: focus overflow. A pilot with nine indicators measures nothing.
    'G1-focus-overflow': { no: 2, level: 'medium', priority: 50 },
    // Rule 3: investing before the prerequisites are ready burns the team's time.
    'G2-prereq-invested': { no: 3, level: 'high', priority: 84 },
    // Rule 4/5: "we think it worked" with no artefact, then no customer sign-off.
    'G3-result-no-evidence': { no: 4, level: 'high', priority: 82 },
    'G3-evidence-no-recognition': { no: 5, level: 'high', priority: 80 },
    // Rule 6: an open action nobody has touched for weeks.
    'action-overdue': { no: 6, level: 'medium', priority: 45 },
    // Rule 7: the highest-value gap — it worked, and nothing followed.
    'G4-no-next-milestone': { no: 7, level: 'high', priority: 95 },
    // Rule 8: closed while the four dimensions are not actually closed.
    'closed-not-closed-loop': { no: 8, level: 'high', priority: 70 },
};
/** Build one finding, stamping the rule metadata from {@link RULE_META}. */
function gap(poc, rule, extra = {}) {
    const meta = RULE_META[rule];
    return {
        rule,
        ruleNo: meta.no,
        level: meta.level,
        priority: meta.priority,
        pocId: text(poc.poc_id),
        pocName: text(poc.name),
        ...extra,
    };
}
/** The four dimensions, resolved to presence flags. */
export function readDimensions(poc) {
    const result = poc.result ?? {};
    return {
        achievement: filled(result.achievement),
        evidence: filled(result.evidence),
        recognition: filled(result.recognition),
        nextMilestone: filled(result.next_milestone),
    };
}
/** Count a list field, falling back to the recorded gate counter. */
function countOf(list, recorded) {
    if (Array.isArray(list))
        return list.length;
    return counter(recorded) ?? 0;
}
/**
 * Scan one record and return every gap it has.
 *
 * The returned list is ordered by severity then rule number; the overview page
 * concatenates the per-project lists and re-sorts, so order here only has to be
 * stable for tests.
 */
export function scanGaps(poc, options) {
    const gaps = [];
    const result = poc.result ?? {};
    const dimensions = readDimensions(poc);
    const { stage, closed } = normalizeStage(poc.stage);
    const gates = poc.gates ?? {};
    const g1 = gates.G1 ?? {};
    const g2 = gates.G2 ?? {};
    // Rule 1 — the three G0 prerequisites, reported individually.
    if (!filled(poc.why_customer_test))
        gaps.push(gap(poc, 'G0-why-customer', { field: 'why_customer_test' }));
    if (!filled(poc.why_we_test))
        gaps.push(gap(poc, 'G0-why-we', { field: 'why_we_test' }));
    if (!filled(poc.customer_tech_owner))
        gaps.push(gap(poc, 'G0-tech-owner', { field: 'customer_tech_owner' }));
    // Rule 2 — focus overflow: >3 indicators, >5 scenarios or >3 risks.
    const indicators = countOf(poc.success_criteria, g1.indicators_count);
    const scenarios = countOf(poc.success_scenarios, g1.scenarios_count);
    const risks = countOf(poc.risks, g1.risks_count);
    const overflow = [];
    if (indicators > 3)
        overflow.push(`indicators:${indicators}`);
    if (scenarios > 5)
        overflow.push(`scenarios:${scenarios}`);
    if (risks > 3)
        overflow.push(`risks:${risks}`);
    if (overflow.length > 0) {
        gaps.push(gap(poc, 'G1-focus-overflow', { params: { indicators, scenarios, risks, overflow: overflow.join(',') } }));
    }
    // Rule 3 — engineers committed while the prerequisites are not ready.
    if (g2.prerequisites_ready === false && g2.engineers_invested === true) {
        gaps.push(gap(poc, 'G2-prereq-invested', { field: 'gates.G2.prerequisites_ready' }));
    }
    // Rule 4 — a claimed result with no artefact behind it.
    if (dimensions.achievement && !dimensions.evidence) {
        gaps.push(gap(poc, 'G3-result-no-evidence', { field: 'result.evidence' }));
    }
    // Rule 5 — evidence collected, but the customer never said so in writing.
    if (dimensions.evidence && !dimensions.recognition) {
        gaps.push(gap(poc, 'G3-evidence-no-recognition', { field: 'result.recognition' }));
    }
    // Rule 6 — a next action that has not moved for `staleDays` days.
    // `next_action_goal` is free text with no date field, so the newest timeline
    // round is the only honest activity signal in the schema. A project with a
    // next action but no timeline at all is stale by definition.
    const nextAction = text(poc.next_action_goal);
    if (nextAction !== '') {
        const last = lastActivity(poc);
        const reference = last === null ? null : Date.parse(`${last}T00:00:00Z`);
        const days = reference === null ? null : Math.floor((options.now.getTime() - reference) / 86_400_000);
        if (days === null || days > options.staleDays) {
            gaps.push(gap(poc, 'action-overdue', {
                field: 'next_action_goal',
                params: { days: days === null ? -1 : days, staleDays: options.staleDays },
            }));
        }
    }
    // Rule 7 — it worked, and no next milestone exists: value created, none banked.
    if (dimensions.achievement && !dimensions.nextMilestone) {
        gaps.push(gap(poc, 'G4-no-next-milestone', { field: 'result.next_milestone' }));
    }
    // Rule 8 — closed while any of the four dimensions is still empty.
    if (closed) {
        const missing = ['achievement', 'evidence', 'recognition', 'nextMilestone'].filter((key) => !dimensions[key]);
        if (missing.length > 0) {
            gaps.push(gap(poc, 'closed-not-closed-loop', { field: 'stage', params: { missing: missing.join(',') } }));
        }
    }
    // `stage` is read for rule 8 only; reference it so an unknown stage value is
    // not silently indistinguishable from "no stage" in future rules.
    void stage;
    return gaps.sort((left, right) => right.priority - left.priority || left.ruleNo - right.ruleNo || left.rule.localeCompare(right.rule));
}
/**
 * The newest timeline date, or `null` when the timeline is absent or empty.
 *
 * Only `YYYY-MM-DD` values are considered: a hand-edited ledger can contain
 * anything, and comparing unparsable text lexicographically would let "bad"
 * sort after every real date. A date that cannot be parsed is ignored, which
 * makes it exactly as stale as no date at all.
 */
export function lastActivity(poc) {
    const timeline = Array.isArray(poc.timeline) ? poc.timeline : [];
    let newest = null;
    for (const entry of timeline) {
        const date = text(entry?.date);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
            continue;
        if (Number.isNaN(Date.parse(`${date}T00:00:00Z`)))
            continue;
        if (newest === null || date > newest)
            newest = date;
    }
    return newest;
}
/** Whole days between a `YYYY-MM-DD` date and the scan clock. */
export function daysSince(date, now) {
    if (date === null)
        return null;
    const stamp = Date.parse(`${date}T00:00:00Z`);
    if (Number.isNaN(stamp))
        return null;
    return Math.floor((now.getTime() - stamp) / 86_400_000);
}
