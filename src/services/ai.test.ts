import {
    getTranslation,
    getAIAnalysis,
    getWager,
    getBSAnalysis,
    getEmergencyWombat
} from './ai';
import {
    ConversationBufferMemory
} from "langchain/memory";

const runTests = async () => {
    console.log("Running AI Evaluation Tests...");

    // Test getTranslation
    const translationTestCases = [{
        input: "I'm not sure, I just think it's a bit unfair that I'm always the one who has to do the dishes.",
        expected: "So you're sick of being the default dishwasher. Got it.",
    }, {
        input: "I wish you'd be a bit more proactive in planning our dates.",
        expected: "You want me to plan things so you don't have to. Understood.",
    }, ];

    for (const testCase of translationTestCases) {
        const result = await getTranslation(testCase.input, () => {});
        console.assert(result === testCase.expected, `getTranslation failed for input: "${testCase.input}". Expected: "${testCase.expected}", Got: "${result}"`);
    }

    // Test getAIAnalysis
    const aiAnalysisTestCase = {
        problem_statement: "We can't agree on where to go for dinner.",
        user1_private_version: "I want to go to a nice restaurant, but my partner always wants to go to a cheap dive bar.",
        user2_private_version: "I'm on a budget, but my partner always wants to go to expensive places.",
        user1_steelman: "My partner is concerned about our finances and wants to save money.",
        user2_steelman: "My partner wants to have a special night out and enjoy a nice meal.",
    };
    const aiAnalysisResult = await getAIAnalysis(aiAnalysisTestCase);
    console.assert(aiAnalysisResult.length > 0, "getAIAnalysis failed to return a result.");

    // Test getWager
    const wagerTestCase = {
        user1_proposed_solution: "Let's go to a nice restaurant this week, and a cheap dive bar next week.",
        user2_solution_steelman: "My partner is proposing a compromise where we alternate between expensive and inexpensive places.",
        user2_proposed_solution: "Let's cook a nice meal at home instead.",
        partner1Steelman: "My partner is suggesting a creative solution that saves money and allows us to have a special night in.",
    };
    const wagerResult = await getWager(wagerTestCase, wagerTestCase.partner1Steelman);
    console.assert(wagerResult.length > 0, "getWager failed to return a result.");

    // Test getBSAnalysis
    const bsAnalysisTestCases = [{
        input: "I understand you're frustrated, but I just want to feel like we're a team.",
        expected: "That's not a steelman, that's a guilt trip disguised as a Hallmark card.",
    }, {
        input: "I get that you're busy, but I need you to be more present.",
        expected: "This is a passive-aggressive jab, not an attempt at understanding.",
    }, ];

    for (const testCase of bsAnalysisTestCases) {
        const result = await getBSAnalysis(testCase.input);
        console.assert(result === testCase.expected, `getBSAnalysis failed for input: "${testCase.input}". Expected: "${testCase.expected}", Got: "${result}"`);
    }

    // Test getEmergencyWombat
    const emergencyWombatMemory = new ConversationBufferMemory();
    const emergencyWombatResult1 = await getEmergencyWombat(emergencyWombatMemory);
    console.assert(emergencyWombatResult1.length > 0, "getEmergencyWombat failed to return a result on the first call.");
    const emergencyWombatResult2 = await getEmergencyWombat(emergencyWombatMemory);
    console.assert(emergencyWombatResult2.length > 0, "getEmergencyWombat failed to return a result on the second call.");
    console.assert(emergencyWombatResult1 !== emergencyWombatResult2, "getEmergencyWombat returned the same result on consecutive calls.");


    console.log("AI Evaluation Tests complete.");
};

runTests();
