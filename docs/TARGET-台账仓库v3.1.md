# 台账仓库 v3.1 · 目标方案

> 输入：`docs/LEDGER-REQUIREMENTS-v3.1.md`（看板插件会话提出的 16 条需求）
> 定位：本会话负责**台账仓库与 SuperAgent 侧**的目标态设计；看板 UI 不在范围。
> 实测基线：2026-11-18 拉取 `skillre/workbranch`，30 个项目 / 6400 万 / 全部停在 G0 / `progress` 0 条 / `scenarios`、`criteria` 全空。

---

## 0. 一句话结论

需求方向全部成立，且**当前是重构的最佳窗口**——三处结构性变更（`scenarios` id 化、`items` 改名、`criteria_ids` 新增）涉及的字段在真实台账里**全部为空**，零迁移成本。

但有 **4 处必须补强、2 处必须裁决**，否则需求落地后会立刻产生新的不一致。其中最重要的是：

> **`R2.3「由工具自动计算后写回 YAML」在当前仓库里无工具可依，也没有任何机制保证写回值不腐坏。**

---

## 1. 需求处置总表

| 编号 | 需求 | 处置 | 说明 |
|---|---|---|---|
| R1.1 | `scenarios` 对象化 + `scn-NN` 稳定 id | ✅ 直接采纳 | — |
| R1.2 | `criteria` 补 `id` | ✅ 直接采纳 | 格式统一为 `cri-NN` |
| R1.3 | criteria 与 scenarios 完全独立 | ✅ 采纳 | 但需在文档写明"允许一条进展只关联其中之一" |
| R1.4 | `items` → `scenario_ids`，破坏性 | ✅ 采纳，**判 schema 错误** | 需求方二选一，选严格；存量 0 条，代价为零 |
| R2.1 | `scenarios[].status` 等派生字段 | ⚠️ **有条件采纳** | 字段采纳；**计算方与写回时机必须重新定义**（见 §3） |
| R2.2 | 场景状态计算规则 | ⚠️ **需补强** | 原文有 3 处逻辑漏洞（见 §4.2） |
| R2.3 | 必须由工具计算写回 | ⚠️ **需补强** | 仓库当前**没有**任何工具；本方案新增 `tools/derive.mjs` |
| R3.1 | `criteria[].status` | ✅ 采纳 | 同 R2 的补充约束 |
| R3.2 | `progress[].criteria_ids`（方案 A） | ✅ 采纳 | — |
| R3.3 | criteria 状态推导 | ⚠️ 需明确 | "与 achievement 同源"要写成可执行公式（见 §4.3） |
| R3.4 | 无证据必须停在"未验证" | ✅ 采纳，且**优先级最高** | 这是防"假达成"的核心闸门 |
| R3.5 | 两个 id 列表互不推导 | ✅ 采纳 | — |
| R4.1 | `progress[].change` 枚举 | ✅ 采纳 | — |
| R4.2 | 允许"无实质进展" | ✅ 采纳 | — |
| R4.3 | `change` 必填 | ✅ 采纳，**但需表单版本握手** | 已发出的旧表单会静默写错（见 §6.3） |
| R5.1 | `tech_owner` 归属澄清 | ✅ 采纳（P2） | 实测确实在顶层，文档写错 |
| R6.1–6.3 | 新增 R13–R16，R8–R10 不动 | ⚠️ **需裁决重复报警** | 见 §5.2 |
| R7.1–7.4 | 文档与枚举同步 | ✅ 采纳 | R7.4 建议扩展为双层版本号（见 §7） |
| §8 | 现状勘察 | ✅ 已复核 | 数据吻合；补充一条实测结论（见 §2） |
| §9 | 优先级 | ✅ 采纳并细化为里程碑 | 见 §10 |
| §10 | 插件侧耦合清单 | ✅ 采纳 | 本方案补充 3 处需求方未列出的耦合点（见 §9.2） |

---

## 2. 对需求方数据勘察的复核与补充

需求方 §8 的四项结论全部复核无误。补充两条实测：

| 项 | 需求方 | 本次复核 |
|---|---|---|
| `stage` | 30/30 全为 G0-立项 | ✅ 一致 |
| `plan.scenarios` / `plan.criteria` | 30/30 空 | ✅ 一致 |
| `progress` | 30/30 空 | ✅ 一致 |
| **派生字段漂移** | 未提及 | **当前 0/30 漂移**：`gate0.missing` 与 `complete` 全部与实际字段一致 |
| **仓库自动化** | 未提及 | **不存在**：无 `.github/`、无校验脚本、无 `tools/` |

第二条的意义要说清楚：

> **漂移现在是 0，不是因为系统保证了它，而是因为没有人动过数据。**
> 仓库没有 CI、没有分支保护（个人免费私有仓库，实测 403），30 个文件靠手写维护。
> 一旦有人手改 `why_customer` 却忘了重算 `missing`，缺口规则 R1 会**静默错判**，而且没有任何地方会报警。

所以 R2.3 的真实含义不是"加个字段"，而是"**给仓库引入第一套确定性计算与校验**"。

---

## 3. 核心裁决一：谁计算派生字段

### 3.1 冲突在哪

- R2.3 要求"由工具计算后写回 YAML"→ 需要一个**写入方**。
- 看板插件是**只读**的（既定架构：不写库、不提 PR）。
- SuperAgent 是**唯一写入路径**，但它每天才跑一次，且每次写都会产生 PR。
- 仓库里**没有任何工具**。

如果按字面实现"工具写回"，最自然的理解是让 agent（LLM）去算每个场景的状态。这条路必须否掉：

| 问题 | 后果 |
|---|---|
| 不可复现 | 同样输入，两次运行可能给出不同状态 |
| 不可审计 | 无法回答"为什么这个场景是已证明" |
| 成本 | 30 项目 × 4 场景 × 每天 = 120 次判断，还要读全库 |
| 与规则冲突 | `config/rules.yaml` 是确定性规则，LLM 判断会与之漂移 |

**而 R2.2 / R3.3 给的都是明确的四分支判定**——这是纯函数，不是判断题。

### 3.2 裁决：三层分明

| 层 | 谁做 | 说什么 | 能否写库 |
|---|---|---|---|
| **计算层** | `tools/derive.mjs`（确定性 Node 脚本，无网络、无 LLM、无时钟） | 状态机、计数、枚举合法性、派生字段 | 在 PR 中写回 `projects/*.yaml` |
| **判断层** | SuperAgent | Gate 能否升级、健康度叙事、下一步建议 | 只写 `signals/*.yaml` |
| **展示层** | 看板插件（只读） | 渲染 | 不写 |

**关键定位：`projects/*.yaml` 里的派生字段是「可校验缓存」，不是事实源。**
事实源永远是：人写的输入字段 + `config/rules.yaml` + `tools/derive.mjs`（版本化代码）。
派生存疑时，重跑脚本即可重建；永远不需要"人工修正派生值"。

这条定位一句话解开了所有冲突：
- 插件**不依赖**存储的派生值也能正确显示（它本地会算）。
- 存储派生值的作用是：GitHub 网页可读、agent 免重算、diff 可审阅。
- CI 拿它做**一致性断言**，不一致即失败。

### 3.3 派生字段的四条铁律

1. **不得依赖当前时间**。所有存储的派生字段都必须是输入字段的纯函数。
   （这正是 §2 能对 30 个文件做严格相等断言的原因。）
   时间相关的判断（R12 停滞、健康度陈旧天数）**只算不存**，由读取方即时计算。
2. **不得写入时间戳**。否则每天都会产生无意义 diff，幂等失效。
3. **不得人工修改**。CI 会拒绝与脚本输出不一致的值；要改就改输入字段。
4. **顺序稳定**。列表保持作者原有顺序，不排序、不重组。

---

## 4. 核心裁决二：计算规范（把需求写成可执行逻辑）

### 4.1 时间与序

```
排序键 entryOrder(p) = (p.date 升序, p.seq 升序)      # 同日期时 seq 大者为后
latestOf(list)       = list 按 entryOrder 取最后一项
```

- `date` 缺失或非法（非 `YYYY-MM-DD`）的进展：**不参与任何判定**，并在校验中报 `E-DATE` 错误。
- `seq` 缺失时按 0 处理，仅用于同日期排序。

### 4.2 场景状态（对 R2.2 的三处补强）

需求方原文：

```
相关进展 = { p ∈ progress | scn-XX ∈ p.scenario_ids }
未开始   : 相关进展为空
无证据   : 相关进展非空，但所有相关进展的 evidence 均为空
待客户确认: 存在相关进展有 evidence，但其中最新一条的 customer.recognition ∉ {认可, 已确认}
已证明   : 存在相关进展有 evidence，且最新一条的 recognition ∈ {认可}
```

**漏洞 1：枚举混用。** `{认可, 已确认}` 把两个枚举混在了一起。
`progress[].customer.recognition` 的取值是 `认可 | 部分认可 | 未认可 | 待确认`（`enums.yaml:recognition`）；
`已确认` 属于 `gate3_2` 的枚举。必须二选一。

**漏洞 2："最新一条"歧义。** 原文没说是"相关进展中最新一条"还是"相关进展中**有证据的**最新一条"。

反例：场景 A 有 3 条进展——①有证据+客户认可、②有证据+客户认可、③例行同步但没挂证据。
按字面读，"最新一条"是③ → 判 `待客户确认`（甚至因为③没证据先落到 `无证据` 分支）。
结果是**已经证明过的场景被后来的例行汇报打回**，逼人反复补证据。

**漏洞 3：状态不稳定。** 没有单调性约定，同一个场景的状态会在"已证明 / 待客户确认"之间来回跳，看板上的状态点会闪。

**补强后的规范：**

```
relevant(scn) = [p ∈ progress | scn-XX ∈ p.scenario_ids]   按 entryOrder 排序
proven(scn)   = [p ∈ relevant | p.evidence 非空]

if relevant 为空                      → 未开始
else if proven 为空                   → 无证据
else:
    p* = latestOf(proven)                       # 只看有证据的，漏洞2
    if p*.customer.recognition == "认可"  → 已证明
    else                                  → 待客户确认

evidence_count(scn) = Σ len(p.evidence)  for p in relevant
recognition(scn)    = p*.customer.recognition（取 proven 最新一条；无则 null）
```

**单调性规则（解决漏洞 3）：**

> 一个场景一旦进入 `已证明`，**只有两类进展能让它回退**：
> 该进展的 `change` 为 `风险出现` 或 `目标调整`，且显式关联该场景。
> 其余进展（例行同步、证据补充、无实质进展）**不降低**状态。

实现方式：在脚本里维护 `sticky` 标记——计算时若历史最新状态已达 `已证明`，且最新一条相关进展的 `change` ∉ {`风险出现`, `目标调整`}，则保持 `已证明`。

这一条需求方没提，但不加一定会出问题：`R6.1` 的 R14（场景待客户确认）会因为一条例行周报而反复亮红。

### 4.3 指标状态（把 R3.3 / R3.4 写成公式）

```
relevant(cri) = [p ∈ progress | cri-XX ∈ p.criteria_ids]   按 entryOrder 排序
if relevant 为空 → 未验证

p* = latestOf(relevant)

# R3.4 优先级最高：无证据一律停在未验证，不看 completion
if p*.evidence 为空           → 未验证

# 否则按 completion 与 gate 判定
if p*.gate3_1 != "可证明"      → 未验证
if p*.completion == "100%"    → 已达成
if p*.completion ∈ {"0%"}     → 未达成
else                          → 部分达成
```

需要说明的三点：

1. **`gate3_1` 是必要条件**。需求方说"与 achievement 同源"，而 `achievement` 在 v3 文档里定义为"由最后进展的 gate3_1 + completion 推导"，所以这里必须一并检查，否则会出现"100% 但没有证据支撑可证明性"的假达成。
2. **`completion` 缺失**时落 `部分达成`，不落 `未验证`（已有证据说明在推进），但校验器会对缺失报 `E-WARN`。
3. **不做跨场景/跨指标求平均**。一个指标的达成与否是离散判断，平均值会掩盖真实差距。

### 4.4 其余派生字段（沿用现状，纳入同一脚本）

| 字段 | 公式 | 现状 |
|---|---|---|
| `gate0.missing` | 五个必填中为空的项（`tech_owner` 在顶层） | 已存在，30/30 无漂移 |
| `gate0.complete` | `missing.length === 0` | 已存在 |
| `priority` | 由 `amount_wan` + `poc_type` 推导（strategic / high / normal） | **当前 30/30 为 null，从未实现**，本次一并补齐 |

`priority` 的阈值放进 `config/rules.yaml`（与 `large_amount_wan` 同源），不要散落。

---

## 5. 核心裁决三：缺口规则从 12 条到 16 条

### 5.1 采纳 R13–R16

完全按需求方定义，编号 13–16，级别与判定见需求 §6.1。同时 `R8–R10` 保持不变（语义不同：它们看全局最新进展）。

### 5.2 必须裁决的问题：重复报警

R4/R5/R6 是**数量**规则，R13–R16 是**状态**规则。会叠加：

| 情形 | 会同时触发 | 用户看到 |
|---|---|---|
| `scenarios` 只有 2 个，且都没被引用 | R5（数量不足）+ R16（场景未开始） | 两条说同一件事 |
| `criteria` 只有 1 个，且未验证 | R4（数量不足）+ R15（指标未验证） | 同上 |
| 项目刚立项，场景 3 个都还没开始 | R16 × 1 | 新项目第一天就红 |

**建议方案（需拍板）：**

| 规则 | 处理 |
|---|---|
| R13（场景无证据，🔴） | **保留**。它会先在 `已有 progress` 前提下触发（需求方已加此前提），指向明确 |
| R14（待客户确认，🟡） | **保留**，级别降为 info，不计入"阻障"只进"待办建议" |
| R15（指标未验证，🟡） | 仅当 `criteria.length ∈ [2,3]`（数量合规）时才报，避免与 R4 叠加 |
| R16（场景未开始，🟡） | 仅当 `scenarios.length ∈ [3,5]` 且 `progress.length > 0` 时才报 |

理由：数量规则说的是"计划本身不合格"，状态规则说的是"计划合格但没推进"。**计划都不合格时，先修计划**，不必同时抱怨执行。

### 5.3 规则表同步

`config/rules.yaml` 里一次写全 16 条，含阈值与版本号；`poc-schema.md` 的规则表由它生成（或 CI 断言一致），杜绝第 3 份副本。

---

## 6. 目标数据模型 v3.1

### 6.1 字段总表（标注谁能写）

| 块 | 字段 | 类型 | 谁写 | 备注 |
|---|---|---|---|---|
| 顶层 | `schema_version` | string | 迁移脚本 | `"3.1"` |
| 顶层 | `poc_id` / `name` / `org.*` / `amount_wan` / `poc_type` | — | 人 | 不变 |
| 顶层 | `priority` | enum | **派生** | 本次补齐计算 |
| 顶层 | `owner` / `sales` / `tech_owner` / `exec_sponsor` | string | 人 | `tech_owner` 属身份区（R5.1） |
| 顶层 | `stage` / `status` / `stage_since` | enum/date | 人 | 升级时一并补 `gate_decisions[]` |
| 顶层 | `gate_decisions[]` | object[] | 人 | **本方案新增**，见 §6.2 |
| gate0 | `why_customer` / `why_us` / `decision_chain` / `post_poc_decision` / `competitor` | string | 人 | — |
| gate0 | `review.{conclusion,reviewer,reviewed_at}` | — | 人 | 建议补 `decided_by` |
| gate0 | `missing` / `complete` | — | **派生** | 已有 |
| plan | `customer_pain` / `expected_recognition` / `our_edge` | string | 人 | — |
| plan | `scenarios[]` | object[] | 人（`id/name/goal`）+ **派生**（`status/evidence_count/recognition`） | R1.1 |
| plan | `criteria[]` | object[] | 人（`id/name/metric/baseline/target`）+ **派生**（`status`） | R1.2 / R3.1 |
| plan | `risks[]` / `report_nodes[]` / `timeline.*` / `gate1` / `gate2` | — | 人 | 不变 |
| progress | `seq` / `date` / `type` / `goal` / `actual` / `completion` / `evidence[]` / `customer{}` / `gate3_1` / `gate3_2` / `next{}` | — | 人 | 不变 |
| progress | `scenario_ids[]` | `scn-NN`[] | 人 | **改名**（原 `items`），R1.4 |
| progress | `criteria_ids[]` | `cri-NN`[] | 人 | **新增**，R3.2 |
| progress | `change` | enum | 人 | **新增必填**，R4.1 |
| outcome | 全部 | — | 人 | 不变 |

### 6.2 新增 `gate_decisions[]`（本方案补充，需求方未提）

需求方没有覆盖"Gate 升级如何留痕"。而这正是便签里「AI 建议 → 人工审核 → 完成 Gate 升级」的落点。

```yaml
gate_decisions:
  - from: G0-立项
    to: G1-方案设计
    decided_at: 2026-11-22
    decided_by: 靳承德
    basis: agent-suggested        # human | agent-suggested
    signals_ref: signals/POC-006@9f3c1ab     # 采纳的那次建议
    note: 五必填补齐，客户确认进入方案设计
```

没有它，"升级"就只是把 `stage` 改了一个字符串；有了它，每次升级都能回答"谁拍的板、依据什么"。

### 6.3 `change` 必填与表单版本握手（R4.3 的实施前提）

需求方要求 `change` 必填。风险在于：**已导出到组员手里的 HTML 表单不会写这个字段**，回收后要么被判 schema 错误（体验差），要么被静默补值（数据失真）。

**方案：表单内嵌版本号，导入时握手。**

```
<!-- 生成的 HTML 内嵌 -->
<script>window.__POC_FORM__ = { form_schema: "3.1", ledger_schema: "3.1", exported_at: "..." }</script>
```

导入规则：

| 表单版本 | 行为 |
|---|---|
| `== 3.1` | 正常导入 |
| `< 3.1` | **拒绝导入**，提示"这是旧版表单，请用新版重新导出" |
| 缺 version 字段 | 按 `< 3.1` 处理（当前 0.9.0 生成的表单都属于此类） |
| 单条进展缺 `change` | 导入界面列出该条，要求人工选择后才允许提交 |

要点：**手改 YAML 也走同一条校验**。CI 与本地校验共用 `tools/derive.mjs --check`。

---

## 7. 版本号设计（R7.4 的扩展）

需求方只要一个 `schema_version`。建议做两层，但**只强制一层**：

| 层 | 位置 | 强制性 | 用途 |
|---|---|---|---|
| 仓库级 | `schemas/enums.yaml` 顶部 `schema_version: "3.1"` | **强制** | 唯一权威版本；插件读它决定兼容模式 |
| 项目级 | 每个 `projects/*.yaml` 的 `schema_version` | 强制（迁移时一次写全） | 支持将来逐项目灰度升级 |

之所以两层都要：仓库级解决"整体兼容判断"，项目级解决"半年后只迁移了 8 个项目"的中间态。

---

## 8. 目标仓库结构

```
projects/                    30 个人写台账（含派生缓存字段）
signals/                     ← 新增。agent 写、人只读的机器判断
schemas/
  poc-schema.md              字段定义（人读，由 rules.yaml 生成规则表）
  enums.yaml                 枚举 + schema_version
config/
  rules.yaml                 ← 新增。16 条规则 + 全部阈值的唯一源
  health.yaml                ← 新增。陈旧度阈值（事实/判断两层）
  derive.yaml                ← 新增。派生字段清单（哪些允许存、哪些只算不存）
tools/
  derive.mjs                 ← 新增。唯一计算器（确定性、无网络、无时钟）
  derive.test.mjs            ← 新增。分支覆盖测试
  validate.mjs               ← 新增。结构/枚举/必填/id 格式/旧字段检测
.github/
  workflows/verify.yml       ← 新增。三层校验
  ISSUE_TEMPLATE/daily.yml   ← 新增。每日巡检触发器格式
  PULL_REQUEST_TEMPLATE.md   ← 新增。必填：影响项目 / 规则命中
templates/
  daily-advisory.md          ← 新增。巡检 issue 正文
```

### 8.1 `config/rules.yaml` 草案（16 条）

```yaml
version: "3.2"                    # 规则版本，独立于 schema_version
thresholds:
  large_amount_wan: 300
  criteria:  { min: 2, max: 3 }
  scenarios: { min: 3, max: 5 }
  risks:     { max: 3 }
  stall_days: 45
priority:                         # priority 派生阈值
  strategic_wan: 1000
  high_wan: 300
rules:
  - { id: R1,  name: G0 五必填缺失,     level: high,   priority: 90 }
  - { id: R2,  name: 大金额未过 G0,     level: high,   priority: 94, uses: large_amount_wan }
  - { id: R3,  name: G0 通过无计划,     level: high,   priority: 92 }
  - { id: R4,  name: 成功标准不聚焦,    level: medium, priority: 50, uses: criteria }
  - { id: R5,  name: 场景不聚焦,        level: medium, priority: 48, uses: scenarios }
  - { id: R6,  name: 风险超限,          level: medium, priority: 46, uses: risks }
  - { id: R7,  name: G2 未就绪已开测,   level: high,   priority: 84 }
  - { id: R8,  name: 进展无证据,        level: high,   priority: 82 }
  - { id: R9,  name: 有证据无认可,      level: high,   priority: 80 }
  - { id: R10, name: G3-1 无 G3-2,      level: high,   priority: 78 }
  - { id: R11, name: 达成无下一步,      level: high,   priority: 96 }
  - { id: R12, name: 阶段停滞,          level: medium, priority: 40, uses: stall_days }
  - { id: R13, name: 场景无证据,        level: high,   priority: 88, guard: requires-progress }
  - { id: R14, name: 场景待客户确认,    level: info,   priority: 30 }
  - { id: R15, name: 指标未验证,        level: medium, priority: 44, guard: criteria-in-range }
  - { id: R16, name: 场景未开始,        level: medium, priority: 42, guard: scenarios-in-range-and-progress }
```

### 8.2 `config/derive.yaml` 草案

```yaml
# 只有列在这里的字段允许被工具写回；其余字段工具只读
stored:
  - gate0.missing
  - gate0.complete
  - priority
  - plan.scenarios[].status
  - plan.scenarios[].evidence_count
  - plan.scenarios[].recognition
  - plan.criteria[].status
computed_only:                    # 依赖时间或外部状态，永不写回
  - R12-stalled-days
  - health.facts_stale_days
  - health.judgment_stale_days
forbidden_in_stored:              # 派生字段里留时间戳会破坏幂等
  - timestamp
  - generated_at
  - updated_at
```

### 8.3 `schemas/enums.yaml` 新增

```yaml
schema_version: "3.1"

scenario_status: [已证明, 待客户确认, 无证据, 未开始]
criteria_status: [已达成, 部分达成, 未达成, 未验证]
progress_change: [阶段推进, 场景新增, 目标调整, 证据补充, 风险出现, 风险解除, 无实质进展]
```

---

## 9. 与两侧的接口

### 9.1 与看板插件

| 接口 | 契约 |
|---|---|
| 版本协商 | 读 `schemas/enums.yaml` 的 `schema_version`；`3.0` 走降级只读，`3.1` 走完整功能 |
| 派生字段 | 插件**必须**能自行计算（不依赖存储值），存储值仅用于 drift 检查 |
| 旧字段 `items` | 视为无场景关联，不猜测、不报错（但导出表单侧必须升级） |
| 缺字段降级 | `signals/` 或新派生字段缺失时不得整页打空 |

### 9.2 插件侧耦合清单（补需求方 §10 未列出的 3 处）

需求方列了 `src/types.ts:113/462`、`src/form.ts` 多处、`src/gap.ts:199-201`。**实测补充三处：**

| 位置 | 问题 | 为何需求方漏了 |
|---|---|---|
| `src/client/detail.tsx:390-393` | 渲染 `entry.items` 为 chip 列表 | 这是**视图层**用法，与 `form.ts` 的读写是两条路径 |
| `src/form.ts:393` | `compact(entry.items).length === 0` 用于判定"空进展"是否跳过序列化 | 若改名为 `scenario_ids` 而这里未改，会把**每条进展都当空**而丢弃 |
| `src/form.ts` 内嵌 JS（`:1086-1088`） | 在生成的 HTML 里序列化 `items` | 需同时加入 `change` 必选校验与 `form_schema` 版本号（见 §6.3） |

第二处是最危险的：它不会报错，只会**静默丢掉数据**。

### 9.3 与 SuperAgent

| 事项 | 契约 |
|---|---|
| 计算 | agent **不手算**状态；调用 `node tools/derive.mjs --write` 后提 PR |
| 判断 | agent 只写 `signals/<poc_id>.yaml`，字段见会话二范程 §1.3 |
| 幂等 | 分支固定 `advisory/daily`；`derive` 输出无变化则**不提 PR** |
| 准入 | `skillre-q` 必须加入 GitHub Source 的 bots 名单（否则定时巡检永远 `received: 0`） |
| 规则 | agent 读 `config/rules.yaml`，不内嵌规则文本 |

---

## 10. 实施里程碑

| 步骤 | 内容 | 产出 | 验收 | 依赖 |
|---|---|---|---|---|
| **M1** | `tools/derive.mjs` + 测试 | 唯一计算器 | 16 条规则 + 7 个派生字段的分支覆盖；同一输入两次运行字节相同 | — |
| **M2** | `config/rules.yaml` + `health.yaml` + `derive.yaml` | 阈值单一源 | 改阈值只改一处 | M1 |
| **M3** | schema 迁移（30 文件） | `schema_version: 3.1` + `priority` 补齐 | `derive --check` 对 30 个文件全部通过 | M1–M2 |
| **M4** | `tools/validate.mjs` + `.github/workflows/verify.yml` | 三层门禁 | 故意造 6 类错误（旧 `items`、缺 `change`、重复 id、枚举越界、派生漂移、signal 越权提交）全部被拒 | M3 |
| **M5** | 文档同步（`poc-schema.md`、`enums.yaml`、README 治理声明） | 文档一致 | 规则表与 `rules.yaml` 由 CI 断言一致 | M2 |
| **M6** | SuperAgent 侧接线（bots 名单、两条规则、两个技能、launchd） | 闭环 | 手动造 `[daily-advisory]` issue → `signals/*` 落盘 → PR 出现 | M4 + 老 Mac 可达 |

**M1–M5 全部不依赖老 Mac**，当前即可开工。

### 10.1 生效顺序（关键）

需求 §10 说"台账仓库先合、插件后跟"，但 R1.4 是破坏性变更。实际建议：

| 批次 | 内容 | 兼容性 | 说明 |
|---|---|---|---|
| **A 批** | 新增枚举、新增 `config/`、新增 `tools/`、`schema_version`、`scenarios`/`criteria` id 结构 | **向后兼容**（字段为空） | 可立即合，插件无感 |
| **B 批** | `items` → `scenario_ids`、`criteria_ids`、`change` 必填、派生字段写回 | **破坏性** | 与插件同发版；因 `progress` 全空，实际风险为零 |

**B 批的生效版本号定为 `3.1`**（需求 R1.4 要求给明确版本号）。插件在读到 `schema_version: "3.1"` 且自身未升级时，应提示"数据源已升级，请更新插件"，而不是静默读错。

---

## 11. 风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| 仓库无分支保护（实测 403） | `skillre-q` 可直推 main，绕过 PR | v1 接受，CI 红灯 + README 明示；三条出路见会话二范程 §5.2 |
| `form.ts:393` 漏改 | **静默丢数据** | 列为 B 批必检项，补一条"改名后表单往返"测试 |
| 派生字段写入时间戳 | 每天无意义 diff，幂等失效 | `derive.yaml` 的 `forbidden_in_stored` + CI 断言 |
| 场景状态来回跳 | 看板状态点闪烁、R14 反复亮红 | §4.2 单调性规则 |
| 旧表单回收 | 静默补值导致数据失真 | §6.3 版本握手，旧表单拒绝导入 |
| `priority` 阈值主观 | 排序误导优先级 | 阈值进 `rules.yaml`，可调；且明确"priority 只是排序提示，不是决策" |

---

## 12. 需要拍板的五件事

| # | 问题 | 建议 |
|---|---|---|
| 1 | 派生字段由**确定性脚本**算，agent 不算？ | **是**。LLM 只做 `signals/` 的建议，脚本做状态机 |
| 2 | 场景状态是否引入**单调性**（已证明不因例行周报回退）？ | **是**，否则 R14 会反复亮红 |
| 3 | R15/R16 是否加"数量合规"前置条件，避免与 R4/R5 叠加？ | **是**，先修计划再谈执行 |
| 4 | 是否新增 `gate_decisions[]`（需求方未提）？ | **是**，它是便签里"人工审核后升级"的落点 |
| 5 | B 批（破坏性变更）生效版本号定为 `3.1`，与插件同发版？ | **是**，`progress` 全空，风险为零 |
