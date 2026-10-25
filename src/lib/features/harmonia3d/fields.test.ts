import { describe, expect, it } from 'vitest';
import { FIELDS, RELATIVE, colorKey, pcOf, pretty, spellScale, toneNames } from './fields';

describe('spelling', () => {
  it('spells each scale with one note per letter', () => {
    expect(spellScale('C', 'maj')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(spellScale('F#', 'maj')).toEqual(['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯']);
    expect(spellScale('Db', 'maj')).toEqual(['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C']);
    expect(spellScale('A', 'min')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });

  it('names a chord’s tones by stacked thirds', () => {
    const V = FIELDS.maj.deg[4];
    expect(toneNames(V, 'G')).toEqual(['G', 'B', 'D', 'F']);
    const vii = FIELDS.maj.deg[6];
    expect(toneNames(vii, 'B')).toEqual(['B', 'D', 'F', 'A']);
  });

  it('reads accidentals of any kind', () => {
    expect(pcOf('C♯')).toBe(1);
    expect(pcOf('B𝄫')).toBe(9);
    expect(pcOf('Cb')).toBe(11);
    expect(pretty('Bb')).toBe('B♭');
  });
});

describe('fields', () => {
  it('stacks a triad’s thirds to a fifth, and a seventh’s to 10 or 11', () => {
    for (const f of ['maj', 'min'] as const) {
      for (const d of FIELDS[f].deg) {
        expect([6, 7]).toContain(d.v + d.h);
        expect([9, 10, 11]).toContain(d.v + d.h + d.s);
      }
    }
  });

  it('switches to the relative key and back', () => {
    for (const t of FIELDS.maj.tonics) {
      const rel = RELATIVE.maj[t];
      expect(FIELDS.min.tonics).toContain(rel);
      expect(RELATIVE.min[rel]).toBe(t);
    }
  });
});

describe('colorKey', () => {
  it('colours dominant red, major green, minor gold, diminished ivory', () => {
    const [I, ii, , , V, , vii] = FIELDS.maj.deg;
    expect([I, ii, V, vii].map((d) => colorKey(d, false))).toEqual([
      'green',
      'gold',
      'red',
      'ivory'
    ]);
    expect([I, ii, V, vii].map((d) => colorKey(d, true))).toEqual([
      'green',
      'gold',
      'red',
      'ivory'
    ]);
  });
});
