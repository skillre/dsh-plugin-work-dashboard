# @skillre/dsh-plugin-work-dashboard · 工作看板

> 状态：experimental · 面向 DSH `0.2.2-rc.1`

在 DSH 左侧栏加一个「工作看板」入口：一个**多模块**运营看板，把正在推进的事情放到一个地方看清楚，再决定下一步补什么。目前只有第一个模块 **POC 运营**。

[English](README.en.md)

## 为什么是「多模块」

原来这个插件叫「POC 运营台」，只服务 POC 台账这一件事。改名成「工作看板」是因为它长成了**看板的容器**：顶部的模块切换条是座位，POC 运营是第一个坐进去的模块，后续模块（比如客户拜访、招聘进展、项目复盘）会陆续加入同一个 Host 行，不需要新插件。

所以现在的结构是：

```
工作看板（插件）
└── POC 运营（模块 1，唯一已实现）
    ├── 项目总览   统计条 + 项目表 + 待处理清单
    ├── 项目详情   阶段轨道 / 四维结果 / 阶段记录 / 时间线
    ├── 风险看板   按等级排序（高 → 中 → 低 → 未评级）
    ├── 全局时间线 所有复盘记录按日期从新到旧
    └── 导出表单   给组员填写的自包含 HTML
```

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

### 项目总览

- 四个统计条（进行中 / 待补 G0 / 有风险 / 可转化）
- 项目表格：项目、阶段、四维状态、缺口、操作
- 待处理清单：按严重度排序的缺口

### 四维与阶段

- **四维状态**：目标达成、证据、客户认可、下一步**永远四格分开**，每格独立显示有/无。
- **阶段轨道**：G0→G4 横向轨道；表格里是五点紧凑版，详情页是完整版。完成状态取自台账自己的 `gates.G0..G4.complete`，不由当前阶段位置推断。
- **详情页**：阶段轨道、四维结果、本项目缺口、G0 立项三必填、五条阶段记录、指标/场景/风险、追加式时间线。

### 增强视图

- **风险看板**：所有项目的风险按等级排序（高 → 中 → 低 → 未评级），带等级计数、应对措施与「同项目还有 N 处缺口」的上下文。
  - **未评级排在最后**：不是「不严重」，而是还没判断；排在最前会埋掉真正被评估为严重的风险。
- **全局时间线**：所有项目的复盘记录按日期从新到旧，附月份分布条与「完全没有时间线」的项目清单。

### 导出表单

- 勾选一个或多个项目 → 生成**一个自包含 HTML 文件**并下载。表单没有 CDN、没有外部字体、没有服务器，双击即可在离线机器上填写。
  - **自动保存**：`localStorage`，键由**项目集合**派生（不是生成时间），所以同一个项目集重新生成表单时能找到同一份草稿。
  - **实时校验**：指标 2–3、场景 3–5、风险 ≤3、G0 四项必填，每次编辑即重算。
  - **下载真实 YAML**：不是 JSON。生成的值会按 YAML 规则正确加引号/块标量，所以组员回传的文件可以直接拿去用。
  - **批量导出**：多选项目打包进同一个表单；下载时**每个项目一个 `.yaml` 文件**（YAML 文件只能装一个项目的映射，拼接会产生重复键）。

## 8 条缺口规则

规则硬编码在 `src/gap.ts`（纯函数，无时钟无文件系统，全部由 `tests/gap.spec.ts` 逐条锁定）：

| # | 规则 | 触发条件 | 级别 |
|---|---|---|---|
| 1 | G0 三必填缺失 | `why_customer_test` / `why_we_test` / `customer_tech_owner` 任一为空（**三条分别报出**，指明缺哪个字段） | high |
| 2 | G1 聚焦超限 | 指标 > 3、场景 > 5 或风险 > 3 | medium |
| 3 | 前置未就绪已投人力 | `G2.prerequisites_ready: false` 且 `G2.engineers_invested: true` | high |
| 4 | 有结果无证据 | `result.achievement` 非空但 `result.evidence` 为空 | high |
| 5 | 有证据无认可 | `result.evidence` 非空但 `result.recognition` 为空 | high |
| 6 | 动作超期 | 有 `next_action_goal`，但最新 timeline 记录超过 `staleDays` 天（无 timeline 视为超期） | medium |
| 7 | **G4 达成但无下一步** | `result.achievement` 非空但 `result.next_milestone` 为空（排序最优先，priority 95） | high |
| 8 | 已关闭但四维未闭环 | `stage: closed` 但四维任一为空 | high |

规则 5 是链式的：它要求证据存在之后才算「缺认可」；若连证据都没有，规则 4 才是该报的那条。

## 数据与权限

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
    staleDays: 30
```

| 键 | 默认 | 含义 |
|---|---|---|
| `repository` | `skillre/workbranch` | 数据源，必须是 GitHub 上的 `owner/name` |
| `cacheRoot` | `~/.dsh/cache/work-dashboard` | 缓存根目录，启动时清空（`~` 会展开） |
| `defaultBranch` | `main` | 克隆跟踪的分支 |
| `cloneTimeoutMs` | `120000` | 单次 clone 上限 |
| `fetchTimeoutMs` | `60000` | 单次 fetch + reset 上限 |
| `staleDays` | `30` | 规则 6 的「多久没动算超期」阈值 |
| `remoteUrl` | `''`（即 `https://github.com/<repository>.git`） | 克隆地址覆盖：GitHub Enterprise、镜像，或本地测试仓库 |

> **关于超时默认值**：规格书建议 `cloneTimeoutMs: 30000`。实测同一网络下正常 clone 约 1.5 秒，但网络拥塞时一次 clone 用了 **68 秒**——30 秒会让首次使用间歇性失败。因此默认值提到 120 秒；超时仍会给出明确原因和【重试】。

## 安装

### 从插件市场安装（推荐）

本插件已发布到 `skillre` 的自建插件市场索引（Git 源，非 npm）：

```
https://skillre.github.io/dsh-plugin-market/index.json
```

1. DSH Web → **Plugins** → **More**（Experimental plugins）→ 启用 **Custom plugin markets**；
2. 出现 **Discover** 标签页 → **Index sources** → **Add index source** → 粘贴上面的 URL；
3. 在 Discover 里找到 **工作看板**，确认来源为 Git 仓库后点 **Install**。

索引里的版本钉在具体提交（`git+https://github.com/skillre/dsh-plugin-work-dashboard#<commit>`），仓库自包含：`lib/` 已提交、无 `scripts.prepare`，安装不会执行构建脚本。

### 用本地包

未发布到 npm 时，用构建出的 `.tgz` 绝对路径（见下方「构建与自测」），由你在插件管理器中选择安装来源。

## 构建与自测

```sh
npm install
npm run check                     # typecheck + 169 个单测 + lib 漂移检查 + 打包检查
npm pack                          # 产出 skillre-dsh-plugin-work-dashboard-0.1.0.tgz
```

**仅使用自己拥有的、可丢弃的非 Desktop profile**做真实挂载验证：

```sh
node scripts/verify-isolated.mjs   # 真实 clone/fetch/详情/鉴权/重启清空 + 导出/风险/时间线，结束自清理
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
| 0.2.2-rc.1 | 通过 | 2026-11-05 | 打包安装 + 有界启动 + 真实 clone + 隔离集成 + Web UI 断言（见 `compatibility.json`） |

机器可读证据在 `compatibility.json`，截图与报告在 `docs/evidence/`。**未验证 Desktop Client（Electron）**：它的 profile 由应用管理，本 CLI 测试台无法驱动，Desktop 发布前需在那里重做一次视觉检查。

## 已知限制

- **每次 DSH 重启缓存清空**，需要重新点【刷新】（clone 约 1.5 秒，慢网络更久）。这是既定行为。
- **只读**：不提供导入、编辑、提交 PR。缺口只能看，不能在看板上改。
- **规则 6 的日期来源**：schema 里 `next_action_goal` 是自由文本、没有日期字段，所以「多久没动」只能取最新一条 `timeline` 的日期；完全没有 timeline 的项目一律视为超期。
- **定时刷新只在页面打开时生效**，关掉页面就停——预期行为。
- **批量表单一次下载多个文件**：浏览器可能会询问是否允许多文件下载；YAML 文件只能装一个项目，所以每个项目一个文件。
- **表单导出的是整文件替换**：组员回传的 YAML 覆盖 `projects/<poc_id>.yaml`，不做字段级合并。
- 私有仓库要求本机 `gh` 已登录且账号有读权限；未登录时刷新会明确报「gh 未登录」。
- **只有一个模块**：模块切换条目前只坐着一个模块，后续模块会加在同一个 Host 行里。

## 安全与权限

- 唯一写入目标是 `cacheRoot`（以及其中的 `.lock`、所有权标记、clone 目录）。
- 唯一网络目标是通过 `git` 访问 `github.com`。
- 唯一外部命令是 `git` 与 `gh`（`gh auth token`），都在 Host 侧、都以超时和进程组终止兜底。
- 不读用户其他文件；不上报遥测；不注册模型工具。

## License

MIT
