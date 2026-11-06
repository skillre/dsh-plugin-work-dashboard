/**
 * Typed Client-side API over the Host's exact Connection route.
 *
 * The browser RPC caller validates the envelope and the correlation id, so this
 * layer only has to unwrap the endpoint's own result: `ok: true` returns the
 * value, `ok: false` throws an {@link ActionError} carrying the Host's stable
 * code and message. No Host object, function or live Session value crosses this
 * boundary — only lossless JSON.
 */

import type { ClientConnectionLike, RpcResult } from './contracts.js'
import { ENDPOINT } from '../types.js'
import type { GlobalTimeline, PocRequest, ProjectDetail, RefreshOutcome, RiskBoard, Snapshot } from '../types.js'

/** Failure raised by the Host; `code` is stable enough to switch on. */
export class ActionError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = 'ActionError'
  }
}

/** The one API face the view uses. */
export interface ClientApi {
  /** Current snapshot; `cacheReady: false` means "no data pulled yet". */
  list(signal?: AbortSignal): Promise<Snapshot>
  /** Clone or fast-forward, then return the new snapshot and what happened. */
  refresh(signal?: AbortSignal): Promise<{ snapshot: Snapshot; outcome: RefreshOutcome }>
  /** One project's detail page. */
  detail(pocId: string, signal?: AbortSignal): Promise<ProjectDetail>
  /** Risks across all projects, sorted by severity. */
  risks(signal?: AbortSignal): Promise<RiskBoard>
  /** Rounds across all projects, newest first. */
  timeline(signal?: AbortSignal): Promise<GlobalTimeline>
}

/** Unwrap one endpoint result, converting a failure into a thrown error. */
function unwrap<T>(result: RpcResult<T>): T {
  if (result === null || typeof result !== 'object' || !('ok' in result)) {
    throw new ActionError('invalid-response', 'The Host returned an invalid work dashboard response.')
  }
  if (!result.ok) throw new ActionError(result.error.code, result.error.message, result.error.details)
  return result.value
}

/** Create the API bound to this plugin's Fiber lifetime. */
export function createApi(connection: ClientConnectionLike, lifetime: AbortSignal): ClientApi {
  const call = async <T>(request: PocRequest, signal?: AbortSignal): Promise<T> => {
    const signalToUse = signal === undefined ? lifetime : AbortSignal.any([lifetime, signal])
    return unwrap(await connection.rpc.call<T>('/api', ENDPOINT, request, signalToUse))
  }
  return {
    list: (signal) => call<Snapshot>({ action: 'list' }, signal),
    refresh: (signal) => call<{ snapshot: Snapshot; outcome: RefreshOutcome }>({ action: 'refresh' }, signal),
    detail: (pocId, signal) => call<ProjectDetail>({ action: 'detail', pocId }, signal),
    risks: (signal) => call<RiskBoard>({ action: 'risks' }, signal),
    timeline: (signal) => call<GlobalTimeline>({ action: 'timeline' }, signal),
  }
}
