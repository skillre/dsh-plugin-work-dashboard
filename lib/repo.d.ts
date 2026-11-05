/**
 * Local git cache of the POC ledger repository.
 *
 * Three invariants drive this module:
 *
 * 1. **The cache is disposable.** It is wiped at mount and rebuilt on demand,
 *    so the plugin can never corrupt the real data source: the repository on
 *    GitHub stays the only truth.
 * 2. **The cache is only ever a fast-forward copy.** A refresh is
 *    `clone` (first time) or `fetch --depth 1` + `reset --hard origin/<branch>`.
 *    Never `pull`: a merge could block on a conflict in a directory nobody is
 *    meant to edit.
 * 3. **A refresh is exclusive.** One lock file keeps two console instances in
 *    the same DSH home from cloning into the same directory at once.
 *
 * Authentication is deliberately never stored: the token is read from the
 * already-authenticated `gh` CLI at call time and passed to git through an
 * environment-scoped `http.extraheader`, so it never lands in `.git/config`,
 * never appears in a process argument list, and never reaches the Client.
 */
/** Failure carrying a stable code the transport maps onto the RPC envelope. */
export declare class RepoError extends Error {
    readonly code: string;
    readonly details: Record<string, unknown>;
    constructor(code: string, message: string, details?: Record<string, unknown>);
}
/** Largest single YAML file the store will read, in bytes. */
export declare const MAX_YAML_BYTES: number;
/** Resolved cache settings this module needs. */
export interface RepoOptions {
    /** Absolute cache root; wiped at mount. */
    cacheRoot: string;
    /** `owner/name` on GitHub. */
    repository: string;
    /** Branch tracked by the clone. */
    branch: string;
    /** Clone URL; the canonical GitHub URL unless overridden. */
    remoteUrl: string;
    /** Ceiling for one clone, in milliseconds. */
    cloneTimeoutMs: number;
    /** Ceiling for one fetch + reset, in milliseconds. */
    fetchTimeoutMs: number;
}
/**
 * Reject a cache root that is obviously not a disposable directory.
 *
 * The mount wipes this path, so a mistaken value (home, `/`, a parent of the
 * DSH home) must fail at mount rather than delete real user data.
 */
export declare function assertSafeCacheRoot(cacheRoot: string, home: string): string;
/** Result of one successful refresh. */
export interface RefreshResult {
    mode: 'clone' | 'fetch';
    durationMs: number;
    finishedAt: string;
    /** Short HEAD sha the cache now points at. */
    head: string;
}
/**
 * The disposable git cache.
 *
 * Lifecycle: `prepare()` at mount wipes and recreates the cache root; the first
 * `refresh()` clones, later ones fast-forward. Every method is safe to call
 * concurrently except that refreshes serialize on a lock.
 */
export declare class RepoCache {
    private readonly options;
    /** Directory the ledger is read from once a clone exists. */
    readonly repoPath: string;
    private fetchedAt;
    private head;
    constructor(options: RepoOptions);
    /**
     * Wipe the cache and recreate it, so every DSH start begins from "no data".
     *
     * Only a directory this plugin created is ever removed: a pre-existing
     * directory without the ownership marker fails loudly instead of being
     * deleted, because a mistaken `cacheRoot` must not destroy user files.
     */
    prepare(): Promise<void>;
    /**
     * Map a filesystem failure onto an authored, user-actionable code.
     *
     * The cache lives under `$DSH_HOME/cache`, which the Host process normally
     * owns; a sandboxed or read-only deployment can deny it. Without this mapping
     * the first request would surface as an opaque "internal error".
     */
    private fsFailure;
    private hasMarker;
    /**
     * An empty directory is safe to adopt: nothing can be lost by clearing it.
     *
     * This matters on the very first mount, when `mkdir -p` may have been run
     * outside the plugin (a user pre-creating `~/.dsh/cache/work-dashboard`), and on
     * a re-mount after a wipe that left the root empty.
     */
    private isEmptyDirectory;
    /** Whether a clone exists and its working tree is readable. */
    isReady(): Promise<boolean>;
    /** ISO timestamp of the last successful refresh in this process. */
    get lastFetchedAt(): string | null;
    /** The configured `owner/name` data source. */
    get repository(): string;
    /** The configured branch the cache tracks. */
    get branch(): string;
    /** Short HEAD sha after the last successful refresh, if known. */
    get lastHead(): string | null;
    /** Read the `gh` token at call time; absent when `gh` is not authenticated. */
    private ghToken;
    /**
     * Clone or fast-forward the cache.
     *
     * Serialized by a lock file in the cache root: two browser tabs pressing
     * refresh, or two DSH instances sharing a home, must not clone into the same
     * directory concurrently.
     */
    refresh(): Promise<RefreshResult>;
    /** Take the cache lock, waiting briefly and reclaiming a stale one. */
    private acquireLock;
    /** Every `projects/*.yaml` file path in the cache, sorted by file name. */
    projectFiles(): Promise<string[]>;
    /** Read one project file, bounded so one huge file cannot stall the console. */
    readProject(path: string): Promise<string>;
}
