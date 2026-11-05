/**
 * Read-only ledger store.
 *
 * The store turns the cloned `projects/*.yaml` files into the JSON shapes the
 * Client renders. It never writes: the repository is a read-only copy and the
 * real data source is GitHub (writes arrive in milestone 2, through a PR).
 *
 * Parsing uses `yaml`'s `parseDocument`, not `parse` + `stringify`: comments and
 * key order survive, which milestone 2 needs when it edits a record in place.
 * One unreadable or unparsable file is reported as a warning and skipped — a
 * single bad hand-edit must not blank the whole board.
 */
import YAML from 'yaml';
import { daysSince, lastActivity, normalizeStage, readDimensions, scanGaps, text } from './gap.js';
import { RepoError } from './repo.js';
import { STAGES } from './types.js';
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
                // Fall back to the file name so the row still renders and can be fixed.
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
        const repository = this.repositoryLabel();
        if (!cacheReady) {
            return {
                cacheReady: false,
                repository,
                fetchedAt: this.cache.lastFetchedAt,
                cachePath: this.cache.repoPath,
                projects: [],
                stats: emptyStats(),
                gaps: [],
                warnings: [],
            };
        }
        const { records, warnings } = await this.load();
        const now = this.options.now();
        const projects = records.map((record) => summarize(record, now, this.options.staleDays));
        const gaps = [];
        for (const record of records)
            gaps.push(...scanGaps(record, { now, staleDays: this.options.staleDays }));
        gaps.sort(compareGaps);
        return {
            cacheReady: true,
            repository,
            fetchedAt: this.cache.lastFetchedAt,
            cachePath: this.cache.repoPath,
            projects: projects.sort(compareProjects),
            stats: computeStats(projects, gaps),
            gaps,
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
        const summary = summarize(record, now, this.options.staleDays);
        return {
            summary,
            type: text(record.type),
            tier: text(record.tier),
            owner: text(record.owner),
            salesInitiator: text(record.sales_initiator),
            customerTechOwner: text(record.customer_tech_owner),
            whyCustomerTest: text(record.why_customer_test),
            whyWeTest: text(record.why_we_test),
            nextActionGoal: text(record.next_action_goal),
            gates: readGates(record),
            criteria: Array.isArray(record.success_criteria) ? record.success_criteria.map(normalizeCriterion) : [],
            scenarios: Array.isArray(record.success_scenarios) ? record.success_scenarios.map(text).filter((value) => value !== '') : [],
            risks: Array.isArray(record.risks) ? record.risks.map(normalizeRisk) : [],
            result: {
                achievement: text(record.result?.achievement),
                evidence: text(record.result?.evidence),
                recognition: text(record.result?.recognition),
                next_milestone: text(record.result?.next_milestone),
            },
            timeline: Array.isArray(record.timeline) ? record.timeline.map(normalizeRound) : [],
            gaps: scanGaps(record, { now, staleDays: this.options.staleDays }),
        };
    }
    /** `owner/name` as configured; the Client shows it as the data-source label. */
    repositoryLabel() {
        return this.cache.repository;
    }
}
/** File name without its directory, for warning text. */
function basename(path) {
    const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return index === -1 ? path : path.slice(index + 1);
}
/** One criterion, with every field coerced to a string. */
function normalizeCriterion(raw) {
    const value = (raw ?? {});
    return { name: text(value.name), version: text(value.version), metric: text(value.metric) };
}
/** One risk, with every field coerced to a string. */
function normalizeRisk(raw) {
    const value = (raw ?? {});
    return { name: text(value.name), level: text(value.level).toLowerCase(), mitigation: text(value.mitigation) };
}
/** One timeline round, with every field coerced and normalized. */
function normalizeRound(raw) {
    const value = (raw ?? {});
    const round = typeof value.round === 'number' && Number.isFinite(value.round) ? value.round : null;
    return {
        date: text(value.date),
        round,
        goal: text(value.goal),
        actual: text(value.actual),
        evidence: text(value.evidence),
        customer_feedback: text(value.customer_feedback),
        recognition_scope: text(value.recognition_scope),
    };
}
/** The five gate rows in stage order, with absent gates rendered as pending. */
function readGates(record) {
    const gates = record.gates ?? {};
    return STAGES.map((stage) => {
        const gate = gates[stage] ?? {};
        return {
            stage,
            complete: gate.complete === true,
            date: text(gate.date) === '' ? null : text(gate.date),
            indicators: numberOrNull(gate.indicators_count),
            scenarios: numberOrNull(gate.scenarios_count),
            risks: numberOrNull(gate.risks_count),
            prerequisitesReady: typeof gate.prerequisites_ready === 'boolean' ? gate.prerequisites_ready : null,
            engineersInvested: typeof gate.engineers_invested === 'boolean' ? gate.engineers_invested : null,
        };
    });
}
/** A finite number, or `null`. */
function numberOrNull(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
/** Collapse one record into the table row the overview renders. */
function summarize(record, now, staleDays) {
    const dimensions = readDimensions(record);
    const { stage, closed } = normalizeStage(record.stage);
    const gaps = scanGaps(record, { now, staleDays });
    const activity = lastActivity(record);
    const gateComplete = STAGES.map((stage) => (record.gates?.[stage]?.complete === true));
    return {
        pocId: text(record.poc_id),
        name: text(record.name) === '' ? text(record.poc_id) : text(record.name),
        type: text(record.type),
        tier: text(record.tier),
        stageLabel: text(record.stage),
        stage,
        closed,
        gateComplete,
        owner: text(record.owner),
        dimensions,
        dimensionCount: ['achievement', 'evidence', 'recognition', 'nextMilestone'].filter((key) => dimensions[key]).length,
        gapCount: gaps.length,
        highGapCount: gaps.filter((item) => item.level === 'high').length,
        lastActivity: activity,
        daysSinceActivity: daysSince(activity, now),
    };
}
/** The four headline counters, computed from the same rows the table shows. */
function computeStats(projects, gaps) {
    const g0Gaps = new Set(gaps.filter((item) => item.rule === 'G0-why-customer' || item.rule === 'G0-why-we' || item.rule === 'G0-tech-owner').map((item) => item.pocId));
    return {
        active: projects.filter((project) => !project.closed).length,
        g0Incomplete: g0Gaps.size,
        atRisk: new Set(gaps.filter((item) => item.level === 'high').map((item) => item.pocId)).size,
        convertible: projects.filter((project) => project.dimensions.achievement && project.dimensions.evidence && project.dimensions.recognition).length,
        total: projects.length,
        closed: projects.filter((project) => project.closed).length,
    };
}
/** Empty counters for the "no data yet" snapshot. */
function emptyStats() {
    return { active: 0, g0Incomplete: 0, atRisk: 0, convertible: 0, total: 0, closed: 0 };
}
/** Gap order: severity first, then the highest-value rule, then the project. */
function compareGaps(left, right) {
    return (right.priority - left.priority ||
        left.ruleNo - right.ruleNo ||
        left.pocId.localeCompare(right.pocId) ||
        left.rule.localeCompare(right.rule));
}
/** Project order: the ones needing attention first, then by id. */
function compareProjects(left, right) {
    return right.highGapCount - left.highGapCount || right.gapCount - left.gapCount || left.pocId.localeCompare(right.pocId);
}
