import { describe, expect, it } from 'vitest'
import { dictFor, format, en, zh } from '../src/client/text.js'

/**
 * Dictionary contract tests.
 *
 * The two dictionaries are hand-maintained and shipped together, so the failure
 * mode that actually hurts is drift: a key added to one locale and forgotten in
 * the other, or a placeholder that only one side interpolates. Both render as
 * broken copy in the GUI, and neither is caught by a type check, because the
 * keys are strings.
 */

describe('dictionary parity', () => {
  it('declares the same key set in both locales', () => {
    const zhKeys = Object.keys(zh).sort()
    const enKeys = Object.keys(en).sort()
    expect(enKeys.filter((key) => !zhKeys.includes(key))).toEqual([])
    expect(zhKeys.filter((key) => !enKeys.includes(key))).toEqual([])
  })

  it('interpolates the same placeholders in both locales', () => {
    const placeholders = (value: string): string[] => [...value.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((match) => match[1]!).sort()
    const mismatches: string[] = []
    for (const key of Object.keys(zh)) {
      const zhParts = placeholders(zh[key] ?? '')
      const enParts = placeholders(en[key] ?? '')
      if (zhParts.join(',') !== enParts.join(',')) mismatches.push(`${key}: zh={${zhParts.join(',')}} en={${enParts.join(',')}}`)
    }
    expect(mismatches).toEqual([])
  })

  it('has a title and copy pair for all twelve gap rules', () => {
    for (let rule = 1; rule <= 12; rule += 1) {
      const prefix = `gap.R${rule}-`
      const zhTitles = Object.keys(zh).filter((key) => key.startsWith(prefix) && key.endsWith('.title'))
      expect(zhTitles, `rule ${rule} has no title key`).toHaveLength(1)
      const titleKey = zhTitles[0]!
      expect(zh[titleKey.replace('.title', '.copy')], `rule ${rule} has no copy key`).toBeTypeOf('string')
    }
  })

  it('never leaves a key untranslated in either locale', () => {
    for (const [key, value] of Object.entries(zh)) expect(value.length, key).toBeGreaterThan(0)
    for (const [key, value] of Object.entries(en)) expect(value.length, key).toBeGreaterThan(0)
  })
})

describe('format', () => {
  it('fills named placeholders and leaves unknown ones visible', () => {
    expect(format('{a}-{b}', { a: 1, b: 'x' })).toBe('1-x')
    expect(format('{missing}', {})).toBe('{missing}')
  })

  it('picks the dictionary by locale prefix', () => {
    expect(dictFor('zh-CN')['nav']).toBe('工作看板')
    expect(dictFor('en-US')['nav']).toBe('Work Dashboard')
    // An unknown locale degrades to English rather than to empty copy.
    expect(dictFor('fr')['nav']).toBe('Work Dashboard')
  })
})
