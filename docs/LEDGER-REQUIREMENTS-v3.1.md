# 台账仓库（skillre/workbranch）补充需求

> 提出方：看板插件 `dsh-plugin-work-dashboard` 的优化会话
> 目标：让 v3 数据模型能支撑详情页的「两层信息架构」
> 状态：待实施。实施完成后再优化看板插件。

---

## 0. 背景与约束

看板插件决定了详情页要做成**两层结构**：

- **第一层（总览，常驻首屏）**：Gate0 契约 · 关键成功指标 · 关键测试场景（带状态点） · 关键风险 · 项目进展（概括性时间线） · 下一步
- **第二层（下钻）**：点进某个场景，看证据、客户反馈、G3 判定

第一层要能一眼看出「哪个场景还没证明」，所以**状态必须能在场景层聚合**，
而不是只在 `progress[]` 的最新一条上。这是本需求的根本来由。

**实施范围**：`schemas/poc-schema.md`、`schemas/enums.yaml`、`projects/*.yaml`。

---

## 1. 场景与指标改为对象（带稳定 id）

### 现状

```yaml
plan:
  scenarios: []      # string[]
  criteria:  []      # 但 schema 文档里 criteria 是对象数组
```

### 问题

- `scenarios` 是纯字符串，**没有 id**，证据无法可靠挂靠。
- `progress[].items` 用**场景名字符串**匹配场景。场景改一个字对应关系就断。
- `criteria` 在 schema 文档里被定义成对象（`name/metric/baseline/target`），
  但 `progress` 里没有字段引用它，判定结果无处落地。

### 需求

**R1.1** `plan.scenarios` 改为对象数组，每项必须有稳定 `id`：

```yaml
plan:
  scenarios:
    - id: scn-01
      name: 办公网远程接入
      goal: 5000 人并发下成功率 ≥ 99.5%，稳定运行 7 天
    - id: scn-02
      name: 出差移动接入
      goal: 弱网环境下接入成功率 ≥ 95%，首包 < 3s
```

- `id` 格式 `scn-NN`，**项目内唯一、创建后不可变更**（改名可以，改 id 不可以）。
- `name` 可改；`goal` 为该场景的成功目标。

**R1.2** `plan.criteria` 保持对象数组，并补 `id`：

```yaml
plan:
  criteria:
    - id: cri-01
      name: 5000 人并发接入稳定运行
      metric: 成功率
      baseline: null
      target: ">=99.5%"
```

**R1.3** `criteria` 与 `scenarios` 保持**完全独立**，两者之间不建立任何关联字段。
（已明确定论：它们各自独立，不互为引用。）

**R1.4** `progress[].items` **改名为 `scenario_ids`**，内容为场景 id 列表（一步到位，不留兼容层）：

```yaml
progress:
  - seq: 3
    scenario_ids: [scn-01, scn-02]
```

**这是破坏性变更，不是渐进迁移。** 要求：

- 字段名由 `items` 改为 `scenario_ids`，**不保留 `items` 别名**。
- 内容只接受 `scn-NN` 形式的 id，**不接受场景名、不接受 id/字符串混用**。
- 读到 `items` 旧字段时应视为**无场景关联**（不报错、不猜测），
  或在校验脚本中直接判为 schema 错误 —— 实施时二选一，建议后者，强制清理。

> **影响面（插件侧已实测）**：`items` 在本插件有 3 处真实引用，改名后插件必须同步改：
> - `src/types.ts:113`（原始 YAML 类型）、`src/types.ts:462`（视图类型）
> - `src/form.ts:70, 231, 393, 405, 1086-1088`（导出表单的读写与序列化）
>
> 由于 `progress` 当前 30/30 全空，**本次改名没有存量数据代价**，
> 但会**打断已发出的导出表单**。请给出一个明确的生效版本号，
> 便于插件在导入旧表单时给出提示，而不是静默写错。

---

## 2. 场景级判定结果（本次最核心的新增）

### 为什么必须新增

现状只有 `progress[].gate3_1 / gate3_2 / evidence / customer.recognition`，
它们挂在**某一条进展**上，且台账只认**最新一条**。这导致：

1. 场景 A 早已证明、场景 B 毫无证据时，**无法在总览上分别显示**。
2. 详情页第一层想显示「哪个场景没证明」，只能逐条翻进展手工推断。

### 需求

**R2.1** 新增**派生字段** `plan.scenarios[].status`（**由工具自动计算，不手填**）：

```yaml
plan:
  scenarios:
    - id: scn-01
      name: 办公网远程接入
      goal: ...
      status: 已证明          # 自动算
      evidence_count: 3       # 自动算
      recognition: 已确认      # 自动算
```

枚举 `scenario_status`（新增到 `enums.yaml`）：

```yaml
scenario_status:
  - 已证明        # 有证据 且 客户已确认
  - 待客户确认     # 有证据 但 recognition 为 待确认/部分认可
  - 无证据        # 该场景尚无任何证据
  - 未开始        # 场景还没被任何进展引用过
```

**R2.2 计算规则**（对每个场景 `scn-XX`）：

```
相关进展 = { p ∈ progress | scn-XX ∈ p.scenario_ids }

未开始   : 相关进展为空
无证据   : 相关进展非空，但所有相关进展的 evidence 均为空
待客户确认: 存在相关进展有 evidence，但其中最新一条的 customer.recognition ∉ {认可, 已确认}
已证明   : 存在相关进展有 evidence，且最新一条的 recognition ∈ {认可}
```

- `evidence_count` = 所有相关进展的 evidence 条数之和。
- 判定取**该场景相关进展中最新的一条**，不是全局最新一条。

**R2.3** 该字段**必须**由工具计算后写回 YAML（与现有 `gate0.missing` /
`gate0.complete` / `priority` 的处理方式保持一致 —— 那些也是自动算的）。

---

## 3. 指标级判定结果

**R3.1** 新增派生字段 `plan.criteria[].status`：

```yaml
criteria:
  - id: cri-01
    name: 5000 人并发接入稳定运行
    metric: 成功率
    baseline: null
    target: ">=99.5%"
    status: 未验证        # 自动算
```

枚举 `criteria_status`：

```yaml
criteria_status:
  - 已达成
  - 部分达成
  - 未达成
  - 未验证
```

**R3.2** 当前 schema **没有任何字段**能把「某条进展」关联到「某个指标」。
**已决定采纳方案 A**：新增 `progress[].criteria_ids`（对称于 `scenario_ids`）：

```yaml
progress:
  - seq: 3
    scenario_ids: [scn-01]
    criteria_ids: [cri-01, cri-03]
```

**R3.3** `criteria[].status` 为**派生字段，工具自动计算**（不接受手工填写覆盖）：

```
相关进展 = { p ∈ progress | cri-XX ∈ p.criteria_ids }

未验证 : 相关进展为空
其余   : 取相关进展中最新一条的 outcome 推导结果
         （与 achievement 同源：由 completion + gate3_1/gate3_2 推导）
```

**R3.4** 若某条进展的 `criteria_ids` 非空，但该进展没有证据，
对应指标**必须停在「未验证」**，不得因 `completion` 较高而判为「已达成」。

**R3.5** `criteria_ids` 与 `scenario_ids` **互不推导**：一条进展可以只关联指标、
不关联场景，反之亦然。两者都不要求非空（允许只写概括性进展）。

---

## 4. 进展的「变化标记」

### 为什么

详情页第一层的「项目进展」按你的定义是**概括性进度更新**。概括性记录最大的
退化成因是每期都写「与客户沟通顺畅」，看不出动没动。需要在数据结构上留一个
**离散的变化类型**，让时间线能显示「这一次相比上一次什么变了」。

### 需求

**R4.1** 新增 `progress[].change`（必填，枚举）：

```yaml
progress:
  - seq: 4
    date: 2026-10-16
    type: 客户阶段同步
    change: 证据补充          # 新增
    goal: ...
```

枚举 `progress_change`（新增到 `enums.yaml`）：

```yaml
progress_change:
  - 阶段推进
  - 场景新增
  - 目标调整
  - 证据补充
  - 风险出现
  - 风险解除
  - 无实质进展
```

**R4.2** `无实质进展` 是**显式允许**的值 —— 允许写「这周没动」，比逼人写空话好。

**R4.3（已决定）`change` 为必填字段。** 缺省视为 schema 错误，由校验脚本拒绝。

- 既有 30 个项目的 `progress` 全为空，**无存量补填成本**。
- 插件侧导出表单需同步把 `change` 设为必选项
  （对应 `src/form.ts` 的 progress 区块）。
- 若确需导入历史空值，**只允许**在校验时一次性补为 `无实质进展` 并标注来源，
  不接受长期可空。

---

## 5. `tech_owner` 归属澄清

schema 文档第 57 行写的是：

```
五必填：why_customer / why_us / decision_chain / tech_owner（在身份区）/ post_poc_decision
```

但 YAML 里 `tech_owner` 在**顶层**（与 `owner`/`sales` 同级），不在 `gate0` 下。
实际看板第一层把它当身份区字段展示。

**R5.1** 请确认并统一：`tech_owner` 归属身份区（顶层），
把 schema 文档 §② gate0 的「五必填」描述改为指向顶层字段，避免读者误以为在 `gate0` 内。

---

## 6. 缺口规则需要扩展

### 现状

R8/R9/R10 **只看最新一条进展**。这在一层结构下够用，但两层结构下不够：
场景 B 完全无证据，只要最新一条进展属于场景 A 且证据齐全，就**不会报警**。

### 需求

**R6.1** 新增规则（编号接在现有 12 条之后）：

| # | 规则 | 判定 | 级别 |
|---|---|---|---|
| 13 | 场景无证据 | 存在 `scenarios[].status == 无证据` 且该项目已有 progress | 🔴 |
| 14 | 场景待客户确认 | 存在 `scenarios[].status == 待客户确认` | 🟡 |
| 15 | 指标未验证 | `criteria` 非空 且 存在 `status == 未验证` | 🟡 |
| 16 | 场景未开始 | `scenarios` 非空 且 存在 `status == 未开始` | 🟡 |

**R6.2** R13–R16 对**空列表不触发**（与现有 R4–R6 的处理一致），
避免新项目第一天就报一堆。

**R6.3** 现有 R8–R10 **保持不变**（它们检查的是全局最新进展，语义不同，不冲突）。

---

## 7. 文档与工具同步

**R7.1** `schemas/poc-schema.md` 更新：
- `criteria` / `scenarios` 结构改为对象 + id
- 补充 `scenario_status` / `criteria_status` / `progress_change` 三个枚举说明
- 缺口规则表补到 16 条
- 修正 §② 五必填里 `tech_owner` 的归属描述

**R7.2** `schemas/enums.yaml` 新增三个枚举（见 R2.1 / R3.1 / R4.1）。

**R7.3** 若仓库里有校验脚本 / JSON Schema / 迁移脚本，需同步：
- 现有 30 个项目的 `scenarios: []` / `criteria: []` 是空数组，**迁移安全**，
  不需要逐个项目改数据。
- `progress` 全为空，`items` 的 id 化**暂无存量负担**。

**R7.4** 建议提供一个 `schema_version: 3.1` 顶层字段，便于看板做兼容判断。

---

## 8. 现状数据勘察结果（供实施参考）

在 `projects/` 30 个文件中实测：

| 项 | 结果 |
|---|---|
| `stage` | **30/30 全部为 `G0-立项`** |
| `plan.scenarios` | 30/30 为空数组 |
| `plan.criteria` | 30/30 为空数组 |
| `progress` | 30/30 为空数组 |
| 最新提交 | `2026-11-16`，PR #8 `import/poc-sync-20261115185304` |

**含义**：

1. 本次需求涉及的结构变更**没有存量数据迁移成本**（相关字段全空）。
2. 但这也意味着**详情页当前的实际形态就是「全空态」**——
   看板优化必须先保证空态可读，再谈第二层下钻的视觉。
3. G3/G4 的展示在真实数据出现前无法验证，插件侧需要构造测试夹具。

---

## 9. 优先级建议

| 优先级 | 需求 | 理由 |
|---|---|---|
| **P0** | R1.1 场景 id 化 | 没有稳定 id，证据无法可靠聚合，两层结构不成立 |
| **P0** | R1.4 `items` → `scenario_ids` | **破坏性变更**，需与插件同步发版；存量数据为空，代价低 |
| **P0** | R2.1 / R2.2 场景级判定 | 第一层的状态点直接依赖它 |
| **P1** | R6 缺口规则扩展 | 决定「能不能一眼看出哪个场景卡住」 |
| **P1** | R4 变化标记 | 概括性进展不退化的前提 |
| **P1** | R3 指标级判定（含 `criteria_ids`） | **已确定要做**；与 R1.4 同批改，避免两次破坏性变更 |
| **P2** | R5 tech_owner 澄清 | 文档一致性问题，不影响功能 |
| **P2** | R7.4 schema_version | 便于看板做版本兼容 |

---

## 10. 不在本需求范围

以下属于看板插件侧的工作，**不需要台账仓库做任何事**：

- 两层结构的视觉与交互
- 颜色规范、字号、栅格、空态样式
- 阶段自适应（G0–G4 版面变化）
- 下钻页的布局

这些会在台账仓库实施完成后，在插件仓库内单独进行。

**但以下插件侧改动与本次 schema 变更强耦合，必须在同一个发版周期内完成**：

| 插件位置 | 需要跟着改 |
|---|---|
| `src/types.ts:113` / `:462` | `items` → `scenario_ids`，新增 `criteria_ids`、`change` |
| `src/form.ts:70,231,393,405,1086-1088` | 导出表单的 progress 区块：字段改名 + `change` 必选 |
| `src/form.ts:117,201,355` | `scenarios` 由 `string[]` 改为对象数组 |
| `src/gap.ts:199-201` | R5 场景计数逻辑适配对象数组；新增 R13–R16 |

建议：台账仓库先合入 schema 变更并给出 `schema_version: 3.1`，
插件在一次发版内同时支持 3.0（只读降级）与 3.1（完整功能）。
