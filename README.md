# @skillre/dsh-plugin-work-dashboard · 工作看板

> 状态：experimental · 面向 DSH `0.2.2-rc.2`

在 DSH 左侧栏加一个「工作看板」入口：一个**多模块**运营看板，把正在推进的事情放到一个地方看清楚，再决定下一步补什么。目前只有第一个模块 **POC 运营**。

[English](README.en.md)

## 为什么是「多模块」

原来这个插件叫「POC 运营台」，只服务 POC 台账这一件事。改名成「工作看板」是因为它长成了**看板的容器**：顶部的模块切换条是座位，POC 运营是第一个坐进去的模块，后续模块（比如客户拜访、招聘进展、项目复盘）会陆续加入同一个 Host 行，不需要新插件。

所以现在的结构是：

```
工作看板（插件）
└── POC 运营（模块 1，唯一已实现）
    ├── 组合面板   阶段漏斗 / 体系公司 / 类型构成 / 金额集中度 / 四维覆盖 / 缺口规则
    ├── 项目总览   同一批项目的三种读法：卡片 · 看板 · 表格
    ├── 项目详情   左栏常驻档案 + 右栏进展流 / 四维 / G0 计量 / 计划 / 结论
    ├── 风险看板   按等级分泳道 + 严重度分布条
    └── 全局时间线 按月份分组 + 月度分布条 + 无进展项目清单
```

## 随包安装的三个技能

装这个插件会**同时**装好三个 POC 技能，它们不是独立的安装项，也不单独升级：

| 技能 | 做什么 | 什么时候触发 |
|---|---|---|
| `poc-ledger` | 读取并分析台账（v3），回答进展、判断阶段、识别 12 条缺口 | 「某个 POC 怎么样了」「哪些项目卡住了」 |
| `poc-export` | 生成自包含 HTML 收集表单，给没有 GitHub 账号的组员填 | 「导出表单」「让某某补一下这个项目的进展」 |
| `poc-submit` | 校验组员交回的 `.json`，合并进 v3 YAML 后提交 Draft PR | 「把这个文件提交上去」「帮我提个 PR」 |

**为什么随包发**：这三个技能描述的字段必须和看板读的数据是同一套。它们曾经作为独立 skill
装在用户目录里，结果数据模型从 v1 升到 v3 后，skill 还在教模型读 `why_customer_test` /
`result` / `timeline` —— 那些字段已经不存在了。打进同一个包、同一个版本，就不可能再错开。

- 技能文件在 `skills/<name>/SKILL.md`，导出技能还带一个可执行脚本
  `skills/poc-export/scripts/export-form.mjs`。
- 注册走 DSH 的 `skills` 服务（`ctx.skills.register`，`source: 'bundled'`），
  并绑定在插件自己的 Fiber 上：卸载插件就撤销注册。
- `skills` 是**可选**服务：profile 没有技能注册表时，看板照常工作，只是不注册技能（会记一条警告）。
- 三个技能都重写过：数据模型换成 v3、缺口规则 8 条改 12 条、导出脚本从失效的外部
  `poc_form.py` 换成随包发布的 `export-form.mjs`（并用真实浏览器验证了自动保存、缺口实时更新、
  焦点不被抢、草稿持久化）。

## POC 运营模块解决什么

POC 台账最容易烂在「感觉做成了」上：项目说结果达成，但没有证据；证据齐了，客户却从没书面认可；真正做成了，却没有下一步。这三件事写进同一个 `result` 字段就会被合并成一句「进展顺利」，于是没人发现「做成了但没转化」是最高价值的缺口。

模块把它们拆成四个独立维度分别记录、分别渲染，再叠上一套硬编码的缺口规则，把该补的东西按严重度排成一列。

## 功能

### 数据与刷新

- **侧栏入口**：`sidebar.panellist` 中的「工作看板」，点击把中央区域切换到看板。
- **空状态页**：缓存为空时明确告诉你「还没有数据，点【刷新】拉取」，并显示数据源与缓存位置。
- **手动刷新**：首次 `git clone`，之后 `git fetch` + `git reset --hard origin/main`；显示进度与「已刷新 HH:MM」。
- **刷新设置**：关闭（默认）/ 每 10 分钟 / 每 1 小时 / 自定义分钟数，存 `localStorage`，只在页面打开时生效。
- **刷新失败**：显示明确原因（未登录 / 无权限 / 网络不可达 / 超时 / 已有刷新在进行）与【重试】按钮，看板内容保留不丢。

### 组合面板

首屏先回答「钱和风险在哪」，再回答「这是哪个项目」。六张图，每张都是筛选器：

- **阶段分布**：G0→G4 的柱状分布，某阶段有高危缺口时柱子变红；点柱子筛该阶段。
- **体系 / 公司**：按金额排序的横向条，点某行按体系筛。
- **项目类型**：`poc_type` 构成的环形图，中心是项目总数。
- **金额集中度**：金额最大的 5 个项目及其占总额比例；单项目超过 1/3 时给出集中度警告。
- **四维覆盖**：四个环形仪表，显示各维度在全部项目里的覆盖率。
- **缺口规则命中**：哪几条规则在系统性地发生，而不是列一遍。

面板可一键收起——它是上下文，不该占满首屏。项目列表在 1440×900 下无需滚动即可见。

### 项目总览：一种数据，三种读法

| 视图 | 回答的问题 | 形态 |
|---|---|---|
| **卡片**（默认） | 这个项目缺什么 | 阶段迷你轨 + 金额 + 最新进展 + 四维标记 + 缺口徽标 |
| **看板** | 整体堆在哪 | 按阶段分列，列头带数量与金额 |
| **表格** | 数字给我看 | 规格七列，表头可排序、粘性、金额带条形 |

三种视图共用同一次筛选与排序，切换不会改变哪些项目可见。工具栏提供搜索（项目名 / 编号 / 负责人 / 公司）、可组合的筛选 chips（体系 / 阶段 / 状态 / 类型）、排序与方向，并实时显示命中数。

**键盘**：`↑/↓` 移动选中，`Enter` 打开，`Esc` 返回，`/` 聚焦搜索。

### 待处理清单

按**规则分组**而不是平铺：12 条规则 × 23 个项目是系统性问题，分组后一眼看出「大家都缺决策链」。每组显示规则编号、命中项目数与严重度色带。

### 四维与阶段

- **四维状态**：目标达成、证据、客户认可、下一步**永远四格分开**，每格独立显示有/无。
- **阶段轨道**：G0→G4 横向轨道；表格里是五点紧凑版，详情页是完整版。完成状态取自台账自己的 `gates.G0..G4.complete`，不由当前阶段位置推断。
- **详情页**分两栏：左栏是常驻的项目档案（名称、金额、竖向阶段轨道、四维、缺口、人员、上下条导航），右栏是滚动阅读区。每个区块用自己最合适的形态，而不是统一的行：
  - **进展流**（核心）：每次进展是一张卡片，带认可度色调的节点、目标→实际、范围 chips、可点开的证据、客户同步与认可、G3-1/G3-2、由百分比解析出的完成度条、以及「下一步」区块（没有下一步时明确说出来）。
  - **四维结果**：四张独立卡片，各带「自动推导 / 人工填」标签。
  - **G0 计量**：五格完整度计量条，其中 `tech_owner` 取自身份区；两条叙述字段以原文散文块呈现。
  - **计划**：指标表格、编号场景列表、带严重度点的风险列表。
  - **结论**：三段散文 + 里程碑提示框（没有下一步里程碑时按缺口 R11 渲染成红色发现，而不是空字段）。

### 增强视图

- **风险看板**：按严重度分成泳道（高 → 中 → 低 → 未评级），上方一条严重度分布条，两者来自同一次分桶，所以图和列表不会互相矛盾。
  - **未评级排在最后**：不是「不严重」，而是还没判断；排在最前会埋掉真正被评估为严重的风险。
- **全局时间线**：按月份分组，每组一个月份分隔条与月度分布，组内按日期从新到旧；无证据 / 无客户反馈的轮次显式标出。

### 导出表单（本版暂不提供）

> 导出表单仍按 v1 字段建模，v3 已没有那些字段。为避免组员拿到台账读不了的 YAML，本版**隐藏了导出入口**，代码保留在 `src/form.v1-deferred.ts`，将在 P1 按 v3 重写。

原设计（P1 重写目标）：

- 勾选一个或多个项目 → 生成**一个自包含 HTML 文件**并下载。表单没有 CDN、没有外部字体、没有服务器，双击即可在离线机器上填写。
  - **自动保存**：`localStorage`，键由**项目集合**派生（不是生成时间），所以同一个项目集重新生成表单时能找到同一份草稿。
  - **实时校验**：指标 2–3、场景 3–5、风险 ≤3、G0 四项必填，每次编辑即重算。
  - **下载真实 YAML**：不是 JSON。生成的值会按 YAML 规则正确加引号/块标量，所以组员回传的文件可以直接拿去用。
  - **批量导出**：多选项目打包进同一个表单；下载时**每个项目一个 `.yaml` 文件**（YAML 文件只能装一个项目的映射，拼接会产生重复键）。

## v3 数据模型

台账已从 v1 升级到 v3。v3 是**以进展流为中心**的模型：

```
① 身份      poc_id / name / org{system,company,department} / amount_wan /
            poc_type / priority / owner / sales / tech_owner / exec_sponsor /
            stage / status / stage_since
② gate0     值不值得做：why_customer / why_us / decision_chain /
            post_poc_decision / competitor / review{conclusion,reviewer,reviewed_at} /
            missing（自动算）/ complete（自动算）
③ plan      怎么赢：customer_pain / expected_recognition / criteria[] /
            scenarios[] / our_edge / risks[] / gate1 / gate2{ready,prerequisites}
④ progress  进展流（追加式，永不覆盖）★ 核心
⑤ outcome   结论：achievement / customer_recognition / our_proof /
            remaining_risks / conclusion{proved,recognized,next_business} /
            business{milestone,owner,deadline,status} / overall
```

### 四维从 `outcome` 读

| 维度 | 来源字段 | 性质 |
|---|---|---|
| 目标达成 | `outcome.achievement` | 自动推导（来自最后一条进展的 gate3_1 + completion） |
| 证据 | `outcome.our_proof`，或最后一条进展的 `evidence[]` | 人工填 / 进展携带 |
| 客户认可 | `outcome.customer_recognition` | 自动推导（来自最后一条进展的 customer.recognition） |
| 下一步 | `outcome.business.milestone` | 人工填 |

**四维永远四张独立卡片**，每张标注「自动推导」或「人工填」——因为 v3 里前两者由系统推导、后两者靠人填，混在一起看会分不清哪个结论可信。

### 进展流（核心）

每个项目的 `progress[]` 渲染成一条时间线，最新在上。一条进展包含：

- `type`（内部Review / 客户阶段同步 / Checkpoint）、`seq`、`completion`
- `goal`（这次要验证什么）、`items[]`（范围）、`actual`（实际做到什么）
- `evidence[]`（标题 + 链接 + 类型，作为可点开的凭据）
- `customer`（`synced_with` / `feedback` / `recognition`）
- `gate3_1`（可证明/待补证据）、`gate3_2`（已确认/待确认）
- `next`（`goal` / `owner` / `deadline`）

**今天 23 个项目的 `progress` 都是空的**，所以进展流显示空状态「还没有进展记录 / 第一次进展后，这里会显示完整时间线」。这是正常状态，进展要靠组员用表单填。

## 12 条缺口规则

规则硬编码在 `src/gap.ts`（纯函数，无时钟无文件系统，全部由 `tests/gap.spec.ts` 逐条锁定）：

| # | 规则 | 判定 | 级别 |
|---|---|---|---|
| R1 | G0 五必填缺失 | `gate0.missing` 非空 | 🔴 high |
| R2 | 大金额未过 G0 | `amount_wan >= 300` 且结论非「通过」 | 🔴 high |
| R3 | G0 通过但计划空白 | 结论「通过」且 `plan.criteria` 空 | 🔴 high |
| R4 | 成功标准不聚焦 | criteria 数量不在 2–3（空则不算） | 🟡 medium |
| R5 | 场景不聚焦 | scenarios 不在 3–5（空则不算） | 🟡 medium |
| R6 | 风险超限 | `plan.risks` > 3 | 🟡 medium |
| R7 | G2 前置未就绪已开测 | 有 progress 且 `plan.gate2.ready != Ready` | 🔴 high |
| R8 | 进展无证据 | 最新进展有 `actual` 但 `evidence` 空 | 🔴 high |
| R9 | 有证据无客户认可 | 有 evidence 但 recognition 是「未认可/待确认」 | 🔴 high |
| R10 | G3-1 可证明但 G3-2 未确认 | `gate3_1=可证明` 且 `gate3_2!=已确认` | 🔴 high |
| R11 | 达成但无 Next Milestone | `achievement=达成` 且 `business.milestone` 空 | 🔴 high（排序最优先） |
| R12 | 阶段停滞 | `stage_since` 距今 > `stallDays`（默认 45 天） | 🟡 medium |

**R8–R10 只看最新一条进展**：只看最后一条，因为「历史某轮没证据」不该在补上之后继续报警。

**R4–R6 对空列表不触发**：空代表「还没规划」，那是 R3 的事；否则每个新项目第一天就会报三条聚焦问题。

**R11 排最优先**：价值做出来了却没转化路径，是这套台账里最贵的缺口。

## 数据与权限## 数据与权限

| 项目 | 说明 |
|---|---|
| 数据所有者 | Host。浏览器端只持有视图状态（当前页面、当前项目、刷新节奏）。 |
| 数据源 | GitHub 私有仓库 `skillre/workbranch` 的 `projects/*.yaml`（可配置）。 |
| 缓存 | `~/.dsh/cache/work-dashboard/repo`，**DSH 启动即清空**，用户点【刷新】才重新拉取。 |
| 网络 | 仅 Host 侧对 `github.com` 做 `git clone` / `git fetch`。浏览器 ↔ Host 只走本机 `/api` 通道。 |
| 凭据 | 复用本机已登录的 `gh` CLI。token 在调用时读取，**只通过子进程环境变量**传给 git，不写入 `.git/config`、不出现在进程参数、不进入前端。 |
| 文件系统 | 只写缓存根目录（并在其中建 `.lock` 与所有权标记 `.work-dashboard-cache`）；只读缓存里的 `projects/*.yaml`。 |
| 写入 | **无**。本插件只读台账；导出表单产出的是本地文件，不回写仓库。 |
| 模型可见 | 否。本插件不注册任何模型工具。 |

### 缓存目录的两道保险

1. **启动即清空**——缓存只是远端副本，避免「本地看起来是新的」。代价是每次重启 DSH 要重新点一次【刷新】（clone 约 1.5 秒，慢网络会更久）。
2. **只清自己建的目录**——如果 `cacheRoot` 已存在、非空、且没有本插件的所有权标记，插件**拒绝清空**并报错，而不是删掉你的文件。空的已存在目录会被接管。

### 并发

同一缓存根目录下的刷新用 `.lock` 文件串行化：两个标签页同时点刷新、或两个 DSH 实例共享同一个 home，都不会并发 clone。超过 120 秒的锁被视为崩溃残留并回收。

## 配置

在 profile 的 `cordis.patch.yml` 中按行 id 覆盖（`config` 整行替换，未写出的键取默认值）：

```yaml
- id: skillre-work-dashboard
  name: '@skillre/dsh-plugin-work-dashboard'
  config:
    repository: skillre/workbranch
    cacheRoot: ~/.dsh/cache/work-dashboard
    defaultBranch: main
    cloneTimeoutMs: 120000
    fetchTimeoutMs: 60000
    stallDays: 45
```

| 键 | 默认 | 含义 |
|---|---|---|
| `repository` | `skillre/workbranch` | 数据源，必须是 GitHub 上的 `owner/name` |
| `cacheRoot` | `~/.dsh/cache/work-dashboard` | 缓存根目录，启动时清空（`~` 会展开） |
| `defaultBranch` | `main` | 克隆跟踪的分支 |
| `cloneTimeoutMs` | `120000` | 单次 clone 上限 |
| `fetchTimeoutMs` | `60000` | 单次 fetch + reset 上限 |
| `stallDays` | `45` | 规则 R12 的「阶段停留多久算停滞」阈值 |
| `remoteUrl` | `''`（即 `https://github.com/<repository>.git`） | 克隆地址覆盖：GitHub Enterprise、镜像，或本地测试仓库 |

> **关于超时默认值**：规格书建议 `cloneTimeoutMs: 30000`。实测同一网络下正常 clone 约 1.5 秒，但网络拥塞时一次 clone 用了 **68 秒**——30 秒会让首次使用间歇性失败。因此默认值提到 120 秒；超时仍会给出明确原因和【重试】。

## 安装

**安装动作由你完成**：插件管理器里选来源、点确认。本插件不代装。

### 从插件市场安装

```
https://skillre.github.io/dsh-plugin-market/index.json
```

1. DSH Web → **Plugins** → **More**（Experimental plugins）→ 启用 **Custom plugin markets**；
2. 出现 **Discover** 标签页 → **Index sources** → **Add index source** → 粘贴上面的 URL；
3. 在 Discover 里找到 **工作看板**，确认来源后点 **Install**。

索引里的版本钉在具体提交（`git+https://github.com/skillre/dsh-plugin-work-dashboard#<commit>`），
仓库自包含：`lib/` 已提交、无 `scripts.prepare`，安装不会执行构建脚本。

### 更新机制（重要）

DSH `0.2.2` 线起，插件详情页有「版本 / Versions」区块，能检查并原地更新。**但它只覆盖从 npm registry
安装的第三方插件**——判定条件有四条，必须同时满足（见舰队 `docs/update-mechanism.md`）：

| 条件 | 本插件现状 |
|---|---|
| 第三方 bundle（非官方自带） | ✅ |
| profile 依赖是**以自己包名**保存的 registry spec | ⚠️ 见下 |
| 已装 manifest 的 `version` 是合法 SemVer | ✅ `0.4.0` |
| 包内不含 `PROTECTED_PLUGINS` 管理行 | ✅ 只声明 `skillre-work-dashboard` 一行 |

因此：

- **从市场（Git 源）安装**：出现在 Installed 列表里，但**不会**出现「版本」区块。升级只能
  **卸载 → 重新从市场安装**。这是 DSH 的判定结果，不是本插件的选择。
- **从 npm 安装**（`@skillre/dsh-plugin-work-dashboard`）：才进入官方更新机制，可以在详情页
  检查更新、看预发布版本、点「更新」原地升级。

本插件的 npm 发布由 `.github/workflows/release.yml` 经 npm Trusted Publishing / OIDC 完成
（见 `RELEASING.md`）。**当前 registry 上尚无发布版本**：本机 npm 凭据返回 401、仓库也未配置
`npm-publish` 环境与 Trusted Publisher，所以此刻只有 Git 渠道可用；
发布之后，切换到 npm 渠道才能拿到原地更新：

1. 在 Plugins 里移除 Git 安装的 bundle；
2. 在安装对话框输入 `@skillre/dsh-plugin-work-dashboard@0.4.0`（或更高）；
3. 之后详情页才会出现「版本」区块。

### 用本地包

用构建出的 `.tgz` 绝对路径（见下方「构建与自测」），由你在插件管理器中选择安装来源。
本地包同样**不进**官方更新机制。

## 构建与自测

```sh
npm install
npm run check                     # typecheck + 172 个单测 + lib 漂移检查 + 打包检查
npm pack                          # 产出 skillre-dsh-plugin-work-dashboard-0.4.0.tgz
```

**仅使用自己拥有的、可丢弃的非 Desktop profile**做真实挂载验证：

```sh
node scripts/verify-isolated.mjs   # 真实 clone/fetch/详情/鉴权/重启清空 + 风险/时间线，结束自清理
node scripts/ui-preview.mjs        # 起一个有界 Web 实例并写入 .preview-url.txt
node scripts/ui-verify.mjs         # 浏览器断言 + docs/evidence/ 截图
node scripts/verify-market-install.mjs  # 线上索引 → 真实安装 → 动作可用（需已发布）
```

`ui-preview.mjs` 必须在退出前创建 `.preview-stop`，或让它超时；它会停进程、删掉自己创建的隔离根目录。`verify-isolated.mjs` 在 `finally` 里清理并校验根目录已消失。所有脚本都把 `cacheRoot` 指向隔离 profile 内的路径，**不会碰你真实的 `~/.dsh/cache`**。

## 卸载与回滚

见 [UNINSTALL.md](UNINSTALL.md)。数据全在 GitHub 仓库里，卸载插件不丢任何数据；`~/.dsh/cache/work-dashboard` 可随时手动删除，下次进入会自动重建。

## 兼容性

| DSH 版本 | 结果 | 验证日期 | 说明 |
|---|---|---|---|
| 0.2.2-rc.2 | 通过 | 2026-11-13 | 打包安装 + 有界启动 + 真实 clone + 31 项隔离集成（含三个技能确实进入技能目录）+ 15 项线上市场 npm 安装（见 `compatibility.json`） |
| 0.2.2-rc.1 | 通过 | 2026-11-06 | 同上行为 + 69 项浏览器断言；0.6.0 未改动客户端产物，该记录仍然有效 |

机器可读证据在 `compatibility.json`，截图与报告在 `docs/evidence/`。**未验证 Desktop Client（Electron）**：它的 profile 由应用管理，本 CLI 测试台无法驱动，Desktop 发布前需在那里重做一次视觉检查。

## 实现说明

- **图表零依赖**：客户端 bundle 只能把 `react` 外部化，所以每张图都是手写 SVG / flex 几何，配 `role="img"` + `aria-label` + 文本兜底。没有引入任何图表库。
- **样式按界面拆分**：`css/base`（框架）、`charts`、`overview`、`detail`、`insights`，在 `styles.ts` 里按固定顺序拼接，所以四个模块可以并行开发而不互相踩样式。
- **聚合在 Host 算**：`snapshot.analysis`（阶段/体系/类型/金额/四维/规则聚合）与 `detail.gate0.checklist`（五必填，含身份区的 `tech_owner`）都由 Host 计算并下发，客户端不重新推导——否则图会和它旁边的列表对不上。

## 已知限制

- **每次 DSH 重启缓存清空**，需要重新点【刷新】（clone 约 1.5 秒，慢网络更久）。这是既定行为。
- **只读**：不提供导入、编辑、提交 PR。缺口只能看，不能在看板上改。
- **R12 的日期来源**：v3 用 `stage_since` 算阶段停留时间；没有 `stage_since` 的项目不报 R12，而不是假定它停滞。
- **定时刷新只在页面打开时生效**，关掉页面就停——预期行为。


- 私有仓库要求本机 `gh` 已登录且账号有读权限；未登录时刷新会明确报「gh 未登录」。
- **只有一个模块**：模块切换条目前只坐着一个模块，后续模块会加在同一个 Host 行里。

## 安全与权限

- 唯一写入目标是 `cacheRoot`（以及其中的 `.lock`、所有权标记、clone 目录）。
- 唯一网络目标是通过 `git` 访问 `github.com`。
- 唯一外部命令是 `git` 与 `gh`（`gh auth token`），都在 Host 侧、都以超时和进程组终止兜底。
- 不读用户其他文件；不上报遥测；不注册模型工具。

## License

MIT
