/** Wombat client seam (S4). Never throws. Steps in plan/PLAN.md. */
import type { Finding } from '../../contracts/crossing';
import type { WombatRequest } from '../../contracts/wombat';

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export async function askWombat(_req: WombatRequest, _fetcher?: Fetcher): Promise<Finding> {
    throw new Error('not built yet');
}
