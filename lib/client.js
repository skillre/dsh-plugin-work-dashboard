window.__ModuleLoader__.load({
	id: "@skillre/dsh-plugin-work-dashboard",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		"use strict";
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __export = (target, all) => {
		  for (var name in all)
		    __defProp(target, name, { get: all[name], enumerable: true });
		};
		var __copyProps = (to, from, except, desc) => {
		  if (from && typeof from === "object" || typeof from === "function") {
		    for (let key of __getOwnPropNames(from))
		      if (!__hasOwnProp.call(to, key) && key !== except)
		        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
		  }
		  return to;
		};
		var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

		// src/client/index.tsx
		var index_exports = {};
		__export(index_exports, {
		  apply: () => apply,
		  inject: () => inject
		});
		module.exports = __toCommonJS(index_exports);

		// src/types.ts
		var ENDPOINT = "skillre-work-dashboard/execute";
		var PANEL_ID = "skillre-work-dashboard";
		var REFRESH_INTERVAL_KEY = "work-dashboard.refreshInterval";
		var CUSTOM_MINUTES_KEY = "work-dashboard.customMinutes";
		var REFRESH_INTERVALS = Object.freeze(["off", "10m", "1h", "custom"]);
		var DEFAULT_CUSTOM_MINUTES = 30;
		var CUSTOM_MINUTES_MIN = 1;
		var CUSTOM_MINUTES_MAX = 1440;
		var STAGES = Object.freeze(["G0", "G1", "G2", "G3", "G4"]);
		var DIMENSIONS = Object.freeze(["achievement", "evidence", "recognition", "nextMilestone"]);
		var VIEW_MODES = Object.freeze(["cards", "board", "table"]);
		var SORT_KEYS = Object.freeze(["attention", "amount", "progress", "stage"]);
		var VIEW_MODE_KEY = "work-dashboard.viewMode";
		var SORT_KEY_KEY = "work-dashboard.sortKey";
		var GAP_RULES = Object.freeze([
		  "R1-gate0-missing",
		  "R2-large-amount-no-g0",
		  "R3-g0-passed-no-plan",
		  "R4-criteria-count",
		  "R5-scenarios-count",
		  "R6-risks-overflow",
		  "R7-g2-not-ready",
		  "R8-progress-no-evidence",
		  "R9-evidence-no-recognition",
		  "R10-g3-1-without-g3-2",
		  "R11-no-next-milestone",
		  "R12-stage-stalled"
		]);

		// src/client/api.ts
		var ActionError = class extends Error {
		  constructor(code, message, details = {}) {
		    super(message);
		    this.code = code;
		    this.details = details;
		    this.name = "ActionError";
		  }
		};
		function unwrap(result) {
		  if (result === null || typeof result !== "object" || !("ok" in result)) {
		    throw new ActionError("invalid-response", "The Host returned an invalid work dashboard response.");
		  }
		  if (!result.ok) throw new ActionError(result.error.code, result.error.message, result.error.details);
		  return result.value;
		}
		function createApi(connection, lifetime) {
		  const call = async (request, signal) => {
		    const signalToUse = signal === void 0 ? lifetime : AbortSignal.any([lifetime, signal]);
		    return unwrap(await connection.rpc.call("/api", ENDPOINT, request, signalToUse));
		  };
		  return {
		    list: (signal) => call({ action: "list" }, signal),
		    refresh: (signal) => call({ action: "refresh" }, signal),
		    detail: (pocId, signal) => call({ action: "detail", pocId }, signal),
		    risks: (signal) => call({ action: "risks" }, signal),
		    timeline: (signal) => call({ action: "timeline" }, signal)
		  };
		}

		// src/client/text.ts
		var NAMESPACE = "skillreWorkDashboard";
		var zh = {
		  nav: "\u5DE5\u4F5C\u770B\u677F",
		  title: "\u5DE5\u4F5C\u770B\u677F",
		  subtitle: "\u591A\u6A21\u5757\u8FD0\u8425\u770B\u677F\uFF1A\u5148\u628A\u6B63\u5728\u63A8\u8FDB\u7684\u4E8B\u60C5\u770B\u6E05\u695A\uFF0C\u518D\u51B3\u5B9A\u4E0B\u4E00\u6B65\u8865\u4EC0\u4E48\u3002",
		  dataSource: "\u6570\u636E\u6E90",
		  eyebrow: "\u5DE5\u4F5C\u770B\u677F \xB7 \u53EA\u8BFB",
		  modulePoc: "POC \u8FD0\u8425",
		  modulePocHint: "\u9879\u76EE\u9636\u6BB5\u3001\u56DB\u7EF4\u7ED3\u679C\u4E0E\u7F3A\u53E3\u6E05\u5355",
		  moduleMore: "\u66F4\u591A\u6A21\u5757\u9646\u7EED\u52A0\u5165",
		  // Toolbar / refresh
		  refresh: "\u5237\u65B0",
		  refreshing: "\u6B63\u5728\u62C9\u53D6\u2026",
		  refreshingHint: "\u9996\u6B21\u62C9\u53D6\u9700\u8981\u51E0\u79D2",
		  refreshSettings: "\u5237\u65B0\u8BBE\u7F6E",
		  refreshedAt: "\u5DF2\u5237\u65B0 {time}",
		  neverRefreshed: "\u5C1A\u672A\u62C9\u53D6",
		  autoRefresh: "\u81EA\u52A8\u5237\u65B0",
		  intervalOff: "\u5173\u95ED\uFF08\u4EC5\u624B\u52A8\uFF09",
		  interval10m: "\u6BCF 10 \u5206\u949F",
		  interval1h: "\u6BCF 1 \u5C0F\u65F6",
		  intervalCustom: "\u81EA\u5B9A\u4E49",
		  customMinutes: "\u5206\u949F",
		  save: "\u4FDD\u5B58",
		  cancel: "\u53D6\u6D88",
		  customMinutesError: "\u8BF7\u8F93\u5165 {min}\u2013{max} \u4E4B\u95F4\u7684\u6574\u6570\u5206\u949F\u6570",
		  autoRefreshOn: "\u81EA\u52A8\u5237\u65B0\uFF1A\u6BCF {minutes} \u5206\u949F\uFF08\u4EC5\u672C\u9875\u6253\u5F00\u65F6\u751F\u6548\uFF09",
		  autoRefreshOff: "\u81EA\u52A8\u5237\u65B0\uFF1A\u5173\u95ED",
		  autoRefreshFailed: "\u5B9A\u65F6\u5237\u65B0\u5931\u8D25\uFF0C\u5C06\u5728\u4E0B\u4E00\u5468\u671F\u91CD\u8BD5",
		  // Empty / error states
		  emptyTitle: "\u8FD8\u6CA1\u6709\u6570\u636E",
		  emptyCopy: "\u70B9\u3010\u5237\u65B0\u3011\u4ECE GitHub \u62C9\u53D6 POC \u53F0\u8D26",
		  emptyRefresh: "\u7ACB\u5373\u5237\u65B0",
		  emptyPath: "\u7F13\u5B58\u4F4D\u7F6E",
		  failureTitle: "\u62C9\u53D6\u5931\u8D25",
		  failureReason: "\u539F\u56E0",
		  failureRetry: "\u91CD\u8BD5",
		  failureHint: "\u68C0\u67E5\u7F51\u7EDC\u4E0E gh \u767B\u5F55\u72B6\u6001\u540E\u91CD\u8BD5\u3002",
		  loading: "\u52A0\u8F7D\u4E2D\u2026",
		  loadingDetail: "\u6B63\u5728\u8BFB\u53D6\u9879\u76EE\u2026",
		  // Stats
		  statActive: "\u8FDB\u884C\u4E2D",
		  statG0: "\u5F85\u8865 G0",
		  statRisk: "\u6709\u98CE\u9669",
		  statConvertible: "\u53EF\u8F6C\u5316",
		  statTotal: "\u9879\u76EE\u603B\u6570",
		  statClosed: "\u5DF2\u5173\u95ED",
		  // Table
		  tableTitle: "\u9879\u76EE\u603B\u89C8",
		  colProject: "\u9879\u76EE",
		  colStage: "\u9636\u6BB5",
		  colDimensions: "\u56DB\u7EF4\u72B6\u6001",
		  colGaps: "\u7F3A\u53E3",
		  colAction: "\u64CD\u4F5C",
		  detail: "\u8BE6\u60C5",
		  openDetail: "\u67E5\u770B\u8BE6\u60C5",
		  noProjects: "\u4ED3\u5E93\u91CC\u8FD8\u6CA1\u6709\u9879\u76EE",
		  warningsTitle: "\u89E3\u6790\u63D0\u793A",
		  // Dimensions
		  dimAchievement: "\u76EE\u6807\u8FBE\u6210",
		  dimEvidence: "\u8BC1\u636E",
		  dimRecognition: "\u5BA2\u6237\u8BA4\u53EF",
		  dimNextMilestone: "\u4E0B\u4E00\u6B65",
		  dimPresent: "\u5DF2\u6709",
		  dimMissing: "\u7F3A",
		  dimensionCount: "{count}/4",
		  // Stage rail
		  stageTrack: "\u9636\u6BB5\u8F68\u9053",
		  stageG0: "G0 \u7ACB\u9879",
		  stageG1: "G1 \u65B9\u6848\u8BBE\u8BA1",
		  stageG2: "G2 \u65B9\u6848\u9A8C\u8BC1",
		  stageG3: "G3 \u7ED3\u679C\u9A8C\u8BC1",
		  stageG4: "G4 \u7ED3\u679C\u8F6C\u5316",
		  stageClosed: "\u5DF2\u5173\u95ED",
		  stageDone: "\u5DF2\u5B8C\u6210",
		  stageCurrent: "\u5F53\u524D",
		  stagePending: "\u672A\u5F00\u59CB",
		  stageUnknown: "\u9636\u6BB5\u672A\u8BC6\u522B",
		  // Pending list
		  pendingTitle: "\u5F85\u5904\u7406",
		  pendingEmpty: "\u6CA1\u6709\u626B\u51FA\u7F3A\u53E3\uFF0C\u7EE7\u7EED\u4FDD\u6301\u3002",
		  pendingCount: "{count} \u9879",
		  gapPriority: "\u4F18\u5148\u7EA7 {value}",
		  // Detail page
		  back: "\u2190 \u8FD4\u56DE",
		  detailIdentity: "{pocId} \xB7 {stage} \xB7 {org}",
		  detailMissing: "\u9879\u76EE\u4E0D\u5B58\u5728",
		  detailMissingCopy: "\u4ED3\u5E93\u91CC\u6CA1\u6709 poc_id \u4E3A {pocId} \u7684\u9879\u76EE\uFF0C\u53EF\u80FD\u5DF2\u88AB\u79FB\u9664\u3002\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5\u3002",
		  sectionFourDim: "\u56DB\u7EF4\u7ED3\u679C",
		  sectionG0: "G0 \u7ACB\u9879\u4E09\u5FC5\u586B",
		  sectionGates: "\u9636\u6BB5\u8BB0\u5F55",
		  sectionScope: "\u6307\u6807 / \u573A\u666F / \u98CE\u9669",
		  sectionResult: "\u7ED3\u679C\u4E0E\u4E0B\u4E00\u6B65",
		  sectionTimeline: "\u65F6\u95F4\u7EBF",
		  sectionGaps: "\u672C\u9879\u76EE\u7F3A\u53E3",
		  whyCustomerTest: "\u5BA2\u6237\u4E3A\u4EC0\u4E48\u6D4B",
		  whyWeTest: "\u6211\u4EEC\u4E3A\u4EC0\u4E48\u6D4B",
		  nextActionGoal: "\u4E0B\u4E00\u6B65\u52A8\u4F5C\u76EE\u6807",
		  customerTechOwner: "\u5BA2\u6237\u6280\u672F\u8D23\u4EFB\u4EBA",
		  owner: "\u6211\u65B9\u8D1F\u8D23\u4EBA",
		  salesInitiator: "\u53D1\u8D77\u9500\u552E",
		  type: "\u9879\u76EE\u7C7B\u578B",
		  tier: "\u9879\u76EE\u7EA7\u522B",
		  gateDate: "\u5B8C\u6210\u65E5\u671F",
		  gateCounts: "\u6307\u6807 {indicators} \xB7 \u573A\u666F {scenarios} \xB7 \u98CE\u9669 {risks}",
		  gatePrereq: "\u524D\u7F6E\u5C31\u7EEA {ready}",
		  gateEngineers: "\u5DF2\u6295\u4EBA\u529B {invested}",
		  yes: "\u662F",
		  no: "\u5426",
		  criteriaTitle: "\u6210\u529F\u6307\u6807",
		  scenariosTitle: "\u9A8C\u8BC1\u573A\u666F",
		  risksTitle: "\u98CE\u9669",
		  criteriaCount: "{count} \u4E2A",
		  scenariosCount: "{count} \u4E2A",
		  risksCount: "{count} \u4E2A",
		  criteriaLimitHint: "\u8981\u6C42 2\u20133 \u4E2A",
		  scenariosLimitHint: "\u8981\u6C42 3\u20135 \u4E2A",
		  risksLimitHint: "\u4E0A\u9650 3 \u4E2A",
		  emptyField: "\uFF08\u7A7A\uFF09",
		  riskLevel: "\u7B49\u7EA7",
		  riskMitigation: "\u5E94\u5BF9",
		  round: "\u7B2C {round} \u8F6E",
		  roundUnnumbered: "\u8BB0\u5F55",
		  noTimeline: "\u8FD8\u6CA1\u6709\u65F6\u95F4\u7EBF\u8BB0\u5F55",
		  evidenceLabel: "\u8BC1\u636E",
		  feedbackLabel: "\u5BA2\u6237\u53CD\u9988",
		  recognitionLabel: "\u8BA4\u53EF\u8303\u56F4",
		  // Gap rules (keyed by the stable rule ids the Host sends)
		  // Errors the Host can report
		  "error.network": "\u65E0\u6CD5\u8FDE\u63A5 github.com\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u3002",
		  "error.not-found": "\u4ED3\u5E93\u4E0D\u5B58\u5728\uFF0C\u6216\u5F53\u524D\u8D26\u53F7\u770B\u4E0D\u5230\u5B83\u3002",
		  "error.timeout": "\u62C9\u53D6\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",
		  "error.git-missing": "\u672C\u673A\u627E\u4E0D\u5230 git \u547D\u4EE4\u3002",
		  "error.busy": "\u5DF2\u6709\u4E00\u6B21\u5237\u65B0\u6B63\u5728\u8FDB\u884C\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
		  "error.no-projects": "\u4ED3\u5E93\u91CC\u6CA1\u6709 projects/ \u76EE\u5F55\u3002",
		  "error.cache-not-owned": "\u7F13\u5B58\u76EE\u5F55\u5DF2\u5B58\u5728\u4E14\u4E0D\u662F\u672C\u63D2\u4EF6\u521B\u5EFA\u7684\uFF0C\u5DF2\u62D2\u7EDD\u6E05\u7A7A\u3002",
		  "error.unknown-project": "\u9879\u76EE\u4E0D\u5B58\u5728\u3002",
		  "error.internal": "Host \u5185\u90E8\u9519\u8BEF\uFF0C\u8BF7\u67E5\u770B DSH \u65E5\u5FD7\u3002",
		  "error.failed": "\u64CD\u4F5C\u5931\u8D25\u3002",
		  // Submit errors the Host can report
		  // Milestone 3: export form
		  exportNav: "\u5BFC\u51FA\u8868\u5355",
		  exportTitle: "\u5BFC\u51FA\u7ED9\u7EC4\u5458\u586B\u5199\u7684\u8868\u5355",
		  exportSubtitle: "\u52FE\u9009\u9879\u76EE\uFF0C\u751F\u6210\u4E00\u4E2A\u81EA\u5305\u542B HTML \u6587\u4EF6\uFF1A\u53CC\u51FB\u5373\u53EF\u586B\u5199\uFF0C\u81EA\u52A8\u4FDD\u5B58\uFF0C\u5B9E\u65F6\u6821\u9A8C\uFF0C\u586B\u5B8C\u4E0B\u8F7D YAML\u3002",
		  exportSelectAll: "\u5168\u9009",
		  exportSelectNone: "\u6E05\u7A7A",
		  exportSelected: "\u5DF2\u9009 {count} \u4E2A\u9879\u76EE",
		  exportBlank: "\u53EA\u5BFC\u51FA\u7A7A\u767D\u8868\u5355\uFF08\u65B0\u5EFA\u9879\u76EE\u7528\uFF09",
		  exportBlankHint: "\u4E0D\u52FE\u9009\u4EFB\u4F55\u9879\u76EE\u65F6\uFF0C\u4F1A\u751F\u6210\u4E00\u4E2A\u7A7A\u767D\u7684\u300C\u65B0\u5EFA\u9879\u76EE\u300D\u8868\u5355\u3002",
		  exportGenerate: "\u751F\u6210\u5E76\u4E0B\u8F7D",
		  exportGenerating: "\u6B63\u5728\u751F\u6210\u2026",
		  exportDone: "\u5DF2\u4E0B\u8F7D {name}",
		  exportSize: "{kb} KB",
		  exportHint: "\u8868\u5355\u5B8C\u5168\u79BB\u7EBF\u53EF\u7528\uFF1A\u6CA1\u6709 CDN\u3001\u6CA1\u6709\u5916\u90E8\u5B57\u4F53\u3001\u6CA1\u6709\u670D\u52A1\u5668\u3002\u586B\u5B8C\u5BFC\u51FA\u7684 .yaml \u53EF\u4EE5\u76F4\u63A5\u62D6\u8FDB\u672C\u63D2\u4EF6\u7684\u5BFC\u5165\u9875\u3002",
		  exportNoProjects: "\u5148\u70B9\u3010\u5237\u65B0\u3011\u62C9\u5230\u6570\u636E\uFF0C\u624D\u80FD\u5BFC\u51FA\u5DF2\u6709\u9879\u76EE\u7684\u8868\u5355\u3002",
		  exportFailed: "\u751F\u6210\u8868\u5355\u5931\u8D25",
		  // Milestone 3: risk board
		  risksNav: "\u98CE\u9669\u770B\u677F",
		  risksBoardTitle: "\u98CE\u9669\u770B\u677F",
		  risksSubtitle: "\u6240\u6709\u9879\u76EE\u7684\u98CE\u9669\uFF0C\u6309\u7B49\u7EA7\u4ECE\u9AD8\u5230\u4F4E\u6392\u3002",
		  riskHigh: "\u9AD8",
		  riskMedium: "\u4E2D",
		  riskLow: "\u4F4E",
		  riskUnset: "\u672A\u8BC4\u7EA7",
		  riskNoRisks: "\u6CA1\u6709\u4EFB\u4F55\u9879\u76EE\u767B\u8BB0\u98CE\u9669\u2014\u2014\u8FD9\u672C\u8EAB\u503C\u5F97\u6000\u7591\u3002",
		  riskCounts: "\u9AD8 {high} \xB7 \u4E2D {medium} \xB7 \u4F4E {low} \xB7 \u672A\u8BC4\u7EA7 {unset}",
		  riskProjects: "{withRisks} / {total} \u4E2A\u9879\u76EE\u6709\u98CE\u9669\u767B\u8BB0",
		  riskUnsetHint: "\u300C\u672A\u8BC4\u7EA7\u300D\u4E0D\u662F\u300C\u4E0D\u4E25\u91CD\u300D\uFF0C\u800C\u662F\u8FD8\u6CA1\u5224\u65AD\uFF1B\u6392\u5E8F\u65F6\u653E\u5728\u6700\u540E\u3002",
		  riskGapContext: "\u540C\u9879\u76EE\u8FD8\u6709 {count} \u5904\u7F3A\u53E3\uFF08{high} \u5904\u9AD8\u5371\uFF09",
		  // Milestone 3: global timeline
		  timelineNav: "\u65F6\u95F4\u7EBF",
		  timelineTitle: "\u5168\u5C40\u65F6\u95F4\u7EBF",
		  timelineSubtitle: "\u6240\u6709\u9879\u76EE\u7684\u590D\u76D8\u8BB0\u5F55\uFF0C\u6309\u65E5\u671F\u4ECE\u65B0\u5230\u65E7\u3002",
		  timelineRange: "{from} \u81F3 {to}",
		  timelineCount: "{count} \u6761\u8BB0\u5F55",
		  timelineEmpty: "\u8FD8\u6CA1\u6709\u4EFB\u4F55\u590D\u76D8\u8BB0\u5F55\u3002",
		  timelineSilent: "{count} \u4E2A\u9879\u76EE\u5B8C\u5168\u6CA1\u6709\u65F6\u95F4\u7EBF\u8BB0\u5F55",
		  timelineSilentHint: "\u6CA1\u6709\u65F6\u95F4\u7EBF\uFF0C\u5C31\u8BF4\u4E0D\u6E05\u8FD9\u4E9B\u9879\u76EE\u5230\u5E95\u63A8\u8FDB\u8FC7\u6CA1\u6709\u3002",
		  timelineMonth: "{month}\uFF1A{count} \u6761",
		  timelineNoEvidence: "\u65E0\u8BC1\u636E",
		  timelineNoFeedback: "\u65E0\u5BA2\u6237\u53CD\u9988",
		  timelineActual: "\u5B9E\u9645\u7ED3\u679C",
		  timelineRoundShort: "\u7B2C {round} \u8F6E",
		  statTotalProjects: "POC \u603B\u6570",
		  statTotalNote: "\u53F0\u8D26\u5185\u5168\u90E8\u9879\u76EE",
		  statG0Passed: "G0 \u901A\u8FC7",
		  statG0CompleteNote: "G0 \u5B8C\u6574",
		  statInProgress: "\u8FDB\u884C\u4E2D",
		  statStoppedNote: "\u6682\u505C/\u5173\u95ED/\u53D6\u6D88",
		  statAmount: "\u91D1\u989D\u5408\u8BA1",
		  statAmountUnit: "\u4E07\u5143",
		  colOrg: "\u4F53\u7CFB/\u516C\u53F8",
		  colAmount: "\u91D1\u989D",
		  colLatestProgress: "\u6700\u65B0\u8FDB\u5C55",
		  noProgressYet: "\u5C1A\u65E0\u8FDB\u5C55",
		  progressGoal: "\u76EE\u6807",
		  progressItems: "\u8303\u56F4",
		  progressActual: "\u5B9E\u9645",
		  progressSyncedWith: "\u540C\u6B65\u5BF9\u8C61",
		  progressNext: "\u4E0B\u4E00\u6B65",
		  progressDeadline: "\u622A\u6B62",
		  progressTypeUnset: "\u672A\u5206\u7C7B",
		  progressCount: "{count} \u6B21\u8FDB\u5C55",
		  sectionProgress: "\u8FDB\u5C55\u6D41",
		  progressEmptyTitle: "\u8FD8\u6CA1\u6709\u8FDB\u5C55\u8BB0\u5F55",
		  progressEmptyCopy: "\u7B2C\u4E00\u6B21\u8FDB\u5C55\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u5B8C\u6574\u65F6\u95F4\u7EBF\u3002",
		  sectionIdentity: "\u8EAB\u4EFD",
		  sectionPlan: "\u8BA1\u5212\uFF08G1/G2\uFF09",
		  sectionOutcome: "\u7ED3\u8BBA",
		  dimAuto: "\u81EA\u52A8\u63A8\u5BFC",
		  dimManual: "\u4EBA\u5DE5\u586B",
		  g0Complete: "G0 \u5B8C\u6574",
		  g0Missing: "\u7F3A {count} \u9879\u5FC5\u586B",
		  g0Conclusion: "G0 \u8BC4\u5BA1\u7ED3\u8BBA",
		  g0Reviewer: "G0 \u8BC4\u5BA1\u4EBA",
		  g0ReviewedAt: "\u8BC4\u5BA1\u65E5\u671F",
		  decisionChain: "\u9879\u76EE\u6D41\u7A0B/\u51B3\u7B56\u94FE",
		  postPocDecision: "\u6D4B\u540E\u5BA2\u6237\u51B3\u7B56",
		  competitor: "\u4E3B\u8981\u7ADE\u4E89\u5BF9\u624B",
		  customerPain: "\u5BA2\u6237\u6838\u5FC3\u75DB\u70B9",
		  expectedRecognition: "\u671F\u671B\u5BA2\u6237\u8BA4\u53EF",
		  ourEdge: "\u6211\u65B9\u4F18\u52BF/\u8D62\u70B9",
		  gate1Conclusion: "G1 \u7ED3\u8BBA",
		  gate2Ready: "G2 Ready \u72B6\u6001",
		  timelineWindow: "\u8BA1\u5212\u8D77\u6B62",
		  outcomeAchievement: "\u8FBE\u6210\u60C5\u51B5",
		  outcomeRecognition: "\u5BA2\u6237\u8BA4\u53EF",
		  outcomeOurProof: "\u6211\u65B9\u8BC1\u636E",
		  outcomeRemainingRisks: "\u5269\u4F59\u98CE\u9669",
		  outcomeProved: "\u8BC1\u660E\u4E86\u4EC0\u4E48",
		  outcomeRecognized: "\u5BA2\u6237\u8BA4\u53EF\u4E86\u4EC0\u4E48",
		  outcomeNextBusiness: "\u4E0B\u4E00\u6B65\u4E1A\u52A1\u52A8\u4F5C",
		  outcomeMilestone: "Next Milestone",
		  outcomeBusinessOwner: "\u91CC\u7A0B\u7891\u8D1F\u8D23\u4EBA",
		  outcomeBusinessDeadline: "\u91CC\u7A0B\u7891\u622A\u6B62",
		  outcomeBusinessStatus: "\u91CC\u7A0B\u7891\u72B6\u6001",
		  outcomeOverall: "POC \u603B\u4F53\u7ED3\u8BBA",
		  outcomeReviewedAt: "\u590D\u76D8\u65E5\u671F",
		  execSponsor: "\u5BA2\u6237\u4E1A\u52A1\u51B3\u7B56\u4EBA",
		  priority: "\u4F18\u5148\u7EA7",
		  stageSince: "\u8FDB\u5165\u5F53\u524D\u9636\u6BB5",
		  daysInStage: "\u5DF2\u505C\u7559 {days} \u5929",
		  completionLabel: "\u5B8C\u6210\u5EA6",
		  gate3_1Label: "G3-1",
		  gate3_2Label: "G3-2",
		  "gap.R1-gate0-missing.title": "G0 \u5FC5\u586B\u672A\u9F50",
		  "gap.R1-gate0-missing.copy": "G0 \u4E94\u5FC5\u586B\u7F3A {count} \u9879\uFF1A{missing}\u3002",
		  "gap.R2-large-amount-no-g0.title": "{amountWan} \u4E07\u9879\u76EE G0 \u672A\u901A\u8FC7",
		  "gap.R2-large-amount-no-g0.copy": "\u91D1\u989D\u8FBE\u5230 300 \u4E07\u4EE5\u4E0A\uFF0CG0 \u7ED3\u8BBA\u5374\u662F\u300C{conclusion}\u300D\uFF0C\u627F\u8BFA\u8D70\u5728\u5224\u65AD\u524D\u9762\u3002",
		  "gap.R3-g0-passed-no-plan.title": "G0 \u901A\u8FC7\u4F46\u65E0\u6210\u529F\u6807\u51C6",
		  "gap.R3-g0-passed-no-plan.copy": "\u8BC4\u5BA1\u5DF2\u901A\u8FC7\uFF0C\u5374\u6CA1\u6709\u5B9A\u4E49\u300C\u600E\u6837\u7B97\u6210\u529F\u300D\uFF0C\u540E\u9762\u65E0\u6CD5\u9A8C\u6536\u3002",
		  "gap.R4-criteria-count.title": "\u6210\u529F\u6307\u6807 {count} \u4E2A\uFF08\u8981\u6C42 {min}\u2013{max}\uFF09",
		  "gap.R4-criteria-count.copy": "\u6307\u6807 {count} \u4E2A\uFF0C\u4E0D\u5728 {min}\u2013{max} \u533A\u95F4\uFF1B\u6D4B\u5F97\u591A\u7B49\u4E8E\u6CA1\u91CD\u70B9\u3002",
		  "gap.R5-scenarios-count.title": "\u573A\u666F {count} \u4E2A\uFF08\u8981\u6C42 {min}\u2013{max}\uFF09",
		  "gap.R5-scenarios-count.copy": "\u573A\u666F {count} \u4E2A\uFF0C\u4E0D\u5728 {min}\u2013{max} \u533A\u95F4\uFF1B\u8303\u56F4\u5931\u63A7\u4F1A\u62D6\u957F\u5468\u671F\u3002",
		  "gap.R6-risks-overflow.title": "\u98CE\u9669 {count} \u4E2A\uFF08\u4E0A\u9650 {max}\uFF09",
		  "gap.R6-risks-overflow.copy": "\u5217\u51FA {count} \u4E2A\u98CE\u9669\uFF0C\u8D85\u8FC7\u4E0A\u9650 {max}\uFF1B\u98CE\u9669\u6E05\u5355\u8FC7\u957F\u7B49\u4E8E\u6CA1\u6709\u4F18\u5148\u7EA7\u3002",
		  "gap.R7-g2-not-ready.title": "G2 \u672A Ready \u4F46\u5DF2\u6709\u8FDB\u5C55",
		  "gap.R7-g2-not-ready.copy": "\u524D\u7F6E\u6761\u4EF6\u72B6\u6001\u662F\u300C{ready}\u300D\uFF0C\u5374\u5DF2\u7ECF\u5F00\u59CB\u4EA7\u751F\u8FDB\u5C55\uFF0C\u6295\u5165\u53EF\u80FD\u6253\u6C34\u6F02\u3002",
		  "gap.R8-progress-no-evidence.title": "\u6709\u8FDB\u5C55\u65E0\u8BC1\u636E",
		  "gap.R8-progress-no-evidence.copy": "\u7B2C {seq} \u6B21\u8FDB\u5C55\u5199\u4E86\u5B9E\u9645\u7ED3\u679C\uFF0C\u4F46\u6CA1\u6709\u4EFB\u4F55\u53EF\u70B9\u5F00\u7684\u51ED\u636E\u3002",
		  "gap.R9-evidence-no-recognition.title": "\u6709\u8BC1\u636E\u65E0\u5BA2\u6237\u8BA4\u53EF",
		  "gap.R9-evidence-no-recognition.copy": "\u8BC1\u636E\u9F50\u4E86\uFF0C\u5BA2\u6237\u8BA4\u53EF\u5EA6\u5374\u662F\u300C{recognition}\u300D\uFF0C\u53EA\u662F\u6211\u4EEC\u89C9\u5F97\u597D\u3002",
		  "gap.R10-g3-1-without-g3-2.title": "G3-1 \u53EF\u8BC1\u660E\u4F46 G3-2 \u672A\u786E\u8BA4",
		  "gap.R10-g3-1-without-g3-2.copy": "\u7ED3\u8BBA\u6807\u4E3A\u300C\u53EF\u8BC1\u660E\u300D\uFF0C\u4F46\u786E\u8BA4\u72B6\u6001\u662F\u300C{gate3_2}\u300D\uFF0C\u8FD8\u5DEE\u5BA2\u6237\u4E66\u9762\u786E\u8BA4\u3002",
		  "gap.R11-no-next-milestone.title": "\u5DF2\u8FBE\u6210\u4F46\u65E0\u4E0B\u4E00\u6B65\u91CC\u7A0B\u7891",
		  "gap.R11-no-next-milestone.copy": "\u7ED3\u679C\u5DF2\u8FBE\u6210\uFF0C\u5374\u6CA1\u6709\u4E0B\u4E00\u4E2A\u91CC\u7A0B\u7891\uFF1A\u4EF7\u503C\u505A\u51FA\u6765\u4E86\uFF0C\u6CA1\u6709\u8F6C\u5316\u8DEF\u5F84\u3002",
		  "gap.R12-stage-stalled.title": "\u5DF2\u5728 {stage} \u505C\u7559 {days} \u5929",
		  "gap.R12-stage-stalled.copy": "\u5F53\u524D\u9636\u6BB5\u5DF2\u505C\u7559 {days} \u5929\uFF08\u9608\u503C {stallDays} \u5929\uFF09\uFF0C\u6CA1\u6709\u4EFB\u4F55\u63A8\u8FDB\u3002",
		  // ---------- 0.3 · 组合面板 ----------
		  bandTitle: "\u7EC4\u5408\u89C6\u56FE",
		  bandNote: "{count} \u4E2A\u9879\u76EE \xB7 {amount} \u4E07\u5143",
		  bandStages: "\u9636\u6BB5\u5206\u5E03",
		  bandStagesNote: "\u6309\u5F53\u524D\u9636\u6BB5",
		  bandOrgs: "\u4F53\u7CFB / \u516C\u53F8",
		  bandOrgsNote: "\u6309\u91D1\u989D",
		  bandTypes: "\u9879\u76EE\u7C7B\u578B",
		  bandTypesNote: "\u6309\u6570\u91CF",
		  bandAmounts: "\u91D1\u989D\u96C6\u4E2D\u5EA6",
		  bandAmountsNote: "\u524D 5 \u540D",
		  bandDims: "\u56DB\u7EF4\u8986\u76D6",
		  bandDimsNote: "\u6709\u503C\u9879\u76EE\u5360\u6BD4",
		  bandGapRules: "\u7F3A\u53E3\u89C4\u5219\u547D\u4E2D",
		  bandGapRulesNote: "\u5171 {count} \u6761",
		  bandActivity: "\u8FDB\u5C55\u6D3B\u8DC3\u5EA6",
		  bandActivityNote: "\u6BCF\u6708\u8FDB\u5C55\u6761\u6570",
		  chartNoData: "\u6682\u65E0\u6570\u636E",
		  stageCountLabel: "{count} \u4E2A",
		  stageAmountLabel: "{amount} \u4E07",
		  stageHighLabel: "{count} \u4E2A\u6709\u9AD8\u5371\u7F3A\u53E3",
		  orgProjectLabel: "{count} \u4E2A",
		  orgAmountLabel: "{amount} \u4E07",
		  orgHighLabel: "{count} \u4E2A\u9AD8\u5371",
		  typeLegendNote: "{count} \u4E2A \xB7 {amount} \u4E07",
		  amountShareLabel: "{share}%",
		  amountConcentrationLabel: "\u6700\u5927\u5355\u9879\u76EE\u5360 {share}%",
		  amountMissingLabel: "{count} \u4E2A\u9879\u76EE\u672A\u586B\u91D1\u989D",
		  concentrationHigh: "\u9AD8\u5EA6\u96C6\u4E2D\uFF1A\u4E00\u4E2A\u9879\u76EE\u7684\u91D1\u989D\u8D85\u8FC7\u4E86\u603B\u989D\u7684\u4E09\u5206\u4E4B\u4E00\uFF0C\u98CE\u9669\u6CA1\u6709\u5206\u6563\u3002",
		  concentrationNormal: "\u5206\u5E03\u6B63\u5E38\uFF1A\u6CA1\u6709\u5355\u9879\u76EE\u8D85\u8FC7\u603B\u989D\u7684\u4E09\u5206\u4E4B\u4E00\u3002",
		  coveragePresent: "{present} / {total}",
		  coverageMissingNote: "{count} \u4E2A\u7F3A",
		  activityLastLabel: "\u6700\u8FD1\u8FDB\u5C55 {date}",
		  activityNoneLabel: "\u5168\u5E93\u8FD8\u6CA1\u6709\u4EFB\u4F55\u8FDB\u5C55\u8BB0\u5F55",
		  gapRuleFiresLabel: "{count} \u6B21",
		  gapRuleLegendHigh: "\u9AD8\u5371",
		  gapRuleLegendMedium: "\u63D0\u793A",
		  // ---------- 0.3 · 工具栏 ----------
		  viewLabel: "\u89C6\u56FE",
		  viewCards: "\u5361\u7247",
		  viewBoard: "\u770B\u677F",
		  viewTable: "\u8868\u683C",
		  viewCardsHint: "\u4E00\u5C4F\u770B\u6E05\u6BCF\u4E2A\u9879\u76EE\u7F3A\u4EC0\u4E48",
		  viewBoardHint: "\u6309\u9636\u6BB5\u5206\u5217\uFF0C\u770B\u6574\u4F53\u5806\u79EF",
		  viewTableHint: "\u7D27\u51D1\u5217\u8868\uFF0C\u9002\u5408\u9010\u884C\u5BF9\u6BD4",
		  searchLabel: "\u641C\u7D22",
		  searchPlaceholder: "\u9879\u76EE\u540D / \u7F16\u53F7 / \u8D1F\u8D23\u4EBA / \u516C\u53F8",
		  searchClear: "\u6E05\u9664\u641C\u7D22",
		  filterLabel: "\u7B5B\u9009",
		  filterAll: "\u5168\u90E8",
		  filterSystem: "\u4F53\u7CFB",
		  filterStage: "\u9636\u6BB5",
		  filterStatus: "\u72B6\u6001",
		  filterType: "\u7C7B\u578B",
		  filterClear: "\u6E05\u9664\u7B5B\u9009",
		  filterActiveNote: "{count} \u4E2A\u6761\u4EF6",
		  filterResult: "\u7B5B\u51FA {shown} / {total} \u4E2A\u9879\u76EE",
		  sortLabel: "\u6392\u5E8F",
		  sortAttention: "\u6309\u5F85\u5904\u7406",
		  sortAmount: "\u6309\u91D1\u989D",
		  sortProgress: "\u6309\u6700\u65B0\u8FDB\u5C55",
		  sortStage: "\u6309\u9636\u6BB5",
		  sortDirection: "\u5207\u6362\u5347/\u964D\u5E8F",
		  keyboardHint: "\u2191\u2193 \u9009\u62E9 \xB7 Enter \u6253\u5F00 \xB7 Esc \u8FD4\u56DE \xB7 / \u641C\u7D22",
		  filteredEmptyTitle: "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u9879\u76EE",
		  filteredEmptyCopy: "\u628A\u641C\u7D22\u8BCD\u6216\u7B5B\u9009\u6761\u4EF6\u653E\u5BBD\u4E00\u70B9\uFF0C\u6216\u8005\u70B9\u300C\u6E05\u9664\u7B5B\u9009\u300D\u3002",
		  filteredEmptyReset: "\u6E05\u9664\u7B5B\u9009",
		  // ---------- 0.3 · 卡片 / 看板 ----------
		  cardAmountLabel: "\u91D1\u989D",
		  cardStageSince: "{days} \u5929\u672A\u52A8",
		  cardNoStageSince: "\u9636\u6BB5\u672A\u586B",
		  cardLatestProgress: "\u6700\u65B0\u8FDB\u5C55",
		  cardNoProgress: "\u8FD8\u6CA1\u6709\u8FDB\u5C55",
		  cardGapBadge: "{count} \u5904\u7F3A\u53E3",
		  cardGapBadgeHigh: "{count} \u5904\u9AD8\u5371",
		  cardOpen: "\u6253\u5F00\u8BE6\u60C5",
		  cardProgressCount: "{count} \u6B21\u8FDB\u5C55",
		  boardColumnCount: "{count} \u4E2A \xB7 {amount} \u4E07",
		  boardEmptyColumn: "\u8FD9\u4E00\u5217\u8FD8\u6CA1\u6709\u9879\u76EE",
		  boardClosedColumn: "\u5DF2\u5173\u95ED",
		  boardUnknownColumn: "\u9636\u6BB5\u672A\u8BC6\u522B",
		  boardHighBadge: "{count} \u9AD8\u5371",
		  tableProgressCell: "{date} \xB7 {count} \u6B21",
		  tableStageSince: "{days} \u5929",
		  tableSortByThis: "\u6309\u6B64\u5217\u6392\u5E8F",
		  pendingGrouped: "\u6309\u89C4\u5219\u5206\u7EC4",
		  pendingUngrouped: "\u5E73\u94FA\u5217\u8868",
		  pendingRuleCount: "{count} \u4E2A\u9879\u76EE\u547D\u4E2D",
		  pendingExpand: "\u5C55\u5F00",
		  pendingCollapse: "\u6536\u8D77",
		  pendingMoreProjects: "\u8FD8\u6709 {count} \u4E2A\u9879\u76EE",
		  pendingEmptyFiltered: "\u5F53\u524D\u7B5B\u9009\u4E0B\u6CA1\u6709\u7F3A\u53E3\u3002",
		  // ---------- 0.3 · 详情页 ----------
		  dtRailTitle: "\u9879\u76EE\u6863\u6848",
		  dtStageSection: "\u9636\u6BB5",
		  dtDimensionSection: "\u56DB\u7EF4\u7ED3\u679C",
		  dtGapSection: "\u7F3A\u53E3",
		  dtNoGaps: "\u8FD9\u4E2A\u9879\u76EE\u6CA1\u6709\u626B\u51FA\u7F3A\u53E3\u3002",
		  dtPrevProject: "\u4E0A\u4E00\u4E2A",
		  dtNextProject: "\u4E0B\u4E00\u4E2A",
		  dtPosition: "\u7B2C {index} / {total} \u4E2A",
		  dtAmountLabel: "\u91D1\u989D",
		  dtOwnerLabel: "\u8D1F\u8D23\u4EBA",
		  dtTechOwnerLabel: "\u5BA2\u6237\u6280\u672F\u8D23\u4EFB\u4EBA",
		  dtSalesLabel: "\u9500\u552E",
		  dtSponsorLabel: "\u4E1A\u52A1\u51B3\u7B56\u4EBA",
		  dtStageSinceLabel: "\u8FDB\u5165\u9636\u6BB5",
		  dtPriorityLabel: "\u4F18\u5148\u7EA7",
		  dtUnset: "\u672A\u586B",
		  dtProgressTitle: "\u8FDB\u5C55\u6D41",
		  dtProgressEmptyTitle: "\u8FD8\u6CA1\u6709\u8FDB\u5C55\u8BB0\u5F55",
		  dtProgressEmptyCopy: "\u7B2C\u4E00\u6B21\u8FDB\u5C55\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u5B8C\u6574\u65F6\u95F4\u7EBF\u3002",
		  dtProgressGoal: "\u76EE\u6807",
		  dtProgressScope: "\u8303\u56F4",
		  dtProgressActual: "\u5B9E\u9645",
		  dtProgressCompletion: "\u5B8C\u6210\u5EA6",
		  dtProgressEvidence: "\u8BC1\u636E",
		  dtProgressEvidenceNone: "\u65E0\u8BC1\u636E",
		  dtProgressCustomer: "\u5BA2\u6237",
		  dtProgressCustomerNone: "\u672A\u540C\u6B65\u5BA2\u6237",
		  dtProgressFeedback: "\u53CD\u9988",
		  dtProgressNext: "\u4E0B\u4E00\u6B65",
		  dtProgressNextNone: "\u6CA1\u6709\u5B89\u6392\u4E0B\u4E00\u6B65",
		  dtProgressDeadline: "\u622A\u6B62",
		  dtProgressSeq: "\u7B2C {seq} \u6B21",
		  dtProgressCount: "\u5171 {count} \u6B21",
		  dtDimensionAuto: "\u81EA\u52A8\u63A8\u5BFC",
		  dtDimensionManual: "\u4EBA\u5DE5\u586B",
		  dtDimensionEmptyReason: "\u7ED3\u8BBA\u91CC\u6CA1\u6709\u586B\uFF0C\u4E5F\u6CA1\u6709\u4ECE\u8FDB\u5C55\u63A8\u5BFC\u51FA\u6765",
		  dtG0Title: "G0 \u5FC5\u586B\u5B8C\u6574\u5EA6",
		  dtG0Present: "\u5DF2\u586B",
		  dtG0Missing: "\u7F3A\u5931",
		  dtG0FiveRequired: "{present} / 5 \u5DF2\u586B",
		  dtG0ReviewLine: "{reviewer} \u4E8E {date} \u8BC4\u5BA1\uFF0C\u7ED3\u8BBA\u300C{conclusion}\u300D",
		  dtG0Unreviewed: "\u8FD8\u6CA1\u6709\u8BC4\u5BA1\u7ED3\u8BBA",
		  dtPlanTitle: "\u8BA1\u5212\uFF08G1 / G2\uFF09",
		  dtPlanCriteria: "\u6210\u529F\u6307\u6807",
		  dtPlanCriteriaNone: "\u8FD8\u6CA1\u6709\u5B9A\u4E49\u6210\u529F\u6307\u6807",
		  dtPlanCriteriaCount: "{count} \u9879\uFF08\u8981\u6C42 2\u20133\uFF09",
		  dtPlanMetric: "\u6307\u6807",
		  dtPlanBaseline: "\u57FA\u7EBF",
		  dtPlanTarget: "\u76EE\u6807",
		  dtPlanScenarios: "\u9A8C\u8BC1\u573A\u666F",
		  dtPlanScenariosNone: "\u8FD8\u6CA1\u6709\u5B9A\u4E49\u9A8C\u8BC1\u573A\u666F",
		  dtPlanScenariosCount: "{count} \u4E2A\uFF08\u8981\u6C42 3\u20135\uFF09",
		  dtPlanRisks: "\u98CE\u9669",
		  dtPlanRisksNone: "\u6CA1\u6709\u767B\u8BB0\u98CE\u9669",
		  dtPlanRisksCount: "{count} \u4E2A\uFF08\u4E0A\u9650 3\uFF09",
		  dtPlanMitigation: "\u5E94\u5BF9",
		  dtPlanPain: "\u5BA2\u6237\u75DB\u70B9",
		  dtPlanRecognition: "\u671F\u671B\u8BA4\u53EF",
		  dtPlanEdge: "\u6211\u65B9\u8D62\u70B9",
		  dtPlanWindow: "\u8BA1\u5212\u8D77\u6B62",
		  dtPlanReportNodes: "\u6C47\u62A5\u8282\u70B9",
		  dtPlanGate1: "G1 \u7ED3\u8BBA",
		  dtPlanGate2: "G2 Ready",
		  dtOutcomeTitle: "\u7ED3\u8BBA",
		  dtOutcomeProved: "\u6211\u4EEC\u8BC1\u660E\u4E86\u4EC0\u4E48",
		  dtOutcomeRecognized: "\u5BA2\u6237\u8BA4\u53EF\u4E86\u4EC0\u4E48",
		  dtOutcomeNext: "\u4E0B\u4E00\u6B65\u4E1A\u52A1\u52A8\u4F5C",
		  dtOutcomeMilestone: "Next Milestone",
		  dtOutcomeMilestoneNone: "\u6CA1\u6709\u4E0B\u4E00\u6B65\u91CC\u7A0B\u7891\u2014\u2014\u4EF7\u503C\u505A\u51FA\u6765\u4E86\uFF0C\u6CA1\u6709\u8F6C\u5316\u8DEF\u5F84",
		  dtOutcomeMilestoneOwner: "\u8D1F\u8D23\u4EBA {owner}",
		  dtOutcomeMilestoneDeadline: "\u622A\u6B62 {date}",
		  dtOutcomeMilestoneStatus: "\u72B6\u6001 {status}",
		  dtOutcomeProof: "\u6211\u65B9\u8BC1\u636E",
		  dtOutcomeRemaining: "\u5269\u4F59\u98CE\u9669",
		  dtOutcomeOverall: "\u603B\u4F53\u7ED3\u8BBA",
		  dtOutcomeReviewed: "\u590D\u76D8\u65E5\u671F",
		  dtSectionNav: "\u8DF3\u5230\u533A\u5757",
		  // ---------- 0.3 · 风险 / 时间线 ----------
		  riskLaneTitle: "\u4E25\u91CD\u5EA6\u5206\u5E03",
		  riskLaneNote: "\u9AD8 {high} \xB7 \u4E2D {medium} \xB7 \u4F4E {low} \xB7 \u672A\u8BC4\u7EA7 {unset}",
		  riskBoardNote: "\u5171 {count} \u6761\u98CE\u9669\uFF0C\u6765\u81EA {projects} \u4E2A\u9879\u76EE",
		  riskSourceProject: "\u6765\u6E90\u9879\u76EE",
		  riskSeverityColumn: "\u7B49\u7EA7",
		  riskMitigationColumn: "\u5E94\u5BF9\u63AA\u65BD",
		  tlLaneTitle: "\u6708\u5EA6\u5206\u5E03",
		  tlLaneNote: "\u5171 {count} \u6761\u8FDB\u5C55",
		  tlEntryGoal: "\u76EE\u6807",
		  tlEntryActual: "\u5B9E\u9645",
		  tlEntryEvidence: "\u8BC1\u636E",
		  tlEntryCustomer: "\u5BA2\u6237",
		  tlEntryNext: "\u4E0B\u4E00\u6B65",
		  tlSilentTitle: "\u5B8C\u5168\u6CA1\u6709\u8FDB\u5C55\u8BB0\u5F55\u7684\u9879\u76EE",
		  tlSilentNote: "{count} \u4E2A"
		};
		var en = {
		  nav: "Work Dashboard",
		  title: "Work Dashboard",
		  subtitle: "A multi-module operations dashboard: see what is actually moving before deciding what to fix next.",
		  dataSource: "Data source",
		  eyebrow: "Work Dashboard \xB7 read-only",
		  modulePoc: "POC Operations",
		  modulePocHint: "Stage, four dimensions and gaps",
		  moduleMore: "More modules to come",
		  refresh: "Refresh",
		  refreshing: "Pulling\u2026",
		  refreshingHint: "The first pull takes a few seconds",
		  refreshSettings: "Refresh settings",
		  refreshedAt: "Refreshed {time}",
		  neverRefreshed: "Not pulled yet",
		  autoRefresh: "Auto refresh",
		  intervalOff: "Off (manual only)",
		  interval10m: "Every 10 minutes",
		  interval1h: "Every hour",
		  intervalCustom: "Custom",
		  customMinutes: "minutes",
		  save: "Save",
		  cancel: "Cancel",
		  customMinutesError: "Enter a whole number of minutes between {min} and {max}",
		  autoRefreshOn: "Auto refresh: every {minutes} min (only while this page is open)",
		  autoRefreshOff: "Auto refresh: off",
		  autoRefreshFailed: "Scheduled refresh failed; retrying next cycle",
		  emptyTitle: "No data yet",
		  emptyCopy: "Hit Refresh to pull the POC ledger from GitHub",
		  emptyRefresh: "Refresh now",
		  emptyPath: "Cache location",
		  failureTitle: "Pull failed",
		  failureReason: "Reason",
		  failureRetry: "Retry",
		  failureHint: "Check the network and gh login, then retry.",
		  loading: "Loading\u2026",
		  loadingDetail: "Reading the project\u2026",
		  statActive: "Active",
		  statG0: "Missing G0",
		  statRisk: "At risk",
		  statConvertible: "Convertible",
		  statTotal: "Total",
		  statClosed: "Closed",
		  tableTitle: "Projects",
		  colProject: "Project",
		  colStage: "Stage",
		  colDimensions: "Four dimensions",
		  colGaps: "Gaps",
		  colAction: "Action",
		  detail: "Detail",
		  openDetail: "Open detail",
		  noProjects: "The repository has no projects yet",
		  warningsTitle: "Parse notes",
		  dimAchievement: "Goal met",
		  dimEvidence: "Evidence",
		  dimRecognition: "Recognition",
		  dimNextMilestone: "Next step",
		  dimPresent: "Present",
		  dimMissing: "Missing",
		  dimensionCount: "{count}/4",
		  stageTrack: "Stage track",
		  stageG0: "G0 Intake",
		  stageG1: "G1 Design",
		  stageG2: "G2 Validation",
		  stageG3: "G3 Results",
		  stageG4: "G4 Conversion",
		  stageClosed: "Closed",
		  stageDone: "Done",
		  stageCurrent: "Current",
		  stagePending: "Not started",
		  stageUnknown: "Unrecognized stage",
		  pendingTitle: "Pending",
		  pendingEmpty: "No gaps found. Keep it up.",
		  pendingCount: "{count} items",
		  gapPriority: "Priority {value}",
		  back: "\u2190 Back",
		  detailIdentity: "{pocId} \xB7 {stage} \xB7 {org}",
		  detailMissing: "Project not found",
		  detailMissingCopy: "No project with poc_id {pocId} exists in the repository; it may have been removed. Refresh and retry.",
		  sectionG0: "G0 intake prerequisites",
		  sectionGates: "Stage records",
		  sectionScope: "Indicators / scenarios / risks",
		  sectionResult: "Result and next step",
		  sectionTimeline: "Timeline",
		  sectionGaps: "Gaps in this project",
		  whyCustomerTest: "Why the customer tests",
		  whyWeTest: "Why we test",
		  nextActionGoal: "Next action goal",
		  customerTechOwner: "Customer tech owner",
		  owner: "Our owner",
		  salesInitiator: "Sales initiator",
		  type: "Project type",
		  tier: "Tier",
		  gateDate: "Completed",
		  gateCounts: "Indicators {indicators} \xB7 Scenarios {scenarios} \xB7 Risks {risks}",
		  gatePrereq: "Prerequisites ready {ready}",
		  gateEngineers: "Engineers invested {invested}",
		  yes: "yes",
		  no: "no",
		  criteriaTitle: "Success criteria",
		  scenariosTitle: "Validation scenarios",
		  risksTitle: "Risks",
		  criteriaCount: "{count}",
		  scenariosCount: "{count}",
		  risksCount: "{count}",
		  criteriaLimitHint: "2\u20133 required",
		  scenariosLimitHint: "3\u20135 required",
		  risksLimitHint: "At most 3",
		  emptyField: "(empty)",
		  riskLevel: "Level",
		  riskMitigation: "Mitigation",
		  round: "Round {round}",
		  roundUnnumbered: "Entry",
		  noTimeline: "No timeline entries yet",
		  evidenceLabel: "Evidence",
		  feedbackLabel: "Customer feedback",
		  recognitionLabel: "Recognition scope",
		  "error.network": "Cannot reach github.com; check the network.",
		  "error.not-found": "The repository does not exist, or this account cannot see it.",
		  "error.timeout": "The pull timed out; try again shortly.",
		  "error.git-missing": "The git command is not available on this machine.",
		  "error.busy": "A refresh is already running; try again in a moment.",
		  "error.no-projects": "The repository has no projects/ directory.",
		  "error.cache-not-owned": "The cache directory exists and was not created by this plugin; refusing to clear it.",
		  "error.unknown-project": "Project not found.",
		  "error.internal": "Internal Host error; check the DSH log.",
		  "error.failed": "The operation failed.",
		  // Submit errors the Host can report
		  // Milestone 3: export form
		  exportNav: "Export form",
		  exportTitle: "Export a form for a colleague",
		  exportSubtitle: "Pick projects and generate one self-contained HTML file: open it, fill it in, auto-saved, live-validated, then download the YAML.",
		  exportSelectAll: "Select all",
		  exportSelectNone: "Clear",
		  exportSelected: "{count} project(s) selected",
		  exportBlank: "Export a blank form only (for a new project)",
		  exportBlankHint: 'With nothing selected, a blank "new project" form is generated.',
		  exportGenerate: "Generate and download",
		  exportGenerating: "Generating\u2026",
		  exportDone: "Downloaded {name}",
		  exportSize: "{kb} KB",
		  exportHint: "The form works fully offline: no CDN, no external fonts, no server. The .yaml it produces can be dropped straight into this plugin's import page.",
		  exportNoProjects: "Refresh first to pull the ledger before exporting an existing project.",
		  exportFailed: "Could not generate the form",
		  // Milestone 3: risk board
		  risksNav: "Risk board",
		  risksBoardTitle: "Risk board",
		  risksSubtitle: "Every project's risks, highest severity first.",
		  riskHigh: "High",
		  riskMedium: "Medium",
		  riskLow: "Low",
		  riskUnset: "Unrated",
		  riskNoRisks: "No project registered a risk \u2014 which is itself worth questioning.",
		  riskCounts: "High {high} \xB7 Medium {medium} \xB7 Low {low} \xB7 Unrated {unset}",
		  riskProjects: "{withRisks} / {total} project(s) have risks on record",
		  riskUnsetHint: '"Unrated" is not "harmless": it means nobody judged it yet, so it sorts last.',
		  riskGapContext: "{count} gap(s) in the same project ({high} high)",
		  // Milestone 3: global timeline
		  timelineNav: "Timeline",
		  timelineTitle: "Global timeline",
		  timelineSubtitle: "Every review round of every project, newest first.",
		  timelineRange: "{from} to {to}",
		  timelineCount: "{count} entries",
		  timelineEmpty: "No review rounds recorded yet.",
		  timelineSilent: "{count} project(s) have no timeline at all",
		  timelineSilentHint: "Without a timeline there is no way to tell whether those projects moved.",
		  timelineMonth: "{month}: {count}",
		  timelineNoEvidence: "No evidence",
		  timelineNoFeedback: "No customer feedback",
		  timelineActual: "Actual result",
		  timelineRoundShort: "Round {round}",
		  statTotalProjects: "POCs",
		  statTotalNote: "All projects in the ledger",
		  statG0Passed: "G0 passed",
		  statG0CompleteNote: "G0 complete",
		  statInProgress: "In progress",
		  statStoppedNote: "Paused/closed/cancelled",
		  statAmount: "Total amount",
		  statAmountUnit: "10k CNY",
		  colOrg: "System / company",
		  colAmount: "Amount",
		  colLatestProgress: "Latest progress",
		  noProgressYet: "No progress yet",
		  progressGoal: "Goal",
		  progressItems: "Scope",
		  progressActual: "Actual",
		  progressSyncedWith: "Synced with",
		  progressNext: "Next",
		  progressDeadline: "Due",
		  progressTypeUnset: "Unclassified",
		  progressCount: "{count} entries",
		  sectionProgress: "Progress stream",
		  sectionFourDim: "Four dimensions",
		  progressEmptyTitle: "No progress yet",
		  progressEmptyCopy: "After the first update, the full timeline appears here.",
		  sectionIdentity: "Identity",
		  sectionPlan: "Plan (G1/G2)",
		  sectionOutcome: "Outcome",
		  dimAuto: "derived",
		  dimManual: "manual",
		  g0Complete: "G0 complete",
		  g0Missing: "{count} required fields missing",
		  g0Conclusion: "G0 conclusion",
		  g0Reviewer: "G0 reviewer",
		  g0ReviewedAt: "Reviewed at",
		  decisionChain: "Process / decision chain",
		  postPocDecision: "Post-POC decision",
		  competitor: "Main competitor",
		  customerPain: "Customer pain",
		  expectedRecognition: "Expected recognition",
		  ourEdge: "Our edge",
		  gate1Conclusion: "G1 conclusion",
		  gate2Ready: "G2 ready state",
		  timelineWindow: "Planned window",
		  outcomeAchievement: "Achievement",
		  outcomeRecognition: "Customer recognition",
		  outcomeOurProof: "Our proof",
		  outcomeRemainingRisks: "Remaining risks",
		  outcomeProved: "What we proved",
		  outcomeRecognized: "What was recognised",
		  outcomeNextBusiness: "Next business action",
		  outcomeMilestone: "Next milestone",
		  outcomeBusinessOwner: "Milestone owner",
		  outcomeBusinessDeadline: "Milestone due",
		  outcomeBusinessStatus: "Milestone status",
		  outcomeOverall: "Overall conclusion",
		  outcomeReviewedAt: "Review date",
		  execSponsor: "Exec sponsor",
		  priority: "Priority",
		  stageSince: "In current stage since",
		  daysInStage: "{days} days here",
		  completionLabel: "Completion",
		  gate3_1Label: "G3-1",
		  gate3_2Label: "G3-2",
		  "gap.R1-gate0-missing.title": "G0 required fields missing",
		  "gap.R1-gate0-missing.copy": "{count} of the five G0 fields are missing: {missing}.",
		  "gap.R2-large-amount-no-g0.title": "{amountWan}k project has no G0 clearance",
		  "gap.R2-large-amount-no-g0.copy": 'The amount reaches the large-project threshold while the G0 conclusion is "{conclusion}" \u2014 commitment ahead of judgement.',
		  "gap.R3-g0-passed-no-plan.title": "G0 passed but no success criteria",
		  "gap.R3-g0-passed-no-plan.copy": "The gate passed, yet nobody defined what success means, so acceptance is impossible.",
		  "gap.R4-criteria-count.title": "{count} criteria (need {min}-{max})",
		  "gap.R4-criteria-count.copy": "{count} criteria, outside the {min}-{max} range; measuring everything means measuring nothing.",
		  "gap.R5-scenarios-count.title": "{count} scenarios (need {min}-{max})",
		  "gap.R5-scenarios-count.copy": "{count} scenarios, outside the {min}-{max} range; an unbounded scope drags the cycle out.",
		  "gap.R6-risks-overflow.title": "{count} risks (max {max})",
		  "gap.R6-risks-overflow.copy": "{count} risks listed, above the {max} limit; an over-long risk list has no priority.",
		  "gap.R7-g2-not-ready.title": "Progress exists while G2 is not ready",
		  "gap.R7-g2-not-ready.copy": 'Prerequisites are "{ready}" but progress has already been recorded, so effort may be wasted.',
		  "gap.R8-progress-no-evidence.title": "Progress without evidence",
		  "gap.R8-progress-no-evidence.copy": "Entry {seq} claims an actual result with nothing verifiable behind it.",
		  "gap.R9-evidence-no-recognition.title": "Evidence without customer recognition",
		  "gap.R9-evidence-no-recognition.copy": 'Evidence exists while recognition is "{recognition}" \u2014 only we think it went well.',
		  "gap.R10-g3-1-without-g3-2.title": "G3-1 provable but G3-2 unconfirmed",
		  "gap.R10-g3-1-without-g3-2.copy": 'The result is marked provable while confirmation is "{gate3_2}"; written customer sign-off is missing.',
		  "gap.R11-no-next-milestone.title": "Achieved but no next milestone",
		  "gap.R11-no-next-milestone.copy": "The result was achieved with no next milestone: value created, none banked.",
		  "gap.R12-stage-stalled.title": "{days} days in {stage}",
		  "gap.R12-stage-stalled.copy": "The project has sat in its current stage for {days} days (threshold {stallDays}) with no movement.",
		  // ---------- 0.3 · portfolio band ----------
		  bandTitle: "Portfolio view",
		  bandNote: "{count} projects \xB7 {amount} (10k CNY)",
		  bandStages: "Stage distribution",
		  bandStagesNote: "by current stage",
		  bandOrgs: "System / company",
		  bandOrgsNote: "by amount",
		  bandTypes: "Project types",
		  bandTypesNote: "by count",
		  bandAmounts: "Amount concentration",
		  bandAmountsNote: "top 5",
		  bandDims: "Dimension coverage",
		  bandDimsNote: "share of projects with a value",
		  bandGapRules: "Gap rules fired",
		  bandGapRulesNote: "{count} findings",
		  bandActivity: "Progress activity",
		  bandActivityNote: "entries per month",
		  chartNoData: "No data",
		  stageCountLabel: "{count}",
		  stageAmountLabel: "{amount} (10k)",
		  stageHighLabel: "{count} with a high gap",
		  orgProjectLabel: "{count}",
		  orgAmountLabel: "{amount} (10k)",
		  orgHighLabel: "{count} high",
		  typeLegendNote: "{count} \xB7 {amount} (10k)",
		  amountShareLabel: "{share}%",
		  amountConcentrationLabel: "Largest project is {share}% of the total",
		  amountMissingLabel: "{count} project(s) have no amount",
		  concentrationHigh: "Highly concentrated: one project holds more than a third of the total, so the risk is not spread.",
		  concentrationNormal: "Normal spread: no single project holds more than a third of the total.",
		  coveragePresent: "{present} / {total}",
		  coverageMissingNote: "{count} missing",
		  activityLastLabel: "Latest progress {date}",
		  activityNoneLabel: "No progress recorded anywhere yet",
		  gapRuleFiresLabel: "{count}\xD7",
		  gapRuleLegendHigh: "High",
		  gapRuleLegendMedium: "Notice",
		  // ---------- 0.3 · toolbar ----------
		  viewLabel: "View",
		  viewCards: "Cards",
		  viewBoard: "Board",
		  viewTable: "Table",
		  viewCardsHint: "See what each project lacks, at a glance",
		  viewBoardHint: "Columns by stage, to read the pile-up",
		  viewTableHint: "Compact rows for line-by-line comparison",
		  searchLabel: "Search",
		  searchPlaceholder: "Name / id / owner / company",
		  searchClear: "Clear search",
		  filterLabel: "Filters",
		  filterAll: "All",
		  filterSystem: "System",
		  filterStage: "Stage",
		  filterStatus: "Status",
		  filterType: "Type",
		  filterClear: "Clear filters",
		  filterActiveNote: "{count} active",
		  filterResult: "{shown} of {total} projects",
		  sortLabel: "Sort",
		  sortAttention: "By attention",
		  sortAmount: "By amount",
		  sortProgress: "By latest progress",
		  sortStage: "By stage",
		  sortDirection: "Toggle ascending / descending",
		  keyboardHint: "\u2191\u2193 select \xB7 Enter open \xB7 Esc back \xB7 / search",
		  filteredEmptyTitle: "No project matches",
		  filteredEmptyCopy: 'Loosen the search term or filters, or hit "Clear filters".',
		  filteredEmptyReset: "Clear filters",
		  // ---------- 0.3 · cards / board ----------
		  cardAmountLabel: "Amount",
		  cardStageSince: "{days} days idle",
		  cardNoStageSince: "No stage date",
		  cardLatestProgress: "Latest progress",
		  cardNoProgress: "No progress yet",
		  cardGapBadge: "{count} gaps",
		  cardGapBadgeHigh: "{count} high",
		  cardOpen: "Open detail",
		  cardProgressCount: "{count} entries",
		  boardColumnCount: "{count} \xB7 {amount} (10k)",
		  boardEmptyColumn: "No project in this column",
		  boardClosedColumn: "Closed",
		  boardUnknownColumn: "Unrecognized stage",
		  boardHighBadge: "{count} high",
		  tableProgressCell: "{date} \xB7 {count} entries",
		  tableStageSince: "{days} days",
		  tableSortByThis: "Sort by this column",
		  pendingGrouped: "Group by rule",
		  pendingUngrouped: "Flat list",
		  pendingRuleCount: "{count} project(s) hit",
		  pendingExpand: "Expand",
		  pendingCollapse: "Collapse",
		  pendingMoreProjects: "{count} more project(s)",
		  pendingEmptyFiltered: "No gaps under the current filters.",
		  // ---------- 0.3 · detail ----------
		  dtRailTitle: "Project file",
		  dtStageSection: "Stage",
		  dtDimensionSection: "Four dimensions",
		  dtGapSection: "Gaps",
		  dtNoGaps: "No gap found for this project.",
		  dtPrevProject: "Previous",
		  dtNextProject: "Next",
		  dtPosition: "{index} of {total}",
		  dtAmountLabel: "Amount",
		  dtOwnerLabel: "Owner",
		  dtTechOwnerLabel: "Customer tech owner",
		  dtSalesLabel: "Sales",
		  dtSponsorLabel: "Business sponsor",
		  dtStageSinceLabel: "In stage since",
		  dtPriorityLabel: "Priority",
		  dtUnset: "Not set",
		  dtProgressTitle: "Progress stream",
		  dtProgressEmptyTitle: "No progress yet",
		  dtProgressEmptyCopy: "After the first update, the full timeline appears here.",
		  dtProgressGoal: "Goal",
		  dtProgressScope: "Scope",
		  dtProgressActual: "Actual",
		  dtProgressCompletion: "Completion",
		  dtProgressEvidence: "Evidence",
		  dtProgressEvidenceNone: "No evidence",
		  dtProgressCustomer: "Customer",
		  dtProgressCustomerNone: "Not synced yet",
		  dtProgressFeedback: "Feedback",
		  dtProgressNext: "Next",
		  dtProgressNextNone: "No next step scheduled",
		  dtProgressDeadline: "Due",
		  dtProgressSeq: "Entry {seq}",
		  dtProgressCount: "{count} entries",
		  dtDimensionAuto: "derived",
		  dtDimensionManual: "manual",
		  dtDimensionEmptyReason: "Not in the conclusion, and not derivable from progress",
		  dtG0Title: "G0 completeness",
		  dtG0Present: "Present",
		  dtG0Missing: "Missing",
		  dtG0FiveRequired: "{present} of 5 present",
		  dtG0ReviewLine: 'Reviewed by {reviewer} on {date}: "{conclusion}"',
		  dtG0Unreviewed: "No review conclusion yet",
		  dtPlanTitle: "Plan (G1 / G2)",
		  dtPlanCriteria: "Success criteria",
		  dtPlanCriteriaNone: "No success criterion defined yet",
		  dtPlanCriteriaCount: "{count} (2\u20133 required)",
		  dtPlanMetric: "Metric",
		  dtPlanBaseline: "Baseline",
		  dtPlanTarget: "Target",
		  dtPlanScenarios: "Validation scenarios",
		  dtPlanScenariosNone: "No validation scenario defined yet",
		  dtPlanScenariosCount: "{count} (3\u20135 required)",
		  dtPlanRisks: "Risks",
		  dtPlanRisksNone: "No risk registered",
		  dtPlanRisksCount: "{count} (max 3)",
		  dtPlanMitigation: "Mitigation",
		  dtPlanPain: "Customer pain",
		  dtPlanRecognition: "Expected recognition",
		  dtPlanEdge: "Our edge",
		  dtPlanWindow: "Planned window",
		  dtPlanReportNodes: "Report nodes",
		  dtPlanGate1: "G1 conclusion",
		  dtPlanGate2: "G2 ready",
		  dtOutcomeTitle: "Conclusion",
		  dtOutcomeProved: "What we proved",
		  dtOutcomeRecognized: "What the customer recognised",
		  dtOutcomeNext: "Next business action",
		  dtOutcomeMilestone: "Next milestone",
		  dtOutcomeMilestoneNone: "No next milestone \u2014 value was created, but none of it was banked",
		  dtOutcomeMilestoneOwner: "Owner {owner}",
		  dtOutcomeMilestoneDeadline: "Due {date}",
		  dtOutcomeMilestoneStatus: "Status {status}",
		  dtOutcomeProof: "Our proof",
		  dtOutcomeRemaining: "Remaining risks",
		  dtOutcomeOverall: "Overall conclusion",
		  dtOutcomeReviewed: "Reviewed",
		  dtSectionNav: "Jump to section",
		  // ---------- 0.3 · risks / timeline ----------
		  riskLaneTitle: "Severity distribution",
		  riskLaneNote: "High {high} \xB7 Medium {medium} \xB7 Low {low} \xB7 Unrated {unset}",
		  riskBoardNote: "{count} risks from {projects} projects",
		  riskSourceProject: "Source project",
		  riskSeverityColumn: "Level",
		  riskMitigationColumn: "Mitigation",
		  tlLaneTitle: "Monthly distribution",
		  tlLaneNote: "{count} entries",
		  tlEntryGoal: "Goal",
		  tlEntryActual: "Actual",
		  tlEntryEvidence: "Evidence",
		  tlEntryCustomer: "Customer",
		  tlEntryNext: "Next",
		  tlSilentTitle: "Projects with no progress at all",
		  tlSilentNote: "{count}"
		};
		function format(template, params = {}) {
		  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (whole, key) => key in params ? String(params[key]) : whole);
		}

		// src/client/shell.tsx
		var import_react2 = require("react");

		// src/client/preferences.ts
		var DEFAULT_PREFERENCE = { interval: "off", customMinutes: DEFAULT_CUSTOM_MINUTES };
		function browserStorage() {
		  try {
		    if (typeof globalThis.localStorage === "undefined") return void 0;
		    const probe = "__poc-console-probe__";
		    globalThis.localStorage.setItem(probe, "1");
		    globalThis.localStorage.getItem(probe);
		    globalThis.localStorage.removeItem?.(probe);
		    return globalThis.localStorage;
		  } catch {
		    return void 0;
		  }
		}
		function clampMinutes(value) {
		  if (!Number.isFinite(value)) return DEFAULT_CUSTOM_MINUTES;
		  return Math.min(CUSTOM_MINUTES_MAX, Math.max(CUSTOM_MINUTES_MIN, Math.round(value)));
		}
		function parseInterval(raw) {
		  const value = (raw ?? "").trim();
		  return REFRESH_INTERVALS.includes(value) ? value : DEFAULT_PREFERENCE.interval;
		}
		function readPreference(storage = browserStorage()) {
		  if (storage === void 0) return { ...DEFAULT_PREFERENCE };
		  const interval = parseInterval(storage.getItem(REFRESH_INTERVAL_KEY));
		  const rawMinutes = storage.getItem(CUSTOM_MINUTES_KEY);
		  const parsed = rawMinutes === null ? Number.NaN : Number(rawMinutes);
		  return {
		    interval,
		    customMinutes: Number.isFinite(parsed) ? clampMinutes(parsed) : DEFAULT_CUSTOM_MINUTES
		  };
		}
		function writePreference(preference, storage = browserStorage()) {
		  if (storage === void 0) return;
		  try {
		    storage.setItem(REFRESH_INTERVAL_KEY, preference.interval);
		    storage.setItem(CUSTOM_MINUTES_KEY, String(clampMinutes(preference.customMinutes)));
		  } catch {
		  }
		}
		function intervalMs(preference) {
		  switch (preference.interval) {
		    case "off":
		      return null;
		    case "10m":
		      return 10 * 6e4;
		    case "1h":
		      return 60 * 6e4;
		    case "custom":
		      return clampMinutes(preference.customMinutes) * 6e4;
		  }
		}
		var DEFAULT_VIEW_PREFERENCE = { viewMode: "cards", sortKey: "attention" };
		function parseViewMode(raw) {
		  const value = (raw ?? "").trim();
		  return VIEW_MODES.includes(value) ? value : DEFAULT_VIEW_PREFERENCE.viewMode;
		}
		function parseSortKey(raw) {
		  const value = (raw ?? "").trim();
		  return SORT_KEYS.includes(value) ? value : DEFAULT_VIEW_PREFERENCE.sortKey;
		}
		function readViewPreference(storage = browserStorage()) {
		  if (storage === void 0) return { ...DEFAULT_VIEW_PREFERENCE };
		  return {
		    viewMode: parseViewMode(storage.getItem(VIEW_MODE_KEY)),
		    sortKey: parseSortKey(storage.getItem(SORT_KEY_KEY))
		  };
		}
		function writeViewPreference(preference, storage = browserStorage()) {
		  if (storage === void 0) return;
		  try {
		    storage.setItem(VIEW_MODE_KEY, preference.viewMode);
		    storage.setItem(SORT_KEY_KEY, preference.sortKey);
		  } catch {
		  }
		}

		// src/client/charts.tsx
		var import_jsx_runtime = require("react/jsx-runtime");
		var TONES = ["blue", "green", "amber", "red", "slate"];
		function toneAt(index) {
		  return TONES[index % TONES.length];
		}
		function Summary({ text }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "chart-sr", children: text });
		}
		function ColumnChart({
		  columns,
		  ariaLabel,
		  summary,
		  onSelect,
		  activeKey,
		  height = 96
		}) {
		  const max = columns.reduce((peak, column) => Math.max(peak, column.value), 0);
		  if (max <= 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "chart-empty", role: "img", "aria-label": ariaLabel, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u2014" }) });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "columns", role: "group", "aria-label": ariaLabel, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, { text: summary }),
		    columns.map((column, index) => {
		      const ratio = column.value / max;
		      const tone = column.tone ?? toneAt(index);
		      const body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "columns-value", children: column.value }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "columns-fill", "data-tone": tone, style: { height: `${Math.max(ratio * 100, 3)}%` } })
		      ] });
		      const shared = {
		        className: "columns-cell",
		        "data-active": activeKey === column.key,
		        "data-empty": column.value === 0,
		        title: column.secondary === void 0 ? `${column.label} \xB7 ${column.value}` : `${column.label} \xB7 ${column.value} \xB7 ${column.secondary}`
		      };
		      return onSelect === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...shared, style: { height }, children: [
		        body,
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "columns-label", children: column.label })
		      ] }, column.key) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", ...shared, style: { height }, onClick: () => onSelect(column.key), children: [
		        body,
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "columns-label", children: column.label })
		      ] }, column.key);
		    })
		  ] });
		}
		function Donut({
		  slices,
		  ariaLabel,
		  summary,
		  centerValue,
		  centerLabel,
		  onSelect,
		  activeKey
		}) {
		  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
		  const radius = 34;
		  const circumference = 2 * Math.PI * radius;
		  if (total <= 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "chart-empty", role: "img", "aria-label": ariaLabel, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u2014" }) });
		  }
		  let offset = 0;
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "donut", role: "group", "aria-label": ariaLabel, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, { text: summary }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "donut-figure", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 96 96", className: "donut-svg", "aria-hidden": "true", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "48", cy: "48", r: radius, className: "donut-ring" }),
		        slices.map((slice, index) => {
		          const length = slice.value / total * circumference;
		          const dash = `${length} ${circumference - length}`;
		          const rotation = offset / circumference * 360;
		          offset += length;
		          return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		            "circle",
		            {
		              cx: "48",
		              cy: "48",
		              r: radius,
		              className: "donut-slice",
		              "data-tone": slice.tone ?? toneAt(index),
		              strokeDasharray: dash,
		              transform: `rotate(${rotation - 90} 48 48)`
		            },
		            slice.key
		          );
		        })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "donut-center", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "donut-center-value", children: centerValue }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "donut-center-label", children: centerLabel })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "donut-legend", children: slices.map((slice, index) => {
		      const tone = slice.tone ?? toneAt(index);
		      const label = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "donut-dot", "data-tone": tone }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "donut-legend-label", children: slice.label }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "donut-legend-value", children: slice.value })
		      ] });
		      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: onSelect === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "donut-legend-row", "data-active": activeKey === slice.key, children: label }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "donut-legend-row donut-legend-button", "data-active": activeKey === slice.key, onClick: () => onSelect(slice.key), children: label }) }, slice.key);
		    }) })
		  ] });
		}
		function BarList({
		  rows,
		  ariaLabel,
		  summary,
		  onSelect,
		  activeKey,
		  max
		}) {
		  const peak = max ?? rows.reduce((highest, row) => Math.max(highest, row.value), 0);
		  if (rows.length === 0 || peak <= 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "chart-empty", role: "img", "aria-label": ariaLabel, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u2014" }) });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "barlist", role: "group", "aria-label": ariaLabel, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, { text: summary }),
		    rows.map((row, index) => {
		      const tone = row.tone ?? toneAt(index);
		      const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "barlist-text", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "barlist-label", children: row.label }),
		          row.note === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "barlist-note", children: row.note })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "barlist-track", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "barlist-fill", "data-tone": tone, style: { width: `${Math.max(row.value / peak * 100, 2)}%` } }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "barlist-value", children: row.display ?? row.value })
		      ] });
		      return onSelect === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "barlist-row", "data-active": activeKey === row.key, children: content }, row.key) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "barlist-row barlist-button", "data-active": activeKey === row.key, onClick: () => onSelect(row.key), children: content }, row.key);
		    })
		  ] });
		}
		function RadialMeter({
		  ratio,
		  label,
		  value,
		  note,
		  tone = "blue",
		  ariaLabel
		}) {
		  const clamped = Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0;
		  const radius = 26;
		  const circumference = 2 * Math.PI * radius;
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "radial", role: "img", "aria-label": ariaLabel, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "radial-figure", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 64 64", "aria-hidden": "true", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "32", cy: "32", r: radius, className: "radial-track" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		          "circle",
		          {
		            cx: "32",
		            cy: "32",
		            r: radius,
		            className: "radial-fill",
		            "data-tone": tone,
		            strokeDasharray: `${clamped * circumference} ${circumference}`,
		            transform: "rotate(-90 32 32)"
		          }
		        )
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "radial-value", children: value })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "radial-label", children: label }),
		    note === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "radial-note", children: note })
		  ] });
		}
		function Sparkbars({
		  points,
		  ariaLabel,
		  summary
		}) {
		  const max = points.reduce((peak, point) => Math.max(peak, point.count), 0);
		  if (points.length === 0 || max <= 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "chart-empty", role: "img", "aria-label": ariaLabel, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u2014" }) });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "spark", role: "group", "aria-label": ariaLabel, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, { text: summary }),
		    points.map((point) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "spark-cell", title: `${point.month} \xB7 ${point.count}`, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spark-bar", style: { height: `${Math.max(point.count / max * 100, 4)}%` }, "data-empty": point.count === 0 }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spark-month", children: point.month.slice(5) })
		    ] }, point.month))
		  ] });
		}
		function SeverityBar({
		  lanes,
		  ariaLabel,
		  summary
		}) {
		  const total = lanes.reduce((sum, lane) => sum + lane.value, 0);
		  if (total <= 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "chart-empty", role: "img", "aria-label": ariaLabel, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u2014" }) });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "segbar", role: "group", "aria-label": ariaLabel, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, { text: summary }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "segbar-track", children: lanes.map(
		      (lane) => lane.value <= 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "segbar-seg", "data-tone": lane.tone, style: { flexGrow: lane.value / total }, title: `${lane.label} \xB7 ${lane.value}`, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "segbar-label", children: lane.label }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "segbar-value", children: lane.value })
		      ] }, lane.key)
		    ) })
		  ] });
		}
		var STAGE_IDS = ["G0", "G1", "G2", "G3", "G4"];
		function StageRailMini({
		  done,
		  current,
		  closed,
		  ariaLabel
		}) {
		  const currentIndex = current === null ? -1 : STAGE_IDS.indexOf(current);
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "rail-mini", role: "img", "aria-label": ariaLabel, children: STAGE_IDS.map((stage, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		    "span",
		    {
		      className: "rail-mini-tick",
		      "data-done": closed ? true : done[index] === true,
		      "data-current": !closed && index === currentIndex
		    },
		    stage
		  )) });
		}
		function InlineMeter({ value, max, tone = "blue" }) {
		  const ratio = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
		  const style = { width: `${ratio * 100}%` };
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-meter", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-meter-fill", "data-tone": tone, style }) });
		}
		function Legend({ items }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "legend", children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "legend-item", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "legend-dot", "data-tone": item.tone }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "legend-label", children: item.label }),
		    item.value === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "legend-value", children: item.value })
		  ] }, item.key)) });
		}
		function dimensionTone(key) {
		  switch (key) {
		    case "achievement":
		      return "blue";
		    case "evidence":
		      return "green";
		    case "recognition":
		      return "amber";
		    case "nextMilestone":
		      return "red";
		  }
		}

		// src/client/detail.tsx
		var import_jsx_runtime2 = require("react/jsx-runtime");
		var DIMENSION_TEXT = {
		  achievement: "dimAchievement",
		  evidence: "dimEvidence",
		  recognition: "dimRecognition",
		  nextMilestone: "dimNextMilestone"
		};
		var DIMENSION_ORIGIN = {
		  achievement: "auto",
		  evidence: "manual",
		  recognition: "auto",
		  nextMilestone: "manual"
		};
		var G0_LABEL = {
		  why_customer: "whyCustomerTest",
		  why_us: "whyWeTest",
		  decision_chain: "decisionChain",
		  post_poc_decision: "postPocDecision",
		  tech_owner: "customerTechOwner"
		};
		var G0_PROSE = /* @__PURE__ */ new Set(["why_customer", "why_us"]);
		function formatWan(value) {
		  const rounded = Math.round(value * 10) / 10;
		  return rounded.toLocaleString("zh-CN", { maximumFractionDigits: 1 });
		}
		function formatDate(value, locale) {
		  if (value === null || value === "") return "";
		  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
		  const stamp = /* @__PURE__ */ new Date(`${value}T00:00:00`);
		  if (Number.isNaN(stamp.getTime())) return value;
		  return stamp.toLocaleDateString(locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US", {
		    year: "numeric",
		    month: "2-digit",
		    day: "2-digit"
		  });
		}
		function recognitionTone(value) {
		  if (value === "\u8BA4\u53EF") return "green";
		  if (value === "\u90E8\u5206\u8BA4\u53EF" || value === "\u5F85\u786E\u8BA4") return "amber";
		  if (value === "\u672A\u8BA4\u53EF") return "red";
		  return "slate";
		}
		function riskTone(level) {
		  if (level === "high") return "red";
		  if (level === "medium") return "amber";
		  if (level === "low") return "green";
		  return "slate";
		}
		function completionRatio(value) {
		  const match = value.match(/^(\d+(?:\.\d+)?)\s*%/u);
		  if (match === null) return null;
		  const parsed = Number(match[1]);
		  if (!Number.isFinite(parsed)) return null;
		  return Math.min(1, Math.max(0, parsed / 100));
		}
		function Section({ title, kicker, children }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dsec", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "dsec-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "dsec-title", children: title }),
		      kicker === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsec-kicker", children: kicker })
		    ] }),
		    children
		  ] });
		}
		function Blank({ text }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsec-blank", children: text });
		}
		function Prose({ label, value, t }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-prose", "data-empty": value === "", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-prose-label", children: label }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dt-prose-body prose", children: value === "" ? t("emptyField") : value })
		  ] });
		}
		function RailMeta({ label, value, t }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-rail-meta-row", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-rail-meta-label", children: label }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-rail-meta-value", "data-empty": value === "", children: value === "" ? t("dtUnset") : value })
		  ] });
		}
		function StageTrackVertical({ detail, t }) {
		  const currentIndex = detail.summary.stage === null ? -1 : STAGES.indexOf(detail.summary.stage);
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ol", { className: "dt-stages", "aria-label": t("stageTrack"), children: STAGES.map((stage, index) => {
		    const done = detail.summary.closed ? true : detail.summary.stageDone[index] === true;
		    const current = !detail.summary.closed && index === currentIndex;
		    const state = done ? t("stageDone") : current ? t("stageCurrent") : t("stagePending");
		    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: "dt-stage", "data-done": done, "data-current": current, "aria-current": current ? "step" : void 0, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-stage-marker", "aria-hidden": "true", children: done ? "\u2713" : current ? "\u25C9" : index + 1 }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dt-stage-text", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-stage-label", children: t(`stage${stage}`) }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-stage-state", children: state })
		      ] })
		    ] }, stage);
		  }) });
		}
		function IdentityRail({ props }) {
		  const { detail, gaps, t, position, onPrev, onNext, onBack, locale } = props;
		  const summary = detail.summary;
		  const resolved = {
		    achievement: detail.outcome.achievement,
		    evidence: detail.outcome.ourProof,
		    recognition: detail.outcome.customerRecognition,
		    nextMilestone: detail.outcome.milestone
		  };
		  const present = {
		    achievement: detail.outcome.achievement !== "",
		    evidence: detail.outcome.ourProof !== "",
		    recognition: detail.outcome.customerRecognition !== "",
		    nextMilestone: detail.outcome.milestone !== ""
		  };
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("aside", { className: "dt-rail", "aria-label": t("dtRailTitle"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-rail-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "btn btn-small dt-rail-back", onClick: onBack, children: t("back") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { className: "dt-rail-title", children: summary.name }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-rail-id mono", children: summary.pocId }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-rail-pills", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "status-pill tone-blue", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "status-dot" }),
		          summary.closed ? t("stageClosed") : summary.stageLabel === "" ? t("stageUnknown") : summary.stageLabel
		        ] }),
		        summary.status === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "status-pill tone-slate", children: summary.status }),
		        summary.priority === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "status-pill tone-amber", children: summary.priority })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-rail-amount", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-rail-amount-label", children: t("dtAmountLabel") }),
		      summary.amountWan === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-rail-amount-value", "data-empty": "true", children: t("dtUnset") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dt-rail-amount-value", children: [
		        formatWan(summary.amountWan),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-rail-amount-unit", children: t("statAmountUnit") })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-rail-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "dt-rail-block-title", children: t("dtStageSection") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StageTrackVertical, { detail, t })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-rail-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "dt-rail-block-title", children: t("dtDimensionSection") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dt-rail-dims", children: DIMENSIONS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dim-mini", "data-present": present[key], "data-origin": DIMENSION_ORIGIN[key], title: `${t(DIMENSION_TEXT[key])}: ${present[key] ? resolved[key] : t("dimMissing")}`, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dim-mini-mark", "aria-hidden": "true", children: present[key] ? "\u2713" : "\u2717" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dim-mini-label", children: t(DIMENSION_TEXT[key]) })
		      ] }, key)) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-rail-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "dt-rail-block-title", children: t("dtGapSection") }),
		      gaps.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dt-rail-empty", children: t("dtNoGaps") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "dt-rail-gaps", children: gaps.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: "dt-rail-gap", "data-level": item.level, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dt-rail-gap-no", children: [
		          "R",
		          item.ruleNo
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-rail-gap-title", children: format(t(`gap.${item.rule}.title`), { ...item.params ?? {} }) })
		      ] }, item.rule)) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-rail-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "dt-rail-block-title", children: t("sectionIdentity") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-rail-meta", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RailMeta, { label: t("dtOwnerLabel"), value: summary.owner, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RailMeta, { label: t("dtTechOwnerLabel"), value: summary.techOwner, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RailMeta, { label: t("dtSalesLabel"), value: detail.sales, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RailMeta, { label: t("dtSponsorLabel"), value: detail.execSponsor, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RailMeta, { label: t("type"), value: summary.pocType, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RailMeta, { label: t("dtStageSinceLabel"), value: summary.stageSince === null ? "" : `${formatDate(summary.stageSince, locale)}${summary.daysInStage === null ? "" : ` \xB7 ${format(t("daysInStage"), { days: summary.daysInStage })}`}`, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RailMeta, { label: t("dtPriorityLabel"), value: summary.priority, t })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-rail-nav", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "btn btn-small", disabled: onPrev === null, onClick: onPrev ?? void 0, children: [
		        "\u2190 ",
		        t("dtPrevProject")
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dt-rail-position", children: format(t("dtPosition"), { index: position.index, total: position.total }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "btn btn-small", disabled: onNext === null, onClick: onNext ?? void 0, children: [
		        t("dtNextProject"),
		        " \u2192"
		      ] })
		    ] })
		  ] });
		}
		function ProgressItem({ entry, index, t, locale }) {
		  const tone = recognitionTone(entry.customer.recognition);
		  const ratio = completionRatio(entry.completion);
		  const hasNext = entry.next.goal !== "" || entry.next.owner !== "" || entry.next.deadline !== "";
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: "prog-item", "data-tone": tone, "data-latest": index === 0, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "prog-gutter", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-node", "data-tone": tone }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("article", { className: "prog-card", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "prog-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("time", { className: "prog-date", dateTime: entry.date, children: formatDate(entry.date, locale) || "\u2014" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-type", children: entry.type === "" ? t("progressTypeUnset") : entry.type }),
		        entry.seq === null ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-seq", children: format(t("dtProgressSeq"), { seq: entry.seq }) }),
		        ratio === null ? entry.completion === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "prog-chip", children: [
		          t("dtProgressCompletion"),
		          " ",
		          entry.completion
		        ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "prog-meter", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-meter-label", children: t("dtProgressCompletion") }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(InlineMeter, { value: ratio, max: 1, tone: ratio >= 1 ? "green" : "blue" }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-meter-value", children: entry.completion })
		        ] })
		      ] }),
		      entry.goal === "" && entry.actual === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "prog-pair", children: [
		        entry.goal === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "prog-goal", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-pair-label", children: t("dtProgressGoal") }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-pair-value", children: entry.goal })
		        ] }),
		        entry.actual === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "prog-actual", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-pair-label", children: t("dtProgressActual") }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-pair-value", children: entry.actual })
		        ] })
		      ] }),
		      entry.items.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "prog-scope", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-scope-label", children: t("dtProgressScope") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "chip-row", children: entry.items.map((item, itemIndex) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chip", children: item }, `${item}:${itemIndex}`)) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "prog-evidence", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-block-label", children: t("dtProgressEvidence") }),
		        entry.evidence.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-missing", children: t("dtProgressEvidenceNone") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "chip-row", children: entry.evidence.map((item, itemIndex) => {
		          const label = `${item.type === "" ? "" : `${item.type} \xB7 `}${item.title === "" ? t("emptyField") : item.title}`;
		          return item.link === "" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chip", children: label }, `${item.title}:${itemIndex}`) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("a", { className: "chip prog-evidence-link", href: item.link, target: "_blank", rel: "noreferrer", title: item.link, children: [
		            label,
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-external", "aria-hidden": "true", children: "\u2197" })
		          ] }, `${item.title}:${itemIndex}`);
		        }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "prog-customer", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-block-label", children: t("dtProgressCustomer") }),
		        entry.customer.syncedWith === "" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-missing", children: t("dtProgressCustomerNone") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chip", children: entry.customer.syncedWith }),
		        entry.customer.recognition === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: `status-pill tone-${tone}`, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "status-dot" }),
		          entry.customer.recognition
		        ] }),
		        entry.gate3_1 === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "chip", children: [
		          t("gate3_1Label"),
		          "\uFF1A",
		          entry.gate3_1
		        ] }),
		        entry.gate3_2 === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "chip", children: [
		          t("gate3_2Label"),
		          "\uFF1A",
		          entry.gate3_2
		        ] })
		      ] }),
		      entry.customer.feedback === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "prog-feedback", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-block-label", children: t("dtProgressFeedback") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-feedback-copy prose", children: entry.customer.feedback })
		      ] }),
		      hasNext ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "prog-next", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-next-label", children: t("dtProgressNext") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "prog-next-body", children: [
		          entry.next.goal === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-next-goal", children: entry.next.goal }),
		          entry.next.owner === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "chip", children: [
		            "@ ",
		            entry.next.owner
		          ] }),
		          entry.next.deadline === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "chip", children: [
		            t("dtProgressDeadline"),
		            " ",
		            formatDate(entry.next.deadline, locale)
		          ] })
		        ] })
		      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "prog-next prog-next-empty", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "prog-missing", children: t("dtProgressNextNone") }) })
		    ] })
		  ] });
		}
		function ProgressStream({ detail, t, locale }) {
		  const ordered = [...detail.progress].sort((left, right) => {
		    if (left.date !== right.date) return right.date.localeCompare(left.date);
		    return (right.seq ?? 0) - (left.seq ?? 0);
		  });
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Section, { title: t("dtProgressTitle"), kicker: format(t("dtProgressCount"), { count: ordered.length }), children: ordered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsec-empty", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: "dsec-empty-title", children: t("dtProgressEmptyTitle") }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dsec-empty-copy", children: t("dtProgressEmptyCopy") })
		  ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ol", { className: "prog-stream", children: ordered.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ProgressItem, { entry, index, t, locale }, `${entry.date}:${entry.seq ?? index}`)) }) });
		}
		function DimensionGrid({ detail, t }) {
		  const values = {
		    achievement: detail.outcome.achievement,
		    evidence: detail.outcome.ourProof,
		    recognition: detail.outcome.customerRecognition,
		    nextMilestone: detail.outcome.milestone
		  };
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Section, { title: t("dtDimensionSection"), kicker: format(t("dimensionCount"), { count: detail.summary.dimensionCount }), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dim-grid-detail", children: DIMENSIONS.map((key) => {
		    const present = values[key] !== "";
		    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dim-card", "data-present": present, "data-origin": DIMENSION_ORIGIN[key], children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dim-card-label", children: t(DIMENSION_TEXT[key]) }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dim-card-mark", "aria-hidden": "true", children: present ? "\u2713" : "\u2717" }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dim-card-value", children: present ? values[key] : t("dimMissing") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dim-card-origin", children: DIMENSION_ORIGIN[key] === "auto" ? t("dtDimensionAuto") : t("dtDimensionManual") }),
		      present ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dim-card-reason", children: t("dtDimensionEmptyReason") })
		    ] }, key);
		  }) }) });
		}
		function Gate0Meter({ detail, t }) {
		  const checklist = detail.gate0.checklist;
		  const presentCount = checklist.filter((item) => item.present).length;
		  const review = detail.gate0.conclusion === "" ? t("dtG0Unreviewed") : format(t("dtG0ReviewLine"), {
		    reviewer: detail.gate0.reviewer === "" ? t("dtUnset") : detail.gate0.reviewer,
		    date: detail.gate0.reviewedAt === "" ? t("dtUnset") : detail.gate0.reviewedAt,
		    conclusion: detail.gate0.conclusion
		  });
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Section, { title: t("dtG0Title"), kicker: format(t("dtG0FiveRequired"), { present: presentCount }), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "g0-meter", role: "group", "aria-label": t("dtG0Title"), children: checklist.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "g0-cell", "data-present": item.present, title: `${t(G0_LABEL[item.field] ?? item.field)}: ${item.present ? t("dtG0Present") : t("dtG0Missing")}`, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "g0-cell-mark", "aria-hidden": "true", children: item.present ? "\u2713" : "\u2717" }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "g0-cell-label", children: t(G0_LABEL[item.field] ?? item.field) })
		    ] }, item.field)) }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "g0-fields", children: checklist.map((item) => {
		      const label = t(G0_LABEL[item.field] ?? item.field);
		      const prose = G0_PROSE.has(item.field);
		      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "g0-field", "data-present": item.present, "data-prose": prose, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "g0-field-label", children: label }),
		        item.present ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "g0-field-value prose", children: item.value }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "g0-field-missing", children: t("dtG0Missing") })
		      ] }, item.field);
		    }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "g0-foot", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "g0-review", "data-empty": detail.gate0.conclusion === "", children: review }),
		      detail.gate0.competitor === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "chip", children: [
		        t("competitor"),
		        "\uFF1A",
		        detail.gate0.competitor
		      ] })
		    ] })
		  ] });
		}
		function PlanPanels({ detail, t }) {
		  const plan = detail.plan;
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Section, { title: t("dtPlanTitle"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "plan-meta", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Prose, { label: t("dtPlanPain"), value: plan.customerPain, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Prose, { label: t("dtPlanRecognition"), value: plan.expectedRecognition, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Prose, { label: t("dtPlanEdge"), value: plan.ourEdge, t })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "plan-strip", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "plan-strip-item", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-strip-label", children: t("dtPlanWindow") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-strip-value", children: plan.timelineStart === "" && plan.timelineEnd === "" ? t("dtUnset") : `${plan.timelineStart === "" ? "\u2014" : plan.timelineStart} \u2192 ${plan.timelineEnd === "" ? "\u2014" : plan.timelineEnd}` })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "plan-strip-item", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-strip-label", children: t("dtPlanGate1") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: `status-pill tone-${plan.gate1Conclusion === "\u901A\u8FC7" ? "green" : "slate"}`, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "status-dot" }),
		          plan.gate1Conclusion === "" ? t("dtUnset") : plan.gate1Conclusion
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "plan-strip-item", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-strip-label", children: t("dtPlanGate2") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: `status-pill tone-${plan.gate2Ready === "Ready" ? "green" : plan.gate2Ready === "" ? "slate" : "amber"}`, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "status-dot" }),
		          plan.gate2Ready === "" ? t("dtUnset") : plan.gate2Ready
		        ] })
		      ] }),
		      plan.reportNodes.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "plan-strip-item", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-strip-label", children: t("dtPlanReportNodes") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chip-row", children: plan.reportNodes.map((node, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chip", children: node }, `${node}:${index}`)) })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "plan-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "plan-block-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: "plan-block-title", children: t("dtPlanCriteria") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-block-note", children: plan.criteria.length === 0 ? t("dtPlanCriteriaNone") : format(t("dtPlanCriteriaCount"), { count: plan.criteria.length }) })
		      ] }),
		      plan.criteria.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Blank, { text: t("dtPlanCriteriaNone") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { className: "plan-criteria", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: t("dtPlanCriteria") }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: t("dtPlanMetric") }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: t("dtPlanBaseline") }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: t("dtPlanTarget") })
		        ] }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tbody", { children: plan.criteria.map((criterion, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "plan-criterion-name", children: criterion.name === "" ? t("emptyField") : criterion.name }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: criterion.metric === "" ? t("emptyField") : criterion.metric }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "plan-criterion-num", children: criterion.baseline === "" ? "\u2014" : criterion.baseline }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "plan-criterion-target", children: criterion.target === "" ? "\u2014" : criterion.target })
		        ] }, `${criterion.name}:${index}`)) })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "plan-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "plan-block-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: "plan-block-title", children: t("dtPlanScenarios") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-block-note", children: plan.scenarios.length === 0 ? t("dtPlanScenariosNone") : format(t("dtPlanScenariosCount"), { count: plan.scenarios.length }) })
		      ] }),
		      plan.scenarios.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Blank, { text: t("dtPlanScenariosNone") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ol", { className: "plan-scenarios", children: plan.scenarios.map((scenario, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: "plan-scenario", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-scenario-no", children: String(index + 1).padStart(2, "0") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-scenario-text", children: scenario })
		      ] }, `${scenario}:${index}`)) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "plan-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "plan-block-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: "plan-block-title", children: t("dtPlanRisks") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-block-note", children: plan.risks.length === 0 ? t("dtPlanRisksNone") : format(t("dtPlanRisksCount"), { count: plan.risks.length }) })
		      ] }),
		      plan.risks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Blank, { text: t("dtPlanRisksNone") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "plan-risks", children: plan.risks.map((risk, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: "plan-risk", "data-tone": riskTone(risk.level), children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-risk-dot", "aria-hidden": "true" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "plan-risk-text", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-risk-name", children: risk.name === "" ? t("emptyField") : risk.name }),
		          risk.level === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "plan-risk-level", children: risk.level }),
		          risk.mitigation === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "plan-risk-mitigation", children: [
		            t("dtPlanMitigation"),
		            "\uFF1A",
		            risk.mitigation
		          ] })
		        ] })
		      ] }, `${risk.name}:${index}`)) })
		    ] })
		  ] });
		}
		function OutcomePanel({ detail, t }) {
		  const outcome = detail.outcome;
		  const hasMilestone = outcome.milestone !== "";
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Section, { title: t("dtOutcomeTitle"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "out-triple", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Prose, { label: t("dtOutcomeProved"), value: outcome.proved, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Prose, { label: t("dtOutcomeRecognized"), value: outcome.recognized, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Prose, { label: t("dtOutcomeNext"), value: outcome.nextBusiness, t })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "out-milestone", "data-present": hasMilestone, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "out-milestone-label", children: t("dtOutcomeMilestone") }),
		      hasMilestone ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "out-milestone-text", children: outcome.milestone }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "out-milestone-missing", children: t("dtOutcomeMilestoneNone") }),
		      hasMilestone ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "out-milestone-meta", children: [
		        outcome.businessOwner === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chip", children: format(t("dtOutcomeMilestoneOwner"), { owner: outcome.businessOwner }) }),
		        outcome.businessDeadline === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chip", children: format(t("dtOutcomeMilestoneDeadline"), { date: outcome.businessDeadline }) }),
		        outcome.businessStatus === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chip", children: format(t("dtOutcomeMilestoneStatus"), { status: outcome.businessStatus }) })
		      ] }) : null
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "out-meta", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Prose, { label: t("dtOutcomeProof"), value: outcome.ourProof, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Prose, { label: t("dtOutcomeRemaining"), value: outcome.remainingRisks, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Prose, { label: t("dtOutcomeOverall"), value: outcome.overall, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Prose, { label: t("dtOutcomeReviewed"), value: outcome.reviewedAt, t })
		    ] })
		  ] });
		}
		function DetailPage(props) {
		  const { detail, t, locale } = props;
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dt-page", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(IdentityRail, { props }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("main", { className: "dt-pane", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ProgressStream, { detail, t, locale }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DimensionGrid, { detail, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Gate0Meter, { detail, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PlanPanels, { detail, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(OutcomePanel, { detail, t })
		    ] })
		  ] });
		}

		// src/client/overview.tsx
		var import_react = require("react");

		// src/gap.ts
		var RULE_META = {
		  // R1: the G0 floor. Nothing downstream is trustworthy without it.
		  "R1-gate0-missing": { no: 1, level: "high", priority: 90 },
		  // R2: a large commitment decided before the gate was cleared.
		  "R2-large-amount-no-g0": { no: 2, level: "high", priority: 94 },
		  // R3: cleared the gate, then never wrote down what success means.
		  "R3-g0-passed-no-plan": { no: 3, level: "high", priority: 92 },
		  // R4–R6: focus. A pilot measuring everything measures nothing.
		  "R4-criteria-count": { no: 4, level: "medium", priority: 50 },
		  "R5-scenarios-count": { no: 5, level: "medium", priority: 48 },
		  "R6-risks-overflow": { no: 6, level: "medium", priority: 46 },
		  // R7: testing before the prerequisites are ready burns team time.
		  "R7-g2-not-ready": { no: 7, level: "high", priority: 84 },
		  // R8–R10: the proof chain, read from the newest progress entry.
		  "R8-progress-no-evidence": { no: 8, level: "high", priority: 82 },
		  "R9-evidence-no-recognition": { no: 9, level: "high", priority: 80 },
		  "R10-g3-1-without-g3-2": { no: 10, level: "high", priority: 78 },
		  // R11: it worked, and nothing followed. The highest-value gap, as the
		  // original design documented: value was created and none of it was banked.
		  "R11-no-next-milestone": { no: 11, level: "high", priority: 96 },
		  // R12: the project has not moved.
		  "R12-stage-stalled": { no: 12, level: "medium", priority: 40 }
		};

		// src/client/overview.tsx
		var import_jsx_runtime3 = require("react/jsx-runtime");
		var DIMENSION_TEXT2 = {
		  achievement: "dimAchievement",
		  evidence: "dimEvidence",
		  recognition: "dimRecognition",
		  nextMilestone: "dimNextMilestone"
		};
		function formatWan2(value) {
		  const rounded = Math.round(value * 10) / 10;
		  return rounded.toLocaleString("zh-CN", { maximumFractionDigits: 1 });
		}
		function formatDate2(value, locale) {
		  if (value === null || value === "") return "\u2014";
		  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
		  const stamp = /* @__PURE__ */ new Date(`${value}T00:00:00`);
		  if (Number.isNaN(stamp.getTime())) return value;
		  return stamp.toLocaleDateString(locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US", {
		    year: "numeric",
		    month: "2-digit",
		    day: "2-digit"
		  });
		}
		function stageLabel(t, key) {
		  if (key === "closed") return t("stageClosed");
		  if (key === "unknown") return t("stageUnknown");
		  if (STAGES.includes(key)) return t(`stage${key}`);
		  return key;
		}
		function GapBadge({ project, t }) {
		  if (project.gapCount === 0) return null;
		  if (project.highGapCount > 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pcard-badge", "data-tone": "red", children: format(t("cardGapBadgeHigh"), { count: project.highGapCount }) });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pcard-badge", "data-tone": "amber", children: format(t("cardGapBadge"), { count: project.gapCount }) });
		}
		function DimensionMarks({ project, t }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pcard-dims", role: "group", "aria-label": t("colDimensions"), children: DIMENSIONS.map((key) => {
		    const present = project.dimensions[key];
		    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "pcard-dim", "data-present": present, title: `${t(DIMENSION_TEXT2[key])}: ${present ? t("dimPresent") : t("dimMissing")}`, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pcard-dim-mark", "aria-hidden": "true", children: present ? "\u2713" : "\u2717" }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pcard-dim-label", children: t(DIMENSION_TEXT2[key]) })
		    ] }, key);
		  }) });
		}
		function ProjectCard({ project, selected, locale, t, onOpen }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
		    "div",
		    {
		      className: "pcard",
		      role: "button",
		      tabIndex: 0,
		      "data-selected": selected,
		      "data-closed": project.closed,
		      onClick: () => onOpen(project.pocId),
		      onKeyDown: (event) => {
		        if (event.key === "Enter" || event.key === " ") {
		          event.preventDefault();
		          onOpen(project.pocId);
		        }
		      },
		      children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "pcard-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "pcard-title-block", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pcard-name", children: project.name }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "pcard-id", children: [
		              project.pocId,
		              project.owner === "" ? "" : ` \xB7 ${project.owner}`
		            ] })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(GapBadge, { project, t })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "pcard-stage", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "status-pill tone-blue pcard-stage-pill", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		            project.closed ? t("stageClosed") : project.stageLabel === "" ? t("stageUnknown") : project.stageLabel
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		            StageRailMini,
		            {
		              done: project.stageDone,
		              current: project.stage,
		              closed: project.closed,
		              ariaLabel: `${t("stageTrack")} \xB7 ${project.pocId}`
		            }
		          )
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "pcard-meta", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "pcard-org", children: [
		            project.system === "" ? t("emptyField") : project.system,
		            " \xB7 ",
		            project.company === "" ? t("emptyField") : project.company
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "pcard-amount", children: [
		            project.amountWan === 0 ? "\u2014" : formatWan2(project.amountWan),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pcard-unit", children: project.amountWan === 0 ? "" : t("statAmountUnit") })
		          ] })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "pcard-progress", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pcard-progress-label", children: t("cardLatestProgress") }),
		          project.progressCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pcard-progress-copy is-muted", children: t("cardNoProgress") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pcard-progress-copy", children: project.lastProgressSummary === "" ? t("emptyField") : project.lastProgressSummary }),
		          project.progressCount === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "pcard-progress-meta", children: [
		            formatDate2(project.lastProgressDate, locale),
		            " \xB7 ",
		            format(t("cardProgressCount"), { count: project.progressCount })
		          ] })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(DimensionMarks, { project, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "pcard-foot", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pcard-since", children: project.daysInStage === null ? t("cardNoStageSince") : format(t("cardStageSince"), { days: project.daysInStage }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "pcard-open", children: [
		            t("cardOpen"),
		            " \u2192"
		          ] })
		        ] })
		      ]
		    }
		  );
		}
		function ProjectCards({ projects, selectedId, locale, t, onOpen }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pcard-grid", children: projects.map((project) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		    ProjectCard,
		    {
		      project,
		      selected: selectedId === project.pocId,
		      locale,
		      t,
		      onOpen
		    },
		    project.pocId
		  )) });
		}
		var BOARD_KEYS = ["G0", "G1", "G2", "G3", "G4", "closed", "unknown"];
		function BoardCard({ project, t, onOpen }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "pboard-card", "data-high": project.highGapCount > 0, onClick: () => onOpen(project.pocId), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pboard-card-name", children: project.name }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "pboard-card-meta", children: [
		      project.amountWan === 0 ? "\u2014" : `${formatWan2(project.amountWan)} ${t("statAmountUnit")}`,
		      project.owner === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "pboard-card-owner", children: [
		        " \xB7 ",
		        project.owner
		      ] })
		    ] }),
		    project.progressCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pboard-card-progress is-muted", children: t("cardNoProgress") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pboard-card-progress", children: project.lastProgressSummary === "" ? t("emptyField") : project.lastProgressSummary }),
		    project.highGapCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pboard-card-gap", "data-tone": "red", children: format(t("boardHighBadge"), { count: project.highGapCount }) }) : null
		  ] });
		}
		function ProjectBoard({ projects, t, onOpen }) {
		  const columns = BOARD_KEYS.map((key) => {
		    const rows = projects.filter((project) => (project.closed ? "closed" : project.stage ?? "unknown") === key);
		    return {
		      key,
		      label: stageLabel(t, key),
		      rows,
		      amount: rows.reduce((sum, project) => sum + project.amountWan, 0)
		    };
		  }).filter((column) => column.rows.length > 0 || column.key !== "closed" && column.key !== "unknown");
		  const peak = columns.reduce((highest, column) => Math.max(highest, column.rows.length), 0);
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pboard", children: columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "pboard-column", "data-empty": column.rows.length === 0, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "pboard-column-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pboard-column-label", children: column.label }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pboard-column-count", children: format(t("boardColumnCount"), { count: column.rows.length, amount: formatWan2(column.amount) }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(InlineMeter, { value: column.rows.length, max: peak, tone: column.key === "closed" || column.key === "unknown" ? "slate" : "blue" })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pboard-column-body", children: column.rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pboard-empty", children: t("boardEmptyColumn") }) : column.rows.map((project) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(BoardCard, { project, t, onOpen }, project.pocId)) })
		  ] }, column.key)) });
		}
		function SortableHead({
		  label,
		  active,
		  asc,
		  align,
		  onClick,
		  t
		}) {
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { style: align === void 0 ? void 0 : { textAlign: align }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "ptable-sort", "data-active": active, title: t("tableSortByThis"), onClick, children: [
		    label,
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "ptable-sort-arrow", "aria-hidden": "true", children: active ? asc ? "\u2191" : "\u2193" : "" })
		  ] }) });
		}
		function ProjectTable({ projects, selectedId, locale, t, sortKey, sortAsc, onSort, onOpen }) {
		  const peak = projects.reduce((highest, project) => Math.max(highest, project.amountWan), 0);
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("table", { className: "project-table ptable", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("thead", { className: "table-head", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { style: { width: "22%" }, children: t("colProject") }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { style: { width: "14%" }, children: t("colOrg") }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SortableHead, { label: t("colStage"), active: sortKey === "stage", asc: sortAsc, onClick: () => onSort("stage"), t }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SortableHead, { label: t("colAmount"), active: sortKey === "amount", asc: sortAsc, align: "right", onClick: () => onSort("amount"), t }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SortableHead, { label: t("colLatestProgress"), active: sortKey === "progress", asc: sortAsc, onClick: () => onSort("progress"), t }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { style: { width: "8%" }, children: t("colGaps") }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { style: { width: "10%", textAlign: "right" }, children: t("colAction") })
		    ] }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tbody", { children: projects.map((project) => {
		      const level = project.highGapCount > 0 ? "high" : project.gapCount > 0 ? "medium" : "none";
		      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
		        "tr",
		        {
		          className: "project-row",
		          tabIndex: 0,
		          "data-selected": selectedId === project.pocId,
		          onClick: () => onOpen(project.pocId),
		          onKeyDown: (event) => {
		            if (event.key === "Enter" || event.key === " ") {
		              event.preventDefault();
		              onOpen(project.pocId);
		            }
		          },
		          children: [
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "project-name", children: project.name }),
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "project-id", children: [
		                project.pocId,
		                project.owner === "" ? "" : ` \xB7 ${project.owner}`
		              ] })
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "project-org", children: project.system === "" ? t("emptyField") : project.system }),
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "project-id", children: project.company === "" ? t("emptyField") : project.company })
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "ptable-stage", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "status-pill tone-blue", children: [
		                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		                project.closed ? t("stageClosed") : project.stageLabel === "" ? t("stageUnknown") : project.stageLabel
		              ] }),
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(StageRailMini, { done: project.stageDone, current: project.stage, closed: project.closed, ariaLabel: `${t("stageTrack")} \xB7 ${project.pocId}` })
		            ] }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "ptable-amount", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "amount-cell", children: project.amountWan === 0 ? "\u2014" : formatWan2(project.amountWan) }),
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(InlineMeter, { value: project.amountWan, max: peak, tone: "amber" })
		            ] }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: project.progressCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "project-meta is-muted", children: t("cardNoProgress") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "progress-summary", children: project.lastProgressSummary === "" ? t("emptyField") : project.lastProgressSummary }),
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "project-id", children: format(t("tableProgressCell"), { date: formatDate2(project.lastProgressDate, locale), count: project.progressCount }) })
		            ] }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "gap-cell", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "gap-count", "data-level": level, children: project.gapCount === 0 ? "\u2014" : project.gapCount }),
		              project.highGapCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "project-meta", children: [
		                project.highGapCount,
		                "!"
		              ] }) : null
		            ] }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "row-actions", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "btn btn-small", onClick: (event) => {
		              event.stopPropagation();
		              onOpen(project.pocId);
		            }, children: t("detail") }) }) })
		          ]
		        },
		        project.pocId
		      );
		    }) })
		  ] });
		}
		function PendingGap({ item, t, onOpen }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "pending-gap", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pending-gap-copy", children: format(t(`gap.${item.rule}.copy`), {
		      ...item.params ?? {},
		      // -1 is the Host's sentinel for "no timeline record at all", which is
		      // not the same thing as "not refreshed yet".
		      days: item.params?.days === -1 ? t("noTimeline") : String(item.params?.days ?? "")
		    }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pending-gap-project", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "pending-link", onClick: () => onOpen(item.pocId), children: item.pocName === "" ? item.pocId : `${item.pocName} \xB7 ${item.pocId}` }) })
		  ] });
		}
		function PendingRail({ gaps, t, onOpen }) {
		  const groups = /* @__PURE__ */ new Map();
		  for (const item of gaps) {
		    const existing = groups.get(item.rule);
		    if (existing === void 0) groups.set(item.rule, [item]);
		    else existing.push(item);
		  }
		  const ordered = [...groups.entries()].sort((left, right) => {
		    const leftMeta = RULE_META[left[0]];
		    const rightMeta = RULE_META[right[0]];
		    return rightMeta.priority - leftMeta.priority || leftMeta.no - rightMeta.no;
		  });
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pending", children: ordered.map(([rule, items]) => {
		    const meta = RULE_META[rule];
		    const visible = items.slice(0, 3);
		    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "pending-group", "data-level": meta.level, "aria-label": format(t(`gap.${rule}.title`), { ...items[0]?.params ?? {} }), children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "pending-group-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "pending-rule-no", children: [
		          "R",
		          meta.no
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pending-rule-title", children: format(t(`gap.${rule}.title`), { ...items[0]?.params ?? {} }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pending-rule-count", children: format(t("pendingRuleCount"), { count: items.length }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "pending-group-body", children: [
		        visible.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PendingGap, { item, t, onOpen }, `${item.pocId}:${index}`)),
		        items.length > visible.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pending-more", children: format(t("pendingMoreProjects"), { count: items.length - visible.length }) }) : null
		      ] })
		    ] }, rule);
		  }) });
		}
		function PortfolioBand({ props }) {
		  const { analysis, filters, t, onFilter, onOpen } = props;
		  const totalProjects = analysis.stages.reduce((sum, bucket) => sum + bucket.count, 0);
		  const totalAmount = analysis.stages.reduce((sum, bucket) => sum + bucket.amountWan, 0);
		  const stageColumns = analysis.stages.filter((bucket) => bucket.key !== "unknown").map((bucket) => ({
		    key: bucket.key,
		    label: stageLabel(t, bucket.key),
		    value: bucket.count,
		    secondary: bucket.amountWan,
		    tone: bucket.highGapCount > 0 ? "red" : "blue",
		    active: filters.stage === bucket.key
		  }));
		  const orgRows = analysis.orgs.slice(0, 3).map((row) => ({
		    key: `${row.system}\0${row.company}`,
		    label: row.company === "" ? row.system === "" ? t("dtUnset") : row.system : row.company,
		    ...row.system === "" ? {} : { note: row.system },
		    value: row.amountWan,
		    display: format(t("orgAmountLabel"), { amount: formatWan2(row.amountWan) }),
		    tone: row.highGapCount > 0 ? "red" : "blue"
		  }));
		  const typeSlices = analysis.types.map((row) => ({
		    key: row.pocType === "" ? "\0" : row.pocType,
		    label: row.pocType === "" ? t("dtUnset") : row.pocType,
		    value: row.count
		  }));
		  const amountRows = analysis.topAmounts.map((row) => ({
		    key: row.pocId,
		    label: row.pocName === "" ? row.pocId : row.pocName,
		    note: row.pocId,
		    value: row.amountWan,
		    display: format(t("amountShareLabel"), { share: Math.round(row.share * 100) }),
		    tone: "amber"
		  }));
		  const representative = /* @__PURE__ */ new Map();
		  for (const item of props.gaps) {
		    if (!representative.has(item.rule)) representative.set(item.rule, item);
		  }
		  const gapRows = analysis.gapRules.slice(0, 4).map((row) => ({
		    key: row.rule,
		    label: `R${row.ruleNo} ${format(t(`gap.${row.rule}.title`), { ...representative.get(row.rule)?.params ?? {} })}`,
		    value: row.count,
		    display: format(t("gapRuleFiresLabel"), { count: row.count }),
		    tone: row.level === "high" ? "red" : "amber"
		  }));
		  const [collapsed, setCollapsed] = (0, import_react.useState)(false);
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "pf-band", "data-collapsed": collapsed, "aria-label": t("bandTitle"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "pf-band-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "pf-band-title", children: t("bandTitle") }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "pf-band-note", children: format(t("bandNote"), { count: totalProjects, amount: formatWan2(totalAmount) }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		        "button",
		        {
		          type: "button",
		          className: "pf-collapse",
		          "aria-expanded": !collapsed,
		          onClick: () => setCollapsed((value) => !value),
		          children: collapsed ? `${t("pendingExpand")} \u25BE` : `${t("pendingCollapse")} \u25B4`
		        }
		      )
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "pf-grid", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block pf-block", "data-span": "4", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "chart-block-title", children: t("bandStages") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chart-block-note", children: t("bandStagesNote") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		          ColumnChart,
		          {
		            columns: stageColumns,
		            ariaLabel: t("bandStages"),
		            summary: analysis.stages.map((bucket) => `${stageLabel(t, bucket.key)} ${bucket.count}`).join(", "),
		            onSelect: (key) => onFilter({ stage: filters.stage === key ? null : key }),
		            activeKey: filters.stage,
		            height: 72
		          }
		        ),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		          Legend,
		          {
		            items: analysis.stages.filter((bucket) => bucket.count > 0).map((bucket) => ({ key: bucket.key, label: stageLabel(t, bucket.key), tone: "blue", value: format(t("stageAmountLabel"), { amount: formatWan2(bucket.amountWan) }) }))
		          }
		        )
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block pf-block", "data-span": "4", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "chart-block-title", children: t("bandDims") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chart-block-note", children: t("bandDimsNote") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pf-radials", children: analysis.dimensions.map((row) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		          RadialMeter,
		          {
		            ratio: row.ratio,
		            label: t(DIMENSION_TEXT2[row.key]),
		            value: format(t("coveragePresent"), { present: row.present, total: row.present + row.missing }),
		            ...row.missing > 0 ? { note: format(t("coverageMissingNote"), { count: row.missing }) } : {},
		            tone: dimensionTone(row.key),
		            ariaLabel: `${t(DIMENSION_TEXT2[row.key])} ${row.present}/${row.present + row.missing}`
		          },
		          row.key
		        )) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block pf-block", "data-span": "2", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "chart-block-title", children: t("bandOrgs") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chart-block-note", children: t("bandOrgsNote") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		          BarList,
		          {
		            rows: orgRows,
		            ariaLabel: t("bandOrgs"),
		            summary: orgRows.map((row) => `${row.label} ${row.value}`).join(", "),
		            onSelect: (key) => {
		              const [system = "", company = ""] = key.split("\0");
		              onFilter({ system: system === "" ? null : system, company: company === "" ? null : company });
		            }
		          }
		        )
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block pf-block", "data-span": "2", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "chart-block-title", children: t("bandTypes") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chart-block-note", children: t("bandTypesNote") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		          Donut,
		          {
		            slices: typeSlices,
		            ariaLabel: t("bandTypes"),
		            summary: typeSlices.map((slice) => `${slice.label} ${slice.value}`).join(", "),
		            centerValue: String(totalProjects),
		            centerLabel: t("colProject"),
		            onSelect: (key) => onFilter({ pocType: filters.pocType === key ? null : key === "\0" ? null : key }),
		            activeKey: filters.pocType
		          }
		        )
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block pf-block", "data-span": "2", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "chart-block-title", children: t("bandAmounts") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chart-block-note", children: t("bandAmountsNote") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		          BarList,
		          {
		            rows: amountRows,
		            ariaLabel: t("bandAmounts"),
		            summary: amountRows.map((row) => `${row.label} ${row.value}`).join(", "),
		            onSelect: (pocId) => onOpen(pocId)
		          }
		        ),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "pf-note", "data-tone": analysis.concentration > 0.33 ? "amber" : "muted", title: analysis.concentration > 0.33 ? t("concentrationHigh") : t("concentrationNormal"), children: [
		          format(t("amountConcentrationLabel"), { share: Math.round(analysis.concentration * 100) }),
		          analysis.amountMissing > 0 ? ` \xB7 ${format(t("amountMissingLabel"), { count: analysis.amountMissing })}` : null
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block pf-block", "data-span": "2", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "chart-block-title", children: t("bandGapRules") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chart-block-note", children: format(t("bandGapRulesNote"), { count: props.gaps.length }) })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		          BarList,
		          {
		            rows: gapRows,
		            ariaLabel: t("bandGapRules"),
		            summary: gapRows.map((row) => `${row.label} ${row.value}`).join(", ")
		          }
		        )
		      ] }),
		      "      "
		    ] })
		  ] });
		}
		function FilteredEmpty({ t, onClearFilters }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "empty-state", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "empty-title", children: t("filteredEmptyTitle") }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "empty-copy", children: t("filteredEmptyCopy") }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "btn", onClick: onClearFilters, children: t("filteredEmptyReset") })
		  ] });
		}
		function OverviewPage(props) {
		  const { projects, gaps, viewMode, selectedId, locale, t, filteredOut, onOpen, onClearFilters, onSort, sortKey, sortAsc } = props;
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PortfolioBand, { props }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "workspace-grid", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "primary-column", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "panel", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "panel-header", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "panel-title", children: t("tableTitle") }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "panel-kicker", children: projects.length })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "panel-body", children: filteredOut ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FilteredEmpty, { t, onClearFilters }) : viewMode === "cards" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ProjectCards, { projects, selectedId, locale, t, onOpen }) : viewMode === "board" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ProjectBoard, { projects, t, onOpen }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		            ProjectTable,
		            {
		              projects,
		              selectedId,
		              locale,
		              t,
		              sortKey,
		              sortAsc,
		              onSort: (key) => onSort(key),
		              onOpen
		            }
		          ) })
		        ] }),
		        props.snapshot.warnings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "panel", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "panel-header", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "panel-title", children: t("warningsTitle") }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "panel-kicker", children: props.snapshot.warnings.length })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "panel-body padded", children: props.snapshot.warnings.map((warning) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "gap-copy", style: { margin: "0 0 4px" }, children: [
		            "\xB7 ",
		            warning
		          ] }, warning)) })
		        ] }) : null
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "secondary-column", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "panel", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "panel-header", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "panel-title", children: t("pendingTitle") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "panel-kicker", children: format(t("pendingCount"), { count: gaps.length }) })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "panel-body", children: gaps.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "panel-body padded", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "empty-copy", style: { margin: 0 }, children: filteredOut ? t("pendingEmptyFiltered") : t("pendingEmpty") }) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PendingRail, { gaps, t, onOpen }) })
		      ] }) })
		    ] })
		  ] });
		}

		// src/client/insights.tsx
		var import_jsx_runtime4 = require("react/jsx-runtime");
		var LANE_ORDER = ["high", "medium", "low", "unset"];
		var LANE_TEXT = {
		  high: "riskHigh",
		  medium: "riskMedium",
		  low: "riskLow",
		  unset: "riskUnset"
		};
		var LANE_TONE = {
		  high: "red",
		  medium: "amber",
		  low: "green",
		  unset: "slate"
		};
		function laneOf(level) {
		  if (level === "high" || level === "medium" || level === "low") return level;
		  return "unset";
		}
		function projectLabel(name, pocId) {
		  return name === "" ? pocId : `${name} \xB7 ${pocId}`;
		}
		function formatDate3(value, locale) {
		  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value === "" ? "\u2014" : value;
		  const stamp = /* @__PURE__ */ new Date(`${value}T00:00:00`);
		  if (Number.isNaN(stamp.getTime())) return value;
		  return stamp.toLocaleDateString(locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US", {
		    year: "numeric",
		    month: "2-digit",
		    day: "2-digit"
		  });
		}
		function recognitionTone2(value) {
		  if (value === "\u8BA4\u53EF") return "green";
		  if (value === "\u90E8\u5206\u8BA4\u53EF") return "amber";
		  if (value === "\u672A\u8BA4\u53EF") return "red";
		  return "slate";
		}
		function LevelPill({ level, t }) {
		  if (level === "high") return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "status-pill tone-red", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "status-dot" }),
		    t("riskHigh")
		  ] });
		  if (level === "medium") return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "status-pill tone-amber", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "status-dot" }),
		    t("riskMedium")
		  ] });
		  if (level === "low") return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "status-pill tone-green", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "status-dot" }),
		    t("riskLow")
		  ] });
		  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "status-pill tone-slate", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "status-dot" }),
		    t("riskUnset")
		  ] });
		}
		function RiskBoardPage(props) {
		  const { board, t, onOpenProject } = props;
		  const buckets = { high: [], medium: [], low: [], unset: [] };
		  const tallies = /* @__PURE__ */ new Map();
		  for (const row of board.rows) {
		    buckets[laneOf(row.level)].push(row);
		    const existing = tallies.get(row.pocId);
		    if (existing === void 0) {
		      tallies.set(row.pocId, {
		        pocId: row.pocId,
		        pocName: row.pocName,
		        count: 1,
		        high: row.level === "high" ? 1 : 0,
		        tone: LANE_TONE[laneOf(row.level)]
		      });
		    } else {
		      existing.count += 1;
		      if (row.level === "high") {
		        existing.high += 1;
		        existing.tone = "red";
		      } else if (row.level === "medium" && existing.tone !== "red") {
		        existing.tone = "amber";
		      }
		    }
		  }
		  const lanes = LANE_ORDER.map((key) => ({
		    key,
		    label: t(LANE_TEXT[key]),
		    rows: buckets[key],
		    count: buckets[key].length,
		    tone: LANE_TONE[key]
		  }));
		  const hasRisks = board.rows.length > 0;
		  const projectRows = [...tallies.values()].sort((left, right) => right.count - left.count || left.pocName.localeCompare(right.pocName)).slice(0, 8).map((tally) => ({
		    key: tally.pocId,
		    // The bar list already prints its own value column, so the label stays the
		    // name and the id goes on the quieter second line instead of being repeated.
		    label: tally.pocName === "" ? tally.pocId : tally.pocName,
		    value: tally.count,
		    display: String(tally.count),
		    tone: tally.tone,
		    note: tally.high === 0 ? tally.pocId : `${tally.pocId} \xB7 ${t("riskHigh")} ${tally.high}`
		  }));
		  const projectPeak = projectRows.reduce((peak, row) => Math.max(peak, row.value), 0);
		  const laneNote = format(t("riskLaneNote"), {
		    high: buckets.high.length,
		    medium: buckets.medium.length,
		    low: buckets.low.length,
		    unset: buckets.unset.length
		  });
		  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "risk-board", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "risk-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "risk-head-text", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { className: "risk-head-title", children: t("risksBoardTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "risk-head-subtitle", children: t("risksSubtitle") })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "risk-back", onClick: props.onBack, children: t("back") })
		    ] }),
		    hasRisks ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "risk-figure", "aria-labelledby": "risk-figure-title", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "risk-figure-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { className: "risk-figure-title", id: "risk-figure-title", children: t("riskLaneTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "risk-figure-note", children: format(t("riskBoardNote"), { count: board.rows.length, projects: board.projectsWithRisks }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
		        SeverityBar,
		        {
		          lanes: lanes.map((lane) => ({ key: lane.key, label: lane.label, value: lane.count, tone: lane.tone })),
		          ariaLabel: t("riskLaneTitle"),
		          summary: laneNote
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "risk-caption", children: laneNote })
		    ] }) : null,
		    hasRisks && projectRows.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "risk-projects", "aria-labelledby": "risk-projects-title", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "risk-figure-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { className: "risk-figure-title", id: "risk-projects-title", children: t("riskSourceProject") }),
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "risk-figure-note", children: format(t("riskProjects"), { withRisks: board.projectsWithRisks, total: board.projectsTotal }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
		        BarList,
		        {
		          rows: projectRows,
		          ariaLabel: t("riskSourceProject"),
		          summary: projectRows.map((row) => `${row.label} ${row.value}`).join(" \xB7 "),
		          max: projectPeak
		        }
		      )
		    ] }) : null,
		    hasRisks ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "risk-lanes", children: lanes.map(
		      (lane) => lane.count === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "risk-lane", "data-level": lane.key, "aria-label": lane.label, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "risk-lane-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(LevelPill, { level: lane.key, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "risk-lane-count", children: lane.count }),
		          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "risk-lane-meter", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(InlineMeter, { value: lane.count, max: board.rows.length, tone: lane.tone }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "risk-lane-share", children: [
		            Math.round(lane.count / board.rows.length * 100),
		            "%"
		          ] })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ul", { className: "risk-rows", children: lane.rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("li", { className: "risk-row-item", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "risk-row", "data-level": laneOf(row.level), children: [
		          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "risk-row-main", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "risk-name", children: row.name === "" ? t("emptyField") : row.name }),
		            row.mitigation === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "risk-mitigation", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "risk-mitigation-label", children: t("riskMitigation") }),
		              row.mitigation
		            ] })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "risk-row-side", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
		              "button",
		              {
		                type: "button",
		                className: "risk-project",
		                onClick: () => onOpenProject(row.pocId),
		                children: [
		                  projectLabel(row.pocName, row.pocId),
		                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "risk-project-arrow", "aria-hidden": "true", children: "\u2192" })
		                ]
		              }
		            ),
		            row.gapCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "risk-gap", children: format(t("riskGapContext"), { count: row.gapCount, high: row.highGapCount }) }) : null
		          ] })
		        ] }) }, `${row.pocId}:${index}`)) })
		      ] }, lane.key)
		    ) }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "risk-empty", role: "status", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "risk-empty-mark", "aria-hidden": "true", children: "\u2014" }),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "risk-empty-copy", children: t("riskNoRisks") })
		    ] })
		  ] });
		}
		function monthOf(date) {
		  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : "";
		}
		function groupEntries(entries) {
		  const byMonth = /* @__PURE__ */ new Map();
		  for (const entry of entries) {
		    const month = monthOf(entry.date);
		    const bucket = byMonth.get(month);
		    if (bucket === void 0) byMonth.set(month, [entry]);
		    else bucket.push(entry);
		  }
		  return [...byMonth.entries()].sort((left, right) => {
		    if (left[0] === "") return 1;
		    if (right[0] === "") return -1;
		    return right[0].localeCompare(left[0]);
		  }).map(([month, group]) => ({
		    month,
		    entries: [...group].sort((left, right) => right.date.localeCompare(left.date))
		  }));
		}
		function TimelinePage(props) {
		  const { timeline, locale, t, onOpenProject } = props;
		  const groups = groupEntries(timeline.entries);
		  const hasEntries = timeline.entries.length > 0;
		  const sparkPoints = [...timeline.months].reverse();
		  const range = timeline.range === null ? null : format(t("timelineRange"), { from: formatDate3(timeline.range.from, locale), to: formatDate3(timeline.range.to, locale) });
		  const laneNote = format(t("tlLaneNote"), { count: timeline.entries.length });
		  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "tl-page", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "tl-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "tl-head-text", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { className: "tl-head-title", children: t("timelineTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "tl-head-subtitle", children: t("timelineSubtitle") })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "tl-back", onClick: props.onBack, children: t("back") })
		    ] }),
		    hasEntries ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "tl-figure", "aria-labelledby": "tl-figure-title", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "tl-figure-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { className: "tl-figure-title", id: "tl-figure-title", children: t("tlLaneTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tl-figure-note", children: range === null ? laneNote : range })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
		        Sparkbars,
		        {
		          points: sparkPoints.map((point) => ({ month: point.month, count: point.count })),
		          ariaLabel: t("tlLaneTitle"),
		          summary: laneNote
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "tl-caption", children: range === null ? laneNote : `${laneNote} \xB7 ${range}` })
		    ] }) : null,
		    timeline.silentProjects.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "tl-silent", "aria-labelledby": "tl-silent-title", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "tl-silent-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { className: "tl-silent-title", id: "tl-silent-title", children: t("tlSilentTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tl-silent-note", children: format(t("tlSilentNote"), { count: timeline.silentProjects.length }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "tl-silent-chips", children: timeline.silentProjects.map((project) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
		        "button",
		        {
		          type: "button",
		          className: "tl-chip-button",
		          onClick: () => onOpenProject(project.pocId),
		          children: projectLabel(project.pocName, project.pocId)
		        },
		        project.pocId
		      )) }),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "tl-silent-hint", children: t("timelineSilentHint") })
		    ] }) : null,
		    hasEntries ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "tl-stream", children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "tl-month-group", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "tl-month", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tl-month-label", children: group.month === "" ? t("emptyField") : group.month }),
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tl-month-count", children: format(t("timelineCount"), { count: group.entries.length }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tl-month-rule", "aria-hidden": "true" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ul", { className: "tl-entries", children: group.entries.map((entry, index) => {
		        const fields = [
		          {
		            key: "goal",
		            label: t("tlEntryGoal"),
		            value: entry.goal === "" ? t("emptyField") : entry.goal,
		            emphasis: entry.goal === "" ? "missing" : "muted"
		          },
		          {
		            key: "actual",
		            label: t("tlEntryActual"),
		            value: entry.actual === "" ? t("emptyField") : entry.actual,
		            emphasis: entry.actual === "" ? "missing" : "strong"
		          },
		          {
		            key: "evidence",
		            label: t("tlEntryEvidence"),
		            value: entry.evidence === "" ? t("timelineNoEvidence") : entry.evidence,
		            emphasis: entry.evidence === "" ? "missing" : "normal"
		          },
		          {
		            key: "customer",
		            label: t("tlEntryCustomer"),
		            value: entry.customerFeedback === "" ? t("timelineNoFeedback") : entry.customerFeedback,
		            emphasis: entry.customerFeedback === "" ? "missing" : "normal"
		          }
		        ];
		        const chips = [];
		        if (entry.completion !== "") chips.push({ key: "completion", label: t("completionLabel"), value: entry.completion });
		        if (entry.gate3_1 !== "") chips.push({ key: "gate3-1", label: t("gate3_1Label"), value: entry.gate3_1 });
		        if (entry.gate3_2 !== "") chips.push({ key: "gate3-2", label: t("gate3_2Label"), value: entry.gate3_2 });
		        if (entry.nextGoal !== "") chips.push({ key: "next", label: t("tlEntryNext"), value: entry.nextGoal });
		        if (entry.nextOwner !== "") chips.push({ key: "owner", value: `@${entry.nextOwner}` });
		        if (entry.nextDeadline !== "") chips.push({ key: "deadline", value: formatDate3(entry.nextDeadline, locale) });
		        return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { className: "tl-entry", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "tl-gutter", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tl-node", "data-tone": recognitionTone2(entry.recognition) }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: "tl-card", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "tl-card-head", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("time", { className: "tl-date", dateTime: entry.date, children: formatDate3(entry.date, locale) }),
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tl-type", children: entry.type === "" ? t("roundUnnumbered") : entry.type }),
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
		                "button",
		                {
		                  type: "button",
		                  className: "tl-project",
		                  onClick: () => onOpenProject(entry.pocId),
		                  children: projectLabel(entry.pocName, entry.pocId)
		                }
		              ),
		              entry.recognition === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: `status-pill tone-${recognitionTone2(entry.recognition)} tl-recog`, children: [
		                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "status-dot" }),
		                entry.recognition
		              ] })
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("dl", { className: "tl-fields", children: fields.map((field) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "tl-field", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("dt", { className: "tl-field-label", children: field.label }),
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("dd", { className: "tl-field-value", "data-emphasis": field.emphasis, children: field.value })
		            ] }, field.key)) }),
		            chips.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("footer", { className: "tl-chips", children: chips.map((chip) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "tl-chip", children: [
		              chip.label === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tl-chip-label", children: chip.label }),
		              chip.value
		            ] }, chip.key)) })
		          ] })
		        ] }, `${entry.pocId}:${entry.date}:${index}`);
		      }) })
		    ] }, group.month === "" ? "undated" : group.month)) }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "tl-empty", role: "status", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tl-empty-mark", "aria-hidden": "true", children: "\u2014" }),
		      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "tl-empty-copy", children: t("timelineEmpty") })
		    ] })
		  ] });
		}

		// src/client/css/base.ts
		var BASE_CSS = `
		.wd-shell {
		  /* Brand + status palette (DESIGN.md), with soft tints derived from each. */
		  --wd-primary: #2864E8;
		  --wd-primary-deep: #1B4FC2;
		  --wd-primary-soft: rgba(40, 100, 232, .09);
		  --wd-primary-ring: rgba(40, 100, 232, .26);
		  --wd-text: #192638;
		  --wd-bg: #F5F7FB;
		  --wd-border: #E6EBF2;
		  --wd-green: #218568;
		  --wd-amber: #B77919;
		  --wd-red: #C0392B;
		  --wd-slate: #5A6A80;
		  --wd-green-soft: rgba(33, 133, 104, .10);
		  --wd-amber-soft: rgba(183, 121, 25, .11);
		  --wd-red-soft: rgba(192, 57, 43, .10);
		  --wd-slate-soft: rgba(90, 106, 128, .10);

		  /* Surface ramp: canvas \u2192 card \u2192 inset. */
		  --wd-canvas: #F5F7FB;
		  --wd-surface: #FFFFFF;
		  --wd-inset: #F7F9FC;
		  --wd-hairline: #E6EBF2;

		  /* One shadow ramp; three steps is enough for any depth in this UI. */
		  --wd-shadow-1: 0 1px 2px rgba(20, 32, 52, .05);
		  --wd-shadow-2: 0 2px 6px rgba(20, 32, 52, .07), 0 1px 2px rgba(20, 32, 52, .04);
		  --wd-shadow-3: 0 10px 30px rgba(20, 32, 52, .12), 0 2px 8px rgba(20, 32, 52, .06);

		  height: 100%;
		  display: flex;
		  flex-direction: column;
		  overflow: hidden;
		  background: var(--wd-canvas);
		  color: var(--wd-text);
		  font-family: 'Avenir Next', 'PingFang SC', system-ui, -apple-system, sans-serif;
		  font-size: 13px;
		  line-height: 20px;
		  -webkit-font-smoothing: antialiased;
		}
		body[data-ds-dark-theme] .wd-shell {
		  --wd-text: #E8EDF5;
		  --wd-bg: #14181F;
		  --wd-border: #2A3341;
		  --wd-green: #4FC59B;
		  --wd-amber: #E0A94A;
		  --wd-red: #F07A6B;
		  --wd-slate: #97A6BA;
		  --wd-primary: #6E9BFF;
		  --wd-primary-deep: #8DB0FF;
		  --wd-primary-soft: rgba(110, 155, 255, .14);
		  --wd-primary-ring: rgba(110, 155, 255, .32);
		  --wd-green-soft: rgba(79, 197, 155, .14);
		  --wd-amber-soft: rgba(224, 169, 74, .16);
		  --wd-red-soft: rgba(240, 122, 107, .14);
		  --wd-slate-soft: rgba(151, 166, 186, .14);
		  --wd-canvas: #14181F;
		  --wd-surface: #1B2029;
		  --wd-inset: #222834;
		  --wd-hairline: #2A3341;
		  --wd-shadow-1: 0 1px 2px rgba(0, 0, 0, .28);
		  --wd-shadow-2: 0 2px 8px rgba(0, 0, 0, .34), 0 1px 2px rgba(0, 0, 0, .24);
		  --wd-shadow-3: 0 12px 34px rgba(0, 0, 0, .48), 0 2px 8px rgba(0, 0, 0, .3);
		}
		.wd-shell *, .wd-shell *::before, .wd-shell *::after { box-sizing: border-box; }
		.wd-shell button, .wd-shell input, .wd-shell select { font: inherit; color: inherit; }
		.wd-shell:focus { outline: none; }

		/* ---------- shell: rail + canvas ---------- */
		.wd-shell .page { flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }

		.wd-shell .module-rail {
		  flex: 0 0 auto;
		  display: flex; align-items: center; gap: 6px;
		  padding: 10px 32px 0;
		}
		.wd-shell .module-tab {
		  display: inline-flex; align-items: center; gap: 7px;
		  height: 30px; padding: 0 12px;
		  border: 1px solid transparent; border-radius: 8px 8px 0 0;
		  background: transparent; color: var(--dsw-alias-label-secondary);
		  cursor: pointer; font-size: 12.5px; font-weight: 500;
		  border-bottom: 0; position: relative; top: 1px;
		}
		.wd-shell .module-tab[data-active="true"] {
		  background: var(--wd-surface); color: var(--wd-text);
		  border-color: var(--wd-hairline); font-weight: 600;
		}
		.wd-shell .module-tab:not([data-active="true"]):hover { background: var(--wd-primary-soft); color: var(--wd-text); }
		.wd-shell .module-tab-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--wd-primary); flex: none; }
		.wd-shell .module-tab[data-active="false"] .module-tab-dot { background: var(--wd-slate); opacity: .55; }
		.wd-shell .module-rail-hint { margin-left: auto; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }

		/* ---------- page header ---------- */
		.wd-shell .page-header {
		  flex: 0 0 auto;
		  display: flex; align-items: flex-start; gap: 16px;
		  padding: 14px 28px 12px;
		  background: var(--wd-surface);
		  border: 1px solid var(--wd-hairline);
		  box-shadow: var(--wd-shadow-1);
		  position: relative; z-index: 2;
		}
		.wd-shell .page-header-text { flex: 1 1 auto; min-width: 0; }
		.wd-shell .page-eyebrow {
		  display: flex; align-items: center; gap: 6px;
		  font-size: 11px; line-height: 16px; letter-spacing: .06em;
		  text-transform: uppercase; color: var(--dsw-alias-label-tertiary);
		  margin: 0 0 3px;
		}
		.wd-shell .page-title {
		  margin: 0; font-size: 19px; line-height: 25px; font-weight: 650;
		  letter-spacing: -.01em; display: flex; align-items: center; gap: 10px;
		}
		.wd-shell .page-subtitle { margin: 2px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
		.wd-shell .page-source {
		  margin: 4px 0 0; font-size: 10.5px; line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		  display: flex; gap: 7px; flex-wrap: wrap; align-items: center;
		}
		.wd-shell .page-source code {
		  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px;
		  padding: 2px 7px; border-radius: 5px;
		  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
		}
		.wd-shell .header-actions { flex: none; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
		.wd-shell .page-body {
		  flex: 1 1 auto; overflow: auto; overscroll-behavior: contain;
		  padding: 16px 28px 36px;
		}
		.wd-shell .detail-body {
		  flex: 1 1 auto; overflow: auto; overscroll-behavior: contain;
		  padding: 0;
		}
		.wd-shell .page-footer {
		  flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
		  padding: 8px 32px; min-height: 32px;
		  border-top: 1px solid var(--wd-hairline);
		  background: var(--wd-surface);
		  font-size: 11.5px; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .page-footer .spacer { flex: 1 1 auto; }

		/* ---------- search (inside the toolbar) ---------- */
		.wd-shell .search-box {
		  position: relative; display: flex; align-items: center;
		  width: min(300px, 100%); flex: 0 1 300px;
		  height: 28px; padding: 0 9px 0 27px;
		  border: 1px solid var(--wd-hairline); border-radius: 9px;
		  background: var(--wd-inset);
		  transition: border-color .13s ease, background .13s ease, box-shadow .13s ease;
		}
		.wd-shell .search-box:focus-within {
		  border-color: var(--wd-primary); background: var(--wd-surface);
		  box-shadow: 0 0 0 3px var(--wd-primary-soft);
		}
		.wd-shell .search-glyph {
		  position: absolute; left: 9px; top: 50%; transform: translateY(-50%);
		  font-size: 14px; line-height: 1; color: var(--dsw-alias-label-tertiary);
		  pointer-events: none;
		}
		.wd-shell .search-input {
		  flex: 1 1 auto; min-width: 0; height: 100%;
		  border: 0; background: transparent; outline: none;
		  font-size: 12.5px;
		}
		.wd-shell .search-input::placeholder { color: var(--dsw-alias-label-tertiary); }
		.wd-shell .search-input::-webkit-search-cancel-button { display: none; }
		.wd-shell .search-clear {
		  flex: none; width: 18px; height: 18px; border-radius: 50%;
		  border: 0; background: var(--wd-slate-soft); color: var(--dsw-alias-label-secondary);
		  font-size: 12px; line-height: 1; cursor: pointer;
		  display: flex; align-items: center; justify-content: center;
		}
		.wd-shell .search-clear:hover { background: var(--wd-primary-soft); color: var(--wd-primary); }
		.wd-shell .footer-hint { font-size: 10px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; }

		/* ---------- toolbar ---------- */
		.wd-shell .toolbar {
		  flex: 0 0 auto;
		  display: flex; flex-direction: column; gap: 6px;
		  padding: 8px 28px 9px;
		  background: var(--wd-surface);
		  border-bottom: 1px solid var(--wd-hairline);
		  box-shadow: var(--wd-shadow-1);
		  position: relative; z-index: 1;
		}
		.wd-shell .toolbar-row { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; min-width: 0; }
		/* The filter strip is ONE scrolling line. Wrapping it onto three lines cost the
		   project list most of the first screen, which is the opposite of the point. */
		.wd-shell .toolbar-row-filters {
		  gap: 12px; overflow-x: auto; overscroll-behavior-x: contain;
		  padding-bottom: 2px; scrollbar-width: thin;
		}
		.wd-shell .toolbar-row-filters .toolbar-group { flex: none; }
		.wd-shell .toolbar-group { display: flex; align-items: center; gap: 7px; min-width: 0; }
		.wd-shell .toolbar-group-label {
		  flex: none; font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase;
		  color: var(--dsw-alias-label-tertiary); font-weight: 600;
		}
		.wd-shell .chip-scroll { display: flex; align-items: center; gap: 5px; flex-wrap: nowrap; min-width: 0; }
		.wd-shell .filter-chip {
		  display: inline-flex; align-items: center; gap: 5px;
		  height: 24px; padding: 0 9px;
		  border: 1px solid var(--wd-hairline); border-radius: 20px;
		  background: var(--wd-surface); color: var(--dsw-alias-label-secondary);
		  font-size: 11.5px; cursor: pointer; white-space: nowrap;
		  transition: background .12s ease, border-color .12s ease, color .12s ease;
		}
		.wd-shell .filter-chip:hover:not([disabled]) { background: var(--wd-inset); color: var(--wd-text); }
		.wd-shell .filter-chip[data-active="true"] {
		  background: var(--wd-primary-soft); border-color: var(--wd-primary);
		  color: var(--wd-primary); font-weight: 600;
		}
		.wd-shell .filter-chip[disabled] { opacity: .4; cursor: default; }
		.wd-shell .filter-chip-count {
		  font-size: 10px; font-variant-numeric: tabular-nums;
		  color: var(--dsw-alias-label-tertiary); font-weight: 500;
		}
		.wd-shell .filter-chip[data-active="true"] .filter-chip-count { color: var(--wd-primary); }
		.wd-shell .view-switch {
		  display: inline-flex; align-items: center; padding: 2px;
		  border: 1px solid var(--wd-hairline); border-radius: 9px;
		  background: var(--wd-inset); gap: 2px;
		}
		.wd-shell .view-switch-btn {
		  height: 24px; padding: 0 11px; border: 0; border-radius: 7px;
		  background: transparent; color: var(--dsw-alias-label-secondary);
		  font-size: 11.5px; cursor: pointer; white-space: nowrap;
		  transition: background .12s ease, color .12s ease, box-shadow .12s ease;
		}
		.wd-shell .view-switch-btn:hover:not([data-active="true"]) { color: var(--wd-text); }
		.wd-shell .view-switch-btn[data-active="true"] {
		  background: var(--wd-surface); color: var(--wd-text); font-weight: 600;
		  box-shadow: var(--wd-shadow-1);
		}
		.wd-shell .sort-switch { display: inline-flex; align-items: center; gap: 4px; }
		.wd-shell .sort-select {
		  height: 26px; padding: 0 8px; border-radius: 7px;
		  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
		  color: var(--dsw-alias-label-secondary); font-size: 11.5px; cursor: pointer;
		}
		.wd-shell .sort-select:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: 1px; }
		.wd-shell .toolbar-result { margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

		/* ---------- buttons ---------- */
		.wd-shell .btn {
		  height: 30px; padding: 0 12px;
		  display: inline-flex; align-items: center; gap: 6px;
		  border-radius: 8px; border: 1px solid var(--wd-hairline);
		  background: var(--wd-surface); color: var(--dsw-alias-label-secondary);
		  cursor: pointer; white-space: nowrap; font-size: 12.5px;
		  transition: background .13s ease, border-color .13s ease, box-shadow .13s ease, transform .06s ease;
		  box-shadow: var(--wd-shadow-1);
		}
		.wd-shell .btn:hover:not([disabled]) {
		  background: var(--wd-inset); color: var(--wd-text);
		  border-color: var(--dsw-alias-border-l2); box-shadow: var(--wd-shadow-2);
		}
		.wd-shell .btn:active:not([disabled]) { transform: translateY(1px); box-shadow: var(--wd-shadow-1); }
		.wd-shell .btn:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: 2px; }
		.wd-shell .btn[disabled] { opacity: .5; cursor: default; box-shadow: none; }
		.wd-shell .btn-primary {
		  background: linear-gradient(180deg, var(--wd-primary) 0%, var(--wd-primary-deep) 100%);
		  border-color: transparent; color: #fff; font-weight: 550;
		  box-shadow: 0 1px 2px rgba(40, 100, 232, .3), 0 4px 12px rgba(40, 100, 232, .18);
		}
		.wd-shell .btn-primary:hover:not([disabled]) {
		  background: linear-gradient(180deg, var(--wd-primary) 0%, var(--wd-primary-deep) 100%);
		  color: #fff; filter: brightness(1.07);
		  box-shadow: 0 2px 4px rgba(40, 100, 232, .32), 0 8px 20px rgba(40, 100, 232, .22);
		}
		.wd-shell .btn-ghost { border-color: transparent; background: transparent; box-shadow: none; }
		.wd-shell .btn-ghost:hover:not([disabled]) { background: var(--wd-inset); box-shadow: none; }
		.wd-shell .btn-small { height: 25px; padding: 0 9px; font-size: 11.5px; border-radius: 7px; }
		.wd-shell .btn-icon { width: 26px; padding: 0; justify-content: center; font-size: 12px; }

		/* ---------- shared atoms ---------- */
		.wd-shell .chip {
		  display: inline-flex; align-items: center; gap: 4px;
		  padding: 2px 9px; border-radius: 20px; font-size: 11.5px; line-height: 18px;
		  background: var(--wd-inset); color: var(--dsw-alias-label-secondary);
		  border: 1px solid var(--wd-hairline);
		}
		.wd-shell .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
		.wd-shell .chip-button { border: 0; cursor: pointer; font-family: inherit; }
		.wd-shell .chip-button:hover { background: var(--wd-primary-soft); color: var(--wd-primary); }
		.wd-shell .status-pill {
		  display: inline-flex; align-items: center; gap: 5px;
		  height: 21px; padding: 0 9px; border-radius: 20px;
		  font-size: 11px; font-weight: 550; white-space: nowrap;
		  background: var(--wd-slate-soft); color: var(--dsw-alias-label-secondary);
		}
		.wd-shell .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--wd-slate); flex: none; }
		.wd-shell .tone-blue { background: var(--wd-primary-soft); color: var(--wd-primary); }
		.wd-shell .tone-blue .status-dot { background: var(--wd-primary); }
		.wd-shell .tone-green { background: var(--wd-green-soft); color: var(--wd-green); }
		.wd-shell .tone-green .status-dot { background: var(--wd-green); }
		.wd-shell .tone-amber { background: var(--wd-amber-soft); color: var(--wd-amber); }
		.wd-shell .tone-amber .status-dot { background: var(--wd-amber); }
		.wd-shell .tone-red { background: var(--wd-red-soft); color: var(--wd-red); }
		.wd-shell .tone-red .status-dot { background: var(--wd-red); }
		.wd-shell .tone-slate { background: var(--wd-slate-soft); color: var(--wd-slate); }
		.wd-shell .tone-slate .status-dot { background: var(--wd-slate); }
		.wd-shell .is-muted { color: var(--dsw-alias-label-tertiary); font-style: italic; }
		.wd-shell .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .prose { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 19px; color: var(--dsw-alias-label-secondary); }

		/* ---------- empty / failure ---------- */
		.wd-shell .empty-state {
		  margin: 0 auto; max-width: 440px; padding: 56px 24px;
		  text-align: center; display: flex; flex-direction: column; align-items: center; gap: 7px;
		}
		.wd-shell .empty-icon {
		  width: 76px; height: 76px; border-radius: 18px;
		  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
		  display: flex; align-items: center; justify-content: center;
		  color: var(--dsw-alias-label-tertiary); margin-bottom: 10px;
		  box-shadow: var(--wd-shadow-2);
		}
		.wd-shell .empty-title { margin: 0; font-size: 17px; line-height: 24px; font-weight: 650; }
		.wd-shell .empty-copy { margin: 0 0 12px; font-size: 12.5px; line-height: 19px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
		.wd-shell .empty-meta { margin-top: 16px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
		.wd-shell .failure {
		  border: 1px solid var(--wd-red-soft); border-radius: 10px;
		  background: var(--wd-red-soft); padding: 13px 15px;
		  display: flex; align-items: flex-start; gap: 11px;
		  border-left: 3px solid var(--wd-red);
		}
		.wd-shell .failure-text { min-width: 0; flex: 1 1 auto; }
		.wd-shell .failure-title { font-size: 13px; line-height: 19px; font-weight: 650; color: var(--wd-red); }
		.wd-shell .failure-reason { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
		.wd-shell .spinner {
		  display: inline-block; width: 12px; height: 12px;
		  border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%;
		  animation: wd-spin .9s linear infinite; opacity: .8;
		}
		@keyframes wd-spin { to { transform: rotate(360deg); } }

		/* ---------- settings modal ---------- */
		.wd-shell .modal-overlay {
		  position: fixed; inset: 0; z-index: 40;
		  display: flex; align-items: center; justify-content: center; padding: 24px;
		  background: rgba(12, 18, 28, .46);
		  backdrop-filter: blur(2px);
		}
		.wd-shell .modal {
		  width: min(452px, 100%); max-height: 86vh;
		  display: flex; flex-direction: column;
		  border-radius: 14px; border: 1px solid var(--dsw-alias-border-l2);
		  background: var(--wd-surface);
		  box-shadow: var(--wd-shadow-3);
		  overflow: hidden;
		}
		.wd-shell .modal-header { display: flex; align-items: center; gap: 9px; padding: 15px 19px; border-bottom: 1px solid var(--wd-hairline); }
		.wd-shell .modal-title { margin: 0; font-size: 14.5px; line-height: 21px; font-weight: 650; }
		.wd-shell .modal-content { padding: 15px 19px; display: flex; flex-direction: column; gap: 5px; overflow: auto; }
		.wd-shell .modal-footer { display: flex; align-items: center; gap: 8px; padding: 13px 19px; border-top: 1px solid var(--wd-hairline); background: var(--wd-inset); }
		.wd-shell .modal-footer .spacer { flex: 1 1 auto; }
		.wd-shell .checkbox-row {
		  display: flex; align-items: center; gap: 10px;
		  padding: 9px 11px; border-radius: 8px; cursor: pointer;
		  border: 1px solid transparent; transition: background .11s ease, border-color .11s ease;
		}
		.wd-shell .checkbox-row:hover { background: var(--wd-inset); }
		.wd-shell .checkbox-row[data-selected="true"] { border-color: var(--wd-hairline); background: var(--wd-inset); }
		.wd-shell .checkbox-row input[type="radio"] { accent-color: var(--wd-primary); flex: none; margin: 0; }
		.wd-shell .field { display: flex; flex-direction: column; gap: 5px; }
		.wd-shell .field-label { font-size: 12px; color: var(--dsw-alias-label-secondary); }
		.wd-shell .input {
		  height: 30px; width: 94px; padding: 0 10px; border-radius: 8px;
		  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
		  color: var(--wd-text); font-variant-numeric: tabular-nums;
		}
		.wd-shell .input:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: 1px; }
		.wd-shell .form-error { margin: 2px 0 0; font-size: 11.5px; color: var(--wd-red); }
		.wd-shell .inline-field { display: flex; align-items: center; gap: 9px; padding: 4px 11px 4px 35px; }
		.wd-shell .helper-box {
		  margin-top: 7px; padding: 9px 11px; border-radius: 8px;
		  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
		  font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-tertiary);
		}

		/* ---------- sidebar glyph ---------- */
		.wd-glyph { display: block; }

		@media (prefers-reduced-motion: reduce) {
		  .wd-shell .spinner { animation-duration: 2.4s; }
		  .wd-shell .btn, .wd-shell .filter-chip, .wd-shell .search-box, .wd-shell .view-switch-btn { transition: none; }
		}
		`;

		// src/client/css/charts.ts
		var CHARTS_CSS = `
		/* ---------- shared chart chrome ---------- */
		.wd-shell .chart-sr {
		  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
		  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
		}
		.wd-shell .chart-empty {
		  display: flex; align-items: center; justify-content: center;
		  min-height: 44px; border-radius: 8px;
		  border: 1px dashed var(--wd-hairline);
		  color: var(--dsw-alias-label-tertiary); font-size: 11.5px;
		}
		.wd-shell .chart-block { display: flex; flex-direction: column; gap: 9px; min-width: 0; }
		.wd-shell .chart-block-head { display: flex; align-items: baseline; gap: 8px; }
		.wd-shell .chart-block-title { margin: 0; font-size: 11.5px; line-height: 16px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
		.wd-shell .chart-block-note { margin-left: auto; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

		/* ---------- stacked segment bar ---------- */
		.wd-shell .segbar { display: flex; flex-direction: column; gap: 6px; }
		.wd-shell .segbar-track {
		  display: flex; width: 100%; height: 26px; overflow: hidden;
		  border-radius: 7px; border: 1px solid var(--wd-hairline);
		  background: var(--wd-inset);
		}
		.wd-shell .segbar-seg {
		  display: flex; align-items: center; justify-content: center; gap: 5px;
		  min-width: 3px; padding: 0 6px; overflow: hidden;
		  font-size: 10.5px; font-weight: 600; white-space: nowrap;
		  color: var(--dsw-alias-label-primary);
		  background: var(--wd-slate-soft);
		  border: 0; border-right: 1px solid rgba(255, 255, 255, .35);
		  transition: filter .12s ease;
		}
		.wd-shell .segbar-seg:last-child { border-right: 0; }
		.wd-shell .segbar-seg[data-tone="blue"] { background: var(--wd-primary-soft); color: var(--wd-primary-deep); }
		.wd-shell .segbar-seg[data-tone="green"] { background: var(--wd-green-soft); color: var(--wd-green); }
		.wd-shell .segbar-seg[data-tone="amber"] { background: var(--wd-amber-soft); color: var(--wd-amber); }
		.wd-shell .segbar-seg[data-tone="red"] { background: var(--wd-red-soft); color: var(--wd-red); }
		.wd-shell .segbar-button { cursor: pointer; font-family: inherit; }
		.wd-shell .segbar-button:hover { filter: brightness(.96); }
		.wd-shell .segbar-seg[data-active="true"] { box-shadow: inset 0 0 0 2px var(--wd-primary); }
		.wd-shell .segbar-label { overflow: hidden; text-overflow: ellipsis; }
		.wd-shell .segbar-value { font-variant-numeric: tabular-nums; font-weight: 650; }

		/* ---------- vertical columns ---------- */
		.wd-shell .columns { display: flex; align-items: flex-end; gap: 7px; }
		.wd-shell .columns-cell {
		  flex: 1 1 0; min-width: 0;
		  display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 3px;
		  padding: 0; border: 0; background: transparent; font-family: inherit;
		  cursor: default;
		}
		.wd-shell .columns-cell[data-empty="true"] { opacity: .42; }
		.wd-shell .columns-cell[data-active="true"] .columns-fill { box-shadow: 0 0 0 2px var(--wd-primary-ring); }
		.wd-shell .columns-value { font-size: 10px; font-weight: 650; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-secondary); }
		.wd-shell .columns-fill {
		  width: 100%; max-width: 40px; border-radius: 5px 5px 2px 2px;
		  background: var(--wd-slate-soft); min-height: 3px;
		  transition: filter .12s ease;
		}
		.wd-shell .columns-fill[data-tone="blue"] { background: var(--wd-primary); opacity: .82; }
		.wd-shell .columns-fill[data-tone="green"] { background: var(--wd-green); opacity: .82; }
		.wd-shell .columns-fill[data-tone="amber"] { background: var(--wd-amber); opacity: .82; }
		.wd-shell .columns-fill[data-tone="red"] { background: var(--wd-red); opacity: .82; }
		.wd-shell .columns-fill[data-tone="slate"] { background: var(--wd-slate); opacity: .55; }
		.wd-shell .columns-label { font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; }

		/* ---------- donut ---------- */
		.wd-shell .donut { display: flex; align-items: center; gap: 14px; }
		.wd-shell .donut-figure { position: relative; flex: none; width: 84px; height: 84px; }
		.wd-shell .donut-svg { width: 84px; height: 84px; display: block; }
		.wd-shell .donut-ring { fill: none; stroke: var(--wd-hairline); stroke-width: 11; }
		.wd-shell .donut-slice { fill: none; stroke-width: 11; stroke-linecap: butt; }
		.wd-shell .donut-slice[data-tone="blue"] { stroke: var(--wd-primary); }
		.wd-shell .donut-slice[data-tone="green"] { stroke: var(--wd-green); }
		.wd-shell .donut-slice[data-tone="amber"] { stroke: var(--wd-amber); }
		.wd-shell .donut-slice[data-tone="red"] { stroke: var(--wd-red); }
		.wd-shell .donut-slice[data-tone="slate"] { stroke: var(--wd-slate); }
		.wd-shell .donut-center {
		  position: absolute; inset: 0; display: flex; flex-direction: column;
		  align-items: center; justify-content: center; gap: 1px; pointer-events: none;
		}
		.wd-shell .donut-center-value { font-size: 16px; line-height: 20px; font-weight: 650; font-variant-numeric: tabular-nums; }
		.wd-shell .donut-center-label { font-size: 9.5px; line-height: 13px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .donut-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1 1 auto; }
		.wd-shell .donut-legend-row {
		  display: flex; align-items: center; gap: 7px; width: 100%;
		  padding: 2px 5px; border: 0; border-radius: 6px; background: transparent;
		  font-family: inherit; font-size: 11px; color: var(--dsw-alias-label-secondary);
		  text-align: left; cursor: default;
		}
		.wd-shell .donut-legend-button { cursor: pointer; }
		.wd-shell .donut-legend-button:hover { background: var(--wd-inset); }
		.wd-shell .donut-legend-row[data-active="true"] { background: var(--wd-primary-soft); color: var(--wd-primary-deep); }
		.wd-shell .donut-dot { flex: none; width: 8px; height: 8px; border-radius: 2px; background: var(--wd-slate); }
		.wd-shell .donut-dot[data-tone="blue"] { background: var(--wd-primary); }
		.wd-shell .donut-dot[data-tone="green"] { background: var(--wd-green); }
		.wd-shell .donut-dot[data-tone="amber"] { background: var(--wd-amber); }
		.wd-shell .donut-dot[data-tone="red"] { background: var(--wd-red); }
		.wd-shell .donut-legend-label { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.wd-shell .donut-legend-value { flex: none; font-variant-numeric: tabular-nums; font-weight: 650; }

		/* ---------- horizontal bar list ---------- */
		.wd-shell .barlist { display: flex; flex-direction: column; gap: 2px; }
		.wd-shell .barlist-row {
		  display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(40px, 1fr) 46px;
		  align-items: center; gap: 9px; width: 100%;
		  padding: 4px 6px; border: 0; border-radius: 6px; background: transparent;
		  font-family: inherit; text-align: left; cursor: default;
		}
		.wd-shell .barlist-button { cursor: pointer; }
		.wd-shell .barlist-button:hover { background: var(--wd-inset); }
		.wd-shell .barlist-row[data-active="true"] { background: var(--wd-primary-soft); }
		.wd-shell .barlist-text { display: flex; flex-direction: column; min-width: 0; }
		.wd-shell .barlist-label { font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.wd-shell .barlist-note { font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.wd-shell .barlist-track { height: 7px; border-radius: 4px; background: var(--wd-inset); overflow: hidden; }
		.wd-shell .barlist-fill { display: block; height: 100%; border-radius: 4px; background: var(--wd-slate); opacity: .7; }
		.wd-shell .barlist-fill[data-tone="blue"] { background: var(--wd-primary); opacity: .9; }
		.wd-shell .barlist-fill[data-tone="green"] { background: var(--wd-green); opacity: .9; }
		.wd-shell .barlist-fill[data-tone="amber"] { background: var(--wd-amber); opacity: .9; }
		.wd-shell .barlist-fill[data-tone="red"] { background: var(--wd-red); opacity: .9; }
		.wd-shell .barlist-value { font-size: 11.5px; font-weight: 650; font-variant-numeric: tabular-nums; text-align: right; color: var(--dsw-alias-label-secondary); }

		/* ---------- radial meter ---------- */
		.wd-shell .radial { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 0; }
		.wd-shell .radial-figure { position: relative; width: 58px; height: 58px; }
		.wd-shell .radial-figure svg { width: 58px; height: 58px; display: block; }
		.wd-shell .radial-track { fill: none; stroke: var(--wd-hairline); stroke-width: 6; }
		.wd-shell .radial-fill { fill: none; stroke-width: 6; stroke-linecap: round; }
		.wd-shell .radial-fill[data-tone="blue"] { stroke: var(--wd-primary); }
		.wd-shell .radial-fill[data-tone="green"] { stroke: var(--wd-green); }
		.wd-shell .radial-fill[data-tone="amber"] { stroke: var(--wd-amber); }
		.wd-shell .radial-fill[data-tone="red"] { stroke: var(--wd-red); }
		.wd-shell .radial-fill[data-tone="slate"] { stroke: var(--wd-slate); }
		.wd-shell .radial-value {
		  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
		  font-size: 13px; font-weight: 650; font-variant-numeric: tabular-nums;
		}
		.wd-shell .radial-label { font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
		.wd-shell .radial-note { font-size: 9.5px; line-height: 13px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

		/* ---------- spark bars ---------- */
		.wd-shell .spark { display: flex; align-items: flex-end; gap: 3px; height: 46px; }
		.wd-shell .spark-cell { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 2px; height: 100%; }
		.wd-shell .spark-bar { width: 100%; max-width: 16px; border-radius: 3px 3px 1px 1px; background: var(--wd-primary); opacity: .78; min-height: 3px; }
		.wd-shell .spark-bar[data-empty="true"] { background: var(--wd-hairline); opacity: 1; }
		.wd-shell .spark-month { font-size: 9px; line-height: 12px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

		/* ---------- mini stage rail ---------- */
		.wd-shell .rail-mini { display: flex; align-items: center; gap: 3px; }
		.wd-shell .rail-mini-tick { width: 100%; max-width: 18px; height: 4px; border-radius: 2px; background: var(--wd-hairline); }
		.wd-shell .rail-mini-tick[data-done="true"] { background: var(--wd-green); }
		.wd-shell .rail-mini-tick[data-current="true"] { background: var(--wd-primary); box-shadow: 0 0 0 2px var(--wd-primary-ring); }

		/* ---------- inline meter ---------- */
		.wd-shell .inline-meter { display: block; width: 100%; height: 4px; border-radius: 2px; background: var(--wd-hairline); overflow: hidden; }
		.wd-shell .inline-meter-fill { display: block; height: 100%; border-radius: 2px; background: var(--wd-primary); }
		.wd-shell .inline-meter-fill[data-tone="green"] { background: var(--wd-green); }
		.wd-shell .inline-meter-fill[data-tone="amber"] { background: var(--wd-amber); }
		.wd-shell .inline-meter-fill[data-tone="red"] { background: var(--wd-red); }
		.wd-shell .inline-meter-fill[data-tone="slate"] { background: var(--wd-slate); }

		/* ---------- legend ---------- */
		.wd-shell .legend { display: flex; flex-wrap: wrap; gap: 4px 12px; }
		.wd-shell .legend-item { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .legend-dot { width: 7px; height: 7px; border-radius: 2px; background: var(--wd-slate); }
		.wd-shell .legend-dot[data-tone="blue"] { background: var(--wd-primary); }
		.wd-shell .legend-dot[data-tone="green"] { background: var(--wd-green); }
		.wd-shell .legend-dot[data-tone="amber"] { background: var(--wd-amber); }
		.wd-shell .legend-dot[data-tone="red"] { background: var(--wd-red); }
		.wd-shell .legend-label { color: var(--dsw-alias-label-secondary); }
		.wd-shell .legend-value { font-variant-numeric: tabular-nums; font-weight: 600; }

		@media (prefers-reduced-motion: reduce) {
		  .wd-shell .segbar-seg, .wd-shell .columns-fill { transition: none; }
		}
		`;

		// src/client/css/detail.ts
		var DETAIL_CSS = `
		/* ---------- two-pane layout ---------- */
		.wd-shell .dt-page {
		  display: grid;
		  grid-template-columns: 316px minmax(0, 1fr);
		  align-items: start;
		  min-height: 100%;
		}
		@media (max-width: 1100px) { .wd-shell .dt-page { grid-template-columns: minmax(0, 1fr); } }

		.wd-shell .dt-rail {
		  position: sticky; top: 0;
		  align-self: start;
		  display: flex; flex-direction: column; gap: 14px;
		  padding: 18px 18px 22px;
		  background: var(--wd-surface);
		  border-right: 1px solid var(--wd-hairline);
		  min-height: 100%;
		}
		@media (max-width: 1100px) { .wd-shell .dt-rail { position: static; border-right: 0; border-bottom: 1px solid var(--wd-hairline); } }
		.wd-shell .dt-pane {
		  display: flex; flex-direction: column; gap: 22px;
		  padding: 20px 28px 44px;
		  min-width: 0;
		}

		/* ---------- rail ---------- */
		.wd-shell .dt-rail-head { display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
		.wd-shell .dt-rail-back { margin-bottom: 4px; }
		.wd-shell .dt-rail-title {
		  margin: 0; font-size: 16px; line-height: 23px; font-weight: 650;
		  letter-spacing: -.01em; overflow-wrap: anywhere;
		}
		.wd-shell .dt-rail-id { display: block; }
		.wd-shell .dt-rail-pills { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 3px; }
		.wd-shell .dt-rail-amount {
		  display: flex; flex-direction: column; gap: 1px;
		  padding: 10px 12px; border-radius: 9px;
		  background: var(--wd-amber-soft); border: 1px solid transparent;
		}
		.wd-shell .dt-rail-amount-label {
		  font-size: 9.5px; line-height: 14px; letter-spacing: .05em;
		  text-transform: uppercase; font-weight: 600; color: var(--wd-amber);
		}
		.wd-shell .dt-rail-amount-value {
		  font-size: 22px; line-height: 28px; font-weight: 650;
		  font-variant-numeric: tabular-nums; color: var(--wd-amber); letter-spacing: -.02em;
		}
		.wd-shell .dt-rail-amount-value[data-empty="true"] {
		  font-size: 13px; font-weight: 500; font-style: italic; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .dt-rail-amount-unit { margin-left: 3px; font-size: 10.5px; font-weight: 500; }
		.wd-shell .dt-rail-block { display: flex; flex-direction: column; gap: 7px; }
		.wd-shell .dt-rail-block-title {
		  margin: 0; font-size: 10.5px; line-height: 15px; letter-spacing: .06em;
		  text-transform: uppercase; font-weight: 650; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .dt-rail-empty { margin: 0; font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary); font-style: italic; }

		/* vertical stage track */
		.wd-shell .dt-stages { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; position: relative; }
		.wd-shell .dt-stage { display: flex; align-items: center; gap: 9px; padding: 4px 0; position: relative; }
		.wd-shell .dt-stage:not(:last-child)::after {
		  content: ''; position: absolute; left: 9px; top: 22px; bottom: -3px;
		  width: 1px; background: var(--wd-hairline);
		}
		.wd-shell .dt-stage[data-done="true"]:not(:last-child)::after { background: var(--wd-green); opacity: .45; }
		.wd-shell .dt-stage-marker {
		  position: relative; z-index: 1; flex: none;
		  width: 19px; height: 19px; border-radius: 50%;
		  display: flex; align-items: center; justify-content: center;
		  font-size: 9px; font-weight: 650;
		  border: 1.5px solid var(--wd-hairline); background: var(--wd-surface);
		  color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .dt-stage[data-done="true"] .dt-stage-marker { border-color: var(--wd-green); background: var(--wd-green); color: #fff; }
		.wd-shell .dt-stage[data-current="true"] .dt-stage-marker {
		  border-color: var(--wd-primary); background: var(--wd-primary); color: #fff;
		  box-shadow: 0 0 0 3px var(--wd-primary-soft);
		}
		.wd-shell .dt-stage-text { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
		.wd-shell .dt-stage-label { font-size: 11.5px; line-height: 16px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
		.wd-shell .dt-stage[data-current="true"] .dt-stage-label { color: var(--wd-primary); }
		.wd-shell .dt-stage-state { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .dt-stage[data-current="true"] .dt-stage-state { color: var(--wd-primary); }

		/* rail dimension summary: four compact marks, never merged into one score.
		   The full cards with their origin tags live in the reading pane; the rail only
		   needs to say "which of the four exist", because the rail is scanned, not read. */
		.wd-shell .dt-rail-dims { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; }
		.wd-shell .dim-mini {
		  display: flex; align-items: center; gap: 5px; min-width: 0;
		  padding: 4px 7px; border-radius: 6px;
		  background: var(--wd-red-soft);
		}
		.wd-shell .dim-mini[data-present="true"] { background: var(--wd-green-soft); }
		.wd-shell .dim-mini-mark { flex: none; font-size: 10px; line-height: 14px; font-weight: 650; color: var(--wd-red); }
		.wd-shell .dim-mini[data-present="true"] .dim-mini-mark { color: var(--wd-green); }
		.wd-shell .dim-mini-label {
		  font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-secondary);
		  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		}
		.wd-shell .dim-card {
		  display: flex; flex-direction: column; gap: 1px; min-width: 0;
		  padding: 7px 8px; border-radius: 8px;
		  border: 1px solid var(--wd-hairline); background: var(--wd-inset);
		}
		.wd-shell .dim-card[data-present="true"] { border-color: transparent; background: var(--wd-green-soft); }
		.wd-shell .dim-card[data-present="false"] { border-color: transparent; background: var(--wd-red-soft); }
		.wd-shell .dim-card-label { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-secondary); font-weight: 550; }
		.wd-shell .dim-card-mark { font-size: 11px; line-height: 15px; font-weight: 650; }
		.wd-shell .dim-card[data-present="true"] .dim-card-mark { color: var(--wd-green); }
		.wd-shell .dim-card[data-present="false"] .dim-card-mark { color: var(--wd-red); }
		.wd-shell .dim-card-value {
		  font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-secondary);
		  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
		}
		.wd-shell .dim-card-origin {
		  margin-top: 1px; font-size: 8.5px; line-height: 12px;
		  color: var(--dsw-alias-label-tertiary); letter-spacing: .02em;
		}
		.wd-shell .dim-card-reason { font-size: 8.5px; line-height: 12px; color: var(--wd-red); opacity: .8; }

		/* rail gaps */
		.wd-shell .dt-rail-gaps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
		.wd-shell .dt-rail-gap { display: flex; align-items: baseline; gap: 6px; }
		.wd-shell .dt-rail-gap-no {
		  flex: none; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		  font-size: 9px; line-height: 14px; font-weight: 650;
		  padding: 0 4px; border-radius: 3px;
		}
		.wd-shell .dt-rail-gap[data-level="high"] .dt-rail-gap-no { background: var(--wd-red-soft); color: var(--wd-red); }
		.wd-shell .dt-rail-gap[data-level="medium"] .dt-rail-gap-no { background: var(--wd-amber-soft); color: var(--wd-amber); }
		.wd-shell .dt-rail-gap-title { font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }

		/* rail meta */
		.wd-shell .dt-rail-meta { display: flex; flex-direction: column; gap: 3px; }
		.wd-shell .dt-rail-meta-row { display: flex; align-items: baseline; gap: 8px; }
		.wd-shell .dt-rail-meta-label { flex: none; width: 82px; font-size: 10px; line-height: 15px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .dt-rail-meta-value {
		  flex: 1 1 auto; min-width: 0; font-size: 10.5px; line-height: 15px;
		  color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere;
		}
		.wd-shell .dt-rail-meta-value[data-empty="true"] { color: var(--dsw-alias-label-tertiary); font-style: italic; }

		/* rail navigation */
		.wd-shell .dt-rail-nav { display: flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 10px; }
		.wd-shell .dt-rail-position { flex: 1 1 auto; text-align: center; font-size: 9.5px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

		/* ---------- section frame ---------- */
		.wd-shell .dsec { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
		.wd-shell .dsec-head { display: flex; align-items: baseline; gap: 9px; padding-bottom: 7px; border-bottom: 1px solid var(--wd-hairline); }
		.wd-shell .dsec-title { margin: 0; font-size: 13.5px; line-height: 20px; font-weight: 650; letter-spacing: -.005em; }
		.wd-shell .dsec-kicker { margin-left: auto; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
		.wd-shell .dsec-blank {
		  padding: 14px; border-radius: 9px;
		  border: 1px dashed var(--wd-hairline);
		  font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-tertiary);
		  text-align: center;
		}
		.wd-shell .dsec-empty {
		  display: flex; flex-direction: column; align-items: center; gap: 5px;
		  padding: 30px 20px; border-radius: 10px;
		  border: 1px dashed var(--wd-hairline);
		  text-align: center;
		}
		.wd-shell .dsec-empty-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 650; }
		.wd-shell .dsec-empty-copy { margin: 0; font-size: 11.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); }

		/* ---------- prose blocks ---------- */
		.wd-shell .dt-prose { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
		.wd-shell .dt-prose-label {
		  font-size: 9.5px; line-height: 14px; letter-spacing: .05em;
		  text-transform: uppercase; font-weight: 600; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .dt-prose-body { margin: 0; font-size: 12px; line-height: 19px; color: var(--dsw-alias-label-secondary); }
		.wd-shell .dt-prose[data-empty="true"] .dt-prose-body { color: var(--dsw-alias-label-tertiary); font-style: italic; }

		/* ---------- progress stream ---------- */
		.wd-shell .prog-stream { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
		.wd-shell .prog-item { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 12px; padding-bottom: 14px; }
		.wd-shell .prog-item:last-child { padding-bottom: 0; }
		.wd-shell .prog-gutter { position: relative; display: flex; justify-content: center; padding-top: 8px; }
		.wd-shell .prog-node {
		  position: relative; z-index: 1; width: 9px; height: 9px; border-radius: 50%;
		  background: var(--wd-slate); box-shadow: 0 0 0 3px var(--wd-slate-soft);
		}
		.wd-shell .prog-node[data-tone="green"] { background: var(--wd-green); box-shadow: 0 0 0 3px var(--wd-green-soft); }
		.wd-shell .prog-node[data-tone="amber"] { background: var(--wd-amber); box-shadow: 0 0 0 3px var(--wd-amber-soft); }
		.wd-shell .prog-node[data-tone="red"] { background: var(--wd-red); box-shadow: 0 0 0 3px var(--wd-red-soft); }
		.wd-shell .prog-item:not(:last-child) .prog-gutter::after {
		  content: ''; position: absolute; top: 22px; bottom: -6px; width: 1px;
		  background: var(--wd-hairline);
		}
		.wd-shell .prog-card {
		  display: flex; flex-direction: column; gap: 8px;
		  padding: 12px 14px 11px; min-width: 0;
		  border: 1px solid var(--wd-hairline); border-radius: 10px;
		  background: var(--wd-surface); box-shadow: var(--wd-shadow-1);
		}
		.wd-shell .prog-item[data-latest="true"] .prog-card { border-color: var(--dsw-alias-border-l2); box-shadow: var(--wd-shadow-2); }
		.wd-shell .prog-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
		.wd-shell .prog-date { font-size: 12px; line-height: 18px; font-weight: 650; font-variant-numeric: tabular-nums; }
		.wd-shell .prog-type { font-size: 10.5px; line-height: 16px; padding: 0 7px; border-radius: 20px; background: var(--wd-inset); border: 1px solid var(--wd-hairline); color: var(--dsw-alias-label-secondary); }
		.wd-shell .prog-seq { font-size: 9.5px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
		.wd-shell .prog-chip { margin-left: auto; font-size: 10px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .prog-meter { margin-left: auto; display: flex; align-items: center; gap: 6px; min-width: 150px; }
		.wd-shell .prog-meter-label { font-size: 9px; line-height: 13px; letter-spacing: .04em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .prog-meter .inline-meter { flex: 1 1 auto; min-width: 40px; }
		.wd-shell .prog-meter-value { font-size: 10.5px; font-weight: 650; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-secondary); }

		.wd-shell .prog-pair { display: flex; flex-direction: column; gap: 3px; }
		.wd-shell .prog-goal { display: flex; flex-direction: column; gap: 0; }
		.wd-shell .prog-actual { display: flex; flex-direction: column; gap: 0; }
		.wd-shell .prog-pair-label {
		  font-size: 9px; line-height: 13px; letter-spacing: .05em;
		  text-transform: uppercase; font-weight: 600; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .prog-goal .prog-pair-value { font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
		.wd-shell .prog-actual .prog-pair-value { font-size: 12.5px; line-height: 19px; font-weight: 600; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
		.wd-shell .prog-scope, .wd-shell .prog-evidence, .wd-shell .prog-customer, .wd-shell .prog-feedback { display: flex; flex-direction: column; gap: 4px; }
		.wd-shell .prog-scope-label, .wd-shell .prog-block-label {
		  font-size: 9px; line-height: 13px; letter-spacing: .05em;
		  text-transform: uppercase; font-weight: 600; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .prog-customer { flex-direction: row; align-items: center; gap: 6px; flex-wrap: wrap; }
		.wd-shell .prog-customer .prog-block-label { margin-right: 1px; }
		.wd-shell .prog-missing { font-size: 10.5px; line-height: 15px; color: var(--wd-amber); font-style: italic; }
		.wd-shell .prog-evidence-link { text-decoration: none; color: var(--wd-primary); }
		.wd-shell .prog-evidence-link:hover { background: var(--wd-primary-soft); }
		.wd-shell .prog-external { margin-left: 2px; font-size: 9px; }
		.wd-shell .prog-feedback-copy { font-size: 11.5px; line-height: 18px; }
		.wd-shell .prog-next {
		  display: flex; flex-direction: column; gap: 3px;
		  padding: 7px 10px; border-radius: 8px;
		  border-left: 3px solid var(--wd-primary);
		  background: var(--wd-primary-soft);
		}
		.wd-shell .prog-next-empty { border-left-color: var(--wd-hairline); background: var(--wd-inset); }
		.wd-shell .prog-next-label {
		  font-size: 9px; line-height: 13px; letter-spacing: .05em;
		  text-transform: uppercase; font-weight: 650; color: var(--wd-primary);
		}
		.wd-shell .prog-next-empty .prog-next-label { color: var(--dsw-alias-label-tertiary); }
		.wd-shell .prog-next-body { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
		.wd-shell .prog-next-goal { font-size: 11.5px; line-height: 17px; font-weight: 600; color: var(--dsw-alias-label-primary); }

		/* ---------- dimension grid (detail) ---------- */
		.wd-shell .dim-grid-detail { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
		@media (max-width: 900px) { .wd-shell .dim-grid-detail { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
		.wd-shell .dim-grid-detail .dim-card {
		  padding: 11px 12px; border-radius: 10px; gap: 3px;
		  border-left: 3px solid var(--wd-red);
		  box-shadow: var(--wd-shadow-1);
		}
		.wd-shell .dim-grid-detail .dim-card[data-present="true"] { border-left-color: var(--wd-green); }
		.wd-shell .dim-grid-detail .dim-card-label { font-size: 10.5px; line-height: 15px; }
		.wd-shell .dim-grid-detail .dim-card-mark { font-size: 14px; line-height: 20px; }
		.wd-shell .dim-grid-detail .dim-card-value { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary); -webkit-line-clamp: 3; }
		.wd-shell .dim-grid-detail .dim-card-origin {
		  display: inline-flex; align-self: flex-start; margin-top: 2px;
		  padding: 0 5px; border-radius: 4px; font-size: 9px; line-height: 15px;
		  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
		  color: var(--dsw-alias-label-tertiary);
		}

		/* ---------- G0 meter ---------- */
		.wd-shell .g0-meter { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
		@media (max-width: 760px) { .wd-shell .g0-meter { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
		.wd-shell .g0-cell {
		  display: flex; flex-direction: column; align-items: center; gap: 2px;
		  padding: 8px 6px; border-radius: 8px; min-width: 0;
		  background: var(--wd-red-soft); border: 1px solid transparent;
		}
		.wd-shell .g0-cell[data-present="true"] { background: var(--wd-green-soft); }
		.wd-shell .g0-cell-mark { font-size: 12px; line-height: 16px; font-weight: 650; color: var(--wd-red); }
		.wd-shell .g0-cell[data-present="true"] .g0-cell-mark { color: var(--wd-green); }
		.wd-shell .g0-cell-label {
		  font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-secondary);
		  text-align: center; overflow-wrap: anywhere;
		}
		.wd-shell .g0-fields { display: flex; flex-direction: column; gap: 8px; }
		.wd-shell .g0-field {
		  display: flex; flex-direction: column; gap: 2px;
		  padding: 9px 11px; border-radius: 9px;
		  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
		}
		.wd-shell .g0-field[data-present="false"] { border-color: transparent; background: var(--wd-red-soft); }
		.wd-shell .g0-field-label {
		  font-size: 9.5px; line-height: 14px; letter-spacing: .05em;
		  text-transform: uppercase; font-weight: 600; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .g0-field-value { margin: 0; font-size: 12px; line-height: 19px; color: var(--dsw-alias-label-secondary); }
		.wd-shell .g0-field[data-prose="true"] .g0-field-value { font-size: 12.5px; line-height: 20px; color: var(--dsw-alias-label-primary); }
		.wd-shell .g0-field-missing { margin: 0; font-size: 11px; line-height: 16px; color: var(--wd-red); font-style: italic; }
		.wd-shell .g0-foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
		.wd-shell .g0-review { font-size: 11px; line-height: 17px; color: var(--dsw-alias-label-secondary); }
		.wd-shell .g0-review[data-empty="true"] { color: var(--dsw-alias-label-tertiary); font-style: italic; }

		/* ---------- plan ---------- */
		.wd-shell .plan-meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
		@media (max-width: 900px) { .wd-shell .plan-meta { grid-template-columns: minmax(0, 1fr); } }
		.wd-shell .plan-strip {
		  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
		  padding: 9px 12px; border-radius: 9px;
		  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
		}
		.wd-shell .plan-strip-item { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
		.wd-shell .plan-strip-label { font-size: 9.5px; line-height: 14px; letter-spacing: .04em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600; }
		.wd-shell .plan-strip-value { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
		.wd-shell .plan-block { display: flex; flex-direction: column; gap: 7px; }
		.wd-shell .plan-block-head { display: flex; align-items: baseline; gap: 8px; }
		.wd-shell .plan-block-title { margin: 0; font-size: 11.5px; line-height: 16px; font-weight: 650; color: var(--dsw-alias-label-primary); }
		.wd-shell .plan-block-note { margin-left: auto; font-size: 10px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .plan-criteria {
		  width: 100%; border-collapse: collapse;
		  border: 1px solid var(--wd-hairline); border-radius: 9px; overflow: hidden;
		  background: var(--wd-surface);
		}
		.wd-shell .plan-criteria th {
		  padding: 7px 10px; text-align: left;
		  font-size: 9.5px; line-height: 14px; letter-spacing: .05em; text-transform: uppercase;
		  font-weight: 600; color: var(--dsw-alias-label-tertiary);
		  background: var(--wd-inset); border-bottom: 1px solid var(--wd-hairline);
		}
		.wd-shell .plan-criteria td {
		  padding: 8px 10px; font-size: 11.5px; line-height: 17px;
		  color: var(--dsw-alias-label-secondary); border-bottom: 1px solid var(--wd-hairline);
		  vertical-align: top;
		}
		.wd-shell .plan-criteria tbody tr:last-child td { border-bottom: 0; }
		.wd-shell .plan-criterion-name { font-weight: 600; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
		.wd-shell .plan-criterion-num { font-variant-numeric: tabular-nums; }
		.wd-shell .plan-criterion-target { font-weight: 650; color: var(--wd-primary); font-variant-numeric: tabular-nums; }
		.wd-shell .plan-scenarios { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
		.wd-shell .plan-scenario { display: flex; align-items: baseline; gap: 9px; padding: 6px 10px; border-radius: 7px; background: var(--wd-inset); }
		.wd-shell .plan-scenario-no {
		  flex: none; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		  font-size: 9.5px; line-height: 15px; font-weight: 650; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .plan-scenario-text { font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
		.wd-shell .plan-risks { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
		.wd-shell .plan-risk { display: flex; align-items: flex-start; gap: 8px; padding: 7px 10px; border-radius: 8px; background: var(--wd-inset); }
		.wd-shell .plan-risk-dot { flex: none; width: 7px; height: 7px; margin-top: 5px; border-radius: 50%; background: var(--wd-slate); }
		.wd-shell .plan-risk[data-tone="red"] .plan-risk-dot { background: var(--wd-red); }
		.wd-shell .plan-risk[data-tone="amber"] .plan-risk-dot { background: var(--wd-amber); }
		.wd-shell .plan-risk[data-tone="green"] .plan-risk-dot { background: var(--wd-green); }
		.wd-shell .plan-risk-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
		.wd-shell .plan-risk-name { font-size: 11.5px; line-height: 17px; font-weight: 600; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
		.wd-shell .plan-risk-level { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .plan-risk-mitigation { font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }

		/* ---------- outcome ---------- */
		.wd-shell .out-triple { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
		@media (max-width: 900px) { .wd-shell .out-triple { grid-template-columns: minmax(0, 1fr); } }
		.wd-shell .out-milestone {
		  display: flex; flex-direction: column; gap: 4px;
		  padding: 12px 14px; border-radius: 10px;
		  border-left: 3px solid var(--wd-red); background: var(--wd-red-soft);
		}
		.wd-shell .out-milestone[data-present="true"] { border-left-color: var(--wd-green); background: var(--wd-green-soft); }
		.wd-shell .out-milestone-label {
		  font-size: 9.5px; line-height: 14px; letter-spacing: .05em;
		  text-transform: uppercase; font-weight: 650; color: var(--wd-red);
		}
		.wd-shell .out-milestone[data-present="true"] .out-milestone-label { color: var(--wd-green); }
		.wd-shell .out-milestone-text { font-size: 13px; line-height: 20px; font-weight: 650; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
		.wd-shell .out-milestone-missing { font-size: 11.5px; line-height: 18px; color: var(--wd-red); overflow-wrap: anywhere; }
		.wd-shell .out-milestone-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px; }
		.wd-shell .out-meta {
		  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;
		  padding-top: 10px; border-top: 1px solid var(--wd-hairline);
		}
		@media (max-width: 900px) { .wd-shell .out-meta { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

		@media (prefers-reduced-motion: reduce) {
		  .wd-shell .dim-card, .wd-shell .prog-card { transition: none; }
		}
		`;

		// src/client/css/insights.ts
		var INSIGHTS_CSS = `
		/* =========================================================================
		   Risk board \u2014 severity lanes
		   ========================================================================= */

		.wd-shell .risk-board {
		  display: flex;
		  flex-direction: column;
		  gap: 18px;
		  padding: 18px 20px 24px;
		}

		/* ---------- page header (this surface owns it; the shell does not) ---------- */
		.wd-shell .risk-head,
		.wd-shell .tl-head {
		  display: flex;
		  align-items: flex-start;
		  gap: 16px;
		  min-width: 0;
		}
		.wd-shell .risk-head-text,
		.wd-shell .tl-head-text {
		  display: flex;
		  flex-direction: column;
		  gap: 2px;
		  min-width: 0;
		  flex: 1 1 auto;
		}
		.wd-shell .risk-head-title,
		.wd-shell .tl-head-title {
		  margin: 0;
		  font-size: 17px;
		  line-height: 24px;
		  font-weight: 650;
		  letter-spacing: -.01em;
		  color: var(--dsw-alias-label-primary);
		}
		.wd-shell .risk-head-subtitle,
		.wd-shell .tl-head-subtitle {
		  margin: 0;
		  font-size: 11.5px;
		  line-height: 17px;
		  color: var(--dsw-alias-label-secondary);
		}
		.wd-shell .risk-back,
		.wd-shell .tl-back {
		  flex: none;
		  height: 28px;
		  padding: 0 12px;
		  border-radius: 7px;
		  border: 1px solid var(--wd-border);
		  background: var(--wd-surface);
		  color: var(--dsw-alias-label-secondary);
		  font-family: inherit;
		  font-size: 11.5px;
		  cursor: pointer;
		  transition: background .12s ease, border-color .12s ease, color .12s ease;
		}
		.wd-shell .risk-back:hover,
		.wd-shell .tl-back:hover {
		  background: var(--wd-inset);
		  border-color: var(--wd-primary-ring);
		  color: var(--wd-primary);
		}
		.wd-shell .risk-back:focus-visible,
		.wd-shell .tl-back:focus-visible {
		  outline: 2px solid var(--wd-primary);
		  outline-offset: 1px;
		}

		/* ---------- severity distribution figure ---------- */
		.wd-shell .risk-figure,
		.wd-shell .risk-projects {
		  display: flex;
		  flex-direction: column;
		  gap: 8px;
		  padding: 13px 15px 14px;
		  border-radius: 11px;
		  background: var(--wd-surface);
		  border: 1px solid var(--wd-hairline);
		  box-shadow: var(--wd-shadow-1);
		}
		.wd-shell .risk-figure-head {
		  display: flex;
		  align-items: baseline;
		  gap: 9px;
		  min-width: 0;
		}
		.wd-shell .risk-figure-title {
		  margin: 0;
		  font-size: 11.5px;
		  line-height: 16px;
		  font-weight: 650;
		  letter-spacing: .01em;
		  color: var(--dsw-alias-label-primary);
		}
		.wd-shell .risk-figure-note {
		  margin-left: auto;
		  font-size: 10.5px;
		  line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		  font-variant-numeric: tabular-nums;
		  text-align: right;
		}
		.wd-shell .risk-caption {
		  margin: 0;
		  font-size: 10.5px;
		  line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		  font-variant-numeric: tabular-nums;
		}

		/* ---------- lane stack ---------- */
		.wd-shell .risk-lanes {
		  display: flex;
		  flex-direction: column;
		  gap: 10px;
		}
		.wd-shell .risk-lane {
		  position: relative;
		  display: flex;
		  flex-direction: column;
		  border-radius: 10px;
		  background: var(--wd-surface);
		  border: 1px solid var(--wd-hairline);
		  box-shadow: var(--wd-shadow-1);
		  overflow: hidden;
		  /* The rail: severity as the left edge of the whole lane, not as a badge. */
		  border-left-width: 3px;
		  border-left-style: solid;
		  border-left-color: var(--wd-slate);
		}
		.wd-shell .risk-lane[data-level="high"] { border-left-color: var(--wd-red); }
		.wd-shell .risk-lane[data-level="medium"] { border-left-color: var(--wd-amber); }
		.wd-shell .risk-lane[data-level="low"] { border-left-color: var(--wd-green); }
		.wd-shell .risk-lane[data-level="unset"] { border-left-color: var(--wd-slate); }

		.wd-shell .risk-lane-head {
		  display: flex;
		  align-items: center;
		  gap: 9px;
		  padding: 8px 12px 7px;
		  background: var(--wd-inset);
		  border-bottom: 1px solid var(--wd-hairline);
		}
		.wd-shell .risk-lane-count {
		  font-size: 12px;
		  line-height: 16px;
		  font-weight: 700;
		  font-variant-numeric: tabular-nums;
		  color: var(--dsw-alias-label-primary);
		}
		.wd-shell .risk-lane[data-level="high"] .risk-lane-count { color: var(--wd-red); }
		.wd-shell .risk-lane[data-level="medium"] .risk-lane-count { color: var(--wd-amber); }
		.wd-shell .risk-lane[data-level="low"] .risk-lane-count { color: var(--wd-green); }
		.wd-shell .risk-lane[data-level="unset"] .risk-lane-count { color: var(--wd-slate); }
		/* The share meter compares lanes; it is deliberately thin and unfilled-chrome. */
		.wd-shell .risk-lane-meter {
		  flex: 1 1 auto;
		  min-width: 40px;
		  max-width: 180px;
		  display: block;
		}
		.wd-shell .risk-lane-share {
		  margin-left: auto;
		  font-size: 10px;
		  line-height: 14px;
		  color: var(--dsw-alias-label-tertiary);
		  font-variant-numeric: tabular-nums;
		}

		/* ---------- rows ---------- */
		.wd-shell .risk-rows {
		  list-style: none;
		  margin: 0;
		  padding: 0;
		}
		.wd-shell .risk-row-item + .risk-row-item { border-top: 1px solid var(--wd-hairline); }
		.wd-shell .risk-row {
		  position: relative;
		  display: grid;
		  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
		  gap: 14px;
		  align-items: start;
		  padding: 10px 13px 10px 12px;
		  color: inherit;
		  /* A severity tint on the row's own left edge, one step quieter than the rail. */
		  box-shadow: inset 3px 0 0 var(--wd-slate-soft);
		  transition: background .12s ease;
		}
		.wd-shell .risk-row[data-level="high"] { box-shadow: inset 3px 0 0 var(--wd-red-soft); }
		.wd-shell .risk-row[data-level="medium"] { box-shadow: inset 3px 0 0 var(--wd-amber-soft); }
		.wd-shell .risk-row[data-level="low"] { box-shadow: inset 3px 0 0 var(--wd-green-soft); }
		.wd-shell .risk-row:hover { background: var(--wd-inset); }
		/* The row itself is not focusable; the stretched project button is. Ring the
		   row so the keyboard user sees which whole row is about to open. */
		.wd-shell .risk-row:focus-within {
		  background: var(--wd-inset);
		  box-shadow: inset 3px 0 0 var(--wd-primary), inset 0 0 0 1px var(--wd-primary-ring);
		}

		.wd-shell .risk-row-main {
		  display: flex;
		  flex-direction: column;
		  gap: 3px;
		  min-width: 0;
		}
		.wd-shell .risk-name {
		  font-size: 12.5px;
		  line-height: 18px;
		  font-weight: 650;
		  color: var(--dsw-alias-label-primary);
		  overflow-wrap: anywhere;
		}
		.wd-shell .risk-mitigation {
		  display: flex;
		  flex-wrap: wrap;
		  gap: 5px;
		  font-size: 11px;
		  line-height: 16px;
		  color: var(--dsw-alias-label-secondary);
		  overflow-wrap: anywhere;
		}
		.wd-shell .risk-mitigation-label {
		  flex: none;
		  font-size: 10px;
		  line-height: 15px;
		  padding: 0 5px;
		  border-radius: 4px;
		  background: var(--wd-slate-soft);
		  color: var(--dsw-alias-label-tertiary);
		}

		.wd-shell .risk-row-side {
		  display: flex;
		  flex-direction: column;
		  gap: 3px;
		  align-items: flex-end;
		  min-width: 0;
		}
		/* Stretched link: the button is the row's only control, and its overlay makes
		   the whole row clickable. The overlay sits above the row's own background but
		   below the gap note, so the note stays selectable. */
		.wd-shell .risk-project {
		  display: inline-flex;
		  align-items: center;
		  gap: 4px;
		  max-width: 100%;
		  padding: 0;
		  border: 0;
		  background: transparent;
		  font-family: inherit;
		  font-size: 11px;
		  line-height: 16px;
		  color: var(--wd-primary);
		  cursor: pointer;
		  text-align: right;
		}
		.wd-shell .risk-project::after {
		  content: '';
		  position: absolute;
		  inset: 0;
		}
		.wd-shell .risk-project:hover { text-decoration: underline; }
		.wd-shell .risk-project:focus-visible { outline: none; }
		.wd-shell .risk-project-arrow {
		  flex: none;
		  opacity: .65;
		  transition: transform .12s ease, opacity .12s ease;
		}
		.wd-shell .risk-row:hover .risk-project-arrow { transform: translateX(2px); opacity: 1; }
		.wd-shell .risk-gap {
		  position: relative;
		  z-index: 1;
		  pointer-events: none;
		  font-size: 10.5px;
		  line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		  font-variant-numeric: tabular-nums;
		  text-align: right;
		}

		/* ---------- empty state ---------- */
		.wd-shell .risk-empty,
		.wd-shell .tl-empty {
		  display: flex;
		  flex-direction: column;
		  align-items: center;
		  justify-content: center;
		  gap: 6px;
		  padding: 34px 20px;
		  border-radius: 11px;
		  border: 1px dashed var(--wd-hairline);
		  background: var(--wd-surface);
		}
		.wd-shell .risk-empty-mark,
		.wd-shell .tl-empty-mark {
		  font-size: 18px;
		  line-height: 22px;
		  color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .risk-empty-copy,
		.wd-shell .tl-empty-copy {
		  margin: 0;
		  font-size: 12px;
		  line-height: 18px;
		  color: var(--dsw-alias-label-secondary);
		  text-align: center;
		  max-width: 42ch;
		}

		/* =========================================================================
		   Timeline \u2014 distribution, silent projects, stream
		   ========================================================================= */

		.wd-shell .tl-page {
		  display: flex;
		  flex-direction: column;
		  gap: 16px;
		  padding: 18px 20px 24px;
		}

		.wd-shell .tl-figure,
		.wd-shell .tl-silent {
		  display: flex;
		  flex-direction: column;
		  gap: 8px;
		  padding: 13px 15px 14px;
		  border-radius: 11px;
		  background: var(--wd-surface);
		  border: 1px solid var(--wd-hairline);
		  box-shadow: var(--wd-shadow-1);
		}
		.wd-shell .tl-figure-head,
		.wd-shell .tl-silent-head {
		  display: flex;
		  align-items: baseline;
		  gap: 9px;
		  min-width: 0;
		}
		.wd-shell .tl-figure-title,
		.wd-shell .tl-silent-title {
		  margin: 0;
		  font-size: 11.5px;
		  line-height: 16px;
		  font-weight: 650;
		  letter-spacing: .01em;
		  color: var(--dsw-alias-label-primary);
		}
		.wd-shell .tl-figure-note,
		.wd-shell .tl-silent-note {
		  margin-left: auto;
		  font-size: 10.5px;
		  line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		  font-variant-numeric: tabular-nums;
		  text-align: right;
		}
		.wd-shell .tl-caption {
		  margin: 0;
		  font-size: 10.5px;
		  line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		  font-variant-numeric: tabular-nums;
		}

		/* ---------- silent projects ---------- */
		.wd-shell .tl-silent {
		  border-left: 3px solid var(--wd-amber);
		}
		.wd-shell .tl-silent-title { color: var(--wd-amber); }
		.wd-shell .tl-silent-chips {
		  display: flex;
		  flex-wrap: wrap;
		  gap: 6px;
		}
		.wd-shell .tl-chip-button {
		  padding: 3px 10px;
		  border-radius: 20px;
		  border: 1px solid var(--wd-hairline);
		  background: var(--wd-inset);
		  color: var(--dsw-alias-label-secondary);
		  font-family: inherit;
		  font-size: 11.5px;
		  line-height: 17px;
		  cursor: pointer;
		  transition: background .12s ease, color .12s ease, border-color .12s ease;
		}
		.wd-shell .tl-chip-button:hover {
		  background: var(--wd-primary-soft);
		  border-color: var(--wd-primary-ring);
		  color: var(--wd-primary);
		}
		.wd-shell .tl-chip-button:focus-visible {
		  outline: 2px solid var(--wd-primary);
		  outline-offset: 1px;
		}
		.wd-shell .tl-silent-hint {
		  margin: 0;
		  font-size: 10.5px;
		  line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		}

		/* ---------- the stream ---------- */
		.wd-shell .tl-stream {
		  display: flex;
		  flex-direction: column;
		  gap: 14px;
		}
		/* One month section = divider + its cards. The group is the spacing unit, so
		   the stream never relies on a margin collapsing between sections. */
		.wd-shell .tl-month-group {
		  display: flex;
		  flex-direction: column;
		  gap: 8px;
		}

		/* A month divider is a plain row, never sticky: the whole stream is one
		   scroll flow owned by the shell, and a sticky row inside it would fight that
		   scroll container instead of helping. */
		.wd-shell .tl-month {
		  display: flex;
		  align-items: center;
		  gap: 9px;
		  padding: 2px 2px 0;
		}
		.wd-shell .tl-month-label {
		  font-size: 12px;
		  line-height: 16px;
		  font-weight: 700;
		  letter-spacing: .02em;
		  font-variant-numeric: tabular-nums;
		  color: var(--dsw-alias-label-primary);
		}
		.wd-shell .tl-month-count {
		  font-size: 10.5px;
		  line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		  font-variant-numeric: tabular-nums;
		}
		.wd-shell .tl-month-rule {
		  flex: 1 1 auto;
		  height: 1px;
		  background: var(--wd-hairline);
		}

		.wd-shell .tl-entries {
		  list-style: none;
		  margin: 0;
		  padding: 0;
		  display: flex;
		  flex-direction: column;
		}

		/* Each entry is a two-column row: the gutter owns the spine, the card owns
		   the content. The spine is drawn by the gutter's ::before and the node by
		   ::after, so no extra DOM node is needed for the connector. */
		.wd-shell .tl-entry {
		  display: grid;
		  grid-template-columns: 20px minmax(0, 1fr);
		  gap: 10px;
		  padding-bottom: 10px;
		}
		.wd-shell .tl-entry:last-child { padding-bottom: 0; }

		.wd-shell .tl-gutter {
		  position: relative;
		  display: flex;
		  align-items: flex-start;
		  justify-content: center;
		  padding-top: 11px;
		}
		.wd-shell .tl-gutter::before {
		  content: '';
		  position: absolute;
		  top: 0;
		  bottom: -10px;
		  left: 50%;
		  width: 1px;
		  margin-left: -.5px;
		  background: var(--wd-hairline);
		}
		.wd-shell .tl-entry:last-child .tl-gutter::before { bottom: 50%; }
		.wd-shell .tl-node {
		  position: relative;
		  z-index: 1;
		  width: 9px;
		  height: 9px;
		  border-radius: 50%;
		  background: var(--wd-slate);
		  box-shadow: 0 0 0 2px var(--wd-surface);
		}
		.wd-shell .tl-node[data-tone="green"] { background: var(--wd-green); }
		.wd-shell .tl-node[data-tone="amber"] { background: var(--wd-amber); }
		.wd-shell .tl-node[data-tone="red"] { background: var(--wd-red); }

		.wd-shell .tl-card {
		  display: flex;
		  flex-direction: column;
		  gap: 7px;
		  min-width: 0;
		  padding: 10px 13px 11px;
		  border-radius: 10px;
		  background: var(--wd-surface);
		  border: 1px solid var(--wd-hairline);
		  box-shadow: var(--wd-shadow-1);
		}
		.wd-shell .tl-card-head {
		  display: flex;
		  align-items: center;
		  flex-wrap: wrap;
		  gap: 8px;
		  min-width: 0;
		}
		.wd-shell .tl-date {
		  font-size: 11.5px;
		  line-height: 16px;
		  font-weight: 700;
		  font-variant-numeric: tabular-nums;
		  color: var(--dsw-alias-label-primary);
		}
		.wd-shell .tl-type {
		  font-size: 10px;
		  line-height: 15px;
		  padding: 0 6px;
		  border-radius: 4px;
		  background: var(--wd-slate-soft);
		  color: var(--dsw-alias-label-secondary);
		  white-space: nowrap;
		}
		.wd-shell .tl-project {
		  padding: 0;
		  border: 0;
		  background: transparent;
		  font-family: inherit;
		  font-size: 11px;
		  line-height: 16px;
		  color: var(--wd-primary);
		  cursor: pointer;
		  text-align: left;
		  overflow-wrap: anywhere;
		}
		.wd-shell .tl-project:hover { text-decoration: underline; }
		.wd-shell .tl-project:focus-visible {
		  outline: 2px solid var(--wd-primary);
		  outline-offset: 1px;
		  border-radius: 3px;
		}
		.wd-shell .tl-recog {
		  margin-left: auto;
		  font-size: 10.5px;
		}

		/* The body is a definition list: label above value, so a long goal wraps
		   under its own label instead of shoving the next field to the right. */
		.wd-shell .tl-fields {
		  display: grid;
		  grid-template-columns: minmax(0, 1fr);
		  gap: 4px;
		  margin: 0;
		}
		.wd-shell .tl-field {
		  display: grid;
		  grid-template-columns: 54px minmax(0, 1fr);
		  gap: 9px;
		  align-items: baseline;
		  min-width: 0;
		}
		.wd-shell .tl-field-label {
		  font-size: 10.5px;
		  line-height: 16px;
		  color: var(--dsw-alias-label-tertiary);
		  white-space: nowrap;
		}
		.wd-shell .tl-field-value {
		  margin: 0;
		  font-size: 12px;
		  line-height: 17px;
		  color: var(--dsw-alias-label-secondary);
		  overflow-wrap: anywhere;
		}
		.wd-shell .tl-field-value[data-emphasis="strong"] {
		  color: var(--dsw-alias-label-primary);
		  font-weight: 600;
		}
		.wd-shell .tl-field-value[data-emphasis="muted"] { color: var(--dsw-alias-label-secondary); }
		.wd-shell .tl-field-value[data-emphasis="missing"] {
		  color: var(--dsw-alias-label-tertiary);
		  font-style: italic;
		}

		/* ---------- footer chips ---------- */
		.wd-shell .tl-chips {
		  display: flex;
		  flex-wrap: wrap;
		  gap: 5px;
		  padding-top: 7px;
		  border-top: 1px solid var(--wd-hairline);
		  margin-top: 1px;
		}
		.wd-shell .tl-chip {
		  display: inline-flex;
		  align-items: baseline;
		  gap: 5px;
		  padding: 1px 8px;
		  border-radius: 20px;
		  background: var(--wd-inset);
		  border: 1px solid var(--wd-hairline);
		  font-size: 10.5px;
		  line-height: 16px;
		  color: var(--dsw-alias-label-secondary);
		  font-variant-numeric: tabular-nums;
		}
		.wd-shell .tl-chip-label {
		  font-size: 9.5px;
		  color: var(--dsw-alias-label-tertiary);
		}

		/* ---------- narrow widths ---------- */
		@media (max-width: 720px) {
		  .wd-shell .risk-row { grid-template-columns: minmax(0, 1fr); gap: 6px; }
		  .wd-shell .risk-row-side { align-items: flex-start; }
		  .wd-shell .risk-gap { text-align: left; }
		  .wd-shell .risk-lane-meter { display: none; }
		  .wd-shell .tl-field { grid-template-columns: minmax(0, 1fr); gap: 0; }
		}

		@media (prefers-reduced-motion: reduce) {
		  .wd-shell .risk-row,
		  .wd-shell .tl-chip-button,
		  .wd-shell .risk-project-arrow { transition: none; }
		}
		`;

		// src/client/css/overview.ts
		var OVERVIEW_CSS = `
		/* ---------- layout ---------- */
		.wd-shell .workspace-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; align-items: start; }
		@media (max-width: 1180px) { .wd-shell .workspace-grid { grid-template-columns: minmax(0, 1fr); } }
		.wd-shell .primary-column, .wd-shell .secondary-column { min-width: 0; display: flex; flex-direction: column; gap: 16px; }
		.wd-shell .panel {
		  border: 1px solid var(--wd-hairline); border-radius: 12px;
		  background: var(--wd-surface); overflow: hidden;
		  box-shadow: var(--wd-shadow-1);
		}
		.wd-shell .panel-header {
		  display: flex; align-items: baseline; gap: 9px;
		  padding: 12px 18px 10px;
		  border-bottom: 1px solid var(--wd-hairline);
		  background: linear-gradient(180deg, var(--wd-surface) 0%, var(--wd-inset) 150%);
		}
		.wd-shell .panel-title { margin: 0; font-size: 13.5px; line-height: 20px; font-weight: 650; letter-spacing: -.005em; }
		.wd-shell .panel-kicker {
		  margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-tertiary);
		  font-variant-numeric: tabular-nums;
		  padding: 1px 8px; border-radius: 20px;
		  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
		}
		.wd-shell .panel-body { padding: 0; }
		.wd-shell .panel-body.padded { padding: 13px 18px; }

		/* ---------- portfolio band ---------- */
		.wd-shell .pf-band {
		  margin-bottom: 14px;
		  border: 1px solid var(--wd-hairline); border-radius: 12px;
		  background: var(--wd-surface);
		  box-shadow: var(--wd-shadow-1);
		  overflow: hidden;
		}
		.wd-shell .pf-band-head {
		  display: flex; align-items: baseline; gap: 10px;
		  padding: 9px 16px 8px;
		  border-bottom: 1px solid var(--wd-hairline);
		  background: linear-gradient(180deg, var(--wd-surface) 0%, var(--wd-inset) 150%);
		}
		.wd-shell .pf-band-title { margin: 0; font-size: 13.5px; line-height: 20px; font-weight: 650; }
		.wd-shell .pf-band-note { margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
		.wd-shell .pf-grid {
		  display: grid;
		  grid-template-columns: repeat(8, minmax(0, 1fr));
		  gap: 1px;
		  background: var(--wd-hairline);
		}
		@media (max-width: 1280px) { .wd-shell .pf-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
		@media (max-width: 860px) { .wd-shell .pf-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
		@media (max-width: 560px) { .wd-shell .pf-grid { grid-template-columns: minmax(0, 1fr); } }
		/* Two strips, four blocks each. The band is context: it answers "where does the
		   money sit" in about a third of the screen, then gets out of the way. An eight-column
		   grid lets two wide figures and four list figures share exactly two rows. */
		.wd-shell .pf-block {
		  padding: 8px 12px 9px;
		  background: var(--wd-surface);
		  min-height: 0;
		  justify-content: flex-start;
		}
		.wd-shell .pf-block[data-span="4"] { grid-column: span 4; }
		.wd-shell .pf-block[data-span="2"] { grid-column: span 2; }
		@media (max-width: 1280px) {
		  .wd-shell .pf-block[data-span="4"] { grid-column: span 4; }
		  .wd-shell .pf-block[data-span="2"] { grid-column: span 2; }
		}
		@media (max-width: 860px) {
		  .wd-shell .pf-block[data-span="4"], .wd-shell .pf-block[data-span="2"] { grid-column: span 2; }
		}
		@media (max-width: 560px) {
		  .wd-shell .pf-block[data-span="4"], .wd-shell .pf-block[data-span="2"] { grid-column: span 1; }
		}
		@media (max-width: 720px) { .wd-shell .pf-block-wide { grid-column: span 1; } }
		.wd-shell .pf-radials { display: flex; gap: 8px; justify-content: space-between; padding: 2px 2px 0; }
		/* Four rows fit exactly; the cap only protects against a deployment with many
		   more orgs than this one, where the strip must not grow the band. */
		.wd-shell .pf-block[data-span="2"] .barlist { max-height: 168px; overflow: auto; scrollbar-width: thin; }
		.wd-shell .pf-collapse {
		  display: inline-flex; align-items: center; gap: 4px;
		  padding: 1px 7px; border-radius: 6px;
		  border: 1px solid var(--wd-hairline); background: var(--wd-inset);
		  font-size: 10px; line-height: 15px; color: var(--dsw-alias-label-tertiary);
		  cursor: pointer; font-family: inherit; white-space: nowrap;
		}
		.wd-shell .pf-collapse:hover { color: var(--wd-text); background: var(--wd-surface); }
		.wd-shell .pf-band[data-collapsed="true"] .pf-grid { display: none; }
		.wd-shell .pf-note {
		  margin: 5px 0 0; font-size: 10px; line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		  overflow-wrap: anywhere;
		  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
		}
		.wd-shell .pf-note[data-tone="amber"] { color: var(--wd-amber); }

		/* ---------- project cards ---------- */
		.wd-shell .pcard-grid {
		  display: grid;
		  grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
		  gap: 12px; padding: 14px;
		}
		.wd-shell .pcard {
		  display: flex; flex-direction: column; gap: 9px;
		  padding: 13px 14px 11px;
		  border: 1px solid var(--wd-hairline); border-radius: 10px;
		  background: var(--wd-surface);
		  cursor: pointer; min-width: 0;
		  transition: box-shadow .15s ease, border-color .15s ease, transform .15s ease;
		}
		.wd-shell .pcard:hover { box-shadow: var(--wd-shadow-2); border-color: var(--dsw-alias-border-l2); transform: translateY(-1px); }
		.wd-shell .pcard:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: 1px; }
		.wd-shell .pcard[data-selected="true"] {
		  border-color: var(--wd-primary);
		  box-shadow: 0 0 0 3px var(--wd-primary-soft), var(--wd-shadow-2);
		}
		.wd-shell .pcard[data-closed="true"] { opacity: .82; }
		.wd-shell .pcard-head { display: flex; align-items: flex-start; gap: 8px; }
		.wd-shell .pcard-title-block { min-width: 0; flex: 1 1 auto; display: flex; flex-direction: column; gap: 1px; }
		.wd-shell .pcard-name {
		  font-size: 13.5px; line-height: 19px; font-weight: 650;
		  letter-spacing: -.005em; overflow-wrap: anywhere;
		  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
		}
		.wd-shell .pcard-id {
		  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		  font-size: 10px; line-height: 15px; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .pcard-badge {
		  flex: none; padding: 1px 7px; border-radius: 20px;
		  font-size: 10px; line-height: 15px; font-weight: 650; white-space: nowrap;
		}
		.wd-shell .pcard-badge[data-tone="red"] { background: var(--wd-red-soft); color: var(--wd-red); }
		.wd-shell .pcard-badge[data-tone="amber"] { background: var(--wd-amber-soft); color: var(--wd-amber); }
		.wd-shell .pcard-stage { display: flex; align-items: center; gap: 8px; min-width: 0; }
		.wd-shell .pcard-stage-pill { flex: none; }
		.wd-shell .pcard-stage .rail-mini { flex: 1 1 auto; }
		.wd-shell .pcard-meta { display: flex; align-items: baseline; gap: 8px; }
		.wd-shell .pcard-org {
		  flex: 1 1 auto; min-width: 0;
		  font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary);
		  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}
		.wd-shell .pcard-amount {
		  flex: none; font-size: 12.5px; font-weight: 650;
		  font-variant-numeric: tabular-nums; color: var(--wd-amber);
		}
		.wd-shell .pcard-unit { margin-left: 2px; font-size: 9.5px; font-weight: 500; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .pcard-progress {
		  display: flex; flex-direction: column; gap: 1px;
		  padding: 7px 9px; border-radius: 8px;
		  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
		}
		.wd-shell .pcard-progress-label {
		  font-size: 9.5px; line-height: 14px; letter-spacing: .05em;
		  text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600;
		}
		.wd-shell .pcard-progress-copy {
		  font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-secondary);
		  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
		}
		.wd-shell .pcard-progress-meta {
		  margin-top: 1px; font-size: 9.5px; line-height: 14px;
		  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
		}
		.wd-shell .pcard-dims { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
		.wd-shell .pcard-dim {
		  display: flex; flex-direction: column; align-items: center; gap: 1px;
		  padding: 3px 2px; border-radius: 6px; min-width: 0;
		  background: var(--wd-red-soft);
		}
		.wd-shell .pcard-dim[data-present="true"] { background: var(--wd-green-soft); }
		.wd-shell .pcard-dim-mark { font-size: 10.5px; line-height: 14px; font-weight: 650; color: var(--wd-red); }
		.wd-shell .pcard-dim[data-present="true"] .pcard-dim-mark { color: var(--wd-green); }
		.wd-shell .pcard-dim-label {
		  font-size: 8.5px; line-height: 12px; color: var(--dsw-alias-label-tertiary);
		  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
		}
		.wd-shell .pcard-foot { display: flex; align-items: center; gap: 8px; }
		.wd-shell .pcard-since { font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
		.wd-shell .pcard-open { margin-left: auto; font-size: 10.5px; color: var(--wd-primary); font-weight: 600; }

		/* ---------- board ---------- */
		.wd-shell .pboard {
		  display: flex; gap: 10px; padding: 14px;
		  overflow-x: auto; overscroll-behavior-x: contain;
		  align-items: stretch;
		}
		.wd-shell .pboard-column {
		  flex: 1 1 0; min-width: 176px; max-width: 300px;
		  display: flex; flex-direction: column; gap: 8px;
		  padding: 10px 9px 12px; border-radius: 10px;
		  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
		}
		.wd-shell .pboard-column[data-empty="true"] { background: transparent; border-style: dashed; }
		.wd-shell .pboard-column-head { display: flex; flex-direction: column; gap: 3px; }
		.wd-shell .pboard-column-label { font-size: 11.5px; line-height: 16px; font-weight: 650; color: var(--dsw-alias-label-secondary); }
		.wd-shell .pboard-column-count {
		  font-size: 9.5px; line-height: 14px;
		  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
		}
		.wd-shell .pboard-column-body { display: flex; flex-direction: column; gap: 7px; flex: 1 1 auto; }
		.wd-shell .pboard-card {
		  display: flex; flex-direction: column; gap: 3px;
		  padding: 9px 10px; border-radius: 8px; width: 100%; text-align: left;
		  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
		  cursor: pointer; font-family: inherit;
		  box-shadow: var(--wd-shadow-1);
		  transition: box-shadow .14s ease, border-color .14s ease;
		}
		.wd-shell .pboard-card:hover { box-shadow: var(--wd-shadow-2); border-color: var(--dsw-alias-border-l2); }
		.wd-shell .pboard-card[data-high="true"] { border-left: 3px solid var(--wd-red); }
		.wd-shell .pboard-card-name {
		  font-size: 11.5px; line-height: 16px; font-weight: 600; color: var(--dsw-alias-label-primary);
		  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
		}
		.wd-shell .pboard-card-meta { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
		.wd-shell .pboard-card-owner { font-variant-numeric: normal; }
		.wd-shell .pboard-card-progress {
		  font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-secondary);
		  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}
		.wd-shell .pboard-card-gap { font-size: 9.5px; line-height: 14px; font-weight: 650; color: var(--wd-red); }
		.wd-shell .pboard-empty {
		  padding: 16px 8px; text-align: center;
		  font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary);
		  border: 1px dashed var(--wd-hairline); border-radius: 8px;
		}

		/* ---------- table ---------- */
		.wd-shell .project-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
		.wd-shell .table-head th {
		  position: sticky; top: 0; z-index: 1;
		  padding: 8px 12px; text-align: left; white-space: nowrap;
		  font-size: 10.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
		  color: var(--dsw-alias-label-tertiary);
		  border-bottom: 1px solid var(--wd-hairline);
		  background: var(--wd-inset);
		}
		.wd-shell .table-head th:first-child { padding-left: 16px; }
		.wd-shell .table-head th:last-child { padding-right: 16px; }
		.wd-shell .ptable-sort {
		  display: inline-flex; align-items: center; gap: 3px;
		  padding: 0; border: 0; background: transparent; cursor: pointer;
		  font: inherit; font-size: 10.5px; font-weight: 600; letter-spacing: .06em;
		  text-transform: uppercase; color: inherit; white-space: nowrap;
		}
		.wd-shell .ptable-sort:hover { color: var(--wd-text); }
		.wd-shell .ptable-sort[data-active="true"] { color: var(--wd-primary); }
		.wd-shell .ptable-sort-arrow { font-size: 9.5px; }
		.wd-shell .project-row { border-bottom: 1px solid var(--wd-hairline); cursor: pointer; transition: background .1s ease; }
		.wd-shell .project-row:last-child { border-bottom: 0; }
		.wd-shell .project-row:hover { background: var(--wd-inset); }
		.wd-shell .project-row[data-selected="true"] { background: var(--wd-primary-soft); }
		.wd-shell .project-row:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: -2px; }
		.wd-shell .project-row td { padding: 10px 12px; vertical-align: middle; }
		.wd-shell .project-row td:first-child { padding-left: 16px; }
		.wd-shell .project-row td:last-child { padding-right: 16px; text-align: right; }
		.wd-shell .project-name {
		  font-size: 12.5px; line-height: 18px; font-weight: 600;
		  display: block; overflow-wrap: anywhere; letter-spacing: -.005em;
		}
		.wd-shell .project-id {
		  font-size: 10px; line-height: 15px; color: var(--dsw-alias-label-tertiary);
		  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		  display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}
		.wd-shell .project-org { display: block; font-size: 11.5px; line-height: 17px; font-weight: 550; overflow-wrap: anywhere; }
		.wd-shell .project-meta { font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
		.wd-shell .progress-summary {
		  font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary);
		  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
		}
		.wd-shell .ptable-stage { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
		.wd-shell .ptable-amount { display: flex; flex-direction: column; gap: 4px; align-items: stretch; }
		.wd-shell .amount-cell { display: block; text-align: right; font-variant-numeric: tabular-nums; font-weight: 650; font-size: 12px; }
		.wd-shell .gap-cell { display: flex; align-items: baseline; gap: 3px; white-space: nowrap; }
		.wd-shell .gap-count { font-variant-numeric: tabular-nums; font-weight: 650; font-size: 12.5px; }
		.wd-shell .gap-count[data-level="high"] { color: var(--wd-red); }
		.wd-shell .gap-count[data-level="medium"] { color: var(--wd-amber); }
		.wd-shell .gap-count[data-level="none"] { color: var(--wd-green); }
		.wd-shell .row-actions { display: flex; gap: 5px; justify-content: flex-end; }
		.wd-shell .gap-copy { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }

		/* ---------- pending rail ---------- */
		.wd-shell .pending { display: flex; flex-direction: column; }
		.wd-shell .pending-group { border-bottom: 1px solid var(--wd-hairline); }
		.wd-shell .pending-group:last-child { border-bottom: 0; }
		.wd-shell .pending-group[data-level="high"] { border-left: 3px solid var(--wd-red); }
		.wd-shell .pending-group[data-level="medium"] { border-left: 3px solid var(--wd-amber); }
		.wd-shell .pending-group-head {
		  display: flex; align-items: baseline; gap: 6px;
		  padding: 9px 13px 5px; flex-wrap: wrap;
		}
		.wd-shell .pending-rule-no {
		  flex: none; padding: 0 5px; border-radius: 4px;
		  font-size: 9.5px; line-height: 15px; font-weight: 650;
		  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		  background: var(--wd-slate-soft); color: var(--dsw-alias-label-secondary);
		}
		.wd-shell .pending-group[data-level="high"] .pending-rule-no { background: var(--wd-red-soft); color: var(--wd-red); }
		.wd-shell .pending-group[data-level="medium"] .pending-rule-no { background: var(--wd-amber-soft); color: var(--wd-amber); }
		.wd-shell .pending-rule-title { flex: 1 1 auto; min-width: 0; font-size: 11.5px; line-height: 16px; font-weight: 600; overflow-wrap: anywhere; }
		.wd-shell .pending-rule-count { flex: none; font-size: 9.5px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
		.wd-shell .pending-group-body { padding: 0 13px 10px; display: flex; flex-direction: column; gap: 6px; }
		.wd-shell .pending-gap { display: flex; flex-direction: column; gap: 2px; }
		.wd-shell .pending-gap-copy { font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
		.wd-shell .pending-gap-project { display: flex; }
		.wd-shell .pending-link {
		  padding: 0; border: 0; background: transparent; cursor: pointer;
		  font: inherit; font-size: 10px; color: var(--wd-primary); text-align: left;
		}
		.wd-shell .pending-link:hover { text-decoration: underline; }
		.wd-shell .pending-more { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-style: italic; }

		@media (prefers-reduced-motion: reduce) {
		  .wd-shell .pcard, .wd-shell .pboard-card, .wd-shell .project-row { transition: none; }
		}
		`;

		// src/client/styles.ts
		var CONSOLE_CSS = [BASE_CSS, CHARTS_CSS, OVERVIEW_CSS, DETAIL_CSS, INSIGHTS_CSS].join("\n");

		// src/client/view-contract.ts
		var NO_FILTERS = Object.freeze({
		  system: null,
		  company: null,
		  stage: null,
		  status: null,
		  pocType: null
		});
		function activeFilterCount(filters) {
		  return Object.values(filters).filter((value) => value !== null).length;
		}

		// src/client/shell.tsx
		var import_jsx_runtime5 = require("react/jsx-runtime");
		function SidebarGlyph({ size = 18 }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { className: "wd-glyph", width: size, height: size, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { x: "3", y: "4.5", width: "18", height: "15", rx: "3.2", stroke: "currentColor", strokeWidth: "1.6" }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { x: "6", y: "8", width: "5.4", height: "3.6", rx: "1.2", fill: "currentColor", opacity: "0.85" }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { x: "12.6", y: "8", width: "5.4", height: "3.6", rx: "1.2", fill: "currentColor", opacity: "0.35" }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { x: "6", y: "13", width: "12", height: "3.4", rx: "1.2", fill: "currentColor", opacity: "0.5" })
		  ] });
		}
		function clockOf(value, locale) {
		  if (value === null) return "";
		  const stamp = new Date(value);
		  if (Number.isNaN(stamp.getTime())) return "";
		  return stamp.toLocaleTimeString(locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" });
		}
		function errorText(t, error) {
		  if (error instanceof ActionError) {
		    const key = `error.${error.code.replace(/^(skillre-)?work-dashboard\//, "")}`;
		    const translated = t(key);
		    return translated === key ? error.message : translated;
		  }
		  if (error instanceof Error) return error.message;
		  return t("error.failed");
		}
		function stageLabel2(t, stage) {
		  if (stage === "closed") return t("stageClosed");
		  if (stage === "unknown") return t("stageUnknown");
		  if (STAGES.includes(stage)) return t(`stage${stage}`);
		  return stage;
		}
		function buildFilterOptions(snapshot) {
		  const projects = snapshot?.projects ?? [];
		  const count = (pick, value) => projects.filter((project) => pick(project) === value).length;
		  const systems = /* @__PURE__ */ new Map();
		  const companies = /* @__PURE__ */ new Map();
		  const stages = /* @__PURE__ */ new Map();
		  const statuses = /* @__PURE__ */ new Map();
		  const types = /* @__PURE__ */ new Map();
		  const bump = (map, value, label) => {
		    const existing = map.get(value);
		    if (existing === void 0) map.set(value, { value, label, count: 1 });
		    else existing.count += 1;
		  };
		  for (const project of projects) {
		    if (project.system !== "") bump(systems, project.system, project.system);
		    if (project.company !== "") bump(companies, project.company, project.company);
		    const stageKey = project.closed ? "closed" : project.stage ?? "unknown";
		    bump(stages, stageKey, stageLabel2(snapshotT, stageKey));
		    if (project.status !== "") bump(statuses, project.status, project.status);
		    if (project.pocType !== "") bump(types, project.pocType, project.pocType);
		  }
		  for (const stage of STAGES) {
		    if (!stages.has(stage)) stages.set(stage, { value: stage, label: stageLabel2(snapshotT, stage), count: count((project) => project.closed ? "closed" : project.stage ?? "unknown", stage) });
		  }
		  const sortOptions = (map) => [...map.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
		  return {
		    system: sortOptions(systems),
		    company: sortOptions(companies),
		    stage: [...stages.values()],
		    status: sortOptions(statuses),
		    pocType: sortOptions(types)
		  };
		}
		var snapshotT = (key) => key;
		function matchesFilters(project, filters) {
		  if (filters.system !== null && project.system !== filters.system) return false;
		  if (filters.company !== null && project.company !== filters.company) return false;
		  if (filters.status !== null && project.status !== filters.status) return false;
		  if (filters.pocType !== null && project.pocType !== filters.pocType) return false;
		  if (filters.stage !== null) {
		    const key = project.closed ? "closed" : project.stage ?? "unknown";
		    if (key !== filters.stage) return false;
		  }
		  return true;
		}
		function searchHaystack(project) {
		  return [project.pocId, project.name, project.owner, project.system, project.company, project.department, project.pocType].join("\0").toLowerCase();
		}
		var STAGE_RANK = { G0: 0, G1: 1, G2: 2, G3: 3, G4: 4, closed: 9, unknown: 10 };
		function compareFor(sortKey, left, right) {
		  switch (sortKey) {
		    case "amount":
		      return left.amountWan - right.amountWan;
		    case "progress": {
		      if (left.lastProgressDate === null && right.lastProgressDate === null) return 0;
		      if (left.lastProgressDate === null) return -1;
		      if (right.lastProgressDate === null) return 1;
		      return left.lastProgressDate.localeCompare(right.lastProgressDate);
		    }
		    case "stage": {
		      const leftRank = STAGE_RANK[left.closed ? "closed" : left.stage ?? "unknown"] ?? 10;
		      const rightRank = STAGE_RANK[right.closed ? "closed" : right.stage ?? "unknown"] ?? 10;
		      return leftRank - rightRank;
		    }
		    case "attention":
		    default:
		      return left.gapCount - right.gapCount || left.highGapCount - right.highGapCount;
		  }
		}
		function RefreshSettings({
		  preference,
		  t,
		  onSave,
		  onCancel
		}) {
		  const [interval, setIntervalValue] = (0, import_react2.useState)(preference.interval);
		  const [minutes, setMinutes] = (0, import_react2.useState)(String(preference.customMinutes));
		  const parsedMinutes = Number(minutes);
		  const minutesValid = Number.isFinite(parsedMinutes) && parsedMinutes >= CUSTOM_MINUTES_MIN && parsedMinutes <= CUSTOM_MINUTES_MAX;
		  const rows = [
		    { value: "off", label: t("intervalOff") },
		    { value: "10m", label: t("interval10m") },
		    { value: "1h", label: t("interval1h") },
		    { value: "custom", label: t("intervalCustom") }
		  ];
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "modal-overlay", role: "presentation", onMouseDown: (event) => {
		    if (event.target === event.currentTarget) onCancel();
		  }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
		    "div",
		    {
		      className: "modal",
		      role: "dialog",
		      "aria-modal": "true",
		      "aria-label": t("refreshSettings"),
		      onKeyDown: (event) => {
		        if (event.key === "Escape") onCancel();
		      },
		      children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "modal-header", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: "modal-title", children: t("refreshSettings") }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "modal-content", children: [
		          rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "checkbox-row", "data-selected": interval === row.value, children: [
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "radio", name: "work-dashboard-refresh-interval", value: row.value, checked: interval === row.value, onChange: () => setIntervalValue(row.value) }),
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: row.label })
		          ] }, row.value)),
		          interval === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "inline-field", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
		              "input",
		              {
		                className: "input",
		                type: "number",
		                min: CUSTOM_MINUTES_MIN,
		                max: CUSTOM_MINUTES_MAX,
		                step: 1,
		                value: minutes,
		                "aria-label": t("customMinutes"),
		                onChange: (event) => setMinutes(event.target.value)
		              }
		            ),
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t("customMinutes") })
		          ] }) : null,
		          interval === "custom" && !minutesValid ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "form-error", children: format(t("customMinutesError"), { min: CUSTOM_MINUTES_MIN, max: CUSTOM_MINUTES_MAX }) }) : null,
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "helper-box", children: interval === "off" ? t("autoRefreshOff") : format(t("autoRefreshOn"), {
		            minutes: interval === "10m" ? 10 : interval === "1h" ? 60 : minutesValid ? clampMinutes(parsedMinutes) : 0
		          }) })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "modal-footer", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "spacer" }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn", onClick: onCancel, children: t("cancel") }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
		            "button",
		            {
		              type: "button",
		              className: "btn btn-primary",
		              disabled: interval === "custom" && !minutesValid,
		              onClick: () => onSave({ interval, customMinutes: minutesValid ? clampMinutes(parsedMinutes) : preference.customMinutes }),
		              children: t("save")
		            }
		          )
		        ] })
		      ]
		    }
		  ) });
		}
		function EmptyState({ snapshot, t, busy, onRefresh }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "empty-state", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "empty-icon", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { width: "34", height: "34", viewBox: "0 0 24 24", fill: "none", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M3.5 7.2l8.5-4.2 8.5 4.2v9.6L12 21l-8.5-4.2V7.2z", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M3.5 7.2L12 11.6l8.5-4.4M12 11.6V21", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" })
		    ] }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: "empty-title", children: t("emptyTitle") }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "empty-copy", children: t("emptyCopy") }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn btn-primary", disabled: busy, onClick: onRefresh, children: busy ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "spinner" }),
		      " ",
		      t("refreshing")
		    ] }) : t("emptyRefresh") }),
		    busy ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "empty-copy", style: { marginTop: 6 }, children: t("refreshingHint") }) : null,
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "empty-meta", children: [
		      t("dataSource"),
		      "\uFF1Agithub.com/",
		      snapshot?.repository ?? "",
		      " \xB7 ",
		      t("emptyPath"),
		      "\uFF1A",
		      snapshot?.cachePath ?? ""
		    ] })
		  ] });
		}
		function FailureBanner({ message, t, onRetry, busy }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "failure", role: "alert", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "failure-text", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "failure-title", children: [
		        "\u26A0 ",
		        t("failureTitle")
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "failure-reason", children: [
		        t("failureReason"),
		        "\uFF1A",
		        message
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn btn-small", disabled: busy, onClick: onRetry, children: t("failureRetry") })
		  ] });
		}
		function FilterChips({
		  label,
		  options,
		  selected,
		  onSelect
		}) {
		  if (options.length === 0) return null;
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "toolbar-group", role: "group", "aria-label": label, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "toolbar-group-label", children: label }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "chip-scroll", children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
		      "button",
		      {
		        type: "button",
		        className: "filter-chip",
		        "data-active": selected === option.value,
		        disabled: option.count === 0 && selected !== option.value,
		        onClick: () => onSelect(selected === option.value ? null : option.value),
		        title: `${option.label} \xB7 ${option.count}`,
		        children: [
		          option.label,
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "filter-chip-count", children: option.count })
		        ]
		      },
		      option.value
		    )) })
		  ] });
		}
		function Toolbar({
		  filters,
		  options,
		  viewMode,
		  sortKey,
		  sortAsc,
		  shown,
		  total,
		  search,
		  searchRef,
		  t,
		  onFilters,
		  onSearch,
		  onClearFilters,
		  onViewMode,
		  onSort,
		  onSortDirection
		}) {
		  const activeCount = activeFilterCount(filters);
		  const viewOptions = [
		    { value: "cards", label: t("viewCards"), hint: t("viewCardsHint") },
		    { value: "board", label: t("viewBoard"), hint: t("viewBoardHint") },
		    { value: "table", label: t("viewTable"), hint: t("viewTableHint") }
		  ];
		  const sortOptions = [
		    { value: "attention", label: t("sortAttention") },
		    { value: "amount", label: t("sortAmount") },
		    { value: "progress", label: t("sortProgress") },
		    { value: "stage", label: t("sortStage") }
		  ];
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "toolbar", role: "toolbar", "aria-label": t("filterLabel"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "toolbar-row", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "search-box", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "search-glyph", "aria-hidden": "true", children: "\u2315" }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
		          "input",
		          {
		            ref: searchRef,
		            className: "search-input",
		            type: "search",
		            value: search,
		            placeholder: t("searchPlaceholder"),
		            "aria-label": t("searchLabel"),
		            onChange: (event) => onSearch(event.target.value)
		          }
		        ),
		        search === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "search-clear", "aria-label": t("searchClear"), title: t("searchClear"), onClick: () => onSearch(""), children: "\xD7" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "view-switch", role: "group", "aria-label": t("viewLabel"), children: viewOptions.map((option) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
		        "button",
		        {
		          type: "button",
		          className: "view-switch-btn",
		          "data-active": viewMode === option.value,
		          title: option.hint,
		          onClick: () => onViewMode(option.value),
		          children: option.label
		        },
		        option.value
		      )) }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sort-switch", role: "group", "aria-label": t("sortLabel"), children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("select", { className: "sort-select", value: sortKey, "aria-label": t("sortLabel"), onChange: (event) => onSort(event.target.value), children: sortOptions.map((option) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: option.value, children: option.label }, option.value)) }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn btn-icon btn-small", title: t("sortDirection"), "aria-label": t("sortDirection"), onClick: onSortDirection, children: sortAsc ? "\u2191" : "\u2193" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "toolbar-result", children: format(t("filterResult"), { shown, total }) }),
		      activeCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "btn btn-small btn-ghost", onClick: onClearFilters, children: [
		        t("filterClear"),
		        " \xB7 ",
		        format(t("filterActiveNote"), { count: activeCount })
		      ] }) : null
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "toolbar-row toolbar-row-filters", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FilterChips, { label: t("filterSystem"), options: options.system, selected: filters.system, onSelect: (value) => onFilters({ ...filters, system: value }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FilterChips, { label: t("filterStage"), options: options.stage, selected: filters.stage, onSelect: (value) => onFilters({ ...filters, stage: value }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FilterChips, { label: t("filterStatus"), options: options.status, selected: filters.status, onSelect: (value) => onFilters({ ...filters, status: value }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FilterChips, { label: t("filterType"), options: options.pocType, selected: filters.pocType, onSelect: (value) => onFilters({ ...filters, pocType: value }) })
		    ] })
		  ] });
		}
		function WorkDashboardPage({ api, locale, t }) {
		  const [snapshot, setSnapshot] = (0, import_react2.useState)(null);
		  const [page, setPage] = (0, import_react2.useState)({ kind: "overview" });
		  const [detail, setDetail] = (0, import_react2.useState)(null);
		  const [loading, setLoading] = (0, import_react2.useState)(true);
		  const [busy, setBusy] = (0, import_react2.useState)(false);
		  const [failure, setFailure] = (0, import_react2.useState)(null);
		  const [statusNote, setStatusNote] = (0, import_react2.useState)(null);
		  const [preference, setPreference] = (0, import_react2.useState)(DEFAULT_PREFERENCE);
		  const [viewPreference, setViewPreference] = (0, import_react2.useState)(DEFAULT_VIEW_PREFERENCE);
		  const [settingsOpen, setSettingsOpen] = (0, import_react2.useState)(false);
		  const [filters, setFilters] = (0, import_react2.useState)(NO_FILTERS);
		  const [search, setSearch] = (0, import_react2.useState)("");
		  const [sortAsc, setSortAsc] = (0, import_react2.useState)(false);
		  const [selectedId, setSelectedId] = (0, import_react2.useState)(null);
		  const [riskBoard, setRiskBoard] = (0, import_react2.useState)(null);
		  const [timeline, setTimeline] = (0, import_react2.useState)(null);
		  const searchRef = (0, import_react2.useRef)(null);
		  const inFlight = (0, import_react2.useRef)(null);
		  const mounted = (0, import_react2.useRef)(true);
		  (0, import_react2.useEffect)(() => {
		    mounted.current = true;
		    return () => {
		      mounted.current = false;
		    };
		  }, []);
		  (0, import_react2.useEffect)(() => {
		    setPreference(readPreference());
		    setViewPreference(readViewPreference());
		  }, []);
		  const load = (0, import_react2.useCallback)(async () => {
		    setLoading(true);
		    try {
		      const next = await api.list();
		      if (mounted.current) {
		        setSnapshot(next);
		        setFailure(null);
		      }
		    } catch (error) {
		      if (mounted.current) setFailure(errorText(t, error));
		    } finally {
		      if (mounted.current) setLoading(false);
		    }
		  }, [api, t]);
		  (0, import_react2.useEffect)(() => {
		    void load();
		  }, [load]);
		  const refresh = (0, import_react2.useCallback)(async (manual) => {
		    if (inFlight.current !== null) return inFlight.current;
		    const job = (async () => {
		      setBusy(true);
		      if (manual) setFailure(null);
		      setStatusNote(null);
		      try {
		        const { snapshot: next } = await api.refresh();
		        if (!mounted.current) return;
		        setSnapshot(next);
		        setFailure(null);
		        setRiskBoard(null);
		        setTimeline(null);
		      } catch (error) {
		        if (!mounted.current) return;
		        const message = errorText(t, error);
		        if (manual) setFailure(message);
		        else setStatusNote(`${t("autoRefreshFailed")}\uFF1A${message}`);
		      } finally {
		        if (mounted.current) setBusy(false);
		      }
		    })();
		    inFlight.current = job.finally(() => {
		      inFlight.current = null;
		    });
		    return inFlight.current;
		  }, [api, t]);
		  const period = intervalMs(preference);
		  (0, import_react2.useEffect)(() => {
		    if (period === null) return;
		    const timer = setInterval(() => {
		      void refresh(false);
		    }, period);
		    return () => {
		      clearInterval(timer);
		    };
		  }, [period, refresh]);
		  snapshotT = t;
		  const filterOptions = (0, import_react2.useMemo)(() => buildFilterOptions(snapshot), [snapshot, t]);
		  const visibleProjects = (0, import_react2.useMemo)(() => {
		    const projects = snapshot?.projects ?? [];
		    const needle = search.trim().toLowerCase();
		    const filtered = projects.filter((project) => {
		      if (!matchesFilters(project, filters)) return false;
		      if (needle === "") return true;
		      return searchHaystack(project).includes(needle);
		    });
		    const sorted = [...filtered].sort((left, right) => {
		      const base = compareFor(viewPreference.sortKey, left, right);
		      return sortAsc ? base : -base;
		    });
		    return sorted;
		  }, [snapshot, filters, search, viewPreference.sortKey, sortAsc]);
		  const visibleGaps = (0, import_react2.useMemo)(() => {
		    const order = new Map(visibleProjects.map((project, index) => [project.pocId, index]));
		    return (snapshot?.gaps ?? []).filter((item) => order.has(item.pocId)).sort((left, right) => order.get(left.pocId) - order.get(right.pocId) || right.priority - left.priority);
		  }, [snapshot, visibleProjects]);
		  const visibleAnalysis = (0, import_react2.useMemo)(() => {
		    if (snapshot === null) return null;
		    if (visibleProjects.length === snapshot.projects.length) return snapshot.analysis;
		    return recomputeAnalysis(visibleProjects, visibleGaps);
		  }, [snapshot, visibleProjects, visibleGaps]);
		  const openDetail = (0, import_react2.useCallback)(async (pocId) => {
		    setPage({ kind: "detail", pocId });
		    setSelectedId(pocId);
		    setDetail(null);
		    try {
		      const next = await api.detail(pocId);
		      if (mounted.current) setDetail(next);
		    } catch (error) {
		      if (mounted.current) setFailure(errorText(t, error));
		    }
		  }, [api, t]);
		  const backToOverview = (0, import_react2.useCallback)(() => {
		    setPage({ kind: "overview" });
		    setDetail(null);
		    setFailure(null);
		  }, []);
		  const openRisks = (0, import_react2.useCallback)(() => {
		    setPage({ kind: "risks" });
		    if (riskBoard !== null) return;
		    void (async () => {
		      try {
		        const next = await api.risks();
		        if (mounted.current) setRiskBoard(next);
		      } catch (error) {
		        if (mounted.current) setFailure(errorText(t, error));
		      }
		    })();
		  }, [api, riskBoard, t]);
		  const openTimeline = (0, import_react2.useCallback)(() => {
		    setPage({ kind: "timeline" });
		    if (timeline !== null) return;
		    void (async () => {
		      try {
		        const next = await api.timeline();
		        if (mounted.current) setTimeline(next);
		      } catch (error) {
		        if (mounted.current) setFailure(errorText(t, error));
		      }
		    })();
		  }, [api, timeline, t]);
		  const savePreference = (0, import_react2.useCallback)((next) => {
		    setPreference(next);
		    writePreference(next);
		    setSettingsOpen(false);
		  }, []);
		  const saveViewMode = (0, import_react2.useCallback)((next) => {
		    const updated = { ...viewPreference, viewMode: next };
		    setViewPreference(updated);
		    writeViewPreference(updated);
		  }, [viewPreference]);
		  const saveSortKey = (0, import_react2.useCallback)((next) => {
		    const updated = { ...viewPreference, sortKey: next };
		    setViewPreference(updated);
		    writeViewPreference(updated);
		  }, [viewPreference]);
		  const applyFilter = (0, import_react2.useCallback)((next) => {
		    setFilters((current) => ({ ...current, ...next }));
		  }, []);
		  const clearFilters = (0, import_react2.useCallback)(() => {
		    setFilters(NO_FILTERS);
		    setSearch("");
		  }, []);
		  const onKeyDown = (0, import_react2.useCallback)((event) => {
		    const target = event.target;
		    if (target !== null && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) {
		      if (event.key === "Escape") target.blur();
		      return;
		    }
		    if (event.key === "/" && page.kind === "overview") {
		      event.preventDefault();
		      searchRef.current?.focus();
		      return;
		    }
		    if (page.kind === "detail") {
		      if (event.key === "Escape") {
		        event.preventDefault();
		        backToOverview();
		      }
		      return;
		    }
		    if (page.kind !== "overview" || visibleProjects.length === 0) return;
		    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
		      event.preventDefault();
		      const currentIndex = selectedId === null ? -1 : visibleProjects.findIndex((project) => project.pocId === selectedId);
		      const delta = event.key === "ArrowDown" ? 1 : -1;
		      const nextIndex = currentIndex === -1 ? 0 : Math.min(visibleProjects.length - 1, Math.max(0, currentIndex + delta));
		      setSelectedId(visibleProjects[nextIndex]?.pocId ?? null);
		      return;
		    }
		    if (event.key === "Enter" && selectedId !== null) {
		      event.preventDefault();
		      void openDetail(selectedId);
		    }
		  }, [page.kind, visibleProjects, selectedId, backToOverview, openDetail]);
		  const detailNeighbours = (0, import_react2.useMemo)(() => {
		    if (page.kind !== "detail") return { prev: null, next: null, index: 0, total: visibleProjects.length };
		    const index = visibleProjects.findIndex((project) => project.pocId === page.pocId);
		    if (index === -1) return { prev: null, next: null, index: 0, total: visibleProjects.length };
		    return {
		      prev: index > 0 ? visibleProjects[index - 1].pocId : null,
		      next: index < visibleProjects.length - 1 ? visibleProjects[index + 1].pocId : null,
		      index,
		      total: visibleProjects.length
		    };
		  }, [page, visibleProjects]);
		  const activeLocale = locale.getSnapshot().active;
		  const refreshed = (0, import_react2.useMemo)(() => {
		    if (snapshot?.fetchedAt === null || snapshot?.fetchedAt === void 0) return t("neverRefreshed");
		    return format(t("refreshedAt"), { time: clockOf(snapshot.fetchedAt, activeLocale) });
		  }, [snapshot, t, activeLocale]);
		  const autoNote = period === null ? t("autoRefreshOff") : format(t("autoRefreshOn"), { minutes: Math.round(period / 6e4) });
		  const overviewReady = snapshot !== null && snapshot.cacheReady;
		  const filteredOut = overviewReady && visibleProjects.length === 0;
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("style", { children: CONSOLE_CSS }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "wd-shell", onKeyDown, tabIndex: -1, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "page", children: [
		      page.kind === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "module-rail", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "module-tab", "data-active": "true", title: t("modulePocHint"), children: [
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "module-tab-dot" }),
		            t("modulePoc")
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "module-rail-hint", children: t("moduleMore") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "page-header", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "page-header-text", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "page-eyebrow", children: t("eyebrow") }),
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h1", { className: "page-title", children: t("modulePoc") }),
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "page-subtitle", children: t("subtitle") }),
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "page-source", children: [
		              t("dataSource"),
		              "\uFF1A",
		              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("code", { children: [
		                "github.com/",
		                snapshot?.repository ?? ""
		              ] }),
		              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "\xB7" }),
		              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: refreshed })
		            ] })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "header-actions", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn btn-primary", disabled: busy, onClick: () => {
		              void refresh(true);
		            }, children: busy ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "spinner" }),
		              " ",
		              t("refreshing")
		            ] }) : t("refresh") }),
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn", onClick: openRisks, disabled: !overviewReady, children: t("risksNav") }),
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn", onClick: openTimeline, disabled: !overviewReady, children: t("timelineNav") }),
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn", onClick: () => setSettingsOpen(true), title: autoNote, children: t("refreshSettings") })
		          ] })
		        ] }),
		        overviewReady ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
		          Toolbar,
		          {
		            filters,
		            options: filterOptions,
		            viewMode: viewPreference.viewMode,
		            sortKey: viewPreference.sortKey,
		            sortAsc,
		            shown: visibleProjects.length,
		            total: snapshot.projects.length,
		            search,
		            searchRef,
		            t,
		            onFilters: setFilters,
		            onSearch: setSearch,
		            onClearFilters: clearFilters,
		            onViewMode: saveViewMode,
		            onSort: saveSortKey,
		            onSortDirection: () => setSortAsc((value) => !value)
		          }
		        ) : null
		      ] }) : null,
		      page.kind === "risks" ? riskBoard === null ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PageLoading, { t, onBack: backToOverview }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RiskBoardPage, { board: riskBoard, t, onBack: backToOverview, onOpenProject: (pocId) => {
		        void openDetail(pocId);
		      } }) : page.kind === "timeline" ? timeline === null ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PageLoading, { t, onBack: backToOverview }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(TimelinePage, { timeline, locale: activeLocale, t, onBack: backToOverview, onOpenProject: (pocId) => {
		        void openDetail(pocId);
		      } }) : null,
		      page.kind === "risks" || page.kind === "timeline" ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: page.kind === "overview" ? "page-body" : "detail-body", children: [
		        failure !== null ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { marginBottom: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FailureBanner, { message: failure, t, busy, onRetry: () => {
		          void refresh(true);
		        } }) }) : null,
		        loading ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "empty-state", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "spinner" }),
		          " ",
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "empty-copy", children: t("loading") })
		        ] }) : page.kind === "detail" ? detail === null ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "empty-state", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: "empty-title", children: t("detailMissing") }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "empty-copy", children: format(t("detailMissingCopy"), { pocId: page.pocId }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn", onClick: backToOverview, children: t("back") })
		        ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
		          DetailPage,
		          {
		            detail,
		            gaps: detail.gaps,
		            locale: activeLocale,
		            t,
		            position: { index: detailNeighbours.index + 1, total: detailNeighbours.total },
		            onPrev: detailNeighbours.prev === null ? null : () => {
		              void openDetail(detailNeighbours.prev);
		            },
		            onNext: detailNeighbours.next === null ? null : () => {
		              void openDetail(detailNeighbours.next);
		            },
		            onBack: backToOverview,
		            onOpen: (pocId) => {
		              void openDetail(pocId);
		            }
		          }
		        ) : !overviewReady ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(EmptyState, { snapshot, t, busy, onRefresh: () => {
		          void refresh(true);
		        } }) : snapshot === null || visibleAnalysis === null ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
		          OverviewPage,
		          {
		            snapshot,
		            projects: visibleProjects,
		            gaps: visibleGaps,
		            analysis: visibleAnalysis,
		            filters,
		            viewMode: viewPreference.viewMode,
		            sortKey: viewPreference.sortKey,
		            sortAsc,
		            selectedId,
		            locale: activeLocale,
		            t,
		            filteredOut,
		            onOpen: (pocId) => {
		              void openDetail(pocId);
		            },
		            onFilter: applyFilter,
		            onClearFilters: clearFilters,
		            onViewMode: saveViewMode,
		            onSort: saveSortKey
		          }
		        )
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "page-footer", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: autoNote }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "footer-hint", children: t("keyboardHint") }),
		        statusNote === null ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "\xB7" }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: statusNote })
		        ] }),
		        overviewReady ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "spacer" }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: format(t("filterResult"), { shown: visibleProjects.length, total: snapshot.projects.length }) })
		        ] }) : null
		      ] })
		    ] }) }),
		    settingsOpen ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
		      RefreshSettings,
		      {
		        preference,
		        t,
		        onSave: savePreference,
		        onCancel: () => setSettingsOpen(false)
		      }
		    ) : null
		  ] });
		}
		function PageLoading({ t, onBack }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "page-header", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "page-header-text", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h1", { className: "page-title", children: t("loading") }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "header-actions", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn", onClick: onBack, children: t("back") }) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "page-body", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "empty-state", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "spinner" }),
		      " ",
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "empty-copy", children: t("loading") })
		    ] }) })
		  ] });
		}
		function recomputeAnalysis(projects, gaps) {
		  const STAGE_ORDER = ["G0", "G1", "G2", "G3", "G4", "closed", "unknown"];
		  const totalAmount = projects.reduce((sum, project) => sum + project.amountWan, 0);
		  const stages = STAGE_ORDER.map((key) => {
		    const bucket = projects.filter((project) => (project.closed ? "closed" : project.stage ?? "unknown") === key);
		    return {
		      key,
		      count: bucket.length,
		      amountWan: bucket.reduce((sum, project) => sum + project.amountWan, 0),
		      highGapCount: bucket.filter((project) => project.highGapCount > 0).length
		    };
		  });
		  const orgMap = /* @__PURE__ */ new Map();
		  for (const project of projects) {
		    const key = `${project.system}\0${project.company}`;
		    const existing = orgMap.get(key);
		    if (existing === void 0) orgMap.set(key, { system: project.system, company: project.company, count: 1, amountWan: project.amountWan, highGapCount: project.highGapCount > 0 ? 1 : 0 });
		    else {
		      existing.count += 1;
		      existing.amountWan += project.amountWan;
		      if (project.highGapCount > 0) existing.highGapCount += 1;
		    }
		  }
		  const typeMap = /* @__PURE__ */ new Map();
		  for (const project of projects) {
		    const existing = typeMap.get(project.pocType);
		    if (existing === void 0) typeMap.set(project.pocType, { pocType: project.pocType, count: 1, amountWan: project.amountWan });
		    else {
		      existing.count += 1;
		      existing.amountWan += project.amountWan;
		    }
		  }
		  const gapRuleMap = /* @__PURE__ */ new Map();
		  for (const item of gaps) {
		    const existing = gapRuleMap.get(item.rule);
		    if (existing === void 0) gapRuleMap.set(item.rule, { rule: item.rule, ruleNo: item.ruleNo, level: item.level, count: 1 });
		    else existing.count += 1;
		  }
		  const topAmounts = [...projects].filter((project) => project.amountWan > 0).sort((left, right) => right.amountWan - left.amountWan || left.pocId.localeCompare(right.pocId)).slice(0, 5).map((project) => ({
		    pocId: project.pocId,
		    pocName: project.name,
		    amountWan: project.amountWan,
		    share: totalAmount === 0 ? 0 : project.amountWan / totalAmount,
		    stage: project.stage,
		    closed: project.closed
		  }));
		  const dimensions = DIMENSIONS.map((key) => {
		    const present = projects.filter((project) => project.dimensions[key]).length;
		    return { key, present, missing: projects.length - present, ratio: projects.length === 0 ? 0 : present / projects.length };
		  });
		  let lastActivity = null;
		  for (const project of projects) {
		    const date = project.lastProgressDate;
		    if (date === null) continue;
		    if (lastActivity === null || date > lastActivity) lastActivity = date;
		  }
		  return {
		    stages,
		    orgs: [...orgMap.values()].sort((left, right) => right.amountWan - left.amountWan || left.system.localeCompare(right.system) || left.company.localeCompare(right.company)),
		    types: [...typeMap.values()].sort((left, right) => right.count - left.count || right.amountWan - left.amountWan || left.pocType.localeCompare(right.pocType)),
		    topAmounts,
		    dimensions,
		    gapRules: [...gapRuleMap.values()].sort((left, right) => right.count - left.count || left.ruleNo - right.ruleNo),
		    concentration: totalAmount === 0 || topAmounts.length === 0 ? 0 : topAmounts[0].amountWan / totalAmount,
		    amountMissing: projects.filter((project) => project.amountWan === 0).length,
		    withProgress: projects.filter((project) => project.progressCount > 0).length,
		    lastActivity
		  };
		}

		// src/client/index.tsx
		var import_jsx_runtime6 = require("react/jsx-runtime");
		var inject = ["slots", "locale", "connection"];
		var SIDEBAR_SLOT = "sidebar.panellist";
		var MAIN_SLOT = "main";
		function registerDictionaries(ctx) {
		  try {
		    return ctx.locale.register(NAMESPACE, { zh: { ...zh }, en: { ...en } });
		  } catch {
		    return void 0;
		  }
		}
		function apply(ctx) {
		  const lifetime = new AbortController();
		  const t = ctx.locale.bind(NAMESPACE);
		  const api = createApi(ctx.connection, lifetime.signal);
		  ctx.effect(() => {
		    const disposeDictionary = registerDictionaries(ctx);
		    return () => {
		      lifetime.abort();
		      try {
		        disposeDictionary?.();
		      } catch {
		      }
		    };
		  }, "skillre-work-dashboard client lifetime");
		  ctx.effect(
		    () => ctx.slots.inject(
		      SIDEBAR_SLOT,
		      () => ctx.slots.register({ name: SIDEBAR_SLOT, id: PANEL_ID, order: 95, label: () => t("nav") }, SidebarGlyph)
		    ),
		    "skillre-work-dashboard sidebar entry"
		  );
		  ctx.effect(
		    () => ctx.slots.inject(MAIN_SLOT, () => ctx.slots.register({ name: MAIN_SLOT, key: PANEL_ID }, () => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(WorkDashboardPage, { api, locale: ctx.locale, t }))),
		    "skillre-work-dashboard console page"
		  );
		}

		return module.exports;
	}
});
