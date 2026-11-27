import { z } from 'zod';

/** Data shapes only. No logic lives here (seam-v2 rule). */

export const MAX_TEXT = 2000;

export const SideSchema = z.enum(['A', 'B']);
export type Side = z.infer<typeof SideSchema>;

export const PhaseSchema = z.enum([
    'dispute',
    'declare',
    'findings',
    'visa',
    'stamp',
    'inspection',
    'propose',
    'readback',
    'wager',
    'treaty',
    'ratified'
]);
export type Phase = z.infer<typeof PhaseSchema>;

export const FindingSchema = z.discriminatedUnion('status', [
    z.object({ status: z.literal('ok'), text: z.string() }),
    z.object({ status: z.literal('closed'), reason: z.enum(['off_duty', 'busy', 'error']) })
]);
export type Finding = z.infer<typeof FindingSchema>;

export const VerdictSchema = z.enum(['pending', 'admitted', 'denied']);
export type Verdict = z.infer<typeof VerdictSchema>;

export const VisaAttemptSchema = z.object({
    text: z.string(),
    at: z.string(),
    verdict: VerdictSchema,
    note: z.string().optional(),
    xray: FindingSchema.optional()
});
export type VisaAttempt = z.infer<typeof VisaAttemptSchema>;

export const DeclarationSchema = z.object({
    text: z.string(),
    items: z.array(z.string()),
    finding: FindingSchema.optional()
});
export type Declaration = z.infer<typeof DeclarationSchema>;

const PairBool = z.object({ A: z.boolean(), B: z.boolean() });

export const CrossingSchema = z.object({
    version: z.literal(1),
    id: z.string().min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
    names: z.object({ A: z.string().min(1), B: z.string().min(1) }),
    phase: PhaseSchema,
    dispute: z.object({ text: z.string().min(1), agreed: PairBool }),
    declarations: z.object({ A: DeclarationSchema.optional(), B: DeclarationSchema.optional() }),
    /** visas.A = A's steelman of B's side. Judged by B. */
    visas: z.object({ A: z.array(VisaAttemptSchema), B: z.array(VisaAttemptSchema) }),
    inspection: FindingSchema.optional(),
    proposals: z.object({ A: z.string().optional(), B: z.string().optional() }),
    /** readbacks.A = A's explanation of B's proposal. */
    readbacks: z.object({ A: z.string().optional(), B: z.string().optional() }),
    wager: FindingSchema.optional(),
    brainstorm: FindingSchema.optional(),
    treaty: z.object({ text: z.string(), signed: PairBool }),
    reviewDue: z.string().optional(),
    review: z.object({
        A: z.enum(['holding', 'collapsed']).optional(),
        B: z.enum(['holding', 'collapsed']).optional()
    })
});
export type Crossing = z.infer<typeof CrossingSchema>;

export type Action =
    | { type: 'EDIT_DISPUTE'; by: Side; text: string }
    | { type: 'AGREE_DISPUTE'; by: Side }
    | { type: 'DECLARE'; by: Side; text: string; items: string[] }
    | { type: 'SET_DECLARATION_FINDING'; by: Side; finding: Finding }
    | { type: 'ADVANCE'; from: 'findings' | 'inspection' | 'wager' }
    | { type: 'SUBMIT_VISA'; by: Side; text: string }
    | { type: 'SET_XRAY'; by: Side; finding: Finding }
    | { type: 'STAMP'; by: Side; verdict: 'admitted' | 'denied'; note?: string }
    | { type: 'SET_INSPECTION'; finding: Finding }
    | { type: 'PROPOSE'; by: Side; text: string }
    | { type: 'READBACK'; by: Side; text: string }
    | { type: 'SET_WAGER'; finding: Finding }
    | { type: 'SET_BRAINSTORM'; finding: Finding }
    | { type: 'EDIT_TREATY'; by: Side; text: string }
    | { type: 'SIGN_TREATY'; by: Side }
    | { type: 'REVIEW'; by: Side; verdict: 'holding' | 'collapsed' };

export type Turn = Side | 'both';
