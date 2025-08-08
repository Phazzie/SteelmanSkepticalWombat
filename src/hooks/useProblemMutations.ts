import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProblems } from '../context/ProblemsContext';
import { updateProblem } from '../services/firebase';
import { getTranslation, getWager, getAIAnalysis as getWombatAnalysis, callGemini } from '../services/ai';

export const useProblemMutations = () => {
    const { user } = useAuth();
    const { currentProblem, setIsAiLoading, setNotification } = useProblems();

    const handleUpdate = useCallback((problemId, data) => {
        updateProblem(problemId, data);
    }, []);

    const handleAgreement = useCallback((type) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        if (type === 'problem') {
            const updates = { [`${myRole}_agreed_problem`]: true };
            if (currentProblem[`${partnerRole}_agreed_problem`]) updates.status = 'private_versions';
            handleUpdate(currentProblem.id, updates);
        } else if (type === 'solution') {
            const updates = { [`${myRole}_agreed_solution`]: true };
            if (currentProblem[`${partnerRole}_agreed_solution`]) {
                updates.status = 'resolved';
                updates.solution_check_date = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
            }
            handleUpdate(currentProblem.id, updates);
        }
    }, [currentProblem, user, handleUpdate]);

    const handleSteelmanApproval = useCallback(() => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_approved_steelman`]: true };
        if (currentProblem[`${partnerRole}_approved_steelman`]) {
            updates.status = 'ai_review';
        }
        handleUpdate(currentProblem.id, updates);
    }, [currentProblem, user, handleUpdate]);

    const handlePrivateSubmit = useCallback(async (text) => {
        if (!currentProblem || !user) return;
        setIsAiLoading('translation');
        try {
            const myRole = currentProblem.roles[user.uid];
            const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
            const translationResult = await getTranslation(text);
            const updates = {
                [`${myRole}_private_version`]: text,
                [`${myRole}_submitted_private`]: true,
                [`${myRole}_translation`]: translationResult || "Translation failed.",
            };
            if (currentProblem[`${partnerRole}_submitted_private`]) updates.status = 'translation';
            handleUpdate(currentProblem.id, updates);
        } finally {
            setIsAiLoading(null);
        }
    }, [currentProblem, user, handleUpdate, setIsAiLoading]);

    const handleSteelmanSubmit = useCallback((text) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_steelman`]: text, [`${myRole}_submitted_steelman`]: true };
        if (currentProblem[`${partnerRole}_submitted_steelman`]) {
            updates.status = 'steelman_approval';
        }
        handleUpdate(currentProblem.id, updates);
    }, [currentProblem, user, handleUpdate]);

    const getAIAnalysis = useCallback(async (problem) => {
        setIsAiLoading('verdict');
        try {
            const analysisText = await getWombatAnalysis(problem);
            if (analysisText) {
                await handleUpdate(problem.id, { ai_analysis: analysisText, status: 'propose_solutions' });
            }
        } finally {
            setIsAiLoading(null);
        }
    }, [handleUpdate, setIsAiLoading]);

    const handleProposeSolution = useCallback((text) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_proposed_solution`]: text };
        if (currentProblem[`${partnerRole}_proposed_solution`]) {
            updates.status = 'solution_steelman';
        }
        handleUpdate(currentProblem.id, updates);
    }, [currentProblem, user, handleUpdate]);

    const handleSolutionSteelmanSubmit = useCallback(async (text) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';
        const updates = { [`${myRole}_solution_steelman`]: text };

        if (currentProblem[`${partnerRole}_solution_steelman`]) {
            setIsAiLoading('wager');
            try {
                const wagerResult = await getWager(currentProblem, text);
                if (wagerResult) {
                    updates.wombats_wager = wagerResult;
                    updates.status = 'wager';
                    await handleUpdate(currentProblem.id, updates);
                }
            } finally {
                setIsAiLoading(null);
            }
        } else {
            await handleUpdate(currentProblem.id, updates);
        }
    }, [currentProblem, user, handleUpdate, setIsAiLoading]);

    const handleGenerateImage = useCallback(async () => {
        if (!currentProblem) return;
        setIsAiLoading('image');
        try {
            const prompt = `
            **Persona:** You are a poetic and slightly surreal art director.
            **Task:** Generate a concise, evocative, and visually rich prompt for an AI image generator (like Midjourney or DALL-E). The prompt should be a single, flowing sentence that artistically captures the emotional journey from the problem to the solution. Do not use any line breaks.
            **Problem Statement:** "${currentProblem.problem_statement}"
            **Solution Statement:** "${currentProblem.solution_statement}"
            **Image Prompt:**`;

            const imagePrompt = await callGemini(prompt);
            if (imagePrompt) {
                setNotification({ show: true, message: `Image Prompt: "${imagePrompt}"`, duration: 8000 });
            } else {
                setNotification({ show: true, message: "The Wombat is feeling uninspired. Try again later.", type: 'warning' });
            }
        } finally {
            setIsAiLoading(null);
        }
    }, [currentProblem, setIsAiLoading, setNotification]);

    const handleCritique = useCallback(async () => {
        if (!currentProblem) return;
        setIsAiLoading('critique');
        try {
            setNotification({ show: true, message: "The Wombat is thinking about how to improve itself." });
        } finally {
            setIsAiLoading(null);
        }
    }, [currentProblem, setIsAiLoading, setNotification]);

    const handleBrainstorm = useCallback(async () => {
        if (!currentProblem) return;
        setIsAiLoading('brainstorm');
        try {
            const prompt = `
            **Persona:** You are The Skeptical Wombat. You've been asked to brainstorm solutions.
            **Task:** Based on the problem and the failed final solution attempt, provide three distinct, concrete, and slightly unconventional brainstorming ideas. Frame them as if you're slightly annoyed you have to do this.
            - **Problem:** "${currentProblem.problem_statement}"
            - **Failed Solution Attempt:** "${currentProblem.solution_statement}"
            **Brainstorming Ideas:**`;
            const brainstormed = await callGemini(prompt);
            if (brainstormed) {
                await handleUpdate(currentProblem.id, { brainstormed_solutions: brainstormed });
            }
        } finally {
            setIsAiLoading(null);
        }
    }, [currentProblem, setIsAiLoading, handleUpdate]);

    const handleEscalate = useCallback(async () => {
        setNotification({ show: true, message: "This feature is for premium users only." });
    }, [setNotification]);

    const handlePostMortemSubmit = useCallback(async (text) => {
        if (!currentProblem || !user) return;
        const myRole = currentProblem.roles[user.uid];
        const updates = { [`${myRole}_post_mortem`]: text };
        handleUpdate(currentProblem.id, updates);
    }, [currentProblem, user, handleUpdate]);

    return {
        handleUpdate,
        handleAgreement,
        handleSteelmanApproval,
        handlePrivateSubmit,
        handleSteelmanSubmit,
        getAIAnalysis,
        handleProposeSolution,
        handleSolutionSteelmanSubmit,
        handleGenerateImage,
        handleCritique,
        handleBrainstorm,
        handleEscalate,
        handlePostMortemSubmit,
    };
};
