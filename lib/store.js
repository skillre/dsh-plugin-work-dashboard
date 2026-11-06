/**
 * Read-only ledger store (v3).
 *
 * The store turns the cloned `projects/*.yaml` files into the JSON shapes the
 * Client renders. It never writes: the repository is a read-only copy and the
 * real data source is GitHub.
 *
 * v3 is **progress-centred**: a project's state is its identity + gate0 + plan +
 * progress stream + outcome. The summary therefore reads `gate0` for the G0
 * verdict, `plan` for focus, `progress` for activity, and `outcome` for the four
 * dimensions — there is no separate `result` block to reconcile.
 *
 * Parsing uses `yaml`'s `parse`. One unreadable or unparsable file is reported
 * as a warning and skipped: a single bad hand-edit must not blank the whole
 * board.
 */
import YAML from 'yaml';
import { daysSince, lastProgressDate, latestProgress, normalizeStage, numberOrNull, readDimensions, scanGaps, text, } from './gap.js';
import { RepoError } from './repo.js';
/** The Host-side view model builder. */
export class PocStore {
    cache;
    options;
    constructor(cache, options) {
        this.cache = cache;
        this.options = options;
    }
    /** Load every project file; one bad file becomes a warning, not a failure. */
    async load() {
        const files = await this.cache.projectFiles();
        const records = [];
        const warnings = [];
        const seen = new Map();
        for (const file of files) {
            let source;
            try {
                source = await this.cache.readProject(file);
            }
            catch (error) {
                warnings.push(error instanceof RepoError ? error.message : `Cannot read ${file}.`);
                continue;
            }
            let parsed;
            try {
                parsed = YAML.parse(source);
            }
            catch (error) {
                warnings.push(`${basename(file)}: ${error instanceof Error ? error.message.split('\n')[0] : 'invalid YAML'}`);
                continue;
            }
            if (parsed === null || parsed === undefined) {
                warnings.push(`${basename(file)}: the file is empty.`);
                continue;
            }
            if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                warnings.push(`${basename(file)}: the document is not a YAML mapping.`);
                continue;
            }
            const record = parsed;
            const id = text(record.poc_id);
            if (id === '') {
                record.poc_id = basename(file).replace(/\.ya?ml$/, '');
                warnings.push(`${basename(file)}: poc_id is missing; using the file name instead.`);
            }
            const finalId = text(record.poc_id);
            const previous = seen.get(finalId);
            if (previous !== undefined) {
                warnings.push(`${basename(file)}: poc_id ${finalId} is already defined by ${previous}; both rows are shown.`);
            }
            else {
                seen.set(finalId, basename(file));
            }
            records.push(record);
        }
        return { records, warnings };
    }
    /** The overview snapshot; never throws for a missing cache, it reports it. */
    async snapshot() {
        const cacheReady = await this.cache.isReady();
        const repository = this.cache.repository;
        if (!cacheReady) {
            return {
                cacheReady: false,
                repository,
                fetchedAt: this.cache.lastFetchedAt,
                cachePath: this.cache.repoPath,
                projects: [],
                stats: emptyStats(),
                gaps: [],
                analysis: emptyAnalysis(),
                warnings: [],
            };
        }
        const { records, warnings } = await this.load();
        const now = this.options.now();
        const projects = records.map((record) => summarize(record, now, this.options.stallDays));
        const gaps = [];
        for (const record of records) {
            gaps.push(...scanGaps(record, { now, stallDays: this.options.stallDays }));
        }
        gaps.sort(compareGaps);
        const sorted = projects.sort(compareProjects);
        return {
            cacheReady: true,
            repository,
            fetchedAt: this.cache.lastFetchedAt,
            cachePath: this.cache.repoPath,
            projects: sorted,
            stats: computeStats(sorted),
            gaps,
            analysis: analyse(sorted, gaps),
            warnings,
        };
    }
    /** One project's full record; `null` when no file declares that id. */
    async detail(pocId) {
        if (!(await this.cache.isReady()))
            return null;
        const { records } = await this.load();
        const record = records.find((candidate) => text(candidate.poc_id) === pocId);
        if (record === undefined)
            return null;
        const now = this.options.now();
        const summary = summarize(record, now, this.options.stallDays);
        const gate0 = record.gate0 ?? {};
        const plan = record.plan ?? {};
        const outcome = record.outcome ?? {};
        const missing = Array.isArray(gate0.missing) ? gate0.missing.map(text).filter((item) => item !== '') : [];
        return {
            summary,
            org: {
                system: text((record.org ?? {}).system),
                company: text((record.org ?? {}).company),
                department: text((record.org ?? {}).department),
            },
            sales: text(record.sales),
            execSponsor: text(record.exec_sponsor),
            gate0: {
                whyCustomer: text(gate0.why_customer),
                whyUs: text(gate0.why_us),
                decisionChain: text(gate0.decision_chain),
                postPocDecision: text(gate0.post_poc_decision),
                competitor: text(gate0.competitor),
                conclusion: text(gate0.review?.conclusion),
                reviewer: text(gate0.review?.reviewer),
                reviewedAt: text(gate0.review?.reviewed_at),
                missing,
                complete: gate0.complete === true,
                checklist: gate0Checklist({
                    whyCustomer: text(gate0.why_customer),
                    whyUs: text(gate0.why_us),
                    decisionChain: text(gate0.decision_chain),
                    postPocDecision: text(gate0.post_poc_decision),
                }, text(record.tech_owner)),
            },
            plan: {
                customerPain: text(plan.customer_pain),
                expectedRecognition: text(plan.expected_recognition),
                criteria: (plan.criteria ?? []).map((item) => ({
                    name: text(item?.name),
                    metric: text(item?.metric),
                    baseline: text(item?.baseline),
                    target: text(item?.target),
                })),
                scenarios: (plan.scenarios ?? []).map(text).filter((item) => item !== ''),
                ourEdge: text(plan.our_edge),
                timelineStart: text(plan.timeline?.start),
                timelineEnd: text(plan.timeline?.end),
                risks: (plan.risks ?? []).map((item) => ({
                    name: text(item?.name),
                    level: text(item?.level).toLowerCase(),
                    mitigation: text(item?.mitigation),
                })),
                reportNodes: (plan.report_nodes ?? []).map(text).filter((item) => item !== ''),
                gate1Conclusion: text(plan.gate1?.conclusion),
                gate2Ready: text(plan.gate2?.ready),
            },
            progress: (record.progress ?? []).map((entry) => ({
                seq: numberOrNull(entry?.seq),
                date: text(entry?.date),
                type: text(entry?.type),
                goal: text(entry?.goal),
                items: (entry?.items ?? []).map(text).filter((item) => item !== ''),
                actual: text(entry?.actual),
                completion: text(entry?.completion),
                evidence: (entry?.evidence ?? []).map((item) => ({
                    title: text(item?.title),
                    link: text(item?.link),
                    type: text(item?.type),
                })),
                customer: {
                    syncedWith: text(entry?.customer?.synced_with),
                    feedback: text(entry?.customer?.feedback),
                    recognition: text(entry?.customer?.recognition),
                },
                gate3_1: text(entry?.gate3_1),
                gate3_2: text(entry?.gate3_2),
                next: {
                    goal: text(entry?.next?.goal),
                    owner: text(entry?.next?.owner),
                    deadline: text(entry?.next?.deadline),
                },
            })),
            outcome: {
                achievement: text(outcome.achievement),
                customerRecognition: text(outcome.customer_recognition),
                ourProof: text(outcome.our_proof),
                remainingRisks: text(outcome.remaining_risks),
                proved: text(outcome.conclusion?.proved),
                recognized: text(outcome.conclusion?.recognized),
                nextBusiness: text(outcome.conclusion?.next_business),
                milestone: text(outcome.business?.milestone),
                businessOwner: text(outcome.business?.owner),
                businessDeadline: text(outcome.business?.deadline),
                businessStatus: text(outcome.business?.status),
                overall: text(outcome.overall),
                reviewedAt: text(outcome.reviewed_at),
            },
            gaps: scanGaps(record, { now, stallDays: this.options.stallDays }),
        };
    }
}
/** File name without its directory, for warning text. */
function basename(path) {
    const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return index === -1 ? path : path.slice(index + 1);
}
/** One line describing the newest progress entry, for the table's summary cell. */
function progressSummary(poc) {
    const last = latestProgress(poc);
    if (last === null)
        return '';
    const parts = [];
    const type = text(last.type);
    if (type !== '')
        parts.push(type);
    const actual = text(last.actual);
    if (actual !== '')
        parts.push(actual.replace(/\s+/g, ' ').slice(0, 80));
    const completion = text(last.completion);
    if (completion !== '')
        parts.push(completion);
    return parts.join(' · ');
}
/** Collapse one record into the table row the overview renders. */
function summarize(record, now, stallDays) {
    const dimensions = readDimensions(record);
    const { stage, closed } = normalizeStage(record.stage);
    const gaps = scanGaps(record, { now, stallDays });
    const gate0 = record.gate0 ?? {};
    const activity = lastProgressDate(record);
    const stageSince = text(record.stage_since);
    const progress = Array.isArray(record.progress) ? record.progress : [];
    const missing = Array.isArray(gate0.missing) ? gate0.missing.map(text).filter((item) => item !== '') : [];
    const plan = record.plan ?? {};
    const last = latestProgress(record);
    // v3 has no gate-completion array: each stage reads its own source field.
    const stageDone = [
        gate0.complete === true,
        text(plan.gate1?.conclusion) === '通过',
        text(plan.gate2?.ready) === 'Ready',
        last !== null && text(last.gate3_2) === '已确认',
        text((record.outcome ?? {}).achievement) === '达成',
    ];
    return {
        pocId: text(record.poc_id),
        name: text(record.name) === '' ? text(record.poc_id) : text(record.name),
        system: text((record.org ?? {}).system),
        company: text((record.org ?? {}).company),
        department: text((record.org ?? {}).department),
        pocType: text(record.poc_type),
        amountWan: numberOrNull(record.amount_wan) ?? 0,
        priority: text(record.priority),
        stageLabel: text(record.stage),
        stage,
        closed,
        status: text(record.status),
        stageSince: stageSince === '' ? null : stageSince,
        daysInStage: daysSince(stageSince === '' ? null : stageSince, now),
        owner: text(record.owner),
        techOwner: text(record.tech_owner),
        g0Conclusion: text(gate0.review?.conclusion),
        g0Passed: text(gate0.review?.conclusion) === '通过',
        g0Complete: gate0.complete === true,
        g0MissingCount: missing.length,
        stageDone,
        dimensions,
        dimensionCount: ['achievement', 'evidence', 'recognition', 'nextMilestone'].filter((key) => dimensions[key]).length,
        gapCount: gaps.length,
        highGapCount: gaps.filter((item) => item.level === 'high').length,
        progressCount: progress.length,
        lastProgressDate: activity,
        lastProgressSummary: progressSummary(record),
        daysSinceProgress: daysSince(activity, now),
        outcomeAchievement: text((record.outcome ?? {}).achievement),
        outcomeRecognition: text((record.outcome ?? {}).customer_recognition),
    };
}
/**
 * The v3 headline counters.
 *
 * Each one is derived from the same rows the table shows, so the strip and the
 * table can never disagree.
 */
function computeStats(projects) {
    let amountTotalWan = 0;
    let awaitingCustomer = 0;
    for (const project of projects) {
        amountTotalWan += project.amountWan;
    }
    return {
        total: projects.length,
        g0Passed: projects.filter((project) => project.g0Passed).length,
        inProgress: projects.filter((project) => project.status === '进行中').length,
        amountTotalWan,
        g0Complete: projects.filter((project) => project.g0Complete).length,
        awaitingCustomer,
        succeeded: projects.filter((project) => project.outcomeAchievement === '达成' && project.outcomeRecognition === '认可').length,
        stopped: projects.filter((project) => project.status === '暂停' || project.status === '已关闭' || project.status === '已取消').length,
    };
}
/** Empty counters for the "no data yet" snapshot. */
function emptyStats() {
    return {
        total: 0,
        g0Passed: 0,
        inProgress: 0,
        amountTotalWan: 0,
        g0Complete: 0,
        awaitingCustomer: 0,
        succeeded: 0,
        stopped: 0,
    };
}
/** Gap order: severity first, then the highest-value rule, then the project. */ function compareGaps(left, right) {
    return (right.priority - left.priority ||
        left.ruleNo - right.ruleNo ||
        left.pocId.localeCompare(right.pocId) ||
        left.rule.localeCompare(right.rule));
}
/** Project order: the ones needing attention first, then by id. */
function compareProjects(left, right) {
    return right.highGapCount - left.highGapCount || right.gapCount - left.gapCount || left.pocId.localeCompare(right.pocId);
}
/** The stage buckets in display order, so the funnel always reads G0→G4. */
const STAGE_ORDER = ['G0', 'G1', 'G2', 'G3', 'G4', 'closed', 'unknown'];
/** The four dimensions in display order. */
const DIMENSION_ORDER = ['achievement', 'evidence', 'recognition', 'nextMilestone'];
/** Which stage bucket one project belongs to. */
function stageBucketOf(project) {
    if (project.closed)
        return 'closed';
    return project.stage ?? 'unknown';
}
/**
 * Aggregate the project list into the portfolio band.
 *
 * This is the only place the charts get their numbers from. Everything is
 * derived from `projects` (and the already-scanned `gaps`), so a chart can
 * never show a figure the table contradicts. Buckets keep their full cardinality
 * even when empty: a funnel with a missing column reads as a rendering bug.
 */
export function analyse(projects, gaps) {
    const totalAmount = projects.reduce((sum, project) => sum + project.amountWan, 0);
    const stageMap = new Map();
    for (const key of STAGE_ORDER)
        stageMap.set(key, { key, count: 0, amountWan: 0, highGapCount: 0 });
    for (const project of projects) {
        const bucket = stageMap.get(stageBucketOf(project));
        if (bucket === undefined)
            continue;
        bucket.count += 1;
        bucket.amountWan += project.amountWan;
        if (project.highGapCount > 0)
            bucket.highGapCount += 1;
    }
    const orgMap = new Map();
    for (const project of projects) {
        // A project without a company still belongs somewhere: group it under its
        // system so the breakdown accounts for every project exactly once.
        const key = `${project.system}\u0000${project.company}`;
        const existing = orgMap.get(key);
        if (existing === undefined) {
            orgMap.set(key, {
                system: project.system,
                company: project.company,
                count: 1,
                amountWan: project.amountWan,
                highGapCount: project.highGapCount > 0 ? 1 : 0,
            });
        }
        else {
            existing.count += 1;
            existing.amountWan += project.amountWan;
            if (project.highGapCount > 0)
                existing.highGapCount += 1;
        }
    }
    const typeMap = new Map();
    for (const project of projects) {
        const key = project.pocType;
        const existing = typeMap.get(key);
        if (existing === undefined) {
            typeMap.set(key, { pocType: key, count: 1, amountWan: project.amountWan });
        }
        else {
            existing.count += 1;
            existing.amountWan += project.amountWan;
        }
    }
    const gapRuleMap = new Map();
    for (const item of gaps) {
        const existing = gapRuleMap.get(item.rule);
        if (existing === undefined) {
            gapRuleMap.set(item.rule, { rule: item.rule, ruleNo: item.ruleNo, level: item.level, count: 1 });
        }
        else {
            existing.count += 1;
        }
    }
    const topAmounts = [...projects]
        .filter((project) => project.amountWan > 0)
        .sort((left, right) => right.amountWan - left.amountWan || left.pocId.localeCompare(right.pocId))
        .slice(0, 5)
        .map((project) => ({
        pocId: project.pocId,
        pocName: project.name,
        amountWan: project.amountWan,
        share: totalAmount === 0 ? 0 : project.amountWan / totalAmount,
        stage: project.stage,
        closed: project.closed,
    }));
    const dimensions = DIMENSION_ORDER.map((key) => {
        const present = projects.filter((project) => project.dimensions[key]).length;
        const missing = projects.length - present;
        return { key, present, missing, ratio: projects.length === 0 ? 0 : present / projects.length };
    });
    let lastActivity = null;
    for (const project of projects) {
        const date = project.lastProgressDate;
        if (date === null)
            continue;
        if (lastActivity === null || date > lastActivity)
            lastActivity = date;
    }
    const largest = topAmounts.length === 0 ? 0 : topAmounts[0].amountWan;
    return {
        stages: STAGE_ORDER.map((key) => stageMap.get(key)),
        orgs: [...orgMap.values()].sort((left, right) => right.amountWan - left.amountWan ||
            left.system.localeCompare(right.system) ||
            left.company.localeCompare(right.company)),
        types: [...typeMap.values()].sort((left, right) => right.count - left.count || right.amountWan - left.amountWan || left.pocType.localeCompare(right.pocType)),
        topAmounts,
        dimensions,
        gapRules: [...gapRuleMap.values()].sort((left, right) => right.count - left.count || left.ruleNo - right.ruleNo),
        concentration: totalAmount === 0 ? 0 : largest / totalAmount,
        amountMissing: projects.filter((project) => project.amountWan === 0).length,
        withProgress: projects.filter((project) => project.progressCount > 0).length,
        lastActivity,
    };
}
/** An empty analysis, for the cold-cache snapshot. */
export function emptyAnalysis() {
    return {
        stages: STAGE_ORDER.map((key) => ({ key, count: 0, amountWan: 0, highGapCount: 0 })),
        orgs: [],
        types: [],
        topAmounts: [],
        dimensions: DIMENSION_ORDER.map((key) => ({ key, present: 0, missing: 0, ratio: 0 })),
        gapRules: [],
        concentration: 0,
        amountMissing: 0,
        withProgress: 0,
        lastActivity: null,
    };
}
/**
 * The five G0 prerequisites, in schema order.
 *
 * `tech_owner` is one of the five but lives in the identity block, so the
 * checklist reads it from the record rather than from `gate0`.
 */
const G0_FIELDS = [
    { field: 'why_customer', viewKey: 'whyCustomer' },
    { field: 'why_us', viewKey: 'whyUs' },
    { field: 'decision_chain', viewKey: 'decisionChain' },
    { field: 'post_poc_decision', viewKey: 'postPocDecision' },
];
/** Build the G0 checklist from the parsed fields. */
export function gate0Checklist(gate0, techOwner) {
    const items = G0_FIELDS.map(({ field, viewKey }) => ({ field, present: gate0[viewKey] !== '', value: gate0[viewKey] }));
    items.push({ field: 'tech_owner', present: techOwner !== '', value: techOwner });
    return items;
}
