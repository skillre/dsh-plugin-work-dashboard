# 看板文本显示不全：审计与优化方案

> 用户截图指出：`Gate 0 · 关键信息区` 里「客户为什么测」「我们为什么测」两段论证
> 显示到一半就被截断，末尾是省略号，读不全。
>
> **状态：已实施**（2026-11-20）。§7 的五项待拍板事项按建议全部采纳，见 §11 实施记录。
>
> 本文回答三件事：
> 1. 到底有多少处截断、各自截掉了什么（§1）
> 2. 哪些是设计意图、哪些是事故（§2–§3）
> 3. 怎么改、改完什么样、代价多大（§4–§6）

---

## 0. 先说结论

截图暴露的不是一处样式 bug，而是**一个统一的截断策略被套用在了性质不同的文本上**。

全库 23 处文本截断，其中 **14 处是合理的**（名称、标签、图例——本来就该一行），
**9 处是内容截断**。这 9 处里：

- **2 处是死代码**（`dim-card-value` 所在的四维区块整块从未挂载，见 §7.2）
- **7 处真实生效**，其中 **1 条规则（定义了两次）截的是「论证正文」**
  ——`why_customer` / `why_us`，这是台账里信息密度最高的字段，也是最不该被截的字段

用真实台账量过之后，问题的严重程度是：

| 指标 | 实测值 |
|---|---|
| 非空论证字段（`why_customer` / `why_us`） | 21 个 |
| 当前 400px 半宽 + `clamp 3` 下被截断 | **13 个 = 62%** |
| 被隐藏的总行数 | **52 行** |
| 单个字段最多被藏 | **7 行**（该字段共 10 行，只露出 3 行 = 藏掉 70%） |
| 含段落换行、但被 `white-space:normal` 吞掉的字段 | **15 个 = 71%** |
| 受影响项目数 | **10 / 30 = 33%** |

也就是说：**三分之一的项目，打开详情页第一屏就有读不完的论证，而且没有任何提示。**

---

## 1. 全量截断清单

扫描 `src/client/css/` 全部 7 个样式模块，共 23 处：

| 文件 | 选择器 | 方式 | 判定 |
|---|---|---|---|
| `charts.ts` | `.segbar-label` | ellipsis | ✅ 合理（图表分段标签） |
| `charts.ts` | `.donut-legend-label` | ellipsis | ✅ 合理（图例） |
| `charts.ts` | `.barlist-label` | ellipsis | ✅ 合理（条形图标签） |
| `charts.ts` | `.barlist-note` | ellipsis | ✅ 合理（条形图附注） |
| `summary.ts` | `.kpi-label` | ellipsis | ✅ 合理（KPI 标题） |
| `summary.ts` | `.kpi-note` | ellipsis | ⚠️ 可议（KPI 附注会带阈值说明） |
| `summary.ts` | `.kpi-stages-summary` | ellipsis | ✅ 合理 |
| `summary.ts` | `.budget-org-name` | ellipsis | ✅ 合理（机构名） |
| `summary.ts` | `.stage-progress-label` | ellipsis | ✅ 合理（阶段名） |
| `overview.ts` | `.pcard-name` | clamp 2 | ⚠️ 实测 0/30 被截，安全 |
| `overview.ts` | `.pcard-org` | ellipsis | ✅ 合理 |
| `overview.ts` | `.pcard-dim-label` | ellipsis | ✅ 合理 |
| `overview.ts` | `.pboard-card-name` | clamp 2 | ⚠️ 实测 0/30 被截，安全 |
| `overview.ts` | `.pboard-card-progress` | ellipsis | ❌ **内容截断** |
| `overview.ts` | `.pcard-progress-copy` | clamp 2 | ❌ **内容截断** |
| `overview.ts` | `.progress-summary` | clamp 2 | ❌ **内容截断** |
| `overview.ts` | `.pf-note` | clamp 2 | ⚠️ 分析结论被截 |
| `overview.ts` | `.project-id` | ellipsis | ✅ 合理（ID） |
| `detail.ts` | `.g0-card[data-prose] .g0-card-body` | clamp 3 | ❌ **事故：截论证正文** |
| `detail.ts` | `.g0-card[data-prose] .g0-card-body`（第 633 行，重复定义） | clamp 3 | ❌ 同上，且整条是**逐字重复** |
| `detail.ts` | `.dim-card-value` | clamp 2 | 💀 死规则（见 §7.2） |
| `detail.ts` | `.dim-grid-detail .dim-card-value` | clamp 3 | 💀 死规则（同上） |
| `detail.ts` | `.dim-mini-label` | ellipsis | ✅ 合理（四维简写） |

**关键发现：`.g0-card-body` 这条规则在 `detail.ts` 里定义了两次**
（第 104 行、第 633 行），两个副本完全一致。后一份位于文件末尾一段
85 行的「v3.1 layout」重复区块里，其中 36 条选择器是前文已有规则的逐字复制。
纯重复，没有任何覆盖意图。

---

## 2. 截图那一处的成因：三个缺陷叠加

用户截图里看到的现象是「显示不全」，但拆开看是**三个独立缺陷**共同造成的，
只修其中一个都不会真正解决。

### 2.1 缺陷一：`clamp 3` 截断（显性）

```css
/* src/client/css/detail.ts:104、633 */
.g0-card[data-prose="true"] .g0-card-body {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

半宽卡片内容宽约 **400px**，11px 字号下 CJK 约 **36 字/行**，3 行 ≈ 108 字。
而台账里 `why_us` 的中位数是 **147 字**，最长的 230 字（POC-009）。

所以「3 行」这个阈值**从第一天起就是不够的**——不是偶发越界，是结构性不足。

### 2.2 缺陷二：`white-space:normal` 吞掉换行（隐性，更严重）

`.g0-card-body` 没有设 `white-space`，默认 `normal`，**连续换行被折叠成一个空格**。

台账里 21 个非空论证字段中有 **15 个（71%）带段落换行**。例如 POC-006 的
`why_us` 原文是：

```
为什么测试：
1. 把上网行为管理设备品类持续把握在深信服的生意范围内
2. 消除分公司对深信服上网行为管理的使用满意度问题

下一步动作和目标：
1. 在全国范围内寻找典型分公司，消除分公司对设备性能影响的抱怨
2. 完成面向总公司立项的必要测试工作
3. 完成总部公司的信创上网行为管理立项
```

字段的语义是**两层结构**（「为什么测试」+「下一步动作和目标」），三条序号
分别归属。渲染出来变成：

> 为什么测试： 1. 把上网行为管理设备持续把握在深信服的生意范围内 2. 消除分公司
> 对深信服上网行为管理的使用满意度问题 下一步动作和目标： 1. 在全国范围内寻找…

序号和内容分离，两个标题塌进正文里，**「下一步动作和目标」这层结构完全消失**。
即使把 `clamp` 去掉，这段仍然是糊在一起的。

> 对比：`base.ts:339` 的 `.prose` 类**已经**设了 `white-space: pre-wrap`。
> 也就是说正确的规则已经存在，只是 `gate0` 卡片没有用它。

### 2.3 缺陷三：截断没有任何提示

`-webkit-line-clamp` 是**静默截断**——不加省略号，不给展开按钮，
`scrollHeight` 也读不到（见 §4.4 实测）。读者唯一能察觉的信号，
是截图里那个 `…` 或者读到一半句子断了。

一个 `G0 不齐` 的区块，却让人看不出自己读到的是**完整论证**还是**被砍掉的片段**，
这比不显示更糟。

---

## 3. 为什么说这是事故而不是设计意图

三条证据：

**① `data-prose` 这个属性本身就是为「长文本」准备的。**
`G0_PROSE = new Set(['why_customer', 'why_us'])` —— 作者明确知道这两个字段是叙述性长文，
单独打上标记。但标记之后给的样式是 `clamp 3`，等于「我知道它长，所以我砍掉它」。

**② 详情页自己的设计文档写的是完整阅读。**
`DESIGN-0.3.md:21`：「详情页是分层阅读，不是字段抄写」；
`DETAIL` 的定位是「打开这个项目，读完它」。截断 70% 的论证与这个定位直接矛盾。

**③ 台账 schema 没有长度上限。**
`poc-schema.md` 对这两个字段没有任何字数约束，导出表单的
`textarea` 也没有 `maxlength`。作者写多少就该显示多少。

---

## 4. 关键实测数据

以下全部用**真实台账文本 + 真实 CSS**，在 headless Chrome 里量的，
不是估算。

### 4.1 各宽度下的行数

| 宽度 | 一行字数（11px CJK） | 最长字段行数 | 中位行数 | `clamp 3` 会截断 |
|---|---|---|---|---|
| 268px（1024 视口） | 24 | 12 | 6 | 15 / 21 = 71% |
| 318px（1180 视口） | 28 | 10 | 6 | 15 / 21 = 71% |
| **400px（1440 视口，当前）** | **36** | **10** | **5** | **13 / 21 = 62%** |
| 864px（占满左栏） | 78 | 8 | 3 | 3 / 21 = 14% |

### 4.2 CJK 舒适行长

排版常识：CJK 正文一行 **25–40 字**读起来最顺。对照上表：

- **400px / 36 字/行 → 在舒适区内**，宽度本身没问题
- 864px / 78 字/行 → 明显过宽，眼睛回扫距离太长

**这直接否掉了「让论证占满整行」的方案。** 详见 §5。

### 4.3 各方案对区块高度的影响（30 个真实项目全量渲染）

| 方案 | 区块高度中位 | 最大 | 相对现状 |
|---|---|---|---|
| 现状（clamp 3） | 240px | 272px | — |
| A 占满整行 + 不截断 | 453px | **597px** | **+213 / +325** |
| B 占满整行 + clamp 6 | 453px | 565px | +213 / +293 |
| C 半宽 + 不截断 | 240px | 368px | **+0 / +96** |

方案 C 在**中位数项目上零成本**——因为 19/30 项目的论证本来就不超 3 行。
只有论证确实很长的 10 个项目中位 +100px 左右。

### 4.4 为什么不能「自动判断是否截断」再去掉省略号

`-webkit-line-clamp` 的实测行为（headless Chrome）：

```
clamp 3 时：clientHeight = 48（3 行）
            scrollHeight = 592（全文 37 行）
```

`scrollHeight` **确实反映全文高度**，所以理论上可以测量。
但这需要 `useEffect` + `ResizeObserver` 去比对，会引入：

- 首帧闪烁（先渲染全文再收回，或先空白再撑开）
- 每个卡片一个测量器，30 个项目的列表页会累积开销
- jsdom 里 `scrollHeight` 恒为 0，**8 个现有测试会失去意义**

**结论：能用 CSS 解决的不要用 JS 解决。** 见 §5 方案 C。

---

## 5. 三个候选方案

三个方案都已经用真实 CSS + 真实台账文本渲出对照图。

![三个方案的直观对比：A 占满整行但行宽 78 字，B 加了兜底但把截断带回来，C 保持半宽并恢复段落结构](evidence/text/02-variants.png)

对照现状与方案 C 的直接差异：

![现状与方案 C 的并排对比：左边 clamp 3 行截断约 70%，右边全文可见且保留分段](evidence/text/01-clamp-vs-full.png)

### 方案 A：论证字段占满整行

```
┌──────────────────────────────────────────────┐
│ 客户为什么测                                  │
│ 客户内部在2027年有明确的信创改造要求…          │  864px / 78 字/行
├──────────────────────────────────────────────┤
│ 我们为什么测 + 下一步                         │
│ 为什么测试：                                  │
│ 1. 把上网行为管理设备品类…                    │
├───────────────────────┬──────────────────────┤
│ 测后客户决策  缺失     │ 项目流程/决策链  缺失 │
└───────────────────────┴──────────────────────┘
```

| | |
|---|---|
| ✅ | 最长字段 8 行全部可见 |
| ❌ | **78 字/行，超出 CJK 舒适区近一倍**，读长论证会串行 |
| ❌ | 区块高度 **+213px（中位）/ +325px（最大）**，G0 挤压下方所有区块 |
| ❌ | 论证和短字段混排会破坏 2×3 网格的秩序感 |

**否决理由：把「读不全」换成了「读不进去」。** 行宽问题比截断更难察觉、
更难修正，而且区块膨胀的代价是全局的。

### 方案 B：占满整行 + `clamp 6`

方案 A 加一道兜底。但：

| | |
|---|---|
| ✅ | 比 A 矮一点（最大 565px vs 597px） |
| ❌ | 仍然 78 字/行 |
| ❌ | 实测 `clamp 6` 只对 2 个字段生效（8 行 → 6 行），**兜底几乎不起作用，却重新引入了静默截断** |

**否决理由：付出了 `clamp` 的全部代价，只换来 32px。**

### 方案 C：保持半宽，补 `pre-wrap`，去掉 `clamp` ★ 推荐

```
┌───────────────────────┬──────────────────────┐
│ 客户为什么测           │ 我们为什么测 + 下一步 │
│ 客户内部在2027年有…    │ 为什么测试：          │  400px / 36 字/行
│                       │ 1. 把上网行为管理…    │
│ 全国分公司对过去…      │ 2. 消除分公司对…      │
│                       │                       │
│ 全国还存在部分省…      │ 下一步动作和目标：    │
│                       │ 1. 在全国范围内寻找…  │
└───────────────────────┴──────────────────────┘
```

| | |
|---|---|
| ✅ | 36 字/行，**本来就在舒适区**，一个字都不用动 |
| ✅ | 段落结构恢复，「为什么测试 / 下一步」两层看得见 |
| ✅ | 最长字段 10 行全部可见 |
| ✅ | 区块高度 +0（中位）/ +96（最大），**代价最小** |
| ✅ | 纯 CSS 改动，无 JS、无 ResizeObserver、无首帧闪烁 |
| ✅ | 复用已有的 `.prose` 类，不新增概念 |

**唯一代价**：POC-006 这类论证很长的项目，G0 区块从 272px 涨到 352px（+80px）。
考虑到底下紧跟着的是「成功指标」「验证场景」——本来也都是空状态——
这个空间花得值。

### 5.4 卡片等高：`stretch` vs `start`

去掉 `clamp` 后，同一行两张卡若一段长一段短，默认 `stretch` 会让短卡底部
留一块空白（`02` 证据图上半部分）。加一条 `align-items: start` 让卡片各自
贴合内容高度，视觉更紧凑（下半部分）。

**建议采用 `align-items: start`。**

---

## 6. 实施细节

### 6.1 改动清单（4 个文件）

```diff
--- a/src/client/css/detail.ts
+++ b/src/client/css/detail.ts

 /* 第 100-105 行附近 */
 .wd-shell .g0-card-body {
   margin: 0; font-size: 11px; line-height: 16px;
-  color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere;
+  color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere;
+  white-space: pre-wrap;
 }
-.wd-shell .g0-card[data-prose="true"] .g0-card-body { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
+/* 论证正文不截断：台账里这些字段是两三层结构的叙述，截断会吃掉语义。
+   pre-wrap 由 .g0-card-body 统一提供，此处只把论证的排版加重一级。 */
+.wd-shell .g0-card[data-prose="true"] .g0-card-body {
+  font-size: 11.5px; line-height: 17px;
+  color: var(--dsw-alias-label-primary);
+}
+
+/* 论证很长时，让同行两张卡各自贴合内容，不留内部空白。 */
+.wd-shell .g0-grid { align-items: start; }

 /* 文件末尾 85 行重复区块中的 632-634 行：整段删除 */
-.wd-shell .g0-card-body { margin: 0; font-size: 11px; ... }
-.wd-shell .g0-card[data-prose="true"] .g0-card-body { display: -webkit-box; ... }
-.wd-shell .g0-card-body[data-empty="true"] { font-style: italic; ... }
```

同时删除 `detail.ts` 末尾的**整段 85 行重复区块**——这 85 行里 36 条选择器是
前文规则的逐字复制（含本项目要修的 `clamp` 规则本身）。保留的只有 9 条
真正独有的规则，把它们合并到各自该在的位置。

```diff
--- a/src/client/detail.tsx
+++ b/src/client/detail.tsx
 /* Gate0Grid 内，第 877 行 */
-<p className="g0-card-body" data-empty={!card.present}>
+<p className={`g0-card-body${card.prose ? ' prose' : ''}`} data-empty={!card.present}>
```

> `.prose` 已提供 `pre-wrap`。但仍建议在 `.g0-card-body` 上也设一次：
> 非 prose 的短字段（竞争对手、决策链）也可能带换行，同样不该被吃掉。

### 6.2 不动的部分

| 保留 | 理由 |
|---|---|
| `overview.ts` 的 `pcard-name` / `pboard-card-name` `clamp 2` | 实测 30/30 项目名 0 截断，最长 28 字正好 2 行 |
| 所有图表、标签、ID 的 `ellipsis` | 这些本来就是「指代」而非「内容」，一行是正确形态 |
| `dim-mini-label` ellipsis | 四维名称固定 2–4 字 |

### 6.3 需要单独决定的三处（见 §7）

---

## 7. 待拍板事项

### 7.1 首屏列表页的「最新进展」摘要（3 处截断）

`overview.ts` 里同一份数据被截了三次：

| 位置 | 方式 | 实测内容宽 | 全文行数 | 可见 | 藏 |
|---|---|---|---|---|---|
| 项目卡片 `.pcard-progress-copy` | `clamp 2` | 273px | 3 行 | 2 行 | 1 行 |
| 看板列 `.pboard-card-progress` | `ellipsis` + `nowrap` | 258px | （单行 68 字） | ~25 字 | **~43 字** |
| 表格 `.progress-summary` | `clamp 2` | 202px | 4 行 | 2 行 | 2 行 |

看板列那处最严重：`white-space: nowrap` 让整段永远只有一行，258px 宽下
大约只装得下 25 个汉字，剩下 43 字全部进省略号。**这一处藏得比详情页还多。**

上游 `store.ts:356` 还有一道**服务端硬截断**：

```ts
parts.push(actual.replace(/\s+/g, ' ').slice(0, 80))
```

三个选项：

| 选项 | 说明 | 代价 |
|---|---|---|
| **甲** | 卡片/看板改成 `clamp 3` + 悬停 `title` 显示全文 | 卡片高度 +16px |
| **乙** | 不动前端，把上游 `slice(0, 80)` 降到 40，让截断发生在语义边界而不是 CSS | 列表页信息量下降 |
| **丙** | 现状不动 | 列表页本来就是「扫」，不是「读」 |

**我的建议：卡片和表格不动（丙）+ 补 `title`；看板列那一处单独修（甲）。**

理由分两半：

- **卡片 / 表格**：列表页的定位是「三十个项目里找哪个要处理」，摘要给一个线索就够，
  点进去才是读。这跟详情页的定位不同，用不同的截断策略是对的。
  但 `title` 应该补上——鼠标悬停看全文，成本为零。
- **看板列**：`nowrap` + `ellipsis` 只露 25 个汉字，连「这条进展是什么类型」都读不出，
  已经低于「线索」的门槛。改成 `clamp 3`（`white-space: normal`）是必要的，
  卡片高度 +14px。**这才是列表页真正该修的一处。**

### 7.2 `.dim-card-value` 的 `clamp 2/3`

两块 `dim-card` 都**从来没被渲染过**。这一点用可达性分析确认过（从 `DetailPage`
出发递归解析 JSX 里的大写组件标签）：

```
可达组件（13 个）：BasicInfo, Blank, CriteriaPanel, DetailPage, Gate0Grid,
                  NextActionsPanel, PageHeader, ProgressItem, ProgressStream,
                  Prose, RiskPanel, ScenarioDetail, ScenarioPanel, Section
不可达组件（6 个）：DimensionGrid, Gate0Meter, IdentityRail, RailMeta,
                  StageContext, StageTrackVertical
```

`StageTrackVertical` 看起来「有 1 处渲染」，但那一处在 `IdentityRail` 内部——
而 `IdentityRail` 自己不可达。所以是**传递性死亡**。

这两条 `clamp` 因此是**死规则**。

建议：随 §6.1 的死代码清理一并删除。**如果将来要恢复四维区块**，
那时再按「四维是结论不是论证」的原则设 `clamp`。

### 7.3 `.pf-note` 分析结论 `clamp 2`

组合页的集中度提示会被截。实测（307px 宽，2 行 = `clamp` 上限）：

| 文案 | 全文行数 | 可见 | 结论 |
|---|---|---|---|
| 「前 3 个项目占总额 41%，超过 1/3 的预算集中在少数项目上」 | 1 行 | 1 行 | ✅ 没问题 |
| 长版（120 字，带「建议对前 5 个逐项确认下一步」） | **3 行** | 2 行 | ❌ 砍掉的是建议 |

短文案安全，长文案恰好砍掉最后一句**行动建议**。这是**判断**不是描述，
被截的又恰好是最该读的那一句。

建议：改成自然换行（去掉 `clamp`）。307px 下 3 行只比 2 行高 15px，
组合页本来留白就多，不值得为 15px 砍掉结论。

### 7.4 `align-items: start` 是否接受

去掉 `clamp` 后，同一行两张卡若一段长一段短，就会暴露一个纯审美问题：

![默认 stretch 与 align-items:start 的对比：等高会在短卡底部留下空洞，start 让卡片贴合各自内容](evidence/text/03-card-align.png)

- **`stretch`（当前默认）**：同一行强制等高。POC-006 的两段是 5 行 vs 8 行，
  短卡底部空出 3 行高度——看起来像「这张卡没写完」。
- **`start`**：各自贴合内容，整块更紧凑。

我建议 `start`。这是纯审美判断，但 `stretch` 的空洞在数据长短不一时会很明显，
而台账里长短不一是常态（21 个字段，行数从 1 到 10 分布）。

---

## 8. 验证方式

改完必须覆盖三层：

| 层 | 方式 | 判据 |
|---|---|---|
| 单元 | jsdom 断言 `.g0-card-body` 的 `className` 含 `prose`；断言 `data-prose="true"` 卡片文本**完整**（`textContent` 等于原文全串，含 `\n`） | 能抓住「又被加回 clamp」 |
| 样式 | 新增 `tests/css-contract.spec.ts`：扫描 `DETAIL_CSS` 字符串，断言 `.g0-card-body` 规则**不含** `line-clamp`，且含 `pre-wrap` | 不需要浏览器就能防止回归 |
| 渲染 | headless Chrome 渲染 30 个真实项目，逐个卡片比对 `scrollHeight === clientHeight` | 证明「真的没截」 |

第三条是关键——前两条都可能在「规则写对了但被别的规则覆盖」时失效
（本项目已经踩过：`detail.ts` 里同一条规则写了两遍）。

---

## 9. 工作量与风险

| 项 | 估算 |
|---|---|
| CSS 改动 | ~12 行（含删除 85 行重复区块） |
| JSX 改动 | 1 行 |
| 死代码清理 | **6 个**不可达组件 + **85 个**无引用的 CSS 类（**14,875 字节，占 `detail.ts` 的 35%**） |
| 新增测试 | 1 个 spec 文件，约 6 个用例 |
| 证据图 | 2 张（对照 + 变体） |
| 版本 | `patch`（0.11.1）——纯展示修复，无契约变化 |

**风险点：**

1. **删除 85 行重复区块可能带走有效规则。** 已核对：其中 9 条是独有的
   （`.prog-card-compact`、`.prog-actual-line`、`.prog-change` 等），
   必须迁移而不是删除。迁移后跑 `render-check` + 浏览器截图比对。
2. **G0 区块变高会影响下方区块的首屏可见性。** 实测中位数 +0，
   只有长论证项目 +80px，影响可控。
3. **`pre-wrap` 会让 `\n\n` 变成真实空行**，段落间距比现在大。
   如果需要更紧凑，可以改用 `white-space: break-spaces` 或对内容做
   `<p>` 分段——但那是另一层改动，建议先上 `pre-wrap` 看效果。

---

## 10. 如果不改会怎样

一句话：**台账里信息密度最高的两个字段，有 62% 的样本读不全，且没有任何提示。**

这与本项目一直在修的问题同源——`DESIGN-提醒与Gate评审.md` 讲的是
「判断陈旧不给提示」，这里是「内容截断不给提示」，都是**沉默地向用户
隐瞒了已有的信息**。区别是这一次的数据已经躺在台账里，只差一段 CSS。

---

## 11. 实施记录

五项决定全部按建议采纳，已实施并验证。

### 11.1 改了什么

| 文件 | 改动 | 净变化 |
|---|---|---|
| `src/client/css/detail.ts` | `g0-card-body` 加 `pre-wrap`；论证去掉 `clamp`、加重排版；`g0-grid` 加 `align-items: start`；删 85 行重复区块（9 条独有规则已迁移）；删 122 条死规则 | 675 → 417 行（**−38%**） |
| `src/client/detail.tsx` | 删除 7 个不可达函数 | 884 行（**−25%**） |
| `src/client/css/overview.ts` | 看板列改 `clamp 3`；`pf-note` 去掉 `clamp` | — |
| `src/client/overview.tsx` | 三处最新进展补 `title` | +3 属性 |
| `tests/css-contract.spec.ts` | **新增**，7 个用例 | +180 行 |

`lib/client.js` 从 458,497 字节降到 443,597 字节（**−14,900**）。

### 11.2 意外发现：`pf-note` 的真相比文档写的更具体

原稿说「190px 宽下这句要 3 行」。实测 307px 宽、短文案 1 行（**没问题**），
只有长文案才 3 行、砍掉最后一句建议。结论不变，但把「一直是坏的」修正成了
「长文案才坏」，避免过度描述。

### 11.3 意外发现：另外 5 处「重复」是合法的

新写的重复检测规则一开始报了 5 处重复，逐一核对后发现全部是
**`@media` 内的合法覆盖**（`risk-lane-meter`、`risk-row-side`、`risk-gap`、
`tl-field`、`pf-block[data-span="2"]`）。真正的重复只有 `detail.ts` 末段那一块。
测试因此改为**按 at-rule 作用域**判定，而不是全文件判定。

### 11.4 验证：三层全部通过

| 层 | 结果 |
|---|---|
| **CSS 字符串断言**（新测试） | 7/7：无 `line-clamp`、有 `pre-wrap`、无重复规则、无游离反引号、截断白名单 |
| **单元/集成** | 337/337（原 330 + 新 7） |
| **真实浏览器渲染** | 用真实 store 从 git 台账加载 **23 个项目**，渲染 9 个项目的详情页，**18 张论证卡全部 `scrollHeight === clientHeight`**（0 裁剪），`white-space` 全部 `pre-wrap`，`line-clamp` 全部 `none` |

浏览器证据：

![真实台账渲染：论证完整显示，段落分段恢复，卡片各自贴合内容高度](evidence/text/04-verified-detail.png)

逐卡测量原始输出：`docs/evidence/text/05-measurement.txt`

```
total 18 clipped 0
white-space: [ 'pre-wrap' ] line-clamp: [ 'none' ]

label                              vis full breaks
客户为什么测                          4    4      1
我们为什么测                         10   10      6
客户为什么测                          4    4      1
我们为什么测                         11   11      7
...
```

### 11.5 顺手修掉的一个真实隐患

`white-space: pre-wrap` 之前，`.g0-card-body` 用的是 `normal`，**但 `card.prose`
这个标记在 JSX 里只影响 `data-prose` 属性**——样式表靠属性选择器工作。
实施时曾一度想在 JSX 上加 `className="... prose"`，评估后放弃：
`.g0-card-body` 自身已经有 `pre-wrap`，再加 `.prose` 会引入第二次特指度竞争
（`.prose` 定义在 `base.ts`、`.g0-card-body` 在 `detail.ts`，后者在后，
但两者都只设 `font-size`，实际结果是 `detail.ts` 的 11px 赢——靠的是拼接顺序
而不是显式意图）。**不加，只保留一处定义。**

### 11.6 未随本次实施的部分

§7.2 提到的「将来恢复四维区块」没有做——`DimensionGrid` 已删除，如需要
按「四维是结论不是论证」的原则重新设计，那是一个独立任务。
