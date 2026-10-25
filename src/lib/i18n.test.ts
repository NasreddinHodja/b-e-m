import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { QUIZ_CHORDS, TEACHER_CHORDS, FUNC_NAMES } from './features/acordes/chords';
import { aFuncLabel, chordTypeLabel, funcName } from './features/acordes/labels';
import { INTERVALS } from './features/intervalos/intervals';
import {
  intervalName,
  intervalShort,
  intervalSymbol,
  intervalTheory
} from './features/intervalos/labels';
import { PILARES } from './features/pratica/pilares';
import { REGUA, REFERENCES } from './features/regua/intervals';
import { referenceLabel, reguaFull, reguaQuality } from './features/regua/labels';
import { m } from './paraglide/messages.js';
import { getLocale } from './paraglide/runtime.js';

const catalogue = (locale: string) =>
  JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Record<string, string>;

describe('the message catalogues', () => {
  it('have the same keys in Portuguese and English, none empty', () => {
    const pt = catalogue('pt-br');
    const en = catalogue('en');
    expect(Object.keys(en).sort()).toEqual(Object.keys(pt).sort());
    for (const [k, v] of [...Object.entries(pt), ...Object.entries(en)])
      expect(v.trim(), k).not.toBe('');
  });

  it('use the same parameters in both languages', () => {
    const pt = catalogue('pt-br');
    const en = catalogue('en');
    const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort();
    for (const k of Object.keys(pt)) {
      if (k === '$schema') continue;
      expect(params(en[k]), k).toEqual(params(pt[k]));
    }
  });
});

// In Portuguese the labels must read exactly as the legacy page's tables, which the parity tests
// pin down; the tables themselves stay as the legacy data.
describe('Portuguese labels match the legacy tables', () => {
  it('runs in Portuguese', () => expect(getLocale()).toBe('pt-br'));

  it('chords', () => {
    for (const c of [...TEACHER_CHORDS.major, ...TEACHER_CHORDS.minor, ...QUIZ_CHORDS.major]) {
      expect(aFuncLabel(c)).toBe(c.aFunc);
      expect(chordTypeLabel(c)).toBe(c.type);
    }
    for (let s = 0; s < 12; s++) expect(funcName(s)).toBe(FUNC_NAMES[s]);
  });

  it('intervals', () => {
    for (const iv of INTERVALS) {
      expect(intervalSymbol(iv)).toBe(iv.symbol);
      expect(intervalShort(iv)).toBe(iv.short);
      expect(intervalName(iv)).toBe(iv.name);
      expect(intervalTheory(iv)).toBe(iv.theory);
    }
  });

  it('the ruler and the pillars', () => {
    for (const iv of REGUA) {
      expect(reguaFull(iv)).toBe(iv.full);
      expect(reguaQuality(iv)).toBe(iv.quality);
    }
    for (const r of REFERENCES) expect(referenceLabel(r.name)).toBe(r.label);
    PILARES.forEach((p, i) => {
      expect(m[`pilar_${i}_title` as 'pilar_0_title']()).toBe(p.titulo);
      expect(m[`pilar_${i}_desc` as 'pilar_0_desc']()).toBe(p.desc);
    });
  });
});
