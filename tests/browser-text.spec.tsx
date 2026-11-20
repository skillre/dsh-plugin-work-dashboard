// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DetailPage } from '../src/client/detail.jsx'
import { CONSOLE_CSS } from '../src/client/styles.js'
import { dictFor, textOf } from '../src/client/text.js'
import { RepoCache } from '../src/repo.js'
import { PocStore } from '../src/store.js'

/**
 * Browser check: no Gate 0 answer is truncated.
 *
 * The CSS-string assertions in `css-contract.spec.ts` prove the *rule* is correct.
 * They cannot prove the rule wins the cascade, and this stylesheet has already
 * shipped a rule that lost it — the same `line-clamp` was defined twice, and the
 * later copy silently overrode the earlier one, surviving a fix that looked right
 * in the source.
 *
 * So this check renders the real components against a real ledger, loads the
 * result in headless Chrome at a real viewport width, and compares every argument
 * card's `scrollHeight` to its `clientHeight`. Any difference means content is
 * being hidden.
 *
 * It is skipped, not failed, when Chrome or a ledger is unavailable: those are
 * environment facts, not regressions, and the CI runner has neither.
 */

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const LEDGER = process.env.WORK_DASHBOARD_LEDGER ?? ''
const workDir = join(repo, 'node_modules', '.cache', 'wd-browser-check')

/** Every argument card's clipping state, measured in the page. */
const MEASURE = `(() => {
  const rows = []
  for (const card of document.querySelectorAll('.g0-card[data-prose="true"]')) {
    const body = card.querySelector('.g0-card-body')
    if (!body) continue
    const style = getComputedStyle(body)
    const lineHeight = parseFloat(style.lineHeight)
    rows.push({
      label: (card.querySelector('.g0-card-label')?.textContent ?? '').trim(),
      whiteSpace: style.whiteSpace,
      lineClamp: style.webkitLineClamp,
      visibleLines: Math.round(body.clientHeight / lineHeight),
      fullLines: Math.round(body.scrollHeight / lineHeight),
      hiddenPixels: body.scrollHeight - body.clientHeight,
      breaks: (body.textContent.match(/\\n/g) ?? []).length,
    })
  }
  return JSON.stringify(rows)
})()`

describe('Gate 0 arguments render in full', () => {
  let chrome = null

  afterAll(async () => {
    if (chrome !== null) {
      chrome.kill('SIGKILL')
      await delay(200)
    }
    await rm(workDir, { recursive: true, force: true })
  })

  it('hides no line of any argument card', async () => {
    if (LEDGER === '') {
      console.warn('browser check skipped: set WORK_DASHBOARD_LEDGER to a git-backed ledger checkout')
      return
    }
    const { access } = await import('node:fs/promises')
    try {
      await access(CHROME)
    } catch {
      console.warn(`browser check skipped: no Chrome at ${CHROME} (set CHROME_BIN)`)
      return
    }

    // 1. Build the page from the real store and the real components.
    const cache = new RepoCache({
      cacheRoot: join(LEDGER, '..'),
      repository: 'skillre/workbranch',
      branch: 'main',
      remoteUrl: '',
      cloneTimeoutMs: 1,
      fetchTimeoutMs: 1,
    } as never)
    const store = new PocStore(cache, { now: () => new Date('2026-11-20T00:00:00Z'), stallDays: 45 })
    const snapshot = await store.snapshot()
    expect(snapshot.cacheReady).toBe(true)

    const t = (key: string): string => textOf(dictFor('zh'), key)
    const total = snapshot.projects.length
    const rendered: Array<{ pocId: string; html: string }> = []
    for (const project of snapshot.projects) {
      const detail = await store.detail(project.pocId)
      if (detail.gate0.whyCustomer === '' && detail.gate0.whyUs === '') continue
      const index = snapshot.projects.findIndex((row) => row.pocId === project.pocId)
      rendered.push({
        pocId: project.pocId,
        html: renderToStaticMarkup(
          React.createElement(DetailPage, {
            detail,
            gaps: snapshot.gaps.filter((gap) => gap.pocId === project.pocId),
            t,
            locale: 'zh',
            position: { index: index + 1, total },
            onPrev: null,
            onNext: null,
            onBack: () => {},
          } as never),
        ),
      })
    }
    expect(rendered.length).toBeGreaterThan(0)

    await mkdir(workDir, { recursive: true })
    const pagePath = join(workDir, 'page.html')
    await writeFile(
      pagePath,
      `<!doctype html><html lang="zh"><head><meta charset="utf-8"><style>${CONSOLE_CSS}
body { margin: 0; background: var(--wd-bg); }
.probe { border-bottom: 2px solid #999; }
</style></head><body><div class="wd-shell">${rendered
        .map((row) => `<section class="probe" data-poc="${row.pocId}">${row.html}</section>`)
        .join('')}</div></body></html>`,
    )

    // 2. Serve it over loopback: a file:// page has an opaque origin and the
    //    DevTools endpoint refuses to evaluate in it on some Chrome builds.
    const server = createServer((request, response) => {
      if (request.url !== '/') {
        response.writeHead(404).end()
        return
      }
      // Read lazily so the file written above is the one served.
      import('node:fs/promises').then(async ({ readFile }) => {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
        response.end(await readFile(pagePath))
      })
    })
    await new Promise((ready) => server.listen(0, '127.0.0.1', ready))
    const port = (server.address() as { port: number }).port

    // 3. Drive Chrome over CDP at 1440px — the width the layout is designed for.
    const debugPort = 9400 + Math.floor(Math.random() * 200)
    chrome = spawn(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--hide-scrollbars',
        `--remote-debugging-port=${debugPort}`,
        '--remote-allow-origins=*',
        '--window-size=1440,2000',
        `http://127.0.0.1:${port}/`,
      ],
      { stdio: 'ignore' },
    )

    let targets = null
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await delay(250)
      try {
        const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`)
        const list = (await response.json()) as Array<{ type: string; webSocketDebuggerUrl?: string }>
        const page = list.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl)
        if (page !== undefined) {
          targets = page
          break
        }
      } catch {
        // Chrome is still starting.
      }
    }
    expect(targets).not.toBeNull()

    const socket = new WebSocket(targets!.webSocketDebuggerUrl!)
    await new Promise((ready, reject) => {
      socket.addEventListener('open', ready)
      socket.addEventListener('error', reject)
    })
    const rows = await new Promise<Array<Record<string, unknown>>>((ready, reject) => {
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(String(event.data))
        if (message.id !== 1) return
        if (message.error) reject(new Error(String(message.error.message)))
        else ready(JSON.parse(message.result.result.value))
      })
      socket.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: { expression: MEASURE, returnByValue: true },
        }),
      )
    })
    socket.close()
    server.close()

    // 4. Assert.
    expect(rows.length).toBeGreaterThan(0)
    const clipped = rows.filter((row) => (row.hiddenPixels as number) > 1)
    expect(clipped).toEqual([])
    // The break-preserving rule has to reach the element, not just the sheet.
    expect([...new Set(rows.map((row) => row.whiteSpace))]).toEqual(['pre-wrap'])
    expect([...new Set(rows.map((row) => row.lineClamp))]).toEqual(['none'])
    // And the assertions are only meaningful if some field actually spans lines.
    expect(rows.some((row) => (row.fullLines as number) > 4)).toBe(true)
  }, 120_000)
})
