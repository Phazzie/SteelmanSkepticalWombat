import { describe, expect, test, vi } from 'vitest';
import { toJsDate } from './index';

describe('toJsDate', () => {
    test('returns Date inputs unchanged', () => {
        const date = new Date('2026-05-14T00:00:00.000Z');

        expect(toJsDate(date)).toBe(date);
    });

    test('converts Firestore-like timestamps with toDate', () => {
        const date = new Date('2026-05-14T00:00:00.000Z');
        const timestamp = {
            seconds: 1778716800,
            nanoseconds: 0,
            toDate: vi.fn(() => date),
        };

        expect(toJsDate(timestamp)).toBe(date);
        expect(timestamp.toDate).toHaveBeenCalledOnce();
    });

    test('returns an invalid Date when an object is missing toDate', () => {
        const fakeTimestamp = { seconds: 1778716800, nanoseconds: 0 };
        const result = toJsDate(fakeTimestamp);

        expect(result).toBeInstanceOf(Date);
        expect(Number.isNaN(result.getTime())).toBe(true);
    });

    test('returns an invalid Date and does not call toDate when timestamp fields are missing', () => {
        const fakeTimestamp = { toDate: vi.fn(() => new Date()) };
        const result = toJsDate(fakeTimestamp);

        expect(fakeTimestamp.toDate).not.toHaveBeenCalled();
        expect(result).toBeInstanceOf(Date);
        expect(Number.isNaN(result.getTime())).toBe(true);
    });

    test('returns an invalid Date for null', () => {
        const result = toJsDate(null);

        expect(result).toBeInstanceOf(Date);
        expect(Number.isNaN(result.getTime())).toBe(true);
    });

    test('returns an invalid Date for undefined', () => {
        const result = toJsDate(undefined);

        expect(result).toBeInstanceOf(Date);
        expect(Number.isNaN(result.getTime())).toBe(true);
    });
});
