import { beforeAll, describe, expect, it } from 'vitest';
import { loadLegacySlice, type Legacy } from '#lib/testing/legacy.js';
import {
  FIELDS,
  HEX,
  MAX_EVENTS,
  PRESETS,
  RELATIVE,
  colorKey,
  pcOf,
  spellScale,
  toneNames,
  type FieldKey
} from './fields';
import { harmonia } from './harmonia.svelte.js';

// The port against the legacy page's Harmonia 3D tables and spelling (legacy/index.html, inside its
// `start()`): same keys, names, colours and presets.

let L: Legacy;
const json = (v: unknown) => JSON.parse(JSON.stringify(v));
beforeAll(() => {
  L = loadLegacySlice(
    "const LET = ['C','D','E','F','G','A','B'];",
    'const renderer = new THREE.WebGLRenderer',
    [
      'FIELDS',
      'RELATIVE',
      'PRESETS',
      'HEX',
      'MAX_EVENTS',
      'S',
      'pcOf',
      'spellScale',
      'toneNames',
      'chordName',
      'colorKey'
    ],
    ['names']
  );
});

describe('Harmonia 3D parity with the legacy page', () => {
  it('has the same fields, relative keys, presets and colours', () => {
    expect(json(FIELDS)).toEqual(json(L.fn.FIELDS));
    expect(json(RELATIVE)).toEqual(json(L.fn.RELATIVE));
    expect(json(PRESETS)).toEqual(json(L.fn.PRESETS));
    expect(HEX).toEqual(json(L.fn.HEX));
    expect(MAX_EVENTS).toBe(L.fn.MAX_EVENTS);
  });

  it('spells, names and colours every degree of every key the same', () => {
    const S = L.fn.S as unknown as { field: FieldKey; tonic: string; tetra: boolean };
    for (const field of ['maj', 'min'] as const)
      for (const tonic of FIELDS[field].tonics) {
        const names = spellScale(tonic, field);
        expect(names, `${tonic} ${field}`).toEqual(
          json(L.fn.spellScale(...([tonic, field] as never[])))
        );
        expect(pcOf(tonic)).toBe(L.fn.pcOf(...([tonic] as never[])));
        S.field = field;
        L.set('names', names);
        harmonia.field = field;
        harmonia.tonic = tonic;
        for (const tetra of [false, true]) {
          S.tetra = tetra;
          harmonia.tetra = tetra;
          FIELDS[field].deg.forEach((d, i) => {
            const where = `${tonic} ${field} ${i} ${tetra}`;
            expect(toneNames(d, names[i]), where).toEqual(
              json(L.fn.toneNames(...([i] as never[])))
            );
            expect(colorKey(d, tetra), where).toBe(L.fn.colorKey(...([i] as never[])));
            expect(harmonia.chordName(i), where).toBe(L.fn.chordName(...([i] as never[])));
          });
        }
      }
  });
});
