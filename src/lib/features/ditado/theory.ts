export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
  melodic: [0, 2, 3, 5, 7, 9, 11],
  pentMajor: [0, 2, 4, 7, 9],
  pentMinor: [0, 3, 5, 7, 10],
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10]
} as const;
export type ScaleType = keyof typeof SCALES;

/** Letter offsets from the tonic for each scale step (pentatonics skip letters). */
const SCALE_LETTER_STEPS: Record<ScaleType, number[]> = {
  major: [0, 1, 2, 3, 4, 5, 6],
  minor: [0, 1, 2, 3, 4, 5, 6],
  harmonic: [0, 1, 2, 3, 4, 5, 6],
  melodic: [0, 1, 2, 3, 4, 5, 6],
  pentMajor: [0, 1, 2, 4, 5],
  pentMinor: [0, 2, 3, 4, 6],
  ionian: [0, 1, 2, 3, 4, 5, 6],
  dorian: [0, 1, 2, 3, 4, 5, 6],
  phrygian: [0, 1, 2, 3, 4, 5, 6],
  lydian: [0, 1, 2, 3, 4, 5, 6],
  mixolydian: [0, 1, 2, 3, 4, 5, 6],
  aeolian: [0, 1, 2, 3, 4, 5, 6],
  locrian: [0, 1, 2, 3, 4, 5, 6]
};

/** Degree names by semitones above the tonic. */
export const DEG = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
const LETIDX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
/** Letter used for chromatic notes outside the scale, by pitch class. */
const FALLBACK_LETTER = [0, 0, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6];
export const TONICS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

/** Generated notes stay within A2–A5 (MIDI). */
export const TESSITURA_LOW = 45;
export const TESSITURA_HIGH = 81;

const PC: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11
};
export const pcOf = (name: string) => PC[name] ?? 0;

export const splitSpelling = (name: string) => ({ base: name[0], acc: name.slice(1) });

/** Spell pitch class `pc` on the letter at `letterIdx` (0 = C). */
function nameAt(letterIdx: number, pc: number): string {
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const natural: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const base = letters[((letterIdx % 7) + 7) % 7];
  const n = natural[base];
  // JS `%` keeps the sign, so far-off letters fall through to the last line, as in the legacy app.
  const d = ((pc - n + 6) % 12) - 6;
  if (d === 0) return base;
  if (d === 1) return base + '♯';
  if (d === -1) return base + '♭';
  if (d === 2) return base + '𝄪';
  if (d === -2) return base + '𝄫';
  return base + (d > 0 ? '♯' : '♭');
}

/** Spell the note `offsetFromTonic` semitones above the tonic, using scale letters when it's in the scale. */
export function spellNote(
  offsetFromTonic: number,
  tonicName: string,
  scaleType: ScaleType
): string {
  const scaleArr: readonly number[] = SCALES[scaleType] || SCALES.major;
  const steps = SCALE_LETTER_STEPS[scaleType] || SCALE_LETTER_STEPS.major;
  const tonicL = LETIDX[tonicName[0]];
  const tonicPc = pcOf(tonicName);
  const pcOffset = ((offsetFromTonic % 12) + 12) % 12;
  const pcFromC = (((tonicPc + offsetFromTonic) % 12) + 12) % 12;
  const k = scaleArr.indexOf(pcOffset);
  const letterIdx = k >= 0 ? tonicL + steps[k] : FALLBACK_LETTER[pcFromC];
  return nameAt(letterIdx, pcFromC);
}

export const accToLily = (u: string) =>
  u === '♯' ? 'is' : u === '♭' ? 'es' : u === '𝄪' ? 'isis' : u === '𝄫' ? 'eses' : '';
export const accToVex = (u: string) =>
  u === '♯' ? '#' : u === '♭' ? 'b' : u === '𝄪' ? '##' : u === '𝄫' ? 'bb' : '';
export const accToNum = (u: string) =>
  u === '♯' ? 1 : u === '♭' ? -1 : u === '𝄪' ? 2 : u === '𝄫' ? -2 : 0;

export const MINOR_SCALES: ScaleType[] = ['minor', 'harmonic', 'melodic', 'pentMinor'];
export const MODES: ScaleType[] = [
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian'
];

const MAJOR_SIG_BY_PC: Record<number, { sig: string; n: number }> = {
  0: { sig: 'C', n: 0 },
  1: { sig: 'Db', n: -5 },
  2: { sig: 'D', n: 2 },
  3: { sig: 'Eb', n: -3 },
  4: { sig: 'E', n: 4 },
  5: { sig: 'F', n: -1 },
  6: { sig: 'F#', n: 6 },
  7: { sig: 'G', n: 1 },
  8: { sig: 'Ab', n: -4 },
  9: { sig: 'A', n: 3 },
  10: { sig: 'Bb', n: -2 },
  11: { sig: 'B', n: 5 }
};
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
/** Semitones from a mode's tonic down to its parent major. */
const MODE_PARENT_OFFSET: Partial<Record<ScaleType, number>> = {
  ionian: 0,
  dorian: 2,
  phrygian: 4,
  lydian: 5,
  mixolydian: 7,
  aeolian: 9,
  locrian: 11
};

export interface KeySig {
  vexKey: string;
  /** Letters altered by the signature: +1 sharp, -1 flat. */
  altered: Record<string, number>;
}

export function keySigInfo(tonicName: string, scaleType: ScaleType): KeySig {
  const isMinor = MINOR_SCALES.includes(scaleType);
  const tonicPc = pcOf(tonicName);
  const parent = MODE_PARENT_OFFSET[scaleType];
  const majorPc =
    parent !== undefined ? (tonicPc - parent + 12) % 12 : isMinor ? (tonicPc + 3) % 12 : tonicPc;
  const info = MAJOR_SIG_BY_PC[majorPc] || { sig: 'C', n: 0 };
  const altered: Record<string, number> = {};
  if (info.n > 0) for (let i = 0; i < info.n; i++) altered[SHARP_ORDER[i]] = 1;
  else if (info.n < 0) for (let i = 0; i < -info.n; i++) altered[FLAT_ORDER[i]] = -1;
  return { vexKey: info.sig, altered };
}

export const degreeOf = (offset: number) => DEG[((offset % 12) + 12) % 12];
