import { describe, test, expect, vi } from 'vitest';
import { toJsDate, FirestoreTimestamp } from './index';

describe('toJsDate', () => {
    test('returns the original Date if passed a JavaScript Date', () => {
        const date = new Date('2023-01-01T00:00:00Z');
        const result = toJsDate(date);
        expect(result).toBe(date);
        expect(result).toBeInstanceOf(Date);
    });

    test('calls toDate and returns its result if passed a FirestoreTimestamp', () => {
        const date = new Date('2023-01-01T00:00:00Z');
        const mockTimestamp: FirestoreTimestamp = {
            seconds: 1672531200,
            nanoseconds: 0,
            toDate: vi.fn(() => date),
        };
        const result = toJsDate(mockTimestamp);
        expect(result).toBe(date);
        expect(mockTimestamp.toDate).toHaveBeenCalledOnce();
    });

    test('returns the object directly if it looks somewhat like a timestamp but is not valid', () => {
        // missing toDate function
        const fakeTimestamp = {
            seconds: 1672531200,
            nanoseconds: 0,
        };
        // @ts-expect-error - testing invalid input
        const result = toJsDate(fakeTimestamp);
        expect(result).toBe(fakeTimestamp);

        // missing seconds
        const fakeTimestamp2 = {
            nanoseconds: 0,
            toDate: vi.fn(),
        };
        // @ts-expect-error - testing invalid input
        const result2 = toJsDate(fakeTimestamp2);
        expect(result2).toBe(fakeTimestamp2);
    });
});
