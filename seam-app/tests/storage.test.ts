import { describe, expect, it } from 'vitest';
import { loadCrossings, saveCrossing, STORAGE_KEY, type KeyValue } from '../src/core/storage';
import { newCrossing } from '../src/core/rules';

const mem = (): KeyValue & { data: Record<string, string> } => {
    const data: Record<string, string> = {};
    return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
};
const T0 = new Date('2026-11-27T12:00:00Z');

describe('storage', () => {
    it('T1 a saved crossing loads back equal, and saving twice upserts', () => {
        const s = mem();
        const c = newCrossing({ A: 'Ana', B: 'Jordan' }, 'Dishes', T0, 'id1');
        expect(saveCrossing(s, c).ok).toBe(true);
        expect(saveCrossing(s, { ...c, phase: 'declare' }).ok).toBe(true);
        const out = loadCrossings(s);
        expect(out.crossings).toHaveLength(1);
        expect(out.crossings[0]).toEqual({ ...c, phase: 'declare' });
        expect(out.dropped).toBe(0);
    });
    it('T2 a corrupt entry is dropped and counted', () => {
        const s = mem();
        const c = newCrossing({ A: 'Ana', B: 'Jordan' }, 'Dishes', T0, 'id1');
        s.data[STORAGE_KEY] = JSON.stringify([c, { id: 'bad' }]);
        const out = loadCrossings(s);
        expect(out.crossings).toHaveLength(1);
        expect(out.dropped).toBe(1);
    });
    it('T3 junk JSON loads as empty with one dropped', () => {
        const s = mem();
        s.data[STORAGE_KEY] = '{not json';
        expect(loadCrossings(s)).toEqual({ crossings: [], dropped: 1, ok: true });
    });
    it('T4 a throwing storage reports ok false instead of throwing', () => {
        const broken: KeyValue = {
            getItem: () => {
                throw new Error('private mode');
            },
            setItem: () => {
                throw new Error('quota');
            }
        };
        expect(loadCrossings(broken)).toEqual({ crossings: [], dropped: 0, ok: false });
        expect(saveCrossing(broken, newCrossing({ A: 'a', B: 'b' }, 'd', T0, 'z')).ok).toBe(false);
    });
});
