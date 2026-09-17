export class Selection {
  private readonly ids = new Set<number>();
  private readonly order: number[] = [];

  has(id: number): boolean {
    return this.ids.has(id);
  }

  add(id: number): boolean {
    if (this.ids.has(id)) return false;
    this.ids.add(id);
    this.order.push(id);
    return true;
  }

  remove(id: number): boolean {
    if (!this.ids.has(id)) return false;
    this.ids.delete(id);
    this.order.splice(this.order.indexOf(id), 1);
    return true;
  }

  moveBefore(id: number, beforeId: number | null): boolean {
    const idx = this.order.indexOf(id);
    if (idx === -1) return false;
    this.order.splice(idx, 1);

    const targetIdx = beforeId === null ? -1 : this.order.indexOf(beforeId);
    if (targetIdx === -1) {
      this.order.push(id);
    } else {
      this.order.splice(targetIdx, 0, id);
    }
    return true;
  }

  list(): readonly number[] {
    return this.order;
  }
}
