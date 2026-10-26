import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

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
