import { Item, PageResult } from '../types';

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return typeof data?.error === 'string' ? data.error : fallback;
  } catch {
    return fallback;
  }
}

export async function fetchItemsPage(search: string, offset: number): Promise<PageResult> {
  return fetchPage(search, offset, 'items')
}

export async function fetchSelectedPage(search: string, offset: number): Promise<PageResult> {
  return fetchPage(search, offset, 'selected')
}

export async function fetchPage(search: string, offset: number, type: 'items' | 'selected'): Promise<PageResult> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('offset', String(offset));
  params.set('limit', '20');

  const res = await fetch(`/api/${type}?${params.toString()}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, 'Не удалось загрузить список'));
  const data = (await res.json()) as { items: Item[]; nextOffset: number | null };
  return { items: data.items, nextParam: data.nextOffset };
}

const ERROR_MESSAGES: Record<string, string> = {
  duplicate: 'Такой ID уже существует',
  invalid: 'Некорректный ID',
  invalid_id: 'Некорректный ID',
  not_found: 'Элемент не найден',
  already_selected: 'Элемент уже выбран',
  not_selected: 'Элемент не выбран',
};

function translateError(code: string): string {
  return ERROR_MESSAGES[code] ?? code;
}

export async function addItemApi(id: number): Promise<Item> {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(translateError(await parseErrorMessage(res, 'add_failed')));
  return res.json();
}

export async function selectItemApi(id: number): Promise<void> {
  const res = await fetch('/api/selected/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(translateError(await parseErrorMessage(res, 'select_failed')));
}

export async function deselectItemApi(id: number): Promise<void> {
  const res = await fetch('/api/selected/deselect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(translateError(await parseErrorMessage(res, 'deselect_failed')));
}

export async function reorderSelectedApi(id: number, beforeId: number | null): Promise<void> {
  const res = await fetch('/api/selected/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, beforeId }),
  });
  if (!res.ok) throw new Error(translateError(await parseErrorMessage(res, 'reorder_failed')));
}
