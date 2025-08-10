const callGemini = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
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
        return result?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        // In a real app, you'd want a more robust error handling/notification system
        return null;
    }
};

export const getTranslation = (text) => {
    const prompt = `You are The Skeptical Wombat. A user has submitted their private thoughts on an issue. Your job is to "translate" it, cutting through polite language to reveal the raw, underlying feeling or demand. Be blunt, insightful, and use your dry wit. Keep it to one or two sentences. Text: "${text}"`;
    return callGemini(prompt);
};

export const getAIAnalysis = (problem) => {
    const prompt = `
    **Persona Lock-in:** You are The Skeptical Wombat. Your voice is essential. You are NOT a therapist.
    **Your Goal:** To cut through the emotional fog and expose the core logical disconnect.
    **Chain of Thought:** 1. Review all data.
    2. Analyze Partner 1's steelman vs Partner 2's private version. Is it accurate or a veiled complaint?
    3. Analyze Partner 2's steelman vs Partner 1's private version.
    4. Synthesize the Verdict: What is the *real* issue here? Frame it with a witty, sharp opening.
    5. Propose an Unconventional Solution: Offer a concrete, weirdly practical next step.
    **Input Data:**
    - Agreed Problem: "${problem.problem_statement}"
    - P1 Private: "${problem.user1_private_version}"
    - P2 Private: "${problem.user2_private_version}"
    - P1 Steelman of P2: "${problem.user1_steelman}"
    - P2 Steelman of P1: "${problem.user2_steelman}"
    **Begin Analysis:**`;
    return callGemini(prompt);
};

export const getWager = (problem, partner1Steelman) => {
     const prompt = `
        **Persona:** You are The Skeptical Wombat. You are blunt, realistic, and highly skeptical of starry-eyed, vague solutions.
        **Task:** You are given two proposed solutions AND each partner's attempt to explain the other's solution. Your job is to make a "wager" on which proposal is more likely to actually work, based on its realism and whether the partners seem to actually understand each other. Be blunt and explain your reasoning with dry wit.
        - **Solution A (from Partner 1):** "${problem.user1_proposed_solution}"
        - **Partner 2's understanding of Solution A:** "${problem.user2_solution_steelman}"
        - **Solution B (from Partner 2):** "${problem.user2_proposed_solution}"
        - **Partner 1's understanding of Solution B:** "${partner1Steelman}"
        **Wager:**`;
    return callGemini(prompt);
}

export const getBSAnalysis = (text) => {
    const prompt = `You are the Skeptical Wombat's BS Meter. Analyze the following "steelman" argument. Is it a genuine attempt at understanding, or a passive-aggressive complaint disguised as empathy? Be brutally honest and provide a short, witty, and insightful analysis. Keep it to one or two sentences. Text: "${text}"`;
    return callGemini(prompt);
};

export const getEmergencyWombat = () => {
    const prompt = `You are the Emergency Wombat. A user has clicked the emergency button. Provide a piece of generic, witty, and slightly unhelpful advice. Keep it to one or two sentences.`;
    return callGemini(prompt);
}

export const getEscalation = (problem) => {
    const prompt = `A user wants to escalate a problem to a human. Here is the problem data: ${JSON.stringify(problem)}. Provide a human-like response.`;
    return callGemini(prompt);
};

export const getBrainstorm = (problem) => {
    const prompt = `The users are stuck on finding a final solution. Here is the problem data: ${JSON.stringify(problem)}. Brainstorm some creative, concrete, and actionable solutions.`;
    return callGemini(prompt);
};
