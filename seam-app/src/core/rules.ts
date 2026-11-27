/**
 * Rules seam (S1) and turn seam (S2): every state change of a crossing goes through apply().
 * Steps 1-9 are in plan/PLAN.md.
 */
import type { Action, Crossing, Side, Turn } from '../../contracts/crossing';

export class RuleError extends Error {}

export function newCrossing(
    _names: { A: string; B: string },
    _dispute: string,
    _now: Date,
    _id?: string
): Crossing {
    throw new Error('not built yet');
}

export function apply(_c: Crossing, _action: Action, _now: Date): Crossing {
    throw new Error('not built yet');
}

export function whoIsUp(_c: Crossing): Turn {
    throw new Error('not built yet');
}

export function other(_side: Side): Side {
    throw new Error('not built yet');
}

export function latestVisa(_c: Crossing, _side: Side) {
    throw new Error('not built yet');
}
