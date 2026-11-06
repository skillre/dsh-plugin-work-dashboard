/**
 * Plugin configuration.
 *
 * Schemastery is the loader-facing schema: DSH resolves a row's `config`
 * through it before `apply` runs, so every tunable value has a declared
 * default and an out-of-range value fails loudly at mount time instead of
 * silently cloning into the wrong directory.
 */
import Schema from '@deepseek-ai/schemastery';
/** Default cache root, under the DSH home so a system cleaner never eats it. */
export const DEFAULT_CACHE_ROOT = '~/.dsh/cache/work-dashboard';
/** The schema DSH resolves a `skillre-work-dashboard` row's config through. */
export const Config = Schema.object({
    repository: Schema.string().default('skillre/workbranch'),
    remoteUrl: Schema.string().default(''),
    cacheRoot: Schema.string().default(DEFAULT_CACHE_ROOT),
    defaultBranch: Schema.string().default('main'),
    cloneTimeoutMs: Schema.number().min(5_000).max(600_000).step(1).default(120_000),
    fetchTimeoutMs: Schema.number().min(5_000).max(600_000).step(1).default(60_000),
    stallDays: Schema.number().min(1).max(365).step(1).default(45),
});
/** `owner/name` on GitHub; the only repository shape the clone command accepts. */
const REPOSITORY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9._-]{1,100}$/;
/** Branch names git accepts, minus the ref-spec metacharacters. */
const BRANCH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,200}$/;
/**
 * Resolve raw row config, keeping the declared defaults authoritative.
 *
 * The shape checks that Schemastery cannot express (a repository is
 * `owner/name`, a branch has no ref-spec metacharacters) run here so a typo
 * fails at mount with a readable message instead of as a git exit code later.
 */
export function resolveConfig(raw = {}) {
    const resolved = Config(raw);
    if (!REPOSITORY_PATTERN.test(resolved.repository)) {
        throw new Error(`work dashboard: repository must be "owner/name" on GitHub, received ${JSON.stringify(resolved.repository)}.`);
    }
    if (!BRANCH_PATTERN.test(resolved.defaultBranch) || resolved.defaultBranch.includes('..')) {
        throw new Error(`work dashboard: defaultBranch is not a valid git branch name: ${JSON.stringify(resolved.defaultBranch)}.`);
    }
    if (resolved.cacheRoot.trim() === '')
        throw new Error('work dashboard: cacheRoot must not be empty.');
    const remote = resolved.remoteUrl.trim();
    if (remote !== '' && !/^(?:https:\/\/[^\s]+|git@[^\s:]+:.+|file:\/\/[^\s]+|\/[^\s]+)$/.test(remote)) {
        throw new Error(`work dashboard: remoteUrl is not a supported git URL: ${JSON.stringify(remote)}.`);
    }
    return resolved;
}
/**
 * Expand a leading `~` to the current user's home directory.
 *
 * Kept out of {@link resolveConfig} so the resolved config stays a faithful
 * echo of what the profile declared, and every filesystem use expands at the
 * point of use instead.
 */
/** The clone URL for the configured source, honoring the `remoteUrl` override. */
export function remoteUrlFor(config) {
    const override = config.remoteUrl.trim();
    return override === '' ? `https://github.com/${config.repository}.git` : override;
}
export function expandHome(path, home) {
    if (path === '~')
        return home;
    if (path.startsWith('~/'))
        return `${home}/${path.slice(2)}`;
    return path;
}
