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

import { spawn } from 'node:child_process'
import { access, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Failure carrying a stable code the transport maps onto the RPC envelope. */
export class RepoError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = 'RepoError'
  }
}

/** Ownership marker: the plugin only wipes a cache directory it created. */
const MARKER = '.work-dashboard-cache'

/** Lock file name inside the cache root. */
const LOCK = '.lock'

/** A lock older than this is treated as a crashed refresh and reclaimed. */
const LOCK_STALE_MS = 120_000

/** Longest a lock wait will block before reporting a concurrent refresh. */
const LOCK_WAIT_MS = 15_000

/** Largest single YAML file the store will read, in bytes. */
export const MAX_YAML_BYTES = 512 * 1024

/** Resolved cache settings this module needs. */
export interface RepoOptions {
  /** Absolute cache root; wiped at mount. */
  cacheRoot: string
  /** `owner/name` on GitHub. */
  repository: string
  /** Branch tracked by the clone. */
  branch: string
  /** Clone URL; the canonical GitHub URL unless overridden. */
  remoteUrl: string
  /** Ceiling for one clone, in milliseconds. */
  cloneTimeoutMs: number
  /** Ceiling for one fetch + reset, in milliseconds. */
  fetchTimeoutMs: number
}

/** One child-process outcome. */
interface RunResult {
  code: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
  timedOut: boolean
}

/**
 * Reject a cache root that is obviously not a disposable directory.
 *
 * The mount wipes this path, so a mistaken value (home, `/`, a parent of the
 * DSH home) must fail at mount rather than delete real user data.
 */
export function assertSafeCacheRoot(cacheRoot: string, home: string): string {
  const path = cacheRoot.trim()
  if (path === '') throw new RepoError('bad-cache-root', 'The POC console cache root is empty.')
  if (path === home) throw new RepoError('bad-cache-root', 'The POC console cache root must not be the home directory.')
  if (path.split('/').filter((part) => part !== '').length < 3) {
    throw new RepoError('bad-cache-root', `The POC console cache root is too shallow to be a cache: ${path}`)
  }
  return path
}

/** Environment for one git invocation: no prompts, and optional auth header. */
function gitEnv(token: string | null): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    // A missing credential must fail, never wait on a terminal prompt.
    GIT_TERMINAL_PROMPT: '0',
    GIT_ASKPASS: 'true',
    // No interactive pager and no locale-dependent output parsing.
    GIT_PAGER: 'cat',
    LC_ALL: 'C',
  }
  if (token !== null) {
    // Passed through the environment so the token is not visible in `ps`.
    // `x-access-token` is the GitHub App-compatible basic-auth user for a PAT.
    const basic = Buffer.from(`x-access-token:${token}`, 'utf8').toString('base64')
    env.GIT_CONFIG_COUNT = '1'
    env.GIT_CONFIG_KEY_0 = 'http.https://github.com/.extraheader'
    env.GIT_CONFIG_VALUE_0 = `Authorization: Basic ${basic}`
  }
  return env
}

/** Run one command with a hard timeout, killing its process group on expiry. */
function run(command: string, args: string[], options: { cwd?: string; env: NodeJS.ProcessEnv; timeoutMs: number }): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      // Own process group so a timeout can kill git and any transport child.
      detached: process.platform !== 'win32',
    })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    const append = (current: string, chunk: Buffer): string => (current + chunk.toString('utf8')).slice(-8_000)
    child.stdout.on('data', (chunk: Buffer) => { stdout = append(stdout, chunk) })
    child.stderr.on('data', (chunk: Buffer) => { stderr = append(stderr, chunk) })
    const timer = setTimeout(() => {
      timedOut = true
      killTree(child.pid)
    }, options.timeoutMs)
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(new RepoError('git-missing', `Cannot run ${command}: ${error.message}`, { command }))
    })
    child.once('close', (code, signal) => {
      clearTimeout(timer)
      resolve({ code, signal, stdout, stderr, timedOut })
    })
  })
}

/** Kill a detached child's whole process group, falling back to the child. */
function killTree(pid: number | undefined): void {
  if (pid === undefined) return
  try {
    if (process.platform === 'win32') process.kill(pid, 'SIGKILL')
    else process.kill(-pid, 'SIGKILL')
  } catch {
    // The group may already be gone; a later SIGTERM would be a no-op anyway.
  }
}

/** Map a failed git invocation onto a user-actionable message. */
function classify(result: RunResult, action: 'clone' | 'fetch', repository: string): RepoError {
  const text = `${result.stderr}\n${result.stdout}`.toLowerCase()
  if (result.timedOut) {
    return new RepoError(
      'timeout',
      `git ${action} for ${repository} did not finish within the configured timeout. On a slow network, raise cloneTimeoutMs / fetchTimeoutMs in the plugin configuration.`,
      { action, repository },
    )
  }
  if (
    text.includes('authentication failed') ||
    text.includes('could not read username') ||
    text.includes('permission denied') ||
    text.includes('repository not found') ||
    text.includes('invalid username or password') ||
    text.includes('terminal prompts disabled')
  ) {
    return new RepoError(
      'auth',
      `Cannot read ${repository}: the GitHub credential was rejected. Run "gh auth login" for the account that can read this private repository.`,
      { action, repository },
    )
  }
  if (
    text.includes('could not resolve host') ||
    text.includes('connection timed out') ||
    text.includes('failed to connect') ||
    text.includes('network is unreachable') ||
    text.includes('connection reset')
  ) {
    return new RepoError('network', `Cannot reach github.com while running git ${action}.`, { action, repository })
  }
  if (text.includes('not found') || text.includes('does not exist')) {
    return new RepoError('not-found', `The repository ${repository} does not exist, or this account cannot see it.`, { action, repository })
  }
  const detail = `${result.stderr}`.trim().split('\n').slice(-3).join(' ').slice(0, 500)
  return new RepoError('git-failed', `git ${action} failed${detail === '' ? '' : `: ${detail}`}`, { action, repository, exitCode: result.code })
}

/** Result of one successful refresh. */
export interface RefreshResult {
  mode: 'clone' | 'fetch'
  durationMs: number
  finishedAt: string
  /** Short HEAD sha the cache now points at. */
  head: string
}

/**
 * The disposable git cache.
 *
 * Lifecycle: `prepare()` at mount wipes and recreates the cache root; the first
 * `refresh()` clones, later ones fast-forward. Every method is safe to call
 * concurrently except that refreshes serialize on a lock.
 */
export class RepoCache {
  /** Directory the ledger is read from once a clone exists. */
  readonly repoPath: string

  private fetchedAt: string | null = null
  private head: string | null = null

  constructor(private readonly options: RepoOptions) {
    this.repoPath = join(options.cacheRoot, 'repo')
  }

  /**
   * Wipe the cache and recreate it, so every DSH start begins from "no data".
   *
   * Only a directory this plugin created is ever removed: a pre-existing
   * directory without the ownership marker fails loudly instead of being
   * deleted, because a mistaken `cacheRoot` must not destroy user files.
   */
  async prepare(): Promise<void> {
    const root = this.options.cacheRoot
    let exists = false
    try {
      exists = (await stat(root)).isDirectory()
    } catch (error) {
      // A permission denial is not "absent": report it instead of pretending
      // the cache is cold, then failing later with an opaque mkdir error.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw this.fsFailure(error, root)
      exists = false
    }
    if (exists) {
      const owned = (await this.hasMarker(root)) || (await this.isEmptyDirectory(root))
      if (!owned) {
        throw new RepoError(
          'cache-not-owned',
          `The cache root ${root} already exists but was not created by the POC console; refusing to clear it. Remove it manually or point cacheRoot at a fresh directory.`,
          { cacheRoot: root },
        )
      }
      await rm(root, { recursive: true, force: true })
    }
    try {
      await mkdir(root, { recursive: true })
      await writeFile(join(root, MARKER), 'This directory is a disposable POC console cache.\n', 'utf8')
    } catch (error) {
      throw this.fsFailure(error, root)
    }
    this.fetchedAt = null
    this.head = null
  }

  /**
   * Map a filesystem failure onto an authored, user-actionable code.
   *
   * The cache lives under `$DSH_HOME/cache`, which the Host process normally
   * owns; a sandboxed or read-only deployment can deny it. Without this mapping
   * the first request would surface as an opaque "internal error".
   */
  private fsFailure(error: unknown, path: string): RepoError {
    const code = (error as NodeJS.ErrnoException).code ?? ''
    if (code === 'EPERM' || code === 'EACCES' || code === 'EROFS') {
      return new RepoError(
        'cache-unwritable',
        `Cannot write the POC console cache at ${path}: the Host process has no permission. Point cacheRoot at a writable directory in the plugin configuration.`,
        { path, filesystemCode: code },
      )
    }
    if (code === 'ENOSPC') {
      return new RepoError('cache-full', `Cannot write the POC console cache at ${path}: the disk is full.`, { path })
    }
    return new RepoError('cache-failed', `Cannot prepare the POC console cache at ${path}: ${code || String(error)}.`, { path, filesystemCode: code })
  }

  private async hasMarker(root: string): Promise<boolean> {
    try {
      const marker = await stat(join(root, MARKER))
      return marker.isFile()
    } catch {
      return false
    }
  }

  /**
   * An empty directory is safe to adopt: nothing can be lost by clearing it.
   *
   * This matters on the very first mount, when `mkdir -p` may have been run
   * outside the plugin (a user pre-creating `~/.dsh/cache/work-dashboard`), and on
   * a re-mount after a wipe that left the root empty.
   */
  private async isEmptyDirectory(root: string): Promise<boolean> {
    try {
      return (await readdir(root)).length === 0
    } catch {
      return false
    }
  }

  /** Whether a clone exists and its working tree is readable. */
  async isReady(): Promise<boolean> {
    try {
      await access(join(this.repoPath, '.git'))
      await access(join(this.repoPath, 'projects'))
      return true
    } catch {
      return false
    }
  }

  /** ISO timestamp of the last successful refresh in this process. */
  get lastFetchedAt(): string | null {
    return this.fetchedAt
  }

  /** The configured `owner/name` data source. */
  get repository(): string {
    return this.options.repository
  }

  /** The configured branch the cache tracks. */
  get branch(): string {
    return this.options.branch
  }

  /** Short HEAD sha after the last successful refresh, if known. */
  get lastHead(): string | null {
    return this.head
  }

  /** Read the `gh` token at call time; absent when `gh` is not authenticated. */
  private async ghToken(): Promise<string | null> {
    const result = await run('gh', ['auth', 'token'], {
      env: gitEnv(null),
      timeoutMs: 10_000,
    }).catch(() => null)
    if (result === null || result.code !== 0) return null
    const token = result.stdout.trim()
    return token === '' ? null : token
  }

  /**
   * Clone or fast-forward the cache.
   *
   * Serialized by a lock file in the cache root: two browser tabs pressing
   * refresh, or two DSH instances sharing a home, must not clone into the same
   * directory concurrently.
   */
  async refresh(): Promise<RefreshResult> {
    const startedAt = Date.now()
    const release = await this.acquireLock()
    try {
      const token = await this.ghToken()
      if (token === null) {
        throw new RepoError(
          'gh-unauthenticated',
          'The gh CLI is not authenticated. Run "gh auth login" for an account that can read the POC ledger repository.',
          { repository: this.options.repository },
        )
      }
      const remote = this.options.remoteUrl
      const env = gitEnv(token)
      const ready = await this.isReady()
      const mode: 'clone' | 'fetch' = ready ? 'fetch' : 'clone'
      if (!ready) {
        try {
          await rm(this.repoPath, { recursive: true, force: true })
        } catch (error) {
          throw this.fsFailure(error, this.repoPath)
        }
        const result = await run(
          'git',
          ['clone', '--depth', '1', '--single-branch', '--branch', this.options.branch, remote, this.repoPath],
          { env, timeoutMs: this.options.cloneTimeoutMs },
        )
        if (result.code !== 0) throw classify(result, 'clone', this.options.repository)
      } else {
        const fetch = await run('git', ['fetch', '--depth', '1', 'origin', this.options.branch], {
          cwd: this.repoPath,
          env,
          timeoutMs: this.options.fetchTimeoutMs,
        })
        if (fetch.code !== 0) throw classify(fetch, 'fetch', this.options.repository)
        // The cache is a read-only copy, so align it forcibly instead of merging.
        const reset = await run('git', ['reset', '--hard', `origin/${this.options.branch}`], {
          cwd: this.repoPath,
          env,
          timeoutMs: this.options.fetchTimeoutMs,
        })
        if (reset.code !== 0) throw classify(reset, 'fetch', this.options.repository)
      }
      const head = await run('git', ['rev-parse', '--short', 'HEAD'], { cwd: this.repoPath, env, timeoutMs: 10_000 })
      this.head = head.code === 0 ? head.stdout.trim() : null
      this.fetchedAt = new Date().toISOString()
      return {
        mode,
        durationMs: Date.now() - startedAt,
        finishedAt: this.fetchedAt,
        head: this.head ?? '',
      }
    } finally {
      await release()
    }
  }

  /** Take the cache lock, waiting briefly and reclaiming a stale one. */
  private async acquireLock(): Promise<() => Promise<void>> {
    const path = join(this.options.cacheRoot, LOCK)
    const deadline = Date.now() + LOCK_WAIT_MS
    for (;;) {
      try {
        await writeFile(path, `${process.pid} ${Date.now()}\n`, { encoding: 'utf8', flag: 'wx' })
        return async () => {
          await rm(path, { force: true })
        }
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code
        if (code !== 'EEXIST') throw this.fsFailure(error, path)
        // Reclaim a lock left behind by a crashed process.
        try {
          const info = await stat(path)
          if (Date.now() - info.mtimeMs > LOCK_STALE_MS) {
            await rm(path, { force: true })
            continue
          }
        } catch {
          continue
        }
        if (Date.now() > deadline) {
          throw new RepoError('busy', 'Another POC console refresh is already running; try again in a moment.')
        }
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
    }
  }

  /** Every `projects/*.yaml` file path in the cache, sorted by file name. */
  async projectFiles(): Promise<string[]> {
    const dir = join(this.repoPath, 'projects')
    let names: string[]
    try {
      names = await readdir(dir)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new RepoError('no-projects', `The repository has no projects/ directory at ${dir}.`, { path: dir })
      }
      throw error
    }
    return names
      .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'))
      .sort()
      .map((name) => join(dir, name))
  }

  /** Read one project file, bounded so one huge file cannot stall the console. */
  async readProject(path: string): Promise<string> {
    const info = await stat(path)
    if (info.size > MAX_YAML_BYTES) {
      throw new RepoError('too-large', `${path} is larger than ${MAX_YAML_BYTES} bytes and was skipped.`, { path, size: info.size })
    }
    return readFile(path, 'utf8')
  }
}
