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
		  "R12-stage-stalled",
		  // v3.1 state rules: a plan that is the right shape but unexecuted.
		  "R13-scenario-no-evidence",
		  "R14-scenario-awaiting-customer",
		  "R15-criteria-unverified",
		  "R16-scenario-not-started"
		]);
		var BLOCKER_SOURCES = Object.freeze([
		  "gap",
		  "stalled",
		  "missing-amount",
		  "no-progress",
		  "no-stage-since"
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
		    timeline: (signal) => call({ action: "timeline" }, signal),
		    exportForm: (mode, pocIds, signal) => call({ action: "export-form", mode, pocIds: [...pocIds] }, signal)
		  };
		}

		// src/client/text.ts
		var NAMESPACE = "skillreWorkDashboard";
		var zh = {
		  nav: "\u5DE5\u4F5C\u770B\u677F",
		  title: "\u5DE5\u4F5C\u770B\u677F",
		  subtitle: "\u591A\u6A21\u5757\u8FD0\u8425\u770B\u677F\uFF1A\u5148\u628A\u6B63\u5728\u63A8\u8FDB\u7684\u4E8B\u60C5\u770B\u6E05\u695A\uFF0C\u518D\u51B3\u5B9A\u4E0B\u4E00\u6B65\u8865\u4EC0\u4E48\u3002",
		  dataSource: "\u6570\u636E\u6E90",
		  dataSourceLine: "\u6570\u636E\u6E90\uFF1Agithub.com/{repository}",
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
		  // The ledger's `priority` is an English enum (strategic/high/normal). Rendering
		  // it raw would read as a code fragment inside a Chinese page.
		  priorityStrategic: "\u6218\u7565",
		  priorityHigh: "\u9AD8",
		  priorityNormal: "\u5E38\u89C4",
		  priorityUnknown: "\u672A\u5B9A",
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
		  filterCompany: "\u516C\u53F8",
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
		  pendingExpand: "\u5C55\u5F00",
		  pendingCollapse: "\u6536\u8D77",
		  // ---------- 0.7 · 阻障（统一口径） ----------
		  blockerTitle: "\u963B\u969C",
		  blockerSubtitle: "\u5361\u4F4F\u7684\u5730\u65B9\uFF0C\u4E94\u7C7B\u6765\u6E90\u5408\u5728\u4E00\u8D77\u770B\u3002",
		  blockerCount: "{count} \u9879",
		  blockerProjectsNote: "{blocked} / {total} \u4E2A\u9879\u76EE\u6709\u963B\u969C",
		  blockerAll: "\u5168\u90E8",
		  blockerSourceGap: "\u7F3A\u53E3\u89C4\u5219",
		  blockerSourceStalled: "\u9636\u6BB5\u505C\u6EDE",
		  blockerSourceMissingAmount: "\u672A\u586B\u91D1\u989D",
		  blockerSourceNoProgress: "\u65E0\u8FDB\u5C55\u8BB0\u5F55",
		  blockerSourceNoStageSince: "\u7F3A\u9636\u6BB5\u8D77\u59CB\u65E5",
		  blockerEmpty: "\u6CA1\u6709\u626B\u51FA\u963B\u969C\uFF0C\u7EE7\u7EED\u4FDD\u6301\u3002",
		  blockerEmptyFiltered: "\u5F53\u524D\u7B5B\u9009\u4E0B\u6CA1\u6709\u963B\u969C\u3002",
		  blockerStalledCopy: "\u5DF2\u5728\u5F53\u524D\u9636\u6BB5\u505C\u7559 {days} \u5929\uFF08\u9608\u503C {stallDays} \u5929\uFF09\uFF0C\u6CA1\u6709\u4EFB\u4F55\u63A8\u8FDB\u3002",
		  blockerMissingAmountCopy: "\u6CA1\u6709\u586B\u91D1\u989D\uFF0C\u65E0\u6CD5\u6392\u5E8F\u3001\u4F30\u7B97\uFF0C\u4E5F\u65E0\u6CD5\u5224\u65AD\u662F\u5426\u89E6\u53CA\u5927\u989D\u89C4\u5219\u3002",
		  blockerNoProgressCopy: "\u4E00\u6761\u8FDB\u5C55\u8BB0\u5F55\u90FD\u6CA1\u6709\uFF1A\u8FD9\u4E2A\u9879\u76EE\u63A8\u8FDB\u8FC7\u6CA1\u6709\uFF0C\u8BF4\u4E0D\u6E05\u3002",
		  blockerNoStageSinceCopy: "\u6CA1\u6709\u586B\u8FDB\u5165\u9636\u6BB5\u7684\u65F6\u95F4\uFF0C\u505C\u6EDE\u5929\u6570\u65E0\u6CD5\u8BA1\u7B97\u3002",
		  blockerMoreProjects: "\u8FD8\u6709 {count} \u4E2A\u9879\u76EE",
		  blockerOpen: "\u67E5\u770B",
		  blockerLegendHint: "\u70B9\u4EFB\u610F\u4E00\u7C7B\u53EA\u770B\u5B83\uFF0C\u518D\u70B9\u4E00\u6B21\u53D6\u6D88\u3002",
		  // ---------- 0.7 · 阶段感知详情页 ----------
		  dtStageSkeleton: "\u5F53\u524D\u9636\u6BB5\u89C6\u56FE",
		  dtStageG0Title: "G0 \u5DE5\u4F5C\u53F0",
		  dtStageG0Copy: "\u5148\u628A\u8FD9\u4E2A\u9879\u76EE\u503C\u4E0D\u503C\u5F97\u505A\u8BB2\u6E05\u695A\uFF0C\u518D\u8C08\u8BA1\u5212\u4E0E\u8FDB\u5C55\u3002",
		  dtStageG0Next: "\u4E94\u9879\u5FC5\u586B\u9F50\u4E86\u3001\u8BC4\u5BA1\u901A\u8FC7\u540E\uFF0C\u624D\u8FDB\u5165 G1 \u65B9\u6848\u8BBE\u8BA1\u3002",
		  dtStageG1Title: "G1 \u65B9\u6848\u8BBE\u8BA1",
		  dtStageG1Copy: "\u600E\u4E48\u8D62\uFF1A\u75DB\u70B9\u3001\u6307\u6807\u3001\u573A\u666F\u3001\u4F18\u52BF\uFF0C\u8FD8\u6709 G1 \u7ED3\u8BBA\u3002",
		  dtStageG1Next: "G1 \u901A\u8FC7\u5E76\u786E\u8BA4\u524D\u7F6E\u6761\u4EF6\u5C31\u7EEA\u540E\uFF0C\u8FDB\u5165 G2 \u65B9\u6848\u9A8C\u8BC1\u3002",
		  dtStageG2Title: "G2 \u65B9\u6848\u9A8C\u8BC1",
		  dtStageG2Copy: "\u524D\u7F6E\u6761\u4EF6\u662F\u5426\u5C31\u7EEA\uFF0C\u9A8C\u8BC1\u8FC7\u7A0B\u4EA7\u751F\u4E86\u54EA\u4E9B\u8FDB\u5C55\u4E0E\u8BC1\u636E\u3002",
		  dtStageG2Next: "G2 Ready \u4E14\u9A8C\u8BC1\u6709\u8BC1\u636E\u540E\uFF0C\u8FDB\u5165 G3 \u7ED3\u679C\u9A8C\u8BC1\u3002",
		  dtStageG3Title: "G3 \u7ED3\u679C\u9A8C\u8BC1",
		  dtStageG3Copy: "\u8BC1\u636E\u94FE\u4E0E\u5BA2\u6237\u8BA4\u53EF\uFF1A\u8BC1\u660E\u4E86\u4EC0\u4E48\uFF0C\u5BA2\u6237\u627F\u8BA4\u4E86\u4EC0\u4E48\u3002",
		  dtStageG3Next: "G3-2 \u5DF2\u786E\u8BA4\u540E\uFF0C\u8FDB\u5165 G4 \u7ED3\u679C\u8F6C\u5316\u3002",
		  dtStageG4Title: "G4 \u7ED3\u679C\u8F6C\u5316",
		  dtStageG4Copy: "\u56DB\u7EF4\u7ED3\u8BBA\u4E0E\u4E0B\u4E00\u6B65\u91CC\u7A0B\u7891\uFF1A\u4EF7\u503C\u505A\u51FA\u6765\u4E86\uFF0C\u8981\u628A\u5B83\u843D\u4E0B\u6765\u3002",
		  dtStageG4Next: "\u91CC\u7A0B\u7891\u6709\u4E86\u8D1F\u8D23\u4EBA\u4E0E\u622A\u6B62\u65E5\uFF0C\u624D\u7B97\u771F\u6B63\u5B8C\u6210\u3002",
		  dtStageClosedTitle: "\u5DF2\u5173\u95ED",
		  dtStageClosedCopy: "\u5F52\u6863\u89C6\u56FE\uFF1A\u7ED3\u8BBA\u4E0E\u56DB\u7EF4\u7ED3\u679C\uFF0C\u8FDB\u5C55\u6D41\u7559\u4F5C\u590D\u76D8\u3002",
		  dtStageUnknownTitle: "\u9636\u6BB5\u672A\u8BC6\u522B",
		  dtStageUnknownCopy: "\u53F0\u8D26\u91CC\u7684\u9636\u6BB5\u503C\u65E0\u6CD5\u8BC6\u522B\uFF0C\u6309\u5168\u91CF\u987A\u5E8F\u5C55\u793A\u3002",
		  dtStageDone: "\u672C\u9636\u6BB5\u5DF2\u8BB0\u5F55\u5B8C\u6210",
		  dtStagePending: "\u672C\u9636\u6BB5\u8FD8\u6709\u5F85\u8865\u9879",
		  dtOtherSections: "\u5176\u4ED6\u533A\u5757",
		  dtOtherSectionsHint: "\u5168\u90E8\u5B57\u6BB5\u90FD\u8FD8\u5728\uFF0C\u53EA\u662F\u6309\u5F53\u524D\u9636\u6BB5\u6392\u5230\u4E86\u540E\u9762\u3002",
		  // ---------- 0.7 · 工作清单（空态改成可执行） ----------
		  worklistTitle: "\u5F85\u8865\u6E05\u5355",
		  worklistEmpty: "\u8FD9\u9879\u5DF2\u7ECF\u9F50\u4E86\u3002",
		  worklistG0Intro: "\u8865\u9F50\u4E0B\u9762 {count} \u9879\uFF0CG0 \u624D\u7B97\u5B8C\u6574\u3002",
		  worklistG0Done: "\u4E94\u9879\u5FC5\u586B\u5DF2\u9F50\uFF0C\u53EF\u4EE5\u63A8\u8FDB G0 \u8BC4\u5BA1\u3002",
		  worklistG0Field: "\u8865 {field}",
		  worklistG0Hint: "\u5728\u53F0\u8D26\u91CC\u8865\u5B8C\u540E\u70B9\u5237\u65B0\uFF1B\u4E5F\u53EF\u4EE5\u5BFC\u51FA\u6536\u96C6\u8868\u5355\u4EA4\u7ED9\u7EC4\u5458\u586B\u3002",
		  worklistNoProgressIntro: "\u8FD8\u6CA1\u6709\u7B2C\u4E00\u6761\u8FDB\u5C55\u8BB0\u5F55\u3002\u4E00\u6B21\u8FDB\u5C55\u81F3\u5C11\u8981\u5199\u6E05\u76EE\u6807\u3001\u5B9E\u9645\u7ED3\u679C\u548C\u4E0B\u4E00\u6B65\u3002",
		  worklistNoProgressAction: "\u8865\u7B2C\u4E00\u6761\u8FDB\u5C55",
		  worklistNoPlanIntro: "\u8BA1\u5212\u8FD8\u662F\u7A7A\u7684\uFF1A\u6CA1\u6709\u6210\u529F\u6307\u6807\uFF0C\u540E\u9762\u65E0\u6CD5\u9A8C\u6536\u3002",
		  worklistNoPlanAction: "\u8865\u8BA1\u5212\uFF08\u6307\u6807 / \u573A\u666F / \u98CE\u9669\uFF09",
		  worklistNoOutcomeIntro: "\u7ED3\u8BBA\u8FD8\u6CA1\u5199\uFF1A\u505A\u6210\u4E86\u4EC0\u4E48\u3001\u5BA2\u6237\u8BA4\u53EF\u4EC0\u4E48\u3001\u4E0B\u4E00\u6B65\u505A\u4EC0\u4E48\u3002",
		  worklistNoOutcomeAction: "\u8865\u7ED3\u8BBA",
		  worklistMissingAmountIntro: "\u6CA1\u6709\u586B\u91D1\u989D\uFF0C\u8FD9\u4E2A\u9879\u76EE\u5728\u9884\u7B97\u89C6\u56FE\u91CC\u4F1A\u7F3A\u5E2D\u3002",
		  worklistMissingAmountAction: "\u8865\u91D1\u989D",
		  worklistMissingStageSinceIntro: "\u6CA1\u6709\u586B\u8FDB\u5165\u9636\u6BB5\u7684\u65F6\u95F4\uFF0C\u505C\u6EDE\u5929\u6570\u7B97\u4E0D\u51FA\u6765\u3002",
		  worklistMissingStageSinceAction: "\u8865\u9636\u6BB5\u8D77\u59CB\u65E5",
		  worklistFixAll: "\u5171 {count} \u9879\u5F85\u8865",
		  worklistDone: "\u6CA1\u6709\u5F85\u8865\u9879\uFF0C\u7EE7\u7EED\u4FDD\u6301\u3002",
		  // ---------- 0.8 · KPI 顶条 ----------
		  kpiTitle: "\u6574\u4F53\u60C5\u51B5",
		  kpiTotal: "\u9879\u76EE\u603B\u6570",
		  kpiActive: "\u8FDB\u884C\u4E2D",
		  kpiBudget: "\u9884\u7B97\u5408\u8BA1",
		  kpiBlocked: "\u6709\u963B\u969C",
		  kpiG0Passed: "G0 \u5DF2\u901A\u8FC7",
		  kpiStageBreakdown: "\u5404\u9636\u6BB5",
		  kpiBlockedNote: "{count} \u4E2A\u9879\u76EE",
		  kpiClickHint: "\u70B9\u4EFB\u610F\u4E00\u9879\u6309\u8BE5\u6761\u4EF6\u7B5B\u9009",
		  kpiAllNote: "\u5168\u90E8 {count} \u4E2A\u9879\u76EE",
		  // ---------- 0.8 · 预算面板 ----------
		  budgetTitle: "\u9884\u7B97",
		  budgetNote: "\u6309\u8BC4\u5BA1\u72B6\u6001\u62C6\u5206",
		  budgetTotal: "\u9884\u7B97\u5408\u8BA1",
		  budgetApproved: "G0 \u5DF2\u901A\u8FC7",
		  budgetPending: "\u5F85\u8BC4\u5BA1",
		  budgetUnset: "\u672A\u586B\u91D1\u989D",
		  budgetApprovedNote: "{count} \u4E2A\u9879\u76EE \xB7 {amount} \u4E07",
		  budgetPendingNote: "{count} \u4E2A\u9879\u76EE \xB7 {amount} \u4E07",
		  budgetUnsetNote: "{count} \u4E2A\u9879\u76EE",
		  budgetByOrg: "\u6309\u4F53\u7CFB",
		  budgetConcentration: "\u96C6\u4E2D\u5EA6",
		  budgetConcentrationCopy: "\u6700\u5927\u5355\u9879\u76EE\u5360 {share}%",
		  budgetEmpty: "\u53F0\u8D26\u91CC\u8FD8\u6CA1\u6709\u91D1\u989D\u6570\u636E\u3002",
		  budgetUnsetWarning: "{count} \u4E2A\u9879\u76EE\u6CA1\u6709\u91D1\u989D\uFF0C\u9884\u7B97\u5408\u8BA1\u504F\u4F4E\u3002",
		  // ---------- 0.8 · 阶段内完成度 ----------
		  stageProgressLabel: "\u9636\u6BB5\u5185\u5B8C\u6210",
		  stageProgressNote: "{done} / {total} \u5DF2\u5B8C\u6210",
		  stageNoData: "\u672C\u9636\u6BB5\u6CA1\u6709\u9879\u76EE",
		  // ---------- 0.8 · 基本信息 ----------
		  dtBasicTitle: "\u57FA\u672C\u4FE1\u606F",
		  dtCustomerName: "\u5BA2\u6237\u540D",
		  dtCustomerSystem: "\u4F53\u7CFB",
		  dtCustomerCompany: "\u5BA2\u6237\u516C\u53F8",
		  dtCustomerDepartment: "\u90E8\u95E8",
		  dtCustomerTech: "\u5BA2\u6237\u6280\u672F\u4EBA",
		  dtCustomerSponsor: "\u5BA2\u6237\u4E1A\u52A1\u51B3\u7B56\u4EBA",
		  dtBasicDecisionChain: "\u51B3\u7B56\u94FE",
		  dtBasicDecisionChainNone: "\u8FD8\u6CA1\u6709\u5199\u6E05\u8C01\u62CD\u677F\u3001\u6309\u4EC0\u4E48\u6D41\u7A0B\u8D70\u3002",
		  dtBasicPostPoc: "\u6D4B\u540E\u51B3\u7B56",
		  dtBasicPostPocNone: "\u8FD8\u6CA1\u6709\u5199\u6E05\u6D4B\u5B8C\u4E4B\u540E\u5BA2\u6237\u4F1A\u505A\u4EC0\u4E48\u51B3\u5B9A\u3002",
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
		  dtPlanCriteriaStatus: "\u72B6\u6001",
		  dtPlanScenarioGoal: "\u76EE\u6807",
		  dtPlanScenarioEvidence: "{count} \u9879\u8BC1\u636E",
		  dtProgressCountLabel: "{count} \u6761",
		  dtPlanScenarioDetail: "\u8BE6\u60C5",
		  dtScenarioBack: "\u8FD4\u56DE\u603B\u89C8",
		  dtScenarioTitle: "\u573A\u666F\u8BE6\u60C5",
		  dtScenarioGoal: "\u6210\u529F\u76EE\u6807",
		  dtScenarioEvidence: "\u8BC1\u636E",
		  dtScenarioEvidenceNone: "\u8FD9\u4E2A\u573A\u666F\u8FD8\u6CA1\u6709\u4EFB\u4F55\u8BC1\u636E\u3002\u6CA1\u6709\u8BC1\u636E\u7684\u573A\u666F\uFF0C\u5728\u4EFB\u4F55\u8BA8\u8BBA\u91CC\u90FD\u7B49\u4E8E\u6CA1\u505A\u8FC7\u3002",
		  dtScenarioCustomer: "\u5BA2\u6237\u53CD\u9988",
		  dtScenarioSyncedWith: "\u540C\u6B65\u5BF9\u8C61",
		  dtScenarioFeedbackEmpty: "\u8FD8\u6CA1\u6709\u8BB0\u5F55\u5BA2\u6237\u53CD\u9988\u3002\u5BA2\u6237\u600E\u4E48\u8BF4\uFF0C\u6BD4\u6211\u4EEC\u600E\u4E48\u6D4B\u66F4\u91CD\u8981\u3002",
		  dtScenarioGate3: "G3 \u5224\u5B9A",
		  dtScenarioLinked: "\u5173\u8054\u8FDB\u5C55",
		  dtScenarioLinkedNone: "\u8FD8\u6CA1\u6709\u8FDB\u5C55\u5173\u8054\u5230\u8FD9\u4E2A\u573A\u666F\u3002\u65B0\u589E\u8FDB\u5C55\u65F6\u7528 scenario_ids \u5F15\u7528\u5B83\u3002",
		  dtScenarioNotFound: "\u627E\u4E0D\u5230\u8FD9\u4E2A\u573A\u666F",
		  dtStatusProven: "\u5DF2\u8BC1\u660E",
		  dtStatusAwaiting: "\u5F85\u5BA2\u6237\u786E\u8BA4",
		  dtStatusNoEvidence: "\u65E0\u8BC1\u636E",
		  dtStatusNotStarted: "\u672A\u5F00\u59CB",
		  dtCritProven: "\u5DF2\u8FBE\u6210",
		  dtCritPartial: "\u90E8\u5206\u8FBE\u6210",
		  dtCritFailed: "\u672A\u8FBE\u6210",
		  dtCritUnverified: "\u672A\u9A8C\u8BC1",
		  dtCriteriaStatusNone: "\u672A\u9A8C\u8BC1",
		  dtPlanCriteriaNone: "\u8FD8\u6CA1\u6709\u6210\u529F\u6307\u6807\u3002\u81F3\u5C11\u5199 2 \u9879\u53EF\u9A8C\u6536\u7684\u6307\u6807\uFF0C\u5426\u5219 POC \u7ED3\u675F\u540E\u65E0\u6CD5\u5224\u5B9A\u6210\u6CA1\u6210\u3002",
		  dtPlanCriteriaCount: "{count} \u9879\uFF08\u8981\u6C42 2\u20133\uFF09",
		  dtPlanMetric: "\u6307\u6807",
		  dtPlanBaseline: "\u57FA\u7EBF",
		  dtPlanTarget: "\u76EE\u6807",
		  dtPlanScenarios: "\u9A8C\u8BC1\u573A\u666F",
		  dtPlanScenariosNone: "\u8FD8\u6CA1\u6709\u9A8C\u8BC1\u573A\u666F\u3002\u5199 3\u20135 \u4E2A\u5177\u4F53\u573A\u666F\uFF0C\u6BCF\u4E2A\u90FD\u8981\u80FD\u5BF9\u5E94\u5230\u8BC1\u636E\u3002",
		  dtPlanScenariosCount: "{count} \u4E2A\uFF08\u8981\u6C42 3\u20135\uFF09",
		  dtPlanRisks: "\u98CE\u9669",
		  dtPlanRisksNone: "\u6CA1\u6709\u767B\u8BB0\u98CE\u9669\u3002\u81F3\u5C11\u5199\u4E0B\u6700\u53EF\u80FD\u8BA9\u8FD9\u6B21 POC \u5931\u8D25\u7684\u90A3\u4E00\u6761\u3002",
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
		  dataSourceLine: "Source: github.com/{repository}",
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
		  priorityStrategic: "Strategic",
		  priorityHigh: "High",
		  priorityNormal: "Normal",
		  priorityUnknown: "Unset",
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
		  filterCompany: "Company",
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
		  pendingExpand: "Expand",
		  pendingCollapse: "Collapse",
		  // ---------- 0.7 · blockers (one story) ----------
		  blockerTitle: "Blockers",
		  blockerSubtitle: "Every way a project is stuck, from five sources in one list.",
		  blockerCount: "{count} item(s)",
		  blockerProjectsNote: "{blocked} of {total} project(s) blocked",
		  blockerAll: "All",
		  blockerSourceGap: "Gap rules",
		  blockerSourceStalled: "Stalled",
		  blockerSourceMissingAmount: "No amount",
		  blockerSourceNoProgress: "No progress",
		  blockerSourceNoStageSince: "No stage date",
		  blockerEmpty: "No blockers found. Keep it up.",
		  blockerEmptyFiltered: "No blockers under the current filters.",
		  blockerStalledCopy: "In stage for {days} days (threshold {stallDays}) with no movement.",
		  blockerMissingAmountCopy: "No amount recorded: it cannot be ranked, estimated, or checked against the large-amount rule.",
		  blockerNoProgressCopy: "Not a single progress entry, so whether this project moved at all is unknown.",
		  blockerNoStageSinceCopy: "No stage start date, so the stall clock never started.",
		  blockerMoreProjects: "{count} more project(s)",
		  blockerOpen: "View",
		  blockerLegendHint: "Pick a source to see only it; pick it again to clear.",
		  // ---------- 0.7 · stage-aware detail ----------
		  dtStageSkeleton: "Stage view",
		  dtStageG0Title: "G0 workbench",
		  dtStageG0Copy: "Settle whether this project is worth doing before plan and progress.",
		  dtStageG0Next: "Once the five requirements are present and the review passes, G1 design starts.",
		  dtStageG1Title: "G1 design",
		  dtStageG1Copy: "How to win: pain, metrics, scenarios, edge, and the G1 conclusion.",
		  dtStageG1Next: "After G1 passes and the prerequisites are ready, G2 validation starts.",
		  dtStageG2Title: "G2 validation",
		  dtStageG2Copy: "Whether the prerequisites are ready, and which progress and evidence the run produced.",
		  dtStageG2Next: "Once G2 is Ready with evidence, G3 result validation starts.",
		  dtStageG3Title: "G3 result validation",
		  dtStageG3Copy: "The proof chain: what we proved, and what the customer accepted.",
		  dtStageG3Next: "Once G3-2 is confirmed, G4 conversion starts.",
		  dtStageG4Title: "G4 conversion",
		  dtStageG4Copy: "The four dimensions and the next milestone: value exists, now bank it.",
		  dtStageG4Next: "It is only complete with a milestone owner and a deadline.",
		  dtStageClosedTitle: "Closed",
		  dtStageClosedCopy: "Archive view: the conclusion and the four dimensions, with the stream for review.",
		  dtStageUnknownTitle: "Unrecognized stage",
		  dtStageUnknownCopy: "The ledger value is not a known stage, so every section keeps its full order.",
		  dtStageDone: "This stage is recorded as done",
		  dtStagePending: "This stage still has gaps",
		  dtOtherSections: "Other sections",
		  dtOtherSectionsHint: "Every field is still here; the current stage just moved them down.",
		  // ---------- 0.7 · worklist (empty states that say what to do) ----------
		  worklistTitle: "To fill in",
		  worklistEmpty: "This one is complete.",
		  worklistG0Intro: "Fill in the {count} item(s) below to make G0 complete.",
		  worklistG0Done: "All five requirements are present; G0 review can proceed.",
		  worklistG0Field: "Add {field}",
		  worklistG0Hint: "Fill it in the ledger, then refresh; or export the collection form for a colleague.",
		  worklistNoProgressIntro: "No progress entry yet. One entry needs a goal, an actual result and a next step.",
		  worklistNoProgressAction: "Add the first entry",
		  worklistNoPlanIntro: "The plan is empty: without success criteria nothing can be accepted later.",
		  worklistNoPlanAction: "Add the plan (criteria / scenarios / risks)",
		  worklistNoOutcomeIntro: "No conclusion yet: what was proved, what the customer accepted, what comes next.",
		  worklistNoOutcomeAction: "Add the conclusion",
		  worklistMissingAmountIntro: "No amount, so this project is missing from the budget view.",
		  worklistMissingAmountAction: "Add the amount",
		  worklistMissingStageSinceIntro: "No stage start date, so the stall clock cannot run.",
		  worklistMissingStageSinceAction: "Add the stage start date",
		  worklistFixAll: "{count} item(s) to fill in",
		  worklistDone: "Nothing to fill in. Keep it up.",
		  // ---------- 0.8 · KPI strip ----------
		  kpiTitle: "At a glance",
		  kpiTotal: "Projects",
		  kpiActive: "In progress",
		  kpiBudget: "Budget",
		  kpiBlocked: "Blocked",
		  kpiG0Passed: "G0 passed",
		  kpiStageBreakdown: "By stage",
		  kpiBlockedNote: "{count} project(s)",
		  kpiClickHint: "Pick a figure to filter by it",
		  kpiAllNote: "All {count} project(s)",
		  // ---------- 0.8 · budget panel ----------
		  budgetTitle: "Budget",
		  budgetNote: "Split by review state",
		  budgetTotal: "Total budget",
		  budgetApproved: "G0 passed",
		  budgetPending: "Awaiting review",
		  budgetUnset: "No amount",
		  budgetApprovedNote: "{count} project(s) \xB7 {amount}",
		  budgetPendingNote: "{count} project(s) \xB7 {amount}",
		  budgetUnsetNote: "{count} project(s)",
		  budgetByOrg: "By system",
		  budgetConcentration: "Concentration",
		  budgetConcentrationCopy: "Largest project is {share}%",
		  budgetEmpty: "No amount recorded in the ledger yet.",
		  budgetUnsetWarning: "{count} project(s) have no amount, so the total understates the budget.",
		  // ---------- 0.8 · in-stage completion ----------
		  stageProgressLabel: "Stage progress",
		  stageProgressNote: "{done} of {total} done",
		  stageNoData: "No project at this stage",
		  // ---------- 0.8 · basic info ----------
		  dtBasicTitle: "Basic information",
		  dtCustomerName: "Customer",
		  dtCustomerSystem: "System",
		  dtCustomerCompany: "Company",
		  dtCustomerDepartment: "Department",
		  dtCustomerTech: "Customer tech contact",
		  dtCustomerSponsor: "Customer business sponsor",
		  dtBasicDecisionChain: "Decision chain",
		  dtBasicDecisionChainNone: "Who signs off, and by what process, is not written down.",
		  dtBasicPostPoc: "Post-POC decision",
		  dtBasicPostPocNone: "What the customer does after the POC is not written down.",
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
		  dtPlanCriteriaStatus: "Status",
		  dtPlanScenarioGoal: "Goal",
		  dtPlanScenarioEvidence: "{count} evidence",
		  dtProgressCountLabel: "{count} entries",
		  dtPlanScenarioDetail: "Detail",
		  dtScenarioBack: "Back to overview",
		  dtScenarioTitle: "Scenario detail",
		  dtScenarioGoal: "Success goal",
		  dtScenarioEvidence: "Evidence",
		  dtScenarioEvidenceNone: "No evidence for this scenario yet. An unbacked scenario counts as not done.",
		  dtScenarioCustomer: "Customer feedback",
		  dtScenarioSyncedWith: "Synced with",
		  dtScenarioFeedbackEmpty: "No customer feedback yet. What the customer says matters more than what we tested.",
		  dtScenarioGate3: "G3 verdict",
		  dtScenarioLinked: "Linked progress",
		  dtScenarioLinkedNone: "No progress entry references this scenario yet. Cite its id in scenario_ids.",
		  dtScenarioNotFound: "Scenario not found",
		  dtStatusProven: "Proven",
		  dtStatusAwaiting: "Awaiting customer",
		  dtStatusNoEvidence: "No evidence",
		  dtStatusNotStarted: "Not started",
		  dtCritProven: "Met",
		  dtCritPartial: "Partially met",
		  dtCritFailed: "Not met",
		  dtCritUnverified: "Unverified",
		  dtCriteriaStatusNone: "Unverified",
		  dtPlanCriteriaNone: "No success criterion yet. Write at least 2 so the pilot can be judged when it ends.",
		  dtPlanCriteriaCount: "{count} (2\u20133 required)",
		  dtPlanMetric: "Metric",
		  dtPlanBaseline: "Baseline",
		  dtPlanTarget: "Target",
		  dtPlanScenarios: "Validation scenarios",
		  dtPlanScenariosNone: "No validation scenario yet. Write 3\u20135 concrete ones, each able to point at evidence.",
		  dtPlanScenariosCount: "{count} (3\u20135 required)",
		  dtPlanRisks: "Risks",
		  dtPlanRisksNone: "No risk registered. Name at least the one most likely to sink this pilot.",
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
		var import_react6 = require("react");

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

		// src/client/format.ts
		function formatWan(value) {
		  const rounded = Math.round(value * 10) / 10;
		  return rounded.toLocaleString("zh-CN", { maximumFractionDigits: 1 });
		}
		function isCalendarDate(value) {
		  return /^\d{4}-\d{2}-\d{2}$/.test(value);
		}
		function formatDate(value, locale, fallback = "") {
		  if (value === null || value === "") return fallback;
		  if (!isCalendarDate(value)) return value;
		  const stamp = /* @__PURE__ */ new Date(`${value}T00:00:00`);
		  if (Number.isNaN(stamp.getTime())) return value;
		  return stamp.toLocaleDateString(locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US", {
		    year: "numeric",
		    month: "2-digit",
		    day: "2-digit"
		  });
		}
		function clockOf(value, locale) {
		  if (value === null) return "";
		  const stamp = new Date(value);
		  if (Number.isNaN(stamp.getTime())) return "";
		  return stamp.toLocaleTimeString(locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US", {
		    hour: "2-digit",
		    minute: "2-digit"
		  });
		}
		function stageLabel(t, key) {
		  if (key === "closed") return t("stageClosed");
		  if (key === "unknown") return t("stageUnknown");
		  if (STAGES.includes(key)) return t(`stage${key}`);
		  return key;
		}
		function stageBucketKey(project) {
		  if (project.closed) return "closed";
		  return project.stage ?? "unknown";
		}

		// src/client/detail.tsx
		var import_react2 = require("react");

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

		// src/client/blockers.tsx
		var import_react = require("react");

		// node_modules/yaml/browser/dist/nodes/identity.js
		var ALIAS = Symbol.for("yaml.alias");
		var DOC = Symbol.for("yaml.document");
		var MAP = Symbol.for("yaml.map");
		var PAIR = Symbol.for("yaml.pair");
		var SCALAR = Symbol.for("yaml.scalar");
		var SEQ = Symbol.for("yaml.seq");
		var NODE_TYPE = Symbol.for("yaml.node.type");
		var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
		var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
		var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
		var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
		var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
		var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
		function isCollection(node) {
		  if (node && typeof node === "object")
		    switch (node[NODE_TYPE]) {
		      case MAP:
		      case SEQ:
		        return true;
		    }
		  return false;
		}
		function isNode(node) {
		  if (node && typeof node === "object")
		    switch (node[NODE_TYPE]) {
		      case ALIAS:
		      case MAP:
		      case SCALAR:
		      case SEQ:
		        return true;
		    }
		  return false;
		}
		var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;

		// node_modules/yaml/browser/dist/visit.js
		var BREAK = Symbol("break visit");
		var SKIP = Symbol("skip children");
		var REMOVE = Symbol("remove node");
		function visit(node, visitor) {
		  const visitor_ = initVisitor(visitor);
		  if (isDocument(node)) {
		    const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
		    if (cd === REMOVE)
		      node.contents = null;
		  } else
		    visit_(null, node, visitor_, Object.freeze([]));
		}
		visit.BREAK = BREAK;
		visit.SKIP = SKIP;
		visit.REMOVE = REMOVE;
		function visit_(key, node, visitor, path) {
		  const ctrl = callVisitor(key, node, visitor, path);
		  if (isNode(ctrl) || isPair(ctrl)) {
		    replaceNode(key, path, ctrl);
		    return visit_(key, ctrl, visitor, path);
		  }
		  if (typeof ctrl !== "symbol") {
		    if (isCollection(node)) {
		      path = Object.freeze(path.concat(node));
		      for (let i = 0; i < node.items.length; ++i) {
		        const ci = visit_(i, node.items[i], visitor, path);
		        if (typeof ci === "number")
		          i = ci - 1;
		        else if (ci === BREAK)
		          return BREAK;
		        else if (ci === REMOVE) {
		          node.items.splice(i, 1);
		          i -= 1;
		        }
		      }
		    } else if (isPair(node)) {
		      path = Object.freeze(path.concat(node));
		      const ck = visit_("key", node.key, visitor, path);
		      if (ck === BREAK)
		        return BREAK;
		      else if (ck === REMOVE)
		        node.key = null;
		      const cv = visit_("value", node.value, visitor, path);
		      if (cv === BREAK)
		        return BREAK;
		      else if (cv === REMOVE)
		        node.value = null;
		    }
		  }
		  return ctrl;
		}
		async function visitAsync(node, visitor) {
		  const visitor_ = initVisitor(visitor);
		  if (isDocument(node)) {
		    const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
		    if (cd === REMOVE)
		      node.contents = null;
		  } else
		    await visitAsync_(null, node, visitor_, Object.freeze([]));
		}
		visitAsync.BREAK = BREAK;
		visitAsync.SKIP = SKIP;
		visitAsync.REMOVE = REMOVE;
		async function visitAsync_(key, node, visitor, path) {
		  const ctrl = await callVisitor(key, node, visitor, path);
		  if (isNode(ctrl) || isPair(ctrl)) {
		    replaceNode(key, path, ctrl);
		    return visitAsync_(key, ctrl, visitor, path);
		  }
		  if (typeof ctrl !== "symbol") {
		    if (isCollection(node)) {
		      path = Object.freeze(path.concat(node));
		      for (let i = 0; i < node.items.length; ++i) {
		        const ci = await visitAsync_(i, node.items[i], visitor, path);
		        if (typeof ci === "number")
		          i = ci - 1;
		        else if (ci === BREAK)
		          return BREAK;
		        else if (ci === REMOVE) {
		          node.items.splice(i, 1);
		          i -= 1;
		        }
		      }
		    } else if (isPair(node)) {
		      path = Object.freeze(path.concat(node));
		      const ck = await visitAsync_("key", node.key, visitor, path);
		      if (ck === BREAK)
		        return BREAK;
		      else if (ck === REMOVE)
		        node.key = null;
		      const cv = await visitAsync_("value", node.value, visitor, path);
		      if (cv === BREAK)
		        return BREAK;
		      else if (cv === REMOVE)
		        node.value = null;
		    }
		  }
		  return ctrl;
		}
		function initVisitor(visitor) {
		  if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
		    return Object.assign({
		      Alias: visitor.Node,
		      Map: visitor.Node,
		      Scalar: visitor.Node,
		      Seq: visitor.Node
		    }, visitor.Value && {
		      Map: visitor.Value,
		      Scalar: visitor.Value,
		      Seq: visitor.Value
		    }, visitor.Collection && {
		      Map: visitor.Collection,
		      Seq: visitor.Collection
		    }, visitor);
		  }
		  return visitor;
		}
		function callVisitor(key, node, visitor, path) {
		  if (typeof visitor === "function")
		    return visitor(key, node, path);
		  if (isMap(node))
		    return visitor.Map?.(key, node, path);
		  if (isSeq(node))
		    return visitor.Seq?.(key, node, path);
		  if (isPair(node))
		    return visitor.Pair?.(key, node, path);
		  if (isScalar(node))
		    return visitor.Scalar?.(key, node, path);
		  if (isAlias(node))
		    return visitor.Alias?.(key, node, path);
		  return void 0;
		}
		function replaceNode(key, path, node) {
		  const parent = path[path.length - 1];
		  if (isCollection(parent)) {
		    parent.items[key] = node;
		  } else if (isPair(parent)) {
		    if (key === "key")
		      parent.key = node;
		    else
		      parent.value = node;
		  } else if (isDocument(parent)) {
		    parent.contents = node;
		  } else {
		    const pt = isAlias(parent) ? "alias" : "scalar";
		    throw new Error(`Cannot replace node with ${pt} parent`);
		  }
		}

		// node_modules/yaml/browser/dist/doc/directives.js
		var escapeChars = {
		  "!": "%21",
		  ",": "%2C",
		  "[": "%5B",
		  "]": "%5D",
		  "{": "%7B",
		  "}": "%7D"
		};
		var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
		var Directives = class _Directives {
		  constructor(yaml, tags) {
		    this.docStart = null;
		    this.docEnd = false;
		    this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
		    this.tags = Object.assign({}, _Directives.defaultTags, tags);
		  }
		  clone() {
		    const copy = new _Directives(this.yaml, this.tags);
		    copy.docStart = this.docStart;
		    return copy;
		  }
		  /**
		   * During parsing, get a Directives instance for the current document and
		   * update the stream state according to the current version's spec.
		   */
		  atDocument() {
		    const res = new _Directives(this.yaml, this.tags);
		    switch (this.yaml.version) {
		      case "1.1":
		        this.atNextDocument = true;
		        break;
		      case "1.2":
		        this.atNextDocument = false;
		        this.yaml = {
		          explicit: _Directives.defaultYaml.explicit,
		          version: "1.2"
		        };
		        this.tags = Object.assign({}, _Directives.defaultTags);
		        break;
		    }
		    return res;
		  }
		  /**
		   * @param onError - May be called even if the action was successful
		   * @returns `true` on success
		   */
		  add(line, onError) {
		    if (this.atNextDocument) {
		      this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
		      this.tags = Object.assign({}, _Directives.defaultTags);
		      this.atNextDocument = false;
		    }
		    const parts = line.trim().split(/[ \t]+/);
		    const name = parts.shift();
		    switch (name) {
		      case "%TAG": {
		        if (parts.length !== 2) {
		          onError(0, "%TAG directive should contain exactly two parts");
		          if (parts.length < 2)
		            return false;
		        }
		        const [handle, prefix] = parts;
		        this.tags[handle] = prefix;
		        return true;
		      }
		      case "%YAML": {
		        this.yaml.explicit = true;
		        if (parts.length !== 1) {
		          onError(0, "%YAML directive should contain exactly one part");
		          return false;
		        }
		        const [version] = parts;
		        if (version === "1.1" || version === "1.2") {
		          this.yaml.version = version;
		          return true;
		        } else {
		          const isValid = /^\d+\.\d+$/.test(version);
		          onError(6, `Unsupported YAML version ${version}`, isValid);
		          return false;
		        }
		      }
		      default:
		        onError(0, `Unknown directive ${name}`, true);
		        return false;
		    }
		  }
		  /**
		   * Resolves a tag, matching handles to those defined in %TAG directives.
		   *
		   * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
		   *   `'!local'` tag, or `null` if unresolvable.
		   */
		  tagName(source, onError) {
		    if (source === "!")
		      return "!";
		    if (source[0] !== "!") {
		      onError(`Not a valid tag: ${source}`);
		      return null;
		    }
		    if (source[1] === "<") {
		      const verbatim = source.slice(2, -1);
		      if (verbatim === "!" || verbatim === "!!") {
		        onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
		        return null;
		      }
		      if (source[source.length - 1] !== ">")
		        onError("Verbatim tags must end with a >");
		      return verbatim;
		    }
		    const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
		    if (!suffix)
		      onError(`The ${source} tag has no suffix`);
		    const prefix = this.tags[handle];
		    if (prefix) {
		      try {
		        return prefix + decodeURIComponent(suffix);
		      } catch (error) {
		        onError(String(error));
		        return null;
		      }
		    }
		    if (handle === "!")
		      return source;
		    onError(`Could not resolve tag: ${source}`);
		    return null;
		  }
		  /**
		   * Given a fully resolved tag, returns its printable string form,
		   * taking into account current tag prefixes and defaults.
		   */
		  tagString(tag) {
		    for (const [handle, prefix] of Object.entries(this.tags)) {
		      if (tag.startsWith(prefix))
		        return handle + escapeTagName(tag.substring(prefix.length));
		    }
		    return tag[0] === "!" ? tag : `!<${tag}>`;
		  }
		  toString(doc) {
		    const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
		    const tagEntries = Object.entries(this.tags);
		    let tagNames;
		    if (doc && tagEntries.length > 0 && isNode(doc.contents)) {
		      const tags = {};
		      visit(doc.contents, (_key, node) => {
		        if (isNode(node) && node.tag)
		          tags[node.tag] = true;
		      });
		      tagNames = Object.keys(tags);
		    } else
		      tagNames = [];
		    for (const [handle, prefix] of tagEntries) {
		      if (handle === "!!" && prefix === "tag:yaml.org,2002:")
		        continue;
		      if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
		        lines.push(`%TAG ${handle} ${prefix}`);
		    }
		    return lines.join("\n");
		  }
		};
		Directives.defaultYaml = { explicit: false, version: "1.2" };
		Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };

		// node_modules/yaml/browser/dist/doc/anchors.js
		function anchorIsValid(anchor) {
		  if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
		    const sa = JSON.stringify(anchor);
		    const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
		    throw new Error(msg);
		  }
		  return true;
		}

		// node_modules/yaml/browser/dist/doc/applyReviver.js
		function applyReviver(reviver, obj, key, val) {
		  if (val && typeof val === "object") {
		    if (Array.isArray(val)) {
		      for (let i = 0, len = val.length; i < len; ++i) {
		        const v0 = val[i];
		        const v1 = applyReviver(reviver, val, String(i), v0);
		        if (v1 === void 0)
		          delete val[i];
		        else if (v1 !== v0)
		          val[i] = v1;
		      }
		    } else if (val instanceof Map) {
		      for (const k of Array.from(val.keys())) {
		        const v0 = val.get(k);
		        const v1 = applyReviver(reviver, val, k, v0);
		        if (v1 === void 0)
		          val.delete(k);
		        else if (v1 !== v0)
		          val.set(k, v1);
		      }
		    } else if (val instanceof Set) {
		      for (const v0 of Array.from(val)) {
		        const v1 = applyReviver(reviver, val, v0, v0);
		        if (v1 === void 0)
		          val.delete(v0);
		        else if (v1 !== v0) {
		          val.delete(v0);
		          val.add(v1);
		        }
		      }
		    } else {
		      for (const [k, v0] of Object.entries(val)) {
		        const v1 = applyReviver(reviver, val, k, v0);
		        if (v1 === void 0)
		          delete val[k];
		        else if (v1 !== v0)
		          val[k] = v1;
		      }
		    }
		  }
		  return reviver.call(obj, key, val);
		}

		// node_modules/yaml/browser/dist/nodes/toJS.js
		function toJS(value, arg, ctx) {
		  if (Array.isArray(value))
		    return value.map((v, i) => toJS(v, String(i), ctx));
		  if (value && typeof value.toJSON === "function") {
		    if (!ctx || !hasAnchor(value))
		      return value.toJSON(arg, ctx);
		    const data = { aliasCount: 0, count: 1, res: void 0 };
		    ctx.anchors.set(value, data);
		    ctx.onCreate = (res2) => {
		      data.res = res2;
		      delete ctx.onCreate;
		    };
		    const res = value.toJSON(arg, ctx);
		    if (ctx.onCreate)
		      ctx.onCreate(res);
		    return res;
		  }
		  if (typeof value === "bigint" && !ctx?.keep)
		    return Number(value);
		  return value;
		}

		// node_modules/yaml/browser/dist/nodes/Node.js
		var NodeBase = class {
		  constructor(type) {
		    Object.defineProperty(this, NODE_TYPE, { value: type });
		  }
		  /** Create a copy of this node.  */
		  clone() {
		    const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
		    if (this.range)
		      copy.range = this.range.slice();
		    return copy;
		  }
		  /** A plain JavaScript representation of this node. */
		  toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
		    if (!isDocument(doc))
		      throw new TypeError("A document argument is required");
		    const ctx = {
		      anchors: /* @__PURE__ */ new Map(),
		      doc,
		      keep: true,
		      mapAsMap: mapAsMap === true,
		      mapKeyWarned: false,
		      maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
		    };
		    const res = toJS(this, "", ctx);
		    if (typeof onAnchor === "function")
		      for (const { count, res: res2 } of ctx.anchors.values())
		        onAnchor(res2, count);
		    return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
		  }
		};

		// node_modules/yaml/browser/dist/nodes/Alias.js
		var Alias = class extends NodeBase {
		  constructor(source) {
		    super(ALIAS);
		    this.source = source;
		    Object.defineProperty(this, "tag", {
		      set() {
		        throw new Error("Alias nodes cannot have tags");
		      }
		    });
		  }
		  /**
		   * Resolve the value of this alias within `doc`, finding the last
		   * instance of the `source` anchor before this node.
		   */
		  resolve(doc, ctx) {
		    if (ctx?.maxAliasCount === 0)
		      throw new ReferenceError("Alias resolution is disabled");
		    let nodes;
		    if (ctx?.aliasResolveCache) {
		      nodes = ctx.aliasResolveCache;
		    } else {
		      nodes = [];
		      visit(doc, {
		        Node: (_key, node) => {
		          if (isAlias(node) || hasAnchor(node))
		            nodes.push(node);
		        }
		      });
		      if (ctx)
		        ctx.aliasResolveCache = nodes;
		    }
		    let found = void 0;
		    for (const node of nodes) {
		      if (node === this)
		        break;
		      if (node.anchor === this.source)
		        found = node;
		    }
		    if (found && ctx) {
		      const { anchors, doc: doc2, maxAliasCount } = ctx;
		      let data = anchors.get(found);
		      if (!data) {
		        toJS(found, null, ctx);
		        data = anchors.get(found);
		      }
		      if (data?.res === void 0) {
		        const msg = "This should not happen: Alias anchor was not resolved?";
		        throw new ReferenceError(msg);
		      }
		      if (maxAliasCount >= 0) {
		        data.count += 1;
		        if (data.aliasCount === 0)
		          data.aliasCount = getAliasCount(doc2, found, anchors);
		        if (data.count * data.aliasCount > maxAliasCount) {
		          const msg = "Excessive alias count indicates a resource exhaustion attack";
		          throw new ReferenceError(msg);
		        }
		      }
		    }
		    return found;
		  }
		  toJSON(_arg, ctx) {
		    if (!ctx)
		      return { source: this.source };
		    const source = this.resolve(ctx.doc, ctx);
		    if (!source) {
		      const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
		      throw new ReferenceError(msg);
		    }
		    return ctx.anchors.get(source).res;
		  }
		  toString(ctx, _onComment, _onChompKeep) {
		    const src = `*${this.source}`;
		    if (ctx) {
		      anchorIsValid(this.source);
		      if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
		        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
		        throw new Error(msg);
		      }
		      if (ctx.implicitKey)
		        return `${src} `;
		    }
		    return src;
		  }
		};
		function getAliasCount(doc, node, anchors) {
		  if (isAlias(node)) {
		    const source = node.resolve(doc);
		    const anchor = anchors && source && anchors.get(source);
		    return anchor ? anchor.count * anchor.aliasCount : 0;
		  } else if (isCollection(node)) {
		    let count = 0;
		    for (const item of node.items) {
		      const c = getAliasCount(doc, item, anchors);
		      if (c > count)
		        count = c;
		    }
		    return count;
		  } else if (isPair(node)) {
		    const kc = getAliasCount(doc, node.key, anchors);
		    const vc = getAliasCount(doc, node.value, anchors);
		    return Math.max(kc, vc);
		  }
		  return 1;
		}

		// node_modules/yaml/browser/dist/nodes/Scalar.js
		var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
		var Scalar = class extends NodeBase {
		  constructor(value) {
		    super(SCALAR);
		    this.value = value;
		  }
		  toJSON(arg, ctx) {
		    return ctx?.keep ? this.value : toJS(this.value, arg, ctx);
		  }
		  toString() {
		    return String(this.value);
		  }
		};
		Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
		Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
		Scalar.PLAIN = "PLAIN";
		Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
		Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";

		// node_modules/yaml/browser/dist/doc/createNode.js
		var defaultTagPrefix = "tag:yaml.org,2002:";
		function findTagObject(value, tagName, tags) {
		  if (tagName) {
		    const match = tags.filter((t) => t.tag === tagName);
		    const tagObj = match.find((t) => !t.format) ?? match[0];
		    if (!tagObj)
		      throw new Error(`Tag ${tagName} not found`);
		    return tagObj;
		  }
		  return tags.find((t) => t.identify?.(value) && !t.format);
		}
		function createNode(value, tagName, ctx) {
		  if (isDocument(value))
		    value = value.contents;
		  if (isNode(value))
		    return value;
		  if (isPair(value)) {
		    const map2 = ctx.schema[MAP].createNode?.(ctx.schema, null, ctx);
		    map2.items.push(value);
		    return map2;
		  }
		  if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
		    value = value.valueOf();
		  }
		  const { aliasDuplicateObjects, onAnchor, onTagObj, schema: schema4, sourceObjects } = ctx;
		  let ref = void 0;
		  if (aliasDuplicateObjects && value && typeof value === "object") {
		    ref = sourceObjects.get(value);
		    if (ref) {
		      ref.anchor ?? (ref.anchor = onAnchor(value));
		      return new Alias(ref.anchor);
		    } else {
		      ref = { anchor: null, node: null };
		      sourceObjects.set(value, ref);
		    }
		  }
		  if (tagName?.startsWith("!!"))
		    tagName = defaultTagPrefix + tagName.slice(2);
		  let tagObj = findTagObject(value, tagName, schema4.tags);
		  if (!tagObj) {
		    if (value && typeof value.toJSON === "function") {
		      value = value.toJSON();
		    }
		    if (!value || typeof value !== "object") {
		      const node2 = new Scalar(value);
		      if (ref)
		        ref.node = node2;
		      return node2;
		    }
		    tagObj = value instanceof Map ? schema4[MAP] : Symbol.iterator in Object(value) ? schema4[SEQ] : schema4[MAP];
		  }
		  if (onTagObj) {
		    onTagObj(tagObj);
		    delete ctx.onTagObj;
		  }
		  const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar(value);
		  if (tagName)
		    node.tag = tagName;
		  else if (!tagObj.default)
		    node.tag = tagObj.tag;
		  if (ref)
		    ref.node = node;
		  return node;
		}

		// node_modules/yaml/browser/dist/nodes/Collection.js
		function collectionFromPath(schema4, path, value) {
		  let v = value;
		  for (let i = path.length - 1; i >= 0; --i) {
		    const k = path[i];
		    if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
		      const a = [];
		      a[k] = v;
		      v = a;
		    } else {
		      v = /* @__PURE__ */ new Map([[k, v]]);
		    }
		  }
		  return createNode(v, void 0, {
		    aliasDuplicateObjects: false,
		    keepUndefined: false,
		    onAnchor: () => {
		      throw new Error("This should not happen, please report a bug.");
		    },
		    schema: schema4,
		    sourceObjects: /* @__PURE__ */ new Map()
		  });
		}
		var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
		var Collection = class extends NodeBase {
		  constructor(type, schema4) {
		    super(type);
		    Object.defineProperty(this, "schema", {
		      value: schema4,
		      configurable: true,
		      enumerable: false,
		      writable: true
		    });
		  }
		  /**
		   * Create a copy of this collection.
		   *
		   * @param schema - If defined, overwrites the original's schema
		   */
		  clone(schema4) {
		    const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
		    if (schema4)
		      copy.schema = schema4;
		    copy.items = copy.items.map((it) => isNode(it) || isPair(it) ? it.clone(schema4) : it);
		    if (this.range)
		      copy.range = this.range.slice();
		    return copy;
		  }
		  /**
		   * Adds a value to the collection. For `!!map` and `!!omap` the value must
		   * be a Pair instance or a `{ key, value }` object, which may not have a key
		   * that already exists in the map.
		   */
		  addIn(path, value) {
		    if (isEmptyPath(path))
		      this.add(value);
		    else {
		      const [key, ...rest] = path;
		      const node = this.get(key, true);
		      if (isCollection(node))
		        node.addIn(rest, value);
		      else if (node === void 0 && this.schema)
		        this.set(key, collectionFromPath(this.schema, rest, value));
		      else
		        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
		    }
		  }
		  /**
		   * Removes a value from the collection.
		   * @returns `true` if the item was found and removed.
		   */
		  deleteIn(path) {
		    const [key, ...rest] = path;
		    if (rest.length === 0)
		      return this.delete(key);
		    const node = this.get(key, true);
		    if (isCollection(node))
		      return node.deleteIn(rest);
		    else
		      throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
		  }
		  /**
		   * Returns item at `key`, or `undefined` if not found. By default unwraps
		   * scalar values from their surrounding node; to disable set `keepScalar` to
		   * `true` (collections are always returned intact).
		   */
		  getIn(path, keepScalar) {
		    const [key, ...rest] = path;
		    const node = this.get(key, true);
		    if (rest.length === 0)
		      return !keepScalar && isScalar(node) ? node.value : node;
		    else
		      return isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
		  }
		  hasAllNullValues(allowScalar) {
		    return this.items.every((node) => {
		      if (!isPair(node))
		        return false;
		      const n = node.value;
		      return n == null || allowScalar && isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
		    });
		  }
		  /**
		   * Checks if the collection includes a value with the key `key`.
		   */
		  hasIn(path) {
		    const [key, ...rest] = path;
		    if (rest.length === 0)
		      return this.has(key);
		    const node = this.get(key, true);
		    return isCollection(node) ? node.hasIn(rest) : false;
		  }
		  /**
		   * Sets a value in this collection. For `!!set`, `value` needs to be a
		   * boolean to add/remove the item from the set.
		   */
		  setIn(path, value) {
		    const [key, ...rest] = path;
		    if (rest.length === 0) {
		      this.set(key, value);
		    } else {
		      const node = this.get(key, true);
		      if (isCollection(node))
		        node.setIn(rest, value);
		      else if (node === void 0 && this.schema)
		        this.set(key, collectionFromPath(this.schema, rest, value));
		      else
		        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
		    }
		  }
		};

		// node_modules/yaml/browser/dist/stringify/stringifyComment.js
		var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
		function indentComment(comment, indent) {
		  if (/^\n+$/.test(comment))
		    return comment.substring(1);
		  return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
		}
		var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;

		// node_modules/yaml/browser/dist/stringify/foldFlowLines.js
		var FOLD_FLOW = "flow";
		var FOLD_BLOCK = "block";
		var FOLD_QUOTED = "quoted";
		function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
		  if (!lineWidth || lineWidth < 0)
		    return text;
		  if (lineWidth < minContentWidth)
		    minContentWidth = 0;
		  const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
		  if (text.length <= endStep)
		    return text;
		  const folds = [];
		  const escapedFolds = {};
		  let end = lineWidth - indent.length;
		  if (typeof indentAtStart === "number") {
		    if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
		      folds.push(0);
		    else
		      end = lineWidth - indentAtStart;
		  }
		  let split = void 0;
		  let prev = void 0;
		  let overflow = false;
		  let i = -1;
		  let escStart = -1;
		  let escEnd = -1;
		  if (mode === FOLD_BLOCK) {
		    i = consumeMoreIndentedLines(text, i, indent.length);
		    if (i !== -1)
		      end = i + endStep;
		  }
		  for (let ch; ch = text[i += 1]; ) {
		    if (mode === FOLD_QUOTED && ch === "\\") {
		      escStart = i;
		      switch (text[i + 1]) {
		        case "x":
		          i += 3;
		          break;
		        case "u":
		          i += 5;
		          break;
		        case "U":
		          i += 9;
		          break;
		        default:
		          i += 1;
		      }
		      escEnd = i;
		    }
		    if (ch === "\n") {
		      if (mode === FOLD_BLOCK)
		        i = consumeMoreIndentedLines(text, i, indent.length);
		      end = i + indent.length + endStep;
		      split = void 0;
		    } else {
		      if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
		        const next = text[i + 1];
		        if (next && next !== " " && next !== "\n" && next !== "	")
		          split = i;
		      }
		      if (i >= end) {
		        if (split) {
		          folds.push(split);
		          end = split + endStep;
		          split = void 0;
		        } else if (mode === FOLD_QUOTED) {
		          while (prev === " " || prev === "	") {
		            prev = ch;
		            ch = text[i += 1];
		            overflow = true;
		          }
		          const j = i > escEnd + 1 ? i - 2 : escStart - 1;
		          if (escapedFolds[j])
		            return text;
		          folds.push(j);
		          escapedFolds[j] = true;
		          end = j + endStep;
		          split = void 0;
		        } else {
		          overflow = true;
		        }
		      }
		    }
		    prev = ch;
		  }
		  if (overflow && onOverflow)
		    onOverflow();
		  if (folds.length === 0)
		    return text;
		  if (onFold)
		    onFold();
		  let res = text.slice(0, folds[0]);
		  for (let i2 = 0; i2 < folds.length; ++i2) {
		    const fold = folds[i2];
		    const end2 = folds[i2 + 1] || text.length;
		    if (fold === 0)
		      res = `
		${indent}${text.slice(0, end2)}`;
		    else {
		      if (mode === FOLD_QUOTED && escapedFolds[fold])
		        res += `${text[fold]}\\`;
		      res += `
		${indent}${text.slice(fold + 1, end2)}`;
		    }
		  }
		  return res;
		}
		function consumeMoreIndentedLines(text, i, indent) {
		  let end = i;
		  let start = i + 1;
		  let ch = text[start];
		  while (ch === " " || ch === "	") {
		    if (i < start + indent) {
		      ch = text[++i];
		    } else {
		      do {
		        ch = text[++i];
		      } while (ch && ch !== "\n");
		      end = i;
		      start = i + 1;
		      ch = text[start];
		    }
		  }
		  return end;
		}

		// node_modules/yaml/browser/dist/stringify/stringifyString.js
		var getFoldOptions = (ctx, isBlock) => ({
		  indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
		  lineWidth: ctx.options.lineWidth,
		  minContentWidth: ctx.options.minContentWidth
		});
		var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
		function lineLengthOverLimit(str, lineWidth, indentLength) {
		  if (!lineWidth || lineWidth < 0)
		    return false;
		  const limit = lineWidth - indentLength;
		  const strLen = str.length;
		  if (strLen <= limit)
		    return false;
		  for (let i = 0, start = 0; i < strLen; ++i) {
		    if (str[i] === "\n") {
		      if (i - start > limit)
		        return true;
		      start = i + 1;
		      if (strLen - start <= limit)
		        return false;
		    }
		  }
		  return true;
		}
		function doubleQuotedString(value, ctx) {
		  const json = JSON.stringify(value);
		  if (ctx.options.doubleQuotedAsJSON)
		    return json;
		  const { implicitKey } = ctx;
		  const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
		  const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
		  let str = "";
		  let start = 0;
		  for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
		    if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
		      str += json.slice(start, i) + "\\ ";
		      i += 1;
		      start = i;
		      ch = "\\";
		    }
		    if (ch === "\\")
		      switch (json[i + 1]) {
		        case "u":
		          {
		            str += json.slice(start, i);
		            const code = json.substr(i + 2, 4);
		            switch (code) {
		              case "0000":
		                str += "\\0";
		                break;
		              case "0007":
		                str += "\\a";
		                break;
		              case "000b":
		                str += "\\v";
		                break;
		              case "001b":
		                str += "\\e";
		                break;
		              case "0085":
		                str += "\\N";
		                break;
		              case "00a0":
		                str += "\\_";
		                break;
		              case "2028":
		                str += "\\L";
		                break;
		              case "2029":
		                str += "\\P";
		                break;
		              default:
		                if (code.substr(0, 2) === "00")
		                  str += "\\x" + code.substr(2);
		                else
		                  str += json.substr(i, 6);
		            }
		            i += 5;
		            start = i + 1;
		          }
		          break;
		        case "n":
		          if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
		            i += 1;
		          } else {
		            str += json.slice(start, i) + "\n\n";
		            while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
		              str += "\n";
		              i += 2;
		            }
		            str += indent;
		            if (json[i + 2] === " ")
		              str += "\\";
		            i += 1;
		            start = i + 1;
		          }
		          break;
		        default:
		          i += 1;
		      }
		  }
		  str = start ? str + json.slice(start) : json;
		  return implicitKey ? str : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx, false));
		}
		function singleQuotedString(value, ctx) {
		  if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
		    return doubleQuotedString(value, ctx);
		  const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
		  const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
		${indent}`) + "'";
		  return ctx.implicitKey ? res : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx, false));
		}
		function quotedString(value, ctx) {
		  const { singleQuote } = ctx.options;
		  let qs;
		  if (singleQuote === false)
		    qs = doubleQuotedString;
		  else {
		    const hasDouble = value.includes('"');
		    const hasSingle = value.includes("'");
		    if (hasDouble && !hasSingle)
		      qs = singleQuotedString;
		    else if (hasSingle && !hasDouble)
		      qs = doubleQuotedString;
		    else
		      qs = singleQuote ? singleQuotedString : doubleQuotedString;
		  }
		  return qs(value, ctx);
		}
		var blockEndNewlines;
		try {
		  blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
		} catch {
		  blockEndNewlines = /\n+(?!\n|$)/g;
		}
		function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
		  const { blockQuote, commentString, lineWidth } = ctx.options;
		  if (!blockQuote || /\n[\t ]+$/.test(value)) {
		    return quotedString(value, ctx);
		  }
		  const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
		  const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.BLOCK_FOLDED ? false : type === Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
		  if (!value)
		    return literal ? "|\n" : ">\n";
		  let chomp;
		  let endStart;
		  for (endStart = value.length; endStart > 0; --endStart) {
		    const ch = value[endStart - 1];
		    if (ch !== "\n" && ch !== "	" && ch !== " ")
		      break;
		  }
		  let end = value.substring(endStart);
		  const endNlPos = end.indexOf("\n");
		  if (endNlPos === -1) {
		    chomp = "-";
		  } else if (value === end || endNlPos !== end.length - 1) {
		    chomp = "+";
		    if (onChompKeep)
		      onChompKeep();
		  } else {
		    chomp = "";
		  }
		  if (end) {
		    value = value.slice(0, -end.length);
		    if (end[end.length - 1] === "\n")
		      end = end.slice(0, -1);
		    end = end.replace(blockEndNewlines, `$&${indent}`);
		  }
		  let startWithSpace = false;
		  let startEnd;
		  let startNlPos = -1;
		  for (startEnd = 0; startEnd < value.length; ++startEnd) {
		    const ch = value[startEnd];
		    if (ch === " ")
		      startWithSpace = true;
		    else if (ch === "\n")
		      startNlPos = startEnd;
		    else
		      break;
		  }
		  let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
		  if (start) {
		    value = value.substring(start.length);
		    start = start.replace(/\n+/g, `$&${indent}`);
		  }
		  const indentSize = indent ? "2" : "1";
		  let header = (startWithSpace ? indentSize : "") + chomp;
		  if (comment) {
		    header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
		    if (onComment)
		      onComment();
		  }
		  if (!literal) {
		    const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
		    let literalFallback = false;
		    const foldOptions = getFoldOptions(ctx, true);
		    if (blockQuote !== "folded" && type !== Scalar.BLOCK_FOLDED) {
		      foldOptions.onOverflow = () => {
		        literalFallback = true;
		      };
		    }
		    const body = foldFlowLines(`${start}${foldedValue}${end}`, indent, FOLD_BLOCK, foldOptions);
		    if (!literalFallback)
		      return `>${header}
		${indent}${body}`;
		  }
		  value = value.replace(/\n+/g, `$&${indent}`);
		  return `|${header}
		${indent}${start}${value}${end}`;
		}
		function plainString(item, ctx, onComment, onChompKeep) {
		  const { type, value } = item;
		  const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
		  if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
		    return quotedString(value, ctx);
		  }
		  if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
		    return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
		  }
		  if (!implicitKey && !inFlow && type !== Scalar.PLAIN && value.includes("\n")) {
		    return blockString(item, ctx, onComment, onChompKeep);
		  }
		  if (containsDocumentMarker(value)) {
		    if (indent === "") {
		      ctx.forceBlockIndent = true;
		      return blockString(item, ctx, onComment, onChompKeep);
		    } else if (implicitKey && indent === indentStep) {
		      return quotedString(value, ctx);
		    }
		  }
		  const str = value.replace(/\n+/g, `$&
		${indent}`);
		  if (actualString) {
		    const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
		    const { compat, tags } = ctx.doc.schema;
		    if (tags.some(test) || compat?.some(test))
		      return quotedString(value, ctx);
		  }
		  return implicitKey ? str : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx, false));
		}
		function stringifyString(item, ctx, onComment, onChompKeep) {
		  const { implicitKey, inFlow } = ctx;
		  const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
		  let { type } = item;
		  if (type !== Scalar.QUOTE_DOUBLE) {
		    if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
		      type = Scalar.QUOTE_DOUBLE;
		  }
		  const _stringify = (_type) => {
		    switch (_type) {
		      case Scalar.BLOCK_FOLDED:
		      case Scalar.BLOCK_LITERAL:
		        return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
		      case Scalar.QUOTE_DOUBLE:
		        return doubleQuotedString(ss.value, ctx);
		      case Scalar.QUOTE_SINGLE:
		        return singleQuotedString(ss.value, ctx);
		      case Scalar.PLAIN:
		        return plainString(ss, ctx, onComment, onChompKeep);
		      default:
		        return null;
		    }
		  };
		  let res = _stringify(type);
		  if (res === null) {
		    const { defaultKeyType, defaultStringType } = ctx.options;
		    const t = implicitKey && defaultKeyType || defaultStringType;
		    res = _stringify(t);
		    if (res === null)
		      throw new Error(`Unsupported default string type ${t}`);
		  }
		  return res;
		}

		// node_modules/yaml/browser/dist/stringify/stringify.js
		function createStringifyContext(doc, options) {
		  const opt = Object.assign({
		    blockQuote: true,
		    commentString: stringifyComment,
		    defaultKeyType: null,
		    defaultStringType: "PLAIN",
		    directives: null,
		    doubleQuotedAsJSON: false,
		    doubleQuotedMinMultiLineLength: 40,
		    falseStr: "false",
		    flowCollectionPadding: true,
		    indentSeq: true,
		    lineWidth: 80,
		    minContentWidth: 20,
		    nullStr: "null",
		    simpleKeys: false,
		    singleQuote: null,
		    trailingComma: false,
		    trueStr: "true",
		    verifyAliasOrder: true
		  }, doc.schema.toStringOptions, options);
		  let inFlow;
		  switch (opt.collectionStyle) {
		    case "block":
		      inFlow = false;
		      break;
		    case "flow":
		      inFlow = true;
		      break;
		    default:
		      inFlow = null;
		  }
		  return {
		    anchors: /* @__PURE__ */ new Set(),
		    doc,
		    flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
		    indent: "",
		    indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
		    inFlow,
		    options: opt
		  };
		}
		function getTagObject(tags, item) {
		  if (item.tag) {
		    const match = tags.filter((t) => t.tag === item.tag);
		    if (match.length > 0)
		      return match.find((t) => t.format === item.format) ?? match[0];
		  }
		  let tagObj = void 0;
		  let obj;
		  if (isScalar(item)) {
		    obj = item.value;
		    let match = tags.filter((t) => t.identify?.(obj));
		    if (match.length > 1) {
		      const testMatch = match.filter((t) => t.test);
		      if (testMatch.length > 0)
		        match = testMatch;
		    }
		    tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
		  } else {
		    obj = item;
		    tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
		  }
		  if (!tagObj) {
		    const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
		    throw new Error(`Tag not resolved for ${name} value`);
		  }
		  return tagObj;
		}
		function stringifyProps(node, tagObj, { anchors, doc }) {
		  if (!doc.directives)
		    return "";
		  const props = [];
		  const anchor = (isScalar(node) || isCollection(node)) && node.anchor;
		  if (anchor && anchorIsValid(anchor)) {
		    anchors.add(anchor);
		    props.push(`&${anchor}`);
		  }
		  const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
		  if (tag)
		    props.push(doc.directives.tagString(tag));
		  return props.join(" ");
		}
		function stringify(item, ctx, onComment, onChompKeep) {
		  if (isPair(item))
		    return item.toString(ctx, onComment, onChompKeep);
		  if (isAlias(item)) {
		    if (ctx.doc.directives)
		      return item.toString(ctx);
		    if (ctx.resolvedAliases?.has(item)) {
		      throw new TypeError(`Cannot stringify circular structure without alias nodes`);
		    } else {
		      if (ctx.resolvedAliases)
		        ctx.resolvedAliases.add(item);
		      else
		        ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
		      item = item.resolve(ctx.doc);
		    }
		  }
		  let tagObj = void 0;
		  const node = isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
		  tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
		  const props = stringifyProps(node, tagObj, ctx);
		  if (props.length > 0)
		    ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
		  const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : isScalar(node) ? stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
		  if (!props)
		    return str;
		  return isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
		${ctx.indent}${str}`;
		}

		// node_modules/yaml/browser/dist/stringify/stringifyPair.js
		function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
		  const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
		  let keyComment = isNode(key) && key.comment || null;
		  if (simpleKeys) {
		    if (keyComment) {
		      throw new Error("With simple keys, key nodes cannot have comments");
		    }
		    if (isCollection(key) || !isNode(key) && typeof key === "object") {
		      const msg = "With simple keys, collection cannot be used as a key value";
		      throw new Error(msg);
		    }
		  }
		  let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || isCollection(key) || (isScalar(key) ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL : typeof key === "object"));
		  ctx = Object.assign({}, ctx, {
		    allNullValues: false,
		    implicitKey: !explicitKey && (simpleKeys || !allNullValues),
		    indent: indent + indentStep
		  });
		  let keyCommentDone = false;
		  let chompKeep = false;
		  let str = stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
		  if (!explicitKey && !ctx.inFlow && str.length > 1024) {
		    if (simpleKeys)
		      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
		    explicitKey = true;
		  }
		  if (ctx.inFlow) {
		    if (allNullValues || value == null) {
		      if (keyCommentDone && onComment)
		        onComment();
		      return str === "" ? "?" : explicitKey ? `? ${str}` : str;
		    }
		  } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
		    str = `? ${str}`;
		    if (keyComment && !keyCommentDone) {
		      str += lineComment(str, ctx.indent, commentString(keyComment));
		    } else if (chompKeep && onChompKeep)
		      onChompKeep();
		    return str;
		  }
		  if (keyCommentDone)
		    keyComment = null;
		  if (explicitKey) {
		    if (keyComment)
		      str += lineComment(str, ctx.indent, commentString(keyComment));
		    str = `? ${str}
		${indent}:`;
		  } else {
		    str = `${str}:`;
		    if (keyComment)
		      str += lineComment(str, ctx.indent, commentString(keyComment));
		  }
		  let vsb, vcb, valueComment;
		  if (isNode(value)) {
		    vsb = !!value.spaceBefore;
		    vcb = value.commentBefore;
		    valueComment = value.comment;
		  } else {
		    vsb = false;
		    vcb = null;
		    valueComment = null;
		    if (value && typeof value === "object")
		      value = doc.createNode(value);
		  }
		  ctx.implicitKey = false;
		  if (!explicitKey && !keyComment && isScalar(value))
		    ctx.indentAtStart = str.length + 1;
		  chompKeep = false;
		  if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && isSeq(value) && !value.flow && !value.tag && !value.anchor) {
		    ctx.indent = ctx.indent.substring(2);
		  }
		  let valueCommentDone = false;
		  const valueStr = stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
		  let ws = " ";
		  if (keyComment || vsb || vcb) {
		    ws = vsb ? "\n" : "";
		    if (vcb) {
		      const cs = commentString(vcb);
		      ws += `
		${indentComment(cs, ctx.indent)}`;
		    }
		    if (valueStr === "" && !ctx.inFlow) {
		      if (ws === "\n" && valueComment)
		        ws = "\n\n";
		    } else {
		      ws += `
		${ctx.indent}`;
		    }
		  } else if (!explicitKey && isCollection(value)) {
		    const vs0 = valueStr[0];
		    const nl0 = valueStr.indexOf("\n");
		    const hasNewline = nl0 !== -1;
		    const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
		    if (hasNewline || !flow) {
		      let hasPropsLine = false;
		      if (hasNewline && (vs0 === "&" || vs0 === "!")) {
		        let sp0 = valueStr.indexOf(" ");
		        if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
		          sp0 = valueStr.indexOf(" ", sp0 + 1);
		        }
		        if (sp0 === -1 || nl0 < sp0)
		          hasPropsLine = true;
		      }
		      if (!hasPropsLine)
		        ws = `
		${ctx.indent}`;
		    }
		  } else if (valueStr === "" || valueStr[0] === "\n") {
		    ws = "";
		  }
		  str += ws + valueStr;
		  if (ctx.inFlow) {
		    if (valueCommentDone && onComment)
		      onComment();
		  } else if (valueComment && !valueCommentDone) {
		    str += lineComment(str, ctx.indent, commentString(valueComment));
		  } else if (chompKeep && onChompKeep) {
		    onChompKeep();
		  }
		  return str;
		}

		// node_modules/yaml/browser/dist/log.js
		function warn(logLevel, warning) {
		  if (logLevel === "debug" || logLevel === "warn") {
		    console.warn(warning);
		  }
		}

		// node_modules/yaml/browser/dist/schema/yaml-1.1/merge.js
		var MERGE_KEY = "<<";
		var merge = {
		  identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
		  default: "key",
		  tag: "tag:yaml.org,2002:merge",
		  test: /^<<$/,
		  resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), {
		    addToJSMap: addMergeToJSMap
		  }),
		  stringify: () => MERGE_KEY
		};
		var isMergeKey = (ctx, key) => (merge.identify(key) || isScalar(key) && (!key.type || key.type === Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
		function addMergeToJSMap(ctx, map2, value) {
		  const source = resolveAliasValue(ctx, value);
		  if (isSeq(source))
		    for (const it of source.items)
		      mergeValue(ctx, map2, it);
		  else if (Array.isArray(source))
		    for (const it of source)
		      mergeValue(ctx, map2, it);
		  else
		    mergeValue(ctx, map2, source);
		}
		function mergeValue(ctx, map2, value) {
		  const source = resolveAliasValue(ctx, value);
		  if (!isMap(source))
		    throw new Error("Merge sources must be maps or map aliases");
		  const srcMap = source.toJSON(null, ctx, Map);
		  for (const [key, value2] of srcMap) {
		    if (map2 instanceof Map) {
		      if (!map2.has(key))
		        map2.set(key, value2);
		    } else if (map2 instanceof Set) {
		      map2.add(key);
		    } else if (!Object.prototype.hasOwnProperty.call(map2, key)) {
		      Object.defineProperty(map2, key, {
		        value: value2,
		        writable: true,
		        enumerable: true,
		        configurable: true
		      });
		    }
		  }
		  return map2;
		}
		function resolveAliasValue(ctx, value) {
		  return ctx && isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
		}

		// node_modules/yaml/browser/dist/nodes/addPairToJSMap.js
		function addPairToJSMap(ctx, map2, { key, value }) {
		  if (isNode(key) && key.addToJSMap)
		    key.addToJSMap(ctx, map2, value);
		  else if (isMergeKey(ctx, key))
		    addMergeToJSMap(ctx, map2, value);
		  else {
		    const jsKey = toJS(key, "", ctx);
		    if (map2 instanceof Map) {
		      map2.set(jsKey, toJS(value, jsKey, ctx));
		    } else if (map2 instanceof Set) {
		      map2.add(jsKey);
		    } else {
		      const stringKey = stringifyKey(key, jsKey, ctx);
		      const jsValue = toJS(value, stringKey, ctx);
		      if (stringKey in map2)
		        Object.defineProperty(map2, stringKey, {
		          value: jsValue,
		          writable: true,
		          enumerable: true,
		          configurable: true
		        });
		      else
		        map2[stringKey] = jsValue;
		    }
		  }
		  return map2;
		}
		function stringifyKey(key, jsKey, ctx) {
		  if (jsKey === null)
		    return "";
		  if (typeof jsKey !== "object")
		    return String(jsKey);
		  if (isNode(key) && ctx?.doc) {
		    const strCtx = createStringifyContext(ctx.doc, {});
		    strCtx.anchors = /* @__PURE__ */ new Set();
		    for (const node of ctx.anchors.keys())
		      strCtx.anchors.add(node.anchor);
		    strCtx.inFlow = true;
		    strCtx.inStringifyKey = true;
		    const strKey = key.toString(strCtx);
		    if (!ctx.mapKeyWarned) {
		      let jsonStr = JSON.stringify(strKey);
		      if (jsonStr.length > 40)
		        jsonStr = jsonStr.substring(0, 36) + '..."';
		      warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
		      ctx.mapKeyWarned = true;
		    }
		    return strKey;
		  }
		  return JSON.stringify(jsKey);
		}

		// node_modules/yaml/browser/dist/nodes/Pair.js
		function createPair(key, value, ctx) {
		  const k = createNode(key, void 0, ctx);
		  const v = createNode(value, void 0, ctx);
		  return new Pair(k, v);
		}
		var Pair = class _Pair {
		  constructor(key, value = null) {
		    Object.defineProperty(this, NODE_TYPE, { value: PAIR });
		    this.key = key;
		    this.value = value;
		  }
		  clone(schema4) {
		    let { key, value } = this;
		    if (isNode(key))
		      key = key.clone(schema4);
		    if (isNode(value))
		      value = value.clone(schema4);
		    return new _Pair(key, value);
		  }
		  toJSON(_, ctx) {
		    const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
		    return addPairToJSMap(ctx, pair, this);
		  }
		  toString(ctx, onComment, onChompKeep) {
		    return ctx?.doc ? stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
		  }
		};

		// node_modules/yaml/browser/dist/stringify/stringifyCollection.js
		function stringifyCollection(collection, ctx, options) {
		  const flow = ctx.inFlow ?? collection.flow;
		  const stringify4 = flow ? stringifyFlowCollection : stringifyBlockCollection;
		  return stringify4(collection, ctx, options);
		}
		function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
		  const { indent, options: { commentString } } = ctx;
		  const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
		  let chompKeep = false;
		  const lines = [];
		  for (let i = 0; i < items.length; ++i) {
		    const item = items[i];
		    let comment2 = null;
		    if (isNode(item)) {
		      if (!chompKeep && item.spaceBefore)
		        lines.push("");
		      addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
		      if (item.comment)
		        comment2 = item.comment;
		    } else if (isPair(item)) {
		      const ik = isNode(item.key) ? item.key : null;
		      if (ik) {
		        if (!chompKeep && ik.spaceBefore)
		          lines.push("");
		        addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
		      }
		    }
		    chompKeep = false;
		    let str2 = stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
		    if (comment2)
		      str2 += lineComment(str2, itemIndent, commentString(comment2));
		    if (chompKeep && comment2)
		      chompKeep = false;
		    lines.push(blockItemPrefix + str2);
		  }
		  let str;
		  if (lines.length === 0) {
		    str = flowChars.start + flowChars.end;
		  } else {
		    str = lines[0];
		    for (let i = 1; i < lines.length; ++i) {
		      const line = lines[i];
		      str += line ? `
		${indent}${line}` : "\n";
		    }
		  }
		  if (comment) {
		    str += "\n" + indentComment(commentString(comment), indent);
		    if (onComment)
		      onComment();
		  } else if (chompKeep && onChompKeep)
		    onChompKeep();
		  return str;
		}
		function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
		  const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
		  itemIndent += indentStep;
		  const itemCtx = Object.assign({}, ctx, {
		    indent: itemIndent,
		    inFlow: true,
		    type: null
		  });
		  let reqNewline = false;
		  let linesAtValue = 0;
		  const lines = [];
		  for (let i = 0; i < items.length; ++i) {
		    const item = items[i];
		    let comment = null;
		    if (isNode(item)) {
		      if (item.spaceBefore)
		        lines.push("");
		      addCommentBefore(ctx, lines, item.commentBefore, false);
		      if (item.comment)
		        comment = item.comment;
		    } else if (isPair(item)) {
		      const ik = isNode(item.key) ? item.key : null;
		      if (ik) {
		        if (ik.spaceBefore)
		          lines.push("");
		        addCommentBefore(ctx, lines, ik.commentBefore, false);
		        if (ik.comment)
		          reqNewline = true;
		      }
		      const iv = isNode(item.value) ? item.value : null;
		      if (iv) {
		        if (iv.comment)
		          comment = iv.comment;
		        if (iv.commentBefore)
		          reqNewline = true;
		      } else if (item.value == null && ik?.comment) {
		        comment = ik.comment;
		      }
		    }
		    if (comment)
		      reqNewline = true;
		    let str = stringify(item, itemCtx, () => comment = null);
		    reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
		    if (i < items.length - 1) {
		      str += ",";
		    } else if (ctx.options.trailingComma) {
		      if (ctx.options.lineWidth > 0) {
		        reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
		      }
		      if (reqNewline) {
		        str += ",";
		      }
		    }
		    if (comment)
		      str += lineComment(str, itemIndent, commentString(comment));
		    lines.push(str);
		    linesAtValue = lines.length;
		  }
		  const { start, end } = flowChars;
		  if (lines.length === 0) {
		    return start + end;
		  } else {
		    if (!reqNewline) {
		      const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
		      reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
		    }
		    if (reqNewline) {
		      let str = start;
		      for (const line of lines)
		        str += line ? `
		${indentStep}${indent}${line}` : "\n";
		      return `${str}
		${indent}${end}`;
		    } else {
		      return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
		    }
		  }
		}
		function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
		  if (comment && chompKeep)
		    comment = comment.replace(/^\n+/, "");
		  if (comment) {
		    const ic = indentComment(commentString(comment), indent);
		    lines.push(ic.trimStart());
		  }
		}

		// node_modules/yaml/browser/dist/nodes/YAMLMap.js
		function findPair(items, key) {
		  const k = isScalar(key) ? key.value : key;
		  for (const it of items) {
		    if (isPair(it)) {
		      if (it.key === key || it.key === k)
		        return it;
		      if (isScalar(it.key) && it.key.value === k)
		        return it;
		    }
		  }
		  return void 0;
		}
		var YAMLMap = class extends Collection {
		  static get tagName() {
		    return "tag:yaml.org,2002:map";
		  }
		  constructor(schema4) {
		    super(MAP, schema4);
		    this.items = [];
		  }
		  /**
		   * A generic collection parsing method that can be extended
		   * to other node classes that inherit from YAMLMap
		   */
		  static from(schema4, obj, ctx) {
		    const { keepUndefined, replacer } = ctx;
		    const map2 = new this(schema4);
		    const add = (key, value) => {
		      if (typeof replacer === "function")
		        value = replacer.call(obj, key, value);
		      else if (Array.isArray(replacer) && !replacer.includes(key))
		        return;
		      if (value !== void 0 || keepUndefined)
		        map2.items.push(createPair(key, value, ctx));
		    };
		    if (obj instanceof Map) {
		      for (const [key, value] of obj)
		        add(key, value);
		    } else if (obj && typeof obj === "object") {
		      for (const key of Object.keys(obj))
		        add(key, obj[key]);
		    }
		    if (typeof schema4.sortMapEntries === "function") {
		      map2.items.sort(schema4.sortMapEntries);
		    }
		    return map2;
		  }
		  /**
		   * Adds a value to the collection.
		   *
		   * @param overwrite - If not set `true`, using a key that is already in the
		   *   collection will throw. Otherwise, overwrites the previous value.
		   */
		  add(pair, overwrite) {
		    let _pair;
		    if (isPair(pair))
		      _pair = pair;
		    else if (!pair || typeof pair !== "object" || !("key" in pair)) {
		      _pair = new Pair(pair, pair?.value);
		    } else
		      _pair = new Pair(pair.key, pair.value);
		    const prev = findPair(this.items, _pair.key);
		    const sortEntries = this.schema?.sortMapEntries;
		    if (prev) {
		      if (!overwrite)
		        throw new Error(`Key ${_pair.key} already set`);
		      if (isScalar(prev.value) && isScalarValue(_pair.value))
		        prev.value.value = _pair.value;
		      else
		        prev.value = _pair.value;
		    } else if (sortEntries) {
		      const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
		      if (i === -1)
		        this.items.push(_pair);
		      else
		        this.items.splice(i, 0, _pair);
		    } else {
		      this.items.push(_pair);
		    }
		  }
		  delete(key) {
		    const it = findPair(this.items, key);
		    if (!it)
		      return false;
		    const del = this.items.splice(this.items.indexOf(it), 1);
		    return del.length > 0;
		  }
		  get(key, keepScalar) {
		    const it = findPair(this.items, key);
		    const node = it?.value;
		    return (!keepScalar && isScalar(node) ? node.value : node) ?? void 0;
		  }
		  has(key) {
		    return !!findPair(this.items, key);
		  }
		  set(key, value) {
		    this.add(new Pair(key, value), true);
		  }
		  /**
		   * @param ctx - Conversion context, originally set in Document#toJS()
		   * @param {Class} Type - If set, forces the returned collection type
		   * @returns Instance of Type, Map, or Object
		   */
		  toJSON(_, ctx, Type) {
		    const map2 = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
		    if (ctx?.onCreate)
		      ctx.onCreate(map2);
		    for (const item of this.items)
		      addPairToJSMap(ctx, map2, item);
		    return map2;
		  }
		  toString(ctx, onComment, onChompKeep) {
		    if (!ctx)
		      return JSON.stringify(this);
		    for (const item of this.items) {
		      if (!isPair(item))
		        throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
		    }
		    if (!ctx.allNullValues && this.hasAllNullValues(false))
		      ctx = Object.assign({}, ctx, { allNullValues: true });
		    return stringifyCollection(this, ctx, {
		      blockItemPrefix: "",
		      flowChars: { start: "{", end: "}" },
		      itemIndent: ctx.indent || "",
		      onChompKeep,
		      onComment
		    });
		  }
		};

		// node_modules/yaml/browser/dist/schema/common/map.js
		var map = {
		  collection: "map",
		  default: true,
		  nodeClass: YAMLMap,
		  tag: "tag:yaml.org,2002:map",
		  resolve(map2, onError) {
		    if (!isMap(map2))
		      onError("Expected a mapping for this tag");
		    return map2;
		  },
		  createNode: (schema4, obj, ctx) => YAMLMap.from(schema4, obj, ctx)
		};

		// node_modules/yaml/browser/dist/nodes/YAMLSeq.js
		var YAMLSeq = class extends Collection {
		  static get tagName() {
		    return "tag:yaml.org,2002:seq";
		  }
		  constructor(schema4) {
		    super(SEQ, schema4);
		    this.items = [];
		  }
		  add(value) {
		    this.items.push(value);
		  }
		  /**
		   * Removes a value from the collection.
		   *
		   * `key` must contain a representation of an integer for this to succeed.
		   * It may be wrapped in a `Scalar`.
		   *
		   * @returns `true` if the item was found and removed.
		   */
		  delete(key) {
		    const idx = asItemIndex(key);
		    if (typeof idx !== "number")
		      return false;
		    const del = this.items.splice(idx, 1);
		    return del.length > 0;
		  }
		  get(key, keepScalar) {
		    const idx = asItemIndex(key);
		    if (typeof idx !== "number")
		      return void 0;
		    const it = this.items[idx];
		    return !keepScalar && isScalar(it) ? it.value : it;
		  }
		  /**
		   * Checks if the collection includes a value with the key `key`.
		   *
		   * `key` must contain a representation of an integer for this to succeed.
		   * It may be wrapped in a `Scalar`.
		   */
		  has(key) {
		    const idx = asItemIndex(key);
		    return typeof idx === "number" && idx < this.items.length;
		  }
		  /**
		   * Sets a value in this collection. For `!!set`, `value` needs to be a
		   * boolean to add/remove the item from the set.
		   *
		   * If `key` does not contain a representation of an integer, this will throw.
		   * It may be wrapped in a `Scalar`.
		   */
		  set(key, value) {
		    const idx = asItemIndex(key);
		    if (typeof idx !== "number")
		      throw new Error(`Expected a valid index, not ${key}.`);
		    const prev = this.items[idx];
		    if (isScalar(prev) && isScalarValue(value))
		      prev.value = value;
		    else
		      this.items[idx] = value;
		  }
		  toJSON(_, ctx) {
		    const seq2 = [];
		    if (ctx?.onCreate)
		      ctx.onCreate(seq2);
		    let i = 0;
		    for (const item of this.items)
		      seq2.push(toJS(item, String(i++), ctx));
		    return seq2;
		  }
		  toString(ctx, onComment, onChompKeep) {
		    if (!ctx)
		      return JSON.stringify(this);
		    return stringifyCollection(this, ctx, {
		      blockItemPrefix: "- ",
		      flowChars: { start: "[", end: "]" },
		      itemIndent: (ctx.indent || "") + "  ",
		      onChompKeep,
		      onComment
		    });
		  }
		  static from(schema4, obj, ctx) {
		    const { replacer } = ctx;
		    const seq2 = new this(schema4);
		    if (obj && Symbol.iterator in Object(obj)) {
		      let i = 0;
		      for (let it of obj) {
		        if (typeof replacer === "function") {
		          const key = obj instanceof Set ? it : String(i++);
		          it = replacer.call(obj, key, it);
		        }
		        seq2.items.push(createNode(it, void 0, ctx));
		      }
		    }
		    return seq2;
		  }
		};
		function asItemIndex(key) {
		  let idx = isScalar(key) ? key.value : key;
		  if (idx && typeof idx === "string")
		    idx = Number(idx);
		  return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
		}

		// node_modules/yaml/browser/dist/schema/common/seq.js
		var seq = {
		  collection: "seq",
		  default: true,
		  nodeClass: YAMLSeq,
		  tag: "tag:yaml.org,2002:seq",
		  resolve(seq2, onError) {
		    if (!isSeq(seq2))
		      onError("Expected a sequence for this tag");
		    return seq2;
		  },
		  createNode: (schema4, obj, ctx) => YAMLSeq.from(schema4, obj, ctx)
		};

		// node_modules/yaml/browser/dist/schema/json/schema.js
		function intIdentify(value) {
		  return typeof value === "bigint" || Number.isInteger(value);
		}
		var stringifyJSON = ({ value }) => JSON.stringify(value);
		var jsonScalars = [
		  {
		    identify: (value) => typeof value === "string",
		    default: true,
		    tag: "tag:yaml.org,2002:str",
		    resolve: (str) => str,
		    stringify: stringifyJSON
		  },
		  {
		    identify: (value) => value == null,
		    createNode: () => new Scalar(null),
		    default: true,
		    tag: "tag:yaml.org,2002:null",
		    test: /^null$/,
		    resolve: () => null,
		    stringify: stringifyJSON
		  },
		  {
		    identify: (value) => typeof value === "boolean",
		    default: true,
		    tag: "tag:yaml.org,2002:bool",
		    test: /^true$|^false$/,
		    resolve: (str) => str === "true",
		    stringify: stringifyJSON
		  },
		  {
		    identify: intIdentify,
		    default: true,
		    tag: "tag:yaml.org,2002:int",
		    test: /^-?(?:0|[1-9][0-9]*)$/,
		    resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
		    stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
		  },
		  {
		    identify: (value) => typeof value === "number",
		    default: true,
		    tag: "tag:yaml.org,2002:float",
		    test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
		    resolve: (str) => parseFloat(str),
		    stringify: stringifyJSON
		  }
		];
		var jsonError = {
		  default: true,
		  tag: "",
		  test: /^/,
		  resolve(str, onError) {
		    onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
		    return str;
		  }
		};
		var schema = [map, seq].concat(jsonScalars, jsonError);

		// node_modules/yaml/browser/dist/schema/yaml-1.1/pairs.js
		function createPairs(schema4, iterable, ctx) {
		  const { replacer } = ctx;
		  const pairs2 = new YAMLSeq(schema4);
		  pairs2.tag = "tag:yaml.org,2002:pairs";
		  let i = 0;
		  if (iterable && Symbol.iterator in Object(iterable))
		    for (let it of iterable) {
		      if (typeof replacer === "function")
		        it = replacer.call(iterable, String(i++), it);
		      let key, value;
		      if (Array.isArray(it)) {
		        if (it.length === 2) {
		          key = it[0];
		          value = it[1];
		        } else
		          throw new TypeError(`Expected [key, value] tuple: ${it}`);
		      } else if (it && it instanceof Object) {
		        const keys = Object.keys(it);
		        if (keys.length === 1) {
		          key = keys[0];
		          value = it[key];
		        } else {
		          throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
		        }
		      } else {
		        key = it;
		      }
		      pairs2.items.push(createPair(key, value, ctx));
		    }
		  return pairs2;
		}

		// node_modules/yaml/browser/dist/schema/yaml-1.1/omap.js
		var YAMLOMap = class _YAMLOMap extends YAMLSeq {
		  constructor() {
		    super();
		    this.add = YAMLMap.prototype.add.bind(this);
		    this.delete = YAMLMap.prototype.delete.bind(this);
		    this.get = YAMLMap.prototype.get.bind(this);
		    this.has = YAMLMap.prototype.has.bind(this);
		    this.set = YAMLMap.prototype.set.bind(this);
		    this.tag = _YAMLOMap.tag;
		  }
		  /**
		   * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
		   * but TypeScript won't allow widening the signature of a child method.
		   */
		  toJSON(_, ctx) {
		    if (!ctx)
		      return super.toJSON(_);
		    const map2 = /* @__PURE__ */ new Map();
		    if (ctx?.onCreate)
		      ctx.onCreate(map2);
		    for (const pair of this.items) {
		      let key, value;
		      if (isPair(pair)) {
		        key = toJS(pair.key, "", ctx);
		        value = toJS(pair.value, key, ctx);
		      } else {
		        key = toJS(pair, "", ctx);
		      }
		      if (map2.has(key))
		        throw new Error("Ordered maps must not include duplicate keys");
		      map2.set(key, value);
		    }
		    return map2;
		  }
		  static from(schema4, iterable, ctx) {
		    const pairs2 = createPairs(schema4, iterable, ctx);
		    const omap2 = new this();
		    omap2.items = pairs2.items;
		    return omap2;
		  }
		};
		YAMLOMap.tag = "tag:yaml.org,2002:omap";

		// node_modules/yaml/browser/dist/schema/yaml-1.1/set.js
		var YAMLSet = class _YAMLSet extends YAMLMap {
		  constructor(schema4) {
		    super(schema4);
		    this.tag = _YAMLSet.tag;
		  }
		  add(key) {
		    let pair;
		    if (isPair(key))
		      pair = key;
		    else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
		      pair = new Pair(key.key, null);
		    else
		      pair = new Pair(key, null);
		    const prev = findPair(this.items, pair.key);
		    if (!prev)
		      this.items.push(pair);
		  }
		  /**
		   * If `keepPair` is `true`, returns the Pair matching `key`.
		   * Otherwise, returns the value of that Pair's key.
		   */
		  get(key, keepPair) {
		    const pair = findPair(this.items, key);
		    return !keepPair && isPair(pair) ? isScalar(pair.key) ? pair.key.value : pair.key : pair;
		  }
		  set(key, value) {
		    if (typeof value !== "boolean")
		      throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
		    const prev = findPair(this.items, key);
		    if (prev && !value) {
		      this.items.splice(this.items.indexOf(prev), 1);
		    } else if (!prev && value) {
		      this.items.push(new Pair(key));
		    }
		  }
		  toJSON(_, ctx) {
		    return super.toJSON(_, ctx, Set);
		  }
		  toString(ctx, onComment, onChompKeep) {
		    if (!ctx)
		      return JSON.stringify(this);
		    if (this.hasAllNullValues(true))
		      return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
		    else
		      throw new Error("Set items must all have null values");
		  }
		  static from(schema4, iterable, ctx) {
		    const { replacer } = ctx;
		    const set2 = new this(schema4);
		    if (iterable && Symbol.iterator in Object(iterable))
		      for (let value of iterable) {
		        if (typeof replacer === "function")
		          value = replacer.call(iterable, value, value);
		        set2.items.push(createPair(value, null, ctx));
		      }
		    return set2;
		  }
		};
		YAMLSet.tag = "tag:yaml.org,2002:set";

		// node_modules/yaml/browser/dist/schema/yaml-1.1/timestamp.js
		function parseSexagesimal(str, asBigInt) {
		  const sign = str[0];
		  const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
		  const num = (n) => asBigInt ? BigInt(n) : Number(n);
		  const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
		  return sign === "-" ? num(-1) * res : res;
		}
		var timestamp = {
		  identify: (value) => value instanceof Date,
		  default: true,
		  tag: "tag:yaml.org,2002:timestamp",
		  // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
		  // may be omitted altogether, resulting in a date format. In such a case, the time part is
		  // assumed to be 00:00:00Z (start of day, UTC).
		  test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
		  resolve(str) {
		    const match = str.match(timestamp.test);
		    if (!match)
		      throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
		    const [, year, month, day, hour, minute, second] = match.map(Number);
		    const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
		    let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
		    const tz = match[8];
		    if (tz && tz !== "Z") {
		      let d = parseSexagesimal(tz, false);
		      if (Math.abs(d) < 30)
		        d *= 60;
		      date -= 6e4 * d;
		    }
		    return new Date(date);
		  },
		  stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
		};

		// node_modules/yaml/browser/dist/parse/cst-visit.js
		var BREAK2 = Symbol("break visit");
		var SKIP2 = Symbol("skip children");
		var REMOVE2 = Symbol("remove item");
		function visit2(cst, visitor) {
		  if ("type" in cst && cst.type === "document")
		    cst = { start: cst.start, value: cst.value };
		  _visit(Object.freeze([]), cst, visitor);
		}
		visit2.BREAK = BREAK2;
		visit2.SKIP = SKIP2;
		visit2.REMOVE = REMOVE2;
		visit2.itemAtPath = (cst, path) => {
		  let item = cst;
		  for (const [field, index] of path) {
		    const tok = item?.[field];
		    if (tok && "items" in tok) {
		      item = tok.items[index];
		    } else
		      return void 0;
		  }
		  return item;
		};
		visit2.parentCollection = (cst, path) => {
		  const parent = visit2.itemAtPath(cst, path.slice(0, -1));
		  const field = path[path.length - 1][0];
		  const coll = parent?.[field];
		  if (coll && "items" in coll)
		    return coll;
		  throw new Error("Parent collection not found");
		};
		function _visit(path, item, visitor) {
		  let ctrl = visitor(item, path);
		  if (typeof ctrl === "symbol")
		    return ctrl;
		  for (const field of ["key", "value"]) {
		    const token = item[field];
		    if (token && "items" in token) {
		      for (let i = 0; i < token.items.length; ++i) {
		        const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
		        if (typeof ci === "number")
		          i = ci - 1;
		        else if (ci === BREAK2)
		          return BREAK2;
		        else if (ci === REMOVE2) {
		          token.items.splice(i, 1);
		          i -= 1;
		        }
		      }
		      if (typeof ctrl === "function" && field === "key")
		        ctrl = ctrl(item, path);
		    }
		  }
		  return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
		}

		// node_modules/yaml/browser/dist/parse/lexer.js
		var hexDigits = new Set("0123456789ABCDEFabcdef");
		var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
		var flowIndicatorChars = new Set(",[]{}");
		var invalidAnchorChars = new Set(" ,[]{}\n\r	");

		// src/rules.ts
		var KNOWN_RULES = Object.freeze([
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
		  "R12-stage-stalled",
		  "R13-scenario-no-evidence",
		  "R14-scenario-awaiting-customer",
		  "R15-criteria-unverified",
		  "R16-scenario-not-started"
		]);
		var FALLBACK_THRESHOLDS = Object.freeze({
		  largeAmountWan: 300,
		  criteria: { min: 2, max: 3 },
		  scenarios: { min: 3, max: 5 },
		  risks: { max: 3 },
		  stallDays: 45
		});
		var FALLBACK_PRIORITY = Object.freeze({
		  strategicWan: 1e3,
		  highWan: 300,
		  strategicPocTypes: ["\u5927\u4F53\u91CF\u9879\u76EE"]
		});
		var FALLBACK_RULE_META = Object.freeze({
		  R1: { id: "R1", name: "G0 \u4E94\u5FC5\u586B\u7F3A\u5931", level: "high", priority: 90, guard: null },
		  R2: { id: "R2", name: "\u5927\u91D1\u989D\u672A\u8FC7 G0", level: "high", priority: 94, guard: null },
		  R3: { id: "R3", name: "G0 \u901A\u8FC7\u65E0\u8BA1\u5212", level: "high", priority: 92, guard: null },
		  R4: { id: "R4", name: "\u6210\u529F\u6807\u51C6\u4E0D\u805A\u7126", level: "medium", priority: 50, guard: null },
		  R5: { id: "R5", name: "\u573A\u666F\u4E0D\u805A\u7126", level: "medium", priority: 48, guard: null },
		  R6: { id: "R6", name: "\u98CE\u9669\u8D85\u9650", level: "medium", priority: 46, guard: null },
		  R7: { id: "R7", name: "G2 \u672A\u5C31\u7EEA\u5DF2\u5F00\u6D4B", level: "high", priority: 84, guard: null },
		  R8: { id: "R8", name: "\u8FDB\u5C55\u65E0\u8BC1\u636E", level: "high", priority: 82, guard: null },
		  R9: { id: "R9", name: "\u6709\u8BC1\u636E\u65E0\u8BA4\u53EF", level: "high", priority: 80, guard: null },
		  R10: { id: "R10", name: "G3-1 \u65E0 G3-2", level: "high", priority: 78, guard: null },
		  R11: { id: "R11", name: "\u8FBE\u6210\u65E0\u4E0B\u4E00\u6B65", level: "high", priority: 96, guard: null },
		  R12: { id: "R12", name: "\u9636\u6BB5\u505C\u6EDE", level: "medium", priority: 40, guard: null },
		  R13: { id: "R13", name: "\u573A\u666F\u65E0\u8BC1\u636E", level: "high", priority: 88, guard: "requires-progress" },
		  R14: { id: "R14", name: "\u573A\u666F\u5F85\u5BA2\u6237\u786E\u8BA4", level: "info", priority: 30, guard: null },
		  R15: { id: "R15", name: "\u6307\u6807\u672A\u9A8C\u8BC1", level: "medium", priority: 44, guard: "criteria-count-in-range" },
		  R16: { id: "R16", name: "\u573A\u666F\u672A\u5F00\u59CB", level: "medium", priority: 42, guard: "scenarios-count-in-range-and-progress" }
		});

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
		  "R12-stage-stalled": { no: 12, level: "medium", priority: 40 },
		  // R13–R16: the plan is the right shape but the work has not moved. A scenario
		  // with no evidence behind it is the state-level twin of R8, per item instead
		  // of per entry.
		  "R13-scenario-no-evidence": { no: 13, level: "high", priority: 88 },
		  "R14-scenario-awaiting-customer": { no: 14, level: "info", priority: 30 },
		  "R15-criteria-unverified": { no: 15, level: "medium", priority: 44 },
		  "R16-scenario-not-started": { no: 16, level: "medium", priority: 42 }
		};

		// src/client/blockers.tsx
		var import_jsx_runtime2 = require("react/jsx-runtime");
		var SOURCE_TEXT = {
		  gap: "blockerSourceGap",
		  stalled: "blockerSourceStalled",
		  "missing-amount": "blockerSourceMissingAmount",
		  "no-progress": "blockerSourceNoProgress",
		  "no-stage-since": "blockerSourceNoStageSince"
		};
		var SOURCE_ORDER = [
		  "gap",
		  "stalled",
		  "no-progress",
		  "missing-amount",
		  "no-stage-since"
		];
		function sourceCopy(row, t) {
		  switch (row.source) {
		    case "stalled":
		      return format(t("blockerStalledCopy"), {
		        days: String(row.params.days ?? ""),
		        stallDays: String(row.params.stallDays ?? "")
		      });
		    case "missing-amount":
		      return t("blockerMissingAmountCopy");
		    case "no-progress":
		      return t("blockerNoProgressCopy");
		    case "no-stage-since":
		      return t("blockerNoStageSinceCopy");
		    case "gap":
		      return "";
		  }
		}
		function rowLabel(row, t) {
		  if (row.source !== "gap" || row.rule === null) return t(SOURCE_TEXT[row.source]);
		  const meta = RULE_META[row.rule];
		  return `R${meta.no} ${format(t(`gap.${row.rule}.title`), { ...row.params })}`;
		}
		function levelRank(level) {
		  if (level === "high") return 3;
		  if (level === "medium") return 2;
		  return 1;
		}
		function groupByProject(rows) {
		  const groups = /* @__PURE__ */ new Map();
		  for (const row of rows) {
		    const existing = groups.get(row.pocId);
		    if (existing === void 0) {
		      groups.set(row.pocId, {
		        pocId: row.pocId,
		        pocName: row.pocName,
		        stageLabel: row.stageLabel,
		        rows: [row],
		        level: row.level
		      });
		      continue;
		    }
		    existing.rows.push(row);
		    if (levelRank(row.level) > levelRank(existing.level)) existing.level = row.level;
		  }
		  return [...groups.values()];
		}
		function BlockerPanel({ board, visibleIds, t, onOpen }) {
		  const [source, setSource] = (0, import_react.useState)(null);
		  const scoped = (0, import_react.useMemo)(
		    () => visibleIds === null ? board.rows : board.rows.filter((row) => visibleIds.has(row.pocId)),
		    [board.rows, visibleIds]
		  );
		  const counts = (0, import_react.useMemo)(() => {
		    const next = { gap: 0, stalled: 0, "missing-amount": 0, "no-progress": 0, "no-stage-since": 0 };
		    for (const row of scoped) next[row.source] += 1;
		    return next;
		  }, [scoped]);
		  const shown = source === null ? scoped : scoped.filter((row) => row.source === source);
		  const groups = (0, import_react.useMemo)(() => groupByProject(shown), [shown]);
		  const chipEntries = SOURCE_ORDER.filter((key) => counts[key] > 0 || source === key);
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "blockers", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "blocker-chips", role: "group", "aria-label": t("blockerTitle"), children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
		        "button",
		        {
		          type: "button",
		          className: "blocker-chip",
		          "data-active": source === null,
		          onClick: () => setSource(null),
		          title: t("blockerLegendHint"),
		          children: [
		            t("blockerAll"),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "blocker-chip-count", children: scoped.length })
		          ]
		        }
		      ),
		      chipEntries.map((key) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
		        "button",
		        {
		          type: "button",
		          className: "blocker-chip",
		          "data-active": source === key,
		          "data-source": key,
		          onClick: () => setSource(source === key ? null : key),
		          title: t("blockerLegendHint"),
		          children: [
		            t(SOURCE_TEXT[key]),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "blocker-chip-count", children: counts[key] })
		          ]
		        },
		        key
		      ))
		    ] }),
		    groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "blocker-empty", children: t("blockerEmptyFiltered") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "blocker-list", children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "blocker-group", "data-level": group.level, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "blocker-group-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "blocker-project", onClick: () => onOpen(group.pocId), children: [
		          group.pocName === "" ? group.pocId : group.pocName,
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "blocker-project-id", children: group.pocId })
		        ] }),
		        group.stageLabel === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "blocker-stage", children: group.stageLabel }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "blocker-group-count", children: group.rows.length })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "blocker-rows", children: group.rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: "blocker-row", "data-source": row.source, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "blocker-row-headline", children: rowLabel(row, t) }),
		        row.source === "gap" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "blocker-row-copy", children: sourceCopy(row, t) })
		      ] }, `${row.source}:${row.rule ?? index}`)) })
		    ] }, group.pocId)) })
		  ] });
		}
		var G0_WORK_LABEL = {
		  why_customer: "whyCustomerTest",
		  why_us: "whyWeTest",
		  decision_chain: "decisionChain",
		  post_poc_decision: "postPocDecision",
		  tech_owner: "customerTechOwner"
		};
		function Worklist({ detail, rows, t }) {
		  const items = (0, import_react.useMemo)(() => {
		    const next = [];
		    const missing = detail.gate0.checklist.filter((item) => !item.present);
		    for (const [index, item] of missing.entries()) {
		      const label = t(G0_WORK_LABEL[item.field] ?? item.field);
		      next.push({
		        key: `g0:${item.field}`,
		        label: format(t("worklistG0Field"), { field: label }),
		        // The count is a fact about the group, not about this row: repeating it
		        // on all five lines turned the most actionable block on the page into a
		        // wall of identical sentences. It is said once, on the first row.
		        copy: index === 0 ? t("worklistG0Intro", { count: String(missing.length) }) : "",
		        action: index === 0 ? t("worklistG0Hint") : ""
		      });
		    }
		    const has = (source) => (rows ?? []).some((row) => row.source === source);
		    if (has("missing-amount")) {
		      next.push({
		        key: "amount",
		        label: t("worklistMissingAmountAction"),
		        copy: t("worklistMissingAmountIntro"),
		        action: ""
		      });
		    }
		    if (has("no-stage-since")) {
		      next.push({
		        key: "stage-since",
		        label: t("worklistMissingStageSinceAction"),
		        copy: t("worklistMissingStageSinceIntro"),
		        action: ""
		      });
		    }
		    if (has("no-progress")) {
		      next.push({
		        key: "progress",
		        label: t("worklistNoProgressAction"),
		        copy: t("worklistNoProgressIntro"),
		        action: ""
		      });
		    }
		    if (detail.plan.criteria.length === 0) {
		      next.push({
		        key: "plan",
		        label: t("worklistNoPlanAction"),
		        copy: t("worklistNoPlanIntro"),
		        action: ""
		      });
		    }
		    if (detail.outcome.overall === "" && detail.outcome.achievement === "") {
		      next.push({
		        key: "outcome",
		        label: t("worklistNoOutcomeAction"),
		        copy: t("worklistNoOutcomeIntro"),
		        action: ""
		      });
		    }
		    return next;
		  }, [detail, rows, t]);
		  if (items.length === 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "worklist", "data-empty": "true", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "worklist-done", children: t("worklistDone") }) });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "worklist", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "worklist-items", children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: "worklist-item", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "worklist-mark", "aria-hidden": "true", children: "\u25A1" }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "worklist-text", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "worklist-label", children: item.label }),
		      item.copy === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "worklist-copy", children: item.copy }),
		      item.action === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "worklist-action", children: item.action })
		    ] })
		  ] }, item.key)) }) });
		}

		// src/client/detail.tsx
		var import_jsx_runtime3 = require("react/jsx-runtime");
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
		function priorityLabelKey(priority) {
		  if (priority === "strategic") return "priorityStrategic";
		  if (priority === "high") return "priorityHigh";
		  if (priority === "normal") return "priorityNormal";
		  return "priorityUnknown";
		}
		function scenarioNameOf(detail, id) {
		  const found = detail.plan.scenarios.find((item) => item.id === id);
		  return found === void 0 ? "" : found.name;
		}
		function scenarioTone(status) {
		  if (status === "\u5DF2\u8BC1\u660E") return "green";
		  if (status === "\u5F85\u5BA2\u6237\u786E\u8BA4") return "amber";
		  if (status === "\u65E0\u8BC1\u636E") return "red";
		  return "slate";
		}
		function scenarioGlyph(status) {
		  if (status === "\u5DF2\u8BC1\u660E") return "\u25CF";
		  if (status === "\u5F85\u5BA2\u6237\u786E\u8BA4") return "\u25D0";
		  if (status === "\u65E0\u8BC1\u636E") return "\u25CB";
		  return "\u2014";
		}
		function criterionTone(status) {
		  if (status === "\u5DF2\u8FBE\u6210") return "green";
		  if (status === "\u90E8\u5206\u8FBE\u6210") return "amber";
		  if (status === "\u672A\u8FBE\u6210") return "red";
		  return "slate";
		}
		var SCENARIO_STATUS_KEY = {
		  \u5DF2\u8BC1\u660E: "Proven",
		  \u5F85\u5BA2\u6237\u786E\u8BA4: "Awaiting",
		  \u65E0\u8BC1\u636E: "NoEvidence",
		  \u672A\u5F00\u59CB: "NotStarted"
		};
		var CRITERION_STATUS_KEY = {
		  \u5DF2\u8FBE\u6210: "Proven",
		  \u90E8\u5206\u8FBE\u6210: "Partial",
		  \u672A\u8FBE\u6210: "Failed",
		  \u672A\u9A8C\u8BC1: "Unverified"
		};
		function completionRatio(value) {
		  const match = value.match(/^(\d+(?:\.\d+)?)\s*%/u);
		  if (match === null) return null;
		  const parsed = Number(match[1]);
		  if (!Number.isFinite(parsed)) return null;
		  return Math.min(1, Math.max(0, parsed / 100));
		}
		var SKELETON_FOR = {
		  G0: { sections: ["basic", "gate0", "plan"], title: "dtStageG0Title", copy: "dtStageG0Copy", next: "dtStageG0Next" },
		  G1: { sections: ["basic", "plan", "progress"], title: "dtStageG1Title", copy: "dtStageG1Copy", next: "dtStageG1Next" },
		  G2: { sections: ["basic", "plan", "progress"], title: "dtStageG2Title", copy: "dtStageG2Copy", next: "dtStageG2Next" },
		  G3: { sections: ["progress", "dimensions", "basic"], title: "dtStageG3Title", copy: "dtStageG3Copy", next: "dtStageG3Next" },
		  G4: { sections: ["dimensions", "outcome", "basic"], title: "dtStageG4Title", copy: "dtStageG4Copy", next: "dtStageG4Next" },
		  closed: { sections: ["outcome", "dimensions", "basic"], title: "dtStageClosedTitle", copy: "dtStageClosedCopy", next: "dtStageG4Next" },
		  unknown: {
		    sections: ["basic", "progress", "dimensions", "gate0", "plan", "outcome"],
		    title: "dtStageUnknownTitle",
		    copy: "dtStageUnknownCopy",
		    next: "dtStageUnknownCopy"
		  }
		};
		function stageStateOf(detail) {
		  const stage = detail.summary.stage;
		  if (detail.summary.closed) return { done: true, pending: false };
		  if (stage === null) return { done: false, pending: true };
		  const index = STAGES.indexOf(stage);
		  if (index === -1) return { done: false, pending: true };
		  const done = detail.summary.stageDone[index] === true;
		  return { done, pending: !done };
		}
		function StageContext({ stage, done, pending, t }) {
		  const key = stage ?? "unknown";
		  const skeleton = SKELETON_FOR[key] ?? SKELETON_FOR.unknown;
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "dt-stage-context", "data-done": done, "aria-label": t("dtStageSkeleton"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-stage-context-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "dt-stage-context-title", children: t(skeleton.title) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-stage-context-kicker", children: t("dtStageSkeleton") })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dt-stage-context-copy", children: t(skeleton.copy) }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dt-stage-context-next", children: t(skeleton.next) }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-stage-context-state", children: pending ? t("dtStagePending") : t("dtStageDone") })
		  ] });
		}
		function Section({ title, kicker, children }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "dsec", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "dsec-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "dsec-title", children: title }),
		      kicker === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsec-kicker", children: kicker })
		    ] }),
		    children
		  ] });
		}
		function Blank({ text }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsec-blank", children: text });
		}
		function Prose({ label, value, t }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-prose", "data-empty": value === "", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-prose-label", children: label }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dt-prose-body prose", children: value === "" ? t("emptyField") : value })
		  ] });
		}
		function RailMeta({ label, value, t }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-rail-meta-row", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-rail-meta-label", children: label }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-rail-meta-value", "data-empty": value === "", children: value === "" ? t("dtUnset") : value })
		  ] });
		}
		function StageTrackVertical({ detail, t }) {
		  const currentIndex = detail.summary.stage === null ? -1 : STAGES.indexOf(detail.summary.stage);
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ol", { className: "dt-stages", "aria-label": t("stageTrack"), children: STAGES.map((stage, index) => {
		    const done = detail.summary.closed ? true : detail.summary.stageDone[index] === true;
		    const current = !detail.summary.closed && index === currentIndex;
		    const state = done ? t("stageDone") : current ? t("stageCurrent") : t("stagePending");
		    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: "dt-stage", "data-done": done, "data-current": current, "aria-current": current ? "step" : void 0, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-stage-marker", "aria-hidden": "true", children: done ? "\u2713" : current ? "\u25C9" : index + 1 }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dt-stage-text", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-stage-label", children: t(`stage${stage}`) }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-stage-state", children: state })
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
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: "dt-rail", "aria-label": t("dtRailTitle"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-rail-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "btn btn-small dt-rail-back", onClick: onBack, children: t("back") }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h1", { className: "dt-rail-title", children: summary.name }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-rail-id mono", children: summary.pocId }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-rail-pills", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "status-pill tone-blue", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		          summary.closed ? t("stageClosed") : summary.stageLabel === "" ? t("stageUnknown") : summary.stageLabel
		        ] }),
		        summary.status === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-pill tone-slate", children: summary.status }),
		        summary.priority === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `status-pill tone-${summary.priority === "strategic" ? "amber" : summary.priority === "high" ? "amber" : "slate"}`, children: t(priorityLabelKey(summary.priority)) })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-rail-amount", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-rail-amount-label", children: t("dtAmountLabel") }),
		      summary.amountWan === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-rail-amount-value", "data-empty": "true", children: t("dtUnset") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dt-rail-amount-value", children: [
		        formatWan(summary.amountWan),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-rail-amount-unit", children: t("statAmountUnit") })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-rail-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "dt-rail-block-title", children: t("dtStageSection") }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(StageTrackVertical, { detail, t })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-rail-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "dt-rail-block-title", children: t("dtDimensionSection") }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dt-rail-dims", children: DIMENSIONS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dim-mini", "data-present": present[key], "data-origin": DIMENSION_ORIGIN[key], title: `${t(DIMENSION_TEXT[key])}: ${present[key] ? resolved[key] : t("dimMissing")}`, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dim-mini-mark", "aria-hidden": "true", children: present[key] ? "\u2713" : "\u2717" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dim-mini-label", children: t(DIMENSION_TEXT[key]) })
		      ] }, key)) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-rail-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "dt-rail-block-title", children: t("dtGapSection") }),
		      gaps.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dt-rail-empty", children: t("dtNoGaps") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { className: "dt-rail-gaps", children: gaps.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: "dt-rail-gap", "data-level": item.level, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dt-rail-gap-no", children: [
		          "R",
		          item.ruleNo
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-rail-gap-title", children: format(t(`gap.${item.rule}.title`), { ...item.params ?? {} }) })
		      ] }, item.rule)) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-rail-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "dt-rail-block-title", children: t("sectionIdentity") }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-rail-meta", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RailMeta, { label: t("dtCustomerCompany"), value: orgText(detail.org.company), t }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RailMeta, { label: t("dtCustomerSystem"), value: orgText(detail.org.system), t }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RailMeta, { label: t("dtOwnerLabel"), value: summary.owner, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RailMeta, { label: t("dtTechOwnerLabel"), value: summary.techOwner, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RailMeta, { label: t("dtSalesLabel"), value: detail.sales, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RailMeta, { label: t("dtSponsorLabel"), value: detail.execSponsor, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RailMeta, { label: t("type"), value: summary.pocType, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RailMeta, { label: t("dtStageSinceLabel"), value: summary.stageSince === null ? "" : `${formatDate(summary.stageSince, locale)}${summary.daysInStage === null ? "" : ` \xB7 ${format(t("daysInStage"), { days: summary.daysInStage })}`}`, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RailMeta, { label: t("dtPriorityLabel"), value: summary.priority === "" ? "" : t(priorityLabelKey(summary.priority)), t })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-rail-nav", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "btn btn-small", disabled: onPrev === null, onClick: onPrev ?? void 0, children: [
		        "\u2190 ",
		        t("dtPrevProject")
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-rail-position", children: format(t("dtPosition"), { index: position.index, total: position.total }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "btn btn-small", disabled: onNext === null, onClick: onNext ?? void 0, children: [
		        t("dtNextProject"),
		        " \u2192"
		      ] })
		    ] })
		  ] });
		}
		function ProgressItem({ entry, index, t, locale, detail }) {
		  const tone = recognitionTone(entry.customer.recognition);
		  const ratio = completionRatio(entry.completion);
		  const hasNext = entry.next.goal !== "" || entry.next.owner !== "" || entry.next.deadline !== "";
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: "prog-item", "data-tone": tone, "data-latest": index === 0, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "prog-gutter", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-node", "data-tone": tone }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("article", { className: "prog-card", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "prog-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("time", { className: "prog-date", dateTime: entry.date, children: formatDate(entry.date, locale) || "\u2014" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-type", children: entry.type === "" ? t("progressTypeUnset") : entry.type }),
		        entry.seq === null ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-seq", children: format(t("dtProgressSeq"), { seq: entry.seq }) }),
		        ratio === null ? entry.completion === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "prog-chip", children: [
		          t("dtProgressCompletion"),
		          " ",
		          entry.completion
		        ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "prog-meter", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-meter-label", children: t("dtProgressCompletion") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(InlineMeter, { value: ratio, max: 1, tone: ratio >= 1 ? "green" : "blue" }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-meter-value", children: entry.completion })
		        ] })
		      ] }),
		      entry.goal === "" && entry.actual === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "prog-pair", children: [
		        entry.goal === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "prog-goal", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-pair-label", children: t("dtProgressGoal") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-pair-value", children: entry.goal })
		        ] }),
		        entry.actual === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "prog-actual", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-pair-label", children: t("dtProgressActual") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-pair-value", children: entry.actual })
		        ] })
		      ] }),
		      entry.scenarioIds.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "prog-scope", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-scope-label", children: t("dtProgressScope") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "chip-row", children: entry.scenarioIds.map((id, itemIndex) => {
		          const linked = scenarioNameOf(detail, id);
		          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chip", children: linked === "" ? id : linked }, `${id}:${itemIndex}`);
		        }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "prog-evidence", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-block-label", children: t("dtProgressEvidence") }),
		        entry.evidence.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-missing", children: t("dtProgressEvidenceNone") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "chip-row", children: entry.evidence.map((item, itemIndex) => {
		          const label = `${item.type === "" ? "" : `${item.type} \xB7 `}${item.title === "" ? t("emptyField") : item.title}`;
		          return item.link === "" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chip", children: label }, `${item.title}:${itemIndex}`) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("a", { className: "chip prog-evidence-link", href: item.link, target: "_blank", rel: "noreferrer", title: item.link, children: [
		            label,
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-external", "aria-hidden": "true", children: "\u2197" })
		          ] }, `${item.title}:${itemIndex}`);
		        }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "prog-customer", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-block-label", children: t("dtProgressCustomer") }),
		        entry.customer.syncedWith === "" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-missing", children: t("dtProgressCustomerNone") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chip", children: entry.customer.syncedWith }),
		        entry.customer.recognition === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: `status-pill tone-${tone}`, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		          entry.customer.recognition
		        ] }),
		        entry.gate3_1 === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "chip", children: [
		          t("gate3_1Label"),
		          "\uFF1A",
		          entry.gate3_1
		        ] }),
		        entry.gate3_2 === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "chip", children: [
		          t("gate3_2Label"),
		          "\uFF1A",
		          entry.gate3_2
		        ] })
		      ] }),
		      entry.customer.feedback === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "prog-feedback", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-block-label", children: t("dtProgressFeedback") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-feedback-copy prose", children: entry.customer.feedback })
		      ] }),
		      hasNext ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "prog-next", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-next-label", children: t("dtProgressNext") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "prog-next-body", children: [
		          entry.next.goal === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-next-goal", children: entry.next.goal }),
		          entry.next.owner === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "chip", children: [
		            "@ ",
		            entry.next.owner
		          ] }),
		          entry.next.deadline === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "chip", children: [
		            t("dtProgressDeadline"),
		            " ",
		            formatDate(entry.next.deadline, locale)
		          ] })
		        ] })
		      ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "prog-next prog-next-empty", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prog-missing", children: t("dtProgressNextNone") }) })
		    ] })
		  ] });
		}
		function ProgressStream({ detail, t, locale }) {
		  const ordered = [...detail.progress].sort((left, right) => {
		    if (left.date !== right.date) return right.date.localeCompare(left.date);
		    return (right.seq ?? 0) - (left.seq ?? 0);
		  });
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { title: t("dtProgressTitle"), kicker: format(t("dtProgressCount"), { count: ordered.length }), children: ordered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsec-empty", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "dsec-empty-title", children: t("dtProgressEmptyTitle") }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dsec-empty-copy", children: t("dtProgressEmptyCopy") })
		  ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ol", { className: "prog-stream", children: ordered.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ProgressItem, { entry, index, t, locale, detail }, `${entry.date}:${entry.seq ?? index}`)) }) });
		}
		function DimensionGrid({ detail, t }) {
		  const values = {
		    achievement: detail.outcome.achievement,
		    evidence: detail.outcome.ourProof,
		    recognition: detail.outcome.customerRecognition,
		    nextMilestone: detail.outcome.milestone
		  };
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { title: t("dtDimensionSection"), kicker: format(t("dimensionCount"), { count: detail.summary.dimensionCount }), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dim-grid-detail", children: DIMENSIONS.map((key) => {
		    const present = values[key] !== "";
		    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dim-card", "data-present": present, "data-origin": DIMENSION_ORIGIN[key], children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dim-card-label", children: t(DIMENSION_TEXT[key]) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dim-card-mark", "aria-hidden": "true", children: present ? "\u2713" : "\u2717" }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dim-card-value", children: present ? values[key] : t("dimMissing") }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dim-card-origin", children: DIMENSION_ORIGIN[key] === "auto" ? t("dtDimensionAuto") : t("dtDimensionManual") }),
		      present ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dim-card-reason", children: t("dtDimensionEmptyReason") })
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
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Section, { title: t("dtG0Title"), kicker: format(t("dtG0FiveRequired"), { present: presentCount }), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "g0-meter", role: "group", "aria-label": t("dtG0Title"), children: checklist.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "g0-cell", "data-present": item.present, title: `${t(G0_LABEL[item.field] ?? item.field)}: ${item.present ? t("dtG0Present") : t("dtG0Missing")}`, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "g0-cell-mark", "aria-hidden": "true", children: item.present ? "\u2713" : "\u2717" }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "g0-cell-label", children: t(G0_LABEL[item.field] ?? item.field) })
		    ] }, item.field)) }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "g0-fields", children: checklist.map((item) => {
		      const label = t(G0_LABEL[item.field] ?? item.field);
		      const prose = G0_PROSE.has(item.field);
		      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "g0-field", "data-present": item.present, "data-prose": prose, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "g0-field-label", children: label }),
		        item.present ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "g0-field-value prose", children: item.value }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "g0-field-missing", children: t("dtG0Missing") })
		      ] }, item.field);
		    }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "g0-foot", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "g0-review", "data-empty": detail.gate0.conclusion === "", children: review }),
		      detail.gate0.competitor === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "chip", children: [
		        t("competitor"),
		        "\uFF1A",
		        detail.gate0.competitor
		      ] })
		    ] })
		  ] });
		}
		function orgText(value) {
		  return value === null || value === void 0 ? "" : value;
		}
		function BasicInfo({ detail, t }) {
		  const summary = detail.summary;
		  const rows = [
		    { key: "company", label: t("dtCustomerCompany"), value: orgText(detail.org.company) },
		    { key: "system", label: t("dtCustomerSystem"), value: orgText(detail.org.system) },
		    { key: "department", label: t("dtCustomerDepartment"), value: orgText(detail.org.department) },
		    { key: "owner", label: t("dtOwnerLabel"), value: summary.owner },
		    { key: "tech", label: t("dtCustomerTech"), value: summary.techOwner },
		    { key: "sales", label: t("dtSalesLabel"), value: detail.sales },
		    { key: "sponsor", label: t("dtCustomerSponsor"), value: detail.execSponsor },
		    { key: "amount", label: t("dtAmountLabel"), value: summary.amountWan === 0 ? "" : `${formatWan(summary.amountWan)} ${t("statAmountUnit")}` }
		  ];
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Section, { title: t("dtBasicTitle"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dl", { className: "dt-basic-grid", children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-basic-row", "data-empty": row.value === "", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { className: "dt-basic-label", children: row.label }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { className: "dt-basic-value", children: row.value === "" ? t("dtUnset") : row.value })
		    ] }, row.key)) }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-basic-decisions", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		        Prose,
		        {
		          label: t("dtBasicDecisionChain"),
		          value: detail.gate0.decisionChain === "" ? t("dtBasicDecisionChainNone") : detail.gate0.decisionChain,
		          t
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
		        Prose,
		        {
		          label: t("dtBasicPostPoc"),
		          value: detail.gate0.postPocDecision === "" ? t("dtBasicPostPocNone") : detail.gate0.postPocDecision,
		          t
		        }
		      )
		    ] })
		  ] });
		}
		function ScenarioDetail({ detail, scenarioId, t }) {
		  const scenario = detail.plan.scenarios.find((item) => item.id === scenarioId);
		  if (scenario === void 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { title: t("dtScenarioTitle"), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Blank, { text: t("dtScenarioNotFound") }) });
		  }
		  const tone = scenarioTone(scenario.status);
		  const entries = detail.progress.filter((entry) => entry.scenarioIds.includes(scenarioId)).slice().sort((left, right) => right.date === left.date ? (right.seq ?? 0) - (left.seq ?? 0) : right.date.localeCompare(left.date));
		  const evidence = entries.flatMap((entry) => entry.evidence.map((item) => ({ ...item, date: entry.date })));
		  const latestWithCustomer = entries.find((entry) => entry.customer.syncedWith !== "" || entry.customer.feedback !== "" || entry.customer.recognition !== "");
		  const latest = entries[0];
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Section, { title: t("dtScenarioTitle"), kicker: scenario.name, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "sd-head", "data-tone": tone, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sd-head-no", children: scenario.id }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sd-head-name", children: scenario.name === "" ? t("emptyField") : scenario.name }),
		      scenario.status === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: `status-pill tone-${tone}`, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		        t(`dtStatus${SCENARIO_STATUS_KEY[scenario.status] ?? "NoEvidence"}`)
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-prose", "data-empty": scenario.goal === "", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-prose-label", children: t("dtScenarioGoal") }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dt-prose-body prose", children: scenario.goal === "" ? t("emptyField") : scenario.goal })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "plan-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "plan-block-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "plan-block-title", children: t("dtScenarioEvidence") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-block-note", children: format(t("dtPlanScenarioEvidence"), { count: evidence.length }) })
		      ] }),
		      evidence.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Blank, { text: t("dtScenarioEvidenceNone") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { className: "sd-evidence", children: evidence.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: "sd-evidence-row", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sd-evidence-type", children: item.type === "" ? t("dtUnset") : item.type }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sd-evidence-title", children: item.title === "" ? t("emptyField") : item.title }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sd-evidence-date", children: item.date }),
		        item.link === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("a", { className: "sd-evidence-link", href: item.link, target: "_blank", rel: "noreferrer noopener", children: t("dtPlanScenarioDetail") })
		      ] }, `${item.title}:${index}`)) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "plan-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("header", { className: "plan-block-head", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "plan-block-title", children: t("dtScenarioCustomer") }) }),
		      latestWithCustomer === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Blank, { text: t("dtScenarioFeedbackEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "sd-customer", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "sd-customer-sync", children: [
		          t("dtScenarioSyncedWith"),
		          "\uFF1A",
		          latestWithCustomer.customer.syncedWith === "" ? t("dtUnset") : latestWithCustomer.customer.syncedWith,
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sd-customer-date", children: latestWithCustomer.date })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "sd-customer-feedback prose", children: latestWithCustomer.customer.feedback === "" ? t("dtUnset") : latestWithCustomer.customer.feedback }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: `status-pill tone-${recognitionTone(latestWithCustomer.customer.recognition)}`, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		          latestWithCustomer.customer.recognition === "" ? t("dtUnset") : latestWithCustomer.customer.recognition
		        ] })
		      ] })
		    ] }),
		    latest === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "plan-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("header", { className: "plan-block-head", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "plan-block-title", children: t("dtScenarioGate3") }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "sd-gate3", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: `status-pill tone-${latest.gate3_1 === "\u53EF\u8BC1\u660E" ? "green" : "amber"}`, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		          "G3-1 ",
		          latest.gate3_1 === "" ? t("dtUnset") : latest.gate3_1
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: `status-pill tone-${latest.gate3_2 === "\u5DF2\u786E\u8BA4" ? "green" : "amber"}`, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		          "G3-2 ",
		          latest.gate3_2 === "" ? t("dtUnset") : latest.gate3_2
		        ] }),
		        latest.gate3_1 === "\u53EF\u8BC1\u660E" && latest.gate3_2 !== "\u5DF2\u786E\u8BA4" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sd-gate3-note", children: "R10" }) : null
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "plan-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "plan-block-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "plan-block-title", children: t("dtScenarioLinked") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-block-note", children: format(t("dtProgressCountLabel"), { count: entries.length }) })
		      ] }),
		      entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Blank, { text: t("dtScenarioLinkedNone") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { className: "sd-linked", children: entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: "sd-linked-row", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sd-linked-date", children: entry.date }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "sd-linked-seq", children: [
		          "#",
		          entry.seq ?? "\u2014"
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sd-linked-change", children: entry.change === "" ? t("dtUnset") : entry.change }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sd-linked-actual", children: entry.actual === "" ? t("emptyField") : entry.actual })
		      ] }, entry.seq ?? entry.date)) })
		    ] })
		  ] });
		}
		function PlanPanels({ detail, t, onOpenScenario }) {
		  const plan = detail.plan;
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Section, { title: t("dtPlanTitle"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "plan-meta", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Prose, { label: t("dtPlanPain"), value: plan.customerPain, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Prose, { label: t("dtPlanRecognition"), value: plan.expectedRecognition, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Prose, { label: t("dtPlanEdge"), value: plan.ourEdge, t })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "plan-strip", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "plan-strip-item", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-strip-label", children: t("dtPlanWindow") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-strip-value", children: plan.timelineStart === "" && plan.timelineEnd === "" ? t("dtUnset") : `${plan.timelineStart === "" ? "\u2014" : plan.timelineStart} \u2192 ${plan.timelineEnd === "" ? "\u2014" : plan.timelineEnd}` })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "plan-strip-item", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-strip-label", children: t("dtPlanGate1") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: `status-pill tone-${plan.gate1Conclusion === "\u901A\u8FC7" ? "green" : "slate"}`, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		          plan.gate1Conclusion === "" ? t("dtUnset") : plan.gate1Conclusion
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "plan-strip-item", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-strip-label", children: t("dtPlanGate2") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: `status-pill tone-${plan.gate2Ready === "Ready" ? "green" : plan.gate2Ready === "" ? "slate" : "amber"}`, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		          plan.gate2Ready === "" ? t("dtUnset") : plan.gate2Ready
		        ] })
		      ] }),
		      plan.reportNodes.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "plan-strip-item", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-strip-label", children: t("dtPlanReportNodes") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chip-row", children: plan.reportNodes.map((node, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chip", children: node }, `${node}:${index}`)) })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "plan-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "plan-block-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "plan-block-title", children: t("dtPlanCriteria") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-block-note", children: plan.criteria.length === 0 ? t("dtPlanCriteriaNone") : format(t("dtPlanCriteriaCount"), { count: plan.criteria.length }) })
		      ] }),
		      plan.criteria.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Blank, { text: t("dtPlanCriteriaNone") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("table", { className: "plan-criteria", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: t("dtPlanCriteria") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: t("dtPlanMetric") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: t("dtPlanBaseline") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: t("dtPlanTarget") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: t("dtPlanCriteriaStatus") })
		        ] }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tbody", { children: plan.criteria.map((criterion, index) => {
		          const status = criterion.status;
		          const tone = criterionTone(status);
		          return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "plan-criterion-name", children: criterion.name === "" ? t("emptyField") : criterion.name }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: criterion.metric === "" ? t("emptyField") : criterion.metric }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "plan-criterion-num", children: criterion.baseline === "" ? "\u2014" : criterion.baseline }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "plan-criterion-target", children: criterion.target === "" ? "\u2014" : criterion.target }),
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "plan-criterion-status", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: `status-pill tone-${tone}`, children: [
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		              t(`dtCrit${CRITERION_STATUS_KEY[status] ?? "Unverified"}`)
		            ] }) })
		          ] }, criterion.id === "" ? `${criterion.name}:${index}` : criterion.id);
		        }) })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "plan-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "plan-block-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "plan-block-title", children: t("dtPlanScenarios") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-block-note", children: plan.scenarios.length === 0 ? t("dtPlanScenariosNone") : format(t("dtPlanScenariosCount"), { count: plan.scenarios.length }) })
		      ] }),
		      plan.scenarios.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Blank, { text: t("dtPlanScenariosNone") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ol", { className: "plan-scenarios", children: plan.scenarios.map((scenario, index) => {
		        const tone = scenarioTone(scenario.status);
		        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: "plan-scenario", "data-tone": tone, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-scenario-no", children: String(index + 1).padStart(2, "0") }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "plan-scenario-body", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-scenario-name", children: scenario.name === "" ? t("emptyField") : scenario.name }),
		            scenario.goal === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "plan-scenario-goal", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-scenario-goal-label", children: t("dtPlanScenarioGoal") }),
		              scenario.goal
		            ] })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "plan-scenario-tail", children: [
		            scenario.status === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-scenario-glyph", "aria-hidden": "true", children: scenarioGlyph(scenario.status) }),
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: `status-pill tone-${tone}`, children: [
		                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot" }),
		                t(`dtStatus${SCENARIO_STATUS_KEY[scenario.status] ?? "NoEvidence"}`)
		              ] }),
		              scenario.evidenceCount === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-scenario-evidence", children: format(t("dtPlanScenarioEvidence"), { count: scenario.evidenceCount }) })
		            ] }),
		            scenario.id === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
		              "button",
		              {
		                type: "button",
		                className: "plan-scenario-open",
		                onClick: () => onOpenScenario(scenario.id),
		                "aria-label": `${t("dtPlanScenarioDetail")}: ${scenario.name}`,
		                children: [
		                  t("dtPlanScenarioDetail"),
		                  " \u203A"
		                ]
		              }
		            )
		          ] })
		        ] }, scenario.id === "" ? `${scenario.name}:${index}` : scenario.id);
		      }) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "plan-block", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "plan-block-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "plan-block-title", children: t("dtPlanRisks") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-block-note", children: plan.risks.length === 0 ? t("dtPlanRisksNone") : format(t("dtPlanRisksCount"), { count: plan.risks.length }) })
		      ] }),
		      plan.risks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Blank, { text: t("dtPlanRisksNone") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { className: "plan-risks", children: plan.risks.map((risk, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: "plan-risk", "data-tone": riskTone(risk.level), children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-risk-dot", "aria-hidden": "true" }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "plan-risk-text", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-risk-name", children: risk.name === "" ? t("emptyField") : risk.name }),
		          risk.level === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "plan-risk-level", children: risk.level }),
		          risk.mitigation === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "plan-risk-mitigation", children: [
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
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Section, { title: t("dtOutcomeTitle"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "out-triple", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Prose, { label: t("dtOutcomeProved"), value: outcome.proved, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Prose, { label: t("dtOutcomeRecognized"), value: outcome.recognized, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Prose, { label: t("dtOutcomeNext"), value: outcome.nextBusiness, t })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "out-milestone", "data-present": hasMilestone, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "out-milestone-label", children: t("dtOutcomeMilestone") }),
		      hasMilestone ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "out-milestone-text", children: outcome.milestone }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "out-milestone-missing", children: t("dtOutcomeMilestoneNone") }),
		      hasMilestone ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "out-milestone-meta", children: [
		        outcome.businessOwner === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chip", children: format(t("dtOutcomeMilestoneOwner"), { owner: outcome.businessOwner }) }),
		        outcome.businessDeadline === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chip", children: format(t("dtOutcomeMilestoneDeadline"), { date: outcome.businessDeadline }) }),
		        outcome.businessStatus === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chip", children: format(t("dtOutcomeMilestoneStatus"), { status: outcome.businessStatus }) })
		      ] }) : null
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "out-meta", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Prose, { label: t("dtOutcomeProof"), value: outcome.ourProof, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Prose, { label: t("dtOutcomeRemaining"), value: outcome.remainingRisks, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Prose, { label: t("dtOutcomeOverall"), value: outcome.overall, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Prose, { label: t("dtOutcomeReviewed"), value: outcome.reviewedAt, t })
		    ] })
		  ] });
		}
		function DetailPage(props) {
		  const { detail, t, locale } = props;
		  const stage = detail.summary.closed ? "closed" : detail.summary.stage;
		  const skeleton = SKELETON_FOR[stage] ?? SKELETON_FOR.unknown;
		  const [foldOpen, setFoldOpen] = (0, import_react2.useState)(false);
		  const [scenarioId, setScenarioId] = (0, import_react2.useState)(null);
		  const sections = {
		    basic: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(BasicInfo, { detail, t }, "basic"),
		    progress: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ProgressStream, { detail, t, locale }, "progress"),
		    dimensions: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(DimensionGrid, { detail, t }, "dimensions"),
		    gate0: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Gate0Meter, { detail, t }, "gate0"),
		    plan: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PlanPanels, { detail, t, onOpenScenario: setScenarioId }, "plan"),
		    outcome: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(OutcomePanel, { detail, t }, "outcome")
		  };
		  const primary = skeleton.sections;
		  const secondary = ["basic", "progress", "dimensions", "gate0", "plan", "outcome"].filter((key) => !primary.includes(key));
		  const stageState = stageStateOf(detail);
		  const projectBlockers = props.blockers ?? [];
		  if (scenarioId !== null) {
		    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-page", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(IdentityRail, { props }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("main", { className: "dt-pane", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "sd-back", onClick: () => setScenarioId(null), children: t("dtScenarioBack") }),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ScenarioDetail, { detail, scenarioId, t })
		      ] })
		    ] });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dt-page", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(IdentityRail, { props }),
		    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("main", { className: "dt-pane", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(StageContext, { stage, done: stageState.done, pending: stageState.pending, t }),
		      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("section", { className: "dt-worklist", "aria-label": t("worklistTitle"), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Worklist, { detail, rows: projectBlockers, t }) }),
		      primary.map((key) => sections[key]),
		      secondary.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "dt-fold", "data-open": foldOpen, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
		          "button",
		          {
		            type: "button",
		            className: "dt-fold-head",
		            "aria-expanded": foldOpen,
		            onClick: () => setFoldOpen((value) => !value),
		            children: [
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: "dt-fold-title", children: t("dtOtherSections") }),
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-fold-hint", children: t("dtOtherSectionsHint") }),
		              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dt-fold-arrow", "aria-hidden": "true", children: foldOpen ? "\u25B4" : "\u25BE" })
		            ]
		          }
		        ),
		        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dt-fold-body", children: secondary.map((key) => sections[key]) })
		      ] })
		    ] })
		  ] });
		}

		// src/client/export-form.tsx
		var import_react3 = require("react");
		var import_jsx_runtime4 = require("react/jsx-runtime");
		function ExportFormDialog({ api, projects, t, onClose, onError }) {
		  const rows = (0, import_react3.useMemo)(
		    () => projects.map((project) => ({ pocId: project.pocId, name: project.name, company: project.company })),
		    [projects]
		  );
		  const [selected, setSelected] = (0, import_react3.useState)(() => new Set(rows.map((row) => row.pocId)));
		  const [busy, setBusy] = (0, import_react3.useState)(false);
		  const toggle = (pocId) => {
		    setSelected((current) => {
		      const next = new Set(current);
		      if (next.has(pocId)) next.delete(pocId);
		      else next.add(pocId);
		      return next;
		    });
		  };
		  const selectAll = () => setSelected(new Set(rows.map((row) => row.pocId)));
		  const selectNone = () => setSelected(/* @__PURE__ */ new Set());
		  const generate = async () => {
		    setBusy(true);
		    try {
		      const mode = selected.size === 0 ? "blank" : "fill";
		      const result = await api.exportForm(mode, mode === "blank" ? [] : [...selected]);
		      const blob = new Blob([result.html], { type: "text/html;charset=utf-8" });
		      const url = URL.createObjectURL(blob);
		      const anchor = document.createElement("a");
		      anchor.href = url;
		      anchor.download = result.fileName;
		      document.body.appendChild(anchor);
		      anchor.click();
		      anchor.remove();
		      setTimeout(() => URL.revokeObjectURL(url), 4e3);
		      onClose();
		    } catch (error) {
		      onError(error instanceof Error ? error.message : t("exportFailed"));
		    } finally {
		      setBusy(false);
		    }
		  };
		  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
		    "div",
		    {
		      className: "modal-overlay",
		      role: "presentation",
		      onMouseDown: (event) => {
		        if (event.target === event.currentTarget && !busy) onClose();
		      },
		      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
		        "div",
		        {
		          className: "modal modal-wide",
		          role: "dialog",
		          "aria-modal": "true",
		          "aria-label": t("exportTitle"),
		          onKeyDown: (event) => {
		            if (event.key === "Escape" && !busy) onClose();
		          },
		          children: [
		            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "modal-header", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { className: "modal-title", children: t("exportTitle") }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "modal-content", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "modal-lead", children: t("exportSubtitle") }),
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "export-toolbar", children: [
		                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "btn btn-small", onClick: selectAll, disabled: busy, children: t("exportSelectAll") }),
		                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "btn btn-small", onClick: selectNone, disabled: busy, children: t("exportSelectNone") }),
		                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "export-count", children: format(t("exportSelected"), { count: selected.size }) })
		              ] }),
		              rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "modal-lead", children: t("exportNoProjects") }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("ul", { className: "export-list", children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "export-row", "data-selected": selected.has(row.pocId), children: [
		                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
		                  "input",
		                  {
		                    type: "checkbox",
		                    checked: selected.has(row.pocId),
		                    disabled: busy,
		                    onChange: () => toggle(row.pocId)
		                  }
		                ),
		                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "export-row-text", children: [
		                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "export-row-name", children: row.name === "" ? row.pocId : row.name }),
		                  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "export-row-meta", children: [
		                    row.pocId,
		                    row.company === "" ? "" : ` \xB7 ${row.company}`
		                  ] })
		                ] })
		              ] }) }, row.pocId)) }),
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "helper-box", children: selected.size === 0 ? t("exportBlankHint") : t("exportHint") })
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "modal-footer", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "spacer" }),
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "btn", onClick: onClose, disabled: busy, children: t("cancel") }),
		              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "btn btn-primary", onClick: () => {
		                void generate();
		              }, disabled: busy, children: busy ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
		                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "spinner" }),
		                " ",
		                t("exportGenerating")
		              ] }) : t("exportGenerate") })
		            ] })
		          ]
		        }
		      )
		    }
		  );
		}

		// src/client/overview.tsx
		var import_react5 = require("react");

		// src/client/summary.tsx
		var import_react4 = require("react");
		var import_jsx_runtime5 = require("react/jsx-runtime");
		function KpiStrip({ stats, analysis, blockedCount, total, activeStage, t, onFilter, onClearFilters }) {
		  const stageCounts = (0, import_react4.useMemo)(() => {
		    const next = [];
		    for (const bucket of analysis.stages) {
		      if (bucket.key === "unknown" && bucket.count === 0) continue;
		      next.push({ key: bucket.key, label: stageLabel(t, bucket.key), count: bucket.count });
		    }
		    return next;
		  }, [analysis.stages, t]);
		  const stageSummary = stageCounts.map((bucket) => `${bucket.label} ${bucket.count}`).join(" \xB7 ");
		  const figures = [
		    {
		      key: "total",
		      label: t("kpiTotal"),
		      value: String(stats.total),
		      note: format(t("kpiAllNote"), { count: total }),
		      tone: "slate",
		      // Not clickable: "all projects" cannot narrow anything.
		      onSelect: null,
		      active: false
		    },
		    {
		      key: "active",
		      label: t("kpiActive"),
		      value: String(stats.inProgress),
		      note: format(t("kpiBlockedNote"), { count: stats.inProgress }),
		      tone: "blue",
		      onSelect: () => onClearFilters(),
		      active: false
		    },
		    {
		      key: "budget",
		      label: t("kpiBudget"),
		      value: formatWan(stats.amountTotalWan),
		      note: t("statAmountUnit"),
		      tone: "amber",
		      onSelect: null,
		      active: false
		    },
		    {
		      key: "blocked",
		      label: t("kpiBlocked"),
		      value: String(blockedCount),
		      note: format(t("kpiBlockedNote"), { count: blockedCount }),
		      tone: blockedCount > 0 ? "red" : "green",
		      onSelect: () => onClearFilters(),
		      active: false
		    },
		    {
		      key: "g0",
		      label: t("kpiG0Passed"),
		      value: String(stats.g0Passed),
		      note: format(t("kpiAllNote"), { count: stats.total }),
		      tone: "green",
		      onSelect: () => onClearFilters(),
		      active: false
		    }
		  ];
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "kpi-strip", "aria-label": t("kpiTitle"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "kpi-cells", children: figures.map((figure) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "kpi-cell", "data-tone": figure.tone, "data-clickable": figure.onSelect !== null, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "kpi-label", children: figure.label }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "kpi-value", children: figure.value }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "kpi-note", children: figure.note })
		    ] }, figure.key)) }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "kpi-stages", role: "group", "aria-label": t("kpiStageBreakdown"), children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "kpi-stages-label", children: t("kpiStageBreakdown") }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "kpi-stage-chips", children: stageCounts.map((bucket) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
		        "button",
		        {
		          type: "button",
		          className: "kpi-stage-chip",
		          "data-active": activeStage === bucket.key,
		          "data-zero": bucket.count === 0,
		          disabled: bucket.count === 0 && activeStage !== bucket.key,
		          title: `${bucket.label} \xB7 ${bucket.count}`,
		          onClick: () => onFilter({ stage: activeStage === bucket.key ? null : bucket.key }),
		          children: [
		            bucket.label,
		            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "kpi-stage-count", children: bucket.count })
		          ]
		        },
		        bucket.key
		      )) }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "kpi-stages-summary", "aria-hidden": "true", children: stageSummary })
		    ] })
		  ] });
		}
		function splitBudget(projects) {
		  const split = {
		    approved: { count: 0, amount: 0 },
		    pending: { count: 0, amount: 0 },
		    unset: { count: 0 }
		  };
		  for (const project of projects) {
		    if (project.amountWan === 0) {
		      split.unset.count += 1;
		      continue;
		    }
		    if (project.g0Passed) {
		      split.approved.count += 1;
		      split.approved.amount += project.amountWan;
		    } else {
		      split.pending.count += 1;
		      split.pending.amount += project.amountWan;
		    }
		  }
		  return split;
		}
		function BudgetPanel({ projects, analysis, t }) {
		  const split = (0, import_react4.useMemo)(() => splitBudget(projects), [projects]);
		  const total = split.approved.amount + split.pending.amount;
		  const segments = [
		    { key: "approved", value: split.approved.amount, tone: "green", label: t("budgetApproved") },
		    { key: "pending", value: split.pending.amount, tone: "amber", label: t("budgetPending") }
		  ].filter((segment) => segment.value > 0);
		  const orgRows = analysis.orgs.slice(0, 5).map((row) => ({
		    key: `${row.system}\0${row.company}`,
		    label: row.company === "" ? row.system === "" ? t("dtUnset") : row.system : row.company,
		    ...row.system === "" ? {} : { note: row.system },
		    value: row.amountWan
		  }));
		  if (total === 0 && split.unset.count === 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "budget-panel", "aria-label": t("budgetTitle"), children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("header", { className: "budget-head", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: "budget-title", children: t("budgetTitle") }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "budget-empty", children: t("budgetEmpty") })
		    ] });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "budget-panel", "aria-label": t("budgetTitle"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("header", { className: "budget-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { className: "budget-title", children: t("budgetTitle") }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "budget-note", children: t("budgetNote") })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "budget-total", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "budget-total-label", children: t("budgetTotal") }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "budget-total-value", children: [
		        formatWan(total),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "budget-total-unit", children: t("statAmountUnit") })
		      ] })
		    ] }),
		    segments.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "budget-bar", role: "img", "aria-label": segments.map((segment) => `${segment.label} ${formatWan(segment.value)}`).join(", "), children: segments.map((segment) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
		      "span",
		      {
		        className: "budget-bar-segment",
		        "data-tone": segment.tone,
		        style: { width: `${total === 0 ? 0 : segment.value / total * 100}%` }
		      },
		      segment.key
		    )) }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("dl", { className: "budget-rows", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "budget-row", "data-tone": "green", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { className: "budget-row-label", children: t("budgetApproved") }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { className: "budget-row-value", children: format(t("budgetApprovedNote"), { count: split.approved.count, amount: formatWan(split.approved.amount) }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "budget-row", "data-tone": "amber", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { className: "budget-row-label", children: t("budgetPending") }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { className: "budget-row-value", children: format(t("budgetPendingNote"), { count: split.pending.count, amount: formatWan(split.pending.amount) }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "budget-row", "data-tone": split.unset.count > 0 ? "red" : "slate", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { className: "budget-row-label", children: t("budgetUnset") }),
		        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { className: "budget-row-value", children: format(t("budgetUnsetNote"), { count: split.unset.count }) })
		      ] })
		    ] }),
		    split.unset.count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "budget-warning", role: "note", children: format(t("budgetUnsetWarning"), { count: split.unset.count }) }) : null,
		    orgRows.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "budget-orgs", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "budget-orgs-label", children: t("budgetByOrg") }),
		      orgRows.map((row) => {
		        const share = total === 0 ? 0 : row.value / total;
		        return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "budget-org-row", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "budget-org-name", children: [
		            row.label,
		            row.note === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "budget-org-system", children: row.note })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(InlineMeter, { value: row.value, max: total, tone: "blue" }),
		          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "budget-org-value", children: [
		            Math.round(share * 100),
		            "%"
		          ] })
		        ] }, row.key);
		      })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "budget-concentration", children: format(t("budgetConcentrationCopy"), { share: Math.round(analysis.concentration * 100) }) })
		  ] });
		}
		function StageProgressFigure({ analysis, projects, t }) {
		  const rows = (0, import_react4.useMemo)(() => {
		    return analysis.stages.filter((bucket) => bucket.key !== "unknown").map((bucket) => {
		      const inBucket = projects.filter((project) => stageBucketKey(project) === bucket.key);
		      const index = STAGES.indexOf(bucket.key);
		      const done = index === -1 ? inBucket.length : inBucket.filter((project) => project.stageDone[index] === true).length;
		      return {
		        key: bucket.key,
		        label: stageLabel(t, bucket.key),
		        total: inBucket.length,
		        done,
		        hasGate: index !== -1
		      };
		    });
		  }, [analysis.stages, projects, t]);
		  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "stage-progress", children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "stage-progress-row", "data-empty": row.total === 0, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "stage-progress-label", children: row.label }),
		    row.total === 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "stage-progress-empty", children: t("stageNoData") }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(InlineMeter, { value: row.done, max: row.total, tone: row.done === row.total ? "green" : "blue" }),
		      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "stage-progress-value", children: row.hasGate ? format(t("stageProgressNote"), { done: row.done, total: row.total }) : `${row.total}` })
		    ] })
		  ] }, row.key)) });
		}

		// src/client/overview.tsx
		var import_jsx_runtime6 = require("react/jsx-runtime");
		var DIMENSION_TEXT2 = {
		  achievement: "dimAchievement",
		  evidence: "dimEvidence",
		  recognition: "dimRecognition",
		  nextMilestone: "dimNextMilestone"
		};
		function GapBadge({ project, t }) {
		  if (project.gapCount === 0) return null;
		  if (project.highGapCount > 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pcard-badge", "data-tone": "red", children: format(t("cardGapBadgeHigh"), { count: project.highGapCount }) });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pcard-badge", "data-tone": "amber", children: format(t("cardGapBadge"), { count: project.gapCount }) });
		}
		function DimensionMarks({ project, t }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "pcard-dims", role: "group", "aria-label": t("colDimensions"), children: DIMENSIONS.map((key) => {
		    const present = project.dimensions[key];
		    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "pcard-dim", "data-present": present, title: `${t(DIMENSION_TEXT2[key])}: ${present ? t("dimPresent") : t("dimMissing")}`, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pcard-dim-mark", "aria-hidden": "true", children: present ? "\u2713" : "\u2717" }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pcard-dim-label", children: t(DIMENSION_TEXT2[key]) })
		    ] }, key);
		  }) });
		}
		function ProjectCard({ project, selected, locale, t, onOpen }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
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
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "pcard-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "pcard-title-block", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pcard-name", children: project.name }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "pcard-id", children: [
		              project.pocId,
		              project.owner === "" ? "" : ` \xB7 ${project.owner}`
		            ] })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(GapBadge, { project, t })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "pcard-stage", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "status-pill tone-blue pcard-stage-pill", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "status-dot" }),
		            project.closed ? t("stageClosed") : project.stageLabel === "" ? t("stageUnknown") : project.stageLabel
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
		            StageRailMini,
		            {
		              done: project.stageDone,
		              current: project.stage,
		              closed: project.closed,
		              ariaLabel: `${t("stageTrack")} \xB7 ${project.pocId}`
		            }
		          )
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "pcard-meta", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "pcard-org", children: [
		            project.system === "" ? t("emptyField") : project.system,
		            " \xB7 ",
		            project.company === "" ? t("emptyField") : project.company
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "pcard-amount", children: [
		            project.amountWan === 0 ? "\u2014" : formatWan(project.amountWan),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pcard-unit", children: project.amountWan === 0 ? "" : t("statAmountUnit") })
		          ] })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "pcard-progress", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pcard-progress-label", children: t("cardLatestProgress") }),
		          project.progressCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pcard-progress-copy is-muted", children: t("cardNoProgress") }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pcard-progress-copy", children: project.lastProgressSummary === "" ? t("emptyField") : project.lastProgressSummary }),
		          project.progressCount === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "pcard-progress-meta", children: [
		            formatDate(project.lastProgressDate, locale),
		            " \xB7 ",
		            format(t("cardProgressCount"), { count: project.progressCount })
		          ] })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DimensionMarks, { project, t }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "pcard-foot", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pcard-since", children: project.daysInStage === null ? t("cardNoStageSince") : format(t("cardStageSince"), { days: project.daysInStage }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "pcard-open", children: [
		            t("cardOpen"),
		            " \u2192"
		          ] })
		        ] })
		      ]
		    }
		  );
		}
		function ProjectCards({ projects, selectedId, locale, t, onOpen }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "pcard-grid", children: projects.map((project) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", className: "pboard-card", "data-high": project.highGapCount > 0, onClick: () => onOpen(project.pocId), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pboard-card-name", children: project.name }),
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "pboard-card-meta", children: [
		      project.amountWan === 0 ? "\u2014" : `${formatWan(project.amountWan)} ${t("statAmountUnit")}`,
		      project.owner === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "pboard-card-owner", children: [
		        " \xB7 ",
		        project.owner
		      ] })
		    ] }),
		    project.progressCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pboard-card-progress is-muted", children: t("cardNoProgress") }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pboard-card-progress", children: project.lastProgressSummary === "" ? t("emptyField") : project.lastProgressSummary }),
		    project.highGapCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pboard-card-gap", "data-tone": "red", children: format(t("boardHighBadge"), { count: project.highGapCount }) }) : null
		  ] });
		}
		function ProjectBoard({ projects, t, onOpen }) {
		  const columns = BOARD_KEYS.map((key) => {
		    const rows = projects.filter((project) => stageBucketKey(project) === key);
		    return {
		      key,
		      label: stageLabel(t, key),
		      rows,
		      amount: rows.reduce((sum, project) => sum + project.amountWan, 0)
		    };
		  }).filter((column) => column.rows.length > 0 || column.key !== "closed" && column.key !== "unknown");
		  const peak = columns.reduce((highest, column) => Math.max(highest, column.rows.length), 0);
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "pboard", children: columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "pboard-column", "data-empty": column.rows.length === 0, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("header", { className: "pboard-column-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pboard-column-label", children: column.label }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pboard-column-count", children: format(t("boardColumnCount"), { count: column.rows.length, amount: formatWan(column.amount) }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(InlineMeter, { value: column.rows.length, max: peak, tone: column.key === "closed" || column.key === "unknown" ? "slate" : "blue" })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "pboard-column-body", children: column.rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "pboard-empty", children: t("boardEmptyColumn") }) : column.rows.map((project) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(BoardCard, { project, t, onOpen }, project.pocId)) })
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
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { style: align === void 0 ? void 0 : { textAlign: align }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", className: "ptable-sort", "data-active": active, title: t("tableSortByThis"), onClick, children: [
		    label,
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "ptable-sort-arrow", "aria-hidden": "true", children: active ? asc ? "\u2191" : "\u2193" : "" })
		  ] }) });
		}
		function ProjectTable({ projects, selectedId, locale, t, sortKey, sortAsc, onSort, onOpen }) {
		  const peak = projects.reduce((highest, project) => Math.max(highest, project.amountWan), 0);
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("table", { className: "project-table ptable", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("thead", { className: "table-head", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tr", { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { style: { width: "22%" }, children: t("colProject") }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { style: { width: "14%" }, children: t("colOrg") }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SortableHead, { label: t("colStage"), active: sortKey === "stage", asc: sortAsc, onClick: () => onSort("stage"), t }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SortableHead, { label: t("colAmount"), active: sortKey === "amount", asc: sortAsc, align: "right", onClick: () => onSort("amount"), t }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SortableHead, { label: t("colLatestProgress"), active: sortKey === "progress", asc: sortAsc, onClick: () => onSort("progress"), t }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { style: { width: "8%" }, children: t("colGaps") }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { style: { width: "10%", textAlign: "right" }, children: t("colAction") })
		    ] }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("tbody", { children: projects.map((project) => {
		      const level = project.highGapCount > 0 ? "high" : project.gapCount > 0 ? "medium" : "none";
		      return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
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
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("td", { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "project-name", children: project.name }),
		              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "project-id", children: [
		                project.pocId,
		                project.owner === "" ? "" : ` \xB7 ${project.owner}`
		              ] })
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("td", { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "project-org", children: project.system === "" ? t("emptyField") : project.system }),
		              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "project-id", children: project.company === "" ? t("emptyField") : project.company })
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "ptable-stage", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "status-pill tone-blue", children: [
		                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "status-dot" }),
		                project.closed ? t("stageClosed") : project.stageLabel === "" ? t("stageUnknown") : project.stageLabel
		              ] }),
		              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(StageRailMini, { done: project.stageDone, current: project.stage, closed: project.closed, ariaLabel: `${t("stageTrack")} \xB7 ${project.pocId}` })
		            ] }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "ptable-amount", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "amount-cell", children: project.amountWan === 0 ? "\u2014" : formatWan(project.amountWan) }),
		              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(InlineMeter, { value: project.amountWan, max: peak, tone: "amber" })
		            ] }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: project.progressCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "project-meta is-muted", children: t("cardNoProgress") }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
		              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "progress-summary", children: project.lastProgressSummary === "" ? t("emptyField") : project.lastProgressSummary }),
		              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "project-id", children: format(t("tableProgressCell"), { date: formatDate(project.lastProgressDate, locale), count: project.progressCount }) })
		            ] }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "gap-cell", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "gap-count", "data-level": level, children: project.gapCount === 0 ? "\u2014" : project.gapCount }),
		              project.highGapCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "project-meta", children: [
		                project.highGapCount,
		                "!"
		              ] }) : null
		            ] }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "row-actions", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "btn btn-small", onClick: (event) => {
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
		    display: format(t("orgAmountLabel"), { amount: formatWan(row.amountWan) }),
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
		    // `info` is its own tier (R14): painting it amber would put a project that is
		    // merely waiting on the customer beside one that has no evidence at all.
		    tone: row.level === "high" ? "red" : row.level === "medium" ? "amber" : "slate"
		  }));
		  const [collapsed, setCollapsed] = (0, import_react5.useState)(false);
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "pf-band", "data-collapsed": collapsed, "aria-label": t("bandTitle"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("header", { className: "pf-band-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: "pf-band-title", children: t("bandTitle") }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pf-band-note", children: format(t("bandNote"), { count: totalProjects, amount: formatWan(totalAmount) }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "pf-grid", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block pf-block", "data-span": "4", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: "chart-block-title", children: t("bandStages") }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "chart-block-note", children: t("bandStagesNote") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
		          Legend,
		          {
		            items: analysis.stages.filter((bucket) => bucket.count > 0).map((bucket) => ({ key: bucket.key, label: stageLabel(t, bucket.key), tone: "blue", value: format(t("stageAmountLabel"), { amount: formatWan(bucket.amountWan) }) }))
		          }
		        ),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "pf-subfigure", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "pf-subfigure-label", children: t("stageProgressLabel") }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(StageProgressFigure, { analysis, projects: props.projects, t })
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block pf-block", "data-span": "4", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: "chart-block-title", children: t("bandDims") }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "chart-block-note", children: t("bandDimsNote") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "pf-radials", children: analysis.dimensions.map((row) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block pf-block", "data-span": "2", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: "chart-block-title", children: t("bandOrgs") }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "chart-block-note", children: t("bandOrgsNote") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block pf-block", "data-span": "2", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: "chart-block-title", children: t("bandTypes") }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "chart-block-note", children: t("bandTypesNote") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block pf-block", "data-span": "2", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: "chart-block-title", children: t("bandAmounts") }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "chart-block-note", children: t("bandAmountsNote") })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
		          BarList,
		          {
		            rows: amountRows,
		            ariaLabel: t("bandAmounts"),
		            summary: amountRows.map((row) => `${row.label} ${row.value}`).join(", "),
		            onSelect: (pocId) => onOpen(pocId)
		          }
		        ),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "pf-note", "data-tone": analysis.concentration > 0.33 ? "amber" : "muted", title: analysis.concentration > 0.33 ? t("concentrationHigh") : t("concentrationNormal"), children: [
		          format(t("amountConcentrationLabel"), { share: Math.round(analysis.concentration * 100) }),
		          analysis.amountMissing > 0 ? ` \xB7 ${format(t("amountMissingLabel"), { count: analysis.amountMissing })}` : null
		        ] })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block pf-block", "data-span": "2", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "chart-block-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: "chart-block-title", children: t("bandGapRules") }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "chart-block-note", children: format(t("bandGapRulesNote"), { count: props.gaps.length }) })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "empty-state", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: "empty-title", children: t("filteredEmptyTitle") }),
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "empty-copy", children: t("filteredEmptyCopy") }),
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "btn", onClick: onClearFilters, children: t("filteredEmptyReset") })
		  ] });
		}
		function OverviewPage(props) {
		  const { projects, viewMode, selectedId, locale, t, filteredOut, onOpen, onClearFilters, onSort, sortKey, sortAsc } = props;
		  const visibleIds = (0, import_react5.useMemo)(() => {
		    if (projects.length === props.snapshot.projects.length) return null;
		    return new Set(projects.map((project) => project.pocId));
		  }, [projects, props.snapshot.projects.length]);
		  const visibleBlockerCount = (0, import_react5.useMemo)(
		    () => visibleIds === null ? props.snapshot.blockers.rows.length : props.snapshot.blockers.rows.filter((row) => visibleIds.has(row.pocId)).length,
		    [props.snapshot.blockers.rows, visibleIds]
		  );
		  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
		      KpiStrip,
		      {
		        stats: props.snapshot.stats,
		        analysis: props.analysis,
		        blockedCount: props.snapshot.blockers.projectsBlocked,
		        total: props.snapshot.projects.length,
		        activeStage: props.filters.stage,
		        t,
		        onFilter: (next) => props.onFilter(next),
		        onClearFilters: props.onClearFilters
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PortfolioBand, { props }),
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(BudgetPanel, { projects: props.projects, analysis: props.analysis, t }),
		    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "workspace-grid", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "primary-column", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "panel", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "panel-header", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: "panel-title", children: t("tableTitle") }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "panel-kicker", children: projects.length })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "panel-body", children: filteredOut ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(FilteredEmpty, { t, onClearFilters }) : viewMode === "cards" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ProjectCards, { projects, selectedId, locale, t, onOpen }) : viewMode === "board" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ProjectBoard, { projects, t, onOpen }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
		        props.snapshot.warnings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "panel", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "panel-header", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: "panel-title", children: t("warningsTitle") }),
		            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "panel-kicker", children: props.snapshot.warnings.length })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "panel-body padded", children: props.snapshot.warnings.map((warning) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "gap-copy", style: { margin: "0 0 4px" }, children: [
		            "\xB7 ",
		            warning
		          ] }, warning)) })
		        ] }) : null
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "secondary-column", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "panel", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "panel-header", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: "panel-title", children: t("blockerTitle") }),
		          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "panel-kicker", children: format(t("blockerCount"), { count: visibleBlockerCount }) })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "panel-note", children: format(t("blockerProjectsNote"), { blocked: props.snapshot.blockers.projectsBlocked, total: props.snapshot.blockers.projectsTotal }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "panel-body", children: visibleBlockerCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "panel-body padded", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "empty-copy", style: { margin: 0 }, children: filteredOut ? t("blockerEmptyFiltered") : t("blockerEmpty") }) }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
		          BlockerPanel,
		          {
		            board: props.snapshot.blockers,
		            visibleIds,
		            t,
		            onOpen
		          }
		        ) })
		      ] }) })
		    ] })
		  ] });
		}

		// src/client/insights.tsx
		var import_jsx_runtime7 = require("react/jsx-runtime");
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
		function recognitionTone2(value) {
		  if (value === "\u8BA4\u53EF") return "green";
		  if (value === "\u90E8\u5206\u8BA4\u53EF") return "amber";
		  if (value === "\u672A\u8BA4\u53EF") return "red";
		  return "slate";
		}
		function LevelPill({ level, t }) {
		  if (level === "high") return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "status-pill tone-red", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "status-dot" }),
		    t("riskHigh")
		  ] });
		  if (level === "medium") return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "status-pill tone-amber", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "status-dot" }),
		    t("riskMedium")
		  ] });
		  if (level === "low") return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "status-pill tone-green", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "status-dot" }),
		    t("riskLow")
		  ] });
		  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "status-pill tone-slate", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "status-dot" }),
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
		  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "risk-board", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "risk-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "risk-head-text", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h1", { className: "risk-head-title", children: t("risksBoardTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "risk-head-subtitle", children: t("risksSubtitle") })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "risk-back", onClick: props.onBack, children: t("back") })
		    ] }),
		    hasRisks ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "risk-figure", "aria-labelledby": "risk-figure-title", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "risk-figure-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { className: "risk-figure-title", id: "risk-figure-title", children: t("riskLaneTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "risk-figure-note", children: format(t("riskBoardNote"), { count: board.rows.length, projects: board.projectsWithRisks }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
		        SeverityBar,
		        {
		          lanes: lanes.map((lane) => ({ key: lane.key, label: lane.label, value: lane.count, tone: lane.tone })),
		          ariaLabel: t("riskLaneTitle"),
		          summary: laneNote
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "risk-caption", children: laneNote })
		    ] }) : null,
		    hasRisks && projectRows.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "risk-projects", "aria-labelledby": "risk-projects-title", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "risk-figure-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { className: "risk-figure-title", id: "risk-projects-title", children: t("riskSourceProject") }),
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "risk-figure-note", children: format(t("riskProjects"), { withRisks: board.projectsWithRisks, total: board.projectsTotal }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
		        BarList,
		        {
		          rows: projectRows,
		          ariaLabel: t("riskSourceProject"),
		          summary: projectRows.map((row) => `${row.label} ${row.value}`).join(" \xB7 "),
		          max: projectPeak
		        }
		      )
		    ] }) : null,
		    hasRisks ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "risk-lanes", children: lanes.map(
		      (lane) => lane.count === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "risk-lane", "data-level": lane.key, "aria-label": lane.label, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "risk-lane-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(LevelPill, { level: lane.key, t }),
		          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "risk-lane-count", children: lane.count }),
		          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "risk-lane-meter", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(InlineMeter, { value: lane.count, max: board.rows.length, tone: lane.tone }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "risk-lane-share", children: [
		            Math.round(lane.count / board.rows.length * 100),
		            "%"
		          ] })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("ul", { className: "risk-rows", children: lane.rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("li", { className: "risk-row-item", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "risk-row", "data-level": laneOf(row.level), children: [
		          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "risk-row-main", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "risk-name", children: row.name === "" ? t("emptyField") : row.name }),
		            row.mitigation === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "risk-mitigation", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "risk-mitigation-label", children: t("riskMitigation") }),
		              row.mitigation
		            ] })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "risk-row-side", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
		              "button",
		              {
		                type: "button",
		                className: "risk-project",
		                onClick: () => onOpenProject(row.pocId),
		                children: [
		                  projectLabel(row.pocName, row.pocId),
		                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "risk-project-arrow", "aria-hidden": "true", children: "\u2192" })
		                ]
		              }
		            ),
		            row.gapCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "risk-gap", children: format(t("riskGapContext"), { count: row.gapCount, high: row.highGapCount }) }) : null
		          ] })
		        ] }) }, `${row.pocId}:${index}`)) })
		      ] }, lane.key)
		    ) }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "risk-empty", role: "status", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "risk-empty-mark", "aria-hidden": "true", children: "\u2014" }),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "risk-empty-copy", children: t("riskNoRisks") })
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
		  const range = timeline.range === null ? null : format(t("timelineRange"), { from: formatDate(timeline.range.from, locale), to: formatDate(timeline.range.to, locale) });
		  const laneNote = format(t("tlLaneNote"), { count: timeline.entries.length });
		  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "tl-page", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "tl-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "tl-head-text", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h1", { className: "tl-head-title", children: t("timelineTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "tl-head-subtitle", children: t("timelineSubtitle") })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "tl-back", onClick: props.onBack, children: t("back") })
		    ] }),
		    hasEntries ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "tl-figure", "aria-labelledby": "tl-figure-title", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "tl-figure-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { className: "tl-figure-title", id: "tl-figure-title", children: t("tlLaneTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "tl-figure-note", children: range === null ? laneNote : range })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
		        Sparkbars,
		        {
		          points: sparkPoints.map((point) => ({ month: point.month, count: point.count })),
		          ariaLabel: t("tlLaneTitle"),
		          summary: laneNote
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "tl-caption", children: range === null ? laneNote : `${laneNote} \xB7 ${range}` })
		    ] }) : null,
		    timeline.silentProjects.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "tl-silent", "aria-labelledby": "tl-silent-title", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "tl-silent-head", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { className: "tl-silent-title", id: "tl-silent-title", children: t("tlSilentTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "tl-silent-note", children: format(t("tlSilentNote"), { count: timeline.silentProjects.length }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "tl-silent-chips", children: timeline.silentProjects.map((project) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
		        "button",
		        {
		          type: "button",
		          className: "tl-chip-button",
		          onClick: () => onOpenProject(project.pocId),
		          children: projectLabel(project.pocName, project.pocId)
		        },
		        project.pocId
		      )) }),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "tl-silent-hint", children: t("timelineSilentHint") })
		    ] }) : null,
		    hasEntries ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "tl-stream", children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "tl-month-group", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "tl-month", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "tl-month-label", children: group.month === "" ? t("emptyField") : group.month }),
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "tl-month-count", children: format(t("timelineCount"), { count: group.entries.length }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "tl-month-rule", "aria-hidden": "true" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("ul", { className: "tl-entries", children: group.entries.map((entry, index) => {
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
		        if (entry.nextDeadline !== "") chips.push({ key: "deadline", value: formatDate(entry.nextDeadline, locale) });
		        return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { className: "tl-entry", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "tl-gutter", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "tl-node", "data-tone": recognitionTone2(entry.recognition) }) }),
		          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("article", { className: "tl-card", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "tl-card-head", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("time", { className: "tl-date", dateTime: entry.date, children: formatDate(entry.date, locale, "\u2014") }),
		              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "tl-type", children: entry.type === "" ? t("roundUnnumbered") : entry.type }),
		              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
		                "button",
		                {
		                  type: "button",
		                  className: "tl-project",
		                  onClick: () => onOpenProject(entry.pocId),
		                  children: projectLabel(entry.pocName, entry.pocId)
		                }
		              ),
		              entry.recognition === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: `status-pill tone-${recognitionTone2(entry.recognition)} tl-recog`, children: [
		                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "status-dot" }),
		                entry.recognition
		              ] })
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("dl", { className: "tl-fields", children: fields.map((field) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "tl-field", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("dt", { className: "tl-field-label", children: field.label }),
		              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("dd", { className: "tl-field-value", "data-emphasis": field.emphasis, children: field.value })
		            ] }, field.key)) }),
		            chips.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("footer", { className: "tl-chips", children: chips.map((chip) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "tl-chip", children: [
		              chip.label === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "tl-chip-label", children: chip.label }),
		              chip.value
		            ] }, chip.key)) })
		          ] })
		        ] }, `${entry.pocId}:${entry.date}:${index}`);
		      }) })
		    ] }, group.month === "" ? "undated" : group.month)) }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "tl-empty", role: "status", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "tl-empty-mark", "aria-hidden": "true", children: "\u2014" }),
		      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "tl-empty-copy", children: t("timelineEmpty") })
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
		/* The export dialog needs a wider box: it lists projects, and 452px clipped the
		   company name on every row. */
		.wd-shell .modal-wide { width: min(560px, 100%); }
		.wd-shell .modal-lead {
		  margin: 0 0 4px; font-size: 12px; line-height: 18px;
		  color: var(--dsw-alias-label-secondary);
		}
		.wd-shell .export-toolbar {
		  display: flex; align-items: center; gap: 7px;
		  padding: 8px 0 6px;
		}
		.wd-shell .export-count {
		  margin-left: auto; font-size: 11px; line-height: 16px;
		  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
		}
		.wd-shell .export-list {
		  list-style: none; margin: 0; padding: 0;
		  max-height: 42vh; overflow: auto;
		  border: 1px solid var(--wd-hairline); border-radius: 9px;
		}
		.wd-shell .export-row {
		  display: flex; align-items: flex-start; gap: 9px;
		  padding: 8px 11px; cursor: pointer;
		  border-bottom: 1px solid var(--wd-hairline);
		  transition: background .11s ease;
		}
		.wd-shell .export-list li:last-child .export-row { border-bottom: 0; }
		.wd-shell .export-row:hover { background: var(--wd-inset); }
		.wd-shell .export-row[data-selected="true"] { background: var(--wd-primary-soft); }
		.wd-shell .export-row input[type="checkbox"] { accent-color: var(--wd-primary); flex: none; margin: 2px 0 0; }
		.wd-shell .export-row-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
		.wd-shell .export-row-name {
		  font-size: 12px; line-height: 17px; font-weight: 600; color: var(--wd-text);
		  overflow-wrap: anywhere;
		}
		.wd-shell .export-row-meta {
		  font-size: 10.5px; line-height: 15px;
		  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
		}
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

		// src/client/css/blockers.ts
		var BLOCKERS_CSS = `
		/* ---------- blocker chips ---------- */
		.wd-shell .blocker-chips {
		  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
		  padding: 0 0 10px;
		}
		.wd-shell .blocker-chip {
		  display: inline-flex; align-items: center; gap: 6px;
		  height: 26px; padding: 0 10px;
		  border: 1px solid var(--wd-hairline); border-radius: 20px;
		  background: var(--wd-surface); color: var(--dsw-alias-label-secondary);
		  font-size: 11.5px; line-height: 16px; cursor: pointer; white-space: nowrap;
		  transition: background .12s ease, border-color .12s ease, color .12s ease;
		}
		.wd-shell .blocker-chip:hover { background: var(--wd-inset); color: var(--wd-text); }
		.wd-shell .blocker-chip[data-active="true"] {
		  background: var(--wd-primary-soft); border-color: var(--wd-primary);
		  color: var(--wd-primary); font-weight: 600;
		}
		.wd-shell .blocker-chip-count {
		  font-size: 10.5px; font-variant-numeric: tabular-nums;
		  color: var(--dsw-alias-label-tertiary); font-weight: 500;
		}
		.wd-shell .blocker-chip[data-active="true"] .blocker-chip-count { color: var(--wd-primary); }

		/* ---------- blocker groups ---------- */
		.wd-shell .blocker-list { display: flex; flex-direction: column; gap: 10px; }
		.wd-shell .blocker-group {
		  border: 1px solid var(--wd-hairline); border-radius: 10px;
		  background: var(--wd-surface); overflow: hidden;
		}
		.wd-shell .blocker-group[data-level="high"] { border-left: 3px solid var(--wd-red); }
		.wd-shell .blocker-group[data-level="medium"] { border-left: 3px solid var(--wd-amber); }
		.wd-shell .blocker-group-head {
		  display: flex; align-items: center; gap: 8px;
		  padding: 9px 12px; border-bottom: 1px solid var(--wd-hairline);
		  background: var(--wd-inset);
		}
		.wd-shell .blocker-project {
		  display: inline-flex; align-items: baseline; gap: 7px;
		  padding: 0; border: 0; background: none; cursor: pointer;
		  font-size: 12.5px; line-height: 18px; font-weight: 650; color: var(--wd-text);
		  text-align: left; min-width: 0; overflow-wrap: anywhere;
		}
		.wd-shell .blocker-project:hover { color: var(--wd-primary); }
		.wd-shell .blocker-project-id {
		  font-size: 10.5px; font-weight: 500; color: var(--dsw-alias-label-tertiary);
		  font-variant-numeric: tabular-nums;
		}
		.wd-shell .blocker-stage {
		  flex: none; font-size: 10.5px; line-height: 16px;
		  padding: 1px 7px; border-radius: 10px;
		  background: var(--wd-primary-soft); color: var(--wd-primary);
		}
		.wd-shell .blocker-group-count {
		  margin-left: auto; flex: none;
		  font-size: 10.5px; font-variant-numeric: tabular-nums;
		  color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .blocker-rows { list-style: none; margin: 0; padding: 0; }
		.wd-shell .blocker-row {
		  display: flex; flex-direction: column; gap: 2px;
		  padding: 8px 12px; border-bottom: 1px solid var(--wd-hairline);
		}
		.wd-shell .blocker-row:last-child { border-bottom: 0; }
		.wd-shell .blocker-row-headline {
		  font-size: 12px; line-height: 17px; font-weight: 600; color: var(--wd-text);
		  overflow-wrap: anywhere;
		}
		.wd-shell .blocker-row[data-source="missing-amount"] .blocker-row-headline,
		.wd-shell .blocker-row[data-source="no-stage-since"] .blocker-row-headline { color: var(--wd-amber); }
		.wd-shell .blocker-row[data-source="stalled"] .blocker-row-headline,
		.wd-shell .blocker-row[data-source="no-progress"] .blocker-row-headline { color: var(--wd-red); }
		.wd-shell .blocker-row-copy {
		  font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary);
		  overflow-wrap: anywhere;
		}
		.wd-shell .blocker-empty {
		  margin: 0; padding: 22px 12px; text-align: center;
		  font-size: 12px; color: var(--dsw-alias-label-tertiary);
		}

		/* ---------- worklist ---------- */
		.wd-shell .worklist { display: flex; flex-direction: column; gap: 8px; }
		.wd-shell .worklist-items {
		  list-style: none; margin: 0; padding: 0;
		  display: flex; flex-direction: column; gap: 6px;
		}
		.wd-shell .worklist-item {
		  display: flex; align-items: flex-start; gap: 9px;
		  padding: 9px 12px;
		  border: 1px solid var(--wd-hairline); border-radius: 9px;
		  background: var(--wd-inset);
		}
		.wd-shell .worklist-mark {
		  flex: none; font-size: 13px; line-height: 17px;
		  color: var(--wd-amber);
		}
		.wd-shell .worklist-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
		.wd-shell .worklist-label {
		  font-size: 12px; line-height: 17px; font-weight: 600; color: var(--wd-text);
		  overflow-wrap: anywhere;
		}
		.wd-shell .worklist-copy {
		  font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary);
		  overflow-wrap: anywhere;
		}
		.wd-shell .worklist-action {
		  font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary);
		  overflow-wrap: anywhere;
		}
		.wd-shell .worklist-done {
		  margin: 0; padding: 14px 12px; text-align: center;
		  font-size: 12px; color: var(--wd-green);
		}
		.wd-shell .worklist[data-empty="true"] {
		  border: 1px dashed var(--wd-hairline); border-radius: 9px;
		  background: var(--wd-inset);
		}

		/* ---------- detail: worklist section ---------- */
		.wd-shell .dt-worklist { margin-bottom: 14px; }
		.wd-shell .dt-stage-context {
		  display: flex; flex-direction: column; gap: 3px;
		  padding: 12px 14px; margin-bottom: 14px;
		  border: 1px solid var(--wd-hairline); border-left: 3px solid var(--wd-primary);
		  border-radius: 10px; background: var(--wd-surface);
		}
		.wd-shell .dt-stage-context-head {
		  display: flex; align-items: baseline; gap: 8px;
		}
		.wd-shell .dt-stage-context-title {
		  margin: 0; font-size: 13px; line-height: 19px; font-weight: 650; color: var(--wd-text);
		}
		.wd-shell .dt-stage-context-kicker {
		  font-size: 10.5px; line-height: 15px; letter-spacing: .04em;
		  text-transform: uppercase; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .dt-stage-context-copy {
		  margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary);
		}
		.wd-shell .dt-stage-context-next {
		  margin: 0; font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .dt-stage-context-state {
		  align-self: flex-start; margin-top: 2px;
		  font-size: 10.5px; line-height: 16px; padding: 1px 8px; border-radius: 10px;
		}
		.wd-shell .dt-stage-context[data-done="true"] .dt-stage-context-state {
		  background: var(--wd-green-soft); color: var(--wd-green);
		}
		.wd-shell .dt-stage-context[data-done="false"] .dt-stage-context-state {
		  background: var(--wd-amber-soft); color: var(--wd-amber);
		}

		/* ---------- detail: collapsed "other sections" ---------- */
		.wd-shell .dt-fold {
		  border: 1px solid var(--wd-hairline); border-radius: 10px;
		  background: var(--wd-surface); margin-bottom: 14px; overflow: hidden;
		}
		.wd-shell .dt-fold-head {
		  display: flex; align-items: center; gap: 8px;
		  padding: 10px 14px; cursor: pointer;
		  background: var(--wd-inset); border: 0; width: 100%; text-align: left;
		}
		.wd-shell .dt-fold-head:hover { background: var(--wd-canvas); }
		.wd-shell .dt-fold-title {
		  margin: 0; font-size: 12.5px; line-height: 18px; font-weight: 650; color: var(--wd-text);
		}
		.wd-shell .dt-fold-hint {
		  font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .dt-fold-arrow {
		  margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .dt-fold[data-open="true"] .dt-fold-body { display: block; }
		.wd-shell .dt-fold[data-open="false"] .dt-fold-body { display: none; }
		.wd-shell .dt-fold-body { padding: 12px 14px; border-top: 1px solid var(--wd-hairline); }
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

		/* ---------- basic information ---------- */
		.wd-shell .dt-basic-grid {
		  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
		  gap: 7px 18px; margin: 0 0 12px;
		}
		@media (max-width: 900px) { .wd-shell .dt-basic-grid { grid-template-columns: minmax(0, 1fr); } }
		.wd-shell .dt-basic-row { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
		.wd-shell .dt-basic-label {
		  flex: none; width: 108px;
		  font-size: 11px; line-height: 17px; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .dt-basic-value {
		  margin: 0; font-size: 12px; line-height: 17px; font-weight: 500;
		  color: var(--wd-text); overflow-wrap: anywhere;
		}
		.wd-shell .dt-basic-row[data-empty="true"] .dt-basic-value {
		  font-weight: 400; color: var(--dsw-alias-label-tertiary); font-style: italic;
		}
		.wd-shell .dt-basic-decisions {
		  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
		  gap: 12px; padding-top: 11px; border-top: 1px solid var(--wd-hairline);
		}
		@media (max-width: 900px) { .wd-shell .dt-basic-decisions { grid-template-columns: minmax(0, 1fr); } }

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
		.wd-shell .plan-scenarios { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
		/* A scenario row carries its derived state as a left edge: the row's colour is
		   the finding, so it has to survive a glance down the list. */
		.wd-shell .plan-scenario {
		  display: flex; align-items: flex-start; gap: 10px;
		  padding: 8px 10px 8px 9px; border-radius: 8px;
		  background: var(--wd-surface); border: 1px solid var(--wd-hairline);
		  border-left: 3px solid var(--wd-slate);
		}
		.wd-shell .plan-scenario[data-tone="green"] { border-left-color: var(--wd-green); }
		.wd-shell .plan-scenario[data-tone="amber"] { border-left-color: var(--wd-amber); }
		.wd-shell .plan-scenario[data-tone="red"] { border-left-color: var(--wd-red); }
		.wd-shell .plan-scenario-no {
		  flex: none; margin-top: 1px;
		  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		  font-size: 9.5px; line-height: 15px; font-weight: 650; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .plan-scenario[data-tone="green"] .plan-scenario-no { color: var(--wd-green); }
		.wd-shell .plan-scenario[data-tone="amber"] .plan-scenario-no { color: var(--wd-amber); }
		.wd-shell .plan-scenario[data-tone="red"] .plan-scenario-no { color: var(--wd-red); }
		.wd-shell .plan-scenario-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
		.wd-shell .plan-scenario-name { font-size: 11.5px; line-height: 17px; font-weight: 600; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
		.wd-shell .plan-scenario-goal { font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
		.wd-shell .plan-scenario-goal-label { margin-right: 5px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .plan-scenario-tail { flex: none; display: flex; align-items: center; gap: 6px; }
		.wd-shell .plan-scenario-glyph { font-size: 10px; line-height: 14px; }
		.wd-shell .plan-scenario[data-tone="green"] .plan-scenario-glyph { color: var(--wd-green); }
		.wd-shell .plan-scenario[data-tone="amber"] .plan-scenario-glyph { color: var(--wd-amber); }
		.wd-shell .plan-scenario[data-tone="red"] .plan-scenario-glyph { color: var(--wd-red); }
		.wd-shell .plan-scenario[data-tone="slate"] .plan-scenario-glyph { color: var(--wd-slate); }
		.wd-shell .plan-scenario-evidence {
		  font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary);
		  font-variant-numeric: tabular-nums; white-space: nowrap;
		}
		.wd-shell .plan-criterion-status { white-space: nowrap; }

		/* ---------- scenario detail (layer two) ---------- */
		.wd-shell .plan-scenario-open {
		  flex: none; margin-left: 2px; padding: 2px 6px;
		  border: 0; border-radius: 5px; background: transparent; cursor: pointer;
		  font-family: inherit; font-size: 10.5px; line-height: 15px; font-weight: 600;
		  color: var(--wd-primary);
		}
		.wd-shell .plan-scenario-open:hover { background: var(--wd-primary-soft); }
		.wd-shell .plan-scenario-open:focus-visible { outline: 2px solid var(--wd-primary-ring); outline-offset: 1px; }
		.wd-shell .sd-back {
		  align-self: flex-start; margin-bottom: 2px; padding: 3px 8px;
		  border: 1px solid var(--wd-hairline); border-radius: 6px; background: var(--wd-surface); cursor: pointer;
		  font-family: inherit; font-size: 10.5px; line-height: 15px; font-weight: 600; color: var(--wd-primary);
		}
		.wd-shell .sd-back:hover { background: var(--wd-primary-soft); }
		.wd-shell .sd-back:focus-visible { outline: 2px solid var(--wd-primary-ring); outline-offset: 1px; }
		.wd-shell .sd-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-bottom: 9px; border-bottom: 1px solid var(--wd-hairline); }
		.wd-shell .sd-head-no {
		  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		  font-size: 10px; line-height: 15px; font-weight: 650; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .sd-head-name { font-size: 14px; line-height: 20px; font-weight: 650; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
		.wd-shell .sd-evidence { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
		.wd-shell .sd-evidence-row {
		  display: flex; align-items: baseline; gap: 9px; padding: 7px 10px;
		  border-radius: 7px; background: var(--wd-inset);
		}
		.wd-shell .sd-evidence-type { flex: none; font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .sd-evidence-title { flex: 1; min-width: 0; font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
		.wd-shell .sd-evidence-date { flex: none; font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
		.wd-shell .sd-evidence-link { flex: none; font-size: 10.5px; color: var(--wd-primary); text-decoration: none; }
		.wd-shell .sd-evidence-link:hover { text-decoration: underline; }
		.wd-shell .sd-customer { display: flex; flex-direction: column; gap: 4px; padding: 9px 11px; border-radius: 8px; background: var(--wd-inset); }
		.wd-shell .sd-customer-sync { display: flex; align-items: baseline; gap: 8px; font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .sd-customer-date { font-variant-numeric: tabular-nums; }
		.wd-shell .sd-customer-feedback { margin: 0; font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); }
		.wd-shell .sd-gate3 { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
		.wd-shell .sd-gate3-note {
		  font-size: 9.5px; line-height: 14px; font-weight: 650; color: var(--wd-red);
		  padding: 1px 5px; border-radius: 4px; background: var(--wd-red-soft);
		}
		.wd-shell .sd-linked { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
		.wd-shell .sd-linked-row {
		  display: grid; grid-template-columns: 82px 34px 76px minmax(0, 1fr); gap: 8px;
		  align-items: baseline; padding: 6px 10px; border-radius: 7px; background: var(--wd-inset);
		}
		.wd-shell .sd-linked-date { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
		.wd-shell .sd-linked-seq { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
		.wd-shell .sd-linked-change { font-size: 9.5px; line-height: 14px; font-weight: 600; color: var(--wd-primary); }
		.wd-shell .sd-linked-actual { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
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
		/* A one-line caption between the panel header and its body: used by the blocker
		   panel to state "12 of 30 projects blocked" before the list itself. */
		.wd-shell .panel-note {
		  padding: 8px 18px 0;
		  font-size: 11px; line-height: 16px;
		  color: var(--dsw-alias-label-tertiary);
		}

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

		/* A secondary figure nested inside a band block: same box, quieter rules, so it
		   reads as a detail of the chart above it rather than a seventh figure. */
		.wd-shell .pf-subfigure {
		  margin-top: 9px; padding-top: 9px;
		  border-top: 1px dashed var(--wd-hairline);
		  display: flex; flex-direction: column; gap: 6px;
		}
		.wd-shell .pf-subfigure-label {
		  font-size: 10px; line-height: 14px; letter-spacing: .05em;
		  text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600;
		}

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

		@media (prefers-reduced-motion: reduce) {
		  .wd-shell .pcard, .wd-shell .pboard-card, .wd-shell .project-row { transition: none; }
		}
		`;

		// src/client/css/summary.ts
		var SUMMARY_CSS = `
		/* ---------- KPI strip ---------- */
		.wd-shell .kpi-strip {
		  border: 1px solid var(--wd-hairline); border-radius: 12px;
		  background: var(--wd-surface); box-shadow: var(--wd-shadow-1);
		  margin-bottom: 16px; overflow: hidden;
		}
		.wd-shell .kpi-cells {
		  display: grid;
		  grid-template-columns: repeat(5, minmax(0, 1fr));
		}
		@media (max-width: 1180px) { .wd-shell .kpi-cells { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
		@media (max-width: 720px) { .wd-shell .kpi-cells { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

		.wd-shell .kpi-cell {
		  display: flex; flex-direction: column; gap: 2px;
		  padding: 12px 16px;
		  border-right: 1px solid var(--wd-hairline);
		  min-width: 0;
		}
		.wd-shell .kpi-cell:last-child { border-right: 0; }
		/* A hairline above the value carries the tone, so the number itself stays the
		   same ink on every cell: five differently-coloured numbers would read as five
		   different kinds of number. */
		.wd-shell .kpi-label {
		  font-size: 10.5px; line-height: 15px; letter-spacing: .05em;
		  text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600;
		  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		}
		.wd-shell .kpi-value {
		  font-size: 21px; line-height: 28px; font-weight: 650;
		  color: var(--wd-text); font-variant-numeric: tabular-nums;
		  letter-spacing: -.01em;
		}
		.wd-shell .kpi-cell[data-tone="red"] .kpi-value { color: var(--wd-red); }
		.wd-shell .kpi-cell[data-tone="green"] .kpi-value { color: var(--wd-green); }
		.wd-shell .kpi-cell[data-tone="amber"] .kpi-value { color: var(--wd-amber); }
		.wd-shell .kpi-note {
		  font-size: 10.5px; line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		}

		.wd-shell .kpi-stages {
		  display: flex; align-items: center; gap: 10px;
		  padding: 9px 16px;
		  border-top: 1px solid var(--wd-hairline);
		  background: var(--wd-inset);
		  flex-wrap: wrap;
		}
		.wd-shell .kpi-stages-label {
		  flex: none; font-size: 10.5px; line-height: 15px; letter-spacing: .05em;
		  text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600;
		}
		.wd-shell .kpi-stage-chips { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; min-width: 0; }
		.wd-shell .kpi-stage-chip {
		  display: inline-flex; align-items: center; gap: 5px;
		  height: 24px; padding: 0 9px;
		  border: 1px solid var(--wd-hairline); border-radius: 20px;
		  background: var(--wd-surface); color: var(--dsw-alias-label-secondary);
		  font-size: 11px; line-height: 16px; cursor: pointer; white-space: nowrap;
		  transition: background .12s ease, border-color .12s ease, color .12s ease;
		}
		.wd-shell .kpi-stage-chip:hover:not([disabled]) { background: var(--wd-canvas); color: var(--wd-text); }
		.wd-shell .kpi-stage-chip[data-active="true"] {
		  background: var(--wd-primary-soft); border-color: var(--wd-primary);
		  color: var(--wd-primary); font-weight: 600;
		}
		/* A zero bucket stays visible but muted: its existence is information ("nothing
		   reached G3"), and hiding it would make the funnel look shorter than it is. */
		.wd-shell .kpi-stage-chip[data-zero="true"] { opacity: .5; }
		.wd-shell .kpi-stage-count {
		  font-size: 10.5px; font-variant-numeric: tabular-nums;
		  color: var(--dsw-alias-label-tertiary); font-weight: 500;
		}
		.wd-shell .kpi-stage-chip[data-active="true"] .kpi-stage-count { color: var(--wd-primary); }
		.wd-shell .kpi-stages-summary {
		  margin-left: auto; font-size: 10.5px; line-height: 15px;
		  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
		  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		}
		@media (max-width: 900px) { .wd-shell .kpi-stages-summary { display: none; } }

		/* ---------- budget panel ---------- */
		.wd-shell .budget-panel {
		  border: 1px solid var(--wd-hairline); border-radius: 12px;
		  background: var(--wd-surface); box-shadow: var(--wd-shadow-1);
		  padding: 13px 16px 14px;
		  display: flex; flex-direction: column; gap: 11px;
		}
		.wd-shell .budget-head { display: flex; align-items: baseline; gap: 9px; }
		.wd-shell .budget-title { margin: 0; font-size: 13.5px; line-height: 20px; font-weight: 650; }
		.wd-shell .budget-note { margin-left: auto; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .budget-total { display: flex; align-items: baseline; gap: 8px; }
		.wd-shell .budget-total-label {
		  font-size: 10.5px; line-height: 15px; letter-spacing: .05em;
		  text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600;
		}
		.wd-shell .budget-total-value {
		  font-size: 22px; line-height: 30px; font-weight: 650; color: var(--wd-text);
		  font-variant-numeric: tabular-nums; letter-spacing: -.01em;
		}
		.wd-shell .budget-total-unit { margin-left: 4px; font-size: 11px; font-weight: 500; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .budget-bar {
		  display: flex; height: 8px; border-radius: 5px; overflow: hidden;
		  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
		}
		.wd-shell .budget-bar-segment { height: 100%; }
		.wd-shell .budget-bar-segment[data-tone="green"] { background: var(--wd-green); }
		.wd-shell .budget-bar-segment[data-tone="amber"] { background: var(--wd-amber); }
		.wd-shell .budget-rows { margin: 0; display: flex; flex-direction: column; gap: 5px; }
		.wd-shell .budget-row { display: flex; align-items: baseline; gap: 8px; }
		.wd-shell .budget-row-label {
		  flex: none; width: 82px; font-size: 11.5px; line-height: 17px; font-weight: 600;
		  color: var(--dsw-alias-label-secondary);
		}
		.wd-shell .budget-row[data-tone="green"] .budget-row-label { color: var(--wd-green); }
		.wd-shell .budget-row[data-tone="amber"] .budget-row-label { color: var(--wd-amber); }
		.wd-shell .budget-row[data-tone="red"] .budget-row-label { color: var(--wd-red); }
		.wd-shell .budget-row-value {
		  margin: 0; font-size: 11.5px; line-height: 17px;
		  color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums;
		}
		.wd-shell .budget-warning {
		  margin: 0; padding: 7px 10px;
		  border-radius: 8px; background: var(--wd-red-soft); color: var(--wd-red);
		  font-size: 11.5px; line-height: 17px;
		}
		.wd-shell .budget-empty {
		  margin: 0; padding: 16px 4px; text-align: center;
		  font-size: 12px; color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .budget-orgs { display: flex; flex-direction: column; gap: 5px; }
		.wd-shell .budget-orgs-label {
		  font-size: 10.5px; line-height: 15px; letter-spacing: .05em;
		  text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600;
		}
		.wd-shell .budget-org-row {
		  display: grid; grid-template-columns: minmax(0, 1fr) 74px 34px;
		  align-items: center; gap: 8px;
		}
		.wd-shell .budget-org-name {
		  font-size: 11.5px; line-height: 17px; color: var(--wd-text);
		  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}
		.wd-shell .budget-org-system { margin-left: 5px; font-size: 10px; color: var(--dsw-alias-label-tertiary); }
		.wd-shell .budget-org-value {
		  font-size: 10.5px; line-height: 15px; text-align: right;
		  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
		}
		.wd-shell .budget-concentration {
		  margin: 0; font-size: 10.5px; line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		}

		/* ---------- in-stage progress ---------- */
		.wd-shell .stage-progress { display: flex; flex-direction: column; gap: 4px; }
		.wd-shell .stage-progress-row {
		  display: grid; grid-template-columns: 68px minmax(0, 1fr) 82px;
		  align-items: center; gap: 8px;
		}
		.wd-shell .stage-progress-label {
		  font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary);
		  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		}
		.wd-shell .stage-progress-value {
		  font-size: 10.5px; line-height: 15px; text-align: right;
		  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
		}
		.wd-shell .stage-progress-empty {
		  grid-column: 2 / -1; font-size: 10.5px; line-height: 15px;
		  color: var(--dsw-alias-label-tertiary);
		}
		.wd-shell .stage-progress-row[data-empty="true"] { opacity: .7; }
		`;

		// src/client/styles.ts
		var CONSOLE_CSS = [BASE_CSS, CHARTS_CSS, OVERVIEW_CSS, SUMMARY_CSS, DETAIL_CSS, INSIGHTS_CSS, BLOCKERS_CSS].join("\n");

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
		var import_jsx_runtime8 = require("react/jsx-runtime");
		function SidebarGlyph({ size = 18 }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { className: "wd-glyph", width: size, height: size, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "3", y: "4.5", width: "18", height: "15", rx: "3.2", stroke: "currentColor", strokeWidth: "1.6" }),
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "6", y: "8", width: "5.4", height: "3.6", rx: "1.2", fill: "currentColor", opacity: "0.85" }),
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "12.6", y: "8", width: "5.4", height: "3.6", rx: "1.2", fill: "currentColor", opacity: "0.35" }),
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "6", y: "13", width: "12", height: "3.4", rx: "1.2", fill: "currentColor", opacity: "0.5" })
		  ] });
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
		function buildFilterOptions(snapshot) {
		  const projects = snapshot?.projects ?? [];
		  const count = (pick, value) => projects.filter((project) => pick(project) === value).length;
		  const systems = /* @__PURE__ */ new Map();
		  const companies = /* @__PURE__ */ new Map();
		  const stages = /* @__PURE__ */ new Map();
		  const statuses = /* @__PURE__ */ new Map();
		  const types = /* @__PURE__ */ new Map();
		  const bump = (map2, value, label) => {
		    const existing = map2.get(value);
		    if (existing === void 0) map2.set(value, { value, label, count: 1 });
		    else existing.count += 1;
		  };
		  for (const project of projects) {
		    if (project.system !== "") bump(systems, project.system, project.system);
		    if (project.company !== "") bump(companies, project.company, project.company);
		    const stageKey = project.closed ? "closed" : project.stage ?? "unknown";
		    bump(stages, stageKey, stageLabel(snapshotT, stageKey));
		    if (project.status !== "") bump(statuses, project.status, project.status);
		    if (project.pocType !== "") bump(types, project.pocType, project.pocType);
		  }
		  for (const stage of STAGES) {
		    if (!stages.has(stage)) stages.set(stage, { value: stage, label: stageLabel(snapshotT, stage), count: count((project) => project.closed ? "closed" : project.stage ?? "unknown", stage) });
		  }
		  const sortOptions = (map2) => [...map2.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
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
		  const [interval, setIntervalValue] = (0, import_react6.useState)(preference.interval);
		  const [minutes, setMinutes] = (0, import_react6.useState)(String(preference.customMinutes));
		  const parsedMinutes = Number(minutes);
		  const minutesValid = Number.isFinite(parsedMinutes) && parsedMinutes >= CUSTOM_MINUTES_MIN && parsedMinutes <= CUSTOM_MINUTES_MAX;
		  const rows = [
		    { value: "off", label: t("intervalOff") },
		    { value: "10m", label: t("interval10m") },
		    { value: "1h", label: t("interval1h") },
		    { value: "custom", label: t("intervalCustom") }
		  ];
		  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "modal-overlay", role: "presentation", onMouseDown: (event) => {
		    if (event.target === event.currentTarget) onCancel();
		  }, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
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
		        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "modal-header", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h2", { className: "modal-title", children: t("refreshSettings") }) }),
		        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "modal-content", children: [
		          rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "checkbox-row", "data-selected": interval === row.value, children: [
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "radio", name: "work-dashboard-refresh-interval", value: row.value, checked: interval === row.value, onChange: () => setIntervalValue(row.value) }),
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: row.label })
		          ] }, row.value)),
		          interval === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "inline-field", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t("customMinutes") })
		          ] }) : null,
		          interval === "custom" && !minutesValid ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "form-error", children: format(t("customMinutesError"), { min: CUSTOM_MINUTES_MIN, max: CUSTOM_MINUTES_MAX }) }) : null,
		          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "helper-box", children: interval === "off" ? t("autoRefreshOff") : format(t("autoRefreshOn"), {
		            minutes: interval === "10m" ? 10 : interval === "1h" ? 60 : minutesValid ? clampMinutes(parsedMinutes) : 0
		          }) })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "modal-footer", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "spacer" }),
		          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "btn", onClick: onCancel, children: t("cancel") }),
		          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
		  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "empty-state", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "empty-icon", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { width: "34", height: "34", viewBox: "0 0 24 24", fill: "none", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M3.5 7.2l8.5-4.2 8.5 4.2v9.6L12 21l-8.5-4.2V7.2z", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }),
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M3.5 7.2L12 11.6l8.5-4.4M12 11.6V21", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" })
		    ] }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h2", { className: "empty-title", children: t("emptyTitle") }),
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "empty-copy", children: t("emptyCopy") }),
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "btn btn-primary", disabled: busy, onClick: onRefresh, children: busy ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "spinner" }),
		      " ",
		      t("refreshing")
		    ] }) : t("emptyRefresh") }),
		    busy ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "empty-copy", style: { marginTop: 6 }, children: t("refreshingHint") }) : null,
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "empty-meta", children: [
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
		  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "failure", role: "alert", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "failure-text", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "failure-title", children: [
		        "\u26A0 ",
		        t("failureTitle")
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "failure-reason", children: [
		        t("failureReason"),
		        "\uFF1A",
		        message
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "btn btn-small", disabled: busy, onClick: onRetry, children: t("failureRetry") })
		  ] });
		}
		function FilterChips({
		  label,
		  options,
		  selected,
		  onSelect
		}) {
		  if (options.length === 0) return null;
		  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "toolbar-group", role: "group", "aria-label": label, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "toolbar-group-label", children: label }),
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "chip-scroll", children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
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
		          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "filter-chip-count", children: option.count })
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
		  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "toolbar", role: "toolbar", "aria-label": t("filterLabel"), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "toolbar-row", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "search-box", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "search-glyph", "aria-hidden": "true", children: "\u2315" }),
		        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
		        search === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "search-clear", "aria-label": t("searchClear"), title: t("searchClear"), onClick: () => onSearch(""), children: "\xD7" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "view-switch", role: "group", "aria-label": t("viewLabel"), children: viewOptions.map((option) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "sort-switch", role: "group", "aria-label": t("sortLabel"), children: [
		        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("select", { className: "sort-select", value: sortKey, "aria-label": t("sortLabel"), onChange: (event) => onSort(event.target.value), children: sortOptions.map((option) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: option.value, children: option.label }, option.value)) }),
		        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "btn btn-icon btn-small", title: t("sortDirection"), "aria-label": t("sortDirection"), onClick: onSortDirection, children: sortAsc ? "\u2191" : "\u2193" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "toolbar-result", children: format(t("filterResult"), { shown, total }) }),
		      activeCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("button", { type: "button", className: "btn btn-small btn-ghost", onClick: onClearFilters, children: [
		        t("filterClear"),
		        " \xB7 ",
		        format(t("filterActiveNote"), { count: activeCount })
		      ] }) : null
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "toolbar-row toolbar-row-filters", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(FilterChips, { label: t("filterSystem"), options: options.system, selected: filters.system, onSelect: (value) => onFilters({ ...filters, system: value }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(FilterChips, { label: t("filterCompany"), options: options.company, selected: filters.company, onSelect: (value) => onFilters({ ...filters, company: value }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(FilterChips, { label: t("filterStage"), options: options.stage, selected: filters.stage, onSelect: (value) => onFilters({ ...filters, stage: value }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(FilterChips, { label: t("filterStatus"), options: options.status, selected: filters.status, onSelect: (value) => onFilters({ ...filters, status: value }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(FilterChips, { label: t("filterType"), options: options.pocType, selected: filters.pocType, onSelect: (value) => onFilters({ ...filters, pocType: value }) })
		    ] })
		  ] });
		}
		function WorkDashboardPage({ api, locale, t }) {
		  const [snapshot, setSnapshot] = (0, import_react6.useState)(null);
		  const [page, setPage] = (0, import_react6.useState)({ kind: "overview" });
		  const [detail, setDetail] = (0, import_react6.useState)(null);
		  const [loading, setLoading] = (0, import_react6.useState)(true);
		  const [busy, setBusy] = (0, import_react6.useState)(false);
		  const [failure, setFailure] = (0, import_react6.useState)(null);
		  const [statusNote, setStatusNote] = (0, import_react6.useState)(null);
		  const [preference, setPreference] = (0, import_react6.useState)(DEFAULT_PREFERENCE);
		  const [viewPreference, setViewPreference] = (0, import_react6.useState)(DEFAULT_VIEW_PREFERENCE);
		  const [settingsOpen, setSettingsOpen] = (0, import_react6.useState)(false);
		  const [exportOpen, setExportOpen] = (0, import_react6.useState)(false);
		  const [filters, setFilters] = (0, import_react6.useState)(NO_FILTERS);
		  const [search, setSearch] = (0, import_react6.useState)("");
		  const [sortAsc, setSortAsc] = (0, import_react6.useState)(false);
		  const [selectedId, setSelectedId] = (0, import_react6.useState)(null);
		  const [riskBoard, setRiskBoard] = (0, import_react6.useState)(null);
		  const [timeline, setTimeline] = (0, import_react6.useState)(null);
		  const searchRef = (0, import_react6.useRef)(null);
		  const inFlight = (0, import_react6.useRef)(null);
		  const mounted = (0, import_react6.useRef)(true);
		  (0, import_react6.useEffect)(() => {
		    mounted.current = true;
		    return () => {
		      mounted.current = false;
		    };
		  }, []);
		  (0, import_react6.useEffect)(() => {
		    setPreference(readPreference());
		    setViewPreference(readViewPreference());
		  }, []);
		  const load = (0, import_react6.useCallback)(async () => {
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
		  (0, import_react6.useEffect)(() => {
		    void load();
		  }, [load]);
		  const refresh = (0, import_react6.useCallback)(async (manual) => {
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
		  (0, import_react6.useEffect)(() => {
		    if (period === null) return;
		    const timer = setInterval(() => {
		      void refresh(false);
		    }, period);
		    return () => {
		      clearInterval(timer);
		    };
		  }, [period, refresh]);
		  snapshotT = t;
		  const filterOptions = (0, import_react6.useMemo)(() => buildFilterOptions(snapshot), [snapshot, t]);
		  const visibleProjects = (0, import_react6.useMemo)(() => {
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
		  const visibleGaps = (0, import_react6.useMemo)(() => {
		    const order = new Map(visibleProjects.map((project, index) => [project.pocId, index]));
		    return (snapshot?.gaps ?? []).filter((item) => order.has(item.pocId)).sort((left, right) => order.get(left.pocId) - order.get(right.pocId) || right.priority - left.priority);
		  }, [snapshot, visibleProjects]);
		  const visibleAnalysis = (0, import_react6.useMemo)(() => {
		    if (snapshot === null) return null;
		    if (visibleProjects.length === snapshot.projects.length) return snapshot.analysis;
		    return recomputeAnalysis(visibleProjects, visibleGaps);
		  }, [snapshot, visibleProjects, visibleGaps]);
		  const openDetail = (0, import_react6.useCallback)(async (pocId) => {
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
		  const backToOverview = (0, import_react6.useCallback)(() => {
		    setPage({ kind: "overview" });
		    setDetail(null);
		    setFailure(null);
		  }, []);
		  const openRisks = (0, import_react6.useCallback)(() => {
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
		  const openTimeline = (0, import_react6.useCallback)(() => {
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
		  const savePreference = (0, import_react6.useCallback)((next) => {
		    setPreference(next);
		    writePreference(next);
		    setSettingsOpen(false);
		  }, []);
		  const saveViewMode = (0, import_react6.useCallback)((next) => {
		    const updated = { ...viewPreference, viewMode: next };
		    setViewPreference(updated);
		    writeViewPreference(updated);
		  }, [viewPreference]);
		  const saveSortKey = (0, import_react6.useCallback)((next) => {
		    const updated = { ...viewPreference, sortKey: next };
		    setViewPreference(updated);
		    writeViewPreference(updated);
		  }, [viewPreference]);
		  const applyFilter = (0, import_react6.useCallback)((next) => {
		    setFilters((current) => ({ ...current, ...next }));
		  }, []);
		  const clearFilters = (0, import_react6.useCallback)(() => {
		    setFilters(NO_FILTERS);
		    setSearch("");
		  }, []);
		  const onKeyDown = (0, import_react6.useCallback)((event) => {
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
		  const projectBlockers = (0, import_react6.useCallback)((pocId) => {
		    if (snapshot === null) return null;
		    return snapshot.blockers.rows.filter((row) => row.pocId === pocId);
		  }, [snapshot]);
		  const detailNeighbours = (0, import_react6.useMemo)(() => {
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
		  const refreshed = (0, import_react6.useMemo)(() => {
		    if (snapshot?.fetchedAt === null || snapshot?.fetchedAt === void 0) return t("neverRefreshed");
		    return format(t("refreshedAt"), { time: clockOf(snapshot.fetchedAt, activeLocale) });
		  }, [snapshot, t, activeLocale]);
		  const autoNote = period === null ? t("autoRefreshOff") : format(t("autoRefreshOn"), { minutes: Math.round(period / 6e4) });
		  const overviewReady = snapshot !== null && snapshot.cacheReady;
		  const filteredOut = overviewReady && visibleProjects.length === 0;
		  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("style", { children: CONSOLE_CSS }),
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "wd-shell", onKeyDown, tabIndex: -1, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "page", children: [
		        page.kind === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
		          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "module-rail", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("button", { type: "button", className: "module-tab", "data-active": "true", title: t("modulePocHint"), children: [
		              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "module-tab-dot" }),
		              t("modulePoc")
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "module-rail-hint", children: t("moduleMore") })
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "page-header", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "page-header-text", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "page-eyebrow", children: t("eyebrow") }),
		              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h1", { className: "page-title", children: t("modulePoc") }),
		              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "page-subtitle", children: t("subtitle") }),
		              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "page-source", children: [
		                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: format(t("dataSourceLine"), { repository: snapshot?.repository ?? "" }) }),
		                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\xB7" }),
		                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: refreshed })
		              ] })
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "header-actions", children: [
		              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "btn btn-primary", disabled: busy, onClick: () => {
		                void refresh(true);
		              }, children: busy ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
		                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "spinner" }),
		                " ",
		                t("refreshing")
		              ] }) : t("refresh") }),
		              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "btn", onClick: openRisks, disabled: !overviewReady, children: t("risksNav") }),
		              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "btn", onClick: openTimeline, disabled: !overviewReady, children: t("timelineNav") }),
		              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "btn", onClick: () => setExportOpen(true), disabled: !overviewReady, children: t("exportNav") }),
		              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "btn", onClick: () => setSettingsOpen(true), title: autoNote, children: t("refreshSettings") })
		            ] })
		          ] }),
		          overviewReady ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
		        page.kind === "risks" ? riskBoard === null ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(PageLoading, { t, onBack: backToOverview }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(RiskBoardPage, { board: riskBoard, t, onBack: backToOverview, onOpenProject: (pocId) => {
		          void openDetail(pocId);
		        } }) : page.kind === "timeline" ? timeline === null ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(PageLoading, { t, onBack: backToOverview }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(TimelinePage, { timeline, locale: activeLocale, t, onBack: backToOverview, onOpenProject: (pocId) => {
		          void openDetail(pocId);
		        } }) : null,
		        page.kind === "risks" || page.kind === "timeline" ? null : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: page.kind === "overview" ? "page-body" : "detail-body", children: [
		          failure !== null ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { marginBottom: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(FailureBanner, { message: failure, t, busy, onRetry: () => {
		            void refresh(true);
		          } }) }) : null,
		          loading ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "empty-state", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "spinner" }),
		            " ",
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "empty-copy", children: t("loading") })
		          ] }) : page.kind === "detail" ? detail === null ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "empty-state", children: [
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h2", { className: "empty-title", children: t("detailMissing") }),
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "empty-copy", children: format(t("detailMissingCopy"), { pocId: page.pocId }) }),
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "btn", onClick: backToOverview, children: t("back") })
		          ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
		            DetailPage,
		            {
		              detail,
		              gaps: detail.gaps,
		              blockers: projectBlockers(detail.summary.pocId),
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
		          ) : !overviewReady ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(EmptyState, { snapshot, t, busy, onRefresh: () => {
		            void refresh(true);
		          } }) : snapshot === null || visibleAnalysis === null ? null : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
		        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "page-footer", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: autoNote }),
		          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "footer-hint", children: t("keyboardHint") }),
		          statusNote === null ? null : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\xB7" }),
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: statusNote })
		          ] }),
		          overviewReady ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "spacer" }),
		            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: format(t("filterResult"), { shown: visibleProjects.length, total: snapshot.projects.length }) })
		          ] }) : null
		        ] })
		      ] }),
		      settingsOpen ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
		        RefreshSettings,
		        {
		          preference,
		          t,
		          onSave: savePreference,
		          onCancel: () => setSettingsOpen(false)
		        }
		      ) : null,
		      exportOpen ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
		        ExportFormDialog,
		        {
		          api,
		          projects: visibleProjects,
		          t,
		          onClose: () => setExportOpen(false),
		          onError: (message) => setFailure(message)
		        }
		      ) : null
		    ] })
		  ] });
		}
		function PageLoading({ t, onBack }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "page-header", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "page-header-text", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h1", { className: "page-title", children: t("loading") }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "header-actions", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "btn", onClick: onBack, children: t("back") }) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "page-body", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "empty-state", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "spinner" }),
		      " ",
		      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "empty-copy", children: t("loading") })
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
		var import_jsx_runtime9 = require("react/jsx-runtime");
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
		    () => ctx.slots.inject(MAIN_SLOT, () => ctx.slots.register({ name: MAIN_SLOT, key: PANEL_ID }, () => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(WorkDashboardPage, { api, locale: ctx.locale, t }))),
		    "skillre-work-dashboard console page"
		  );
		}

		return module.exports;
	}
});
