type Waiter<T> = { 
  resolve: (value: T) => void;
  reject: (reason: unknown) => void 
};

interface QueueEntry<T> {
  run: () => T | Promise<T>;
  waiters: Waiter<T>[];
}

export class BatchQueue {
  private entries = new Map<string, QueueEntry<any>>();
  private order: string[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly intervalMs: number) {}

  enqueue<T>(key: string, run: () => T | Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let entry = this.entries.get(key) as QueueEntry<T> | undefined;
      if (!entry) {
        entry = { run, waiters: [] };
        this.entries.set(key, entry);
        this.order.push(key);
      }
      entry.waiters.push({ resolve, reject });
      this.scheduleFlush();
    });
  }

  private scheduleFlush(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.intervalMs);
  }

  private async flush(): Promise<void> {
    const order = this.order;
    const entries = this.entries;
    this.order = [];
    this.entries = new Map();

    for (const key of order) {
      const entry = entries.get(key)!;
      try {
        const result = await entry.run();
        for (const waiter of entry.waiters) waiter.resolve(result);
      } catch (err) {
        for (const waiter of entry.waiters) waiter.reject(err);
      }
    }
  }
}
