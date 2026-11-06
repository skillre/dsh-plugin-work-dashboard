#!/usr/bin/env node
/**
 * Packed-package verification ONLY. Never point this runner at a user profile.
 *
 * It creates one owned, disposable DSH home in the platform temp directory,
 * copies the shipped `web` profile template into it, installs the packed
 * tarball, composes the profile, boots a real bounded startup, exercises the
 * plugin's exact Connection route over the authenticated browser transport —
 * including the milestone-1 refresh contract (empty cache → clone → data →
 * fast-forward) — then stops everything and removes the owned root. Cleanup
 * runs in `finally` even when a check fails.
 *
 * Usage: node scripts/verify-isolated.mjs [absolute-path-to.tgz]
 */

import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { buildLocalFixture, readGhLog } from './lib/local-fixture.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(repo, 'package.json'), 'utf8'))
const cli = process.env.DSH_TEST_CLI || 'dsh'
const tarball = resolve(process.argv[2] || join(repo, `skillre-dsh-plugin-work-dashboard-${manifest.version}.tgz`))
const tarballInfo = await readFile(tarball)
const tarballSha256 = createHash('sha256').update(tarballInfo).digest('hex')
const base = await realpath(tmpdir())
const owned = await mkdtemp(join(base, 'dsh-work-dashboard-mount-'))
const owner = randomUUID()

const home = join(owned, 'home')
const work = join(owned, 'work')
const profile = `work-dashboard-test-${owner.slice(0, 8)}`
assert.notEqual(profile, 'desktop')
const env = {
  ...process.env,
  DSH_HOME: home,
  DSH_AGENTS_HOME: join(home, 'agents'),
  DSH_PROFILE: profile,
  DSH_PROFILE_DIR: join(home, 'profiles', profile),
  DSH_TELEMETRY_DISABLED: '1',
  npm_config_cache: join(owned, 'npm-cache'),
  npm_config_store_dir: join(owned, 'pnpm-store'),
  // The cache root the plugin wipes is under the OWNED home, never the user's.
  WD_TEST_CACHE_ROOT: join(home, 'cache', 'work-dashboard'),
}

/** The owned local remote + stub gh, built once per run. */
let fixture = null
const patchPath = join(owned, 'owned-cache.patch.yml')
const children = []
const checks = []
const report = { package: manifest.name, version: manifest.version, dsh: '', tarball: { path: tarball, sha256: tarballSha256 }, profile, checks, endpoint: {}, cleanup: {} }
let failure
let cleanupVerified = false
const strip = (text) => text.replace(/\u001b\[[0-9;]*m/g, '').replace(/([?&]token=)[^\s"'<]+/g, '$1[redacted]')

function start(args, timeoutMs = 60000) {
  // The stub `gh` directory is prepended at spawn time (it is created after the
  // base env object), so the plugin's real gh invocations are intercepted and
  // recorded instead of reaching the user's account.
  const spawnEnv = fixture === null ? env : { ...env, PATH: `${fixture.pathPrefix}${process.env.PATH ?? ''}` }
  const child = spawn(cli, args, { cwd: work, env: spawnEnv, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] })
  const record = { child, args, text: '', closed: null, result: null }
  record.closed = new Promise((res, rej) => {
    child.once('error', rej)
    child.once('close', (code, signal) => { record.result = { code, signal }; res(record.result) })
  })
  const append = (data) => { record.text += data.toString(); if (record.text.length > 2 * 1024 * 1024) record.text = record.text.slice(-2 * 1024 * 1024) }
  child.stdout.on('data', append)
  child.stderr.on('data', append)
  record.deadline = new Promise((_, rej) => {
    record.timer = setTimeout(() => rej(new Error(`Owned CLI deadline exceeded (${timeoutMs}ms): ${args.join(' ')}`)), timeoutMs)
  })
  // The deadline is only ever consumed through the race below; attaching a
  // no-op catch here keeps a losing race from surfacing as an unhandled
  // rejection when the run itself outlives one command's deadline.
  record.deadline.catch(() => {})
  record.finished = Promise.race([record.closed, record.deadline])
  // `finished` is a convenience race; a caller that awaits `closed` instead (the
  // startup path) must not turn its rejection into an unhandled one.
  record.finished.catch(() => {})
  record.closed.finally(() => clearTimeout(record.timer)).catch(() => {})
  children.push(record)
  return record
}

async function stop(record) {
  if (record.result !== null) return
  try { record.child.kill('SIGTERM') } catch {}
  const closed = await Promise.race([record.closed.then(() => true), delay(3000).then(() => false)])
  if (!closed) {
    try { record.child.kill('SIGKILL') } catch {}
    await Promise.race([record.closed, delay(3000).then(() => { throw new Error(`Owned PID ${record.child.pid} did not close`) })])
  }
}

async function run(args, timeoutMs = 90000) {
  const record = start(args, timeoutMs)
  const result = await record.finished
  await stop(record)
  report.checks.push(`command: dsh ${args.join(' ')} -> exit ${result.code}`)
  assert.equal(result.code, 0, `CLI exited ${result.code}: ${strip(record.text).slice(-4000)}`)
  return strip(record.text)
}

/** Authenticate through the real launch token and return the origin + cookie. */
async function authenticatedStartup() {
  // `--patch` MUST be part of the real startup, not only the dump-config probe:
  // without it the row mounts with its shipped default cacheRoot and the mount
  // wipe would target the user's real ~/.dsh/cache.
  const record = start(['--profile', profile, '--patch', patchPath, '--port', '0', '--no-open'], 60000)
  const tokenUrl = await new Promise((res, rej) => {
    const timeout = setTimeout(() => { finish(); rej(new Error(`No bounded startup URL: ${strip(record.text).slice(-4000)}`)) }, 30000)
    const inspect = () => {
      // Read the launch URL from the RAW stream: `strip` redacts the token, and
      // a redacted token cannot be exchanged.
      const match = record.text.replace(/\u001b\[[0-9;]*m/g, '').match(/http:\/\/(?:127\.0\.0\.1|localhost):\d+\/[^\s"<>]*[?&]token=[^\s"<>]+/)
      if (match) { finish(); res(match[0]) }
    }
    const finish = () => {
      clearTimeout(timeout)
      // The app booted: its per-command deadline has done its job. Leaving it
      // armed would fire during the (deliberately long) clone/verify phase and
      // reject a promise nobody is waiting on any more.
      clearTimeout(record.timer)
      record.child.stdout.off('data', inspect)
      record.child.stderr.off('data', inspect)
    }
    record.child.stdout.on('data', inspect)
    record.child.stderr.on('data', inspect)
    record.closed.then((result) => { finish(); rej(new Error(`Startup exited: ${result.code}; ${strip(record.text).slice(-4000)}`)) }).catch(rej)
    inspect()
  })
  const origin = new URL(tokenUrl).origin
  const auth = await fetch(tokenUrl, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
  assert.ok(auth.status === 302 || auth.status === 303, `Owned auth exchange returned HTTP ${auth.status}`)
  const cookie = auth.headers.getSetCookie().map((value) => value.split(';', 1)[0]).join('; ')
  assert.ok(cookie, 'Authenticated browser cookie missing')
  await auth.body?.cancel()
  activeStartup = record
  return { record, origin, cookie }
}

/** Call the plugin's exact endpoint through the real authenticated transport. */
async function rpc(origin, cookie, payload) {
  const rpcId = randomUUID()
  const endpoint = 'skillre-work-dashboard/execute'
  const response = await fetch(`${origin}/api/${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Cookie: cookie, Origin: origin },
    body: JSON.stringify({ type: 'client-request', rpcId, method: endpoint, payload }),
    signal: AbortSignal.timeout(180000),
  })
  assert.equal(response.status, 200, `${endpoint}: RPC transport HTTP ${response.status}`)
  const envelope = await response.json()
  assert.equal(envelope.type, 'server-response')
  assert.equal(envelope.rpcId, rpcId)
  return envelope.result
}

/** The startup record whose log is quoted when an endpoint call fails. */
let activeStartup = null

/** Call the endpoint and require success. */
async function rpcOk(origin, cookie, payload) {
  const result = await rpc(origin, cookie, payload)
  if (result.ok !== true) {
    const raw = activeStartup === null ? '' : strip(activeStartup.text)
    const lines = raw.split('\n').filter((line) => /work-dashboard|error|Error|stack|at /.test(line))
    const log = lines.length > 0 ? lines.slice(-40).join('\n') : raw.slice(-3000)
    throw new Error(`endpoint ${JSON.stringify(payload)} failed: ${JSON.stringify(result.error)}\n--- host log ---\n${log}`)
  }
  return result.value
}

try {
  await writeFile(join(owned, '.owned-by-work-dashboard'), owner, { flag: 'wx', mode: 0o600 })
  await mkdir(home)
  await mkdir(work)
  const version = (await run(['--version'])).trim()
  report.dsh = version
  checks.push('dsh-version')
  fixture = await buildLocalFixture(owned)
  checks.push('local-remote-and-gh-stub')
  await run(['--profile', profile, '--from-default-profile', 'web', '--dump-config'])
  checks.push('profile-template-created')
  await run(['plugin', '--profile', profile, 'add', tarball, '--ignore-scripts', '--store-dir', join(owned, 'pnpm-store')], 180000)
  checks.push('profile-tarball-install')
  const profileDir = join(home, 'profiles', profile)
  const profileManifest = JSON.parse(await readFile(join(profileDir, 'package.json'), 'utf8'))
  assert.ok(Object.hasOwn(profileManifest.dependencies ?? {}, manifest.name), 'Tarball dependency was not installed')
  assert.ok((profileManifest.dsh?.profile?.bundles ?? []).includes(manifest.name), 'Bundle selection was not saved')
  checks.push('packed-dependency-and-selection')

  // Override the row's cache root so the wipe targets the OWNED home, never the
  // user's real ~/.dsh/cache.
  await writeFile(patchPath, [
    '- id: skillre-work-dashboard',
    `  name: '${manifest.name}'`,
    '  config:',
    `    repository: skillre/workbranch`,
    `    remoteUrl: ${fixture.remoteUrl}`,
    `    cacheRoot: ${env.WD_TEST_CACHE_ROOT}`,
    '    defaultBranch: main',
    '    cloneTimeoutMs: 60000',
    '    fetchTimeoutMs: 40000',
    '    staleDays: 30',
    '',
  ].join('\n'), 'utf8')
  const dump = await run(['--profile', profile, '--patch', patchPath, '--dump-config'])
  assert.ok(dump.includes('skillre-work-dashboard'), 'Bundle row id did not compose')
  assert.ok(dump.includes(manifest.name), 'Bundle package name did not compose')
  checks.push('dump-config')

  const installed = await realpath(join(profileDir, 'node_modules', ...manifest.name.split('/')))
  assert.ok(installed.startsWith(`${owned}/`), 'Installed package escaped the owned root')
  const installedManifest = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'))
  assert.equal(installedManifest.version, manifest.version)
  for (const required of ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'locale/en.json', 'locale/zh.json', 'icon.svg', 'compatibility.json', 'docs/DETAIL.zh.md', 'docs/preview.zh.svg']) {
    assert.ok(await readFile(join(installed, required)).then(() => true, () => false), `Packed file missing: ${required}`)
  }
  checks.push('packed-payload-present')

  // The three POC skills ship inside the package, so installing the plugin is
  // what publishes them. Check both the markdown and the script the export
  // skill tells the model to run: a skill whose script is missing would send
  // the model looking for a file that is not there.
  const bundledSkills = ['poc-ledger', 'poc-export', 'poc-submit']
  for (const name of bundledSkills) {
    const skillFile = join(installed, 'skills', name, 'SKILL.md')
    const body = await readFile(skillFile, 'utf8').catch(() => '')
    assert.ok(body.length > 0, `Packed skill missing or empty: skills/${name}/SKILL.md`)
    assert.ok(body.startsWith('---'), `skills/${name}/SKILL.md must start with frontmatter`)
    assert.ok(body.includes(`name: ${name}`), `skills/${name}/SKILL.md must declare name: ${name}`)
  }
  assert.ok(
    await readFile(join(installed, 'skills/poc-export/scripts/export-form.mjs')).then(() => true, () => false),
    'the export skill script must ship beside its SKILL.md',
  )
  report.skills = { bundled: bundledSkills }
  checks.push('packed-skills-present')

  // The cache root must not exist before the first mount: the plugin creates
  // it, which proves the mount is what creates (and owns) the directory.
  const cacheRootExistsBefore = await readFile(join(env.WD_TEST_CACHE_ROOT, 'repo', '.git', 'HEAD')).then(() => true, () => false)
  assert.equal(cacheRootExistsBefore, false, 'the cache must not exist before the first mount')
  checks.push('cache-absent-before-mount')

  const { record, origin, cookie } = await authenticatedStartup()
  try {
    await delay(1500)
    checks.push('bounded-startup')

    // Runtime proof that the bundled skills were actually PUBLISHED, not merely
    // shipped: the registration line is emitted only when the skills service was
    // present, the file parsed, and the registry accepted the payload.
    const bootLog = strip(record.text)
    for (const name of bundledSkills) {
      assert.ok(
        bootLog.includes(`[work-dashboard] skill registered: ${name}`),
        `the boot log must show ${name} registering into the skill catalog; got: ${bootLog.slice(-2000)}`,
      )
    }
    checks.push('bundled-skills-registered')

    // 1. Cold cache: the mount wiped it, so list reports "no data" and does not
    //    pull anything on its own.
    const cold = await rpcOk(origin, cookie, { action: 'list' })
    assert.equal(cold.cacheReady, false, 'a fresh mount must report an empty cache')
    assert.deepEqual(cold.projects, [])
    assert.equal(cold.repository, 'skillre/workbranch')
    assert.equal(cold.cachePath, `${env.WD_TEST_CACHE_ROOT}/repo`)
    report.endpoint.cold = { cacheReady: cold.cacheReady, cachePath: cold.cachePath }
    checks.push('api-cold-cache-empty')

    // 2. Manual refresh: the first pull must clone the private repository.
    const first = await rpcOk(origin, cookie, { action: 'refresh' })
    assert.equal(first.outcome.mode, 'clone', 'the first refresh must clone')
    assert.ok(first.snapshot.cacheReady, 'a successful refresh must produce a ready cache')
    assert.equal(first.snapshot.projects.length, 5, 'the repository holds five test projects')
    report.endpoint.refresh1 = { mode: first.outcome.mode, projects: first.snapshot.projects.length, durationMs: first.outcome.durationMs }
    checks.push('api-refresh-clone')

    // 3. The board actually computed the four dimensions and the gap list.
    const project = first.snapshot.projects.find((candidate) => candidate.pocId === 'POC-2026-003')
    assert.ok(project, 'POC-2026-003 must be present')
    assert.deepEqual(project.dimensions, { achievement: true, evidence: true, recognition: true, nextMilestone: false })
    assert.equal(project.dimensionCount, 3)
    const missingG0 = first.snapshot.projects.find((candidate) => candidate.pocId === 'POC-2026-002')
    assert.deepEqual(missingG0.dimensions, { achievement: false, evidence: false, recognition: false, nextMilestone: false })
    const rules = new Set(first.snapshot.gaps.map((gap) => gap.rule))
    assert.ok(rules.has('R1-gate0-missing') && rules.has('R11-no-next-milestone'), 'the R1 and R11 rules must fire on the fixtures')
    assert.equal(first.snapshot.gaps[0].rule, 'R11-no-next-milestone', 'the highest-value gap must sort first')
    // v3 headline counters: total, G0 passed, in progress, amount sum.
    // 300 + 1500 + 800 + 500 + 0
    assert.equal(first.snapshot.stats.total, 5)
    assert.equal(first.snapshot.stats.g0Passed, 4)
    assert.equal(first.snapshot.stats.amountTotalWan, 3100)
    report.endpoint.board = { stats: first.snapshot.stats, gaps: first.snapshot.gaps.length, firstRule: first.snapshot.gaps[0].rule }
    checks.push('api-board-computed')

    // 3b. The portfolio analysis is shipped as part of the snapshot, and every
    //     figure accounts for the same project set the list shows.
    const analysis = first.snapshot.analysis
    assert.ok(analysis, 'the snapshot must carry the portfolio analysis')
    assert.deepEqual(analysis.stages.map((bucket) => bucket.key), ['G0', 'G1', 'G2', 'G3', 'G4', 'closed', 'unknown'])
    assert.equal(analysis.stages.reduce((sum, bucket) => sum + bucket.count, 0), 5, 'every project lands in exactly one stage bucket')
    assert.equal(analysis.stages.reduce((sum, bucket) => sum + bucket.amountWan, 0), 3100, 'the funnel amounts must sum to the portfolio total')
    assert.equal(analysis.dimensions.length, 4, 'four dimension coverage rows')
    assert.equal(analysis.topAmounts.length, 4, 'four projects carry an amount')
    assert.equal(analysis.concentration, 1500 / 3100, 'the largest project share is the concentration figure')
    assert.equal(analysis.topAmounts[0].amountWan, 1500, 'the concentration list is largest first')
    assert.equal(analysis.gapRules.reduce((sum, row) => sum + row.count, 0), first.snapshot.gaps.length, 'rule counts must account for every finding')
    assert.equal(analysis.amountMissing, 1, 'the closed fixture carries no amount')
    assert.ok(analysis.orgs.length >= 4, 'the org breakdown covers every system/company pair')
    assert.ok(analysis.types.length >= 4, 'the type composition covers every poc_type')
    report.endpoint.analysis = { stages: analysis.stages.map((bucket) => `${bucket.key}:${bucket.count}`), orgs: analysis.orgs.length, topAmount: analysis.topAmounts[0].amountWan }
    checks.push('api-portfolio-analysis')

    // 4. Detail page: the v3 record with the progress stream.
    const detail = await rpcOk(origin, cookie, { action: 'detail', pocId: 'POC-2026-003' })
    assert.equal(detail.summary.pocId, 'POC-2026-003')
    assert.equal(detail.gate0.conclusion, '通过')
    assert.equal(detail.progress.length, 2, 'the progress stream is the v3 history')
    assert.equal(detail.progress[1].gate3_2, '已确认')
    assert.equal(detail.outcome.achievement, '达成')
    assert.equal(detail.outcome.milestone, '')
    // The G0 checklist is the five prerequisites in schema order, with tech_owner
    // read from the identity block rather than from gate0.
    assert.equal(detail.gate0.checklist.length, 5)
    assert.deepEqual(detail.gate0.checklist.map((item) => item.field), ['why_customer', 'why_us', 'decision_chain', 'post_poc_decision', 'tech_owner'])
    assert.equal(detail.gate0.checklist.find((item) => item.field === 'tech_owner').present, true)
    report.endpoint.detail = { progress: detail.progress.length, achievement: detail.outcome.achievement }
    checks.push('api-detail')

    // 5. Second refresh must fast-forward, not re-clone.
    const second = await rpcOk(origin, cookie, { action: 'refresh' })
    assert.equal(second.outcome.mode, 'fetch', 'a later refresh must fetch + reset, not clone')
    checks.push('api-refresh-fetch')

    // 6. Unknown project is a clean authored failure, not an internal one.
    const missing = await rpc(origin, cookie, { action: 'detail', pocId: 'POC-9999' })
    assert.equal(missing.ok, false)
    assert.equal(missing.error.code, 'work-dashboard/unknown-project')
    checks.push('api-unknown-project')

    // 7. The route stays inside Connection's authentication fence.
    const bad = await fetch(`${origin}/api/skillre-work-dashboard/execute`, {
      method: 'POST', headers: { 'content-type': 'application/json', Origin: origin },
      body: JSON.stringify({ type: 'client-request', rpcId: 'x', method: 'skillre-work-dashboard/execute', payload: { action: 'list' } }),
      signal: AbortSignal.timeout(15000),
    })
    assert.equal(bad.status, 401, 'the route must stay inside Connection auth fencing')
    checks.push('api-auth-fence')

    // 8. The cache is a real git clone of the configured branch.
    const head = (await readFile(join(env.WD_TEST_CACHE_ROOT, 'repo', '.git', 'HEAD'), 'utf8')).trim()
    assert.ok(head.startsWith('ref: refs/heads/main'), `cache HEAD must track main, got ${head}`)
    const gitConfig = await readFile(join(env.WD_TEST_CACHE_ROOT, 'repo', '.git', 'config'), 'utf8')
    // The configured remote here is the owned local bare repository; the point
    // is that the clone tracks the CONFIGURED url, not a hard-coded GitHub one.
    assert.ok(gitConfig.includes(fixture.remoteUrl), `the cache must clone the configured remote, got:\n${gitConfig}`)
    // The token must never be written into the clone's own config.
    assert.ok(!/x-access-token|Authorization/.test(gitConfig), 'the credential must not be persisted in .git/config')
    checks.push('cache-is-real-clone')
    checks.push('cache-credential-not-persisted')

    // ---- v3: risk board and global timeline (the export form is deferred) ---

    // 20e. The risk board is ordered by severity.
    const risks = await rpcOk(origin, cookie, { action: 'risks' })
    assert.ok(Array.isArray(risks.rows), 'the risk board must return rows')
    for (let index = 1; index < risks.rows.length; index += 1) {
      assert.ok(risks.rows[index - 1].rank >= risks.rows[index].rank, 'risk rows must be sorted by severity')
    }
    assert.equal(risks.counts.total, risks.rows.length, 'the counters must match the rows')
    report.endpoint.risks = { rows: risks.rows.length, counts: risks.counts }
    checks.push('api-risk-board-sorted')

    // 20f. The global timeline is newest-first over progress[] entries.
    const timeline = await rpcOk(origin, cookie, { action: 'timeline' })
    assert.ok(Array.isArray(timeline.entries), 'the timeline must return entries')
    for (let index = 1; index < timeline.entries.length; index += 1) {
      assert.ok(timeline.entries[index - 1].date >= timeline.entries[index].date, 'timeline entries must be newest first')
    }
    assert.ok(timeline.range !== null, 'the fixtures have dated rounds, so a range must exist')
    // POC-2026-002 has an empty timeline, so it must be reported as silent.
    assert.ok(timeline.silentProjects.some((project) => project.pocId === 'POC-2026-002'), 'a project with no timeline must be listed as silent')
    report.endpoint.timeline = { entries: timeline.entries.length, months: timeline.months.length, silent: timeline.silentProjects.length }
    checks.push('api-global-timeline-sorted')
    checks.push('api-timeline-reports-silent-projects')

    // 20. Refresh is refused while a submission holds the write lock. The lock
    //     is released after every submission, so a refresh now must succeed.
    const afterSubmitRefresh = await rpcOk(origin, cookie, { action: 'refresh' })
    assert.equal(afterSubmitRefresh.outcome.mode, 'fetch')
    checks.push('refresh-works-after-submit')

    // 9. A restart must wipe the cache: that is the documented behaviour, and
    //    it is what keeps a stale local copy from masquerading as the truth.
    await stop(record)
    const second_start = await authenticatedStartup()
    try {
      await delay(1500)
      const afterRestart = await rpcOk(second_start.origin, second_start.cookie, { action: 'list' })
      assert.equal(afterRestart.cacheReady, false, 'a DSH restart must clear the cache')
      checks.push('cache-wiped-on-restart')
      const afterRestartRefresh = await rpcOk(second_start.origin, second_start.cookie, { action: 'refresh' })
      assert.equal(afterRestartRefresh.outcome.mode, 'clone', 'after a wipe the next refresh clones again')
      checks.push('api-refresh-after-restart')
    } finally {
      await stop(second_start.record)
    }
  } finally {
    await stop(record)
  }
} catch (error) {
  failure = error
} finally {
  report.cleanup.ownedRoot = owned
  report.cleanup.profile = profile
  for (const record of children) await stop(record).catch((error) => { report.cleanup.stopError = String(error) })
  report.cleanup.processesStopped = children.every((record) => record.result !== null)
  try {
    const marker = await readFile(join(owned, '.owned-by-work-dashboard'), 'utf8')
    assert.equal(marker, owner, 'Owned root marker mismatch')
    await rm(owned, { recursive: true, force: true })
    const gone = await readFile(join(owned, '.owned-by-work-dashboard')).then(() => false, (error) => error.code === 'ENOENT')
    report.cleanup.rootRemoved = gone
    cleanupVerified = gone
  } catch (error) {
    report.cleanup.error = String(error)
  }
  report.cleanup.verified = cleanupVerified
  await writeFile(join(repo, `verify-isolated-${manifest.version}.json`), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

if (failure) {
  process.stderr.write(`verify-isolated: FAILED\n${failure.stack ?? failure}\n${JSON.stringify(report, null, 2)}\n`)
  process.exitCode = 1
} else {
  assert.equal(cleanupVerified, true, 'cleanup must be verified before reporting success')
  process.stdout.write(`verify-isolated: OK (${checks.length} checks)\n${JSON.stringify(report, null, 2)}\n`)
}
