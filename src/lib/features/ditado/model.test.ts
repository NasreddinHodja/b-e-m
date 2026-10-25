import { describe, expect, it } from 'vitest';
import { buildModel, flattenEvents, toLily } from './model';

const input = {
  tonicName: 'C',
  scaleType: 'major' as const,
  meter: '4/4' as const,
  motor: 'basic' as const,
  bars: 1
};

describe('buildModel', () => {
  it('attaches pitches to the rhythm, bar by bar', () => {
    const m = buildModel([0, 2, 4, 0], [[1, 1, 1, 1]], input);
    expect(m.eventsPerBar[0].map((c) => c.offset)).toEqual([0, 2, 4, 0]);
    expect(m.keySig.vexKey).toBe('C');
    expect(m.metricGroups).toHaveLength(4);
  });

  it('orders a beat group’s notes by pitch, not time (legacy bug, kept)', () => {
    const m = buildModel([7, 0, 4, 2, 0, 0], [[0.5, 0.5, 0.5, 0.5, 1, 1]], input);
    expect(m.eventsPerBar[0].slice(0, 4).map((c) => c.offset)).toEqual([0, 7, 2, 4]);
  });

  it('refuses pitches and rhythm that don’t line up', () => {
    expect(() => buildModel([0, 2], [[1, 1, 1, 1]], input)).toThrow(/desalinhado/);
    expect(() => buildModel([0], [], input)).toThrow(/Padrões rítmicos/);
  });
});

describe('flattenEvents', () => {
  it('merges tied cells into one sounding note', () => {
    const m = buildModel([0, 4, 7, 9, 0], [[0.5, 1, 0.5, 1, 1]], input);
    expect(flattenEvents(m).map((e) => [e.offset, e.dur])).toEqual([
      [0, 0.5],
      [4, 1],
      [7, 0.5],
      [9, 1],
      [0, 1]
    ]);
  });
});

describe('toLily', () => {
  it('writes the key, meter, tempo, pitches and ties', () => {
    const m = buildModel([0, 4, 7, 9, 0], [[0.5, 1, 0.5, 1, 1]], input);
    const ly = toLily(m, 60, 72);
    expect(ly).toContain('\\version "2.24.0"');
    expect(ly).toContain("{ \\key c \\major \\time 4/4 c'8 e'8~ e'8 g'8 a'4 c'4 | }");
    expect(ly).toContain('\\midi { \\tempo 4 = 72 }');
  });

  it('names modes and minors in the key', () => {
    const m = buildModel([0, 0, 0, 0], [[1, 1, 1, 1]], {
      ...input,
      tonicName: 'D',
      scaleType: 'dorian'
    });
    expect(toLily(m, 62, 70)).toContain('\\key d \\dorian');
    const n = buildModel([0, 0, 0, 0], [[1, 1, 1, 1]], {
      ...input,
      tonicName: 'Bb',
      scaleType: 'harmonic'
    });
    expect(toLily(n, 58, 70)).toContain('\\key bes \\minor');
  });
});
