import { Router } from 'express';
import { deselectItem, listSelected, moveSelectedBefore, selectItem } from '../store/store';
import { rwQueue } from '../queues';
import { parsePageQuery } from '../pageQuery';

export const selectedRouter = Router();

selectedRouter.get('/', async (req, res) => {
  const { search, offset, limit } = parsePageQuery(req.query);

  const key = `selected:${search}:${offset}:${limit}`;
  try {
    const page = await rwQueue.enqueue(key, () => listSelected({ search, offset, limit }));
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

selectedRouter.post('/select', async (req, res) => {
  const id = Number(req.body?.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'invalid_id' });
    return;
  }

  const key = `select:${id}`;
  try {
    const result = await rwQueue.enqueue(key, () => selectItem(id));
    if (!result.ok) {
      res.status(409).json({ error: result.reason });
      return;
    }
    res.status(200).json({ id });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

selectedRouter.post('/deselect', async (req, res) => {
  const id = Number(req.body?.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'invalid_id' });
    return;
  }

  const key = `deselect:${id}`;
  try {
    const result = await rwQueue.enqueue(key, () => deselectItem(id));
    if (!result.ok) {
      res.status(409).json({ error: result.reason });
      return;
    }
    res.status(200).json({ id });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

selectedRouter.post('/reorder', async (req, res) => {
  const id = Number(req.body?.id);
  const beforeIdRaw = req.body?.beforeId;
  const beforeId = beforeIdRaw === null || beforeIdRaw === undefined ? null : Number(beforeIdRaw);
  if (!Number.isInteger(id) || (beforeId !== null && !Number.isInteger(beforeId))) {
    res.status(400).json({ error: 'invalid_id' });
    return;
  }

  const key = `reorder:${id}:${beforeId ?? 'end'}`;
  try {
    const result = await rwQueue.enqueue(key, () => moveSelectedBefore(id, beforeId));
    if (!result.ok) {
      res.status(409).json({ error: result.reason });
      return;
    }
    res.status(200).json({ id, beforeId });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});
