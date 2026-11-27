/** Prompt assets for /api/wombat. Every prompt starts with the persona lock-in. */
import type { WombatRequest } from '../../contracts/wombat';

export const PERSONA = '';

export function buildPrompt(_req: WombatRequest): { system: string; user: string } {
    throw new Error('not built yet');
}
