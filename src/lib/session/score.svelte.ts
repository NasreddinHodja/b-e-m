import { session } from '#lib/backend/session.svelte.js';

/** Which quiz an answer came from: harmonic (acordes), intervals, melodic dictation. */
export type QuizModule = 'h' | 'i' | 'd';

export interface Answer {
  id: number;
  module: QuizModule;
  /** Short tag for the full history list: `H·A`, `H·F`, `I`, `D`. */
  tag: string;
  /** What was asked, e.g. `Lá → Mi`. */
  prompt: string;
  /** What was answered, e.g. `3M` or `✗ era Dm`. */
  answer: string;
  correct: boolean;
  /** `HH:MM` when it was answered. */
  time: string;
  /** Interval answers carry the asked interval, for the per-interval stats. */
  semitones?: number;
}

export interface ModuleScore {
  correct: number;
  wrong: number;
}

const clock = (d: Date) =>
  `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

/** Every scored answer of this session. Scores and stats are derived from it. */
class Score {
  answers = $state<Answer[]>([]);
  #nextId = 0;

  total = $derived(tally(this.answers));
  byModule = $derived({
    h: tally(this.answers.filter((a) => a.module === 'h')),
    i: tally(this.answers.filter((a) => a.module === 'i')),
    d: tally(this.answers.filter((a) => a.module === 'd'))
  } satisfies Record<QuizModule, ModuleScore>);

  record(a: Omit<Answer, 'id' | 'time'>) {
    this.answers.unshift({ ...a, id: this.#nextId++, time: clock(new Date()) });
    const { h, i, d } = this.byModule;
    void session.saveStats({
      gScoreC: this.total.correct,
      gScoreW: this.total.wrong,
      hScoreC: h.correct,
      hScoreW: h.wrong,
      iScoreC: i.correct,
      iScoreW: i.wrong,
      dScoreC: d.correct,
      dScoreW: d.wrong
    });
  }

  /** Newest first, capped like the legacy lists. */
  recent(module?: QuizModule, limit = 30): Answer[] {
    const list = module ? this.answers.filter((a) => a.module === module) : this.answers;
    return list.slice(0, limit);
  }

  reset() {
    this.answers = [];
  }
}

function tally(list: Answer[]): ModuleScore {
  let correct = 0;
  for (const a of list) if (a.correct) correct++;
  return { correct, wrong: list.length - correct };
}

export const score = new Score();
