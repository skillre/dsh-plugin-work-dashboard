import { describe, expect, it } from 'vitest'
import { Config, expandHome, remoteUrlFor, resolveConfig } from '../src/config.js'

/**
 * Configuration contract tests.
 *
 * The schema is the mount-time gate: a typo in a profile's patch must fail
 * loudly here rather than as a git exit code at the first refresh.
 */

describe('resolveConfig', () => {
  it('fills every declared default', () => {
    expect(resolveConfig({})).toEqual({
      repository: 'skillre/workbranch',
      remoteUrl: '',
      cacheRoot: '~/.dsh/cache/work-dashboard',
      defaultBranch: 'main',
      cloneTimeoutMs: 120_000,
      fetchTimeoutMs: 60_000,
      // v3 rule 12: a project is stalled after 45 days in one stage.
      stallDays: 45,
    })
  })

  it('keeps a valid override', () => {
    const config = resolveConfig({ repository: 'skillre/other-repo', cacheRoot: '/tmp/work-dashboard-cache', stallDays: 7 })
    expect(config.repository).toBe('skillre/other-repo')
    expect(config.cacheRoot).toBe('/tmp/work-dashboard-cache')
    expect(config.stallDays).toBe(7)
  })

  it('rejects a repository that is not owner/name', () => {
    expect(() => resolveConfig({ repository: 'workbranch' })).toThrow(/owner\/name/)
    expect(() => resolveConfig({ repository: 'skillre/workbranch/extra' })).toThrow(/owner\/name/)
    expect(() => resolveConfig({ repository: '' })).toThrow(/owner\/name/)
  })

  it('rejects a branch that git could read as a ref-spec injection', () => {
    expect(() => resolveConfig({ defaultBranch: 'main..evil' })).toThrow(/branch/)
    expect(() => resolveConfig({ defaultBranch: '' })).toThrow(/branch/)
  })

  it('rejects an empty cache root', () => {
    expect(() => resolveConfig({ cacheRoot: '   ' })).toThrow(/cacheRoot/)
  })

  it('rejects an out-of-range timeout through the schema', () => {
    // Schemastery rejects the value before the shape checks run.
    expect(() => (Config as unknown as (value: unknown) => unknown)({ cloneTimeoutMs: 100 })).toThrow()
  })
})

describe('remoteUrlFor', () => {
  it('defaults to the canonical GitHub URL', () => {
    expect(remoteUrlFor(resolveConfig({}))).toBe('https://github.com/skillre/workbranch.git')
  })

  it('honors an explicit override, which is how a local test remote is used', () => {
    expect(remoteUrlFor(resolveConfig({ remoteUrl: '/tmp/remote.git' }))).toBe('/tmp/remote.git')
  })

  it('rejects a URL shape git could not clone', () => {
    expect(() => resolveConfig({ remoteUrl: 'not a url' })).toThrow(/remoteUrl/)
  })
})

describe('expandHome', () => {
  it('expands only a leading tilde', () => {
    expect(expandHome('~/.dsh/cache/work-dashboard', '/home/u')).toBe('/home/u/.dsh/cache/work-dashboard')
    expect(expandHome('~', '/home/u')).toBe('/home/u')
    expect(expandHome('/abs/path', '/home/u')).toBe('/abs/path')
    expect(expandHome('/a/~/b', '/home/u')).toBe('/a/~/b')
  })
})
