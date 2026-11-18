# 工作看板 1.0 · 围绕 SuperAgent 的整体优化方案

> 依据：便签「工作看板整体优化」+ 详设稿 `看板- POC项目详情页设计稿.drawio` + 另一个会话里老 Mac 上已跑通的 SuperAgent。
> 本文只做设计与决策，不含实现。数字全部来自对线上 `skillre/workbranch` 的实测（2026-11-18 拉取）。
> **看板 UI 不在本会话范围**（另开会话），可执行细节见 [会话二范程](DESIGN-会话二-SuperAgent与仓库改造.md)。

## 0. 读数：真实台账现在长什么样

| 事实 | 值 |
|---|---|
| 项目数 / 金额 | **30 / 6400 万** |
| 阶段分布 | **30 / 30 全部停在 G0-立项**（G1–G4 零样本） |
| gate0.review.conclusion = 通过 | **1** |
| decision_chain 有值 | **0 / 30** |
| post_poc_decision 有值 | **0 / 30** |
| plan.criteria / plan.scenarios 有值 | **0 / 30** |
| progress 记录 | **0 条** |
| stage_since 填了 | 30 / 30 |
| amount_wan 缺 | 4 |
| 人在用的插件版本 | 0.9.0 |

**这张表决定了优化的顺序**：G3/G4 的漂亮展示现在做出来没有一条真实数据；而"G0 五必填"和"多久没动"这两件事，30 个项目全都命中。所以视觉重做不能只重做结果页，必须先把 G0 阶段的门面做出信息量。

---

## 1. 对草稿四条方向的评估

| 草稿 | 判断 | 理由 | 改造点 |
|---|---|---|---|
| ① 更新信息时检查能否 Gate 升级，AI 建议 → 人工审核 → 完成升级 | ✅ 方向正确，这是整个系统的价值中枢 | 台账的现实是"没人愿意给自己打分"，所以升级判定必须由系统先提，人只做否决。这与已定的"agent 提 PR、人 merge"天然同构 | "检查"必须发生在**唯一写入点**，不是插件；建议产物必须**结构化落盘**而不是聊天里说；必须**幂等**，否则每天一个 PR |
| ② 每天晚上自动跑全部项目 | ⚠️ 半对：**SuperAgent 不能自调度** | 官方设计里 worker 与 router 的 preset 都不含调度能力，触发器只有 GitHub 通知与飞书事件。所以"每晚跑"必须由**外部定时器造 Trigger** | 老 Mac 上 launchd（已有）每天定点造一个固定格式的 issue；agent 侧规则只认这个前缀，其余 issue 忽略，避免 auto 模式误接单 |
| ③ 每周五检查、超 7 天未更新要提醒 | ⚠️ 概念对，**指标选错了** | 实测 30/30 项目 progress 为空，若按"7 天没更新"算，今天就已经 30 个全红——提醒退化成噪声，等于没有提醒 | 拆成两个独立信号：**事实陈旧**（最后进展/最后变更日期）与**判断陈旧**（G0 结论/计划是什么时候定的）。阈值分层：G0 看信息完整度，G3+ 才看进展停滞 |
| ④ 看板太呆板，交互与视觉大升级（按详设稿） | ✅ 必须做，但稿子是**信息分区**，不是交互 | drawio 给的是 8+4 两栏信息布局（左：G0 信息 / 关键场景 / 关键风险；右：基本信息 / 项目进展 / 项目风险）。它解决了"信息在哪"，没解决"看一眼该得什么结论、下一步点哪里" | 保留 8+4 的分区意图，重做三件事：**顶部结论条**、**进展与风险分开的视觉语言**、**下一步与 Gate 结论常驻** |

---

## 2. 草稿没覆盖、但决定成败的三个结构性缺口

### 缺口 A：AI 的结论无处安放

现在的链路是：Agent 在 PR 里**写评论** → 人看评论 → 人 merge。
插件**看不到评论**，它只读 YAML。于是"AI 建议升级"永远只是聊天记录，看板上什么都不会变，第二天重跑还得重新读一遍。

**必须给 AI 产物一个契约位置。** 建议新增只读目录 `signals/`（与 `projects/` 并列，机器生成、人只读）：

```yaml
# signals/POC-006.yaml   ← 由 agent 通过 PR 写入，人工不手改
generated_at: 2026-11-18T02:10:00+08:00
generated_by: skillre-q
rules_version: "3.1"
gate_upgrade:
  eligible: true
  from: G0-立项
  to: G1-方案设计
  blockers: []            # 还差什么，逐条可点
  evidence: [gate0.complete, plan.criteria]
health:
  level: warn             # ok | warn | bad
  days_since_change: 12
  reasons: [进展为空, 缺决策链]
  next_action: { text: 补齐决策链, owner: 靳承德, due: 2026-11-22 }
```

约定：**项目 YAML 只放人写的事实，signals 只放机器判断**。二者永不同文件，看板上用「机器建议」图章区分（沿用已定的"自动推导 vs 人工填"哲学）。

### 缺口 B：规则的单一事实源已分裂成三份

同一套 12 条规则，现在存在于：

1. `workbranch/schemas/poc-schema.md`（文档里的表格）
2. 插件 `src/gap.ts`（TypeScript 硬编码，注释明确说"故意不跟仓库脚本漂移"）
3. 插件 `skills/poc-ledger/SKILL.md`（给对话用的自然语言版）

三份各自演进，规则编号、阈值（300 万 / 2–3 项 / 45 天）、判定口径迟早对不上。当 Agent 和看板给出不同结论时，用户只会失去信任。

**建议**：`workbranch/config/rules.yaml` 成为唯一源；插件构建期生成常量并加 CI 断言；skill 由同一文件渲染。规则版本号写进 `signals/`。

### 缺口 C：看板里已经存在两个"四维真相"

- `src/gap.ts` 的 `readDimensions`：证据 = `outcome.our_proof` **或** 最新进展的 `evidence` 非空
- `src/client/detail.tsx` 的侧栏：证据 = `outcome.our_proof !== ''`

也就是说，一个项目"最新进展挂了压测报告、但没写 outcome"，缺口引擎认为**有证据**（并据此判 R9），而侧栏显示**证据 ✗**。这正是这套设计最不该出现的自相矛盾，而且测试夹具都是空台账，测不出来。

---

## 3. 重构后的责任分工（本文最重要的结论）

| 能力 | 谁做 | 为什么 |
|---|---|---|
| 判定 Gate 能否升级 | **SuperAgent**（读规则 + 证据） | 需要跨字段推理，规则会变，改提示词比改代码快 |
| 落盘 AI 建议 | **SuperAgent**（写 `signals/`，走 PR） | 唯一写入点，留痕、可回滚 |
| 每日/每周巡检 | **老 Mac launchd** 造 Trigger | Agent 不自调度 |
| 业务判断的最终生效 | **人**（GitHub merge） | Agent 不合并自己的 PR |
| 展示与下钻 | **插件**（只读） | 插件不写库，避免分叉 |
| 提醒 | **飞书**（只提醒，不审批） | 已定 |
| 机械校验（格式、枚举、必填） | **workbranch 的 GitHub Actions** | 无关业务判断，越早拦截越省 agent 算力 |

一句话：**SuperAgent 是判断层，GitHub 是事实层 + 审批门，插件是阅读层。三层各只有一个职责，且只有 GitHub 是写入点。**

---

## 4. 数据契约 v3.1（要加的字段，都是被草稿逼出来的）

| 新增 | 位置 | 为什么 |
|---|---|---|
| `schema_version: "3.1"` | 每个 project | 30 个文件已存在，但没有任何版本标记，插件无法安全演进解析 |
| `updated_at` | 每个 project | 现在只能靠文件 mtime 或 git log 推断，插件是浅 clone，拿不到 |
| `gate0.review.decided_by / decided_at` | gate0 | 已有 reviewer/reviewed_at，但缺"谁有权拍板"，与 decision_chain 呼应 |
| `gate_decisions[]` | project 顶层 | **Gate 升级的审计轨迹**：`{from, to, decided_at, decided_by, basis: human|agent-suggested, signals_ref}`。没有它，"升级"就只是把 stage 改了一个字符串 |
| `plan.criteria[].status` | plan | 验收时这条标准是达标/未达标/未测，否则 criteria 只是愿望 |
| `progress[].stage_at` | progress | 一条进展是在哪个阶段记录的，决定它证明的是哪一关 |
| `health.acknowledged` | 人写 | "我知道它停着"是需要被记录的决定，否则提醒无法消音 |

**不建议加**：任何 `ai_*` 前缀字段写进 project。机器判断一律走 `signals/`。

---

## 5. GitHub 仓库（workbranch）改造清单

### 5.1 目录

```
projects/            人写的事实（30 个）
signals/             机器判断（agent 写，人只读）                    ← 新增
schemas/             poc-schema.md + enums.yaml + rules.yaml         ← rules 新增
config/
  rules.yaml         12 条规则 + 阈值 + 版本号                        ← 唯一源
  health.yaml        7 天 / 45 天 / 分层阈值                          ← 新增
templates/           issue / PR 模板正文
.github/
  workflows/validate.yml      机械校验（格式/枚举/必填/字典序）
  ISSUE_TEMPLATE/daily.yml    每日巡检触发器格式
```

### 5.2 治理现状（必须写进文档的硬事实）

- 该仓库是**个人免费账号的私有仓库**，GitHub **不支持分支保护与 rulesets**（实测 403：Upgrade to GitHub Pro）。
- 也就是说"必须走 PR"目前**只是流程约定，不是平台强制**。`skillre-q` 有 push 权限，技术上可以直推 main。
- 要真正收回豁免权只有三条路：① 升级 Pro；② 迁移到公司 GitHub Enterprise；③ 接受约定并靠 CI + 人工检查兜底。

**建议 v1 用③，并在 README 里明写这条风险**，同时把 CI 校验做成"红灯即不可合并"的约束。

### 5.3 CI 与 Agent 的分工

- **CI 只做机械校验**：YAML 可解析、枚举合法、`poc_id` 与文件名一致、必填键存在、`signals/` 只由 agent 账号提交。
- **12 条业务规则不放进 CI**：它们会变，且需要解释"为什么"，属于 agent 与看板的职责。

---

## 6. SuperAgent 侧改造清单

| # | 改造 | 原因 |
|---|---|---|
| 1 | 每日巡检 issue 用固定标题前缀（如 [daily-advisory]），规则里只认这个前缀 | auto 模式下白名单账号的任何 issue 都会被评估；没有前缀隔离，日常讨论会被误接单 |
| 2 | "每晚跑全量"改成**全量评估、单分支更新**：存在 open 的 advisory/* PR 就更新它，否则新建 | 30 个项目每天一个新 PR，人会被淹没 |
| 3 | 新增 advisory-write 技能：产出 signals/*.yaml，只写 signals，绝不改 projects | 把"AI 结论落盘"变成可复用能力 |
| 4 | 新增 gate-review 技能：升级建议必须给"还差什么 + 依据哪条证据 + 谁拍板" | 现在的审核评论是散文，人读得懂，机器读不懂 |
| 5 | 明确 Executor 边界：只读 projects、只写 signals、只在 PR 里说话 | 当前 Executor 在主 checkout 全权限运行、靠提示词约束，边界要写成技能 + 分支命名约定 |
| 6 | 时间语义：所有"多久没动"用**台账里的日期**，不用运行日期 | agent 每天跑，用 now-7d 判定结果每天飘；用数据里的 updated_at / progress.date 才稳定 |
| 7 | 飞书提醒收敛：每日一条摘要 + 有升级建议时单条 | 现在 12 项健康检查全绿也在推，噪音大 |

**需要实测验证的一条**：worker 是否允许向已存在分支追加 commit 以更新同一个 PR（影响幂等方案）。若不允许，退化为"每天一个新 PR + 自动关闭昨天的"。

---

## 7. 看板 UI（本会话不展开）

看板设计已在另一个会话开展，本会话不再深入。这里只保留两条**机器侧必须遵守**的接口约束，供那一侧消费：

1. **signals 契约**：详见 [会话二范程 §1.3](DESIGN-会话二-SuperAgent与仓库改造.md)。看板读 `signals/<poc_id>.yaml` 的 `gate_upgrade` / `health` / `risks` 三个块；缺字段时必须优雅降级，不能把整页打空。
2. **四维口径**：证据维度以「`outcome.our_proof` **或** 最新进展的 `evidence`」为准（`src/gap.ts` 的 `readDimensions` 已是这个口径）。侧栏若只看 `outcome.our_proof`，会和缺口引擎自相矛盾——这条属于机器侧已发现的一致性缺陷，修复归本会话（见附录第 1 条），UI 呈现归另一会话。

---

## 8. 分期（本会话视角，只含机器侧工作）

| 步骤 | 主题 | 内容 | 依赖 |
|---|---|---|---|
| M1 | 规则单一源 | `config/rules.yaml` + `config/health.yaml` 落库 | — |
| M2 | schema 演进 | v3.1 字段迁移（30 个文件） | M1 |
| M3 | 机械门禁 | `.github/workflows/validate.yml` + issue/PR 模板 | M1 |
| M4 | 巡检触发链 | `skillre-q` 入 bots 名单、禁用 visual 规则、两条新 Policy 规则 | 老 Mac 可达 |
| M5 | 判断能力 | `advisory-write` + `gate-review` 两个技能 | M4 |
| M6 | 定时与提醒 | `daily-advisory.sh` + launchd + 飞书收敛 | M5 |

**M1–M3 不依赖老 Mac**，当前即可开工。

**优先级最高的是数据补齐**：decision_chain 与 post_poc_decision 全 0，意味着 30 个项目没有一个说得清"测完客户会做什么决策"。这件事不解决，Gate 升级判断就没有依据——AI 再聪明也只能说"缺数据"。


---

## 9. 需要拍板的四件事（机器侧）

| # | 问题 | 建议 |
|---|---|---|
| 1 | AI 结论放 `signals/` 独立目录，还是塞进 project yaml？ | **独立目录**，人写与机器写永不混文件 |
| 2 | 每日巡检用 agent 账号开 issue（需加 bots 名单），还是你手动开？ | **agent 账号 + bots 名单**，否则做不到"每晚自动" |
| 3 | 每日巡检产出一个大 PR，还是每个项目一个 PR？ | **一个大 PR（固定分支）**，否则审阅成本爆炸 |
| 4 | Gate 升级由 agent 直接改 stage，还是只建议？ | **只建议**，人在 merge 时改并补 `gate_decisions[]` 审计字段 |

---

## 附：本次实测发现的既有缺陷（机器侧，与看板无关）

1. **四维双真相**：`src/gap.ts` 的 `readDimensions` 认为"最新进展有证据"即算有证据，`src/client/detail.tsx` 侧栏只看 `outcome.our_proof`。同一项目会出现"缺口引擎说有证据、侧栏显示 ✗"。修复以 `gap.ts` 口径为准，并补一条"有进展无 outcome"的夹具。
2. **R1 依赖生成字段**：规则读取台账里预生成的 `gate0.missing`，字段一旦过期（人工改了 why_customer 但没重算 missing），缺口会静默错判。应改为本地重算并与存储值对比，不一致时报警。
3. **规则三份副本**：`schemas/poc-schema.md` / `src/gap.ts` / `skills/poc-ledger/SKILL.md` 各自演进，阈值（300 万 / 2–3 项 / 45 天）迟早对不上。由 `config/rules.yaml` 统一生成。
4. **仓库无强制门禁**：个人免费私有仓库不支持分支保护与 rulesets（实测 403），`skillre-q` 有 push 权限，直推 main 技术上可行。
5. **定时巡检的准入盲区**：脚本用 agent 账号开 issue，对系统而言是机器人；非名单内机器人**不接收**。必须把 `skillre-q` 显式加入 GitHub Source 的 bots 名单，否则表现为 `received: 0`，极易误判为网络或权限故障。

