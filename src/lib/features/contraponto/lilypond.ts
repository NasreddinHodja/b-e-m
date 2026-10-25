import type { Line, Note } from './rules.js';

const LY_NOTE: Record<string, string> = { C: 'c', D: 'd', E: 'e', F: 'f', G: 'g', A: 'a', B: 'b' };

function lilyPitch(p: Note | null): string {
  if (!p) return 'r';
  const m = /^([A-G])([#b]*)(-?\d)$/.exec(p.n);
  if (!m) return 'r';
  let acc = '';
  for (const ch of m[2]) {
    if (ch === '#') acc += 'is';
    if (ch === 'b') acc += 'es';
  }
  const marks = +m[3] - 3;
  return LY_NOTE[m[1]] + acc + (marks > 0 ? "'".repeat(marks) : ','.repeat(-marks));
}

/** Bar lines after every note (1st species) or every two notes (2nd), and at the end. */
function withBarlines(pitches: string[], oneNotePerBar: boolean): string {
  const out: string[] = [];
  for (let i = 0; i < pitches.length; i++) {
    out.push(pitches[i]);
    if (oneNotePerBar || i === pitches.length - 1) out.push('|');
    else if ((i + 1) % 2 === 0) out.push('|');
  }
  return out.join(' ');
}

export interface LilyVoice {
  line: Line;
  oneNotePerBar: boolean;
  /** Use the bass clef (the voice sits well below the cantus firmus). */
  bass: boolean;
}

export function generateLilyPond(voices: LilyVoice[], bpm: number): string {
  if (!voices.length || !voices[0].line.length) return '% Nenhuma música válida para exportar.';
  const tempo = Math.max(40, Math.min(160, bpm || 80));
  const lines = [
    '\\version "2.26.0"',
    '',
    '% B.E.M — Conferidor de contraponto (Fux)',
    '',
    'global = {',
    '  \\time 2/2',
    `  \\tempo 2 = ${tempo}`,
    '}',
    ''
  ];
  const varName = (i: number) => (i === 0 ? 'cantusFirmus' : `voz${i + 1}`);
  voices.forEach((v, i) => {
    const body = withBarlines(v.line.map(lilyPitch), v.oneNotePerBar);
    lines.push(`${varName(i)} = {`, '  ' + body.replace(/\|/g, '|\n  '), '}', '');
  });
  lines.push('\\score {', '  \\new StaffGroup <<');
  voices.forEach((v, i) => {
    const label = i === 0 ? 'Cantus firmus' : `Voz ${i + 1}`;
    lines.push(
      `    \\new Staff \\with { instrumentName = "${label}" } {`,
      `      \\clef ${v.bass ? 'bass' : 'treble'}`,
      '      \\global',
      `      \\${varName(i)}`,
      '    }'
    );
  });
  lines.push('  >>', '  \\layout { }', '  \\midi { }', '}');
  return lines.join('\n');
}
