import { audio } from '#lib/audio/engine.svelte.js';
import { midiToFreq } from '#lib/music/pitch.js';
import { score } from '#lib/session/score.svelte.js';
import {
  candidateSequence,
  distractors,
  slonimskySequence,
  type Contour,
  type Focus,
  type Motion,
  type Transform
} from './melody.js';
import { buildModel, flattenEvents, toLily, type Model } from './model.js';
import { rhythmDurations, type Meter, type Motor } from './rhythm.js';
import { SCALES, TONICS, pcOf, type ScaleType } from './theory.js';

/**
 * The form, as raw input values: the legacy code parsed them at the moment of use
 * (`Number(x) || 1`, `parseInt(x) || 70`), and so do we.
 */
export interface DitadoSettings {
  mode: 'melody' | 'slonimsky';
  key: string;
  scale: ScaleType;
  meter: Meter;
  bars: string;
  rhythm: Motor;
  range: string;
  maxLeap: string;
  motion: Motion;
  contour: Contour;
  focus: Focus;
  pattern: string;
  reps: string;
  transform: Transform;
  bpm: string;
}

export type QuizState =
  | { kind: 'hint'; text: string }
  | {
      kind: 'quiz';
      options: string[];
      correct: string;
      picked: string | null;
      answerShown: boolean;
    };

/** Melodic dictation: generate, listen, guess the degrees. State survives navigation. */
class Ditado {
  settings = $state<DitadoSettings>({
    mode: 'melody',
    key: '0',
    scale: 'major',
    meter: '4/4',
    bars: '2',
    rhythm: 'basic',
    range: '12',
    maxLeap: '7',
    motion: 'mixed',
    contour: 'mixed',
    focus: 'scale',
    pattern: '2 1 2 3',
    reps: '2',
    transform: 'original',
    bpm: '70'
  });

  current = $state.raw<{ notes: number[]; model: Model } | null>(null);
  /** Tonic MIDI the staff was engraved with (octave placement). */
  staffBaseMidi = $state(60);
  staffBlurred = $state(false);
  metric = $state('—');
  quiz = $state<QuizState>({ kind: 'hint', text: 'Gere um exercício para começar.' });
  copyLabel = $state('Copiar .ly');
  /** The source was just copied (the button shows a check). */
  copied = $state(false);
  /** The LilyPond block is expanded. */
  lilyOpen = $state(false);
  #revealed = false;

  constructor() {
    this.generate();
  }

  /** Tonic pitch class from the form as it is now. */
  get #tonicPc() {
    return pcOf(TONICS[Number(this.settings.key) || 0]);
  }

  get #bpm() {
    return Math.max(30, parseInt(this.settings.bpm) || 70);
  }

  generate() {
    const s = this.settings;
    this.#revealed = false;
    const bars = Math.max(1, Number(s.bars) || 1);
    const patterns = rhythmDurations(s.meter, s.rhythm, bars);
    const slotCount = patterns.reduce((n, d) => n + d.length, 0);
    const baseMidi = 60 + this.#tonicPc;
    let notes: number[] | null = null;
    let tries = 0;
    if (s.mode === 'slonimsky') {
      while (!notes && tries++ < 200)
        notes = slonimskySequence({
          pattern: s.pattern,
          reps: s.reps,
          transform: s.transform,
          targetCount: slotCount,
          baseMidi
        });
    } else {
      while (!notes && tries++ < 600)
        notes = candidateSequence({
          slotCount,
          scale: SCALES[s.scale],
          startDeg: 0,
          endDeg: 0,
          range: Number(s.range),
          maxLeap: Number(s.maxLeap),
          motion: s.motion,
          contour: s.contour,
          focus: s.focus,
          baseMidi
        });
    }
    if (!notes) {
      this.quiz = {
        kind: 'hint',
        text:
          s.mode === 'slonimsky'
            ? 'Padrão grande demais para A2–A5. Reduza as repetições ou o padrão.'
            : 'Não foi possível gerar — afrouxe um parâmetro.'
      };
      return;
    }
    const model = buildModel(notes, patterns, {
      tonicName: TONICS[Number(s.key) || 0],
      scaleType: s.scale,
      meter: s.meter,
      motor: s.rhythm,
      bars
    });
    this.current = { notes, model };
    this.metric =
      model.meter +
      ' · ' +
      model.metricGroups.map((g) => (g.duration === 1 ? '♩' : '♩.')).join(' + ');
    this.staffBaseMidi = baseMidi;
    this.#renderQuiz(false);
    this.staffBlurred = true;
  }

  /** Lay out a fresh, shuffled set of options. Reveal does this too, re-enabling them. */
  #renderQuiz(forceReveal: boolean) {
    const notes = this.current!.notes;
    this.quiz = {
      kind: 'quiz',
      options: distractors(notes).sort(() => Math.random() - 0.5),
      correct: notes.join(','),
      picked: null,
      answerShown: this.#revealed || forceReveal
    };
  }

  pick(option: string) {
    const q = this.quiz;
    if (q.kind !== 'quiz' || q.picked !== null || !this.current) return;
    q.picked = option;
    q.answerShown = true;
    this.staffBlurred = false;
    const ok = option === q.correct;
    score.record({
      module: 'd',
      tag: 'D',
      prompt: this.current.model.meter,
      answer: ok ? '✓' : '✗',
      correct: ok
    });
  }

  reveal() {
    if (!this.current) return;
    this.#revealed = true;
    this.staffBlurred = false;
    this.#renderQuiz(true);
  }

  play() {
    if (!this.current) return;
    const beat = 60 / this.#bpm;
    let t = audio.now() + 0.1;
    const base = 60 + this.#tonicPc;
    for (const e of flattenEvents(this.current.model)) {
      audio.playNote(midiToFreq(base + e.offset), t, Math.max(0.12, beat * e.dur * 0.9));
      t += beat * e.dur;
    }
  }

  playRoot() {
    audio.playNote(midiToFreq(60 + this.#tonicPc), audio.now(), 1.5);
  }

  get answerEvents() {
    return this.current ? flattenEvents(this.current.model) : [];
  }

  lily(): string {
    return this.current ? toLily(this.current.model, 60 + this.#tonicPc, this.#bpm) : '';
  }

  async copyLily() {
    try {
      await navigator.clipboard.writeText(this.lily());
      this.copyLabel = 'Copiado';
      this.copied = true;
      setTimeout(() => {
        this.copyLabel = 'Copiar .ly';
        this.copied = false;
      }, 1200);
    } catch {
      // Clipboard denied: the legacy app ignored it too.
    }
  }

  downloadLily() {
    const blob = new Blob([this.lily()], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bem-ditado.ly';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

export const ditado = new Ditado();
