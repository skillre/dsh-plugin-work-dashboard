/**
 * Registration of the three skills that ship inside this package.
 *
 * The skills live in `skills/<name>/` rather than in the user's profile, so
 * installing the plugin is what publishes them, and uninstalling removes them.
 * That is the point of bundling them: a colleague who installs the dashboard
 * gets the ledger-reading, form-exporting and PR-submitting skills in the same
 * action, on the same version, with no separate install step that can drift.
 *
 * Every step is best-effort by design: `skills` is an optional service, and a
 * profile without it — or a package whose skill file went missing — must still
 * get the dashboard. Missing service, missing file and unusable frontmatter
 * therefore warn and return; nothing throws out of `apply`.
 *
 * The skills are read from disk at registration time rather than inlined into
 * the bundle, so the `scripts/` beside them ship as real files the model can
 * run, and so an operator can read exactly what was published.
 */
import type { Context } from '@deepseek-ai/cordis';
/** Names of the bundled skills, in the order they are registered. */
export declare const BUNDLED_SKILL_NAMES: readonly ["poc-ledger", "poc-export", "poc-submit"];
/**
 * Structural slice of the `skills` service this module depends on.
 *
 * Declared locally instead of importing `@deepseek-ai/dsh-skill`: handing the
 * registry one object literal is not worth a runtime dependency, and only a
 * profile that actually provides the service ever resolves this shape.
 */
export interface SkillRegistryLike {
    /** Publish one readonly runtime skill into the calling context's layer. */
    register(skill: SkillRegistrationLike): () => void;
}
/** Payload accepted by {@link SkillRegistryLike.register}. */
export interface SkillRegistrationLike {
    readonly name: string;
    readonly description: string;
    readonly content: string;
    readonly source: string;
    readonly whenToUse?: string;
    readonly path?: string;
    readonly resourceBase?: SkillResourceBaseLike;
}
/** Where a skill's relative resources live; only the directory variant is used. */
export interface SkillResourceBaseLike {
    readonly kind: 'directory';
    readonly path: string;
}
/** Fields extracted from a bundled `SKILL.md`. */
export interface ParsedSkill {
    readonly name: string;
    readonly description: string;
    readonly whenToUse?: string;
    readonly content: string;
}
/** Outcome of parsing a bundled `SKILL.md`; a failure carries the reason. */
export type SkillParseResult = {
    readonly ok: true;
    readonly skill: ParsedSkill;
} | {
    readonly ok: false;
    readonly reason: string;
};
/**
 * Absolute path of the directory holding the bundled skills.
 *
 * `src/` and `lib/` both sit directly under the package root, so the same
 * relative URL resolves whether the plugin runs from source (tests) or from the
 * built package (an installed profile).
 */
export declare function bundledSkillsDirectory(): string;
/**
 * Parse the single-line `key: value` frontmatter of a bundled `SKILL.md`.
 *
 * Deliberately not a YAML parser: these files only carry string scalars we
 * control, and a plugin should not pull a YAML dependency to read its own
 * resources. A value may be wrapped in one matching pair of quotes, which are
 * stripped; escape sequences are left exactly as written.
 */
export declare function parseSkillMarkdown(source: string): SkillParseResult;
/**
 * Register the bundled skills into the running profile's skill catalog.
 *
 * Called from `apply`, and returns immediately: the actual registration happens
 * on the injected child fiber, whenever the `skills` service exists. Nothing
 * here is order-sensitive, and nothing here can fail a mount — a profile that
 * never provides a skill registry simply never runs the callback.
 *
 * `skills` is deliberately **not** in the plugin's static `inject`: that would
 * hold the whole plugin in PENDING until the registry appears, and a profile
 * without one would never mount the dashboard at all.
 */
export declare function registerBundledSkills(ctx: Context, options?: {
    readonly dir?: string;
}): void;
