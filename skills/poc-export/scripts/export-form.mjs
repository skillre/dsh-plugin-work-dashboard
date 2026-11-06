#!/usr/bin/env node
/**
 * POC 信息收集表单生成器（v3）。
 *
 * 生成一个自包含 HTML：组员双击即可填，离线可用，填完下载 JSON 交回。
 * 数据模型是 v3（身份 + gate0 + plan + progress[] + outcome）；旧版的
 * `why_customer_test` / `result` / `timeline` 已不存在，本脚本不产出那些字段。
 *
 * 三条设计约束，来自旧版 v1 生成器的经验：
 *
 * 1. **一个文件，无服务器、无 CDN。** 组员可能在任何机器上、断网状态下打开。
 * 2. **草稿键由项目编号派生，不是时间戳。** 同一批项目重新生成表单后，
 *    仍能找到上一次的草稿；旧版把生成时间编进键里，导致草稿永远找不回。
 * 3. **进展是追加的。** 表单只收集「一条新进展」，提交时由 `poc-submit`
 *    追加到 `progress[]`，绝不覆盖历史。
 *
 * 用法：
 *   node export-form.mjs --mode fill --poc <file|glob> --out <html>
 *   node export-form.mjs --mode new  --out <html>
 *
 * 只读 YAML，只写 HTML。不改台账。
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import YAML from 'yaml'

/** v3 枚举，与 `schemas/enums.yaml` 一致。 */
const ENUMS = {
  pocType: ['AI安全', '保护AI', 'ACG', 'SDL', '虚拟化', '大体量项目'],
  stage: ['G0-立项', 'G1-方案设计', 'G2-方案验证', 'G3-结果验证', 'G4-结果转化', 'closed'],
  status: ['进行中', '暂停', '已关闭', '已取消'],
  system: ['人保体系', '国寿体系'],
  achievement: ['达成', '部分达成', '未达成'],
  recognition: ['认可', '部分认可', '未认可', '待确认'],
  gate3_1: ['可证明', '待补证据'],
  gate3_2: ['已确认', '待确认'],
  progressType: ['内部Review', '客户阶段同步', 'Checkpoint'],
  completion: ['0%', '25%', '50%', '75%', '100%'],
  evidenceType: ['文档', '截图', '数据', '邮件', '链接'],
  riskLevel: ['high', 'medium', 'low'],
  businessStatus: ['已进入下一里程碑', '待推进', '补救中', '无后续动作'],
}

/** 读取一个 YAML 项目文件。 */
function readProject(file) {
  const doc = YAML.parse(readFileSync(file, 'utf8')) ?? {}
  return doc
}

/** 把 v3 记录裁剪成表单需要的形状（只保留可编辑的字段）。 */
function projectForForm(record) {
  const org = record.org ?? {}
  const gate0 = record.gate0 ?? {}
  const plan = record.plan ?? {}
  const outcome = record.outcome ?? {}
  const progress = Array.isArray(record.progress) ? record.progress : []
  const lastSeq = progress.reduce((max, entry) => Math.max(max, Number(entry?.seq) || 0), 0)
  return {
    poc_id: record.poc_id ?? '',
    name: record.name ?? '',
    org: {
      system: org.system ?? '',
      company: org.company ?? '',
      department: org.department ?? '',
    },
    amount_wan: record.amount_wan ?? null,
    poc_type: record.poc_type ?? '',
    priority: record.priority ?? '',
    owner: record.owner ?? '',
    sales: record.sales ?? '',
    tech_owner: record.tech_owner ?? '',
    exec_sponsor: record.exec_sponsor ?? '',
    stage: record.stage ?? '',
    status: record.status ?? '',
    stage_since: record.stage_since ?? '',
    gate0: {
      why_customer: gate0.why_customer ?? '',
      why_us: gate0.why_us ?? '',
      decision_chain: gate0.decision_chain ?? '',
      post_poc_decision: gate0.post_poc_decision ?? '',
      competitor: gate0.competitor ?? '',
      conclusion: gate0.review?.conclusion ?? '',
      reviewer: gate0.review?.reviewer ?? '',
    },
    plan: {
      customer_pain: plan.customer_pain ?? '',
      expected_recognition: plan.expected_recognition ?? '',
      criteria: Array.isArray(plan.criteria) ? plan.criteria : [],
      scenarios: Array.isArray(plan.scenarios) ? plan.scenarios : [],
      our_edge: plan.our_edge ?? '',
      risks: Array.isArray(plan.risks) ? plan.risks : [],
      gate1_conclusion: plan.gate1?.conclusion ?? '',
      gate2_ready: plan.gate2?.ready ?? '',
    },
    outcome: {
      our_proof: outcome.our_proof ?? '',
      remaining_risks: outcome.remaining_risks ?? '',
      proved: outcome.conclusion?.proved ?? '',
      recognized: outcome.conclusion?.recognized ?? '',
      next_business: outcome.conclusion?.next_business ?? '',
      milestone: outcome.business?.milestone ?? '',
      business_owner: outcome.business?.owner ?? '',
      business_deadline: outcome.business?.deadline ?? '',
      business_status: outcome.business?.status ?? '',
      overall: outcome.overall ?? '',
    },
    // The form collects ONE new progress entry; its seq is assigned on submit.
    progress_count: progress.length,
    next_seq: lastSeq + 1,
  }
}

/** 空白项目，用于新建模式。 */
function blankProject() {
  return projectForForm({})
}

/** 草稿键：由项目编号派生，不是时间戳（旧版的 bug）。 */
function draftKeyFor(mode, pocIds) {
  const ids = pocIds.length === 0 ? ['__blank__'] : [...pocIds].sort()
  return `poc-form-v3-${mode}-${ids.join('-')}`
}

/** 生成 HTML。 */
function buildFormHtml({ mode, projects }) {
  const pocIds = projects.map((project) => project.poc_id).filter((id) => id !== '')
  const draftKey = draftKeyFor(mode, pocIds)
  const title = mode === 'new' ? '新建 POC 项目' : `POC 信息收集（${projects.length} 个项目）`
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${FORM_CSS}</style>
</head>
<body>
<div class="shell">
  <header class="topbar">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <p class="sub">填完点【提交并生成文件】，把下载的 <code>.json</code> 发回给发起人。数据模型 v3。</p>
    </div>
    <div class="actions">
      <button type="button" id="saveBtn">保存</button>
      <button type="button" id="clearBtn">清空草稿</button>
    </div>
  </header>
  <p class="notice" id="draftNotice" hidden></p>
  <p class="notice" id="restoreNotice" hidden>已恢复上次未提交的草稿。</p>
  <div id="projects"></div>
  <footer class="footer">
    <button type="button" id="previewBtn">预览 JSON</button>
    <button type="button" id="submitBtn" class="primary">提交并生成文件</button>
  </footer>
  <pre id="preview" hidden></pre>
  <div id="toast" hidden></div>
</div>
<script>var DATA = ${JSON.stringify({ mode, draftKey, enums: ENUMS, projects })};</script>
<script>${FORM_SCRIPT}</script>
</body>
</html>
`
}

/** HTML 转义。 */
function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const FORM_CSS = `
*{box-sizing:border-box}
body{margin:0;background:#F5F7FB;color:#192638;font:13px/1.6 'Avenir Next','PingFang SC',system-ui,sans-serif}
.shell{max-width:980px;margin:0 auto;padding:24px 20px 80px}
.topbar{display:flex;align-items:flex-start;gap:16px;padding:16px 18px;background:#fff;border:1px solid #E6EBF2;border-radius:12px;box-shadow:0 1px 2px rgba(20,32,52,.05)}
.topbar h1{margin:0;font-size:19px}
.sub{margin:4px 0 0;color:#5A6A80;font-size:12px}
.actions{margin-left:auto;display:flex;gap:8px}
button{height:30px;padding:0 12px;border-radius:8px;border:1px solid #E6EBF2;background:#fff;color:#5A6A80;font:inherit;cursor:pointer}
button:hover{background:#F7F9FC;color:#192638}
button.primary{background:#2864E8;border-color:transparent;color:#fff;font-weight:600}
.notice{margin:10px 0 0;padding:8px 12px;border-radius:8px;background:#FBF1E2;color:#B77919;font-size:12px}
.card{margin-top:14px;background:#fff;border:1px solid #E6EBF2;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(20,32,52,.05)}
.card-head{display:flex;align-items:baseline;gap:10px;padding:12px 16px;border-bottom:1px solid #E6EBF2;background:linear-gradient(180deg,#fff,#F7F9FC)}
.card-title{margin:0;font-size:14px;font-weight:650}
.card-id{font-family:ui-monospace,Menlo,monospace;font-size:10.5px;color:#8B99AC}
.gaps{margin-left:auto;font-size:11px;color:#8B99AC}
.gaps b{color:#C0392B}
.section{padding:12px 16px;border-bottom:1px solid #E6EBF2}
.section:last-child{border-bottom:0}
.section-title{margin:0 0 8px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8B99AC;font-weight:650}
.row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.field{display:flex;flex-direction:column;gap:3px;min-width:0}
.field.full{grid-column:1/-1}
label{font-size:11px;color:#5A6A80}
input,textarea,select{width:100%;padding:6px 9px;border:1px solid #E6EBF2;border-radius:7px;background:#fff;color:#192638;font:inherit}
input:focus,textarea:focus,select:focus{outline:2px solid #2864E8;outline-offset:1px}
textarea{min-height:64px;resize:vertical}
.known{background:#F7F9FC;color:#5A6A80}
.hint{font-size:10px;color:#8B99AC}
.list-row{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:6px;margin-bottom:6px}
.list-row.risks{grid-template-columns:1fr 90px 1fr auto}
.list-add{margin-top:4px}
.footer{position:fixed;left:0;right:0;bottom:0;display:flex;gap:10px;justify-content:flex-end;padding:12px 24px;background:#fff;border-top:1px solid #E6EBF2}
#preview{margin-top:14px;padding:14px;border-radius:10px;background:#fff;border:1px solid #E6EBF2;overflow:auto;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;white-space:pre-wrap}
#toast{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);padding:9px 16px;border-radius:20px;background:#192638;color:#fff;font-size:12px}
@media(max-width:640px){.row{grid-template-columns:1fr}.list-row,.list-row.risks{grid-template-columns:1fr}}
`

const FORM_SCRIPT = `
(function () {
  var state = {};
  var storageAvailable = true;
  var saveTimer = null;

  function byId(id) { return document.getElementById(id); }
  function text(v) { return v === null || v === undefined ? '' : String(v); }
  function esc(v) { return text(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function toast(message) {
    var el = byId('toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.hidden = true; }, 2200);
  }

  function probeStorage() {
    try { localStorage.setItem('poc-form-v3-probe','1'); localStorage.removeItem('poc-form-v3-probe'); return true; }
    catch (e) { return false; }
  }

  function options(list, current) {
    var html = '<option value="">请选择</option>';
    for (var i = 0; i < list.length; i += 1) {
      html += '<option value="' + esc(list[i]) + '"' + (list[i] === current ? ' selected' : '') + '>' + esc(list[i]) + '</option>';
    }
    return html;
  }

  function field(key, label, value, opts) {
    opts = opts || {};
    var cls = 'field' + (opts.full ? ' full' : '');
    var id = 'f-' + key;
    if (opts.select) {
      return '<div class="' + cls + '"><label for="' + id + '">' + esc(label) + '</label>' +
        '<select id="' + id + '" data-key="' + key + '">' + options(opts.select, text(value)) + '</select></div>';
    }
    if (opts.area) {
      return '<div class="' + cls + '"><label for="' + id + '">' + esc(label) + '</label>' +
        '<textarea id="' + id + '" data-key="' + key + '">' + esc(value) + '</textarea></div>';
    }
    return '<div class="' + cls + '"><label for="' + id + '">' + esc(label) + '</label>' +
      '<input id="' + id + '" data-key="' + key + '" type="' + (opts.number ? 'number' : 'text') + '" value="' + esc(value) + '"></div>';
  }

  // ---- gap detection, mirroring the plugin's twelve rules on the FORM side.
  // Only the rules a colleague can actually fix from this form are shown; the
  // point is to tell them what is still blank, not to audit the ledger.
  function gapsFor(p) {
    var gaps = [];
    var g0 = p.gate0 || {};
    if (!g0.why_customer) gaps.push('客户为什么测 未填');
    if (!g0.why_us) gaps.push('我们为什么测 未填');
    if (!g0.decision_chain) gaps.push('决策链 未填');
    if (!g0.post_poc_decision) gaps.push('测后客户决策 未填');
    if (!p.tech_owner) gaps.push('客户技术责任人 未填');
    var plan = p.plan || {};
    var c = (plan.criteria || []).length;
    if (c > 0 && (c < 2 || c > 3)) gaps.push('成功指标 ' + c + ' 个（要求 2-3）');
    var s = (plan.scenarios || []).length;
    if (s > 0 && (s < 3 || s > 5)) gaps.push('场景 ' + s + ' 个（要求 3-5）');
    var r = (plan.risks || []).length;
    if (r > 3) gaps.push('风险 ' + r + ' 个（上限 3）');
    var o = p.outcome || {};
    if (o.achievement === '达成' && !o.milestone) gaps.push('已达成但无下一步里程碑');
    return gaps;
  }

  function render() {
    var host = byId('projects');
    var html = '';
    DATA.projects.forEach(function (project, index) {
      var id = project.poc_id || '__blank__';
      var p = state[id];
      var gaps = gapsFor(p);
      html += '<section class="card" data-index="' + index + '" data-id="' + esc(id) + '">';
      html += '<div class="card-head"><h2 class="card-title">' + esc(p.name || (DATA.mode === 'new' ? '新项目' : id)) + '</h2>';
      html += '<span class="card-id">' + esc(id === '__blank__' ? '' : id) + '</span>';
      html += '<span class="gaps">' + (gaps.length === 0 ? '未发现必填缺失' : '<b>' + gaps.length + '</b> 项待补：' + esc(gaps.slice(0,3).join('、')) + (gaps.length>3?'…':'')) + '</span></div>';

      html += '<div class="section"><h3 class="section-title">身份</h3><div class="row">';
      html += field('name', '项目名称', p.name, { full: true });
      html += field('system', '体系', p.org.system, { select: DATA.enums.system });
      html += field('company', '主业公司', p.org.company);
      html += field('department', '部门（可选）', p.org.department);
      html += field('amount_wan', '预计金额（万元）', p.amount_wan, { number: true });
      html += field('poc_type', '项目类型', p.poc_type, { select: DATA.enums.pocType });
      html += field('stage', '阶段', p.stage, { select: DATA.enums.stage });
      html += field('status', '状态', p.status, { select: DATA.enums.status });
      html += field('owner', 'POC Owner（我方）', p.owner);
      html += field('sales', '销售发起人', p.sales);
      html += field('tech_owner', '客户技术责任人', p.tech_owner);
      html += field('exec_sponsor', '客户业务决策人', p.exec_sponsor);
      html += '</div></div>';

      html += '<div class="section"><h3 class="section-title">G0 · 值不值得做</h3><div class="row">';
      html += field('why_customer', '客户为什么要测', p.gate0.why_customer, { area: true, full: true });
      html += field('why_us', '我们为什么测（含下一步动作和目标）', p.gate0.why_us, { area: true, full: true });
      html += field('decision_chain', '项目流程 / 决策链', p.gate0.decision_chain, { area: true, full: true });
      html += field('post_poc_decision', '测完后客户会做什么决策', p.gate0.post_poc_decision, { area: true, full: true });
      html += field('competitor', '主要竞争对手', p.gate0.competitor);
      html += '</div></div>';

      html += '<div class="section"><h3 class="section-title">计划 · G1 / G2</h3><div class="row">';
      html += field('customer_pain', '客户核心痛点', p.plan.customer_pain, { area: true, full: true });
      html += field('expected_recognition', '期望客户认可什么', p.plan.expected_recognition, { area: true, full: true });
      html += field('our_edge', '我方优势 / 赢点', p.plan.our_edge, { area: true, full: true });
      html += '</div>';
      html += '<h3 class="section-title" style="margin-top:12px">关键成功指标（2-3 项）</h3><div data-list="criteria">';
      (p.plan.criteria || []).forEach(function (c, i) {
        html += '<div class="list-row"><input data-list-key="criteria" data-i="' + i + '" data-f="name" placeholder="指标名称" value="' + esc(c.name) + '">' +
          '<input data-list-key="criteria" data-i="' + i + '" data-f="metric" placeholder="衡量标准" value="' + esc(c.metric) + '">' +
          '<input data-list-key="criteria" data-i="' + i + '" data-f="target" placeholder="目标值" value="' + esc(c.target) + '">' +
          '<button type="button" data-remove="criteria" data-i="' + i + '">删</button></div>';
      });
      html += '<button type="button" class="list-add" data-add="criteria">+ 加一项指标</button></div>';
      html += '<h3 class="section-title" style="margin-top:12px">验证场景（3-5 个）</h3><div data-list="scenarios">';
      (p.plan.scenarios || []).forEach(function (s, i) {
        html += '<div class="list-row" style="grid-template-columns:1fr auto"><input data-list-key="scenarios" data-i="' + i + '" data-f="value" placeholder="场景" value="' + esc(s) + '">' +
          '<button type="button" data-remove="scenarios" data-i="' + i + '">删</button></div>';
      });
      html += '<button type="button" class="list-add" data-add="scenarios">+ 加一个场景</button></div>';
      html += '<h3 class="section-title" style="margin-top:12px">风险（上限 3）</h3><div data-list="risks">';
      (p.plan.risks || []).forEach(function (r, i) {
        html += '<div class="list-row risks"><input data-list-key="risks" data-i="' + i + '" data-f="name" placeholder="风险描述" value="' + esc(r.name) + '">' +
          '<select data-list-key="risks" data-i="' + i + '" data-f="level">' + options(DATA.enums.riskLevel, text(r.level)) + '</select>' +
          '<input data-list-key="risks" data-i="' + i + '" data-f="mitigation" placeholder="应对措施" value="' + esc(r.mitigation) + '">' +
          '<button type="button" data-remove="risks" data-i="' + i + '">删</button></div>';
      });
      html += '<button type="button" class="list-add" data-add="risks">+ 加一条风险</button></div></div>';

      // ---- the new progress entry: the core of v3, and always an append
      html += '<div class="section"><h3 class="section-title">新增一条进展（第 ' + p.next_seq + ' 次，追加）</h3>';
      html += '<p class="hint">进展是追加的，不会覆盖历史。只填你这次真正推进了什么。</p><div class="row">';
      html += field('p_date', '日期', p.newProgress.date, { number: false, full: false });
      html += field('p_type', '类型', p.newProgress.type, { select: DATA.enums.progressType });
      html += field('p_goal', '这次的目标', p.newProgress.goal, { area: true, full: true });
      html += field('p_actual', '实际做到什么', p.newProgress.actual, { area: true, full: true });
      html += field('p_completion', '完成度', p.newProgress.completion, { select: DATA.enums.completion });
      html += field('p_synced', '同步的客户', p.newProgress.synced_with);
      html += field('p_feedback', '客户反馈', p.newProgress.feedback, { area: true, full: true });
      html += field('p_recognition', '客户认可', p.newProgress.recognition, { select: DATA.enums.recognition });
      html += field('p_gate3_1', 'G3-1', p.newProgress.gate3_1, { select: DATA.enums.gate3_1 });
      html += field('p_gate3_2', 'G3-2', p.newProgress.gate3_2, { select: DATA.enums.gate3_2 });
      html += field('p_ev_title', '证据标题', p.newProgress.evidence_title);
      html += field('p_ev_link', '证据链接', p.newProgress.evidence_link);
      html += field('p_next_goal', '下一步目标', p.newProgress.next_goal, { area: true, full: true });
      html += field('p_next_owner', '下一步负责人', p.newProgress.next_owner);
      html += field('p_next_deadline', '下一步截止', p.newProgress.next_deadline);
      html += '</div></div>';

      html += '<div class="section"><h3 class="section-title">结论</h3><div class="row">';
      html += field('o_proof', '我方证据', p.outcome.our_proof, { area: true, full: true });
      html += field('o_remaining', '剩余风险', p.outcome.remaining_risks, { area: true, full: true });
      html += field('o_proved', '我们证明了什么', p.outcome.proved, { area: true, full: true });
      html += field('o_recognized', '客户认可了什么', p.outcome.recognized, { area: true, full: true });
      html += field('o_next_business', '下一步业务动作', p.outcome.next_business, { area: true, full: true });
      html += field('o_milestone', 'Next Milestone', p.outcome.milestone);
      html += field('o_business_owner', '里程碑负责人', p.outcome.business_owner);
      html += field('o_business_deadline', '里程碑截止', p.outcome.business_deadline);
      html += field('o_business_status', '里程碑状态', p.outcome.business_status, { select: DATA.enums.businessStatus });
      html += field('o_overall', 'POC 总体结论', p.outcome.overall, { area: true, full: true });
      html += '</div></div>';

      html += '</section>';
    });
    host.innerHTML = html;
  }

  function initState() {
    DATA.projects.forEach(function (project) {
      var id = project.poc_id || '__blank__';
      state[id] = JSON.parse(JSON.stringify(project));
      if (!state[id].newProgress) state[id].newProgress = {};
    });
    storageAvailable = probeStorage();
    if (!storageAvailable) {
      byId('draftNotice').hidden = false;
      byId('draftNotice').textContent = '当前浏览器禁用了本地存储，本次填写不会被自动保存。填完请立刻下载。';
      return;
    }
    try {
      var saved = localStorage.getItem(DATA.draftKey);
      if (saved) {
        var parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(function (key) { if (state[key]) state[key] = parsed[key]; });
        byId('restoreNotice').hidden = false;
      }
    } catch (e) {
      // A corrupt draft must never block the form: drop it and start clean.
      localStorage.removeItem(DATA.draftKey);
    }
  }

  function persist() {
    if (!storageAvailable) return;
    try { localStorage.setItem(DATA.draftKey, JSON.stringify(state)); }
    catch (e) { /* quota: the form still works, just without autosave */ }
  }

  function scheduleSave() {
    if (!storageAvailable) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 2000);
  }

  // ---- read the DOM back into state, then re-render the gap counters
  function collect() {
    var cards = document.querySelectorAll('.card');
    for (var c = 0; c < cards.length; c += 1) {
      var card = cards[c];
      var id = card.getAttribute('data-id');
      var p = state[id];
      if (!p) continue;

      var inputs = card.querySelectorAll('[data-key]');
      for (var i = 0; i < inputs.length; i += 1) {
        var el = inputs[i];
        var key = el.getAttribute('data-key');
        var value = el.value;
        if (key.indexOf('p_') === 0) {
          p.newProgress[PROGRESS_KEY[key]] = value;
        } else if (key.indexOf('o_') === 0) {
          p.outcome[OUTCOME_KEY[key]] = value;
        } else if (key === 'system' || key === 'company' || key === 'department') {
          p.org[key] = value;
        } else if (key === 'why_customer' || key === 'why_us' || key === 'decision_chain' || key === 'post_poc_decision' || key === 'competitor') {
          p.gate0[key] = value;
        } else if (key === 'customer_pain' || key === 'expected_recognition' || key === 'our_edge') {
          p.plan[key] = value;
        } else if (key === 'amount_wan') {
          p.amount_wan = value === '' ? null : Number(value);
        } else {
          p[key] = value;
        }
      }
    }
  }

  var PROGRESS_KEY = {
    p_date: 'date', p_type: 'type', p_goal: 'goal', p_actual: 'actual', p_completion: 'completion',
    p_synced: 'synced_with', p_feedback: 'feedback', p_recognition: 'recognition',
    p_gate3_1: 'gate3_1', p_gate3_2: 'gate3_2',
    p_ev_title: 'evidence_title', p_ev_link: 'evidence_link',
    p_next_goal: 'next_goal', p_next_owner: 'next_owner', p_next_deadline: 'next_deadline'
  };
  var OUTCOME_KEY = {
    o_proof: 'our_proof', o_remaining: 'remaining_risks', o_proved: 'proved', o_recognized: 'recognized',
    o_next_business: 'next_business', o_milestone: 'milestone', o_business_owner: 'business_owner',
    o_business_deadline: 'business_deadline', o_business_status: 'business_status', o_overall: 'overall'
  };

  // Update ONLY the gap badge in place. Re-rendering the whole card on every
  // keystroke would steal focus and wipe the caret position, which is the
  // classic way an autosaving form becomes unusable.
  function refreshGapBadge(card) {
    var id = card.getAttribute('data-id');
    var p = state[id];
    if (!p) return;
    var gaps = gapsFor(p);
    var badge = card.querySelector('.gaps');
    if (!badge) return;
    badge.innerHTML = gaps.length === 0
      ? '未发现必填缺失'
      : '<b>' + gaps.length + '</b> 项待补：' + esc(gaps.slice(0, 3).join('、')) + (gaps.length > 3 ? '…' : '');
  }

  document.addEventListener('input', function (event) {
    var el = event.target;
    if (!el || !el.getAttribute) return;
    var key = el.getAttribute('data-key');
    var listKey = el.getAttribute('data-list-key');
    if (listKey) {
      var card = el.closest('.card');
      var p = state[card.getAttribute('data-id')];
      var idx = Number(el.getAttribute('data-i'));
      var f = el.getAttribute('data-f');
      if (listKey === 'scenarios') p.plan.scenarios[idx] = el.value;
      else {
        p.plan[listKey][idx] = p.plan[listKey][idx] || {};
        p.plan[listKey][idx][f] = el.value;
      }
      refreshGapBadge(card);
    } else if (key) {
      collect();
      var card2 = el.closest('.card');
      if (card2) refreshGapBadge(card2);
    }
    scheduleSave();
  });

  document.addEventListener('change', function (event) {
    if (event.target && event.target.getAttribute && (event.target.getAttribute('data-key') || event.target.getAttribute('data-list-key'))) {
      collect();
      scheduleSave();
    }
  });

  document.addEventListener('click', function (event) {
    var el = event.target;
    if (!el || !el.getAttribute) return;
    var add = el.getAttribute('data-add');
    var remove = el.getAttribute('data-remove');
    if (add) {
      var card = el.closest('.card');
      var p = state[card.getAttribute('data-id')];
      if (add === 'scenarios') p.plan.scenarios.push('');
      else p.plan[add].push(add === 'risks' ? { name: '', level: 'medium', mitigation: '' } : { name: '', metric: '', target: '' });
      collect(); render(); persist();
    } else if (remove) {
      var card2 = el.closest('.card');
      var p2 = state[card2.getAttribute('data-id')];
      var idx = Number(el.getAttribute('data-i'));
      p2.plan[remove].splice(idx, 1);
      collect(); render(); persist();
    }
  });

  function collectOutput() {
    collect();
    var out = { generatedAt: new Date().toISOString(), generatedBy: 'POC 表单 v3', pocs: {} };
    Object.keys(state).forEach(function (id) {
      var p = state[id];
      var np = p.newProgress || {};
      // A progress entry only counts when it says something actually happened.
      var hasProgress = !!(np.actual || np.goal);
      out.pocs[id === '__blank__' ? (p.poc_id || '') : id] = {
        identity: { name: p.name, org: p.org, amount_wan: p.amount_wan, poc_type: p.poc_type, stage: p.stage, status: p.status, owner: p.owner, sales: p.sales, tech_owner: p.tech_owner, exec_sponsor: p.exec_sponsor },
        gate0: p.gate0,
        plan: p.plan,
        outcome: p.outcome,
        progress: hasProgress ? [{
          date: np.date, type: np.type, goal: np.goal, actual: np.actual, completion: np.completion,
          evidence: np.evidence_title ? [{ title: np.evidence_title, link: np.evidence_link || '', type: '文档' }] : [],
          customer: { synced_with: np.synced_with, feedback: np.feedback, recognition: np.recognition },
          gate3_1: np.gate3_1, gate3_2: np.gate3_2,
          next: { goal: np.next_goal, owner: np.next_owner, deadline: np.next_deadline }
        }] : []
      };
    });
    return out;
  }

  byId('saveBtn').addEventListener('click', function () { collect(); persist(); toast('已保存到本地草稿'); });

  byId('clearBtn').addEventListener('click', function () {
    if (!confirm('清空本地草稿？台账数据不受影响。')) return;
    if (storageAvailable) localStorage.removeItem(DATA.draftKey);
    location.reload();
  });

  byId('previewBtn').addEventListener('click', function () {
    var pre = byId('preview');
    pre.textContent = JSON.stringify(collectOutput(), null, 2);
    pre.hidden = false;
    pre.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  byId('submitBtn').addEventListener('click', function () {
    var out = collectOutput();
    var name = 'poc-changes-' + new Date().toISOString().slice(0, 10) + '.json';
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('已生成 ' + name + '，请发给发起人');
  });

  initState();
  render();
  // Seed the progress date with today so the field is never a blank trap.
  var cards = document.querySelectorAll('.card');
  for (var i = 0; i < cards.length; i += 1) {
    var id = cards[i].getAttribute('data-id');
    if (!state[id].newProgress.date) {
      state[id].newProgress.date = new Date().toISOString().slice(0, 10);
      var dateInput = cards[i].querySelector('[data-key="p_date"]');
      if (dateInput) dateInput.value = state[id].newProgress.date;
    }
  }
})();
`

/** 主流程。 */
function main() {
  const { values } = parseArgs({
    options: {
      mode: { type: 'string', default: 'fill' },
      poc: { type: 'string' },
      out: { type: 'string' },
    },
  })
  const mode = values.mode === 'new' ? 'new' : 'fill'
  const out = values.out ?? `/tmp/poc-form-${mode}-${Date.now()}.html`

  let files = []
  if (mode === 'fill') {
    if (values.poc === undefined) throw new Error('fill 模式需要 --poc（一个 YAML 文件或通配符）')
    files = expandPocPattern(values.poc)
    if (files.length === 0) throw new Error(`没有匹配到任何 YAML：${values.poc}`)
  }

  const projects = mode === 'new'
    ? [{ ...blankProject(), poc_id: '', newProgress: {} }]
    : files.map((file) => {
        const record = readProject(file)
        const project = projectForForm(record)
        return { ...project, newProgress: {} }
      })

  const html = buildFormHtml({ mode, projects })
  writeFileSync(out, html, 'utf8')

  process.stdout.write(`已生成：${resolve(out)}\n  模式：${mode}\n  项目数：${projects.length}\n`)
  for (const project of projects) {
    const label = project.name === '' ? '（未命名）' : project.name
    process.stdout.write(`  - ${project.poc_id === '' ? '（新建）' : project.poc_id} ${label}：已有 ${project.progress_count} 条进展\n`)
  }
  process.stdout.write('  交给组员：双击打开 → 填写 → 点【提交并生成文件】→ 把 .json 发回\n')
}

/** 展开 `--poc` 参数：单个文件，或含 `*` 的通配符。 */
function expandPocPattern(pattern) {
  const expanded = pattern.startsWith('~') ? pattern.replace(/^~/, process.env.HOME ?? '') : pattern
  if (!expanded.includes('*')) return [expanded]
  // Shell-style glob without a dependency: split on the last slash, then match
  // the file names against the pattern's basename glob.
  const dir = expanded.slice(0, expanded.lastIndexOf('/'))
  const glob = expanded.slice(expanded.lastIndexOf('/') + 1)
  const regex = new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`)
  let names = []
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  return names.filter((name) => regex.test(name)).map((name) => `${dir}/${name}`)
}

main()
