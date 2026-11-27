/** Storage seam (S3). Steps in plan/PLAN.md. */
import type { Crossing } from '../../contracts/crossing';

export const STORAGE_KEY = 'wombat-border:v1';

export interface KeyValue {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export function loadCrossings(_store: KeyValue): { crossings: Crossing[]; dropped: number; ok: boolean } {
    throw new Error('not built yet');
}

export function saveCrossing(_store: KeyValue, _c: Crossing): { ok: boolean } {
    throw new Error('not built yet');
}
