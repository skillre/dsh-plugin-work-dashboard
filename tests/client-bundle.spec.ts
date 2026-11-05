import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'

/**
 * Client bundle envelope tests.
 *
 * The shell serves a `dsh.client` bundle as one lazy registration through
 * `window.__ModuleLoader__.load({ id, factory })`, and the envelope's `require`
 * resolves only the browser module table. These tests load the BUILT bundle
 * exactly the way the shell does, so a broken envelope or a stray non-`react`
 * import fails here instead of as a blank panel in the real UI.
 */

/** The minimal `window.__ModuleLoader__` the shell provides. */
interface Registration {
  id: string
  factory: (require: (name: string) => unknown) => Record<string, unknown>
}

/** Load `lib/client.js` in a fresh sandbox and return its module exports. */
async function loadBundle(): Promise<{ exports: Record<string, unknown>; registrations: Registration[]; required: string[] }> {
  const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  const registrations: Registration[] = []
  const required: string[] = []
  const reactStub = {
    createElement: () => null,
    Fragment: {},
    useState: (initial: unknown) => [typeof initial === 'function' ? (initial as () => unknown)() : initial, () => {}],
    useEffect: () => {},
    useMemo: (factory: () => unknown) => factory(),
    useRef: (value: unknown) => ({ current: value }),
    useCallback: (callback: unknown) => callback,
    jsx: () => null,
    jsxs: () => null,
    jsxDEV: () => null,
  }
  const window = {
    __ModuleLoader__: {
      load: (registration: Registration) => { registrations.push(registration) },
    },
  }
  const require = (name: string) => {
    required.push(name)
    // `react` and `react/jsx-runtime` are both platform seed words: the shipped
    // renderer itself requires them, so they resolve from the static module
    // table. Any OTHER module would need a `dsh.client.external` declaration
    // and is a defect.
    if (name === 'react' || name === 'react/jsx-runtime') return reactStub
    throw new Error(`The envelope must not require ${name}`)
  }
  // The envelope is a CommonJS body wrapped in a factory; running it in a
  // function scope with the same globals reproduces the shell's evaluation.
  const run = new Function('window', 'require', source)
  run(window, require)
  const registration = registrations[0]
  if (registration === undefined) throw new Error('the bundle registered nothing')
  return { exports: registration.factory(require), registrations, required }
}

describe('client bundle envelope', () => {
  it('emits the automatic JSX runtime, never a bare React.createElement', async () => {
    // Regression: the classic JSX transform emitted `React.createElement` with no
    // React binding in scope, so the sidebar entry threw "React is not defined"
    // and the whole slot crashed at runtime.
    const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
    expect(source).not.toContain('React.createElement')
    expect(source).toContain('react/jsx-runtime')
  })

  it('registers exactly one module under the package name', async () => {
    const { registrations } = await loadBundle()
    expect(registrations).toHaveLength(1)
    expect(registrations[0]?.id).toBe('@skillre/dsh-plugin-work-dashboard')
  })

  it('requires nothing but react', async () => {
    const { required } = await loadBundle()
    // The factory call requires react again; dedupe for the assertion. The
    // jsx-runtime entry appears only when the build emits automatic JSX calls,
    // so the contract is "nothing beyond the seeded react modules".
    expect([...new Set(required)].sort()).toEqual(
      expect.arrayContaining(['react']),
    )
    expect([...new Set(required)].every((name) => name === 'react' || name === 'react/jsx-runtime')).toBe(true)
  })

  it('exports the Cordis client-plugin contract', async () => {
    const { exports } = await loadBundle()
    expect(exports.apply).toBeTypeOf('function')
    expect(exports.inject).toEqual(['slots', 'locale', 'connection'])
    expect('default' in exports).toBe(false)
  })

  it('registers the sidebar entry and the main panel through the slot service', async () => {
    const { exports } = await loadBundle()
    type Registered = { name: string; id?: string; key?: string; order?: number; label?: string }
    const registrations: Registered[] = []
    const disposers: Array<() => void> = []
    const ctx = {
      slots: {
        inject: (_slot: string, callback: () => unknown) => callback(),
        register: (options: { name: string; id?: string; key?: string; order?: number; label?: string | (() => string) }): (() => void) => {
          const entry: Registered = { name: options.name }
          if (options.id !== undefined) entry.id = options.id
          if (options.key !== undefined) entry.key = options.key
          if (options.order !== undefined) entry.order = options.order
          if (options.label !== undefined) entry.label = typeof options.label === 'function' ? options.label() : options.label
          registrations.push(entry)
          return () => {}
        },
      },
      locale: {
        getSnapshot: () => ({ active: 'zh', locales: [{ id: 'zh' }], revision: 1 }),
        subscribe: () => () => {},
        register: () => () => {},
        bind: () => (key: string) => key,
      },
      connection: { rpc: { call: async () => ({ ok: true, value: {} }) } },
      effect: (callback: () => unknown): (() => void) => {
        const dispose = callback()
        if (typeof dispose === 'function') disposers.push(dispose as () => void)
        return () => {}
      },
    }
    ;(exports.apply as (context: unknown) => void)(ctx)
    const sidebar = registrations.find((entry) => entry.name === 'sidebar.panellist')
    const main = registrations.find((entry) => entry.name === 'main')
    expect(sidebar).toMatchObject({ id: 'skillre-work-dashboard', order: 95 })
    expect(main).toMatchObject({ key: 'skillre-work-dashboard' })
    // The label is a thunk, so it follows the locale without re-registering.
    expect(sidebar?.label).toBeTypeOf('string')
    expect(disposers.length).toBeGreaterThan(0)
  })
})
