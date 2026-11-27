import { describe, expect, it } from 'vitest';
import { sniff } from '../src/core/sniffer';

describe('sniffer', () => {
    it('N1 flags "you always" with its index', () => {
        const hits = sniff('Honestly You Always do this');
        expect(hits).toHaveLength(1);
        expect(hits[0].phrase).toBe('you always');
        expect(hits[0].index).toBe(9);
        expect(hits[0].why.length).toBeGreaterThan(5);
    });
    it('N2 does not flag "always" on its own', () => {
        expect(sniff('I always cook')).toEqual([]);
    });
    it('N3 returns several hits in reading order', () => {
        const hits = sniff("No offense, but you never listen. I'm just saying.");
        expect(hits.map((h) => h.phrase)).toEqual(['no offense', 'you never', "i'm just saying"]);
    });
    it('N4 clean text returns an empty list', () => {
        expect(sniff('Jordan is tired after cooking and wants that noticed.')).toEqual([]);
    });
});
