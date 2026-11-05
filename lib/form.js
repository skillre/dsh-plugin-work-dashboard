/**
 * Self-contained HTML form generator.
 *
 * Design rules, taken from the specification and from the reference
 * implementation (`~/dsh-test/poc_form.py`) but with three defects fixed:
 *
 * 1. **One file, no server, no CDN.** Everything is inlined, so a colleague can
 *    double-click it on any machine, offline.
 * 2. **Auto-save to localStorage.** The draft survives a closed tab. The
 *    storage key is derived from the PROJECT IDS, not from a timestamp: a
 *    regenerated form for the same projects must find the same draft, which the
 *    reference implementation got wrong (its key embedded the generation time).
 * 3. **Live validation.** The documented counts (2–3 indicators, 3–5
 *    scenarios, ≤3 risks) and the G0 prerequisites are checked on every edit.
 * 4. **The download is REAL YAML.** The reference emitted a JSON blob, which the
 *    plugin's own import page cannot read. This generator emits YAML with proper
 *    scalar quoting, so the file a colleague sends back can be dropped straight
 *    into the import page.
 *
 * The generated script is plain ES5-compatible JavaScript: no build step, no
 * imports, nothing that needs a modern runtime beyond `localStorage` and `Blob`.
 */
import YAML from 'yaml';
/** The documented enums, mirrored from the schema. */
const STAGES = [
    ['G0-立项', 'G0 立项'],
    ['G1-方案设计', 'G1 方案设计'],
    ['G2-方案验证', 'G2 方案验证'],
    ['G3-结果验证', 'G3 结果验证'],
    ['G4-结果转化', 'G4 结果转化'],
    ['closed', '已关闭'],
];
const TYPES = [
    ['customer-pilot', '客户试点'],
    ['tech-validation', '技术验证'],
    ['solution-compare', '方案对比'],
];
const TIERS = [
    ['strategic', '战略级'],
    ['high-value', '高价值'],
    ['normal', '常规'],
];
const RISK_LEVELS = [
    ['high', '高'],
    ['medium', '中'],
    ['low', '低'],
];
const RECOGNITION_SCOPES = ['无', '口头', '书面', '正式验收'];
/** Coerce a stored value to the string the form edits. */
function text(value) {
    if (value === null || value === undefined)
        return '';
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    return '';
}
/**
 * Convert one ledger record into the form's project shape.
 *
 * Every field becomes a string or a list of strings: the form is a plain
 * HTML/JS page with no schema awareness, so the Host does the normalization
 * once here instead of repeating it in the generated script.
 */
export function projectForForm(record) {
    const gates = record.gates ?? {};
    const result = record.result ?? {};
    const criteria = Array.isArray(record.success_criteria) ? record.success_criteria : [];
    const risks = Array.isArray(record.risks) ? record.risks : [];
    const scenarios = Array.isArray(record.success_scenarios) ? record.success_scenarios : [];
    const timeline = Array.isArray(record.timeline) ? record.timeline : [];
    return {
        poc_id: text(record.poc_id),
        name: text(record.name),
        type: text(record.type),
        tier: text(record.tier),
        stage: text(record.stage),
        owner: text(record.owner),
        sales_initiator: text(record.sales_initiator),
        customer_tech_owner: text(record.customer_tech_owner),
        why_customer_test: text(record.why_customer_test),
        why_we_test: text(record.why_we_test),
        next_action_goal: text(record.next_action_goal),
        // Gates are carried through verbatim: the form shows them read-only and
        // writes them back unchanged, so a fill-in session cannot silently reset a
        // gate that was already signed off.
        gates: JSON.parse(JSON.stringify(gates)),
        success_criteria: criteria.map((item) => ({
            name: text(item?.name),
            version: text(item?.version),
            metric: text(item?.metric),
        })),
        success_scenarios: scenarios.map(text).filter((item) => item !== ''),
        risks: risks.map((item) => ({
            name: text(item?.name),
            level: text(item?.level).toLowerCase(),
            mitigation: text(item?.mitigation),
        })),
        result: {
            achievement: text(result.achievement),
            evidence: text(result.evidence),
            recognition: text(result.recognition),
            next_milestone: text(result.next_milestone),
        },
        timeline: timeline.map((entry) => ({ ...entry })),
    };
}
/** The blank project a `blank`-mode form edits. */
export function blankProject() {
    return {
        poc_id: '',
        name: '',
        type: '',
        tier: '',
        stage: 'G0-立项',
        owner: '',
        sales_initiator: '',
        customer_tech_owner: '',
        why_customer_test: '',
        why_we_test: '',
        next_action_goal: '',
        gates: {
            G0: { complete: false, date: null },
            G1: { complete: false, date: null, indicators_count: 0, scenarios_count: 0, risks_count: 0 },
            G2: { complete: false, date: null, prerequisites_ready: false, engineers_invested: false },
        },
        success_criteria: [],
        success_scenarios: [],
        risks: [],
        result: { achievement: '', evidence: '', recognition: '', next_milestone: '' },
        timeline: [],
    };
}
/**
 * Build the stable draft key.
 *
 * Sorting the ids makes the key independent of selection order, so the same set
 * of projects always resumes the same draft — even if the user regenerates the
 * form later. A blank form gets a constant key so its draft survives too.
 */
export function draftKeyFor(mode, pocIds) {
    if (mode === 'blank')
        return 'poc-form-draft-blank';
    return `poc-form-draft-${[...pocIds].sort().join('+')}`;
}
/**
 * Serialize one project back to YAML.
 *
 * Uses `yaml`'s own stringifier rather than concatenation: a value containing
 * `: `, `#`, quotes or a newline must be quoted correctly, which the reference
 * implementation's hand-built strings did not do (a `metric: 成功率 ≥ 99.5%`
 * was fine, but `name: 某某：试点` produced invalid YAML).
 */
export function projectToYaml(project) {
    const document = {
        poc_id: project.poc_id,
        name: project.name,
        type: project.type,
        tier: project.tier,
        stage: project.stage,
        owner: project.owner,
        sales_initiator: project.sales_initiator,
        customer_tech_owner: project.customer_tech_owner,
        why_customer_test: project.why_customer_test,
        why_we_test: project.why_we_test,
        next_action_goal: project.next_action_goal,
        gates: project.gates,
        success_criteria: project.success_criteria,
        success_scenarios: project.success_scenarios,
        risks: project.risks,
        result: project.result,
        timeline: project.timeline,
    };
    return YAML.stringify(document, { lineWidth: 0 });
}
/**
 * Escape a value for embedding inside a `<script>` block.
 *
 * `</script>` inside a JSON string would close the block early, so the angle
 * brackets are escaped to their JSON unicode forms — the only sequence that can
 * terminate a script element. Everything else survives as plain JSON.
 */
function scriptSafe(json) {
    return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
/** Escape text for HTML content. */
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
/**
 * Generate the complete HTML form.
 *
 * The returned string is the whole document: no external stylesheet, script,
 * font, or image reference.
 */
export function buildFormHtml(options) {
    const now = options.now ?? new Date();
    const projects = options.mode === 'blank' ? [blankProject()] : options.projects;
    const payload = {
        mode: options.mode,
        generatedAt: now.toISOString(),
        projects,
        draftKey: draftKeyFor(options.mode, projects.map((project) => project.poc_id).filter((id) => id !== '')),
        stages: STAGES,
        types: TYPES,
        tiers: TIERS,
        riskLevels: RISK_LEVELS,
        recognitionScopes: RECOGNITION_SCOPES,
    };
    const data = scriptSafe(JSON.stringify(payload));
    const title = options.mode === 'blank' ? 'POC 新建项目表单' : `POC 信息收集表单（${projects.length} 个项目）`;
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${FORM_CSS}</style>
</head>
<body>
<div class="shell">
  <header class="topbar">
    <div class="topbar-text">
      <h1 class="topbar-title">${escapeHtml(title)}</h1>
      <p class="topbar-sub">填写后点「下载 YAML」，把文件发回项目负责人；也可以直接拖进 DSH 的 POC 运营台导入页。</p>
    </div>
    <div class="topbar-actions">
      <span class="save-status" id="saveStatus">已就绪</span>
      <button type="button" class="btn" id="clearBtn">清空草稿</button>
    </div>
  </header>
  <div class="notice" id="restoreNotice" hidden>已恢复上次未提交的草稿。</div>
  <div class="notice notice-warn" id="draftNotice" hidden></div>
  <main id="formBody"></main>
  <footer class="footer">
    <div class="footer-info" id="footerInfo">正在初始化…</div>
    <div class="footer-actions">
      <button type="button" class="btn" id="previewBtn">预览 YAML</button>
      <button type="button" class="btn btn-primary" id="downloadBtn">下载 YAML</button>
    </div>
  </footer>
</div>
<pre class="yaml-preview" id="yamlPreview" hidden></pre>
<div class="toast" id="toast" hidden></div>
<script>
(function () {
  'use strict';
  var DATA = ${data};
  ${FORM_SCRIPT}
})();
</script>
</body>
</html>
`;
}
/** Styles: one inline sheet, the design tokens from DESIGN.md. */
const FORM_CSS = `
:root{--primary:#2864E8;--text:#192638;--bg:#F5F7FB;--border:#E6EBF2;--green:#218568;--amber:#B77919;--red:#C0392B;--muted:#6B7C93}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Avenir Next','PingFang SC','Microsoft YaHei',system-ui,sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.6;padding:24px}
.shell{max-width:920px;margin:0 auto}
.topbar{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;background:#fff;padding:16px 24px;border-radius:8px;border:1px solid var(--border);margin-bottom:12px;position:sticky;top:0;z-index:100}
.topbar-title{font-size:18px;font-weight:600;line-height:1.4}
.topbar-sub{font-size:12px;color:var(--muted);margin-top:2px}
.topbar-actions{display:flex;align-items:center;gap:8px;flex:none}
.save-status{font-size:12px;color:var(--green);white-space:nowrap}
.notice{background:#E8EFFC;border:1px solid #C9DCFB;border-radius:6px;padding:10px 14px;font-size:13px;margin-bottom:12px}
.notice-warn{background:#FDF4E3;border-color:#F0E2C8;color:#8A5E12}
.card{background:#fff;border-radius:8px;border:1px solid var(--border);padding:20px 24px;margin-bottom:14px}
.card-title{font-size:15px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.card-hint{font-size:12px;color:var(--muted);margin-bottom:14px}
.field{margin-bottom:16px}
.field:last-child{margin-bottom:0}
.field-label{display:block;font-weight:500;margin-bottom:5px;font-size:13px}
.field-label .req{color:var(--red);margin-left:2px}
.field-help{font-size:12px;color:var(--muted);margin-bottom:5px}
.input,.textarea,.select{width:100%;padding:8px 11px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px;background:#fff;color:var(--text)}
.input:focus,.textarea:focus,.select:focus{outline:none;border-color:var(--primary)}
.textarea{min-height:66px;resize:vertical}
.field-error{color:var(--red);font-size:12px;margin-top:4px;display:none}
.field.has-error .input,.field.has-error .textarea,.field.has-error .select{border-color:var(--red)}
.field.has-error .field-error{display:block}
.readonly{background:#FAFBFC}
.readonly .input{background:#FAFBFC;color:var(--muted)}
.list-item{display:flex;gap:8px;margin-bottom:8px;align-items:flex-start}
.list-item .input{flex:1}
.btn{padding:7px 14px;border-radius:6px;border:1px solid var(--border);background:#fff;cursor:pointer;font-family:inherit;font-size:13px;color:var(--text)}
.btn:hover{background:#F8F9FB}
.btn-primary{background:var(--primary);color:#fff;border-color:var(--primary)}
.btn-primary:hover{background:#1E54C9}
.btn-sm{padding:4px 10px;font-size:12px}
.btn-remove{color:var(--red);border-color:#F0D0CB}
.badge{display:inline-block;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:500}
.badge-ok{background:#E6F4EE;color:var(--green)}
.badge-warn{background:#FDF4E3;color:var(--amber)}
.badge-error{background:#FBEAE8;color:var(--red)}
.badge-info{background:#E8EFFC;color:var(--primary)}
.gaps{background:#FDF8F0;border:1px solid #F0E2C8;border-radius:6px;padding:10px 14px;margin-bottom:14px}
.gap-item{font-size:13px;padding:3px 0;display:flex;gap:8px}
.gap-high{color:var(--red)}
.gap-medium{color:var(--amber)}
.footer{position:sticky;bottom:0;background:#fff;border:1px solid var(--border);border-radius:8px;padding:14px 24px;margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;box-shadow:0 -4px 12px rgba(0,0,0,.04)}
.footer-info{font-size:13px;color:var(--muted)}
.footer-actions{display:flex;gap:8px;flex-wrap:wrap}
.yaml-preview{background:#fff;padding:16px;border-radius:8px;border:1px solid var(--border);overflow:auto;font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;margin-top:14px;white-space:pre-wrap}
.toast{position:fixed;top:80px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;padding:9px 18px;border-radius:6px;font-size:13px;z-index:200}
@media(max-width:640px){body{padding:12px}.card{padding:16px}.topbar{flex-direction:column}}
@media print{.topbar,.footer,.topbar-actions{position:static}}
`;
/**
 * The generated page script.
 *
 * Plain ES5 (no arrow functions, no template literals, no `const`): the file
 * must run from `file://` in any browser a colleague happens to have, including
 * ones without a modern JS engine. It also keeps the generator's own template
 * escaping simple, since nothing here needs backticks.
 */
const FORM_SCRIPT = `
  var state = {};
  var saveTimer = null;
  var storageAvailable = true;

  function text(value) {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function byId(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return text(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showToast(message) {
    var toast = byId('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toast.hidden = true; }, 2200);
  }

  function probeStorage() {
    try {
      localStorage.setItem('poc-form-probe', '1');
      localStorage.removeItem('poc-form-probe');
      return true;
    } catch (error) {
      return false;
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function initState() {
    DATA.projects.forEach(function (project) {
      state[project.poc_id || '__blank__'] = clone(project);
    });
    storageAvailable = probeStorage();
    if (!storageAvailable) {
      byId('draftNotice').hidden = false;
      byId('draftNotice').textContent = '当前浏览器禁用了本地存储，本次填写不会被自动保存。请填完后立刻下载 YAML。';
      return;
    }
    try {
      var saved = localStorage.getItem(DATA.draftKey);
      if (saved) {
        var parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(function (key) {
          if (state[key]) state[key] = parsed[key];
        });
        byId('restoreNotice').hidden = false;
      }
    } catch (error) {
      // A corrupt draft must never block the form: drop it and start clean.
      localStorage.removeItem(DATA.draftKey);
    }
  }

  function stageLabel(stage) {
    for (var i = 0; i < DATA.stages.length; i += 1) {
      if (DATA.stages[i][0] === stage) return DATA.stages[i][1];
    }
    return stage || '未设置';
  }

  function optionsFor(list, current, blankLabel) {
    var html = '<option value="">' + escapeHtml(blankLabel || '请选择') + '</option>';
    for (var i = 0; i < list.length; i += 1) {
      var value = list[i][0];
      var label = list[i][1];
      html += '<option value="' + escapeHtml(value) + '"' + (value === current ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    }
    return html;
  }

  /** The documented quality rules, evaluated in the page for live feedback. */
  function scanGaps(project) {
    var gaps = [];
    if (!text(project.why_customer_test)) gaps.push({ label: '客户为什么测 未填（G0 必填）', level: 'high' });
    if (!text(project.why_we_test)) gaps.push({ label: '我们为什么测 未填（G0 必填）', level: 'high' });
    if (!text(project.customer_tech_owner)) gaps.push({ label: '客户技术责任人 未填（G0 必填）', level: 'high' });
    if (!text(project.next_action_goal)) gaps.push({ label: '下一步动作目标 未填（G0 必填）', level: 'high' });
    var criteria = project.success_criteria || [];
    var scenarios = project.success_scenarios || [];
    var risks = project.risks || [];
    if (criteria.length < 2 || criteria.length > 3) gaps.push({ label: '成功指标 ' + criteria.length + ' 个（要求 2-3 个）', level: 'medium' });
    if (scenarios.length < 3 || scenarios.length > 5) gaps.push({ label: '验证场景 ' + scenarios.length + ' 个（要求 3-5 个）', level: 'medium' });
    if (risks.length > 3) gaps.push({ label: '风险 ' + risks.length + ' 个（上限 3 个）', level: 'medium' });
    var result = project.result || {};
    if (text(result.achievement) && !text(result.evidence)) gaps.push({ label: '有达成无证据', level: 'high' });
    if (text(result.evidence) && !text(result.recognition)) gaps.push({ label: '有证据无客户认可', level: 'high' });
    if (text(result.achievement) && !text(result.next_milestone)) gaps.push({ label: '已达成但无下一步里程碑', level: 'high' });
    if (text(project.stage) === 'closed') {
      ['achievement', 'evidence', 'recognition', 'next_milestone'].forEach(function (key) {
        if (!text(result[key])) gaps.push({ label: '已关闭但 ' + key + ' 为空', level: 'high' });
      });
    }
    return gaps;
  }

  function stateKey(project) { return project.poc_id || '__blank__'; }

  function fieldHtml(project, path, label, value, required, help, readonly, kind) {
    var id = stateKey(project) + '-' + path;
    var req = required ? '<span class="req">*</span>' : '';
    var helpHtml = help ? '<div class="field-help">' + escapeHtml(help) + '</div>' : '';
    var ro = readonly ? ' readonly' : '';
    var wrap = readonly ? ' readonly' : '';
    var tag = kind === 'textarea'
      ? '<textarea class="textarea" id="' + escapeHtml(id) + '" data-path="' + escapeHtml(path) + '"' + ro + '>' + escapeHtml(value) + '</textarea>'
      : '<input class="input" type="text" id="' + escapeHtml(id) + '" data-path="' + escapeHtml(path) + '" value="' + escapeHtml(value) + '"' + ro + '>';
    return '<div class="field' + wrap + '" data-field="' + escapeHtml(path) + '">' +
      '<label class="field-label" for="' + escapeHtml(id) + '">' + escapeHtml(label) + req + '</label>' +
      helpHtml + tag +
      '<div class="field-error">此项必填</div>' +
      '</div>';
  }

  function selectHtml(project, path, label, current, list) {
    var id = stateKey(project) + '-' + path;
    return '<div class="field" data-field="' + escapeHtml(path) + '">' +
      '<label class="field-label" for="' + escapeHtml(id) + '">' + escapeHtml(label) + '</label>' +
      '<select class="select" id="' + escapeHtml(id) + '" data-path="' + escapeHtml(path) + '">' + optionsFor(list, current) + '</select>' +
      '</div>';
  }

  function listCard(project, key, title, min, max, hint, columns) {
    var items = project[key] || [];
    var inRange = items.length >= min && items.length <= max;
    var html = '<div class="card"><div class="card-title">' + escapeHtml(title) +
      ' <span class="badge ' + (inRange ? 'badge-ok' : 'badge-warn') + '">' + items.length + ' 个</span></div>' +
      '<div class="card-hint">' + escapeHtml(hint) + '</div>';
    for (var i = 0; i < items.length; i += 1) {
      html += '<div class="list-item">';
      for (var c = 0; c < columns.length; c += 1) {
        var column = columns[c];
        var value = columns.length === 1 ? text(items[i]) : text((items[i] || {})[column.key]);
        html += '<input class="input" data-list="' + escapeHtml(key) + '" data-index="' + i + '"' +
          (columns.length === 1 ? '' : ' data-column="' + escapeHtml(column.key) + '"') +
          ' placeholder="' + escapeHtml(column.placeholder) + '" value="' + escapeHtml(value) + '">';
      }
      html += '<button type="button" class="btn btn-sm btn-remove" data-remove="' + escapeHtml(key) + '" data-index="' + i + '">删除</button>';
      html += '</div>';
    }
    if (items.length < max) {
      html += '<button type="button" class="btn btn-sm" data-add="' + escapeHtml(key) + '">+ 添加</button>';
    }
    return html + '</div>';
  }

  function renderProject(project) {
    var isNew = DATA.mode === 'blank' || !text(project.poc_id);
    var html = '<div class="card" data-poc="' + escapeHtml(stateKey(project)) + '">' +
      '<div class="card-title">' + escapeHtml(text(project.name) || '新项目') + '</div>' +
      '<div class="card-hint">' + escapeHtml(text(project.poc_id) || '（编号待填）') + ' · ' + escapeHtml(stageLabel(project.stage)) + '</div>';
    var gaps = scanGaps(project);
    if (gaps.length > 0) {
      html += '<div class="gaps"><div style="font-weight:600;margin-bottom:4px">还有 ' + gaps.length + ' 处待补</div>';
      gaps.forEach(function (gap) {
        html += '<div class="gap-item gap-' + gap.level + '">● ' + escapeHtml(gap.label) + '</div>';
      });
      html += '</div>';
    }
    html += '<div class="card readonly"><div class="card-title">基本信息</div>' +
      fieldHtml(project, 'poc_id', '项目编号', project.poc_id, isNew, '形如 POC-YYYY-NNN', !isNew, 'text') +
      fieldHtml(project, 'name', '项目名称', project.name, true, '', false, 'text') +
      selectHtml(project, 'type', '项目类型', project.type, DATA.types) +
      selectHtml(project, 'tier', '重要程度', project.tier, DATA.tiers) +
      selectHtml(project, 'stage', '当前阶段', project.stage, DATA.stages) +
      fieldHtml(project, 'owner', '我方负责人', project.owner, false, '', false, 'text') +
      fieldHtml(project, 'sales_initiator', '发起销售', project.sales_initiator, false, '', false, 'text') +
      '</div>';
    html += '<div class="card"><div class="card-title">G0 立项必填 <span class="badge badge-error">4 项</span></div>' +
      '<div class="card-hint">这是立项的最低门槛：缺一项就说明项目还没立清楚。</div>' +
      fieldHtml(project, 'why_customer_test', '① 客户为什么测', project.why_customer_test, true, '客户的真实痛点，不是我们想卖什么', false, 'textarea') +
      fieldHtml(project, 'why_we_test', '② 我们为什么测', project.why_we_test, true, '我们的商业目的，例如标杆案例、行业复制', false, 'textarea') +
      fieldHtml(project, 'next_action_goal', '③ 下一步动作目标', project.next_action_goal, true, '具体可衡量，含时间', false, 'textarea') +
      fieldHtml(project, 'customer_tech_owner', '④ 客户侧技术责任人', project.customer_tech_owner, true, '', false, 'text') +
      '</div>';
    html += listCard(project, 'success_criteria', '成功指标', 2, 3, '要求 2-3 个，越少越聚焦', [
      { key: 'name', placeholder: '指标名称' },
      { key: 'metric', placeholder: '衡量标准' },
    ]);
    html += listCard(project, 'success_scenarios', '验证场景', 3, 5, '要求 3-5 个', [{ placeholder: '场景描述' }]);
    html += listCard(project, 'risks', '风险', 0, 3, '上限 3 个，每个写清应对', [
      { key: 'name', placeholder: '风险描述' },
      { key: 'mitigation', placeholder: '应对措施' },
    ]);
    var result = project.result || {};
    html += '<div class="card"><div class="card-title">结果四维 <span class="badge badge-info">必须分开填</span></div>' +
      '<div class="card-hint">合并成一句「进展顺利」就发现不了「做成了但没转化」。</div>' +
      fieldHtml(project, 'result.achievement', '目标达成情况', result.achievement, false, '做成了没有', false, 'textarea') +
      fieldHtml(project, 'result.evidence', '证据（链接/文档/数据）', result.evidence, false, '要能点开验证，不要写「已确认」', false, 'textarea') +
      fieldHtml(project, 'result.recognition', '客户书面认可', result.recognition, false, '客户明确说好，最好有书面', false, 'textarea') +
      fieldHtml(project, 'result.next_milestone', '下一步里程碑', result.next_milestone, false, '做成了但没转化是最常见的浪费', false, 'textarea') +
      '</div>';
    return html + '</div>';
  }

  function render() {
    var body = byId('formBody');
    var html = '';
    Object.keys(state).forEach(function (key) { html += renderProject(state[key]); });
    body.innerHTML = html;
    updateFooter();
  }

  function setPath(object, path, value) {
    var parts = path.split('.');
    var current = object;
    for (var i = 0; i < parts.length - 1; i += 1) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  function currentProject(element) {
    var card = element.closest('[data-poc]');
    return card ? state[card.getAttribute('data-poc')] : null;
  }

  function updateFooter() {
    var totalGaps = 0;
    var missingRequired = 0;
    Object.keys(state).forEach(function (key) {
      var project = state[key];
      totalGaps += scanGaps(project).length;
      if (!text(project.name)) missingRequired += 1;
    });
    var info = byId('footerInfo');
    if (missingRequired > 0) {
      info.innerHTML = '<span class="badge badge-error">还有 ' + missingRequired + ' 个项目没填名称</span>';
    } else if (totalGaps === 0) {
      info.innerHTML = '<span class="badge badge-ok">✓ 没有待补项，可以下载</span>';
    } else {
      info.innerHTML = '<span class="badge badge-warn">还有 ' + totalGaps + ' 处待补</span>（仍可下载，负责人会在导入时看到）';
    }
    var download = byId('downloadBtn');
    download.disabled = missingRequired > 0;
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { save(true); }, 1200);
  }

  function save(silent) {
    if (!storageAvailable) return;
    try {
      localStorage.setItem(DATA.draftKey, JSON.stringify(state));
      var now = new Date();
      byId('saveStatus').textContent = '已自动保存 ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      if (!silent) showToast('已保存');
    } catch (error) {
      byId('saveStatus').textContent = '保存失败：' + error.message;
    }
  }

  function buildProjects() {
    var out = [];
    Object.keys(state).forEach(function (key) { out.push(state[key]); });
    return out;
  }

  function serialize(project) {
    // A minimal YAML writer with correct quoting: this page cannot import the
    // plugin's YAML library, so the rules it must satisfy are (a) parse as YAML,
    // (b) round-trip through the plugin's import page. Values needing quotes
    // (leading/trailing space, ': ', '#', newlines, reserved words) are quoted.
    function quote(value) {
      var string = text(value);
      if (string === '') return "''";
      // A raw newline inside a quoted scalar is folded to a space by YAML, so a
      // multi-line value must be a block scalar to round-trip exactly. A literal
      // block keeps the text readable and lossless.
      if (string.indexOf('\\n') !== -1) {
        var body = string.split('\\n').map(function (line) { return '  ' + line; }).join('\\n');
        return '|\\n' + body;
      }
      // Characters that force quoting in YAML: leading/trailing space, a
      // colon-space, a space-hash, a leading hash, reserved words, and the
      // indicator characters that begin a flow collection.
      var string_ = String(string);
      var needsQuotes = false;
      if (/^[ ]|[ ]$/.test(string_)) needsQuotes = true;
      if (string_.indexOf(': ') !== -1 || string_.indexOf(' #') !== -1 || string_.indexOf('\t') !== -1) needsQuotes = true;
      if (string_.charAt(0) === '#' || string_.charAt(0) === '-' || string_.charAt(0) === '?') needsQuotes = true;
      if (/^(?:true|false|null|~|-?[0-9]+(?:\.[0-9]+)?)$/.test(string_)) needsQuotes = true;
      // YAML indicator characters that cannot start a plain scalar, checked by
      // code point so no quoting layer can mangle the list.
      var firstCode = string_.charCodeAt(0);
      var indicators = [91, 93, 123, 125, 44, 35, 38, 42, 33, 124, 62, 39, 34, 37, 64, 36];
      if (indicators.indexOf(firstCode) !== -1) needsQuotes = true;
      if (!needsQuotes) return string;
      return "'" + string.replace(/'/g, "''") + "'";
    }
    var lines = [];
    lines.push('poc_id: ' + quote(project.poc_id));
    lines.push('name: ' + quote(project.name));
    lines.push('type: ' + quote(project.type));
    lines.push('tier: ' + quote(project.tier));
    lines.push('stage: ' + quote(project.stage));
    lines.push('owner: ' + quote(project.owner));
    lines.push('sales_initiator: ' + quote(project.sales_initiator));
    lines.push('customer_tech_owner: ' + quote(project.customer_tech_owner));
    lines.push('why_customer_test: ' + quote(project.why_customer_test));
    lines.push('why_we_test: ' + quote(project.why_we_test));
    lines.push('next_action_goal: ' + quote(project.next_action_goal));
    lines.push('gates:');
    var gates = project.gates || {};
    Object.keys(gates).forEach(function (stage) {
      var gate = gates[stage] || {};
      lines.push('  ' + stage + ':');
      Object.keys(gate).forEach(function (field) {
        var value = gate[field];
        if (value === null || value === undefined) { lines.push('    ' + field + ': null'); return; }
        if (typeof value === 'boolean' || typeof value === 'number') { lines.push('    ' + field + ': ' + value); return; }
        lines.push('    ' + field + ': ' + quote(value));
      });
    });
    lines.push('success_criteria:');
    (project.success_criteria || []).forEach(function (item) {
      lines.push('  - name: ' + quote(item.name));
      lines.push('    version: ' + quote(item.version));
      lines.push('    metric: ' + quote(item.metric));
    });
    lines.push('success_scenarios:');
    (project.success_scenarios || []).forEach(function (item) { lines.push('  - ' + quote(item)); });
    lines.push('risks:');
    (project.risks || []).forEach(function (item) {
      lines.push('  - name: ' + quote(item.name));
      lines.push('    level: ' + quote(item.level));
      lines.push('    mitigation: ' + quote(item.mitigation));
    });
    lines.push('result:');
    var result = project.result || {};
    lines.push('  achievement: ' + quote(result.achievement));
    lines.push('  evidence: ' + quote(result.evidence));
    lines.push('  recognition: ' + quote(result.recognition));
    lines.push('  next_milestone: ' + quote(result.next_milestone));
    lines.push('timeline:');
    (project.timeline || []).forEach(function (entry) {
      var keys = Object.keys(entry);
      keys.forEach(function (key, index) {
        var value = entry[key];
        var prefix = index === 0 ? '  - ' : '    ';
        if (value === null || value === undefined) { lines.push(prefix + key + ': null'); return; }
        if (typeof value === 'number') { lines.push(prefix + key + ': ' + value); return; }
        lines.push(prefix + key + ': ' + quote(value));
      });
    });
    return lines.join('\\n') + '\\n';
  }

  // A YAML file holds ONE project mapping: concatenating two projects produces
  // duplicate top-level keys ("Map keys must be unique"), and a YAML
  // multi-document file is rejected by the plugin import page (it uses YAML.parse).
  // So a batch form yields one document PER project, each independently importable.
  function documentsForDownload() {
    var header = '# 由 POC 运营台表单生成\\n# 生成时间：' + DATA.generatedAt + '\\n# 填写人：' + quoteName() + '\\n\\n';
    return buildProjects().map(function (project) {
      return { pocId: project.poc_id, name: project.name, text: header + serialize(project) };
    });
  }

  function fileBaseName() {
    var stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    var mode = DATA.mode === 'blank' ? 'new' : 'filled';
    var ids = buildProjects().map(function (project) { return project.poc_id; }).filter(Boolean);
    if (ids.length === 0) return 'poc-' + mode + '-' + stamp;
    return 'poc-' + mode + '-' + ids.join('+') + '-' + stamp;
  }

  function quoteName() {
    // The 填写人 line is informational only; keep it plain text in the comment.
    return '（请在下载前把这一行改成你的名字）';
  }

  function previewYaml() {
    var pre = byId('yamlPreview');
    var docs = documentsForDownload();
    var parts = [];
    if (docs.length > 1) {
      parts.push('# 本次共 ' + docs.length + ' 个项目，下载会得到 ' + docs.length + ' 个 .yaml 文件（每个项目一个）\\n');
    }
    docs.forEach(function (doc) {
      parts.push('# ── ' + (doc.pocId || '（编号待填）') + ' ──');
      parts.push(doc.text);
    });
    pre.textContent = parts.join('\\n');
    pre.hidden = false;
    pre.scrollIntoView({ behavior: 'smooth' });
  }

  function saveOneFile(fileName, text, delayMs) {
    setTimeout(function () {
      var blob = new Blob([text], { type: 'text/yaml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    }, delayMs);
  }

  function downloadYaml() {
    var docs = documentsForDownload();
    var base = fileBaseName();
    if (docs.length === 1) {
      saveOneFile(base + '.yaml', docs[0].text, 0);
      showToast('已下载 ' + base + '.yaml');
    } else {
      // One file per project. A browser may ask to allow multiple downloads,
      // which is why the toast states how many files to expect.
      docs.forEach(function (doc, index) {
        var suffix = doc.pocId || ('blank-' + (index + 1));
        saveOneFile(base + '-' + suffix + '.yaml', doc.text, index * 400);
      });
      showToast('正在下载 ' + docs.length + ' 个 YAML 文件（每个项目一个）');
    }
    save(true);
  }
  function clearDraft() {
    if (!confirm('确定清空所有已填内容？此操作不可恢复。')) return;
    if (storageAvailable) localStorage.removeItem(DATA.draftKey);
    location.reload();
  }

  function bind() {
    document.addEventListener('input', function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;
      var project = currentProject(target);
      if (!project) return;
      var path = target.getAttribute('data-path');
      var listKey = target.getAttribute('data-list');
      if (path) {
        setPath(project, path, target.value);
        scheduleSave();
        updateFooter();
        return;
      }
      if (listKey) {
        var index = Number(target.getAttribute('data-index'));
        var column = target.getAttribute('data-column');
        if (!project[listKey]) project[listKey] = [];
        if (column) {
          if (!project[listKey][index]) project[listKey][index] = {};
          project[listKey][index][column] = target.value;
        } else {
          project[listKey][index] = target.value;
        }
        scheduleSave();
        updateFooter();
      }
    });
    document.addEventListener('change', function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;
      var project = currentProject(target);
      var path = target.getAttribute('data-path');
      if (!project || !path) return;
      setPath(project, path, target.value);
      scheduleSave();
      render();
    });
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;
      var project = currentProject(target);
      var addKey = target.getAttribute('data-add');
      var removeKey = target.getAttribute('data-remove');
      if (project && addKey) {
        if (!project[addKey]) project[addKey] = [];
        project[addKey].push(addKey === 'success_scenarios' ? '' : { name: '', metric: '', mitigation: '', level: '' });
        scheduleSave();
        render();
        return;
      }
      if (project && removeKey) {
        var index = Number(target.getAttribute('data-index'));
        project[removeKey].splice(index, 1);
        scheduleSave();
        render();
      }
    });
  }

  initState();
  bind();
  render();
  if (byId('clearBtn')) byId('clearBtn').addEventListener('click', clearDraft);
  if (byId('previewBtn')) byId('previewBtn').addEventListener('click', previewYaml);
  if (byId('downloadBtn')) byId('downloadBtn').addEventListener('click', downloadYaml);
  // A periodic save covers the case where the user edits and never blurs.
  setInterval(function () { save(true); }, 30000);
  window.addEventListener('beforeunload', function () { save(true); });
`;
/** Suggest a file name for the generated form. */
export function formFileName(options) {
    const now = options.now ?? new Date();
    const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    if (options.mode === 'blank')
        return `poc-form-new-${stamp}.html`;
    if (options.pocIds.length === 1)
        return `poc-form-${options.pocIds[0]}-${stamp}.html`;
    return `poc-forms-${options.pocIds.length}-${stamp}.html`;
}
/** Re-export the YAML library's parse for the round-trip test. */
export { YAML };
