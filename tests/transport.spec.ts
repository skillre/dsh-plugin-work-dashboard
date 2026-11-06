import { describe, expect, it } from 'vitest'
import { createExecuteRoute, EXECUTE_PATH } from '../src/transport.js'
import { RepoError } from '../src/repo.js'
import { ENDPOINT, type ProjectDetail, type Snapshot } from '../src/types.js'
import type { ConsoleActions } from '../src/transport.js'

/**
 * Transport contract tests.
 *
 * They drive the exact Fetch route with real `Request` objects, so the envelope
 * validation, the content-type gate, the correlation id and the error mapping
 * are exercised the way Connection's shared Fetch handler will call them.
 */

const SNAPSHOT: Snapshot = {
  cacheReady: false,
  repository: 'skillre/workbranch',
  fetchedAt: null,
  cachePath: '/tmp/poc/repo',
  projects: [],
  stats: { total: 0, g0Passed: 0, inProgress: 0, amountTotalWan: 0, g0Complete: 0, awaitingCustomer: 0, succeeded: 0, stopped: 0 },
  gaps: [],
  warnings: [],
}

const DETAIL = { summary: { pocId: 'POC-2026-001' } } as unknown as ProjectDetail

/** Build one request envelope the way the browser RPC caller does. */
function request(payload: unknown, rpcId = 'rpc-1'): Request {
  return new Request(`http://127.0.0.1:1${EXECUTE_PATH}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://127.0.0.1:1' },
    body: JSON.stringify({ type: 'client-request', rpcId, method: ENDPOINT, payload }),
  })
}

/** A console double with configurable behaviour. */
function actions(overrides: Partial<ConsoleActions> = {}): () => Promise<ConsoleActions> {
  return async () => ({
    async snapshot() { return SNAPSHOT },
    async refresh() {
      return { snapshot: SNAPSHOT, outcome: { mode: 'clone' as const, durationMs: 1234, finishedAt: '2026-11-05T04:00:00.000Z' } }
    },
    async detail(pocId: string) { return pocId === 'POC-2026-001' ? DETAIL : null },
    async validate(input: { pocId: string | null; source: string; fileName: string; intent: 'import' | 'create' }) {
      return { report: { ok: true, pocId: input.pocId ?? 'POC-2026-009', name: 'X', exists: false, findings: [], warnings: [] }, diff: { entries: [], notes: [] } }
    },
    async submit() {
      return { branch: 'import/POC-2026-001-20261105', commit: 'abc', prUrl: 'https://github.com/skillre/workbranch/pull/1', prNumber: 1, mode: 'import' as const, durationMs: 10 }
    },
    async template(input: { pocId: string; name: string }) { return { pocId: input.pocId, source: `poc_id: ${input.pocId}` } },
    async exportForm(input: { pocIds: string[]; mode: 'fill' | 'blank' }) {
      return { html: '<html></html>', fileName: 'form.html', pocIds: input.pocIds, mode: input.mode, bytes: 13 }
    },
    async risks() { return { rows: [], counts: { high: 0, medium: 0, low: 0, unset: 0, total: 0 }, projectsWithRisks: 0, projectsTotal: 0 } },
    async timeline() { return { entries: [], range: null, months: [], silentProjects: [] } },
    ...overrides,
  })
}

/** Read one response as its JSON envelope. */
async function envelopeOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}

describe('the exact route', () => {
  it('is registered under the shared /api channel', () => {
    expect(EXECUTE_PATH).toBe('/api/skillre-work-dashboard/execute')
    const route = createExecuteRoute(actions())
    expect(route.path).toBe(EXECUTE_PATH)
    expect(route.methods).toEqual(['POST'])
    expect(route.requestBody).toBe('buffered')
  })

  it('answers list with the snapshot', async () => {
    const route = createExecuteRoute(actions())
    const response = await route.fetch(request({ action: 'list' }))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const envelope = await envelopeOf(response)
    expect(envelope).toMatchObject({ type: 'server-response', rpcId: 'rpc-1' })
    expect((envelope.result as { ok: boolean }).ok).toBe(true)
    expect(((envelope.result as { value: Snapshot }).value).repository).toBe('skillre/workbranch')
  })

  it('answers refresh with both the new snapshot and the outcome', async () => {
    const route = createExecuteRoute(actions())
    const response = await route.fetch(request({ action: 'refresh' }))
    const envelope = await envelopeOf(response)
    const value = (envelope.result as { value: { snapshot: Snapshot; outcome: { mode: string } } }).value
    expect(value.snapshot).toStrictEqual(SNAPSHOT)
    expect(value.outcome.mode).toBe('clone')
  })

  it('answers detail for a known project and fails for an unknown one', async () => {
    const route = createExecuteRoute(actions())
    const known = await envelopeOf(await route.fetch(request({ action: 'detail', pocId: 'POC-2026-001' })))
    expect((known.result as { ok: boolean }).ok).toBe(true)

    const unknown = await route.fetch(request({ action: 'detail', pocId: 'POC-9999' }, 'rpc-2'))
    const body = await envelopeOf(unknown)
    expect((body.result as { ok: boolean }).ok).toBe(false)
    expect((body.result as { error: { code: string } }).error.code).toBe('work-dashboard/unknown-project')
    expect(body.rpcId).toBe('rpc-2')
  })
})

describe('request validation', () => {
  it('rejects a wrong content type with 415', async () => {
    const route = createExecuteRoute(actions())
    const response = await route.fetch(new Request(`http://127.0.0.1:1${EXECUTE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'hello',
    }))
    expect(response.status).toBe(415)
  })

  it('rejects a non-JSON body with 400', async () => {
    const route = createExecuteRoute(actions())
    const response = await route.fetch(new Request(`http://127.0.0.1:1${EXECUTE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    }))
    expect(response.status).toBe(400)
  })

  it('rejects a foreign path or method with 404', async () => {
    const route = createExecuteRoute(actions())
    const wrongPath = await route.fetch(new Request('http://127.0.0.1:1/api/other/execute', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'x', method: ENDPOINT, payload: { action: 'list' } }),
    }))
    expect(wrongPath.status).toBe(404)
  })

  it('rejects a malformed envelope with a correlatable failure', async () => {
    const route = createExecuteRoute(actions())
    const response = await route.fetch(new Request(`http://127.0.0.1:1${EXECUTE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'wrong', rpcId: 'rpc-9', method: ENDPOINT, payload: { action: 'list' } }),
    }))
    const envelope = await envelopeOf(response)
    expect(envelope.rpcId).toBe('rpc-9')
    expect((envelope.result as { error: { code: string } }).error.code).toBe('work-dashboard/bad-request')
  })

  it('rejects an endpoint mismatch', async () => {
    const route = createExecuteRoute(actions())
    const response = await route.fetch(new Request(`http://127.0.0.1:1${EXECUTE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'rpc-3', method: 'other/endpoint', payload: { action: 'list' } }),
    }))
    const envelope = await envelopeOf(response)
    expect((envelope.result as { error: { code: string } }).error.code).toBe('work-dashboard/bad-request')
  })

  it('rejects an unknown action and an extra property', async () => {
    const route = createExecuteRoute(actions())
    for (const payload of [{ action: 'drop-tables' }, { action: 'list', extra: true }, { action: 'detail' }]) {
      const response = await route.fetch(request(payload, 'rpc-x'))
      const envelope = await envelopeOf(response)
      expect((envelope.result as { ok: boolean }).ok).toBe(false)
      expect(envelope.rpcId).toBe('rpc-x')
    }
  })
})

describe('failure mapping', () => {
  it('passes a RepoError through with its code and message', async () => {
    const route = createExecuteRoute(actions({
      async snapshot() {
        throw new RepoError('network', 'Cannot reach github.com while running git clone.', { action: 'clone' })
      },
    }))
    const response = await route.fetch(request({ action: 'list' }))
    const envelope = await envelopeOf(response)
    const error = (envelope.result as { error: { code: string; message: string; details: Record<string, unknown> } }).error
    expect(error.code).toBe('work-dashboard/network')
    expect(error.message).toContain('Cannot reach github.com')
    expect(error.details).toEqual({ action: 'clone' })
  })

  it('hides an internal fault behind a generic message', async () => {
    const route = createExecuteRoute(actions({
      async snapshot() { throw new Error('ECONNRESET at /Users/secret/path') },
    }))
    const response = await route.fetch(request({ action: 'list' }))
    const envelope = await envelopeOf(response)
    const error = (envelope.result as { error: { code: string; message: string } }).error
    expect(error.code).toBe('work-dashboard/internal')
    expect(error.message).not.toContain('secret')
    expect(error.message).not.toContain('ECONNRESET')
  })

  it('reports a cancelled request as cancelled', async () => {
    const controller = new AbortController()
    controller.abort()
    const route = createExecuteRoute(actions())
    const response = await route.fetch(new Request(`http://127.0.0.1:1${EXECUTE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'rpc-c', method: ENDPOINT, payload: { action: 'list' } }),
      signal: controller.signal,
    }))
    const envelope = await envelopeOf(response)
    expect((envelope.result as { error: { code: string } }).error.code).toBe('work-dashboard/cancelled')
  })
})
