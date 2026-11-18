# 看板插件 v3.1 适配 · 工作任务与计划

> 依据：`docs/LEDGER-REQUIREMENTS-v3.1.md` 已被台账仓库实施，实际落地版本见
> `workbranch@HEAD`（`schema_version: "3.1"`、`config/rules.yaml version: "3.2"`）。
> 设计依据：`/tmp/pocrender/v2/poc-detail-v21.drawio`（两层信息架构）。

---

## 0. 实施前的前置条件（当前 BLOCKED）

| # | 前置 | 状态 | 说明 |
|---|---|---|---|
| P-1 | fleet 预检通过（`policyDigest` 已确认） | ❌ 未通过 | devkit 有 3 个未提交改动，其中 `scripts/release-verify.mjs` 在 `POLICY_RELATIVE_FILES` 内，导致 digest 漂移。**需人工处理 devkit + fleet `plugins.json`，非本插件写入范围。** |
| P-2 | 台账缓存刷新到 3.1 | ❌ 未通过 | `~/.dsh/cache/work-dashboard/repo` 仍是 3.0（`2026-11-16` PR #8），且目录只读无法 `git fetch`。**需通过插件「刷新」功能更新。** |

**纪律**：P-1 未过不动代码（AGENTS.md 治理要求）；P-2 未过则运行期验证不可信。

---

## 1. 已核实的 v3.1 真实结构（来自 GitHub `skillre/workbranch@HEAD`）

比原需求多出的部分，必须按真实实现编码：

### 1.1 schema 变更

```yaml
schema_version: "3.1"          # 新增，缺省按 3.0 处理

progress[]:
  items:            # ❌ 已删除，出现即 validate 失败
  scenario_ids:     # ✅ scn-NN 列表
  criteria_ids:     # ✅ cri-NN 列表
  change:           # ✅ 必填

plan.scenarios[]:   # string[] → 对象数组
  - { id, name, goal, status, evidence_count, recognition }

plan.criteria[]:    # 加 id 与派生 status
  - { id, name, metric, baseline, target, status }

gate_decisions[]:   # 新增，Gate 升级审计轨迹
  - { from, to, decided_at, decided_by, basis, signals_ref, note }
```

### 1.2 判定阈值外置（重要）

**阈值不在代码里，也不在 schema 文档里**，唯一来源是台账仓库的：

- `config/rules.yaml` → `large_amount_wan` / `criteria{min,max}` / `scenarios{min,max}` /
  `risks.max` / `stall_days` / `priority{strategic_wan,high_wan,strategic_poc_types}` / 16 条规则元数据
- `config/health.yaml` → 陈旧度阈值

**当前插件把阈值硬编码在 `src/gap.ts`**（R4 的 2–3、R5 的 3–5、R6 的 3、R2 的 300、
R12 的 45）。这是本次改造的重点之一：规则表漂移是真实风险。

### 1.3 版本号有两个，不是一回事

| 版本 | 位置 | 含义 |
|---|---|---|
| `schema_version` | `schemas/enums.yaml` + 每个 project | 数据的**形状** |
| `version` | `config/rules.yaml` | 施加于数据的**判断** |

「项目可以是 schema 最新的，但判断规则是旧的」。插件必须能分别表达这两者。

### 1.4 派生字段归属

`config/derive.yaml` 明确区分：

- **stored**（由 `tools/derive.mjs --write` 写入 YAML）：
  `gate0.missing`、`gate0.complete`、`priority`、
  `plan.scenarios[].status/evidence_count/recognition`、`plan.criteria[].status`
- **computed_only**（读时算，绝不写盘）：
  `R12-stalled-days`、`health.facts_stale_days`、`health.judgment_stale_days`

插件**必须复用 stored 值**，不能用自己算的覆盖——否则与 CI 校验打架。

---

## 2. 目标任务分解

### T1 · 类型层适配（`src/types.ts`）

| 动作 | 位置 |
|---|---|
| `ProgressRecord.items` 删除 | `:113` |
| 新增 `scenario_ids` / `criteria_ids` / `change` | `:108-129` |
| `PlanRecord.scenarios` 改为 `ScenarioRecord[]` | `:153` |
| `CriterionRecord` 加 `id` / `status` | `:93` |
| `PocRecord` 加 `schema_version` / `gate_decisions` | `:201` |
| 新增 `ScenarioRecord` / `GateDecisionRecord` 接口 | 新增 |

**验收**：`tsc --noEmit` 通过；新增类型单测覆盖 3.0/3.1 两种输入。

### T2 · 阈值外置（`src/gap.ts` + 新 `src/rules.ts`）

| 动作 |
|---|
| 新增 `src/rules.ts`：解析 `config/rules.yaml`，导出 16 条规则元数据与阈值 |
| `gap.ts` 内 5 处硬编码阈值改为读 `rules.ts` |
| 规则表从 12 条扩到 16 条（R13–R16） |
| R15/R16 实现 `guard` 前置条件（数量合规才触发） |
| R14 级别是 `info`，现有 `GapLevel` 只有 `high\|medium`，需扩到 `high\|medium\|info` |

**验收**：`tests/gap.spec.ts` 33 个既有用例全绿；新增 R13–R16 用例；guard 用例覆盖
「计划不合格时不报 R15/R16」。

### T3 · 三源解析（`src/repo.ts` / `src/store.ts`）

v3.1 台账多了 `config/` 与 `signals/`，缓存目录结构变了。

| 动作 |
|---|
| 刷新链路同时拉取 `projects/`、`schemas/`、`config/`】
| `signals/` 只读可选，缺失不报错 |
| 解析 `config/rules.yaml`、`config/derive.yaml`、`config/health.yaml` |
| 版本不一致时降级为只读模式并给出提示 |

**验收**：缓存目录缺 `config/` 时仍能启动（降级），有 `config/` 时启用新规则。

### T4 · 场景/指标状态展示（`src/client/detail.tsx` + 新 CSS）

按 `poc-detail-v21.drawio` 的两层架构实现：

| 动作 |
|---|
| 第一层新增「关键成功指标」表（含基线/目标/状态） |
| 第一层新增「关键测试场景」列表（状态点 + 详情入口） |
| 场景状态点：● 已证明 / ◐ 待客户确认 / ○ 无证据 / － 未开始 |
| 第二层场景详情：目标 → 证据 → 客户反馈 → G3 判定 → 关联进展 |
| `tech_owner` 从 Gate0 区块移到身份区（符合 schema） |

**验收**：单测 + jsdom 渲染快照；四种状态色都有用例。

### T5 · 空态优先（`src/client/*`）

**台账 30/30 项目 `scenarios`/`criteria`/`progress` 全空**，空态就是当前的真实形态。

| 动作 |
|---|
| 所有新增区块必须有空态（不是隐藏，是显式说明「尚未填写」） |
| 空态文案区分三种：未开始 / 未填写 / 不适用 |

**验收**：用真实缓存（全空）跑通，页面上不能出现空白区块或 `undefined`。

### T6 · 导出表单适配（`src/form.ts`）

**这是唯一的破坏性兼容点**——`poc-export` 是发给组员的离线 HTML。

| 动作 | 位置 |
|---|---|
| `items` → `scenario_ids` / 新增 `criteria_ids` | `:1086-1088` |
| `change` 改为必选下拉 | FORM_SCRIPT |
| `scenarios` 由字符串列表改为对象编辑 | `:117, 201, 355` |
| **旧表单识别**：读到 3.0 格式明确提示「场景关联将丢失」 | FORM_SCRIPT |

**验收**：新旧表单互转用例；旧表单导入必须**明确报错**而非静默丢字段。

### T7 · 测试夹具（`tests/fixtures/`）

台账全空，G1–G4 无真实数据。

| 动作 |
|---|
| 构造 4 个夹具：G0 全空 / G2 进行中 / G3 部分证明 / G4 已转化 |
| 夹具必须能通过 `tools/validate.mjs` |
| 用于 detail 渲染快照与缺口规则回归 |

**验收**：夹具跑 `validate.mjs` 零错误。

---

## 3. 执行顺序与依赖

```
P-1 fleet 预检通过 ─┐
P-2 缓存刷新 3.1   ─┴→ T1 类型 ─→ T2 阈值/规则 ─→ T3 三源解析
                                        ↓
                                   T7 夹具（可与 T2 并行）
                                        ↓
                              T4 两层 UI ─→ T5 空态
                                        ↓
                                   T6 表单适配
```

- **T1 是硬前置**：类型不对，后面全白做。
- **T7 可与 T2 并行**：夹具不依赖 UI。
- **T6 最后做**：它是对外兼容点，需要 schema 完全稳定。

---

## 4. 验证阶梯（五级证据，遵循 devkit）

| 级别 | 内容 | 何时 |
|---|---|---|
| L1 | `tsc --noEmit` + lint | 每个任务后 |
| L2 | 单元测试（现有 200+ 用例须全绿） | 每个任务后 |
| L3 | 夹具回归 + 缺口规则矩阵 | T2/T7 后 |
| L4 | 真实缓存（刷新后）跑通、空态无误 | T5 后 |
| L5 | 隔离 profile 挂载验证 + 刷新 web 产物 | 收尾 |

**不做的**：不碰用户 profile、不 `file:` 依赖、不做远程写/发版。

---

## 5. 风险与待确认

| # | 风险 | 处置 |
|---|---|---|
| K1 | 阈值外置后，插件读不到 `config/rules.yaml`（旧缓存） | 内置 fallback 常量 + 显式提示「规则版本未知」 |
| K2 | `R14` 是 `info` 级，现有 UI 只有两档颜色 | 扩 `GapLevel`，`info` 用 `slate` 色 |
| K3 | 旧导出表单回流导致数据丢失 | T6 必须**显式报错**，不静默降级 |
| K4 | `stored` 派生值与插件自算值打架 | 优先用 stored，缺失才自算并标注来源 |
| K5 | 台账 `rules.yaml version 3.2` 与 `schema_version 3.1` 不同步演进 | 两者分开显示，不强行绑定 |

---

## 6. 明确不在本次范围

- `signals/` 的生成与消费（台账侧 `signals/README.md` 说明其用途，但插件暂不展示）
- `gate_decisions[]` 的完整 UI（先只读展示，不做编辑）
- `health.yaml` 陈旧度指标的完整实现（先只读取阈值，不建面板）
- 发版（需人工授权）

---

## 7. 当前状态

**BLOCKED on P-1 / P-2。**

已完成且不依赖前置的工作：

- ✅ 通读插件代码，产出本任务分解
- ✅ 核实 v3.1 真实结构（GitHub HEAD，非本地缓存）
- ✅ 设计稿 v2.1 定稿（`/tmp/pocrender/v2/poc-detail-v21.drawio`）
- ✅ 需求文档 `docs/LEDGER-REQUIREMENTS-v3.1.md`

前置解除后按 §3 顺序执行。
