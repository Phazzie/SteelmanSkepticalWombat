/** Wombat client seam (S4). Never throws: the screens get a Finding either way. */
import type { Finding } from '../../contracts/crossing';
import { WombatResponseSchema, type WombatRequest } from '../../contracts/wombat';

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export async function askWombat(req: WombatRequest, fetcher: Fetcher = (u, i) => fetch(u, i)): Promise<Finding> {
    let res: Response;
    try {
        res = await fetcher('/api/wombat', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(req)
        });
    } catch {
        return { status: 'closed', reason: 'error' };
    }
    if (res.status === 429) return { status: 'closed', reason: 'busy' };
    let body: unknown = null;
    try {
        body = await res.json();
    } catch {
        return { status: 'closed', reason: 'error' };
    }
    if (res.ok && (body as { closed?: string } | null)?.closed === 'off_duty') {
        return { status: 'closed', reason: 'off_duty' };
    }
    if (!res.ok) return { status: 'closed', reason: 'error' };
    const parsed = WombatResponseSchema.safeParse(body);
    return parsed.success ? { status: 'ok', text: parsed.data.text } : { status: 'closed', reason: 'error' };
}
