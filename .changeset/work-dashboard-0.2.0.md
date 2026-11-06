---
"@skillre/dsh-plugin-work-dashboard": minor
---

Migrate the POC Operations module to the v3 ledger model.

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
