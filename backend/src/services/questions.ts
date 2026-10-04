import type { AnswerReveal, PublicQuestion, QuestionOption } from '../contracts.js';
import type { Json } from '../db/types.js';

export function parseOptions(options: Json): QuestionOption[] {
  if (!Array.isArray(options)) return [];
  return options.flatMap((o) =>
    o && typeof o === 'object' && !Array.isArray(o) && typeof o.key === 'string' && typeof o.text === 'string'
      ? [{ key: o.key, text: o.text }]
      : [],
  );
}

export interface QuestionRow {
  id: string;
  stem: string;
  options: Json;
  difficulty: number;
  correct_option: string;
  explanation: string | null;
}

export interface AttemptRow {
  selected_option: string;
  is_correct: boolean;
}

/** Strips the answer unless the student has already answered the question. */
export function toPublicQuestion(q: QuestionRow, attempt: AttemptRow | null, bookmarked: boolean): PublicQuestion {
  const reveal: AnswerReveal | null = attempt
    ? {
        selected_option: attempt.selected_option,
        is_correct: attempt.is_correct,
        correct_option: q.correct_option,
        explanation: q.explanation,
      }
    : null;
  return {
    id: q.id,
    stem: q.stem,
    options: parseOptions(q.options),
    difficulty: q.difficulty,
    bookmarked,
    attempt: reveal,
  };
}
