# Changelog

## 0.12.0

### Minor Changes

- 59ecfe5: 导出表单：组员填完可生成回传文件（.html），经企业微信发回后由 DSH 解析合并进台账；修复四类阻断缺陷。
  
  - **回传文件**：表单底部新增【生成回传文件 (.html)】。此前组员的答案只存在浏览器 localStorage 与下载的 JSON 里，HTML 文件本身从不改变，转发那个文件等于转发一份空白表单。现在回传文件内嵌变更集，接收方双击即可阅读，`readReturnDocument()` 可直接解析（只 `JSON.parse`，不执行任何代码）。`.json` 下载保留。
  - **下载被永久阻断**：`validateRequired` 对所有表单都要求进展字段，但 G0/G1 补充表单根本不渲染进展区，那四个值恒为空，任何填写都无法满足——补充/新建/批量表单全部下载失败，且提示不指明字段。改为只校验当前页面实际渲染的字段，并点名缺失项。
  - **并发编辑被回滚**：变更集原先携带全部预填字段，`poc-submit` 按「跳过 null、其余写入」合并，于是组员只改一个字段也会把其他字段重置为导出当天的快照。现在按生成时的基线做差异比较，只发送真正编辑过的字段。
  - **G4 结论丢失**：表单能编辑 `outcome`，变更集却不包含它，G4 组员填的「证明了什么/客户认可什么/下一步业务动作」在下载时被静默丢弃。已补齐。
  - **可编辑面收敛**：项目编号、阶段、状态在填表时锁定（阶段推进走 Gate 评审）；「客户技术责任人」此前在 Gate 0 与身份区各渲染一次、共用同一个 `data-path`，已去重。
  - **看得清项目**：新增项目快照条（五必填进度、G0 结论、方案、进展轮数与最近日期、金额）、只读上下文改为展示真实内容（G0 原文、方案明细、指标/场景/风险）、新增已有进展时间线；G4 的结论区移入宽栏。
  - **skill 侧收敛**：`poc-export/scripts/export-form.mjs` 从 654 行独立重写改为薄 CLI，委托 `lib/form.js`。此前它输出 `pocs{}`，而 `poc-submit` 读 `changes[]`，导出链路接不上。

## 0.11.1

### Patch Changes

- f61249e: 详情页 Gate 0 的两段论证（`why_customer` / `why_us`）不再被截断，并保留段落结构。
  
  **读不全的问题**：这两段论证此前被 `-webkit-line-clamp: 3` 限制在三行。用真实台账
  实测，21 个非空论证里有 13 个（62%）被截，单个字段最多藏掉 7 行（该字段共 10 行），
  且没有任何折叠提示。现在按内容自然展开。
  
  **读不懂的问题**：`white-space: normal` 会把台账里存的换行折叠成空格，而 71% 的论证
  用换行分段（`为什么测试：` / 编号条目 / `下一步动作和目标：`）。折叠之后两个标题塌进
  正文、序号和内容分离。现在用 `pre-wrap` 保留原始分段。
  
  同批修正的还有：
  - Gate 0 卡片改为各自贴合内容高度（`align-items: start`），论证长短不一时不再留空洞；
  - 看板列的最新进展从单行省略改为三行（原来 258px 只露出约 25 个汉字，藏掉 43 字）；
  - 组合页的集中度结论不再被 `clamp 2` 砍掉最后一句建议；
  - 首屏三处最新进展摘要补上 `title`，悬停可看全文。
  
  顺带清理了 `detail.ts` 末尾一段 85 行的重复 CSS 区块（36 条选择器逐字复制，
  其中包含本次要修的 `clamp` 规则本身——这正是此前改不动它的原因），以及 7 个
  从未挂载的组件和 122 条无引用规则。客户端包从 458KB 降到 444KB。
  
  新增 `tests/css-contract.spec.ts`：断言论证字段不含 `line-clamp`、含 `pre-wrap`、
  每个选择器在同一作用域内只定义一次、CSS 注释内无游离反引号，并用白名单约束
  全站剩余的截断点。

## 0.11.0

### Minor Changes

- 导出表单按「阶段 + 意图」拆分，下载格式改为 JSON 变更集。
  
  **破坏性变更**：表单下载的产物从完整 `*.yaml` 改为 `poc-changes-<日期>.json`。
  新的变更集只含人填写的字段，不写派生字段（`gate0.missing`/`complete`、`priority`、
  场景与指标状态）——那些由台账 `tools/derive.mjs` 计算、CI 校验，表单写会漂移。
  `poc-submit` skill 已同步为按 `changes[]` 数组合并、`null` 视为「未改」。
  
  新增三个填写意图，决定表单问什么，而不只是显示多少：
  
  - **新建项目** —— 只问身份 + G0 五必填；计划留到 G1（R3 的设计是 G0 通过后才要求计划）
  - **补充信息** —— 只编辑当前阶段该填的，更早阶段折叠为只读摘要，更晚阶段不显示
  - **记录进展** —— 一屏，只有进展 + 下一步，适合每周例行同步
  
  阶段与区块的映射来自台账自身结构（①身份 ②gate0 ③plan ④progress ⑤outcome），
  16 条缺口规则也按同一分组判定，所以「G1 填 plan、G3 填进展」是数据模型而非约定。
  
  导出对话框新增按阶段筛选（带计数），批量导出可只给「所有 G0 项目」发一份表单。
  
  同时补上此前完全缺失的 G4 结论块（`FormProject.outcome`），以及
  `scenario_ids` / `criteria_ids` 的勾选界面（v3.1 必填但一直没有入口）。
  
  移除「缺 `schema_version` 按 3.0 旧结构处理」的说法：该兼容从未实现，
  台账校验器一直以 `E-VERSION` 拒绝，本次只是让文档与实现对齐。

## 0.10.1

### Patch Changes

- 0.10.1 发布说明（本文件供发布 preflight 读取；详细条目见 CHANGELOG 的 0.10.1 段）
  
  **详情页按设计稿重做为固定两栏。0.10.0 的详情页形态与设计稿不符，本次修正。**
  
  - **顶部横幅取代左侧身份栏**：项目名、POC ID、组织、Owner，右侧阶段胶囊、优先级与
    金额，下方是前后导航。原 316px 侧栏会一直占掉承诺栏的宽度。
  - **Gate 0 改为 2×3 卡片网格**：六个问题各自成格，答了显示内容、没答标「缺失」。
    五格计量条只能说「缺几项」，说不出「缺哪一项」——而「没有决策链」和「没有竞争对手」
    是两个不同的问题，修法也不同。
  - **固定两栏，不再按 Gate 重排**：左栏承诺（Gate0 / 指标 / 场景），右栏记录
    （基本信息 / 进展 / 风险），下一步横跨两栏收尾。每个 Gate 都是同一套位置，
    只有内容变。0.10.0 按 Gate 重排并折叠，导致 G3/G4 阶段「计划」被收进
    「其他区块」——而场景状态点正在其中，恰恰是 G3/G4 读者最想看的。
  - **进展流改为紧凑时间线**：一行一轮（日期、类型、change 标记、结果）。0.10.0 把
    目标、证据、客户、G3 判定、下一步全铺进卡片，右栏比左栏高四倍，历史的形状被
    淹没。被略去的细节在场景下钻里仍可查——那里按 id 聚合了引用该场景的每一轮证据。
  - **移除设计稿没有的区块**：四维结果、结论、阶段轨道、待补清单。
  - **修复**：`← 返回` 渲染成 `← ← 返回`（字典值已含箭头）。
  
  测试随之重写：结构断言改为新的固定区块集，移除针对已删区块的用例，新增 Gate 0
  网格与紧凑时间线的用例。309 个测试全绿。

## 0.10.0

### Minor Changes

- 0.10.0 发布说明（本文件供发布 preflight 读取；详细条目见 CHANGELOG 的 0.10.0 段）
  
  **台账 v3.1 适配。这是一次 schema 兼容性变更：插件现在要求台账为 3.1，读到 3.0 形状的数据会降级并提示。**
  
  - **按 id 关联取代字符串匹配**：`progress[].items` 不再读取，改为 `scenario_ids` /
    `criteria_ids`。场景改名不再断开证据挂靠。旧字段**不兼容**——静默忽略会让一条关联了
    场景的进展变成"没关联"，场景状态随之从已证明退回未开始，且没有任何报错。
  - **阈值单一来源**：新增 `src/rules.ts` 解析台账 `config/rules.yaml`，插件不再硬编码
    300 万 / 2–3 项 / 3–5 个 / 45 天。文件缺失时回落内置默认值，但标记为 `fallback`
    并告警，不把内置数字冒充成台账的。
  - **规则 12 → 16 条**：新增 R13 场景无证据、R14 场景待客户确认（`info` 级：等待客户是
    状态不是过错）、R15 指标未验证、R16 场景未开始。R15/R16 带 guard：计划大小还不合规
    时先修计划，状态规则等待。全部读台账派生的 `status`，不自行重算。
  - **三源解析**：`projects/`（事实，缺失即错）、`config/`（判断，缺失降级）、
    `signals/`（agent 结论，缺失正常）区别对待。单个 signal 损坏只跳过并告警。
  - **两层信息架构**：总览只给结论（指标状态列、场景状态点、证据计数），证据 / 客户反馈 /
    G3 判定下钻到场景详情。原先把证明铺满首屏，导致最该被看见的"哪个场景没证据"看不见。
  - **空态改为可执行**：文案从"描述缺席"改为"说明后果与动作"。线上 30/30 项目全空，
    空态是这个产品的主要形态。同时修掉 G0 工作台把同一句提示逐行重复 5 次。
  - **导出表单 v3.1 + 旧表单硬拒绝**：新增 `checkFormCompatibility()`。旧表单缺版本标记
    即判为 3.0 并拒绝导入，说明会丢失全部场景与指标引用——`poc-export` 是发给组员的离线
    HTML，旧副本会长期流通，静默部分导入会让组员误以为数据已记录。
  - **修复**：`ProgressItem` 仍在读已删除的 `items`，真实渲染时崩溃；台账英文枚举
    `priority` 泄漏到中文界面（显示 `high`）。
  - **测试**：新增四套结构合法的阶段夹具（G0 全空 / G2 刚起步 / G3 混合 / G4 全证明），
    用例 251 → 313。
- da24a78: 0.9.0 发布说明（本文件供发布 preflight 读取；详细条目见 CHANGELOG 的 0.9.0 段）
  
  - **阶段感知详情页**：骨架按 Gate 重排（G0 先基本信息与必填工作台，G3 先进展与证据，
    G4 先四维与结论）；被降级的区块收进「其他区块」折叠，字段一个不少。
  - **阻障口径统一**：把 12 条缺口规则、阶段停滞、未填金额、无进展记录、缺阶段起始日
    五类合成一个按项目分组的列表，并按来源分片计数；R12 已报的停滞不再重复计数。
  - **空态改工作清单**：详情页先给「待补清单」，直接点名缺哪个字段。
  - **总览收口**：KPI 顶条、预算三桶面板（未填金额时警告总额偏低）、阶段内完成度。
  - **详情基本信息补全**：客户名（`org` 字段此前由 Host 下发却从未渲染）、
    决策链与测后决策从 G0 计量条提到基本信息。
  - **v3 导出收集表单**：按 v3 字段生成自包含 HTML，导出的 YAML 可被 `PocStore` 原样读回；
    删除模型着已删字段的 `src/form.v1-deferred.ts`（912 行）。
  - **修复**：对话框渲染在 `.wd-shell` 之外导致覆盖层样式完全不生效（真实浏览器验证发现）。
  - **工程债**：修 `Stats.awaitingCustomer` 恒为 0；四份重复格式化函数收进 `src/client/format.ts`；
    补上算了却没渲染的公司筛选；英文界面不再出现中文全角冒号。

## 0.9.0

### Minor Changes

- 0.9.0 —— 让看板在真实台账上有内容
  
  起因是一次对真实台账（`skillre/workbranch`，30 个项目）的实测：`progress` 0 条、`plan` 全空、
  `outcome` 全空、四维覆盖 0/30，而插件的详情页把「进展流」当成核心。结果是三十个项目同时渲染
  三十个同样的空态。这一版按数据现实重排了页面。
  
  ### 0.7.0 · 让页面在真实数据下有内容
  
  - **阶段感知详情页**：骨架按 Gate 重排——G0 先看基本信息与必填工作台，G3 先看进展与证据，
    G4 先看四维与结论。被降级的区块收进「其他区块」折叠，字段一个不少。
  - **阻障口径统一**：新增 Host 聚合 `BlockerBoard`，把 12 条缺口规则、阶段停滞、未填金额、
    无进展记录、缺阶段起始日五类合成一个按项目分组的列表，并按来源分片计数。R12 已报的停滞
    不再被第二个来源重复计数。
  - **空态改工作清单**：详情页先给「待补清单」——直接点名缺哪个字段（如 `decision_chain`），
    而不是重复三十次「还没有进展记录」。
  
  ### 0.8.0 · 总览收口
  
  - **KPI 顶条**：项目总数 / 进行中 / 预算合计 / 有阻障 / G0 已通过，外加一组可点的阶段 chip。
  - **预算面板**：把「G0 已通过 / 待评审 / 未填金额」三桶摊开，未填金额时明确警告总额偏低——
    一个静默漏掉四个项目的合计比没有合计更糟。
  - **阶段内完成度**：漏斗在「30 个项目全在 G0」时退化成一列，这一层补上「这 30 个里有几个
    已经攒齐 G0 自己的证据」。
  - **详情基本信息补全**：客户名（`org.system` / `org.company`）此前由 Host 下发却从未渲染；
    决策链与测后决策从 G0 计量条提到基本信息，缺失时明说而不是留空。
  
  ### 0.9.0 · 导出收集表单
  
  - 新增 `src/form.ts`：按 v3 模型生成自包含 HTML 收集表单（G0 五必填 / 计划 / 进展追加），
    导出的 YAML 能被 `PocStore` 原样读回。
  - 新增 `export-form` RPC action 与「导出表单」按钮：默认导出当前筛选可见的项目，
    不选则生成空白新建表单。
  - 删除 `src/form.v1-deferred.ts`（912 行）：它模型的是 v3 已移除的字段，
    发给组员的文件台账根本读不了。
  
  ### 工程债
  
  - `Stats.awaitingCustomer` 此前恒为 0（`let` 从未自增），改为按最新进展的客户认可度统计。
  - 抽出 `formatWan` / `formatDate` / `stageLabel` / `clockOf` 到 `src/client/format.ts`，
    删掉四份重复实现与三处死代码。
  - 公司筛选维度此前算了却没渲染，补上 chip。
  - 英文界面不再出现中文全角冒号（`数据源：` 改为字典键）。
  - 删掉已无引用的统计条与待处理栏字典键与 CSS。
  - README 里 `gates.G0..G4.complete` 的说法订正为 v3 实际字段。

## 0.6.0

### Minor Changes

- Align the repository with fleet template 0.11.0 / policy 0.16.0, and fix two real
  test defects that kept CI red on `main`.
  
  **Display contract: migrated to the shared implementation**
  
  `scripts/preview.mjs` and `scripts/prepare-release.mjs` now import
  `scripts/display-contract.mjs` instead of each carrying their own copy of the rules.
  The local copy had drifted from npm on the one case that matters: `files` is not an
  allow/deny list, so a directory entry (`docs`) contributes ignores while a file entry
  becomes a strict inclusion. The old code re-implemented that model and got it
  backwards, which is why the published 0.5.0 tarball shipped `docs/PREVIEW.md` — the
  internal whiteboard registry with its Feishu document links and tokens — even though
  `files` intended to exclude it. Release gating now runs against a real `npm pack`
  file list, so the repository check, `prepare-release` and the fleet audit cannot
  disagree, and they cannot disagree with npm either.
  
  `package.json#files` gains the explicit `"!docs/PREVIEW.md"` exclusion. Verified by
  packing: the file is present at the previous commit and absent now.
  
  **CI: two genuine failures, both on `main` today**
  
  - `tests/plugin.spec.ts` built its temporary cache roots as `${TMPDIR}/name-stamp`.
    Runners export `TMPDIR=/tmp`, which is only two path segments deep, and the plugin
    refuses a cache root shallower than three — it wipes that path at mount, so a
    shallow root could delete `/tmp` itself. The guard was right; the test fixture was
    wrong. It now nests under a fixed sub-directory, so the depth floor holds on every
    platform.
  
  - `tests/view.spec.tsx` failed every one of its 41 assertions on Node 26. Node 26
    defines its own experimental `globalThis.localStorage`, and vitest's jsdom
    environment only copies a window property onto the global when that name is not
    already present — so the runtime stub shadowed the real Storage, `browserStorage()`
    correctly reported "unavailable", and the persistence assertions could not pass.
    The suite now installs jsdom's Storage when the global is not usable, and fails
    loudly if neither is available rather than passing vacuously. Both directions were
    verified on real Node 26: 41/41 failing before, 41/41 passing after.
  
  **Policy alignment**
  
  `AGENTS.md` gains the three sections the current template requires and this
  repository was missing: release authority, update readiness, and the display
  contract. `package-lock.json` had been left at `0.1.0` since the first commit while
  `package.json` moved on; it is re-synced.

## 0.5.0

### Minor Changes

- Ship the three POC skills inside the plugin package and rewrite them for v3.
  
  The `poc-ledger`, `poc-export` and `poc-submit` skills were built before the
  dashboard and installed separately into the user's skill directory. The ledger
  then moved from v1 to v3, and the skills kept teaching the model fields that no
  longer exist: `why_customer_test`, `result`, `timeline`, `gates.G0..G4`,
  `success_criteria`. They also pointed at `~/dsh-test/poc_form.py`, a v1 generator
  whose output the current ledger cannot read. This release fixes all of that and
  removes the drift permanently by shipping them in the same package.
  
  **Bundled, not separately installed**
  
  - `skills/poc-ledger`, `skills/poc-export`, `skills/poc-submit` ship in the
    tarball (`package.json#files`), so installing the plugin publishes them and
    uninstalling removes them. They can no longer be a different version from the
    data model they describe.
  - `src/skill.ts` registers all three through DSH's `skills` service
    (`ctx.skills.register`, `source: 'bundled'`), binding each disposer to the
    plugin's own Fiber. `skills` is an optional service resolved with `ctx.inject`,
    never a static dependency: a profile without a skill registry still mounts the
    dashboard, and each skill is registered inside its own try/catch so one bad
    file cannot take the others down.
  
  **What was wrong, and what it says now**
  
  - `poc-ledger`: rewritten for the v3 shape (identity / gate0 / plan / progress[] /
    outcome), the twelve gap rules instead of eight, the four dimensions read from
    `outcome` with derived-vs-manual tagging, and the three rule caveats that keep
    the rules from over-firing (R4–R6 skip empty lists, R8–R10 read only the newest
    entry, R12 does not fire without `stage_since`).
  - `poc-export`: now runs the bundled `scripts/export-form.mjs` instead of the
    dead external Python generator. The new script is a real v3 form: identity /
    G0 / plan / one appended progress entry / outcome, with autosave keyed by
    project id (the old generator keyed on generation time, so drafts were
    unreachable), live gap counting, focus preservation while typing, and JSON
    output that `poc-submit` can consume.
  - `poc-submit`: rewritten to merge into v3 YAML — append to `progress[]` with the
    next `seq` and keep every untouched field — instead of copying a whole v1
    `result` block.
  
  **Verification**
  
  - 17 new unit tests over the parser and the registration path, including content
    assertions: the ledger skill must not present removed v1 fields as schema, must
    list all twelve rules, and the export skill must point at the bundled script.
  - The isolated-profile integration run now asserts that all three skills are
    present in the installed package AND that each one actually reached the skill
    catalog at boot (`bundled-skills-registered`, 31 checks total).
  - The generated form was driven in a real browser: gap counters update live,
    focus survives typing, and the draft persists across reloads.

## 0.4.0

### Minor Changes

- Adopt the fleet display contract and document the real update mechanism.
  
  **Display contract (the plugin card and detail page)**
  
  - `locale/{zh,en}.json` now carry `meta.detail`, and both descriptions were
    rewritten to the card-subtitle budget (≤120 characters). The English one was
    over budget at 249 and would have been truncated in the plugin list.
  - `docs/DETAIL.zh.md` / `docs/DETAIL.md` hold exactly one preview image each, as
    the contract requires; the long-form content stays in the README.
  - `docs/preview.zh.svg` / `docs/preview.svg` are new 640×300 artwork showing the
    real interface: the DSH window with the sidebar entry selected, the six-figure
    portfolio band, three project cards and the rule-grouped pending rail. They are
    hand-authored to the parser's allowed element set (no `<pattern>`, `<clipPath>`,
    `<mask>`, `<image>`; text as `<text>`; orthogonal polylines).
  - `docs/PREVIEW.md` records the whiteboard round-trip and what the artwork shows.
  - `package.json#files` ships `docs` (the detail page reads the image from the
    package directory, so without it the page would render blank with no error) but
    excludes `docs/evidence`, which is 3.3 MB of verification screenshots that
    belong in the repository, not in every install.
  - `scripts/preview.mjs` plus `preview:check` are wired into `npm run check`, so a
    broken preview now fails the build instead of shipping blank.
  
  **Update mechanism**
  
  - Fixed a real bug: `cordis.patch.yml` still declared `staleDays: 30`, a key the
    schema no longer has. Schemastery accepts unknown keys, so the row mounted and
    silently produced `stallDays` at its default instead of the configured value.
    It now declares `stallDays: 45`.
  - README (both languages) and `RELEASING.md` now state the actual update rules
    instead of implying updates work everywhere: the plugin manager's Versions
    block only covers third-party bundles installed from the npm registry under
    their own package name. A market (Git) install has no Versions block and can
    only be upgraded by uninstall + reinstall. The npm channel is therefore the
    update mechanism, not just distribution, and the docs say how to switch.
  - Documented the two invariants that keep updatability: no `PROTECTED_PLUGINS`
    management row in the bundle patch, and an honest `engines.dsh`.

## 0.3.0

### Minor Changes

- 42b7c9f: Migrate the POC Operations module to the v3 ledger model.
  
  The ledger moved from v1 (flat fields + `result` + `timeline`) to v3
  (identity + gate0 + plan + `progress[]` + outcome), so every v1 read path
  was replaced:
  
  - **Parser** reads the v3 blocks. `progress[]` is the history now; there is
    no `timeline` array and no `result` block any more.
  - **Four dimensions** come from `outcome` (`achievement`, `our_proof`,
    `customer_recognition`, `business.milestone`). Each card is tagged
    自动推导 or 人工填 so it is clear which side supplied the value.
  - **Progress stream** is new and is the core of this release: every entry
    renders as a timeline node with goal, scope, actual result, completion,
    evidence chips, customer sync/feedback/recognition, G3-1/G3-2 and the
    next step. Projects with no progress show an explicit empty state —
    which is every project in the ledger today.
  - **Gap rules** grew from 8 to 12 (R1–R12), each pinned by its own test.
  - **Stat strip** is now POC总数 / G0通过 / 进行中 / 金额合计.
  - **Table** is 项目 | 体系/公司 | 阶段 | 金额 | 最新进展 | 缺口 | 操作.
  
  Verified against the real v3 data before any UI work: 23 projects, 6050万
  total, 1 G0 passed, 0 G0 complete, R1 firing on all 23, R2 on 7.
  
  The export form is hidden in this release: it still models v1 fields, and
  shipping it would hand colleagues YAML the v3 ledger cannot read. It is
  preserved at `src/form.v1-deferred.ts` for the v3 rewrite.
  
  Two defects found and fixed during verification: gap titles rendered through
  `t()` instead of `format()`, leaking literal `{amountWan}`; and the detail
  identity line still carrying the removed v1 `{tier}` key.
- Redesign the console: a portfolio band, three readings of the project list, and a layered detail page.
  
  The previous release made the plugin *correct* for the v3 ledger but left it
  looking like a table with a header. This release is about the reading
  experience — the same data, shown in more shapes, and laid out so the page
  answers a question instead of listing rows.
  
  **Overview**
  
  - **A portfolio band** replaces the four flat counters. Six figures, each a
    hand-built SVG/flex chart: the stage funnel (columns, tinted red where a stage
    carries a high gap), the system/company amount breakdown, the `poc_type`
    composition (donut), the amount-concentration list, the four-dimension
    coverage (four radial meters), and which gap rules fire most. Every figure is
    also a filter — clicking a segment narrows the list below it, so a chart and a
    filter cannot disagree. The band collapses to its header in one click.
  - **Three readings of one dataset**: cards (default), board (one column per
    stage), and table (the spec's seven columns, with sortable headers, sticky
    head, and an amount bar behind each figure). The shell filters and sorts once,
    so switching modes can never change which projects are visible.
  - **A toolbar**: search across name / id / owner / company, composable filter
    chips for system, stage, status and type, a sort selector and direction
    toggle, and a live result count.
  - **Keyboard path**: `↑/↓` moves a visible cursor, `Enter` opens the focused
    project, `Esc` returns, `/` focuses search.
  - **The pending rail groups gaps by rule**, so twelve rules over twenty-three
    projects reads as a systemic pattern instead of a repeated to-do item.
  
  **Detail page**
  
  - Two panes: a sticky identity rail (name, amount, vertical stage track, the
    four dimensions, the gaps, people, and prev/next) and a scrolling reading pane.
  - The **progress stream** is the centrepiece: each entry is a card on a vertical
    timeline with a recognition-toned node, a goal→actual pair, scope chips,
    evidence as real anchors, customer sync/recognition, G3-1/G3-2, a completion
    meter parsed from the percentage, and a next-step block that says so when the
    next step is missing.
  - **Purpose-built shapes per section** instead of a field dump: a five-cell G0
    completeness meter with the narrative fields rendered as prose, a criteria
    table, a numbered scenario list, severity-marked risks, and a milestone
    callout that turns gap R11 into a finding rather than an empty field.
  
  **Risk board and timeline**
  
  - Risks are grouped into severity swimlanes with a distribution figure above
    them; the timeline is grouped by month with a monthly sparkline, and rounds
    with no evidence or no customer feedback are marked explicitly.
  
  **Engineering**
  
  - Charts are hand-built (no new dependency): the client bundle may only
    externalise `react`, so every figure is SVG or flex geometry, with
    `role="img"`/`aria-label` and a text summary for screen readers.
  - Styles are split per surface (`css/base`, `charts`, `overview`, `detail`,
    `insights`) and assembled in a fixed cascade order, so four modules could be
    built in parallel without touching each other's sheets.
  - The Host now computes and ships `snapshot.analysis` (stage/org/type/amount/
    dimension/rule aggregations) and `detail.gate0.checklist` (the five G0
    prerequisites, including `tech_owner` from the identity block), so the Client
    never re-derives a figure the list contradicts.
  - Tests: 172 unit (up from 151), including a new dictionary-parity suite that
    fails when a key or a placeholder exists in only one locale.

This file is maintained by Changesets. The generated project shell has not been released.
