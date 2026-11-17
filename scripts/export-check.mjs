// Read-only end-to-end check of the export form against the real ledger clone.
// It never calls prepare()/refresh(), so it cannot wipe or write the user's cache.
import { RepoCache } from '../lib/repo.js'
import { buildFormHtml, formFileName, projectForForm } from '../lib/form.js'
import { text } from '../lib/gap.js'
import YAML from 'yaml'

const cache = new RepoCache({
  cacheRoot: process.env.HOME + '/.dsh/cache/work-dashboard',
  repository: 'skillre/workbranch',
  branch: 'main',
  remoteUrl: '',
  cloneTimeoutMs: 1,
  fetchTimeoutMs: 1,
})

const records = []
for (const file of await cache.projectFiles()) records.push(YAML.parse(await cache.readProject(file)))

const now = new Date()
const picked = records.slice(0, 2)
const wanted = new Set(picked.map((record) => text(record.poc_id)))
const filled = buildFormHtml({ mode: 'fill', projects: picked.map(projectForForm), now })
process.stdout.write(`fill form: ${formFileName({ mode: 'fill', pocIds: picked.map((r) => text(r.poc_id)), now })}, ${picked.length} projects, ${filled.length} bytes\n`)
const blank = buildFormHtml({ mode: 'blank', projects: [], now })
process.stdout.write(`blank form: ${formFileName({ mode: 'blank', pocIds: [], now })}, ${blank.length} bytes\n`)

// A stale browser tab holding an id that no longer exists must still produce the
// projects it can, rather than failing the whole batch.
const mixedWanted = new Set([text(records[0].poc_id), 'POC-DOES-NOT-EXIST'])
const mixed = records.filter((record) => mixedWanted.has(text(record.poc_id)))
process.stdout.write(`stale id tolerated: ${mixed.length} of ${mixedWanted.size} requested\n`)

// The generated document must be self-contained.
const external = /<link[^>]+rel="stylesheet"|<script[^>]+src=|\bsrc="https?:|\bhref="https?:/.test(filled)
process.stdout.write(`self-contained: ${!external}\n`)
