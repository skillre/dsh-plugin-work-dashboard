// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { DetailPage } from '../src/client/detail.jsx'
import { dictFor } from '../src/client/text.js'
import { PocStore } from '../src/store.js'
import type { RepoCache } from '../src/repo.js'
import type { ProjectDetail, Snapshot } from '../src/types.js'

/**
 * The two-layer detail page, exercised against the four stage fixtures.
 *
 * Layer one is the overview: which scenario is unproven, which criterion is
 * unmet. Layer two is the drill-down: the evidence, the customer's words and the
 * G3 verdict behind one scenario. These tests pin the boundary between them,
 * because the design's whole claim is that the first screen stays readable and
 * the proof lives one level down.
 */

const FIXTURE_DIR = join(import.meta.dirname, 'fixtures')
const NOW = new Date('2026-11-18T00:00:00Z')

function fixtureStore(): PocStore {
  const ledgerConfig = (name: string): string | null => {
    try {
      const root = join(process.env.HOME ?? '', '.dsh', 'cache', 'work-dashboard', 'repo', 'config')
      return readFileSync(join(root, name), 'utf8')
    } catch {
      return null
    }
  }
  const cache = {
    repoPath: FIXTURE_DIR,
    repository: 'fixture/local',
    branch: 'main',
    lastFetchedAt: null as string | null,
    async isReady() { return true },
    async projectFiles() {
      const { readdirSync } = await import('node:fs')
      return readdirSync(FIXTURE_DIR)
        .filter((name) => name.endsWith('.yaml'))
        .sort()
        .map((name) => join(FIXTURE_DIR, name))
    },
    async readProject(file: string) { return readFileSync(file, 'utf8') },
    async readRules() { return ledgerConfig('rules.yaml') },
    async readDerive() { return ledgerConfig('derive.yaml') },
    async readHealth() { return ledgerConfig('health.yaml') },
    async signalFiles() { return new Map<string, string>() },
  }
  return new PocStore(cache as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
}

const t = (key: string, params?: Record<string, string | number>) => {
  const template = dictFor('zh')[key as never] ?? key
  return typeof template === 'string'
    ? template.replace(/\{([A-Za-z0-9_]+)\}/g, (whole, name: string) => (params && name in params ? String(params[name]) : whole))
    : key
}

let detailCache: Map<string, ProjectDetail> | null = null
async function detailOf(id: string): Promise<ProjectDetail> {
  if (detailCache === null) {
    const snap: Snapshot = await fixtureStore().snapshot()
    void snap
    detailCache = new Map()
    for (const pocId of ['FIX-G0', 'FIX-G2', 'FIX-G3', 'FIX-G4']) {
      const detail = await fixtureStore().detail(pocId)
      if (detail !== null) detailCache.set(pocId, detail)
    }
  }
  const found = detailCache.get(id)
  if (found === undefined) throw new Error(`fixture ${id} did not parse`)
  return found
}

function renderDetail(detail: ProjectDetail) {
  return render(
    <DetailPage
      detail={detail}
      gaps={detail.gaps}
      blockers={[]}
      locale="zh"
      t={t}
      position={{ index: 0, total: 1 }}
      onPrev={null}
      onNext={null}
      onBack={() => {}}
      onOpen={() => {}}
    />,
  )
}

afterEach(cleanup)

describe('layer one — the scenario list carries the finding', () => {
  it('shows the derived status of every scenario', async () => {
    const { container } = renderDetail(await detailOf('FIX-G3'))
    const rows = container.querySelectorAll('.plan-scenario')
    expect(rows).toHaveLength(3)
    // The row colour is the finding, so each row must carry its own tone.
    expect([...rows].map((row) => row.getAttribute('data-tone'))).toEqual(['green', 'amber', 'red'])
    // The name now appears twice: once in the scenario list and once in the
    // timeline, where a progress entry's `scn-NN` id is resolved back to words.
    expect(container.querySelectorAll('.plan-scenario-name')[0]?.textContent).toBe('办公网远程接入')
    expect(container.querySelectorAll('.plan-scenario-name')[2]?.textContent).toBe('日志检索与留存')
  })

  it('renders the evidence count only when there is evidence', async () => {
    const { container } = renderDetail(await detailOf('FIX-G3'))
    const rows = [...container.querySelectorAll('.plan-scenario')]
    expect(rows[0]?.querySelector('.plan-scenario-evidence')?.textContent).toBe('3 项证据')
    // A zero count is not shown: "0 evidence" on every unstarted row is noise.
    expect(rows[2]?.querySelector('.plan-scenario-evidence')).toBeNull()
  })

  it('gives every scenario with an id an entry point to layer two', async () => {
    const { container } = renderDetail(await detailOf('FIX-G3'))
    const buttons = container.querySelectorAll('.plan-scenario-open')
    expect(buttons).toHaveLength(3)
  })

  it('does not invent scenarios for an empty plan', async () => {
    const { container } = renderDetail(await detailOf('FIX-G0'))
    expect(container.querySelectorAll('.plan-scenario')).toHaveLength(0)
  })
})

describe('layer one — the criterion table carries its own status', () => {
  it('marks a met criterion differently from an unverified one', async () => {
    const { container } = renderDetail(await detailOf('FIX-G3'))
    const rows = [...container.querySelectorAll('.plan-criteria tbody tr')]
    expect(rows).toHaveLength(3)
    const tones = rows.map((row) => row.querySelector('.status-pill')?.className ?? '')
    expect(tones[0]).toContain('tone-green')
    // Unverified must read as grey, not as a pass.
    expect(tones[1]).toContain('tone-slate')
    expect(tones[2]).toContain('tone-amber')
  })

  it('treats a missing status as unverified rather than as blank', async () => {
    const { container } = renderDetail(await detailOf('FIX-G2'))
    const pills = [...container.querySelectorAll('.plan-criterion-status .status-pill')]
    expect(pills.every((pill) => pill.className.includes('tone-slate'))).toBe(true)
    expect(pills.every((pill) => pill.textContent?.includes('未验证'))).toBe(true)
  })
})

describe('layer two — the drill-down', () => {
  it('opens a scenario without leaving the project banner behind', async () => {
    const detail = await detailOf('FIX-G3')
    const { container } = renderDetail(detail)
    const openButtons = container.querySelectorAll('.plan-scenario-open')
    fireEvent.click(openButtons[0] as HTMLElement)

    // The banner is the context the evidence is read in, so it must survive.
    expect(container.querySelector('.dt-header')).toBeTruthy()
    expect(screen.getByText('场景详情')).toBeTruthy()
    // The plan list is replaced, not appended to: this is a drill-down.
    expect(container.querySelectorAll('.plan-scenario')).toHaveLength(0)
  })

  it('lists the evidence that cites the scenario by id', async () => {
    const { container } = renderDetail(await detailOf('FIX-G3'))
    fireEvent.click(container.querySelectorAll('.plan-scenario-open')[0] as HTMLElement)
    const rows = [...container.querySelectorAll('.sd-evidence-row')]
    expect(rows).toHaveLength(3)
    expect(rows[0]?.textContent).toContain('压测报告')
    expect(rows[0]?.querySelector('a')?.getAttribute('href')).toBe('https://example.com/report-1')
  })

  it('shows the customer’s words and recognition for the scenario', async () => {
    const { container } = renderDetail(await detailOf('FIX-G3'))
    fireEvent.click(container.querySelectorAll('.plan-scenario-open')[1] as HTMLElement)
    const panel = container.querySelector('.sd-customer')
    expect(panel?.textContent).toContain('王工')
    expect(panel?.textContent).toContain('还需再调优')
    expect(panel?.textContent).toContain('部分认可')
  })

  it('names rule 10 when a scenario is provable but unconfirmed', async () => {
    const { container } = renderDetail(await detailOf('FIX-G3'))
    fireEvent.click(container.querySelectorAll('.plan-scenario-open')[1] as HTMLElement)
    // Provable + unconfirmed is exactly R10; the page should say so rather than
    // leaving the reader to notice a pill is amber.
    expect(container.querySelector('.sd-gate3-note')?.textContent).toBe('R10')
  })

  it('returns to the overview', async () => {
    const { container } = renderDetail(await detailOf('FIX-G3'))
    fireEvent.click(container.querySelectorAll('.plan-scenario-open')[0] as HTMLElement)
    expect(container.querySelector('.dt-header')).toBeTruthy()
    fireEvent.click(container.querySelector('.sd-back') as HTMLElement)
    expect(container.querySelectorAll('.plan-scenario')).toHaveLength(3)
  })

  it('says a scenario has no evidence instead of rendering an empty list', async () => {
    const { container } = renderDetail(await detailOf('FIX-G3'))
    // The third scenario is the unproven one.
    fireEvent.click(container.querySelectorAll('.plan-scenario-open')[2] as HTMLElement)
    expect(container.querySelectorAll('.sd-evidence-row')).toHaveLength(0)
    expect(within(container as HTMLElement).getByText(/这个场景还没有任何证据/)).toBeTruthy()
  })
})

describe('the proven case stays quiet', () => {
  it('shows three proven scenarios with no entry in the red tone', async () => {
    const { container } = renderDetail(await detailOf('FIX-G4'))
    const rows = [...container.querySelectorAll('.plan-scenario')]
    expect(rows).toHaveLength(3)
    expect(rows.every((row) => row.getAttribute('data-tone') === 'green')).toBe(true)
  })
})
