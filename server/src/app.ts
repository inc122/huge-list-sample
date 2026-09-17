import path from 'path';
import express from 'express';
import cors from 'cors';
import { itemsRouter } from './routes/items';
import { selectedRouter } from './routes/selected';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/items', itemsRouter);
  app.use('/api/selected', selectedRouter);

  app.use(express.static(path.join(__dirname, '../../client/dist')));

  return app;
}
