# 工作看板 0.3 · 视觉与交互重构设计

> 目标不是"显示更多数据"，而是**同一条数据有更多种可信的展示形态**，并且页面本身像一个被设计过的产品，而不是一张表格外面套了个壳。

## 0. 现在的问题（自我诊断）

| 位置 | 问题 | 根因 |
|---|---|---|
| 总览 | 只有一张七列表格 + 一条待处理侧栏 | 只有一种展示形态；表格是"可视化"的替代品，不是可视化 |
| 统计条 | 四个同样大小的方块，一个大数字加一句小字 | 没有对比、没有分布、没有趋势，读者拿不到"钱和风险在哪" |
| 总览交互 | 只有刷新/风险/时间线/设置四个按钮 | 没有搜索、筛选、排序、分组；23 个项目只能靠肉眼扫 |
| 详情 | 十三个 `label: value` 列表竖直堆叠 | 键值列表是"把字段抄一遍"，不是展示方式 |
| 详情 | 阶段轨道占了一整条横幅，其余信息被压到下面 | 层级失衡：一个静态指标吃掉最贵的首屏 |
| 详情 | 进展流是唯一像样的区块，但每条进展仍是文本行 | 核心数据没有拿到核心呈现 |
| 布局 | 模块轨道只有一个 tab；页头一行塞四个按钮 | 没有工具栏（IA 缺失），没有分区，没有键盘路径 |

## 1. 设计原则

1. **一种数据，多种形态。** 同一批项目必须能按 表格 / 卡片 / 看板 三种形态读，切换不改变数据，只改变"你此刻想回答的问题"。
2. **分布优先于清单。** 先回答"钱在哪个阶段、哪个体系、哪个类型"，再回答"这是哪个项目"。
3. **详情页是分层阅读，不是字段抄写。** 左栏常驻身份/阶段/四维/缺口，右栏是可滚动的证据链；每个区块用自己最合适的形态（计量条、漏斗、卡、时间线），不用 `label: value`。
4. **零依赖图表。** 客户端 bundle 只能 external `react`，图表全部手写 SVG，`role="img"` + `aria-label` + 文本兜底。
5. **键盘可达。** `↑/↓` 移动选中项目，`Enter` 打开，`Esc` 返回，`/` 聚焦搜索。

## 2. 信息架构（新）

```
工作看板
└─ POC 运营
   ├─ 顶部：面包屑 + 标题 + 数据源/刷新态 + 主操作（刷新 / 风险 / 时间线 / 设置）
   ├─ 工具栏：搜索 · 筛选 chips（体系/阶段/状态）· 视图切换（卡片/看板/表格）· 排序
   ├─ 组合面板（Portfolio band）：
   │    阶段漏斗（G0→G4，数量+金额，可点击筛选）
   │    体系分布（堆叠条 + 公司明细）
   │    类型构成（环形图 + 图例）
   │    金额集中度（Top-5 横向条）
   │    四维覆盖率（四个环形进度）
   ├─ 主体：三种视图之一
   │    卡片：项目卡（阶段迷你轨 + 金额 + 四维点 + 最新进展 + 缺口徽标）
   │    看板：按阶段五列，卡内联拖不动（只读），列头显示数量/金额
   │    表格：原有七列，但加排序表头、金额条、粘性表头
   └─ 右栏：待处理（按规则分组，可折叠；每条带规则编号徽标 + 严重度色带）
```

详情页：

```
左栏（sticky, 300px）            右栏（滚动）
├─ 项目卡（名称/编号/金额/类型）    ├─ 进展流（核心：时间线卡片）
├─ 阶段轨道（竖向）                ├─ 四维结果（4 张卡 + 来源标注 + 缺失原因）
├─ 四维摘要（2×2）                 ├─ G0 完整性（五格计量条 + 字段卡）
├─ 缺口摘要（列表）                ├─ 计划（指标表 / 场景编号列表 / 风险严重度条）
├─ 上下条导航 / 返回               └─ 结论（三栏 + 里程碑时间线）
```

## 3. 任务拆分

### T1 数据层（Lead）
- `types.ts`：新增 `PortfolioAnalysis`、`StageBucket`、`OrgBucket`、`TypeBucket`、`AmountRow`、`DimensionCoverage`、`GapRuleCount`、`ActivityPoint`；`Snapshot.analysis`；`Gate0View.checklist`。
- `store.ts`：`analyse(projects, records)` 计算组合分析；`gate0Checklist`；保持既有字段不变。
- `gap.ts`：不改规则，仅导出 `RULE_META` 供图表/图例复用。

### T2 图表原语（Lead）
`src/client/charts.tsx` + `src/client/css/charts.ts`：
`Funnel`、`Donut`、`StackedBar`、`BarList`、`RadialMeter`、`Sparkline`、`SeverityBar`、`StageRailMini`。
全部纯函数组件，props 只有数字/字符串/回调，无数据层依赖。

### T3 壳与工具栏（Lead）
`src/client/shell.tsx`（从 view.tsx 拆出）：页面状态机、刷新、筛选/搜索/视图/排序状态、键盘导航、持久化（localStorage）。
`src/client/css/shell.ts`：页头、工具栏、按钮、空态、失败、弹窗、footer。
`view.tsx` 只保留 re-export。

### T4 总览视图（Teammate A）
`src/client/overview.tsx` + `src/client/css/overview.ts`：
`PortfolioBand`、`ProjectCards`、`ProjectBoard`、`ProjectTable`、`PendingRail`、`FilterChips`。

### T5 详情视图（Teammate B）
`src/client/detail.tsx` + `src/client/css/detail.ts`：
`DetailPage`、`IdentityRail`、`ProgressStream`、`DimensionGrid`、`Gate0Meter`、`PlanPanels`、`OutcomePanel`。

### T6 洞察视图（Teammate C）
`src/client/insights.tsx` + `src/client/css/insights.ts`：
风险看板（严重度泳道 + 分布条）、全局时间线（月份泳道 + 条目卡）。

### T7 文案（Lead）
`text.ts`：新增全部 key（zh+en 必须成对），`tests/text.spec.ts` 校验 key 对称。

### T8 样式装配（Lead）
`styles.ts` 变成装配层：拼接 `css/shell.ts`、`css/charts.ts`、`css/overview.ts`、`css/detail.ts`、`css/insights.ts`。

### T9 验证（Lead）
- `scripts/lib/local-fixture.mjs`：扩到 6 个项目，覆盖"有进展/无进展/已达成/无金额/已关闭/多体系"。
- `tests/view.spec.tsx`：按新结构重写断言（视图切换、搜索筛选、键盘、详情分区）。
- `scripts/ui-verify.mjs`：新增断言（图表存在、视图切换、搜索命中、键盘导航、无占位符、无控制台错误），截图 8 张。

## 4. 写作用域（防冲突）

| 文件 | 归属 |
|---|---|
| `src/types.ts`, `src/store.ts`, `src/gap.ts`, `src/client/text.ts`, `src/client/charts.tsx`, `src/client/css/charts.ts`, `src/client/css/shell.ts`, `src/client/shell.tsx`, `src/client/view.tsx`, `src/client/styles.ts`, `src/client/index.tsx`, tests, scripts, docs | Lead |
| `src/client/overview.tsx`, `src/client/css/overview.ts` | Teammate A |
| `src/client/detail.tsx`, `src/client/css/detail.ts` | Teammate B |
| `src/client/insights.tsx`, `src/client/css/insights.ts` | Teammate C |

## 5. CSS 契约（teammates 必须只用这些前缀）

- 全局：`.wd-shell` 根，`--wd-*` 变量（不新增语义色，只用 primary/green/amber/red/slate 与其 soft 版本）
- A：`.pf-*`（portfolio）、`.pcard-*`、`.pboard-*`、`.ptable-*`、`.filter-*`、`.pending-*`
- B：`.dt-*`（detail rail/hero）、`.dsec-*`、`.prog-*`、`.dim-*`、`.g0-*`、`.plan-*`、`.out-*`
- C：`.risk-*`、`.tl-*`
- Lead：`.page-*`、`.toolbar-*`、`.btn`、`.empty-*`、`.failure`、`.modal-*`、`.chart-*`

禁止：新增第三方依赖、`document` 全局样式、非 `.wd-shell` 作用域、emoji 图标（用 SVG 或字符）。

## 6. 验收

1. 总览首屏能回答：钱在哪个阶段、哪个体系、哪个类型、最贵的五个项目、四维覆盖率。
2. 同一批项目在 卡片/看板/表格 三种形态下数量一致，切换不丢筛选。
3. 搜索框输入项目名/编号/负责人即时过滤；筛选 chips 可组合、可清除。
4. 详情页左栏 sticky，右栏滚动；四维/G0/计划/结论各用一种非键值形态。
5. 键盘：`↑/↓` 选中、`Enter` 打开、`Esc` 返回。
6. 明暗主题都成立；无第三方依赖；`npm run check` 全绿；浏览器断言 ≥ 55 项且 0 失败。
