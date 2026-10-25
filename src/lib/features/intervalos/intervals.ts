export type IntervalGroup = 'consonant' | 'dissonant' | 'diatonic';

export interface Interval {
  semitones: number;
  symbol: string;
  short: string;
  name: string;
  groups: IntervalGroup[];
  theory: string;
}

export const INTERVALS: Interval[] = [
  {
    semitones: 0,
    symbol: 'Uníssono',
    short: 'U',
    name: 'Uníssono Justo',
    groups: ['consonant', 'diatonic'],
    theory: 'Duas notas idênticas. Base da percepção musical.'
  },
  {
    semitones: 1,
    symbol: '2ª m',
    short: '2m',
    name: 'Segunda Menor',
    groups: ['dissonant'],
    theory: 'Intervalo cromático de tensão máxima.'
  },
  {
    semitones: 2,
    symbol: '2ª M',
    short: '2M',
    name: 'Segunda Maior',
    groups: ['dissonant', 'diatonic'],
    theory: 'O passo diatônico fundamental da escala maior.'
  },
  {
    semitones: 3,
    symbol: '3ª m',
    short: '3m',
    name: 'Terça Menor',
    groups: ['consonant', 'diatonic'],
    theory: 'Base do acorde menor. Caráter introspectivo.'
  },
  {
    semitones: 4,
    symbol: '3ª M',
    short: '3M',
    name: 'Terça Maior',
    groups: ['consonant', 'diatonic'],
    theory: 'Base do acorde maior. Caráter luminoso.'
  },
  {
    semitones: 5,
    symbol: '4ª J',
    short: '4J',
    name: 'Quarta Justa',
    groups: ['consonant', 'diatonic'],
    theory: 'Intervalo aberto. Inversão da quinta.'
  },
  {
    semitones: 6,
    symbol: 'Trítono',
    short: 'TT',
    name: 'Trítono',
    groups: ['dissonant'],
    theory: 'Divide a oitava ao meio. Máxima tensão.'
  },
  {
    semitones: 7,
    symbol: '5ª J',
    short: '5J',
    name: 'Quinta Justa',
    groups: ['consonant', 'diatonic'],
    theory: 'Intervalo mais estável depois do uníssono.'
  },
  {
    semitones: 8,
    symbol: '6ª m',
    short: '6m',
    name: 'Sexta Menor',
    groups: ['consonant', 'diatonic'],
    theory: 'Inversão da 3ª maior. Som melancólico.'
  },
  {
    semitones: 9,
    symbol: '6ª M',
    short: '6M',
    name: 'Sexta Maior',
    groups: ['consonant', 'diatonic'],
    theory: 'Inversão da 3ª menor. Caráter aberto.'
  },
  {
    semitones: 10,
    symbol: '7ª m',
    short: '7m',
    name: 'Sétima Menor',
    groups: ['dissonant', 'diatonic'],
    theory: 'Intervalo do V7. Cria tensão que pede resolução.'
  },
  {
    semitones: 11,
    symbol: '7ª M',
    short: '7M',
    name: 'Sétima Maior',
    groups: ['dissonant'],
    theory: 'Som tenso e moderno. Presente nos acordes maj7.'
  },
  {
    semitones: 12,
    symbol: 'Oitava',
    short: '8ª',
    name: 'Oitava Justa',
    groups: ['consonant', 'diatonic'],
    theory: 'A mesma nota em frequência dobrada.'
  }
];

export type RootMode = 'fixed_A' | 'fixed_C' | 'random';

export const ROOTS: Record<RootMode, { name: string; midi: number }[]> = {
  fixed_A: [{ name: 'A', midi: 69 }],
  fixed_C: [{ name: 'C', midi: 60 }],
  random: [
    { name: 'C', midi: 60 },
    { name: 'D', midi: 62 },
    { name: 'E', midi: 64 },
    { name: 'F', midi: 65 },
    { name: 'G', midi: 67 },
    { name: 'A', midi: 69 },
    { name: 'B', midi: 71 }
  ]
};

/** Portuguese note names; unknown names are shown as-is. */
export const NOTE_PT: Record<string, string> = {
  C: 'Dó',
  D: 'Ré',
  E: 'Mi',
  F: 'Fá',
  G: 'Sol',
  A: 'Lá',
  B: 'Si',
  'C#': 'Dó#',
  Eb: 'Ré♭',
  'F#': 'Fá#',
  Ab: 'Lá♭',
  Bb: 'Si♭'
};

export const notePt = (name: string) => NOTE_PT[name] || name;
