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
    dimCells: document.querySelectorAll('.dim-cell').length,
    stageDots: document.querySelectorAll('.stage-dot').length,
    statValues: [...document.querySelectorAll('.stat-value')].map((node) => node.textContent),
    pendingItems: document.querySelectorAll('.gap-item').length,
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
    if (state.rows >= 3) { board = state; break }
    await page.wait(500)
  }
  record('refresh-clones-and-renders', {
    ok: board !== null && board.rows === 3,
    detail: board === null ? 'no rows appeared within 30s' : `${board.rows} project row(s)`,
  })
  if (board === null) throw new Error('the board never rendered')

  // 5. The four headline counters.
  record('stat-grid-four-counters', {
    ok: board.statValues.length === 4,
    detail: `values=${board.statValues.join('/')}`,
  })

  // 6. FOUR separate dimension cells per project, never merged.
  record('four-dimension-cells-per-row', {
    ok: board.dimCells === board.rows * 4,
    detail: `${board.dimCells} cells across ${board.rows} rows`,
  })
  const dimensionDetail = await page.evaluate(`(() => {
    const rows = [...document.querySelectorAll('.project-row')];
    return rows.map((row) => ({
      name: row.querySelector('.project-name')?.textContent ?? null,
      labels: [...row.querySelectorAll('.dim-label')].map((node) => node.textContent),
      marks: [...row.querySelectorAll('.dim-cell')].map((cell) => cell.getAttribute('data-present')),
    }));
  })()`)
  record('four-dimension-cells-labelled', {
    ok: dimensionDetail.length === 3 && dimensionDetail.every((row) => row.labels.join('|') === '目标达成|证据|客户认可|下一步'),
    detail: dimensionDetail.map((row) => `${row.name}:${row.marks.join('')}`).join(' ; '),
  })
  // The G4 fixture is achieved + evidenced + recognised, but has no next milestone.
  const g4 = dimensionDetail.find((row) => (row.name ?? '').includes('产线安全接入'))
  record('four-dimension-state-is-per-dimension', {
    ok: g4 !== undefined && g4.marks.join(',') === 'true,true,true,false',
    detail: g4 === undefined ? 'G4 fixture missing' : `G4 marks=${g4.marks.join(',')}`,
  })

  // 7. The G0→G4 stage track is visible.
  record('stage-track-visible', { ok: board.stageDots === board.rows * 5, detail: `${board.stageDots} stage dots` })

  // 8. The pending list is ordered with the highest-value gap first.
  const pendingDetail = await page.evaluate(`(() => [...document.querySelectorAll('.gap-item')].map((item) => ({
    title: item.querySelector('.gap-title')?.textContent ?? null,
    level: item.className,
  })))()`)
  record('pending-list-ordered', {
    ok: pendingDetail.length > 0 && (pendingDetail[0]?.title ?? '').includes('做成了但没有下一步'),
    detail: pendingDetail.map((item) => item.title).join(' | '),
  })
  const boardShot = await page.shot('work-dashboard-board.png')

  // 9. DETAIL PAGE: open a row and confirm the full record.
  const opened = await page.evaluate(`(() => {
    const row = [...document.querySelectorAll('.project-row')].find((candidate) => (candidate.innerText || '').includes('产线安全接入'));
    if (!row) return false;
    row.click();
    return true;
  })()`)
  await page.wait(1200)
  const detailState = await page.evaluate(`(() => ({
    hero: !!document.querySelector('.project-hero'),
    title: document.querySelector('.project-title')?.textContent ?? null,
    stageTrack: document.querySelectorAll('.stage-step').length,
    summaryItems: document.querySelectorAll('.summary-item').length,
    summaryLabels: [...document.querySelectorAll('.summary-label')].map((node) => node.textContent),
    summaryMarks: [...document.querySelectorAll('.summary-item')].map((item) => item.getAttribute('data-present')),
    timelineItems: document.querySelectorAll('.timeline-item').length,
    gateRows: document.querySelectorAll('.gate-row').length,
    sections: [...document.querySelectorAll('.section-heading')].map((node) => node.firstChild?.textContent ?? node.textContent),
  }))()`)
  record('detail-page-opens', { ok: opened && detailState.hero, detail: `title=${detailState.title}` })
  record('detail-stage-rail-five-steps', { ok: detailState.stageTrack === 5, detail: `${detailState.stageTrack} steps` })
  record('detail-four-dimension-cards', {
    ok: detailState.summaryItems === 4 && detailState.summaryLabels.join('|') === '目标达成|证据|客户认可|下一步' && detailState.summaryMarks.join(',') === 'true,true,true,false',
    detail: `marks=${detailState.summaryMarks.join(',')}`,
  })
  record('detail-timeline-rendered', { ok: detailState.timelineItems >= 2, detail: `${detailState.timelineItems} round(s)` })
  record('detail-gate-rows', { ok: detailState.gateRows === 5, detail: `${detailState.gateRows} gate row(s)` })
  record('detail-sections-present', {
    ok: ['阶段轨道', '四维结果', 'G0 立项三必填', '时间线'].every((label) => detailState.sections.some((section) => (section ?? '').includes(label))),
    detail: detailState.sections.join(' | '),
  })
  const detailShot = await page.shot('work-dashboard-detail.png')

  // 10. BACK, then the refresh settings dialog.
  await clickNamed(page, '← 返回')
  await page.wait(900)
  record('back-to-overview', { ok: (await page.evaluate(CONSOLE_STATE)).rows === 3 })

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
    ok: afterReload.console === true && afterReload.rows === 3,
    detail: `rows=${afterReload.rows} emptyTitle=${afterReload.emptyTitle}`,
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
  record('failure-keeps-the-board-visible', { ok: boardSurvives.rows === 3, detail: `${boardSurvives.rows} row(s) still rendered` })
  const failureShot = await page.shot('work-dashboard-failure.png')
  // Restore the owned clone so the remaining checks run against a healthy source.
  await writeFile(repoGitConfig, original, 'utf8')
  await clickNamed(page, '重试')
  await page.wait(3000)

  // The failure test left the page wherever it was when the refresh failed
  // (the detail page). Return to the overview before the milestone-2 checks,
  // because the import/create entries live in the OVERVIEW header.
  const backAfterFailure = await page.evaluate(BUTTON_NAMED('← 返回'))
  if (backAfterFailure !== null) {
    await page.click(backAfterFailure.x, backAfterFailure.y)
    await page.wait(1000)
  }
  await waitFor(async () => (await page.evaluate(`!!document.querySelector('.stat-grid')`)) === true, 'the overview never came back')

  // ---- milestone 3: export form, risk board, timeline ---------------------

  // 23. Export page: pick projects, generate a real file.
  const exportEntry = await page.evaluate(HEADER_ACTION('导出表单'))
  record('export-entry-present', { ok: exportEntry !== null, detail: 'header action' })
  if (exportEntry !== null) {
    await page.evaluate(`(() => {
      const button = [...document.querySelectorAll('.header-actions button')].find((b) => (b.innerText || '').trim() === '导出表单');
      button?.click();
    })()`)
    await waitFor(async () => (await page.evaluate(`!!document.querySelector('.export-list')`)) === true, 'the export page never mounted')
    const exportPage = await page.evaluate(`(() => ({
      rows: document.querySelectorAll('.export-row').length,
      boxes: document.querySelectorAll('.export-row input[type="checkbox"]').length,
      hint: document.querySelector('.submit-hint')?.textContent ?? null,
    }))()`)
    record('export-page-lists-projects', { ok: exportPage.rows === 3 && exportPage.boxes === 3, detail: `${exportPage.rows} rows` })
    record('export-explains-blank-form', { ok: (exportPage.hint ?? '').includes('空白'), detail: (exportPage.hint ?? '').slice(0, 50) })

    // Select two projects, then capture the generated download.
    await page.evaluate(`(() => {
      const boxes = [...document.querySelectorAll('.export-row input[type="checkbox"]')];
      boxes[0]?.click(); boxes[1]?.click();
      return true;
    })()`)
    await page.wait(400)
    const selectedCount = await page.evaluate(`document.querySelectorAll('.export-row[data-selected="true"]').length`)
    record('export-multi-select', { ok: selectedCount === 2, detail: `${selectedCount} selected` })

    // Intercept the Blob download so the generated HTML can be inspected.
    await page.evaluate(`(() => {
      window.__pocDownloads = [];
      const original = URL.createObjectURL;
      URL.createObjectURL = function (blob) {
        try { blob.text().then(function (text) { window.__pocDownloads.push(text); }); } catch (e) {}
        return original.call(URL, blob);
      };
      return true;
    })()`)
    await clickNamed(page, '生成并下载')
    let downloaded = null
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const state = await page.evaluate(`(() => ({ files: (window.__pocDownloads || []).length, done: !!document.querySelector('.panel-body.padded') }))()`)
      if (state.files > 0) { downloaded = state; break }
      await page.wait(300)
    }
    const downloadedHtml = await page.evaluate(`(window.__pocDownloads && window.__pocDownloads[0]) || ''`)
    record('export-generates-file', {
      ok: downloaded !== null && downloadedHtml.startsWith('<!DOCTYPE html>'),
      detail: downloaded === null ? 'no download captured' : `${Math.round(downloadedHtml.length / 1024)} KB`,
    })
    record('export-file-is-self-contained', {
      ok: !/https?:\/\//.test(downloadedHtml) && !/<script[^>]+src=/.test(downloadedHtml) && !/<link\b/.test(downloadedHtml),
    })
    record('export-file-has-autosave-and-validation', {
      ok: downloadedHtml.includes('localStorage') && downloadedHtml.includes('要求 2-3 个'),
    })
    const exportShot = await page.shot('work-dashboard-export.png')
    await clickNamed(page, '← 返回')
    await page.wait(700)
  }

  // 24. Risk board: rows sorted by severity.
  const riskEntry = await page.evaluate(HEADER_ACTION('风险看板'))
  record('risk-entry-present', { ok: riskEntry !== null, detail: 'header action' })
  if (riskEntry !== null) {
    await page.evaluate(`(() => {
      const button = [...document.querySelectorAll('.header-actions button')].find((b) => (b.innerText || '').trim() === '风险看板');
      button?.click();
    })()`)
    await waitFor(async () => (await page.evaluate(`document.querySelectorAll('.risk-row').length`)) > 0, 'the risk board never mounted')
    const riskBoard = await page.evaluate(`(() => ({
      levels: [...document.querySelectorAll('.risk-row')].map((row) => row.getAttribute('data-level')),
      names: [...document.querySelectorAll('.risk-name')].map((node) => node.textContent),
      counters: [...document.querySelectorAll('.stat-value')].map((node) => node.textContent),
    }))()`)
    const rankOrder = { high: 3, medium: 2, low: 1, unset: 0 }
    const sorted = riskBoard.levels.every((level, index) => index === 0 || (rankOrder[riskBoard.levels[index - 1]] ?? 0) >= (rankOrder[level] ?? 0))
    record('risk-board-sorted-by-severity', { ok: riskBoard.levels.length > 0 && sorted, detail: riskBoard.levels.join(' → ') })
    record('risk-board-shows-counters', { ok: riskBoard.counters.length === 4, detail: riskBoard.counters.join('/') })
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
    await waitFor(async () => (await page.evaluate(`document.querySelectorAll('.timeline-item').length`)) > 0, 'the timeline never mounted')
    const timelineView = await page.evaluate(`(() => ({
      dates: [...document.querySelectorAll('.timeline-date')].map((node) => node.textContent),
      items: document.querySelectorAll('.timeline-item').length,
      months: [...document.querySelectorAll('.month-label')].map((node) => node.textContent),
      silent: document.body.textContent.includes('完全没有时间线'),
      missingEvidence: [...document.querySelectorAll('.timeline-missing')].length,
    }))()`)
    record('timeline-renders-newest-first', {
      ok: timelineView.items >= 3 && timelineView.dates[0] >= timelineView.dates[timelineView.dates.length - 1],
      detail: `${timelineView.items} entries, first=${timelineView.dates[0]}`,
    })
    record('timeline-shows-month-strip', { ok: timelineView.months.length > 0, detail: timelineView.months.join(', ') })
    record('timeline-names-silent-projects', { ok: timelineView.silent === true })
    const timelineShot = await page.shot('work-dashboard-timeline.png')
    await clickNamed(page, '← 返回')
    await page.wait(700)
  }

  const consoleErrors = await page.evaluate(`(() => window.__pocConsoleErrors ?? [])()`)
  record('no-uncaught-console-errors', { ok: Array.isArray(consoleErrors) && consoleErrors.length === 0, detail: `${Array.isArray(consoleErrors) ? consoleErrors.length : 'n/a'} error(s)` })

  // 14. Dark theme: the frame must follow the shell's dark theme through tokens.
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

  process.stdout.write(`\nshots: ${emptyShot}, ${boardShot}, ${detailShot}, ${darkShot}\n`)
  process.stdout.write(`SUMMARY ${JSON.stringify({ total: results.length, failed: results.filter((item) => item.ok === false).length })}\n`)
} finally {
  await page.close()
}
