/**
 * The v3 collection form: a self-contained HTML file a colleague can fill in.
 *
 * ## What changed from the v1 form
 *
 * The v1 generator modelled `why_customer_test` / `success_criteria` /
 * `result` / `timeline` — all removed by v3. Shipping it would have handed
 * colleagues a file the ledger can no longer read, so it was held back while
 * this replacement was written, and then deleted.
 *
 * v3 is **progress-centred**: `gate0` says whether the project is worth doing,
 * `plan` says how to win, and `progress[]` is the append-only history. The form
 * therefore asks for exactly those three, and nothing else:
 *
 * 1. **G0** — the five prerequisites (four here; `tech_owner` is identity, which
 *    the blank form asks for too), each with a "why this matters" hint.
 * 2. **Plan** — pain, expected recognition, 2–3 criteria, 3–5 scenarios, ≤3
 *    risks, edge. The counts are validated live because the gap rules enforce
 *    them and a colleague cannot know that.
 * 3. **Progress** — one new entry, appended. The form never rewrites history.
 *
 * ## What is kept from v1 because it was hard-won
 *
 * - **One file, no server, no CDN.** Everything inlined, works offline.
 * - **Autosave keyed by the project set**, not by a timestamp: regenerating the
 *   form for the same projects must find the same draft.
 * - **Real YAML out**, via `yaml`'s own stringifier, so `name: 某某：试点` stays
 *   valid.
 * - **One file per project** on download, so two colleagues never clobber a
 *   shared file.
 *
 * ## What it deliberately does NOT do
 *
 * It does not write to the ledger. The output is a `.yaml` the owner reviews and
 * commits; submission stays a human-merged PR, which is the ledger's design.
 */
import YAML from 'yaml';
/** The four G0 prerequisites that live under `gate0` (the fifth is identity). */
export const G0_FIELDS = Object.freeze([
    'why_customer',
    'why_us',
    'decision_chain',
    'post_poc_decision',
]);
/** The stage ids, local to keep the browser payload free of the frozen tuple. */
const STAGE_IDS = ['G0', 'G1', 'G2', 'G3', 'G4'];
/**
 * Which sections each stage is about.
 *
 * Derived from the ledger's own structure rather than invented: `schemas/poc-schema.md`
 * groups fields into ①identity ②gate0 ③plan ④progress ⑤outcome, each gate's
 * verdict lives in its group, and the 16 gap rules judge by the same grouping
 * (R1–R3 gate0, R4–R6 plan, R8–R10 progress, R11 outcome). So "G1 fills the plan"
 * is the data model, not a convention this form invented.
 */
const SECTIONS_FOR_STAGE = {
    G0: ['identity', 'gate0'],
    G1: ['plan', 'gate12'],
    G2: ['plan', 'gate12', 'progress'],
    G3: ['progress'],
    G4: ['progress', 'outcome'],
};
/**
 * The sections one intent may EDIT.
 *
 * `new` asks only for what a project needs to exist: identity plus the five G0
 * prerequisites. It deliberately does not ask for a plan — gap rule R3 only
 * demands a plan *after* G0 passes, so asking earlier pushes people to write a
 * plan before they have thought one through, which R4/R5 then reject.
 *
 * `progress` edits nothing but the appended round: it is the highest-frequency
 * form and must fit one screen.
 */
const EDITABLE_FOR_INTENT = {
    new: ['identity', 'gate0'],
    supplement: ['identity', 'gate0', 'plan', 'gate12', 'progress', 'outcome'],
    progress: ['progress'],
};
/**
 * Resolve what a form should ask, given the intent and the project's stage.
 *
 * Returns the editable sections (the subject) and the context sections (shown
 * read-only so the colleague knows what they are adding to). An unknown stage
 * falls back to G0's set: a project whose stage is unrecognised is, for form
 * purposes, still being set up.
 */
export function resolveSections(intent, stage) {
    const key = (STAGE_IDS.find((id) => stage === id || stage.startsWith(`${id}-`)) ?? 'G0');
    const stageSections = SECTIONS_FOR_STAGE[key];
    const allowed = EDITABLE_FOR_INTENT[intent];
    if (intent === 'new' || intent === 'progress') {
        const editable = allowed.filter((section) => section === 'identity' || section === 'gate0' || section === 'progress');
        return { editable: [...editable], context: [] };
    }
    // `supplement` edits the current stage's subject, and shows only what came
    // BEFORE it as read-only context — never a later stage, which has not
    // happened yet. Showing a G4 project's empty conclusion block to someone
    // filling in G1 invites them to invent a conclusion.
    const editable = stageSections.filter((section) => allowed.includes(section));
    const order = ['identity', 'gate0', 'plan', 'gate12', 'progress', 'outcome'];
    const currentIndex = stageSections.length === 0 ? -1 : Math.max(...stageSections.map((section) => order.indexOf(section)));
    const context = order.filter((section) => {
        if (section === 'progress')
            return false;
        if (editable.includes(section))
            return false;
        // Only sections that precede the current stage's subject.
        return order.indexOf(section) < currentIndex;
    });
    return { editable: [...editable], context };
}
/** Coerce a stored value to the string the form edits. */
function text(value) {
    if (value === null || value === undefined)
        return '';
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    return '';
}
/** A `YYYY-MM-DD` date, or `''`. */
function dateText(value) {
    const raw = text(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}
/**
 * Convert one ledger record into the form's project shape.
 *
 * Every field becomes a string or a list of strings. A missing block becomes an
 * empty one rather than `undefined`, so the generated script never has to guard.
 */
export function projectForForm(record) {
    const gate0 = record.gate0 ?? {};
    const plan = record.plan ?? {};
    const outcome = record.outcome ?? {};
    const progress = Array.isArray(record.progress) ? record.progress : [];
    const org = record.org ?? {};
    const review = gate0.review ?? {};
    return {
        pocId: text(record.poc_id),
        name: text(record.name),
        system: text(org.system),
        company: text(org.company),
        department: text(org.department),
        amountWan: numberText(record.amount_wan),
        pocType: text(record.poc_type),
        owner: text(record.owner),
        sales: text(record.sales),
        techOwner: text(record.tech_owner),
        execSponsor: text(record.exec_sponsor),
        stage: text(record.stage),
        status: text(record.status),
        stageSince: dateText(record.stage_since),
        gate0: {
            why_customer: text(gate0.why_customer),
            why_us: text(gate0.why_us),
            decision_chain: text(gate0.decision_chain),
            post_poc_decision: text(gate0.post_poc_decision),
            competitor: text(gate0.competitor),
            conclusion: text(review.conclusion),
            reviewer: text(review.reviewer),
            reviewed_at: dateText(review.reviewed_at),
        },
        plan: {
            customer_pain: text(plan.customer_pain),
            expected_recognition: text(plan.expected_recognition),
            our_edge: text(plan.our_edge),
            criteria: (Array.isArray(plan.criteria) ? plan.criteria : []).map((item, index) => ({
                // A criterion without an id in the ledger is given one on the way out so
                // the form can reference it; the Host is what writes it back.
                id: text(item?.id) === '' ? `cri-${String(index + 1).padStart(2, '0')}` : text(item?.id),
                name: text(item?.name),
                metric: text(item?.metric),
                baseline: text(item?.baseline),
                target: text(item?.target),
            })),
            // v3.1: objects with a stable id, not bare strings.
            scenarios: (Array.isArray(plan.scenarios) ? plan.scenarios : [])
                .filter((item) => item !== null && item !== undefined)
                .map((item, index) => ({
                id: text(item?.id) === '' ? `scn-${String(index + 1).padStart(2, '0')}` : text(item?.id),
                name: text(item?.name),
                goal: text(item?.goal),
            })),
            risks: (Array.isArray(plan.risks) ? plan.risks : []).map((item) => ({
                name: text(item?.name),
                level: text(item?.level).toLowerCase(),
                mitigation: text(item?.mitigation),
            })),
            timeline_start: dateText(plan.timeline?.start),
            timeline_end: dateText(plan.timeline?.end),
            gate1_conclusion: text(plan.gate1?.conclusion),
            gate2_ready: text(plan.gate2?.ready),
        },
        progress: blankProgress(progress.length),
        existingProgressCount: progress.length,
        history: progressHistory(progress),
        // G4 only. Read here so a G4 form opens with the current conclusion in
        // place rather than blank, which would invite overwriting it by omission.
        outcome: {
            achievement: text(outcome.achievement),
            customer_recognition: text(outcome.customer_recognition),
            our_proof: text(outcome.our_proof),
            proved: text((outcome.conclusion ?? {}).proved),
            recognized: text((outcome.conclusion ?? {}).recognized),
            next_business: text((outcome.conclusion ?? {}).next_business),
            milestone: text((outcome.business ?? {}).milestone),
            businessOwner: text((outcome.business ?? {}).owner),
            businessDeadline: dateText((outcome.business ?? {}).deadline),
            businessStatus: text((outcome.business ?? {}).status),
            overall: text(outcome.overall),
        },
    };
}
/** A numeric field as the form's string, keeping `0` distinct from blank. */
function numberText(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return String(value);
    const raw = text(value);
    return raw === '' ? '' : raw;
}
/** How many recorded rounds the form lists read-only. */
export const HISTORY_LIMIT = 5;
/**
 * Flatten the recorded rounds for the read-only history block.
 *
 * Newest first, because the round a colleague is about to continue is the newest
 * one: reading it first is what makes "这次什么变了" answerable. The order is
 * reversed rather than re-sorted by date because the ledger's own array order is
 * the append order, and a hand-edited `date` must not reshuffle history.
 */
export function progressHistory(progress) {
    const entries = [];
    for (let index = progress.length - 1; index >= 0 && entries.length < HISTORY_LIMIT; index -= 1) {
        const entry = progress[index];
        if (entry === null || entry === undefined)
            continue;
        const customer = entry.customer ?? {};
        const next = entry.next ?? {};
        entries.push({
            seq: typeof entry.seq === 'number' ? entry.seq : null,
            date: dateText(entry.date),
            type: text(entry.type),
            change: text(entry.change),
            actual: text(entry.actual),
            completion: text(entry.completion),
            evidence: (Array.isArray(entry.evidence) ? entry.evidence : [])
                .map((item) => text(item?.title).trim())
                .filter((title) => title !== ''),
            syncedWith: text(customer.synced_with),
            recognition: text(customer.recognition),
            nextGoal: text(next.goal),
            nextOwner: text(next.owner),
            nextDeadline: dateText(next.deadline),
        });
    }
    return entries;
}
/** One empty progress entry, with `seq` continuing the existing count. */
export function blankProgress(existingCount) {
    return {
        seq: existingCount + 1,
        date: '',
        type: '',
        change: '',
        goal: '',
        scenarioIds: [],
        criteriaIds: [],
        actual: '',
        completion: '',
        evidence: [],
        customer: { synced_with: '', feedback: '', recognition: '' },
        gate3_1: '',
        gate3_2: '',
        next: { goal: '', owner: '', deadline: '' },
    };
}
/** The blank project a `blank`-mode form edits. */
export function blankProject() {
    return {
        pocId: '',
        name: '',
        system: '',
        company: '',
        department: '',
        amountWan: '',
        pocType: '',
        owner: '',
        sales: '',
        techOwner: '',
        execSponsor: '',
        stage: 'G0-立项',
        status: '进行中',
        stageSince: '',
        gate0: {
            why_customer: '',
            why_us: '',
            decision_chain: '',
            post_poc_decision: '',
            competitor: '',
            conclusion: '',
            reviewer: '',
            reviewed_at: '',
        },
        plan: {
            customer_pain: '',
            expected_recognition: '',
            our_edge: '',
            criteria: [],
            scenarios: [],
            risks: [],
            timeline_start: '',
            timeline_end: '',
            gate1_conclusion: '',
            gate2_ready: '',
        },
        progress: blankProgress(0),
        existingProgressCount: 0,
        history: [],
        outcome: {
            achievement: '',
            customer_recognition: '',
            our_proof: '',
            proved: '',
            recognized: '',
            next_business: '',
            milestone: '',
            businessOwner: '',
            businessDeadline: '',
            businessStatus: '',
            overall: '',
        },
    };
}
/**
 * Build the stable draft key.
 *
 * Sorting the ids makes the key independent of selection order, so the same set
 * of projects always resumes the same draft — even if the user regenerates the
 * form later. A blank form gets a constant key so its draft survives too.
 */
export function draftKeyFor(mode, pocIds) {
    if (mode === 'blank')
        return 'poc-v3-form-draft-blank';
    return `poc-v3-form-draft-${[...pocIds].sort().join('+')}`;
}
/** Drop empty strings from a list, so a stored YAML has no blank rows. */
function compact(values) {
    return values.map((value) => value.trim()).filter((value) => value !== '');
}
/**
 * Serialize one project back to the v3 YAML shape.
 *
 * `yaml`'s own stringifier rather than concatenation: a value containing `: `,
 * `#`, quotes or a newline must be quoted correctly, which hand-built strings
 * get wrong (`name: 某某：试点` produced invalid YAML in the reference tool).
 *
 * Empty plan/progress blocks are emitted as empty collections, not omitted: the
 * ledger's parser tolerates absence, but a colleague reopening the file should
 * see the shape they are expected to fill.
 *
 * **This is not the download format.** The form ships a change set (see
 * {@link projectToChangeSet}); a complete file would have to carry the ledger's
 * derived fields (`gate0.missing`, `priority`, scenario status), and those are
 * owned by `tools/derive.mjs` — writing them here would either be wrong or be
 * overwritten by CI. `projectToYaml` remains for tests and for a full-file
 * preview.
 */
export function projectToYaml(project) {
    const document = {
        poc_id: project.pocId,
        name: project.name,
        org: {
            system: project.system === '' ? null : project.system,
            company: project.company === '' ? null : project.company,
            department: project.department === '' ? null : project.department,
        },
        amount_wan: project.amountWan === '' ? null : Number(project.amountWan),
        poc_type: project.pocType === '' ? null : project.pocType,
        owner: project.owner === '' ? null : project.owner,
        sales: project.sales === '' ? null : project.sales,
        tech_owner: project.techOwner === '' ? null : project.techOwner,
        exec_sponsor: project.execSponsor === '' ? null : project.execSponsor,
        stage: project.stage,
        status: project.status,
        stage_since: project.stageSince === '' ? null : project.stageSince,
        gate0: {
            why_customer: project.gate0.why_customer === '' ? null : project.gate0.why_customer,
            why_us: project.gate0.why_us === '' ? null : project.gate0.why_us,
            decision_chain: project.gate0.decision_chain === '' ? null : project.gate0.decision_chain,
            post_poc_decision: project.gate0.post_poc_decision === '' ? null : project.gate0.post_poc_decision,
            competitor: project.gate0.competitor === '' ? null : project.gate0.competitor,
            review: {
                conclusion: project.gate0.conclusion === '' ? null : project.gate0.conclusion,
                reviewer: project.gate0.reviewer === '' ? null : project.gate0.reviewer,
                reviewed_at: project.gate0.reviewed_at === '' ? null : project.gate0.reviewed_at,
            },
        },
        plan: {
            customer_pain: project.plan.customer_pain === '' ? null : project.plan.customer_pain,
            expected_recognition: project.plan.expected_recognition === '' ? null : project.plan.expected_recognition,
            criteria: project.plan.criteria
                .filter((criterion) => (criterion.name ?? '').trim() !== '')
                .map((criterion) => ({
                // Never renumber: a returned criterion keeps the id evidence cites.
                id: (criterion.id ?? '').trim() === '' ? null : (criterion.id ?? '').trim(),
                name: criterion.name.trim(),
                metric: (criterion.metric ?? '').trim() === '' ? null : criterion.metric.trim(),
                baseline: (criterion.baseline ?? '').trim() === '' ? null : criterion.baseline.trim(),
                target: (criterion.target ?? '').trim() === '' ? null : criterion.target.trim(),
            })),
            scenarios: project.plan.scenarios
                .filter((scenario) => (scenario.name ?? '').trim() !== '')
                .map((scenario) => ({
                id: (scenario.id ?? '').trim() === '' ? null : (scenario.id ?? '').trim(),
                name: scenario.name.trim(),
                goal: (scenario.goal ?? '').trim() === '' ? null : scenario.goal.trim(),
            })),
            our_edge: project.plan.our_edge === '' ? null : project.plan.our_edge,
            timeline: {
                start: project.plan.timeline_start === '' ? null : project.plan.timeline_start,
                end: project.plan.timeline_end === '' ? null : project.plan.timeline_end,
            },
            risks: project.plan.risks
                .filter((risk) => risk.name.trim() !== '')
                .map((risk) => ({
                name: risk.name.trim(),
                level: risk.level === '' ? null : risk.level,
                mitigation: risk.mitigation.trim() === '' ? null : risk.mitigation.trim(),
            })),
            gate1: { conclusion: project.plan.gate1_conclusion === '' ? null : project.plan.gate1_conclusion },
            gate2: { ready: project.plan.gate2_ready === '' ? null : project.plan.gate2_ready },
        },
        progress: progressIsEmpty(project.progress) ? [] : [serializeProgress(project.progress)],
        outcome: {
            achievement: null,
            customer_recognition: null,
            our_proof: null,
            remaining_risks: null,
            conclusion: { proved: null, recognized: null, next_business: null },
            business: { milestone: null, owner: null, deadline: null, status: null },
            overall: null,
            reviewed_at: null,
        },
    };
    return YAML.stringify(document, { lineWidth: 0 });
}
/** `''` becomes `null`: the ledger's "absent" is null, never the string "". */
function orNull(value) {
    return value === '' ? null : value;
}
/**
 * Which blocks of a change set a given intent may carry.
 *
 * ## Why this is a correctness rule, not tidiness
 *
 * The form pre-fills every field from the ledger, so a change set built from the
 * whole project always carries values the colleague never looked at. Under
 * `poc-submit`'s "skip null, apply the rest" merge, those pre-filled values are
 * written back. That turns a read-only snapshot into an overwrite: if the ledger
 * changed while the form sat in someone's WeChat, submitting it silently reverts
 * the field to the day the form was generated.
 *
 * So the rule is: **emit only the blocks the person could actually edit.** A
 * `progress` form sends its round and nothing else, and cannot clobber a plan it
 * never displayed.
 *
 * `stage` and `status` are the exception: they are always emitted because they are
 * the ledger's own routing keys, and a brand-new project has no file to inherit
 * them from.
 */
const CHANGE_SCOPE = {
    new: ['identity', 'gate0'],
    // `supplement` resolves per project against its stage, so the union is allowed
    // here and narrowed by `resolveSections` at emit time.
    supplement: ['identity', 'gate0', 'plan', 'gate12', 'progress', 'outcome'],
    progress: ['progress'],
};
/**
 * Build one project's change set from the form state.
 *
 * Blocks outside the intent's scope are emitted as `null` (or an empty list), which
 * `poc-submit` treats as "not changed" and skips. A blank field inside a block that
 * IS in scope means the same thing: the colleague did not touch it.
 *
 * @param project the form's own view of the project
 * @param intent what the colleague was asked to do; defaults to `supplement`, the
 *        widest scope, so an older caller keeps its previous behaviour
 * @param baseline the project's values when the form was generated. When given,
 *        a field equal to its seed is emitted as `null` — "I did not touch this".
 */
export function projectToChangeSet(project, intent = 'supplement', baseline) {
    // A supplement form is narrowed to the project's own stage, exactly as the page
    // was: asking for a G1 plan change must not also re-emit a G0 block the page
    // rendered read-only.
    const scope = intent === 'supplement'
        ? new Set(resolveSections(intent, project.stage).editable)
        : new Set(CHANGE_SCOPE[intent]);
    const inScope = (section) => scope.has(section);
    /**
     * A field's value, or `null` when it is still what the form was seeded with.
     *
     * ## Why this is the difference between working and silently losing data
     *
     * The page pre-fills every field from the ledger, and `poc-submit` merges with
     * "skip null, apply the rest". Without this comparison, a colleague who changed
     * ONE Gate 0 field re-sent the other four exactly as they were at export time —
     * so anything another person changed while the form sat in WeChat was reverted.
     * That is a data-loss bug wearing the costume of a normal merge.
     *
     * With it, the change set means what its name says: only the fields this person
     * actually edited.
     */
    const seed = (path) => {
        if (baseline === undefined)
            return '';
        const raw = path(baseline);
        return raw === undefined || raw === null ? '' : String(raw);
    };
    const changed = (section, value, seeded) => {
        if (!inScope(section))
            return null;
        const trimmed = value.trim();
        if (trimmed === '')
            return null;
        return trimmed === seeded.trim() ? null : trimmed;
    };
    const changedList = (section, value, seeded) => {
        if (!inScope(section))
            return null;
        if (value.length === 0)
            return null;
        if (baseline !== undefined && JSON.stringify(value) === JSON.stringify(seeded))
            return null;
        return [...value];
    };
    const blank = {
        schema_version: FORM_SCHEMA_VERSION,
        poc_id: project.pocId.trim(),
        name: '',
        org: { system: null, company: null, department: null },
        amount_wan: null,
        poc_type: null,
        owner: null,
        sales: null,
        tech_owner: null,
        exec_sponsor: null,
        // Always emitted: the ledger routes on these, and a new project has no file to
        // inherit them from.
        stage: project.stage,
        status: project.status,
        stage_since: null,
        gate0: {
            why_customer: null, why_us: null, decision_chain: null,
            post_poc_decision: null, competitor: null,
            review: { conclusion: null, reviewer: null, reviewed_at: null },
        },
        plan: {
            customer_pain: null, expected_recognition: null, our_edge: null,
            criteria: [], scenarios: [], risks: [],
            timeline: { start: null, end: null },
            gate1: { conclusion: null }, gate2: { ready: null },
        },
        outcome: {
            achievement: null, customer_recognition: null, our_proof: null, remaining_risks: null,
            conclusion: { proved: null, recognized: null, next_business: null },
            business: { milestone: null, owner: null, deadline: null, status: null },
            overall: null,
        },
        progress: [],
    };
    // Identity. `pocId` is the ledger's primary key and is never a change; it is
    // always carried so the merge knows which project this is.
    blank.name = changed('identity', project.name, seed((b) => b.name)) ?? '';
    blank.org = {
        system: changed('identity', project.system, seed((b) => b.system)),
        company: changed('identity', project.company, seed((b) => b.company)),
        department: changed('identity', project.department, seed((b) => b.department)),
    };
    const amount = project.amountWan.trim();
    blank.amount_wan = inScope('identity') && amount !== '' && amount !== seed((b) => b.amountWan)
        ? Number(amount)
        : null;
    blank.poc_type = changed('identity', project.pocType, seed((b) => b.pocType));
    blank.owner = changed('identity', project.owner, seed((b) => b.owner));
    blank.sales = changed('identity', project.sales, seed((b) => b.sales));
    blank.tech_owner = changed('identity', project.techOwner, seed((b) => b.techOwner));
    blank.exec_sponsor = changed('identity', project.execSponsor, seed((b) => b.execSponsor));
    blank.stage_since = changed('identity', project.stageSince, seed((b) => b.stageSince));
    // Gate 0.
    blank.gate0 = {
        why_customer: changed('gate0', project.gate0.why_customer, seed((b) => b.gate0.why_customer)),
        why_us: changed('gate0', project.gate0.why_us, seed((b) => b.gate0.why_us)),
        decision_chain: changed('gate0', project.gate0.decision_chain, seed((b) => b.gate0.decision_chain)),
        post_poc_decision: changed('gate0', project.gate0.post_poc_decision, seed((b) => b.gate0.post_poc_decision)),
        competitor: changed('gate0', project.gate0.competitor, seed((b) => b.gate0.competitor)),
        review: {
            conclusion: changed('gate0', project.gate0.conclusion, seed((b) => b.gate0.conclusion)),
            reviewer: changed('gate0', project.gate0.reviewer, seed((b) => b.gate0.reviewer)),
            reviewed_at: changed('gate0', project.gate0.reviewed_at, seed((b) => b.gate0.reviewed_at)),
        },
    };
    // Plan. Lists are compared as a whole: a list that matches its seed exactly is
    // "untouched", and any edit re-sends the whole list because the merge replaces it.
    const criteria = project.plan.criteria
        .filter((item) => (item.name ?? '').trim() !== '')
        .map((item) => ({
        id: orNull((item.id ?? '').trim()),
        name: item.name.trim(),
        metric: orNull((item.metric ?? '').trim()),
        baseline: orNull((item.baseline ?? '').trim()),
        target: orNull((item.target ?? '').trim()),
    }));
    const scenarios = project.plan.scenarios
        .filter((item) => (item.name ?? '').trim() !== '')
        .map((item) => ({
        id: orNull((item.id ?? '').trim()),
        name: item.name.trim(),
        goal: orNull((item.goal ?? '').trim()),
    }));
    const risks = project.plan.risks
        .filter((item) => item.name.trim() !== '')
        .map((item) => ({
        name: item.name.trim(),
        level: orNull(item.level.trim()),
        mitigation: orNull(item.mitigation.trim()),
    }));
    // The seed lists are normalized through the SAME mapping as the emitted ones.
    // Comparing raw form rows against normalized output made every list look
    // changed ('' vs null), so an untouched plan was re-sent and could overwrite a
    // concurrent edit — the exact failure this diff exists to prevent.
    const seedCriteria = (baseline?.plan.criteria ?? [])
        .filter((item) => (item.name ?? '').trim() !== '')
        .map((item) => ({
        id: orNull((item.id ?? '').trim()),
        name: item.name.trim(),
        metric: orNull((item.metric ?? '').trim()),
        baseline: orNull((item.baseline ?? '').trim()),
        target: orNull((item.target ?? '').trim()),
    }));
    const seedScenarios = (baseline?.plan.scenarios ?? [])
        .filter((item) => (item.name ?? '').trim() !== '')
        .map((item) => ({
        id: orNull((item.id ?? '').trim()),
        name: item.name.trim(),
        goal: orNull((item.goal ?? '').trim()),
    }));
    const seedRisks = (baseline?.plan.risks ?? [])
        .filter((item) => item.name.trim() !== '')
        .map((item) => ({
        name: item.name.trim(),
        level: orNull(item.level.trim()),
        mitigation: orNull(item.mitigation.trim()),
    }));
    blank.plan = {
        customer_pain: changed('plan', project.plan.customer_pain, seed((b) => b.plan.customer_pain)),
        expected_recognition: changed('plan', project.plan.expected_recognition, seed((b) => b.plan.expected_recognition)),
        our_edge: changed('plan', project.plan.our_edge, seed((b) => b.plan.our_edge)),
        criteria: changedList('plan', criteria, seedCriteria) ?? [],
        scenarios: changedList('plan', scenarios, seedScenarios) ?? [],
        risks: changedList('plan', risks, seedRisks) ?? [],
        timeline: {
            start: changed('plan', project.plan.timeline_start, seed((b) => b.plan.timeline_start)),
            end: changed('plan', project.plan.timeline_end, seed((b) => b.plan.timeline_end)),
        },
        gate1: { conclusion: changed('gate12', project.plan.gate1_conclusion, seed((b) => b.plan.gate1_conclusion)) },
        gate2: { ready: changed('gate12', project.plan.gate2_ready, seed((b) => b.plan.gate2_ready)) },
    };
    // Outcome: the G4 block.
    blank.outcome = {
        achievement: changed('outcome', project.outcome.achievement, seed((b) => b.outcome.achievement)),
        customer_recognition: changed('outcome', project.outcome.customer_recognition, seed((b) => b.outcome.customer_recognition)),
        our_proof: changed('outcome', project.outcome.our_proof, seed((b) => b.outcome.our_proof)),
        remaining_risks: null,
        conclusion: {
            proved: changed('outcome', project.outcome.proved, seed((b) => b.outcome.proved)),
            recognized: changed('outcome', project.outcome.recognized, seed((b) => b.outcome.recognized)),
            next_business: changed('outcome', project.outcome.next_business, seed((b) => b.outcome.next_business)),
        },
        business: {
            milestone: changed('outcome', project.outcome.milestone, seed((b) => b.outcome.milestone)),
            owner: changed('outcome', project.outcome.businessOwner, seed((b) => b.outcome.businessOwner)),
            deadline: changed('outcome', project.outcome.businessDeadline, seed((b) => b.outcome.businessDeadline)),
            status: changed('outcome', project.outcome.businessStatus, seed((b) => b.outcome.businessStatus)),
        },
        overall: changed('outcome', project.outcome.overall, seed((b) => b.outcome.overall)),
    };
    // Append-only: this is the list of NEW rounds, never the existing history.
    blank.progress = inScope('progress') && !progressIsEmpty(project.progress)
        ? [serializeProgress(project.progress)]
        : [];
    return blank;
}
/** Build the document a colleague sends back. */
export function buildChangeDocument(options) {
    return {
        schemaVersion: FORM_SCHEMA_VERSION,
        generatedAt: (options.now ?? new Date()).toISOString(),
        generatedBy: 'POC 信息收集表单 v3.1',
        intent: options.intent,
        changes: options.projects.map((project, index) => projectToChangeSet(project, options.intent, options.baseline?.[index])),
    };
}
/** `true` when the form's progress entry carries no user content. */
function progressIsEmpty(entry) {
    return (entry.date === '' &&
        entry.type === '' &&
        entry.goal === '' &&
        entry.actual === '' &&
        compact(entry.scenarioIds).length === 0 &&
        compact(entry.criteriaIds).length === 0 &&
        entry.evidence.every((item) => item.title.trim() === ''));
}
/** One progress entry in the ledger's own shape. */
function serializeProgress(entry) {
    return {
        seq: entry.seq,
        date: entry.date,
        type: entry.type === '' ? null : entry.type,
        // `change` is mandatory in v3.1: a round that does not say what moved is the
        // single most common way a timeline decays into "communicated with customer".
        change: entry.change === '' ? null : entry.change,
        goal: entry.goal === '' ? null : entry.goal,
        scenario_ids: compact(entry.scenarioIds),
        criteria_ids: compact(entry.criteriaIds),
        actual: entry.actual === '' ? null : entry.actual,
        completion: entry.completion === '' ? null : entry.completion,
        evidence: entry.evidence
            .filter((item) => item.title.trim() !== '')
            .map((item) => ({
            title: item.title.trim(),
            link: item.link.trim() === '' ? null : item.link.trim(),
            type: item.type === '' ? null : item.type,
        })),
        customer: {
            synced_with: entry.customer.synced_with === '' ? null : entry.customer.synced_with,
            feedback: entry.customer.feedback === '' ? null : entry.customer.feedback,
            recognition: entry.customer.recognition === '' ? null : entry.customer.recognition,
        },
        gate3_1: entry.gate3_1 === '' ? null : entry.gate3_1,
        gate3_2: entry.gate3_2 === '' ? null : entry.gate3_2,
        next: {
            goal: entry.next.goal === '' ? null : entry.next.goal,
            owner: entry.next.owner === '' ? null : entry.next.owner,
            deadline: entry.next.deadline === '' ? null : entry.next.deadline,
        },
    };
}
/** Escape a value for embedding inside a `<script>` block. */
function scriptSafe(json) {
    return json
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}
/** Escape text for HTML content. */
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
/** The enums, mirrored from `schemas/enums.yaml`. */
const ENUMS = {
    pocType: ['SDL', 'ACG', 'AI安全', '保护AI', '虚拟化', '大体量项目'],
    stage: ['G0-立项', 'G1-方案设计', 'G2-方案验证', 'G3-结果验证', 'G4-结果转化', 'closed'],
    status: ['未开始', '进行中', '暂停', '已关闭', '已取消'],
    g0Conclusion: ['通过', '未通过-退出', '未通过-降级', '待评审'],
    g1Conclusion: ['通过', '补充后进入', '未通过'],
    g2Ready: ['Ready', '有风险', '未Ready'],
    recognition: ['认可', '部分认可', '未认可', '待确认'],
    progressType: ['内部Review', '客户阶段同步', 'Checkpoint'],
    // v3.1: mandatory on every progress entry. "无实质进展" is an allowed value:
    // saying "nothing moved" beats writing a sentence that hides it.
    progressChange: ['阶段推进', '场景新增', '目标调整', '证据补充', '风险出现', '风险解除', '无实质进展'],
    completion: ['0%', '25%', '50%', '75%', '100%'],
    riskLevel: ['high', 'medium', 'low'],
    gate3_1: ['可证明', '待补证据'],
    gate3_2: ['已确认', '待确认'],
    evidenceType: ['文档', '截图', '数据', '邮件', '链接'],
    system: ['人保体系', '国寿体系'],
    // G4 only: the outcome block is the one thing no earlier stage asks for.
    achievement: ['达成', '部分达成', '未达成'],
    businessStatus: ['已进入下一里程碑', '待推进', '补救中', '无后续动作'],
};
/**
 * The schema generation this form emits.
 *
 * Stamped into every generated page so a returned form can be checked against
 * the schema that will read it. There is deliberately **no older-shape
 * fallback**: the ledger declares one shape version and its validator rejects
 * anything else outright (`E-VERSION`). A tolerant reader here would only move
 * that failure later — to a point where the colleague already believes their
 * work was recorded.
 */
export const FORM_SCHEMA_VERSION = '3.1';
/**
 * The stamp a pre-v3.1 form carries.
 *
 * A named constant only so the refusal message can name it. This is not a
 * supported shape: nothing parses it, nothing converts it, and importing one is
 * refused rather than half-applied.
 */
export const LEGACY_FORM_SCHEMA_VERSION = '3.0';
/** The G0 prompts: the label and the reason each field exists. */
const G0_PROMPTS = [
    { key: 'why_customer', label: '客户为什么要测', hint: '客户自己的痛点与压力，不是我们的卖点。' },
    { key: 'why_us', label: '我们为什么测', hint: '对我们的价值：突破点、可复制的样板、后续生意。' },
    { key: 'decision_chain', label: '项目流程 / 决策链', hint: '谁提需求、谁评审、谁签字、按什么流程走。' },
    { key: 'post_poc_decision', label: '测完之后客户会做什么决定', hint: '采购、扩容、试点转正，还是就此结束。' },
];
/**
 * Generate the complete HTML form.
 *
 * The returned string is the whole document: no external stylesheet, script,
 * font or image reference.
 */
export function buildFormHtml(options) {
    const now = options.now ?? new Date();
    const projects = options.mode === 'blank' ? [blankProject()] : options.projects;
    const intent = options.intent ?? (options.mode === 'blank' ? 'new' : 'supplement');
    const payload = {
        mode: options.mode,
        intent,
        schemaVersion: FORM_SCHEMA_VERSION,
        generatedAt: now.toISOString(),
        today: now.toISOString().slice(0, 10),
        projects,
        // The values as generated, index-aligned with `projects`. The page diffs
        // against these so it only sends what the colleague actually changed — see
        // projectToChangeSet. Without it, an untouched pre-filled field would be sent
        // back and would revert any edit made while the form sat in WeChat.
        baseline: projects.map((project) => JSON.parse(JSON.stringify(project))),
        // Each project's stage decides which sections are the subject, so the
        // resolution is per project rather than per document.
        sections: projects.map((project) => resolveSections(intent, project.stage)),
        draftKey: draftKeyFor(options.mode, projects.map((project) => project.pocId).filter((id) => id !== '')),
        enums: ENUMS,
        g0Fields: G0_PROMPTS,
        returnCss: RETURN_CSS,
    };
    const data = scriptSafe(JSON.stringify(payload));
    const title = intent === 'new'
        ? 'POC 新建项目表单 v3'
        : intent === 'progress'
            ? `POC 进展记录表单 v3（${projects.length} 个项目）`
            : `POC 信息补充表单 v3（${projects.length} 个项目）`;
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${FORM_CSS}</style>
</head>
<body>
<div class="shell">
  <div class="notice" id="restoreNotice" hidden>已恢复上次未提交的草稿。</div>
  <div class="notice notice-warn" id="draftNotice" hidden></div>
  <!-- The banner is rendered by the script from DATA, so it carries the project's
       real identity instead of a static page title that says nothing. -->
  <main id="formBody"></main>
  <footer class="footer">
    <div class="footer-info" id="footerInfo">正在初始化…</div>
    <div class="footer-actions">
      <button type="button" class="btn" id="previewBtn">预览变更集</button>
      <button type="button" class="btn" id="downloadBtn">下载变更集 (.json)</button>
      <button type="button" class="btn btn-primary" id="returnBtn">生成回传文件 (.html)</button>
    </div>
  </footer>
</div>
<pre class="yaml-preview" id="yamlPreview" hidden></pre>
<div class="toast" id="toast" hidden></div>
<script>
(function () {
  'use strict';
  var DATA = ${data};
  ${FORM_SCRIPT}
})();
</script>
</body>
</html>
`;
}
/** A file name for the generated form. */
export function formFileName(options) {
    const now = options.now ?? new Date();
    const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    if (options.mode === 'blank')
        return `poc-form-v3-new-${stamp}.html`;
    if (options.pocIds.length === 1)
        return `poc-form-v3-${options.pocIds[0]}-${stamp}.html`;
    return `poc-forms-v3-${options.pocIds.length}-${stamp}.html`;
}
/** The file name a colleague should save one project's YAML under. */
export function yamlFileName(project, now = new Date()) {
    const id = project.pocId.trim() === '' ? 'new' : project.pocId.trim();
    const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    return `${id}-${stamp}.yaml`;
}
/** Re-export the YAML library's parse for the round-trip test. */
export { YAML };
/**
 * Check a parsed form payload against {@link FORM_SCHEMA_VERSION}.
 *
 * Accepts the raw parsed object rather than a typed payload, because the whole
 * point is to inspect a document whose shape may be from an older generation.
 */
export function checkFormCompatibility(payload) {
    if (typeof payload !== 'object' || payload === null) {
        return {
            compatible: false,
            declared: '',
            reason: '这个文件不是本表单导出的格式，无法导入。',
        };
    }
    const record = payload;
    const declared = typeof record.schemaVersion === 'string' ? record.schemaVersion.trim() : '';
    if (declared === FORM_SCHEMA_VERSION) {
        return { compatible: true, declared, reason: '' };
    }
    if (declared === LEGACY_FORM_SCHEMA_VERSION || declared === '') {
        return {
            compatible: false,
            declared: declared === '' ? LEGACY_FORM_SCHEMA_VERSION : declared,
            reason: `这个表单是 v${LEGACY_FORM_SCHEMA_VERSION} 或更早版本导出的，台账只接受 v${FORM_SCHEMA_VERSION}。` +
                '旧表单的场景是字符串、指标没有 id，而证据按 id 挂靠，导入后会丢失全部场景与指标引用。' +
                '台账不做旧结构兼容，请重新导出一份 v' + FORM_SCHEMA_VERSION + ' 表单再填。',
        };
    }
    return {
        compatible: false,
        declared,
        reason: `这个表单声明的版本是 v${declared}，当前台账读取的是 v${FORM_SCHEMA_VERSION}，无法确认字段含义一致，已拒绝导入。`,
    };
}
/** The element id the returned page carries its change set in. */
export const RETURN_DATA_ID = 'poc-return-data';
/**
 * Read a returned form — either the `.html` this generator emits or a `.json`
 * change set — back into a change document.
 *
 * ## Why both formats, and why HTML is the default
 *
 * The documented workflow is "colleague fills it in and sends the HTML back on
 * WeChat". That only works if the returned HTML actually carries the answers, so
 * {@link buildFormHtml}'s page writes a `RETURN_DATA_ID` script block holding the
 * exact change set. The same page is also readable by a human: it renders the
 * answers as formatted HTML, so the person who receives it can see what was
 * submitted before handing it to DSH.
 *
 * The `.json` path is kept because it is stricter and smaller, and because forms
 * already in circulation emit it.
 *
 * ## Safety
 *
 * The HTML is never executed and never given to a DOM parser: the block is found
 * with a string search and the slice is handed to `JSON.parse`. Nothing in the
 * returned file can run.
 */
export function readReturnDocument(input) {
    const raw = input.trim();
    if (raw === '')
        return { document: null, reason: '文件是空的。' };
    // A JSON change set: the common case for a `.json` return.
    if (raw.startsWith('{')) {
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            return { document: null, reason: '这个 .json 文件解析失败，可能传输过程中被截断或改坏了。' };
        }
        return acceptDocument(parsed);
    }
    // A returned HTML page: find the data block by its id and parse only that.
    //
    // The marker is searched for exhaustively rather than once, because the FORM
    // page also contains the literal marker inside its own generator source (the
    // code that writes the return page). A single `indexOf` finds that copy first,
    // and a blank form then reports "the data block is corrupt" instead of the
    // truth: this form was never filled in. So every occurrence is tried and the
    // first one that parses as a change document wins.
    const marker = `id="${RETURN_DATA_ID}"`;
    let at = raw.indexOf(marker);
    while (at >= 0) {
        const open = raw.indexOf('>', at);
        const close = open < 0 ? -1 : raw.indexOf('</script>', open);
        if (open >= 0 && close >= 0) {
            const body = raw.slice(open + 1, close).trim();
            let parsed;
            try {
                parsed = JSON.parse(body);
            }
            catch {
                // Not the real block (a source-code copy, or a truncated file). Keep
                // looking: a later occurrence may still be intact.
                parsed = undefined;
            }
            if (parsed !== undefined) {
                const accepted = acceptDocument(parsed);
                // Only a successfully accepted document ends the search; a marker copy
                // that parses to some other JSON is skipped.
                if (accepted.document !== null)
                    return accepted;
                // A real-looking block that fails the schema gate is the answer: stop and
                // report it rather than silently falling through to "not a return file".
                if (Array.isArray(parsed.changes))
                    return accepted;
            }
        }
        at = raw.indexOf(marker, at + marker.length);
    }
    return {
        document: null,
        reason: '这个 HTML 里没有可读的回传数据。它可能是**原始空白表单**——组员要填完后点' +
            '【生成回传文件 (.html)】，发回的是新生成的那个文件，而不是最初收到的表单。',
    };
}
/** Validate a parsed return against the schema gate, then hand it back. */
function acceptDocument(parsed) {
    if (typeof parsed !== 'object' || parsed === null) {
        return { document: null, reason: '这个文件不是变更集格式。' };
    }
    const record = parsed;
    // A change document carries `changes`; a raw form payload carries `projects`.
    // The latter is the BLANK form, and reading it as a submission would silently
    // import an empty round.
    if (!Array.isArray(record.changes)) {
        if (Array.isArray(record.projects)) {
            return {
                document: null,
                reason: '这是**尚未填写/未生成回传文件**的原始表单，里面没有组员填的内容。' +
                    '请让组员填完后点【生成回传文件 (.html)】或【下载变更集 (.json)】，把那个文件发回。',
            };
        }
        return { document: null, reason: '这个文件里没有 changes 数组，不是表单变更集。' };
    }
    const gate = checkFormCompatibility(record);
    if (!gate.compatible)
        return { document: null, reason: gate.reason };
    return { document: parsed, reason: '' };
}
/** Styles: one inline sheet, the console's own design tokens. */
const FORM_CSS = `
/* ===========================================================================
 * The form mirrors the detail page, not a generic settings screen.
 *
 * A colleague filling this in is answering the same questions the detail page
 * asks: what does Gate 0 say, what are the criteria and scenarios, what happened
 * this round. So the layout follows the detail page's own contract — a banner,
 * then a fixed two-column body (commitments left, record right), then a
 * full-width closing block — instead of one long stack of generic cards.
 *
 * The tokens are the dashboard's: same palette, same 8px rhythm, same type
 * scale. Nothing here invents a new visual language, because the form is the
 * same product seen from the other side.
 * ======================================================================== */
:root{
  --primary:#2864E8;--primary-soft:rgba(40,100,232,.09);
  --text:#192638;--text-2:#4A5A70;--text-3:#7A8AA0;
  --bg:#F5F7FB;--surface:#fff;--inset:#F7F9FC;
  --border:#E6EBF2;--green:#218568;--green-soft:rgba(33,133,104,.10);
  --amber:#B77919;--amber-soft:rgba(183,121,25,.11);
  --red:#C0392B;--red-soft:rgba(192,57,43,.10);
  --slate:#5A6A80;--slate-soft:rgba(90,106,128,.10);
  --shadow-1:0 1px 2px rgba(20,32,52,.05);
  --shadow-2:0 2px 6px rgba(20,32,52,.07),0 1px 2px rgba(20,32,52,.04);
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Avenir Next','PingFang SC','Microsoft YaHei',system-ui,sans-serif;
  background:var(--bg);color:var(--text);font-size:13px;line-height:20px;
  -webkit-font-smoothing:antialiased;padding:20px 28px 96px;
}
.shell{max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:16px}

/* ---------- banner: identity + progress, the detail page's header ---------- */
.banner{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 18px;
  padding:16px 20px;background:var(--surface);border:1px solid var(--border);
  border-radius:10px;position:sticky;top:0;z-index:100;box-shadow:var(--shadow-1);
}
.banner-main{display:flex;flex-direction:column;gap:4px;min-width:0}
.banner-kicker{font-size:10px;font-weight:650;letter-spacing:.05em;text-transform:uppercase;color:var(--primary)}
.banner-title{margin:0;font-size:20px;line-height:28px;font-weight:700;letter-spacing:-.01em;overflow-wrap:anywhere}
.banner-meta{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;font-size:10.5px;color:var(--text-3)}
.banner-id{font-family:var(--mono);font-size:10px}
.banner-side{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.banner-pills{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end}
.banner-actions{display:flex;align-items:center;gap:8px}
.save-status{font-size:10.5px;color:var(--green);white-space:nowrap}
.banner-nav{
  grid-column:1/-1;display:flex;align-items:center;gap:10px;
  padding-top:10px;border-top:1px solid var(--border);
}
.banner-step{margin:0 auto;font-size:10px;color:var(--text-3);font-variant-numeric:tabular-nums}
/* On a phone the two-column banner squeezed the title into one word per line.
 * Stack it: title and pills full width, actions on their own row. */
@media(max-width:720px){
  .banner{grid-template-columns:minmax(0,1fr);gap:10px}
  .banner-side{align-items:flex-start}
  .banner-pills{justify-content:flex-start}
  .banner-actions{width:100%;justify-content:space-between}
  .banner-title{font-size:18px;line-height:25px}
}

/* ---------- the fixed two-column contract, same ratio as the detail page --- */
.columns{display:grid;grid-template-columns:minmax(0,1.72fr) minmax(0,1fr);gap:18px;align-items:start}
@media(max-width:1080px){.columns{grid-template-columns:minmax(0,1fr)}}
.col{display:flex;flex-direction:column;gap:18px;min-width:0}

/* ---------- section: one block with a heading and a rule ---------- */
.sec{display:flex;flex-direction:column;gap:10px;min-width:0}
.sec-head{display:flex;align-items:baseline;gap:9px;padding-bottom:7px;border-bottom:1px solid var(--border)}
.sec-title{margin:0;font-size:13.5px;line-height:20px;font-weight:650;letter-spacing:-.005em}
.sec-kicker{margin-left:auto;font-size:10.5px;color:var(--text-3);font-variant-numeric:tabular-nums}
.sec-hint{margin:0;font-size:11px;line-height:17px;color:var(--text-2)}

/* ---------- Gate 0 as the same 2x3 card grid the detail page uses ---------- */
.g0-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media(max-width:720px){.g0-grid{grid-template-columns:minmax(0,1fr)}}
.g0-card{
  display:flex;flex-direction:column;gap:5px;padding:10px 12px;
  border-radius:8px;background:var(--surface);border:1px solid var(--border);
}
.g0-card[data-present="false"]{background:var(--inset);border-style:dashed}
.g0-card-head{display:flex;align-items:baseline;gap:8px}
.g0-card-label{font-size:11px;line-height:16px;font-weight:650}
.g0-card-label .req{color:var(--red);margin-left:2px}
.g0-card-missing{
  margin-left:auto;font-size:9px;line-height:13px;font-weight:650;white-space:nowrap;
  color:var(--amber);background:var(--amber-soft);padding:1px 5px;border-radius:4px;
}
.g0-card .textarea{min-height:54px;font-size:11px;line-height:16px;border-color:transparent;background:transparent;padding:2px 0}
.g0-card .textarea:hover{border-color:var(--border);background:var(--surface);padding:6px 8px}
.g0-card .textarea:focus{border-color:var(--primary);background:var(--surface);padding:6px 8px}
.g0-help{font-size:10px;line-height:14px;color:var(--text-3)}

/* ---------- list rows: criteria and scenarios as cards, not bare inputs --- */
.row-card{
  display:flex;flex-direction:column;gap:6px;padding:9px 11px;
  border-radius:8px;background:var(--surface);border:1px solid var(--border);
}
.row-card-head{display:flex;align-items:center;gap:8px}
.row-card-id{
  flex:none;font-family:var(--mono);font-size:9px;line-height:13px;
  color:var(--text-3);background:var(--inset);border:1px solid var(--border);
  padding:1px 5px;border-radius:4px;
}
.row-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
@media(max-width:720px){.row-card-grid{grid-template-columns:minmax(0,1fr)}}
.mini{display:flex;flex-direction:column;gap:2px;min-width:0}
.mini-wide{margin-top:2px}
.mini-label{font-size:9.5px;font-weight:600;letter-spacing:.03em;color:var(--text-3)}

/* ---------- fields ---------- */
.field{display:flex;flex-direction:column;gap:4px;min-width:0}
.field-label{font-size:11px;font-weight:650;color:var(--text)}
.field-label .req{color:var(--red);margin-left:2px}
.field-help{font-size:10px;line-height:15px;color:var(--text-3)}
.input,.textarea,.select{
  width:100%;padding:6px 9px;border:1px solid var(--border);border-radius:6px;
  font-family:inherit;font-size:12px;line-height:18px;background:var(--surface);color:var(--text);
}
.input-flush{border-color:transparent;background:transparent;padding:2px 0;font-size:13px;font-weight:600}
.input-flush:hover{border-color:var(--border);background:var(--surface);padding:5px 8px}
.input-flush:focus{border-color:var(--primary);background:var(--surface);padding:5px 8px}
.input:focus,.textarea:focus,.select:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}
.textarea{min-height:60px;resize:vertical}
.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px}
@media(max-width:720px){.grid-2{grid-template-columns:minmax(0,1fr)}}
.field.has-error .input,.field.has-error .textarea,.field.has-error .select{border-color:var(--red)}
.field-error{color:var(--red);font-size:10px;display:none}
.field.has-error .field-error{display:block}

/* ---------- locked fields: shown so the ledger's state is visible, but not
 * editable. Muted rather than hidden, because "what does the ledger already
 * say" is exactly what a colleague needs before answering. ------------------ */
.input.is-locked,.textarea.is-locked,.select.is-locked{
  background:var(--inset);color:var(--text-2);border-color:var(--border);
  cursor:not-allowed;opacity:1;
}
.field-locked{color:var(--text-3);font-style:italic}

/* ---------- id pickers: which scenario / criterion this round touched ------ */
.pick-list{display:flex;flex-wrap:wrap;gap:6px}
.pick{
  display:flex;align-items:center;gap:6px;padding:5px 9px;border-radius:7px;
  border:1px solid var(--border);background:var(--surface);cursor:pointer;font-size:11px;
}
.pick:hover{border-color:var(--primary)}
.pick:has(input:checked){background:var(--primary-soft);border-color:var(--primary)}
.pick input{accent-color:var(--primary);margin:0}
.pick-id{font-family:var(--mono);font-size:9px;color:var(--text-3)}
.pick-empty{
  margin-top:2px;padding:7px 11px;border:1px dashed var(--border);border-radius:7px;
  font-size:11px;color:var(--text-3);background:var(--inset);
}
.pick-name{overflow-wrap:anywhere}

/* ---------- project snapshot: the orientation strip under the banner ------- */
.snapshot{
  display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;
  background:var(--surface);border:1px solid var(--border);border-radius:10px;
  overflow:hidden;box-shadow:var(--shadow-1);
}
@media(max-width:900px){.snapshot{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:520px){
  /* Two columns even on a phone: five stacked cells cost a full screen before
   * the first field. The amount cell spans the row to avoid a dangling gap. */
  .snapshot{grid-template-columns:repeat(2,minmax(0,1fr))}
  .snap-cell{padding:8px 11px}
  .snap-cell:last-child{grid-column:1/-1;border-top:1px solid var(--border)}
  .snap-value{font-size:11.5px;line-height:16px}
}
.snap-cell{
  display:flex;flex-direction:column;gap:3px;padding:10px 14px;min-width:0;
  border-left:1px solid var(--border);
}
.snap-cell:first-child{border-left:0}
@media(max-width:900px){
  .snap-cell:nth-child(odd){border-left:0}
  .snap-cell:nth-child(n+3){border-top:1px solid var(--border)}
}
.snap-label{
  font-size:9.5px;font-weight:650;letter-spacing:.05em;text-transform:uppercase;color:var(--text-3);
}
.snap-value{
  font-size:12px;line-height:17px;font-weight:600;color:var(--text);
  font-variant-numeric:tabular-nums;overflow-wrap:anywhere;
}
.snap-cell[data-tone="ok"] .snap-value{color:var(--green)}
.snap-cell[data-tone="warn"] .snap-value{color:var(--amber)}
.snap-cell[data-tone="info"] .snap-value{color:var(--primary)}
.snap-cell[data-tone="muted"] .snap-value{color:var(--text-3);font-weight:500}

/* ---------- read-only context: shown so the ledger is legible, collapsed so it
 * does not push the fields-to-fill below the fold. A <details> is used rather
 * than a JS toggle because it works with no script and prints expanded. ------ */
.read-context{border:1px solid var(--border);border-radius:8px;background:var(--inset)}
.read-context>summary{
  padding:8px 12px;font-size:11px;font-weight:600;color:var(--text-2);
  cursor:pointer;list-style:none;display:flex;align-items:center;gap:7px;
}
.read-context>summary::-webkit-details-marker{display:none}
.read-context>summary::before{
  content:'';width:0;height:0;flex:none;
  border-left:4px solid var(--text-3);border-top:3.5px solid transparent;border-bottom:3.5px solid transparent;
  transition:transform .12s ease;
}
.read-context[open]>summary::before{transform:rotate(90deg)}
.read-context>summary:hover{color:var(--text)}
.read-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 18px;padding:2px 12px 11px}
@media(max-width:720px){.read-grid{grid-template-columns:minmax(0,1fr)}}
.read-pair{padding:6px 0;border-top:1px dashed var(--border);min-width:0}
.read-pair dt{font-size:10px;font-weight:600;color:var(--text-3);margin-bottom:2px}
.read-pair dd{font-size:11.5px;line-height:17px;color:var(--text-2);white-space:pre-wrap;overflow-wrap:anywhere}
.read-pair dd.read-empty{color:var(--text-3);font-style:italic}
.read-list-block{padding:0 12px 10px}
.read-list-block h3{margin:6px 0 5px;font-size:10px;font-weight:650;letter-spacing:.04em;text-transform:uppercase;color:var(--text-3)}
.read-list{list-style:none;display:flex;flex-direction:column;gap:4px}
.read-list li{padding:5px 9px;background:var(--surface);border:1px solid var(--border);border-radius:6px;font-size:11.5px;line-height:17px;overflow-wrap:anywhere}
.read-id{font-family:var(--mono);font-size:9px;color:var(--text-3);margin-right:6px}
.read-dim{color:var(--text-3)}

/* ---------- progress history: what has already been reported --------------- */
.hist-list{list-style:none;display:flex;flex-direction:column;gap:0;padding:0 12px 10px}
.hist-item{
  display:grid;grid-template-columns:minmax(0,1fr);gap:3px;
  padding:8px 0;border-top:1px dashed var(--border);
}
.hist-item:first-child{border-top:0}
.hist-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.hist-seq{font-family:var(--mono);font-size:9.5px;color:var(--text-3)}
.hist-date{font-size:11px;font-weight:650;color:var(--text-2);font-variant-numeric:tabular-nums}
.hist-type{font-size:9.5px;color:var(--primary);background:var(--primary-soft);padding:1px 6px;border-radius:4px}
.hist-change{font-size:9.5px;color:var(--amber);background:var(--amber-soft);padding:1px 6px;border-radius:4px}
.hist-pct{font-size:9.5px;color:var(--text-3);font-variant-numeric:tabular-nums;margin-left:auto}
.hist-actual{margin:2px 0 0;font-size:11.5px;line-height:17px;color:var(--text-2);white-space:pre-wrap;overflow-wrap:anywhere}
.hist-meta{margin:1px 0 0;font-size:10px;color:var(--text-3);overflow-wrap:anywhere}

/* ---------- atoms ---------- */
.btn{
  padding:6px 12px;border-radius:6px;border:1px solid var(--border);background:var(--surface);
  cursor:pointer;font-family:inherit;font-size:12px;color:var(--text);white-space:nowrap;
}
.btn:hover{background:var(--inset)}
.btn-primary{background:var(--primary);color:#fff;border-color:var(--primary);font-weight:600}
.btn-primary:hover{background:#1E54C9}
.btn-sm{padding:3px 9px;font-size:11px}
.btn-remove{color:var(--red);border-color:rgba(192,57,43,.28);flex:none}
.badge{display:inline-block;padding:1px 7px;border-radius:4px;font-size:10px;font-weight:600;white-space:nowrap}
.badge-ok{background:var(--green-soft);color:var(--green)}
.badge-warn{background:var(--amber-soft);color:var(--amber)}
.badge-error{background:var(--red-soft);color:var(--red)}
.badge-info{background:var(--primary-soft);color:var(--primary)}
.pill{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:13px;font-size:10.5px;font-weight:600}
.pill-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex:none}
.pill-blue{background:var(--primary-soft);color:var(--primary)}
.pill-slate{background:var(--slate-soft);color:var(--slate)}
.pill-amber{background:var(--amber-soft);color:var(--amber)}
.pill-green{background:var(--green-soft);color:var(--green)}
.pill-red{background:var(--red-soft);color:var(--red)}

/* ---------- what is still missing: the one actionable strip ------------- */
.missing{
  display:flex;align-items:flex-start;gap:12px;padding:9px 14px;
  background:var(--amber-soft);border:1px solid rgba(183,121,25,.24);
  border-left:3px solid var(--amber);border-radius:8px;
}
.missing-label{
  flex:none;font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  color:var(--amber);padding-top:2px;
}
.missing-list{list-style:none;display:flex;flex-direction:column;gap:2px;min-width:0}
.missing-list li{font-size:11.5px;line-height:17px;color:#8A5E12;overflow-wrap:anywhere}

/* ---------- notices / footer ---------- */
.notice{
  background:var(--primary-soft);border:1px solid rgba(40,100,232,.22);border-radius:8px;
  padding:9px 13px;font-size:11.5px;color:var(--text-2);
}
.notice-warn{background:var(--amber-soft);border-color:rgba(183,121,25,.24);color:#8A5E12}
.footer{
  position:fixed;bottom:0;left:0;right:0;z-index:150;
  background:var(--surface);border-top:1px solid var(--border);
  padding:11px 28px;display:flex;justify-content:space-between;align-items:center;gap:12px;
  flex-wrap:wrap;box-shadow:0 -4px 12px rgba(20,32,52,.06);
}
.footer-info{font-size:11.5px;color:var(--text-3)}
.footer-actions{display:flex;gap:8px;flex-wrap:wrap}
.yaml-preview{
  background:var(--surface);padding:16px;border-radius:10px;border:1px solid var(--border);
  overflow:auto;font-size:11px;font-family:var(--mono);white-space:pre-wrap;line-height:1.55;
}
.toast{
  position:fixed;top:76px;left:50%;transform:translateX(-50%);
  background:var(--green);color:#fff;padding:8px 17px;border-radius:7px;
  font-size:12px;z-index:200;box-shadow:var(--shadow-2);
}
@media print{
  .banner,.footer{position:static;box-shadow:none}
  body{padding:0}
}
`;
/**
 * Styles for the RETURNED page — the read-only report a colleague sends back.
 *
 * It is a separate sheet on purpose. The form's sheet is built for input
 * affordances (focus rings, hover borders, a sticky footer); a report has none of
 * those and needs a reading rhythm instead: one column, generous line height, and
 * a label/value grid that stays legible when someone opens it on a phone in
 * WeChat. Sharing the form's tokens keeps it recognisably the same product.
 */
const RETURN_CSS = `
:root{
  --text:#192638;--text-2:#4A5A70;--text-3:#7A8AA0;
  --bg:#F5F7FB;--surface:#fff;--inset:#F7F9FC;
  --border:#E6EBF2;--green:#218568;--amber:#B77919;--primary:#2864E8;
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Avenir Next','PingFang SC','Microsoft YaHei',system-ui,sans-serif;
  background:var(--bg);color:var(--text);font-size:13px;line-height:20px;
  -webkit-font-smoothing:antialiased;padding:24px 20px 60px;
}
.ret-shell{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.ret-note{
  background:rgba(40,100,232,.07);border:1px solid rgba(40,100,232,.2);
  border-radius:8px;padding:10px 14px;font-size:11.5px;line-height:18px;color:var(--text-2);
}
.ret-bar{
  display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:baseline;
  font-size:11.5px;font-weight:600;color:var(--text-2);
}
.ret-dim{font-weight:400;color:var(--text-3)}
.ret-card{
  background:var(--surface);border:1px solid var(--border);border-radius:10px;
  padding:18px 20px;display:flex;flex-direction:column;gap:16px;
}
.ret-head{padding-bottom:12px;border-bottom:1px solid var(--border)}
.ret-head h1{margin:0;font-size:19px;line-height:27px;font-weight:700;letter-spacing:-.01em;overflow-wrap:anywhere}
.ret-meta{margin-top:4px;font-size:10.5px;color:var(--text-3);font-family:var(--mono)}
.ret-sec h2{
  margin:0 0 7px;font-size:11px;font-weight:650;letter-spacing:.05em;
  text-transform:uppercase;color:var(--text-3);
}
.ret-sec dl{display:flex;flex-direction:column;gap:0}
.ret-pair{
  display:grid;grid-template-columns:132px minmax(0,1fr);gap:12px;
  padding:6px 0;border-top:1px dashed var(--border);
}
.ret-pair:first-child{border-top:0}
.ret-pair dt{font-size:11.5px;color:var(--text-3);line-height:19px}
.ret-pair dd{font-size:12.5px;line-height:20px;color:var(--text);white-space:pre-wrap;overflow-wrap:anywhere}
.ret-list{list-style:none;display:flex;flex-direction:column;gap:5px}
.ret-list li{
  padding:6px 10px;background:var(--inset);border-radius:6px;
  font-size:12px;line-height:18px;overflow-wrap:anywhere;
}
.ret-list li b{font-family:var(--mono);font-size:9.5px;color:var(--text-3);margin-right:6px}
.ret-new{border-left:3px solid var(--green);padding-left:13px}
.ret-new h2{color:var(--green)}
.ret-tag{
  margin-left:7px;padding:1px 6px;border-radius:4px;font-size:9px;
  background:rgba(33,133,104,.12);color:var(--green);text-transform:none;letter-spacing:0;
}
@media(max-width:560px){
  body{padding:14px 12px 40px}
  .ret-card{padding:14px 15px}
  .ret-pair{grid-template-columns:minmax(0,1fr);gap:2px}
}
@media print{
  body{background:#fff;padding:0}
  .ret-note{display:none}
  .ret-card{break-inside:avoid;border-color:#ccc}
}
`;
/**
 * The generated page script.
 *
 * Plain ES5 (no arrow functions, no template literals, no `const`): the file has
 * to run from `file://` in any browser a colleague happens to have. It also
 * keeps the generator's own template escaping simple.
 *
 * It renders a form from `DATA`, keeps a draft in localStorage, validates the
 * counts the gap rules enforce, and downloads real YAML — one file per project.
 */
const FORM_SCRIPT = `
  var state = { active: 0 };
  var saveTimer = null;
  var storageAvailable = true;

  function text(value) {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function byId(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return text(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showToast(message) {
    var toast = byId('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toast.hidden = true; }, 2200);
  }

  function probeStorage() {
    try {
      var probe = '__poc_v3_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  }

  function storageKey() { return DATA.draftKey; }

  function loadDraft() {
    if (!storageAvailable) return null;
    try {
      var raw = window.localStorage.getItem(storageKey());
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.projects || !parsed.projects.length) return null;
      return parsed.projects;
    } catch (error) {
      return null;
    }
  }

  function save(quiet) {
    if (!storageAvailable) {
      markSave('草稿无法保存（浏览器禁用了本地存储）');
      return;
    }
    try {
      window.localStorage.setItem(storageKey(), JSON.stringify({ projects: DATA.projects, savedAt: new Date().toISOString() }));
      markSave('已自动保存');
    } catch (error) {
      markSave('草稿保存失败：可能空间不足');
    }
  }

  function markSave(message) {
    var node = byId('saveStatus');
    if (node) node.textContent = message;
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { save(false); }, 600);
  }

  function clearDraft() {
    if (storageAvailable) {
      try { window.localStorage.removeItem(storageKey()); } catch (error) {}
    }
    DATA.projects = DATA.mode === 'blank' ? [blankProject()] : DATA.projects;
    location.reload();
  }

  function blankProject() {
    return ${JSON.stringify(blankProjectPayload())};
  }

  function current() { return DATA.projects[state.active]; }

  /**
   * A new list row, carrying the next free stable id.
   *
   * v3.1 requires an id on every scenario and criterion because evidence and
   * progress reference them. A row added without one used to crash the YAML
   * writer outright (it called '.trim()' on an absent id), and even when it did
   * not, the row could never be referenced. The id is derived from the highest
   * existing suffix so deleting a row never renumbers the survivors.
   */
  function nextRow(prefix, list, fields) {
    var highest = 0;
    for (var i = 0; i < list.length; i += 1) {
      var match = new RegExp('^' + prefix + '-(\\\\d+)$').exec(text(list[i].id));
      if (match) highest = Math.max(highest, Number(match[1]));
    }
    fields.id = prefix + '-' + ('0' + (highest + 1)).slice(-2);
    return fields;
  }

  function setPath(target, path, value) {
    var parts = path.split('.');
    var node = target;
    for (var i = 0; i < parts.length - 1; i += 1) {
      var key = parts[i];
      if (key === '') continue;
      if (/^\\d+$/.test(key)) key = Number(key);
      if (node[key] === null || node[key] === undefined) node[key] = {};
      node = node[key];
    }
    node[parts[parts.length - 1]] = value;
  }

  function field(label, path, value, options) {
    var opts = options || {};
    var help = opts.help ? '<p class="field-help">' + escapeHtml(opts.help) + '</p>' : '';
    var req = opts.required ? '<span class="req">*</span>' : '';
    // A locked field is shown, not hidden: the person needs to know what the
    // ledger already says. It is rendered as a disabled control (so it reads as a
    // field) with no 'data-path' (so no handler can write it), plus a lock note.
    var locked = opts.readonly === true;
    var lockAttr = locked ? ' disabled' : '';
    var pathAttr = locked ? '' : ' data-path="' + escapeHtml(path) + '"';
    var input;
    if (opts.multiline) {
      input = '<textarea class="textarea' + (locked ? ' is-locked' : '') + '"' + pathAttr + lockAttr + '>' + escapeHtml(value) + '</textarea>';
    } else if (opts.enum) {
      input = '<select class="select' + (locked ? ' is-locked' : '') + '"' + pathAttr + lockAttr + '>';
      if (locked && value === '') input += '<option value="">— 未填 —</option>';
      for (var i = 0; i < opts.enum.length; i += 1) {
        var option = opts.enum[i];
        input += '<option value="' + escapeHtml(option) + '"' + (option === value ? ' selected' : '') + '>' + escapeHtml(option) + '</option>';
      }
      input += '</select>';
    } else {
      // lang="zh-CN" on a date input: the browser otherwise formats the picker as
      // mm/dd/yyyy in an English locale, which reads as "month 20" to a Chinese
      // colleague. The attribute is per-element because it must override the
      // browser's own locale, not the document's.
      var langAttr = opts.date ? ' lang="zh-CN"' : '';
      input = '<input class="input' + (locked ? ' is-locked' : '') + '" type="' + (opts.date ? 'date' : opts.number ? 'number' : 'text') + '"' + pathAttr + langAttr + ' value="' + escapeHtml(value) + '"' + lockAttr + '>';
    }
    // The note is redundant when 'help' already explains why the field is locked,
    // and printing both made a two-line field into a four-line one.
    var lockNote = locked && !opts.help ? '<p class="field-help field-locked">只读 · 由台账/评审流程维护</p>' : '';
    return '<div class="field' + (locked ? ' is-locked' : '') + '" data-field="' + escapeHtml(path) + '">' +
      '<label class="field-label">' + escapeHtml(label) + req + '</label>' + help + input + lockNote + '</div>';
  }

  /**
   * Gate 0 as the same 2x3 card grid the detail page uses.
   *
   * A generic stack of labelled textareas hid the thing a colleague most needs
   * to see: WHICH of the five prerequisites is still missing. The grid makes a
   * blank cell a visible gap rather than one empty box among many.
   */
  function g0Card(project) {
    var cards = '';
    var present = 0;
    for (var i = 0; i < DATA.g0Fields.length; i += 1) {
      var def = DATA.g0Fields[i];
      var filled = text(project.gate0[def.key]).trim() !== '';
      if (filled) present += 1;
      cards += '<div class="g0-card" data-present="' + (filled ? 'true' : 'false') + '">' +
        '<div class="g0-card-head"><span class="g0-card-label">' + escapeHtml(def.label) +
          '<span class="req">*</span></span>' +
          (filled ? '' : '<span class="g0-card-missing">缺失</span>') + '</div>' +
        '<textarea class="textarea" data-path="gate0.' + def.key + '" placeholder="' +
          escapeHtml(def.hint) + '">' + escapeHtml(project.gate0[def.key]) + '</textarea>' +
        '</div>';
    }
    // The fifth prerequisite lives in the identity block of the ledger, but it is
    // a G0 requirement, so it is EDITED here — once. It used to be rendered both
    // here and in the identity card with the same 'data-path', so two inputs owned
    // one value: typing in one left the other showing stale text, and the last
    // render won. One field, one input.
    var techFilled = text(project.techOwner).trim() !== '';
    if (techFilled) present += 1;
    cards += '<div class="g0-card" data-present="' + (techFilled ? 'true' : 'false') + '">' +
      '<div class="g0-card-head"><span class="g0-card-label">客户技术责任人' +
        '<span class="req">*</span></span>' +
        (techFilled ? '' : '<span class="g0-card-missing">缺失</span>') + '</div>' +
      '<input class="input" data-path="techOwner" value="' + escapeHtml(project.techOwner) + '" placeholder="谁在客户侧配合验证">' +
      '</div>';

    var tone = present === 5 ? 'badge-ok' : present === 0 ? 'badge-warn' : 'badge-info';
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">Gate 0 · 值不值得做</h2>' +
        '<span class="sec-kicker">五必填 <span class="badge ' + tone + '">' + present + ' / 5</span></span></header>' +
      '<p class="sec-hint">这五项齐了，G0 评审才有意义。第五项「客户技术责任人」也在这里填，身份区不再重复。</p>' +
      '<div class="g0-grid">' + cards + '</div>' +
      '<div class="grid-2">' +
        field('主要竞争对手', 'gate0.competitor', project.gate0.competitor, {}) +
        field('G0 评审结论', 'gate0.conclusion', project.gate0.conclusion, { enum: DATA.enums.g0Conclusion }) +
        field('G0 评审人', 'gate0.reviewer', project.gate0.reviewer, {}) +
        field('评审日期', 'gate0.reviewed_at', project.gate0.reviewed_at, { date: true }) +
      '</div></section>';
  }

  function criteriaList(project) {
    var rows = '';
    for (var i = 0; i < project.plan.criteria.length; i += 1) {
      var criterion = project.plan.criteria[i];
      rows += '<div class="row-card">' +
        '<div class="row-card-head">' +
          '<span class="row-card-id mono">' + escapeHtml(criterion.id) + '</span>' +
          '<input class="input input-flush" data-path="plan.criteria.' + i + '.name" value="' + escapeHtml(criterion.name) + '" placeholder="指标名称，如「200 人并发稳定 7 天」">' +
          '<button type="button" class="btn btn-sm btn-remove" data-remove="criteria" data-index="' + i + '" title="删除这条指标">删</button>' +
        '</div>' +
        '<div class="row-card-grid">' +
          '<label class="mini"><span class="mini-label">度量</span>' +
            '<input class="input" data-path="plan.criteria.' + i + '.metric" value="' + escapeHtml(criterion.metric) + '" placeholder="如「成功率」"></label>' +
          '<label class="mini"><span class="mini-label">基线</span>' +
            '<input class="input" data-path="plan.criteria.' + i + '.baseline" value="' + escapeHtml(criterion.baseline) + '" placeholder="当前值"></label>' +
          '<label class="mini"><span class="mini-label">目标</span>' +
            '<input class="input" data-path="plan.criteria.' + i + '.target" value="' + escapeHtml(criterion.target) + '" placeholder="如 ≥99.5%"></label>' +
        '</div></div>';
    }
    return rows + '<button type="button" class="btn btn-sm" data-add="criteria">+ 加一条指标</button>';
  }

  /**
   * The scenario list.
   *
   * v3.1 made a scenario an object with a stable id, not a bare string. The old
   * renderer still printed the object, which is why every scenario row showed
   * "[object Object]" — the id is carried through untouched because evidence
   * attaches to it, and 'name' / 'goal' are the two editable parts.
   */
  function scenarioList(project) {
    var rows = '';
    for (var i = 0; i < project.plan.scenarios.length; i += 1) {
      var scenario = project.plan.scenarios[i];
      rows += '<div class="row-card">' +
        '<div class="row-card-head">' +
          '<span class="row-card-id mono">' + escapeHtml(scenario.id) + '</span>' +
          '<input class="input input-flush" data-path="plan.scenarios.' + i + '.name" value="' + escapeHtml(scenario.name) + '" placeholder="场景名称，如「办公网远程接入」">' +
          '<button type="button" class="btn btn-sm btn-remove" data-remove="scenarios" data-index="' + i + '" title="删除这个场景">删</button>' +
        '</div>' +
        '<label class="mini mini-wide"><span class="mini-label">成功目标</span>' +
          '<input class="input" data-path="plan.scenarios.' + i + '.goal" value="' + escapeHtml(scenario.goal) + '" placeholder="如 5000 人并发成功率 ≥99.5%，稳定 7 天"></label>' +
        '</div>';
    }
    return rows + '<button type="button" class="btn btn-sm" data-add="scenarios">+ 加一个场景</button>';
  }

  function riskList(project) {
    var rows = '';
    for (var i = 0; i < project.plan.risks.length; i += 1) {
      var risk = project.plan.risks[i];
      var select = '<select class="select" data-path="plan.risks.' + i + '.level">';
      select += '<option value="">— 未评级 —</option>';
      for (var j = 0; j < DATA.enums.riskLevel.length; j += 1) {
        var level = DATA.enums.riskLevel[j];
        select += '<option value="' + level + '"' + (level === risk.level ? ' selected' : '') + '>' + level + '</option>';
      }
      select += '</select>';
      rows += '<div class="list-item">' +
        '<input class="input" data-path="plan.risks.' + i + '.name" value="' + escapeHtml(risk.name) + '" placeholder="风险">' +
        select +
        '<input class="input" data-path="plan.risks.' + i + '.mitigation" value="' + escapeHtml(risk.mitigation) + '" placeholder="应对">' +
        '<button type="button" class="btn btn-sm btn-remove" data-remove="risks" data-index="' + i + '">删</button>' +
        '</div>';
    }
    return rows + '<button type="button" class="btn btn-sm" data-add="risks">+ 加一条风险</button>';
  }

  /** The plan block: how we win, split into what we commit to and the limits. */
  function planCard(project) {
    var criteria = project.plan.criteria.length;
    var scenarios = project.plan.scenarios.length;
    var risks = project.plan.risks.length;
    var criteriaBadge = criteria === 0 ? '<span class="badge badge-warn">还没有指标</span>'
      : (criteria >= 2 && criteria <= 3 ? '<span class="badge badge-ok">' + criteria + ' 条，符合 2–3</span>'
      : '<span class="badge badge-error">' + criteria + ' 条，要求 2–3</span>');
    var scenarioBadge = scenarios === 0 ? '<span class="badge badge-warn">还没有场景</span>'
      : (scenarios >= 3 && scenarios <= 5 ? '<span class="badge badge-ok">' + scenarios + ' 个，符合 3–5</span>'
      : '<span class="badge badge-error">' + scenarios + ' 个，要求 3–5</span>');
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">成功指标与测试场景</h2>' +
        '<span class="sec-kicker">G1 / G2</span></header>' +
      '<p class="sec-hint">指标 2–3 条、场景 3–5 个。数量不对会在缺口清单里被点名。id 由系统分配，不要改——证据靠它挂靠。</p>' +
      '<div class="sec"><label class="field-label">关键成功指标 ' + criteriaBadge + '</label>' + criteriaList(project) + '</div>' +
      '<div class="sec"><label class="field-label">关键测试场景 ' + scenarioBadge + '</label>' + scenarioList(project) + '</div>' +
      '</section>';
  }

  /** The plan's narrative + its limits, which belong on the record side. */
  function planNarrative(project) {
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">方案要点</h2></header>' +
      field('客户核心痛点', 'plan.customer_pain', project.plan.customer_pain, { multiline: true }) +
      field('期望客户认可什么', 'plan.expected_recognition', project.plan.expected_recognition, { multiline: true }) +
      field('我方优势 / 赢点', 'plan.our_edge', project.plan.our_edge, { multiline: true }) +
      '</section>';
  }

  function riskCard(project) {
    var risks = project.plan.risks.length;
    var riskBadge = risks === 0 ? '<span class="badge badge-warn">还没有风险</span>'
      : (risks <= 3 ? '<span class="badge badge-ok">' + risks + ' 条，≤3</span>'
      : '<span class="badge badge-error">' + risks + ' 条，超过 3</span>');
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">最大风险</h2>' +
        '<span class="sec-kicker">' + riskBadge + '</span></header>' +
      riskList(project) + '</section>';
  }

  function gateCard(project) {
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">Gate 结论与时间</h2></header>' +
      '<div class="grid-2">' +
        field('计划开始', 'plan.timeline_start', project.plan.timeline_start, { date: true }) +
        field('计划结束', 'plan.timeline_end', project.plan.timeline_end, { date: true }) +
        field('G1 结论', 'plan.gate1_conclusion', project.plan.gate1_conclusion, { enum: DATA.enums.g1Conclusion }) +
        field('G2 Ready 状态', 'plan.gate2_ready', project.plan.gate2_ready, { enum: DATA.enums.g2Ready }) +
      '</div></section>';
  }

  /**
   * This round's entry — the append-only half of the ledger.
   *
   * Kept as one section rather than split across the columns: a progress entry is
   * read as a single unit ("what happened, what proves it, who said so, what
   * next"), and splitting it would let a colleague fill the top half and forget
   * the evidence below.
   */
  /**
   * A checkbox group that picks which scenarios / criteria this round touched.
   *
   * v3.1 requires scenario_ids / criteria_ids on every progress entry, and they
   * are what makes a scenario's status derivable at all. The form shipped without
   * any way to set them, so every returned form carried an empty list and the
   * ledger could never work out which scenario a proof belonged to.
   *
   * The two lists are deliberately independent: a round can prove a criterion
   * without touching any scenario, which is why they are separate groups rather
   * than a nested scenario -> criteria tree.
   */
  function idPicker(label, path, unused, options, selected, hint) {
    if (options.length === 0) {
      // Nothing to pick: say so in one muted line instead of two help paragraphs.
      // A G0 project has no plan yet by design, so this is normal, not a gap.
      return '<div class="field"><label class="field-label">' + escapeHtml(label) + '</label>' +
        '<p class="field-help">' + escapeHtml(hint) + '</p>' +
        '<p class="pick-empty">还没有可选项——这个项目还没有' + escapeHtml(label.replace('这一轮', '')) + '，先补计划。</p></div>';
    }
    var chosen = {};
    for (var i = 0; i < selected.length; i += 1) chosen[text(selected[i])] = true;
    var boxes = '';
    for (var j = 0; j < options.length; j += 1) {
      var option = options[j];
      boxes += '<label class="pick">' +
        '<input type="checkbox" data-pick="' + escapeHtml(path) + '" value="' + escapeHtml(option.id) + '"' +
          (chosen[option.id] ? ' checked' : '') + '>' +
        '<span class="pick-id">' + escapeHtml(option.id) + '</span>' +
        '<span class="pick-name">' + escapeHtml(option.name || '（未命名）') + '</span>' +
        '</label>';
    }
    return '<div class="field"><label class="field-label">' + escapeHtml(label) + '</label>' +
      '<p class="field-help">' + escapeHtml(hint) + '</p>' +
      '<div class="pick-list">' + boxes + '</div></div>';
  }

  function progressCard(project) {
    var entry = project.progress;
    var evidenceRows = '';
    for (var i = 0; i < entry.evidence.length; i += 1) {
      evidenceRows += '<div class="row-card"><div class="row-card-head">' +
        '<input class="input" data-path="progress.evidence.' + i + '.title" value="' + escapeHtml(entry.evidence[i].title) + '" placeholder="证据名称，如「压测报告」">' +
        '<input class="input" data-path="progress.evidence.' + i + '.link" value="' + escapeHtml(entry.evidence[i].link) + '" placeholder="链接（可空）">' +
        '<button type="button" class="btn btn-sm btn-remove" data-remove="evidence" data-index="' + i + '">删</button>' +
        '</div></div>';
    }
    var countBadge = project.existingProgressCount > 0
      ? '<span class="badge badge-info">已有 ' + project.existingProgressCount + ' 条</span>'
      : '<span class="badge badge-warn">第一条进展</span>';
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">这一轮进展</h2>' +
        '<span class="sec-kicker">' + countBadge + '</span></header>' +
      '<p class="sec-hint">追加式：这里填的是第 ' + (project.existingProgressCount + 1) + ' 条新记录，不会覆盖已有历史。</p>' +
      '<div class="grid-2">' +
        field('日期', 'progress.date', entry.date, { date: true, required: true }) +
        field('类型', 'progress.type', entry.type, { enum: DATA.enums.progressType, required: true }) +
        field('这一次什么变了', 'progress.change', entry.change, { enum: DATA.enums.progressChange, required: true, help: 'v3.1 必填。「无实质进展」也是正当答案——比写空话好。' }) +
        field('完成度', 'progress.completion', entry.completion, { enum: DATA.enums.completion }) +
      '</div>' +
      field('目标', 'progress.goal', entry.goal, {}) +
      field('实际结果', 'progress.actual', entry.actual, { multiline: true, required: true, help: '做了什么、结果如何。没有证据的结果会被缺口规则点名。' }) +
      idPicker('这一轮推进了哪些场景', 'progress.scenarioIds', null, project.plan.scenarios, entry.scenarioIds,
        '勾选这一轮实际验证过的场景。场景状态（已证明 / 待客户确认 / 无证据）由这里的勾选加上证据推导出来。') +
      idPicker('这一轮验证了哪些指标', 'progress.criteriaIds', null, project.plan.criteria, entry.criteriaIds,
        '与场景相互独立：一条指标可以被验证而没有推进任何场景。') +
      '<div class="field"><label class="field-label">证据<span class="req">*</span></label>' +
        '<p class="field-help">没有证据的结果会被缺口规则点名。证据挂到勾选的场景上。</p>' + evidenceRows +
        '<button type="button" class="btn btn-sm" data-add="evidence">+ 加一条证据</button></div>' +
      '<div class="grid-2">' +
        field('同步对象', 'progress.customer.synced_with', entry.customer.synced_with, {}) +
        field('客户认可度', 'progress.customer.recognition', entry.customer.recognition, { enum: DATA.enums.recognition }) +
        field('G3-1', 'progress.gate3_1', entry.gate3_1, { enum: DATA.enums.gate3_1 }) +
        field('G3-2', 'progress.gate3_2', entry.gate3_2, { enum: DATA.enums.gate3_2 }) +
      '</div>' +
      field('客户反馈', 'progress.customer.feedback', entry.customer.feedback, { multiline: true }) +
      '</section>';
  }

  /** The closing block: next actions, spanning both columns like the detail page. */
  function nextCard(project) {
    var next = project.progress.next;
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">下一步工作目标及计划</h2>' +
        '<span class="sec-kicker">承接 progress[].next</span></header>' +
      '<div class="grid-2">' +
        field('下一步目标', 'progress.next.goal', next.goal, { multiline: true, required: true }) +
        field('负责人', 'progress.next.owner', next.owner, {}) +
        field('截止日期', 'progress.next.deadline', next.deadline, { date: true }) +
      '</div></section>';
  }

  /** Identity: the fields the detail page keeps in its right-hand column. */
  function identityCard(project) {
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">基本信息</h2></header>' +
      '<p class="sec-hint">项目编号、阶段、状态是台账的路由键，填表不改它们——阶段推进走 Gate 评审，不靠改表单字段。</p>' +
      '<div class="grid-2">' +
        field('项目编号', 'pocId', project.pocId, { required: DATA.mode === 'blank', readonly: DATA.mode !== 'blank', help: DATA.mode === 'blank' ? '新建时必填，格式 POC-XXX。' : '台账主键，不可改。' }) +
        field('项目名称', 'name', project.name, { required: true }) +
        field('体系', 'system', project.system, { enum: DATA.enums.system }) +
        field('客户公司', 'company', project.company, {}) +
        field('部门', 'department', project.department, {}) +
        field('预计金额（万元）', 'amountWan', project.amountWan, { number: true }) +
        field('项目类型', 'pocType', project.pocType, { enum: DATA.enums.pocType }) +
        field('阶段', 'stage', project.stage, { enum: DATA.enums.stage, readonly: true, help: '阶段由 Gate 评审推进，不能在这里改。' }) +
        field('状态', 'status', project.status, { enum: DATA.enums.status, readonly: true, help: '暂停/关闭请走评审流程。' }) +
        field('进入阶段日期', 'stageSince', project.stageSince, { date: true, help: '不填就算不出停滞天数。' }) +
        field('负责人（我方）', 'owner', project.owner, { required: true }) +
        field('销售', 'sales', project.sales, {}) +
        field('客户业务决策人', 'execSponsor', project.execSponsor, {}) +
      '</div></section>';
  }

  /**
   * The project snapshot: where this project actually stands, at a glance.
   *
   * The complaint that drove this block was "通过这个表单看项目的时候，情况好像也看不太
   * 清楚". The banner showed a title and three pills; everything else a reader needs
   * to orient — how far G0 has got, whether a plan exists, how many rounds have
   * been recorded and how stale the newest one is — was either scattered across
   * sections or missing entirely.
   *
   * So this is a five-cell strip of FACTS, each a number plus its meaning. It is
   * read-only, sits directly under the banner, and is the same information the
   * dashboard's own card would show. Deliberately not editable: it is orientation,
   * not a task.
   */
  function snapshotCard(project) {
    var g0Filled = 0;
    for (var i = 0; i < DATA.g0Fields.length; i += 1) {
      if (text(project.gate0[DATA.g0Fields[i].key]).trim() !== '') g0Filled += 1;
    }
    if (text(project.techOwner).trim() !== '') g0Filled += 1;
    var g0Tone = g0Filled === 5 ? 'ok' : g0Filled === 0 ? 'warn' : 'info';

    var crit = project.plan.criteria.length;
    var scn = project.plan.scenarios.length;
    var planTone = (crit >= 2 && crit <= 3 && scn >= 3 && scn <= 5) ? 'ok'
      : (crit === 0 && scn === 0) ? 'muted' : 'warn';
    var planValue = crit === 0 && scn === 0
      ? '还没有计划'
      : '指标 ' + crit + ' · 场景 ' + scn;

    var rounds = project.existingProgressCount;
    var newest = project.history && project.history.length > 0 ? project.history[0] : null;
    var roundTone = rounds === 0 ? 'warn' : 'ok';
    var roundValue = rounds === 0 ? '还没有进展记录' : '最近 ' + (newest && newest.date ? newest.date : '无日期');

    var conclusion = text(project.gate0.conclusion).trim();
    var gateValue = conclusion === '' ? '待评审' : conclusion;
    var gateTone = conclusion === '通过' ? 'ok' : conclusion === '' ? 'muted' : 'warn';

    var amount = text(project.amountWan).trim();
    var amountValue = amount === '' ? '未填' : amount + ' 万';

    function cell(label, value, tone) {
      return '<div class="snap-cell" data-tone="' + tone + '">' +
        '<span class="snap-label">' + escapeHtml(label) + '</span>' +
        '<span class="snap-value">' + escapeHtml(value) + '</span></div>';
    }
    return '<section class="snapshot">' +
      cell('Gate 0 五必填', g0Filled + ' / 5', g0Tone) +
      cell('G0 评审结论', gateValue, gateTone) +
      cell('方案', planValue, planTone) +
      cell('进展', rounds + ' 轮 · ' + roundValue, roundTone) +
      cell('金额', amountValue, 'muted') +
      '</section>';
  }


  /**
   * "What is still missing" — and only that.
   *
   * This replaces a three-cell readiness band that restated the snapshot (G0 count,
   * plan counts) and added two clock hints. Restating the same numbers twice on one
   * screen is what makes a form feel noisy, so the snapshot owns the facts and this
   * strip owns the one thing facts cannot say: **what to do next.**
   *
   * Empty by design when nothing is actionable. A strip that always shows something
   * trains people to ignore it.
   */
  function missingCard(project, canEdit) {
    var editable = canEdit || {};
    var notes = [];

    if (text(project.stageSince).trim() === '' && (editable.identity || DATA.mode === 'blank')) {
      notes.push('「进入阶段日期」空着，台账算不出这个项目停滞了多久。');
    }

    var g0Filled = 0;
    for (var i = 0; i < DATA.g0Fields.length; i += 1) {
      if (text(project.gate0[DATA.g0Fields[i].key]).trim() !== '') g0Filled += 1;
    }
    if (text(project.techOwner).trim() !== '') g0Filled += 1;
    if (g0Filled < 5 && g0Filled > 0 && !editable.gate0) {
      // Not this page's job, but the person should know their round will land on a
      // project whose G0 is still incomplete.
      notes.push('Gate 0 还缺 ' + (5 - g0Filled) + ' 项，评审前要补齐。');
    }

    // A plan-stage form is the one place the 2–3 / 3–5 counts are actionable.
    if (editable.plan) {
      var crit = project.plan.criteria.length;
      var scn = project.plan.scenarios.length;
      if (crit < 2) notes.push('成功指标还差 ' + (2 - crit) + ' 条（要求 2–3）。');
      else if (crit > 3) notes.push('成功指标 ' + crit + ' 条，超过 3 条上限。');
      if (scn < 3) notes.push('验证场景还差 ' + (3 - scn) + ' 个（要求 3–5）。');
      else if (scn > 5) notes.push('验证场景 ' + scn + ' 个，超过 5 个上限。');
    }

    if (notes.length === 0) return '';
    var items = '';
    for (var n = 0; n < notes.length; n += 1) items += '<li>' + escapeHtml(notes[n]) + '</li>';
    return '<section class="missing"><span class="missing-label">还需要补</span>' +
      '<ul class="missing-list">' + items + '</ul></section>';
  }

  /**
   * The page: banner, snapshot, what-is-missing, then the fixed two columns.
   *
   * Commitments left (Gate 0, criteria, scenarios), the record right (identity,
   * plan narrative, risks, gates), next actions closing across both. That is the
   * same contract the detail page holds at every gate, so the person filling the
   * form and the person reading the dashboard are looking at the same layout.
   */
  function render() {
    var project = current();
    var title = project.name || project.pocId || '新建项目';
    var meta = [];
    if (project.pocId) meta.push('<span class="banner-id">' + escapeHtml(project.pocId) + '</span>');
    var org = [project.system, project.company, project.pocType].filter(function (item) { return text(item).trim() !== ''; });
    if (org.length) meta.push('<span>' + escapeHtml(org.join(' · ')) + '</span>');
    if (text(project.owner).trim() !== '') meta.push('<span>我方 Owner ' + escapeHtml(project.owner) + '</span>');

    var pills = '';
    if (text(project.stage).trim() !== '') pills += '<span class="pill pill-blue"><span class="pill-dot"></span>' + escapeHtml(project.stage) + '</span>';
    if (text(project.status).trim() !== '') pills += '<span class="pill pill-slate"><span class="pill-dot"></span>' + escapeHtml(project.status) + '</span>';
    var amount = text(project.amountWan).trim();
    if (amount !== '') pills += '<span class="pill pill-amber">' + escapeHtml(amount) + ' 万元</span>';

    var switcher = '';
    if (DATA.projects.length > 1) {
      switcher = '<div class="banner-step">第 ' + (state.active + 1) + ' / ' + DATA.projects.length + ' 个项目' +
        ' <select class="select" id="projectSwitch" style="width:auto;display:inline-block">';
      for (var i = 0; i < DATA.projects.length; i += 1) {
        switcher += '<option value="' + i + '"' + (i === state.active ? ' selected' : '') + '>' +
          escapeHtml(DATA.projects[i].name || DATA.projects[i].pocId || '未命名') + '</option>';
      }
      switcher += '</select></div>';
    }

    var banner = '<header class="banner">' +
      '<div class="banner-main">' +
        '<span class="banner-kicker">POC 信息收集 · ' + intentLabel() + '</span>' +
        '<h1 class="banner-title">' + escapeHtml(title) + '</h1>' +
        '<div class="banner-meta">' + meta.join('') + '</div>' +
      '</div>' +
      '<div class="banner-side">' +
        '<div class="banner-pills">' + pills + '</div>' +
        '<div class="banner-actions"><span class="save-status" id="saveStatus">已就绪</span>' +
          '<button type="button" class="btn" id="clearBtn">清空草稿</button></div>' +
      '</div>' +
      (switcher ? '<nav class="banner-nav">' + switcher + '</nav>' : '') +
      '</header>';

    // Which sections this page is about, resolved on the Host from the intent
    // and the project's stage. Everything outside 'editable' is shown collapsed
    // and read-only, so a colleague adding a progress round never scrolls past
    // twenty fields they are not editing.
    var plan_ = DATA.sections[state.active] || { editable: ['identity', 'gate0', 'plan', 'progress'], context: [] };
    var canEdit = {};
    for (var e = 0; e < plan_.editable.length; e += 1) canEdit[plan_.editable[e]] = true;

    var body = banner + snapshotCard(project) + missingCard(project, canEdit);

    // 'progress' intent is the one-screen case: the round and nothing else. The
    // history goes above it, because "what has already been reported" is the
    // context the new round is written against.
    if (DATA.intent === 'progress') {
      body += historyCard(project) + progressCard(project) + nextCard(project);
      byId('formBody').innerHTML = body;
      bindSwitch();
      markFooter();
      return;
    }

    var left = '';
    if (canEdit.gate0) left += g0Card(project); else left += contextGate0(project);

    // Read-only context is driven by the Host's resolved 'context' list, NOT by
    // "intent !== new". The old check was the bug behind "什么都能填、什么都能改":
    // a G0 supplement rendered a read-only PLAN block for a plan that does not
    // exist yet, which both invented a failure ("指标 0，要求 2–3") and told the
    // colleague they were looking at a stage the project has not reached.
    var showContext = {};
    for (var ci = 0; ci < plan_.context.length; ci += 1) showContext[plan_.context[ci]] = true;

    if (canEdit.plan) left += planCard(project);
    else if (showContext.plan) left += contextPlan(project);

    // The G4 conclusion is the SUBJECT of a G4 form, so it belongs in the wide
    // left column with the other commitments — not squeezed into the narrow record
    // column, which left most of the page empty and made the form look broken.
    if (canEdit.outcome) left += outcomeCard(project);

    var right = '';
    if (canEdit.identity) right += identityCard(project); else right += contextIdentity(project);
    if (canEdit.plan) right += planNarrative(project) + riskCard(project);
    if (canEdit.gate12) right += gateCard(project);

    if (left !== '') body += '<div class="columns"><div class="col">' + left + '</div><div class="col">' + right + '</div></div>';
    else if (right !== '') body += '<div class="columns"><div class="col"></div><div class="col">' + right + '</div></div>';

    // History sits immediately above the new round: read what happened, then say
    // what changed. A new project has no history, so the block is simply absent.
    body += historyCard(project);
    if (canEdit.progress || DATA.intent === 'new') body += progressCard(project) + nextCard(project);

    byId('formBody').innerHTML = body;
    bindSwitch();
    markFooter();
  }

  /** Wire the project switcher, if the batch has more than one project. */
  function bindSwitch() {
    var switchNode = byId('projectSwitch');
    if (!switchNode) return;
    switchNode.addEventListener('change', function (event) {
      state.active = Number(event.target.value);
      render();
    });
  }

  /** The intent, as a phrase for the banner and the footer. */
  function intentLabel() {
    return DATA.intent === 'new' ? '新建项目' : DATA.intent === 'progress' ? '记录进展' : '补充信息';
  }

  function markFooter() {
    var info = byId('footerInfo');
    if (!info) return;
    info.textContent = intentLabel() + ' · 共 ' + DATA.projects.length + ' 个项目 · 草稿自动保存在本机浏览器';
  }

  /**
   * Read-only Gate 0 summary: a completed stage is context, not a task.
   *
   * It used to render only "五必填 3 / 5" and a sentence — the actual answers were
   * never shown. That is the "看不清项目情况" complaint in its purest form: a
   * colleague supplementing the plan could not read what G0 had already decided,
   * and a reviewer opening the returned file could not check whether the new round
   * contradicted it. The answers are now shown in full, collapsed by default so
   * they inform without pushing the fields-to-fill down the page.
   */
  function contextGate0(project) {
    var present = 0;
    for (var i = 0; i < DATA.g0Fields.length; i += 1) {
      if (text(project.gate0[DATA.g0Fields[i].key]).trim() !== '') present += 1;
    }
    if (text(project.techOwner).trim() !== '') present += 1;
    var tone = present === 5 ? 'badge-ok' : 'badge-warn';

    var rows = '';
    for (var j = 0; j < DATA.g0Fields.length; j += 1) {
      rows += readPair(DATA.g0Fields[j].label, project.gate0[DATA.g0Fields[j].key]);
    }
    rows += readPair('客户技术责任人', project.techOwner);
    rows += readPair('主要竞争对手', project.gate0.competitor);
    rows += readPair('G0 评审结论', project.gate0.conclusion);
    rows += readPair('G0 评审人', project.gate0.reviewer);
    rows += readPair('评审日期', project.gate0.reviewed_at);

    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">Gate 0 · 值不值得做</h2>' +
        '<span class="sec-kicker"><span class="badge ' + tone + '">五必填 ' + present + ' / 5</span></span></header>' +
      '<details class="read-context"><summary>已完成的立项内容（只读，点开查看）</summary>' +
        '<dl class="read-grid">' + rows + '</dl></details>' +
      '<p class="sec-hint">要改 Gate 0，请单独导出「补充信息」表单并选择 G0 阶段。</p>' +
      '</section>';
  }

  /** One label/value row in a read-only context block. */
  function readPair(label, value) {
    var raw = text(value).trim();
    return '<div class="read-pair"><dt>' + escapeHtml(label) + '</dt>' +
      '<dd' + (raw === '' ? ' class="read-empty"' : '') + '>' + (raw === '' ? '未填写' : escapeHtml(raw)) + '</dd></div>';
  }

  /**
   * Read-only plan summary.
   *
   * Same defect as the Gate 0 block: it reported counts ("指标 0 · 场景 0") but not
   * the plan itself. A G3 colleague recording a proof needs to know which scenarios
   * and criteria the proof is supposed to attach to — that is the whole point of
   * the pickers below it. Counts alone told them nothing.
   */
  function contextPlan(project) {
    var crit = project.plan.criteria.length;
    var scn = project.plan.scenarios.length;
    var rows = '';
    rows += readPair('客户核心痛点', project.plan.customer_pain);
    rows += readPair('期望客户认可什么', project.plan.expected_recognition);
    rows += readPair('我方优势 / 赢点', project.plan.our_edge);
    rows += readPair('计划开始', project.plan.timeline_start);
    rows += readPair('计划结束', project.plan.timeline_end);
    rows += readPair('G1 结论', project.plan.gate1_conclusion);
    rows += readPair('G2 Ready', project.plan.gate2_ready);

    var lists = '';
    if (crit > 0) {
      var critItems = '';
      for (var c = 0; c < crit; c += 1) {
        var criterion = project.plan.criteria[c];
        critItems += '<li><span class="read-id">' + escapeHtml(criterion.id) + '</span>' +
          escapeHtml(criterion.name) +
          (text(criterion.target).trim() === '' ? '' : '<span class="read-dim"> · 目标 ' + escapeHtml(criterion.target) + '</span>') +
          '</li>';
      }
      lists += '<div class="read-list-block"><h3>关键成功指标</h3><ul class="read-list">' + critItems + '</ul></div>';
    }
    if (scn > 0) {
      var scnItems = '';
      for (var s = 0; s < scn; s += 1) {
        var scenario = project.plan.scenarios[s];
        scnItems += '<li><span class="read-id">' + escapeHtml(scenario.id) + '</span>' + escapeHtml(scenario.name) +
          (text(scenario.goal).trim() === '' ? '' : '<span class="read-dim"> · ' + escapeHtml(scenario.goal) + '</span>') +
          '</li>';
      }
      lists += '<div class="read-list-block"><h3>验证场景</h3><ul class="read-list">' + scnItems + '</ul></div>';
    }
    if (project.plan.risks.length > 0) {
      var riskItems = '';
      for (var r = 0; r < project.plan.risks.length; r += 1) {
        var risk = project.plan.risks[r];
        riskItems += '<li>' + escapeHtml(risk.name) +
          (text(risk.level).trim() === '' ? '' : '<span class="read-dim"> · ' + escapeHtml(risk.level) + '</span>') +
          (text(risk.mitigation).trim() === '' ? '' : '<span class="read-dim"> · 应对 ' + escapeHtml(risk.mitigation) + '</span>') +
          '</li>';
      }
      lists += '<div class="read-list-block"><h3>风险</h3><ul class="read-list">' + riskItems + '</ul></div>';
    }

    var body = rows + lists;
    if (text(body).trim() === '') {
      return '<section class="sec">' +
        '<header class="sec-head"><h2 class="sec-title">方案 · 只读</h2>' +
          '<span class="sec-kicker">还没有方案</span></header>' +
        '<p class="sec-hint">这个项目还没有填过计划。方案在 G1 阶段补充。</p></section>';
    }
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">方案 · 已确认内容</h2>' +
        '<span class="sec-kicker">指标 ' + crit + ' · 场景 ' + scn + '</span></header>' +
      '<details class="read-context"><summary>方案详情（只读，点开查看）</summary>' +
        '<dl class="read-grid">' + rows + '</dl>' + lists + '</details>' +
      '<p class="sec-hint">要改计划，请导出「补充信息」表单并选择 G1 / G2 阶段。</p>' +
      '</section>';
  }

  /**
   * The recorded rounds, newest first, read-only.
   *
   * The single most useful thing the form can show: what has already been
   * reported. Without it a colleague writes "已完成压测" for the third week
   * running, and the reviewer cannot tell what is new. Shown collapsed so it
   * informs the new entry without pushing it off screen.
   */
  function historyCard(project) {
    var history = project.history || [];
    if (history.length === 0) return '';
    var rows = '';
    for (var i = 0; i < history.length; i += 1) {
      var entry = history[i];
      var head = '<div class="hist-head">' +
        '<span class="hist-seq">#' + (entry.seq === null ? '?' : entry.seq) + '</span>' +
        '<span class="hist-date">' + escapeHtml(entry.date || '无日期') + '</span>' +
        (entry.type ? '<span class="hist-type">' + escapeHtml(entry.type) + '</span>' : '') +
        (entry.change ? '<span class="hist-change">' + escapeHtml(entry.change) + '</span>' : '') +
        (entry.completion ? '<span class="hist-pct">' + escapeHtml(entry.completion) + '</span>' : '') +
        '</div>';
      var body = '';
      if (entry.actual) body += '<p class="hist-actual">' + escapeHtml(entry.actual) + '</p>';
      var meta = [];
      if (entry.evidence.length) meta.push('证据 ' + entry.evidence.length + ' 条');
      if (entry.syncedWith) meta.push('同步 ' + entry.syncedWith);
      if (entry.recognition) meta.push('客户' + entry.recognition);
      if (entry.nextGoal) meta.push('下一步 ' + entry.nextGoal);
      if (entry.nextDeadline) meta.push('截止 ' + entry.nextDeadline);
      if (meta.length) body += '<p class="hist-meta">' + escapeHtml(meta.join(' · ')) + '</p>';
      rows += '<li class="hist-item">' + head + body + '</li>';
    }
    var more = project.existingProgressCount > history.length
      ? '<p class="sec-hint">仅显示最近 ' + history.length + ' 条，共 ' + project.existingProgressCount + ' 条。</p>'
      : '';
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">已有进展</h2>' +
        '<span class="sec-kicker">共 ' + project.existingProgressCount + ' 条 · 只读</span></header>' +
      '<details class="read-context" open><summary>最近 ' + history.length + ' 条（只读）</summary>' +
        '<ol class="hist-list">' + rows + '</ol></details>' + more +
      '</section>';
  }

  /** Read-only identity summary: the fields a colleague must not re-edit here. */
  function contextIdentity(project) {
    var bits = [];
    if (project.pocId) bits.push(project.pocId);
    if (project.system) bits.push(project.system);
    if (project.company) bits.push(project.company);
    if (project.owner) bits.push('Owner ' + project.owner);
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">基本信息 · 只读</h2></header>' +
      '<p class="sec-hint">' + escapeHtml(bits.join(' · ') || '未填写') + '</p>' +
      '</section>';
  }

  /** The G4 block: conclusion and conversion, which no other stage asks for. */
  function outcomeCard(project) {
    var o = project.outcome || {};
    return '<section class="sec">' +
      '<header class="sec-head"><h2 class="sec-title">结论与转化</h2>' +
        '<span class="sec-kicker">G4</span></header>' +
      '<p class="sec-hint">这一阶段要回答：证明了什么、客户认可什么、下一步业务动作是什么。</p>' +
      field('我们证明了什么', 'outcome.conclusion.proved', o.proved || '', { multiline: true }) +
      field('客户认可了什么', 'outcome.conclusion.recognized', o.recognized || '', { multiline: true }) +
      field('下一步业务动作', 'outcome.conclusion.next_business', o.next_business || '', { multiline: true }) +
      field('我方证据', 'outcome.our_proof', o.our_proof || '', { multiline: true }) +
      '<div class="grid-2">' +
        field('目标达成', 'outcome.achievement', o.achievement || '', { enum: DATA.enums.achievement }) +
        field('客户认可', 'outcome.customer_recognition', o.customer_recognition || '', { enum: DATA.enums.recognition }) +
        field('Next Milestone', 'outcome.business.milestone', o.milestone || '') +
        field('业务负责人', 'outcome.business.owner', o.businessOwner || '') +
        field('业务截止', 'outcome.business.deadline', o.businessDeadline || '', { date: true }) +
        field('业务状态', 'outcome.business.status', o.businessStatus || '', { enum: DATA.enums.businessStatus }) +
      '</div>' +
      field('总体结论', 'outcome.overall', o.overall || '', { multiline: true }) +
      '</section>';
  }

  function setPathOn(project, path, value) {
    // "progress.*" paths address the pending entry; everything else addresses
    // the project itself. Keeping the two apart is what stops a progress edit
    // from overwriting a plan field with a same-named key.
    if (path.indexOf('progress.') === 0) {
      setPath({ progress: project.progress }, path, value);
      return;
    }
    setPath(project, path, value);
  }

  function bind() {
    document.addEventListener('input', function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;
      var path = target.getAttribute('data-path');
      if (!path) return;
      setPathOn(current(), path, target.value);
      scheduleSave();
    });
    document.addEventListener('change', function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;
      // A picker checkbox writes an id LIST, not a scalar, so it takes its own
      // branch: routing it through setPath would replace the array with "on".
      var pickPath = target.getAttribute('data-pick');
      if (pickPath) {
        var entry = current().progress;
        var list = pickPath === 'progress.scenarioIds' ? entry.scenarioIds : entry.criteriaIds;
        var id = target.value;
        var at = list.indexOf(id);
        if (target.checked && at < 0) list.push(id);
        if (!target.checked && at >= 0) list.splice(at, 1);
        scheduleSave();
        return;
      }
      var path = target.getAttribute('data-path');
      if (!path) return;
      setPathOn(current(), path, target.value);
      scheduleSave();
      if (target.tagName === 'SELECT') render();
    });
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;
      var project = current();
      var addKey = target.getAttribute('data-add');
      var removeKey = target.getAttribute('data-remove');
      if (addKey) {
        if (addKey === 'criteria') project.plan.criteria.push(nextRow('cri', project.plan.criteria, { name: '', metric: '', baseline: '', target: '' }));
        if (addKey === 'scenarios') project.plan.scenarios.push(nextRow('scn', project.plan.scenarios, { name: '', goal: '' }));
        if (addKey === 'risks') project.plan.risks.push({ name: '', level: '', mitigation: '' });
        if (addKey === 'evidence') project.progress.evidence.push({ title: '', link: '', type: '' });
        scheduleSave();
        render();
        return;
      }
      if (removeKey) {
        var index = Number(target.getAttribute('data-index'));
        if (removeKey === 'criteria') project.plan.criteria.splice(index, 1);
        if (removeKey === 'scenarios') project.plan.scenarios.splice(index, 1);
        if (removeKey === 'risks') project.plan.risks.splice(index, 1);
        if (removeKey === 'evidence') project.progress.evidence.splice(index, 1);
        scheduleSave();
        render();
      }
    });
  }

  /**
   * Serialize one project to the v3 YAML shape.
   *
   * This mirrors the Host's own projectToYaml on purpose: the browser cannot call
   * it, and the file a colleague downloads has to be byte-compatible with what
   * the plugin's own generator would emit. The tests pin both sides to the same
   * output, so a drift shows up as a failure rather than as an unreadable file.
   */
  function toYaml(project) {
    var lines = [];
    function scalar(value) {
      if (value === null || value === undefined || value === '') return 'null';
      var raw = String(value);
      if (/[:#\\n"']/.test(raw) || raw !== raw.trim()) return JSON.stringify(raw);
      return raw;
    }
    function push(key, value, indent) {
      var pad = new Array(indent + 1).join(' ');
      lines.push(pad + key + ': ' + scalar(value));
    }
    push('poc_id', project.pocId, 0);
    push('name', project.name, 0);
    lines.push('org:');
    push('system', project.system, 2);
    push('company', project.company, 2);
    push('department', project.department, 2);
    push('amount_wan', project.amountWan === '' ? '' : Number(project.amountWan), 0);
    push('poc_type', project.pocType, 0);
    push('owner', project.owner, 0);
    push('sales', project.sales, 0);
    push('tech_owner', project.techOwner, 0);
    push('exec_sponsor', project.execSponsor, 0);
    push('stage', project.stage, 0);
    push('status', project.status, 0);
    push('stage_since', project.stageSince, 0);
    lines.push('gate0:');
    push('why_customer', project.gate0.why_customer, 2);
    push('why_us', project.gate0.why_us, 2);
    push('decision_chain', project.gate0.decision_chain, 2);
    push('post_poc_decision', project.gate0.post_poc_decision, 2);
    push('competitor', project.gate0.competitor, 2);
    lines.push('  review:');
    push('conclusion', project.gate0.conclusion, 4);
    push('reviewer', project.gate0.reviewer, 4);
    push('reviewed_at', project.gate0.reviewed_at, 4);
    lines.push('plan:');
    push('customer_pain', project.plan.customer_pain, 2);
    push('expected_recognition', project.plan.expected_recognition, 2);
    push('our_edge', project.plan.our_edge, 2);
    lines.push('  timeline:');
    push('start', project.plan.timeline_start, 4);
    push('end', project.plan.timeline_end, 4);
    lines.push('  gate1:');
    push('conclusion', project.plan.gate1_conclusion, 4);
    lines.push('  gate2:');
    push('ready', project.plan.gate2_ready, 4);
    var i;
    lines.push('  criteria:');
    var criteria = project.plan.criteria.filter(function (item) { return text(item.name).trim() !== ''; });
    if (criteria.length === 0) { lines[lines.length - 1] = '  criteria: []'; }
    for (i = 0; i < criteria.length; i += 1) {
      // v3.1: the id comes first because it is the join key evidence uses.
      lines.push('    - id: ' + scalar(criteria[i].id));
      lines.push('      name: ' + scalar(criteria[i].name));
      lines.push('      metric: ' + scalar(criteria[i].metric));
      lines.push('      baseline: ' + scalar(criteria[i].baseline));
      lines.push('      target: ' + scalar(criteria[i].target));
    }
    var scenarios = project.plan.scenarios.filter(function (item) { return text(item.name).trim() !== ''; });
    lines.push('  scenarios:' + (scenarios.length === 0 ? ' []' : ''));
    for (i = 0; i < scenarios.length; i += 1) {
      lines.push('    - id: ' + scalar(scenarios[i].id));
      lines.push('      name: ' + scalar(scenarios[i].name));
      lines.push('      goal: ' + scalar(scenarios[i].goal));
    }
    var risks = project.plan.risks.filter(function (item) { return text(item.name).trim() !== ''; });
    lines.push('  risks:' + (risks.length === 0 ? ' []' : ''));
    for (i = 0; i < risks.length; i += 1) {
      lines.push('    - name: ' + scalar(risks[i].name));
      lines.push('      level: ' + scalar(risks[i].level));
      lines.push('      mitigation: ' + scalar(risks[i].mitigation));
    }
    var entry = project.progress;
    var hasEntry = text(entry.date) !== '' || text(entry.actual) !== '' || text(entry.goal) !== '';
    lines.push('progress:' + (hasEntry ? '' : ' []'));
    if (hasEntry) {
      lines.push('  - seq: ' + (entry.seq === null ? 'null' : entry.seq));
      lines.push('    date: ' + scalar(entry.date));
      lines.push('    type: ' + scalar(entry.type));
      lines.push('    change: ' + scalar(entry.change));
      lines.push('    goal: ' + scalar(entry.goal));
      var scnIds = entry.scenarioIds.filter(function (item) { return text(item).trim() !== ''; });
      lines.push('    scenario_ids:' + (scnIds.length === 0 ? ' []' : ''));
      for (i = 0; i < scnIds.length; i += 1) lines.push('      - ' + scalar(scnIds[i]));
      var criIds = entry.criteriaIds.filter(function (item) { return text(item).trim() !== ''; });
      lines.push('    criteria_ids:' + (criIds.length === 0 ? ' []' : ''));
      for (i = 0; i < criIds.length; i += 1) lines.push('      - ' + scalar(criIds[i]));
      lines.push('    actual: ' + scalar(entry.actual));
      lines.push('    completion: ' + scalar(entry.completion));
      var evidence = entry.evidence.filter(function (item) { return text(item.title).trim() !== ''; });
      lines.push('    evidence:' + (evidence.length === 0 ? ' []' : ''));
      for (i = 0; i < evidence.length; i += 1) {
        lines.push('      - title: ' + scalar(evidence[i].title));
        lines.push('        link: ' + scalar(evidence[i].link));
        lines.push('        type: ' + scalar(evidence[i].type));
      }
      lines.push('    customer:');
      lines.push('      synced_with: ' + scalar(entry.customer.synced_with));
      lines.push('      feedback: ' + scalar(entry.customer.feedback));
      lines.push('      recognition: ' + scalar(entry.customer.recognition));
      lines.push('    gate3_1: ' + scalar(entry.gate3_1));
      lines.push('    gate3_2: ' + scalar(entry.gate3_2));
      lines.push('    next:');
      lines.push('      goal: ' + scalar(entry.next.goal));
      lines.push('      owner: ' + scalar(entry.next.owner));
      lines.push('      deadline: ' + scalar(entry.next.deadline));
    }
    return lines.join('\\n') + '\\n';
  }

  /**
   * Serialize the whole page to the change document a colleague sends back.
   *
   * This is the DOWNLOAD format. It carries only the fields a human filled in,
   * never the ledger's derived values: 'gate0.missing', 'gate0.complete',
   * 'priority' and the per-scenario statuses are computed by 'tools/derive.mjs'
   * and asserted by CI, so a form that wrote them would be either wrong or
   * overwritten. 'poc-submit' merges this object into the existing project file
   * and leaves everything else — including 'gate_decisions', existing progress
   * history and gate verdicts — untouched.
   */
  function toChangeDocument() {
    var changes = [];
    for (var i = 0; i < DATA.projects.length; i += 1) {
      changes.push(changeSetOf(DATA.projects[i]));
    }
    return {
      schemaVersion: DATA.schemaVersion,
      generatedAt: new Date().toISOString(),
      generatedBy: 'POC 信息收集表单 v3.1',
      intent: DATA.intent,
      changes: changes
    };
  }

  /** One project's human-authored fields, with '' collapsed to null. */
  function changeSetOf(project) {
    function orNull(value) {
      var raw = text(value).trim();
      return raw === '' ? null : raw;
    }
    // Only the blocks this page let the person edit, mirroring the Host's
    // projectToChangeSet. Everything else is emitted as null/empty so the merge
    // step skips it: the page pre-fills from the ledger, and re-sending a
    // pre-filled value would overwrite a field that changed after export.
    var plan_ = DATA.sections[state.active] || { editable: ['identity', 'gate0', 'plan', 'progress'] };
    var scope = {};
    for (var s = 0; s < plan_.editable.length; s += 1) scope[plan_.editable[s]] = true;
    if (scope.plan) scope.gate12 = true;
    function inScope(section) { return scope[section] === true; }

    // The seed snapshot: what these fields held when the form was generated.
    var base = (DATA.baseline || [])[state.active] || null;
    function seeded(path) {
      if (!base) return '';
      var parts = path.split('.');
      var node = base;
      for (var i = 0; i < parts.length; i += 1) {
        if (node === null || node === undefined) return '';
        node = node[parts[i]];
      }
      return text(node);
    }
    /**
     * A value, or null when it is unchanged or out of scope.
     *
     * This diff is the whole reason a returned form is safe to merge: it means
     * "only what this person edited", not "a snapshot of the project on the day
     * the form was exported".
     */
    function changed(section, path, value) {
      if (!inScope(section)) return null;
      var raw = text(value).trim();
      if (raw === '') return null;
      return raw === seeded(path).trim() ? null : raw;
    }
    /** A list, or null when it is unchanged as a whole. */
    function changedList(section, list, baseList) {
      if (!inScope(section)) return null;
      if (list.length === 0) return null;
      if (baseList && JSON.stringify(list) === JSON.stringify(baseList)) return null;
      return list;
    }

    var criteria = [];
    if (inScope('plan')) for (var i = 0; i < project.plan.criteria.length; i += 1) {
      var c = project.plan.criteria[i];
      if (text(c.name).trim() === '') continue;
      criteria.push({ id: orNull(c.id), name: text(c.name).trim(), metric: orNull(c.metric), baseline: orNull(c.baseline), target: orNull(c.target) });
    }
    var scenarios = [];
    if (inScope('plan')) for (var j = 0; j < project.plan.scenarios.length; j += 1) {
      var sc = project.plan.scenarios[j];
      if (text(sc.name).trim() === '') continue;
      scenarios.push({ id: orNull(sc.id), name: text(sc.name).trim(), goal: orNull(sc.goal) });
    }
    var risks = [];
    if (inScope('plan')) for (var k = 0; k < project.plan.risks.length; k += 1) {
      var r = project.plan.risks[k];
      if (text(r.name).trim() === '') continue;
      risks.push({ name: text(r.name).trim(), level: orNull(r.level), mitigation: orNull(r.mitigation) });
    }
    var basePlan = base && base.plan ? base.plan : null;
    var baseCriteria = basePlan ? basePlan.criteria.filter(function (x) { return text(x.name).trim() !== ''; }).map(function (x) {
      return { id: orNull(x.id), name: text(x.name).trim(), metric: orNull(x.metric), baseline: orNull(x.baseline), target: orNull(x.target) };
    }) : null;
    var baseScenarios = basePlan ? basePlan.scenarios.filter(function (x) { return text(x.name).trim() !== ''; }).map(function (x) {
      return { id: orNull(x.id), name: text(x.name).trim(), goal: orNull(x.goal) };
    }) : null;
    var baseRisks = basePlan ? basePlan.risks.filter(function (x) { return text(x.name).trim() !== ''; }).map(function (x) {
      return { name: text(x.name).trim(), level: orNull(x.level), mitigation: orNull(x.mitigation) };
    }) : null;

    var rounds = [];
    var entry = project.progress;
    var touched = text(entry.date).trim() !== '' || text(entry.actual).trim() !== '' || text(entry.goal).trim() !== '';
    if (inScope('progress') && touched) rounds.push(progressEntryOf(entry));
    var outcome = project.outcome || {};
    var amount = text(project.amountWan).trim();
    return {
      schema_version: DATA.schemaVersion,
      poc_id: text(project.pocId).trim(),
      name: changed('identity', 'name', project.name) || '',
      org: {
        system: changed('identity', 'system', project.system),
        company: changed('identity', 'company', project.company),
        department: changed('identity', 'department', project.department)
      },
      amount_wan: (inScope('identity') && amount !== '' && amount !== seeded('amountWan')) ? Number(amount) : null,
      poc_type: changed('identity', 'pocType', project.pocType),
      owner: changed('identity', 'owner', project.owner),
      sales: changed('identity', 'sales', project.sales),
      tech_owner: changed('identity', 'techOwner', project.techOwner),
      exec_sponsor: changed('identity', 'execSponsor', project.execSponsor),
      stage: project.stage,
      status: project.status,
      stage_since: changed('identity', 'stageSince', project.stageSince),
      gate0: {
        why_customer: changed('gate0', 'gate0.why_customer', project.gate0.why_customer),
        why_us: changed('gate0', 'gate0.why_us', project.gate0.why_us),
        decision_chain: changed('gate0', 'gate0.decision_chain', project.gate0.decision_chain),
        post_poc_decision: changed('gate0', 'gate0.post_poc_decision', project.gate0.post_poc_decision),
        competitor: changed('gate0', 'gate0.competitor', project.gate0.competitor),
        review: {
          conclusion: changed('gate0', 'gate0.conclusion', project.gate0.conclusion),
          reviewer: changed('gate0', 'gate0.reviewer', project.gate0.reviewer),
          reviewed_at: changed('gate0', 'gate0.reviewed_at', project.gate0.reviewed_at)
        }
      },
      plan: {
        customer_pain: changed('plan', 'plan.customer_pain', project.plan.customer_pain),
        expected_recognition: changed('plan', 'plan.expected_recognition', project.plan.expected_recognition),
        our_edge: changed('plan', 'plan.our_edge', project.plan.our_edge),
        criteria: changedList('plan', criteria, baseCriteria) || [],
        scenarios: changedList('plan', scenarios, baseScenarios) || [],
        risks: changedList('plan', risks, baseRisks) || [],
        timeline: {
          start: changed('plan', 'plan.timeline_start', project.plan.timeline_start),
          end: changed('plan', 'plan.timeline_end', project.plan.timeline_end)
        },
        gate1: { conclusion: changed('gate12', 'plan.gate1_conclusion', project.plan.gate1_conclusion) },
        gate2: { ready: changed('gate12', 'plan.gate2_ready', project.plan.gate2_ready) }
      },
      // The G4 conclusion block. It was absent from this serializer while the page
      // could edit it, so every G4 answer was dropped on download.
      outcome: {
        achievement: changed('outcome', 'outcome.achievement', outcome.achievement),
        customer_recognition: changed('outcome', 'outcome.customer_recognition', outcome.customer_recognition),
        our_proof: changed('outcome', 'outcome.our_proof', outcome.our_proof),
        remaining_risks: null,
        conclusion: {
          proved: changed('outcome', 'outcome.proved', outcome.proved),
          recognized: changed('outcome', 'outcome.recognized', outcome.recognized),
          next_business: changed('outcome', 'outcome.next_business', outcome.next_business)
        },
        business: {
          milestone: changed('outcome', 'outcome.milestone', outcome.milestone),
          owner: changed('outcome', 'outcome.businessOwner', outcome.businessOwner),
          deadline: changed('outcome', 'outcome.businessDeadline', outcome.businessDeadline),
          status: changed('outcome', 'outcome.businessStatus', outcome.businessStatus)
        },
        overall: changed('outcome', 'outcome.overall', outcome.overall)
      },
      progress: rounds
    };
  }

  /** One appended round, in the ledger's v3.1 shape. */
  function progressEntryOf(entry) {
    function orNull(value) {
      var raw = text(value).trim();
      return raw === '' ? null : raw;
    }
    var evidence = [];
    for (var i = 0; i < entry.evidence.length; i += 1) {
      var item = entry.evidence[i];
      if (text(item.title).trim() === '') continue;
      evidence.push({ title: text(item.title).trim(), link: orNull(item.link), type: orNull(item.type) });
    }
    var scnIds = [];
    for (var j = 0; j < entry.scenarioIds.length; j += 1) if (text(entry.scenarioIds[j]).trim() !== '') scnIds.push(text(entry.scenarioIds[j]).trim());
    var criIds = [];
    for (var k = 0; k < entry.criteriaIds.length; k += 1) if (text(entry.criteriaIds[k]).trim() !== '') criIds.push(text(entry.criteriaIds[k]).trim());
    return {
      date: orNull(entry.date),
      type: orNull(entry.type),
      change: orNull(entry.change),
      goal: orNull(entry.goal),
      scenario_ids: scnIds,
      criteria_ids: criIds,
      actual: orNull(entry.actual),
      completion: orNull(entry.completion),
      evidence: evidence,
      customer: { synced_with: orNull(entry.customer.synced_with), feedback: orNull(entry.customer.feedback), recognition: orNull(entry.customer.recognition) },
      gate3_1: orNull(entry.gate3_1),
      gate3_2: orNull(entry.gate3_2),
      next: { goal: orNull(entry.next.goal), owner: orNull(entry.next.owner), deadline: orNull(entry.next.deadline) }
    };
  }

  function previewYaml() {
    var node = byId('yamlPreview');
    if (!node) return;
    node.textContent = JSON.stringify(toChangeDocument(), null, 2);
    node.hidden = false;
    // Guarded: scrollIntoView is absent in jsdom and in a few older embedded
    // webviews. Scrolling is a convenience, so a missing implementation must not
    // throw after the preview has already been rendered.
    if (node.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * The bare-minimum required fields, checked before a download.
   *
   * ## The bug this replaces
   *
   * The list was unconditional: it demanded 'progress.date', 'progress.change',
   * 'progress.actual' and 'progress.next.goal' on EVERY form. But a G0/G1
   * supplement form does not render the progress block at all, so those four
   * values are empty by construction and no amount of filling anything on the
   * page could satisfy them. Every supplement, new and batch form refused to
   * download, forever, with a toast that named no field — the form was a dead end.
   *
   * The rule is now: **only demand what this page actually asks for.** The scope
   * comes from the same 'sections' resolution the renderer used, so the validator
   * cannot drift from what is on screen. Returns the list of missing labels so the
   * toast can name them instead of saying "还有必填项没填".
   */
  function validateRequired() {
    var project = current();
    var plan_ = DATA.sections[state.active] || { editable: ['identity', 'gate0', 'plan', 'progress'] };
    var scope = {};
    for (var s = 0; s < plan_.editable.length; s += 1) scope[plan_.editable[s]] = true;
    // 'gate12' is the plan's verdict block; it rides with 'plan' on the page.
    if (scope.plan) scope.gate12 = true;

    var required = [];
    if (scope.identity) {
      required.push(['name', '项目名称']);
      required.push(['owner', '负责人（我方）']);
      required.push(['techOwner', '客户技术责任人']);
    }
    if (scope.progress) {
      required.push(['progress.date', '进展日期']);
      // v3.1 makes 'change' mandatory: a round that does not say what moved is
      // how a timeline decays into "communicated with customer".
      required.push(['progress.change', '这一次什么变了']);
      required.push(['progress.actual', '实际结果']);
      required.push(['progress.next.goal', '下一步目标']);
    }

    var missing = [];
    for (var i = 0; i < required.length; i += 1) {
      var key = required[i][0];
      var label = required[i][1];
      var value = text(pathValue(project, key)).trim();
      var node = document.querySelector('[data-field="' + key + '"]');
      if (node) node.className = value === '' ? 'field has-error' : 'field';
      if (value === '') missing.push(label);
    }
    validateRequired.missing = missing;
    return missing.length === 0;
  }

  /** Read a dotted path off the project, treating 'progress.*' as the new round. */
  function pathValue(project, path) {
    var parts = path.split('.');
    var node = project;
    for (var i = 0; i < parts.length; i += 1) {
      if (node === null || node === undefined) return '';
      node = node[parts[i]];
    }
    return node;
  }

  function downloadYaml() {
    if (!validateRequired()) {
      // Name the fields: a toast that says only "还有必填项没填" leaves the person
      // hunting a long page for a red border that may be below the fold.
      var missing = validateRequired.missing || [];
      showToast('还有 ' + missing.length + ' 项必填没填：' + missing.join('、'));
      var first = document.querySelector('.field.has-error');
      if (first && first.scrollIntoView) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    var stamp = DATA.today.replace(/-/g, '');
    var document_ = toChangeDocument();
    var blob = new Blob([JSON.stringify(document_, null, 2)], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    // One file for the whole batch: the merge step keys off 'changes[]', and a
    // batch is what the colleague was handed.
    anchor.download = 'poc-changes-' + stamp + '.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    showToast('已下载 poc-changes-' + stamp + '.json');
    save(true);
  }

  /**
   * Download the HTML itself, with the answers embedded, so it can be sent back.
   *
   * ## Why this exists
   *
   * The documented workflow is "colleague fills the HTML, sends it to me on WeChat,
   * I hand it to DSH". But the form's answers live only in 'localStorage' and in
   * the downloaded JSON — the HTML file on disk never changes, so forwarding the
   * file forwarded a blank form. The colleague had to find, download and attach a
   * second file, and the person receiving it needed a JSON viewer to read it.
   *
   * So this writes a **copy of this page** whose 'RETURN_DATA' block carries the
   * change set. The recipient opens it in any browser and reads the answers as
   * formatted HTML, while 'readReturnDocument' parses the same block
   * programmatically. One file, no second download, no tooling on either end.
   *
   * The embedded block is inert data, never executed: it is parsed with
   * 'JSON.parse' on a string, and the page renders it with 'textContent'.
   */
  function downloadReturnFile() {
    if (!validateRequired()) {
      var missing = validateRequired.missing || [];
      showToast('还有 ' + missing.length + ' 项必填没填：' + missing.join('、'));
      var first = document.querySelector('.field.has-error');
      if (first && first.scrollIntoView) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    var document_ = toChangeDocument();
    var payload = JSON.stringify(document_);
    // Escape the three sequences that can break out of a script element or a
    // template placeholder, then embed.
    var safe = payload
      .replace(/</g, '\\\\u003c')
      .replace(/>/g, '\\\\u003e')
      .replace(/\\u2028/g, '\\\\u2028')
      .replace(/\\u2029/g, '\\\\u2029');
    var page = buildReturnPage(safe, document_);
    var stamp = DATA.today.replace(/-/g, '');
    var blob = new Blob([page], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'poc-return-' + stamp + '.html';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    showToast('已生成回传文件，请通过企业微信发给发起人');
    save(true);
  }

  /**
   * The self-contained page a colleague sends back.
   *
   * Deliberately plain: it is a READ-ONLY report, not another form. It carries the
   * same visual tokens so it reads as the same product, and it repeats the exact
   * change-set JSON in a machine-readable block for the Host to parse.
   */
  function buildReturnPage(safeJson, document_) {
    var rows = '';
    var intentText = DATA.intent === 'new' ? '新建项目' : DATA.intent === 'progress' ? '记录进展' : '补充信息';
    for (var i = 0; i < document_.changes.length; i += 1) {
      var change = document_.changes[i];
      // The change set only carries what the colleague could EDIT, so a
      // progress-intent change has no project name and no Gate 0. The reader still
      // needs the project's identity and context to make sense of the round, so
      // the source project is merged back in for DISPLAY ONLY. The embedded JSON
      // block stays the untouched change set — that is what the Host parses, and
      // re-sending a pre-filled field would overwrite a newer ledger value.
      var source = null;
      for (var si = 0; si < DATA.projects.length; si += 1) {
        if (DATA.projects[si].pocId === change.poc_id) { source = DATA.projects[si]; break; }
      }
      var shown = mergeForDisplay(change, source);
      var block = '';
      block += returnSection('项目身份', [
        ['项目编号', shown.poc_id], ['项目名称', shown.name],
        ['体系', shown.org && shown.org.system], ['客户公司', shown.org && shown.org.company],
        ['部门', shown.org && shown.org.department],
        ['预计金额（万元）', shown.amount_wan === null || shown.amount_wan === undefined ? '' : String(shown.amount_wan)],
        ['项目类型', shown.poc_type], ['阶段', shown.stage], ['状态', shown.status],
        ['负责人（我方）', shown.owner], ['销售', shown.sales],
        ['客户技术责任人', shown.tech_owner], ['客户业务决策人', shown.exec_sponsor]
      ]);
      var g0 = shown.gate0 || {};
      block += returnSection('Gate 0 · 值不值得做', [
        ['客户为什么要测', g0.why_customer], ['我们为什么测', g0.why_us],
        ['项目流程 / 决策链', g0.decision_chain], ['测完后客户会做什么决定', g0.post_poc_decision],
        ['主要竞争对手', g0.competitor],
        ['G0 评审结论', g0.review && g0.review.conclusion],
        ['G0 评审人', g0.review && g0.review.reviewer],
        ['评审日期', g0.review && g0.review.reviewed_at]
      ]);
      var plan = shown.plan || {};
      block += returnSection('方案 · 客户痛点与赢点', [
        ['客户核心痛点', plan.customer_pain], ['期望客户认可什么', plan.expected_recognition],
        ['我方优势 / 赢点', plan.our_edge]
      ]);
      if (plan.criteria && plan.criteria.length) {
        var critRows = '';
        for (var c = 0; c < plan.criteria.length; c += 1) {
          var cri = plan.criteria[c];
          critRows += '<li><b>' + escapeHtml(cri.id || '') + '</b> ' + escapeHtml(cri.name || '') +
            (cri.target ? '<span class="ret-dim"> · 目标 ' + escapeHtml(cri.target) + '</span>' : '') + '</li>';
        }
        block += '<div class="ret-sec"><h2>关键成功指标</h2><ul class="ret-list">' + critRows + '</ul></div>';
      }
      if (plan.scenarios && plan.scenarios.length) {
        var scnRows = '';
        for (var sc = 0; sc < plan.scenarios.length; sc += 1) {
          var scn = plan.scenarios[sc];
          scnRows += '<li><b>' + escapeHtml(scn.id || '') + '</b> ' + escapeHtml(scn.name || '') +
            (scn.goal ? '<span class="ret-dim"> · ' + escapeHtml(scn.goal) + '</span>' : '') + '</li>';
        }
        block += '<div class="ret-sec"><h2>验证场景</h2><ul class="ret-list">' + scnRows + '</ul></div>';
      }
      if (plan.risks && plan.risks.length) {
        var riskRows = '';
        for (var r = 0; r < plan.risks.length; r += 1) {
          riskRows += '<li>' + escapeHtml(plan.risks[r].name || '') +
            (plan.risks[r].mitigation ? '<span class="ret-dim"> · 应对 ' + escapeHtml(plan.risks[r].mitigation) + '</span>' : '') + '</li>';
        }
        block += '<div class="ret-sec"><h2>风险</h2><ul class="ret-list">' + riskRows + '</ul></div>';
      }
      block += returnSection('Gate 结论与时间', [
        ['计划开始', plan.timeline && plan.timeline.start], ['计划结束', plan.timeline && plan.timeline.end],
        ['G1 结论', plan.gate1 && plan.gate1.conclusion], ['G2 Ready', plan.gate2 && plan.gate2.ready]
      ]);
      for (var p = 0; p < change.progress.length; p += 1) {
        var entry = change.progress[p];
        var cust = entry.customer || {};
        var nxt = entry.next || {};
        var ev = '';
        if (entry.evidence && entry.evidence.length) {
          for (var e = 0; e < entry.evidence.length; e += 1) {
            ev += (ev ? '、' : '') + escapeHtml(entry.evidence[e].title || '');
          }
        }
        block += '<div class="ret-sec ret-new"><h2>本次新增进展<span class="ret-tag">新</span></h2><dl>' +
          returnPair('日期', entry.date) + returnPair('类型', entry.type) +
          returnPair('这一次什么变了', entry.change) + returnPair('目标', entry.goal) +
          returnPair('实际结果', entry.actual) + returnPair('完成度', entry.completion) +
          returnPair('证据', ev) + returnPair('同步对象', cust.synced_with) +
          returnPair('客户反馈', cust.feedback) + returnPair('客户认可度', cust.recognition) +
          returnPair('G3-1', entry.gate3_1) + returnPair('G3-2', entry.gate3_2) +
          returnPair('下一步目标', nxt.goal) + returnPair('下一步负责人', nxt.owner) +
          returnPair('下一步截止', nxt.deadline) + '</dl></div>';
      }
      var o = shown.outcome || {};
      var oc = o.conclusion || {};
      var ob = o.business || {};
      block += returnSection('结论与转化', [
        ['目标达成', o.achievement], ['客户认可', o.customer_recognition],
        ['我方证据', o.our_proof], ['我们证明了什么', oc.proved],
        ['客户认可了什么', oc.recognized], ['下一步业务动作', oc.next_business],
        ['Next Milestone', ob.milestone], ['里程碑负责人', ob.owner],
        ['里程碑截止', ob.deadline], ['里程碑状态', ob.status],
        ['POC 总体结论', o.overall]
      ]);
      rows += '<article class="ret-card">' +
        '<header class="ret-head"><h1>' + escapeHtml(shown.name || shown.poc_id || '未命名项目') + '</h1>' +
        '<div class="ret-meta">' + escapeHtml(shown.poc_id || '') +
          (shown.org && shown.org.company ? ' · ' + escapeHtml(shown.org.company) : '') +
          (shown.stage ? ' · ' + escapeHtml(shown.stage) : '') +
          (shown.poc_type ? ' · ' + escapeHtml(shown.poc_type) : '') + '</div></header>' +
        block + '</article>';
    }
    return '<!DOCTYPE html>\\n<html lang="zh-CN">\\n<head>\\n<meta charset="UTF-8">\\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\\n' +
      '<title>POC 回传 · ' + escapeHtml(intentText) + '</title>\\n<style>' + DATA.returnCss + '</style>\\n</head>\\n<body>\\n' +
      '<div class="ret-shell">' +
      '<div class="ret-note">这是组员填写的 POC 回传文件，内容只读。' +
        '把整个文件（或下载的 .json）通过企业微信发给发起人，由他交给 DSH 合并进台账。</div>' +
      '<div class="ret-bar"><span>' + escapeHtml(intentText) + ' · ' + document_.changes.length + ' 个项目</span>' +
        '<span class="ret-dim">生成于 ' + escapeHtml(readableTime(document_.generatedAt)) + '</span></div>' +
      rows + '</div>\\n' +
      // The closing tag is written as '<\\/script>': this string is itself embedded
      // inside a <script> element, so a literal closing tag here would terminate
      // the generated page's script and dump the rest of the code as text.
      '<script type="application/json" id="poc-return-data">' + safeJson + '<\\/script>\\n' +
      '</body>\\n</html>\\n';
  }

  /**
   * Merge a change set over its source project, for DISPLAY in the return page.
   *
   * The change set is deliberately narrow (only what the colleague could edit), so
   * a progress-only return carries no project name, no Gate 0 and no plan. Showing
   * that file as-is produced a report titled "POC-001" with an almost empty body —
   * the reader could not tell which project it was about.
   *
   * So the untouched project is merged underneath for display. The embedded JSON
   * block is NOT merged: it stays the exact change set, because that is what the
   * Host applies and a re-sent pre-filled field would revert a newer ledger value.
   */
  function mergeForDisplay(change, source) {
    if (!source) return change;
    function pick(changeValue, sourceValue) {
      return changeValue === null || changeValue === undefined || changeValue === '' ? sourceValue : changeValue;
    }
    var plan = change.plan || {};
    var srcPlan = source.plan || {};
    var outcome = change.outcome || {};
    var srcOutcome = source.outcome || {};
    return {
      poc_id: change.poc_id,
      name: pick(change.name, source.name),
      org: {
        system: pick(change.org && change.org.system, source.system),
        company: pick(change.org && change.org.company, source.company),
        department: pick(change.org && change.org.department, source.department)
      },
      amount_wan: pick(change.amount_wan, source.amountWan === '' ? null : source.amountWan),
      poc_type: pick(change.poc_type, source.pocType),
      owner: pick(change.owner, source.owner),
      sales: pick(change.sales, source.sales),
      tech_owner: pick(change.tech_owner, source.techOwner),
      exec_sponsor: pick(change.exec_sponsor, source.execSponsor),
      stage: pick(change.stage, source.stage),
      status: pick(change.status, source.status),
      gate0: {
        why_customer: pick(change.gate0 && change.gate0.why_customer, source.gate0.why_customer),
        why_us: pick(change.gate0 && change.gate0.why_us, source.gate0.why_us),
        decision_chain: pick(change.gate0 && change.gate0.decision_chain, source.gate0.decision_chain),
        post_poc_decision: pick(change.gate0 && change.gate0.post_poc_decision, source.gate0.post_poc_decision),
        competitor: pick(change.gate0 && change.gate0.competitor, source.gate0.competitor),
        review: {
          conclusion: pick(change.gate0 && change.gate0.review && change.gate0.review.conclusion, source.gate0.conclusion),
          reviewer: pick(change.gate0 && change.gate0.review && change.gate0.review.reviewer, source.gate0.reviewer),
          reviewed_at: pick(change.gate0 && change.gate0.review && change.gate0.review.reviewed_at, source.gate0.reviewed_at)
        }
      },
      plan: {
        customer_pain: pick(plan.customer_pain, srcPlan.customer_pain),
        expected_recognition: pick(plan.expected_recognition, srcPlan.expected_recognition),
        our_edge: pick(plan.our_edge, srcPlan.our_edge),
        criteria: (plan.criteria && plan.criteria.length) ? plan.criteria : srcPlan.criteria,
        scenarios: (plan.scenarios && plan.scenarios.length) ? plan.scenarios : srcPlan.scenarios,
        risks: (plan.risks && plan.risks.length) ? plan.risks : srcPlan.risks,
        timeline: {
          start: pick(plan.timeline && plan.timeline.start, srcPlan.timeline_start),
          end: pick(plan.timeline && plan.timeline.end, srcPlan.timeline_end)
        },
        gate1: { conclusion: pick(plan.gate1 && plan.gate1.conclusion, srcPlan.gate1_conclusion) },
        gate2: { ready: pick(plan.gate2 && plan.gate2.ready, srcPlan.gate2_ready) }
      },
      outcome: {
        achievement: pick(outcome.achievement, srcOutcome.achievement),
        customer_recognition: pick(outcome.customer_recognition, srcOutcome.customer_recognition),
        our_proof: pick(outcome.our_proof, srcOutcome.our_proof),
        remaining_risks: pick(outcome.remaining_risks, srcOutcome.remaining_risks),
        conclusion: {
          proved: pick(outcome.conclusion && outcome.conclusion.proved, srcOutcome.proved),
          recognized: pick(outcome.conclusion && outcome.conclusion.recognized, srcOutcome.recognized),
          next_business: pick(outcome.conclusion && outcome.conclusion.next_business, srcOutcome.next_business)
        },
        business: {
          milestone: pick(outcome.business && outcome.business.milestone, srcOutcome.milestone),
          owner: pick(outcome.business && outcome.business.owner, srcOutcome.businessOwner),
          deadline: pick(outcome.business && outcome.business.deadline, srcOutcome.businessDeadline),
          status: pick(outcome.business && outcome.business.status, srcOutcome.businessStatus)
        },
        overall: pick(outcome.overall, srcOutcome.overall)
      },
      progress: change.progress
    };
  }

  /** An ISO stamp as a local, readable time: "2026-11-20 18:08". */
  function readableTime(iso) {
    var raw = text(iso);
    var at = raw.indexOf('T');
    if (at < 0) return raw;
    return raw.slice(0, at) + ' ' + raw.slice(at + 1, at + 6);
  }

  function returnPair(label, value) {
    var raw = text(value).trim();
    if (raw === '') return '';
    return '<div class="ret-pair"><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(raw) + '</dd></div>';
  }

  function returnSection(title, pairs) {
    var body = '';
    for (var i = 0; i < pairs.length; i += 1) body += returnPair(pairs[i][0], pairs[i][1]);
    if (body === '') return '';
    return '<div class="ret-sec"><h2>' + escapeHtml(title) + '</h2><dl>' + body + '</dl></div>';
  }


  function initState() {
    storageAvailable = probeStorage();
    if (!storageAvailable) {
      var notice = byId('draftNotice');
      if (notice) {
        notice.textContent = '这个浏览器禁用了本地存储，草稿不会自动保存，请填完立即下载。';
        notice.hidden = false;
      }
    }
    var draft = loadDraft();
    if (draft) {
      DATA.projects = draft;
      var restore = byId('restoreNotice');
      if (restore) restore.hidden = false;
    }
  }

  initState();
  bind();
  render();
  if (byId('clearBtn')) byId('clearBtn').addEventListener('click', clearDraft);
  if (byId('previewBtn')) byId('previewBtn').addEventListener('click', previewYaml);
  if (byId('downloadBtn')) byId('downloadBtn').addEventListener('click', downloadYaml);
  if (byId('returnBtn')) byId('returnBtn').addEventListener('click', downloadReturnFile);
  setInterval(function () { save(true); }, 30000);
  window.addEventListener('beforeunload', function () { save(true); });
`;
/** The blank project, as the generated script builds it. */
function blankProjectPayload() {
    return blankProject();
}
