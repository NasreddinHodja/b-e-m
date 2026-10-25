/** Pitch-class names as the app displays them (mixed sharps/flats, like the legacy UI). */
export const PC_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export const mod12 = (n: number) => ((n % 12) + 12) % 12;

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function pcName(midi: number): string {
  return PC_NAMES[mod12(midi)];
}
