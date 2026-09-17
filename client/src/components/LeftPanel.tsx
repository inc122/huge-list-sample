import { FormEvent, useRef, useState } from 'react';
import { Item } from '../types';
import { useInfiniteScrollSentinel } from '../hooks/useInfiniteScrollSentinel';

interface LeftPanelProps {
  items: Item[];
  hasMore: boolean;
  loading: boolean;
  listError: string | null;
  onLoadMore: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (item: Item) => void;
  onAdd: (id: number) => void;
  adding: boolean;
  addError: string | null;
}

const inputClasses = 'w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm';
const accentButtonClasses =
  'cursor-pointer whitespace-nowrap rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-[13px] text-white hover:enabled:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60';

export function LeftPanel(props: LeftPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useInfiniteScrollSentinel(containerRef, props.onLoadMore, props.hasMore && !props.loading);
  const [newId, setNewId] = useState('');

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    const id = Number(newId);
    if (!Number.isInteger(id) || id <= 0) return;
    props.onAdd(id);
    setNewId('');
  };

  return (
    <section className="flex flex-1 basis-[420px] min-w-[320px] flex-col rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="mb-3 text-base font-semibold text-slate-900">Все элементы</h2>
      <input
        className={`${inputClasses} mb-2.5`}
        placeholder="Фильтр по ID…"
        value={props.search}
        onChange={(e) => props.onSearchChange(e.target.value)}
      />
      <form className="mb-2 flex gap-2" onSubmit={handleAddSubmit}>
        <input
          className={`${inputClasses} flex-1`}
          type="number"
          placeholder="Новый ID"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
        />
        <button type="submit" className={accentButtonClasses} disabled={props.adding || !newId}>
          {props.adding ? 'Добавление…' : 'Добавить'}
        </button>
      </form>
      {props.addError && <div className="mb-2 text-[13px] text-red-600">{props.addError}</div>}

      <div className="h-[520px] overflow-y-auto rounded-lg border border-slate-300 p-1.5" ref={containerRef}>
        {props.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2.5 border-b border-slate-300 bg-white px-2.5 py-2 last:border-b-0"
          >
            <span className="flex-1">{item.label}</span>
            <button className={accentButtonClasses} onClick={() => props.onSelect(item)}>
              Выбрать →
            </button>
          </div>
        ))}
        {props.hasMore && <div ref={sentinelRef} className="h-px" />}
        {props.loading && <div className="py-3 text-center text-[13px] text-slate-500">Загрузка…</div>}
        {props.listError && <div className="mb-2 text-[13px] text-red-600">{props.listError}</div>}
        {!props.loading && props.items.length === 0 && !props.listError && (
          <div className="py-3 text-center text-[13px] text-slate-500">Ничего не найдено</div>
        )}
      </div>
    </section>
  );
}
