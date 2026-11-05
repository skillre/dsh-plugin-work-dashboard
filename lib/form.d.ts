/**
 * Self-contained HTML form generator.
 *
 * Design rules, taken from the specification and from the reference
 * implementation (`~/dsh-test/poc_form.py`) but with three defects fixed:
 *
 * 1. **One file, no server, no CDN.** Everything is inlined, so a colleague can
 *    double-click it on any machine, offline.
 * 2. **Auto-save to localStorage.** The draft survives a closed tab. The
 *    storage key is derived from the PROJECT IDS, not from a timestamp: a
 *    regenerated form for the same projects must find the same draft, which the
 *    reference implementation got wrong (its key embedded the generation time).
 * 3. **Live validation.** The documented counts (2–3 indicators, 3–5
 *    scenarios, ≤3 risks) and the G0 prerequisites are checked on every edit.
 * 4. **The download is REAL YAML.** The reference emitted a JSON blob, which the
 *    plugin's own import page cannot read. This generator emits YAML with proper
 *    scalar quoting, so the file a colleague sends back can be dropped straight
 *    into the import page.
 *
 * The generated script is plain ES5-compatible JavaScript: no build step, no
 * imports, nothing that needs a modern runtime beyond `localStorage` and `Blob`.
 */
import YAML from 'yaml';
import type { PocRecord } from './types.js';
/** The project shape the form edits; a subset of {@link PocRecord}. */
export interface FormProject {
    poc_id: string;
    name: string;
    type: string;
    tier: string;
    stage: string;
    owner: string;
    sales_initiator: string;
    customer_tech_owner: string;
    why_customer_test: string;
    why_we_test: string;
    next_action_goal: string;
    gates: Record<string, unknown>;
    success_criteria: Array<{
        name: string;
        version: string;
        metric: string;
    }>;
    success_scenarios: string[];
    risks: Array<{
        name: string;
        level: string;
        mitigation: string;
    }>;
    result: {
        achievement: string;
        evidence: string;
        recognition: string;
        next_milestone: string;
    };
    timeline: Array<Record<string, unknown>>;
}
/** Options for one generation run. */
export interface FormOptions {
    /** `fill` pre-fills from the ledger; `blank` is an empty new-project form. */
    mode: 'fill' | 'blank';
    /** Projects to include; one blank project for `blank` mode. */
    projects: FormProject[];
    /** Clock injection so the generated header is testable. */
    now?: Date;
}
/**
 * Convert one ledger record into the form's project shape.
 *
 * Every field becomes a string or a list of strings: the form is a plain
 * HTML/JS page with no schema awareness, so the Host does the normalization
 * once here instead of repeating it in the generated script.
 */
export declare function projectForForm(record: PocRecord): FormProject;
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
 * Serialize one project back to YAML.
 *
 * Uses `yaml`'s own stringifier rather than concatenation: a value containing
 * `: `, `#`, quotes or a newline must be quoted correctly, which the reference
 * implementation's hand-built strings did not do (a `metric: 成功率 ≥ 99.5%`
 * was fine, but `name: 某某：试点` produced invalid YAML).
 */
export declare function projectToYaml(project: FormProject): string;
/**
 * Generate the complete HTML form.
 *
 * The returned string is the whole document: no external stylesheet, script,
 * font, or image reference.
 */
export declare function buildFormHtml(options: FormOptions): string;
/** Suggest a file name for the generated form. */
export declare function formFileName(options: {
    mode: 'fill' | 'blank';
    pocIds: readonly string[];
    now?: Date;
}): string;
/** Re-export the YAML library's parse for the round-trip test. */
export { YAML };
