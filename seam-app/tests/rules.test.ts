import { describe, expect, it } from 'vitest';
import { apply, newCrossing, RuleError, whoIsUp } from '../src/core/rules';
import type { Action, Crossing } from '../contracts/crossing';

const T0 = new Date('2026-11-27T12:00:00Z');
const later = (days: number) => new Date(T0.getTime() + days * 86400000);

const run = (c: Crossing, ...actions: Action[]) => actions.reduce((acc, a) => apply(acc, a, T0), c);

const fresh = () => newCrossing({ A: ' Ana ', B: 'Jordan' }, ' Who does the dishes ', T0, 'x1');
const atVisa = () => run(fresh(), { type: 'AGREE_DISPUTE', by: 'B' });
const atStamp = () =>
    run(
        atVisa(),
        { type: 'SUBMIT_VISA', by: 'A', text: 'Jordan feels cooking is the bigger job.' },
        { type: 'SUBMIT_VISA', by: 'B', text: 'Ana feels unseen.' }
    );
const atDeclare = () =>
    run(atStamp(), { type: 'STAMP', by: 'B', verdict: 'admitted' }, { type: 'STAMP', by: 'A', verdict: 'admitted' });
const atTreaty = () =>
    run(
        atDeclare(),
        { type: 'DECLARE', by: 'A', text: 'I do them all.', items: ['Receipts'] },
        { type: 'DECLARE', by: 'B', text: 'I cook.', items: [] },
        { type: 'ADVANCE', from: 'findings' },
        { type: 'ADVANCE', from: 'inspection' },
        { type: 'PROPOSE', by: 'A', text: 'Alternate nights.' },
        { type: 'PROPOSE', by: 'B', text: 'Paper plates.' },
        { type: 'READBACK', by: 'A', text: 'Jordan wants zero dishes.' },
        { type: 'READBACK', by: 'B', text: 'Ana wants fairness.' },
        { type: 'ADVANCE', from: 'wager' }
    );

describe('rules', () => {
    it('R1 a new crossing starts in dispute with A agreed and B not, names and text trimmed', () => {
        const c = fresh();
        expect(c.phase).toBe('dispute');
        expect(c.dispute.agreed).toEqual({ A: true, B: false });
        expect(c.names).toEqual({ A: 'Ana', B: 'Jordan' });
        expect(c.dispute.text).toBe('Who does the dishes');
        expect(() => newCrossing({ A: 'Ana', B: ' ' }, 'x', T0)).toThrow(RuleError);
    });

    it('R2 editing the dispute un-agrees the other side', () => {
        const c = run(fresh(), { type: 'EDIT_DISPUTE', by: 'B', text: 'Dishes, specifically pans' });
        expect(c.dispute.agreed).toEqual({ A: false, B: true });
        expect(c.dispute.text).toBe('Dishes, specifically pans');
        expect(c.phase).toBe('dispute');
    });

    it('R3 both agreeing moves to visa: you write their side before your own', () => {
        expect(atVisa().phase).toBe('visa');
        expect(() => apply(atVisa(), { type: 'DECLARE', by: 'A', text: 'mine first', items: [] }, T0)).toThrow(
            RuleError
        );
    });

    it('R4 a side cannot declare twice', () => {
        const c = run(atDeclare(), { type: 'DECLARE', by: 'A', text: 'one', items: [] });
        expect(() => apply(c, { type: 'DECLARE', by: 'A', text: 'two', items: [] }, T0)).toThrow(RuleError);
    });

    it('R5 both declarations move to findings', () => {
        const c = run(
            atDeclare(),
            { type: 'DECLARE', by: 'A', text: 'a', items: [] },
            { type: 'DECLARE', by: 'B', text: 'b', items: ['Receipts'] }
        );
        expect(c.phase).toBe('findings');
        expect(c.declarations.B?.items).toEqual(['Receipts']);
    });

    it('R6 a visa cannot be stamped by its own writer (A stamps only B\'s visa)', () => {
        const c = run(atStamp(), { type: 'STAMP', by: 'A', verdict: 'admitted' });
        expect(c.visas.B[0].verdict).toBe('admitted');
        expect(c.visas.A[0].verdict).toBe('pending');
        expect(() => apply(c, { type: 'STAMP', by: 'A', verdict: 'admitted' }, T0)).toThrow(RuleError);
    });

    it('R7 a denial without a note is refused', () => {
        expect(() => apply(atStamp(), { type: 'STAMP', by: 'B', verdict: 'denied' }, T0)).toThrow(RuleError);
        expect(() => apply(atStamp(), { type: 'STAMP', by: 'B', verdict: 'denied', note: '  ' }, T0)).toThrow(
            RuleError
        );
    });

    it('R8 a denied visa sends the crossing back to visa and only the denied side may resubmit', () => {
        const c = run(
            atStamp(),
            { type: 'STAMP', by: 'B', verdict: 'denied', note: 'You skipped the part about my back.' },
            { type: 'STAMP', by: 'A', verdict: 'admitted' }
        );
        expect(c.phase).toBe('visa');
        expect(c.visas.A[0].note).toBe('You skipped the part about my back.');
        expect(() => apply(c, { type: 'SUBMIT_VISA', by: 'B', text: 'again' }, T0)).toThrow(RuleError);
        const c2 = apply(c, { type: 'SUBMIT_VISA', by: 'A', text: 'Jordan\'s back hurts after cooking.' }, T0);
        expect(c2.visas.A).toHaveLength(2);
        expect(c2.phase).toBe('stamp');
    });

    it('R9 both admitted moves to declare; nobody declares while a visa is still out', () => {
        const c = run(
            atStamp(),
            { type: 'STAMP', by: 'B', verdict: 'admitted' },
            { type: 'STAMP', by: 'A', verdict: 'admitted' }
        );
        expect(c.phase).toBe('declare');
        const oneOut = run(atStamp(), { type: 'STAMP', by: 'B', verdict: 'admitted' });
        expect(() => apply(oneOut, { type: 'DECLARE', by: 'A', text: 'mine', items: [] }, T0)).toThrow(RuleError);
    });

    it('R16 a crossing saved under the old declare-first order still finishes', () => {
        // Old order: both declared before any visa, then findings, then visa.
        const old: Crossing = {
            ...atVisa(),
            phase: 'declare'
        };
        let c = run(
            old,
            { type: 'DECLARE', by: 'A', text: 'a', items: [] },
            { type: 'DECLARE', by: 'B', text: 'b', items: [] },
            { type: 'ADVANCE', from: 'findings' }
        );
        expect(c.phase).toBe('visa');
        c = run(
            c,
            { type: 'SUBMIT_VISA', by: 'A', text: 'their side' },
            { type: 'SUBMIT_VISA', by: 'B', text: 'their side' },
            { type: 'STAMP', by: 'B', verdict: 'admitted' },
            { type: 'STAMP', by: 'A', verdict: 'admitted' }
        );
        expect(c.phase).toBe('findings');
        expect(run(c, { type: 'ADVANCE', from: 'findings' }).phase).toBe('inspection');
    });

    it('R15 findings lead to inspection', () => {
        const c = run(
            atDeclare(),
            { type: 'DECLARE', by: 'A', text: 'a', items: [] },
            { type: 'DECLARE', by: 'B', text: 'b', items: [] },
            { type: 'ADVANCE', from: 'findings' }
        );
        expect(c.phase).toBe('inspection');
    });

    it('R10 editing the treaty unsigns the other side; both signed ratifies with review due in 7 days', () => {
        let c = run(atTreaty(), { type: 'EDIT_TREATY', by: 'A', text: 'Alternate nights, B buys a pan rack.' });
        expect(c.treaty.signed).toEqual({ A: true, B: false });
        c = run(c, { type: 'SIGN_TREATY', by: 'B' });
        expect(c.phase).toBe('ratified');
        expect(c.reviewDue).toBe(later(7).toISOString());
        const edited = run(atTreaty(), { type: 'EDIT_TREATY', by: 'A', text: 'x' }, { type: 'EDIT_TREATY', by: 'B', text: 'y' });
        expect(edited.treaty.signed).toEqual({ A: false, B: true });
    });

    it('R11 review is refused before it is due and accepted after', () => {
        const c = run(atTreaty(), { type: 'EDIT_TREATY', by: 'A', text: 'deal' }, { type: 'SIGN_TREATY', by: 'B' });
        expect(() => apply(c, { type: 'REVIEW', by: 'A', verdict: 'holding' }, later(6))).toThrow(RuleError);
        const r = apply(c, { type: 'REVIEW', by: 'A', verdict: 'holding' }, later(8));
        expect(r.review.A).toBe('holding');
        expect(() => apply(r, { type: 'REVIEW', by: 'A', verdict: 'collapsed' }, later(8))).toThrow(RuleError);
    });

    it('R12 apply does not mutate the crossing it was given', () => {
        const c = atStamp();
        const snapshot = JSON.stringify(c);
        apply(c, { type: 'STAMP', by: 'B', verdict: 'denied', note: 'nope' }, T0);
        expect(JSON.stringify(c)).toBe(snapshot);
    });

    it('R13 whoIsUp names the undeclared side, the visa writer and the judge', () => {
        expect(whoIsUp(fresh())).toBe('B');
        expect(whoIsUp(atVisa())).toBe('A');
        expect(whoIsUp(atDeclare())).toBe('A');
        expect(whoIsUp(run(atDeclare(), { type: 'DECLARE', by: 'A', text: 'a', items: [] }))).toBe('B');
        expect(whoIsUp(atStamp())).toBe('B');
        expect(whoIsUp(run(atStamp(), { type: 'STAMP', by: 'B', verdict: 'admitted' }))).toBe('A');
        const findings = run(
            atDeclare(),
            { type: 'DECLARE', by: 'A', text: 'a', items: [] },
            { type: 'DECLARE', by: 'B', text: 'b', items: [] }
        );
        expect(whoIsUp(findings)).toBe('both');
    });

    it('R14 text over 2000 characters is refused', () => {
        expect(() =>
            apply(atDeclare(), { type: 'DECLARE', by: 'A', text: 'x'.repeat(2001), items: [] }, T0)
        ).toThrow(RuleError);
        expect(() => apply(atDeclare(), { type: 'DECLARE', by: 'A', text: '   ', items: [] }, T0)).toThrow(
            RuleError
        );
    });
});
