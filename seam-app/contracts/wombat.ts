import { z } from 'zod';

/** The /api/wombat seam. Data shapes only. */

const t = z.string().max(4000);

export const WombatRequestSchema = z.discriminatedUnion('task', [
    z.object({ task: z.literal('customs'), dispute: t, declaration: t, items: z.array(z.string().max(80)).max(12) }),
    z.object({ task: z.literal('xray'), dispute: t, steelman: t, about: z.string().max(60) }),
    z.object({
        task: z.literal('inspection'),
        dispute: t,
        names: z.object({ A: z.string().max(60), B: z.string().max(60) }),
        declarations: z.object({ A: t, B: t }),
        steelmans: z.object({ A: t, B: t })
    }),
    z.object({
        task: z.literal('wager'),
        dispute: t,
        names: z.object({ A: z.string().max(60), B: z.string().max(60) }),
        proposals: z.object({ A: t, B: t }),
        readbacks: z.object({ A: t, B: t })
    }),
    z.object({
        task: z.literal('brainstorm'),
        dispute: t,
        proposals: z.object({ A: t, B: t }),
        wager: t
    }),
    z.object({ task: z.literal('incident'), dispute: t.optional() })
]);
export type WombatRequest = z.infer<typeof WombatRequestSchema>;
export type WombatTask = WombatRequest['task'];

export const WombatResponseSchema = z.object({ text: z.string().min(1) });
export type WombatResponse = z.infer<typeof WombatResponseSchema>;

export const WombatErrorSchema = z.object({ error: z.enum(['off_duty', 'bad_request', 'provider', 'busy']) });
