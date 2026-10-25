import { describe, expect, it } from 'vitest';
import { FUNCS, FUNC_NAMES, QUIZ_CHORDS, TEACHER_CHORDS, chordPool } from './chords';

const A = 9;
const aSemis = (root: number) => (A - (root % 12) + 12) % 12;

describe('chords', () => {
  it('labels each quiz chord with A’s real function in it', () => {
    for (const chord of [...QUIZ_CHORDS.major, ...QUIZ_CHORDS.minor]) {
      expect(chord.aFunc, chord.name).toContain(`(${FUNCS[aSemis(chord.root)]})`);
    }
  });

  it('builds triads of the right quality', () => {
    for (const c of QUIZ_CHORDS.major) expect(c.intervals).toEqual([0, 4, 7]);
    for (const c of QUIZ_CHORDS.minor) expect(c.intervals).toEqual([0, 3, 7]);
  });

  it('offers every root to the teacher, chromatically', () => {
    for (const q of ['major', 'minor'] as const) {
      expect(TEACHER_CHORDS[q].map((c) => c.root)).toEqual([
        60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71
      ]);
    }
  });

  it('pools 9, 9 and 18 chords', () => {
    expect(chordPool('major')).toHaveLength(9);
    expect(chordPool('minor')).toHaveLength(9);
    expect(chordPool('both')).toHaveLength(18);
  });

  it('names all twelve functions', () => {
    expect(FUNCS).toHaveLength(12);
    expect(Object.keys(FUNC_NAMES)).toHaveLength(12);
  });
});
