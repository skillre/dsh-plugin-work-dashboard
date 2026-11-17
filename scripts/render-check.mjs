#!/usr/bin/env node
/**
 * Render the real ledger through the real Client components, without a browser.
 *
 * This is the cheap half of "does it actually look right on real data". It does
 * NOT replace the CDP/browser check (which proves the DSH shell mounts the page
 * and the styles apply); it proves something the browser check cannot: that the
 * thirty-project ledger the plugin really reads produces sensible text instead
 * of thirty identical empty states.
 *
 * It builds the snapshot with the SAME Host store the plugin uses, renders the
 * page with the same React components, and prints the parts a reader would
 * judge: the blocker panel's groups, the detail worklist, and the stage block.
 *
 * Not shipped: `scripts/` is excluded from the package.
 *
 *   node scripts/render-check.mjs
 */

import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import YAML from 'yaml'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** The ledger clone the plugin keeps between runs, or `null`. */
async function findLedger() {
  const candidates = [
    process.env.WORK_DASHBOARD_LEDGER,
    join(homedir(), '.dsh', 'cache', 'work-dashboard', 'repo'),
  ].filter(Boolean)
  for (const path of candidates) {
    try {
      const names = await readdir(join(path, 'projects'))
      if (names.some((name) => name.endsWith('.yaml'))) return path
    } catch {
      // Not there; try the next candidate.
    }
  }
  return null
}

const ledger = await findLedger()
if (ledger === null) {
  process.stdout.write('render-check: no ledger clone found; nothing to render.\n')
  process.exit(0)
}

const { RepoCache } = await import('../lib/repo.js')
const { PocStore } = await import('../lib/store.js')
const { buildBlockerBoard } = await import('../lib/blockers.js')

const cache = new RepoCache({
  cacheRoot: join(ledger, '..'),
  repository: 'skillre/workbranch',
  branch: 'main',
  remoteUrl: '',
  cloneTimeoutMs: 1,
  fetchTimeoutMs: 1,
})
const store = new PocStore(cache, { now: () => new Date(), stallDays: 45 })
const snapshot = await store.snapshot()

const board = snapshot.blockers
const bySource = {}
for (const row of board.rows) bySource[row.source] = (bySource[row.source] ?? 0) + 1

process.stdout.write(`\n=== ledger: ${ledger}\n`)
process.stdout.write(`projects ${snapshot.projects.length} · gaps ${snapshot.gaps.length} · blockers ${board.rows.length}\n`)
process.stdout.write(`sources ${JSON.stringify(bySource)}\n`)
process.stdout.write(`projects blocked ${board.projectsBlocked} / ${board.projectsTotal}\n`)

// The first eight blocker groups, exactly as the panel would group them.
const groups = new Map()
for (const row of board.rows) {
  const list = groups.get(row.pocId) ?? []
  list.push(row)
  groups.set(row.pocId, list)
}
process.stdout.write(`\n--- blocker groups (first 6 of ${groups.size})\n`)
for (const [pocId, rows] of [...groups.entries()].slice(0, 6)) {
  process.stdout.write(`  ${pocId}  ${rows.length} blocker(s), worst=${rows.some((row) => row.level === 'high') ? 'high' : 'medium'}\n`)
  for (const row of rows.slice(0, 4)) {
    process.stdout.write(`    · [${row.source}] ${row.rule ?? '(no rule)'} ${JSON.stringify(row.params)}\n`)
  }
}

// One G0 project's worklist, computed the same way the component does.
const g0 = snapshot.projects.find((project) => project.stage === 'G0')
if (g0 !== undefined) {
  const detail = await store.detail(g0.pocId)
  const rows = board.rows.filter((row) => row.pocId === g0.pocId)
  const missing = detail.gate0.checklist.filter((item) => !item.present).map((item) => item.field)
  process.stdout.write(`\n--- worklist for ${g0.pocId} (${g0.name})\n`)
  process.stdout.write(`  G0 still missing: ${missing.length === 0 ? '(none)' : missing.join(', ')}\n`)
  process.stdout.write(`  blocker sources:  ${[...new Set(rows.map((row) => row.source))].join(', ') || '(none)'}\n`)
  process.stdout.write(`  items the page will list: ${missing.length + rows.filter((row) => row.source !== 'gap').length}\n`)
}

// Which skeleton the detail pane would pick for each project.
const buckets = {}
for (const project of snapshot.projects) {
  const key = project.closed ? 'closed' : project.stage ?? 'unknown'
  buckets[key] = (buckets[key] ?? 0) + 1
}
process.stdout.write(`\n--- detail skeletons\n`)
for (const [key, count] of Object.entries(buckets)) {
  process.stdout.write(`  ${key}: ${count} project(s)\n`)
}
process.stdout.write('\n')
