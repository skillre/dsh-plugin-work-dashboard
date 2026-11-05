/**
 * Host ↔ Client transport: one exact Fetch route inside Connection's fence.
 *
 * Connection owns the Host/Origin check, the browser-session authentication and
 * the Peer scope; this module registers one exact `POST /api/<endpoint>` route
 * and only validates its own envelope and payload. No physical server, no
 * Express, and no second RPC channel is claimed.
 *
 * The wire envelope is the inspected Connection unary shape:
 * `{ type: 'client-request', rpcId, method, payload }` in and
 * `{ type: 'server-response', rpcId, result: { ok: true, value } | { ok: false, error } }`
 * out. A non-owner Peer is rejected by Connection before this handler runs.
 */
import type { ExportOutcome, GlobalTimeline, ProjectDetail, RefreshOutcome, RiskBoard, Snapshot } from './types.js';
/** Path of the exact route, under the shared `/api` channel. */
export declare const EXECUTE_PATH = "/api/skillre-work-dashboard/execute";
/** One buffered exact Fetch route as the Connection registry accepts it. */
export interface FetchRoute {
    readonly path: string;
    readonly methods: readonly ['POST'];
    readonly requestBody: 'buffered';
    readonly fetch: (request: Request) => Promise<Response>;
}
/** The Host Connection face this plugin depends on. */
export interface HostConnection {
    readonly fetch: {
        register(route: FetchRoute): () => Promise<void>;
    };
}
/** The console operations the route dispatches onto. */
export interface ConsoleActions {
    /** The current snapshot; a cold cache reports `cacheReady: false`. */
    snapshot(): Promise<Snapshot>;
    /** Clone or fast-forward the cache, then return the new snapshot. */
    refresh(): Promise<{
        snapshot: Snapshot;
        outcome: RefreshOutcome;
    }>;
    /** One project's detail, or `null` when the id is unknown. */
    detail(pocId: string): Promise<ProjectDetail | null>;
    /** Generate the self-contained HTML form for the selected projects. */
    exportForm(input: {
        pocIds: string[];
        mode: 'fill' | 'blank';
    }): Promise<ExportOutcome>;
    /** Every project's risks, sorted by severity. */
    risks(): Promise<RiskBoard>;
    /** Every project's rounds, newest first. */
    timeline(): Promise<GlobalTimeline>;
}
/**
 * Build the exact route Connection registers; every failure stays inside the
 * envelope. A `RepoError` is authored for the user; anything else is a Host
 * fault whose text must not become UI copy (and must not leak backend detail).
 */
export interface ExecuteRouteOptions {
    /**
     * Report an internal fault to the Host log.
     *
     * The response stays a generic message (no backend detail may reach UI copy),
     * but a swallowed error is undiagnosable, so the plugin hands the real
     * failure to the Host logger exactly once per request.
     */
    onInternalError?(error: unknown): void;
}
export declare function createExecuteRoute(ready: () => Promise<ConsoleActions>, options?: ExecuteRouteOptions): FetchRoute;
