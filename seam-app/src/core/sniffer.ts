/** Sniffer seam (S6): flags argument-starting phrases. Free, instant, works offline. */
export interface SniffHit {
    phrase: string;
    index: number;
    why: string;
}

const PHRASES: Array<[string, string]> = [
    ['you always', 'Absolute. Untrue. Starts a counting contest.'],
    ['you never', 'Absolute. They will name the one time they did.'],
    ["i'm just saying", 'You are not just saying.'],
    ['im just saying', 'You are not just saying.'],
    ['no offense', 'Offense incoming.'],
    ['with all due respect', 'Zero respect detected.'],
    ['calm down', 'Has never once worked.'],
    ['whatever', 'A door slammed in word form.'],
    ["i'm fine", 'Customs does not believe you.'],
    ['you made me', 'Their hands were not on your steering wheel.'],
    ['to be honest', 'Implies the rest was not.'],
    ['i guess', 'Pre-loaded resentment.'],
    ['as usual', 'A grudge with a timestamp.'],
    ['why would you', 'A question that is an accusation.'],
    ['i feel like you', 'An accusation wearing a feelings costume.'],
    ['obviously', 'If it were obvious you would not need the word.'],
    ['overreacting', 'Ruling on their feelings for them.']
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function sniff(text: string): SniffHit[] {
    // Step 1: one normalised copy; curly apostrophes become straight so "I’m" matches.
    const lower = text.toLowerCase().replace(/[‘’]/g, "'");
    const hits: SniffHit[] = [];
    // Step 2
    for (const [phrase, why] of PHRASES) {
        const re = new RegExp(`(?<![a-z'])${escape(phrase)}(?![a-z])`, 'g');
        for (const m of lower.matchAll(re)) {
            hits.push({ phrase, index: m.index ?? 0, why });
        }
    }
    // Step 3
    return hits.sort((a, b) => a.index - b.index);
}
