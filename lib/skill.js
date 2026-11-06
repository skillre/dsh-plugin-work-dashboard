/**
 * Registration of the three skills that ship inside this package.
 *
 * The skills live in `skills/<name>/` rather than in the user's profile, so
 * installing the plugin is what publishes them, and uninstalling removes them.
 * That is the point of bundling them: a colleague who installs the dashboard
 * gets the ledger-reading, form-exporting and PR-submitting skills in the same
 * action, on the same version, with no separate install step that can drift.
 *
 * Every step is best-effort by design: `skills` is an optional service, and a
 * profile without it — or a package whose skill file went missing — must still
 * get the dashboard. Missing service, missing file and unusable frontmatter
 * therefore warn and return; nothing throws out of `apply`.
 *
 * The skills are read from disk at registration time rather than inlined into
 * the bundle, so the `scripts/` beside them ship as real files the model can
 * run, and so an operator can read exactly what was published.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/** Names of the bundled skills, in the order they are registered. */
export const BUNDLED_SKILL_NAMES = ['poc-ledger', 'poc-export', 'poc-submit'];
/** File the skill catalog looks for inside a skill directory. */
const SKILL_FILE_NAME = 'SKILL.md';
/**
 * Kebab-case rule the registry applies to a runtime skill name.
 *
 * Restated here on purpose: checking it ourselves turns a registry exception
 * into an explanatory warning, so a typo in the shipped frontmatter reads as
 * "this skill was skipped" instead of "the plugin failed to mount".
 */
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** A YAML frontmatter fence line. */
const FENCE_PATTERN = /^---\s*$/;
/**
 * Absolute path of the directory holding the bundled skills.
 *
 * `src/` and `lib/` both sit directly under the package root, so the same
 * relative URL resolves whether the plugin runs from source (tests) or from the
 * built package (an installed profile).
 */
export function bundledSkillsDirectory() {
    return resolve(fileURLToPath(new URL('../skills/', import.meta.url)));
}
/**
 * Parse the single-line `key: value` frontmatter of a bundled `SKILL.md`.
 *
 * Deliberately not a YAML parser: these files only carry string scalars we
 * control, and a plugin should not pull a YAML dependency to read its own
 * resources. A value may be wrapped in one matching pair of quotes, which are
 * stripped; escape sequences are left exactly as written.
 */
export function parseSkillMarkdown(source) {
    const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
    const first = lines[0];
    if (first === undefined || !FENCE_PATTERN.test(first)) {
        return { ok: false, reason: '缺少 YAML frontmatter 起始分隔行（---）' };
    }
    const fields = new Map();
    let fence = -1;
    for (let index = 1; index < lines.length; index += 1) {
        const line = lines[index] ?? '';
        if (FENCE_PATTERN.test(line)) {
            fence = index;
            break;
        }
        const entry = line.trim();
        if (entry === '' || entry.startsWith('#'))
            continue;
        const colon = entry.indexOf(':');
        if (colon <= 0) {
            return { ok: false, reason: `frontmatter 第 ${index + 1} 行不是 key: value 形式：${entry}` };
        }
        fields.set(entry.slice(0, colon).trim(), unquote(entry.slice(colon + 1).trim()));
    }
    if (fence < 0) {
        return { ok: false, reason: 'frontmatter 缺少结束分隔行（---）' };
    }
    const name = fields.get('name') ?? '';
    if (!SKILL_NAME_PATTERN.test(name)) {
        return { ok: false, reason: `name 必须是 kebab-case，当前为：${name === '' ? '（缺失）' : name}` };
    }
    const description = fields.get('description') ?? '';
    if (description === '')
        return { ok: false, reason: 'description 不能为空' };
    // 正文从结束分隔行之后开始；首尾空白对模型没有意义，一并去掉。
    const content = lines.slice(fence + 1).join('\n').trim();
    if (content === '')
        return { ok: false, reason: '正文为空' };
    const whenToUse = fields.get('whenToUse') ?? '';
    return {
        ok: true,
        skill: {
            name,
            description,
            content,
            // 空的 whenToUse 视为没写，避免把空串当成有效提示交给模型。
            ...(whenToUse === '' ? {} : { whenToUse }),
        },
    };
}
/**
 * Register the bundled skills into the running profile's skill catalog.
 *
 * Called from `apply`, and returns immediately: the actual registration happens
 * on the injected child fiber, whenever the `skills` service exists. Nothing
 * here is order-sensitive, and nothing here can fail a mount — a profile that
 * never provides a skill registry simply never runs the callback.
 *
 * `skills` is deliberately **not** in the plugin's static `inject`: that would
 * hold the whole plugin in PENDING until the registry appears, and a profile
 * without one would never mount the dashboard at all.
 */
export function registerBundledSkills(ctx, options = {}) {
    const logger = loggerOf(ctx);
    ctx.inject(['skills'], (scoped) => {
        const skills = scoped.get('skills');
        if (skills === undefined || skills === null || typeof skills.register !== 'function') {
            logger.warn('work-dashboard: skills 服务不可用于注册，内置 skill 未注册（看板不受影响）');
            return;
        }
        publishBundledSkills(scoped, skills, logger, options);
    });
}
/**
 * Read, parse and publish every bundled skill on the fiber that owns the injection.
 *
 * One bad skill must not take the others down: each is registered inside its
 * own try/catch and its failure is a warning. A bundled skill is an addition to
 * the profile, never a reason to fail a mount.
 */
function publishBundledSkills(ctx, skills, logger, options) {
    const root = options.dir ?? bundledSkillsDirectory();
    for (const name of BUNDLED_SKILL_NAMES) {
        const directory = join(root, name);
        const skillFile = join(directory, SKILL_FILE_NAME);
        if (!existsSync(skillFile)) {
            logger.warn(`work-dashboard: 内置 skill 文件不存在（${skillFile}），已跳过 ${name}`);
            continue;
        }
        let source;
        try {
            source = readFileSync(skillFile, 'utf8');
        }
        catch (error) {
            logger.warn(`work-dashboard: 读取内置 skill 失败（${skillFile}）：${messageOf(error)}`);
            continue;
        }
        const parsed = parseSkillMarkdown(source);
        if (!parsed.ok) {
            logger.warn(`work-dashboard: 内置 skill 的 frontmatter 不可用（${skillFile}）：${parsed.reason}`);
            continue;
        }
        if (parsed.skill.name !== name) {
            logger.warn(`work-dashboard: 内置 skill 目录名与 frontmatter name 不一致（${name} ≠ ${parsed.skill.name}），已跳过`);
            continue;
        }
        const skill = parsed.skill;
        let dispose;
        try {
            dispose = skills.register({
                name: skill.name,
                description: skill.description,
                content: skill.content,
                source: 'bundled',
                path: skillFile,
                // 模型据此把 skill 里提到的相对路径解析到 scripts/ 等资源上。
                resourceBase: { kind: 'directory', path: directory },
                ...(skill.whenToUse === undefined ? {} : { whenToUse: skill.whenToUse }),
            });
        }
        catch (error) {
            logger.warn(`work-dashboard: 注册内置 skill ${name} 失败：${messageOf(error)}`);
            continue;
        }
        try {
            // 绑在注入自己的 fiber 上：该 fiber 的撤销登记在父 fiber，所以插件卸载时会一并撤销；
            // 服务被替换时回调重跑，也会先撤掉上一次的注册。绑定失败则立刻回滚，不留无主目录项。
            ctx.effect(() => dispose, `work-dashboard: bundled skill ${skill.name}`);
        }
        catch (error) {
            dispose();
            logger.warn(`work-dashboard: 绑定内置 skill ${name} 生命周期失败：${messageOf(error)}`);
            continue;
        }
        // The one line that proves the whole path worked at runtime: it prints only
        // when the skills service was present AND the file parsed AND the registry
        // accepted the payload. Integration verification greps the boot log for it.
        //
        // Written to stderr rather than only through `ctx.logger`: a DSH deployment
        // may not route the Host logger anywhere an operator (or a test harness) can
        // read, and this single lifecycle line is the only evidence that the skills
        // actually reached the catalog. It is one line per skill, on mount only.
        logger.info(`work-dashboard: 内置 skill 已注册（${skill.name} ← ${skillFile}）`);
        process.stderr.write(`[work-dashboard] skill registered: ${skill.name}\n`);
    }
}
/** Strip one matching pair of single or double quotes; escapes are not interpreted. */
function unquote(value) {
    if (value.length < 2)
        return value;
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'"))
        return value.slice(1, -1);
    return value;
}
/** Best-effort error text; a diagnostic must never be the thing that throws. */
function messageOf(error) {
    return error instanceof Error ? error.message : String(error);
}
/** Best-effort logger access; a context without a logger still mounts. */
function loggerOf(ctx) {
    const logger = ctx.logger;
    return {
        info: (message) => { logger?.info?.(message); },
        warn: (message) => { logger?.warn?.(message); },
    };
}
