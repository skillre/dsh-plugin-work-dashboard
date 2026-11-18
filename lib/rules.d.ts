/**
 * The rules and thresholds the ledger declares, parsed into typed constants.
 *
 * Why this file exists at all: the ledger's `config/rules.yaml` says, in as many
 * words, that "three copied rule lists drift; one does not". Those thresholds
 * decide what counts as a finding, and they belong to the data source, not to
 * this plugin. Hard-coding `300`, `2–3`, `3–5` and `45` here would make the plugin
 * and the ledger disagree the first time either one is tuned — and the plugin
 * would keep reporting findings the ledger no longer makes.
 *
 * Two versions are in play and they are NOT the same thing:
 *
 * - `schema_version` is the **shape** of the data (`schemas/enums.yaml`).
 * - `rulesVersion` here is the **judgement** applied to that shape.
 *
 * A project can be schema-current while its findings are computed by older rules.
 *
 * When the file is missing — an older cache, or a cache that has not been
 * refreshed since the ledger added `config/` — the built-in defaults below are
 * used and {@link RulesBundle.source} says so. Falling back silently would let a
 * stale cache look like a healthy one; the caller renders the difference.
 */
import type { GapRule } from './types.js';
/** Where the thresholds in force came from. */
export type RulesSource = 'ledger' | 'fallback';
/** Focus limits for a list field, as declared by the ledger. */
export interface RangeThreshold {
    min: number;
    max: number;
}
/** Every threshold `rules.yaml` publishes, with the built-in fallback applied. */
export interface RuleThresholds {
    /** Above this amount a cleared G0 is mandatory (R2). */
    largeAmountWan: number;
    /** Success-criteria focus limit (R4). */
    criteria: RangeThreshold;
    /** Scenario focus limit (R5). */
    scenarios: RangeThreshold;
    /** Maximum tracked risks (R6). */
    risks: {
        max: number;
    };
    /** Days in one stage before R12 reports a stall. */
    stallDays: number;
}
/** Priority thresholds, kept because the board sorts by the derived value. */
export interface PriorityThresholds {
    strategicWan: number;
    highWan: number;
    strategicPocTypes: readonly string[];
}
/** One rule's presentation metadata. */
export interface RuleMeta {
    id: string;
    name: string;
    level: GapLevelLike;
    priority: number;
    guard: string | null;
}
/** The three severities `rules.yaml` can express. */
export type GapLevelLike = 'high' | 'medium' | 'info';
/**
 * The rule ids this plugin implements, in schema order.
 *
 * Kept separate from the ledger's list on purpose: the ledger may add a rule the
 * plugin does not yet render, and that must not crash the scan. Anything in
 * `ledgerOrder` without an entry here is simply not evaluated.
 */
export declare const KNOWN_RULES: ReadonlyArray<GapRule>;
/**
 * The built-in copy of `rules.yaml`, used when the cache has no `config/`.
 *
 * These are the values shipped with schema 3.1 / rules 3.2. They are a **fallback,
 * not the source of truth**: when the ledger's file is present it always wins.
 */
export declare const FALLBACK_THRESHOLDS: RuleThresholds;
export declare const FALLBACK_PRIORITY: PriorityThresholds;
/** Fallback metadata, matching `rules.yaml` rules 1–16. */
export declare const FALLBACK_RULE_META: Record<string, RuleMeta>;
/** Everything the scan needs from the ledger's declared rules. */
export interface RulesBundle {
    source: RulesSource;
    /** `config/rules.yaml#version`, or empty when the file was absent. */
    rulesVersion: string;
    thresholds: RuleThresholds;
    priority: PriorityThresholds;
    /** Metadata keyed by the ledger's rule id (`R1`..`R16`). */
    rules: Record<string, RuleMeta>;
    /** Non-fatal problems met while reading the file, for the UI to surface. */
    warnings: string[];
}
/** The bundle used when no ledger file is readable. */
export declare function fallbackRules(warnings?: string[]): RulesBundle;
/**
 * Parse `config/rules.yaml` into a {@link RulesBundle}.
 *
 * Returns the fallback bundle when the source is empty or unparsable, and records
 * why in `warnings` — an unreadable rules file is a degraded cache, not a reason
 * to refuse to scan.
 */
export declare function parseRules(source: string | null | undefined): RulesBundle;
/** The plugin's rule id for a ledger rule number (`R13` → `R13-scenario-no-evidence`). */
export declare function ruleForLedgerId(ledgerId: string): GapRule | null;
/** Every rule id the ledger declares in `rules.yaml`, in file order. */
export declare function ledgerRuleIds(bundle: RulesBundle): string[];
