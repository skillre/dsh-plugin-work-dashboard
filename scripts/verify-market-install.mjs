#!/usr/bin/env node
/**
 * Verify the LIVE market entry installs end to end.
 *
 * Creates an owned, disposable non-Desktop DSH profile, installs the exact spec
 * the market index generates for this plugin (`git+<url>#<commit>`), composes
 * the profile, boots a bounded startup, exercises the plugin's route, then
 * removes everything and verifies the cleanup.
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(repo, 'package.json'), 'utf8'))
const cli = 'dsh'
const owned = await mkdtemp(join(await realpath(tmpdir()), 'dsh-poc-market-install-'))
const home = join(owned, 'home')
const work = join(owned, 'work')
const profile = `poc-market-${owned.slice(-6)}`
const patchPath = join(owned, 'owned-cache.patch.yml')
const indexUrl = 'https://skillre.github.io/dsh-plugin-market/index.json'
const env = {
  ...process.env,
  DSH_HOME: home, DSH_AGENTS_HOME: join(home, 'agents'),
  DSH_PROFILE: profile, DSH_PROFILE_DIR: join(home, 'profiles', profile),
  DSH_TELEMETRY_DISABLED: '1',
  npm_config_cache: join(owned, 'npm-cache'), npm_config_store_dir: join(owned, 'pnpm-store'),
  PATH: `${process.env.PATH}`,
}
const children = []
const checks = []
const report = { profile, indexUrl, spec: null, checks, cleanup: {} }
let failure, cleanupOk = false
const strip = (t) => t.replace(/\u001b\[[0-9;]*m/g, '').replace(/([?&]token=)[^\s"'<]+/g, '$1[redacted]')

function start(args, timeoutMs = 90000) {
  const child = spawn(cli, args, { cwd: work, env, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] })
  const rec = { child, text: '', result: null }
  rec.closed = new Promise((res, rej) => { child.once('error', rej); child.once('close', (c, s) => { rec.result = { c, s }; res(rec.result) }) })
  const app = (d) => { rec.text += d.toString(); if (rec.text.length > 2e6) rec.text = rec.text.slice(-2e6) }
  child.stdout.on('data', app); child.stderr.on('data', app)
  rec.deadline = new Promise((_, rej) => { rec.timer = setTimeout(() => rej(new Error(`deadline: ${args.join(' ')}`)), timeoutMs) })
  rec.deadline.catch(() => {})
  rec.finished = Promise.race([rec.closed, rec.deadline])
  rec.finished.catch(() => {})
  children.push(rec); return rec
}
async function stop(rec) {
  if (rec.result !== null) return
  try { rec.child.kill('SIGTERM') } catch {}
  const closed = await Promise.race([rec.closed.then(() => true), delay(3000).then(() => false)])
  if (!closed) { try { rec.child.kill('SIGKILL') } catch {}; await Promise.race([rec.closed, delay(3000)]) }
}
async function run(args, timeoutMs = 180000) {
  const rec = start(args, timeoutMs)
  const r = await rec.finished
  await stop(rec)
  assert.equal(r.c, 0, `CLI exit ${r.c}: ${strip(rec.text).slice(-2500)}`)
  checks.push(`dsh ${args.slice(0, 3).join(' ')}`)
  return strip(rec.text)
}
async function startup() {
  const rec = start(['--profile', profile, '--patch', patchPath, '--port', '0', '--no-open'], 60000)
  const url = await new Promise((res, rej) => {
    const to = setTimeout(() => { fin(); rej(new Error(`no URL: ${strip(rec.text).slice(-2500)}`)) }, 30000)
    const look = () => { const m = rec.text.replace(/\u001b\[[0-9;]*m/g, '').match(/http:\/\/(?:127\.0\.0\.1|localhost):\d+\/[^\s"<>]*[?&]token=[^\s"<>]+/); if (m) { fin(); res(m[0]) } }
    const fin = () => { clearTimeout(to); clearTimeout(rec.timer); rec.child.stdout.off('data', look); rec.child.stderr.off('data', look) }
    rec.child.stdout.on('data', look); rec.child.stderr.on('data', look)
    rec.closed.then((r) => { fin(); rej(new Error(`exited ${r.c}: ${strip(rec.text).slice(-2500)}`)) }).catch(rej)
    look()
  })
  const origin = new URL(url).origin
  const auth = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
  assert.ok(auth.status === 302 || auth.status === 303, `auth HTTP ${auth.status}`)
  const cookie = auth.headers.getSetCookie().map((v) => v.split(';', 1)[0]).join('; ')
  await auth.body?.cancel()
  return { rec, origin, cookie }
}
async function rpc(origin, cookie, payload) {
  const id = crypto.randomUUID()
  const endpoint = 'skillre-work-dashboard/execute'
  const res = await fetch(`${origin}/api/${endpoint}`, {
    method: 'POST', headers: { 'content-type': 'application/json', Cookie: cookie, Origin: origin },
    body: JSON.stringify({ type: 'client-request', rpcId: id, method: endpoint, payload }),
    signal: AbortSignal.timeout(120000),
  })
  assert.equal(res.status, 200, `RPC HTTP ${res.status}`)
  const env = await res.json()
  assert.equal(env.rpcId, id)
  return env.result
}

try {
  await writeFile(join(owned, '.owned'), owned, { flag: 'wx', mode: 0o600 })
  await mkdir(home); await mkdir(work)

  // 1. Read the LIVE index and take this plugin's own install spec.
  const live = await fetch(`${indexUrl}?cb=${Date.now()}`, { signal: AbortSignal.timeout(30000) })
  assert.equal(live.status, 200, `live index HTTP ${live.status}`)
  const index = await live.json()
  const entry = index.plugins.find((p) => p.name === manifest.name)
  assert.ok(entry, `${manifest.name} is not in the live index`)
  const version = entry.versions[0]
  const spec = `git+${version.source.url}#${version.source.commit}`
  report.spec = spec
  report.entry = { version: version.version, commit: version.source.commit, engines: version.engines }
  checks.push('live-index-has-entry')
  checks.push('live-index-pins-commit')

  // 2. Install that spec into an owned, disposable profile.
  await run(['--profile', profile, '--from-default-profile', 'web', '--dump-config'])
  checks.push('profile-created')
  await run(['plugin', '--profile', profile, 'add', spec, '--ignore-scripts', '--store-dir', join(owned, 'pnpm-store')], 300000)
  checks.push('market-spec-installed')
  const profileDir = join(home, 'profiles', profile)
  const pm = JSON.parse(await readFile(join(profileDir, 'package.json'), 'utf8'))
  assert.ok(Object.hasOwn(pm.dependencies ?? {}, manifest.name), 'dependency not installed')
  assert.ok((pm.dsh?.profile?.bundles ?? []).includes(manifest.name), 'bundle not selected')
  checks.push('dependency-and-selection')
  // Point cacheRoot at the OWNED root: a test must never write the user's real
  // ~/.dsh/cache, and the sandbox would deny it anyway.
  await writeFile(patchPath, [
    '- id: skillre-work-dashboard',
    `  name: '${manifest.name}'`,
    '  config:',
    '    repository: skillre/workbranch',
    `    cacheRoot: ${join(home, 'cache', 'work-dashboard')}`,
    '    defaultBranch: main',
    '    cloneTimeoutMs: 60000',
    '    fetchTimeoutMs: 40000',
    '    staleDays: 30',
    '',
  ].join('\n'), 'utf8')

  const dump = await run(['--profile', profile, '--patch', patchPath, '--dump-config'])
  assert.ok(dump.includes('skillre-work-dashboard'), 'row id missing from composed config')
  checks.push('dump-config')
  const installed = await realpath(join(profileDir, 'node_modules', ...manifest.name.split('/')))
  assert.ok(installed.startsWith(owned), 'install escaped the owned root')
  for (const f of ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'locale/zh.json', 'icon.svg', 'compatibility.json']) {
    assert.ok(await readFile(join(installed, f)).then(() => true, () => false), `missing ${f}`)
  }
  checks.push('packed-payload-present')

  // 3. Boot and exercise the route.
  const { rec, origin, cookie } = await startup()
  try {
    await delay(1500)
    checks.push('bounded-startup')
    const list = await rpc(origin, cookie, { action: 'list' })
    assert.equal(list.ok, true, `list failed: ${JSON.stringify(list.error)}`)
    assert.equal(list.value.cacheReady, false, 'a fresh mount must report an empty cache')
    assert.equal(list.value.repository, 'skillre/workbranch')
    checks.push('api-list')
    const exported = await rpc(origin, cookie, { action: 'export', pocIds: [], mode: 'blank' })
    assert.equal(exported.ok, true)
    assert.ok(exported.value.html.startsWith('<!DOCTYPE html>'))
    checks.push('api-export')
    const risks = await rpc(origin, cookie, { action: 'risks' })
    assert.equal(risks.ok, true)
    checks.push('api-risks')
    const tl = await rpc(origin, cookie, { action: 'timeline' })
    assert.equal(tl.ok, true)
    checks.push('api-timeline')
  } finally { await stop(rec) }
} catch (e) { failure = e } finally {
  report.cleanup.ownedRoot = owned
  for (const r of children) await stop(r).catch(() => {})
  report.cleanup.processesStopped = children.every((r) => r.result !== null)
  try {
    assert.equal(await readFile(join(owned, '.owned'), 'utf8'), owned, 'marker mismatch')
    await rm(owned, { recursive: true, force: true })
    cleanupOk = await readFile(join(owned, '.owned')).then(() => false, (e) => e.code === 'ENOENT')
    report.cleanup.rootRemoved = cleanupOk
  } catch (e) { report.cleanup.error = String(e) }
  report.cleanup.verified = cleanupOk
  await writeFile(join(repo, 'verify-market-install.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}
if (failure) { process.stderr.write(`market-install FAILED\n${failure.stack ?? failure}\n${JSON.stringify(report, null, 2)}\n`); process.exitCode = 1 }
else { assert.equal(cleanupOk, true); process.stdout.write(`market-install: OK (${checks.length} checks)\n${JSON.stringify(report, null, 2)}\n`) }
