import { ActionResult, Item } from '../types';
import { PageQuery } from '../pageQuery';
import { Selection } from './Selection';

const BASE_MIN = 1;
const BASE_MAX = 1_000_000;

function label(id: number): string {
  return `Item ${id}`;
}

const baseItems: Item[] = new Array(BASE_MAX);
for (let id = BASE_MIN; id <= BASE_MAX; id++) {
  baseItems[id - 1] = { id, label: label(id) };
}

const extraItems: Item[] = [];

const selection = new Selection();

function existsId(id: number): boolean {
  return (id >= BASE_MIN && id <= BASE_MAX) || extraItems.some((item) => item.id === id);
}

function toItem(id: number): Item {
  if (id >= BASE_MIN && id <= BASE_MAX) return baseItems[id - 1];
  return extraItems.find((item) => item.id === id)!;
}

export function addItem(id: number): ActionResult {
  if (!Number.isInteger(id) || id <= 0) return { ok: false, reason: 'invalid' };
  if (existsId(id)) return { ok: false, reason: 'duplicate' };
  extraItems.push({ id, label: label(id) });
  return { ok: true };
}

function* iterateAllItems(): Generator<Item> {
  yield* baseItems;
  yield* extraItems;
}

export function listItems({ search, offset, limit }: PageQuery): { items: Item[]; nextOffset: number | null } {
  const items: Item[] = [];
  let matchedCount = 0;
  let hasMore = false;

  for (const item of iterateAllItems()) {
    if (selection.has(item.id)) continue;
    if (search && !String(item.id).includes(search)) continue;

    if (matchedCount < offset) {
      matchedCount++;
      continue;
    }
    if (items.length < limit) {
      items.push(item);
      matchedCount++;
    } else {
      hasMore = true;
      break;
    }
  }

  return { items, nextOffset: hasMore ? offset + items.length : null };
}

export function listSelected({ search, offset, limit }: PageQuery): {
  items: Item[];
  nextOffset: number | null;
} {
  const order = selection.list();
  const filtered = search ? order.filter((id) => String(id).includes(search)) : order;
  const page = filtered.slice(offset, offset + limit).map(toItem);
  const nextOffset = offset + limit < filtered.length ? offset + limit : null;
  return { items: page, nextOffset };
}

export function selectItem(id: number): ActionResult {
  if (!existsId(id)) return { ok: false, reason: 'not_found' };
  if (!selection.add(id)) return { ok: false, reason: 'already_selected' };
  return { ok: true };
}

export function deselectItem(id: number): ActionResult {
  if (!selection.remove(id)) return { ok: false, reason: 'not_selected' };
  return { ok: true };
}

export function moveSelectedBefore(id: number, beforeId: number | null): ActionResult {
  if (!selection.moveBefore(id, beforeId)) return { ok: false, reason: 'not_selected' };
  return { ok: true };
}
