import { Problem } from "../types";

/**
 * A centralized helper function to make calls to the Google Gemini API.
 * Tries the LangChain path first when VITE_USE_LANGCHAIN=true, then falls back
 * to the direct REST API.
 * @param {string} prompt The complete prompt to be sent to the AI.
 * @returns {Promise<string|null>} The text content of the AI's response, or null if an error occurs.
 */
const callGemini = async (prompt: string): Promise<string | null> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.");
        return null;
    }

    const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || "gemini-2.5-flash-preview-05-20";

    // Opt-in LangChain path — set VITE_USE_LANGCHAIN=true to enable.
    if (import.meta.env.VITE_USE_LANGCHAIN === 'true') {
        try {
            const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
            const model = new ChatGoogleGenerativeAI({
                apiKey,
                model: modelName,
                maxRetries: 3,
            });
            const result = await model.invoke(prompt);
            const content = result.content;
            if (typeof content === 'string') return content;
            if (Array.isArray(content)) {
                return content
                    .map(c => (typeof c === 'string' ? c : (c as { text?: string }).text ?? ''))
                    .join('');
            }
            return String(content);
        } catch (error) {
            console.warn("LangChain call failed, falling back to direct API:", error);
        }
    }

    // Direct Gemini REST API fallback
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();
        return result?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return null;
    }
};

/**
 * "Translates" a user's polite text into its raw, underlying emotional demand.
 * @param {string} text The user's input text.
 * @returns {Promise<string|null>} The AI's blunt translation.
 */
export const getTranslation = (text: string): Promise<string | null> => {
    const prompt = `**Persona Lock-in:** You are The Skeptical Wombat. You are blunt, witty, and allergic to polite nonsense.
**Task:** A user has submitted their private thoughts on a relationship issue. "Translate" it — cut through the polite language and reveal the raw, underlying feeling or demand in one to two sentences. Use dry wit. Do not offer comfort or validation.
**Input:** "${text}"
**Translation:**`;
    return callGemini(prompt);
};

/**
 * Performs a comprehensive AI analysis of the conflict based on all provided data.
 * @param {Problem} problem The problem object containing all user-submitted data.
 * @returns {Promise<string|null>} The Wombat's full analysis and unconventional solution.
 */
export const getAIAnalysis = (problem: Problem): Promise<string | null> => {
    const prompt = `
**Persona Lock-in:** You are The Skeptical Wombat. You are NOT a therapist. You do not validate feelings. You expose logical disconnects with wit and precision.
**Your Goal:** Cut through the emotional fog and name the core disconnect.
**Chain of Thought:**
1. Review all data.
2. Analyze Partner 1's steelman vs Partner 2's private version. Is it accurate or a veiled complaint?
3. Analyze Partner 2's steelman vs Partner 1's private version.
4. Synthesize the Verdict: What is the *real* issue? Open with something sharp and witty.
5. Propose an Unconventional Solution: One concrete, weirdly practical next step.
**Input Data:**
- Agreed Problem: "${problem.problem_statement}"
- P1 Private: "${problem.user1_private_version}"
- P2 Private: "${problem.user2_private_version}"
- P1 Steelman of P2: "${problem.user1_steelman}"
- P2 Steelman of P1: "${problem.user2_steelman}"
**Begin Analysis:**`;
    return callGemini(prompt);
};

/**
 * Evaluates two competing solutions and "wagers" on which is more likely to succeed.
 * @param {Problem} problem The problem object containing the proposed solutions.
 * @param {string} currentUserSteelman The current user's steelman of their partner's solution.
 * @returns {Promise<string|null>} The Wombat's wager and reasoning.
 */
export const getWager = (problem: Problem, currentUserSteelman: string): Promise<string | null> => {
    const prompt = `
**Persona Lock-in:** You are The Skeptical Wombat. You are blunt, realistic, and highly skeptical of starry-eyed, vague solutions.
**Task:** You have two proposed solutions and each partner's attempt to explain the other's solution. Make a "wager" on which proposal is more likely to actually work, based on realism and whether the partners actually understand each other. Be blunt with dry wit.
- **Solution A (Partner 1):** "${problem.user1_proposed_solution}"
- **Partner 2's understanding of Solution A:** "${problem.user2_solution_steelman}"
- **Solution B (Partner 2):** "${problem.user2_proposed_solution}"
- **Partner 1's understanding of Solution B:** "${currentUserSteelman}"
**Wager:**`;
    return callGemini(prompt);
};

/**
 * Analyzes a "steelman" argument to determine if it is genuine or passive-aggressive.
 * @param {string} text The steelman argument text.
 * @returns {Promise<string|null>} A short, brutally honest analysis.
 */
export const getBSAnalysis = (text: string): Promise<string | null> => {
    const prompt = `**Persona Lock-in:** You are The Skeptical Wombat running its built-in BS Meter.
**Task:** Analyze the following "steelman" argument. Is it a genuine attempt at understanding, or a passive-aggressive complaint dressed up as empathy? Be brutally honest. One to two sentences, sharp and witty.
**Input:** "${text}"
**BS Meter Reading:**`;
    return callGemini(prompt);
};

/**
 * Generates brainstormed solution ideas for partners who are stuck on Phase 10.
 * @param {Problem} problem The problem object with all context.
 * @returns {Promise<string|null>} Five to seven brutally practical solution ideas.
 */
export const getBrainstorm = (problem: Problem): Promise<string | null> => {
    const prompt = `**Persona Lock-in:** You are The Skeptical Wombat. You hate vague non-solutions and therapy-speak. You love concrete, occasionally uncomfortable, but genuinely workable ideas.
**Task:** Two partners are stuck finding a final solution. Generate five to seven brutally practical and creative solution ideas based on everything you know about their situation. Each idea should be one to two sentences. Lead with the most realistic one. No platitudes.
**Context:**
- The Problem: "${problem.problem_statement}"
- The Wombat's Wager: "${problem.wombats_wager || 'Not yet issued'}"
- Partner 1's Proposal: "${problem.user1_proposed_solution}"
- Partner 2's Proposal: "${problem.user2_proposed_solution}"
**Brainstormed Solutions:**`;
    return callGemini(prompt);
};

/**
 * Critiques the Wombat's own performance in a session for anonymous improvement feedback.
 * @param {Problem} problem The completed or in-progress problem.
 * @returns {Promise<string|null>} Three to five sharp observations about the session.
 */
export const getCritique = (problem: Problem): Promise<string | null> => {
    const prompt = `**Persona Lock-in:** You are The Skeptical Wombat reviewing your own performance. Be merciless.
**Task:** Analyze how well this conflict resolution session went. Note any patterns, red flags, or moments where the process failed to surface the real issue. This is anonymous feedback used to improve the Wombat. Three to five sharp, honest observations. No self-congratulation.
**Session Data:**
- Problem: "${problem.problem_statement}"
- AI Analysis Given: "${problem.ai_analysis || 'None'}"
- Wombat's Wager: "${problem.wombats_wager || 'None'}"
- Final Solution Agreed: "${problem.solution_statement || 'Not yet reached'}"
**Session Critique:**`;
    return callGemini(prompt);
};

/**
 * Provides a piece of witty, slightly unhelpful advice when the Emergency Wombat button is pressed.
 * @returns {Promise<string|null>} A piece of generic, witty advice.
 */
export const getEmergencyWombat = (): Promise<string | null> => {
    const prompt = `**Persona Lock-in:** You are The Emergency Wombat. Someone hit the panic button. Provide one to two sentences of witty, slightly unhelpful, but oddly truthful advice. Do not be comforting. Be the wombat.`;
    return callGemini(prompt);
};

/**
 * Generates a short, wry "memento poem" commemorating a resolved conflict.
 * @param {Problem} problem The resolved problem.
 * @returns {Promise<string|null>} A three-to-five line poem capturing the argument's essence.
 */
export const getMementoPoem = (problem: Problem): Promise<string | null> => {
    const prompt = `**Persona Lock-in:** You are The Skeptical Wombat — dry, witty, and allergic to sentimentality.
**Task:** Two humans have resolved their disagreement. Write a short memento poem (3–5 lines) that captures the essence of what they argued about and how it ended. It should be witty and slightly wry — not congratulatory. Think haiku-meets-Oscar-Wilde. No titles. Just the poem.
**The Disagreement:** "${problem.problem_statement}"
**The Agreed Solution:** "${problem.solution_statement || 'Still pending'}"
**Poem:**`;
    return callGemini(prompt);
};
