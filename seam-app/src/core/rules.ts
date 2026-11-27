/**
 * Rules seam (S1) and turn seam (S2): every state change of a crossing goes through apply().
 * Steps 1-9 are in plan/PLAN.md.
 */
import { MAX_TEXT, type Action, type Crossing, type Side, type Turn, type VisaAttempt } from '../../contracts/crossing';

export class RuleError extends Error {}

const REVIEW_DAYS = 7;

export function other(side: Side): Side {
    return side === 'A' ? 'B' : 'A';
}

function clean(text: string, what: string): string {
    const t = text.trim();
    if (!t) throw new RuleError(`${what} can't be blank.`);
    if (t.length > MAX_TEXT) throw new RuleError(`${what} is over ${MAX_TEXT} characters. Customs has limits.`);
    return t;
}

function makeId(now: Date): string {
    const rand = Math.random().toString(36).slice(2, 8);
    return `${now.getTime().toString(36)}-${rand}`;
}

// Step 1
export function newCrossing(names: { A: string; B: string }, dispute: string, now: Date, id?: string): Crossing {
    const A = clean(names.A, 'A traveller name');
    const B = clean(names.B, 'A traveller name');
    if (A.length > 40 || B.length > 40) throw new RuleError('Names are capped at 40 characters.');
    const at = now.toISOString();
    return {
        version: 1,
        id: id ?? makeId(now),
        createdAt: at,
        updatedAt: at,
        names: { A, B },
        phase: 'dispute',
        dispute: { text: clean(dispute, 'The dispute'), agreed: { A: true, B: false } },
        declarations: {},
        visas: { A: [], B: [] },
        proposals: {},
        readbacks: {},
        treaty: { text: '', signed: { A: false, B: false } },
        review: {}
    };
}

export function latestVisa(c: Crossing, side: Side): VisaAttempt | undefined {
    const list = c.visas[side];
    return list[list.length - 1];
}

function need(c: Crossing, ...phases: Crossing['phase'][]) {
    if (!phases.includes(c.phase)) {
        throw new RuleError(`That can't happen at the ${c.phase} desk.`);
    }
}

// Step 2: apply() works on a deep copy so the caller's crossing is never changed.
export function apply(input: Crossing, action: Action, now: Date): Crossing {
    const c: Crossing = structuredClone(input);
    c.updatedAt = now.toISOString();

    switch (action.type) {
        // Step 3
        case 'EDIT_DISPUTE':
            need(c, 'dispute');
            c.dispute.text = clean(action.text, 'The dispute');
            c.dispute.agreed = { A: false, B: false, [action.by]: true } as Crossing['dispute']['agreed'];
            return c;
        case 'AGREE_DISPUTE':
            need(c, 'dispute');
            c.dispute.agreed[action.by] = true;
            if (c.dispute.agreed.A && c.dispute.agreed.B) c.phase = 'declare';
            return c;

        // Step 4
        case 'DECLARE':
            need(c, 'declare');
            if (c.declarations[action.by]) throw new RuleError('You already declared. No take-backs.');
            c.declarations[action.by] = {
                text: clean(action.text, 'Your declaration'),
                items: action.items.slice(0, 12)
            };
            if (c.declarations.A && c.declarations.B) c.phase = 'findings';
            return c;
        case 'SET_DECLARATION_FINDING': {
            const d = c.declarations[action.by];
            if (!d) throw new RuleError('Nothing declared to inspect.');
            d.finding = action.finding;
            return c;
        }

        case 'ADVANCE': {
            need(c, action.from);
            const next = { findings: 'visa', inspection: 'propose', wager: 'treaty' } as const;
            c.phase = next[action.from];
            return c;
        }

        // Step 5
        case 'SUBMIT_VISA': {
            need(c, 'visa');
            const last = latestVisa(c, action.by);
            if (last && last.verdict !== 'denied') {
                throw new RuleError('Your application is already with the other side.');
            }
            c.visas[action.by].push({
                text: clean(action.text, 'Your application'),
                at: now.toISOString(),
                verdict: 'pending'
            });
            const ready = (s: Side) => {
                const v = latestVisa(c, s);
                return v !== undefined && v.verdict !== 'denied';
            };
            if (ready('A') && ready('B')) c.phase = 'stamp';
            return c;
        }
        case 'SET_XRAY': {
            const last = latestVisa(c, action.by);
            if (!last) throw new RuleError('No application to X-ray.');
            last.xray = action.finding;
            return c;
        }

        // Step 6: the judge stamps the *other* side's visa.
        case 'STAMP': {
            need(c, 'stamp');
            const target = latestVisa(c, other(action.by));
            if (!target || target.verdict !== 'pending') {
                throw new RuleError('There is nothing waiting for your stamp.');
            }
            if (action.verdict === 'denied') {
                const note = (action.note ?? '').trim();
                if (!note) throw new RuleError('A denial needs a reason. Say what they missed.');
                target.note = note.slice(0, MAX_TEXT);
            }
            target.verdict = action.verdict;
            const a = latestVisa(c, 'A')?.verdict;
            const b = latestVisa(c, 'B')?.verdict;
            if (a === 'admitted' && b === 'admitted') c.phase = 'inspection';
            else if ((a === 'denied' || b === 'denied') && a !== 'pending' && b !== 'pending') c.phase = 'visa';
            return c;
        }
        case 'SET_INSPECTION':
            c.inspection = action.finding;
            return c;

        // Step 7
        case 'PROPOSE':
            need(c, 'propose');
            if (c.proposals[action.by]) throw new RuleError('You already put a proposal on the table.');
            c.proposals[action.by] = clean(action.text, 'Your proposal');
            if (c.proposals.A && c.proposals.B) c.phase = 'readback';
            return c;
        case 'READBACK':
            need(c, 'readback');
            if (c.readbacks[action.by]) throw new RuleError('You already read their proposal back.');
            c.readbacks[action.by] = clean(action.text, 'Your read-back');
            if (c.readbacks.A && c.readbacks.B) c.phase = 'wager';
            return c;
        case 'SET_WAGER':
            c.wager = action.finding;
            return c;
        case 'SET_BRAINSTORM':
            c.brainstorm = action.finding;
            return c;

        // Step 8
        case 'EDIT_TREATY':
            need(c, 'treaty');
            c.treaty.text = clean(action.text, 'The treaty');
            c.treaty.signed = { A: false, B: false, [action.by]: true } as Crossing['treaty']['signed'];
            return c;
        case 'SIGN_TREATY':
            need(c, 'treaty');
            if (!c.treaty.text.trim()) throw new RuleError('You can’t sign a blank treaty.');
            c.treaty.signed[action.by] = true;
            if (c.treaty.signed.A && c.treaty.signed.B) {
                c.phase = 'ratified';
                c.reviewDue = new Date(now.getTime() + REVIEW_DAYS * 86400000).toISOString();
            }
            return c;
        case 'REVIEW':
            need(c, 'ratified');
            if (!c.reviewDue || now.getTime() < new Date(c.reviewDue).getTime()) {
                throw new RuleError('Treaty review opens seven days after signing.');
            }
            if (c.review[action.by]) throw new RuleError('You already filed your review.');
            c.review[action.by] = action.verdict;
            return c;
    }
}

// Step 9
export function whoIsUp(c: Crossing): Turn {
    switch (c.phase) {
        case 'dispute':
            if (!c.dispute.agreed.A) return 'A';
            if (!c.dispute.agreed.B) return 'B';
            return 'both';
        case 'declare':
            return !c.declarations.A ? 'A' : !c.declarations.B ? 'B' : 'both';
        case 'visa': {
            for (const s of ['A', 'B'] as const) {
                const v = latestVisa(c, s);
                if (!v || v.verdict === 'denied') return s;
            }
            return 'both';
        }
        case 'stamp':
            // The judge of A's pending visa is B, and vice versa.
            if (latestVisa(c, 'A')?.verdict === 'pending') return 'B';
            if (latestVisa(c, 'B')?.verdict === 'pending') return 'A';
            return 'both';
        case 'propose':
            return !c.proposals.A ? 'A' : !c.proposals.B ? 'B' : 'both';
        case 'readback':
            return !c.readbacks.A ? 'A' : !c.readbacks.B ? 'B' : 'both';
        case 'treaty':
            if (!c.treaty.text) return 'both';
            if (!c.treaty.signed.A) return 'A';
            if (!c.treaty.signed.B) return 'B';
            return 'both';
        default:
            return 'both';
    }
}
