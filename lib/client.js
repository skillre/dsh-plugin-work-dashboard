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
		  "gap.R12-stage-stalled.copy": "\u5F53\u524D\u9636\u6BB5\u5DF2\u505C\u7559 {days} \u5929\uFF08\u9608\u503C {stallDays} \u5929\uFF09\uFF0C\u6CA1\u6709\u4EFB\u4F55\u63A8\u8FDB\u3002"
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
		  "error.gh-unauthenticated": "gh is not logged in, or the logged-in account cannot read this private repository.",
		  "error.auth": "GitHub rejected the credential; run gh auth login for an account with access.",
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
		  "error.not-yaml": "Only .yaml or .yml files are accepted.",
		  "error.read-failed": "This file could not be read; try again.",
		  "error.submitFailed": "Submission failed",
		  // Submit errors the Host can report
		  "error.invalid-document": "The document did not pass validation; nothing was submitted.",
		  "error.no-changes": "This file does not differ from the stored record; nothing to submit.",
		  "error.bad-branch": "The branch name was rejected; nothing was pushed.",
		  "error.pr-failed": "gh could not create the pull request.",
		  "error.pr-exists": "A pull request already exists for that branch.",
		  "error.poc-id-exists": "That project id already exists.",
		  "error.command-missing": "git or gh is not available on this machine.",
		  "error.submit-failed": "Submission failed.",
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
		  "gap.R12-stage-stalled.copy": "The project has sat in its current stage for {days} days (threshold {stallDays}) with no movement."
		};
		function format(template, params = {}) {
		  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (whole, key) => key in params ? String(params[key]) : whole);
		}

		// src/client/view.tsx
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

		// src/client/insights.tsx
		var import_react = require("react");
		var import_jsx_runtime = require("react/jsx-runtime");
		function errorText(t, error) {
		  if (error instanceof ActionError) {
		    const key = `error.${error.code.replace(/^poc-console\//, "")}`;
		    const translated = t(key);
		    return translated === key ? error.message : translated;
		  }
		  if (error instanceof Error) return error.message;
		  return t("error.failed");
		}
		function LevelPill({ level, t }) {
		  if (level === "high") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "status-pill tone-red", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "status-dot" }),
		    t("riskHigh")
		  ] });
		  if (level === "medium") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "status-pill tone-amber", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "status-dot" }),
		    t("riskMedium")
		  ] });
		  if (level === "low") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "status-pill tone-green", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "status-dot" }),
		    t("riskLow")
		  ] });
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "status-pill tone-slate", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "status-dot" }),
		    t("riskUnset")
		  ] });
		}
		function recognitionTone(value) {
		  if (value === "\u8BA4\u53EF") return "green";
		  if (value === "\u90E8\u5206\u8BA4\u53EF") return "amber";
		  if (value === "\u672A\u8BA4\u53EF") return "red";
		  return "slate";
		}
		function RiskBoardPage({
		  api,
		  t,
		  onBack,
		  onOpenProject
		}) {
		  const [board, setBoard] = (0, import_react.useState)(null);
		  const [failure, setFailure] = (0, import_react.useState)(null);
		  (0, import_react.useEffect)(() => {
		    let live = true;
		    void (async () => {
		      try {
		        const next = await api.risks();
		        if (live) setBoard(next);
		      } catch (error) {
		        if (live) setFailure(errorText(t, error));
		      }
		    })();
		    return () => {
		      live = false;
		    };
		  }, [api, t]);
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "page-header", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "page-header-text", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "page-title", children: t("risksBoardTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "page-subtitle", children: t("risksSubtitle") }),
		        board === null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "page-source", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: format(t("riskCounts"), { high: board.counts.high, medium: board.counts.medium, low: board.counts.low, unset: board.counts.unset }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\xB7" }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: format(t("riskProjects"), { withRisks: board.projectsWithRisks, total: board.projectsTotal }) })
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "header-actions", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "btn", onClick: onBack, children: t("back") }) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "page-body", children: [
		      failure !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "failure", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "failure-text", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "failure-reason", children: failure }) }) }) : null,
		      board === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "empty-state", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spinner" }),
		        " ",
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "empty-copy", children: t("loading") })
		      ] }) : board.rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "empty-state", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "empty-title", children: t("riskNoRisks") }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "stat-grid", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "stat-card", "data-tone": "red", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stat-label", children: t("riskHigh") }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stat-value", "data-tone": "red", children: board.counts.high })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "stat-card", "data-tone": "amber", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stat-label", children: t("riskMedium") }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stat-value", "data-tone": "amber", children: board.counts.medium })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "stat-card", "data-tone": "green", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stat-label", children: t("riskLow") }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stat-value", "data-tone": "green", children: board.counts.low })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "stat-card", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stat-label", children: t("riskUnset") }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stat-value", children: board.counts.unset }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stat-note", children: t("riskUnsetHint") })
		          ] })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "panel", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "panel-header", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "panel-title", children: t("risksBoardTitle") }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "panel-kicker", children: board.rows.length })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "panel-body", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "risk-list", children: board.rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "risk-row", "data-level": row.level === "" ? "unset" : row.level, children: [
		            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "risk-head", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LevelPill, { level: row.level, t }),
		              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "risk-name", children: row.name === "" ? t("emptyField") : row.name })
		            ] }),
		            row.mitigation === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "risk-mitigation", children: [
		              t("riskMitigation"),
		              "\uFF1A",
		              row.mitigation
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "risk-foot", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "gap-link", onClick: () => onOpenProject(row.pocId), children: [
		                row.pocName,
		                " \xB7 ",
		                row.pocId
		              ] }),
		              row.gapCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "risk-gap", children: format(t("riskGapContext"), { count: row.gapCount, high: row.highGapCount }) }) : null
		            ] })
		          ] }, `${row.pocId}:${index}`)) }) })
		        ] })
		      ] })
		    ] })
		  ] });
		}
		function TimelinePage({
		  api,
		  t,
		  locale,
		  onBack,
		  onOpenProject
		}) {
		  const [timeline, setTimeline] = (0, import_react.useState)(null);
		  const [failure, setFailure] = (0, import_react.useState)(null);
		  (0, import_react.useEffect)(() => {
		    let live = true;
		    void (async () => {
		      try {
		        const next = await api.timeline();
		        if (live) setTimeline(next);
		      } catch (error) {
		        if (live) setFailure(errorText(t, error));
		      }
		    })();
		    return () => {
		      live = false;
		    };
		  }, [api, t]);
		  const months = (0, import_react.useMemo)(() => timeline?.months ?? [], [timeline]);
		  const formatDate = (0, import_react.useCallback)((value) => {
		    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value === "" ? "\u2014" : value;
		    const stamp = /* @__PURE__ */ new Date(`${value}T00:00:00`);
		    if (Number.isNaN(stamp.getTime())) return value;
		    return stamp.toLocaleDateString(locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
		  }, [locale]);
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "page-header", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "page-header-text", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "page-title", children: t("timelineTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "page-subtitle", children: t("timelineSubtitle") }),
		        timeline === null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "page-source", children: [
		          timeline.range === null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: format(t("timelineRange"), { from: formatDate(timeline.range.from), to: formatDate(timeline.range.to) }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\xB7" })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: format(t("timelineCount"), { count: timeline.entries.length }) }),
		          timeline.silentProjects.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\xB7" }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: format(t("timelineSilent"), { count: timeline.silentProjects.length }) })
		          ] }) : null
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "header-actions", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "btn", onClick: onBack, children: t("back") }) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "page-body", children: [
		      failure !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "failure", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "failure-text", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "failure-reason", children: failure }) }) }) : null,
		      timeline === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "empty-state", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spinner" }),
		        " ",
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "empty-copy", children: t("loading") })
		      ] }) : timeline.entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "empty-state", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "empty-title", children: t("timelineEmpty") }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		        months.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "month-strip", children: months.map((month) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "month-cell", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "month-label", children: month.month }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "month-count", children: format(t("timelineMonth"), { month: "", count: month.count }).replace(/^：|^: /, "") })
		        ] }, month.month)) }) : null,
		        timeline.silentProjects.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "panel", style: { marginBottom: 16 }, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "panel-header", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "panel-title", children: format(t("timelineSilent"), { count: timeline.silentProjects.length }) }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "panel-body padded", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "chip-row", children: timeline.silentProjects.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "chip chip-button", onClick: () => onOpenProject(project.pocId), children: [
		              project.pocName,
		              " \xB7 ",
		              project.pocId
		            ] }, project.pocId)) }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "gap-copy", style: { margin: "8px 0 0" }, children: t("timelineSilentHint") })
		          ] })
		        ] }) : null,
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "timeline", children: timeline.entries.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "timeline-item", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "timeline-marker", "aria-hidden": "true" }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "timeline-content", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "timeline-heading", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "timeline-date", children: formatDate(entry.date) }),
		              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "timeline-meta", children: entry.type === "" ? t("roundUnnumbered") : entry.type }),
		              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "gap-link", onClick: () => onOpenProject(entry.pocId), children: [
		                entry.pocName,
		                " \xB7 ",
		                entry.pocId
		              ] })
		            ] }),
		            entry.goal === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "timeline-copy", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: entry.goal }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "timeline-copy", children: [
		              entry.actual === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
		                t("timelineActual"),
		                "\uFF1A",
		                entry.actual
		              ] }),
		              entry.evidence === "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "timeline-missing", children: t("timelineNoEvidence") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
		                t("evidenceLabel"),
		                "\uFF1A",
		                entry.evidence
		              ] }),
		              entry.customerFeedback === "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "timeline-missing", children: t("timelineNoFeedback") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
		                t("feedbackLabel"),
		                "\uFF1A",
		                entry.customerFeedback
		              ] }),
		              entry.completion === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
		                t("completionLabel"),
		                "\uFF1A",
		                entry.completion
		              ] })
		            ] }),
		            entry.recognition === "" && entry.gate3_1 === "" && entry.gate3_2 === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "timeline-tags", children: [
		              entry.recognition === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: `status-pill tone-${recognitionTone(entry.recognition)}`, children: [
		                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "status-dot" }),
		                t("recognitionLabel"),
		                "\uFF1A",
		                entry.recognition
		              ] }),
		              entry.gate3_1 === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "chip", children: [
		                t("gate3_1Label"),
		                "\uFF1A",
		                entry.gate3_1
		              ] }),
		              entry.gate3_2 === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "chip", children: [
		                t("gate3_2Label"),
		                "\uFF1A",
		                entry.gate3_2
		              ] })
		            ] })
		          ] })
		        ] }, `${entry.pocId}:${entry.date}:${index}`)) })
		      ] })
		    ] })
		  ] });
		}

		// src/client/styles.ts
		var CONSOLE_CSS = `
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
		  padding: 20px 32px 18px;
		  background: var(--wd-surface);
		  border: 1px solid var(--wd-hairline);
		  border-radius: 0 0 0 0;
		  box-shadow: var(--wd-shadow-1);
		  position: relative; z-index: 2;
		}
		.wd-shell .page-header-text { flex: 1 1 auto; min-width: 0; }
		.wd-shell .page-eyebrow {
		  display: flex; align-items: center; gap: 6px;
		  font-size: 11px; line-height: 16px; letter-spacing: .06em;
		  text-transform: uppercase; color: var(--dsw-alias-label-tertiary);
		  margin-bottom: 3px;
		}
		.wd-shell .page-title {
		  margin: 0; font-size: 21px; line-height: 28px; font-weight: 650;
		  letter-spacing: -.01em; display: flex; align-items: center; gap: 10px;
		}
		.wd-shell .page-subtitle { margin: 3px 0 0; font-size: 12.5px; line-height: 19px; color: var(--dsw-alias-label-secondary); }
		.wd-shell .page-source {
		  margin: 7px 0 0; font-size: 11.5px; line-height: 17px;
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
		  padding: 24px 32px 40px;
		}
		.wd-shell .page-footer {
		  flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
		  padding: 8px 32px; min-height: 32px;
		  border-top: 1px solid var(--wd-hairline);
		  background: var(--wd-surface);
		  font-size: 11.5px; color: var(--dsw-alias-label-tertiary);
		}

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
		.wd-shell .btn-icon { width: 30px; padding: 0; justify-content: center; }

		/* ---------- stat grid ---------- */
		.wd-shell .stat-grid {
		  display: grid; grid-template-columns: repeat(auto-fit, minmax(158px, 1fr));
		  gap: 12px; margin-bottom: 22px;
		}
		.wd-shell .stat-card {
		  position: relative; overflow: hidden;
		  padding: 15px 17px 13px;
		  border-radius: 11px; border: 1px solid var(--wd-hairline);
		  background: var(--wd-surface);
		  box-shadow: var(--wd-shadow-1);
		  transition: box-shadow .16s ease, transform .16s ease;
		}
		.wd-shell .stat-card:hover { box-shadow: var(--wd-shadow-2); transform: translateY(-1px); }
		.wd-shell .stat-card::before {
		  content: ''; position: absolute; inset: 0 auto 0 0; width: 3px;
		  background: var(--wd-slate); opacity: .5;
		}
		.wd-shell .stat-card[data-tone="blue"]::before { background: var(--wd-primary); opacity: .9; }
		.wd-shell .stat-card[data-tone="amber"]::before { background: var(--wd-amber); opacity: .9; }
		.wd-shell .stat-card[data-tone="red"]::before { background: var(--wd-red); opacity: .9; }
		.wd-shell .stat-card[data-tone="green"]::before { background: var(--wd-green); opacity: .9; }
		.wd-shell .stat-card::after {
		  content: ''; position: absolute; right: -26px; top: -26px;
		  width: 74px; height: 74px; border-radius: 50%;
		  background: var(--wd-slate-soft); opacity: .5;
		}
		.wd-shell .stat-card[data-tone="blue"]::after { background: var(--wd-primary-soft); }
		.wd-shell .stat-card[data-tone="amber"]::after { background: var(--wd-amber-soft); }
		.wd-shell .stat-card[data-tone="red"]::after { background: var(--wd-red-soft); }
		.wd-shell .stat-card[data-tone="green"]::after { background: var(--wd-green-soft); }
		.wd-shell .stat-label { font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-secondary); font-weight: 500; }
		.wd-shell .stat-value {
		  margin-top: 3px; font-size: 27px; line-height: 33px; font-weight: 650;
		  font-variant-numeric: tabular-nums; letter-spacing: -.02em;
		  position: relative; z-index: 1;
		}
		.wd-shell .stat-value[data-tone="amber"] { color: var(--wd-amber); }
		.wd-shell .stat-value[data-tone="red"] { color: var(--wd-red); }
		.wd-shell .stat-value[data-tone="green"] { color: var(--wd-green); }
		.wd-shell .stat-note { margin-top: 2px; font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-tertiary); }

		/* ---------- panels ---------- */
		.wd-shell .workspace-grid { display: grid; grid-template-columns: minmax(0, 1fr) 336px; gap: 22px; align-items: start; }
		@media (max-width: 1120px) { .wd-shell .workspace-grid { grid-template-columns: minmax(0, 1fr); } }
		.wd-shell .primary-column, .wd-shell .secondary-column { min-width: 0; display: flex; flex-direction: column; gap: 18px; }
		.wd-shell .panel {
		  border: 1px solid var(--wd-hairline); border-radius: 11px;
		  background: var(--wd-surface); overflow: hidden;
		  box-shadow: var(--wd-shadow-1);
		}
		.wd-shell .panel-header {
		  display: flex; align-items: baseline; gap: 9px;
		  padding: 13px 18px 11px;
		  border-bottom: 1px solid var(--wd-hairline);
		  background: linear-gradient(180deg, var(--wd-surface) 0%, var(--wd-inset) 140%);
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
		.wd-shell .panel-footer { border-top: 1px solid var(--wd-hairline); background: var(--wd-inset); }

		/* ---------- project table ---------- */
		.wd-shell .project-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
		.wd-shell .table-head th {
		  padding: 9px 12px; text-align: left; white-space: nowrap;
		  font-size: 10.5px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
		  color: var(--dsw-alias-label-tertiary);
		  border-bottom: 1px solid var(--wd-hairline);
		  background: var(--wd-inset);
		}
		.wd-shell .table-head th:first-child { padding-left: 18px; }
		.wd-shell .table-head th:last-child { padding-right: 18px; text-align: right; }
		.wd-shell .project-row {
		  border-bottom: 1px solid var(--wd-hairline);
		  cursor: pointer; transition: background .1s ease;
		}
		.wd-shell .project-row:last-child { border-bottom: 0; }
		.wd-shell .project-row:hover { background: var(--wd-inset); }
		.wd-shell .project-row:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: -2px; }
		.wd-shell .project-row td { padding: 11px 12px; vertical-align: middle; }
		.wd-shell .project-row td:first-child { padding-left: 18px; }
		.wd-shell .project-row td:last-child { padding-right: 18px; text-align: right; }
		.wd-shell .project-name {
		  font-size: 13px; line-height: 19px; font-weight: 600;
		  display: block; overflow-wrap: anywhere; letter-spacing: -.005em;
		}
		.wd-shell .project-id {
		  font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary);
		  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		}
		.wd-shell .project-meta { font-size: 11px; line-height: 17px; color: var(--dsw-alias-label-secondary); }
		.wd-shell .project-meta.is-muted { color: var(--dsw-alias-label-tertiary); font-style: italic; }
		.wd-shell .amount-cell {
		  display: block; text-align: right;
		  font-variant-numeric: tabular-nums; font-weight: 650; font-size: 12.5px;
		}
		.wd-shell .project-org {
		  display: block; font-size: 12px; line-height: 18px; font-weight: 550;
		  overflow-wrap: anywhere;
		}
		.wd-shell .progress-summary {
		  font-size: 11.5px; line-height: 17px;
		  color: var(--dsw-alias-label-secondary);
		  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
		}
		.wd-shell .stage-cell { display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
		.wd-shell .row-actions { display: flex; gap: 5px; justify-content: flex-end; }

		/* ---------- four-dimension cells ---------- */
		.wd-shell .dim-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
		.wd-shell .dim-cell {
		  display: flex; flex-direction: column; gap: 1px;
		  padding: 5px 7px; border-radius: 7px;
		  border: 1px solid var(--wd-hairline); background: var(--wd-inset);
		  min-width: 0; transition: border-color .12s ease;
		}
		.wd-shell .dim-cell[data-present="true"] { border-color: transparent; background: var(--wd-green-soft); }
		.wd-shell .dim-cell[data-present="false"] { border-color: transparent; background: var(--wd-red-soft); }
		.wd-shell .dim-label {
		  font-size: 9.5px; line-height: 13px; letter-spacing: .02em;
		  color: var(--dsw-alias-label-tertiary);
		  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		}
		.wd-shell .dim-mark { font-size: 11px; line-height: 16px; font-weight: 650; white-space: nowrap; }
		.wd-shell .dim-cell[data-present="true"] .dim-mark { color: var(--wd-green); }
		.wd-shell .dim-cell[data-present="false"] .dim-mark { color: var(--wd-red); }

		/* ---------- pills and dots ---------- */
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
		.wd-shell .gap-cell { display: flex; align-items: baseline; gap: 3px; white-space: nowrap; }
		.wd-shell .gap-count { font-variant-numeric: tabular-nums; font-weight: 650; font-size: 13px; }
		.wd-shell .gap-count[data-level="high"] { color: var(--wd-red); }
		.wd-shell .gap-count[data-level="medium"] { color: var(--wd-amber); }
		.wd-shell .gap-count[data-level="none"] { color: var(--wd-green); }

		/* ---------- compact stage dots ---------- */
		.wd-shell .stage-dots { display: flex; align-items: center; gap: 3px; }
		.wd-shell .stage-dot {
		  width: 6px; height: 6px; border-radius: 50%;
		  background: var(--wd-hairline); border: 1px solid var(--wd-hairline);
		}
		.wd-shell .stage-dot[data-done="true"] { background: var(--wd-green); border-color: var(--wd-green); }
		.wd-shell .stage-dot[data-current="true"] {
		  background: var(--wd-primary); border-color: var(--wd-primary);
		  box-shadow: 0 0 0 2px var(--wd-primary-ring);
		}

		/* ---------- full stage rail ---------- */
		.wd-shell .stage-track { display: flex; align-items: flex-end; padding: 10px 0 4px; }
		.wd-shell .stage-step {
		  position: relative; flex: 1 1 0;
		  display: flex; flex-direction: column; align-items: center; gap: 5px;
		  min-width: 0;
		}
		.wd-shell .stage-step + .stage-step::before {
		  content: ''; position: absolute; top: 10px; right: 50%; left: -50%;
		  height: 2px; background: var(--wd-hairline); z-index: 0;
		}
		.wd-shell .stage-step[data-reached="true"] + .stage-step::before { background: var(--wd-green); opacity: .55; }
		.wd-shell .stage-marker {
		  position: relative; z-index: 1;
		  width: 22px; height: 22px; border-radius: 50%;
		  border: 2px solid var(--wd-hairline); background: var(--wd-surface);
		  display: flex; align-items: center; justify-content: center;
		  font-size: 10px; font-weight: 650; color: var(--dsw-alias-label-tertiary);
		  transition: transform .14s ease;
		}
		.wd-shell .stage-step[data-done="true"] .stage-marker {
		  border-color: var(--wd-green); background: var(--wd-green); color: #fff;
		  box-shadow: 0 1px 3px rgba(33, 133, 104, .3);
		}
		.wd-shell .stage-step[data-current="true"] .stage-marker {
		  border-color: var(--wd-primary); background: var(--wd-primary); color: #fff;
		  box-shadow: 0 0 0 4px var(--wd-primary-soft), 0 1px 4px rgba(40, 100, 232, .35);
		  transform: scale(1.06);
		}
		.wd-shell .stage-label { font-size: 11.5px; line-height: 16px; font-weight: 650; color: var(--dsw-alias-label-secondary); }
		.wd-shell .stage-step[data-current="true"] .stage-label { color: var(--wd-primary); }
		.wd-shell .stage-caption { font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-tertiary); text-align: center; overflow-wrap: anywhere; }
		.wd-shell .stage-step[data-current="true"] .stage-caption { color: var(--wd-primary); }

		/* ---------- four-dimension summary (detail) ---------- */
		.wd-shell .status-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
		@media (max-width: 900px) { .wd-shell .status-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
		.wd-shell .summary-item {
		  padding: 13px 15px; border-radius: 10px;
		  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
		  display: flex; flex-direction: column; gap: 4px; min-width: 0;
		  box-shadow: var(--wd-shadow-1);
		  transition: box-shadow .15s ease;
		}
		.wd-shell .summary-item:hover { box-shadow: var(--wd-shadow-2); }
		.wd-shell .summary-item[data-present="true"] { border-left: 3px solid var(--wd-green); }
		.wd-shell .summary-item[data-present="false"] { border-left: 3px solid var(--wd-red); }
		.wd-shell .summary-label { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); font-weight: 500; }
		.wd-shell .summary-origin {
		  margin-left: 6px; padding: 0 5px; border-radius: 4px;
		  font-size: 9.5px; font-weight: 500;
		  color: var(--dsw-alias-label-tertiary);
		  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
		}
		.wd-shell .summary-value { font-size: 14px; line-height: 20px; font-weight: 650; overflow-wrap: anywhere; }
		.wd-shell .summary-item[data-present="true"] .summary-value { color: var(--wd-green); }
		.wd-shell .summary-item[data-present="false"] .summary-value { color: var(--wd-red); }
		.wd-shell .summary-note { font-size: 11px; line-height: 17px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }

		/* ---------- gaps / pending ---------- */
		.wd-shell .gap-list { display: flex; flex-direction: column; }
		.wd-shell .gap-item {
		  display: flex; align-items: flex-start; gap: 9px;
		  padding: 10px 15px; border-bottom: 1px solid var(--wd-hairline);
		  transition: background .1s ease;
		}
		.wd-shell .gap-item:last-child { border-bottom: 0; }
		.wd-shell .gap-item:hover { background: var(--wd-inset); }
		.wd-shell .gap-flag { flex: none; width: 7px; height: 7px; margin-top: 6px; border-radius: 50%; background: var(--wd-slate); }
		.wd-shell .gap-level-high .gap-flag { background: var(--wd-red); box-shadow: 0 0 0 3px var(--wd-red-soft); }
		.wd-shell .gap-level-medium .gap-flag { background: var(--wd-amber); box-shadow: 0 0 0 3px var(--wd-amber-soft); }
		.wd-shell .gap-text { min-width: 0; flex: 1 1 auto; }
		.wd-shell .gap-title { font-size: 12.5px; line-height: 18px; font-weight: 600; overflow-wrap: anywhere; }
		.wd-shell .gap-copy { font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
		.wd-shell .gap-project { margin-top: 3px; font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
		.wd-shell .gap-link { border: 0; background: transparent; padding: 0; color: var(--wd-primary); cursor: pointer; font-size: 11px; }
		.wd-shell .gap-link:hover { text-decoration: underline; }

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
		@media (prefers-reduced-motion: reduce) {
		  .wd-shell .spinner { animation-duration: 2.4s; }
		  .wd-shell .stat-card, .wd-shell .summary-item, .wd-shell .btn, .wd-shell .stage-marker { transition: none; }
		}

		/* ---------- detail page ---------- */
		.wd-shell .project-hero {
		  display: flex; flex-direction: column; gap: 12px;
		  padding: 22px 32px 18px;
		  background: var(--wd-surface);
		  border-bottom: 1px solid var(--wd-hairline);
		  box-shadow: var(--wd-shadow-1);
		  position: relative; z-index: 2;
		}
		.wd-shell .project-hero-top { display: flex; align-items: flex-start; gap: 16px; }
		.wd-shell .project-hero-text { min-width: 0; flex: 1 1 auto; }
		.wd-shell .project-title { margin: 0; font-size: 20px; line-height: 28px; font-weight: 650; letter-spacing: -.01em; overflow-wrap: anywhere; }
		.wd-shell .project-identity { margin: 4px 0 0; font-size: 11.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
		.wd-shell .project-hero-actions { flex: none; display: flex; gap: 8px; align-items: center; }
		.wd-shell .detail-body {
		  flex: 1 1 auto; overflow: auto; overscroll-behavior: contain;
		  padding: 22px 32px 40px;
		  display: flex; flex-direction: column; gap: 24px;
		}
		.wd-shell .detail-section { display: flex; flex-direction: column; gap: 11px; }
		.wd-shell .section-heading {
		  margin: 0; font-size: 13.5px; line-height: 20px; font-weight: 650;
		  display: flex; align-items: center; gap: 9px;
		  padding-bottom: 8px; border-bottom: 1px solid var(--wd-hairline);
		}
		.wd-shell .section-kicker { font-size: 10.5px; font-weight: 500; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .detail-list {
		  display: flex; flex-direction: column;
		  border: 1px solid var(--wd-hairline); border-radius: 10px;
		  background: var(--wd-surface); overflow: hidden;
		  box-shadow: var(--wd-shadow-1);
		}
		.wd-shell .detail-row {
		  display: grid; grid-template-columns: 176px minmax(0, 1fr); gap: 14px;
		  padding: 10px 15px; border-bottom: 1px solid var(--wd-hairline); align-items: start;
		}
		.wd-shell .detail-row:last-child { border-bottom: 0; }
		.wd-shell .detail-label { font-size: 11.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
		.wd-shell .detail-value { font-size: 12.5px; line-height: 19px; overflow-wrap: anywhere; }
		.wd-shell .detail-value.is-empty { color: var(--dsw-alias-label-tertiary); font-style: italic; }
		.wd-shell .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
		.wd-shell .chip {
		  padding: 2px 9px; border-radius: 20px; font-size: 11.5px; line-height: 18px;
		  background: var(--wd-inset); color: var(--dsw-alias-label-secondary);
		  border: 1px solid var(--wd-hairline);
		}
		.wd-shell .gate-row {
		  display: grid; grid-template-columns: 44px 96px minmax(0, 1fr); gap: 11px;
		  align-items: center; padding: 10px 15px;
		  border-bottom: 1px solid var(--wd-hairline); font-size: 12px;
		}
		.wd-shell .gate-row:last-child { border-bottom: 0; }
		.wd-shell .gate-stage { font-weight: 650; font-variant-numeric: tabular-nums; }
		.wd-shell .gate-copy { color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }

		/* ---------- timeline ---------- */
		.wd-shell .timeline { position: relative; display: flex; flex-direction: column; padding-left: 4px; }
		.wd-shell .timeline-item { position: relative; display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 12px; padding: 0 0 18px; }
		.wd-shell .timeline-item:last-child { padding-bottom: 0; }
		.wd-shell .timeline-marker { position: relative; display: flex; align-items: flex-start; justify-content: center; }
		.wd-shell .timeline-marker::before {
		  content: ''; width: 10px; height: 10px; margin-top: 5px; border-radius: 50%;
		  background: var(--wd-primary);
		  box-shadow: 0 0 0 3px var(--wd-primary-soft);
		}
		.wd-shell .timeline-item:not(:last-child) .timeline-marker::after {
		  content: ''; position: absolute; top: 19px; bottom: -18px; width: 1px;
		  background: var(--wd-hairline);
		}
		.wd-shell .timeline-content { min-width: 0; }
		.wd-shell .timeline-heading { display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap; }
		.wd-shell .timeline-date { font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }
		.wd-shell .timeline-meta { font-size: 11px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .timeline-copy { margin-top: 4px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; display: flex; flex-direction: column; gap: 2px; }
		.wd-shell .timeline-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
		.wd-shell .timeline-missing { color: var(--wd-amber); font-style: italic; opacity: .9; }

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

		/* ---------- export page ---------- */
		.wd-shell .export-toolbar { display: flex; gap: 6px; padding: 11px 18px; border-bottom: 1px solid var(--wd-hairline); background: var(--wd-inset); }
		.wd-shell .export-list { display: flex; flex-direction: column; max-height: 430px; overflow: auto; }
		.wd-shell .export-row {
		  display: flex; align-items: center; gap: 11px;
		  padding: 10px 18px; border-bottom: 1px solid var(--wd-hairline);
		  cursor: pointer; transition: background .1s ease;
		}
		.wd-shell .export-row:last-child { border-bottom: 0; }
		.wd-shell .export-row:hover { background: var(--wd-inset); }
		.wd-shell .export-row[data-selected="true"] { background: var(--wd-primary-soft); }
		.wd-shell .export-row input[type="checkbox"] { accent-color: var(--wd-primary); flex: none; margin: 0; }
		.wd-shell .export-name { flex: 1 1 auto; min-width: 0; font-size: 13px; font-weight: 550; overflow-wrap: anywhere; }
		.wd-shell .export-stage { flex: none; font-size: 11px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; }

		/* ---------- risk board ---------- */
		.wd-shell .risk-list { display: flex; flex-direction: column; }
		.wd-shell .risk-row {
		  padding: 12px 18px; border-bottom: 1px solid var(--wd-hairline);
		  transition: background .1s ease;
		}
		.wd-shell .risk-row:last-child { border-bottom: 0; }
		.wd-shell .risk-row:hover { background: var(--wd-inset); }
		.wd-shell .risk-row[data-level="high"] { border-left: 3px solid var(--wd-red); }
		.wd-shell .risk-row[data-level="medium"] { border-left: 3px solid var(--wd-amber); }
		.wd-shell .risk-row[data-level="low"] { border-left: 3px solid var(--wd-green); }
		.wd-shell .risk-row[data-level="unset"] { border-left: 3px solid var(--wd-hairline); }
		.wd-shell .risk-head { display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap; }
		.wd-shell .risk-name { font-size: 13px; line-height: 20px; font-weight: 600; overflow-wrap: anywhere; }
		.wd-shell .risk-mitigation { margin-top: 3px; font-size: 11.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
		.wd-shell .risk-foot { display: flex; align-items: center; gap: 11px; margin-top: 4px; flex-wrap: wrap; }
		.wd-shell .risk-gap { font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }

		/* ---------- global timeline ---------- */
		.wd-shell .month-strip { display: flex; gap: 9px; overflow-x: auto; padding-bottom: 14px; margin-bottom: 4px; }
		.wd-shell .month-cell {
		  flex: none; display: flex; flex-direction: column; gap: 2px;
		  padding: 8px 13px; border-radius: 9px;
		  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
		  box-shadow: var(--wd-shadow-1);
		}
		.wd-shell .month-label { font-size: 10.5px; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .month-count { font-size: 15px; line-height: 20px; font-weight: 650; }
		.wd-shell .chip-button { border: 0; cursor: pointer; font-family: inherit; }
		.wd-shell .chip-button:hover { background: var(--wd-primary-soft); color: var(--wd-primary); }

		/* ---------- sidebar glyph ---------- */
		.wd-glyph { display: block; }
		`;

		// src/client/view.tsx
		var import_jsx_runtime2 = require("react/jsx-runtime");
		function SidebarGlyph({ size = 18 }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { className: "wd-glyph", width: size, height: size, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "3", y: "4.5", width: "18", height: "15", rx: "3.2", stroke: "currentColor", strokeWidth: "1.6" }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "6", y: "8", width: "5.4", height: "3.6", rx: "1.2", fill: "currentColor", opacity: "0.85" }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "12.6", y: "8", width: "5.4", height: "3.6", rx: "1.2", fill: "currentColor", opacity: "0.35" }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "6", y: "13", width: "12", height: "3.4", rx: "1.2", fill: "currentColor", opacity: "0.5" })
		  ] });
		}
		function formatStamp(value, locale, withTime = false) {
		  if (value === null || value === "") return "";
		  const stamp = new Date(value.length === 10 ? `${value}T00:00:00` : value);
		  if (Number.isNaN(stamp.getTime())) return value;
		  const zh2 = locale.toLowerCase().startsWith("zh");
		  return stamp.toLocaleString(zh2 ? "zh-CN" : "en-US", {
		    year: "numeric",
		    month: "2-digit",
		    day: "2-digit",
		    ...withTime ? { hour: "2-digit", minute: "2-digit" } : {}
		  });
		}
		function clockOf(value, locale) {
		  if (value === null) return "";
		  const stamp = new Date(value);
		  if (Number.isNaN(stamp.getTime())) return "";
		  return stamp.toLocaleTimeString(locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" });
		}
		var DIMENSION_LABELS = {
		  achievement: "dimAchievement",
		  evidence: "dimEvidence",
		  recognition: "dimRecognition",
		  nextMilestone: "dimNextMilestone"
		};
		function stageTone(stage, closed) {
		  if (closed) return "green";
		  if (stage === null) return "slate";
		  return "blue";
		}
		function stagePill(t, project) {
		  if (project.closed) return t("stageClosed");
		  if (project.stageLabel !== "") return project.stageLabel;
		  return t("stageUnknown");
		}
		function StageDots({ summary, t }) {
		  const currentIndex = summary.stage === null ? -1 : STAGES.indexOf(summary.stage);
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stage-dots", role: "img", "aria-label": t("stageTrack"), children: STAGES.map((stage, index) => {
		    const done = summary.stageDone[index] === true;
		    const current = !summary.closed && index === currentIndex;
		    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		      "span",
		      {
		        className: "stage-dot",
		        "data-done": done,
		        "data-current": current,
		        title: `${t(`stage${stage}`)} \xB7 ${done ? t("stageDone") : current ? t("stageCurrent") : t("stagePending")}`
		      },
		      stage
		    );
		  }) });
		}
		function StageTrack({ summary, t, compact = false }) {
		  const currentIndex = summary.stage === null ? -1 : STAGES.indexOf(summary.stage);
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stage-track", role: "list", "aria-label": t("stageTrack"), children: STAGES.map((stage, index) => {
		    const done = summary.stageDone[index] === true;
		    const current = !summary.closed && index === currentIndex;
		    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
		      "div",
		      {
		        className: "stage-step",
		        role: "listitem",
		        "data-done": done,
		        "data-current": current,
		        "data-reached": done || current,
		        "aria-current": current ? "step" : void 0,
		        title: `${t(`stage${stage}`)} \xB7 ${done ? t("stageDone") : current ? t("stageCurrent") : t("stagePending")}`,
		        children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stage-marker", children: done ? "\u2713" : current ? "\u25C9" : index + 1 }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stage-label", children: stage }),
		          compact ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stage-caption", children: done ? t("stageDone") : current ? t("stageCurrent") : t("stagePending") })
		        ]
		      },
		      stage
		    );
		  }) });
		}
		function StatGrid({ snapshot, t }) {
		  const stats = snapshot.stats;
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "stat-grid", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "stat-card", "data-tone": "blue", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stat-label", children: t("statTotalProjects") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stat-value", children: stats.total }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stat-note", children: t("statTotalNote") })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "stat-card", "data-tone": "green", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stat-label", children: t("statG0Passed") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stat-value", "data-tone": "green", children: stats.g0Passed }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "stat-note", children: [
		        t("statG0CompleteNote"),
		        " ",
		        stats.g0Complete
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "stat-card", "data-tone": "blue", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stat-label", children: t("statInProgress") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stat-value", children: stats.inProgress }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "stat-note", children: [
		        t("statStoppedNote"),
		        " ",
		        stats.stopped
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "stat-card", "data-tone": "amber", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stat-label", children: t("statAmount") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stat-value", "data-tone": "amber", children: formatWan(stats.amountTotalWan) }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "stat-note", children: t("statAmountUnit") })
		    ] })
		  ] });
		}
		function formatWan(value) {
		  const rounded = Math.round(value * 10) / 10;
		  return rounded.toLocaleString("zh-CN", { maximumFractionDigits: 1 });
		}
		function ProjectTable({ snapshot, t, locale, onOpen }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { className: "project-table", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("thead", { className: "table-head", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { width: "22%" }, children: t("colProject") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { width: "14%" }, children: t("colOrg") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { width: "13%" }, children: t("colStage") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { width: "9%" }, children: t("colAmount") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { width: "24%" }, children: t("colLatestProgress") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { width: "6%" }, children: t("colGaps") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: { width: "12%" }, children: t("colAction") })
		    ] }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tbody", { children: snapshot.projects.map((project) => {
		      const level = project.highGapCount > 0 ? "high" : project.gapCount > 0 ? "medium" : "none";
		      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
		        "tr",
		        {
		          className: "project-row",
		          tabIndex: 0,
		          onClick: () => onOpen(project.pocId),
		          onKeyDown: (event) => {
		            if (event.key === "Enter" || event.key === " ") {
		              event.preventDefault();
		              onOpen(project.pocId);
		            }
		          },
		          children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("td", { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "project-name", children: project.name }),
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "project-id", children: [
		                project.pocId,
		                project.owner === "" ? "" : ` \xB7 ${project.owner}`
		              ] })
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("td", { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "project-org", children: project.system === "" ? t("emptyField") : project.system }),
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "project-id", children: project.company === "" ? t("emptyField") : project.company })
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "stage-cell", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: `status-pill tone-${stageTone(project.stage, project.closed)}`, children: [
		                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "status-dot" }),
		                stagePill(t, project)
		              ] }),
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StageDots, { summary: project, t })
		            ] }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "amount-cell", children: project.amountWan === 0 ? "\u2014" : formatWan(project.amountWan) }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: project.progressCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "project-meta is-muted", children: t("noProgressYet") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "progress-summary", children: project.lastProgressSummary === "" ? t("emptyField") : project.lastProgressSummary }),
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "project-id", children: [
		                formatStamp(project.lastProgressDate ?? "", locale),
		                " \xB7 ",
		                format(t("progressCount"), { count: project.progressCount })
		              ] })
		            ] }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "gap-cell", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "gap-count", "data-level": level, children: project.gapCount === 0 ? "\u2014" : project.gapCount }),
		              project.highGapCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "project-meta", children: [
		                project.highGapCount,
		                "!"
		              ] }) : null
		            ] }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "row-actions", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		              "button",
		              {
		                type: "button",
		                className: "btn btn-small",
		                onClick: (event) => {
		                  event.stopPropagation();
		                  onOpen(project.pocId);
		                },
		                children: t("detail")
		              }
		            ) }) })
		          ]
		        },
		        project.pocId
		      );
		    }) })
		  ] });
		}
		function PendingList({ gaps, t, onOpen }) {
		  if (gaps.length === 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "panel-body padded", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "empty-copy", style: { margin: 0 }, children: t("pendingEmpty") }) });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "gap-list", children: gaps.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `gap-item gap-level-${item.level}`, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "gap-flag", "aria-hidden": "true" }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "gap-text", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "gap-title", children: format(t(`gap.${item.rule}.title`), { ...item.params ?? {} }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "gap-copy", children: format(t(`gap.${item.rule}.copy`), {
		        ...item.params ?? {},
		        // -1 is the Host's sentinel for "no timeline record at all",
		        // which is not the same thing as "not refreshed yet".
		        days: item.params?.days === -1 ? t("noTimeline") : String(item.params?.days ?? "")
		      }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "gap-project", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: item.pocName === "" ? item.pocId : item.pocName }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\xB7" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: item.pocId }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "gap-link", onClick: () => onOpen(item.pocId), children: t("openDetail") })
		      ] })
		    ] })
		  ] }, `${item.pocId}:${item.rule}`)) });
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
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "modal-overlay", role: "presentation", onMouseDown: (event) => {
		    if (event.target === event.currentTarget) onCancel();
		  }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "modal-header", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "modal-title", children: t("refreshSettings") }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "modal-content", children: [
		          rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "checkbox-row", "data-selected": interval === row.value, children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "radio", name: "poc-refresh-interval", value: row.value, checked: interval === row.value, onChange: () => setIntervalValue(row.value) }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: row.label })
		          ] }, row.value)),
		          interval === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "inline-field", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("customMinutes") })
		          ] }) : null,
		          interval === "custom" && !minutesValid ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "form-error", children: format(t("customMinutesError"), { min: CUSTOM_MINUTES_MIN, max: CUSTOM_MINUTES_MAX }) }) : null,
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "helper-box", children: interval === "off" ? t("autoRefreshOff") : format(t("autoRefreshOn"), {
		            minutes: interval === "10m" ? 10 : interval === "1h" ? 60 : minutesValid ? clampMinutes(parsedMinutes) : 0
		          }) })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "modal-footer", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "spacer" }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "btn", onClick: onCancel, children: t("cancel") }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "empty-state", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "empty-icon", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: "34", height: "34", viewBox: "0 0 24 24", fill: "none", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.5 7.2l8.5-4.2 8.5 4.2v9.6L12 21l-8.5-4.2V7.2z", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.5 7.2L12 11.6l8.5-4.4M12 11.6V21", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" })
		    ] }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "empty-title", children: t("emptyTitle") }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "empty-copy", children: t("emptyCopy") }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "btn btn-primary", disabled: busy, onClick: onRefresh, children: busy ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "spinner" }),
		      " ",
		      t("refreshing")
		    ] }) : t("emptyRefresh") }),
		    busy ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "empty-copy", style: { marginTop: 6 }, children: t("refreshingHint") }) : null,
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "empty-meta", children: [
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
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "failure", role: "alert", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "failure-text", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "failure-title", children: [
		        "\u26A0 ",
		        t("failureTitle")
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "failure-reason", children: [
		        t("failureReason"),
		        "\uFF1A",
		        message
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "btn btn-small", disabled: busy, onClick: onRetry, children: t("failureRetry") })
		  ] });
		}
		function errorText2(t, error) {
		  if (error instanceof ActionError) {
		    const key = `error.${error.code.replace(/^poc-console\//, "")}`;
		    const translated = t(key);
		    return translated === key ? error.message : translated;
		  }
		  if (error instanceof Error) return error.message;
		  return t("error.failed");
		}
		function OverviewPage({ snapshot, t, locale, onOpen }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StatGrid, { snapshot, t }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "workspace-grid", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "primary-column", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "panel", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "panel-header", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "panel-title", children: t("tableTitle") }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "panel-kicker", children: snapshot.projects.length })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "panel-body", children: snapshot.projects.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "panel-body padded", children: t("noProjects") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ProjectTable, { snapshot, t, locale, onOpen }) })
		        ] }),
		        snapshot.warnings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "panel", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "panel-header", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "panel-title", children: t("warningsTitle") }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "panel-kicker", children: snapshot.warnings.length })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "panel-body padded", children: snapshot.warnings.map((warning) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "gap-copy", style: { margin: "0 0 4px" }, children: [
		            "\xB7 ",
		            warning
		          ] }, warning)) })
		        ] }) : null
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "secondary-column", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "panel", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "panel-header", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "panel-title", children: t("pendingTitle") }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "panel-kicker", children: format(t("pendingCount"), { count: snapshot.gaps.length }) })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "panel-body", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PendingList, { gaps: snapshot.gaps, t, onOpen }) })
		      ] }) })
		    ] })
		  ] });
		}
		function DetailRow({ label, value, t }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-row", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "detail-label", children: label }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: value === "" ? "detail-value is-empty" : "detail-value", children: value === "" ? t("emptyField") : value })
		  ] });
		}
		function recognitionTone2(value) {
		  if (value === "\u8BA4\u53EF") return "green";
		  if (value === "\u90E8\u5206\u8BA4\u53EF") return "amber";
		  if (value === "\u672A\u8BA4\u53EF") return "red";
		  return "slate";
		}
		function ProgressItem({ entry, t, locale }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "timeline-item", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "timeline-marker", "aria-hidden": "true" }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "timeline-content", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "timeline-heading", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "timeline-date", children: entry.date === "" ? "\u2014" : formatStamp(entry.date, locale) }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "timeline-meta", children: [
		          entry.type === "" ? t("progressTypeUnset") : entry.type,
		          entry.seq === null ? "" : ` \xB7 #${entry.seq}`,
		          entry.completion === "" ? "" : ` \xB7 ${entry.completion}`
		        ] })
		      ] }),
		      entry.goal === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "timeline-copy", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
		        t("progressGoal"),
		        "\uFF1A",
		        entry.goal
		      ] }) }),
		      entry.items.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "timeline-copy", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
		        t("progressItems"),
		        "\uFF1A",
		        entry.items.join(" \xB7 ")
		      ] }) }),
		      entry.actual === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "timeline-copy", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
		        t("progressActual"),
		        "\uFF1A",
		        entry.actual
		      ] }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "timeline-tags", children: entry.evidence.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "timeline-missing", children: t("timelineNoEvidence") }) : entry.evidence.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "chip", title: item.link, children: [
		        item.type === "" ? "" : `${item.type} \xB7 `,
		        item.title === "" ? t("emptyField") : item.title
		      ] }, `${item.title}:${index}`)) }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "timeline-tags", children: [
		        entry.customer.syncedWith === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "chip", children: [
		          t("progressSyncedWith"),
		          "\uFF1A",
		          entry.customer.syncedWith
		        ] }),
		        entry.customer.recognition === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: `status-pill tone-${recognitionTone2(entry.customer.recognition)}`, children: [
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
		      entry.customer.feedback === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "timeline-copy", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
		        t("feedbackLabel"),
		        "\uFF1A",
		        entry.customer.feedback
		      ] }) }),
		      entry.next.goal === "" && entry.next.owner === "" && entry.next.deadline === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "timeline-copy", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
		        t("progressNext"),
		        "\uFF1A",
		        entry.next.goal === "" ? t("emptyField") : entry.next.goal,
		        entry.next.owner === "" ? "" : ` \xB7 ${entry.next.owner}`,
		        entry.next.deadline === "" ? "" : ` \xB7 ${t("progressDeadline")} ${entry.next.deadline}`
		      ] }) })
		    ] })
		  ] });
		}
		function DetailPage({ detail, t, locale, onBack }) {
		  const summary = detail.summary;
		  const outcome = detail.outcome;
		  const resultPresent = {
		    achievement: outcome.achievement !== "",
		    evidence: outcome.ourProof !== "" || detail.progress.some((entry) => entry.evidence.length > 0),
		    recognition: outcome.customerRecognition !== "",
		    nextMilestone: outcome.milestone !== ""
		  };
		  const resultValue = {
		    achievement: outcome.achievement,
		    evidence: outcome.ourProof,
		    recognition: outcome.customerRecognition,
		    nextMilestone: outcome.milestone
		  };
		  const derived = {
		    achievement: true,
		    evidence: false,
		    recognition: true,
		    nextMilestone: false
		  };
		  const identity = format(t("detailIdentity"), {
		    pocId: summary.pocId,
		    stage: summary.stageLabel === "" ? t("stageUnknown") : summary.stageLabel,
		    org: `${summary.system === "" ? t("emptyField") : summary.system} \xB7 ${summary.company === "" ? t("emptyField") : summary.company}`
		  });
		  const progress = [...detail.progress].sort((left, right) => {
		    if (left.date !== right.date) return right.date.localeCompare(left.date);
		    return (right.seq ?? 0) - (left.seq ?? 0);
		  });
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "project-hero", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "project-hero-top", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "project-hero-text", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { className: "project-title", children: summary.name }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "project-identity", children: identity }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "project-identity", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
		              t("colAmount"),
		              "\uFF1A",
		              formatWan(summary.amountWan),
		              " ",
		              t("statAmountUnit")
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\xB7" }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: summary.pocType === "" ? t("emptyField") : summary.pocType }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\xB7" }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: summary.status === "" ? t("emptyField") : summary.status })
		          ] })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "project-hero-actions", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "btn", onClick: onBack, children: t("back") }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-section", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "section-heading", children: t("stageTrack") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StageTrack, { summary, t })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-body", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-section", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h2", { className: "section-heading", children: [
		          t("sectionProgress"),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "section-kicker", children: format(t("progressCount"), { count: detail.progress.length }) })
		        ] }),
		        progress.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "empty-state", style: { padding: "28px 24px" }, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: "empty-title", children: t("progressEmptyTitle") }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "empty-copy", children: t("progressEmptyCopy") })
		        ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "timeline", children: progress.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ProgressItem, { entry, t, locale }, `${entry.date}:${entry.seq ?? index}`)) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-section", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h2", { className: "section-heading", children: [
		          t("sectionFourDim"),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "section-kicker", children: format(t("dimensionCount"), { count: summary.dimensionCount }) })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "status-summary", children: DIMENSIONS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "summary-item", "data-present": resultPresent[key], children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "summary-label", children: [
		            t(DIMENSION_LABELS[key]),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "summary-origin", children: derived[key] ? t("dimAuto") : t("dimManual") })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "summary-value", children: resultPresent[key] ? `\u2713 ${t("dimPresent")}` : `\u2717 ${t("dimMissing")}` }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "summary-note", children: resultPresent[key] ? resultValue[key] : t("emptyField") })
		        ] }, key)) })
		      ] }),
		      detail.gaps.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-section", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h2", { className: "section-heading", children: [
		          t("sectionGaps"),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "section-kicker", children: detail.gaps.length })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "detail-list", children: detail.gaps.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `gap-item gap-level-${item.level}`, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "gap-flag", "aria-hidden": "true" }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "gap-text", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "gap-title", children: [
		              item.ruleNo,
		              ". ",
		              format(t(`gap.${item.rule}.title`), { ...item.params ?? {} })
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "gap-copy", children: format(t(`gap.${item.rule}.copy`), { ...item.params ?? {} }) })
		          ] })
		        ] }, item.rule)) })
		      ] }) : null,
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-section", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h2", { className: "section-heading", children: [
		          t("sectionG0"),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "section-kicker", children: detail.gate0.complete ? t("g0Complete") : format(t("g0Missing"), { count: detail.gate0.missing.length }) })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-list", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("whyCustomerTest"), value: detail.gate0.whyCustomer, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("whyWeTest"), value: detail.gate0.whyUs, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("decisionChain"), value: detail.gate0.decisionChain, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("postPocDecision"), value: detail.gate0.postPocDecision, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("competitor"), value: detail.gate0.competitor, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("customerTechOwner"), value: summary.techOwner, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("g0Conclusion"), value: detail.gate0.conclusion, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("g0Reviewer"), value: detail.gate0.reviewer, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("g0ReviewedAt"), value: detail.gate0.reviewedAt, t })
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-section", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "section-heading", children: t("sectionIdentity") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-list", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("owner"), value: summary.owner, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("salesInitiator"), value: detail.sales, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("execSponsor"), value: detail.execSponsor, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("type"), value: summary.pocType, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("colAmount"), value: summary.amountWan === 0 ? "" : `${formatWan(summary.amountWan)} ${t("statAmountUnit")}`, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("priority"), value: summary.priority, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("stageSince"), value: summary.stageSince === null ? "" : `${formatStamp(summary.stageSince, locale)}${summary.daysInStage === null ? "" : ` \xB7 ${format(t("daysInStage"), { days: summary.daysInStage })}`}`, t })
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-section", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "section-heading", children: t("sectionPlan") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-list", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("customerPain"), value: detail.plan.customerPain, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("expectedRecognition"), value: detail.plan.expectedRecognition, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("ourEdge"), value: detail.plan.ourEdge, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-row", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "detail-label", children: [
		              t("criteriaTitle"),
		              " \xB7 ",
		              t("criteriaLimitHint")
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "detail-value", children: detail.plan.criteria.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "is-empty", style: { fontStyle: "italic", opacity: 0.7 }, children: t("emptyField") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "chip-row", children: detail.plan.criteria.map((criterion, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "chip", title: `${criterion.baseline} \u2192 ${criterion.target}`, children: [
		              criterion.name === "" ? t("emptyField") : criterion.name,
		              criterion.metric === "" ? "" : ` \xB7 ${criterion.metric}`,
		              criterion.target === "" ? "" : ` \u2192 ${criterion.target}`
		            ] }, `${criterion.name}:${index}`)) }) })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-row", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "detail-label", children: [
		              t("scenariosTitle"),
		              " \xB7 ",
		              t("scenariosLimitHint")
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "detail-value", children: detail.plan.scenarios.length === 0 ? t("emptyField") : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "chip-row", children: detail.plan.scenarios.map((scenario, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chip", children: scenario }, `${scenario}:${index}`)) }) })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-row", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "detail-label", children: [
		              t("risksTitle"),
		              " \xB7 ",
		              t("risksLimitHint")
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "detail-value", children: detail.plan.risks.length === 0 ? t("emptyField") : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "chip-row", children: detail.plan.risks.map((risk, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "chip", title: risk.mitigation, children: [
		              risk.name === "" ? t("emptyField") : risk.name,
		              risk.level === "" ? "" : ` \xB7 ${risk.level}`
		            ] }, `${risk.name}:${index}`)) }) })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("gate1Conclusion"), value: detail.plan.gate1Conclusion, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("gate2Ready"), value: detail.plan.gate2Ready, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("timelineWindow"), value: detail.plan.timelineStart === "" && detail.plan.timelineEnd === "" ? "" : `${detail.plan.timelineStart === "" ? "\u2014" : detail.plan.timelineStart} \u2192 ${detail.plan.timelineEnd === "" ? "\u2014" : detail.plan.timelineEnd}`, t })
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-section", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "section-heading", children: t("sectionOutcome") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "detail-list", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeAchievement"), value: outcome.achievement, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeRecognition"), value: outcome.customerRecognition, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeOurProof"), value: outcome.ourProof, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeRemainingRisks"), value: outcome.remainingRisks, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeProved"), value: outcome.proved, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeRecognized"), value: outcome.recognized, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeNextBusiness"), value: outcome.nextBusiness, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeMilestone"), value: outcome.milestone, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeBusinessOwner"), value: outcome.businessOwner, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeBusinessDeadline"), value: outcome.businessDeadline, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeBusinessStatus"), value: outcome.businessStatus, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeOverall"), value: outcome.overall, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailRow, { label: t("outcomeReviewedAt"), value: outcome.reviewedAt, t })
		        ] })
		      ] })
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
		  const [settingsOpen, setSettingsOpen] = (0, import_react2.useState)(false);
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
		      if (mounted.current) setFailure(errorText2(t, error));
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
		      } catch (error) {
		        if (!mounted.current) return;
		        const message = errorText2(t, error);
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
		  const openDetail = (0, import_react2.useCallback)(async (pocId) => {
		    setPage({ kind: "detail", pocId });
		    setDetail(null);
		    try {
		      const next = await api.detail(pocId);
		      if (mounted.current) setDetail(next);
		    } catch (error) {
		      if (mounted.current) setFailure(errorText2(t, error));
		    }
		  }, [api, t]);
		  const backToOverview = (0, import_react2.useCallback)(() => {
		    setPage({ kind: "overview" });
		    setDetail(null);
		    setFailure(null);
		  }, []);
		  const savePreference = (0, import_react2.useCallback)((next) => {
		    setPreference(next);
		    writePreference(next);
		    setSettingsOpen(false);
		  }, []);
		  const activeLocale = locale.getSnapshot().active;
		  const refreshed = (0, import_react2.useMemo)(() => {
		    if (snapshot?.fetchedAt === null || snapshot?.fetchedAt === void 0) return t("neverRefreshed");
		    return format(t("refreshedAt"), { time: clockOf(snapshot.fetchedAt, activeLocale) });
		  }, [snapshot, t, activeLocale]);
		  const autoNote = period === null ? t("autoRefreshOff") : format(t("autoRefreshOn"), { minutes: Math.round(period / 6e4) });
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { children: CONSOLE_CSS }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "wd-shell", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "page", children: [
		      page.kind === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "module-rail", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "module-tab", "data-active": "true", title: t("modulePocHint"), children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "module-tab-dot" }),
		            t("modulePoc")
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "module-rail-hint", children: t("moduleMore") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "page-header", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "page-header-text", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "page-eyebrow", children: t("eyebrow") }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { className: "page-title", children: t("modulePoc") }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "page-subtitle", children: t("subtitle") }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "page-source", children: [
		              t("dataSource"),
		              "\uFF1A",
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("code", { children: [
		                "github.com/",
		                snapshot?.repository ?? ""
		              ] }),
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\xB7" }),
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: refreshed })
		            ] })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "header-actions", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "btn btn-primary", disabled: busy, onClick: () => {
		              void refresh(true);
		            }, children: busy ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "spinner" }),
		              " ",
		              t("refreshing")
		            ] }) : t("refresh") }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "btn", onClick: () => setPage({ kind: "risks" }), disabled: snapshot === null || !snapshot.cacheReady, children: t("risksNav") }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "btn", onClick: () => setPage({ kind: "timeline" }), disabled: snapshot === null || !snapshot.cacheReady, children: t("timelineNav") }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "btn", onClick: () => setSettingsOpen(true), title: autoNote, children: t("refreshSettings") })
		          ] })
		        ] })
		      ] }) : null,
		      page.kind === "risks" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RiskBoardPage, { api, t, onBack: backToOverview, onOpenProject: (pocId) => {
		        void openDetail(pocId);
		      } }) : page.kind === "timeline" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TimelinePage, { api, t, locale: activeLocale, onBack: backToOverview, onOpenProject: (pocId) => {
		        void openDetail(pocId);
		      } }) : null,
		      page.kind === "risks" || page.kind === "timeline" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: page.kind === "overview" ? "page-body" : "detail-body", children: [
		        failure !== null ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { marginBottom: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FailureBanner, { message: failure, t, busy, onRetry: () => {
		          void refresh(true);
		        } }) }) : null,
		        loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "empty-state", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "spinner" }),
		          " ",
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "empty-copy", children: t("loading") })
		        ] }) : page.kind === "detail" ? detail === null ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "empty-state", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: "empty-title", children: t("detailMissing") }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "empty-copy", children: format(t("detailMissingCopy"), { pocId: page.pocId }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "btn", onClick: backToOverview, children: t("back") })
		        ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DetailPage, { detail, t, locale: activeLocale, onBack: backToOverview }) : snapshot !== null && !snapshot.cacheReady ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(EmptyState, { snapshot, t, busy, onRefresh: () => {
		          void refresh(true);
		        } }) : snapshot === null ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		          OverviewPage,
		          {
		            snapshot,
		            t,
		            locale: activeLocale,
		            onOpen: (pocId) => {
		              void openDetail(pocId);
		            }
		          }
		        )
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "page-footer", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: autoNote }),
		        statusNote === null ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\xB7" }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: statusNote })
		        ] })
		      ] })
		    ] }) }),
		    settingsOpen ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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

		// src/client/index.tsx
		var import_jsx_runtime3 = require("react/jsx-runtime");
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
		    () => ctx.slots.inject(MAIN_SLOT, () => ctx.slots.register({ name: MAIN_SLOT, key: PANEL_ID }, () => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(WorkDashboardPage, { api, locale: ctx.locale, t }))),
		    "skillre-work-dashboard console page"
		  );
		}

		return module.exports;
	}
});
