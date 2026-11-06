import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { afterAll, describe, expect, it } from 'vitest'

import {
  BUNDLED_SKILL_NAMES,
  bundledSkillsDirectory,
  parseSkillMarkdown,
  registerBundledSkills,
} from '../src/skill.js'
import type { ParsedSkill, SkillRegistrationLike } from '../src/skill.js'

/**
 * Bundled-skill coverage.
 *
 * Everything runs against a fake Context and a fake registry: no real Cordis
 * fiber and no profile. The spec pins the payload handed to the registry, the
 * Fiber binding of the disposer it returns, and every soft-landing path — a
 * missing service, a missing file and unusable frontmatter must each warn and
 * leave the plugin mounted.
 *
 * It also pins the CONTENT: the three skills are the product's documentation
 * for the model, and they went stale once already (they described the v1 ledger
 * after the data moved to v3). A test that only checked the frontmatter would
 * have passed while the model read field names that no longer exist.
 */

const temporaryDirs: string[] = []
afterAll(() => {
  for (const dir of temporaryDirs) rmSync(dir, { recursive: true, force: true })
})

/** Parse a `SKILL.md` or fail with the parser's own reason. */
function requireParsed(source: string): ParsedSkill {
  const parsed = parseSkillMarkdown(source)
  if (!parsed.ok) throw new Error(`expected the SKILL.md to parse, but it was rejected: ${parsed.reason}`)
  return parsed.skill
}

/** Read one bundled skill's markdown, failing loudly when it is missing. */
function readBundled(name: string): string {
  const file = join(bundledSkillsDirectory(), name, 'SKILL.md')
  expect(existsSync(file), `内置 skill 文件不存在：${file}`).toBe(true)
  return readFileSync(file, 'utf8')
}

/** Registry double: records every payload and counts disposal calls. */
function registryDouble(): {
  readonly registry: { register(skill: SkillRegistrationLike): () => void }
  readonly registered: SkillRegistrationLike[]
  readonly disposeCount: () => number
} {
  const registered: SkillRegistrationLike[] = []
  let disposed = 0
  return {
    registered,
    disposeCount: () => disposed,
    registry: {
      register: (skill: SkillRegistrationLike) => {
        registered.push(skill)
        return () => { disposed += 1 }
      },
    },
  }
}

/** Context double: `inject` runs the callback immediately with a scoped view. */
function contextDouble(options: {
  skills?: { register(skill: SkillRegistrationLike): () => void } | null | undefined
  logger?: { info(message: string): void; warn(message: string): void }
}): { ctx: Context; warnings: string[]; effects: string[]; disposers: Array<() => void> } {
  const warnings: string[] = []
  const effects: string[] = []
  const disposers: Array<() => void> = []
  const logger = options.logger ?? {
    info: () => {},
    warn: (message: string) => { warnings.push(message) },
  }
  const ctx = {
    logger,
    get: (key: string) => (key === 'skills' ? options.skills ?? undefined : undefined),
    inject: (names: string[], callback: (scoped: unknown) => void) => {
      // The real `inject` waits for the service; the double runs it now so the
      // registration path is exercised without a live fiber.
      if (options.skills === null) return
      callback({
        get: (key: string) => (key === 'skills' ? options.skills ?? undefined : undefined),
        effect: (callback: () => (() => void) | void, label?: string) => {
          if (label !== undefined) effects.push(label)
          const disposer = callback()
          if (typeof disposer === 'function') disposers.push(disposer)
          return () => {}
        },
      })
    },
    effect: (callback: () => (() => void) | void, label?: string) => {
      if (label !== undefined) effects.push(label)
      const disposer = callback()
      if (typeof disposer === 'function') disposers.push(disposer)
      return () => {}
    },
  } as unknown as Context
  return { ctx, warnings, effects, disposers }
}

describe('parseSkillMarkdown', () => {
  it('reads the frontmatter and returns the body without it', () => {
    const skill = requireParsed(`---
name: demo-skill
description: 一个演示用的 skill
---

# 正文

内容在这里。
`)
    expect(skill.name).toBe('demo-skill')
    expect(skill.description).toBe('一个演示用的 skill')
    expect(skill.content.startsWith('# 正文')).toBe(true)
    expect(skill.content.includes('name: demo-skill')).toBe(false)
  })

  it('carries an optional whenToUse hint and omits an empty one', () => {
    const withHint = requireParsed(`---
name: demo-skill
description: 说明
whenToUse: 当用户问演示时
---

正文
`)
    expect(withHint.whenToUse).toBe('当用户问演示时')

    const withoutHint = requireParsed(`---
name: demo-skill
description: 说明
---

正文
`)
    expect(withoutHint.whenToUse).toBeUndefined()
  })

  it('strips one matching pair of quotes and leaves escapes alone', () => {
    const skill = requireParsed(`---
name: demo-skill
description: "带引号的说明: 含冒号"
---

正文
`)
    expect(skill.description).toBe('带引号的说明: 含冒号')
  })

  it('rejects a missing fence, a bad name, an empty description and an empty body', () => {
    const cases: Array<[string, string]> = [
      ['# no frontmatter\n', '起始分隔行'],
      ['---\nname: Not_Kebab\ndescription: x\n---\nbody\n', 'kebab-case'],
      ['---\nname: ok\ndescription: \n---\nbody\n', 'description'],
      ['---\nname: ok\ndescription: x\n---\n', '正文为空'],
      ['---\nname: ok\ndescription: x\n', '结束分隔行'],
    ]
    for (const [source, expected] of cases) {
      const parsed = parseSkillMarkdown(source)
      expect(parsed.ok, `expected rejection for ${JSON.stringify(source.slice(0, 20))}`).toBe(false)
      if (!parsed.ok) expect(parsed.reason).toContain(expected)
    }
  })
})

describe('the three bundled skills', () => {
  it('ships exactly the three POC skills', () => {
    expect([...BUNDLED_SKILL_NAMES]).toEqual(['poc-ledger', 'poc-export', 'poc-submit'])
    for (const name of BUNDLED_SKILL_NAMES) {
      expect(existsSync(join(bundledSkillsDirectory(), name, 'SKILL.md')), `${name}/SKILL.md`).toBe(true)
    }
  })

  it('parses each with a matching directory name and a non-empty body', () => {
    for (const name of BUNDLED_SKILL_NAMES) {
      const skill = requireParsed(readBundled(name))
      expect(skill.name).toBe(name)
      expect(skill.description.length).toBeGreaterThan(20)
      expect(skill.content.length).toBeGreaterThan(500)
    }
  })

  /**
   * The regression that matters: these skills described the v1 ledger for a
   * whole release after the data moved to v3. Frontmatter checks would not have
   * caught it; a field-name check does.
   */
  it('describes the v3 model, not the removed v1 fields', () => {
    const ledger = readBundled('poc-ledger')
    // The v1 names may appear ONLY in the "these are gone" warning — a reader
    // who lands here with an old field name must be told it is dead, not be
    // silently left with a field list that no longer exists.
    const warningLine = ledger.split('\n').find((line) => line.includes('已不存在')) ?? ''
    expect(warningLine).toContain('why_customer_test')
    const bodyWithoutWarning = ledger.replace(warningLine, '')
    for (const v1 of ['why_customer_test', 'why_we_test', 'sales_initiator', 'customer_tech_owner', 'success_criteria', 'success_scenarios', 'next_action_goal']) {
      expect(bodyWithoutWarning.includes(v1), `poc-ledger must not present the removed v1 field ${v1} as schema`).toBe(false)
    }
    // A v1 top-level `result:` block would be a schema mistake. `plan.timeline`
    // is legitimate v3 (a start/end window), so only the bare top-level form
    // is checked here.
    expect(bodyWithoutWarning.includes('result:')).toBe(false)
    expect(bodyWithoutWarning.includes('timeline:\n  - ')).toBe(false)
    for (const v3 of ['gate0', 'plan', 'progress', 'outcome', 'achievement', 'customer_recognition', 'business.milestone', 'stage_since']) {
      expect(ledger.includes(v3), `poc-ledger must describe the v3 field ${v3}`).toBe(true)
    }
  })

  it('documents all twelve gap rules, not the old eight', () => {
    const ledger = readBundled('poc-ledger')
    for (let rule = 1; rule <= 12; rule += 1) {
      expect(ledger.includes(`| ${rule} |`), `poc-ledger must list gap rule ${rule}`).toBe(true)
    }
    // The three implementation notes that keep the rules from over-firing.
    expect(ledger).toContain('R4–R6 对空列表不触发')
    expect(ledger).toContain('R8–R10 只看最新一条进展')
    expect(ledger).toContain('R12 没有 `stage_since` 就不报')
  })

  it('points the export skill at the bundled script, not the stale external one', () => {
    const exported = readBundled('poc-export')
    expect(exported).toContain('export-form.mjs')
    expect(existsSync(join(bundledSkillsDirectory(), 'poc-export', 'scripts', 'export-form.mjs'))).toBe(true)
    // The stale v1 generator may be named ONLY in "do not use this" warnings —
    // both at the top (which script to run) and in the caveats at the bottom.
    const staleLines = exported.split('\n').filter((line) => line.includes('poc_form.py'))
    expect(staleLines.length).toBeGreaterThan(0)
    for (const line of staleLines) {
      expect(line, `a mention of the stale script must warn: ${line}`).toMatch(/v1 生成器|不要用/)
    }
    const withoutWarnings = exported.split('\n').filter((line) => !line.includes('poc_form.py')).join('\n')
    expect(withoutWarnings.includes('poc_form.py')).toBe(false)
  })

  it('tells the submit skill to append progress and keep untouched fields', () => {
    const submit = readBundled('poc-submit')
    expect(submit).toContain('progress')
    expect(submit).toContain('追加')
    expect(submit).toContain('保留未涉及字段')
    expect(submit).toContain('Draft PR')
    // The v1 merge instruction must be gone: it copied a whole `result` block.
    expect(submit).not.toContain('result.achievement')
  })
})

describe('registerBundledSkills', () => {
  it('registers all three skills with a bundled source and a directory resource base', () => {
    const double = registryDouble()
    const { ctx, effects } = contextDouble({ skills: double.registry })
    registerBundledSkills(ctx)

    expect(double.registered.map((skill) => skill.name)).toEqual([...BUNDLED_SKILL_NAMES])
    for (const skill of double.registered) {
      expect(skill.source).toBe('bundled')
      expect(skill.path).toBeDefined()
      expect(skill.resourceBase?.kind).toBe('directory')
      // The resource base must be the skill's own directory, so a relative
      // `scripts/...` reference in the body resolves next to SKILL.md.
      expect(skill.resourceBase?.path).toBe(join(bundledSkillsDirectory(), skill.name))
      // The frontmatter block must not survive into the body; YAML samples
      // inside the body legitimately contain `name:` keys, so check the fence.
      expect(skill.content.startsWith('---')).toBe(false)
    }
    expect(effects.filter((label) => label.includes('bundled skill'))).toHaveLength(3)
  })

  it('binds each registration to the injection fiber so unloading disposes it', () => {
    const double = registryDouble()
    const { ctx, disposers } = contextDouble({ skills: double.registry })
    registerBundledSkills(ctx)
    expect(double.disposeCount()).toBe(0)
    for (const dispose of disposers) dispose()
    expect(double.disposeCount()).toBe(3)
  })

  it('warns and mounts anyway when the profile has no skill registry', () => {
    const double = registryDouble()
    const { ctx, warnings } = contextDouble({ skills: undefined })
    expect(() => registerBundledSkills(ctx)).not.toThrow()
    expect(double.registered).toHaveLength(0)
    expect(warnings.join('\n')).toContain('skills 服务不可用于注册')
  })

  it('warns and mounts anyway when the registry is not a registry', () => {
    const { ctx, warnings } = contextDouble({ skills: { register: undefined as unknown as (skill: SkillRegistrationLike) => () => void } })
    expect(() => registerBundledSkills(ctx)).not.toThrow()
    expect(warnings.join('\n')).toContain('skills 服务不可用于注册')
  })

  it('skips a missing skill directory with a warning instead of throwing', () => {
    const empty = mkdtempSync(join(tmpdir(), 'wd-skills-'))
    temporaryDirs.push(empty)
    const double = registryDouble()
    const { ctx, warnings } = contextDouble({ skills: double.registry })
    registerBundledSkills(ctx, { dir: empty })
    expect(double.registered).toHaveLength(0)
    expect(warnings.join('\n')).toContain('内置 skill 文件不存在')
  })

  it('skips unusable frontmatter and keeps registering the rest', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wd-skills-'))
    temporaryDirs.push(dir)
    mkdirSync(join(dir, 'poc-ledger'), { recursive: true })
    writeFileSync(join(dir, 'poc-ledger', 'SKILL.md'), 'not frontmatter at all\n', 'utf8')
    // `poc-export` and `poc-submit` are absent, so this case is: one bad file.
    const double = registryDouble()
    const { ctx, warnings } = contextDouble({ skills: double.registry })
    expect(() => registerBundledSkills(ctx, { dir })).not.toThrow()
    expect(double.registered).toHaveLength(0)
    expect(warnings.join('\n')).toContain('frontmatter')
  })

  it('skips a skill whose directory name disagrees with its frontmatter name', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wd-skills-'))
    temporaryDirs.push(dir)
    mkdirSync(join(dir, 'poc-ledger'), { recursive: true })
    writeFileSync(join(dir, 'poc-ledger', 'SKILL.md'), `---
name: some-other-skill
description: 说明
---

正文
`, 'utf8')
    const double = registryDouble()
    const { ctx, warnings } = contextDouble({ skills: double.registry })
    expect(() => registerBundledSkills(ctx, { dir })).not.toThrow()
    expect(double.registered).toHaveLength(0)
    expect(warnings.join('\n')).toContain('目录名与 frontmatter name 不一致')
  })
})
