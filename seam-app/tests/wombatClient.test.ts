import { describe, expect, it } from 'vitest';
import { askWombat, type Fetcher } from '../src/core/wombatClient';

const req = { task: 'incident' as const };
const reply = (status: number, body: unknown): Fetcher => async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('wombat client', () => {
    it('C1 returns ok text on 200 and posts JSON to /api/wombat', async () => {
        let seen: { url: string; init: RequestInit } | null = null;
        const f: Fetcher = async (url, init) => {
            seen = { url, init };
            return new Response(JSON.stringify({ text: 'Put the phone down.' }), { status: 200 });
        };
        expect(await askWombat(req, f)).toEqual({ status: 'ok', text: 'Put the phone down.' });
        expect(seen!.url).toBe('/api/wombat');
        expect(JSON.parse(String(seen!.init.body))).toEqual(req);
    });
    it('C2 off duty on 200 { closed: off_duty } (drift 1)', async () => {
        expect(await askWombat(req, reply(200, { closed: 'off_duty' }))).toEqual({ status: 'closed', reason: 'off_duty' });
    });
    it('C3 network failure and bad bodies become error, never a throw', async () => {
        const boom: Fetcher = async () => {
            throw new TypeError('offline');
        };
        expect(await askWombat(req, boom)).toEqual({ status: 'closed', reason: 'error' });
        expect(await askWombat(req, reply(200, { nope: 1 }))).toEqual({ status: 'closed', reason: 'error' });
        expect(await askWombat(req, reply(502, { error: 'provider' }))).toEqual({ status: 'closed', reason: 'error' });
    });
    it('C4 429 becomes busy', async () => {
        expect(await askWombat(req, reply(429, { error: 'busy' }))).toEqual({ status: 'closed', reason: 'busy' });
    });
});
