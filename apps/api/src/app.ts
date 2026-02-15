import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { apiRouter } from './routes';
import { userContextMiddleware } from './middleware/userContext';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(userContextMiddleware);
  app.use('/api', apiRouter);
  return app;
}
