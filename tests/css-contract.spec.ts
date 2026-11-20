// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CONSOLE_CSS } from '../src/client/styles.js'

/**
 * Stylesheet contracts.
 *
 * Three classes of bug have now shipped from this stylesheet more than once, and
 * none of them is catchable from a component test:
 *
 *   1. a CSS rule silently truncating content it must show in full;
 *   2. the same rule defined twice, so editing "the" rule changes nothing;
 *   3. a backtick inside a CSS comment, which terminates the template literal and
 *      turns the rest of the sheet into TypeScript syntax errors.
 *
 * Each one is cheap to assert and expensive to find by hand, so they are asserted
 * here rather than left to the browser check (which needs a real mount and only
 * looks at whatever page it happens to open).
 */

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const cssDir = join(repo, 'src', 'client', 'css')

/**
 * Every rule in one sheet, keyed by selector.
 *
 * Comments are stripped first: a `/* … *\/` block immediately above a rule would
 * otherwise be captured as part of its selector, which made a selector allowlist
 * impossible to keep exact. Rules are tagged with their enclosing at-rule so a
 * media query override of a base rule is not mistaken for a duplicate — that is
 * the whole point of a media query, and five such pairs exist on purpose.
 */
function rulesOf(css: string, options: { topLevelOnly?: boolean } = {}): Map<string, string[]> {
  const found = new Map<string, string[]>()
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '')
  let atRule = ''
  let depth = 0
  let selector = ''
  for (let index = 0; index < bare.length; index += 1) {
    const char = bare[index]!
    if (char === '{') {
      depth += 1
      const captured = selector.trim()
      selector = ''
      if (captured.startsWith('@')) {
        atRule = captured
        continue
      }
      if (captured === '') continue
      if (options.topLevelOnly === true && atRule !== '') continue
      const key = captured
      const list = found.get(key) ?? []
      list.push(atRule)
      found.set(key, list)
      continue
    }
    if (char === '}') {
      depth -= 1
      if (depth === 0) atRule = ''
      selector = ''
      continue
    }
    if (char === ';') { selector = ''; continue }
    if (depth === 0 || (atRule !== '' && depth === 1)) selector += char
  }
  return found
}

/** The declarations of one selector's rule, or an empty string when it has none. */
function ruleBody(css: string, selector: string): string {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(bare)
  return match?.[1] ?? ''
}

/** How many times each selector is defined inside the *same* at-rule scope. */
function duplicateSelectors(css: string): string[] {
  const scopes = new Map<string, number>()
  for (const [selector, atRules] of rulesOf(css)) {
    for (const at of atRules) {
      const key = at === '' ? selector : `${selector} in ${at}`
      scopes.set(key, (scopes.get(key) ?? 0) + 1)
    }
  }
  return [...scopes.entries()].filter(([, count]) => count > 1).map(([key]) => key)
}

/** The sources as authored, so a template-literal bug is visible here. */
async function sheets(): Promise<Array<{ file: string; source: string }>> {
  const names = (await readdir(cssDir)).filter((name) => name.endsWith('.ts')).sort()
  return Promise.all(
    names.map(async (name) => ({ file: name, source: await readFile(join(cssDir, name), 'utf8') })),
  )
}

describe('CSS sources stay inside their template literal', () => {
  /**
   * A backtick in a CSS comment ends the string early.
   *
   * `export const X_CSS = \`…\`` is a template literal, so a stray backtick in a
   * comment closes it and every following CSS rule is parsed as TypeScript. The
   * error it surfaces ("Expected ';' but found 'align'") points at the rule after
   * the comment, not the comment, which is why this was misdiagnosed twice.
   */
  it('has no backtick inside any CSS comment', async () => {
    const offenders: string[] = []
    for (const { file, source } of await sheets()) {
      const lines = source.split('\n')
      const open = lines.findIndex((line: string) => line.includes('= `'))
      const close = lines.length - 1 - [...lines].reverse().findIndex((line) => line.trim() === '`')
      if (open === -1 || close === -1) continue
      for (let index = open + 1; index < close; index += 1) {
        if ((lines[index] ?? '').includes('`')) offenders.push(`${file}:${index + 1}: ${lines[index]!.trim()}`)
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('no rule is defined twice', () => {
  /**
   * A duplicated selector silently wins: the later copy is what renders, so an
   * edit to the earlier one has no effect on screen while looking correct in the
   * source. This is exactly how the G0 `line-clamp` survived an earlier fix.
   */
  it('defines each selector exactly once per scope', async () => {
    const duplicates: string[] = []
    for (const { file, source } of await sheets()) {
      for (const duplicate of duplicateSelectors(source)) duplicates.push(`${file}: ${duplicate}`)
    }
    expect(duplicates).toEqual([])
  })
})

describe('the Gate 0 argument fields render in full', () => {
  /**
   * `why_customer` and `why_us` are the densest content the ledger stores and the
   * only two fields marked `data-prose`. Measured against the real ledger, a
   * three-line clamp hid 62% of their non-empty values (up to 7 of a field's 10
   * lines), with no ellipsis and no expand control.
   */
  const body = ruleBody(CONSOLE_CSS, '.wd-shell .g0-card-body')

  it('does not clamp the body', () => {
    expect(body).not.toMatch(/line-clamp/)
    expect(body).not.toMatch(/text-overflow/)
  })

  it('keeps the line breaks the ledger stores', () => {
    // 71% of non-empty G0 answers use breaks as structure (heading / numbered
    // points / blank line / next heading). `white-space: normal` collapses them.
    expect(body).toMatch(/white-space:\s*pre-wrap/)
  })

  it('does not clamp the prose variant either', () => {
    const prose = ruleBody(CONSOLE_CSS, '.wd-shell .g0-card[data-prose="true"] .g0-card-body')
    expect(prose).not.toMatch(/line-clamp/)
  })
})

describe('text truncation is limited to labels', () => {
  /**
   * An allowlist, not a denylist: every clamp in the shipped sheet is a deliberate
   * one-line label or a measured-safe multi-line summary. Adding truncation
   * anywhere else has to be justified by editing this list, which is the review
   * step that was missing when the G0 argument got clamped.
   */
  const ALLOWED = new Set([
    // chart labels and legends: references, not content
    '.wd-shell .segbar-label',
    '.wd-shell .donut-legend-label',
    '.wd-shell .barlist-label',
    '.wd-shell .barlist-note',
    // KPI captions
    '.wd-shell .kpi-label',
    '.wd-shell .kpi-note',
    '.wd-shell .kpi-stages-summary',
    '.wd-shell .budget-org-name',
    '.wd-shell .stage-progress-label',
    // project identity: 30/30 names fit in two lines at card width
    '.wd-shell .pcard-name',
    '.wd-shell .pcard-org',
    '.wd-shell .pcard-dim-label',
    '.wd-shell .pboard-card-name',
    '.wd-shell .project-id',
    // list-page progress digests: three lines, `title` carries the rest
    '.wd-shell .pcard-progress-copy',
    '.wd-shell .pboard-card-progress',
    '.wd-shell .progress-summary',
  ])

  it('clamps nothing outside the allowlist', () => {
    const unexpected: string[] = []
    for (const [selector, bodies] of rulesOf(CONSOLE_CSS)) {
      const truncates = bodies.some((body) => /line-clamp|text-overflow/.test(body))
      if (truncates && !ALLOWED.has(selector)) unexpected.push(selector)
    }
    expect(unexpected).toEqual([])
  })

  it('no longer ships the dead rail / meter rules', () => {
    // Ten rules styled components that were never mounted; the components are
    // gone, so a rule referencing them would be unreachable by construction.
    const selectors = [...rulesOf(CONSOLE_CSS).keys()]
    for (const dead of ['dt-rail-title', 'dim-card-value', 'g0-cell', 'g0-field-value', 'out-milestone-text']) {
      expect(selectors.some((selector) => selector.includes(dead))).toBe(false)
    }
  })
})
