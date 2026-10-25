export type Tone = 'green' | 'gold' | 'red';

export interface ReguaInterval {
  semitones: number;
  symbol: string;
  full: string;
  quality: string;
  tone: Tone;
  tritone?: boolean;
}

export const REGUA: ReguaInterval[] = [
  { semitones: 0, symbol: '1P', full: 'Uníssono', quality: 'Consonância Perfeita', tone: 'green' },
  { semitones: 1, symbol: '2m', full: '2ª Menor', quality: 'Dissonância Leve', tone: 'red' },
  { semitones: 2, symbol: '2M', full: '2ª Maior', quality: 'Consonância Estável', tone: 'green' },
  { semitones: 3, symbol: '3m', full: '3ª Menor', quality: 'Consonância Neutra', tone: 'gold' },
  { semitones: 4, symbol: '3M', full: '3ª Maior', quality: 'Dissonância Leve', tone: 'red' },
  { semitones: 5, symbol: '4J', full: '4ª Justa', quality: 'Consonância Neutra', tone: 'gold' },
  {
    semitones: 6,
    symbol: 'TT',
    full: 'Trítono',
    quality: 'Dissonância Máxima',
    tone: 'red',
    tritone: true
  },
  { semitones: 7, symbol: '5J', full: '5ª Justa', quality: 'Consonância Estável', tone: 'green' },
  { semitones: 8, symbol: '6m', full: '6ª Menor', quality: 'Consonância Neutra', tone: 'gold' },
  { semitones: 9, symbol: '6M', full: '6ª Maior', quality: 'Consonância Estável', tone: 'green' },
  { semitones: 10, symbol: '7m', full: '7ª Menor', quality: 'Dissonância Leve', tone: 'red' },
  { semitones: 11, symbol: '7M', full: '7ª Maior', quality: 'Dissonância Leve', tone: 'red' },
  { semitones: 12, symbol: '8J', full: '8ª Justa', quality: 'Consonância Estável', tone: 'green' }
];

export const REFERENCES = [
  { name: 'C', midi: 60, label: 'DÓ CENTRAL' },
  { name: 'A', midi: 69, label: 'LÁ — 440 HZ' },
  { name: 'G', midi: 67, label: 'SOL' }
];
