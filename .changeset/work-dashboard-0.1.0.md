---
"@skillre/dsh-plugin-work-dashboard": minor
---

Ship 工作看板: a multi-module operations dashboard, with POC 运营 as the first
module.

The plugin was renamed from `@skillre/dsh-plugin-poc-console` to
`@skillre/dsh-plugin-work-dashboard` and restructured as a container: the
sidebar entry and plugin card read 工作看板, the page title is the module name,
the shell identity sits in an eyebrow, and a module tab rail marks the one
module today while leaving a visible seat for future ones.

The entire 导入数据 module is removed — the Host actions, the
pr/validate/diff/template modules, the import and create pages, and the
Draft-PR write path — so the plugin is strictly read-only again: it reads the
ledger, computes the eight gap rules, and produces local export files, but
never writes to the repository.

The visual layer was rebuilt around a three-level surface ramp with a single
shadow ramp, gradient primary buttons, accent-backed stat cards, layered
panels with tinted headers, a module tab strip, uppercase table headers,
ring-highlighted current-stage markers and a full dark-theme palette. The
client bundle now emits the automatic `react/jsx-runtime`; the classic
transform it used before crashed the sidebar entry with "React is not defined".

Carried over unchanged: the eight hard-coded gap rules, the four dimensions
rendered as four separate cells, the G0→G4 rail driven by the ledger's own
gate records, the four refresh cadences in `localStorage`, the severity-ordered
risk board, the newest-first global timeline, and the self-contained HTML
export form whose YAML output round-trips losslessly.
