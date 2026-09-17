export interface Item {
  id: number;
  label: string;
}

export interface PageResult {
  items: Item[];
  nextParam: number | null;
}
