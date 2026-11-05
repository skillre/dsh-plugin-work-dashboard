/**
 * Typed Client-side API over the Host's exact Connection route.
 *
 * The browser RPC caller validates the envelope and the correlation id, so this
 * layer only has to unwrap the endpoint's own result: `ok: true` returns the
 * value, `ok: false` throws an {@link ActionError} carrying the Host's stable
 * code and message. No Host object, function or live Session value crosses this
 * boundary — only lossless JSON.
 */
import type { ClientConnectionLike } from './contracts.js';
import type { ExportOutcome, GlobalTimeline, ProjectDetail, RefreshOutcome, RiskBoard, Snapshot } from '../types.js';
/** Failure raised by the Host; `code` is stable enough to switch on. */
export declare class ActionError extends Error {
    readonly code: string;
    readonly details: Record<string, unknown>;
    constructor(code: string, message: string, details?: Record<string, unknown>);
}
/** The one API face the view uses. */
export interface ClientApi {
    /** Current snapshot; `cacheReady: false` means "no data pulled yet". */
    list(signal?: AbortSignal): Promise<Snapshot>;
    /** Clone or fast-forward, then return the new snapshot and what happened. */
    refresh(signal?: AbortSignal): Promise<{
        snapshot: Snapshot;
        outcome: RefreshOutcome;
    }>;
    /** One project's detail page. */
    detail(pocId: string, signal?: AbortSignal): Promise<ProjectDetail>;
    /** Generate the self-contained HTML form. */
    exportForm(input: {
        pocIds: string[];
        mode: 'fill' | 'blank';
    }, signal?: AbortSignal): Promise<ExportOutcome>;
    /** Risks across all projects, sorted by severity. */
    risks(signal?: AbortSignal): Promise<RiskBoard>;
    /** Rounds across all projects, newest first. */
    timeline(signal?: AbortSignal): Promise<GlobalTimeline>;
}
/** Create the API bound to this plugin's Fiber lifetime. */
export declare function createApi(connection: ClientConnectionLike, lifetime: AbortSignal): ClientApi;
