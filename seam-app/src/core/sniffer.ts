/** Sniffer seam (S6): flags argument-starting phrases. Steps in plan/PLAN.md. */
export interface SniffHit {
    phrase: string;
    index: number;
    why: string;
}

export function sniff(_text: string): SniffHit[] {
    throw new Error('not built yet');
}
