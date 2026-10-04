import cors from 'cors';
import express, { Router } from 'express';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { commerceRoutes } from './routes/commerce.js';
import { homeRoutes } from './routes/home.js';
import { issueRoutes } from './routes/issues.js';
import { libraryRoutes } from './routes/library.js';
import { meRoutes } from './routes/me.js';
import { publicRoutes } from './routes/public.js';
import { qbankRoutes } from './routes/qbank.js';
import { testRoutes } from './routes/tests.js';
import { videoRoutes } from './routes/videos.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors()); // only needed for the Expo web preview; native apps ignore CORS
  app.use(express.json({ limit: '200kb' }));

  const v1 = Router();
  v1.use(publicRoutes);
  v1.use(requireAuth);
  v1.use(meRoutes, homeRoutes, videoRoutes, qbankRoutes, testRoutes, libraryRoutes, commerceRoutes, issueRoutes);
  app.use('/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
