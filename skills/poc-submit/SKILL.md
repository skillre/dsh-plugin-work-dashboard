---
name: poc-submit
description: 校验组员交回的 POC 回传文件（.html 或 .json），合并进 v3 YAML 后提交为 Draft PR 到 GitHub workbranch 仓库。当用户说「把这个文件提交上去」「导入组员填的数据」「帮我提个 PR」或发来 poc-return-*.html / poc-changes-*.json 时使用。
---

# 导入并提交 POC 数据（v3）

处理组员交回的**回传文件**：校验 → 合并进现有 v3 YAML → 提交 Draft PR。

## 数据流

```
组员填 HTML → 点【生成回传文件】→ 得到 poc-return-*.html → 企业微信发给你
      ↓
你交给 DSH → 本 skill
      ↓
校验 → 合并 v3 YAML（保留未涉及字段、追加进展）→ 开 Draft PR
      ↓
审核 → 你 merge
```

## 两种回传文件，等价

| 文件 | 怎么来的 | 怎么读 |
|---|---|---|
| `poc-return-<日期>.html`（**推荐**） | 表单里点【生成回传文件 (.html)】 | `readReturnDocument(html)` |
| `poc-changes-<日期>.json` | 表单里点【下载变更集 (.json)】 | `readReturnDocument(json)`，或直接 `JSON.parse` |

**为什么推荐 HTML**：发起人和组员都能双击打开、直接看到填了什么，不需要 JSON 阅读器；
同时它内嵌了与 `.json` 完全相同的变更集，DSH 解析出来一模一样。

两者都只含**人填写的字段**。HTML 里的数据块是**只读快照**（`<script type="application/json">`），
只被 `JSON.parse` 读取，**不会执行任何代码**。

### 读回传文件

```js
import { readReturnDocument } from '@skillre/dsh-plugin-work-dashboard/lib/form.js'

const result = readReturnDocument(await readFile(file, 'utf8'))
if (result.document === null) throw new Error(result.reason)   // reason 是给人看的中文说明
const { intent, changes } = result.document
```

`readReturnDocument` 已经处理了三种常见错误，直接把 `reason` 告诉用户即可：

| 交回的东西 | 返回的 reason 含义 |
|---|---|
| 原始空白表单（组员忘了点生成） | 「这是尚未填写/未生成回传文件的原始表单」 |
| v3.0 旧表单 | 说明会丢失场景/指标引用，要求重新导出 |
| 被截断/改坏的文件 | 解析失败 |

**不要自己去正则抠 HTML 里的 JSON**——空白表单里也含有同一个标记字符串（页面脚本的源码），
自己抠会抠到源码那份，得出「文件损坏」的错误结论。

## 组员交回的 JSON 结构

**变更集（v3.1）**：只含人填写的字段，**不含任何派生字段**。

```json
{
  "schemaVersion": "3.1",
  "generatedAt": "2026-11-19T05:00:00.000Z",
  "generatedBy": "POC 信息收集表单 v3.1",
  "intent": "supplement",
  "changes": [
    {
      "schema_version": "3.1",
      "poc_id": "POC-006",
      "name": "人保财险全国信创上网行为管理替换",
      "org": { "system": "人保体系", "company": "人保财险", "department": null },
      "amount_wan": 1000,
      "poc_type": "大体量项目",
      "owner": "靳承德/苑炳轩",
      "sales": "林鹤",
      "tech_owner": "李国新",
      "exec_sponsor": null,
      "stage": "G0-立项",
      "status": "进行中",
      "stage_since": null,
      "gate0": {
        "why_customer": "...", "why_us": "...",
        "decision_chain": "...", "post_poc_decision": "...",
        "competitor": "...",
        "review": { "conclusion": "通过", "reviewer": "杨闯", "reviewed_at": "2026-11-19" }
      },
      "plan": {
        "customer_pain": "...", "expected_recognition": "...", "our_edge": "...",
        "criteria": [{ "id": "cri-01", "name": "...", "metric": "...", "baseline": null, "target": "..." }],
        "scenarios": [{ "id": "scn-01", "name": "...", "goal": "..." }],
        "risks": [{ "name": "...", "level": "high", "mitigation": "..." }],
        "timeline": { "start": "2026-11-01", "end": "2027-01-31" },
        "gate1": { "conclusion": null },
        "gate2": { "ready": null }
      },
      "progress": [
        {
          "date": "2026-11-19",
          "type": "客户阶段同步",
          "change": "证据补充",
          "goal": "...",
          "scenario_ids": ["scn-01"],
          "criteria_ids": ["cri-01"],
          "actual": "...",
          "completion": "75%",
          "evidence": [{ "title": "压测报告", "link": "https://…", "type": "文档" }],
          "customer": { "synced_with": "王工", "feedback": "…", "recognition": "部分认可" },
          "gate3_1": "可证明", "gate3_2": "待确认",
          "next": { "goal": "...", "owner": "...", "deadline": "2026-12-01" }
        }
      ]
    }
  ]
}
```

### 三条必须遵守的读取规则

| 规则 | 原因 |
|---|---|
| **`changes` 是数组**，不是以 `poc_id` 为键的对象 | 一个文件可以装多个项目的变更 |
| **`null` 表示「没改」**，不是「清空」 | 表单把空字段写成 `null`；合并时 `null` 必须**跳过**，否则会把已有值抹掉 |
| **没有派生字段** | `gate0.missing`/`complete`、`priority`、场景/指标 `status` 由 `tools/derive.mjs` 算，CI 会重算并校验 |

**`intent` 说明这次交回的是什么**：

| 值 | 含义 | 合并范围 |
|---|---|---|
| `new` | 新建项目 | 整个文件都是新的，派生字段由 CI 首次计算 |
| `supplement` | 补充当前阶段 | 只合并 `changes[].*` 里非 null 的字段 |
| `progress` | 只记录了一轮进展 | 只有 `progress[]` 非空，其余字段应全部为 null |

### 变更集是「按意图裁剪」的，这是故意的

表单**只写组员在那个页面上真的能改的块**，其余块一律输出 `null` / 空数组：

| intent | 会写 | 不写（全为 null/空） |
|---|---|---|
| `new` | `identity`、`gate0` | `plan`、`outcome`、`progress` |
| `supplement` | 当前阶段及其**之前**的块（按 stage 解析） | 之后的阶段、以及未涉及的块 |
| `progress` | **只有** `progress[]` | 其余全部 |

例：一个 G0 项目的 `supplement` 变更集里，`plan.customer_pain` 一定是 `null`，
即使表单导出时台账里已有值——因为那个页面上计划是只读的。

**这不是缺陷，而是防止覆盖的机制**：表单会从台账预填所有字段，若把没编辑过的预填值也发回，
合并时就会把「导出之后别人改过的值」悄悄回滚成「导出那天的快照」。
所以合并时**必须跳过 null**，并且**不要**因为某个块是 null 就认为组员「清空了它」。

两个例外：`stage` 和 `status` **总是**带上，因为它们是台账的路由键，
且新建项目没有既有文件可继承。它们由评审流程维护，不会被组员在表单里改动。

## 处理步骤

### 1. 校验

逐项检查，**枚举值以 `schemas/enums.yaml` 为准**：

| 检查 | 处理 |
|---|---|
| `poc_id` 非空 | 空 → 拒绝，要求填写 |
| `poc_id` 在台账中已存在 | 不存在 → 视为新建，但要在 PR 里写明 |
| `stage` 合法 | 不在枚举 → 拒绝 |
| `status` / `poc_type` 合法 | 不在枚举 → 拒绝 |
| `achievement` / `recognition` / `gate3_1` / `gate3_2` 合法 | 不在枚举 → 拒绝 |
| 未知字段 | 警告（可能拼写错误），不阻断 |
| 指标 2–3 / 场景 3–5 / 风险 ≤3 | 超限 → 警告，仍可提交（人工审核） |
| G0 五必填 | 缺失 → 警告，仍可提交 |
| `progress[].date` 是 `YYYY-MM-DD` | 格式错 → 拒绝 |

**校验不通过就明确说哪一项错了、正确值是什么**，不要笼统说「格式不对」。

### 2. 对比现有数据

```sh
cat ~/.dsh/cache/work-dashboard/repo/projects/<poc_id>.yaml
```

展示 diff 给用户确认，只列实际变化的字段。

### 3. 合并进 v3 YAML（关键）

⚠️ **两条硬约束：**

1. **保留未涉及的字段。** 组员只填了一部分，其余字段（含 `gate0.review`、`plan.gate1/gate2`、
   已有的 `progress` 历史）**一个都不能丢**。
2. **`progress` 是追加，不是覆盖。** 新条目 `seq` = 现有最大 `seq` + 1，追加到末尾。
   **绝不修改或删除历史条目**——这是 v3 的追加式约束，也是审计价值所在。

用 `yaml` 的 Document API 保留注释与格式：

```js
import YAML from 'yaml'
import { readFileSync, writeFileSync } from 'node:fs'

const file = `projects/${pocId}.yaml`
const doc = YAML.parseDocument(readFileSync(file, 'utf8'))

// 只写组员真正填了的字段；空值不覆盖现有值
function setIfPresent(path, value) {
  if (value === undefined || value === null || value === '') return
  doc.setIn(path.split('.'), value)
}

// progress 追加
const existing = doc.getIn(['progress']) ?? []
const nextSeq = existing.reduce((max, e) => Math.max(max, e.get?.('seq') ?? 0), 0) + 1
doc.setIn(['progress'], [...existing, { ...entry, seq: nextSeq }])

writeFileSync(file, doc.toString())
```

### 4. 提交 Draft PR

```sh
cd ~/.dsh/cache/work-dashboard/repo    # 或临时 clone

git checkout -b import/<poc_id>-<时间戳>
git add projects/
git commit -m "data: 更新 <poc_id> 的 POC 信息

来源：组员填写表单
填写时间：<generatedAt>
变更字段：<字段列表>"

git push -u origin import/<poc_id>-<时间戳>

gh pr create --draft \
  --title "POC 数据更新：<poc_id> <name>" \
  --body "## 变更内容
来源：组员填写的 HTML 表单
填写时间：<generatedAt>

## 变更字段
- <字段1>
- <字段2>

## 新增进展
第 <seq> 次 · <date> · <type>

## 待审核
请检查数据完整性。"
```

### 5. 告知用户

```
✅ 已提交 Draft PR

PR：https://github.com/skillre/workbranch/pull/<N>

接下来：
1. 审核数据完整性
2. 你在 GitHub review 后 merge
```

## 关键约束

| # | 约束 | 原因 |
|---|---|---|
| 1 | **必须 Draft PR** | 不是最终版本，等审核 |
| 2 | **用 skillre 账号推分支** | 提交署你的名，不是 agent 的 |
| 3 | **绝不直接 push main** | main 只能通过 merge 更新 |
| 4 | **绝不自动 merge** | 只有人能 merge |
| 5 | **保留未涉及字段** | 组员只填了一部分，其他字段不能丢 |
| 6 | **progress 只追加** | v3 的历史不可改写 |

## 冲突处理

若组员填写期间别人改过同一项目：

```sh
git fetch origin main
git rebase origin/main
```

冲突时**不要自行决定**，告诉用户：

```
⚠️ 冲突：<poc_id> 的 <字段> 在组员填写期间被修改过
现有值：<现有>
组员填写：<新值>
请确认用哪个。
```

## 相关 skill

- `poc-ledger`：读取分析台账
- `poc-export`：导出表单给组员
