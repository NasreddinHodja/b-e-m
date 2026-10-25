import { m } from '#lib/paraglide/messages.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import { NOTE_PT, type Interval } from './intervals';

// The interval tables keep the legacy page's Portuguese (the parity tests compare them); what the
// page shows goes through these, in the current language.

type Msg = () => string;
const byStep = (fns: Msg[]) => (iv: Interval) => fns[iv.semitones]();

/** `2ª m` / `m2`: the answer buttons. */
export const intervalSymbol = byStep([
  m.interval_symbol_0,
  m.interval_symbol_1,
  m.interval_symbol_2,
  m.interval_symbol_3,
  m.interval_symbol_4,
  m.interval_symbol_5,
  m.interval_symbol_6,
  m.interval_symbol_7,
  m.interval_symbol_8,
  m.interval_symbol_9,
  m.interval_symbol_10,
  m.interval_symbol_11,
  m.interval_symbol_12
]);

/** `2m` / `m2`: stats and history. */
export const intervalShort = byStep([
  m.interval_short_0,
  m.interval_short_1,
  m.interval_short_2,
  m.interval_short_3,
  m.interval_short_4,
  m.interval_short_5,
  m.interval_short_6,
  m.interval_short_7,
  m.interval_short_8,
  m.interval_short_9,
  m.interval_short_10,
  m.interval_short_11,
  m.interval_short_12
]);

/** `Segunda Menor` / `Minor Second`. */
export const intervalName = byStep([
  m.interval_name_0,
  m.interval_name_1,
  m.interval_name_2,
  m.interval_name_3,
  m.interval_name_4,
  m.interval_name_5,
  m.interval_name_6,
  m.interval_name_7,
  m.interval_name_8,
  m.interval_name_9,
  m.interval_name_10,
  m.interval_name_11,
  m.interval_name_12
]);

/** The one-line note under the feedback. */
export const intervalTheory = byStep([
  m.interval_theory_0,
  m.interval_theory_1,
  m.interval_theory_2,
  m.interval_theory_3,
  m.interval_theory_4,
  m.interval_theory_5,
  m.interval_theory_6,
  m.interval_theory_7,
  m.interval_theory_8,
  m.interval_theory_9,
  m.interval_theory_10,
  m.interval_theory_11,
  m.interval_theory_12
]);

/** A note's name: solfège in Portuguese (`Ré♭`), the letter in English (`Eb`). */
export const noteName = (letter: string) =>
  getLocale() === 'pt-br' ? NOTE_PT[letter] || letter : letter;
