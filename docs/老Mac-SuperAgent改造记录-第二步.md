# 老 Mac SuperAgent 第二步改造记录

> 机器：jinchengdedeMacBook-Pro.local / Ventura 13.7.8 / x86_64
> 入口：`ssh skillre@115.171.85.158 -p 6422`（公网映射，不再是内网 192.168.3.11）
> 服务：DSH `--profile superagent`，监听 `127.0.0.1:3082`（tmux 会话 `dsh-superagent`）
> 日期：2026-11-18

---

## 一、改造前的现场

| 项 | 状态 |
|---|---|
| 服务 | 运行中，PID 69600，uptime 13 天，`overview.problems = 0` |
| Policy 规则 | 4 条：poc-data-sync / poc-gap-report / poc-form-export / copy |
| eval 模式 | `auto`，模型 trae/deepseek-v4.1-flash/high |
| GitHub Source | `skillre/workbranch`，observeIssues/Pulls/Comments 全开 |
| **bots 名单** | **缺失** |
| prompts 技能 | 只有 `poc-review` |
| 定时器 | 无 |

---

## 二、改造清单

### 1. Policy 规则（revision 2 → 3）

| 规则 | 变化 |
|---|---|
| poc-data-sync / poc-gap-report / poc-form-export | 保留启用 |
| `copy` | **禁用** —— 代码场景的文案纠错规则，对台账无用 |
| `visual` | 本就不存在，确认无需新增（也绝不启用） |
| **poc-daily-advisory** | 新增：只认 `[daily-advisory]` 前缀的 issue，只写 `signals/` |
| **poc-gate-review** | 新增：判断能否升级，只给建议不改 stage |

### 2. GitHub Source 的 bots 名单

加入了 `skillre-q`。**但这一项最终不是关键**，原因见第四节。

### 3. Prompts（revision 1 → 2）

- 新增技能 `advisory-write`：每日巡检的执行规范（先跑校验、只写 signals、幂等、健康度分两层）
- 新增技能 `gate-review`：Gate 评审的判定表与输出格式
- 重写 `delivery`：原文写的是"UI 截图证据"，对无 UI 的台账毫无意义，改为
  "路径 + 命令 + 输出"，并写明派生值不得手改、progress 只追加

### 4. 定时器

| 文件 | 作用 |
|---|---|
| `~/bin/daily-advisory.sh` | 每天 08:30 由 launchd 调用，开一个 advisory issue |
| `~/bin/advisory-body.md` | issue 正文（单独成文件，见第六节的坑） |
| `~/bin/gh-human` | gh 包装器，固定在**主账号** skillre |
| `~/Library/LaunchAgents/com.skillre.poc-advisory.plist` | launchd 任务，`StartCalendarInterval` 08:30 |

### 5. 执行环境（executor revision 3 → 4）

`prepare` 由单行 `git clone` 改为 `bash ~/bin/prepare-workbranch.sh`，原因见第五节。

---

## 三、为什么定时器必须用主账号

这是本次最重要的发现，也是唯一**无法靠配置绕过**的。

源码 `src/sources/github.ts` 的 `readStream` 里有一行：

```ts
if (sameName(item.user.login, login)) continue
```

`login` 是 agent 账号（skillre-q）。也就是说：**agent 账号自己创建的 issue，
在进入 eval 之前就被丢弃了**，连 Policy 都不会看到。

实测验证：

| issue | 创建者 | 结果 |
|---|---|---|
| #10 | skillre-q（agent） | **没有 thread、没有 decision**，完全消失 |
| #11 | skillre（人） | 进入 thread，`evaluating` → `accept` |

所以：
- 把 `skillre-q` 加进 bots 名单**解决不了**这个问题——bots 名单管的是"收到之后能做什么"，
  管不了"能不能收到"。
- 定时器必须用 **gh-human（主账号）** 开 issue。
- 副作用是好的：巡检本身也变成"人发起的"，符合"agent 不能给自己派活"的原则。

---

## 四、端到端验证证据

Issue #15（主账号创建、标题带 `[daily-advisory]`）：

```
thread:   github:15
strength: inferred
rules:    poc-daily-advisory → matched: true
mandate:  basis.via = admission / cell = listedUnaddressed / observation.mode = auto
ticket:   88ac7aaa7e59f5aa00fb8e21bd292da4 → working
```

未匹配的三条规则各自给出了理由（poc-data-sync 说"这是 advisory 运行不是改 projects"、
poc-gap-report 说"这是标题限定的巡检不是通用扫描"），说明规则边界是有效的，
不是靠"匹配第一条"蒙对的。

---

## 五、prepare 命令的两个真实故障

两个都表现为 Ticket 摘要里的 `The prepare command failed`，看起来像权限问题，实际是网络。

| 错误 | 原因 | 处理 |
|---|---|---|
| `Failed to connect to github.com port 443 after 75004 ms` | 本机走 `127.0.0.1:7890` 代理（Clash Party），代理偶发抖动；git 默认超时 75 秒，一次失败就整单失败 | 重试 4 次，间隔 4 秒 |
| `Error in the HTTP2 framing layer` | 代理会回收连接，HTTP/2 多路复用在其上不稳定 | 强制 `http.version=HTTP/1.1`，加大 `http.postBuffer`，设 `lowSpeedLimit/Time` |

**注意**：没有关掉全局代理。代理本身是通的（`curl -x 127.0.0.1:7890` 返回 200），
关掉反而会换一条完全不同的网络路径。

---

## 六、写脚本时踩的三个坑

1. **反引号被 shell 吃掉**。issue 正文里写 ``node tools/derive.mjs``，在双引号赋值里
   被当成命令替换执行，正文变成空串。现象是 issue 里出现「先跑  与 」两个空洞。
   → 正文改为独立文件 `~/bin/advisory-body.md`，脚本用 `--body-file` 传。
2. **`timeout` 命令 macOS 没有**。诊断脚本里用了 GNU `timeout`，Ventura 上直接报
   command not found。
3. **node 不在非交互 PATH 里**。`ssh` 执行时 `node` 找不到，必须用
   `~/.local/bin/node`（v22.23.2）的绝对路径。

---

## 七、日常运维

```sh
# 看服务
ssh -p 6422 skillre@115.171.85.158 'launchctl list | grep poc-advisory'

# 手动触发一次巡检（会先查重，已开则不重复创建）
ssh -p 6422 skillre@115.171.85.158 '~/bin/daily-advisory.sh; tail -3 ~/Library/Logs/poc-daily-advisory.log'

# 看最近决策
curl -s -H "x-orchestrator-request: 1" http://127.0.0.1:3082/orchestrator/api/decisions

# 两个身份
~/bin/gh-human api user --jq .login   # skillre（定时器、人）
~/.local/bin/gh-agent api user --jq .login   # skillre-q（agent 干活）
```

备份在 `~/superagent-config-backup/`（settings 与 prompts，改造前各一份）。

---

## 八、尚未完成

- **worker 执行时长未收敛**：首次运行截至记录时已 8 分钟仍在 working。
  30 个项目 × 每个一份 `signals/` 是主要原因。若常态超过 15 分钟，
  需要把全量拆成"只写有变化的项目"。
- **幂等尚未实测**：`project_sha + rules_sha` 都没变时是否真的跳过，
  要等第二次运行才能验证。
- **飞书提醒未收敛**：仍是原样。
---

## 九、增补：指纹幂等（2026-11-18 晚）

### 问题

首轮巡检产出了 PR #16：**1498 行、30 个文件、全部新增**。下一次运行会同样重写全部
30 个文件，即使台账一个字都没改。

后果不是「浪费时间」，而是：审阅者看完第一屏就放弃，然后无条件合并。
一旦形成这个习惯，真正的异常改动也会被一起合进去。

### 做法

`tools/derive.mjs` 新增 `--fingerprints`，每行一个项目：

```
POC-006 411439995586a380
```

指纹 = 「项目记录 + `config/rules.yaml`」规范化 JSON（键序排序）后 sha256 前 16 位。

| 发生什么 | 指纹 | 巡检行为 |
|---|---|---|
| 项目没变 | 不变 | **跳过** |
| 项目改了 | 变化 | 重算重写 |
| **规则阈值改了** | **全部变化** | **全部重算** |

最后一条是关键：改一次 `large_amount_wan`，旧结论必须全部失效，否则看板上会留着
按旧阈值算出来的判断而没人知道它是旧的。

指纹**只取输入、不含时间戳**——同样输入永远同样指纹，否则跳过规则永不触发。

### 契约变化

| 项 | 变化 |
|---|---|
| `signals/*.yaml` 的 `fingerprint` | **新增必填**，唯一幂等键 |
| `inputs.project_sha / rules_sha` | **移除**。两个 blob sha 漏掉了「规则变但项目没变」这一整类失效 |
| `fingerprint` 缺失时 | 按「有变化」处理，宁可重算不要漏 |

### 实测验证

拿首轮的 30 个真实 signal 做对照：

```
第一轮（旧文件无 fingerprint）:
  unchanged (skip): 0
  changed  (rewrite): 30    ← 全部保守重算，符合「宁可重算不漏」

盖上 fingerprint 后第二轮:
  unchanged (skip): 30
  changed  (rewrite): 0     ← 幂等生效
```

### 配置同步

| 项 | 版本 | 状态 |
|---|---|---|
| Policy `poc-daily-advisory` | rev 3 → **4** | 已改为增量语义，含「无变化则不开 PR」 |
| 技能 `advisory-write` | rev 2 → **3** | 已加入指纹比对三步法 |

### PR

- **PR #17**（+111 行 / 3 文件）：指纹能力与契约升级，CI 已通过
- **PR #16 已关闭**：它是改造前的全量产物，没有 `fingerprint` 字段，合入会让跳过逻辑失效

### 待办

- 等 #17 合入后由新版本重跑一次，验证真实环境下的增量行为
- 届时第一轮仍会重写 30 个（补 fingerprint），第二轮起才进入跳过状态
