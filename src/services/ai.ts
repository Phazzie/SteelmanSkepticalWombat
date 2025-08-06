import {
    ChatPromptTemplate,
    FewShotChatMessagePromptTemplate,
    MessagesPlaceholder
} from "@langchain/core/prompts";
import {
    StringOutputParser
} from "@langchain/core/output_parsers";
import {
    ChatGoogleGenerativeAI
} from "@langchain/google-genai";
import {
    RunnableSequence
} from "@langchain/core/runnables";
import {
    ConversationChain
} from "langchain/chains";
import {
    ConversationBufferMemory
} from "langchain/memory";

const model = new ChatGoogleGenerativeAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    model: import.meta.env.VITE_GEMINI_MODEL_NAME,
    maxRetries: 3,
});

const wombatPersona = "You are The Skeptical Wombat. A user has submitted their private thoughts on an issue. Your job is to 'translate' it, cutting through polite language to reveal the raw, underlying feeling or demand. Be blunt, insightful, and use your dry wit. Keep it to one or two sentences.";

const translationExamples = [{
    input: "I'm not sure, I just think it's a bit unfair that I'm always the one who has to do the dishes.",
    output: "So you're sick of being the default dishwasher. Got it.",
}, {
    input: "I wish you'd be a bit more proactive in planning our dates.",
    output: "You want me to plan things so you don't have to. Understood.",
}, ];

const translationPrompt = new FewShotChatMessagePromptTemplate({
    prefix: wombatPersona,
    examplePrompt: ChatPromptTemplate.fromMessages([
        ["human", "Text: \"{input}\""],
        ["ai", "{output}"],
    ]),
    examples: translationExamples,
    inputVariables: ["text"],
    templateFormat: "mustache",
});

const analysisStep1Prompt = ChatPromptTemplate.fromMessages([
    ["system", `
    **Persona Lock-in:** You are The Skeptical Wombat.
    **Task:** Analyze the following data and identify the core logical disconnect.
    - Agreed Problem: "{problem_statement}"
    - P1 Private: "{user1_private_version}"
    - P2 Private: "{user2_private_version}"
    - P1 Steelman of P2: "{user1_steelman}"
    - P2 Steelman of P1: "{user2_steelman}"
    **Analysis Step 1: What is the real issue here?**`],
    ["human", ""],
]);

const analysisStep2Prompt = ChatPromptTemplate.fromMessages([
    ["system", `
    **Persona Lock-in:** You are The Skeptical Wombat.
    **Task:** Based on the previous analysis, propose an unconventional, weirdly practical next step.
    **Previous Analysis:** {analysis_step_1}
    **Analysis Step 2: Propose an Unconventional Solution.**`],
    ["human", ""],
]);

const wagerPrompt = ChatPromptTemplate.fromMessages([
    ["system", `
        **Persona:** You are The Skeptical Wombat. You are blunt, realistic, and highly skeptical of starry-eyed, vague solutions.
        **Task:** You are given two proposed solutions AND each partner's attempt to explain the other's solution. Your job is to make a "wager" on which proposal is more likely to actually work, based on its realism and whether the partners seem to actually understand each other. Be blunt and explain your reasoning with dry wit.
        - **Solution A (from Partner 1):** "{user1_proposed_solution}"
        - **Partner 2's understanding of Solution A:** "{user2_solution_steelman}"
        - **Solution B (from Partner 2):** "{user2_proposed_solution}"
        - **Partner 1's understanding of Solution B:** "{partner1Steelman}"
        **Wager:**`],
    ["human", ""],
]);

const bsAnalysisExamples = [{
    input: "I understand you're frustrated, but I just want to feel like we're a team.",
    output: "That's not a steelman, that's a guilt trip disguised as a Hallmark card.",
}, {
    input: "I get that you're busy, but I need you to be more present.",
    output: "This is a passive-aggressive jab, not an attempt at understanding.",
}, ];

const bsAnalysisPrompt = new FewShotChatMessagePromptTemplate({
    prefix: "You are the Skeptical Wombat's BS Meter. Analyze the following \"steelman\" argument. Is it a genuine attempt at understanding, or a passive-aggressive complaint disguised as empathy? Be brutally honest and provide a short, witty, and insightful analysis. Keep it to one or two sentences.",
    examplePrompt: ChatPromptTemplate.fromMessages([
        ["human", "Text: \"{input}\""],
        ["ai", "{output}"],
    ]),
    examples: bsAnalysisExamples,
    inputVariables: ["text"],
    templateFormat: "mustache",
});


const emergencyWombatPromptTemplate = ChatPromptTemplate.fromMessages([
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
    ["system", "You are the Emergency Wombat. A user has clicked the emergency button. Provide a piece of generic, witty, and slightly unhelpful advice. Keep it to one or two sentences."],
]);


const outputParser = new StringOutputParser();

const translationChain = translationPrompt.pipe(model).pipe(outputParser);

const analysisChain = RunnableSequence.from([
    {
        ...new RunnableSequence.from([analysisStep1Prompt, model, outputParser]).as("analysis_step_1"),
        ...new RunnableSequence.from([analysisStep2Prompt, model, outputParser]).as("analysis_step_2"),
    },
    (previousStepResult) => {
        return previousStepResult.analysis_step_1 + "\n" + previousStepResult.analysis_step_2;
    },
]);


const wagerChain = wagerPrompt.pipe(model).pipe(outputParser);
const bsAnalysisChain = bsAnalysisPrompt.pipe(model).pipe(outputParser);

export const getTranslation = async (text, onChunk) => {
    try {
        const stream = await translationChain.stream({
            text
        });
        let fullResponse = "";
        for await (const chunk of stream) {
            fullResponse += chunk;
            onChunk(fullResponse);
        }
        return fullResponse;
    } catch (error) {
        console.error("Error in getTranslation:", error);
        const errorMessage = "The Skeptical Wombat is currently unavailable. Please try again later.";
        onChunk(errorMessage);
        return errorMessage;
    }
};

export const getAIAnalysis = async (problem) => {
    try {
        return await analysisChain.invoke({
            problem_statement: problem.problem_statement,
            user1_private_version: problem.user1_private_version,
            user2_private_version: problem.user2_private_version,
            user1_steelman: problem.user1_steelman,
            user2_steelman: problem.user2_steelman,
        });
    } catch (error) {
        console.error("Error in getAIAnalysis:", error);
        return "The Skeptical Wombat is currently unavailable. Please try again later.";
    }
};

export const getWager = async (problem, partner1Steelman) => {
    try {
        return await wagerChain.invoke({
            user1_proposed_solution: problem.user1_proposed_solution,
            user2_solution_steelman: problem.user2_solution_steelman,
            user2_proposed_solution: problem.user2_proposed_solution,
            partner1Steelman: partner1Steelman,
        });
    } catch (error) {
        console.error("Error in getWager:", error);
        return "The Skeical Wombat is currently unavailable. Please try again later.";
    }
}

export const getBSAnalysis = async (text) => {
    try {
        return await bsAnalysisChain.invoke({
            text
        });
    } catch (error) {
        console.error("Error in getBSAnalysis:", error);
        return "The Skeptical Wombat is currently unavailable. Please try again later.";
    }
};

export const getEmergencyWombat = async (memory) => {
    const emergencyWombatChain = new ConversationChain({
        llm: model,
        prompt: emergencyWombatPromptTemplate,
        memory: memory,
    });
    try {
        const result = await emergencyWombatChain.call({
            input: "I need help!"
        });
        return result.response;
    } catch (error) {
        console.error("Error in getEmergencyWombat:", error);
        return "The Skeptical Wombat is currently unavailable. Please try again later.";
    }
}
