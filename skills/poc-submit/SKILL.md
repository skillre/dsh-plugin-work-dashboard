---
name: poc-submit
description: 校验组员交回的 POC 数据文件（.json），合并进 v3 YAML 后提交为 Draft PR 到 GitHub workbranch 仓库。当用户说「把这个文件提交上去」「导入组员填的数据」「帮我提个 PR」或发来 poc-changes-*.json 时使用。
---

# 导入并提交 POC 数据（v3）

处理组员交回的 `poc-changes-<日期>.json`：校验 → 合并进现有 v3 YAML → 提交 Draft PR。

## 数据流

```
组员填 HTML → 下载 poc-changes-*.json → 用飞书发给你
      ↓
你交给 DSH → 本 skill
      ↓
校验 → 合并 v3 YAML（保留未涉及字段、追加进展）→ 开 Draft PR
      ↓
审核 → 你 merge
```

## 组员交回的 JSON 结构

```json
{
  "generatedAt": "2026-11-06T12:35:00.000Z",
  "generatedBy": "POC 表单 v3",
  "pocs": {
    "POC-006": {
      "identity": { "name": "...", "org": { "system": "人保体系", "company": "..." }, "amount_wan": 1500 },
      "gate0": { "why_customer": "...", "why_us": "...", "decision_chain": "..." },
      "plan": { "criteria": [{ "name": "...", "metric": "...", "target": "..." }], "scenarios": ["..."], "risks": [{ "name": "...", "level": "high", "mitigation": "..." }] },
      "progress": [
        {
          "date": "2026-11-06",
          "type": "客户阶段同步",
          "goal": "...", "actual": "...", "completion": "75%",
          "evidence": [{ "title": "验收报告.pdf", "link": "https://…", "type": "文档" }],
          "customer": { "synced_with": "王工", "feedback": "…", "recognition": "部分认可" },
          "gate3_1": "可证明", "gate3_2": "待确认",
          "next": { "goal": "...", "owner": "...", "deadline": "2026-12-01" }
        }
      ],
      "outcome": { "our_proof": "...", "conclusion": { "proved": "...", "recognized": "...", "next_business": "..." }, "business": { "milestone": "...", "owner": "...", "deadline": "..." } }
    }
  }
}
```

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
