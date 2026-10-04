import type { NextFunction, Request, Response } from 'express';
import { db } from '../lib/supabase.js';
import { HttpError } from '../lib/http.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string | null };
    }
  }
}

/**
 * Verifies the Supabase access token from `Authorization: Bearer <token>`.
 * getClaims() checks the signature locally against the project's JWKS (asymmetric keys)
 * or falls back to the Auth server (legacy symmetric keys), and rejects expired tokens.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? '');
  if (!match) throw new HttpError(401, 'unauthorized', 'Missing bearer token');

  const { data, error } = await db.auth.getClaims(match[1]);
  const claims = data?.claims;
  if (error || !claims || claims.role !== 'authenticated' || typeof claims.sub !== 'string') {
    throw new HttpError(401, 'unauthorized', 'Your session has expired. Please sign in again.');
  }

  req.user = { id: claims.sub, email: typeof claims.email === 'string' ? claims.email : null };
  next();
}

export function userId(req: Request): string {
  if (!req.user) throw new HttpError(401, 'unauthorized', 'Not signed in');
  return req.user.id;
}
