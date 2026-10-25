/** Result box under a quiz answer. */
export interface FeedbackResult {
  ok: boolean;
  title: string;
  explanation: string;
  theory?: string;
}

export type AnswerMark = 'correct' | 'wrong';

/** Utility class for an answer button's state. */
export function markClass(mark: AnswerMark | undefined, selected = false): string | false {
  return mark === 'correct'
    ? 'state-correct'
    : mark === 'wrong'
      ? 'state-wrong'
      : selected && 'state-selected';
}
