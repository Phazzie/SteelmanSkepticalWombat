import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../api/wombat';
import { buildPrompt, PERSONA } from '../api/_lib/prompts';
import type { WombatRequest } from '../contracts/wombat';

const call = (body: unknown) =>
    POST(new Request('http://x/api/wombat', { method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': `ip-${Math.random()}` } }));

const KEY = 'xai-secret-test-key-123';

describe('/api/wombat', () => {
    beforeEach(() => {
        process.env.XAI_API_KEY = KEY;
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        delete process.env.XAI_API_KEY;
    });

    it('A1 an invalid body is a 400', async () => {
        const r = await call({ task: 'tarot' });
        expect(r.status).toBe(400);
        const r2 = await POST(new Request('http://x/api/wombat', { method: 'POST', body: '{oops' }));
        expect(r2.status).toBe(400);
    });

    it('A2 no key is a 200 { closed: off_duty } (drift 1: no console error on keyless previews)', async () => {
        delete process.env.XAI_API_KEY;
        const r = await call({ task: 'incident' });
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual({ closed: 'off_duty' });
    });

    it('A3 success returns the provider text trimmed, sent with the key as a bearer token', async () => {
        const fetchMock = vi.fn(async () =>
            new Response(JSON.stringify({ choices: [{ message: { content: '  Breathe through your nose.  ' } }] }), { status: 200 })
        );
        vi.stubGlobal('fetch', fetchMock);
        const r = await call({ task: 'incident' });
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual({ text: 'Breathe through your nose.' });
        const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe('https://api.x.ai/v1/chat/completions');
        expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
    });

    it('A4 a provider 500 is a 502 that never contains the key', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(`bad key ${KEY}`, { status: 500 })));
        const r = await call({ task: 'incident' });
        expect(r.status).toBe(502);
        expect(await r.text()).not.toContain(KEY);
    });

    it('A5 every prompt starts with the persona lock-in and carries the user text', () => {
        const reqs: WombatRequest[] = [
            { task: 'customs', dispute: 'DISPUTE-1', declaration: 'DECL-1', items: ['Receipts'] },
            { task: 'xray', dispute: 'DISPUTE-1', steelman: 'STEEL-1', about: 'Jordan' },
            { task: 'inspection', dispute: 'DISPUTE-1', names: { A: 'Ana', B: 'Jordan' }, declarations: { A: 'DA', B: 'DB' }, steelmans: { A: 'SA', B: 'SB' } },
            { task: 'wager', dispute: 'DISPUTE-1', names: { A: 'Ana', B: 'Jordan' }, proposals: { A: 'PA', B: 'PB' }, readbacks: { A: 'RA', B: 'RB' } },
            { task: 'brainstorm', dispute: 'DISPUTE-1', proposals: { A: 'PA', B: 'PB' }, wager: 'W' },
            { task: 'incident', dispute: 'DISPUTE-1' }
        ];
        expect(PERSONA.length).toBeGreaterThan(40);
        for (const q of reqs) {
            const p = buildPrompt(q);
            expect(p.system.startsWith(PERSONA)).toBe(true);
            expect(p.user).toContain('DISPUTE-1');
        }
        expect(buildPrompt(reqs[0]).user).toContain('DECL-1');
        expect(buildPrompt(reqs[1]).user).toContain('STEEL-1');
    });
});
