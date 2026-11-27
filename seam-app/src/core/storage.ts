/** Storage seam (S3): crossings live in this browser only. */
import { CrossingSchema, type Crossing } from '../../contracts/crossing';

export const STORAGE_KEY = 'wombat-border:v1';

export interface KeyValue {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export function loadCrossings(store: KeyValue): { crossings: Crossing[]; dropped: number; ok: boolean } {
    let raw: string | null;
    try {
        raw = store.getItem(STORAGE_KEY);
    } catch {
        return { crossings: [], dropped: 0, ok: false };
    }
    if (!raw) return { crossings: [], dropped: 0, ok: true };
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { crossings: [], dropped: 1, ok: true };
    }
    if (!Array.isArray(parsed)) return { crossings: [], dropped: 1, ok: true };
    const crossings: Crossing[] = [];
    let dropped = 0;
    for (const item of parsed) {
        const r = CrossingSchema.safeParse(item);
        if (r.success) crossings.push(r.data);
        else dropped++;
    }
    return { crossings, dropped, ok: true };
}

export function saveCrossing(store: KeyValue, c: Crossing): { ok: boolean } {
    try {
        const { crossings } = loadCrossings(store);
        const rest = crossings.filter((x) => x.id !== c.id);
        store.setItem(STORAGE_KEY, JSON.stringify([c, ...rest]));
        return { ok: true };
    } catch {
        return { ok: false };
    }
}
