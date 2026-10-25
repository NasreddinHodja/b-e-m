import { beforeAll, describe, expect, it } from 'vitest';
import { loadLegacyScripts, type Legacy } from '#lib/testing/legacy.js';
import { seededRandom } from '#lib/testing/random.js';
import { ENVELOPES, OUTPUT_PROFILES, PARTIALS } from './audio/profiles';
import { FUNCS, FUNC_NAMES, QUIZ_CHORDS, TEACHER_CHORDS } from './features/acordes/chords';
import { autoCorrelate } from './features/afinador/autocorrelate';
import { MODE_RANGES } from './features/afinador/tuner.svelte.js';
import { INTERVALS, NOTE_PT, ROOTS } from './features/intervalos/intervals';
import { PILARES } from './features/pratica/pilares';
import { REGUA } from './features/regua/intervals';
import { PC_NAMES, midiToFreq } from './music/pitch';

// The port's tables and shared functions against the legacy page's top-level scripts
// (legacy/index.html: audio and score, then the tabs).

let L: Legacy;
const json = (v: unknown) => JSON.parse(JSON.stringify(v));
beforeAll(() => {
  L = loadLegacyScripts(
    ['const PROFILES = {', 'const H_NOTE_NAMES'],
    [
      'PROFILES',
      'OSC_PROFILES',
      'ENV',
      'midiToFreq',
      'H_NOTE_NAMES',
      'H_CHORDS_PROF',
      'H_CHORDS',
      'H_FUNC_NAMES',
      'H_FUNCS',
      'INTERVALS',
      'I_ROOTS',
      'NOTE_PT',
      'PILARES',
      'REGUA_DATA',
      'MODE_RANGES',
      'autoCorrelate'
    ]
  );
});

describe('shared tables and functions, parity with the legacy page', () => {
  it('synthesizes with the same profiles', () => {
    expect(json(OUTPUT_PROFILES)).toEqual(json(L.fn.PROFILES));
    expect(json(PARTIALS)).toEqual(json(L.fn.OSC_PROFILES));
    expect(json(ENVELOPES)).toEqual(json(L.fn.ENV));
    for (let m = 0; m < 128; m++) expect(midiToFreq(m)).toBe(L.fn.midiToFreq(...([m] as never[])));
  });

  it('has the same chords and functions', () => {
    expect(json(TEACHER_CHORDS)).toEqual(json(L.fn.H_CHORDS_PROF));
    expect(json(QUIZ_CHORDS)).toEqual(json(L.fn.H_CHORDS));
    expect(json(FUNC_NAMES)).toEqual(json(L.fn.H_FUNC_NAMES));
    expect(FUNCS).toEqual(json(L.fn.H_FUNCS));
    expect([...PC_NAMES]).toEqual(json(L.fn.H_NOTE_NAMES));
  });

  it('has the same intervals, roots and note names', () => {
    expect(json(INTERVALS)).toEqual(json(L.fn.INTERVALS));
    expect(json(ROOTS)).toEqual(json(L.fn.I_ROOTS));
    expect(NOTE_PT).toEqual(json(L.fn.NOTE_PT));
  });

  it('has the same pillars and ruler', () => {
    expect(PILARES).toEqual(json(L.fn.PILARES));
    const legacy = json(L.fn.REGUA_DATA) as {
      semitones: number;
      symbol: string;
      full: string;
      quality: string;
      dot: string;
    }[];
    expect(
      REGUA.map(({ semitones, symbol, full, quality, tone }) => [
        semitones,
        symbol,
        full,
        quality,
        tone
      ])
    ).toEqual(
      legacy.map(({ semitones, symbol, full, quality, dot }) => [
        semitones,
        symbol,
        full,
        quality,
        dot
      ])
    );
  });

  it('tunes with the same ranges and pitch detection', () => {
    expect(MODE_RANGES).toEqual(json(L.fn.MODE_RANGES));
    const r = seededRandom(7);
    for (let n = 0; n < 40; n++) {
      const f = 60 + r() * 1000;
      const amp = r() * 0.6;
      const buf = new Float32Array(2048);
      for (let i = 0; i < buf.length; i++)
        buf[i] =
          amp * Math.sin((2 * Math.PI * f * i) / 44100) +
          (amp / 3) * Math.sin((4 * Math.PI * f * i) / 44100) +
          (r() - 0.5) * 0.02;
      expect(autoCorrelate(buf.slice(), 44100), `${f} Hz`).toBe(
        L.fn.autoCorrelate(...([buf.slice(), 44100] as never[]))
      );
    }
  });
});
