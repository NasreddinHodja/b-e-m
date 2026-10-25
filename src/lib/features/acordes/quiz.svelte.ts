import { audio } from '#lib/audio/engine.svelte.js';
import type { AnswerMark, FeedbackResult } from '#lib/ui/types.js';
import { midiToFreq, pcName } from '#lib/music/pitch.js';
import { score } from '#lib/session/score.svelte.js';
import {
  FUNC_NAMES,
  FUNCS,
  chordPool,
  type Chord,
  type ChordQuality,
  type Pool
} from './chords.js';

/** "Which chord is playing, and what is A in it?" State survives navigating away and back. */
class AcordesQuiz {
  octave = $state(4);
  randPool = $state<Pool>('both');
  guessPool = $state<Pool>('major');
  teacherQuality = $state<ChordQuality>('major');

  chord = $state<Chord>(null!);
  revealed = $state(false);
  teacherMode = $state(false);
  /** The teacher panel is expanded. Kept across navigation, like the rest of the quiz. */
  teacherOpen = $state(false);

  guessAnswered = $state(false);
  /** Marks on the guess buttons, by chord name. Cleared when the guess grid changes. */
  guessMarks = $state<Record<string, AnswerMark>>({});
  guessFeedback = $state<FeedbackResult | null>(null);

  selectedFunc = $state<string | null>(null);
  funcAnswered = $state(false);
  funcMarks = $state<Record<string, AnswerMark>>({});
  funcFeedback = $state<FeedbackResult | null>(null);

  constructor() {
    this.newRandom(false);
  }

  get aMidi() {
    return 12 * (this.octave + 1) + 9;
  }

  get chordMidis() {
    const r = this.chord.root + (this.octave === 3 ? -12 : this.octave === 5 ? 12 : 0);
    return this.chord.intervals.map((i) => r + i);
  }

  get chordNotes() {
    return this.chordMidis.map(pcName).join(' — ');
  }

  /** Semitones from the chord root up to A. */
  get aSemis() {
    return ((this.aMidi % 12) - (this.chord.root % 12) + 12) % 12;
  }

  playA() {
    audio.playNote(midiToFreq(this.aMidi), audio.now());
  }

  playChord() {
    const t = audio.now();
    this.chordMidis.forEach((m, i) => audio.playNote(midiToFreq(m), t + i * 0.07, 2.2));
  }

  newRandom(autoplay = true) {
    const pool = chordPool(this.randPool);
    this.load(pool[Math.floor(Math.random() * pool.length)], false, autoplay);
  }

  load(chord: Chord, teacherMode = false, autoplay = true) {
    this.chord = chord;
    this.revealed = false;
    this.teacherMode = teacherMode;
    this.guessAnswered = false;
    this.guessMarks = {};
    this.guessFeedback = null;
    this.selectedFunc = null;
    this.funcAnswered = false;
    this.funcMarks = {};
    this.funcFeedback = null;
    if (autoplay) setTimeout(() => this.playChord(), 80);
  }

  toggleReveal() {
    this.revealed = !this.revealed;
  }

  setGuessPool(pool: Pool) {
    this.guessPool = pool;
    // The legacy grid was rebuilt from scratch here, dropping the marks.
    this.guessMarks = {};
  }

  guess(pick: Chord) {
    if (this.guessAnswered) return;
    this.guessAnswered = true;
    const cur = this.chord;
    const ok = pick.name === cur.name;
    this.guessMarks = { [cur.name]: 'correct', ...(ok ? {} : { [pick.name]: 'wrong' }) };
    this.revealed = true;
    const semi = this.aSemis;
    this.guessFeedback = {
      ok,
      title: ok ? '✓ Acorde correto!' : `✗ Era ${cur.name}.`,
      explanation: ok
        ? `É o acorde ${cur.name} (${cur.type}). O Lá (A) é a ${FUNC_NAMES[semi]} — ${semi} semitom${semi !== 1 ? 's' : ''} acima da fundamental.`
        : `Você escolheu ${pick.name}. O acorde correto é ${cur.name} (${cur.type}) — o Lá (A) é a ${FUNC_NAMES[semi]} dele.`
    };
    if (!this.teacherMode) {
      score.record({
        module: 'h',
        tag: 'H·A',
        prompt: `${pick.name} → ${cur.name}`,
        answer: ok ? '✓' : `✗ era ${cur.name}`,
        correct: ok
      });
    }
  }

  selectFunc(fn: string) {
    if (this.funcAnswered) return;
    this.selectedFunc = fn;
  }

  checkFunc() {
    const picked = this.selectedFunc;
    if (!picked || this.funcAnswered) return;
    this.funcAnswered = true;
    const cur = this.chord;
    const semi = this.aSemis;
    const correct = FUNCS[semi] ?? '?';
    const ok = picked === correct;
    this.funcMarks = { [correct]: 'correct', ...(ok ? {} : { [picked]: 'wrong' }) };
    this.revealed = true;
    this.funcFeedback = {
      ok,
      title: ok ? '✓ Correto!' : '✗ Errado.',
      explanation: ok
        ? `O Lá (A) é a ${FUNC_NAMES[semi]} do acorde ${cur.name}. (${semi} semitons acima da fundamental)`
        : `Você respondeu "${picked}", mas o correto é "${correct}". O Lá (A) é a ${FUNC_NAMES[semi]} do acorde ${cur.name} — ${semi} semitons acima da fundamental ${cur.name}.`
    };
    if (!this.teacherMode) {
      score.record({
        module: 'h',
        tag: 'H·F',
        prompt: cur.name,
        answer: `A = ${picked}${ok ? '' : ' → ' + correct}`,
        correct: ok
      });
    }
  }
}

export const acordes = new AcordesQuiz();
