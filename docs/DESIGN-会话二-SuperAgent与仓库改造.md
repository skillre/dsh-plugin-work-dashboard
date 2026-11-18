# 会话二范程：SuperAgent + workbranch 仓库改造

> 本会话**不碰看板 UI**（看板设计在另一个会话进行）。
> 本会话负责：机器判断层的设计与落地 —— SuperAgent 配置/技能、workbranch 仓库结构、schema 演进、定时巡检。
> 数字来自 2026-11-18 对线上 `skillre/workbranch` 实测：30 个项目 / 6400 万，30 个全在 G0，decision_chain 与 post_poc_decision 各 0/30，progress 0 条。

---

## 0. 边界：本会话做什么、不做什么

| 做 | 不做 |
|---|---|
| workbranch 仓库结构、schema 演进、rules.yaml 单一源 | 看板页面、组件、视觉、交互（另一个会话） |
| SuperAgent 的 Policy 规则、技能、prompt 段落、执行环境 | 插件 src/client 下任何 UI 代码 |
| 定时巡检触发链（launchd → issue → eval） | 表单 HTML 生成器（属插件侧 poc-export） |
| AI 判断的落盘契约（signals/） | 插件如何渲染这些信号（由另一会话消费） |

**两边唯一的接口是 `signals/` 的 schema。** 本会话定契约，另一会话消费。契约一旦定下，两边可并行。

---

## 1. 机器判断的落盘契约（先定这个，两边才能并行）

### 1.1 为什么必须独立目录

插件只读 YAML，读不到 PR 评论。若 AI 的结论只写在评论里，看板永远不显示，第二天重跑还得重读全库。
同时**人写的事实与机器判断必须分文件**：混在同一 yaml 里，一次人工编辑就可能覆盖机器结论，且无法区分"谁说的"。

### 1.2 目录

```
projects/            人写的事实（30 个 yaml）
signals/             机器判断（agent 写、人只读）   ← 新增
```

### 1.3 文件格式

```yaml
# signals/POC-006.yaml —— 由 agent 通过 PR 写入；人工不手改
schema_version: "1.0"
poc_id: POC-006
generated_at: 2026-11-18T02:10:00+08:00
generated_by: skillre-q
rules_version: "3.2"            # 对应 config/rules.yaml 的 version
inputs:                          # 幂等键的构成，也是"结论基于什么"的凭证
  project_sha: 9f3c1ab           # projects/POC-006.yaml 的 blob sha
  rules_sha: 4d2e8f0             # config/rules.yaml 的 blob sha

gate_upgrade:
  eligible: false                # 能否升到 next stage
  from: G0-立项
  to: G1-方案设计
  missing: [decision_chain, post_poc_decision]     # 逐条可点
  basis: [gate0.complete]        # 已满足的依据
  note: 五必填未齐，无法判定

health:
  level: bad                     # ok | warn | bad
  facts_stale_days: null         # 最后一条 progress 距今天数；无进展为 null
  judgment_stale_days: 31        # gate0.review.reviewed_at 距今天数
  reasons: [进展为空, 缺决策链, 缺测后决策]
  next_action: { text: 补齐决策链与测后决策, owner: 靳承德, due: 2026-11-22 }

risks:                           # 结构化，供风险看板直接消费
  - { id: R-POC006-1, level: high, text: 决策链未明确, source: gate0 }
```

### 1.4 三条硬规则

1. **signals 只由 agent 账号提交**。人工要改结论 → 改 projects 里的字段，让下一次巡检重算。
2. **signal 文件缺字段时看板必须优雅降级**，不能因为 schema 演进把整页打空。
3. **幂等键 = project_sha + rules_sha**。两者都没变就跳过写文件，避免每天产生无意义 PR。

---

## 2. workbranch 仓库改造

### 2.1 目标结构

```
projects/              30 个人写台账
signals/               ← 新增
schemas/
  poc-schema.md        字段定义（人读）
  enums.yaml           枚举（机器校验）
config/
  rules.yaml           ← 新增：12 条规则的唯一源（含阈值与 version）
  health.yaml          ← 新增：陈旧度阈值（facts/judgment 两套）
templates/
  daily-advisory.md    ← 新增：每日巡检 issue 正文模板
.github/
  workflows/validate.yml   ← 新增：机械校验
  ISSUE_TEMPLATE/daily.yml ← 新增：定时触发器的固定格式
```

### 2.2 `config/rules.yaml` 草案（唯一源）

```yaml
version: "3.2"
large_amount_wan: 300
criteria: { min: 2, max: 3 }
scenarios: { min: 3, max: 5 }
risks: { max: 3 }
rules:
  - { id: R1, name: G0 五必填缺失,   level: high,   priority: 90 }
  - { id: R2, name: 大金额未过 G0,   level: high,   priority: 94, uses: large_amount_wan }
  - { id: R3, name: G0 通过无计划,   level: high,   priority: 92 }
  - { id: R4, name: 成功标准不聚焦, level: medium, priority: 50, uses: criteria }
  - { id: R5, name: 场景不聚焦,     level: medium, priority: 48, uses: scenarios }
  - { id: R6, name: 风险超限,       level: medium, priority: 46, uses: risks }
  - { id: R7, name: G2 未就绪已开测, level: high,  priority: 84 }
  - { id: R8, name: 进展无证据,     level: high,   priority: 82 }
  - { id: R9, name: 有证据无认可,   level: high,   priority: 80 }
  - { id: R10, name: G3-1 无 G3-2,  level: high,   priority: 78 }
  - { id: R11, name: 达成无下一步,  level: high,   priority: 96 }
  - { id: R12, name: 阶段停滞,      level: medium, priority: 40, uses: health.stall_days }
```

**规则只有这一份**。插件构建期由它生成常量，skill 由它渲染，agent 读取它。三处不一致的问题从根上消除。

### 2.3 `config/health.yaml` 草案

```yaml
# 陈旧度：事实与判断分开算，避免 30/30 项目同时变红
stall_days: 45              # 阶段停滞阈值（沿用现状）
facts:
  progress_stale_days: 7    # 最后一条 progress 超过即"事实陈旧"——只对 G3+ 生效
  change_stale_days: 14     # 台账本身超过即"台账没人管"——对全部项目生效
judgment:
  g0_review_stale_days: 30  # G0 结论超过即"判断陈旧"
  plan_stale_days: 30
by_stage:                   # 按阶段分层，不同阶段抄不同作业
  G0: [change_stale_days, g0_review_stale_days]
  G1: [change_stale_days, plan_stale_days]
  G2: [change_stale_days, progress_stale_days]
  G3: [change_stale_days, progress_stale_days]
  G4: [change_stale_days, progress_stale_days]
```

### 2.4 CI 校验（只做机械检查）

| 检查 | 失败即不可合并 |
|---|---|
| YAML 可解析、顶层键合法 | ✓ |
| `poc_id` 与文件名一致、无重复 | ✓ |
| 枚举值在 `enums.yaml` 范围内 | ✓ |
| 必填键存在（不是值非空） | ✓ |
| `signals/*` 只能由 agent 账号提交（提交者校验） | ✓ |
| **12 条业务规则** | ✗ 不进 CI，属于 agent 与看板的判断 |

### 2.5 治理现状（必须写进 README）

个人免费私有仓库**不支持分支保护/rulesets**（实测 403）。"必须走 PR"目前是约定而非平台强制，`skillre-q` 有 push 权限。三条路：升级 Pro / 迁公司 Enterprise / 接受并靠 CI 兜底。建议 v1 选第三条，并在 README 明确标注。

---

## 3. schema 演进（v3.1）

| 字段 | 位置 | 理由 | 谁写 |
|---|---|---|---|
| `schema_version: "3.1"` | project | 30 个文件零版本标记，插件无法安全演进解析 | 人（迁移脚本一次性写） |
| `updated_at` | project | 现在只能靠 mtime/git log 推断，插件是浅 clone 拿不到 | 人 / CI 回写 |
| `gate0.review.decided_by` | gate0 | 有 reviewer 却无"谁有权拍板"，与 decision_chain 呼应 | 人 |
| `gate_decisions[]` | project | **Gate 升级的审计轨迹**，没有它"升级"只是改了字符串 | 人（采纳 agent 建议时） |
| `plan.criteria[].status` | plan | 达标/未达标/未测，否则 criteria 只是愿望 | 人 / 进展同步 |
| `progress[].stage_at` | progress | 这条进展证明的是哪一关 | 人 |
| `health.acknowledged` | project | "我知道它停着"是需要被记录的决定，否则提醒无法消音 | 人 |

**不加**：任何 `ai_*` 字段写进 project。机器判断一律走 `signals/`。

---

## 4. SuperAgent 侧改造

### 4.1 定时巡检触发链

SuperAgent **不能自调度**（worker/router preset 均不含调度，触发器只有 GitHub 通知与飞书事件）。因此：

```
老 Mac launchd（已有 launchd 自启 + 每小时自检）
  └─ 每天 08:30 运行 scripts/daily-advisory.sh
       └─ gh issue create --title "[daily-advisory] YYYY-MM-DD" --template daily.yml
            └─ GitHub 通知 → agent 轮询 → eval → accept → worker
```

### 4.2 关键约束：触发者是机器人，不是人

官方的准入逻辑是：**真人**开了 issue 且未 @ agent → 「名单内未点名」这一格，默认 inferred。
但脚本用 `skillre-q`（agent 账号）开 issue 时，对系统来说是**机器人**，走的是机器人的路径，而**非名单内的机器人不接收**。所以必须显式把 `skillre-q` 加进 GitHub Source 的 **「评论可以成为候选的机器人」名单**（源码里是 `bots: [{id}]` 字段）。否则定时巡检永远进不了 eval。

这是最容易踩、也最难自查的一个坑：日志上表现为「received 一直是 0」，看起来像网络或权限问题。

### 4.3 隔离：只认固定前缀

`auto` 模式下，名单账号的任何 issue 都会被评估。加前缀隔离，把日常讨论排除在外：

- 规则文本明确写：只处理标题以 `[daily-advisory]` 开头的巡检 issue。
- 其余 issue 一律 ignore，并记录 `ignoredFromCard`。

### 4.4 幂等：全量评估、单分支更新

30 个项目每天一个新 PR 会淹没审阅者。做法：

- 固定分支名 `advisory/daily`（不带日期）。
- 存在 open 的该分支 PR → 向同分支追加 commit 更新它；不存在 → 新建。
- 若 worker 不允许向已存在分支追加（需实测），退化为「每天新建 + 自动关闭昨天的」，并在标题里带日期。

### 4.5 Policy 规则清单（在现有 4 条基础上增补）

| id | 名称 | instruction 要点 |
|---|---|---|
| `poc-data-sync` | 已有，保留 | 只允许增改 projects/ 下记录，禁改 schemas/、禁删文件 |
| `poc-gap-report` | 已有，保留 | 扫描缺口并输出报告 |
| `poc-form-export` | 已有，保留 | 生成收集表单（现在归插件，可降级为禁用） |
| **`poc-daily-advisory`** | 新增 | 只处理标题以 [daily-advisory] 开头的 issue；产出 signals/*.yaml；不改 projects |
| **`poc-gate-review`** | 新增 | 人工在 PR 里请求 gate 评估时，给出「能否升级 + 缺什么 + 依据」；只建议不升级 |
| `copy` | 保留但建议禁用 | 对台账无用 |
| `visual` | **必须禁用** | 官方示例规则，POC 数据场景会误判 |

### 4.6 两个新技能（写进 prompt 的 skills 字段）

**`advisory-write`**
- 读取 `config/rules.yaml` 与 `config/health.yaml`
- 对每个 project 计算 gate_upgrade / health / risks
- 产出 `signals/<poc_id>.yaml`，字段严格按 §1.3
- 幂等：project_sha + rules_sha 都没变就跳过
- **绝不修改 projects/**，绝不改 schemas 或 config

**`gate-review`**
- 输入：某个项目的当前事实 + 规则 + 该项目的 signals
- 输出：能否升到下一阶段、缺哪几项、每项依据哪条证据、谁拍板
- 结论必须结构化（对应 signals 的 gate_upgrade 块），不能是散文
- 升级动作**不由 agent 执行**：agent 只在 PR 里给出建议，人在合并时把 `stage` 改掉并补 `gate_decisions[]`

### 4.7 Prompt 段落要改的三处

| 段落 | 现状 | 改成 |
|---|---|---|
| team/delivery（交付要求） | UI 截图相关 | POC 数据规则：证据必须可点、signals 格式、不得编造 |
| team/scope（工单范围） | 通用 | 明确：只读 projects、只写 signals、只在 PR 里说话 |
| team/communication | 通用 | 飞书只推两类：每日摘要、有升级建议时单条 |

### 4.8 执行环境

- `prepare` 命令：clone `workbranch` 到 ticket 目录（已配置，需确认指向正确仓库）。
- `blockedCommands`：把 `git push --force`、`git reset --hard origin/main` 之类硬破坏命令列进去。
  ⚠️ 官方文档明确「这些包装器建立的是默认值，不是安全边界」——worker 仍可用绝对路径绕过。所以真正的防线是分支保护（目前不可用）与人工审阅。

---

## 5. 落地顺序

| 步骤 | 内容 | 依赖 | 谁做 |
|---|---|---|---|
| 1 | `config/rules.yaml` + `config/health.yaml` 落库 | 无 | 我（生成 PR） |
| 2 | schema v3.1 字段迁移脚本（30 个项目补 schema_version / updated_at / stage_at） | 1 | 我 |
| 3 | `.github/workflows/validate.yml` + ISSUE/PULL_REQUEST 模板 | 1 | 我 |
| 4 | 把 `skillre-q` 加进 bots 名单；禁用 visual 规则 | 老 Mac 可达 | 我（SSH 到老 Mac） |
| 5 | 两条新 Policy 规则 + 两个新技能 | 4 | 我 |
| 6 | `daily-advisory.sh` + launchd plist | 5 | 我 |
| 7 | 首次试跑：手动造一个 [daily-advisory] issue，验证 signals 落盘 | 6 | 我 |
| 8 | 飞书提醒收敛 | 7 | 我 |

**第 1–3 步不依赖老 Mac**（当前 SSH 到 192.168.3.11 失败：22 端口开但 kex 阶段被关，需你回家确认机器状态或开启远程登录）。可以立刻开始。

---

## 6. 需要你拍板的四件事

| # | 问题 | 建议 |
|---|---|---|
| 1 | `signals/` 独立目录，还是塞进 project yaml？ | **独立目录**（机器写与人写永不混文件，一次编辑不会覆盖另一边） |
| 2 | 定时巡检用 agent 账号开 issue（需加 bots 名单），还是你手动开？ | **agent 账号 + bots 名单**，否则做不到"每晚自动" |
| 3 | 每日巡检产出一个大 PR，还是每个项目一个 PR？ | **一个大 PR（固定分支）**，否则审阅成本爆炸 |
| 4 | Gate 升级由 agent 直接改 stage，还是只建议？ | **只建议**，人在 merge 时改并补「gate_decisions[]」审计字段 |
