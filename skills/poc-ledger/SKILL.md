---
name: poc-ledger
description: 读取并分析 POC 台账（GitHub 私有仓库 workbranch，v3 数据模型），回答项目进展、判断阶段、识别缺口。当用户问「某个 POC 怎么样了」「哪些项目卡住了」「台账里有什么问题」「某个项目的进展流」时使用。
---

# POC 台账读取与分析（v3）

POC 项目的单一事实来源是 GitHub 私有仓库 `skillre/workbranch` 的 `projects/*.yaml`。

**数据模型是 v3**（身份 + gate0 + plan + progress[] + outcome）。旧版（v1）的
`why_customer_test` / `result` / `timeline` 字段**已不存在**；按那些字段去找会读不出任何东西。

## 数据从哪读

按优先级：

1. **本插件的缓存**（推荐，只读）：`~/.dsh/cache/work-dashboard/repo/projects/*.yaml`
   由工作看板插件的「刷新」维护，和看板显示的是同一份数据。
2. **临时 clone**（缓存不存在时）：

   ```sh
   git clone --depth 1 https://github.com/skillre/workbranch.git /tmp/workbranch-read
   ls /tmp/workbranch-read/projects/
   ```

3. **仓库内的 schema 文档**（字段语义拿不准时看）：
   `schemas/poc-schema.md`、`schemas/enums.yaml`（与 `projects/` 同级）。

⚠️ **只读**。写台账必须走 PR 流程（见 `poc-submit` skill），绝不直接改 main。

## v3 结构

```yaml
poc_id: POC-006
name: 人保财险全国信创上网行为管理替换

org: { system: 人保体系, company: 人保财险, department: null }   # 体系 / 主业公司 / 部门
amount_wan: 1500              # 预计金额（万元）
poc_type: 大体量项目           # AI安全 | 保护AI | ACG | SDL | 虚拟化 | 大体量项目
priority: null                # 自动算：strategic | high | normal
owner: 靳承德/苑炳轩            # 我方 POC Owner
sales: 林鹤                   # 销售发起人
tech_owner: 李国新             # 客户侧技术责任人
exec_sponsor: null            # 客户侧业务决策人
stage: G0-立项                # G0-立项 … G4-结果转化 | closed
status: 进行中                 # 进行中 | 暂停 | 已关闭 | 已取消
stage_since: null             # 进入当前阶段的日期，算停滞用

gate0:                        # 值不值得做（G0）
  why_customer: ...           # 01 客户为什么要测
  why_us: ...                 # 02 我们为什么测 + 下一步动作和目标
  decision_chain: null        # 03 项目流程 / 决策链
  post_poc_decision: null     # 05 测完后客户会做什么决策
  competitor: null            # 主要竞争对手
  review: { conclusion: null, reviewer: 靳承德, reviewed_at: null }
  missing: [decision_chain, post_poc_decision]   # 自动算
  complete: false                                # 自动算

plan:                         # 怎么赢（G1 / G2）
  customer_pain: null
  expected_recognition: null
  criteria: []                # 关键成功指标，2–3 项
  scenarios: []               # 关键测试场景，3–5 个
  our_edge: null
  timeline: { start: null, end: null }   # 计划起止窗口，不是 v1 的 timeline 列表
  risks: []                   # 最大风险，≤3
  report_nodes: []
  gate1: { conclusion: null, reviewed_at: null }
  gate2: { ready: null, checked_at: null, prerequisites: [] }

progress: []                  # ★ 核心：进展流，追加式，永不覆盖

outcome:                      # 结论（大部分由最后一条进展自动推导）
  achievement: null           # 达成 | 部分达成 | 未达成
  customer_recognition: null  # 认可 | 部分认可 | 未认可 | 待确认
  our_proof: null
  remaining_risks: null
  conclusion: { proved: null, recognized: null, next_business: null }
  business: { milestone: null, owner: null, deadline: null, status: null }
  overall: null
  reviewed_at: null
```

### progress 一条长什么样

```yaml
progress:
  - seq: 1
    date: 2026-10-15
    type: 内部Review            # 内部Review | 客户阶段同步 | Checkpoint
    goal: 验证 200 人并发接入
    items: [办公网远程接入]
    actual: 完成 150 人灰度，成功率 99.2%
    completion: "75%"          # 0% | 25% | 50% | 75% | 100%
    evidence:
      - { title: 压测报告, link: https://…, type: 文档 }
    customer: { synced_with: 王工, feedback: 性能比预期好, recognition: 部分认可 }
    gate3_1: 可证明             # 可证明 | 待补证据
    gate3_2: 待确认             # 已确认 | 待确认
    next: { goal: 补齐 200 人, owner: 张三, deadline: 2026-11-20 }
```

## 四维结果：为什么必须分开看

`outcome` 的四个维度**不能合并成一个「进展顺利」**。这是识别「假成功」的核心：

| 维度 | 取自 | 缺失意味着 |
|---|---|---|
| 目标达成 | `outcome.achievement`（自动） | 不知道做成没有 |
| 证据 | `outcome.our_proof` 或最新进展的 `evidence` | 只有口头说法，无凭据 |
| 客户认可 | `outcome.customer_recognition`（自动） | 客户没说好，只是我们觉得好 |
| 下一步 | `outcome.business.milestone` | **做成了但没转化**——商业价值最高的缺口 |

前两个是「自动推导」、后两个是「人工填」。回答时要标出来：一个没人复核过的推导值和一个
有人写下的结论，可信度不同。

## 12 条缺口规则

分析项目时逐条检查（与工作看板插件的实现一致）：

| # | 规则 | 触发条件 | 级别 |
|---|---|---|---|
| 1 | G0 五必填缺失 | `gate0.missing` 非空 | 高 |
| 2 | 大金额未过 G0 | `amount_wan >= 300` 且 `gate0.review.conclusion` 不是「通过」 | 高 |
| 3 | G0 通过但计划空白 | 结论「通过」且 `plan.criteria` 为空 | 高 |
| 4 | 成功标准不聚焦 | `plan.criteria` 数量不在 2–3 | 中 |
| 5 | 场景不聚焦 | `plan.scenarios` 数量不在 3–5 | 中 |
| 6 | 风险超限 | `plan.risks` 超过 3 个 | 中 |
| 7 | G2 未就绪已开测 | 有 `progress` 且 `plan.gate2.ready` 不是「Ready」 | 高 |
| 8 | 有进展无证据 | **最新一条**进展有 `actual` 但 `evidence` 为空 | 高 |
| 9 | 有证据无客户认可 | **最新一条**有证据且 `recognition` 是「未认可」/「待确认」 | 高 |
| 10 | G3-1 可证明但 G3-2 未确认 | **最新一条** `gate3_1=可证明` 且 `gate3_2≠已确认` | 高 |
| 11 | 达成但无下一步里程碑 | `achievement=达成` 且 `business.milestone` 为空 | 高 |
| 12 | 阶段停滞 | `stage_since` 距今超过阈值（默认 45 天） | 中 |

**三条实现细节，别踩：**

- **R4–R6 对空列表不触发。** 空代表「还没规划」，那是 R3 的事；否则每个新项目第一天就报三条。
- **R8–R10 只看最新一条进展**，不是逐条检查历史。
- **R12 没有 `stage_since` 就不报**。未知不等于停滞。

## 回答格式

用户问「某个项目怎么样」：

1. **一句话结论**（例：方案验证阶段，但四维只填了两项）
2. **阶段位置**：G0–G4 在哪一步，`stage_since` 停了多久
3. **四维状态**：逐项 ✅/❌，并标明哪项是自动推导
4. **最新进展**：日期、类型、实际做到什么
5. **命中缺口**：规则编号 + 一句为什么重要
6. **建议**：具体下一步

用户问「哪些项目卡住了」：

- 按缺口严重度排序，只列真正需要行动的，不要罗列全部
- 每条写「哪个项目、缺什么、为什么重要」
- 大金额项目（≥300 万）没通过 G0 的，优先说

## 分析原则

- **宁可说「数据缺失」，不要推测。** YAML 里没有就直说「这项没填」。
- **区分事实与判断。** 字段值是事实；「这个项目有风险」是判断，要给出依据。
- **关注「做成了但没转化」。** R11 最容易被忽视，商业价值最高。
- **不美化。** 四维只填了 1 项就说 1 项，不说「基本完成」。
- **进度流是历史，不要只看结论。** `outcome` 是推导结果，`progress[]` 才是原始记录；
  两者矛盾时以 `progress[]` 为准，并把矛盾指出来。

## 相关 skill

- `poc-export`：导出表单给组员补数据
- `poc-submit`：把组员交回的文件校验后提交成 Draft PR
