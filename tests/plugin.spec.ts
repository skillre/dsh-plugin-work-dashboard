import { describe, expect, it } from 'vitest'
import * as plugin from '../src/index.js'
import { createRuntime } from '../src/index.js'
import { resolveConfig } from '../src/config.js'
import { RepoError } from '../src/repo.js'

/**
 * Host entry contract tests.
 *
 * They cover the mount contract (name, `inject`, the hard dependency), the
 * Fiber ownership of the route registration, and the cache-wipe behaviour at
 * mount. The git work itself is covered by the isolated-profile integration
 * test; here the cache is driven through a real temporary directory.
 */

/** A minimal Cordis context double that records what the plugin registers. */
function contextWith(services: Record<string, unknown>) {
  const effects: string[] = []
  const ctx = {
    logger: { error: () => {} },
    get: (key: string) => services[key],
    effect: (callback: () => unknown, label?: string) => {
      effects.push(label ?? '')
      const dispose = callback()
      return typeof dispose === 'function' ? dispose : () => {}
    },
  }
  return { ctx, effects }
}

/** A unique cache root per test, so parallel files cannot collide. */
function cacheRoot(suffix: string): string {
  return `${process.env.TMPDIR ?? '/tmp'}/poc-console-unit-${suffix}-${Date.now()}`
}

describe('mount contract', () => {
  it('exports the Cordis function-plugin contract', () => {
    expect(plugin.name).toBe('skillre-work-dashboard')
    expect(plugin.apply).toBeTypeOf('function')
    expect('default' in plugin).toBe(false)
  })

  it('declares only the service it cannot run without', () => {
    expect(plugin.inject).toEqual(['connection'])
  })

  it('fails loudly instead of mounting without the Connection registry', () => {
    const { ctx, effects } = contextWith({})
    expect(() => (plugin.apply as (context: unknown, config?: unknown) => void)(ctx)).toThrow(/Connection exact Fetch-route registry/)
    expect(effects).toEqual([])
  })

  it('rejects an invalid repository before registering anything', () => {
    const { ctx, effects } = contextWith({ connection: { fetch: { register: () => async () => {} } } })
    expect(() => (plugin.apply as (context: unknown, config?: unknown) => void)(ctx, { repository: 'nope' })).toThrow(/owner\/name/)
    expect(effects).toEqual([])
  })
})

describe('route registration', () => {
  it('registers the exact route inside a Fiber effect', () => {
    let routePath: string | null = null
    const { ctx, effects } = contextWith({
      connection: {
        fetch: {
          register: (route: { path: string }) => {
            routePath = route.path
            return async () => {}
          },
        },
      },
    })
    ;(plugin.apply as (context: unknown, config?: unknown) => void)(ctx, { cacheRoot: cacheRoot('route'), repository: 'skillre/workbranch' })
    expect(routePath).toBe('/api/skillre-work-dashboard/execute')
    // The cache lifetime and the route are both owned by the plugin's Fiber.
    expect(effects).toEqual(['skillre-work-dashboard cache lifetime', 'skillre-work-dashboard client route'])
  })
})

describe('createRuntime', () => {
  it('wipes the cache on prepare, so a fresh mount has no data', async () => {
    const runtime = createRuntime(resolveConfig({ cacheRoot: cacheRoot('cold') }), { home: '/tmp' })
    await runtime.prepare()
    const snapshot = await runtime.snapshot()
    expect(snapshot.cacheReady).toBe(false)
    expect(snapshot.projects).toEqual([])
    expect(snapshot.repository).toBe('skillre/workbranch')
  })

  it('returns null detail for an unknown project on a cold cache', async () => {
    const runtime = createRuntime(resolveConfig({ cacheRoot: cacheRoot('detail') }), { home: '/tmp' })
    await runtime.prepare()
    expect(await runtime.detail('POC-2026-001')).toBeNull()
  })

  it('reports a refresh failure as an authored RepoError the transport can map', async () => {
    // A repository that cannot exist forces the failure path deterministically,
    // whatever credentials the machine happens to hold. The point is that the
    // failure is an authored RepoError with a stable code, never a raw
    // child-process error or a leaked git message.
    const runtime = createRuntime(
      resolveConfig({ cacheRoot: cacheRoot('refresh'), repository: 'skillre/definitely-not-a-real-repository-xyz', cloneTimeoutMs: 20_000 }),
      { home: '/tmp' },
    )
    await runtime.prepare()
    const error = await runtime.refresh().then(() => null, (caught: unknown) => caught)
    expect(error).toBeInstanceOf(RepoError)
    expect((error as RepoError).code).toMatch(/auth|not-found|network|git-failed|gh-unauthenticated|timeout/)
  }, 45_000)
})
