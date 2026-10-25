import { m } from '#lib/paraglide/messages.js';
import type { Chord } from './chords';

// The chord tables keep the legacy page's Portuguese labels (the parity tests compare them); what
// the page shows goes through these, in the current language.

const A_FUNC: Record<string, () => string> = {
  'fund (1)': m.acordes_afunc_1,
  '2ª maior (2)': m.acordes_afunc_2,
  '3ª menor (b3)': m.acordes_afunc_b3,
  '3ª maior (3)': m.acordes_afunc_3,
  '4ª justa (4)': m.acordes_afunc_4,
  '5ª justa (5)': m.acordes_afunc_5,
  '6ª menor (b6)': m.acordes_afunc_b6,
  '6ª maior (6)': m.acordes_afunc_6,
  '7ª menor (b7)': m.acordes_afunc_b7,
  '7ª maior (7)': m.acordes_afunc_7
};

/** What A is in this chord, short (`5ª justa (5)`), or `—`. */
export const aFuncLabel = (chord: Chord) => A_FUNC[chord.aFunc]?.() ?? chord.aFunc;

/** `maior` / `menor`. */
export const chordTypeLabel = (chord: Chord) =>
  chord.type === 'maior' ? m.acordes_type_major() : m.acordes_type_minor();

const FUNC_NAME = [
  m.acordes_func_0,
  m.acordes_func_1,
  m.acordes_func_2,
  m.acordes_func_3,
  m.acordes_func_4,
  m.acordes_func_5,
  m.acordes_func_6,
  m.acordes_func_7,
  m.acordes_func_8,
  m.acordes_func_9,
  m.acordes_func_10,
  m.acordes_func_11
];

/** The function `semis` semitones above the root, in words: `quinta justa (5)`. */
export const funcName = (semis: number) => FUNC_NAME[semis]();
