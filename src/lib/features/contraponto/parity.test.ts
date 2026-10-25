import { beforeAll, describe, expect, it } from 'vitest';
import { loadLegacy, type Legacy } from '#lib/testing/legacy.js';
import { seededRandom } from '#lib/testing/random.js';
import { contraponto, type Voice } from './contraponto.svelte.js';
import { cls, parse, spellNear } from './rules';

// The port against the legacy page's own counterpoint code (legacy/index.html): the same voices must
// give the same issues, summary and LilyPond.

let L: Legacy;
beforeAll(() => {
  L = loadLegacy(
    "const $ = id => document.getElementById('ct-' + id);",
    ['parse', 'cls', 'spellNear', 'run', 'generateLilyPond'],
    ['V', 'I']
  );
});

const LETTERS = 'CDEFGAB';

/** Random voices: a cantus and 1–3 added voices, mostly near-valid, sometimes broken. */
function randomVoices(seed: number): Voice[] {
  const r = seededRandom(seed);
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const note = (oct: number) =>
    pick(LETTERS.split('')) + (r() < 0.15 ? pick(['#', 'b']) : '') + (oct + (r() < 0.3 ? 1 : 0));
  const n = 3 + Math.floor(r() * 9);
  const cf = Array.from({ length: n }, () => note(4));
  const voices: Voice[] = [{ cf: true, sp: 1, on: true, txt: cf.join(' ') }];
  const extra = 1 + Math.floor(r() * 3);
  for (let v = 0; v < extra; v++) {
    const sp = r() < 0.5 ? 1 : 2;
    const len = sp === 1 ? n : 2 * n - 1;
    const count = r() < 0.85 ? len : len + pick([-1, 1]);
    const toks = Array.from({ length: Math.max(0, count) }, () => note(r() < 0.5 ? 4 : 3));
    if (sp === 2 && r() < 0.3) toks[0] = 'r';
    if (r() < 0.05) toks.push('X9');
    voices.push({ cf: false, sp, on: true, txt: toks.join(r() < 0.2 ? ', ' : ' ') });
  }
  return voices;
}

describe('Contraponto parity with the legacy page', () => {
  it('parses, classifies and spells notes the same', () => {
    for (const l of LETTERS)
      for (const acc of ['', '#', 'b', '##', 'bb'])
        for (const o of [-1, 0, 3, 4, 9]) {
          const t = l + acc + o;
          expect(parse(t), t).toEqual(L.fn.parse(...([t] as never[])) ?? null);
          expect(parse(t.toLowerCase()), t).toEqual(
            L.fn.parse(...([t.toLowerCase()] as never[])) ?? null
          );
        }
    for (let st = 0; st < 16; st++)
      for (let se = 0; se < 26; se++) expect(cls(st, se)).toBe(L.fn.cls(...([st, se] as never[])));
    for (let m = 30; m < 100; m++)
      for (const acc of ['', '#', 'b'])
        expect(spellNear(m, acc)).toBe(L.fn.spellNear(...([m, acc] as never[])));
  });

  it('finds the same issues, summary and LilyPond for the same voices', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const voices = randomVoices(seed);
      const bpm = 40 + (seed % 140);

      contraponto.voices = structuredClone(voices);
      contraponto.bpm = bpm;
      L.set(
        'V',
        voices.map((v) => ({ ...v, cf: v.cf ? 1 : 0 }))
      );
      L.el('ct-bpm').value = String(bpm);
      L.fn.run();

      const where = `seed ${seed}: ${voices.map((v) => v.txt).join(' / ')}`;
      expect(
        contraponto.issues.map((i) => ({ ...i, m: i.m() })),
        where
      ).toEqual(JSON.parse(JSON.stringify(L.get('I'))));
      expect(contraponto.summary.text, where).toBe(L.el('ct-sum').textContent);
      expect(contraponto.generateLily(), where).toBe(
        L.fn.generateLilyPond() || L.el('ct-lyout').value
      );
    }
  });
});
