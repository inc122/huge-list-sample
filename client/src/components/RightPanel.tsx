import { useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Item } from '../types';
import { useInfiniteScrollSentinel } from '../hooks/useInfiniteScrollSentinel';

interface RightPanelProps {
  items: Item[];
  hasMore: boolean;
  loading: boolean;
  listError: string | null;
  onLoadMore: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  onDeselect: (item: Item) => void;
  onReorder: (activeId: number, overId: number) => void;
}

function SortableRow({ item, onDeselect }: { item: Item; onDeselect: (item: Item) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2.5 border-b border-slate-300 bg-white px-2.5 py-2 last:border-b-0"
      {...attributes}
    >
      <span className="cursor-grab select-none text-slate-500" {...listeners}>
        ⠿
      </span>
      <span className="flex-1">{item.label}</span>
      <button
        className="cursor-pointer whitespace-nowrap rounded-md border border-red-600 bg-transparent px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-600 hover:text-white"
        onClick={() => onDeselect(item)}
      >
        × Убрать
      </button>
    </div>
  );
}

export function RightPanel(props: RightPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useInfiniteScrollSentinel(containerRef, props.onLoadMore, props.hasMore && !props.loading);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    props.onReorder(Number(active.id), Number(over.id));
  };

  return (
    <section className="flex flex-1 basis-[420px] min-w-[320px] flex-col rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="mb-3 text-base font-semibold text-slate-900">Выбранные элементы</h2>
      <input
        className="mb-2.5 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
        placeholder="Фильтр по ID…"
        value={props.search}
        onChange={(e) => props.onSearchChange(e.target.value)}
      />

      <div className="h-[520px] overflow-y-auto rounded-lg border border-slate-300 p-1.5 overflow-x-hidden" ref={containerRef}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={props.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {props.items.map((item) => (
              <SortableRow key={item.id} item={item} onDeselect={props.onDeselect} />
            ))}
          </SortableContext>
        </DndContext>
        {props.hasMore && <div ref={sentinelRef} className="h-px" />}
        {props.loading && <div className="py-3 text-center text-[13px] text-slate-500">Загрузка…</div>}
        {props.listError && <div className="mb-2 text-[13px] text-red-600">{props.listError}</div>}
        {!props.loading && props.items.length === 0 && !props.listError && (
          <div className="py-3 text-center text-[13px] text-slate-500">Пока ничего не выбрано</div>
        )}
      </div>
    </section>
  );
}
