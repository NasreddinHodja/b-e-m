export type FieldKey = 'maj' | 'min';
export type ColorKey = 'gold' | 'green' | 'red' | 'ivory';

/** A diatonic chord as three stacked thirds: root→3rd (v), 3rd→5th (h), 5th→7th (s), in semitones. */
export interface Degree {
  v: number;
  h: number;
  s: number;
  tri: 'M' | 'm' | 'd';
  tet: string;
  dom?: boolean;
}

export const FIELDS: Record<
  FieldKey,
  { label: string; roman: string[]; tonics: string[]; deg: Degree[] }
> = {
  maj: {
    label: 'maior',
    roman: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'],
    tonics: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'],
    deg: [
      { v: 4, h: 3, s: 4, tri: 'M', tet: 'maj7' },
      { v: 3, h: 4, s: 3, tri: 'm', tet: 'm7' },
      { v: 3, h: 4, s: 3, tri: 'm', tet: 'm7' },
      { v: 4, h: 3, s: 4, tri: 'M', tet: 'maj7' },
      { v: 4, h: 3, s: 3, tri: 'M', tet: '7', dom: true },
      { v: 3, h: 4, s: 3, tri: 'm', tet: 'm7' },
      { v: 3, h: 3, s: 4, tri: 'd', tet: 'm7♭5' }
    ]
  },
  min: {
    label: 'menor',
    roman: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    tonics: ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'D', 'G', 'C', 'F', 'Bb'],
    deg: [
      { v: 3, h: 4, s: 3, tri: 'm', tet: 'm7' },
      { v: 3, h: 3, s: 4, tri: 'd', tet: 'm7♭5' },
      { v: 4, h: 3, s: 4, tri: 'M', tet: 'maj7' },
      { v: 3, h: 4, s: 3, tri: 'm', tet: 'm7' },
      { v: 3, h: 4, s: 3, tri: 'm', tet: 'm7' },
      { v: 4, h: 3, s: 4, tri: 'M', tet: 'maj7' },
      { v: 4, h: 3, s: 3, tri: 'M', tet: '7', dom: true }
    ]
  }
};

/** Scale steps of each field, in semitones from the tonic. */
export const SCALE: Record<FieldKey, number[]> = {
  maj: [0, 2, 4, 5, 7, 9, 11],
  min: [0, 2, 3, 5, 7, 8, 10]
};

const RELATIVE_MAJ: Record<string, string> = {
  C: 'A',
  G: 'E',
  D: 'B',
  A: 'F#',
  E: 'C#',
  B: 'G#',
  'F#': 'D#',
  Db: 'Bb',
  Ab: 'F',
  Eb: 'C',
  Bb: 'G',
  F: 'D'
};
/** Relative key when switching field: major tonic → its relative minor and back. */
export const RELATIVE: Record<FieldKey, Record<string, string>> = {
  maj: RELATIVE_MAJ,
  min: Object.fromEntries(Object.entries(RELATIVE_MAJ).map(([k, v]) => [v, k]))
};

/** Ready-made progressions: [degree index, beats] pairs. */
export const PRESETS: { seq: [number, number][]; note?: string }[] = [
  {
    seq: [
      [0, 4],
      [5, 4],
      [1, 4],
      [4, 4],
      [0, 4]
    ],
    note: 'o exemplo do início'
  },
  {
    seq: [
      [1, 2],
      [4, 2],
      [0, 4]
    ],
    note: '2 + 2 + 4 tempos'
  },
  {
    seq: [
      [0, 4],
      [3, 4],
      [4, 4],
      [0, 4]
    ]
  },
  {
    seq: [
      [0, 4],
      [4, 4],
      [5, 4],
      [3, 4]
    ]
  },
  {
    seq: [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [5, 2],
      [6, 2]
    ],
    note: '2 tempos cada'
  }
];

export const MAX_EVENTS = 16;

export const HEX: Record<ColorKey, string> = {
  gold: '#C8A030',
  green: '#4A9E6A',
  red: '#B84848',
  ivory: '#E4E0D8'
};

const LET = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LPC = [0, 2, 4, 5, 7, 9, 11];

export function pcOf(n: string): number {
  let pc = LPC[LET.indexOf(n[0])];
  for (const ch of n.slice(1)) {
    if (ch === '#' || ch === '♯') pc += 1;
    else if (ch === 'b' || ch === '♭') pc -= 1;
    else if (ch === '𝄪') pc += 2;
    else if (ch === '𝄫') pc -= 2;
  }
  return ((pc % 12) + 12) % 12;
}

const accOf = (d: number) => (d === 0 ? '' : d === 1 ? '♯' : d === -1 ? '♭' : d === 2 ? '𝄪' : '𝄫');

function nameAt(letterIdx: number, pc: number): string {
  const L = ((letterIdx % 7) + 7) % 7;
  let d = (((pc - LPC[L]) % 12) + 12) % 12;
  if (d > 6) d -= 12;
  return LET[L] + accOf(d);
}

/** The seven scale notes, one per letter. */
export function spellScale(tonic: string, field: FieldKey): string[] {
  const li = LET.indexOf(tonic[0]);
  const tpc = pcOf(tonic);
  return SCALE[field].map((s, i) => nameAt(li + i, (tpc + s) % 12));
}

/** Root, 3rd, 5th, 7th names of degree `d` whose root is `root`. */
export function toneNames(d: Degree, root: string): string[] {
  const rl = LET.indexOf(root[0]);
  const rpc = pcOf(root);
  const semis = [0, d.v, d.v + d.h, d.v + d.h + d.s];
  const off = [0, 2, 4, 6];
  return semis.map((s, k) => nameAt(rl + off[k], (rpc + s) % 12));
}

export function colorKey(d: Degree, tetra: boolean): ColorKey {
  if (d.dom) return 'red';
  if (tetra) {
    if (d.tet === 'm7♭5') return 'ivory';
    return d.v === 4 ? 'green' : 'gold';
  }
  if (d.tri === 'd') return 'ivory';
  return d.tri === 'M' ? 'green' : 'gold';
}

export const pretty = (t: string) => t.replace('#', '♯').replace('b', '♭');
