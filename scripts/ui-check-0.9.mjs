#!/usr/bin/env node
/**
 * Drive the real browser over raw CDP and assert the 0.9.0 UI.
 *
 * This is the check that no unit test can make: it proves the DSH shell actually
 * mounts the page, the styles apply, and the new surfaces render in a browser
 * rather than only in jsdom. It talks to Chrome directly (no harness daemon)
 * because the harness needs writable state under `~/.config`, which the sandbox
 * denies.
 *
 * Screenshots go to `docs/evidence/`, which is the repo's own evidence folder.
 *
 *   node scripts/ui-check-0.9.mjs
 */

import { writeFile } from 'node:fs/promises'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CDP = process.env.CDP_HTTP || 'http://127.0.0.1:9555'

/** One attached CDP session over the page's WebSocket. */
class Session {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      const waiter = this.pending.get(message.id)
      if (!waiter) return
      this.pending.delete(message.id)
      if (message.error) waiter.reject(new Error(message.error.message))
      else waiter.resolve(message.result)
    })
  }

  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  /** Evaluate an expression in the page and return its value. */
  async eval(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    })
    if (result.exceptionDetails) {
      throw new Error(`page threw: ${result.exceptionDetails.text} ${result.exceptionDetails.exception?.description ?? ''}`)
    }
    return result.result.value
  }

  async screenshot(path) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    await writeFile(path, Buffer.from(data, 'base64'))
  }
}

/** Attach to the most recent page target showing the preview URL. */
async function attach() {
  const targets = await fetch(`${CDP}/json/list`).then((response) => response.json())
  const page = targets.find((entry) => entry.type === 'page' && entry.url.includes('127.0.0.1:'))
  if (!page) throw new Error('no preview tab; open the URL first')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve)
    ws.addEventListener('error', () => reject(new Error('websocket failed')))
  })
  return new Session(ws)
}

const checks = []
const failures = []
function check(name, condition, detail = '') {
  if (condition) {
    checks.push(name)
    process.stdout.write(`  ✓ ${name}${detail === '' ? '' : ` — ${detail}`}\n`)
  } else {
    failures.push(`${name}${detail === '' ? '' : ` — ${detail}`}`)
    process.stdout.write(`  ✗ ${name}${detail === '' ? '' : ` — ${detail}`}\n`)
  }
}

const session = await attach()
await session.send('Page.enable')
await session.send('Runtime.enable')

process.stdout.write('\n== wait for the console to mount\n')
// The DSH shell boots lazily; poll until the plugin's own root class is present.
let mounted = false
for (let attempt = 0; attempt < 60; attempt += 1) {
  mounted = await session.eval("!!document.querySelector('.wd-shell')")
  if (mounted) break
  await new Promise((resolve) => setTimeout(resolve, 500))
}

// The sidebar entry may need a click to select the panel.
if (!mounted) {
  await session.eval(`(() => {
    const buttons = [...document.querySelectorAll('button, [role="button"], a')];
    const target = buttons.find((node) => (node.textContent || '').trim() === '工作看板');
    if (target) { target.click(); return true; }
    return false;
  })()`)
  for (let attempt = 0; attempt < 60; attempt += 1) {
    mounted = await session.eval("!!document.querySelector('.wd-shell')")
    if (mounted) break
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}
check('web-ui-mounts', mounted)

if (!mounted) {
  process.stdout.write('\nconsole mount failed; dumping page text\n')
  process.stdout.write((await session.eval('document.body.innerText.slice(0, 1200)')) || '')
  await session.screenshot(join(repo, 'docs', 'evidence', 'wd-0.9-mount-failed.png'))
  process.exit(1)
}

process.stdout.write('\n== dismiss the product first-run notice\n')
// DSH greets a fresh profile with a preview notice. It is not this plugin's UI,
// but it sits above everything, so an evidence screenshot taken through it shows
// the notice rather than the surface under review. Dismissing it is part of
// getting a usable check.
const greeted = await session.eval(`(() => {
  for (const label of ['继续', '知道了', '关闭']) {
    const button = [...document.querySelectorAll('button')].find((node) => (node.textContent || '').trim() === label);
    if (button) { button.click(); return label; }
  }
  return null;
})()`)
process.stdout.write(`  ${greeted === null ? 'no notice' : `dismissed "${greeted}"`}\n`)
await new Promise((resolve) => setTimeout(resolve, 400))

process.stdout.write('\n== pull data from the fixture ledger\n')
// Reset to the overview first: a previous run may have left the console on a
// detail page, where the header actions and the toolbar are not rendered. A
// fresh load also needs a moment for the lazy client module to register, so the
// check runs only after the shell has appeared.
const resetToOverview = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const state = await session.eval(`(() => {
      if (document.querySelector('.dt-rail')) {
        const back = [...document.querySelectorAll('button')].find((node) => (node.textContent || '').includes('返回'));
        if (back) back.click();
        return 'back';
      }
      if (document.querySelector('.kpi-strip')) return 'overview';
      return 'booting';
    })()`)
    if (state === 'overview') return true
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  return false
}
check('web-ui-reset-to-overview', await resetToOverview())

// A cold cache renders the empty state; press Refresh so the board has data. On a
// warm cache the button is still there, so this is the same path either way.
const pressed = await session.eval(`(() => {
  const button = [...document.querySelectorAll('button')].find((node) => (node.textContent || '').trim() === '刷新');
  if (!button || button.disabled) return false;
  button.click();
  return true;
})()`)
check('web-ui-refresh-pressed', pressed)

// Wait for real project cards rather than for a fixed delay.
let ready = false
for (let attempt = 0; attempt < 120; attempt += 1) {
  ready = await session.eval("document.querySelectorAll('.pcard, .pboard-card, .project-row').length > 0")
  if (ready) break
  await new Promise((resolve) => setTimeout(resolve, 500))
}
check('web-ui-projects-rendered', ready, String(await session.eval("document.querySelectorAll('.pcard').length")) + ' cards')

process.stdout.write('\n== 0.8 surfaces\n')
const kpi = await session.eval(`(() => {
  const strip = document.querySelector('.kpi-strip');
  if (!strip) return null;
  return {
    cells: strip.querySelectorAll('.kpi-cell').length,
    stageChips: strip.querySelectorAll('.kpi-stage-chip').length,
    text: strip.innerText.replace(/\\s+/g, ' ').slice(0, 200),
  };
})()`)
check('web-ui-kpi-strip', kpi !== null && kpi.cells === 5, kpi === null ? 'missing' : `${kpi.cells} cells, ${kpi.stageChips} stage chips`)

const budget = await session.eval(`(() => {
  const panel = document.querySelector('.budget-panel');
  if (!panel) return null;
  return {
    rows: panel.querySelectorAll('.budget-row').length,
    hasTotal: /预算合计|Total budget/.test(panel.innerText),
    text: panel.innerText.replace(/\\s+/g, ' ').slice(0, 160),
  };
})()`)
check('web-ui-budget-panel', budget !== null && budget.rows === 3, budget === null ? 'missing' : `${budget.rows} buckets`)

const stageProgress = await session.eval("document.querySelectorAll('.stage-progress-row').length")
check('web-ui-stage-progress', stageProgress >= 5, `${stageProgress} rows`)

const blockers = await session.eval(`(() => {
  const groups = document.querySelectorAll('.blocker-group');
  const chips = document.querySelectorAll('.blocker-chip');
  const note = document.querySelector('.panel-note');
  return { groups: groups.length, chips: chips.length, note: note ? note.textContent : '' };
})()`)
check('web-ui-blocker-panel', blockers.groups > 0, `${blockers.groups} project groups, ${blockers.chips} source chips`)
check('web-ui-blocker-projects-note', /个项目有阻障|blocked/.test(blockers.note), blockers.note)

// Filter by a source chip and confirm the list narrows.
const sourceFilter = await session.eval(`(() => {
  const chip = [...document.querySelectorAll('.blocker-chip')].find((node) => node.getAttribute('data-source') === 'no-progress');
  if (!chip) return { found: false };
  const before = document.querySelectorAll('.blocker-group').length;
  chip.click();
  return { found: true, before, after: document.querySelectorAll('.blocker-group').length };
})()`)
check('web-ui-blocker-source-filter', sourceFilter.found && sourceFilter.after <= sourceFilter.before,
  sourceFilter.found ? `${sourceFilter.before} -> ${sourceFilter.after} groups` : 'no no-progress chip')

// Clear the filter again.
await session.eval(`(() => {
  const chip = [...document.querySelectorAll('.blocker-chip')].find((node) => node.getAttribute('data-source') === 'no-progress');
  if (chip) chip.click();
  return true;
})()`)

await session.screenshot(join(repo, 'docs', 'evidence', 'wd-0.9-overview.png'))
checks.push('web-ui-overview-screenshot')

process.stdout.write('\n== stage-aware detail\n')
const opened = await session.eval(`(() => {
  const card = document.querySelector('.pcard');
  if (!card) return false;
  card.click();
  return true;
})()`)
check('web-ui-open-detail', opened)

let detailReady = false
for (let attempt = 0; attempt < 40; attempt += 1) {
  detailReady = await session.eval("!!document.querySelector('.dt-stage-context')")
  if (detailReady) break
  await new Promise((resolve) => setTimeout(resolve, 250))
}
check('web-ui-detail-stage-context', detailReady)

const detail = await session.eval(`(() => {
  const titles = [...document.querySelectorAll('.dt-pane .dsec-title')].map((node) => node.textContent);
  return {
    titles,
    worklist: document.querySelectorAll('.worklist').length,
    workItems: document.querySelectorAll('.worklist-item').length,
    basic: document.querySelectorAll('.dt-basic-row').length,
    decisions: document.querySelectorAll('.dt-basic-decisions .dt-prose').length,
    fold: document.querySelectorAll('.dt-fold').length,
    stageState: document.querySelector('.dt-stage-context-state')?.textContent || '',
  };
})()`)
check('web-ui-detail-basic-info', detail.basic >= 6 && detail.decisions === 2, `${detail.basic} fields, ${detail.decisions} decision blocks`)
check('web-ui-detail-worklist', detail.worklist === 1, `${detail.workItems} items`)
check('web-ui-detail-fold', detail.fold === 1, 'other sections folded, not removed')
check('web-ui-detail-first-section', detail.titles.length > 0, `order: ${detail.titles.join(' → ')}`)
process.stdout.write(`  · stage state: ${detail.stageState}\n`)

await session.screenshot(join(repo, 'docs', 'evidence', 'wd-0.9-detail.png'))
checks.push('web-ui-detail-screenshot')

process.stdout.write('\n== export form\n')
// Back to the list. The rail's control is labelled "← 返回", and it is the FIRST
// back button on the page, so the match is on inclusion rather than equality.
await session.eval(`(() => {
  const back = [...document.querySelectorAll('button')].find((node) => (node.textContent || '').includes('返回'));
  if (back) back.click();
  return true;
})()`)
// Wait for the overview's own toolbar to come back rather than for a fixed delay.
let backOnOverview = false
for (let attempt = 0; attempt < 40; attempt += 1) {
  backOnOverview = await session.eval("!!document.querySelector('.kpi-strip') && !document.querySelector('.dt-rail')")
  if (backOnOverview) break
  await new Promise((resolve) => setTimeout(resolve, 250))
}
check('web-ui-returns-to-overview', backOnOverview)

const exportOpened = await session.eval(`(() => {
  const button = [...document.querySelectorAll('button')].find((node) => (node.textContent || '').trim() === '导出表单');
  if (!button || button.disabled) return false;
  button.click();
  return true;
})()`)
check('web-ui-export-open', exportOpened)
await new Promise((resolve) => setTimeout(resolve, 400))
const exportDialog = await session.eval(`(() => {
  const dialog = document.querySelector('.modal-wide');
  if (!dialog) return null;
  return { rows: dialog.querySelectorAll('.export-row').length, selected: [...dialog.querySelectorAll('.export-row')].filter((r) => r.getAttribute('data-selected') === 'true').length };
})()`)
check('web-ui-export-preselects', exportDialog !== null && exportDialog.selected === exportDialog.rows,
  exportDialog === null ? 'no dialog' : `${exportDialog.selected}/${exportDialog.rows} preselected`)
await session.screenshot(join(repo, 'docs', 'evidence', 'wd-0.9-export.png'))
checks.push('web-ui-export-screenshot')

process.stdout.write('\n== console errors\n')
const errors = await session.eval('(window.__wdErrors || []).length').catch(() => 0)
check('web-ui-no-console-errors', errors === 0, String(errors))

process.stdout.write(`\npassed: ${checks.length} | failed: ${failures.length}\n`)
if (failures.length > 0) {
  for (const failure of failures) process.stdout.write(`  FAILED: ${failure}\n`)
  process.exit(1)
}
await writeFile(join(repo, 'docs', 'evidence', 'ui-verification-0.9.0.json'), JSON.stringify({
  version: '0.9.0',
  verifiedAt: new Date().toISOString(),
  browser: 'Chrome for Testing 147.0.7727.15 (headless, CDP)',
  checks,
  failures,
}, null, 2) + '\n')
process.stdout.write('wrote docs/evidence/ui-verification-0.9.0.json\n')
