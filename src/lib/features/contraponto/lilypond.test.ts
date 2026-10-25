import { describe, expect, it } from 'vitest';
import { generateLilyPond } from './lilypond';
import { readVoice } from './rules';

const line = (s: string) => readVoice(s, true).out;

describe('generateLilyPond', () => {
  it('writes each voice with bar lines per species, and the score', () => {
    const ly = generateLilyPond(
      [
        { line: line('D4 F4 D4'), oneNotePerBar: true, bass: false },
        { line: line('A4 B4 C5 D5 D5'), oneNotePerBar: false, bass: false },
        { line: line('D3 Bb2 D3'), oneNotePerBar: true, bass: true }
      ],
      90
    );
    expect(ly).toContain('\\version "2.26.0"');
    expect(ly).toContain('\\tempo 2 = 90');
    // The space after each bar line stays at the start of the next line, as the legacy code had it.
    expect(ly).toContain("cantusFirmus = {\n  d' |\n   f' |\n   d' |\n  \n}");
    expect(ly).toContain("voz2 = {\n  a' b' |\n   c'' d'' |\n   d'' |\n  \n}");
    expect(ly).toContain('voz3 = {\n  d |\n   bes, |\n   d |\n  \n}');
    expect(ly).toContain('\\new Staff \\with { instrumentName = "Voz 3" } {\n      \\clef bass');
  });

  it('writes rests and clamps the tempo to 40–160', () => {
    const ly = generateLilyPond([{ line: line('r D4'), oneNotePerBar: false, bass: false }], 300);
    expect(ly).toContain('r d');
    expect(ly).toContain('\\tempo 2 = 160');
  });

  it('says so when there is nothing to export', () => {
    expect(generateLilyPond([], 80)).toBe('% Nenhuma música válida para exportar.');
  });
});
