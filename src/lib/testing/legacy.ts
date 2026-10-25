import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

/**
 * Runs one of the legacy page's scripts (index.html, the parity reference) in a sandbox with a
 * stand-in DOM, and returns the functions it defines, so tests can compare them with the port.
 */

type Fn = (...args: never[]) => unknown;

/**
 * A stand-in for any DOM object: it keeps whatever is written to it (`value`, `textContent`,
 * `onclick`…), starts with empty strings and objects for the usual fields, and anything else read
 * from it is another stand-in, callable, so `el.getContext('2d').fillRect()` or
 * `el.parentNode.removeChild()` run without a browser.
 */
export type Fake = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function fake(): Fake {
  const store: Record<PropertyKey, unknown> = {
    value: '',
    textContent: '',
    innerHTML: '',
    className: '',
    disabled: false,
    checked: false,
    style: {},
    dataset: {},
    children: [],
    childNodes: [],
    options: []
  };
  return new Proxy(function () {}, {
    get(_, prop) {
      if (prop in store) return store[prop];
      if (typeof prop === 'symbol' || prop === 'then' || prop === 'toJSON') return undefined;
      if (prop === 'querySelectorAll' || prop === 'getElementsByTagName') return () => [];
      if (prop === 'querySelector') return () => null;
      return fake();
    },
    set(_, prop, v) {
      store[prop] = v;
      return true;
    },
    apply: () => fake()
  }) as Fake;
}

export interface Legacy {
  /** The script's functions, by name. */
  fn: Record<string, Fn>;
  /** The element with this id, as the script's `$` / `getElementById` sees it. */
  el(id: string): Fake;
  /** Replace the sandbox's `Math.random`. */
  setRandom(r: () => number): void;
  /** Read or write a variable the script declared with `let` (e.g. `dCurrent`). */
  get(name: string): unknown;
  set(name: string, value: unknown): void;
}

const html = () => readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

/**
 * Load the `<script>` block of index.html that contains `marker`, exposing `names` (functions or
 * constants declared at the top of the block's IIFE) and accessors for the `let` bindings in
 * `letNames`.
 */
export function loadLegacy(marker: string, names: string[], letNames: string[] = []): Legacy {
  const src = html();
  const at = src.indexOf(marker);
  if (at < 0) throw new Error(`marker not found: ${marker}`);
  const start = src.lastIndexOf('<script>', at) + '<script>'.length;
  const end = src.indexOf('</script>', at);
  const code = src.slice(start, end);
  const close = code.lastIndexOf('})();');
  if (close < 0) throw new Error('not an IIFE block');
  return run(code.slice(0, close), code.slice(close), names, letNames);
}

/**
 * Load whole `<script>` blocks that declare at the top level (no IIFE), in order: the page's
 * shared audio, score and tab code. Each block is found by a `marker` it contains.
 */
export function loadLegacyScripts(markers: string[], names: string[]): Legacy {
  const src = html();
  const code = markers
    .map((m) => {
      const at = src.indexOf(m);
      if (at < 0) throw new Error(`marker not found: ${m}`);
      return src.slice(
        src.lastIndexOf('<script>', at) + '<script>'.length,
        src.indexOf('</script>', at)
      );
    })
    .join('\n');
  return run(code, '', names, []);
}

/**
 * Load the legacy code from `from` up to (not including) `to`, wrapped in a function scope, for
 * definitions that sit inside a function rather than at a block's top (Harmonia 3D's, inside
 * `start()`). `prelude` declares what the slice expects from its surroundings.
 */
export function loadLegacySlice(
  from: string,
  to: string,
  names: string[],
  letNames: string[] = [],
  prelude = ''
): Legacy {
  const src = html();
  const a = src.indexOf(from);
  const b = src.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`slice not found: ${from} … ${to}`);
  return run(`(function () {\n${prelude}\n${src.slice(a, b)}`, '})();', names, letNames);
}

function run(head: string, tail: string, names: string[], letNames: string[]): Legacy {
  const accessors = letNames
    .map((n) => `${JSON.stringify(n)}: [() => ${n}, (v) => { ${n} = v; }]`)
    .join(',');
  const code =
    head +
    `;globalThis.__legacy = { ${names.join(', ')} }; globalThis.__lets = { ${accessors} };\n` +
    tail;

  const elements = new Map<string, Fake>();
  const el = (id: string) => {
    if (!elements.has(id)) elements.set(id, fake());
    return elements.get(id)!;
  };
  const document = fake();
  document.readyState = 'loading';
  document.getElementById = el;
  const ctx: Record<string, unknown> = {
    document,
    console,
    setTimeout: () => 0,
    clearTimeout() {},
    requestAnimationFrame: () => 0,
    navigator: fake(),
    $: el
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'index.html' });
  const lets = ctx.__lets as Record<string, [() => unknown, (v: unknown) => void]>;
  return {
    fn: ctx.__legacy as Record<string, Fn>,
    el,
    setRandom(r) {
      (vm.runInContext('Math', ctx) as Math).random = r;
    },
    get: (n) => lets[n][0](),
    set: (n, v) => lets[n][1](v)
  };
}
