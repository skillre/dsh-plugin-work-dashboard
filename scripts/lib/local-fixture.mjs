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
  // A v3 project with real progress: exercises the four dimensions derived from
  // `outcome`, the progress stream, and the risk board.
  'POC-2026-001.yaml': `poc_id: POC-2026-001
name: 某某银行零信任试点
org:
  system: 人保体系
  company: 人保财险
  department: 信息技术部
amount_wan: 1500
poc_type: 大体量项目
priority: strategic
owner: 张三
sales: 李四
tech_owner: 王工
exec_sponsor: 陈总
stage: G2-方案验证
status: 进行中
stage_since: 2026-10-01
gate0:
  why_customer: 客户要做等保合规改造，现有 VPN 接入体验差，希望验证零信任替代方案
  why_us: 客户是区域标杆，成功可复制到同行业 5 家；我们产品缺少银行场景案例
  decision_chain: 技术部提需求，采购部审批
  post_poc_decision: 立项采购
  competitor: 厂商A
  review:
    conclusion: 通过
    reviewer: 杨闯
    reviewed_at: 2026-09-28
  missing: []
  complete: true
plan:
  customer_pain: 现有 VPN 接入体验差，等保合规压力大
  expected_recognition: 客户 IT 部门书面认可
  criteria:
    - name: 200 人并发接入稳定运行 7 天
      metric: 成功率
      baseline: null
      target: '>=99.5%'
    - name: 单点登录改造完成
      metric: 对接验收
      baseline: null
      target: 通过
  scenarios:
    - 办公网远程接入
    - 出差移动接入
    - 第三方运维临时接入
  our_edge: 零信任架构，无需改造现有网络
  timeline:
    start: 2026-10-01
    end: 2026-12-31
  risks:
    - name: 客户 AD 环境版本老旧，对接可能失败
      level: high
      mitigation: 提前做一次对接预演
  report_nodes:
    - 阶段一汇报
  gate1:
    conclusion: 通过
    reviewed_at: 2026-10-20
  gate2:
    ready: Ready
    checked_at: 2026-10-25
    prerequisites: []
progress:
  - seq: 1
    date: 2026-10-15
    type: 内部Review
    goal: 验证 200 人并发接入
    items:
      - 办公网远程接入
    actual: 完成 150 人灰度，成功率 99.2%
    completion: '75%'
    evidence:
      - title: 压测报告
        link: https://example.com/stress
        type: 文档
    customer:
      synced_with: 王工
      feedback: 性能比预期好
      recognition: 部分认可
    gate3_1: 可证明
    gate3_2: 待确认
    next:
      goal: 补齐 200 人并做 7 天稳定性
      owner: 张三
      deadline: 2026-11-20
outcome:
  achievement: 部分达成
  customer_recognition: 部分认可
  our_proof: 压测报告
  remaining_risks: 无
  conclusion:
    proved: 性能达标
    recognized: 方向认可
    next_business: 推进立项
  business:
    milestone: 完成总部立项
    owner: 张三
    deadline: 2026-12-01
    status: 待推进
  overall: 进展良好
  reviewed_at: 2026-11-01
`,

  // A v3 project with nothing filled in: exercises every G0 rule.
  'POC-2026-002.yaml': `poc_id: POC-2026-002
name: 某某集团办公网改造
org:
  system: 国寿体系
  company: 国寿财险
  department: null
amount_wan: 300
poc_type: SDL
priority: null
owner: 赵六
sales: 钱七
tech_owner: null
exec_sponsor: null
stage: G0-立项
status: 进行中
stage_since: null
gate0:
  why_customer: null
  why_us: null
  decision_chain: null
  post_poc_decision: null
  competitor: null
  review:
    conclusion: null
    reviewer: null
    reviewed_at: null
  missing:
    - why_customer
    - why_us
    - decision_chain
    - post_poc_decision
    - tech_owner
  complete: false
plan:
  customer_pain: null
  expected_recognition: null
  criteria: []
  scenarios: []
  our_edge: null
  timeline:
    start: null
    end: null
  risks: []
  report_nodes: []
  gate1:
    conclusion: null
    reviewed_at: null
  gate2:
    ready: null
    checked_at: null
    prerequisites: []
progress: []
outcome:
  achievement: null
  customer_recognition: null
  our_proof: null
  remaining_risks: null
  conclusion:
    proved: null
    recognized: null
    next_business: null
  business:
    milestone: null
    owner: null
    deadline: null
    status: null
  overall: null
  reviewed_at: null
`,

  // A v3 project achieved with no next milestone: the highest-value gap (R11).
  'POC-2026-003.yaml': `poc_id: POC-2026-003
name: 某某制造产线安全接入
org:
  system: 人保体系
  company: 人保寿险
  department: 生产部
amount_wan: 800
poc_type: AI安全
priority: high
owner: 孙八
sales: 周九
tech_owner: 吴工
exec_sponsor: null
stage: G4-结果转化
status: 进行中
stage_since: 2026-10-10
gate0:
  why_customer: 产线设备远程运维存在安全风险，需要可控接入方案
  why_us: 制造业是重点行业，成功可复制到同行业
  decision_chain: 生产部提需求，IT 部审批
  post_poc_decision: 采购
  competitor: null
  review:
    conclusion: 通过
    reviewer: 杨闯
    reviewed_at: 2026-09-01
  missing: []
  complete: true
plan:
  customer_pain: 产线设备远程运维存在安全风险
  expected_recognition: 客户验收通过
  criteria:
    - name: 50 台设备接入
      metric: 接入数
      baseline: null
      target: 50
    - name: 运维全程审计
      metric: 覆盖率
      baseline: null
      target: '100%'
  scenarios:
    - 产线设备远程运维
    - 供应商临时接入
    - 车间网络隔离
  our_edge: 审计能力
  timeline:
    start: 2026-09-01
    end: 2026-11-30
  risks:
    - name: 产线不能停机
      level: medium
      mitigation: 分批次夜间实施
  report_nodes: []
  gate1:
    conclusion: 通过
    reviewed_at: 2026-09-20
  gate2:
    ready: Ready
    checked_at: 2026-10-05
    prerequisites: []
progress:
  - seq: 1
    date: 2026-09-01
    type: 内部Review
    goal: 完成立项
    items: []
    actual: 立项通过
    completion: '25%'
    evidence: []
    customer:
      synced_with: ''
      feedback: ''
      recognition: ''
    gate3_1: ''
    gate3_2: ''
    next:
      goal: ''
      owner: ''
      deadline: ''
  - seq: 2
    date: 2026-11-01
    type: 客户阶段同步
    goal: 完成验收
    items:
      - 产线设备远程运维
    actual: 客户验收通过
    completion: '100%'
    evidence:
      - title: 验收报告.pdf
        link: https://example.com/acceptance
        type: 文档
    customer:
      synced_with: 吴工
      feedback: 满意
      recognition: 认可
    gate3_1: 可证明
    gate3_2: 已确认
    next:
      goal: ''
      owner: ''
      deadline: ''
outcome:
  achievement: 达成
  customer_recognition: 认可
  our_proof: 验收报告.pdf
  remaining_risks: null
  conclusion:
    proved: 审计能力
    recognized: 客户验收
    next_business: 复购
  business:
    milestone: null
    owner: null
    deadline: null
    status: null
  overall: 成功
  reviewed_at: 2026-11-01
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
