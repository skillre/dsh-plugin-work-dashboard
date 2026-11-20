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
import type { PocRecord, ProgressRecord } from './types.js';
/** The four G0 prerequisites that live under `gate0` (the fifth is identity). */
export declare const G0_FIELDS: readonly ["why_customer", "why_us", "decision_chain", "post_poc_decision"];
/** One plan criterion, as the form edits it. */
export interface FormCriterion {
    /** `cri-NN`; carried through so a returned form never renumbers the plan. */
    id: string;
    name: string;
    metric: string;
    baseline: string;
    target: string;
}
/**
 * One plan scenario.
 *
 * v3.1 made this an object with a stable id, because evidence attaches by id:
 * a form that renumbered scenarios would silently orphan every proof it had.
 * `id` is therefore carried through untouched and is not user-editable.
 */
export interface FormScenario {
    /** `scn-NN`; stable for the life of the project. */
    id: string;
    name: string;
    goal: string;
}
/** One plan risk. */
export interface FormRisk {
    name: string;
    level: string;
    mitigation: string;
}
/** One progress entry the form can append. */
export interface FormProgress {
    seq: number | null;
    date: string;
    type: string;
    /** v3.1: what moved compared to the previous round. Required. */
    change: string;
    goal: string;
    /** `scn-NN` ids picked from the plan's scenarios. */
    scenarioIds: string[];
    /** `cri-NN` ids picked from the plan's criteria; independent of scenarios. */
    criteriaIds: string[];
    actual: string;
    completion: string;
    evidence: Array<{
        title: string;
        link: string;
        type: string;
    }>;
    customer: {
        synced_with: string;
        feedback: string;
        recognition: string;
    };
    gate3_1: string;
    gate3_2: string;
    next: {
        goal: string;
        owner: string;
        deadline: string;
    };
}
/**
 * One already-recorded progress round, as the form shows it read-only.
 *
 * This exists because the form used to say only "已有 3 条进展" and never showed
 * them. Two concrete failures came from that:
 *
 * - the colleague could not see what had already been reported, so the same
 *   round was filed twice under different wording;
 * - the reviewer opening a returned form could not see the story the new round
 *   was supposed to continue, so "这次什么变了" was unverifiable.
 *
 * Read-only by construction: v3 history is append-only, and the form's job is to
 * add a round, never to rewrite one.
 */
export interface FormHistoryEntry {
    seq: number | null;
    date: string;
    type: string;
    change: string;
    actual: string;
    completion: string;
    /** Evidence titles, already flattened: the form only lists them. */
    evidence: string[];
    syncedWith: string;
    recognition: string;
    nextGoal: string;
    nextOwner: string;
    nextDeadline: string;
}
/**
 * The project shape the form edits.
 *
 * A flat, all-strings view of one `PocRecord` plus its pending progress entry.
 * Flat because the generated page is plain JS with no schema awareness: the Host
 * normalizes once here instead of repeating the walk in the browser.
 */
export interface FormProject {
    pocId: string;
    name: string;
    system: string;
    company: string;
    department: string;
    amountWan: string;
    pocType: string;
    owner: string;
    sales: string;
    techOwner: string;
    execSponsor: string;
    stage: string;
    status: string;
    stageSince: string;
    gate0: {
        why_customer: string;
        why_us: string;
        decision_chain: string;
        post_poc_decision: string;
        competitor: string;
        conclusion: string;
        reviewer: string;
        reviewed_at: string;
    };
    plan: {
        customer_pain: string;
        expected_recognition: string;
        our_edge: string;
        criteria: FormCriterion[];
        scenarios: FormScenario[];
        risks: FormRisk[];
        timeline_start: string;
        timeline_end: string;
        gate1_conclusion: string;
        gate2_ready: string;
    };
    /** The entry this form adds; `null` in a blank form until the user fills it. */
    progress: FormProgress;
    /** How many entries the project already has (so `seq` can continue). */
    existingProgressCount: number;
    /**
     * The recorded rounds, newest first, for the read-only history block.
     *
     * Capped by {@link HISTORY_LIMIT}: a project with forty rounds does not need
     * all forty in a form whose job is to add the forty-first, and an uncapped list
     * would push the fields the colleague must fill below the fold.
     */
    history: FormHistoryEntry[];
    /**
     * The G4 conclusion block.
     *
     * It was missing entirely: the form could collect a progress round but not the
     * one thing a G4 project exists to state — what was proved, what the customer
     * accepted, and what business step follows. Every field is optional because
     * only a G4 form shows them.
     */
    outcome: {
        achievement: string;
        customer_recognition: string;
        our_proof: string;
        proved: string;
        recognized: string;
        next_business: string;
        milestone: string;
        businessOwner: string;
        businessDeadline: string;
        businessStatus: string;
        overall: string;
    };
}
/**
 * What the colleague is here to do.
 *
 * Two orthogonal questions decide what the form asks, and conflating them is
 * what made the old form a 20-field wall:
 *
 * - the **stage** says which fields are the subject (a G1 project is about the
 *   plan, a G3 project is about the proof);
 * - the **intent** says how deep to go (registering a new project, filling in
 *   the current stage, or appending one round of progress).
 *
 * The same G2 project needs completely different forms for "first test" and
 * "weekly sync", so a stage-only split would still force a colleague to scroll
 * past everything they are not editing.
 */
export type FormIntent = 'new' | 'supplement' | 'progress';
/** The section groups a form can show. Order is reading order. */
export type FormSection = 'identity' | 'gate0' | 'plan' | 'gate12' | 'progress' | 'outcome';
/**
 * Resolve what a form should ask, given the intent and the project's stage.
 *
 * Returns the editable sections (the subject) and the context sections (shown
 * read-only so the colleague knows what they are adding to). An unknown stage
 * falls back to G0's set: a project whose stage is unrecognised is, for form
 * purposes, still being set up.
 */
export declare function resolveSections(intent: FormIntent, stage: string): {
    editable: FormSection[];
    context: FormSection[];
};
/** Options for one generation run. */
export interface FormOptions {
    /** `fill` pre-fills from the ledger; `blank` is an empty new-project form. */
    mode: 'fill' | 'blank';
    /**
     * What the colleague is doing. Defaults from `mode`: `blank` → `new`,
     * `fill` → `supplement`. `progress` is the one-screen append form.
     */
    intent?: FormIntent;
    /** Projects to include; one blank project for `blank` mode. */
    projects: FormProject[];
    /** Clock injection so the generated header and default dates are testable. */
    now?: Date;
}
/**
 * Convert one ledger record into the form's project shape.
 *
 * Every field becomes a string or a list of strings. A missing block becomes an
 * empty one rather than `undefined`, so the generated script never has to guard.
 */
export declare function projectForForm(record: PocRecord): FormProject;
/** How many recorded rounds the form lists read-only. */
export declare const HISTORY_LIMIT = 5;
/**
 * Flatten the recorded rounds for the read-only history block.
 *
 * Newest first, because the round a colleague is about to continue is the newest
 * one: reading it first is what makes "这次什么变了" answerable. The order is
 * reversed rather than re-sorted by date because the ledger's own array order is
 * the append order, and a hand-edited `date` must not reshuffle history.
 */
export declare function progressHistory(progress: readonly ProgressRecord[]): FormHistoryEntry[];
/** One empty progress entry, with `seq` continuing the existing count. */
export declare function blankProgress(existingCount: number): FormProgress;
/** The blank project a `blank`-mode form edits. */
export declare function blankProject(): FormProject;
/**
 * Build the stable draft key.
 *
 * Sorting the ids makes the key independent of selection order, so the same set
 * of projects always resumes the same draft — even if the user regenerates the
 * form later. A blank form gets a constant key so its draft survives too.
 */
export declare function draftKeyFor(mode: 'fill' | 'blank', pocIds: readonly string[]): string;
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
export declare function projectToYaml(project: FormProject): string;
/**
 * One project's change set: what the colleague touched, and nothing else.
 *
 * ## Why a change set rather than a file
 *
 * A `projects/*.yaml` file carries three kinds of value: what a human wrote, what
 * the ledger derives (`gate0.missing`, `gate0.complete`, `priority`, per-scenario
 * status), and what the clock implies. Only the first belongs to a form. The
 * derived ones are computed by `tools/derive.mjs` and asserted by CI, so a form
 * that wrote them would either be wrong or be overwritten — and a form that
 * omitted them would produce a file CI rejects.
 *
 * So the form ships only the human half, `poc-submit` merges it into the existing
 * file (preserving everything it did not touch), and CI recomputes the rest.
 *
 * `schema_version` IS included even though it is a constant: the ledger refuses a
 * file without it (`E-VERSION`), and a brand-new project has no existing file to
 * inherit the stamp from.
 */
export interface FormChangeSet {
    schema_version: string;
    poc_id: string;
    name: string;
    org: {
        system: string | null;
        company: string | null;
        department: string | null;
    };
    amount_wan: number | null;
    poc_type: string | null;
    owner: string | null;
    sales: string | null;
    tech_owner: string | null;
    exec_sponsor: string | null;
    stage: string;
    status: string;
    stage_since: string | null;
    gate0: {
        why_customer: string | null;
        why_us: string | null;
        decision_chain: string | null;
        post_poc_decision: string | null;
        competitor: string | null;
        review: {
            conclusion: string | null;
            reviewer: string | null;
            reviewed_at: string | null;
        };
    };
    plan: {
        customer_pain: string | null;
        expected_recognition: string | null;
        our_edge: string | null;
        criteria: Array<Record<string, unknown>>;
        scenarios: Array<Record<string, unknown>>;
        risks: Array<Record<string, unknown>>;
        timeline: {
            start: string | null;
            end: string | null;
        };
        gate1: {
            conclusion: string | null;
        };
        gate2: {
            ready: string | null;
        };
    };
    /**
     * The G4 conclusion block.
     *
     * It was missing from the change set while the form could edit it, which meant a
     * G4 colleague filled in "我们证明了什么 / 客户认可了什么 / 下一步业务动作",
     * downloaded the file, and every one of those answers was silently dropped. The
     * form showed the block; the serializer never wrote it. A G4 form could not
     * record the only thing a G4 form exists to record.
     */
    outcome: {
        achievement: string | null;
        customer_recognition: string | null;
        our_proof: string | null;
        remaining_risks: string | null;
        conclusion: {
            proved: string | null;
            recognized: string | null;
            next_business: string | null;
        };
        business: {
            milestone: string | null;
            owner: string | null;
            deadline: string | null;
            status: string | null;
        };
        overall: string | null;
    };
    /** The rounds this form ADDS; empty when the colleague recorded none. */
    progress: Array<Record<string, unknown>>;
}
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
export declare function projectToChangeSet(project: FormProject, intent?: FormIntent, baseline?: FormProject): FormChangeSet;
/** The whole download: one change set per project, plus provenance. */
export interface FormChangeDocument {
    schemaVersion: string;
    generatedAt: string;
    generatedBy: string;
    intent: FormIntent;
    changes: FormChangeSet[];
}
/** Build the document a colleague sends back. */
export declare function buildChangeDocument(options: {
    projects: readonly FormProject[];
    intent: FormIntent;
    now?: Date;
    /**
     * The values each project had when the form was GENERATED.
     *
     * When supplied, only fields that differ from their seed are emitted — so a
     * colleague who opened a form, changed one field and sent it back cannot revert
     * the other twenty to the day the form was exported. See
     * {@link projectToChangeSet}.
     */
    baseline?: readonly FormProject[];
}): FormChangeDocument;
/** The enums, mirrored from `schemas/enums.yaml`. */
declare const ENUMS: {
    pocType: string[];
    stage: string[];
    status: string[];
    g0Conclusion: string[];
    g1Conclusion: string[];
    g2Ready: string[];
    recognition: string[];
    progressType: string[];
    progressChange: string[];
    completion: string[];
    riskLevel: string[];
    gate3_1: string[];
    gate3_2: string[];
    evidenceType: string[];
    system: string[];
    achievement: string[];
    businessStatus: string[];
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
export declare const FORM_SCHEMA_VERSION = "3.1";
/**
 * The stamp a pre-v3.1 form carries.
 *
 * A named constant only so the refusal message can name it. This is not a
 * supported shape: nothing parses it, nothing converts it, and importing one is
 * refused rather than half-applied.
 */
export declare const LEGACY_FORM_SCHEMA_VERSION = "3.0";
/** The state the generated page boots from. */
export interface FormPayload {
    mode: 'fill' | 'blank';
    /** What the colleague is doing; decides how much of the page is editable. */
    intent: FormIntent;
    /** The schema this page writes. Absent means a pre-v3.1 form. */
    schemaVersion: string;
    generatedAt: string;
    today: string;
    projects: FormProject[];
    /**
     * Each project's values at generation time, index-aligned with `projects`.
     *
     * The page compares against this before emitting a change set, so a field the
     * colleague never touched is sent as "unchanged" rather than as its stale
     * pre-filled value.
     */
    baseline: FormProject[];
    /**
     * Per-project section resolution, index-aligned with `projects`.
     *
     * Resolved on the Host rather than in the page because the mapping is a
     * statement about the ledger's own structure, and the browser has no way to
     * check it. Sending it also keeps the payload inspectable: reading the JSON
     * tells you exactly what the page will let you edit.
     */
    sections: Array<{
        editable: FormSection[];
        context: FormSection[];
    }>;
    draftKey: string;
    enums: typeof ENUMS;
    /** The G0 fields, in schema order, with their prompt text. */
    g0Fields: Array<{
        key: string;
        label: string;
        hint: string;
    }>;
    /**
     * The returned page's stylesheet.
     *
     * It is shipped in the payload rather than referenced from the page script
     * because the page script is generated code with no module scope: it cannot see
     * a Host constant, and a first attempt that assumed otherwise threw
     * "RETURN_CSS is not defined" at the moment a colleague clicked the button.
     */
    returnCss: string;
}
/**
 * Generate the complete HTML form.
 *
 * The returned string is the whole document: no external stylesheet, script,
 * font or image reference.
 */
export declare function buildFormHtml(options: FormOptions): string;
/** A file name for the generated form. */
export declare function formFileName(options: {
    mode: 'fill' | 'blank';
    pocIds: readonly string[];
    now?: Date;
}): string;
/** The file name a colleague should save one project's YAML under. */
export declare function yamlFileName(project: FormProject, now?: Date): string;
/** Re-export the YAML library's parse for the round-trip test. */
export { YAML };
/**
 * Whether a returned form was generated by this schema generation.
 *
 * `poc-export` produces a standalone HTML file that colleagues fill in offline,
 * so **old copies keep circulating** long after the schema moves. A pre-v3.1
 * form carries `progress[].items` and a string array of scenarios; reading it as
 * v3.1 would drop every scenario and criterion reference without an error, and
 * the ledger's whole proof chain hangs off those ids.
 *
 * So this is a hard gate rather than a tolerant reader: a stale form is refused
 * with an explanation, not silently half-imported. There is no conversion path
 * and none is planned — the ledger itself rejects any other shape version.
 */
export interface FormCompatibility {
    compatible: boolean;
    /** The schema the file declares, or empty when it predates the stamp. */
    declared: string;
    /** A message safe to show the person who just filled the form in. */
    reason: string;
}
/**
 * Check a parsed form payload against {@link FORM_SCHEMA_VERSION}.
 *
 * Accepts the raw parsed object rather than a typed payload, because the whole
 * point is to inspect a document whose shape may be from an older generation.
 */
export declare function checkFormCompatibility(payload: unknown): FormCompatibility;
/** The element id the returned page carries its change set in. */
export declare const RETURN_DATA_ID = "poc-return-data";
/** What reading a returned file produced. */
export interface ReturnReadResult {
    /** The change document, or `null` when the file could not be read. */
    document: FormChangeDocument | null;
    /** A message safe to show the person who sent the file back. */
    reason: string;
}
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
export declare function readReturnDocument(input: string): ReturnReadResult;
