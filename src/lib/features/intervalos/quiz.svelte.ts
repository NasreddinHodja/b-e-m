import { audio } from '#lib/audio/engine.svelte.js';
import { midiToFreq, pcName } from '#lib/music/pitch.js';
import { score } from '#lib/session/score.svelte.js';
import type { AnswerMark, FeedbackResult } from '#lib/ui/types.js';
import { SvelteSet } from 'svelte/reactivity';
import {
  INTERVALS,
  ROOTS,
  notePt,
  type Interval,
  type IntervalGroup,
  type RootMode
} from './intervals.js';

export type Direction = 'asc' | 'desc' | 'both';

interface Current {
  rootMidi: number;
  rootName: string;
  interval: Interval;
  actualDir: 'asc' | 'desc';
}

/** "Which interval is this?" State survives navigating away and back. */
class IntervalosQuiz {
  direction = $state<Direction>('asc');
  rootMode = $state<RootMode>('fixed_A');
  active = new SvelteSet(INTERVALS.map((iv) => iv.semitones));

  current = $state<Current>(null!);
  revealed = $state(false);
  selected = $state<number | null>(null);
  /** The legacy grid rebuild hid the selection highlight but kept the selection itself. */
  selectedShown = $state(false);
  answered = $state(false);
  /** Mirrors the legacy direction tag's display toggling exactly, see `next` and `toggleReveal`. */
  directionShown = $state(true);
  marks = $state<Record<number, AnswerMark>>({});
  feedback = $state<FeedbackResult | null>(null);
  readonly activeIntervals = $derived(INTERVALS.filter((iv) => this.active.has(iv.semitones)));

  /** Hit rate per interval asked this session, for intervals asked at least once. */
  stats = $derived.by(() => {
    const out: { interval: Interval; pct: number }[] = [];
    for (const iv of INTERVALS) {
      let c = 0;
      let w = 0;
      for (const a of score.answers) {
        if (a.module !== 'i' || a.semitones !== iv.semitones) continue;
        if (a.correct) c++;
        else w++;
      }
      if (c + w > 0) out.push({ interval: iv, pct: Math.round((c / (c + w)) * 100) });
    }
    return out;
  });

  /**
   * Columns of the stats row. The legacy code only set them when there were stats, so after a
   * score reset the empty message keeps the previous column count.
   */
  statCols = $state<number | null>(null);

  constructor() {
    this.next(false);
  }

  get secondMidi() {
    const c = this.current;
    return c.rootMidi + (c.actualDir === 'asc' ? c.interval.semitones : -c.interval.semitones);
  }

  get noteA() {
    return notePt(this.current.rootName);
  }

  get noteB() {
    return notePt(pcName(this.secondMidi));
  }

  #freqs(): [number, number] {
    return [midiToFreq(this.current.rootMidi), midiToFreq(this.secondMidi)];
  }

  playNote1() {
    audio.playNote(this.#freqs()[0], audio.now());
  }

  playNote2() {
    audio.playNote(this.#freqs()[1], audio.now());
  }

  playSequence() {
    const [a, b] = this.#freqs();
    const t = audio.now();
    audio.playNote(a, t, 1.6);
    audio.playNote(b, t + 1.7, 1.6);
  }

  playHarmonic() {
    const [a, b] = this.#freqs();
    const t = audio.now();
    audio.playNote(a, t, 2.2);
    audio.playNote(b, t, 2.2);
  }

  next(autoplay = true) {
    this.answered = false;
    this.selected = null;
    this.selectedShown = false;
    this.revealed = false;
    this.marks = {};
    this.feedback = null;
    const pool = this.activeIntervals;
    const interval = pool[Math.floor(Math.random() * pool.length)];
    const roots = ROOTS[this.rootMode];
    const root = roots[Math.floor(Math.random() * roots.length)];
    const actualDir =
      this.direction === 'both' ? (Math.random() > 0.5 ? 'asc' : 'desc') : this.direction;
    this.current = { rootMidi: root.midi, rootName: root.name, interval, actualDir };
    this.directionShown = this.direction !== 'both';
    if (autoplay) setTimeout(() => this.playSequence(), 80);
  }

  toggleReveal() {
    this.revealed = !this.revealed;
    if (this.direction === 'both') this.directionShown = this.revealed;
  }

  #revealAll() {
    if (this.revealed) return;
    this.revealed = true;
    if (this.direction === 'both') this.directionShown = true;
  }

  toggleFilter(semitones: number) {
    if (this.active.has(semitones)) {
      if (this.active.size <= 1) return;
      this.active.delete(semitones);
    } else this.active.add(semitones);
    this.#onFiltersChanged(true);
  }

  filterAll() {
    for (const iv of INTERVALS) this.active.add(iv.semitones);
    this.#onFiltersChanged(false);
  }

  filterGroup(group: IntervalGroup) {
    this.active.clear();
    for (const iv of INTERVALS) if (iv.groups.includes(group)) this.active.add(iv.semitones);
    if (!this.active.size) this.filterAll();
    this.#onFiltersChanged(true);
  }

  #onFiltersChanged(redraw: boolean) {
    // The legacy answer grid was rebuilt on every filter change, dropping the button highlights.
    this.marks = {};
    this.selectedShown = false;
    if (redraw && !this.active.has(this.current.interval.semitones)) this.next();
  }

  select(semitones: number) {
    if (this.answered) return;
    this.selected = semitones;
    this.selectedShown = true;
  }

  check() {
    const picked = this.selected;
    if (this.answered || picked === null) return;
    this.answered = true;
    const iv = this.current.interval;
    const ok = picked === iv.semitones;
    this.marks = { [iv.semitones]: 'correct', ...(ok ? {} : { [picked]: 'wrong' }) };
    this.selectedShown = false;
    this.#revealAll();
    const wrong = INTERVALS.find((i) => i.semitones === picked);
    this.feedback = {
      ok,
      title: ok ? '✓ Correto!' : `✗ Era uma ${iv.name}.`,
      explanation: ok
        ? `É uma ${iv.name} (${iv.semitones} semitons).`
        : `Você respondeu ${wrong ? wrong.name : picked + ' st'}. O correto é ${iv.name} (${iv.semitones} st).`,
      theory: iv.theory
    };
    score.record({
      module: 'i',
      tag: 'I',
      prompt: `${this.noteA} → ${this.noteB}`,
      answer: ok ? iv.short : `${wrong ? wrong.short : '?'} → ${iv.short}`,
      correct: ok,
      semitones: iv.semitones
    });
    this.statCols = Math.min(this.stats.length, 7);
  }
}

export const intervalos = new IntervalosQuiz();
