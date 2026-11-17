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
import type { PocRecord } from './types.js';
/** The four G0 prerequisites that live under `gate0` (the fifth is identity). */
export declare const G0_FIELDS: readonly ["why_customer", "why_us", "decision_chain", "post_poc_decision"];
/** One plan criterion, as the form edits it. */
export interface FormCriterion {
    name: string;
    metric: string;
    baseline: string;
    target: string;
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
    goal: string;
    items: string[];
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
        scenarios: string[];
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
}
/** Options for one generation run. */
export interface FormOptions {
    /** `fill` pre-fills from the ledger; `blank` is an empty new-project form. */
    mode: 'fill' | 'blank';
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
 */
export declare function projectToYaml(project: FormProject): string;
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
    completion: string[];
    riskLevel: string[];
    gate3_1: string[];
    gate3_2: string[];
    evidenceType: string[];
    system: string[];
};
/** The state the generated page boots from. */
export interface FormPayload {
    mode: 'fill' | 'blank';
    generatedAt: string;
    today: string;
    projects: FormProject[];
    draftKey: string;
    enums: typeof ENUMS;
    /** The G0 fields, in schema order, with their prompt text. */
    g0Fields: Array<{
        key: string;
        label: string;
        hint: string;
    }>;
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
