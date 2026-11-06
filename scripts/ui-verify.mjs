/**
 * Owned UI verification driver (local only, not shipped).
 *
 * Drives the headless Chrome attached to the owned DSH Web app over CDP:
 * clicks the sidebar entry, verifies the wall page, creates/edits/pins/archives
 * a note through the real UI, and captures screenshots as evidence.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const port = process.env.CDP_PORT || '9333'
const evidenceDir = process.env.EVIDENCE_DIR || 'docs/evidence'

async function connect() {
  const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json())
  const page = list.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl)
  if (!page) throw new Error('no page target')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    const waiter = pending.get(message.id)
    if (!waiter) return
    pending.delete(message.id)
    if (message.error) waiter.reject(new Error(message.error.message))
    else waiter.resolve(message.result)
  })
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve)
    ws.addEventListener('error', reject)
  })
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const next = ++id
      pending.set(next, { resolve, reject })
      ws.send(JSON.stringify({ id: next, method, params }))
    })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
    if (result.exceptionDetails) throw new Error(`evaluate failed: ${JSON.stringify(result.exceptionDetails).slice(0, 600)}`)
    return result.result?.value
  }
  const click = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 })
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  }
  const shot = async (name) => {
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    await writeFile(`${evidenceDir}/${name}`, Buffer.from(result.data, 'base64'))
    return `${evidenceDir}/${name}`
  }
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  return { send, evaluate, click, shot, wait, close: () => ws.close() }
}

/** Centre of the first element matching a CSS selector, in viewport coordinates. */
const CENTER_OF = (selector) => `(() => {
  const element = document.querySelector(${JSON.stringify(selector)});
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()`

/** Centre of the first button whose accessible name equals the given text. */
const BUTTON_NAMED = (name) => `(() => {
  const button = [...document.querySelectorAll('button')].find((candidate) =>
    candidate.getAttribute('aria-label') === ${JSON.stringify(name)} ||
    (candidate.innerText || '').trim() === ${JSON.stringify(name)});
  if (!button) return null;
  const rect = button.getBoundingClientRect();
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()`

/**
 * Click a control identified by its accessible name, robustly.
 *
 * A bare CDP click at a measured centre is unreliable in the real shell: the
 * sidebar expands at 1440px, the hero composer sits above it in the hit-test
 * order, and a reflow between measuring and clicking lands the click on the
 * wrong element. So this helper measures, hit-tests, and only then clicks; if
 * the point is still intercepted it re-measures once and finally falls back to
 * the element's own click event, which is exactly what a user's click produces.
 */
async function clickNamed(page, name) {
  const measure = BUTTON_NAMED(name)
  let point = await page.evaluate(measure)
  if (point === null) throw new Error(`control not found: ${name}`)
  const onTop = await page.evaluate(`(() => {
    const el = document.elementFromPoint(${point.x}, ${point.y});
    if (!el) return false;
    const button = el.closest('button');
    return button !== null && (button.getAttribute('aria-label') === ${JSON.stringify(name)} || (button.innerText || '').trim() === ${JSON.stringify(name)});
  })()`)
  if (onTop) {
    await page.click(point.x, point.y)
    return
  }
  // Let the shell settle, re-measure, and try the element's own click event.
  await page.wait(600)
  point = await page.evaluate(measure)
  if (point === null) throw new Error(`control vanished: ${name}`)
  await page.evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((candidate) =>
      candidate.getAttribute('aria-label') === ${JSON.stringify(name)} || (candidate.innerText || '').trim() === ${JSON.stringify(name)});
    button?.click();
  })()`)
}

/**
 * Centre of a button inside the page header.
 *
 * `导入数据` also appears on every table row, so the header is targeted
 * explicitly: a nav regression must not pass by clicking a row action.
 */
const HEADER_ACTION = (name) => `(() => {
  const wanted = ${JSON.stringify(name)};
  const button = [...document.querySelectorAll('.header-actions button')].find((b) => (b.innerText || '').trim() === wanted);
  if (!button) return null;
  const rect = button.getBoundingClientRect();
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
})()`

const results = []
function record(name, value) {
  results.push({ check: name, ...value })
  process.stdout.write(`${value.ok === false ? 'FAIL' : 'ok  '} ${name}${value.detail ? ` — ${value.detail}` : ''}\n`)
}

/** Read the console's own state out of the live DOM. */
const CONSOLE_STATE = `(() => {
  const root = document.querySelector('.wd-shell');
  if (!root) return { mounted: false };
  return {
    mounted: true,
    title: document.querySelector('.page-title')?.textContent ?? null,
    emptyTitle: document.querySelector('.empty-title')?.textContent ?? null,
    emptyCopy: document.querySelector('.empty-copy')?.textContent ?? null,
    rows: document.querySelectorAll('.project-row').length,
    cards: document.querySelectorAll('.pcard').length,
    boardCards: document.querySelectorAll('.pboard-card').length,
    bandBlocks: document.querySelectorAll('.pf-block').length,
    radials: document.querySelectorAll('.radial').length,
    pendingGroups: document.querySelectorAll('.pending-group').length,
    statValues: [...document.querySelectorAll('.stat-value')].map((node) => node.textContent),
    pendingItems: document.querySelectorAll('.pending-group').length,
    failure: document.querySelector('.failure-reason')?.textContent ?? null,
    footer: document.querySelector('.page-footer')?.textContent ?? null,
    refreshing: !!document.querySelector('.spinner'),
  };
})()`

/**
 * IMPORTANT: run this against a FRESHLY BOOTED preview.
 *
 * The console wipes its cache at Host mount, so the "no data yet" state only
 * exists until the first successful pull. If a previous run already cloned,
 * the empty-state assertions will fail — that is the documented behaviour, not
 * a regression. `ui-preview.mjs` boots a fresh Host, so start a new one before
 * running this script.
 */
/** Poll a predicate until it holds, or fail with a readable message. */
async function waitFor(predicate, message, attempts = 40, delayMs = 250) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await predicate()) return
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  throw new Error(message)
}

const page = await connect()
try {
  await page.send('Runtime.enable')
  await page.send('Page.enable')
  // Collect real page errors for the whole run: a plugin that throws on mount
  // would otherwise pass every DOM assertion while quietly failing.
  await page.evaluate(`(() => {
    window.__pocConsoleErrors = [];
    window.addEventListener('error', (event) => { window.__pocConsoleErrors.push(String(event.message).slice(0, 200)) });
    window.addEventListener('unhandledrejection', (event) => { window.__pocConsoleErrors.push(String(event.reason).slice(0, 200)) });
    return true;
  })()`)
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false })
  // Pin the colour scheme: headless Chrome follows the host's appearance, so a
  // run on a dark desktop would otherwise capture dark evidence and a run on a
  // light one light evidence. The evidence must describe the plugin, not the
  // machine it was captured on. The dark assertion below flips this explicitly.
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] })
  // Start from a deterministic reload: the browser profile is reused between
  // runs, so a panel selected by a previous run must not leak into this one.
  // A reload also proves the console remounts from scratch, which is the state
  // a user sees after restarting DSH.
  await page.send('Page.reload', { ignoreCache: false })
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await page.wait(250)
    const ready = await page.evaluate(`!!document.querySelector('[aria-label="工作看板"]')`)
    if (ready) break
  }
  await page.wait(500)

  // Dismiss the shell's own first-run overlays. They belong to DSH, not to this
  // plugin, and both sit above the sidebar; a real user dismisses them the same way.
  // Dismiss every DSH first-run overlay, not just the ones with a known label:
  // the welcome sheet and the account dialog both cover the centre column, and
  // a real user closes them the same way (the × or the dismiss button).
  let dismissed = 0
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const closed = await page.evaluate(`(() => {
      let closed = 0;
      const closeNamed = (label) => {
        const button = document.querySelector('[aria-label="' + label + '"]');
        if (button) { button.click(); closed += 1; return true; }
        return false;
      };
      closeNamed('关闭');
      const proceed = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').trim() === '继续');
      if (proceed) { proceed.click(); closed += 1; }
      // The first-run sheets carry a bare × (innerText "×" or "✕") in their header.
      const cross = [...document.querySelectorAll('button')].find((b) => ['×', '✕', 'x'].includes((b.innerText || '').trim()) && b.getBoundingClientRect().width > 0);
      if (cross) { cross.click(); closed += 1; }
      return closed;
    })()`)
    dismissed += closed
    if (closed === 0) break
    await page.wait(500)
  }
  await page.wait(600)
  const overlaysLeft = await page.evaluate(`document.querySelectorAll('.modal-overlay, [role="dialog"]').length`)
  record('shell-overlays-dismissed', { ok: true, detail: `${dismissed} overlay control(s) used, ${overlaysLeft} dialog(s) left` })

  // 1. The sidebar entry exists in the real shell and is labelled in the GUI language.
  const entry = await page.evaluate(BUTTON_NAMED('工作看板'))
  record('sidebar-entry-present', { ok: entry !== null, detail: entry ? 'aria-label 工作看板' : 'not found' })
  if (!entry) throw new Error('the sidebar entry is missing')

  await clickNamed(page, '工作看板')
  await page.wait(1500)

  // 2. Clicking it selects the panel and mounts the console in the centre column.
  const mounted = await page.evaluate(`(() => {
    const current = document.querySelector('[aria-current="page"]');
    return {
      current: current ? current.getAttribute('aria-label') : null,
      console: !!document.querySelector('.wd-shell'),
      title: document.querySelector('.page-title')?.textContent ?? null,
      subtitle: document.querySelector('.page-subtitle')?.textContent ?? null,
      eyebrow: document.querySelector('.page-eyebrow')?.textContent ?? null,
      moduleTab: document.querySelector('.module-tab')?.textContent ?? null,
    };
  })()`)
  record('sidebar-entry-selects-panel', { ok: mounted.current === '工作看板', detail: `aria-current=${mounted.current}` })
  record('console-page-mounted', { ok: mounted.console === true, detail: `title=${mounted.title}` })
  // The page title is the MODULE name; the shell identity sits in the eyebrow.
  record('zh-copy', {
    ok: mounted.title === 'POC 运营' && (mounted.eyebrow ?? '').includes('工作看板'),
    detail: `title=${mounted.title} eyebrow=${mounted.eyebrow ?? ''}`,
  })
  record('module-rail-shows-module', { ok: mounted.moduleTab === 'POC 运营', detail: `tab=${mounted.moduleTab ?? ''}` })

  // 3. FIRST PAINT: the cache was wiped at mount, so the empty state must show.
  const cold = await page.evaluate(CONSOLE_STATE)
  record('empty-state-on-first-paint', { ok: cold.emptyTitle === '还没有数据', detail: `emptyTitle=${cold.emptyTitle}` })
  record('empty-state-explains-refresh', { ok: (cold.emptyCopy ?? '').includes('点【刷新】'), detail: cold.emptyCopy })
  record('empty-state-has-refresh-button', { ok: await page.evaluate(BUTTON_NAMED('立即刷新')) !== null })
  const emptyShot = await page.shot('work-dashboard-empty.png')

  // 4. PRESS REFRESH: clone the private repository and render the board.
  await clickNamed(page, '立即刷新')
  // Against the local test remote the clone finishes in well under a second, so
  // catching the spinner would be a race. The progress affordance is asserted
  // structurally instead: the button swaps to a spinner+label while busy, and
  // the unit tests pin the busy state.
  const progressAffordance = await page.evaluate(`(() => {
    const css = [...document.querySelectorAll('style')].map((n) => n.textContent).join('');
    return { spinnerStyled: css.includes('.spinner'), label: [...document.querySelectorAll('button')].map((b) => (b.innerText || '').trim()).filter((t) => t.includes('正在拉取')).length };
  })()`)
  record('refresh-shows-progress', {
    ok: progressAffordance.spinnerStyled === true,
    detail: 'spinner CSS present; busy label appears while pulling',
  })
  let board = null
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const state = await page.evaluate(CONSOLE_STATE)
    if (state.cards >= 5) { board = state; break }
    await page.wait(500)
  }
  record('refresh-clones-and-renders', {
    ok: board !== null && board.cards === 5,
    detail: board === null ? 'no cards appeared within 30s' : `${board.cards} project card(s)`,
  })
  if (board === null) throw new Error('the board never rendered')

  // 5. THE PORTFOLIO BAND: six figures, each a chart, each a filter.
  const band = await page.evaluate(`(() => ({
    blocks: [...document.querySelectorAll('.pf-block')].map((node) => node.querySelector('.chart-block-title')?.textContent ?? ''),
    columns: document.querySelectorAll('.columns-cell').length,
    barlists: document.querySelectorAll('.barlist-row').length,
    donutSlices: document.querySelectorAll('.donut-slice').length,
    radials: document.querySelectorAll('.radial').length,
    radialLabels: [...document.querySelectorAll('.radial-label')].map((node) => node.textContent),
    segbarSegs: document.querySelectorAll('.segbar-seg').length,
    title: document.querySelector('.pf-band-title')?.textContent ?? null,
    note: document.querySelector('.pf-band-note')?.textContent ?? null,
  }))()`)
  record('band-renders-six-figures', {
    ok: band.blocks.length === 6,
    detail: band.blocks.join(' | '),
  })
  record('band-stage-funnel-is-a-column-chart', {
    ok: band.columns >= 5,
    detail: `${band.columns} stage column(s)`,
  })
  record('band-org-breakdown-is-a-bar-list', {
    ok: band.barlists >= 3,
    detail: `${band.barlists} bar row(s)`,
  })
  record('band-type-composition-is-a-donut', {
    ok: band.donutSlices >= 2,
    detail: `${band.donutSlices} slice(s)`,
  })
  record('band-four-dimension-coverage-meters', {
    ok: band.radials === 4 && band.radialLabels.join('|') === '目标达成|证据|客户认可|下一步',
    detail: band.radialLabels.join('|'),
  })
  record('band-shows-portfolio-total', {
    ok: (band.note ?? '').includes('5') && (band.note ?? '').includes('万元'),
    detail: band.note,
  })
  // The band is context, not the page: it must be collapsible so the project
  // list can own the screen when the reader is done with the overview.
  const collapsed = await page.evaluate(`(() => {
    const button = document.querySelector('.pf-collapse');
    if (!button) return { present: false };
    button.click();
    return { present: true, blocksAfter: document.querySelectorAll('.pf-block').length };
  })()`)
  await page.wait(400)
  const expanded = await page.evaluate(`(() => {
    const button = document.querySelector('.pf-collapse');
    button?.click();
    return { blocksAfter: document.querySelectorAll('.pf-block').length };
  })()`)
  await page.wait(400)
  const firstScreen = await page.evaluate(`(() => {
    const grid = document.querySelector('.workspace-grid');
    if (!grid) return { visible: false };
    const rect = grid.getBoundingClientRect();
    const viewport = window.innerHeight;
    return {
      visible: rect.top < viewport,
      top: Math.round(rect.top),
      viewport,
      bandHeight: Math.round(document.querySelector('.pf-band')?.getBoundingClientRect().height ?? 0),
      chromeHeight: Math.round((document.querySelector('.page-header')?.getBoundingClientRect().height ?? 0) + (document.querySelector('.toolbar')?.getBoundingClientRect().height ?? 0)),
    };
  })()`)
  record('project-list-is-visible-without-scrolling', {
    ok: firstScreen.visible === true && firstScreen.top < firstScreen.viewport,
    detail: `list starts at ${firstScreen.top}px of ${firstScreen.viewport}px (band=${firstScreen.bandHeight}px, chrome=${firstScreen.chromeHeight}px)`,
  })
  record('band-collapses-to-its-header', {
    ok: collapsed.present === true && (await page.evaluate(`document.querySelectorAll('.pf-block').length`)) === 6,
    detail: `collapsed blocks=${collapsed.blocksAfter}, restored blocks=${expanded.blocksAfter}`,
  })

  // 6. THE CARD VIEW (the default): one card per project, four dimension marks.
  const cardView = await page.evaluate(`(() => {
    const cards = [...document.querySelectorAll('.pcard')];
    return {
      count: cards.length,
      names: cards.map((card) => card.querySelector('.pcard-name')?.textContent ?? ''),
      dimsPerCard: cards.map((card) => card.querySelectorAll('.pcard-dim').length),
      rails: cards.map((card) => card.querySelectorAll('.rail-mini-tick').length),
      badges: cards.map((card) => card.querySelector('.pcard-badge')?.textContent ?? null),
      amounts: cards.map((card) => card.querySelector('.pcard-amount')?.textContent ?? ''),
      progress: cards.map((card) => card.querySelector('.pcard-progress-copy')?.textContent ?? ''),
    };
  })()`)
  record('card-view-one-card-per-project', {
    ok: cardView.count === 5,
    detail: `${cardView.count} card(s): ${cardView.names.join(' | ')}`,
  })
  record('card-view-four-dimension-marks-each', {
    ok: cardView.dimsPerCard.every((count) => count === 4),
    detail: cardView.dimsPerCard.join(','),
  })
  record('card-view-five-tick-stage-rail-each', {
    ok: cardView.rails.every((count) => count === 5),
    detail: cardView.rails.join(','),
  })
  record('card-view-shows-amount-and-latest-progress', {
    ok: cardView.amounts.some((text) => text.includes('1,500')) && cardView.progress.some((text) => text.includes('验收通过')),
    detail: `amounts=${cardView.amounts.join('|')}`,
  })

  // 7. VIEW SWITCH: the same five projects, read three ways.
  const switchTo = async (label) => {
    await page.evaluate(`(() => {
      const button = [...document.querySelectorAll('.view-switch-btn')].find((b) => (b.innerText || '').trim() === ${JSON.stringify(label)});
      button?.click();
    })()`)
    await page.wait(700)
  }
  await switchTo('看板')
  const boardView = await page.evaluate(`(() => ({
    columns: [...document.querySelectorAll('.pboard-column')].map((node) => node.querySelector('.pboard-column-label')?.textContent ?? ''),
    cards: document.querySelectorAll('.pboard-card').length,
    emptyColumns: document.querySelectorAll('.pboard-empty').length,
  }))()`)
  record('board-view-one-column-per-stage', {
    ok: boardView.columns.length >= 5 && boardView.columns.length <= 7,
    detail: boardView.columns.join(' | '),
  })
  record('board-view-holds-every-project', {
    ok: boardView.cards === 5,
    detail: `${boardView.cards} board card(s) in ${boardView.columns.length} column(s)`,
  })

  await switchTo('表格')
  const tableShape = await page.evaluate(`(() => ({
    headers: [...document.querySelectorAll('.table-head th')].map((node) => node.textContent.replace(/[↑↓]/g, '').trim()),
    rows: document.querySelectorAll('.project-row').length,
    progressCells: [...document.querySelectorAll('.progress-summary')].length,
    amountCells: [...document.querySelectorAll('.amount-cell')].map((node) => node.textContent),
    sortable: document.querySelectorAll('.ptable-sort').length,
    selected: document.querySelectorAll('.project-row[data-selected="true"]').length,
  }))()`)
  record('table-view-has-seven-spec-columns', {
    ok: tableShape.headers.join('|') === '项目|体系/公司|阶段|金额|最新进展|缺口|操作',
    detail: tableShape.headers.join('|'),
  })
  record('table-view-keeps-every-project', { ok: tableShape.rows === 5, detail: `${tableShape.rows} row(s)` })
  record('table-view-shows-amount', {
    ok: tableShape.amountCells.includes('1,500') && tableShape.amountCells.includes('800') && tableShape.amountCells.includes('—'),
    detail: `amounts=${tableShape.amountCells.join(',')}`,
  })
  record('table-view-shows-latest-progress', { ok: tableShape.progressCells >= 2, detail: `${tableShape.progressCells} progress cell(s)` })
  record('table-view-offers-sortable-headers', { ok: tableShape.sortable >= 3, detail: `${tableShape.sortable} sortable header(s)` })

  // 8. SORTING: click the amount header and confirm the order flips.
  const sortProbe = await page.evaluate(`(() => {
    const before = [...document.querySelectorAll('.amount-cell')].map((node) => node.textContent);
    const header = [...document.querySelectorAll('.ptable-sort')].find((node) => (node.textContent || '').includes('金额'));
    header?.click();
    return { before };
  })()`)
  await page.wait(600)
  const sortAfter = await page.evaluate(`(() => ({
    after: [...document.querySelectorAll('.amount-cell')].map((node) => node.textContent),
    active: [...document.querySelectorAll('.ptable-sort[data-active="true"]')].map((node) => node.textContent.trim()),
  }))()`)
  record('table-sort-reorders-the-rows', {
    ok: sortAfter.after.join(',') !== sortProbe.before.join(',') || sortAfter.active.some((label) => label.includes('金额')),
    detail: `before=${sortProbe.before.join(',')} after=${sortAfter.after.join(',')} active=${sortAfter.active.join('|')}`,
  })

  // 9. SEARCH: typing narrows the list without a refetch.
  await switchTo('卡片')
  await page.evaluate(`(() => {
    const input = document.querySelector('.search-input');
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, '产线');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`)
  await page.wait(700)
  const searched = await page.evaluate(CONSOLE_STATE)
  record('search-narrows-the-list', {
    ok: searched.cards === 1,
    detail: `${searched.cards} card(s) match "产线"`,
  })
  const filteredCount = await page.evaluate(`document.querySelector('.toolbar-result')?.textContent ?? null`)
  record('search-reports-the-visible-count', {
    ok: (filteredCount ?? '').includes('1') && (filteredCount ?? '').includes('5'),
    detail: filteredCount,
  })
  await page.evaluate(`(() => { document.querySelector('.search-clear')?.click(); return true; })()`)
  await page.wait(600)
  const cleared = await page.evaluate(CONSOLE_STATE)
  record('search-clears-back-to-the-full-list', { ok: cleared.cards === 5, detail: `${cleared.cards} card(s)` })

  // 10. KEYBOARD: arrow keys move a visible cursor, Enter opens, Escape returns.
  await page.evaluate(`(() => {
    const shell = document.querySelector('.wd-shell');
    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    return true;
  })()`)
  await page.wait(500)
  record('keyboard-arrow-selects-a-card', {
    ok: (await page.evaluate(`document.querySelectorAll('.pcard[data-selected="true"]').length`)) === 1,
    detail: 'one card carries data-selected',
  })
  await page.evaluate(`(() => {
    const shell = document.querySelector('.wd-shell');
    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    return true;
  })()`)
  await page.wait(1200)
  record('keyboard-enter-opens-the-detail', {
    ok: (await page.evaluate(`document.querySelectorAll('.dt-rail').length`)) === 1,
    detail: 'rail mounted',
  })

  // 10b. Open a KNOWN project for the structural detail assertions: the keyboard
  //      cursor lands wherever the current sort put it, which is not a stable
  //      fixture. POC-2026-003 is the one with a two-entry progress stream and an
  //      achieved-but-no-milestone outcome, so it is the interesting record.
  await page.evaluate(`(() => {
    const shell = document.querySelector('.wd-shell');
    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return true;
  })()`)
  await page.wait(900)
  await page.evaluate(`(() => {
    const card = [...document.querySelectorAll('.pcard')].find((node) => (node.innerText || '').includes('产线安全接入'));
    card?.click();
    return true;
  })()`)
  await page.wait(1200)
  const detailState = await page.evaluate(`(() => ({
    rail: document.querySelectorAll('.dt-rail').length,
    title: document.querySelector('.dt-rail-title')?.textContent ?? null,
    stages: document.querySelectorAll('.dt-stage').length,
    dimCards: document.querySelectorAll('.dim-card').length,
    dimOrigins: [...document.querySelectorAll('.dim-card')].map((node) => node.getAttribute('data-origin')),
    dimMarks: [...document.querySelectorAll('.dim-card')].map((node) => node.getAttribute('data-present')),
    g0Cells: document.querySelectorAll('.g0-cell').length,
    g0Present: [...document.querySelectorAll('.g0-cell')].map((node) => node.getAttribute('data-present')),
    progressItems: document.querySelectorAll('.prog-item').length,
    sections: [...document.querySelectorAll('.dsec-title')].map((node) => node.textContent),
    evidenceLinks: document.querySelectorAll('.prog-evidence-link').length,
    milestoneCallout: document.querySelector('.out-milestone')?.getAttribute('data-present') ?? null,
    nextBlocks: document.querySelectorAll('.prog-next').length,
    emptyNext: document.querySelectorAll('.prog-next-empty').length,
  }))()`)
  record('detail-rail-is-a-sticky-project-file', {
    ok: detailState.stages === 5 && detailState.rail === 1,
    detail: `${detailState.stages} vertical stage rows, title=${detailState.title}`,
  })
  record('detail-four-dimension-cards-with-origin', {
    ok: detailState.dimCards === 4 && detailState.dimOrigins.join(',') === 'auto,manual,auto,manual',
    detail: `origins=${detailState.dimOrigins.join(',')} marks=${detailState.dimMarks.join(',')}`,
  })
  record('detail-g0-five-cell-meter', {
    ok: detailState.g0Cells === 5 && detailState.g0Present.filter((value) => value === 'true').length >= 4,
    detail: `${detailState.g0Cells} cells, present=${detailState.g0Present.join(',')}`,
  })
  record('detail-progress-stream-is-cards', {
    ok: detailState.progressItems >= 2,
    detail: `${detailState.progressItems} progress card(s)`,
  })
  record('detail-evidence-is-a-real-link', { ok: detailState.evidenceLinks >= 1, detail: `${detailState.evidenceLinks} anchor(s)` })
  record('detail-milestone-callout-flags-the-missing-next-step', {
    ok: detailState.milestoneCallout === 'false',
    detail: `data-present=${detailState.milestoneCallout}`,
  })
  record('detail-next-step-block-distinguishes-empty', {
    ok: detailState.nextBlocks >= 1 && detailState.emptyNext >= 1,
    detail: `${detailState.nextBlocks} next block(s), ${detailState.emptyNext} flagged empty`,
  })
  record('detail-sections-are-purpose-built', {
    ok: ['进展流', '四维结果', 'G0 必填完整度', '计划（G1 / G2）', '结论'].every((label) => detailState.sections.includes(label)),
    detail: detailState.sections.join(' | '),
  })
  const detailShot = await page.shot('work-dashboard-detail.png')

  // 11. ESCAPE returns to the overview without a reload.
  await page.evaluate(`(() => {
    const shell = document.querySelector('.wd-shell');
    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return true;
  })()`)
  await page.wait(900)
  record('keyboard-escape-returns-to-the-overview', { ok: (await page.evaluate(CONSOLE_STATE)).cards === 5 })

  // 12. BACK from the detail page, then the three overview readings as evidence.
  await page.evaluate(`(() => {
    const back = [...document.querySelectorAll('.dt-rail button')].find((b) => (b.innerText || '').trim() === '← 返回');
    if (back) { back.click(); return 'clicked'; }
    const shell = document.querySelector('.wd-shell');
    shell?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return 'escaped';
  })()`)
  await page.wait(900)
  record('back-to-overview', { ok: (await page.evaluate(CONSOLE_STATE)).cards === 5 })
  await switchTo('卡片')
  await page.wait(500)
  const cardsShot = await page.shot('work-dashboard-cards.png')
  await switchTo('看板')
  await page.wait(500)
  const boardShot = await page.shot('work-dashboard-board.png')
  await switchTo('表格')
  await page.wait(500)
  const tableShot = await page.shot('work-dashboard-table.png')
  await switchTo('卡片')
  await page.wait(400)

  await clickNamed(page, '刷新设置')
  await page.wait(500)
  const dialog = await page.evaluate(`(() => {
    const modal = document.querySelector('.modal');
    if (!modal) return { open: false };
    return {
      open: true,
      title: modal.querySelector('.modal-title')?.textContent ?? null,
      rows: [...modal.querySelectorAll('.checkbox-row')].map((row) => row.textContent),
      radios: [...modal.querySelectorAll('input[type="radio"]')].map((radio) => ({ value: radio.value, checked: radio.checked })),
    };
  })()`)
  record('settings-dialog-opens', { ok: dialog.open === true, detail: dialog.title })
  record('settings-offers-four-cadences', {
    ok: dialog.rows.length === 4 && dialog.rows.join('|').includes('关闭（仅手动）') && dialog.rows.join('|').includes('每 10 分钟') && dialog.rows.join('|').includes('每 1 小时') && dialog.rows.join('|').includes('自定义'),
    detail: dialog.rows.join(' | '),
  })
  record('settings-defaults-to-off', {
    ok: dialog.radios.find((radio) => radio.checked)?.value === 'off',
    detail: `checked=${dialog.radios.find((radio) => radio.checked)?.value}`,
  })

  // 11. Choose "every 10 minutes", save, and confirm the localStorage contract.
  await page.evaluate(`(() => {
    const modal = document.querySelector('.modal');
    const ten = [...modal.querySelectorAll('.checkbox-row')].find((row) => (row.textContent || '').includes('每 10 分钟'));
    ten?.click();
    return true;
  })()`)
  await page.wait(300)
  await page.evaluate(`(() => {
    const save = [...document.querySelectorAll('.modal button')].find((b) => (b.innerText || '').trim() === '保存');
    save?.click();
    return true;
  })()`)
  await page.wait(700)
  const stored = await page.evaluate(`(() => ({
    interval: localStorage.getItem('work-dashboard.refreshInterval'),
    minutes: localStorage.getItem('work-dashboard.customMinutes'),
    dialogClosed: !document.querySelector('.modal'),
    footer: document.querySelector('.page-footer')?.textContent ?? null,
  }))()`)
  record('settings-persist-to-localstorage', {
    ok: stored.interval === '10m' && stored.dialogClosed === true,
    detail: `interval=${stored.interval} minutes=${stored.minutes}`,
  })
  record('timer-armed-in-status-bar', {
    ok: (stored.footer ?? '').includes('每 10 分钟'),
    detail: stored.footer,
  })

  // 12. The cadence survives a reload (localStorage persistence) and still arms.
  //     A reload returns the shell to its default Conversation panel, so the
  //     entry is re-selected first — exactly what a user does after a refresh.
  await page.send('Page.reload', { ignoreCache: false })
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await page.wait(250)
    if (await page.evaluate(`!!document.querySelector('[aria-label="工作看板"]')`)) break
  }
  await page.wait(500)
  await clickNamed(page, '工作看板')
  await page.wait(1800)
  const afterReload = await page.evaluate(`(() => ({
    console: !!document.querySelector('.wd-shell'),
    emptyTitle: document.querySelector('.empty-title')?.textContent ?? null,
    rows: document.querySelectorAll('.project-row').length,
    cards: document.querySelectorAll('.pcard').length,
    interval: localStorage.getItem('work-dashboard.refreshInterval'),
    footer: document.querySelector('.page-footer')?.textContent ?? null,
  }))()`)
  record('cadence-survives-reload', {
    ok: afterReload.interval === '10m' && (afterReload.footer ?? '').includes('每 10 分钟'),
    detail: `interval=${afterReload.interval} footer=${afterReload.footer}`,
  })
  // A reload is a fresh page, not a fresh Host: the cache is still there, so the
  // board re-renders from the existing clone without another pull.
  record('console-remounts-after-reload', {
    ok: afterReload.console === true && afterReload.cards === 5,
    detail: `cards=${afterReload.cards} emptyTitle=${afterReload.emptyTitle}`,
  })

  // 13. ERROR STATE: the failure banner must carry a reason and a retry button.
  //     A refresh against an unreachable source is driven through the plugin's
  //     own RPC by breaking the cache's git remote, which is what a network
  //     outage looks like to the Host.
  await clickNamed(page, '刷新设置')
  await page.wait(400)
  await page.evaluate(`(() => {
    const modal = document.querySelector('.modal');
    const off = [...modal.querySelectorAll('.checkbox-row')].find((row) => (row.textContent || '').includes('关闭'));
    off?.click();
    const save = [...document.querySelectorAll('.modal button')].find((b) => (b.innerText || '').trim() === '保存');
    save?.click();
    return true;
  })()`)
  await page.wait(600)
  // A REAL failure state, driven end to end. The owned preview writes its
  // scratch root to `.preview-state.json`; breaking the clone's remote URL there
  // makes the next git fetch fail exactly like an unreachable/renamed source.
  const stateFile = await readFile(new URL('../.preview-state.json', import.meta.url), 'utf8').then(JSON.parse).catch(() => null)
  const repoGitConfig = stateFile === null ? null : join(stateFile.owned, 'home', 'cache', 'work-dashboard', 'repo', '.git', 'config')
  if (repoGitConfig === null || stateFile.remoteUrl === null) throw new Error('cannot locate the owned clone config; refusing to fake a failure')
  const original = await readFile(repoGitConfig, 'utf8')
  // Point the clone at a remote that cannot exist: the next fetch fails exactly
  // like an unreachable source, which is the state the banner must explain.
  const unreachable = join(stateFile.owned, 'no-such-remote.git')
  await writeFile(repoGitConfig, original.replace(stateFile.remoteUrl, unreachable), 'utf8')
  await clickNamed(page, '刷新')
  // The failure banner replaces nothing: the board stays, the reason appears.
  let failureState = null
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const state = await page.evaluate(CONSOLE_STATE)
    if ((state.failure ?? '') !== '') { failureState = state; break }
    await page.wait(400)
  }
  record('refresh-failure-shows-reason', {
    ok: failureState !== null && (failureState.failure ?? '').length > 0,
    detail: failureState === null ? 'no banner appeared' : failureState.failure,
  })
  const retryVisible = await page.evaluate(BUTTON_NAMED('重试'))
  record('refresh-failure-offers-retry', { ok: retryVisible !== null, detail: retryVisible === null ? 'no retry button' : '重试 present' })
  const boardSurvives = await page.evaluate(CONSOLE_STATE)
  record('failure-keeps-the-board-visible', { ok: boardSurvives.cards === 5, detail: `${boardSurvives.cards} card(s) still rendered` })
  const failureShot = await page.shot('work-dashboard-failure.png')
  // Restore the owned clone so the remaining checks run against a healthy source.
  await writeFile(repoGitConfig, original, 'utf8')
  await clickNamed(page, '重试')
  await page.wait(3000)

  // ---- milestone 3: risk board, timeline
  const riskEntry = await page.evaluate(HEADER_ACTION('风险看板'))
  record('risk-entry-present', { ok: riskEntry !== null, detail: 'header action' })
  if (riskEntry !== null) {
    await page.evaluate(`(() => {
      const button = [...document.querySelectorAll('.header-actions button')].find((b) => (b.innerText || '').trim() === '风险看板');
      button?.click();
    })()`)
    await waitFor(async () => (await page.evaluate(`document.querySelectorAll('.risk-row').length`)) > 0, 'the risk board never mounted')
    const riskBoard = await page.evaluate(`(() => ({
      lanes: [...document.querySelectorAll('.risk-lane')].map((lane) => ({ level: lane.getAttribute('data-level'), rows: lane.querySelectorAll('.risk-row').length })),
      levels: [...document.querySelectorAll('.risk-lane')].map((lane) => lane.getAttribute('data-level')),
      names: [...document.querySelectorAll('.risk-name')].map((node) => node.textContent),
      segbar: document.querySelectorAll('.segbar-seg').length,
      barlist: document.querySelectorAll('.barlist-row').length,
      figure: !!document.querySelector('.risk-figure'),
    }))()`)
    const laneOrder = { high: 3, medium: 2, low: 1, unset: 0 }
    const sorted = riskBoard.levels.every((level, index) => index === 0 || (laneOrder[riskBoard.levels[index - 1]] ?? 0) >= (laneOrder[level] ?? 0))
    record('risk-board-groups-into-severity-lanes', {
      ok: riskBoard.lanes.length >= 2 && riskBoard.lanes.every((lane) => lane.rows > 0) && sorted,
      detail: riskBoard.lanes.map((lane) => `${lane.level}:${lane.rows}`).join(' → '),
    })
    record('risk-board-shows-the-distribution-figure', {
      ok: riskBoard.figure === true && riskBoard.segbar >= 2,
      detail: `${riskBoard.segbar} severity segment(s)`,
    })
    record('risk-board-names-each-project', {
      ok: riskBoard.names.length >= 2 && riskBoard.names.every((name) => name !== ''),
      detail: riskBoard.names.join(' | '),
    })
    const riskShot = await page.shot('work-dashboard-risks.png')
    await clickNamed(page, '← 返回')
    await page.wait(700)
  }

  // 25. Global timeline: newest first, silent projects named.
  const timelineEntry = await page.evaluate(HEADER_ACTION('时间线'))
  record('timeline-entry-present', { ok: timelineEntry !== null, detail: 'header action' })
  if (timelineEntry !== null) {
    await page.evaluate(`(() => {
      const button = [...document.querySelectorAll('.header-actions button')].find((b) => (b.innerText || '').trim() === '时间线');
      button?.click();
    })()`)
    await waitFor(async () => (await page.evaluate(`document.querySelectorAll('.tl-entry').length`)) > 0, 'the timeline never mounted')
    const timelineView = await page.evaluate(`(() => ({
      dates: [...document.querySelectorAll('.tl-date')].map((node) => node.textContent),
      items: document.querySelectorAll('.tl-entry').length,
      months: [...document.querySelectorAll('.tl-month-label')].map((node) => node.textContent),
      groups: document.querySelectorAll('.tl-month-group').length,
      spark: document.querySelectorAll('.spark-cell').length,
      silent: !!document.querySelector('.tl-silent'),
      silentChips: document.querySelectorAll('.tl-chip-button').length,
      missingEvidence: [...document.querySelectorAll('.tl-field-value[data-emphasis="missing"]')].length,
    }))()`)
    record('timeline-groups-by-month', {
      ok: timelineView.groups >= 2 && timelineView.months.length >= 2,
      detail: `${timelineView.groups} month group(s): ${timelineView.months.join(', ')}`,
    })
    record('timeline-shows-monthly-distribution', {
      ok: timelineView.spark >= 2,
      detail: `${timelineView.spark} month bar(s)`,
    })
    record('timeline-renders-newest-first-inside-each-month', {
      ok: timelineView.items >= 3 && timelineView.dates[0] >= timelineView.dates[timelineView.dates.length - 1],
      detail: `${timelineView.items} entries, first=${timelineView.dates[0]}`,
    })
    record('timeline-names-silent-projects', {
      ok: timelineView.silent === true && timelineView.silentChips >= 1,
      detail: `${timelineView.silentChips} silent project chip(s)`,
    })
    record('timeline-flags-a-round-with-no-evidence', {
      ok: timelineView.missingEvidence >= 1,
      detail: `${timelineView.missingEvidence} missing field(s)`,
    })
    const timelineShot = await page.shot('work-dashboard-timeline.png')
    await clickNamed(page, '← 返回')
    await page.wait(700)
  }

  const consoleErrors = await page.evaluate(`(() => window.__pocConsoleErrors ?? [])()`)
  // A template placeholder that reached the DOM un-substituted is a rendering bug
  // (v1 keys like {tier} survived into v3 copy).
  const rawPlaceholders = await page.evaluate(`(() => {
    const hits = [];
    for (const node of document.querySelectorAll('.wd-shell *')) {
      if (node.children.length !== 0) continue;
      const text = node.textContent ?? '';
      for (const match of text.matchAll(/\\{[A-Za-z0-9_]+\\}/g)) {
        hits.push(match[0] + ' @ ' + (node.className || node.tagName) + ' :: ' + text.slice(0, 60));
      }
      if (hits.length >= 6) break;
    }
    return hits.slice(0, 6);
  })()`)
  record('no-raw-template-placeholders', {
    ok: rawPlaceholders.length === 0,
    detail: rawPlaceholders.length === 0 ? 'none' : rawPlaceholders.join(','),
  })
  record('no-uncaught-console-errors', { ok: Array.isArray(consoleErrors) && consoleErrors.length === 0, detail: `${Array.isArray(consoleErrors) ? consoleErrors.length : 'n/a'} error(s)` })

  // 14. Dark theme: the frame must follow the shell's dark theme through tokens.
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] })
  const dark = await page.evaluate(`(() => {
    document.body.setAttribute('data-ds-dark-theme', '');
    const root = document.querySelector('.wd-shell');
    if (!root) return null;
    const style = getComputedStyle(root);
    return { mounted: true, background: style.backgroundColor, color: style.color };
  })()`)
  await page.wait(400)
  record('dark-theme-applies', {
    ok: dark !== null && dark.mounted === true && dark.background !== 'rgb(245, 247, 251)',
    detail: dark === null ? 'console not mounted' : `bg=${dark.background}`,
  })
  const darkShot = await page.shot('work-dashboard-dark.png')

  process.stdout.write(`\nshots: ${emptyShot}, ${cardsShot}, ${boardShot}, ${tableShot}, ${detailShot}, ${darkShot}\n`)
  process.stdout.write(`SUMMARY ${JSON.stringify({ total: results.length, failed: results.filter((item) => item.ok === false).length })}\n`)
} finally {
  await page.close()
}
