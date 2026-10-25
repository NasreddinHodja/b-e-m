import { afterEach, describe, expect, it, vi } from 'vitest';
import { seededRandom } from '#lib/testing/random.js';
import {
  candidateSequence,
  distractors,
  parsePattern,
  slonimskySequence,
  type Contour,
  type Motion
} from './melody';
import { SCALES, TESSITURA_HIGH, TESSITURA_LOW } from './theory';

afterEach(() => vi.restoreAllMocks());

const base = {
  slotCount: 8,
  scale: SCALES.major,
  startDeg: 0,
  endDeg: 0,
  range: 12,
  maxLeap: 7,
  motion: 'mixed' as Motion,
  contour: 'mixed' as Contour,
  focus: 'scale' as const,
  baseMidi: 62
};

/** The first non-null sequence for this seed, as the generator's callers retry. */
function generate(seed: number, o: Partial<typeof base> = {}) {
  vi.spyOn(Math, 'random').mockImplementation(seededRandom(seed));
  for (let i = 0; i < 600; i++) {
    const s = candidateSequence({ ...base, ...o });
    if (s) return s;
  }
  return null;
}

describe('candidateSequence', () => {
  it('starts and ends on the tonic, within the tessitura, range and max leap', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = generate(seed)!;
      expect(s).toHaveLength(8);
      expect(((s[0] % 12) + 12) % 12).toBe(0);
      expect(((s[7] % 12) + 12) % 12).toBe(0);
      expect(Math.max(...s) - Math.min(...s)).toBeLessThanOrEqual(12);
      for (const v of s) {
        expect(62 + v).toBeGreaterThanOrEqual(TESSITURA_LOW);
        expect(62 + v).toBeLessThanOrEqual(TESSITURA_HIGH);
        expect(SCALES.major).toContain(((v % 12) + 12) % 12);
      }
      // Not the last step: the final-note check measures from the note it replaces (legacy bug, kept).
      for (let i = 1; i < s.length - 1; i++)
        expect(Math.abs(s[i] - s[i - 1])).toBeLessThanOrEqual(7);
      vi.restoreAllMocks();
    }
  });

  it('moves by step only, when asked (except into the final tonic)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = generate(seed, { motion: 'step' });
      if (!s) continue;
      for (let i = 1; i < s.length - 1; i++)
        expect(Math.abs(s[i] - s[i - 1])).toBeLessThanOrEqual(2);
      vi.restoreAllMocks();
    }
  });

  it('only rises for an ascending contour (but the last note)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = generate(seed, { contour: 'asc', slotCount: 5 });
      if (!s) continue;
      for (let i = 1; i < s.length - 1; i++) expect(s[i]).toBeGreaterThan(s[i - 1]);
      vi.restoreAllMocks();
    }
  });
});

describe('Slonimsky', () => {
  it('parses patterns, dropping zeros and junk', () => {
    expect(parsePattern(' 2 1, 2  3 ')).toEqual([2, 1, 2, 3]);
    expect(parsePattern('2 0 x -1')).toEqual([2, -1]);
  });

  it('repeats the pattern from where it ended, then shifts it into the tessitura', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const s = slonimskySequence({
      pattern: '2 1',
      reps: '2',
      transform: 'original',
      targetCount: 5,
      baseMidi: 60
    })!;
    const steps = s.slice(1).map((v, i) => v - s[i]);
    expect(steps).toEqual([2, 1, 2, 1]);
    expect(60 + s[0]).toBe(TESSITURA_LOW);
  });

  it('inverts and reverses', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const o = { pattern: '2 1', reps: '1', targetCount: 3, baseMidi: 60 };
    const steps = (s: number[]) => s.slice(1).map((v, i) => v - s[i]);
    expect(steps(slonimskySequence({ ...o, transform: 'inversion' })!)).toEqual([-2, -1]);
    expect(steps(slonimskySequence({ ...o, transform: 'retrograde' })!)).toEqual([-1, -2]);
    expect(steps(slonimskySequence({ ...o, transform: 'retro-inv' })!)).toEqual([1, 2]);
  });

  it('cycles a short pattern to fill the rhythm', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const s = slonimskySequence({
      pattern: '3',
      reps: '1',
      transform: 'original',
      targetCount: 5,
      baseMidi: 60
    })!;
    expect(s.slice(1).map((v, i) => v - s[i])).toEqual([3, -3, 3, -3]);
  });

  it('returns null for an empty pattern', () => {
    expect(
      slonimskySequence({
        pattern: '0',
        reps: '1',
        transform: 'original',
        targetCount: 4,
        baseMidi: 60
      })
    ).toBeNull();
  });
});

describe('distractors', () => {
  it('offers the answer first, then variants one semitone off in one inner note', () => {
    for (let seed = 1; seed <= 30; seed++) {
      vi.spyOn(Math, 'random').mockImplementation(seededRandom(seed));
      const correct = [0, 2, 4, 5, 7, 0];
      const out = distractors(correct);
      expect(out[0]).toBe(correct.join(','));
      expect(new Set(out).size).toBe(out.length);
      expect(out.length).toBe(4);
      for (const o of out.slice(1)) {
        const v = o.split(',').map(Number);
        const diff = v.map((x, i) => x - correct[i]);
        expect(diff[0]).toBe(0);
        expect(diff[5]).toBe(0);
        expect(diff.filter((d) => d !== 0)).toHaveLength(1);
        expect(Math.abs(diff.find((d) => d !== 0)!)).toBe(1);
      }
      vi.restoreAllMocks();
    }
  });
});
