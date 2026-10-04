import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { z, ZodError } from 'zod';
import { HttpError } from '../lib/http.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: 'not_found', message: `No route for ${req.method} ${req.path}` } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: { code: 'invalid_request', message: z.prettifyError(err) } });
    return;
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'The image must be smaller than 2 MB' : err.message;
    res.status(400).json({ error: { code: 'invalid_upload', message } });
    return;
  }
  // body-parser and similar errors carry a 4xx status.
  const status = (err as { status?: number }).status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ error: { code: 'bad_request', message: (err as Error).message } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: 'internal', message: 'Something went wrong. Please try again.' } });
}
