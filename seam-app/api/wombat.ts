/**
 * Provider seam (S5): the only place the xAI key is read. It never leaves the server,
 * and provider error text is never passed through (it could echo the key).
 */
import { WombatRequestSchema } from '../contracts/wombat';
import { buildPrompt } from './_lib/prompts';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const TIMEOUT_MS = 25000;
const LIMIT = 20;
const WINDOW_MS = 60000;
const hits = new Map<string, number[]>();

const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

function limited(ip: string, now: number): boolean {
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > LIMIT;
}

export async function POST(req: Request): Promise<Response> {
    // Step 1
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return json(400, { error: 'bad_request' });
    }
    const parsed = WombatRequestSchema.safeParse(body);
    if (!parsed.success) return json(400, { error: 'bad_request' });

    // Step 2
    const key = process.env.XAI_API_KEY;
    // 200, not 503: a preview with no key is an expected state, and a 503 would put a red
    // network error in every visitor's console.
    if (!key) return json(200, { closed: 'off_duty' });

    const ip = (req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for') ?? 'anon').split(',')[0].trim();
    if (limited(ip, Date.now())) return json(429, { error: 'busy' });

    // Step 3
    const prompt = buildPrompt(parsed.data);

    // Step 4
    try {
        const res = await fetch(XAI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
            body: JSON.stringify({
                model: process.env.XAI_MODEL || 'grok-4-1-fast-reasoning',
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user }
                ],
                max_tokens: 700,
                temperature: 0.9
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS)
        });
        if (!res.ok) {
            console.error(`[wombat] provider status ${res.status} for task ${parsed.data.task}`);
            return json(502, { error: 'provider' });
        }
        const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const text = data.choices?.[0]?.message?.content?.trim();
        // Step 5
        if (!text) return json(502, { error: 'provider' });
        return json(200, { text });
    } catch (e) {
        console.error(`[wombat] provider call failed for task ${parsed.data.task}: ${(e as Error).name}`);
        return json(502, { error: 'provider' });
    }
}
