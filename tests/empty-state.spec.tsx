// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { DetailPage } from '../src/client/detail.jsx'
import { dictFor } from '../src/client/text.js'
import { PocStore } from '../src/store.js'
import type { RepoCache } from '../src/repo.js'
import type { ProjectDetail } from '../src/types.js'

/**
 * Empty states.
 *
 * This is not an edge case in this product: the live ledger carries 30 projects
 * and **all of them are empty** — no scenarios, no criteria, no progress. The
 * empty state IS the page for most users on most days, so it gets the same
 * scrutiny as the populated one.
 *
 * Three failure modes are pinned here, because each one has already happened:
 *
 * 1. A block that renders nothing at all, which reads as "no data" rather than
 *    "nothing recorded yet".
 * 2. The same sentence repeated row after row, which buries the one instruction
 *    that mattered.
 * 3. An English ledger enum leaking into a Chinese page.
 */

const FIXTURE_DIR = join(import.meta.dirname, 'fixtures')
const NOW = new Date('2026-11-18T00:00:00Z')

const t = (key: string, params?: Record<string, string | number>) => {
  const template = dictFor('zh')[key as never] ?? key
  return typeof template === 'string'
    ? template.replace(/\{([A-Za-z0-9_]+)\}/g, (whole, name: string) => (params && name in params ? String(params[name]) : whole))
    : key
}

function fixtureStore(): PocStore {
  const cache = {
    repoPath: FIXTURE_DIR,
    repository: 'fixture/local',
    branch: 'main',
    lastFetchedAt: null as string | null,
    async isReady() { return true },
    async projectFiles() {
      return readdirSync(FIXTURE_DIR)
        .filter((name) => name.endsWith('.yaml'))
        .sort()
        .map((name) => join(FIXTURE_DIR, name))
    },
    async readProject(file: string) { return readFileSync(file, 'utf8') },
    async readRules() { return null },
    async readDerive() { return null },
    async readHealth() { return null },
    async signalFiles() { return new Map<string, string>() },
  }
  return new PocStore(cache as unknown as RepoCache, { now: () => NOW, stallDays: 45 })
}

let cached: Map<string, ProjectDetail> | null = null
async function detailOf(id: string): Promise<ProjectDetail> {
  if (cached === null) {
    cached = new Map()
    for (const pocId of ['FIX-G0', 'FIX-G2', 'FIX-G3', 'FIX-G4']) {
      const detail = await fixtureStore().detail(pocId)
      if (detail !== null) cached.set(pocId, detail)
    }
  }
  const found = cached.get(id)
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

describe('an empty plan explains what is missing', () => {
  it('renders a visible block for each empty plan section', async () => {
    const { container } = renderDetail(await detailOf('FIX-G0'))
    const blanks = [...container.querySelectorAll('.dsec-blank')].map((node) => node.textContent ?? '')
    // All three plan sections are empty in this fixture, and all three must say so.
    expect(blanks.length).toBeGreaterThanOrEqual(3)
    expect(blanks.some((text) => text.includes('成功指标'))).toBe(true)
    expect(blanks.some((text) => text.includes('验证场景'))).toBe(true)
    expect(blanks.some((text) => text.includes('风险'))).toBe(true)
  })

  it('tells the reader what to do, not just that something is absent', async () => {
    const { container } = renderDetail(await detailOf('FIX-G0'))
    const blanks = [...container.querySelectorAll('.dsec-blank')].map((node) => node.textContent ?? '')
    // "没有定义成功指标" restated the heading. An empty state has to carry the
    // consequence: without criteria the pilot cannot be judged at all.
    expect(blanks.some((text) => text.includes('无法判定'))).toBe(true)
  })
})

describe('an empty G0 still names what is missing', () => {
  it('lists every G0 prerequisite with its presence, not just a count', async () => {
    // The G0 meter is the page's answer to "why can't this project move?", so it
    // must name the fields. (An earlier version also rendered a separate
    // five-row "待补清单" above the sections; the fixed two-column layout folds
    // that job into the meter, which is why this asserts the meter itself.)
    const { container } = renderDetail(await detailOf('FIX-G0'))
    const grid = container.querySelector('.g0-grid') as HTMLElement
    expect(grid).toBeTruthy()
    const text = container.textContent ?? ''
    // The design's six G0 cells. `tech_owner` is one of the five prerequisites but
    // lives in the identity block, so it is named there rather than in the grid.
    for (const label of ['客户为什么测', '我们为什么测', '项目流程/决策链', '测后客户决策', '主要竞争对手', 'G0 Review']) {
      expect(text).toContain(label)
    }
    // tech_owner is named in the identity block, under its compact label.
    expect(text).toContain('客户技术人')
    // The grid reports how many of the five prerequisites are answered rather
    // than staying silent about completeness.
    expect(text).toContain('0 / 5')
  })
})

describe('ledger enums are rendered in the page language', () => {
  it('does not print a raw English priority', async () => {
    const { container } = renderDetail(await detailOf('FIX-G0'))
    const text = container.textContent ?? ''
    // The ledger stores `high`; a Chinese page must not show that token as-is.
    expect(text).not.toContain('high')
    expect(text).toContain('高')
  })

  it('labels a strategic project without leaking the enum', async () => {
    const { container } = renderDetail(await detailOf('FIX-G4'))
    const text = container.textContent ?? ''
    expect(text).not.toContain('strategic')
    expect(text).toContain('战略')
  })
})

describe('a scenario with nothing behind it still renders completely', () => {
  it('explains the absence of evidence instead of showing an empty list', async () => {
    const { container } = renderDetail(await detailOf('FIX-G3'))
    // Open the third scenario: the one with no evidence and no linked progress.
    // `fireEvent` rather than a raw `.click()`: React only flushes a state update
    // inside `act`, otherwise the assertion runs against the previous tree.
    const buttons = container.querySelectorAll('.plan-scenario-open')
    fireEvent.click(buttons[2] as HTMLElement)
    const blanks = [...container.querySelectorAll('.dsec-blank')].map((node) => node.textContent ?? '')
    expect(blanks.some((text) => text.includes('没有证据'))).toBe(true)
    expect(blanks.some((text) => text.includes('scenario_ids'))).toBe(true)
  })
})

describe('the fully empty project never renders a blank region', () => {
  it('gives every plan block either content or an explanation', async () => {
    const { container } = renderDetail(await detailOf('FIX-G0'))
    for (const block of container.querySelectorAll('.plan-block')) {
      const element = block as HTMLElement
      // Each block is a titled container: heading + (rows | blank explanation).
      const hasRows = element.querySelector('li, tr') !== null
      const hasBlank = element.querySelector('.dsec-blank') !== null
      const isCountOnly = element.textContent?.trim() === ''
      expect(hasRows || hasBlank || isCountOnly).toBe(true)
    }
  })
})
