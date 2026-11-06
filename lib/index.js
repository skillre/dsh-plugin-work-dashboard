/**
 * Host entry of the work dashboard.
 *
 * Ownership split: this half owns the disposable git cache, the YAML parse and
 * the gap scan, and exposes them through one Connection route; the Client half
 * owns only view state (which page, which project, the refresh cadence).
 *
 * Everything registered here belongs to this plugin's Fiber, so stopping or
 * updating the row releases the route and the cache lifetime with no residue.
 *
 * The cache is wiped at mount, per the specification: the repository on GitHub
 * is the only truth, and a stale local copy must never be mistaken for it.
 */
import { homedir } from 'node:os';
import YAML from 'yaml';
import { resolveConfig, expandHome, remoteUrlFor } from './config.js';
import { PocStore } from './store.js';
import { RepoCache, RepoError, assertSafeCacheRoot } from './repo.js';
import { buildRiskBoard } from './risks.js';
import { buildGlobalTimeline } from './timeline.js';
import { registerBundledSkills } from './skill.js';
import { createExecuteRoute } from './transport.js';
export { resolveConfig };
export { Config } from './config.js';
export const name = 'skillre-work-dashboard';
/**
 * Required services. `connection` provides the authenticated Client route; it
 * is a hard dependency so a profile without it fails loudly instead of mounting
 * a board that can never be reached.
 */
export const inject = ['connection'];
/** Read an optional Cordis service without declaring it required. */
function service(ctx, key) {
    return ctx.get(key);
}
/** Build the runtime around one resolved configuration. */
export function createRuntime(config, options = {}) {
    const home = options.home ?? homedir();
    const cacheRoot = assertSafeCacheRoot(expandHome(config.cacheRoot, home), home);
    const now = options.now ?? (() => new Date());
    const remoteUrl = remoteUrlFor(config);
    const cache = new RepoCache({
        cacheRoot,
        repository: config.repository,
        branch: config.defaultBranch,
        remoteUrl,
        cloneTimeoutMs: config.cloneTimeoutMs,
        fetchTimeoutMs: config.fetchTimeoutMs,
    });
    const store = new PocStore(cache, { now, stallDays: config.stallDays });
    let prepared = null;
    /**
     * Load the records, treating a cold cache as an EMPTY ledger.
     *
     * The board, the risk board and the timeline are all reachable before the
     * first Refresh; "no data yet" is the honest answer there, so a missing clone
     * (or a repository without `projects/`) yields no records rather than an error.
     */
    const loadOrEmpty = async () => {
        try {
            return (await store.load()).records;
        }
        catch (error) {
            if (error instanceof RepoError && (error.code === 'no-projects' || error.code === 'not-found'))
                return [];
            throw error;
        }
    };
    return {
        async prepare() {
            prepared ??= cache.prepare();
            return prepared;
        },
        async snapshot() {
            await this.prepare();
            return store.snapshot();
        },
        async refresh() {
            await this.prepare();
            const outcome = await cache.refresh();
            return { snapshot: await store.snapshot(), outcome };
        },
        async detail(pocId) {
            await this.prepare();
            return store.detail(pocId);
        },
        async risks() {
            await this.prepare();
            return buildRiskBoard(await loadOrEmpty(), { now: now(), stallDays: config.stallDays });
        },
        async timeline() {
            await this.prepare();
            return buildGlobalTimeline(await loadOrEmpty(), { stallDays: config.stallDays });
        },
    };
}
export function apply(ctx, rawConfig = {}) {
    const config = resolveConfig(rawConfig);
    const connection = service(ctx, 'connection');
    if (!connection?.fetch?.register)
        throw new Error('work dashboard requires the current DSH Connection exact Fetch-route registry.');
    const runtime = createRuntime(config);
    // The three POC skills ship inside this package, so installing the dashboard
    // is what publishes them and uninstalling is what removes them. Registration
    // is optional-service and best-effort: a profile without a skill registry
    // still gets the board (see src/skill.ts).
    registerBundledSkills(ctx);
    // The wipe runs once, on mount. It is not awaited here — a filesystem failure
    // must not abort the Fiber — but it is logged once and then surfaces on the
    // first request through the shared `prepared` promise.
    runtime.prepare().catch((error) => {
        ctx.logger?.error?.(`work-dashboard: cache preparation failed: ${error instanceof Error ? error.message : String(error)}`);
    });
    ctx.effect(() => () => {
        // The cache is a plain directory that the next mount wipes anyway; the
        // effect exists so the Fiber owns the runtime's lifetime explicitly.
        void runtime;
    }, 'skillre-work-dashboard cache lifetime');
    ctx.effect(() => connection.fetch.register(createExecuteRoute(async () => runtime, {
        onInternalError(error) {
            const detail = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error);
            ctx.logger?.error?.(`work-dashboard: request failed internally: ${detail}`);
            // Also surface it on the Host stderr: a DSH deployment may not route
            // `ctx.logger` to a place the operator looks at.
            process.stderr.write(`[work-dashboard] internal error: ${detail}\n`);
        },
    })), 'skillre-work-dashboard client route');
}
/** Re-export the error type so tests and the transport share one identity. */
export { RepoError };
