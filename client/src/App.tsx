import { useCallback, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { usePaginatedList } from './hooks/usePaginatedList';
import {
  addItemApi,
  deselectItemApi,
  fetchItemsPage,
  fetchSelectedPage,
  reorderSelectedApi,
  selectItemApi,
} from './api/client';
import { Item } from './types';

const BASE_MAX = 1_000_000;

export default function App() {
  const [leftSearchInput, setLeftSearchInput] = useState('');
  const [rightSearchInput, setRightSearchInput] = useState('');
  const leftSearch = useDebouncedValue(leftSearchInput, 300);
  const rightSearch = useDebouncedValue(rightSearchInput, 300);

  const left = usePaginatedList(leftSearch, 0, fetchItemsPage);
  const right = usePaginatedList(rightSearch, 0, fetchSelectedPage);

  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const insertIntoLeft = useCallback(
    (item: Item) => {
      if (item.id <= BASE_MAX) left.insertSorted(item);
      else left.append(item);
    },
    [left]
  );

  const handleAdd = useCallback(
    async (id: number) => {
      setAdding(true);
      setAddError(null);
      try {
        const item = await addItemApi(id);
        if (!leftSearch || String(item.id).includes(leftSearch)) {
          insertIntoLeft(item);
        }
      } catch (err) {
        setAddError(err instanceof Error ? err.message : 'Ошибка добавления');
      } finally {
        setAdding(false);
      }
    },
    [leftSearch, insertIntoLeft]
  );

  const handleSelect = useCallback(
    (item: Item) => {
      left.removeItem(item.id);
      if (!rightSearch || String(item.id).includes(rightSearch)) {
        right.append(item);
      }
      selectItemApi(item.id).catch(() => {
        right.removeItem(item.id);
        if (!leftSearch || String(item.id).includes(leftSearch)) {
          insertIntoLeft(item);
        }
      });
    },
    [left, right, leftSearch, rightSearch, insertIntoLeft]
  );

  const handleDeselect = useCallback(
    (item: Item) => {
      right.removeItem(item.id);
      if (!leftSearch || String(item.id).includes(leftSearch)) {
        insertIntoLeft(item);
      }
      deselectItemApi(item.id).catch(() => {
        left.removeItem(item.id);
        if (!rightSearch || String(item.id).includes(rightSearch)) {
          right.append(item);
        }
      });
    },
    [left, right, leftSearch, rightSearch, insertIntoLeft]
  );

  const handleReorder = useCallback(
    (activeId: number, overId: number) => {
      const ids = right.items.map((i) => i.id);
      const fromIndex = ids.indexOf(activeId);
      const toIndex = ids.indexOf(overId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

      right.reorderLocal(activeId, toIndex);

      const newIds = arrayMove(ids, fromIndex, toIndex);
      const newPos = newIds.indexOf(activeId);
      const beforeId = newPos + 1 < newIds.length ? newIds[newPos + 1] : null;

      reorderSelectedApi(activeId, beforeId).catch(() => {
        console.error('Не удалось сохранить порядок элементов на сервере');
      });
    },
    [right]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1100px] px-4 pt-6 pb-12">
        <header>
          <h1 className="mb-5 text-[22px] font-bold text-slate-900">Список из 1 000 000 элементов</h1>
        </header>
        <div className="flex flex-wrap gap-5">
          <LeftPanel
            items={left.items}
            hasMore={left.hasMore}
            loading={left.loading}
            listError={left.error}
            onLoadMore={left.loadMore}
            search={leftSearchInput}
            onSearchChange={setLeftSearchInput}
            onSelect={handleSelect}
            onAdd={handleAdd}
            adding={adding}
            addError={addError}
          />
          <RightPanel
            items={right.items}
            hasMore={right.hasMore}
            loading={right.loading}
            listError={right.error}
            onLoadMore={right.loadMore}
            search={rightSearchInput}
            onSearchChange={setRightSearchInput}
            onDeselect={handleDeselect}
            onReorder={handleReorder}
          />
        </div>
      </div>
    </div>
  );
}
