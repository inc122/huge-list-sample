import { BatchQueue } from './batchQueue';

export const addQueue = new BatchQueue(10_000);
export const rwQueue = new BatchQueue(1_000);
