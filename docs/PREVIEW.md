# 预览图画板

详情页的预览图以**飞书画板**为编辑源，`docs/preview*.svg` 是它的导出快照。
本文件记录两种语言各自对应的画板，供 `node scripts/preview.mjs push|pull` 使用。

| 语言 | 文档 | 画板 token |
|---|---|---|
| `en` | （待填：飞书文档 URL） | （待填：whiteboard token） |
| `zh` | （待填：飞书文档 URL） | （待填：whiteboard token） |

> 当前 `docs/preview*.svg` 是按展示契约（640×300 逻辑比例、`<text>` 文字、正交折线、
> 无 pattern/clipPath/mask/image）手写生成的界面快照，已通过 `node scripts/preview.mjs check`。
> 画板地址待补：补上之后 `push`/`pull` 才能往返，且画板会成为后续精修的权威来源。

## 图里画了什么

按 `docs/display-contract.md` §3.2 的结构：

1. **真实产品瞬间**：DSH 窗口本体 —— 左侧栏选中「工作看板」，中间是 POC 运营页。
2. **机制**：组合面板的两条图带（阶段漏斗 + 四维覆盖 / 体系金额 + 缺口规则命中），
   以及「一种数据三种读法」的卡片视图。
3. **关键数据**：5 个项目 / 3,100 万元；四维覆盖 3/5、2/5、3/5、1/5。
4. **次级界面**：右侧待处理清单，按规则分组。

## 操作

```sh
# 把本地 SVG 推上画板（整板重建）
node scripts/preview.mjs push --lang zh

# 从画板导出 SVG 覆盖本地文件
node scripts/preview.mjs pull --lang zh

# 离线校验（npm run check 会自动调用）
node scripts/preview.mjs check
```

规则见 fleet 的 `docs/display-contract.md`。
