/**
 * Client dictionaries.
 *
 * Two locales ship with the bundle: Simplified Chinese (the authoring language
 * and the language the ledger itself is written in) and English. Keys are flat
 * and dot-namespaced, resolved through the shared `locale` service, so switching
 * the GUI language re-renders the console without a reload.
 *
 * Rule and dimension copy is keyed by the stable ids the Host sends
 * (`gap.G0-why-customer.title`, `dim.evidence`) rather than by prose, so a new
 * rule id only needs a dictionary entry on both halves of the same bundle.
 */

/** The namespace registered with the Client locale service. */
export const NAMESPACE = 'skillreWorkDashboard'

/** Chinese dictionary; the key set is the source of truth. */
export const zh: Record<string, string> = {
  nav: '工作看板',
  title: '工作看板',
  subtitle: '多模块运营看板：先把正在推进的事情看清楚，再决定下一步补什么。',
  dataSource: '数据源',
  eyebrow: '工作看板 · 只读',
  modulePoc: 'POC 运营',
  modulePocHint: '项目阶段、四维结果与缺口清单',
  moduleMore: '更多模块陆续加入',

  // Toolbar / refresh
  refresh: '刷新',
  refreshing: '正在拉取…',
  refreshingHint: '首次拉取需要几秒',
  refreshSettings: '刷新设置',
  refreshedAt: '已刷新 {time}',
  neverRefreshed: '尚未拉取',
  autoRefresh: '自动刷新',
  intervalOff: '关闭（仅手动）',
  interval10m: '每 10 分钟',
  interval1h: '每 1 小时',
  intervalCustom: '自定义',
  customMinutes: '分钟',
  save: '保存',
  cancel: '取消',
  customMinutesError: '请输入 {min}–{max} 之间的整数分钟数',
  autoRefreshOn: '自动刷新：每 {minutes} 分钟（仅本页打开时生效）',
  autoRefreshOff: '自动刷新：关闭',
  autoRefreshFailed: '定时刷新失败，将在下一周期重试',

  // Empty / error states
  emptyTitle: '还没有数据',
  emptyCopy: '点【刷新】从 GitHub 拉取 POC 台账',
  emptyRefresh: '立即刷新',
  emptyPath: '缓存位置',
  failureTitle: '拉取失败',
  failureReason: '原因',
  failureRetry: '重试',
  failureHint: '检查网络与 gh 登录状态后重试。',
  loading: '加载中…',
  loadingDetail: '正在读取项目…',

  // Stats
  statActive: '进行中',
  statG0: '待补 G0',
  statRisk: '有风险',
  statConvertible: '可转化',
  statTotal: '项目总数',
  statClosed: '已关闭',

  // Table
  tableTitle: '项目总览',
  colProject: '项目',
  colStage: '阶段',
  colDimensions: '四维状态',
  colGaps: '缺口',
  colAction: '操作',
  detail: '详情',
  openDetail: '查看详情',
  noProjects: '仓库里还没有项目',
  warningsTitle: '解析提示',

  // Dimensions
  dimAchievement: '目标达成',
  dimEvidence: '证据',
  dimRecognition: '客户认可',
  dimNextMilestone: '下一步',
  dimPresent: '已有',
  dimMissing: '缺',
  dimensionCount: '{count}/4',

  // Stage rail
  stageTrack: '阶段轨道',
  stageG0: 'G0 立项',
  stageG1: 'G1 方案设计',
  stageG2: 'G2 方案验证',
  stageG3: 'G3 结果验证',
  stageG4: 'G4 结果转化',
  stageClosed: '已关闭',
  stageDone: '已完成',
  stageCurrent: '当前',
  stagePending: '未开始',
  stageUnknown: '阶段未识别',

  // Pending list
  pendingTitle: '待处理',
  pendingEmpty: '没有扫出缺口，继续保持。',
  pendingCount: '{count} 项',
  gapPriority: '优先级 {value}',

  // Detail page
  back: '← 返回',
  detailIdentity: '{pocId} · {stage} · {tier}',
  detailMissing: '项目不存在',
  detailMissingCopy: '仓库里没有 poc_id 为 {pocId} 的项目，可能已被移除。请刷新后重试。',
  sectionFourDim: '四维结果',
  sectionG0: 'G0 立项三必填',
  sectionGates: '阶段记录',
  sectionScope: '指标 / 场景 / 风险',
  sectionResult: '结果与下一步',
  sectionTimeline: '时间线',
  sectionGaps: '本项目缺口',
  whyCustomerTest: '客户为什么测',
  whyWeTest: '我们为什么测',
  nextActionGoal: '下一步动作目标',
  customerTechOwner: '客户技术责任人',
  owner: '我方负责人',
  salesInitiator: '发起销售',
  type: '项目类型',
  tier: '项目级别',
  gateDate: '完成日期',
  gateCounts: '指标 {indicators} · 场景 {scenarios} · 风险 {risks}',
  gatePrereq: '前置就绪 {ready}',
  gateEngineers: '已投人力 {invested}',
  yes: '是',
  no: '否',
  criteriaTitle: '成功指标',
  scenariosTitle: '验证场景',
  risksTitle: '风险',
  criteriaCount: '{count} 个',
  scenariosCount: '{count} 个',
  risksCount: '{count} 个',
  criteriaLimitHint: '要求 2–3 个',
  scenariosLimitHint: '要求 3–5 个',
  risksLimitHint: '上限 3 个',
  emptyField: '（空）',
  riskLevel: '等级',
  riskMitigation: '应对',
  round: '第 {round} 轮',
  roundUnnumbered: '记录',
  noTimeline: '还没有时间线记录',
  evidenceLabel: '证据',
  feedbackLabel: '客户反馈',
  recognitionLabel: '认可范围',

  // Gap rules (keyed by the stable rule ids the Host sends)
  'gap.G0-why-customer.title': 'G0 缺「客户为什么测」',
  'gap.G0-why-customer.copy': '立项最低门槛未满足：没有写清客户的真实痛点。',
  'gap.G0-why-we.title': 'G0 缺「我们为什么测」',
  'gap.G0-why-we.copy': '立项最低门槛未满足：没有写清我们的商业目的。',
  'gap.G0-tech-owner.title': 'G0 缺「客户技术责任人」',
  'gap.G0-tech-owner.copy': '立项最低门槛未满足：客户侧没有明确对接人。',
  'gap.G1-focus-overflow.title': 'G1 聚焦超限',
  'gap.G1-focus-overflow.copy': '指标要求 2–3 个、场景 3–5 个、风险上限 3 个；当前指标 {indicators}、场景 {scenarios}、风险 {risks}。',
  'gap.G2-prereq-invested.title': '前置未就绪已投人力',
  'gap.G2-prereq-invested.copy': '前置条件未就绪却已投入人力，投入可能打水漂。',
  'gap.G3-result-no-evidence.title': '有结果无证据',
  'gap.G3-result-no-evidence.copy': '写了达成情况，但没有任何可点开的凭据。',
  'gap.G3-evidence-no-recognition.title': '有证据无认可',
  'gap.G3-evidence-no-recognition.copy': '证据齐了，但客户没有书面认可，只是我们觉得好。',
  'gap.action-overdue.title': '下一步动作超期',
  'gap.action-overdue.copy': '下一步动作目标已 {days} 没有推进（阈值 {staleDays} 天）。',
  'gap.G4-no-next-milestone.title': '做成了但没有下一步',
  'gap.G4-no-next-milestone.copy': '结果已达成却没有下一个里程碑：价值做出来了，但没有转化路径。',
  'gap.closed-not-closed-loop.title': '已关闭但四维未闭环',
  'gap.closed-not-closed-loop.copy': '阶段已关闭，但四维结果仍有空缺：{missing}。',

  // Errors the Host can report
  'error.network': '无法连接 github.com，请检查网络。',
  'error.not-found': '仓库不存在，或当前账号看不到它。',
  'error.timeout': '拉取超时，请稍后重试。',
  'error.git-missing': '本机找不到 git 命令。',
  'error.busy': '已有一次刷新正在进行，请稍后再试。',
  'error.no-projects': '仓库里没有 projects/ 目录。',
  'error.cache-not-owned': '缓存目录已存在且不是本插件创建的，已拒绝清空。',
  'error.unknown-project': '项目不存在。',
  'error.internal': 'Host 内部错误，请查看 DSH 日志。',
  'error.failed': '操作失败。',




  // Submit errors the Host can report
  // Milestone 3: export form
  exportNav: '导出表单',
  exportTitle: '导出给组员填写的表单',
  exportSubtitle: '勾选项目，生成一个自包含 HTML 文件：双击即可填写，自动保存，实时校验，填完下载 YAML。',
  exportSelectAll: '全选',
  exportSelectNone: '清空',
  exportSelected: '已选 {count} 个项目',
  exportBlank: '只导出空白表单（新建项目用）',
  exportBlankHint: '不勾选任何项目时，会生成一个空白的「新建项目」表单。',
  exportGenerate: '生成并下载',
  exportGenerating: '正在生成…',
  exportDone: '已下载 {name}',
  exportSize: '{kb} KB',
  exportHint: '表单完全离线可用：没有 CDN、没有外部字体、没有服务器。填完导出的 .yaml 可以直接拖进本插件的导入页。',
  exportNoProjects: '先点【刷新】拉到数据，才能导出已有项目的表单。',
  exportFailed: '生成表单失败',

  // Milestone 3: risk board
  risksNav: '风险看板',
  risksBoardTitle: '风险看板',
  risksSubtitle: '所有项目的风险，按等级从高到低排。',
  riskHigh: '高',
  riskMedium: '中',
  riskLow: '低',
  riskUnset: '未评级',
  riskNoRisks: '没有任何项目登记风险——这本身值得怀疑。',
  riskCounts: '高 {high} · 中 {medium} · 低 {low} · 未评级 {unset}',
  riskProjects: '{withRisks} / {total} 个项目有风险登记',
  riskUnsetHint: '「未评级」不是「不严重」，而是还没判断；排序时放在最后。',
  riskGapContext: '同项目还有 {count} 处缺口（{high} 处高危）',

  // Milestone 3: global timeline
  timelineNav: '时间线',
  timelineTitle: '全局时间线',
  timelineSubtitle: '所有项目的复盘记录，按日期从新到旧。',
  timelineRange: '{from} 至 {to}',
  timelineCount: '{count} 条记录',
  timelineEmpty: '还没有任何复盘记录。',
  timelineSilent: '{count} 个项目完全没有时间线记录',
  timelineSilentHint: '没有时间线，就说不清这些项目到底推进过没有。',
  timelineMonth: '{month}：{count} 条',
  timelineNoEvidence: '无证据',
  timelineNoFeedback: '无客户反馈',
  timelineActual: '实际结果',
  timelineRoundShort: '第 {round} 轮',

}

/** English dictionary; every key mirrors {@link zh}. */
export const en: Record<string, string> = {
  nav: 'Work Dashboard',
  title: 'Work Dashboard',
  subtitle: 'A multi-module operations dashboard: see what is actually moving before deciding what to fix next.',
  dataSource: 'Data source',
  eyebrow: 'Work Dashboard · read-only',
  modulePoc: 'POC Operations',
  modulePocHint: 'Stage, four dimensions and gaps',
  moduleMore: 'More modules to come',

  refresh: 'Refresh',
  refreshing: 'Pulling…',
  refreshingHint: 'The first pull takes a few seconds',
  refreshSettings: 'Refresh settings',
  refreshedAt: 'Refreshed {time}',
  neverRefreshed: 'Not pulled yet',
  autoRefresh: 'Auto refresh',
  intervalOff: 'Off (manual only)',
  interval10m: 'Every 10 minutes',
  interval1h: 'Every hour',
  intervalCustom: 'Custom',
  customMinutes: 'minutes',
  save: 'Save',
  cancel: 'Cancel',
  customMinutesError: 'Enter a whole number of minutes between {min} and {max}',
  autoRefreshOn: 'Auto refresh: every {minutes} min (only while this page is open)',
  autoRefreshOff: 'Auto refresh: off',
  autoRefreshFailed: 'Scheduled refresh failed; retrying next cycle',

  emptyTitle: 'No data yet',
  emptyCopy: 'Hit Refresh to pull the POC ledger from GitHub',
  emptyRefresh: 'Refresh now',
  emptyPath: 'Cache location',
  failureTitle: 'Pull failed',
  failureReason: 'Reason',
  failureRetry: 'Retry',
  failureHint: 'Check the network and gh login, then retry.',
  loading: 'Loading…',
  loadingDetail: 'Reading the project…',

  statActive: 'Active',
  statG0: 'Missing G0',
  statRisk: 'At risk',
  statConvertible: 'Convertible',
  statTotal: 'Total',
  statClosed: 'Closed',

  tableTitle: 'Projects',
  colProject: 'Project',
  colStage: 'Stage',
  colDimensions: 'Four dimensions',
  colGaps: 'Gaps',
  colAction: 'Action',
  detail: 'Detail',
  openDetail: 'Open detail',
  noProjects: 'The repository has no projects yet',
  warningsTitle: 'Parse notes',

  dimAchievement: 'Goal met',
  dimEvidence: 'Evidence',
  dimRecognition: 'Recognition',
  dimNextMilestone: 'Next step',
  dimPresent: 'Present',
  dimMissing: 'Missing',
  dimensionCount: '{count}/4',

  stageTrack: 'Stage track',
  stageG0: 'G0 Intake',
  stageG1: 'G1 Design',
  stageG2: 'G2 Validation',
  stageG3: 'G3 Results',
  stageG4: 'G4 Conversion',
  stageClosed: 'Closed',
  stageDone: 'Done',
  stageCurrent: 'Current',
  stagePending: 'Not started',
  stageUnknown: 'Unrecognized stage',

  pendingTitle: 'Pending',
  pendingEmpty: 'No gaps found. Keep it up.',
  pendingCount: '{count} items',
  gapPriority: 'Priority {value}',

  back: '← Back',
  detailIdentity: '{pocId} · {stage} · {tier}',
  detailMissing: 'Project not found',
  detailMissingCopy: 'No project with poc_id {pocId} exists in the repository; it may have been removed. Refresh and retry.',
  sectionFourDim: 'Four dimensions',
  sectionG0: 'G0 intake prerequisites',
  sectionGates: 'Stage records',
  sectionScope: 'Indicators / scenarios / risks',
  sectionResult: 'Result and next step',
  sectionTimeline: 'Timeline',
  sectionGaps: 'Gaps in this project',
  whyCustomerTest: 'Why the customer tests',
  whyWeTest: 'Why we test',
  nextActionGoal: 'Next action goal',
  customerTechOwner: 'Customer tech owner',
  owner: 'Our owner',
  salesInitiator: 'Sales initiator',
  type: 'Project type',
  tier: 'Tier',
  gateDate: 'Completed',
  gateCounts: 'Indicators {indicators} · Scenarios {scenarios} · Risks {risks}',
  gatePrereq: 'Prerequisites ready {ready}',
  gateEngineers: 'Engineers invested {invested}',
  yes: 'yes',
  no: 'no',
  criteriaTitle: 'Success criteria',
  scenariosTitle: 'Validation scenarios',
  risksTitle: 'Risks',
  criteriaCount: '{count}',
  scenariosCount: '{count}',
  risksCount: '{count}',
  criteriaLimitHint: '2–3 required',
  scenariosLimitHint: '3–5 required',
  risksLimitHint: 'At most 3',
  emptyField: '(empty)',
  riskLevel: 'Level',
  riskMitigation: 'Mitigation',
  round: 'Round {round}',
  roundUnnumbered: 'Entry',
  noTimeline: 'No timeline entries yet',
  evidenceLabel: 'Evidence',
  feedbackLabel: 'Customer feedback',
  recognitionLabel: 'Recognition scope',

  'gap.G0-why-customer.title': 'G0 missing "why the customer tests"',
  'gap.G0-why-customer.copy': 'Below the intake floor: the customer pain point is not written down.',
  'gap.G0-why-we.title': 'G0 missing "why we test"',
  'gap.G0-why-we.copy': 'Below the intake floor: our commercial purpose is not written down.',
  'gap.G0-tech-owner.title': 'G0 missing "customer tech owner"',
  'gap.G0-tech-owner.copy': 'Below the intake floor: no named counterpart on the customer side.',
  'gap.G1-focus-overflow.title': 'G1 focus overflow',
  'gap.G1-focus-overflow.copy': 'Indicators must be 2–3, scenarios 3–5, risks at most 3; currently {indicators} / {scenarios} / {risks}.',
  'gap.G2-prereq-invested.title': 'Engineers invested before prerequisites',
  'gap.G2-prereq-invested.copy': 'People are already committed while the prerequisites are not ready, so the effort may be wasted.',
  'gap.G3-result-no-evidence.title': 'Result without evidence',
  'gap.G3-result-no-evidence.copy': 'An achievement is claimed but nothing openable backs it.',
  'gap.G3-evidence-no-recognition.title': 'Evidence without recognition',
  'gap.G3-evidence-no-recognition.copy': 'Evidence exists, but the customer never confirmed it in writing — only we think it worked.',
  'gap.action-overdue.title': 'Next action is overdue',
  'gap.action-overdue.copy': 'No progress for {days} on the next action goal (threshold {staleDays} days).',
  'gap.G4-no-next-milestone.title': 'It worked, but nothing follows',
  'gap.G4-no-next-milestone.copy': 'The result is achieved with no next milestone: value was created but no path to conversion.',
  'gap.closed-not-closed-loop.title': 'Closed while the loop is open',
  'gap.closed-not-closed-loop.copy': 'The stage is closed but the four dimensions still have holes: {missing}.',
  'error.gh-unauthenticated': 'gh is not logged in, or the logged-in account cannot read this private repository.',
  'error.auth': 'GitHub rejected the credential; run gh auth login for an account with access.',
  'error.network': 'Cannot reach github.com; check the network.',
  'error.not-found': 'The repository does not exist, or this account cannot see it.',
  'error.timeout': 'The pull timed out; try again shortly.',
  'error.git-missing': 'The git command is not available on this machine.',
  'error.busy': 'A refresh is already running; try again in a moment.',
  'error.no-projects': 'The repository has no projects/ directory.',
  'error.cache-not-owned': 'The cache directory exists and was not created by this plugin; refusing to clear it.',
  'error.unknown-project': 'Project not found.',
  'error.internal': 'Internal Host error; check the DSH log.',
  'error.failed': 'The operation failed.',
  'error.not-yaml': 'Only .yaml or .yml files are accepted.',
  'error.read-failed': 'This file could not be read; try again.',
  'error.submitFailed': 'Submission failed',




  // Submit errors the Host can report
  'error.invalid-document': 'The document did not pass validation; nothing was submitted.',
  'error.no-changes': 'This file does not differ from the stored record; nothing to submit.',
  'error.bad-branch': 'The branch name was rejected; nothing was pushed.',
  'error.pr-failed': 'gh could not create the pull request.',
  'error.pr-exists': 'A pull request already exists for that branch.',
  'error.poc-id-exists': 'That project id already exists.',
  'error.command-missing': 'git or gh is not available on this machine.',
  'error.submit-failed': 'Submission failed.',
  // Milestone 3: export form
  exportNav: 'Export form',
  exportTitle: 'Export a form for a colleague',
  exportSubtitle: 'Pick projects and generate one self-contained HTML file: open it, fill it in, auto-saved, live-validated, then download the YAML.',
  exportSelectAll: 'Select all',
  exportSelectNone: 'Clear',
  exportSelected: '{count} project(s) selected',
  exportBlank: 'Export a blank form only (for a new project)',
  exportBlankHint: 'With nothing selected, a blank "new project" form is generated.',
  exportGenerate: 'Generate and download',
  exportGenerating: 'Generating…',
  exportDone: 'Downloaded {name}',
  exportSize: '{kb} KB',
  exportHint: 'The form works fully offline: no CDN, no external fonts, no server. The .yaml it produces can be dropped straight into this plugin\'s import page.',
  exportNoProjects: 'Refresh first to pull the ledger before exporting an existing project.',
  exportFailed: 'Could not generate the form',

  // Milestone 3: risk board
  risksNav: 'Risk board',
  risksBoardTitle: 'Risk board',
  risksSubtitle: 'Every project\'s risks, highest severity first.',
  riskHigh: 'High',
  riskMedium: 'Medium',
  riskLow: 'Low',
  riskUnset: 'Unrated',
  riskNoRisks: 'No project registered a risk — which is itself worth questioning.',
  riskCounts: 'High {high} · Medium {medium} · Low {low} · Unrated {unset}',
  riskProjects: '{withRisks} / {total} project(s) have risks on record',
  riskUnsetHint: '"Unrated" is not "harmless": it means nobody judged it yet, so it sorts last.',
  riskGapContext: '{count} gap(s) in the same project ({high} high)',

  // Milestone 3: global timeline
  timelineNav: 'Timeline',
  timelineTitle: 'Global timeline',
  timelineSubtitle: 'Every review round of every project, newest first.',
  timelineRange: '{from} to {to}',
  timelineCount: '{count} entries',
  timelineEmpty: 'No review rounds recorded yet.',
  timelineSilent: '{count} project(s) have no timeline at all',
  timelineSilentHint: 'Without a timeline there is no way to tell whether those projects moved.',
  timelineMonth: '{month}: {count}',
  timelineNoEvidence: 'No evidence',
  timelineNoFeedback: 'No customer feedback',
  timelineActual: 'Actual result',
  timelineRoundShort: 'Round {round}',

}

/** Read one key from a dictionary, falling back to the key itself. */
export function textOf(dict: Record<string, string>, key: string): string {
  return dict[key] ?? key
}

/** Pick the dictionary for a locale id, falling back to English. */
export function dictFor(locale: string): Record<string, string> {
  return locale.toLowerCase().startsWith('zh') ? zh : en
}

/** The translate function the locale service binds for one namespace. */
export type Translate = (key: string, params?: Record<string, string | number>) => string

/**
 * Fill `{name}` placeholders from a parameter bag.
 *
 * The Client-side locale service interpolates the same way, but this helper is
 * also used for dictionary lookups that bypass the service (the initial paint
 * before the service's snapshot is available), and for the tests.
 */
export function format(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (whole, key: string) => (key in params ? String(params[key]) : whole))
}
