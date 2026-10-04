/** Answers saved or submitted after deadline + grace are ignored. */
export const SUBMIT_GRACE_MS = 30_000;

export function isPastDeadline(deadlineAt: string, now = new Date(), graceMs = SUBMIT_GRACE_MS): boolean {
  return now.getTime() > Date.parse(deadlineAt) + graceMs;
}

export interface ScorableQuestion {
  id: string;
  correct_option: string;
  optionKeys: string[];
}

/**
 * Keeps only answers for questions in the test with a valid option key.
 * `null` clears a previously saved answer.
 */
export function mergeAnswers(
  saved: Record<string, string>,
  incoming: Record<string, string | null>,
  questions: ScorableQuestion[],
): Record<string, string> {
  const valid = new Map(questions.map((q) => [q.id, new Set(q.optionKeys)]));
  const merged: Record<string, string> = {};
  for (const [id, key] of Object.entries(saved)) {
    if (valid.get(id)?.has(key)) merged[id] = key;
  }
  for (const [id, key] of Object.entries(incoming)) {
    const keys = valid.get(id);
    if (!keys) continue;
    if (key === null) delete merged[id];
    else if (keys.has(key)) merged[id] = key;
  }
  return merged;
}

export function scoreAnswers(questions: ScorableQuestion[], answers: Record<string, string>) {
  let score = 0;
  const results = questions.map((q) => {
    const selected = answers[q.id] ?? null;
    const isCorrect = selected === q.correct_option;
    if (isCorrect) score++;
    return { question_id: q.id, selected_option: selected, is_correct: isCorrect };
  });
  return { score, total: questions.length, results };
}

export function asAnswerMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) if (typeof v === 'string') out[k] = v;
  return out;
}
