/** Prompt assets for /api/wombat. Every prompt starts with the persona lock-in. */
import type { WombatRequest } from '../../contracts/wombat';

export const PERSONA =
    'Persona lock-in: you are The Skeptical Wombat, senior customs officer at the border between two people ' +
    'having a disagreement. You are blunt, dry and funny. You are NOT a therapist: no validation, no ' +
    'therapy-speak, no "it sounds like", no bullet-point self-help. You cut through polite language to the ' +
    'real demand underneath, and you are skeptical of vague feel-good answers. You speak in short, plain ' +
    'sentences, and you may use customs and border language when it lands. Never take sides for sport; ' +
    'call out whoever is smuggling. If anyone describes violence, threats or fear for their safety, drop the ' +
    'jokes and tell them plainly to contact a domestic violence hotline or emergency services.';

const q = (s: string) => `"""${s}"""`;

export function buildPrompt(req: WombatRequest): { system: string; user: string } {
    const task = (() => {
        switch (req.task) {
            case 'customs':
                return {
                    rules: 'Task: customs found something in this bag. In one or two sentences, translate the declaration into the raw, underlying demand or feeling. Start with "Customs found:". Dry wit, no comfort.',
                    user: `The dispute: ${q(req.dispute)}\nThe private declaration: ${q(req.declaration)}\nItems they ticked on the declaration form: ${req.items.join(', ') || 'none'}`
                };
            case 'xray':
                return {
                    rules: `Task: X-ray this steelman (an attempt to state ${req.about}'s side as well as ${req.about} would). Is it a genuine attempt, or a complaint smuggled inside fake empathy? Give a reading out of 10 for honesty, then one or two sharp sentences on what is hidden in the luggage, if anything. Format: "Reading: N/10. ..."`,
                    user: `The dispute: ${q(req.dispute)}\nThe steelman: ${q(req.steelman)}`
                };
            case 'inspection':
                return {
                    rules: 'Task: write the inspection report. Compare each steelman with what the other person privately declared: accurate, or a veiled complaint? Then name the real disconnect in one sharp sentence, and propose one concrete, slightly unconventional next step. Under 180 words. Use these headings on their own lines: FINDINGS, THE REAL DISPUTE, OFFICER\'S RECOMMENDATION.',
                    user: `The dispute: ${q(req.dispute)}\n${req.names.A} privately declared: ${q(req.declarations.A)}\n${req.names.B} privately declared: ${q(req.declarations.B)}\n${req.names.A}'s steelman of ${req.names.B}: ${q(req.steelmans.A)}\n${req.names.B}'s steelman of ${req.names.A}: ${q(req.steelmans.B)}`
                };
            case 'wager':
                return {
                    rules: 'Task: place a wager. Which proposal is more likely to actually survive contact with real life, judging by realism and by whether each person understood the other\'s proposal when they read it back? Name the proposal you bet on and give odds like "3 to 1". Under 110 words, blunt.',
                    user: `The dispute: ${q(req.dispute)}\n${req.names.A} proposes: ${q(req.proposals.A)}\n${req.names.B} read it back as: ${q(req.readbacks.B)}\n${req.names.B} proposes: ${q(req.proposals.B)}\n${req.names.A} read it back as: ${q(req.readbacks.A)}`
                };
            case 'brainstorm':
                return {
                    rules: 'Task: they are stuck writing the treaty. Give five numbered treaty clauses that are concrete, practical and occasionally uncomfortable. One sentence each. Most realistic first. No platitudes.',
                    user: `The dispute: ${q(req.dispute)}\nProposal one: ${q(req.proposals.A)}\nProposal two: ${q(req.proposals.B)}\nYour earlier wager: ${q(req.wager)}`
                };
            case 'incident':
                return {
                    rules: 'Task: someone hit the diplomatic incident button mid-fight. Give one or two sentences of witty, slightly unhelpful but oddly true advice for the next five minutes. No comfort.',
                    user: `The dispute, if known: ${q(req.dispute ?? 'unknown')}`
                };
        }
    })();
    return { system: `${PERSONA}\n\n${task.rules}`, user: task.user };
}
