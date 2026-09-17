import { Router } from 'express';
import { addItem, listItems } from '../store/store';
import { addQueue, rwQueue } from '../queues';
import { parsePageQuery } from '../pageQuery';

export const itemsRouter = Router();

itemsRouter.get('/', async (req, res) => {
  const { search, offset, limit } = parsePageQuery(req.query);

  const key = `items:${search}:${offset}:${limit}`;
  try {
    const page = await rwQueue.enqueue(key, () => listItems({ search, offset, limit }));
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

itemsRouter.post('/', async (req, res) => {
  const id = Number(req.body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'invalid_id' });
    return;
  }

  const key = `add:${id}`;
  try {
    const result = await addQueue.enqueue(key, () => addItem(id));
    if (!result.ok) {
      const status = result.reason === 'duplicate' ? 409 : 400;
      res.status(status).json({ error: result.reason });
      return;
    }
    res.status(201).json({ id, label: `Item ${id}` });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});
