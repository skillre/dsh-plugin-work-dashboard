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
import type { Context } from '@deepseek-ai/cordis';
import { resolveConfig } from './config.js';
import type { WorkDashboardConfig } from './config.js';
import { RepoError } from './repo.js';
import type { ConsoleActions } from './transport.js';
export { resolveConfig };
export { Config } from './config.js';
export declare const name = "skillre-work-dashboard";
/**
 * Required services. `connection` provides the authenticated Client route; it
 * is a hard dependency so a profile without it fails loudly instead of mounting
 * a board that can never be reached.
 */
export declare const inject: string[];
/** The console facade the route dispatches onto. */
export interface DashboardRuntime extends ConsoleActions {
    /** Wipe the cache (mount) and resolve the store. */
    prepare(): Promise<void>;
}
/** Build the runtime around one resolved configuration. */
export declare function createRuntime(config: WorkDashboardConfig, options?: {
    home?: string;
    now?: () => Date;
}): DashboardRuntime;
export declare function apply(ctx: Context, rawConfig?: Partial<WorkDashboardConfig>): void;
/** Re-export the error type so tests and the transport share one identity. */
export { RepoError };
