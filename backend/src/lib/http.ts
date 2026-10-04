export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Resource') => new HttpError(404, 'not_found', `${what} not found`);

export const lockedError = () =>
  new HttpError(403, 'locked', 'This content is part of a paid package. Upgrade your plan to unlock it.');

type QueryResult = { data: unknown; error: { message: string } | null };

function dbError(error: { message: string }) {
  return new HttpError(500, 'db_error', error.message);
}

// The helpers infer from the whole response type (a success/failure union),
// so the row type survives even for select('*').

/** Unwraps a list query, throwing on database errors. */
export function rows<R extends QueryResult>(res: R): NonNullable<R['data']> {
  if (res.error) throw dbError(res.error);
  return (res.data ?? []) as NonNullable<R['data']>;
}

/** Unwraps a .maybeSingle() query. */
export function maybe<R extends QueryResult>(res: R): NonNullable<R['data']> | null {
  if (res.error) throw dbError(res.error);
  return (res.data ?? null) as NonNullable<R['data']> | null;
}

/** Unwraps a .maybeSingle() query and turns "no row" into a 404. */
export function one<R extends QueryResult>(res: R, what: string): NonNullable<R['data']> {
  const data = maybe(res);
  if (data == null) throw notFound(what);
  return data;
}

/** Unwraps a write that returns nothing useful. */
export function ok(res: { error: { message: string } | null }): void {
  if (res.error) throw dbError(res.error);
}
