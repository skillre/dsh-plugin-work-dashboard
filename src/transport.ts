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

import { z } from 'zod'
import { RepoError } from './repo.js'
import type { ExportOutcome, GlobalTimeline, PocRequest, ProjectDetail, RefreshOutcome, RiskBoard, Snapshot } from './types.js'
import { ENDPOINT } from './types.js'

/** Path of the exact route, under the shared `/api` channel. */
export const EXECUTE_PATH = `/api/${ENDPOINT}`

/** One buffered exact Fetch route as the Connection registry accepts it. */
export interface FetchRoute {
  readonly path: string
  readonly methods: readonly ['POST']
  readonly requestBody: 'buffered'
  readonly fetch: (request: Request) => Promise<Response>
}

/** The Host Connection face this plugin depends on. */
export interface HostConnection {
  readonly fetch: { register(route: FetchRoute): () => Promise<void> }
}

/** The console operations the route dispatches onto. */
export interface ConsoleActions {
  /** The current snapshot; a cold cache reports `cacheReady: false`. */
  snapshot(): Promise<Snapshot>
  /** Clone or fast-forward the cache, then return the new snapshot. */
  refresh(): Promise<{ snapshot: Snapshot; outcome: RefreshOutcome }>
  /** One project's detail, or `null` when the id is unknown. */
  detail(pocId: string): Promise<ProjectDetail | null>
  /** Generate the self-contained HTML form for the selected projects. */
  exportForm(input: { pocIds: string[]; mode: 'fill' | 'blank' }): Promise<ExportOutcome>
  /** Every project's risks, sorted by severity. */
  risks(): Promise<RiskBoard>
  /** Every project's rounds, newest first. */
  timeline(): Promise<GlobalTimeline>
}

const envelopeSchema = z.object({
  type: z.literal('client-request'),
  rpcId: z.string(),
  method: z.string(),
  payload: z.unknown(),
})

/** The ledger ids are `POC-YYYY-NNN`; accept that shape and nothing exotic. */
const pocIdSchema = z.string().min(1).max(128)


const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }).strict(),
  z.object({ action: z.literal('refresh') }).strict(),
  z.object({ action: z.literal('detail'), pocId: pocIdSchema }).strict(),
  z.object({ action: z.literal('export'), pocIds: z.array(pocIdSchema).max(500), mode: z.enum(['fill', 'blank']) }).strict(),
  z.object({ action: z.literal('risks') }).strict(),
  z.object({ action: z.literal('timeline') }).strict(),
])

/** A JSON response with no-store caching; the board is always live state. */
function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } })
}

/** One server-response success envelope. */
function success(rpcId: string, value: unknown): Response {
  return json({ type: 'server-response', rpcId, result: { ok: true, value } })
}

/** One server-response failure envelope, using a stable plugin-owned code. */
function failure(rpcId: string, code: string, message: string, details: Record<string, unknown> = {}): Response {
  return json({ type: 'server-response', rpcId, result: { ok: false, error: { code: `work-dashboard/${code}`, message, details } } })
}

/** Recover the correlation id from any body shape so failures stay correlatable. */
function correlation(body: unknown): string {
  return body !== null && typeof body === 'object' && 'rpcId' in body && typeof (body as { rpcId?: unknown }).rpcId === 'string'
    ? (body as { rpcId: string }).rpcId
    : 'invalid-request'
}

/** Dispatch one validated request onto the console actions. */
async function dispatch(actions: ConsoleActions, request: PocRequest, signal: AbortSignal): Promise<unknown> {
  switch (request.action) {
    case 'list':
      return actions.snapshot()
    case 'refresh': {
      const { snapshot, outcome } = await actions.refresh()
      return { snapshot, outcome }
    }
    case 'detail': {
      const detail = await actions.detail(request.pocId)
      if (detail === null) throw new RepoError('unknown-project', `No project with poc_id ${JSON.stringify(request.pocId)}.`, { pocId: request.pocId })
      return detail
    }
    case 'export':
      return actions.exportForm({ pocIds: request.pocIds, mode: request.mode })
    case 'risks':
      return actions.risks()
    case 'timeline':
      return actions.timeline()
  }
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
  onInternalError?(error: unknown): void
}

export function createExecuteRoute(ready: () => Promise<ConsoleActions>, options: ExecuteRouteOptions = {}): FetchRoute {
  return {
    path: EXECUTE_PATH,
    methods: ['POST'],
    requestBody: 'buffered',
    async fetch(request: Request): Promise<Response> {
      if (request.method !== 'POST' || new URL(request.url).pathname !== EXECUTE_PATH) return new Response('not found', { status: 404 })
      const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
      if (contentType !== 'application/json') return new Response('content type must be application/json', { status: 415 })
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return new Response('body is not JSON', { status: 400 })
      }
      if (request.signal.aborted) return failure(correlation(body), 'cancelled', 'The request was cancelled before dispatch.')
      const envelope = envelopeSchema.safeParse(body)
      if (!envelope.success) return failure(correlation(body), 'bad-request', 'Invalid client-request message.')
      const message = envelope.data
      if (message.method !== ENDPOINT) return failure(message.rpcId, 'bad-request', 'RPC method does not match the POC console endpoint.')
      const parsed = requestSchema.safeParse(message.payload)
      if (!parsed.success) {
        const first = parsed.error.issues[0]
        return failure(message.rpcId, 'bad-request', first?.message ?? 'Invalid POC console request.', { issues: parsed.error.issues.slice(0, 4) })
      }
      try {
        request.signal.throwIfAborted()
        return success(message.rpcId, await dispatch(await ready(), parsed.data as PocRequest, request.signal))
      } catch (error) {
        // Both authored failure families keep their stable code; anything else
        // stays a generic internal error with the detail only in the Host log.
        if (error instanceof RepoError) {
          return failure(correlation(body), error.code, error.message.slice(0, 2000), error.details)
        }
        if (request.signal.aborted) return failure(correlation(body), 'cancelled', 'The request was cancelled.')
        options.onInternalError?.(error)
        return failure(correlation(body), 'internal', 'The POC console hit an internal error; check the Host log.')
      }
    },
  }
}
