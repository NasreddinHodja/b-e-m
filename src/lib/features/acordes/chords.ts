export type ChordQuality = 'major' | 'minor';

export interface Chord {
  name: string;
  root: number;
  type: 'maior' | 'menor';
  intervals: number[];
  /** The function of A in this chord, `—` when A is not a chord tone or diatonic tension. */
  aFunc: string;
}

const major = (name: string, root: number, aFunc: string): Chord => ({
  name,
  root,
  type: 'maior',
  intervals: [0, 4, 7],
  aFunc
});
const minor = (name: string, root: number, aFunc: string): Chord => ({
  name,
  root,
  type: 'menor',
  intervals: [0, 3, 7],
  aFunc
});

/** All twelve roots, chromatic order, for the teacher panel. */
export const TEACHER_CHORDS: Record<ChordQuality, Chord[]> = {
  major: [
    major('C', 60, '6ª maior (6)'),
    major('C#', 61, '6ª menor (b6)'),
    major('D', 62, '5ª justa (5)'),
    major('Eb', 63, '—'),
    major('E', 64, '4ª justa (4)'),
    major('F', 65, '3ª maior (3)'),
    major('F#', 66, '—'),
    major('G', 67, '2ª maior (2)'),
    major('Ab', 68, '—'),
    major('A', 69, 'fund (1)'),
    major('Bb', 70, '7ª maior (7)'),
    major('B', 71, '7ª menor (b7)')
  ],
  minor: [
    minor('Cm', 60, '6ª maior (6)'),
    minor('C#m', 61, '6ª menor (b6)'),
    minor('Dm', 62, '5ª justa (5)'),
    minor('Ebm', 63, '—'),
    minor('Em', 64, '4ª justa (4)'),
    minor('Fm', 65, '—'),
    minor('F#m', 66, '3ª menor (b3)'),
    minor('Gm', 67, '2ª maior (2)'),
    minor('Abm', 68, '—'),
    minor('Am', 69, 'fund (1)'),
    minor('Bbm', 70, '7ª maior (7)'),
    minor('Bm', 71, '7ª menor (b7)')
  ]
};

/** The chords the quiz draws from: those where A has a named function. */
export const QUIZ_CHORDS: Record<ChordQuality, Chord[]> = {
  major: [
    major('A', 69, 'fund (1)'),
    major('G', 67, '2ª maior (2)'),
    major('F', 65, '3ª maior (3)'),
    major('E', 64, '4ª justa (4)'),
    major('D', 62, '5ª justa (5)'),
    major('C#', 61, '6ª menor (b6)'),
    major('C', 60, '6ª maior (6)'),
    major('B', 71, '7ª menor (b7)'),
    major('Bb', 70, '7ª maior (7)')
  ],
  minor: [
    minor('Am', 69, 'fund (1)'),
    minor('Gm', 67, '2ª maior (2)'),
    minor('F#m', 66, '3ª menor (b3)'),
    minor('Em', 64, '4ª justa (4)'),
    minor('Dm', 62, '5ª justa (5)'),
    minor('C#m', 61, '6ª menor (b6)'),
    minor('Cm', 60, '6ª maior (6)'),
    minor('Bm', 71, '7ª menor (b7)'),
    minor('Bbm', 70, '7ª maior (7)')
  ]
};

/** Function names by semitones above the root. */
export const FUNC_NAMES: Record<number, string> = {
  0: 'fundamental (1)',
  1: 'segunda menor (b2)',
  2: 'segunda maior (2)',
  3: 'terça menor (b3)',
  4: 'terça maior (3)',
  5: 'quarta justa (4)',
  6: 'trítono (b5)',
  7: 'quinta justa (5)',
  8: 'sexta menor (b6)',
  9: 'sexta maior (6)',
  10: 'sétima menor (b7)',
  11: 'sétima maior (7)'
};

/** Function symbols by semitones above the root; also the answer buttons. */
export const FUNCS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

export type Pool = 'major' | 'minor' | 'both';

export function chordPool(pool: Pool): Chord[] {
  return pool === 'major'
    ? QUIZ_CHORDS.major
    : pool === 'minor'
      ? QUIZ_CHORDS.minor
      : [...QUIZ_CHORDS.major, ...QUIZ_CHORDS.minor];
}
