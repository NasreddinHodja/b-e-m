import { describe, expect, it } from 'vitest';
import { analyze, cls, pairsCheck, parse, readVoice, spellNear, tokens, type Line } from './rules';

const line = (s: string) => readVoice(s, true).out;
const CF = line('D4 F4 E4 D4 G4 F4 A4 G4 F4 E4 D4');
const messages = (cp: string, sp: 1 | 2 = 1, above = true) =>
  analyze(CF, line(cp), sp, above).map((i) => `${i.s}: ${i.m()}`);

describe('parse', () => {
  it('reads letter, accidentals and octave', () => {
    expect(parse('D4')).toEqual({ n: 'D4', dia: 29, midi: 62 });
    expect(parse('f#4')).toEqual({ n: 'F#4', dia: 31, midi: 66 });
    expect(parse('Bb3')).toEqual({ n: 'Bb3', dia: 27, midi: 58 });
    expect(parse('C##4')!.midi).toBe(62);
    expect(parse('H4')).toBeNull();
    expect(parse('C')).toBeNull();
  });

  it('splits on spaces and commas, rests only where allowed', () => {
    expect(tokens(' A4, B4  C5 ')).toEqual(['A4', 'B4', 'C5']);
    expect(readVoice('r D4 x9', true)).toEqual({ out: [null, parse('D4')], bad: ['x9'] });
    expect(readVoice('r D4', false).bad).toEqual(['r']);
  });
});

describe('cls', () => {
  it('classifies by diatonic steps and semitones', () => {
    expect(cls(0, 0)).toBe('uni');
    expect(cls(7, 12)).toBe('oct');
    expect(cls(4, 7)).toBe('per');
    expect(cls(2, 4)).toBe('imp');
    expect(cls(5, 9)).toBe('imp');
    expect(cls(3, 5)).toBe('dis');
    expect(cls(2, 5)).toBe('dis');
  });
});

describe('analyze', () => {
  it('passes the built-in examples', () => {
    expect(messages('A4 D5 C5 B4 E5 D5 C5 D5 D5 C#5 D5')).toEqual([]);
    expect(messages('A4 D5 C5 D5 E5 G5 F5 D5 E5 G5 A5 D5 F5 C5 D5 G4 A4 C5 B4 C#5 D5', 2)).toEqual(
      []
    );
  });

  it('wants the right number of notes', () => {
    expect(messages('A4 D5')).toEqual([
      'erro: Esperava 11 notas no contraponto (uma por nota do cantus firmus); há 2.'
    ]);
  });

  it('finds parallel fifths and a bad ending', () => {
    // Example 1 with measure 2 a fifth (C5 over F4) after the opening fifth, and ending on a sixth.
    const out = messages('A4 C5 C5 B4 E5 D5 C5 D5 D5 C#5 B4');
    expect(out).toContain('erro: compasso 2: quintas paralelas.');
    expect(out).toContain('erro: Termine em uníssono ou oitava.');
  });

  it('allows rests only at the start, in second species', () => {
    const cp = 'r D5 C5 D5 E5 G5 F5 D5 E5 G5 A5 D5 F5 C5 D5 G4 A4 C5 B4 C#5 D5';
    expect(messages(cp, 2)).toEqual([]);
    const late = 'A4 r C5 D5 E5 G5 F5 D5 E5 G5 A5 D5 F5 C5 D5 G4 A4 C5 B4 C#5 D5';
    expect(messages(late, 2)).toContain(
      'erro: compasso 1, tempo fraco: a pausa só é admitida no início.'
    );
  });
});

describe('pairsCheck', () => {
  it('flags parallel octaves between two added voices', () => {
    const a: Line = line('D5 E5');
    const b: Line = line('D4 E4');
    const out = pairsCheck(
      a,
      b,
      1,
      1,
      () => 'Voz 2',
      () => 'Voz 3',
      2,
      2
    );
    expect(out.map((i) => ({ ...i, m: i.m() }))).toEqual([
      { v: 2, k: 1, s: 'erro', m: 'compasso 2: oitavas paralelas entre Voz 2 e Voz 3.' }
    ]);
  });
});

describe('spellNear', () => {
  it('spells on the nearest natural with the chosen accidental', () => {
    expect(spellNear(62, '')).toBe('D4');
    expect(spellNear(61, '#')).toBe('C#4');
    expect(spellNear(61, 'b')).toBe('Cb4');
    expect(spellNear(71, '')).toBe('B4');
  });
});
