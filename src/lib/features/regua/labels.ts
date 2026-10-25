import { m } from '#lib/paraglide/messages.js';
import type { ReguaInterval } from './intervals';

// The ruler's table keeps the legacy page's Portuguese (the parity tests compare it); what the
// page shows goes through these, in the current language.

const FULL = [
  m.regua_full_0,
  m.regua_full_1,
  m.regua_full_2,
  m.regua_full_3,
  m.regua_full_4,
  m.regua_full_5,
  m.regua_full_6,
  m.regua_full_7,
  m.regua_full_8,
  m.regua_full_9,
  m.regua_full_10,
  m.regua_full_11,
  m.regua_full_12
];

const QUALITY: Record<string, () => string> = {
  'Consonância Perfeita': m.regua_quality_perfect,
  'Consonância Estável': m.regua_quality_stable,
  'Consonância Neutra': m.regua_quality_neutral,
  'Dissonância Leve': m.regua_quality_mild,
  'Dissonância Máxima': m.regua_quality_max
};

const REFERENCE: Record<string, () => string> = {
  C: m.regua_ref_c,
  A: m.regua_ref_a,
  G: m.regua_ref_g
};

/** `2ª Menor` / `Minor 2nd`. */
export const reguaFull = (iv: ReguaInterval) => FULL[iv.semitones]();
/** `Consonância Estável` / `Stable consonance`. */
export const reguaQuality = (iv: ReguaInterval) => QUALITY[iv.quality]();
/** The caption under a reference note: `DÓ CENTRAL` / `MIDDLE C`. */
export const referenceLabel = (name: string) => REFERENCE[name]();
