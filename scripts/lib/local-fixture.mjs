#!/usr/bin/env node
/**
 * A local git remote plus a stub `gh`, for verification only.
 *
 * Both verification harnesses need the submission path to run end to end — real
 * clone, real branch, real push, real `gh pr create --draft` — without touching
 * GitHub. Agents must never create real pull requests, so this module builds an
 * owned bare repository with the ledger fixtures and a stub `gh` that records
 * exactly what the plugin asked it to do.
 *
 * Everything it creates lives under the caller's owned root and is removed with
 * it. The module is deliberately not shipped (`scripts/` is excluded from the
 * package), so it can never run in a user's profile.
 */

import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * The three ledger fixtures, verbatim from `skillre/workbranch/projects`.
 *
 * Embedded rather than fetched so the verification is deterministic and works
 * offline: only the DSH install itself needs the network, never the test data.
 */
export const FIXTURES = {
  'POC-2026-001.yaml': `# 测试样例 1：完整项目（G2 阶段，四维部分缺失）
poc_id: POC-2026-001
name: 某某银行零信任试点
type: customer-pilot
tier: strategic
stage: G2-方案验证
owner: 张三
sales_initiator: 李四
customer_tech_owner: 王工

why_customer_test: 客户要做等保合规改造，现有 VPN 接入体验差，希望验证零信任替代方案
why_we_test: 客户是区域标杆，成功可复制到同行业 5 家；我们产品缺少银行场景案例
next_action_goal: 两周内完成 200 人灰度接入，拿到客户 IT 部门的书面认可

gates:
  G0:
    complete: true
    date: 2026-10-15
  G1:
    complete: true
    date: 2026-10-28
    indicators_count: 3
    scenarios_count: 4
    risks_count: 2
  G2:
    complete: false
    date: null
    prerequisites_ready: true
    engineers_invested: true

success_criteria:
  - name: 200 人并发接入稳定运行 7 天
    version: v1
    metric: 成功率 ≥ 99.5%
  - name: 单点登录改造完成
    version: v1
    metric: 与客户 AD 对接通过验收
  - name: 运维侧告警准确率
    version: v1
    metric: ≥ 95%

success_scenarios:
  - 办公网远程接入
  - 出差移动接入
  - 第三方运维临时接入
  - 分支互联

risks:
  - name: 客户 AD 环境版本老旧，对接可能失败
    level: high
    mitigation: 提前做一次对接预演
  - name: 客户决策链长，采购预算未批
    level: medium
    mitigation: 同步推进预算流程

result:
  achievement: null
  evidence: null
  recognition: null
  next_milestone: null

timeline:
  - date: 2026-10-15
    round: 1
    goal: 完成立项
    actual: 已完成，客户 IT 总监签字
    evidence: 立项邮件截图
    customer_feedback: 认可方向
    recognition_scope: 口头
  - date: 2026-10-28
    round: 2
    goal: 完成方案设计
    actual: 完成，含 3 个指标 4 个场景
    evidence: 方案文档 v1.2
    customer_feedback: 待评审
    recognition_scope: 无
`,
  'POC-2026-002.yaml': `# 测试样例 2：缺 G0 三必填（触发缺口规则 1）
poc_id: POC-2026-002
name: 某某集团办公网改造
type: tech-validation
tier: normal
stage: G0-立项
owner: 赵六
sales_initiator: 钱七
customer_tech_owner: null

why_customer_test: null
why_we_test: null
next_action_goal: null

gates:
  G0:
    complete: false
    date: null
  G1:
    complete: false
    date: null
    indicators_count: 0
    scenarios_count: 0
    risks_count: 0
  G2:
    complete: false
    date: null
    prerequisites_ready: false
    engineers_invested: false

success_criteria: []
success_scenarios: []
risks: []

result:
  achievement: null
  evidence: null
  recognition: null
  next_milestone: null

timeline: []
`,
  'POC-2026-003.yaml': `# 测试样例 3：G4 达成但无下一步（触发缺口规则 7，最高价值）
poc_id: POC-2026-003
name: 某某制造产线安全接入
type: customer-pilot
tier: high-value
stage: G4-结果转化
owner: 孙八
sales_initiator: 周九
customer_tech_owner: 吴工

why_customer_test: 产线设备远程运维存在安全风险，需要可控接入方案
why_we_test: 制造业是重点行业，需要标杆案例
next_action_goal: 完成验收并推动复购

gates:
  G0:
    complete: true
    date: 2026-09-01
  G1:
    complete: true
    date: 2026-09-20
    indicators_count: 2
    scenarios_count: 3
    risks_count: 1
  G2:
    complete: true
    date: 2026-10-10
    prerequisites_ready: true
    engineers_invested: true

success_criteria:
  - name: 50 台产线设备安全接入
    version: v1
    metric: 接入成功率 100%
  - name: 运维操作全程审计
    version: v1
    metric: 审计覆盖率 100%

success_scenarios:
  - 产线设备远程运维
  - 供应商临时接入
  - 车间网络隔离

risks:
  - name: 产线不能停机，改造需夜间窗口
    level: medium
    mitigation: 分批次夜间实施

result:
  achievement: 全部完成，客户验收通过
  evidence: 验收报告.pdf、运行数据截图
  recognition: 客户 IT 部门书面认可
  next_milestone: null

timeline:
  - date: 2026-09-01
    round: 1
    goal: 完成立项
    actual: 已完成
    evidence: 立项文档
    customer_feedback: 认可
    recognition_scope: 口头
  - date: 2026-10-10
    round: 2
    goal: 完成方案验证
    actual: 全部指标达标
    evidence: 测试报告
    customer_feedback: 满意
    recognition_scope: 口头
  - date: 2026-11-01
    round: 3
    goal: 完成验收
    actual: 客户验收通过
    evidence: 验收报告.pdf
    customer_feedback: 高度认可
    recognition_scope: 正式验收
`,
}

/**
 * Build the local remote and the stub `gh` inside `root`.
 *
 * The remote is a real bare git repository seeded with the ledger fixtures, so
 * `git clone`, `git push` and `git diff` behave exactly as they would against
 * GitHub. The stub `gh` answers the three calls the plugin makes and appends
 * every invocation to a log file the harness asserts on.
 *
 * @param {string} root owned directory the fixture lives in
 * @returns {Promise<{ remoteUrl: string, stubDir: string, ghLog: string, pathPrefix: string }>}
 */
export async function buildLocalFixture(root) {
  const remoteUrl = join(root, 'remote.git')
  const seedDir = join(root, 'seed')
  const stubDir = join(root, 'stub-bin')
  const ghLog = join(root, 'gh-invocations.log')

  const git = (cwd, ...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

  execFileSync('git', ['init', '--bare', '-b', 'main', remoteUrl], { stdio: 'ignore' })
  execFileSync('git', ['init', '-b', 'main', seedDir], { stdio: 'ignore' })
  await mkdir(join(seedDir, 'projects'), { recursive: true })
  for (const [name, body] of Object.entries(FIXTURES)) {
    await writeFile(join(seedDir, 'projects', name), body, 'utf8')
  }
  const ident = ['-c', 'user.email=verify@example.com', '-c', 'user.name=verify']
  git(seedDir, 'add', '.')
  git(seedDir, ...ident, 'commit', '-m', 'seed fixtures')
  git(seedDir, 'remote', 'add', 'origin', remoteUrl)
  git(seedDir, 'push', '-u', 'origin', 'main')

  await mkdir(stubDir, { recursive: true })
  const script = `#!/bin/sh
# Record the exact invocation so the verification can assert the draft flag.
printf '%s\\n' "$*" >> ${JSON.stringify(ghLog)}
case "$1 $2" in
  'auth token') printf '%s' "stub-token-not-a-real-credential" ;;
  'api user') printf '%s' "skillre" ;;
  'pr create') printf '%s\\n' "https://github.com/skillre/workbranch/pull/101" ;;
  *) printf '%s\\n' "" ;;
esac
`
  await writeFile(join(stubDir, 'gh'), script, { mode: 0o755 })

  return {
    remoteUrl,
    stubDir,
    ghLog,
    pathPrefix: `${stubDir}${process.platform === 'win32' ? ';' : ':'}`,
  }
}

/**
 * Read the recorded `gh` invocations, or `''` when none were made.
 *
 * @param {string} ghLog log path returned by {@link buildLocalFixture}
 * @returns {Promise<string>}
 */
export async function readGhLog(ghLog) {
  const { readFile } = await import('node:fs/promises')
  return readFile(ghLog, 'utf8').catch(() => '')
}
