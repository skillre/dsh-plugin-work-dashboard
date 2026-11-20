#!/usr/bin/env node
/**
 * POC 信息收集表单的薄 CLI（v3.1）。
 *
 * ## 这个文件为什么这么短
 *
 * 表单的生成逻辑**不在**这里，在 `src/form.ts`（打包后 `lib/form.js`）。
 * 本脚本只做三件事：解析命令行、读 YAML、把结果交给 `buildFormHtml` 写盘。
 *
 * 这一点是硬约束，不是风格偏好。这个脚本曾经是一份 654 行的独立重写：
 * 它自己实现了一遍 `projectForForm` / `buildFormHtml`，输出的是
 * `{generatedAt, generatedBy, pocs:{...}}`，而 `poc-submit` 读的是
 * `{changes:[...]}`。两边各自演化，结果就是**导出的表单根本交不回去**——
 * 模型按 `poc-export/SKILL.md` 跑这个脚本，产出的文件 `poc-submit` 解析不了。
 *
 * 所以：任何表单行为（字段、意图分区、草稿键、变更集形状）的改动都只改
 * `src/form.ts`，这里跟着 `lib/` 重新构建即可。**两处不能各自演化。**
 *
 * ## 为什么用动态 import
 *
 * `lib/` 是构建产物，可能不存在（刚 clone、刚 clean）。静态 import 失败时
 * Node 只会抛一句 `ERR_MODULE_NOT_FOUND`，而这里需要告诉用户「先跑
 * `npm run build`」。先探测再 import，才能给出可执行的提示，而不是让脚本
 * 静默退回到某个旧实现。
 *
 * 用法：
 *   node export-form.mjs --mode fill --poc <file|glob> --intent progress --out <html>
 *   node export-form.mjs --mode new --intent new --out <html>
 *
 * 只读 YAML，只写 HTML。绝不改台账。
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import YAML from 'yaml'

/** 打包后的 `src/form.ts`。相对本脚本：skills/poc-export/scripts/ → 包根。 */
const FORM_MODULE = new URL('../../../lib/form.js', import.meta.url)

/** 表单能接受的意图，与 `src/form.ts` 的 `FormIntent` 一致。 */
const INTENTS = ['new', 'supplement', 'progress']

/**
 * 载入真正的生成器。
 *
 * 缺失时直接退出而不是降级：一个能跑但产出 `poc-submit` 读不了的文件的脚本，
 * 比一个明确报错的脚本更糟——错误会推迟到组员填完之后才暴露。
 */
async function loadFormModule() {
  if (!existsSync(FORM_MODULE)) {
    process.stderr.write(
      `找不到 ${FORM_MODULE.pathname}\n` +
        '表单生成器是构建产物，还没有编译。请先在包根目录执行：\n' +
        '  npm run build\n' +
        '然后重新运行本脚本。\n',
    )
    process.exit(1)
  }
  return import(FORM_MODULE.href)
}

/** 读取一个 YAML 项目文件。解析交给 `yaml`，形状交给 `projectForForm`。 */
function readProject(file) {
  return YAML.parse(readFileSync(file, 'utf8')) ?? {}
}

/** 展开 `--poc` 参数：单个文件，或含 `*` 的通配符。 */
function expandPocPattern(pattern) {
  const expanded = pattern.startsWith('~') ? pattern.replace(/^~/, process.env.HOME ?? '') : pattern
  if (!expanded.includes('*')) return [expanded]
  // Shell-style glob without a dependency: split on the last slash, then match
  // the file names against the pattern's basename glob.
  const dir = expanded.slice(0, expanded.lastIndexOf('/'))
  const glob = expanded.slice(expanded.lastIndexOf('/') + 1)
  const regex = new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`)
  let names = []
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  return names.filter((name) => regex.test(name)).map((name) => `${dir}/${name}`)
}

/** 主流程。 */
async function main() {
  const { values } = parseArgs({
    options: {
      mode: { type: 'string', default: 'fill' },
      intent: { type: 'string' },
      poc: { type: 'string' },
      out: { type: 'string' },
    },
  })

  if (values.mode !== 'new' && values.mode !== 'fill') {
    throw new Error(`--mode 只接受 fill 或 new，收到：${values.mode}`)
  }
  // 表单内部的 mode 只有 `blank`：它描述的是「页面从空白项目开始」，而命令行
  // 的 `new` 描述的是「用户要新建项目」，两者是同一件事的两种叫法。
  const mode = values.mode === 'new' ? 'blank' : 'fill'

  // 意图决定表单问什么（见 `src/form.ts` 的 `resolveSections`）。默认值按模式
  // 推导：新建项目必然是 `new`，填充已有项目默认是补全而不是记进展——记进展
  // 是更窄的动作，不该由「没写参数」隐式选中。
  const intent = values.intent ?? (mode === 'blank' ? 'new' : 'supplement')
  if (!INTENTS.includes(intent)) {
    throw new Error(`--intent 只接受 ${INTENTS.join(' / ')}，收到：${intent}`)
  }

  let files = []
  if (mode === 'fill') {
    if (values.poc === undefined) throw new Error('fill 模式需要 --poc（一个 YAML 文件或通配符）')
    files = expandPocPattern(values.poc)
    if (files.length === 0) throw new Error(`没有匹配到任何 YAML：${values.poc}`)
  }

  const { buildFormHtml, projectForForm, formFileName } = await loadFormModule()

  // `blank` 模式的 HTML 由 `buildFormHtml` 自己造空白项目，`projects` 只是
  // 为了类型和摘要而传；`fill` 模式才逐条转换台账记录。
  const projects = mode === 'blank' ? [] : files.map((file) => projectForForm(readProject(file)))
  const pocIds = projects.map((project) => project.pocId).filter((id) => id !== '')

  const now = new Date()
  // 文件名由生成器决定，不在这里拼：日期戳格式和批量命名规则都属于表单契约，
  // 两边各写一份就会出现「CLI 产出的名字 GUI 那边认不出」。
  const out = values.out ?? join(tmpdir(), formFileName({ mode, pocIds, now }))

  const html = buildFormHtml({ mode, intent, projects, now })
  writeFileSync(out, html, 'utf8')

  const projectCount = mode === 'blank' ? 1 : projects.length
  process.stdout.write(`已生成：${resolve(out)}\n  模式：${mode === 'blank' ? 'new' : 'fill'}\n  意图：${intent}\n  项目数：${projectCount}\n`)
  if (mode === 'blank') {
    process.stdout.write('  - （新建）空白项目：无已有进展\n')
  } else {
    for (const project of projects) {
      const label = project.name === '' ? '（未命名）' : project.name
      process.stdout.write(`  - ${project.pocId === '' ? '（新建）' : project.pocId} ${label}：已有 ${project.existingProgressCount} 条进展\n`)
    }
  }
  process.stdout.write(
    '  交给组员：双击打开 → 填写 → 点【生成回传文件 (.html)】→ 把 .html 发回（或点【下载变更集 (.json)】发 .json）\n',
  )
}

main().catch((error) => {
  process.stderr.write(`生成失败：${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
